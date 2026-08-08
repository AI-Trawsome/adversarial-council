# PILOT-T01 — Run record, isolation design, and scoring asterisk

> **Superseded for results.** T01 was re-run on 2026-08-08 under the final scoring configuration; see `reviews/RERUN-T01.md`. The results in §6.3 below are descriptive evidence about the machinery, not data about the benchmark question — per R-001, which requires both arms re-run rather than pairing a clean Arm A against this slice-only, token-incomplete Arm B. **The isolation design in §2 remains current and governs every task.**

**Task:** T01 · aiohttp · buggy SHA `4ef04d66fa45` · ground-truth fix SHA `4eb358863b37`
**Status:** pilot run. Arm B scoring; **Arm A NON-SCORING** (see §4).
**Date:** 2026-08-07
**Purpose of this document:** record the context-isolation design adopted for the benchmark, the T01-specific contamination event and its consequence, and the construction decisions that a reader (or ChatGPT's review) must be able to audit.

---

## 1. Why this document exists

The benchmark's central claim is that the *only* independent variable between Arm A and Arm B is the identity of the critic (BENCHMARK.md §1). That claim is only true if no party to a debate carries knowledge it should not have. During the first T01 attempt the orchestrating Claude session read the maintainer's fix commit while setting the task up, and then went on to act as the defender. That session therefore knew the ground-truth defect before the debate began — a contamination of exactly the kind the arms are meant to exclude.

The rest of this document is the design that prevents a recurrence, plus the honest accounting of what that first attempt costs us.

## 2. Isolation design (applies to all 25 tasks, both arms)

### 2.1 Roles and who may know what

| Role | May read the fix commit? | Realized as |
|---|---|---|
| Artifact constructor | **Yes** — this is its whole reason to exist | fresh subagent, one per task |
| Contamination auditor | Reads only the construction record | fresh subagent |
| Orchestrator (the main session) | **No** | the session driving the runner |
| Critic, Arm A | **No** | fresh context-isolated subagent |
| Critic, Arm B | **No** | Codex, via the council plugin |
| Defender, both arms | **No** | fresh context-isolated subagent, one per round |
| Grader | Yes — grading happens after both arms close | separate pass, per BENCHMARK.md §3 |

The constructor absorbs the ground-truth knowledge so that nobody downstream has to. It emits exactly two things: the artifact, and a construction record.

### 2.2 The construction record is contamination-safe by construction

The record carries provenance and mechanical compliance only: repo, buggy SHA, fix SHA as a bare identifier, source paths, retained line ranges as raw numbers, line count against the 30–500 window, sha256, excluded paths with mechanical reasons, `py_compile` result, and a verbatim attestation with a re-verification command.

It may not carry the nature of the defect, the bug class or any synonym, the fix commit's message or subject, any part of the fix diff, the name of the symbol the fix changed, characterizations ("subtle", "in the cleanup path"), or issue/PR numbers.

Retained line ranges *are* permitted even though they bound the defect's neighbourhood — the reviewers see the slice regardless, so the ranges add nothing they don't already have. Prose about what is wrong inside those lines adds a great deal, and is barred.

**Ordering matters.** The orchestrator cannot verify the record is safe by reading it — reading it is the very act that would contaminate. So a separate auditor subagent reads the record first, redacts any leak in place, and reports only a verdict. On T01 the auditor returned **REDACTED**: one passage, category "upstream issue/PR number embedded in an excluded-path filename". Provenance fields: COMPLETE. The orchestrator has not read the record and will not until grading.

### 2.3 Critics and defenders never see the frame

Every critic and every defender, in both arms, runs as a fresh context-isolated subagent. None of them sees:

- BENCHMARK.md, this file, or any benchmark scaffolding
- the task subject line (the maintainer's fix commit message is a near-complete answer key)
- the bug class label from Appendix A
- the arm they are in, or that a benchmark exists at all
- any prior round's private reasoning from the other role

They see the artifact, the ledger, the frozen prompts, and nothing else. A defender subagent is spawned fresh per round; it inherits the ledger through the runner, not through a conversation.

### 2.4 The orchestrator does not read findings

This one is easy to miss and it is the sharpest edge in the whole design. The schedule runs both arms of a task back to back. If the orchestrator reads Arm B's findings and then briefs Arm A's critic, Arm A inherits Arm B's search — and the measured difference between the arms collapses into an artifact of the orchestrator's memory.

So: all runner stdout carrying finding text is redirected to files. The orchestrator reads only control-plane fields — debate id, round number, counts of new findings and response changes, tripwire flags, continue/stop — extracted with `jq`. It never reads `critique` payloads, rebuttal bodies, `verdict.md`, or `ledger.json` during the run. Subagents receive file *paths*, not pasted content, and are instructed to report counts rather than claims.

This is what makes running both arms from one session legitimate. Without it, arm order would be a confound.

### 2.5 Reviewers get the slice, not the checkout — a flagged deviation

BENCHMARK.md §2 says reviewers "receive the repo checkout and the diff". Appendix A's uniform artifact spec says the artifact is the fix-touched file at the buggy SHA, sliced to the enclosing scope.

These pull apart, and we followed Appendix A, for a concrete reason: **the task checkout's object store contains the fix commit.** `/Users/michaeltraw/Dev/council-bench/T01` is a clone with HEAD detached at the buggy SHA, but `git log --all` or `git show 4eb358863b37` inside it hands a reviewer the answer key. Handing reviewers that checkout would defeat the isolation this document exists to establish.

Reviewers therefore work in a separate repository (`T01-review`) containing an empty baseline commit and the artifact slice as its only untracked file. Both arms get byte-identical framing, so the A/B comparison is unaffected — but the *absolute* detection rates are rates for slice-only review, not whole-repo review, and no reviewer in either arm can run the project's test suite.

**This is a real deviation from §2 and is flagged for ChatGPT's review and Michael's approval.** It is exactly the kind of thing a pilot is for. Two ways to close it, both acceptable to us:

1. Record it as an Amendment Log entry (artifact = slice, no checkout) and re-run under amended rules per §5's separate-result requirement; or
2. Give reviewers a *scrubbed* checkout — repo at the buggy SHA with the object store truncated so no descendant of the buggy commit exists — which honours §2 literally and preserves isolation. This is more construction work per task and would need to be applied uniformly to all 25.

We have no stake in which. We do have a stake in it being decided before the scoring run rather than after.

## 3. T01 construction record (mechanical, orchestrator-verifiable)

| Item | Value |
|---|---|
| Artifact | `T01-review/aiohttp/connector.py` |
| Lines | 444 (window 30–500: **PASS**) |
| sha256 | `9df9bfd18df8b27a758b95aad9f0c52feb7e572dc65e6b364dcafa0117773b14` |
| `py_compile` | PASS |
| Verbatim check | PASS — every artifact line is an order-preserving subsequence of `git show 4ef04d66fa45:aiohttp/connector.py` (1697 lines); 0 lines unmatched |
| Excluded from artifact | one test file, one changelog fragment, one contributors metadata file |
| Construction record | `T01-artifact/CONSTRUCTION-RECORD.md` (audited, 1 redaction; unread by orchestrator) |
| Prior-session artifact | archived at `_archive/T01-connector-prev-session.py` (397 lines, sha256 `f28a6516…`) — superseded, not used |

The verbatim check is worth stating plainly because it is the one property a reader cannot take on trust: the artifact contains no line that is not in the buggy-SHA source, in that order. No added comments, no elisions inside a body, no reformatting.

## 4. The T01 asterisk — Arm A is NON-SCORING

**What happened.** In the first T01 attempt the orchestrating session read the fix commit during task setup and then acted as defender. Arm A's defender was therefore contaminated with ground truth.

**Consequence.** T01 Arm A is marked **NON-SCORING** and is excluded from the S1/S2/S3 aggregates. T01 Arm B is unaffected and scores normally — its critic is Codex, which never touched the contaminated session.

**Why we are not simply re-running it and calling it clean.** We could. Under the §2 design the defender is a fresh subagent that never sees the fix commit, this file, or the orchestrator's history, so a re-run Arm A would be clean by construction. But "clean by construction" is precisely the claim under review. Asserting it ourselves, about our own contaminated task, and then scoring the result, is the sort of self-certification the council exists to catch. So:

> **T01 Arm A may be re-run clean and scored if — and only if — ChatGPT's review accepts subagent isolation (§2.3) as sufficient to break orchestrator contamination.** If accepted, the re-run replaces the NON-SCORING mark and the change is recorded here and in the Amendment Log. If not accepted, T01 contributes Arm B only, and the aggregate is computed over 24 paired tasks plus one unpaired Arm B result, reported as such.

Note the asymmetry this creates if left unresolved: an unpaired Arm B result cannot enter a paired A-vs-B comparison. Our expectation is that the honest handling is to drop T01 from the paired aggregate entirely and report it separately, rather than let one arm sit in the numerator with no denominator. That, too, is for the review to settle.

**Scope of the contamination.** It is confined to T01. No other task was set up by the contaminated session. The schedule (`bench-schedule.json`), drawn before any task ran, is unaffected — the entropy was committed in advance and T01's order (B first, then A) is honoured below.

## 5. Checklist (BENCHMARK.md §5a) — T01

```
☑ Fresh checkout of the task repo at the buggy SHA (no state reused from prior tasks)
      T01 clone, HEAD detached at 4ef04d66fa45, clean tree, untouched by construction
☑ BENCHMARK.md SHA-256 matches the hash recorded in the freeze commit
      72d09391d09a91db1083420b293968c8c5c87d3ee3ead92ad0af00734557562f — verified.
      This gate covers the FROZEN SPEC ONLY. BENCHMARK.md is never edited, including to
      add amendments — an edit would change this hash and fail the gate for every
      remaining task. Amendments and rulings live in reviews/BENCHMARK-AMENDMENTS.md.
☑ Council plugin at the pinned commit; protocol test suite passes; no local modifications
      pinned 70ccee139cd0da64c886c5af9c3d16f82a6e5226 (per bench-schedule.json); tree clean;
      protocol-tests.mjs: 31 passed, 0 failed
☑ Model identifiers recorded
      Defender/Arm-A critic: claude-opus-5[1m]. Critic Arm B: codex-cli 0.147.0,
      model unpinned (CLI default) — recorded from turn metadata after the run
☑ Prompt files byte-identical to the frozen package (directory hash recorded once per run)
      sha256 over prompts/ + schemas/ + commands/: d0f31db6840ef6fe5410d018320a58a35e33172e11cc17c01efb16843dc49473
☑ Runner defaults unchanged (round cap 3; no env overrides except COUNCIL_MOCK_CRITIQUE for Arm A)
☑ Identical timeout policy across arms
☑ Arm order for this task follows the pre-recorded coin-flip schedule (§5)
      bench-schedule.json T01: byte 51 → B first, then A
☑ Same machine and environment for both arms of a task; machine recorded once per run
      macOS 26.5.2, arm64, node v25.6.1
☑ Full debate directory archived per task per arm — see §6.5
☐ Verdict graded by a human per §3 before any implementation change is made — pending Michael
```

Two items on the model row deserve a note rather than a checkmark's silence: Codex's model is not pinnable through the subscription CLI surface, which BENCHMARK.md §5a already acknowledges; we record what the turn reports and accept that provider-side change is attributable, not preventable.

## 6. Run log

Both arms ran on 2026-08-07, Arm B first per the schedule. Everything below is control-plane data — counts, statuses, timings. The orchestrator did not read a single finding's text, verdict, or ledger body during the run; every figure here came out of `jq` projections over id/status/severity/support fields, and every party received file paths rather than pasted content.

### 6.1 Input identity — the check that makes the comparison mean anything

Both arms were initialized against the same review repository, and the runner's collected review input hashed identically:

```
Arm B  .council/dbt-2026-08-07-770b9e/context.md  sha256 e4f4f39cce8f3bf7a9c36d865890dd5e7e6c85b0a7ad7d84d0d30452bbdca990
Arm A  .council/dbt-2026-08-07-c5d2f4/context.md  sha256 e4f4f39cce8f3bf7a9c36d865890dd5e7e6c85b0a7ad7d84d0d30452bbdca990
```

Arm B's `.council/` directory was moved out of the repository before Arm A was initialized. This is not housekeeping — the runner collects context via `git status --untracked-files=all`, so leaving Arm B's ledger in place would have embedded Arm B's findings verbatim in Arm A's review input. The identical hash above is the evidence that it did not happen. Any future task must repeat this reset between arms.

### 6.2 Arm A's critic prompt

Arm A's critic is Claude driven through `COUNCIL_MOCK_CRITIQUE`. The runner interpolates its critique template internally and discards it when mocked, so the harness `_runs/armA-prompt.mjs` reconstructs the identical prompt from the live debate state, using the plugin's own `interpolateTemplate` and a verbatim copy of the runner's `compactLedger()`. The only substitution is the template file.

Per BENCHMARK.md §1's requirement that a diff of the two arms' prompt files be reported, here it is in full — two lines, both pure role reference:

```diff
--- prompts/critique.md            (Arm B)   sha256 d641fb41e58c1c5a…
+++ _prompts/critique-armA.md      (Arm A)   sha256 eeef25123097e780…
@@ -1,7 +1,7 @@
 <role>
-You are Codex, the critic in a structured adversarial debate about whether a code change should ship.
+You are the critic in a structured adversarial debate about whether a code change should ship.
 Your job is to break confidence in the change, not to validate it.
-A defender (Claude) will rebut your findings. This is round {{ROUND}} of at most {{MAX_ROUNDS}}.
+A defender will rebut your findings. This is round {{ROUND}} of at most {{MAX_ROUNDS}}.
 Target: {{TARGET_LABEL}}
```

One residue to declare rather than bury: the literal string `"codex"` survives in Arm A's prompt as the output contract's wire label for `side` and `claimant`, because the runner validates against that literal. Arm A's critic was told, in the harness wrapper, that this is a protocol field name and not a claim about its identity. It is the one place where Arm A's critic can infer something about the protocol's shape. We judge it immaterial; we record it so someone else can disagree.

### 6.3 Results

| | **Arm B** (Codex critic) | **Arm A** (Claude critic) |
|---|---|---|
| Debate id | `dbt-2026-08-07-770b9e` | `dbt-2026-08-07-c5d2f4` |
| Rounds used | 3 of 3 (hit the cap) | 2 of 3 (settled early) |
| Findings total | 3 | 3 |
| — raised by critic | 1 | 2 |
| — raised by defender | 2 | 1 |
| Final statuses | 3 accepted | 3 accepted |
| Severities | 1 high, 2 low | 1 high, 1 medium, 1 low |
| Support levels | 1 strong, 2 moderate | 1 strong, 2 moderate |
| Unsupported findings | 0 | 0 |
| Protocol flags | 0 | 0 |
| Ship line | NO-SHIP: 1 accepted high/critical finding | NO-SHIP: 1 accepted high/critical finding |

Per-round ledger activity (`newFindings` / `responseChanges`):

```
Arm B   r1 codex 1/0   r1 claude 1/1   r2 codex 0/2   r2 claude 1/1   r3 codex 0/1   r3 claude 0/0
Arm A   r1 codex 2/0   r1 claude 1/2   r2 codex 0/2   r2 claude 0/1
```

Both arms closed with every finding settled and nothing disputed — no `rejected`, `withdrawn`, or unanswered-at-close entries in either ledger, and the sycophancy tripwire did not fire in either. Arm B used its full round budget; Arm A converged a round earlier.

**These numbers are not yet a result.** Ground-truth detection (§3.1) is the primary metric and it has not been graded — grading happens after both arms complete, by both models, against the fix commit, with disagreements resolved by Michael. Nothing above says whether either arm found the actual defect. Two ledgers that look this symmetric could still differ completely on that question, in either direction.

### 6.4 Cost — and a metric gap that must be closed before the scoring run

| | Arm B | Arm A |
|---|---|---|
| Critic wall-clock | 57.1 s (Codex: 19.8 + 23.8 + 13.5) | 662.2 s (Claude: 162.1 + 500.1) |
| Defender wall-clock | 458.2 s (208.2 + 145.0 + 105.1) | 472.8 s (223.1 + 249.7) |
| Total wall-clock | ≈ 515 s | ≈ 1135 s |
| Claude tokens | 181,706 (defender only) | 299,292 (both roles) |
| Codex tokens | **not captured** | n/a |

**The gap:** the runner recorded `usage: null` for all three Codex turns. Token capture is best-effort in `stepCritique`, and it returned nothing here. That leaves S3 — "Arm B's median per-task cost is ≤ 3× Arm A's" — uncomputable on the token axis for Arm B, and S3 is a pre-registered gating criterion.

Wall-clock is intact and is the more favourable axis for Arm B anyway (Codex critiques ran an order of magnitude faster than Claude ones), so the pilot is not wasted. But a scoring run cannot proceed with a gating metric half-instrumented. This is a plugin fix, not a spec change: §5 explicitly permits fixing implementation bugs discovered mid-run provided affected tasks are re-run in both arms and noted. Since T01 is a pilot and nothing has been scored, the clean sequence is to fix token capture first, then start the scoring run.

Worth noting for whoever reads the cost table later: Arm A is not the cheap arm. It pays Claude for both roles and came out ~65% more expensive in tokens and ~2.2× in wall-clock than Arm B did on the Claude side. Whether that survives contact with Codex's uncaptured token count is exactly what S3 exists to decide.

### 6.5 Archived artifacts

```
_runs/T01-armB/   init.json, critique-r{1,2,3}.json, rebut-r{1,2,3}.json, verdict.md,
                  debate/{context.md, debate.json, ledger.json, rebuttal-r{1,2,3}.json, verdict.md}
_runs/T01-armA/   init.json, prompt-r{1,2}.txt, critique-mock-r{1,2}.json,
                  critique-r{1,2}.json, rebut-r{1,2}.json, verdict.md,
                  debate/{context.md, debate.json, ledger.json, rebuttal-r{1,2}.json, verdict.md}
_runs/armA-prompt.mjs          harness that reconstructs Arm A's critic prompt
_prompts/critique-armA.md      Arm A critic template
_prompts/armA-vs-armB-prompt.diff
T01-artifact/                  artifact + CONSTRUCTION-RECORD.md (unread by orchestrator)
_archive/                      superseded prior-session artifact
```

The §5a checklist item "full debate directory archived per task per arm" is now satisfied. The remaining unchecked item is human grading, which is Michael's.

## 7. What this pilot asked for — and how it was ruled

Three things were put to external review on 2026-08-08T02:46Z (consult exchange 001, committed verbatim at `reviews/CHATGPT-RULING-013-pilot-t01-amendments.md`). All three were approved, with conditions. The full record is `reviews/BENCHMARK-AMENDMENTS.md`; the short version:

1. **Fix Codex token capture** (§6.4) — **approved** as a §5 mid-run implementation fix (A-001), conditional on a protocol-level test guarding it, preservation of raw provider usage with no estimated substitutes, and re-running both arms of affected tasks.
2. **Rule on §2.5**, slice versus checkout — **approved** (A-002), but neither of the two options we offered. Reviewers get a *scrubbed full checkout*: the tree exported at the buggy SHA into a history-free repository, with no object database, alternates, packfiles, reflogs, remotes, tags, branches, submodule metadata, worktrees, or replace/graft refs, plus a manifest proving the export matches the buggy tree. Applied uniformly to all 25 tasks.
3. **Rule on §4**, subagent isolation — **approved** (R-001), qualified: because all parties share a filesystem, fresh context alone establishes nothing, and the allowlisted input discipline plus the byte-identical context hashes are load-bearing parts of the approval rather than supporting detail.

**Consequence for this document.** T01's Arm A is no longer merely non-scoring — *both* T01 arms are superseded. The ruling requires re-running the task under the final scoring configuration rather than pairing a clean Arm A against this Arm B, which is slice-only and token-incomplete. The results in §6.3 stand as descriptive evidence about the machinery, not as data about the question the benchmark asks.

That is a larger correction than the one this report proposed, and it is the right one. Pairing a re-run Arm A against the Arm B recorded here would have introduced exactly the kind of confound the §6.1 input-identity check exists to rule out — different review inputs across arms — and we would have had to disclose it anyway.

**Amendments are not written into BENCHMARK.md.** The frozen file's §5a checklist verifies its own SHA-256 before every task, so editing it to add an Amendment Log would fail that gate for every remaining task. BENCHMARK.md stays byte-identical to the freeze; `reviews/BENCHMARK-AMENDMENTS.md` carries the amendments, the authorization, and the forced sequencing.
