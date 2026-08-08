#!/usr/bin/env node
/**
 * armA-prompt.mjs — benchmark harness (NOT part of the council plugin).
 *
 * Arm A's critic is Claude, delivered to the runner via COUNCIL_MOCK_CRITIQUE.
 * The runner interpolates the critique prompt internally and then discards it
 * when mocked, so this script reconstructs the *identical* prompt the critic
 * would have received, using the plugin's own template loader/interpolator and
 * a verbatim copy of the runner's compactLedger(), and writes it to a file.
 *
 * The only substitution is the template itself: prompts/critique.md (Arm B) is
 * replaced by _prompts/critique-armA.md, whose two-line diff is recorded in
 * reviews/PILOT-T01.md per BENCHMARK.md §1.
 *
 * Usage:
 *   node armA-prompt.mjs --repo <reviewRepo> --debate <id> --template <file> --out <file>
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { interpolateTemplate } from "/Users/michaeltraw/Dev/council-marketplace/plugins/council/scripts/lib/prompts.mjs";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1]) {
    throw new Error(`missing --${name}`);
  }
  return process.argv[i + 1];
}

// Verbatim from council-runner.mjs — must stay byte-equivalent in behaviour.
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

const repoRoot = arg("repo");
const debateId = arg("debate");
const templatePath = arg("template");
const outPath = arg("out");

const dir = path.join(repoRoot, ".council", debateId);
const debate = JSON.parse(fs.readFileSync(path.join(dir, "debate.json"), "utf8"));
const ledger = JSON.parse(fs.readFileSync(path.join(dir, "ledger.json"), "utf8"));

// The runner computes `round` as debate.round + 1 at the top of stepCritique.
const round = debate.round + 1;

const prompt = interpolateTemplate(fs.readFileSync(templatePath, "utf8"), {
  ROUND: String(round),
  MAX_ROUNDS: String(debate.maxRounds),
  TARGET_LABEL: debate.target.label,
  USER_FOCUS: debate.focus ?? "No extra focus provided.",
  LEDGER: round === 1 ? "Empty (first round)." : JSON.stringify(compactLedger(ledger), null, 2),
  DEFENDER_MESSAGE: debate.lastRebuttal ? JSON.stringify(debate.lastRebuttal, null, 2) : "None (first round).",
  REVIEW_INPUT: fs.readFileSync(path.join(dir, "context.md"), "utf8")
});

fs.writeFileSync(outPath, prompt);
// Control-plane output only: never echo the prompt itself.
process.stdout.write(JSON.stringify({ round, maxRounds: debate.maxRounds, phase: debate.phase, bytes: prompt.length, out: outPath }) + "\n");
