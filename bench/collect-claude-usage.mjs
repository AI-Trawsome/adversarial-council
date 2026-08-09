#!/usr/bin/env node
/**
 * collect-claude-usage.mjs — benchmark harness (not part of the council plugin).
 *
 * Persists Claude-side token usage into the run archive, per consult 003 §2.
 *
 * The problem it fixes: Codex usage is captured by the runner and written to
 * debate.json, so it is reproducible from committed artifacts. Claude usage was
 * only ever reported transiently to the orchestrator and transcribed by hand —
 * not equivalent evidence, and S3 compares the two. This program reads the
 * authoritative per-subagent transcripts the agent harness writes to disk and
 * copies the raw usage payloads verbatim into the task's run record.
 *
 * Nothing here is estimated or reconstructed. If a transcript is missing, that
 * invocation is recorded with status "missing" rather than filled in.
 *
 * Usage:
 *   node collect-claude-usage.mjs --roster <roster.json> --out <usage.json>
 *                                 [--transcripts <dir>]
 *
 * The roster maps each Claude invocation to its identity, and is written by the
 * orchestrator as the run proceeds:
 *   { "task":"T01", "invocations":[
 *       {"agentId":"a1b2…","arm":"B","role":"defender","round":1,"attempt":1} ] }
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

function arg(name, { required = true, fallback = null } = {}) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1] || process.argv[i + 1].startsWith("--")) {
    if (required) {
      process.stderr.write(`collect-claude-usage: missing --${name}\n`);
      process.exit(2);
    }
    return fallback;
  }
  return process.argv[i + 1];
}

const roster = JSON.parse(fs.readFileSync(path.resolve(arg("roster")), "utf8"));
const outPath = path.resolve(arg("out"));
const transcriptDir = arg("transcripts", { required: false, fallback: null });

/** Locate the subagent transcript directory the harness writes. */
function findTranscriptDirs() {
  if (transcriptDir) return [path.resolve(transcriptDir)];
  const projectsRoot = path.join(os.homedir(), ".claude", "projects");
  if (!fs.existsSync(projectsRoot)) return [];
  const dirs = [];
  for (const project of fs.readdirSync(projectsRoot)) {
    const sessions = path.join(projectsRoot, project);
    if (!fs.statSync(sessions).isDirectory()) continue;
    for (const entry of fs.readdirSync(sessions)) {
      const candidate = path.join(sessions, entry, "subagents");
      if (fs.existsSync(candidate)) dirs.push(candidate);
    }
  }
  return dirs;
}

const dirs = findTranscriptDirs();

function transcriptFor(agentId) {
  for (const dir of dirs) {
    const file = path.join(dir, `agent-${agentId}.jsonl`);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

/**
 * Every assistant message's raw usage payload, verbatim and in order.
 * Kept per message rather than pre-summed because a subagent turn is many
 * messages and the provider reports cache reads and writes per message; a
 * single total would discard the distinction S3 may need to normalize over.
 */
function readUsage(file) {
  const messages = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }
    if (record.type !== "assistant") continue;
    const usage = record.message?.usage;
    if (!usage) continue;
    messages.push({
      uuid: record.uuid ?? null,
      timestamp: record.timestamp ?? null,
      model: record.message?.model ?? null,
      requestId: record.requestId ?? null,
      usage
    });
  }
  return messages;
}

/**
 * Collapse the transcript's per-content-block records into one record per API
 * call.
 *
 * The harness writes one assistant record per streamed content block, and every
 * record in a call repeats that call's usage snapshot: the input side is
 * byte-identical across the group, while `output_tokens` grows to its final
 * value on the last record. Summing over records therefore bills one call's
 * input and cache tokens once per block and double-counts output as well —
 * on this run, 1442 records for 717 actual calls, inflating modeled cost ~1.7x.
 *
 * Correct aggregation: group by `requestId`, take the input side once, and take
 * output as the maximum (the final cumulative snapshot). Records without a
 * requestId are treated as their own call rather than merged.
 */
function collapseToApiCalls(messages) {
  const groups = new Map();
  for (const [index, message] of messages.entries()) {
    const key = message.requestId ?? `__no_request_id__${index}`;
    (groups.get(key) ?? groups.set(key, []).get(key)).push(message);
  }
  const calls = [];
  for (const group of groups.values()) {
    const first = group[0].usage ?? {};
    const outputs = group.map((m) => m.usage?.output_tokens).filter((v) => typeof v === "number");
    calls.push({
      ...first,
      output_tokens: outputs.length ? Math.max(...outputs) : undefined
    });
  }
  return calls;
}

/** Deterministic aggregation. Absent fields stay absent — never zero-filled. */
function aggregate(messages) {
  const fields = ["input_tokens", "output_tokens", "cache_read_input_tokens", "cache_creation_input_tokens"];
  const totals = {};
  for (const usage of collapseToApiCalls(messages)) {
    for (const field of fields) {
      const value = usage?.[field];
      if (typeof value !== "number") continue;
      totals[field] = (totals[field] ?? 0) + value;
    }
  }
  if (Object.keys(totals).length === 0) return null;
  const billable = ["input_tokens", "output_tokens", "cache_read_input_tokens", "cache_creation_input_tokens"]
    .reduce((sum, field) => (typeof totals[field] === "number" ? sum + totals[field] : sum), 0);
  return { ...totals, summedAllFields: billable };
}

const invocations = roster.invocations.map((invocation) => {
  const file = transcriptFor(invocation.agentId);
  if (!file) {
    return { ...invocation, status: "missing", transcript: null, messages: [], totals: null };
  }
  const messages = readUsage(file);
  return {
    ...invocation,
    status: messages.length ? "captured" : "missing",
    transcript: file,
    messageCount: messages.length,
    apiCallCount: collapseToApiCalls(messages).length,
    messages,
    totals: aggregate(messages)
  };
});

const captured = invocations.filter((invocation) => invocation.status === "captured");
const armTotals = {};
for (const invocation of captured) {
  const key = invocation.arm ?? "unknown";
  armTotals[key] = (armTotals[key] ?? 0) + (invocation.totals?.summedAllFields ?? 0);
}

const output = {
  schema: "claude-usage/1",
  task: roster.task,
  generatedAtUtc: new Date().toISOString(),
  provider: "anthropic (claude-code agent harness)",
  source: "per-subagent transcripts written by the agent harness; payloads copied verbatim",
  aggregation: "per invocation: transcript records are first collapsed to one record per API call by requestId (the harness writes one record per streamed content block, repeating the call's usage snapshot; input side taken once, output taken as the max/final snapshot), then summed field-wise. summedAllFields = input + output + cache_read + cache_creation. Absent fields are omitted, never zero-filled.",
  comparabilityNote:
    "Anthropic reports cache_read_input_tokens and cache_creation_input_tokens separately from input_tokens; the Codex app-server reports cachedInputTokens and cacheWriteInputTokens inside its own totals. summedAllFields is raw processed tokens, NOT provider-billed cost, and the two providers' cache accounting is not assumed equivalent. S3 must state which basis it uses; the raw payloads are preserved here so any basis can be recomputed.",
  invocationCount: invocations.length,
  capturedCount: captured.length,
  missingCount: invocations.length - captured.length,
  armTotalsRawProcessedTokens: armTotals,
  invocations
};

fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);

process.stdout.write(`${JSON.stringify({
  task: roster.task,
  invocations: invocations.length,
  captured: captured.length,
  missing: invocations.length - captured.length,
  armTotalsRawProcessedTokens: armTotals,
  out: outPath
}, null, 2)}\n`);
