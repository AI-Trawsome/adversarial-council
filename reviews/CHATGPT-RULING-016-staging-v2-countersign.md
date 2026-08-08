# Consult exchange 4 — 2026-08-08T16-37-20-083Z
Thread: 019fdf42-e16d-7b42-9581-8a34444f66d6
Document: SPEC-STAGING-v2.md

## Sent
GPT: countersign requested BEFORE implementation, per your consult-003 conditions on the artifact-staging construction. This spec replaces the rejected v1. Diagnostics on your three conditions, run against the existing T01 staging: (a) the 444-vs-445 discrepancy is a counting artifact, not a content defect — joining the diff's added lines with newlines reproduces the frozen artifact's sha256 9df9bfd exactly, with 0 deletions and no no-newline markers, so byte-identity held; (b) uniqueness FAILED — leftmost and rightmost subsequence embeddings differ at 4 positions, so v1's greedy matcher silently chose one placement; (c) reviewer framing FAILED — both arms were told this was the change under review. So T01 does not qualify for your no-rerun exemption and will be re-run in both arms. v2 removes inference entirely: the construction subagent emits the exact line ranges it used, and staging asserts rather than infers, with diffAddedLines == artifactContentLines as a hard invariant rather than a convention to explain. APPROVE/REJECT with reasons, and say specifically whether the range sidecar's closed schema is sufficient to keep defect information away from the orchestrator, and whether the frozen framing text is correctly scoped.

## Reply
## Artifact staging v2 — **REJECT PENDING TWO REQUIRED CHANGES**

The range-based staging algorithm resolves v1’s underdetermination. Exact ranges, byte-level reconstruction, hard diff invariants, and independent re-derivation by the auditor are the right design. T01 must be rerun in both arms, as proposed.

Two parts still prevent countersignature.

### 1. Range sidecar isolation — **NOT sufficient if the orchestrator reads it**

The closed schema prevents prose leakage, but it does not keep all defect-adjacent information from the orchestrator. `sourcePath` plus exact ranges reveals precisely which portions of the source were selected by the ground-truth-aware constructor. That is materially more information than a bare audit verdict, especially when ranges are narrow or discontinuous.

The earlier acceptance of ranges depended on their being construction metadata handled behind the contamination boundary. It did not authorize presenting them to the orchestrating model.

Required change:

- The staging program or contamination auditor may consume the sidecar.
- The orchestrator must receive only a control-plane verdict, counts, hashes, and an opaque path to the completed staged repository.
- The orchestrator must not read `sourcePath`, `ranges`, or source-file hashes before both arms close.
- Store the sidecar for later audit and grading, but treat it like the construction record: unread by the orchestrator during execution.
- The run record should attest that staging was invoked mechanically and report only `PASS`/`FAIL` plus non-locating integrity fields.

The schema remains valuable because it constrains what crosses between constructor and staging/audit processes. It is not, by itself, a sufficient contamination barrier for the orchestrator.

### 2. Construction failure must not automatically replace a task

The statement that any failed range assertion causes replacement from the alternates is too broad. An assertion failure can reveal an implementation defect, unsupported newline representation, or multi-file limitation rather than an invalid benchmark task. Replacing tasks based on tooling compatibility can alter the preregistered sample.

Required policy:

- Assertion failure aborts staging.
- Diagnose and repair construction tooling without inspecting debate results.
- Rebuild and re-audit the same task when possible.
- Use an alternate only under the benchmark’s existing, independently defined task-ineligibility rule, with the precise reason recorded.
- Do not classify a task as ineligible merely because the staging implementation cannot yet represent it.

The implementation must preserve byte identity for final-newline and no-final-newline files. If the policy intentionally supports only newline-terminated artifacts, prove all 25 selected artifacts satisfy that condition before any debates run; otherwise support both cases rather than replacing tasks.

## Frozen framing text — **APPROVE**

The framing text is correctly scoped. It clearly states that:

- The displayed additions are a review window, not patch history.
- The baseline is synthetic and not evidence.
- The working tree is the review object.
- Reviewers must not infer newness or intent from diff presentation.

It contains no defect-specific guidance and is identical across arms. Hashing it into the manifest and delivering it to every critic and defender is appropriate.

One delivery copy should be canonical. Generate both prompt placements from the same frozen file and verify their byte identity; do not maintain separately copied literals that can drift.

## Determination of the stimulus

With exact audited ranges, the stimulus is fully determined if the implementation proves all of the following:

1. The range concatenation is byte-identical to the frozen artifact.
2. The synthetic base differs from the buggy source only by removal of those exact ranges.
3. Restoring the ranges reconstructs the audited buggy-SHA working tree byte-for-byte.
4. The canonical added-line payload is byte-identical to the artifact.
5. Diff addition count and newline state agree with the artifact’s declared representation.
6. Both arms receive identical collected context and identical framing.

No subsequence uniqueness test is needed after inference is removed; the explicit ranges are the placement authority, and the reconstruction assertions prove that authority is consistent with the artifact.

After the sidecar is kept behind the contamination boundary and construction failure no longer implies automatic task replacement, I approve the v2 design prospectively.