/**
 * exclusion-policy.mjs — the single deterministic definition of which paths are
 * excluded from a scrubbed checkout, shared by the constructor and the auditor.
 *
 * It lives in one module on purpose. The A-002 extension requires the auditor to
 * verify the policy in both directions — that every policy-matched path was
 * removed, and that no path outside the policy was — and an auditor that carried
 * its own copy of the rules would only ever confirm that two copies agreed.
 *
 * The rules are path-shaped and content-blind by design: no task-by-task
 * judgment, no inspection of what a file says. Same rules for all 25 tasks,
 * both arms, and every participant of either role.
 */

export const POLICY_VERSION = 2;

/**
 * Matched at ANY depth, not just the repository root.
 *
 * Nested instruction files are discovered recursively by the tools that read
 * them — a CLAUDE.md three directories down governs that subtree — so a
 * root-only rule would leave the channel open everywhere except the one place
 * it is easiest to notice.
 */
export const INSTRUCTION_BASENAMES = [
  "CLAUDE.md",
  "CLAUDE.local.md",
  "AGENTS.md",
  "AGENT.md",
  "GEMINI.md",
  ".cursorrules",
  ".windsurfrules",
  "copilot-instructions.md"
];

/**
 * Directory names excluded wholesale, at any depth.
 *
 * DECLARED LIMITATION (A-002 extension, condition 5). This is broader than
 * "files consumed as agent instructions": anything under these directories goes,
 * including ordinary project source or data that merely lives there. File-level
 * classification is not reliably possible — these trees hold skills, prompts,
 * settings, hooks, and arbitrary helper files with no marker distinguishing
 * what an agent will read from what it will not, and the set differs per tool
 * and per version. The ruling permits the broad rule provided it is explicitly
 * declared and reported as a limitation of the benchmark. It is, here, in every
 * manifest, and in the results.
 */
export const INSTRUCTION_DIRS = [".claude", ".codex", ".cursor", ".windsurf", ".aider", ".github/copilot"];

export const RULES = {
  INSTRUCTION_FILE: "agent-instruction-file",
  INSTRUCTION_DIR: "agent-instruction-directory",
  SUBMODULE: "submodule-gitlink"
};

/**
 * Classify one repository-relative path.
 *
 * @param {string} filePath POSIX-style, repository-relative
 * @returns {{excluded: boolean, rule: string|null, reason: string|null}}
 */
export function classifyPath(filePath) {
  const segments = filePath.split("/");
  const basename = segments[segments.length - 1];

  if (INSTRUCTION_BASENAMES.includes(basename)) {
    return {
      excluded: true,
      rule: RULES.INSTRUCTION_FILE,
      reason: `agent-instruction file (${basename}) — removed so neither arm receives repository-authored instructions the other does not`
    };
  }

  for (const dir of INSTRUCTION_DIRS) {
    const parts = dir.split("/");
    for (let i = 0; i + parts.length <= segments.length - 1; i += 1) {
      if (parts.every((part, offset) => segments[i + offset] === part)) {
        return {
          excluded: true,
          rule: RULES.INSTRUCTION_DIR,
          reason: `under agent-instruction directory ${dir}/ — declared broad exclusion (see POLICY LIMITATION in the manifest)`
        };
      }
    }
  }

  return { excluded: false, rule: null, reason: null };
}

export const POLICY_LIMITATION =
  "Directory-level exclusion of " +
  INSTRUCTION_DIRS.map((dir) => `${dir}/`).join(", ") +
  " removes every file beneath those paths, including any that is ordinary project source rather than agent instructions or configuration. " +
  "Reliable file-level classification is not available: these trees mix skills, prompts, settings, and helper files with no marker separating what an agent reads from what it does not, and the set varies by tool and version. " +
  "Declared and reported as a benchmark limitation per the A-002 extension, condition 5. Absolute results are results for a scrubbed checkout with repository-authored agent instructions removed.";

export function policyDescriptor() {
  return {
    policyVersion: POLICY_VERSION,
    instructionBasenames: INSTRUCTION_BASENAMES,
    instructionDirs: INSTRUCTION_DIRS,
    matchDepth: "any",
    contentBlind: true,
    appliesTo: "all tasks, both arms, all participants (critics and defenders alike)",
    limitation: POLICY_LIMITATION
  };
}
