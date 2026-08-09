#!/usr/bin/env node
/**
 * compute-s3-cost.mjs — benchmark harness (not part of the council plugin).
 *
 * Deterministic recomputation of BENCHMARK.md §4 criterion S3 from archived
 * raw usage payloads and the frozen rate card. Amendment A-003.
 *
 * Everything it reports is derived here, at run time, from artifacts committed
 * with the run — no figure is carried over from a prior document. That is the
 * point: the S3 verdict must be reproducible by a third party who has the
 * repository and nothing else.
 *
 * Two accounting rules do the real work, and both were learned the hard way:
 *
 *   1. OpenAI's `inputTokens` INCLUDES `cachedInputTokens`. Fresh input is the
 *      difference. Adding a per-turn `totalTokens` into a basis that excludes
 *      cache reads double-counts cached input — the T02-T06 erratum.
 *   2. Anthropic bills cache writes by TTL. The payloads carry the 5m/1h split,
 *      so it is read rather than assumed; absent the split, the 1h (higher)
 *      rate applies.
 *
 * Usage:
 *   node compute-s3-cost.mjs --runs <rerun2Dir> --rates <rate-card.json> [--json]
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function arg(name, { required = true, fallback = null } = {}) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1] || process.argv[i + 1].startsWith("--")) {
    if (required) {
      process.stderr.write(`compute-s3-cost: missing --${name}\n`);
      process.exit(2);
    }
    return fallback;
  }
  return process.argv[i + 1];
}

const runsDir = path.resolve(arg("runs"));
const card = JSON.parse(fs.readFileSync(path.resolve(arg("rates")), "utf8"));
const emitJson = process.argv.includes("--json");

const A = card.providers.anthropic.rates;
const O = card.providers.openai.rates;
const per = (tokens, rate) => (tokens * rate) / 1e6;

// ---------- Claude: raw per-message payloads from the usage archives -------

const claude = new Map(); // `${task}|${arm}` -> token classes
function addClaude(task, arm, u) {
  if (arm === "construction" || arm === "contamination-audit") return; // shared overhead
  const key = `${task}|${arm}`;
  const b = claude.get(key) ?? { fresh: 0, out: 0, cr: 0, cw5m: 0, cw1h: 0 };
  b.fresh += u.input_tokens ?? 0;
  b.out += u.output_tokens ?? 0;
  b.cr += u.cache_read_input_tokens ?? 0;
  const split = u.cache_creation;
  if (split && typeof split === "object") {
    b.cw5m += split.ephemeral_5m_input_tokens ?? 0;
    b.cw1h += split.ephemeral_1h_input_tokens ?? 0;
  } else {
    // No TTL split available — bill at the higher (1h) rate rather than guess low.
    b.cw1h += u.cache_creation_input_tokens ?? 0;
  }
  claude.set(key, b);
}

/**
 * Collapse per-content-block transcript records to one record per API call.
 *
 * The harness emits one assistant record per streamed content block; every
 * record in a call repeats that call's usage snapshot, with `output_tokens`
 * growing to its final value on the last one. Summing raw records bills a
 * single call's input and cache tokens once per block — 1442 records for 717
 * calls on this run, inflating modeled cost roughly 1.7x. Input side is taken
 * once per requestId; output is the maximum (final cumulative) snapshot.
 */
