#!/usr/bin/env node
/**
 * harness-schema-tests.mjs — tests for the Arm A critique gate.
 *
 * These live in bench/ rather than in the plugin's own protocol suite on
 * purpose. The plugin is the code under test and is pinned at f976990; adding
 * assertions inside plugins/ would move the pin and make T15-T25 run against
 * different code from T01-T14, which is the comparability problem the ruling
 * explicitly declined to create.
 *
 * Covers the nine cases required by CHATGPT-RULING-021 §"Binding implementation
 * conditions" item 5.
 *
 * Run: node bench/test/harness-schema-tests.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { validateCritique, categorize, renderError, buildValidator } from "../validate-critique.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BENCH = path.resolve(HERE, "..");
const INJECT = path.join(BENCH, "inject-armA.mjs");

let passed = 0;
let failed = 0;
function ok(name, cond, detail = "") {
  if (cond) { passed += 1; console.log(`  ok  ${name}`); }
  else { failed += 1; console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
}
function section(t) { console.log(`\n${t}`); }

/** A message that is valid under the frozen schema. */
function validMessage(round = 1) {
  return {
    round,
    side: "codex",
    findings: [
      {
        id: `R${round}-F1`,
        claimant: "codex",
        claim: "A placeholder claim used only to exercise the validator.",
        evidence: "src/example.js:42 shows the branch, and `node -e 'x'` printed the value.",
        support_level: "strong",
        severity: "high",
        confidence: 0.9,
        status: "open",
        deciding_evidence: null
      }
    ],
    responses: [],
    notes: ""
  };
}

const clone = (o) => JSON.parse(JSON.stringify(o));

section("1. valid messages pass unchanged");
{
  const m = validMessage();
  const before = JSON.stringify(m);
  const r = validateCritique(m, { round: 1 });
  ok("a schema-valid message validates", r.valid, r.errors.join("; "));
  ok("validation does not mutate the message", JSON.stringify(m) === before);
  ok("no error categories on a valid message", Object.keys(r.categories).length === 0);
}

section("2. array-valued evidence — the defect that fired on T15 Arm A");
{
  const m = clone(validMessage());
  m.findings[0].evidence = ["src/example.js:42", "second item", "third item"];
  const r = validateCritique(m, { round: 1 });
  ok("array-valued evidence is rejected", !r.valid);
  ok("categorized as wrong-type", r.categories["wrong-type"] >= 1, JSON.stringify(r.categories));
  ok("the error names the evidence path", r.errors.some((e) => e.includes("/findings/0/evidence")), r.errors.join("; "));
  ok("no instance value is echoed", !r.errors.join(" ").includes("second item"));
}

section("3. string-valued confidence");
{
  const m = clone(validMessage());
  m.findings[0].confidence = "high";
  const r = validateCritique(m, { round: 1 });
  ok("string confidence is rejected", !r.valid);
  ok("categorized as wrong-type", r.categories["wrong-type"] >= 1);
  ok("the error names the confidence path", r.errors.some((e) => e.includes("/findings/0/confidence")));
}

section("4. missing required fields");
{
  for (const field of ["evidence", "claim", "severity", "support_level", "confidence", "status", "id", "claimant"]) {
    const m = clone(validMessage());
    delete m.findings[0][field];
    const r = validateCritique(m, { round: 1 });
    ok(`missing "${field}" is rejected`, !r.valid);
    ok(`missing "${field}" categorized as missing-required`, (r.categories["missing-required"] ?? 0) >= 1, JSON.stringify(r.categories));
  }
}

section("5. unexpected properties");
{
  const m = clone(validMessage());
  m.findings[0].title = "t";
  m.findings[0].impact = "i";
  m.findings[0].suggested_fix = "s";
  const r = validateCritique(m, { round: 1 });
  ok("undeclared finding properties are rejected", !r.valid);
  ok("three undeclared properties are counted", r.categories["undeclared-property"] === 3, JSON.stringify(r.categories));
  ok("each offending key is named", ["title", "impact", "suggested_fix"].every((k) => r.errors.join(" ").includes(`"${k}"`)));
}

