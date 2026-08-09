# BATCH T02–T06 — run record

**Date:** 2026-08-08 · **Status:** all ten debates run and closed; **ungraded**
**Configuration:** identical to `reviews/RERUN-T01-v2.md` §1 — staging v2, exclusion policy v2, frozen framing, plugin pinned `f976990`, protocol suite 46/0, `BENCHMARK.md` verified `72d09391…`.

Grading is deferred until all 25 tasks have run both arms, per BENCHMARK.md §5's run-all-then-grade order. **Nothing here is a result.** Ground-truth detection is the primary metric and has not been judged; no claim below should be read as one arm outperforming the other.

## 1. Task construction

| task | repo | buggy SHA | artifact lines | ranges | syntax check |
|---|---|---|---|---|---|
| T02 | redis-py | `d2113afaebeb` | 370 | 1 | `py_compile` PASS |
| T03 | redis-py | `0406e85e77c5` | 312 | 2 | `py_compile` PASS |
| T04 | undici | `a8ea6f285a92` | 256 | 5 | `node --check` PASS |
| T05 | undici | `fc8bb7553827` | 208 | 1 | `node --check` PASS |
| T06 | bullmq | `17004b71766e` | 477 | 6 | TypeScript parser API, 0 diagnostics |

All five verified before construction: the recorded buggy SHA is exactly the fix commit's parent in every case, and the fix dates match Appendix A.

T06's syntax check is a disclosed substitute — `npx tsc` was unavailable offline, so the constructor used the TypeScript compiler API's parse diagnostics and recorded exactly that. It did not claim a check it had not run.

**Contamination audit:** one auditor swept all five construction records and sidecars. **8 leaks found and redacted** — 6 search-narrowing hunk-location statements, 1 fix-diff stat block, 1 characterization of the changed code. All five records retained complete provenance; all five sidecars passed the nine-key closed schema and the range arithmetic. The auditor also flagged that two excluded-path filenames are suggestive enough to deserve a second look; those live behind the contamination boundary and were not read by the orchestrator.

**Scrub + staging:** all five scrubbed checkouts PASS 26 checks; all five staged artifacts PASS 16 checks, with `diffAddedLines == artifactContentLines` in every case.

## 2. The staging invariant caught a real defect

T02 and T05 **aborted** staging on `diff addition count does not equal the artifact line count`.

Cause: both slices cover their entire source file, so the synthetic base had every line removed — and `[].join("\n") + "\n"` produces a file containing one blank line rather than an empty file. Git pairs that blank against a blank line in the restored file and reports one addition fewer than the artifact has.

Under staging v1 this would have shipped a stimulus one line short of the frozen artifact with nothing complaining. It is the clearest evidence so far that the assertion earns its cost.

Handled per consult 004: the assertion aborted the run, the tooling was repaired, and **the same tasks were rebuilt**. No task was replaced. Both the constructor and the auditor were patched in step so the auditor's expected base still mirrors the constructor's, and T03/T04/T06 were re-audited for regression (PASS, 0 failed).

## 3. Results — control-plane only

| task | arm | rounds | findings | claimants | severities | ship line |
|---|---|---|---|---|---|---|
| T02 | B | 3 | 7 | codex 6, claude 1 | high 6, medium 1 | NO-SHIP |
| T02 | A | 2 | 6 | codex 5, claude 1 | critical 1, high 3, medium 2 | NO-SHIP |
| T03 | B | 2 | 4 | codex 3, claude 1 | high 1, medium 3 | NO-SHIP |
| T03 | A | 3 | 6 | codex 4, claude 2 | high 4, medium 2 | NO-SHIP |
| T04 | B | 2 | 2 | codex 2 | high 2 | NO-SHIP |
| T04 | A | 1 | 1 | codex 1 | critical 1 | NO-SHIP |
| T05 | B | 1 | 2 | codex 2 | high 1, medium 1 | NO-SHIP |
| T05 | A | 2 | 4 | codex 3, claude 1 | high 1, medium 2, low 1 | NO-SHIP |
| T06 | B | 2 | 1 | codex 1 | high 1 | NO-SHIP |
| T06 | A | 1 | 2 | codex 2 | high 1, medium 1 | NO-SHIP |

