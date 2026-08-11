import fs from "node:fs";
import path from "node:path";
import { validateCritique } from "/Users/michaeltraw/Dev/council-marketplace/bench/validate-critique.mjs";

const root = "/Users/michaeltraw/Dev/council-bench/_rerun2";
const rows = [];
for (const dir of fs.readdirSync(root).sort()) {
  const full = path.join(root, dir);
  if (!fs.statSync(full).isDirectory()) continue;
  for (const f of fs.readdirSync(full).sort()) {
    const m = /^critique-mock-r(\d+)\.json$/.exec(f);
    if (!m) continue;
    const round = Number(m[1]);
    let msg = null, parseError = false;
    try { msg = JSON.parse(fs.readFileSync(path.join(full, f), "utf8")); } catch { parseError = true; }
    const r = parseError
      ? { valid: false, errors: ["parse-error"], categories: { "parse-error": 1 } }
      : validateCritique(msg, { round, side: "codex" });
    rows.push({ dir, round, valid: r.valid, errors: r.errors.length, categories: r.categories });
  }
}
let bad = 0;
for (const r of rows) {
  if (!r.valid) bad += 1;
  console.log(
    `${r.dir.padEnd(22)} r${r.round}  ${r.valid ? "VALID  " : "INVALID"}  errors=${String(r.errors).padStart(2)}  ${Object.keys(r.categories).length ? JSON.stringify(r.categories) : ""}`
  );
}
console.log(`\n${rows.length} archived Arm A critic payloads; ${rows.length - bad} valid, ${bad} invalid`);