section("6. invalid nested response fields");
{
  // A response that is valid under the schema, so that each case below isolates
  // exactly one defect. Getting this fixture right matters: an earlier draft
  // used `id` instead of `finding_id`, which made every case fail for two
  // reasons at once and let the assertions pass without testing what they claim.
  const validResponse = () => ({
    finding_id: "R1-F1",
    verdict: "accept",
    reason: "The cited guard is present and the path is unreachable.",
    evidence: "src/example.js:10-14",
    contest_support_level: null,
    proposed_fix: null,
    deciding_evidence: null
  });
  const base = () => ({ ...validMessage(2), findings: [], responses: [validResponse()] });

  {
    const r = validateCritique(base(), { round: 2 });
    ok("the response fixture is itself valid", r.valid, r.errors.join("; "));
  }
  {
    const m = base();
    m.responses[0].verdict = "not-a-verdict";
    const r = validateCritique(m, { round: 2 });
    ok("an out-of-enum response verdict is rejected", !r.valid);
    ok("that is the ONLY error", r.errors.length === 1, r.errors.join("; "));
    ok("categorized as value-not-in-enum", r.categories["value-not-in-enum"] === 1, JSON.stringify(r.categories));
  }
  {
    const m = base();
    m.responses[0].reason = 12345;
    const r = validateCritique(m, { round: 2 });
    ok("a wrong-typed response field is rejected", !r.valid);
    ok("that is the ONLY error", r.errors.length === 1, r.errors.join("; "));
    ok("the error names the nested response path", r.errors[0].includes("/responses/0/reason"), r.errors[0]);
  }
  {
    const m = base();
    delete m.responses[0].finding_id;
    const r = validateCritique(m, { round: 2 });
    ok("a response missing finding_id is rejected", !r.valid);
    ok("categorized as missing-required", r.categories["missing-required"] === 1, JSON.stringify(r.categories));
    ok("the missing key is named", r.errors[0].includes("finding_id"), r.errors[0]);
  }
  {
    const m = base();
    m.responses[0].id = "R1-F1"; // the wrong key name for this object
    const r = validateCritique(m, { round: 2 });
    ok("an undeclared response property is rejected", !r.valid);
    ok("categorized as undeclared-property", r.categories["undeclared-property"] === 1, JSON.stringify(r.categories));
  }
  {
    const m = base();
    m.responses[0].contest_support_level = "very-strong";
    const r = validateCritique(m, { round: 2 });
    ok("an out-of-enum contest_support_level is rejected", !r.valid);
    ok("categorized as value-not-in-enum", (r.categories["value-not-in-enum"] ?? 0) >= 1, JSON.stringify(r.categories));
  }
}

section("7. consolidated reporting — every reason at once");
{
  const m = clone(validMessage());
  m.findings[0].evidence = ["a"];
  m.findings[0].confidence = "high";
  m.findings[0].title = "t";
  delete m.findings[0].claim;
  const r = validateCritique(m, { round: 1 });
  ok("all four defects reported together", r.errors.length >= 4, `got ${r.errors.length}`);
  ok("categories cover type, required and undeclared",
    (r.categories["wrong-type"] ?? 0) >= 2 &&
    (r.categories["missing-required"] ?? 0) >= 1 &&
    (r.categories["undeclared-property"] ?? 0) >= 1,
    JSON.stringify(r.categories));
}

section("8. protocol-legality checks run alongside the schema");
{
  const m = clone(validMessage(1));
  m.round = 2;
  const r = validateCritique(m, { round: 1 });
  ok("a stale round is rejected", !r.valid && (r.categories["wrong-round"] ?? 0) === 1);

  const m2 = clone(validMessage(1));
  m2.findings[0].id = "R9-F1";
  const r2 = validateCritique(m2, { round: 1 });
  ok("a mis-numbered finding id is rejected", !r2.valid && (r2.categories["id-format"] ?? 0) === 1, JSON.stringify(r2.categories));
}

section("9. no value from the message ever reaches the error report");
{
  const secret = "ZZQQ-do-not-leak-ZZQQ";
  const m = clone(validMessage());
  m.findings[0].evidence = [secret];
  m.findings[0].confidence = secret;
  m.findings[0].severity = secret;
  m.findings[0].leaked_key = secret;
  const r = validateCritique(m, { round: 1 });
  ok("the report is non-empty", r.errors.length > 0);
  ok("no instance value appears in any error string", !r.errors.join("\n").includes(secret), r.errors.join("; "));
}

