#!/usr/bin/env node
/**
 * audit-scrubbed-checkout.mjs — benchmark harness (not part of the council plugin).
 *
 * Independently verifies a review repository built by make-scrubbed-checkout.mjs,
 * per BENCHMARK-AMENDMENTS A-002. It re-derives everything it checks rather than
 * trusting the constructor: content hashes are recomputed, blob ids are recomputed
 * with `git hash-object`, and the file set is compared in both directions.
 *
 * The decisive check is `--forbidden-sha`: the maintainer's fix commit must not
 * resolve inside the scrubbed repository. That single assertion is the isolation
 * property the whole amendment exists to establish. Everything else guards the
 * ways it could be true by accident today and false tomorrow.
 *
 * Output is a verdict, counts, and failure reasons — never file contents, never
 * anything about the defect. Safe for a contamination-sensitive orchestrator to read.
 *
 * Usage:
 *   node audit-scrubbed-checkout.mjs --out <dir> --manifest <file>
 *                                    [--repo <sourceClone>] [--forbidden-sha <sha>]
 *
 * Exit code 0 = PASS, 1 = FAIL, 2 = usage error.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

import { POLICY_VERSION, RULES, classifyPath } from "./exclusion-policy.mjs";

const checks = [];
const record = (name, ok, detail = "") => checks.push({ name, ok, detail });

function arg(name, { required = true, fallback = null } = {}) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1] || process.argv[i + 1].startsWith("--")) {
    if (required) {
      process.stderr.write(`audit-scrubbed-checkout: missing --${name}\n`);
      process.exit(2);
    }
    return fallback;
  }
  return process.argv[i + 1];
}

function gitTry(cwd, args) {
  try {
    return { ok: true, stdout: execFileSync("git", args, { cwd, encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "ignore"] }) };
  } catch (error) {
    return { ok: false, stdout: "", error };
  }
}

/** Every file in the working tree except .git itself. */
function walk(root, base = "") {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, base), { withFileTypes: true })) {
    const rel = base ? path.join(base, entry.name) : entry.name;
    if (rel === ".git") continue;
    if (entry.isDirectory()) out.push(...walk(root, rel));
    else out.push(rel);
  }
  return out;
}

const out = path.resolve(arg("out"));
const manifestPath = path.resolve(arg("manifest"));
const sourceRepo = arg("repo", { required: false });
const forbiddenSha = arg("forbidden-sha", { required: false });

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

// ---------- 1. the isolation property ----------

if (forbiddenSha) {
  const reachable = gitTry(out, ["cat-file", "-e", `${forbiddenSha}^{commit}`]).ok;
  record("fix commit is unreachable in the scrubbed repo", !reachable,
    reachable ? "FIX COMMIT RESOLVES — isolation is broken, do not use this checkout" : "");
} else {
  record("fix commit unreachability", false, "no --forbidden-sha supplied; the decisive check did not run");
}

const allObjects = gitTry(out, ["rev-list", "--all", "--count"]);
record("scrubbed repo has exactly one commit", allObjects.ok && allObjects.stdout.trim() === "1",
  allObjects.ok ? `rev-list --all --count = ${allObjects.stdout.trim()}` : "rev-list failed");

// ---------- 2. no route back to the source history ----------

const gitDir = path.join(out, ".git");
const mustNotExist = [
  ["objects/info/alternates", "alternates file"],
  ["info/alternates", "alternates file"],
  ["info/grafts", "grafts file"],
  ["logs", "reflogs"],
  ["worktrees", "linked worktrees"],
  ["modules", "submodule metadata"],
  ["packed-refs", "packed refs inherited from a source repo"]
];
for (const [rel, label] of mustNotExist) {
  const exists = fs.existsSync(path.join(gitDir, rel));
  record(`no ${label}`, !exists, exists ? `${rel} present` : "");
}

const remotes = gitTry(out, ["remote"]).stdout.trim();
record("no remotes", remotes === "", remotes);

const tags = gitTry(out, ["tag", "-l"]).stdout.trim();
record("no tags", tags === "", tags);

const branches = gitTry(out, ["for-each-ref", "--format=%(refname)", "refs/heads"]).stdout.trim().split("\n").filter(Boolean);
record("exactly one branch", branches.length === 1, branches.join(", "));

const replaceRefs = gitTry(out, ["for-each-ref", "--format=%(refname)", "refs/replace"]).stdout.trim();
record("no replace refs", replaceRefs === "", replaceRefs);

const otherRefs = gitTry(out, ["for-each-ref", "--format=%(refname)"]).stdout.trim().split("\n").filter(Boolean)
  .filter((ref) => !ref.startsWith("refs/heads/"));
record("no refs outside refs/heads", otherRefs.length === 0, otherRefs.join(", "));

// ---------- 3. the export is faithful to the buggy tree ----------

const onDisk = walk(out).sort();
const inManifest = manifest.files.map((file) => file.path).sort();

const missing = inManifest.filter((p) => !onDisk.includes(p));
const extra = onDisk.filter((p) => !inManifest.includes(p));
record("no manifest file missing from disk", missing.length === 0, missing.slice(0, 5).join(", "));
record("no file on disk outside the manifest", extra.length === 0, extra.slice(0, 5).join(", "));

