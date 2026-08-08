#!/usr/bin/env node
/**
 * make-scrubbed-checkout.mjs — benchmark harness (not part of the council plugin).
 *
 * Builds the review repository for one benchmark task per BENCHMARK-AMENDMENTS
 * A-002: the source tree exported at the buggy SHA into a freshly initialized,
 * history-free Git repository, plus a manifest proving the export is faithful.
 *
 * The property that matters: a reviewer standing inside the output directory
 * cannot reach the maintainer's fix commit by any means, because no object from
 * the source repository's history is present. Detaching HEAD at the buggy SHA
 * does not achieve this — the fix commit is still in the object store, one
 * `git show` away. Exporting the tree does.
 *
 * Files are written blob by blob from `git ls-tree`, not by `git archive`,
 * for one specific reason: `git archive` honours `export-ignore` attributes and
 * would silently drop paths, producing a checkout that does not match the tree
 * the manifest claims it matches.
 *
 * Usage:
 *   node make-scrubbed-checkout.mjs --repo <sourceClone> --buggy-sha <sha> --out <dir>
 *                                   [--task <id>] [--keep-agent-instructions]
 *
 * Writes <out>/ (the review repo) and <out>/../<task>-MANIFEST.json.
 * Prints control-plane JSON only — never file contents.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

// Deterministic identity and timestamps: same source tree in, same commit SHA
// out. Also keeps the operator's own name out of the reviewers' context.
const HARNESS_IDENTITY = { name: "Benchmark Harness", email: "harness@localhost" };
const FIXED_DATE = "2000-01-01T00:00:00Z";
const IMPORT_COMMIT_MESSAGE = "Initial import";

/**
 * Agent-instruction files are excluded by default, and this is the one
 * exclusion that is a judgment call rather than a mechanical rule.
 *
 * CLAUDE.md is read by Claude; AGENTS.md is read by Codex. Leaving both in the
 * checkout hands each arm a different set of repository-authored instructions —
 * an asymmetry in exactly the variable the benchmark holds constant. Several
 * of the task repositories ship one or both. Excluding them costs a little
 * fidelity to the original checkout; keeping them costs the comparison.
 *
 * Recorded in the manifest either way. `--keep-agent-instructions` restores them.
 */
const AGENT_INSTRUCTION_PATHS = [
  "CLAUDE.md",
  "CLAUDE.local.md",
  "AGENTS.md",
  "AGENT.md",
  ".cursorrules",
  ".windsurfrules",
  ".github/copilot-instructions.md"
];
const AGENT_INSTRUCTION_DIRS = [".claude/", ".codex/", ".cursor/", ".windsurf/", ".aider/"];

function arg(name, { required = true, fallback = null } = {}) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1] || process.argv[i + 1].startsWith("--")) {
    if (required) {
      process.stderr.write(`make-scrubbed-checkout: missing --${name}\n`);
      process.exit(2);
    }
    return fallback;
  }
  return process.argv[i + 1];
}

const flag = (name) => process.argv.includes(`--${name}`);

function git(cwd, args, { buffer = false } = {}) {
  return execFileSync("git", args, {
    cwd,
    encoding: buffer ? null : "utf8",
    maxBuffer: 512 * 1024 * 1024,
    shell: false
  });
}

function isAgentInstruction(filePath) {
  if (AGENT_INSTRUCTION_PATHS.includes(filePath)) return true;
  return AGENT_INSTRUCTION_DIRS.some((dir) => filePath.startsWith(dir));
}

/** Parse `git ls-tree -r -z --full-tree` into {mode, type, oid, path} records. */
function readTree(repo, sha) {
  const raw = git(repo, ["ls-tree", "-r", "-z", "--full-tree", sha]);
  return raw
    .split("\0")
    .filter(Boolean)
    .map((entry) => {
      const [meta, filePath] = entry.split("\t");
      const [mode, type, oid] = meta.split(/\s+/);
      return { mode, type, oid, path: filePath };
    });
}

