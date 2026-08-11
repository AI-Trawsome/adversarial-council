#!/usr/bin/env node
/**
 * inject-armA.mjs — benchmark harness (NOT part of the council plugin).
 *
 * The Arm A critique gate required by reviews/CHATGPT-RULING-021-armA-schema-asymmetry.md.
 *
 * Arm B's critic cannot emit a message that violates the frozen schema: the
 * runner hands the schema to the provider as an `outputSchema`, and if the
 * reply still fails to parse the runner spends ONE retry nudge on the same
 * thread before aborting. Arm A's critic had neither protection — its message
 * was read from a file and used as-is.
 *
 * This program puts Arm A under the same contract, with the same budget:
 *
 *   attempt 1 invalid  -> refuse, archive, report every error at once, and
 *                         allow exactly one corrected submission
 *   attempt 2 invalid  -> abort the critic step, matching Arm B's policy after
 *                         its malformed-output retry is exhausted
 *   valid              -> hand the file to the runner via COUNCIL_MOCK_CRITIQUE
 *
 * Validation happens BEFORE the runner is invoked, so an invalid message cannot
 * mutate the ledger or advance the phase — the same property the runner's own
 * boundary checks already have.
 *
 * Rejected payloads, their error reports, and the attempt counter are archived
 * OUTSIDE the arm's log directory, because reviewers read files in that
 * directory and the ruling forbids either arm's participants from reaching
 * rejected messages or validation artifacts.
 *
 * Usage:
 *   node inject-armA.mjs --repo <armRepo> --logs <armLogs> --debate <id> --round N
 *                        [--runner <path>] [--rejected <dir>] [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { validateCritique } from "./validate-critique.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_RUNNER = path.resolve(HERE, "..", "plugins", "council", "scripts", "council-runner.mjs");
const MAX_ATTEMPTS = 2; // initial + exactly one correction, mirroring Arm B

function arg(name, { required = true, fallback = null } = {}) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1] || process.argv[i + 1].startsWith("--")) {
    if (required) {
      process.stderr.write(`inject-armA: missing --${name}\n`);
      process.exit(2);
    }
    return fallback;
  }
  return process.argv[i + 1];
}
const has = (name) => process.argv.includes(`--${name}`);

const repo = path.resolve(arg("repo"));
const logs = path.resolve(arg("logs"));
const debateId = arg("debate");
const round = Number(arg("round"));
const runner = path.resolve(arg("runner", { required: false, fallback: DEFAULT_RUNNER }));
const rejectedDir = path.resolve(
  arg("rejected", { required: false, fallback: path.join(logs, "..", "_rejected", path.basename(logs)) })
);

const messagePath = path.join(logs, `critique-mock-r${round}.json`);
const attemptsPath = path.join(rejectedDir, `attempts-r${round}.json`);

function readAttempts() {
  try { return JSON.parse(fs.readFileSync(attemptsPath, "utf8")); }
  catch { return { round, attempts: 0, history: [] }; }
}
function writeAttempts(state) {
  fs.mkdirSync(rejectedDir, { recursive: true });
  fs.writeFileSync(attemptsPath, `${JSON.stringify(state, null, 2)}\n`);
}
function out(obj) { process.stdout.write(`${JSON.stringify(obj, null, 2)}\n`); }

if (!fs.existsSync(messagePath)) {
  out({ ok: false, reason: "message-file-missing", round });
  process.exit(2);
}

const state = readAttempts();
const attempt = state.attempts + 1;

let message = null;
let parseFailed = false;
try {
  message = JSON.parse(fs.readFileSync(messagePath, "utf8"));
} catch {
  parseFailed = true;
}

const result = parseFailed
  ? { valid: false, errors: ["/: file is not valid JSON [parse-error]"], categories: { "parse-error": 1 } }
  : validateCritique(message, { round, side: "codex" });

if (!result.valid) {
  // Archive the rejected payload and its error report outside the arm log dir.
  fs.mkdirSync(rejectedDir, { recursive: true });
  const stamp = `r${round}-attempt${attempt}`;
  fs.copyFileSync(messagePath, path.join(rejectedDir, `rejected-${stamp}.json`));
  fs.writeFileSync(
    path.join(rejectedDir, `errors-${stamp}.txt`),
    `${result.errors.join("\n")}\n`
  );
  state.attempts = attempt;
  state.history.push({ attempt, valid: false, categories: result.categories, errorCount: result.errors.length });
  writeAttempts(state);

  const exhausted = attempt >= MAX_ATTEMPTS;
  out({
    ok: false,
    injected: false,
    attempt,
    maxAttempts: MAX_ATTEMPTS,
    correctionPermitted: !exhausted,
    aborted: exhausted,
    errorCount: result.errors.length,
    categories: result.categories,
    errors: result.errors,
    ledgerMutated: false
  });
  process.exit(exhausted ? 3 : 1);
}

state.attempts = attempt;
state.history.push({ attempt, valid: true, categories: {}, errorCount: 0 });
writeAttempts(state);

if (has("dry-run")) {
  out({ ok: true, injected: false, dryRun: true, attempt, maxAttempts: MAX_ATTEMPTS });
  process.exit(0);
}

const run = spawnSync(process.execPath, [runner, "critique", "--debate", debateId], {
  cwd: repo,
  env: { ...process.env, COUNCIL_MOCK_CRITIQUE: messagePath },
  encoding: "utf8"
});

// The runner's stdout echoes the critique, which is finding text. It is written
// straight to the arm's log file and never returned to the orchestrator.
fs.writeFileSync(path.join(logs, `critique-r${round}.json`), run.stdout ?? "");
fs.writeFileSync(path.join(logs, `critique-r${round}.err`), run.stderr ?? "");

if (run.status !== 0) {
  out({ ok: false, injected: false, attempt, runnerExit: run.status, runnerStderr: run.stderr?.trim() ?? "" });
  process.exit(run.status ?? 1);
}

let summary = {};
try {
  const echoed = JSON.parse(run.stdout);
  summary = { round: echoed.round, newFindings: echoed.newFindings, responseChanges: echoed.responseChanges };
} catch { /* summary stays empty; the log file has the raw output */ }

out({ ok: true, injected: true, attempt, maxAttempts: MAX_ATTEMPTS, ...summary });
