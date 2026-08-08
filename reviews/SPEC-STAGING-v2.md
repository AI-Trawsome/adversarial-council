# SPEC — Artifact staging v2 (range-based)

Proposed replacement for the staging construction rejected in consult 003. Submitted for countersign **before** implementation. Applies to all 25 tasks, both arms.

## Why v2 exists

v1 inferred where the frozen artifact sat in the source file by greedy subsequence matching. Three defects, all confirmed on T01:

1. **Placement was not unique.** Leftmost and rightmost embeddings differ at 4 positions; the constructor silently picked one. Content was identical either way, but placement sets hunk boundaries, so the stimulus was not fully determined by its inputs.
2. **The line count was unreconciled** — a 444-line artifact reported as 445 added lines. Provably a counting artifact (joining the diff's added lines reproduces `sha256 9df9bfd…` exactly, 0 deletions, no `\ No newline` markers), but v1 asserted it without proving it.
3. **Reviewers were misframed.** Both arms were told this was "the change under review", implying a patch against a known-good baseline. It is not.

v2 removes inference entirely. The constructor already knows the exact ranges; it should say so rather than make staging guess.

## 1. Range sidecar

The artifact-construction subagent emits a third output beside the artifact and the construction record:

```json
{
  "task": "T01",
  "sourcePath": "aiohttp/connector.py",
  "buggySha": "4ef04d66fa450156a5cc39c2ec4f00d4ca623d5b",
  "sourceFileSha256": "<sha256 of the file at the buggy SHA>",
  "artifactSha256": "<sha256 of the frozen artifact>",
  "lineNumbering": "1-based, inclusive, over newline-terminated lines of sourcePath at buggySha",
  "ranges": [{ "start": 1, "end": 97 }, { "start": 699, "end": 746 }],
  "artifactContentLines": 444,
  "sourceEndsWithNewline": true
}
```

Numbers and identifiers only. Line ranges were already ruled contamination-safe — reviewers see the slice regardless, so ranges tell the orchestrator nothing the artifact does not. The schema is closed: any key outside this set, or any string field other than the four named identifiers, fails the audit. That is what keeps prose about the defect out of a file the orchestrator reads.

## 2. Staging algorithm — assert, never infer

1. Read `sourcePath` at `buggySha`; verify its sha256 against the sidecar.
2. Validate ranges: ascending, non-overlapping, within bounds, non-empty.
3. Concatenate the ranges in order → candidate artifact. **Assert byte-identical to the frozen artifact by sha256.** Fail otherwise.
4. Base file = source with exactly those line ranges removed. Commit as the base (amending the scrubbed import commit, preserving the audited one-commit property).
5. Restore the full source file to the working tree.
6. Assert the working-tree file's sha256 equals the source-at-buggy-SHA sha256.
7. Assert on the resulting `git diff`: deletions `== 0`; `\ No newline` markers `== 0`; **added lines joined with `\n` byte-identical to the frozen artifact**; and `diffAddedLines == artifactContentLines`.

Step 7's last equality is how the 444/445 problem stops being a convention to explain and becomes an invariant to enforce. Removing exactly 444 numbered lines and restoring them yields exactly 444 additions. Any other number means the staging is wrong, and the run aborts.

Any failed assertion is a hard failure. There is no path that chooses, rounds, or proceeds with a warning.

## 3. Staging manifest

Written per task as `<task>-STAGING.json`, and audited:

`task`, `sourcePath`, `buggySha`, `sourceFileSha256`, `artifactSha256`, `ranges`, `artifactContentLines`, `diffAddedLines`, `diffDeletedLines`, `noNewlineMarkers`, `scrubbedImportCommit`, `baseCommit`, `workingTreeFileSha256`, `reconstructionProof` (method + result), `framingTextSha256`, `policyVersion`, `generatedAtUtc`.

The auditor re-derives each hash and each assertion from the repository rather than trusting the manifest, and fails if the framing text hash is absent or does not match the frozen framing text.

## 4. Framing text — identical in both arms

Delivered two ways, byte-identical: as the runner's `focus` (interpolated into `USER_FOCUS` in both critic prompts and recorded in `debate.json`), and verbatim in every defender brief.

> **How to read the diff.** The diff below is a review window, not a patch history. The lines shown as added are existing code from the project at the commit under review; they have been isolated so the review has a defined scope. Do not treat them as newly written relative to a known-good baseline, do not infer intent from the fact that they appear as additions, and do not treat the pre-diff state as evidence about how the code previously behaved — that baseline is synthetic and was never executed. Review the code as it stands in the working tree.

It is frozen text, hashed into the staging manifest, and identical across arms — so it cannot become a channel that differentiates them. It says nothing about what to look for.

## 5. Consequences

- **T01 is re-run in both arms.** Its v1 staging satisfied byte-identity but not uniqueness and not framing, so by the consult-003 rule it does not qualify for the no-rerun exemption.
- The elided base commit is never executed, tested, or cited as evidence about prior behaviour. The audited working tree is the object of review.
- If a task's ranges fail any assertion, that task is replaced from the alternates and recorded — the existing mechanism for construction failure.

## Question for the countersign

Does anything here still leave the stimulus under-determined, or leave the orchestrator a path to learn the defect? Those are the two properties the design is meant to guarantee.