section("10. the gate: attempts, abort, and no ledger mutation");
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "armA-gate-"));
  const logs = path.join(tmp, "T99-armA");
  const repo = path.join(tmp, "T99-armA-repo");
  const ledgerDir = path.join(repo, ".council", "dbt-test");
  fs.mkdirSync(logs, { recursive: true });
  fs.mkdirSync(ledgerDir, { recursive: true });
  // A sentinel ledger: if the gate ever lets an invalid message through to the
  // runner, this file is what would change.
  const ledgerPath = path.join(ledgerDir, "ledger.json");
  fs.writeFileSync(ledgerPath, JSON.stringify({ findings: {}, flags: [], rounds: [] }));
  const ledgerBefore = fs.readFileSync(ledgerPath, "utf8");

  const msgPath = path.join(logs, "critique-mock-r1.json");
  const runGate = () => spawnSync(process.execPath, [
    INJECT, "--repo", repo, "--logs", logs, "--debate", "dbt-test", "--round", "1", "--dry-run"
  ], { encoding: "utf8" });

  // attempt 1: invalid
  const bad = clone(validMessage());
  bad.findings[0].evidence = ["array not string"];
  fs.writeFileSync(msgPath, JSON.stringify(bad));
  const a1 = runGate();
  const r1 = JSON.parse(a1.stdout);
  ok("attempt 1 invalid exits 1", a1.status === 1, `exit ${a1.status}`);
  ok("attempt 1 permits a correction", r1.correctionPermitted === true && r1.aborted === false);
  ok("attempt 1 did not inject", r1.injected === false);
  ok("the ledger is untouched after an invalid attempt", fs.readFileSync(ledgerPath, "utf8") === ledgerBefore);

  const rejectedDir = path.join(tmp, "_rejected", "T99-armA");
  ok("the rejected payload is archived outside the arm log dir",
    fs.existsSync(path.join(rejectedDir, "rejected-r1-attempt1.json")));
  ok("the error report is archived alongside it",
    fs.existsSync(path.join(rejectedDir, "errors-r1-attempt1.txt")));
  ok("no rejected artifact is written into the arm log dir",
    !fs.readdirSync(logs).some((f) => f.startsWith("rejected-") || f.startsWith("errors-")));

  // attempt 2: valid — the one permitted correction succeeds
  fs.writeFileSync(msgPath, JSON.stringify(validMessage()));
  const a2 = runGate();
  const r2 = JSON.parse(a2.stdout);
  ok("a corrected second attempt is accepted", a2.status === 0 && r2.ok === true, a2.stdout);
  ok("the attempt counter reports attempt 2", r2.attempt === 2);

  // a fresh round where BOTH attempts are invalid must abort, not loop
  const msgPath2 = path.join(logs, "critique-mock-r2.json");
  fs.writeFileSync(msgPath2, JSON.stringify(bad));
  const runGate2 = () => spawnSync(process.execPath, [
    INJECT, "--repo", repo, "--logs", logs, "--debate", "dbt-test", "--round", "2", "--dry-run"
  ], { encoding: "utf8" });
  const b1 = runGate2();
  ok("round 2 attempt 1 invalid exits 1", b1.status === 1);
  const b2 = runGate2();
  const rb2 = JSON.parse(b2.stdout);
  ok("round 2 attempt 2 invalid aborts with exit 3", b2.status === 3, `exit ${b2.status}`);
  ok("the abort is reported, not another correction offer",
    rb2.aborted === true && rb2.correctionPermitted === false);
  ok("the ledger is still untouched after the abort", fs.readFileSync(ledgerPath, "utf8") === ledgerBefore);

  fs.rmSync(tmp, { recursive: true, force: true });
}

section("11. the schema actually loaded is the frozen plugin schema");
{
  const { schemaText } = buildValidator();
  const parsed = JSON.parse(schemaText);
  ok("evidence is declared a string", parsed.properties.findings.items.properties.evidence.type === "string");
  ok("confidence is declared a number", parsed.properties.findings.items.properties.confidence.type === "number");
  ok("findings forbid additional properties", parsed.properties.findings.items.additionalProperties === false);
}

section("12. helpers are content-blind by construction");
{
  ok("categorize maps type errors", categorize({ keyword: "type" }) === "wrong-type");
  ok("categorize maps required errors", categorize({ keyword: "required" }) === "missing-required");
  ok("categorize maps additionalProperties", categorize({ keyword: "additionalProperties" }) === "undeclared-property");
  const rendered = renderError({ keyword: "type", instancePath: "/findings/0/evidence", params: { type: "string" }, message: "must be string" });
  ok("renderError emits path and expected type only", rendered.includes("/findings/0/evidence") && rendered.includes("string"));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
