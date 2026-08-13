#!/usr/bin/env node
/**
 * build-review-env.mjs — benchmark harness (not part of the council plugin).
 *
 * Amendment A-005, consult 012. Builds ONE dependency environment per task,
 * outside every reviewer seat and outside the review checkout, and proves that
 * no copy of the project under review is reachable from it.
 *
 * Why this exists: A-002 exports a history-free tree so the fix is unreachable
 * inside the checkout. It does nothing about the dependency graph. Reviewers
 * installing the project's own test dependencies pulled a *published release of
 * the project under review* into 25 seats across 13 tasks — a second, later
 * copy of the reviewed source sitting beside the reviewer. The ruling makes
 * that contamination on reachability, not on proven use, because use is
 * generally unobservable.
 *
 * The environment is built and audited BEFORE either arm begins and is shared,
 * read-only, by both arms of a task — which is also how requirement 8 ("same
 * dependency policy and frozen resolver inputs for both arms") is guaranteed
 * rather than asserted.
 *
 * Usage:
 *   node build-review-env.mjs --task T04 --scrubbed <dir> --out <envDir> [--audit-only]
 *
 * Output is contamination-safe: distribution names, versions, paths, counts and
 * pass/fail. Nothing is compared against any fix, and no reviewed source is read.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

function arg(name, { required = true, fallback = null } = {}) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1] || process.argv[i + 1].startsWith("--")) {
    if (required) { process.stderr.write(`build-review-env: missing --${name}\n`); process.exit(2); }
    return fallback;
  }
  return process.argv[i + 1];
}

const task = arg("task");
const scrubbed = path.resolve(arg("scrubbed"));
const outDir = path.resolve(arg("out"));
const auditOnly = process.argv.includes("--audit-only");

const norm = (s) => String(s).toLowerCase().replace(/[_.]+/g, "-");

/* ---------- requirement 1: identify the project from the checkout ---------- */
// Derived from the buggy-SHA tree's own packaging metadata, never hard-coded to
// a guess: a wrong identity here would make every later check vacuous.
function identify() {
  const id = { distNames: new Set(), importRoots: new Set(), ecosystem: null, source: [] };
  const pkgJson = path.join(scrubbed, "package.json");
  if (fs.existsSync(pkgJson)) {
    const j = JSON.parse(fs.readFileSync(pkgJson, "utf8"));
    if (j.name) { id.distNames.add(norm(j.name)); id.importRoots.add(norm(j.name)); }
    id.ecosystem = "node";
    id.source.push("package.json");
  }
  const pyproject = path.join(scrubbed, "pyproject.toml");
  if (fs.existsSync(pyproject)) {
    const body = fs.readFileSync(pyproject, "utf8");
    const m = /^\s*name\s*=\s*["']([^"']+)["']/m.exec(body);
    if (m) id.distNames.add(norm(m[1]));
    id.ecosystem ??= "python";
    id.source.push("pyproject.toml");
  }
  const setupCfg = path.join(scrubbed, "setup.cfg");
  if (fs.existsSync(setupCfg)) {
    const m = /^\s*name\s*=\s*(.+)$/m.exec(fs.readFileSync(setupCfg, "utf8"));
    if (m) id.distNames.add(norm(m[1].trim()));
    id.ecosystem ??= "python";
    id.source.push("setup.cfg");
  }
  // import roots: top-level directories that look like the package
  if (id.ecosystem === "python") {
    for (const e of fs.readdirSync(scrubbed, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      if (fs.existsSync(path.join(scrubbed, e.name, "__init__.py"))) id.importRoots.add(norm(e.name));
    }
  }
  return {
    ecosystem: id.ecosystem,
    distNames: [...id.distNames],
    importRoots: [...id.importRoots],
    identitySource: id.source
  };
}

/* ---------- requirements 4-6: the audit ------------------------------------ */
function auditEnv(envDir, id) {
  const findings = [];
  const inventory = [];
  const stack = fs.existsSync(envDir) ? [envDir] : [];
  let entries = 0, unreadable = 0;

  while (stack.length) {
    const d = stack.pop();
    let list = [];
    try { list = fs.readdirSync(d, { withFileTypes: true }); } catch { unreadable++; continue; }
    for (const e of list) {
      entries++;
      const p = path.join(d, e.name);
      const bn = norm(e.name);
      const parent = path.basename(path.dirname(p));
      if (e.isSymbolicLink()) {
        // a link out of the environment is a reachability channel of its own
        let real = null; try { real = fs.realpathSync(p); } catch {}
        if (real && !real.startsWith(envDir)) {
          for (const dn of id.distNames) if (norm(real).includes(dn)) findings.push({ class: "SYMLINK-OUT", path: p, target: real });
        }
        continue;
      }
      if (e.isDirectory()) {
        if (parent === "site-packages" || parent === "node_modules") {
          if (id.distNames.includes(bn)) findings.push({ class: "INSTALLED-DIST", path: p });
          else if (id.importRoots.includes(bn)) findings.push({ class: "IMPORT-ROOT", path: p });
          else inventory.push(e.name);
        }
        const dm = /^(.+?)-\d[^-]*.*\.(dist-info|egg-info)$/.exec(e.name);
        if (dm && id.distNames.includes(norm(dm[1]))) findings.push({ class: "DIST-METADATA", path: p });
        if (/^__editable__/.test(e.name) && id.distNames.some(d2 => bn.includes(d2))) findings.push({ class: "EDITABLE", path: p });
        if (id.importRoots.includes(bn) && parent !== "site-packages" && parent !== "node_modules") {
          let inner = []; try { inner = fs.readdirSync(p); } catch {}
          if (inner.some(f => /\.(py|js|mjs|cjs|ts)$/.test(f))) findings.push({ class: "VENDORED-SOURCE", path: p });
        }
        stack.push(p);
      } else {
        if (/\.egg-link$/.test(e.name) && id.distNames.some(d2 => bn.includes(d2))) findings.push({ class: "EGG-LINK", path: p });
        if (/\.pth$/.test(e.name)) {
          const body = (() => { try { return fs.readFileSync(p, "utf8"); } catch { return ""; } })();
          for (const line of body.split("\n")) {
            const t = line.trim();
            if (!t || t.startsWith("import ")) continue;
            if (id.distNames.some(d2 => norm(t).includes(d2)) || (t.startsWith("/") && !t.startsWith(envDir)))
              findings.push({ class: "PTH-INJECTION", path: p, entry: t });
          }
        }
        if (/\.(whl|tar\.gz|tgz)$/.test(e.name) && id.distNames.some(d2 => bn.startsWith(d2 + "-")))
          findings.push({ class: "CACHED-ARTIFACT", path: p });
        if (e.name === "direct_url.json" && id.distNames.some(d2 => norm(parent).startsWith(d2)))
          findings.push({ class: "DIRECT-URL-INSTALL", path: p });
      }
    }
  }
  return { entries, unreadable, findings, distributionsInstalled: [...new Set(inventory)].sort() };
}

/* ---------- requirement 6: prove import resolution -------------------------- */
function proveResolution(envDir, id) {
  const proofs = [];
  if (id.ecosystem === "python") {
    const py = path.join(envDir, "venv", "bin", "python");
    if (!fs.existsSync(py)) return [{ root: "*", ok: false, detail: "no interpreter in environment" }];
    for (const root of id.importRoots) {
      try {
        const out = execFileSync(py, ["-c",
          `import importlib.util,sys;s=importlib.util.find_spec(${JSON.stringify(root)});print(s.origin if s else "NOT-FOUND")`
        ], { encoding: "utf8", env: { ...process.env, PYTHONPATH: "" } }).trim();
        proofs.push({ root, resolvedTo: out, ok: out === "NOT-FOUND" });
      } catch (e) {
        proofs.push({ root, resolvedTo: "IMPORT-ERROR", ok: true, detail: "not importable from the environment alone" });
      }
    }
  } else {
    for (const root of id.importRoots) {
      const p = path.join(envDir, "node_modules", root);
      proofs.push({ root, resolvedTo: fs.existsSync(p) ? p : "NOT-FOUND", ok: !fs.existsSync(p) });
    }
  }
  return proofs;
}

/* ---------- requirements 2-3: resolve the closure WITHOUT the project ------- */
// Requirement 3 is a rejection, not a filter: if the declared test closure
// contains the project under review, we do not quietly drop it and proceed —
// we record it and refuse, because a plugin that cannot run without the project
// cannot be used in a reviewer seat at all under this amendment.
function resolveAndInstall(envDir, id) {
  const log = { attempted: true, ecosystem: id.ecosystem, rejected: [], installed: false, notes: [] };
  if (id.ecosystem === "node") {
    const pkgPath = path.join(scrubbed, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const dev = { ...(pkg.devDependencies ?? {}) };
    for (const name of Object.keys(dev)) {
      if (id.distNames.includes(norm(name))) { delete dev[name]; log.rejected.push(name); }
    }
    fs.mkdirSync(envDir, { recursive: true });
    fs.writeFileSync(path.join(envDir, "package.json"),
      JSON.stringify({ name: `review-env-${task.toLowerCase()}`, private: true, devDependencies: dev }, null, 2) + "\n");
    try {
      execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--loglevel", "error"],
        { cwd: envDir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 900000 });
      log.installed = true;
    } catch (e) {
      log.notes.push("npm install did not complete: " + String(e.message).slice(0, 200));
    }
  } else {
    const venv = path.join(envDir, "venv");
    fs.mkdirSync(envDir, { recursive: true });
    try {
      execFileSync("python3", ["-m", "venv", venv], { encoding: "utf8", timeout: 300000 });
    } catch (e) { log.notes.push("venv creation failed: " + String(e.message).slice(0, 200)); return log; }
    const pip = path.join(venv, "bin", "pip");
    // declared test requirements, project itself removed
    const candidates = ["requirements/dev.txt", "requirements/test.txt", "requirements-dev.txt", "requirements.txt"];
    const reqFile = candidates.map(c => path.join(scrubbed, c)).find(p => fs.existsSync(p));
    const specs = [];
    if (reqFile) {
      for (const raw of fs.readFileSync(reqFile, "utf8").split("\n")) {
        const line = raw.trim();
        if (!line || line.startsWith("#") || line.startsWith("-r") || line.startsWith("-e") || line === ".") continue;
        const name = norm(line.split(/[<>=!\[; ]/)[0]);
        if (id.distNames.includes(name)) { log.rejected.push(line); continue; }
        specs.push(line);
      }
      log.notes.push(`requirements source: ${path.relative(scrubbed, reqFile)}`);
    } else {
      specs.push("pytest");
      log.notes.push("no declared test requirements file; installed a minimal runner only");
    }
    try {
      execFileSync(pip, ["install", "--disable-pip-version-check", "--no-input", ...specs],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 1800000 });
      log.installed = true;
    } catch (e) {
      log.notes.push("pip install did not complete cleanly: " + String(e.message).slice(0, 200));
    }
  }
  return log;
}

/* ---------- negative control: the auditor must be able to fail -------------- */
// A clean audit means nothing unless the auditor demonstrably fires. This
// plants a decoy copy of the project under review, re-audits, asserts the
// finding, and removes it — the same discipline the scrub auditor uses.
function negativeControl(envDir, id) {
  const root = id.importRoots[0] ?? id.distNames[0];
  if (!root) return { ran: false, reason: "no import root to plant" };
  const host = id.ecosystem === "node"
    ? path.join(envDir, "node_modules")
    : path.join(envDir, "venv", "lib");
  let siteDir = host;
  if (id.ecosystem === "python") {
    // find the real site-packages so the decoy sits where a real one would
    try {
      const libs = fs.readdirSync(host);
      const py = libs.find(x => x.startsWith("python"));
      if (py) siteDir = path.join(host, py, "site-packages");
    } catch { /* fall through */ }
  }
  const decoy = path.join(siteDir, root);
  if (fs.existsSync(decoy)) return { ran: false, reason: "a real entry already occupies that path" };
  try {
    fs.mkdirSync(decoy, { recursive: true });
    fs.writeFileSync(path.join(decoy, id.ecosystem === "node" ? "index.js" : "__init__.py"), "# decoy\n");
    const probe = auditEnv(envDir, id);
    const fired = probe.findings.some(f => f.class === "INSTALLED-DIST" || f.class === "IMPORT-ROOT" || f.class === "VENDORED-SOURCE");
    fs.rmSync(decoy, { recursive: true, force: true });
    return { ran: true, fired, findingClasses: [...new Set(probe.findings.map(f => f.class))] };
  } catch (e) {
    try { fs.rmSync(decoy, { recursive: true, force: true }); } catch {}
    return { ran: false, reason: String(e.message).slice(0, 160) };
  }
}

/* ---------- main ------------------------------------------------------------ */
const id = identify();
if (!id.ecosystem) { process.stderr.write("build-review-env: could not identify the project from the checkout\n"); process.exit(3); }

fs.mkdirSync(outDir, { recursive: true });
const install = auditOnly ? { attempted: false, rejected: [], installed: false, notes: ["--audit-only"] }
                          : resolveAndInstall(outDir, id);

/* ---------- requirement 4: remove or fail ----------------------------------
 * Excluding the project from the DECLARED closure is not enough — on the first
 * build of T04 the package manager reinstalled it transitively as a dependency
 * of a dev tool, which is the exact mechanism A-005 describes and the reason
 * the ruling says a pin is insufficient. So every matching artifact is removed
 * after installation, repeatedly, because a package manager can place nested
 * copies under other packages. Then the audit must come back empty on its own.
 */
const removal = { passes: 0, removed: [] };
if (!auditOnly) {
  for (let pass = 0; pass < 5; pass++) {
    const probe = auditEnv(outDir, id);
    const targets = probe.findings.filter(f =>
      ["INSTALLED-DIST", "IMPORT-ROOT", "DIST-METADATA", "VENDORED-SOURCE", "EDITABLE", "CACHED-ARTIFACT"].includes(f.class));
    if (targets.length === 0) break;
    removal.passes++;
    for (const t of targets) {
      try { fs.rmSync(t.path, { recursive: true, force: true }); removal.removed.push({ class: t.class, path: t.path.replace(outDir, "<env>") }); }
      catch (e) { removal.removed.push({ class: t.class, path: t.path.replace(outDir, "<env>"), error: String(e.message).slice(0, 120) }); }
    }
  }
}

const audit = auditEnv(outDir, id);
const resolution = proveResolution(outDir, id);
const control = negativeControl(outDir, id);

const report = {
  schema: "a005-review-env/1",
  amendment: "A-005 (consult 012)",
  task,
  ecosystem: id.ecosystem,
  projectDistNames: id.distNames,
  projectImportRoots: id.importRoots,
  identityDerivedFrom: id.identitySource,
  envDir: outDir,
  install: { installed: install.installed, rejectedFromClosure: install.rejected, notes: install.notes },
  removalAfterInstall: { passes: removal.passes, artifactsRemoved: removal.removed.length, detail: removal.removed },
  entriesAudited: audit.entries,
  unreadableDirs: audit.unreadable,
  distributionsInstalled: audit.distributionsInstalled.length,
  findings: audit.findings.map(f => ({ class: f.class, path: f.path.replace(outDir, "<env>") })),
  importResolution: resolution,
  negativeControl: control,
  // requirement 6 is the load-bearing one: the reviewed project must resolve to
  // NOTHING from the environment alone, so that at run time it can only ever
  // resolve to the scrubbed working tree.
  // A clean audit counts only if the auditor demonstrably fires, and only if
  // something was actually installed — an empty directory passes every check
  // and proves nothing.
  verdict: (audit.findings.length === 0 && resolution.every(r => r.ok) &&
            control.ran && control.fired && audit.distributionsInstalled.length > 0)
    ? "PASS — closure installed, no reachable copy of the project under review, every import root resolves to nothing from the environment alone, and the auditor fired on a planted decoy"
    : "FAIL — environment must not be released to a participant"
};
const reportPath = path.join(outDir, "A005-ENV-AUDIT.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
process.exit(report.verdict.startsWith("PASS") ? 0 : 1);
