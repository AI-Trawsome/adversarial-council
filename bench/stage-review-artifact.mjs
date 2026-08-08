#!/usr/bin/env node
/**
 * stage-review-artifact.mjs — benchmark harness (not part of the council plugin).
 *
 * Turns an audited scrubbed checkout into the repository a reviewer actually
 * works in, by staging the frozen artifact slice as the change under review.
 *
 * Why this step exists. A-002 gives reviewers a scrubbed full checkout; Appendix
 * A defines the artifact as a code slice of 30–500 lines; the consult ruling asks
 * for "a scrubbed buggy-SHA checkout plus the frozen review diff/artifact". A
 * repository whose only content is the buggy tree cannot produce a diff at all —
 * there is nothing to diff against. So the base commit holds the buggy tree with
 * the artifact's own lines elided, and the working tree holds the faithful buggy
 * tree. `git diff` is then exactly the artifact slice, presented as the change
 * under review, while every other file is present and correct for context.
 *
 * The elided base commit is never executed and is not the object of review; it
 * exists only to give the slice something to be a diff against. What reviewers
 * read and run is the working tree, and this script proves the working tree is
 * byte-identical to the audited scrubbed checkout before it exits.
 *
 * The slice's line positions are derived mechanically by subsequence matching,
 * never read from the construction record — the orchestrator running this must
 * not learn where the defect lives.
 *
 * Usage:
 *   node stage-review-artifact.mjs --scrubbed <auditedDir> --artifact <sliceFile>
 *                                  --path <repoRelativePath> --out <reviewRepo>
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const HARNESS_IDENTITY = { name: "Benchmark Harness", email: "harness@localhost" };
const FIXED_DATE = "2000-01-01T00:00:00Z";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1] || process.argv[i + 1].startsWith("--")) {
    process.stderr.write(`stage-review-artifact: missing --${name}\n`);
    process.exit(2);
  }
  return process.argv[i + 1];
}

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

const scrubbed = path.resolve(arg("scrubbed"));
const artifactFile = path.resolve(arg("artifact"));
const artifactPath = arg("path");
const out = path.resolve(arg("out"));

if (fs.existsSync(out)) {
  process.stderr.write(`stage-review-artifact: ${out} already exists — refusing to overwrite\n`);
  process.exit(2);
}

fs.cpSync(scrubbed, out, { recursive: true, verbatimSymlinks: true });

const targetFile = path.join(out, artifactPath);
const originalBytes = fs.readFileSync(targetFile);
const originalSha = sha256(originalBytes);
const originalLines = originalBytes.toString("utf8").split("\n");
const artifactLines = fs.readFileSync(artifactFile, "utf8").split("\n");

// Ordered-subsequence match. Positions are computed, never read from the
// construction record; nothing about them is printed.
const keptIndices = [];
let cursor = 0;
for (const line of artifactLines) {
  let found = false;
  while (cursor < originalLines.length) {
    if (originalLines[cursor] === line) {
      keptIndices.push(cursor);
      cursor += 1;
      found = true;
      break;
    }
    cursor += 1;
  }
  if (!found) {
    process.stderr.write(
      `stage-review-artifact: artifact is not an ordered subsequence of ${artifactPath} at the buggy SHA — refusing to stage\n`
    );
    process.exit(1);
  }
}

const kept = new Set(keptIndices);
const elided = originalLines.filter((_, index) => !kept.has(index)).join("\n");
fs.writeFileSync(targetFile, elided);

const env = {
  ...process.env,
  GIT_AUTHOR_NAME: HARNESS_IDENTITY.name,
  GIT_AUTHOR_EMAIL: HARNESS_IDENTITY.email,
  GIT_COMMITTER_NAME: HARNESS_IDENTITY.name,
  GIT_COMMITTER_EMAIL: HARNESS_IDENTITY.email,
  GIT_AUTHOR_DATE: FIXED_DATE,
  GIT_COMMITTER_DATE: FIXED_DATE
};
const git = (args) => execFileSync("git", args, { cwd: out, env, encoding: "utf8", shell: false });

// --amend, not a second commit: the scrubbed repo's one-commit property is an
// audited invariant, and a deletion commit would also read as history.
git(["add", "-A", "-f"]);
git(["commit", "-q", "--amend", "--no-edit"]);
fs.rmSync(path.join(out, ".git", "logs"), { recursive: true, force: true });
const baseCommit = git(["rev-parse", "HEAD"]).trim();

// Restore the faithful buggy tree. This is what reviewers read and run.
fs.writeFileSync(targetFile, originalBytes);

const restoredSha = sha256(fs.readFileSync(targetFile));
if (restoredSha !== originalSha) {
  process.stderr.write("stage-review-artifact: working tree does not match the audited checkout after staging\n");
  process.exit(1);
}

const status = git(["status", "--porcelain", "--untracked-files=all"]).trim().split("\n").filter(Boolean);
if (status.length !== 1 || !status[0].endsWith(artifactPath)) {
  process.stderr.write(`stage-review-artifact: expected exactly one modified path, got ${status.length}\n`);
  process.exit(1);
}

const diffStat = git(["diff", "--numstat"]).trim().split("\t");
const added = Number(diffStat[0]);

process.stdout.write(
  `${JSON.stringify(
    {
      out,
      artifactPath,
      baseCommit,
      diffAddedLines: added,
      withinWindow: added >= 30 && added <= 500,
      workingTreeMatchesAuditedCheckout: true,
      artifactSha256: sha256(fs.readFileSync(artifactFile)),
      fileSha256AtBuggySha: originalSha
    },
    null,
    2
  )}\n`
);
