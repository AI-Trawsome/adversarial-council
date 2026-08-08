#!/usr/bin/env node
/**
 * audit-staging.mjs — benchmark harness (not part of the council plugin).
 *
 * Independently re-derives every staging invariant from the staged repository
 * and the sealed manifest, per consult 004. It trusts nothing the staging
 * program reported: hashes are recomputed, the diff is re-read from git, and the
 * base/working-tree relationship is checked from the repository itself.
 *
 * This program sits inside the contamination boundary — it reads the sealed
 * manifest, which carries locating fields — and emits only a non-locating
 * verdict, so its output is safe for the orchestrator.
 *
 * Usage:
 *   node audit-staging.mjs --staged <dir> --sealed <manifest.json>
 *                          --artifact <blob> --framing <frozenTextFile>
 * Exit 0 = PASS, 1 = FAIL, 2 = usage error.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const checks = [];
const record = (name, ok, detail = "") => checks.push({ name, ok, detail });
const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1] || process.argv[i + 1].startsWith("--")) {
    process.stderr.write(`audit-staging: missing --${name}\n`);
    process.exit(2);
  }
  return process.argv[i + 1];
}

const staged = path.resolve(arg("staged"));
const sealed = JSON.parse(fs.readFileSync(path.resolve(arg("sealed")), "utf8"));
const artifactBytes = fs.readFileSync(path.resolve(arg("artifact")));
const framingBytes = fs.readFileSync(path.resolve(arg("framing")));

const git = (args) => execFileSync("git", args, { cwd: staged, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, shell: false });

const artifactSha = sha256(artifactBytes);
record("artifact hash matches the sealed manifest", artifactSha === sealed.artifactSha256);
record("framing text hash matches the sealed manifest", sha256(framingBytes) === sealed.framingTextSha256);

// 1. The working tree is the audited buggy-SHA content.
const targetFile = path.join(staged, sealed.sourcePath);
const workingBytes = fs.readFileSync(targetFile);
record("working tree file matches the buggy-SHA source", sha256(workingBytes) === sealed.sourceFileSha256);

// 2. The base differs from the working tree only by removal of the exact ranges.
const endsWithNewline = sealed.sourceEndsWithNewline;
const lines = workingBytes.toString("utf8").split("\n");
if (endsWithNewline) lines.pop();

const selected = [];
let previousEnd = 0;
let rangesWellFormed = true;
for (const range of sealed.ranges) {
  if (range.start <= previousEnd || range.end < range.start || range.end > lines.length) rangesWellFormed = false;
  previousEnd = range.end;
  for (let i = range.start - 1; i <= range.end - 1; i += 1) selected.push(i);
}
record("ranges are ascending, non-overlapping and in bounds", rangesWellFormed);
record("range count matches the declared artifact line count", selected.length === sealed.artifactContentLines);

const reconstructed = Buffer.from(selected.map((i) => lines[i]).join("\n") + (endsWithNewline ? "\n" : ""), "utf8");
record("range concatenation reconstructs the artifact byte for byte", sha256(reconstructed) === artifactSha);

const removed = new Set(selected);
const expectedBase = Buffer.from(lines.filter((_, i) => !removed.has(i)).join("\n") + (endsWithNewline ? "\n" : ""), "utf8");
const actualBase = execFileSync("git", ["show", `HEAD:${sealed.sourcePath}`], { cwd: staged, maxBuffer: 256 * 1024 * 1024, shell: false });
record("base commit equals the source minus exactly those ranges", sha256(actualBase) === sha256(expectedBase));

// 3. The diff is exactly the artifact, and nothing else.
const numstat = git(["diff", "--numstat"]).trim().split("\n").filter(Boolean);
record("exactly one changed path", numstat.length === 1, numstat.join(" | "));
if (numstat.length === 1) {
  const [added, deleted] = numstat[0].split("\t");
  record("diff has no deletions", Number(deleted) === 0, deleted);
  record("diff addition count equals the artifact line count",
    Number(added) === sealed.artifactContentLines, `${added} vs ${sealed.artifactContentLines}`);
}

const rawDiff = git(["diff", "-U0"]);
record("diff contains no no-newline marker", !rawDiff.includes("\\ No newline at end of file"));

const addedLines = rawDiff.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).map((l) => l.slice(1));
const canonical = Buffer.from(addedLines.join("\n") + (endsWithNewline ? "\n" : ""), "utf8");
record("canonical added-line payload is byte-identical to the artifact", sha256(canonical) === artifactSha);
record("canonical payload hash matches the sealed manifest", sha256(canonical) === sealed.canonicalPayloadSha256);

// 4. The repository is still the audited, history-free one.
const commitCount = git(["rev-list", "--all", "--count"]).trim();
record("staged repo still has exactly one commit", commitCount === "1", commitCount);
record("no reflogs", !fs.existsSync(path.join(staged, ".git", "logs")));
record("base commit matches the sealed manifest", git(["rev-parse", "HEAD"]).trim() === sealed.baseCommit);

const failures = checks.filter((check) => !check.ok);
const verdict = failures.length === 0 ? "PASS" : "FAIL";

// Non-locating output: check names only, never paths or ranges.
process.stdout.write(`${JSON.stringify({
  verdict,
  task: sealed.task,
  checks: checks.length,
  failed: failures.length,
  artifactContentLines: sealed.artifactContentLines,
  diffAddedLines: sealed.diffAddedLines,
  failures: failures.map((check) => check.name)
}, null, 2)}\n`);

process.exit(verdict === "PASS" ? 0 : 1);