function collapseToApiCalls(messages) {
  const groups = new Map();
  for (const [index, message] of messages.entries()) {
    if (!message.usage) continue;
    const key = message.requestId ?? `__no_request_id__${index}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(message.usage);
  }
  return [...groups.values()].map((group) => {
    const outputs = group.map((u) => u.output_tokens).filter((v) => typeof v === "number");
    return { ...group[0], output_tokens: outputs.length ? Math.max(...outputs) : 0 };
  });
}

let claudeRecords = 0;
let claudeCalls = 0;
for (const file of fs.readdirSync(runsDir)) {
  if (!/claude-usage.*\.json$/.test(file)) continue;
  const doc = JSON.parse(fs.readFileSync(path.join(runsDir, file), "utf8"));
  for (const inv of doc.invocations) {
    const task = inv.task ?? doc.task;
    claudeRecords += (inv.messages ?? []).length;
    const calls = collapseToApiCalls(inv.messages ?? []);
    claudeCalls += calls.length;
    for (const usage of calls) addClaude(task, inv.arm, usage);
  }
}

// ---------- Codex: raw per-turn payloads from each Arm B debate.json -------

const codex = new Map();
for (const entry of fs.readdirSync(runsDir)) {
  const match = /^(T\d+[a-z]*)-armB$/.exec(entry);
  if (!match) continue;
  const debatePath = path.join(runsDir, entry, "debate", "debate.json");
  if (!fs.existsSync(debatePath)) continue;
  const debate = JSON.parse(fs.readFileSync(debatePath, "utf8"));
  const b = { fresh: 0, out: 0, cr: 0, cw: 0 };
  for (const round of debate.stats?.rounds ?? []) {
    for (const raw of round.usage ?? []) {
      const last = raw.last ?? {};
      const input = last.inputTokens ?? 0;
      const cached = last.cachedInputTokens ?? 0;
      b.fresh += input - cached; // cachedInputTokens ⊂ inputTokens
      b.cr += cached;
      b.out += last.outputTokens ?? 0;
      b.cw += last.cacheWriteInputTokens ?? 0;
    }
  }
  codex.set(match[1], b);
}

// ---------- modeled dollars per task per arm -------------------------------

const claudeDollars = (b) =>
  per(b.fresh, A.freshInput) + per(b.out, A.output) + per(b.cr, A.cacheRead) +
  per(b.cw5m, A.cacheWrite5m) + per(b.cw1h, A.cacheWrite1h);

const codexDollars = (b) =>
  per(b.fresh, O.freshInput) + per(b.out, O.output) + per(b.cr, O.cacheRead) +
  per(b.cw, O.cacheWrite);

const tasks = [...new Set([...claude.keys()].map((k) => k.split("|")[0]))].sort();
const rows = [];
for (const task of tasks) {
  const a = claude.get(`${task}|A`);
  const bClaude = claude.get(`${task}|B`);
  if (!a || !bClaude) continue;
  const cx = codex.get(task) ?? { fresh: 0, out: 0, cr: 0, cw: 0 };
  const armA = claudeDollars(a);
  const armBClaude = claudeDollars(bClaude);
  const armBCodex = codexDollars(cx);
  const armB = armBClaude + armBCodex;
  rows.push({
    task,
    armADollars: +armA.toFixed(4),
    armBDollars: +armB.toFixed(4),
    armBCodexDollars: +armBCodex.toFixed(4),
    codexShareOfArmB: +((armBCodex / armB) * 100).toFixed(1),
    ratio: +(armB / armA).toFixed(4)
  });
}

const sorted = rows.map((r) => r.ratio).sort((x, y) => x - y);
const median = sorted.length % 2
  ? sorted[(sorted.length - 1) / 2]
  : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

const result = {
  schema: "s3-cost/1",
  rateCardVersion: card.rateCardVersion,
  costLabel: "MODELED API-EQUIVALENT — not observed billed cost",
  anthropicModel: card.providers.anthropic.modelIdentity,
  openaiModel: card.providers.openai.modelIdentity,
  tasks: rows,
  claudeTranscriptRecords: claudeRecords,
  claudeApiCalls: claudeCalls,
  medianRatioBoverA: +median.toFixed(4),
  s3Ceiling: 3.0,
  s3Passes: median <= 3.0,
  subscriptionMarginalCostArmBCodex: 0
};

if (emitJson) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  console.log(`S3 modeled API-equivalent cost — rate card v${card.rateCardVersion}`);
  console.log(`Anthropic: ${result.anthropicModel}   OpenAI: ${result.openaiModel}\n`);
  console.log("task    Arm A $    Arm B $   codex $  codex%   B/A");
  for (const r of rows) {
    console.log(
      `${r.task.padEnd(6)} ${r.armADollars.toFixed(2).padStart(9)} ${r.armBDollars.toFixed(2).padStart(10)} ` +
      `${r.armBCodexDollars.toFixed(2).padStart(9)} ${String(r.codexShareOfArmB).padStart(6)}% ${r.ratio.toFixed(2).padStart(6)}x`
    );
  }
  console.log(`\nClaude transcript records ${claudeRecords} collapsed to ${claudeCalls} API calls`);
  console.log(`median B/A = ${result.medianRatioBoverA.toFixed(2)}x   S3 ceiling 3.0x   ${result.s3Passes ? "PASS" : "FAIL"}`);
  console.log("Arm B Codex subscription marginal cost: $0 (reported, never gated)");
}