function main() {
  const repo = path.resolve(arg("repo"));
  const buggySha = arg("buggy-sha");
  const out = path.resolve(arg("out"));
  const taskId = arg("task", { required: false, fallback: "TASK" });
  const keepAgentInstructions = flag("keep-agent-instructions");

  if (!fs.existsSync(path.join(repo, ".git"))) {
    process.stderr.write(`make-scrubbed-checkout: ${repo} is not a git repository\n`);
    process.exit(2);
  }
  if (fs.existsSync(out) && fs.readdirSync(out).length > 0) {
    process.stderr.write(`make-scrubbed-checkout: ${out} exists and is not empty — refusing to overwrite\n`);
    process.exit(2);
  }

  const resolvedSha = git(repo, ["rev-parse", `${buggySha}^{commit}`]).trim();
  const treeSha = git(repo, ["rev-parse", `${buggySha}^{tree}`]).trim();
  const entries = readTree(repo, resolvedSha);

  fs.mkdirSync(out, { recursive: true });

  const files = [];
  const exclusions = [];

  for (const entry of entries) {
    if (entry.type === "commit" || entry.mode === "160000") {
      // A gitlink would pull in submodule metadata, which the scrub spec bars.
      exclusions.push({ path: entry.path, reason: "submodule gitlink — submodule metadata excluded by scrub spec" });
      continue;
    }
    if (!keepAgentInstructions && isAgentInstruction(entry.path)) {
      exclusions.push({ path: entry.path, reason: "agent-instruction file — excluded to keep both arms' inputs symmetric" });
      continue;
    }

    const content = git(repo, ["cat-file", "blob", entry.oid], { buffer: true });
    const target = path.join(out, entry.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });

    if (entry.mode === "120000") {
      fs.symlinkSync(content.toString("utf8"), target);
    } else {
      fs.writeFileSync(target, content);
      if (entry.mode === "100755") fs.chmodSync(target, 0o755);
    }

    files.push({
      path: entry.path,
      mode: entry.mode,
      oid: entry.oid,
      bytes: content.length,
      sha256: crypto.createHash("sha256").update(content).digest("hex")
    });
  }

  // Fresh history. -f on the add because the tree's own .gitignore would
  // otherwise skip paths that were tracked in the source repository.
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: HARNESS_IDENTITY.name,
    GIT_AUTHOR_EMAIL: HARNESS_IDENTITY.email,
    GIT_COMMITTER_NAME: HARNESS_IDENTITY.name,
    GIT_COMMITTER_EMAIL: HARNESS_IDENTITY.email,
    GIT_AUTHOR_DATE: FIXED_DATE,
    GIT_COMMITTER_DATE: FIXED_DATE
  };
  const gitOut = (args) => execFileSync("git", args, { cwd: out, env, encoding: "utf8", shell: false });
  gitOut(["init", "-q", "-b", "main"]);
  gitOut(["add", "-A", "-f"]);
  gitOut(["commit", "-q", "-m", IMPORT_COMMIT_MESSAGE]);

  // Reflogs record the import; the spec bars them, and they serve no purpose
  // in a repository with exactly one commit.
  fs.rmSync(path.join(out, ".git", "logs"), { recursive: true, force: true });

  const importCommit = gitOut(["rev-parse", "HEAD"]).trim();
  const importTree = gitOut(["rev-parse", "HEAD^{tree}"]).trim();

  const manifest = {
    manifestVersion: 1,
    task: taskId,
    generatedAtUtc: new Date().toISOString(),
    amendment: "BENCHMARK-AMENDMENTS A-002",
    source: {
      repo,
      buggySha: resolvedSha,
      buggyTreeSha: treeSha
    },
    scrubbed: {
      path: out,
      importCommit,
      importTree,
      identity: HARNESS_IDENTITY,
      fixedDate: FIXED_DATE
    },
    policy: {
      agentInstructionsExcluded: !keepAgentInstructions,
      agentInstructionPaths: AGENT_INSTRUCTION_PATHS,
      agentInstructionDirs: AGENT_INSTRUCTION_DIRS
    },
    counts: {
      treeEntries: entries.length,
      filesExported: files.length,
      excluded: exclusions.length,
      totalBytes: files.reduce((sum, file) => sum + file.bytes, 0)
    },
    exclusions,
    files
  };

  const manifestPath = path.join(path.dirname(out), `${taskId}-MANIFEST.json`);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  process.stdout.write(
    `${JSON.stringify(
      {
        task: taskId,
        out,
        manifest: manifestPath,
        buggySha: resolvedSha,
        importCommit,
        filesExported: files.length,
        excluded: exclusions.length,
        agentInstructionsExcluded: !keepAgentInstructions
      },
      null,
      2
    )}\n`
  );
}

main();
