#!/usr/bin/env node
/**
 * council-runner.mjs — neutral runner for Adversarial AI Council Review mode.
 *
 * A deterministic step machine. It owns sequencing, schema validation, the
 * canonical ledger, and termination. It never generates arguments: Claude
 * (defender) and Codex (critic) are the only reasoning parties.
 *
 * Steps:
 *   init     [--base <ref>] [--scope auto|working-tree|branch] [--rounds N] [focus...]
 *   critique --debate <id>
 *   rebut    --debate <id> --file <rebuttal.json>
 *   status   --debate <id>
 *   close    --debate <id>
 *
 * Env:
 *   COUNCIL_MOCK_CRITIQUE=<file>  use a canned critique JSON instead of calling
 *                                 Codex (tests / benchmark Arm A).
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

import { ensureGitRepository, getRepoRoot, resolveReviewTarget, collectReviewContext } from "./lib/git.mjs";
import { runAppServerTurn, parseStructuredOutput, readOutputSchema, getCodexAvailability } from "./lib/codex.mjs";
import { loadPromptTemplate, interpolateTemplate } from "./lib/prompts.mjs";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_PATH = path.join(ROOT_DIR, "schemas", "council-message.schema.json");

const DEFAULT_ROUNDS = 3;
const HARD_MAX_ROUNDS = 5;
const TRIPWIRE_ACCEPT_RATIO = 0.8;
const TRIPWIRE_REASON_CHARS = 240;
const REBUT_PHASE = "awaiting-rebuttal";
const CRITIQUE_PHASE = "awaiting-critique";

const SUPPORT_LEVELS = ["unsupported", "weak", "moderate", "strong"];
const SEVERITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["open", "accepted", "partially-accepted", "rejected", "withdrawn"];

/**
 * Explicit transition table (second implementation review, findings 1–2).
 * A response is only legal when the target finding is in a state the
 * responding side may act on:
 *   - OPPONENT-claimed finding: must be "open" (adjudication:
 *     open -> accepted | partially-accepted | rejected).
 *   - OWN finding: must be "rejected" or "partially-accepted" (contested):
 *     accept -> withdrawn (claimant abandons the finding — distinct from the
 *     defect being fixed); reject/partial + new checkable evidence -> open
 *     (reopened); reject without new evidence -> unchanged (dispute stands).
 * "accepted" and "withdrawn" are terminal: settled findings can never be
 * rewritten by later responses, and duplicates within a message are illegal.
 */
function responseLegality(finding, expectedSide) {
  if (finding.claimant !== expectedSide) {
    return finding.status === "open"
      ? null
      : `finding is settled for adjudication (status "${finding.status}") — responses may only adjudicate open findings`;
  }
  return ["rejected", "partially-accepted"].includes(finding.status)
    ? null
    : `own finding is not contested (status "${finding.status}") — you may only withdraw, escalate, or stand pat on rejected/partially-accepted findings`;
}
const VERDICTS = ["accept", "partial", "reject"];

function fail(message) {
  process.stderr.write(`council-runner error: ${message}\n`);
  process.exit(1);
}

function out(value) {
  process.stdout.write(`${typeof value === "string" ? value : JSON.stringify(value, null, 2)}\n`);
}

// ---------- arg parsing ----------

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--base" || token === "--scope" || token === "--rounds" || token === "--debate" || token === "--file") {
      args[token.slice(2)] = argv[i + 1];
      i += 1;
    } else if (token.startsWith("--")) {
      args[token.slice(2)] = true;
    } else {
      args._.push(token);
    }
  }
  return args;
}

// ---------- debate state ----------

function councilDir(repoRoot) {
  return path.join(repoRoot, ".council");
}

