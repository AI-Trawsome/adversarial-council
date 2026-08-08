#!/usr/bin/env node
/**
 * stage-review-artifact.mjs — benchmark harness (not part of the council plugin).
 * Staging v2, countersigned in consult 004.
 *
 * Turns an audited scrubbed checkout into the repository a reviewer works in, by
 * staging the frozen artifact slice as the diff under review.
 *
 * v1 inferred where the slice sat by greedy subsequence matching. That was
 * rejected: on T01 the leftmost and rightmost embeddings differed at four
 * positions, so the stimulus was not fully determined by its inputs. v2 removes
 * inference entirely — the construction subagent already knew the exact ranges,
 * so it states them, and this program asserts rather than guesses. Every check
 * below is a hard failure; nothing rounds, chooses, or proceeds with a warning.
 *
 * CONTAMINATION BOUNDARY. The sidecar carries sourcePath, ranges, and source
 * hashes. Those locate the slice inside the file and must not reach the
 * orchestrating model before both arms close (consult 004 §1). This program
 * therefore reads the sidecar itself and prints only a non-locating verdict:
 * PASS/FAIL, counts, artifact and commit hashes, and the opaque staged path.
 * Full detail goes to a sealed manifest for the auditor and for grading.
 *
 * Usage:
 *   node stage-review-artifact.mjs --sidecar <ranges.json> --artifact <blob>
 *                                  --scrubbed <auditedDir> --out <reviewRepo>
 *                                  --framing <frozenTextFile> --sealed <manifest.json>
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const HARNESS_IDENTITY = { name: "Benchmark Harness", email: "harness@localhost" };
const FIXED_DATE = "2000-01-01T00:00:00Z";
const STAGING_POLICY_VERSION = 2;

const SIDECAR_KEYS = new Set([
  "task", "sourcePath", "buggySha", "sourceFileSha256", "artifactSha256",
  "lineNumbering", "ranges", "artifactContentLines", "sourceEndsWithNewline"
]);

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1] || process.argv[i + 1].startsWith("--")) {
    process.stderr.write(`stage-review-artifact: missing --${name}\n`);
    process.exit(2);
  }
  return process.argv[i + 1];
}

function die(message) {
  // Deliberately terse and non-locating: failure messages are read by the
  // orchestrator, so they may not name paths or ranges inside the source file.
  process.stderr.write(`stage-review-artifact: FAIL — ${message}\n`);
  process.exit(1);
}

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

const sidecarPath = path.resolve(arg("sidecar"));
const artifactPath = path.resolve(arg("artifact"));
const scrubbed = path.resolve(arg("scrubbed"));
const out = path.resolve(arg("out"));
const framingPath = path.resolve(arg("framing"));
const sealedPath = path.resolve(arg("sealed"));

if (fs.existsSync(out)) die("output directory already exists");

const sidecar = JSON.parse(fs.readFileSync(sidecarPath, "utf8"));

// Closed schema. Anything outside the allowed keys is a channel for prose the
// orchestrator must not receive, so its presence is fatal rather than ignored.
for (const key of Object.keys(sidecar)) {
  if (!SIDECAR_KEYS.has(key)) die("sidecar contains a key outside the closed schema");
}
for (const key of ["task", "sourcePath", "buggySha", "sourceFileSha256", "artifactSha256", "ranges", "artifactContentLines"]) {
  if (sidecar[key] === undefined) die(`sidecar is missing a required field (${key === "ranges" ? "ranges" : "an identifier"})`);
}

const artifactBytes = fs.readFileSync(artifactPath);
const artifactSha = sha256(artifactBytes);
if (artifactSha !== sidecar.artifactSha256) die("artifact hash does not match the sidecar");

fs.cpSync(scrubbed, out, { recursive: true, verbatimSymlinks: true });

const targetFile = path.join(out, sidecar.sourcePath);
if (!fs.existsSync(targetFile)) die("declared source path is not present in the scrubbed checkout");

const sourceBytes = fs.readFileSync(targetFile);
const sourceSha = sha256(sourceBytes);
if (sourceSha !== sidecar.sourceFileSha256) die("source file hash does not match the sidecar");

const endsWithNewline = sourceBytes.length > 0 && sourceBytes[sourceBytes.length - 1] === 0x0a;
if (sidecar.sourceEndsWithNewline !== undefined && sidecar.sourceEndsWithNewline !== endsWithNewline) {
  die("declared final-newline state does not match the source file");
}

// Content lines, not split() elements: a trailing newline terminates the last
// line, it does not begin another. Conflating the two is what produced v1's
// unreconciled 444-vs-445 count.
const text = sourceBytes.toString("utf8");
const lines = text.split("\n");
if (endsWithNewline) lines.pop();

// Ranges: 1-based, inclusive, ascending, non-overlapping, in bounds.
let previousEnd = 0;
for (const range of sidecar.ranges) {
  if (!Number.isInteger(range.start) || !Number.isInteger(range.end)) die("a range bound is not an integer");
  if (range.start < 1 || range.end < range.start || range.end > lines.length) die("a range is out of bounds or empty");
  if (range.start <= previousEnd) die("ranges are not ascending and non-overlapping");
  previousEnd = range.end;
}

const selected = [];
for (const range of sidecar.ranges) {
  for (let i = range.start - 1; i <= range.end - 1; i += 1) selected.push(i);
}

// Assertion 1: the ranges reconstruct the frozen artifact byte for byte.
const reconstructed = Buffer.from(selected.map((i) => lines[i]).join("\n") + (endsWithNewline ? "\n" : ""), "utf8");
if (sha256(reconstructed) !== artifactSha) die("range concatenation is not byte-identical to the frozen artifact");
if (selected.length !== sidecar.artifactContentLines) die("declared artifact line count disagrees with the ranges");

// Synthetic base: the source minus exactly those lines. Never executed, never
// tested, never evidence about prior behaviour — it exists only to give the
// slice something to be a diff against.
const removed = new Set(selected);
const baseLines = lines.filter((_, index) => !removed.has(index));
fs.writeFileSync(targetFile, baseLines.join("\n") + (endsWithNewline ? "\n" : ""));

const env = {
  ...process.env,
  GIT_AUTHOR_NAME: HARNESS_IDENTITY.name,
  GIT_AUTHOR_EMAIL: HARNESS_IDENTITY.email,
  GIT_COMMITTER_NAME: HARNESS_IDENTITY.name,
  GIT_COMMITTER_EMAIL: HARNESS_IDENTITY.email,
  GIT_AUTHOR_DATE: FIXED_DATE,
  GIT_COMMITTER_DATE: FIXED_DATE
};
const git = (args) => execFileSync("git", args, { cwd: out, env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, shell: false });

const scrubbedImportCommit = git(["rev-parse", "HEAD"]).trim();
git(["add", "-A", "-f"]);
git(["commit", "-q", "--amend", "--no-edit"]);
fs.rmSync(path.join(out, ".git", "logs"), { recursive: true, force: true });
const baseCommit = git(["rev-parse", "HEAD"]).trim();

// Assertion 2: restoring the ranges reproduces the audited working tree exactly.
fs.writeFileSync(targetFile, sourceBytes);
const workingTreeSha = sha256(fs.readFileSync(targetFile));
if (workingTreeSha !== sourceSha) die("working tree does not match the audited checkout after staging");

// Assertion 3: the diff is exactly the artifact, and nothing else.
const numstat = git(["diff", "--numstat"]).trim().split("\n").filter(Boolean);
if (numstat.length !== 1) die("expected exactly one changed path in the staged diff");
const [addedRaw, deletedRaw] = numstat[0].split("\t");
const diffAdded = Number(addedRaw);
const diffDeleted = Number(deletedRaw);
if (diffDeleted !== 0) die("staged diff contains deletions");
if (diffAdded !== sidecar.artifactContentLines) die("diff addition count does not equal the artifact line count");

const rawDiff = git(["diff", "-U0"]);
if (rawDiff.includes("\\ No newline at end of file")) die("staged diff contains a no-newline marker");
const addedLines = rawDiff.split("\n").filter((line) => line.startsWith("+") && !line.startsWith("+++")).map((line) => line.slice(1));
const canonicalPayload = Buffer.from(addedLines.join("\n") + (endsWithNewline ? "\n" : ""), "utf8");
if (sha256(canonicalPayload) !== artifactSha) die("canonical added-line payload is not byte-identical to the frozen artifact");

const framingBytes = fs.readFileSync(framingPath);

const sealed = {
  stagingPolicyVersion: STAGING_POLICY_VERSION,
  task: sidecar.task,
  generatedAtUtc: new Date().toISOString(),
  sourcePath: sidecar.sourcePath,
  buggySha: sidecar.buggySha,
  sourceFileSha256: sourceSha,
  artifactSha256: artifactSha,
  ranges: sidecar.ranges,
  artifactContentLines: sidecar.artifactContentLines,
  sourceEndsWithNewline: endsWithNewline,
  diffAddedLines: diffAdded,
  diffDeletedLines: diffDeleted,
  noNewlineMarkers: 0,
  scrubbedImportCommit,
  baseCommit,
  workingTreeFileSha256: workingTreeSha,
  canonicalPayloadSha256: sha256(canonicalPayload),
  framingTextSha256: sha256(framingBytes),
  reconstructionProof: {
    rangeConcatenationMatchesArtifact: true,
    workingTreeMatchesAuditedCheckout: true,
    canonicalDiffPayloadMatchesArtifact: true,
    additionCountEqualsArtifactLines: true,
    method: "sha256 over range concatenation, restored working tree, and canonical added-line payload"
  },
  stagedPath: out
};
fs.writeFileSync(sealedPath, `${JSON.stringify(sealed, null, 2)}\n`);

// Control-plane only. No sourcePath, no ranges, no source hash.
process.stdout.write(
  `${JSON.stringify(
    {
      verdict: "PASS",
      task: sidecar.task,
      stagedPath: out,
      baseCommit,
      artifactSha256: artifactSha,
      artifactContentLines: sidecar.artifactContentLines,
      diffAddedLines: diffAdded,
      diffDeletedLines: diffDeleted,
      withinWindow: diffAdded >= 30 && diffAdded <= 500,
      framingTextSha256: sha256(framingBytes),
      sealedManifest: sealedPath,
      assertions: "all passed"
    },
    null,
    2
  )}\n`
);
