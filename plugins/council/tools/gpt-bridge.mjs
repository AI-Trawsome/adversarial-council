#!/usr/bin/env node
/**
 * gpt-bridge.mjs — direct Claude↔GPT channel for the cloud Cowork session.
 *
 * Calls the OpenAI API with OPENAI_API_KEY (read from env or ~/.council-openai-key),
 * keeping threaded conversation state on disk so exchanges have continuity.
 *
 * Usage:
 *   node gpt-bridge.mjs models                          # list available models
 *   node gpt-bridge.mjs send [--thread NAME] [--model M] [--file doc.md] [--message "text"]
 *   node gpt-bridge.mjs history [--thread NAME]
 *   node gpt-bridge.mjs reset --thread NAME
 *
 * State: ./threads/<name>.json  (message history, model, usage totals)
 * Default thread: "council". Default model: env OPENAI_MODEL, else config,
 * else best available autodetected from /v1/models on first send.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const THREADS = path.join(ROOT, "threads");
const KEY_FILE = path.join(process.env.HOME ?? "/root", ".council-openai-key");
const API = "https://api.openai.com/v1";

function fail(m) { process.stderr.write(`gpt-bridge error: ${m}\n`); process.exit(1); }

function apiKey() {
  const key = process.env.OPENAI_API_KEY?.trim() || (fs.existsSync(KEY_FILE) ? fs.readFileSync(KEY_FILE, "utf8").trim() : "");
  if (!key) fail(`no API key. Set OPENAI_API_KEY or write the key to ${KEY_FILE} (chmod 600).`);
  return key;
}

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (["--thread", "--model", "--file", "--message"].includes(t)) { a[t.slice(2)] = argv[i + 1]; i += 1; }
    else if (t.startsWith("--")) a[t.slice(2)] = true;
    else a._.push(t);
  }
  return a;
}

async function api(pathname, body) {
  const res = await fetch(`${API}${pathname}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) fail(`${pathname} -> HTTP ${res.status}: ${json?.error?.message ?? JSON.stringify(json).slice(0, 400)}`);
  return json;
}

async function listModels() {
  const json = await api("/models");
  return (json.data ?? []).map((m) => m.id).sort();
}

function rankModel(id) {
  // Prefer flagship chat models; crude but resilient to naming drift.
  if (/^(gpt|o)[-\d]/.test(id) === false) return -1;
  if (/(embed|whisper|tts|audio|image|dall|realtime|moderation|transcribe|search)/.test(id)) return -1;
  let score = 0;
  const num = id.match(/(\d+(?:\.\d+)?)/);
  if (num) score += parseFloat(num[1]) * 10;
  if (/pro/.test(id)) score += 5;
  if (/turbo|mini|nano|lite/.test(id)) score -= 4;
  if (/preview|latest/.test(id)) score += 1;
  return score;
}

async function pickDefaultModel() {
  const models = await listModels();
  const ranked = models.map((id) => [rankModel(id), id]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]);
  if (!ranked.length) fail("could not autodetect a chat model; pass --model explicitly");
  return ranked[0][1];
}

function threadFile(name) { fs.mkdirSync(THREADS, { recursive: true }); return path.join(THREADS, `${name}.json`); }
function loadThread(name) {
  const f = threadFile(name);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : { name, model: null, messages: [], usage: { input: 0, output: 0 }, exchanges: 0 };
}
function saveThread(t) { fs.writeFileSync(threadFile(t.name), `${JSON.stringify(t, null, 2)}\n`); }

const SYSTEM = [
  "You are GPT, in an ongoing peer collaboration with Claude (Anthropic) on the 'Adversarial AI Council' project,",
  "relayed through a direct API bridge (no human copy-paste). Michael Traw is the human owner; he reads the transcript.",
  "Reply directly and completely in markdown — your reply is delivered verbatim to Claude and Michael.",
  "Be a rigorous peer: verify claims against provided artifacts, disagree with evidence, concede only with reasons."
].join(" ");

async function cmdSend(a) {
  const name = a.thread ?? "council";
  const t = loadThread(name);
  t.model = a.model ?? process.env.OPENAI_MODEL ?? t.model ?? await pickDefaultModel();

  let content = (a.message ?? "").trim();
  if (a.file) {
    if (!fs.existsSync(a.file)) fail(`file not found: ${a.file}`);
    content += `${content ? "\n\n" : ""}--- DOCUMENT: ${path.basename(a.file)} ---\n${fs.readFileSync(a.file, "utf8")}\n--- END DOCUMENT ---`;
  }
  if (!content) fail("provide --message, --file, or both");

  t.messages.push({ role: "user", content });
  const body = {
    model: t.model,
    messages: [{ role: "system", content: SYSTEM }, ...t.messages]
  };
  const json = await api("/chat/completions", body);
  const reply = json.choices?.[0]?.message?.content ?? "";
  t.messages.push({ role: "assistant", content: reply });
  t.exchanges += 1;
  t.usage.input += json.usage?.prompt_tokens ?? 0;
  t.usage.output += json.usage?.completion_tokens ?? 0;
  saveThread(t);
  process.stdout.write(`${reply}\n`);
  process.stderr.write(`\n[gpt-bridge: thread=${name} model=${t.model} exchange=${t.exchanges} tokens_in=${json.usage?.prompt_tokens ?? "?"} out=${json.usage?.completion_tokens ?? "?"}]\n`);
}

function cmdHistory(a) {
  const t = loadThread(a.thread ?? "council");
  if (!t.messages.length) { process.stdout.write("(empty thread)\n"); return; }
  for (const m of t.messages) {
    process.stdout.write(`\n===== ${m.role.toUpperCase()} =====\n${m.content.slice(0, 2000)}${m.content.length > 2000 ? "\n…[truncated]" : ""}\n`);
  }
  process.stdout.write(`\n[${t.exchanges} exchanges, model=${t.model}, tokens in/out=${t.usage.input}/${t.usage.output}]\n`);
}

function cmdReset(a) {
  if (!a.thread) fail("--thread NAME required for reset");
  const f = threadFile(a.thread);
  if (fs.existsSync(f)) fs.renameSync(f, `${f}.${Date.now()}.bak`);
  process.stdout.write(`thread "${a.thread}" reset (previous state backed up)\n`);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const a = parseArgs(rest);
  switch (cmd) {
    case "models": { const m = await listModels(); process.stdout.write(m.join("\n") + "\n"); return; }
    case "send": return cmdSend(a);
    case "history": return cmdHistory(a);
    case "reset": return cmdReset(a);
    default: fail(`unknown command "${cmd ?? ""}". Use: models | send | history | reset`);
  }
}

main().catch((e) => fail(e?.stack ?? String(e)));