Every arm of every task closed NO-SHIP. **Zero protocol flags across all ten debates** — the sycophancy tripwire did not fire once. No finding was mechanically forced to `unsupported`, and nothing closed as `open`/unanswered.

Both arms of each task received byte-identical collected context (verified by hash at init) and identical framing text.

Reviewers executed real reproductions in most debates under the frozen scratch-environment policy. Two exceptions, both recorded: T06's defenders could not build a project environment (dependencies and a required service unavailable) and rested on source citations, explicitly claiming no repro credit; T03's Arm A defenders worked statically in two rounds.

## 4. Cost

Stated on the **non-cache-read basis** (`output + fresh input + cache write`) for Claude, plus runner-captured Codex totals. Claude usage is raw per-message payloads copied verbatim from the harness's per-subagent transcripts: **34 invocations, 34 captured, 0 missing.**

| task | Arm A | Arm B | B/A |
|---|---|---|---|
| T02 | 741,754 | 649,809 | 0.88× |
| T03 | 1,616,118 | 371,404 | 0.23× |
| T04 | 391,050 | 437,687 | 1.12× |
| T05 | 763,589 | 197,079 | 0.26× |
| T06 | 492,307 | 403,352 | 0.82× |

Median B/A across T02–T06: **0.82×**, well inside S3's ≤ 3× ceiling. Every Codex turn recorded `usageStatus: captured`; every Arm A round recorded `not-applicable`. No round recorded `missing`.

**This basis is still provisional.** As recorded in `RERUN-T01-v2.md` §4, S3 names no basis, and the choice is not neutral — including cache reads would inflate Arm A by an order of magnitude for reasons that have nothing to do with work performed. The basis must be fixed before scoring, and it must be fixed without reference to which arm it favours. It is now visible that on this basis Arm B is cheaper on 4 of 5 tasks, which is exactly why the decision should not wait.

## 5. Process errors, recorded

**Sequencing error on T03 Arm A.** The orchestrator ran the round-2 critique, skipped the round-2 defender rebuttal, and generated a round-3 prompt. The runner refused it (`phase "awaiting-rebuttal", expected "awaiting-critique"`), so no invalid message entered the ledger — but a full critic turn was spent against a stale ledger, and the orchestrator's own `jq` projection had hidden the `phase` field that would have shown the problem. The stale round-3 artifacts were discarded and the debate resumed correctly from the outstanding rebuttal.

`bench/armA-prompt.mjs` now refuses to build a prompt unless the debate is in `awaiting-critique`, verified to refuse. The tooling gap was real: the script computed `round = debate.round + 1` regardless of phase, so it would silently produce a prompt for a round that could not legally start.

**Locating exposure.** T03's Arm A critic quoted a `git status` line in its final message, putting that task's source path into the orchestrator's context — the same class of exposure already recorded for T01, and the reason subagent briefs from this batch onward forbid quoting repository paths. It is the file, not the defect location; recorded because the rule now forbids it.

## 6. Archived artifacts

```
_rerun2/T0N-staged/                     staged review repo per task
_rerun2/T0N-arm{A,B}-repo/              per-arm working copies
_rerun2/T0N-arm{A,B}/                   control-plane logs, debate/, verdict.md
_rerun2/_sealed/T0N-STAGING.json        sealed staging manifests (locating; unread by orchestrator)
_rerun2/claude-usage-T02-T06.json       raw Claude usage payloads
_rerun2/usage-roster-T02-T06.json       invocation → task/arm/role/round mapping
_scrubbed/T0N/, _scrubbed/T0N-MANIFEST.json
T0N-artifact/{ARTIFACT, CONSTRUCTION-RECORD.md, T0N-RANGES.json}
```

## 7. Status

**6 of 25 tasks complete** (T01–T06), both arms each, all ungraded. Remaining: T07–T18, T21–T25, T19r, T20r — 19 tasks.

Open before scoring, unchanged from `RERUN-T01-v2.md` §7: **name S3's cost basis.** Everything else is settled.
