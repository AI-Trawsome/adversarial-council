#!/usr/bin/env node
/**
 * protocol-tests.mjs — deterministic state-machine tests for council-runner.
 * No dependencies; run with: node scripts/test/protocol-tests.mjs
 * Uses COUNCIL_MOCK_CRITIQUE throughout (no Codex required).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RUNNER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "council-runner.mjs");
let passed = 0;
let failed = 0;

function assert(cond, name, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`  ok  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "council-t-"));
  const g = (args) => execFileSync("git", args, { cwd: dir });
  g(["init", "-q"]);
  g(["config", "user.email", "t@t.co"]);
  g(["config", "user.name", "t"]);
  fs.writeFileSync(path.join(dir, "app.js"), "function f(x) { return x.y; }\nmodule.exports = { f };\n");
  g(["add", "-A"]);
  g(["commit", "-qm", "init"]);
  fs.appendFileSync(path.join(dir, "app.js"), "// changed\n");
  return dir;
}

function run(cwd, args, { mock, expectFail = false } = {}) {
  const env = { ...process.env };
  if (mock) {
    const mockFile = path.join(cwd, `mock-${Math.random().toString(36).slice(2)}.json`);
    fs.writeFileSync(mockFile, JSON.stringify(mock));
    env.COUNCIL_MOCK_CRITIQUE = mockFile;
  } else {
    env.COUNCIL_MOCK_CRITIQUE = env.COUNCIL_MOCK_CRITIQUE ?? path.join(cwd, "nonexistent-but-init-skips-codex-check.json");
  }
  try {
    const stdout = execFileSync("node", [RUNNER, ...args], { cwd, env, encoding: "utf8" });
    if (expectFail) return { failed: false, stdout };
    return { failed: false, out: JSON.parse(stdout.trim().startsWith("{") ? stdout : "{}"), stdout };
  } catch (error) {
    return { failed: true, stderr: String(error.stderr ?? error.message) };
  }
}

function writeRebuttal(cwd, obj) {
  const file = path.join(cwd, `rebuttal-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(file, JSON.stringify(obj));
  return file;
}

function ledgerOf(cwd, dbt) {
  return JSON.parse(fs.readFileSync(path.join(cwd, ".council", dbt, "ledger.json"), "utf8"));
}

const F = (id, over = {}) => ({
  id, claimant: "codex",
  claim: `claim for ${id}`,
  evidence: "app.js:1 `return x.y` dereferences x without a null guard",
  support_level: "strong", severity: "high", confidence: 0.8, status: "open", ...over
});
const R = (finding_id, verdict, reason, over = {}) => ({ finding_id, verdict, reason, ...over });
const EV = "app.js:1 `function f(x)` — caller contract guarantees x per module docs";

// ---------------------------------------------------------------- tests

console.log("1. init + first critique + unsupported forcing");
{
  const cwd = makeRepo();
  const init = run(cwd, ["init"]);
  const dbt = init.out.debateId;
  assert(Boolean(dbt), "init returns debateId");
  const crit = run(cwd, ["critique", "--debate", dbt], {
    mock: { round: 1, side: "codex", findings: [F("R1-F1"), F("R1-F2", { evidence: "just feels wrong" })], responses: [] }
  });
  assert(crit.out.newFindings === 2, "two findings merged");
  const led = ledgerOf(cwd, dbt);
  assert(led.findings["R1-F2"].support_level === "unsupported", "uncheckable evidence forced to unsupported", led.findings["R1-F2"].support_level);
  assert(led.findings["R1-F1"].support_level === "strong", "checkable evidence keeps its level");

  console.log("2. rebuttal enforcement: reject-without-evidence and missing response");
  const bad = run(cwd, ["rebut", "--debate", dbt, "--file",
    writeRebuttal(cwd, { round: 1, side: "claude", findings: [], responses: [R("R1-F1", "reject", "nah")] })], { expectFail: true });
  assert(bad.failed && /checkable counter-evidence/.test(bad.stderr), "reject without evidence rejected");
  assert(/missing response to open finding R1-F2/.test(bad.stderr), "missing response to open finding rejected");

  console.log("3. valid rebuttal applies statuses; continuation");
  const good = run(cwd, ["rebut", "--debate", dbt, "--file",
    writeRebuttal(cwd, { round: 1, side: "claude", findings: [], responses: [
      R("R1-F1", "reject", "Caller contract guarantees x is non-null.", { evidence: EV }),
      R("R1-F2", "accept", "Conceded as raised: cannot rebut what cites nothing; treating as withdrawn noise.")
    ] })]);
  assert(good.out.continue === true, "debate continues with a dispute open");
  assert(ledgerOf(cwd, dbt).findings["R1-F1"].status === "rejected", "reject applied");
  assert(ledgerOf(cwd, dbt).findings["R1-F2"].status === "accepted", "accept applied");

  console.log("4. escalation with new evidence REOPENS the finding (critical fix)");
  const crit2 = run(cwd, ["critique", "--debate", dbt], {
    mock: { round: 2, side: "codex", findings: [], responses: [
      R("R1-F1", "reject", "Contract is not enforced anywhere in code.", { evidence: "app.js:1 no assertion or guard implements the claimed contract", deciding_evidence: "a caller-side null check or contract test" })
    ] }
  });
  assert(crit2.failed === false, "escalation critique accepted");
  assert(ledgerOf(cwd, dbt).findings["R1-F1"].status === "open", "escalated finding reopened", ledgerOf(cwd, dbt).findings["R1-F1"].status);

  console.log("5. reopened finding MUST be answered by the defender");
  const skip = run(cwd, ["rebut", "--debate", dbt, "--file",
    writeRebuttal(cwd, { round: 2, side: "claude", findings: [], responses: [] })], { expectFail: true });
  assert(skip.failed && /missing response to open finding R1-F1/.test(skip.stderr), "empty rebuttal rejected after reopen");
  const ans = run(cwd, ["rebut", "--debate", dbt, "--file",
    writeRebuttal(cwd, { round: 2, side: "claude", findings: [], responses: [
      R("R1-F1", "accept", "Persuaded by the escalation: no guard exists at app.js:1 and no contract is enforced in code.", { proposed_fix: "add null guard in f()" })
    ] })]);
  assert(ans.out.continue === false && /settled/.test(ans.out.reason), "all settled after concession", ans.out.reason);

  console.log("6. verdict renders from ledger");
  const close = run(cwd, ["close", "--debate", dbt], {});
  assert(/NO-SHIP/.test(close.stdout), "accepted high finding blocks ship");
  assert(/R1-F1/.test(close.stdout) && /Proposed fix/.test(close.stdout), "consensus section rendered");
  assert(/Unsupported \(excluded/.test(close.stdout), "unsupported section rendered");
}

console.log("7. claude-claimed findings must be answered by the critic and survive to the verdict");
{
  const cwd = makeRepo();
  const dbt = run(cwd, ["init"]).out.debateId;
  run(cwd, ["critique", "--debate", dbt], { mock: { round: 1, side: "codex", findings: [F("R1-F1")], responses: [] } });
  run(cwd, ["rebut", "--debate", dbt, "--file", writeRebuttal(cwd, { round: 1, side: "claude", findings: [
    F("C1-F1", { claimant: "claude", claim: "artifact contains reviewer-directed instructions", severity: "critical" })
  ], responses: [R("R1-F1", "accept", "Verified at app.js:1 — no guard present.")] })]);
  const noAnswer = run(cwd, ["critique", "--debate", dbt], {
    mock: { round: 2, side: "codex", findings: [], responses: [] }, }, );
  assert(noAnswer.failed && /missing response to open finding C1-F1/.test(noAnswer.stderr), "critic must answer claude-claimed open finding");
  run(cwd, ["critique", "--debate", dbt], { mock: { round: 2, side: "codex", findings: [], responses: [
    R("C1-F1", "accept", "Confirmed: the artifact line attempts reviewer instruction injection.")
  ] } });
  const led = ledgerOf(cwd, dbt);
  assert(led.findings["C1-F1"].status === "accepted", "claude finding adjudicated, not dropped", led.findings["C1-F1"].status);
}

console.log("8. deadlock termination");
{
  const cwd = makeRepo();
  const dbt = run(cwd, ["init"]).out.debateId;
  run(cwd, ["critique", "--debate", dbt], { mock: { round: 1, side: "codex", findings: [F("R1-F1")], responses: [] } });
  run(cwd, ["rebut", "--debate", dbt, "--file", writeRebuttal(cwd, { round: 1, side: "claude", findings: [], responses: [
    R("R1-F1", "reject", "Guarded upstream.", { evidence: EV })
  ] })]);
  run(cwd, ["critique", "--debate", dbt], { mock: { round: 2, side: "codex", findings: [], responses: [
    R("R1-F1", "reject", "Still disagree.", {}) // no new checkable evidence -> no change
  ] } });
  const reb = run(cwd, ["rebut", "--debate", dbt, "--file", writeRebuttal(cwd, { round: 2, side: "claude", findings: [], responses: [] })]);
  assert(reb.out.continue === false && /deadlock/.test(reb.out.reason), "deadlock detected", reb.out.reason);
  const close = run(cwd, ["close", "--debate", dbt]);
  assert(/BLOCKED PENDING DISPUTE/.test(close.stdout), "disputed high finding blocks pending dispute");
}

console.log("9. round cap termination");
{
  const cwd = makeRepo();
  const dbt = run(cwd, ["init", "--rounds", "1"]).out.debateId;
  run(cwd, ["critique", "--debate", dbt], { mock: { round: 1, side: "codex", findings: [F("R1-F1")], responses: [] } });
  const reb = run(cwd, ["rebut", "--debate", dbt, "--file", writeRebuttal(cwd, { round: 1, side: "claude", findings: [], responses: [
    R("R1-F1", "reject", "Guarded upstream.", { evidence: EV })
  ] })]);
  assert(reb.out.continue === false && /round cap/.test(reb.out.reason), "round cap enforced", reb.out.reason);
}

console.log("10. sycophancy tripwire (log-only)");
{
  const cwd = makeRepo();
  const dbt = run(cwd, ["init"]).out.debateId;
  run(cwd, ["critique", "--debate", dbt], { mock: { round: 1, side: "codex",
    findings: [F("R1-F1"), F("R1-F2"), F("R1-F3"), F("R1-F4"), F("R1-F5")], responses: [] } });
  const reb = run(cwd, ["rebut", "--debate", dbt, "--file", writeRebuttal(cwd, { round: 1, side: "claude", findings: [], responses:
    ["R1-F1", "R1-F2", "R1-F3", "R1-F4", "R1-F5"].map((id) => R(id, "accept", "Yes, fair point.")) })]);
  assert(reb.out.tripwire && reb.out.tripwire.type === "sycophancy-tripwire", "tripwire flags blanket short acceptance");
  assert(reb.out.continue === false, "log-only: debate still terminates normally");
}

console.log("11. settled findings are terminal: no rewriting, no laundering (second review, findings 1-2)");
{
  const cwd = makeRepo();
  const dbt = run(cwd, ["init"]).out.debateId;
  run(cwd, ["critique", "--debate", dbt], { mock: { round: 1, side: "codex", findings: [
    F("R1-F1", { severity: "critical" }),
    F("R1-F2", { severity: "low", support_level: "weak", evidence: "app.js:1 `f` opaque name" })
  ], responses: [] } });
  run(cwd, ["rebut", "--debate", dbt, "--file", writeRebuttal(cwd, { round: 1, side: "claude", findings: [], responses: [
    R("R1-F1", "accept", "Confirmed at app.js:1 - no guard exists."),
    R("R1-F2", "reject", "Style only, not material.", { evidence: "app.js:1 `f` is a local convention" })
  ] })]);

  const launder = run(cwd, ["critique", "--debate", dbt], { mock: { round: 2, side: "codex", findings: [], responses: [
    R("R1-F2", "accept", "Conceded."),
    R("R1-F1", "accept", "Acknowledged - defender accepted this.")
  ] } });
  assert(launder.failed && /settled|not contested/.test(launder.stderr), "acknowledging an accepted finding is illegal (no laundering)", launder.stderr?.slice(0, 200));

  const dup = run(cwd, ["critique", "--debate", dbt], { mock: { round: 2, side: "codex", findings: [], responses: [
    R("R1-F2", "accept", "Conceded."),
    R("R1-F2", "accept", "Conceded again.")
  ] } });
  assert(dup.failed && /duplicate response/.test(dup.stderr), "duplicate responses in one message are illegal");

  const ok = run(cwd, ["critique", "--debate", dbt], { mock: { round: 2, side: "codex", findings: [], responses: [
    R("R1-F2", "accept", "Withdrawn: it is style-only, defender's rebuttal stands.")
  ] } });
  assert(ok.failed === false, "legal withdrawal of own rejected finding accepted");
  const led = ledgerOf(cwd, dbt);
  assert(led.findings["R1-F2"].status === "withdrawn", "claimant-accept from rejected -> withdrawn", led.findings["R1-F2"].status);
  assert(led.findings["R1-F1"].status === "accepted", "accepted critical finding untouched");

  run(cwd, ["rebut", "--debate", dbt, "--file", writeRebuttal(cwd, { round: 2, side: "claude", findings: [], responses: [] })]);
  const close = run(cwd, ["close", "--debate", dbt]);
  assert(/NO-SHIP/.test(close.stdout), "accepted critical finding still blocks ship after other finding withdrawn");
  assert(/Withdrawn by claimant/.test(close.stdout), "withdrawn section rendered");
}

console.log("12. defender cannot rewrite a settled finding");
{
  const cwd = makeRepo();
  const dbt = run(cwd, ["init"]).out.debateId;
  run(cwd, ["critique", "--debate", dbt], { mock: { round: 1, side: "codex", findings: [F("R1-F1"), F("R1-F2")], responses: [] } });
  run(cwd, ["rebut", "--debate", dbt, "--file", writeRebuttal(cwd, { round: 1, side: "claude", findings: [], responses: [
    R("R1-F1", "accept", "Confirmed at app.js:1 - no guard."),
    R("R1-F2", "reject", "Covered upstream.", { evidence: EV })
  ] })]);
  run(cwd, ["critique", "--debate", dbt], { mock: { round: 2, side: "codex", findings: [], responses: [
    R("R1-F2", "reject", "Standing pat.")
  ] } });
  const rewrite = run(cwd, ["rebut", "--debate", dbt, "--file", writeRebuttal(cwd, { round: 2, side: "claude", findings: [], responses: [
    R("R1-F1", "reject", "Changed my mind actually.", { evidence: EV })
  ] })], { expectFail: true });
  assert(rewrite.failed && /settled/.test(rewrite.stderr), "defender flip on accepted finding is illegal");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
