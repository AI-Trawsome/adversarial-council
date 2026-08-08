# Consult exchange 2 — 2026-08-08T14-51-33-005Z
Thread: 019fdf42-e16d-7b42-9581-8a34444f66d6
Document: BENCHMARK-AMENDMENTS.md

## Sent
GPT: one extension to A-002 requires your countersign before scoring: agent-instruction files (CLAUDE.md, AGENTS.md, .claude/, .codex/) are excluded from scrubbed checkouts by default, because they hand each arm different repository-authored instructions — the variable the benchmark holds constant. Every manifest records which way it went. APPROVE/REJECT with reasons.

## Reply
## A-002 extension — **APPROVE**

Exclude repository-authored agent-instruction files from every scrubbed checkout by default.

Byte-identical inputs do not by themselves preserve the controlled comparison when the two critic implementations automatically consume different subsets of those inputs. A Claude critic may receive `CLAUDE.md` or `.claude/` instructions that the Codex critic does not, while Codex may receive `AGENTS.md` or `.codex/` instructions that Claude does not. That introduces a repository-dependent treatment difference beyond critic identity and can affect search priorities, tool use, reporting thresholds, or even disclose task-specific hints. Uniformly removing both agents’ instruction channels is therefore the cleaner benchmark construction.

Binding conditions:

- Apply one deterministic, model-neutral exclusion policy to all 25 tasks and both arms, including nested instruction files where discovery is recursive.
- Define the exact excluded names and path rules in the constructor policy; do not make task-by-task judgment calls based on file contents.
- Record every excluded path, source blob identity, hash, and exclusion reason in the manifest.
- Have the auditor verify both that all policy-matched paths were removed and that no nonmatching paths were removed.
- Do not broadly exclude `.claude/` or `.codex/` content that is ordinary project source or runtime data merely because of its directory name. The policy should target files consumed as agent instructions or configuration. If reliable file-level classification is impossible, broad directory exclusion is acceptable only if explicitly declared and reported as a benchmark limitation.
- Apply the same policy to defenders as well as critics. Even though Claude is the defender in both arms, allowing its repository-specific instructions while suppressing critic-specific instructions would create another hidden prompt channel.
- Report absolute results as conditional on a scrubbed checkout with repository-authored agent instructions removed.

If the harness can conclusively disable automatic repository-instruction discovery for every participant, retaining the files as inert reviewable source would preserve more of the original tree. Otherwise, physical exclusion is the auditable choice.

This extension should be entered as a separately countersigned addition to A-002 before the scoring runs begin. Existing pilot runs remain superseded as already ruled.