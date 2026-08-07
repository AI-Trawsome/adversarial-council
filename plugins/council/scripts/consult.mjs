#!/usr/bin/env node
/**
 * consult.mjs — free-form document exchange with a persistent Codex thread.
 *
 * A utility, deliberately OUTSIDE the Review protocol: no schema, no ledger,
 * no verdicts. It exists to replace manual copy-paste of design docs, review
 * notes, and sign-off requests between Claude and Codex/GPT.
 *
 * Usage:
 *   node consult.mjs send --file <doc.md> [--message "framing text"] [--new-thread]
 *   node consult.mjs send --message "just a question, no file"
 *   node consult.mjs history          # list past exchanges
 *
 * State: <repoRoot>/.council/consult/thread.json (thread id) and
 *        <repoRoot>/.council/consult/NNN-<timestamp>.md (exchange log).
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { ensureGitRepository, getRepoRoot } from "./lib/git.mjs";
import { runAppServerTurn } from "./lib/codex.mjs";

function fail(message) {
  process.stderr.write(`consult error: ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === "--file" || t === "--message") {
      args[t.slice(2)] = argv[i + 1];
      i += 1;
    } else if (t.startsWith("--")) {
      args[t.slice(2)] = true;
    } else {
      args._.push(t);
    }
  }
  return args;
}

function consultDir(repoRoot) {
  const dir = path.join(repoRoot, ".council", "consult");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function loadThread(dir) {
  const file = path.join(dir, "thread.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { threadId: null, exchanges: 0 };
}

function saveThread(dir, state) {
  fs.writeFileSync(path.join(dir, "thread.json"), `${JSON.stringify(state, null, 2)}\n`);
}

async function cmdSend(args, repoRoot) {
  const dir = consultDir(repoRoot);
  const state = loadThread(dir);
  if (args["new-thread"]) {
    state.threadId = null;
  }

  let docText = "";
  let docName = null;
  if (args.file) {
    if (!fs.existsSync(args.file)) fail(`file not found: ${args.file}`);
    docText = fs.readFileSync(args.file, "utf8");
    docName = path.basename(args.file);
  }
  const framing = (args.message ?? "").trim();
  if (!docText && !framing) fail("provide --file, --message, or both");

  const prompt = [
    "You are GPT/Codex in an ongoing peer collaboration with Claude on the Adversarial AI Council project.",
    "This is the consult channel: a free-form document exchange, not a structured debate round.",
    "Reply as the reviewing peer, in markdown, directly and completely — your reply is delivered verbatim.",
    framing ? `\nMessage from Claude:\n${framing}` : "",
    docText ? `\n--- DOCUMENT: ${docName} ---\n${docText}\n--- END DOCUMENT ---` : ""
  ].filter(Boolean).join("\n");

  const result = await runAppServerTurn(repoRoot, {
    prompt,
    sandbox: "read-only",
    persistThread: true,
    threadName: state.threadId ? undefined : "council consult",
    resumeThreadId: state.threadId ?? undefined
  });

  state.threadId = result.threadId;
  state.exchanges += 1;
  saveThread(dir, state);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFile = path.join(dir, `${String(state.exchanges).padStart(3, "0")}-${stamp}.md`);
  fs.writeFileSync(logFile, [
    `# Consult exchange ${state.exchanges} — ${stamp}`,
    `Thread: ${state.threadId}`,
    docName ? `Document: ${docName}` : "Document: (none)",
    "",
    "## Sent",
    framing || "(document only)",
    "",
    "## Reply",
    result.finalMessage ?? "(no reply text)"
  ].join("\n"));

  process.stdout.write(`${result.finalMessage ?? "(no reply text)"}\n`);
  process.stderr.write(`\n[consult: exchange ${state.exchanges} logged to ${logFile}]\n`);
}

function cmdHistory(repoRoot) {
  const dir = consultDir(repoRoot);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  if (!files.length) {
    process.stdout.write("No consult exchanges yet.\n");
    return;
  }
  for (const f of files) process.stdout.write(`${path.join(dir, f)}\n`);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const cwd = process.cwd();
  ensureGitRepository(cwd);
  const repoRoot = getRepoRoot(cwd);
  switch (cmd) {
    case "send": return cmdSend(args, repoRoot);
    case "history": return cmdHistory(repoRoot);
    default: fail(`unknown command "${cmd ?? ""}". Use: send | history`);
  }
}

main().catch((error) => fail(error?.stack ?? String(error)));
