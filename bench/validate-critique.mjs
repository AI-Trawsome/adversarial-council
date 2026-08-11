#!/usr/bin/env node
/**
 * validate-critique.mjs — benchmark harness (NOT part of the council plugin).
 *
 * Closes the arm asymmetry ruled on in reviews/CHATGPT-RULING-021-armA-schema-asymmetry.md.
 *
 * Arm B's critic is Codex, and the runner hands the provider the message JSON
 * Schema as an `outputSchema`, so a malformed message cannot be generated. Arm
 * A's critic is a Claude subagent whose message reaches the runner through the
 * COUNCIL_MOCK_CRITIQUE file, which the runner reads and uses WITHOUT applying
 * the schema. The runner's own validateMessage() is a hand-rolled check of
 * protocol legality, not of the schema: it range-checks `confidence` but never
 * type-checks `evidence`. A non-string `evidence` therefore sails past it and
 * is then unconditionally rewritten to support_level "unsupported" by the
 * anti-inflation rule, which excludes the finding from the verdict.
 *
 * The penalty lands on S1 (ground-truth detection) in one arm only, so it
 * measures which arm had a schema attached rather than critic quality.
 *
 * This program applies the SAME frozen schema to Arm A's message before it is
 * handed to the runner, so both critics face one output contract. It changes no
 * scoring rule, no prompt, no round structure, and no plugin code — the plugin
 * stays pinned at f976990.
 *
 * Contamination safety: errors are reported as JSON Pointer paths, expected
 * types, and error keywords. Instance VALUES ARE NEVER PRINTED, so neither the
 * orchestrator nor a log can learn finding content from a validation failure.
 * Per the ruling, the error report may name paths, expected types, missing
 * fields and forbidden fields, and must not comment on finding quality,
 * evidence strength, code content, severity, or likely correctness.
 *
 * Usage:
 *   node validate-critique.mjs --file <message.json> --round N [--side codex]
 *                              [--schema <path>] [--json]
 *
 * Exit 0 = valid. Exit 1 = invalid (errors on stdout). Exit 2 = usage error.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(HERE, "vendor", "package.json"));
const Ajv = require("ajv");

const DEFAULT_SCHEMA = path.resolve(
  HERE,
  "..",
  "plugins",
  "council",
  "schemas",
  "council-message.schema.json"
);

function arg(name, { required = true, fallback = null } = {}) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1] || process.argv[i + 1].startsWith("--")) {
    if (required) {
      process.stderr.write(`validate-critique: missing --${name}\n`);
      process.exit(2);
    }
    return fallback;
  }
  return process.argv[i + 1];
}
const has = (name) => process.argv.includes(`--${name}`);

/**
 * Categorize an Ajv error into a stable, content-free class. The ruling
 * requires an audit table of "error-category counts only", so the categories
 * have to be derived mechanically rather than described in prose per case.
 */
export function categorize(error) {
  switch (error.keyword) {
    case "type": return "wrong-type";
    case "required": return "missing-required";
    case "additionalProperties": return "undeclared-property";
    case "enum": return "value-not-in-enum";
    case "maximum":
    case "minimum":
    case "exclusiveMaximum":
    case "exclusiveMinimum": return "out-of-range";
    case "pattern": return "pattern-mismatch";
    default: return error.keyword ?? "other";
  }
}

/** Render one error without ever emitting the offending value. */
export function renderError(error) {
  const at = error.instancePath === "" ? "/" : error.instancePath;
  const category = categorize(error);
  switch (error.keyword) {
    case "type":
      return `${at}: expected type ${JSON.stringify(error.params.type)} [${category}]`;
    case "required":
      return `${at}: missing required property "${error.params.missingProperty}" [${category}]`;
    case "additionalProperties":
      return `${at}: property "${error.params.additionalProperty}" is not declared by the schema [${category}]`;
    case "enum":
      return `${at}: value is not one of ${JSON.stringify(error.params.allowedValues)} [${category}]`;
    default:
      return `${at}: ${error.message} [${category}]`;
  }
}

export function buildValidator(schemaPath = DEFAULT_SCHEMA) {
  const schemaText = fs.readFileSync(schemaPath, "utf8");
  const schema = JSON.parse(schemaText);
  const ajv = new Ajv({ allErrors: true, strict: false });
  return { validate: ajv.compile(schema), schemaText };
}

/**
 * Validate a parsed message. Returns { valid, errors:[string], categories:{} }.
 * `round`/`side` are checked here too so that the critic gets ONE consolidated
 * error report — the ruling requires all schema and protocol errors returned
 * together in a single format-only response, not drip-fed one bounce at a time.
 */
export function validateCritique(message, { round, side = "codex", schemaPath } = {}) {
  const { validate } = buildValidator(schemaPath);
  const errors = [];
  const categories = {};
  const bump = (c) => { categories[c] = (categories[c] ?? 0) + 1; };

  if (!validate(message)) {
    for (const e of validate.errors ?? []) {
      errors.push(renderError(e));
      bump(categorize(e));
    }
  }
  // Protocol-legality checks the schema does not express. These duplicate the
  // runner's own checks deliberately: the point is that the critic sees every
  // reason its message would be refused at once, rather than discovering the
  // second one only after fixing the first.
  if (round != null && message?.round !== round) {
    errors.push(`/round: must be ${round} for this turn [wrong-round]`);
    bump("wrong-round");
  }
  if (message?.side !== side) {
    errors.push(`/side: must be "${side}" [wrong-side]`);
    bump("wrong-side");
  }
  if (Array.isArray(message?.findings)) {
    message.findings.forEach((f, i) => {
      if (f && typeof f === "object" && f.claimant !== side) {
        errors.push(`/findings/${i}/claimant: must be "${side}" [wrong-claimant]`);
        bump("wrong-claimant");
      }
      if (f && typeof f === "object" && round != null && typeof f.id === "string") {
        if (!new RegExp(`^R${round}-F\\d+$`).test(f.id)) {
          errors.push(`/findings/${i}/id: must match R${round}-F<n> [id-format]`);
          bump("id-format");
        }
      }
    });
  }
  return { valid: errors.length === 0, errors, categories };
}

// ---------- CLI ----------
const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const file = path.resolve(arg("file"));
  const roundRaw = arg("round", { required: false, fallback: null });
  const round = roundRaw == null ? null : Number(roundRaw);
  const side = arg("side", { required: false, fallback: "codex" });
  const schemaPath = arg("schema", { required: false, fallback: DEFAULT_SCHEMA });

  let message;
  try {
    message = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    const report = { valid: false, errors: [`/: file is not valid JSON [parse-error]`], categories: { "parse-error": 1 } };
    process.stdout.write(has("json") ? `${JSON.stringify(report, null, 2)}\n` : `INVALID\n- ${report.errors[0]}\n`);
    process.exit(1);
  }

  const result = validateCritique(message, { round, side, schemaPath });
  if (has("json")) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (result.valid) {
    process.stdout.write("VALID\n");
  } else {
    process.stdout.write(`INVALID (${result.errors.length} error(s))\n`);
    for (const e of result.errors) process.stdout.write(`- ${e}\n`);
  }
  process.exit(result.valid ? 0 : 1);
}
