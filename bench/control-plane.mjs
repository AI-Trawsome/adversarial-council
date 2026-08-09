#!/usr/bin/env node
/**
 * control-plane.mjs — benchmark harness (not part of the council plugin).
 *
 * Projects a debate down to the fields the orchestrator is allowed to see.
 *
 * The orchestrator drives the debate but must never read finding text, evidence,
 * defender reasoning, or the verdict body — those are the measurement. Prior
 * batches did this projection with ad-hoc `jq`, and it went wrong exactly the way
 * ad-hoc projections do: the T03 Arm A projection omitted `phase`, the
 * orchestrator could not see the debate was awaiting a rebuttal, and a full
 * critic turn was spent against a stale ledger (BATCH-T02-T06 §5).
 *
 * So the projection is a program with a closed allowlist. Everything it prints is
 * a count, a status, or an identifier. Nothing it prints is authored by a
 * reviewer. `phase` and `next` are included deliberately: sequencing state is
 * precisely what the orchestrator needs and precisely what the jq projection lost.
 *
 * Usage:
 *   node control-plane.mjs --repo <reviewRepo> --debate <id>
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1] || process.argv[i + 1].startsWith("--")) {
    process.stderr.write(`control-plane: missing --${name}\n`);
    process.exit(2);
  }
  return process.argv[i + 1];
}

const dir = path.join(path.resolve(arg("repo")), ".council", arg("debate"));
const debate = JSON.parse(fs.readFileSync(path.join(dir, "debate.json"), "utf8"));
const ledger = JSON.parse(fs.readFileSync(path.join(dir, "ledger.json"), "utf8"));
const findings = Object.values(ledger.findings);

const tally = (key) => {
  const counts = {};
  for (const f of findings) counts[f[key]] = (counts[f[key]] ?? 0) + 1;
  return counts;
};

// Ship line is recomputed here from statuses and severities rather than read out
// of verdict.md, so the orchestrator never opens a file containing claim text.
const material = (f) => f.support_level !== "unsupported" && f.support_level !== "weak";
const blockers = findings.filter((f) => ["accepted", "partially-accepted"].includes(f.status)
  && ["high", "critical"].includes(f.severity) && material(f));
const disputes = findings.filter((f) => ["rejected", "open"].includes(f.status)
  && ["high", "critical"].includes(f.severity) && material(f));
const fixes = findings.filter((f) => ["accepted", "partially-accepted"].includes(f.status) && material(f));
const shipLine = blockers.length ? "NO-SHIP"
  : disputes.length ? "BLOCKED PENDING DISPUTE"
  : fixes.length ? "SHIP WITH FIXES"
  : "CLEAN";

process.stdout.write(`${JSON.stringify({
  debateId: debate.debateId,
  phase: debate.phase,
  round: debate.round,
  maxRounds: debate.maxRounds,
  targetLabel: debate.target.label,
  // Hashed with a trailing newline restored: the runner joins argv and trims, so
  // the focus string is the frozen framing file minus its final newline. Hashing
  // it back to the file's own sha is what lets both arms be compared to the
  // frozen text without the orchestrator holding the text itself.
  focusSha256: debate.focus
    ? crypto.createHash("sha256").update(`${debate.focus}\n`).digest("hex")
    : null,
  findingsTotal: findings.length,
  byClaimant: tally("claimant"),
  byStatus: tally("status"),
  bySeverity: tally("severity"),
  bySupportLevel: tally("support_level"),
  shipLine,
  protocolFlags: ledger.flags.length,
  // Flag *types* are protocol machinery, not review content — the tripwire fires
  // on accept ratios and reason lengths, and its detail strings quote no findings.
  protocolFlagTypes: ledger.flags.map((f) => f.type),
  roundStats: (debate.stats?.rounds ?? []).map((r) => ({
    round: r.round,
    side: r.side,
    durationMs: r.durationMs,
    mocked: r.mocked,
    usageStatus: r.usageStatus
  }))
}, null, 2)}\n`);
