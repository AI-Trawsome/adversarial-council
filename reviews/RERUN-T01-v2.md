# RERUN-T01-v2 — T01 under staging v2

**Task:** T01 · aiohttp · buggy SHA `4ef04d66fa45` · ground-truth fix SHA `4eb358863b37`
**Date:** 2026-08-08 · **Status:** both arms run and closed; **ungraded**
**Supersedes:** `reviews/RERUN-T01.md` (staging v1), which consult 003 rejected

Grading is deferred until all 25 tasks have run both arms, per BENCHMARK.md §5's run-all-then-grade order. Nothing here is a result.

## 1. What changed since the v1 re-run

Consult 003 rejected the v1 staging construction; consult 004 approved the v2 design after two required changes. Implemented:

| | |
|---|---|
| **Range-based staging** | The construction subagent emits exact line ranges; staging asserts rather than infers. v1's greedy subsequence matcher had four ambiguous positions on T01 and silently chose one placement. |
| **`diffAddedLines == artifactContentLines`** | 444 = 444. Under v1 this read 445 against a 444-line artifact — provably a stray line, now impossible: the invariant aborts the run. |
| **Sidecar behind the contamination boundary** | Staging and the auditor read `sourcePath`, `ranges`, and source hashes; the orchestrator receives only a verdict, counts, and non-locating hashes. |
| **Frozen framing text** | One canonical file, delivered identically to critics (via the runner's `focus`) and defenders (which read the same file). Hashed into the sealed manifest. |
| **Claude usage persisted** | Raw per-message payloads copied verbatim from the harness's per-subagent transcripts into the run archive. |
| **Scratch-environment policy** | Preregistered, uniform, archived — `bench/SCRATCH-ENV-POLICY.md`. |
| **Failure policy** | An assertion failure aborts staging and sends the tooling back for repair. It never silently replaces a task; alternates are only for the benchmark's own ineligibility rule. |

## 2. Staging verification

```
stage : verdict PASS, base commit dbd69be7…, artifact 9df9bfd…,
        artifactContentLines 444, diffAddedLines 444, diffDeletedLines 0, window PASS
audit : verdict PASS, 16 checks, 0 failed
```

The auditor re-derives every hash and the base/working-tree relationship from the repository rather than trusting the manifest. Negative test: appending two bytes to the working tree fails 5 of the 16 checks, including the canonical-payload identity.

Both arms initialized against separate copies of the same staged repo, with identical collected context:

```
Arm B  context.md  sha256 aa0f8a294c0e2ec0364755be99deb15bf9fdafe866020c8dec6751e9bcbe95be
Arm A  context.md  sha256 aa0f8a294c0e2ec0364755be99deb15bf9fdafe866020c8dec6751e9bcbe95be
```

Framing text `sha256 63a64714…`, verified byte-identical to the frozen file in both arms' `debate.json` focus fields.

## 3. Results

| | **Arm B** (Codex critic) | **Arm A** (Claude critic) |
|---|---|---|
| Debate id | `dbt-2026-08-08-369c96` | `dbt-2026-08-08-bf4791` |
| Rounds used | 2 of 3 | 1 of 3 |
| Findings total | 3 | 2 |
| — raised by critic | 2 | 2 |
| — raised by defender | 1 | 0 |
| Final statuses | 3 accepted | 2 accepted |
| Severities | 2 medium, 1 low | 1 high, 1 medium |
| Support levels | 1 strong, 2 moderate | 2 strong |
| Unsupported | 0 | 0 |
| Protocol flags | 0 | 0 |
| Ship line | SHIP WITH FIXES | **NO-SHIP** — 1 accepted high |

Note the reversal against the v1 re-run, where Arm B carried the high-severity finding and Arm A did not. Same artifact, same protocol, different framing and different staging — and the arms swapped which one produced the high finding. That is a caution about drawing conclusions from a single task in either direction, and an argument for the full 25 before anyone reads a trend.

Both arms settled every finding; no disputes survived to close in either.

## 4. Cost — and the comparability problem, stated rather than papered over

**Codex** (runner-captured, in `debate.json`):

| round | total | input | cached input | output |
|---|---|---|---|---|
| 1 | 35,212 | 34,446 | 30,464 | 766 |
| 2 | 52,584 | 52,326 | 23,296 | 258 |

**Claude** (raw per-message payloads, `T01-claude-usage.json`, 5 invocations, 0 missing):

| arm | output | fresh input | cache write | cache read | messages |
|---|---|---|---|---|---|
| B (defenders) | 30,860 | 176 | 301,741 | 4,854,274 | 92 |
| A (critic + defender) | 47,172 | 179 | 390,235 | 5,828,849 | 95 |
| construction | 2,935 | 24 | 102,422 | 291,246 | 12 |

> ⚠️ **The Claude token figures in the table above are inflated ~1.7× — see `reviews/ERRATA.md` E-002.** They summed transcript records without collapsing per-content-block duplicates. Superseded figures are preserved there. The corrected, frozen S3 basis (amendment A-003) is **modeled API-equivalent dollars per provider**: T01 Arm A **$3.75**, Arm B **$3.14** (of which Codex $0.22), **B/A 0.84×**. Regenerate with `node bench/compute-s3-cost.mjs`.

**Do not compare the two tables by their largest column.** Anthropic reports `cache_read_input_tokens` per message, and a 90-message agent turn re-reads its cached context every message, so raw processed tokens reach millions without corresponding work or cost. The Codex app-server reports a single per-turn total with cached input *inside* it. Summing both naively would say Arm A costs 25× Arm B, which is an artifact of two different accounting conventions, not a fact about the arms.

On a non-cache-read basis (`output + fresh input + cache write`): **Arm B 332,777 · Arm A 437,586**, plus Codex's 87,796 on Arm B's side — Arm B ≈ 420,573 against Arm A's 437,586, roughly parity.

S3 states "Arm B's median per-task cost is ≤ 3× Arm A's" without defining a basis, which was harmless when both arms were Claude and is not harmless now. **The basis must be named before the scoring run.** The raw payloads are preserved so any basis can be recomputed after the fact; what cannot be recovered later is a decision made honestly in advance rather than after seeing which basis favours which arm.

## 5. Fidelity notes

- **Upstream test suite: not runnable.** Recorded as a fidelity variable for T01. Reviewers in both arms built scratch virtualenvs per policy; their repro archives are stored under each arm's `repro/`.
- Every reviewer reported the working tree and diff untouched at exit.
- The orchestrator read no finding text, verdict, or ledger body during either arm.
- **Recorded exposure.** During the consult-003 diagnostics — before the sidecar rule existed — the orchestrator saw this task's diff hunk offsets and its source path. That is locating information about the *slice*, not the defect, and the slice is fully visible to reviewers anyway. It is recorded because the rule now forbids it, and because T01 is the only task where it happened; from T02 the constructor writes the artifact to an opaque path and the orchestrator never learns either.

## 6. Archived artifacts

```
_rerun2/T01-staged/                     staged review repo (source for both arms)
_rerun2/T01-armB/, _rerun2/T01-armA/    per-arm control-plane logs, debate/, repro/, verdict.md
_rerun2/_sealed/T01-STAGING.json        sealed staging manifest (locating; not read by orchestrator)
_rerun2/T01-claude-usage.json           raw Claude usage payloads
_rerun2/T01-usage-roster.json           invocation → arm/role/round mapping
T01-artifact/T01-RANGES.json            range sidecar (locating; not read by orchestrator)
_scrubbed/T01/, _scrubbed/T01-MANIFEST.json
```

## 7. Open before the scoring run

1. ~~**Name S3's cost basis**~~ — **settled.** Frozen as amendment A-003 (consult 005): modeled API-equivalent dollars computed per provider from `bench/rate-card-frozen.json`, gated on the median of per-task ratios. Two errata surfaced in the process; see `reviews/ERRATA.md`.
2. Everything else from the earlier records is closed: staging countersigned, usage persisted, scratch policy frozen, framing frozen.