let contentMismatches = 0;
let oidMismatches = 0;
for (const file of manifest.files) {
  const target = path.join(out, file.path);
  if (!fs.existsSync(target)) continue;
  const stat = fs.lstatSync(target);
  const content = stat.isSymbolicLink() ? Buffer.from(fs.readlinkSync(target), "utf8") : fs.readFileSync(target);

  if (crypto.createHash("sha256").update(content).digest("hex") !== file.sha256) contentMismatches += 1;

  // Recompute the blob id from the bytes on disk. Matching the id recorded in
  // the source tree is what proves the export is the buggy tree's content and
  // not something similar to it.
  const oid = execFileSync("git", ["hash-object", "-t", "blob", "--no-filters", "--stdin"], {
    input: content, encoding: "utf8", shell: false
  }).trim();
  if (oid !== file.oid) oidMismatches += 1;
}
record("every file's content hash matches the manifest", contentMismatches === 0, `${contentMismatches} mismatch(es)`);
record("every file's blob id matches the source tree", oidMismatches === 0, `${oidMismatches} mismatch(es)`);

if (sourceRepo) {
  const treeCheck = gitTry(path.resolve(sourceRepo), ["rev-parse", `${manifest.source.buggySha}^{tree}`]);
  record("manifest tree id matches the source repo at the buggy SHA",
    treeCheck.ok && treeCheck.stdout.trim() === manifest.source.buggyTreeSha,
    treeCheck.ok ? treeCheck.stdout.trim() : "rev-parse failed");
} else {
  record("manifest tree id cross-checked against source repo", true, "skipped: no --repo supplied");
}

// ---------- 4. the exclusion policy, verified in both directions ----------

// The A-002 extension requires both halves. Checking only that matched paths
// were removed would pass an over-broad scrub that deleted half the repository;
// checking only that removals were justified would pass a scrub that missed an
// instruction file entirely. Neither failure is visible from the other side.

if (manifest.policy?.agentInstructionsExcluded) {
  record("manifest policy version matches this auditor", manifest.policy.policyVersion === POLICY_VERSION,
    `manifest ${manifest.policy.policyVersion} vs auditor ${POLICY_VERSION}`);

  // (a) Nothing the policy matches survived in the checkout.
  const survivors = onDisk.filter((filePath) => classifyPath(filePath).excluded);
  record("no policy-matched path survives in the checkout", survivors.length === 0, survivors.slice(0, 5).join(", "));

  // (b) Nothing outside the policy was removed. Every recorded exclusion must
  // be one the policy independently produces, with the same rule.
  const policyExclusions = manifest.exclusions.filter((item) => item.rule !== RULES.SUBMODULE);
  const unjustified = policyExclusions.filter((item) => {
    const verdict = classifyPath(item.path);
    return !verdict.excluded || verdict.rule !== item.rule;
  });
  record("every exclusion is one the policy independently produces", unjustified.length === 0,
    unjustified.slice(0, 5).map((item) => `${item.path} (recorded ${item.rule})`).join(", "));

  // (c) Excluded paths carry blob identity, so a third party can prove what went.
  const withoutIdentity = policyExclusions.filter((item) => !item.oid || !item.sha256 || typeof item.bytes !== "number");
  record("excluded paths record blob identity and hash", withoutIdentity.length === 0,
    withoutIdentity.slice(0, 5).map((item) => item.path).join(", "));

  // (d) Against the source tree: exported ∪ excluded must be the whole tree,
  // and every path the policy matches there must appear in the exclusions.
  if (sourceRepo) {
    const raw = execFileSync("git", ["ls-tree", "-r", "-z", "--full-tree", manifest.source.buggySha], {
      cwd: path.resolve(sourceRepo), encoding: "utf8", maxBuffer: 512 * 1024 * 1024, shell: false
    });
    const sourcePaths = raw.split("\0").filter(Boolean).map((entry) => entry.split("\t")[1]);
    const accountedFor = new Set([...inManifest, ...manifest.exclusions.map((item) => item.path)]);
    const unaccounted = sourcePaths.filter((filePath) => !accountedFor.has(filePath));
    record("every source-tree path is either exported or recorded as excluded", unaccounted.length === 0,
      unaccounted.slice(0, 5).join(", "));

    const recordedExclusions = new Set(manifest.exclusions.map((item) => item.path));
    const missedByScrub = sourcePaths.filter((filePath) => classifyPath(filePath).excluded && !recordedExclusions.has(filePath));
    record("every policy-matched source path was excluded", missedByScrub.length === 0,
      missedByScrub.slice(0, 5).join(", "));
  } else {
    record("exclusion policy cross-checked against source tree", true, "skipped: no --repo supplied");
  }
} else {
  record("exclusion policy verified", true, "skipped: manifest records agent instructions were retained");
}

// ---------- 5. the working tree is clean ----------

const status = gitTry(out, ["status", "--porcelain", "--untracked-files=all"]).stdout.trim();
record("scrubbed repo working tree is clean", status === "", status.split("\n").slice(0, 5).join("; "));

// ---------- verdict ----------

const failures = checks.filter((check) => !check.ok);
const verdict = failures.length === 0 ? "PASS" : "FAIL";

process.stdout.write(`${JSON.stringify({
  verdict,
  task: manifest.task,
  checks: checks.length,
  failed: failures.length,
  filesAudited: manifest.files.length,
  excluded: manifest.counts.excluded,
  agentInstructionsExcluded: manifest.policy?.agentInstructionsExcluded ?? null,
  policyVersion: manifest.policy?.policyVersion ?? null,
  declaredLimitation: manifest.policy?.limitation ? "present" : "ABSENT",
  failures: failures.map((check) => ({ check: check.name, detail: check.detail }))
}, null, 2)}\n`);

process.exit(verdict === "PASS" ? 0 : 1);