function debateDir(repoRoot, debateId) {
  const dir = path.join(councilDir(repoRoot), debateId);
  if (!fs.existsSync(dir)) fail(`Unknown debate "${debateId}". Run \`init\` first.`);
  return dir;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function loadDebate(repoRoot, debateId) {
  const dir = debateDir(repoRoot, debateId);
  return {
    dir,
    debate: readJson(path.join(dir, "debate.json")),
    ledger: readJson(path.join(dir, "ledger.json"))
  };
}

function saveDebate(dir, debate, ledger) {
  writeJson(path.join(dir, "debate.json"), debate);
  writeJson(path.join(dir, "ledger.json"), ledger);
}

// ---------- message validation (hand-rolled; no runtime deps) ----------

/**
 * Heuristic, not proof: checks that evidence at least *cites something
 * checkable* — a file:line reference, a path-like token with an extension,
 * or quoted command/code output. It cannot verify the citation is true;
 * that is the opposing side's job. Named accordingly.
 */
function looksCheckableEvidence(evidence) {
  if (typeof evidence !== "string") return false;
  const text = evidence.trim();
  if (text.length < 8) return false;
  const fileLineRef = /[\w./-]+\.[A-Za-z]{1,6}:\d+/; // e.g. billing.js:4, src/a/b.py:120-140
  const pathRef = /(^|[\s(`'"])[\w./-]*[\w-]+\.[A-Za-z]{1,6}(?=$|[\s)`'",:;])/; // e.g. billing.js, src/auth.py
  const quotedOutput = /`[^`]{4,}`/; // `command output or code excerpt`
  return fileLineRef.test(text) || pathRef.test(text) || quotedOutput.test(text);
}

function validateMessage(msg, { expectedSide, expectedRound, ledger }) {
  const errors = [];
  if (!msg || typeof msg !== "object") return ["message is not an object"];
  if (msg.side !== expectedSide) errors.push(`side must be "${expectedSide}"`);
  if (msg.round !== expectedRound) errors.push(`round must be ${expectedRound}`);
  if (!Array.isArray(msg.findings)) errors.push("findings must be an array");
  if (!Array.isArray(msg.responses)) errors.push("responses must be an array");
  if (errors.length) return errors;

  const seenIds = new Set(Object.keys(ledger.findings));
  for (const f of msg.findings) {
    const label = `finding ${f?.id ?? "<missing id>"}`;
    if (!f.id || typeof f.id !== "string") errors.push(`${label}: missing id`);
    else if (seenIds.has(f.id)) errors.push(`${label}: id already exists in ledger`);
    else seenIds.add(f.id);
    if (!f.claim || typeof f.claim !== "string") errors.push(`${label}: missing claim`);
    if (f.claimant !== expectedSide) errors.push(`${label}: claimant must be "${expectedSide}"`);
    if (!SUPPORT_LEVELS.includes(f.support_level)) errors.push(`${label}: bad support_level`);
    if (!SEVERITIES.includes(f.severity)) errors.push(`${label}: bad severity`);
    if (typeof f.confidence !== "number" || f.confidence < 0 || f.confidence > 1) errors.push(`${label}: confidence must be 0..1`);
    if (f.status !== "open") errors.push(`${label}: new findings must have status "open"`);
  }

  // Symmetric response requirement: each side must answer every OPEN finding
  // claimed by the opponent (including findings reopened by escalation).
  const mustAnswer = Object.values(ledger.findings)
    .filter((f) => f.status === "open" && f.claimant !== expectedSide)
    .map((f) => f.id);
  const respondedIds = new Set();
  for (const r of msg.responses) {
    const label = `response to ${r?.finding_id ?? "<missing finding_id>"}`;
    if (!r.finding_id || !ledger.findings[r.finding_id]) {
      errors.push(`${label}: unknown finding_id`);
      continue;
    }
    if (respondedIds.has(r.finding_id)) {
      errors.push(`${label}: duplicate response — one response per finding per message`);
      continue;
    }
    respondedIds.add(r.finding_id);
    const legality = responseLegality(ledger.findings[r.finding_id], expectedSide);
    if (legality) {
      errors.push(`${label}: ${legality}`);
      continue;
    }
    if (!VERDICTS.includes(r.verdict)) errors.push(`${label}: verdict must be accept|partial|reject`);
    if (!r.reason || typeof r.reason !== "string" || !r.reason.trim()) {
      errors.push(`${label}: reason is required (accept: what persuaded you; partial: accepted vs rejected components; reject: why the claim fails)`);
    }
    const target = ledger.findings[r.finding_id];
    // Rejecting the OPPONENT's finding requires checkable counter-evidence.
    // Standing pat on your OWN contested finding without new evidence is
    // permitted (recorded as "dispute stands"; deadlock detection handles
    // stagnation) — forcing evidence there would force fabrication or
    // capitulation. New checkable evidence on your own finding = escalation.
    if (r.verdict === "reject" && target?.claimant !== expectedSide && !looksCheckableEvidence(r.evidence)) {
      errors.push(`${label}: rejecting the opponent's finding requires checkable counter-evidence (file:line, path, or \`quoted output\`) in the evidence field`);
    }
    if (r.contest_support_level && !SUPPORT_LEVELS.includes(r.contest_support_level)) {
      errors.push(`${label}: bad contest_support_level`);
    }
  }
  for (const id of mustAnswer) {
    if (!respondedIds.has(id)) errors.push(`missing response to open finding ${id} — every open opponent finding must be answered`);
  }
  return errors;
}

// ---------- ledger operations ----------

function addHistory(finding, round, side, change) {
  finding.history = finding.history ?? [];
  finding.history.push({ round, side, change });
}

function mergeNewFindings(ledger, msg) {
  let added = 0;
  for (const f of msg.findings) {
    const finding = { ...f };
    // Anti-inflation rule (a): unsupported is runner-assigned on uncheckable evidence.
    if (!looksCheckableEvidence(finding.evidence)) {
      finding.support_level = "unsupported";
      addHistory(finding, msg.round, "runner", "support_level forced to unsupported: evidence empty or uncheckable");
    }
    addHistory(finding, msg.round, msg.side, "raised");
    ledger.findings[finding.id] = finding;
    added += 1;
  }
  return added;
}

/**
 * Claimant-aware response application — symmetric for both sides.
 *
 * Responding to an OPPONENT-claimed finding (adjudication):
 *   accept -> accepted, partial -> partially-accepted, reject -> rejected.
 *
 * Responding to a finding YOU claimed (after the opponent contested it):
 *   accept  -> resolved (you concede your own finding / accept their verdict);
 *   reject/partial with checkable new evidence -> the finding REOPENS
 *   (status "open"): a material escalation must route back through the
 *   opponent, never bypass them. Without checkable evidence the dispute is
 *   recorded but nothing changes (deadlock detection handles stagnation).
 */
function applyResponses(ledger, msg) {
  let changes = 0;
  for (const r of msg.responses) {
    const finding = ledger.findings[r.finding_id];
    if (!finding) continue;
    const side = msg.side;
    if (finding.claimant !== side) {
      // Adjudicating the opponent's finding.
      const nextStatus = r.verdict === "accept" ? "accepted" : r.verdict === "partial" ? "partially-accepted" : "rejected";
      if (finding.status !== nextStatus) changes += 1;
      finding.status = nextStatus;
      if (r.contest_support_level) {
        finding.contested_support_level = r.contest_support_level;
        addHistory(finding, msg.round, side, `support_level contested: claims ${r.contest_support_level}`);
      }
      if (r.proposed_fix) finding.proposed_fix = r.proposed_fix;
      finding[`${side === "claude" ? "defender" : "critic"}_reason`] = r.reason;
      if (r.evidence) finding[`${side === "claude" ? "defender" : "critic"}_evidence`] = r.evidence;
      if (r.deciding_evidence) finding.deciding_evidence = r.deciding_evidence;
      addHistory(finding, msg.round, side, `${r.verdict}: ${r.reason.slice(0, 200)}`);
    } else if (r.verdict === "accept") {
      // Withdrawing your own contested finding: the claimant abandons it.
      // Deliberately distinct from the defect being fixed or acknowledged.
      if (finding.status !== "withdrawn") changes += 1;
      finding.status = "withdrawn";
      addHistory(finding, msg.round, side, `withdrawn: ${r.reason.slice(0, 200)}`);
    } else if (looksCheckableEvidence(r.evidence)) {
      // Material escalation: reopen — the opponent must answer it.
      finding.evidence = `${finding.evidence}\n[R${msg.round} escalation] ${r.evidence}`;
      finding.status = "open";
      changes += 1;
      if (r.deciding_evidence) finding.deciding_evidence = r.deciding_evidence;
      addHistory(finding, msg.round, side, `escalated with new evidence — REOPENED: ${r.reason.slice(0, 200)}`);
    } else {
      if (r.deciding_evidence) finding.deciding_evidence = r.deciding_evidence;
      addHistory(finding, msg.round, side, `${r.verdict} (dispute stands, no new checkable evidence): ${r.reason.slice(0, 200)}`);
    }
  }
  return changes;
}

function compactLedger(ledger) {
  return Object.values(ledger.findings).map((f) => ({
    id: f.id,
    claimant: f.claimant,
    claim: f.claim,
    evidence: f.evidence,
    support_level: f.support_level,
    contested_support_level: f.contested_support_level,
    severity: f.severity,
    confidence: f.confidence,
    status: f.status,
    deciding_evidence: f.deciding_evidence,
    defender_reason: f.defender_reason,
    defender_evidence: f.defender_evidence
  }));
}

function runTripwire(ledger, msg, round) {
  if (!msg.responses.length) return null;
  const accepted = msg.responses.filter((r) => r.verdict === "accept");
  const ratio = accepted.length / msg.responses.length;
  const reasonLengths = msg.responses.map((r) => r.reason.trim().length).sort((a, b) => a - b);
  const median = reasonLengths[Math.floor(reasonLengths.length / 2)];
  if (ratio > TRIPWIRE_ACCEPT_RATIO && median < TRIPWIRE_REASON_CHARS) {
    const flag = {
      round,
      type: "sycophancy-tripwire",
      detail: `defender accepted ${accepted.length}/${msg.responses.length} findings with median justification ${median} chars — review for capitulation`
    };
    ledger.flags.push(flag);
    return flag;
  }
  return null;
}

// ---------- cost capture ----------

/**
 * Raw provider usage payloads, kept verbatim and in call order.
 *
 * Stored as a list rather than merged into one object because a round can bill
 * more than one turn (the malformed-output retry), and BENCHMARK-AMENDMENTS
 * A-001 condition 4 requires the provider's own reported numbers to survive
 * intact next to any normalization. Nothing here is derived.
 */
function accumulateUsage(previous, raw) {
  return [...(previous ?? []), raw];
}

/**
 * Field-wise sum of the normalized per-turn projections.
 *
 * A missing field stays missing: absent numbers are never treated as zero,
 * because a zero would report a measurement that was not taken. Only numbers
 * the provider actually sent are added.
 */
function accumulateTokens(previous, next) {
  if (!next) return previous;
  if (!previous) return { ...next };
  const merged = { ...previous };
  for (const [key, value] of Object.entries(next)) {
    if (typeof value !== "number") continue;
    merged[key] = typeof merged[key] === "number" ? merged[key] + value : value;
  }
  return merged;
}

/**
 * Why the cost measurement is or is not present, stated rather than implied.
 * A bare null cannot distinguish "the provider reported nothing" (a gap in a
 * gating metric) from "no provider was called" (Arm A, whose critic cost is
 * measured outside the runner). The T01 pilot could not tell those apart.
 */
function usageStatusFor({ mocked, usage }) {
  if (mocked) return "not-applicable";
  return usage ? "captured" : "missing";
}

// ---------- steps ----------

function stepInit(args, cwd) {
  ensureGitRepository(cwd);
  const repoRoot = getRepoRoot(cwd);
  if (!process.env.COUNCIL_MOCK_CRITIQUE) {
    const availability = getCodexAvailability(repoRoot);
    if (!availability.available) {
      fail("Codex CLI is not installed or is missing required runtime support. Install it with `npm install -g @openai/codex`, then run `codex login`.");
    }
  }
  const rounds = Math.min(Number(args.rounds ?? DEFAULT_ROUNDS) || DEFAULT_ROUNDS, HARD_MAX_ROUNDS);
  const target = resolveReviewTarget(repoRoot, { scope: args.scope ?? "auto", base: args.base ?? null });
  const context = collectReviewContext(repoRoot, target);
  const debateId = `dbt-${new Date().toISOString().slice(0, 10)}-${crypto.randomBytes(3).toString("hex")}`;
  const dir = path.join(councilDir(repoRoot), debateId);
  fs.mkdirSync(dir, { recursive: true });

  const debate = {
    debateId,
    mode: "review",
    createdAt: new Date().toISOString(),
    repoRoot,
    target: { mode: target.mode, label: target.label, baseRef: target.baseRef ?? null },
    focus: args._.join(" ").trim() || null,
    maxRounds: rounds,
    round: 0,
    phase: CRITIQUE_PHASE,
    codexThreadId: null,
    collectionGuidance: context.collectionGuidance,
    stats: { rounds: [] }
  };
  const ledger = { findings: {}, flags: [], rounds: [] };
  fs.writeFileSync(path.join(dir, "context.md"), context.content);
  saveDebate(dir, debate, ledger);
  out({
    debateId,
    targetLabel: target.label,
    fileCount: context.fileCount,
    inputMode: context.inputMode,
    maxRounds: rounds,
    next: `node council-runner.mjs critique --debate ${debateId}`
  });
}

async function stepCritique(args, cwd) {
  const repoRoot = getRepoRoot(cwd);
  const { dir, debate, ledger } = loadDebate(repoRoot, args.debate ?? fail("--debate <id> is required"));
  if (debate.phase !== CRITIQUE_PHASE) fail(`debate is in phase "${debate.phase}", expected "${CRITIQUE_PHASE}"`);
  const round = debate.round + 1;
  const startedAt = Date.now();

  const template = loadPromptTemplate(ROOT_DIR, "critique");
  const prompt = interpolateTemplate(template, {
    ROUND: String(round),
    MAX_ROUNDS: String(debate.maxRounds),
    TARGET_LABEL: debate.target.label,
    USER_FOCUS: debate.focus ?? "No extra focus provided.",
    LEDGER: round === 1 ? "Empty (first round)." : JSON.stringify(compactLedger(ledger), null, 2),
    DEFENDER_MESSAGE: debate.lastRebuttal ? JSON.stringify(debate.lastRebuttal, null, 2) : "None (first round).",
    REVIEW_INPUT: fs.readFileSync(path.join(dir, "context.md"), "utf8")
  });

  let message;
  let usage = null;
  let tokens = null;
  let codexCalls = 0;
  if (process.env.COUNCIL_MOCK_CRITIQUE) {
    message = readJson(process.env.COUNCIL_MOCK_CRITIQUE);
  } else {
    const callCodex = async (turnPrompt) => {
      codexCalls += 1;
      const result = await runAppServerTurn(repoRoot, {
        prompt: turnPrompt,
        sandbox: "read-only",
        persistThread: true,
        threadName: debate.codexThreadId ? undefined : `council ${debate.debateId}`,
        resumeThreadId: debate.codexThreadId ?? undefined,
        outputSchema: readOutputSchema(SCHEMA_PATH)
      });
      debate.codexThreadId = result.threadId;
      // Usage arrives on its own notification, not on the turn object. Summed
      // across calls because a malformed-output retry is a second billed turn:
      // the cost of this round is both calls, not the last one.
      if (result.usage) {
        usage = accumulateUsage(usage, result.usage);
        tokens = accumulateTokens(tokens, result.tokens);
      }
      return parseStructuredOutput(result.finalMessage, {
        status: result.status,
        failureMessage: result.error?.message ?? result.stderr
      });
    };
    let parsed = await callCodex(prompt);
    if (!parsed.parsed) {
      // Malformed-output retry (spec §6): one nudge on the same thread, then abort.
      parsed = await callCodex(
        `Your previous reply was not valid JSON matching the required schema (${parsed.parseError ?? "parse failure"}). Re-send ONLY the JSON object for round ${round}, side "codex", with "findings" and "responses" arrays. No prose, no code fences.`
      );
    }
    if (!parsed.parsed) fail(`Codex returned unparseable output after retry: ${parsed.parseError ?? "unknown"}\nRaw: ${String(parsed.rawOutput).slice(0, 2000)}\nLedger preserved at ${dir}`);
    message = parsed.parsed;
  }

  const errors = validateMessage(message, { expectedSide: "codex", expectedRound: round, ledger });
  if (errors.length) fail(`Codex critique failed validation:\n- ${errors.join("\n- ")}\nLedger preserved at ${dir}`);

  const responseChanges = applyResponses(ledger, message);
  const added = mergeNewFindings(ledger, message);
  ledger.rounds.push({ round, side: "codex", newFindings: added, responseChanges });

  debate.round = round;
  debate.phase = REBUT_PHASE;
  debate.lastCritique = message;
  debate.lastCritiqueChanges = added + responseChanges;
  const mocked = Boolean(process.env.COUNCIL_MOCK_CRITIQUE);
  debate.stats.rounds.push({
    round,
    side: "codex",
    durationMs: Date.now() - startedAt,
    codexCalls,
    mocked,
    usageStatus: usageStatusFor({ mocked, usage }),
    usage,
    tokens
  });
  saveDebate(dir, debate, ledger);
  out({ round, newFindings: added, responseChanges, critique: message, next: `write rebuttal JSON per prompts/rebuttal-guidance.md, then: node council-runner.mjs rebut --debate ${debate.debateId} --file <rebuttal.json>` });
}

function decideContinuation(debate, ledger) {
  // Unsettled = disputed (rejected / partially-accepted) OR still open
  // (e.g. Claude-claimed findings awaiting the critic's answer).
  const unsettled = Object.values(ledger.findings).filter((f) =>
    ["rejected", "partially-accepted", "open"].includes(f.status));
  if (!unsettled.length) return { continue: false, reason: "all findings settled (accepted, resolved, or none raised)" };
  if (debate.round >= debate.maxRounds) return { continue: false, reason: `round cap (${debate.maxRounds}) reached with ${unsettled.length} unsettled finding(s)` };
  if (debate.lastCritiqueChanges === 0) return { continue: false, reason: "deadlock: last critique produced no new findings and no changes" };
  return { continue: true, reason: `${unsettled.length} unsettled finding(s); the critic must answer open items and may escalate or concede disputes`, unsettled: unsettled.map((f) => f.id) };
}

function stepRebut(args, cwd) {
  const repoRoot = getRepoRoot(cwd);
  const { dir, debate, ledger } = loadDebate(repoRoot, args.debate ?? fail("--debate <id> is required"));
  if (debate.phase !== REBUT_PHASE) fail(`debate is in phase "${debate.phase}", expected "${REBUT_PHASE}"`);
  if (!args.file) fail("--file <rebuttal.json> is required");
  const message = readJson(args.file);

  const errors = validateMessage(message, { expectedSide: "claude", expectedRound: debate.round, ledger });
  if (errors.length) fail(`Rebuttal failed validation — correct and resubmit:\n- ${errors.join("\n- ")}`);

  const changes = applyResponses(ledger, message);
  const added = mergeNewFindings(ledger, message);
  const flag = runTripwire(ledger, message, debate.round);
  ledger.rounds.push({ round: debate.round, side: "claude", newFindings: added, responseChanges: changes });

  debate.lastRebuttal = message;
  debate.phase = CRITIQUE_PHASE;
  const decision = decideContinuation(debate, ledger);
  if (!decision.continue) debate.phase = "ready-to-close";
  saveDebate(dir, debate, ledger);
  out({
    round: debate.round,
    applied: changes,
    defenderFindings: added,
    tripwire: flag,
    ...decision,
    next: decision.continue
      ? `node council-runner.mjs critique --debate ${debate.debateId}`
      : `node council-runner.mjs close --debate ${debate.debateId}`
  });
}

function shipLine(findings) {
  const material = (f) => f.support_level !== "unsupported" && f.support_level !== "weak";
  const blockers = findings.filter((f) => ["accepted", "partially-accepted"].includes(f.status) && ["high", "critical"].includes(f.severity) && material(f));
  const disputes = findings.filter((f) => ["rejected", "open"].includes(f.status) && ["high", "critical"].includes(f.severity) && material(f));
  if (blockers.length) return `NO-SHIP: ${blockers.length} accepted high/critical finding(s) require fixes.`;
  if (disputes.length) return `BLOCKED PENDING DISPUTE: ${disputes.length} high/critical finding(s) remain disputed — resolve via deciding evidence.`;
  const fixes = findings.filter((f) => ["accepted", "partially-accepted"].includes(f.status) && material(f));
  if (fixes.length) return `SHIP WITH FIXES: ${fixes.length} accepted finding(s) below high severity.`;
  return "CLEAN: no material findings survived the debate.";
}

function stepClose(args, cwd) {
  const repoRoot = getRepoRoot(cwd);
  const { dir, debate, ledger } = loadDebate(repoRoot, args.debate ?? fail("--debate <id> is required"));
  const findings = Object.values(ledger.findings);
  const by = (status) => findings.filter((f) => f.status === status);
  const unsupported = findings.filter((f) => f.support_level === "unsupported");
  const disputed = by("rejected").concat(by("partially-accepted"));

  const lines = [];
  lines.push(`# Council Review Verdict — ${debate.debateId}`);
  lines.push("");
  lines.push(`Target: ${debate.target.label} · Rounds: ${debate.round}/${debate.maxRounds} · Findings: ${findings.length}`);
  lines.push("");
  lines.push(`**${shipLine(findings)}**`);
  const section = (title, items, render) => {
    if (!items.length) return;
    lines.push("", `## ${title}`, "");
    for (const f of items) lines.push(render(f));
  };
  section("Consensus — accepted findings", by("accepted").concat(by("partially-accepted")), (f) =>
    `- **${f.id}** [${f.severity}/${f.support_level}] ${f.claim}\n  - Evidence: ${f.evidence}\n  - Defender: ${f.defender_reason ?? ""}${f.proposed_fix ? `\n  - Proposed fix: ${f.proposed_fix}` : ""}`);
  section("Withdrawn by claimant", by("withdrawn"), (f) => `- **${f.id}** (claimant: ${f.claimant}) ${f.claim} — claimant abandoned the finding after rebuttal.`);
  section("Disputed — unresolved", by("rejected"), (f) =>
    `- **${f.id}** [${f.severity}] ${f.claim}\n  - ${f.claimant === "codex" ? "Codex" : "Claude"} evidence: ${f.evidence}\n  - Opposing position: ${f.defender_reason ?? f.critic_reason ?? ""} (${f.defender_evidence ?? f.critic_evidence ?? "no evidence recorded"})\n  - Deciding evidence: ${f.deciding_evidence ?? "⚠ NOT RECORDED — protocol gap"}`);
  section("Unanswered at close — never adjudicated", by("open"), (f) =>
    `- **${f.id}** [${f.severity}/${f.support_level}] (claimant: ${f.claimant}) ${f.claim}\n  - Evidence: ${f.evidence}\n  - ⚠ The debate closed before the opposing side answered this finding; treat as unresolved risk.`);
  section("Unsupported (excluded from verdict)", unsupported, (f) => `- ${f.id}: ${f.claim}`);
  if (ledger.flags.length) {
    lines.push("", "## Protocol flags", "");
    for (const flag of ledger.flags) lines.push(`- Round ${flag.round} ${flag.type}: ${flag.detail}`);
  }
  lines.push("", `_Ledger: ${path.join(dir, "ledger.json")}_`);

  const verdict = lines.join("\n");
  fs.writeFileSync(path.join(dir, "verdict.md"), `${verdict}\n`);
  debate.phase = "closed";
  saveDebate(dir, debate, ledger);
  out(verdict);
  if (disputed.some((f) => !f.deciding_evidence)) {
    process.stderr.write("warning: disputed findings closed without deciding_evidence recorded\n");
  }
}

function stepStatus(args, cwd) {
  const repoRoot = getRepoRoot(cwd);
  const { debate, ledger } = loadDebate(repoRoot, args.debate ?? fail("--debate <id> is required"));
  const findings = Object.values(ledger.findings);
  out({
    debateId: debate.debateId,
    phase: debate.phase,
    round: `${debate.round}/${debate.maxRounds}`,
    target: debate.target.label,
    findings: STATUSES.map((s) => ({ status: s, count: findings.filter((f) => f.status === s).length })).filter((x) => x.count),
    flags: ledger.flags
  });
}

// ---------- main ----------

async function main() {
  const [step, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const cwd = process.cwd();
  switch (step) {
    case "init": return stepInit(args, cwd);
    case "critique": return stepCritique(args, cwd);
    case "rebut": return stepRebut(args, cwd);
    case "close": return stepClose(args, cwd);
    case "status": return stepStatus(args, cwd);
    default:
      fail(`unknown step "${step ?? ""}". Use: init | critique | rebut | status | close`);
  }
}

// Run only when invoked as a CLI, so the protocol suite can import the cost
// helpers above and assert on them directly. S3 is a gating criterion; the
// functions that compute it should be reachable by a test without spawning a
// process and without a live provider call.
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => fail(error?.stack ?? String(error)));
}

export { accumulateUsage, accumulateTokens, usageStatusFor };
