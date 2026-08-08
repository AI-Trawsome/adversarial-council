# Consult exchange 1 — 2026-08-08T02-46-01-377Z
Thread: 019fdf42-e16d-7b42-9581-8a34444f66d6
Document: PILOT-T01.md

## Sent
Pre-scoring ruling requested on three items in this pilot report: (1) confirm the Codex token-capture repair qualifies as a §5 mid-run implementation fix; (2) rule on the §2 deviation — we propose scrubbed full checkouts (tree exported at buggy SHA into a fresh history-free repo) uniformly for all 25 tasks; (3) rule whether fresh-subagent context isolation is sufficient to break orchestrator contamination, and therefore whether T01's Arm A may be re-run clean and scored, or T01 must report unpaired. Please give explicit APPROVE/REJECT per item with reasons.

## Reply
## Pre-scoring ruling

### 1. Codex token-capture repair — **APPROVE**

This qualifies as a BENCHMARK.md §5 mid-run implementation fix. `usage: null` is an instrumentation failure that makes the preregistered S3 cost criterion uncomputable; repairing capture restores an intended measurement without changing the task, prompts, protocol, or scoring rule.

Conditions:

- Record the code change, cause, and validation in the Amendment Log.
- Validate token capture with a protocol-level test before scoring resumes.
- Re-run both arms of every affected scoring task. Since T01 is explicitly a pilot and ungraded, its existing runs should not be carried into the scoring dataset.
- Preserve both raw provider-reported usage and the normalization/calculation used for S3. Do not silently substitute an estimated token count for provider-reported usage.

### 2. Uniform scrubbed full checkouts — **APPROVE**

Use the proposed history-free checkout for all 25 tasks and both arms. This best reconciles §2’s requirement that reviewers receive a repository checkout with the isolation requirement that they cannot inspect the ground-truth commit.

The scrub must be stronger than merely detaching at the buggy SHA. Each review repository should:

- Contain a newly initialized Git history derived only from the buggy tree.
- Have no original object database, alternates, packfiles, reflogs, remotes, tags, branches, submodule metadata, worktrees, or Git replacement/graft references.
- Exclude benchmark records, fix metadata, issue/PR identifiers, and construction artifacts.
- Present byte-identical task inputs to both arms.
- Be mechanically verified by a construction/audit process that does not disclose defect content to the orchestrator.
- Retain a manifest or hash sufficient to prove that the exported files match the buggy tree.

Record this as a prospective clarification/amendment before scoring. Absolute results should be described as review of a scrubbed buggy-SHA checkout plus the frozen review diff/artifact, not as review of the original clone. If supplying the full checkout changes the pilot’s collected context, T01 must be rerun rather than compared with the slice-only pilot.

### 3. Fresh-subagent isolation and T01 rerun — **APPROVE**

Fresh-subagent isolation is sufficient to break contamination of the orchestrator’s conversational context, provided it is genuine no-history isolation and the contaminated orchestrator cannot transmit information through prompts, summaries, file modifications, environment variables, or selectively chosen inputs.

The documented controls are adequate in principle:

- Fresh critic and defender contexts.
- No benchmark framing or ground-truth material supplied to them.
- File-path handoff rather than orchestrator-authored summaries.
- Contamination-safe construction records reviewed by a separate auditor.
- Byte-identical arm inputs.
- Findings hidden from the orchestrator during execution.
- Fresh defender per round, with state carried only through the frozen ledger.

Filesystem sharing means “fresh context” alone would not be sufficient; the allowlisted input discipline and hashes are essential parts of this approval. The rerun record should attest that each participant could access only the scrubbed checkout and prescribed debate files, and that subagents were spawned without inherited conversation history.

Accordingly, T01 Arm A may be rerun clean and scored. Given the approved token-capture repair and checkout change, the cleaner treatment is to rerun **both T01 arms** under the final scoring configuration and replace both pilot outputs. Do not combine a newly run Arm A with the existing slice-only, token-incomplete Arm B.

If those conditions cannot be demonstrated, T01 must remain unpaired and be excluded from paired A-versus-B aggregates; its Arm B result may only be reported separately as descriptive pilot evidence.