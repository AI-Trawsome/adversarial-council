# BATCH T12–T16 — run record

**Date:** 2026-08-09 → 2026-08-11 · **Status:** all ten debates run and closed; **ungraded**
**Configuration:** as `reviews/BATCH-T07-T11.md` §1 — staging v2, exclusion policy v2, frozen framing, plugin pinned `f976990`, protocol suite 46/0, `BENCHMARK.md` verified `72d09391…`, Codex CLI `0.147.0` — **plus amendment A-004**, adopted mid-batch, which schema-enforces Arm A's critic message in the harness. See §6.

Grading is deferred until all 25 tasks have run both arms, per BENCHMARK.md §5's run-all-then-grade order. **Nothing here is a result.** Ground-truth detection is the primary metric and has not been judged; no line below should be read as one arm outperforming the other.

## 1. Task construction

| task | repo | buggy SHA | artifact lines | ranges | syntax check | slice |
|---|---|---|---|---|---|---|
| T12 | ioredis | `9618206b93d7` | 499 | 3 | TS compiler API, 0 syntactic diagnostics | subset |
| T13 | celery | `aef7f130e3ca` | 499 | 1 | `py_compile` PASS | prefix |
| T14 | fastify | `9d2914857906` | 458 | 2 | `node --check` PASS | subset |
| T15 | undici | `2f66db7322f4` | 389 | 1 | `node --check` PASS | prefix |
| T16 | redis-py | `b121809bd7c7` | 330 | 1 | `py_compile` PASS | identity |

All five verified before construction: the recorded buggy SHA is exactly the fix commit's parent, and the fix dates match Appendix A. T12's TypeScript check is a parser-API substitute, disclosed as T06's was.

**Contamination audit: 0 leaks across all five records, 55/55 verification checks, all five artifacts FULLY CONTAINED** (fix hunks ∩ artifact ranges). Scrub PASS 26/0 ×5 with `--forbidden-sha` asserting the fix commit does not resolve inside each checkout; staging PASS 16/0 ×5. **No two tasks in the batch share a source path.**

## 2. Arm inputs were identical, verified by hash

Both arms of each task initialized from separate copies of the same staged repo. Collected context hashed identically in every case, and each debate's `focus` matched the frozen framing file (`63a64714…`) in all ten debates.

| task | `context.md` sha256 (both arms) |
|---|---|
| T12 | `5c855ad17c130e10ff7492f8bf39a890b0b7810f7d047ca26e3419dded072fea` |
| T13 | `b9083bd17d82d418114f9a54693b8e293beaa59856a4c6a343538906b48e9cc4` |
| T14 | `8ca3e62e0f683d8f9c210c441a690339b25845bc3232c7b68735b211fc0959ae` |
| T15 | `d71aa61375ec4adbb7ee23d0819de4227f1ec57ba905e62cc58d4d753b43d990` |
| T16 | `bdcadb48549621c45bbd1235687043abd420159574500558619366828e10ec93` |

Every arm exited with its working tree and diff intact, verified by comparing the arm repo's diff hash and changed-file count against the staged repo in all ten debates.

## 3. Results — control-plane only

| task | arm | rounds | findings | claimants | severities | statuses | ship line | flags |
|---|---|---|---|---|---|---|---|---|
| T12 | A | 3 | 6 | codex 5, claude 1 | critical 1, high 4, medium 1 | accepted 6 | NO-SHIP | 0 |
| T12 | B | 1 | 2 | codex 2 | high 2 | accepted 2 | NO-SHIP | 0 |
| T13 | B | 3 | 5 | codex 2, claude 3 | high 2, medium 3 | accepted 5 | NO-SHIP | 0 |
| T13 | A | 3 | 6 | codex 4, claude 2 | high 1, medium 4, low 1 | accepted 6 | NO-SHIP | 0 |
| T14 | A | 3 | 4 | codex 3, claude 1 | critical 2, high 2 | accepted 2, partially-accepted 2 | NO-SHIP | 0 |
| T14 | B | 3 | 4 | codex 2, claude 2 | high 3, medium 1 | accepted 3, partially-accepted 1 | NO-SHIP | 0 |
| T15 | A | 1 | 3 | codex 3 | high 1, medium 1, low 1 | accepted 3 | NO-SHIP | 0 |
| T15 | B | 1 | 1 | codex 1 | high 1 | accepted 1 | NO-SHIP | 0 |
| T16 | B | 1 | 3 | codex 3 | high 1, medium 2 | accepted 3 | NO-SHIP | 0 |
| T16 | A | 3 | 5 | codex 5 | high 3, medium 2 | accepted 5 | NO-SHIP | 0 |

Arm order followed the pre-recorded schedule in every case (T12 A-first, T13 B-first, T14 A-first, T15 A-first, T16 B-first). **Zero protocol flags across all ten debates** — the sycophancy tripwire did not fire once, including in the four debates that closed at a 100% accept ratio, each of which cleared the 240-character median-justification bar. Every Codex turn recorded `usageStatus: captured`; every Arm A round recorded `not-applicable`; none recorded `missing`. Debate ids are listed in §9.

**Every finding in this batch closed `accepted` except T14's four disputes**, which closed `partially-accepted` in both arms — the first task in the run where disputes survived to close. Mechanism was agreed throughout in both arms; what persisted was impact and severity, with deciding evidence recorded in every case.

**Defender-claimed findings continue to appear** — T12 A (1), T13 A (2), T13 B (3), T14 A (1), T14 B (2). T13 Arm B is the first debate in the run where the defender raised more findings than the critic.

## 4. Cost

S3 basis is frozen as **modeled API-equivalent dollars, computed per provider from `bench/rate-card-frozen.json`** (amendment A-003). Regenerate with `node bench/compute-s3-cost.mjs --runs _rerun2 --rates bench/rate-card-frozen.json`.

Claude usage is raw per-message payloads copied verbatim from the harness's per-subagent transcripts. **T12–T14: 31 invocations, 31 captured, 0 missing. T15–T16: 11 invocations, 11 captured, 0 missing.**

| task | Arm A | Arm B | of which Codex | B/A |
|---|---|---|---|---|
| T12 | $20.74 | $1.86 | $0.06 (3.1%) | 0.09× |
| T13 | $22.66 | $7.51 | $0.41 (5.4%) | 0.33× |
| T14 | $27.89 | $18.12 | $0.49 (2.7%) | 0.65× |
| T15 | $8.56 | $2.31 | $0.03 (1.4%) | 0.27× |
| T16 | $23.17 | $2.84 | $0.16 (5.6%) | 0.12× |

**Median B/A across all 16 tasks run so far: 0.45×**, against S3's 3.0× ceiling — **PASS**. Codex is 1.4%–5.6% of Arm B's modeled cost in this batch. These are **modeled API-equivalent** figures, not observed spend: Codex ran on a ChatGPT subscription whose marginal cash cost is $0, reported but deliberately not gated, per A-003.

**Wall-clock (§3 metric 5),** derived from per-message timestamps in the archived usage payloads, since the runner's `durationMs` measures only the Codex turn:

| task | Arm A reviewers | Arm B reviewers | Arm B Codex | Arm B total | B/A |
|---|---|---|---|---|---|
| T12 | 80.9m | 6.7m | 1.4m | 8.1m | 0.10× |
| T13 | 77.6m | 30.4m | 2.1m | 32.5m | 0.42× |
| T14 | 684.1m | 81.7m | 2.0m | 83.7m | 0.12× |
| T15 | 32.8m | 7.7m | 1.0m | 8.7m | 0.27× |
| T16 | 78.2m | 8.7m | 0.6m | 9.3m | 0.12× |

Median wall-clock B/A **0.12×**. **T14's Arm A figure needs a caveat rather than a footnote:** it is dominated by two single reviewer turns of roughly 7.7 and 2.5 hours, and it is wall-clock between first and last message — it includes any time the harness was not actively generating, so it is an upper bound on work done, not a measure of it. The dollar basis, which counts tokens rather than elapsed time, puts T14 at 0.65× where wall-clock puts it at 0.12×; where the two bases disagree this sharply, the token basis is the more trustworthy.

Shared overhead outside both arms: construction 3.0–7.6m per task, contamination audit 7.5m.

**Non-scoring usage, disclosed rather than dropped** (`--overhead` flag): **$35.93 total, of which $14.60 is voided runs** — T07 Arm A `voided-A` $6.15 (Q-001 shared scratch) and T15 Arm A `voided-A` $8.45 (A-004, §6). Excluded from S3 by construction and reported as benchmark remediation overhead, per Q-001 condition 11.

## 5. The T15 Arm A schema-enforcement void

Recorded in full as amendment **A-004** in `reviews/BENCHMARK-AMENDMENTS.md`; ruled by consult 007 (`reviews/CHATGPT-RULING-021-armA-schema-asymmetry.md`). In brief:

The arms differed in whether the **critic's output** was schema-enforced. Arm B's Codex critic is called with `outputSchema`, so the provider enforces `council-message.schema.json` at generation time and a malformed reply earns one retry. Arm A's Claude critic delivers through `COUNCIL_MOCK_CRITIQUE`, which the runner reads and uses **without applying the schema**; its hand-rolled `validateMessage()` range-checks `confidence` but never type-checks `evidence`. Since `looksCheckableEvidence()` returns false for any non-string before reading a character, and the anti-inflation rule then rewrites the finding to `unsupported`, which `stepClose` excludes from the verdict — an Arm A critic citing real evidence encoded as an array had every such finding silently deleted, with no error and a runner report saying the round was accepted.

T15 Arm A round 1 hit it. The same critic made two errors of the same kind: `confidence` as the string `"high"` **bounced**, because someone had hand-written a check for that field; `evidence` as an array **did not**. The asymmetry between two identical mistakes is the defect in miniature.

**Scope: T15 Arm A is the first `unsupported` finding in the run.** All 28 previously closed debates carry zero. The ruling held that necessary but not sufficient and required validating every archived Arm A critic payload against the schema now enforced; **29 of 29 across T01–T14 are schema-valid**, including the three rounds of the voided pre-isolation T07 Arm A run, so no earlier task is affected. The audited files are the exact pre-ingestion bytes `COUNCIL_MOCK_CRITIQUE` pointed at, not a ledger-normalized view.

The ruling **rejected** re-injecting a corrected message from the existing seat — it had completed its search and would have been receiving a remedy designed after its output was observed. T15 Arm A was voided as `VOIDED-SCHEMA-ASYMMETRY`, both its scratch seats moved out of `_scratch/` entirely so no future participant can reach them even by a prohibited parent listing, and T15 restarted from the beginning in its scheduled order with fresh seats. Arm B had not begun.

The fix lives in `bench/`, not the plugin: `COUNCIL_MOCK_CRITIQUE` is a benchmark affordance, so this is an arm-delivery defect, and fixing it there **leaves the plugin pinned at `f976990`** so T15–T25 run against the same code under test as T01–T14. Arm A now gets exactly one correction then abort, mirroring Arm B's single retry.

## 6. Harness changes

- **`bench/validate-critique.mjs`** — Ajv 8 against the frozen schema (`6e78ea61…`). Errors emit JSON Pointer paths, expected types and error keywords only; **instance values are never printed**, so a validation failure cannot teach the orchestrator anything about finding content. A test feeds a sentinel string into four fields and asserts it appears in no error string.
- **`bench/inject-armA.mjs`** — validates *before* spawning the runner, so an invalid message cannot mutate the ledger or advance the phase. One correction, then abort. Rejected payloads, error reports and the attempt counter are archived to `_rerun2/_rejected/`, outside any directory reviewers read.
- **`bench/test/harness-schema-tests.mjs`** — **69 assertions, 0 failures**, covering the nine cases the ruling names. In `bench/` on purpose: adding them to the plugin's own suite would move the pin. The nested-response fixtures were rebuilt after the first version was found to pass for the wrong reason (see §7).
- **`bench/compute-s3-cost.mjs`** — gained an `--overhead` mode reporting non-scoring usage. The S3 output is **byte-identical before and after** the change, verified by diff against a stashed working tree. Adding the mode to the same script rather than writing a second one keeps one source of truth for the rate math — the property A-004 condition 2 exists to protect.
- **`bench/audit-armA-payloads.mjs`** — the retrospective audit of §5.

## 7. Process errors, recorded

**A test that passed for the wrong reason.** The first version of the A-004 nested-response tests built fixtures with a key named `id` where the schema requires `finding_id`. Every such case therefore failed validation for *two* reasons at once, and the assertions — which checked only that at least one error of the expected category was present — passed without testing the defect they named. Rebuilt from a response object valid on its own, so each case injects exactly one defect and asserts `errors.length === 1`, plus four new cases. 59 → 69 assertions. The two executable files were untouched, so no run behaviour changed; only the test file's frozen hash moved, and both values are recorded in A-004. A test that passes for the wrong reason is worse than a missing test, because it is counted as coverage.

**The orchestrator hit the zsh word-splitting hazard it had been briefing reviewers about all batch.** Verifying that the `--overhead` change left S3 untouched, the orchestrator routed the command through a shell variable (`$S3`), which zsh delivered as one argv entry; both captured files were empty and the diff passed **vacuously**. Caught by checking byte counts, and redone with the command written literally. This is the same failure mode that turned three reviewer crash probes into false negatives on T14, and it is worth recording that knowing about it is not the same as being immune to it — the lesson generalizes: a comparison that can pass on empty input needs a non-emptiness assertion, not just a diff.

**Orchestrator read T14's sealed staging manifest.** While rebuilding `armlib.sh` after a context restart, the orchestrator dumped the key/value structure of `_rerun2/_sealed/T14-STAGING.json` to work out how to write the tree-integrity check, disclosing that task's `sourcePath`. That file is on the orchestrator's own do-not-read list. **Non-contaminating in effect** — T14 was closed in both arms before the read, a source path locates the slice rather than the defect, and the orchestrator does not grade — but a real breach of the rule, so it is written down. Remedy: `arm_clean_check` was rewritten to compare the arm repo's diff against the *staged* repo's diff by hash and file count only, so it never opens a sealed manifest and never prints a path. No sealed manifest has been opened for T15 or later.

**Two shared read surfaces between the two seats of one arm**, both self-disclosed. The per-arm `repro/` archive is shared between that arm's critic and defender, so listing one's own output there shows the other's filenames (T15 Arm A defender). The per-arm log directory is likewise readable by both, and one defender read a runner artifact there that was not on its reading list (T16 Arm A round 2). **Both assessed non-contaminating and neither biases A against B:** the two seats are the same task, arm and round; everything in either directory derives from the debate itself and both sides already receive it through the ledger and `context.md`; and no sidecar, construction record, ranges file or sealed manifest lives in either place. Critically both channels are **per-arm** — `T<NN>-arm{A,B}/` are separate directories, wiped on init — so there is no cross-arm and no cross-task path. Left as-is rather than re-scoped per seat, since changing reviewer environment mid-run would introduce an inconsistency with T01–T14 for no contamination gain; briefs from T16 round 3 onward tell reviewers to read only what they are pointed at and not to enumerate the archive's siblings. Worth fixing in a future revision by giving each seat its own subdirectory.

**T12 constructor read T11's artifact directory** — exposure `SIDECAR FIELDS`. Non-contaminating: T11 was already closed, the repositories differ (ioredis vs undici), and constructors sit behind the contamination boundary and do not review. Caused by a gap in the constructor brief; the prohibition is now standard.

**T12 Arm A round-1 critic named a repository source path** in its final message, breaching the control-plane rule — the same class as the T01 and T03 exposures. It locates the slice, which reviewers see anyway, not the defect. The closing instruction now names the failure mode explicitly: status lines, quoted commands, sweep results, and "in passing" mentions.

**T15 constructor listed the `_scratch/` parent** — opaque names only, and constructors sit behind the boundary.

## 8. Protocol observations

**The runner's validation has now stopped three malformed messages at the boundary** — T03's stale-round refusal, T13 Arm A's duplicate id, and T15 Arm A's non-numeric `confidence`. In every case no invalid state entered the ledger and the phase was unchanged, so the debate resumed cleanly after correction. That is evidence the neutral-runner design earns its cost. **Corrections are always sent back to the same seat**: the orchestrator never edits a reviewer's message, even for a purely mechanical field, and the correction instruction states that no claim, evidence, severity or support level may change.

**The ledger's transition table needs to be in reviewer briefs, not just its withdrawal warning.** T13 Arm A's round-2 defender tried to express a reopening by filing a new finding under the original id; the runner refused it as a duplicate, and its first correction filed a *separate* finding instead — which would have left the original sitting contested with a near-duplicate superseding it in prose. Corrected to use the response mechanism. Since the full table went into the briefs, **it has worked twice**: T16 Arm A's round-2 and round-3 critics each conceded part of their own position through `partial`-with-new-evidence rather than `accept`, so nothing was withdrawn. That is precisely the manoeuvre that cost T11 Arm A two findings outright.

**A reopening is not mechanically required to carry new evidence.** The transition table expects `reject`/`partial` on your own contested finding to come with new checkable evidence, but T14 Arm B's critic reopened the same finding in rounds 2 *and* 3 citing only the defender's own prior outputs. Both times the defender produced fresh evidence rather than arguing from the record. Report as a gap between the documented expectation and what is enforced; do not assume a reopening means new evidence exists.

**A settled finding's fields cannot be amended.** T13 Arm A's closing defender concluded the recorded `confidence` on a settled finding understated it (0.75 against an honest 0.9, severity unchanged) and found no legal mechanism to correct it. The ledger closes at the original figure with the disagreement in `notes` only. **Graders should read `notes` alongside the fields.**

**Fidelity variables are reviewer-dependent.** On T12 the Arm A critic and defender initially reported incompatible suite-runnability results; the round-2 critic re-established it and corrected its own round-1 note. Record fidelity per reviewer, not as one fact per task.

**Fidelity limits in this batch, applying identically to both arms.** T16's server-dependent tests were unrunnable in both arms (no live backing server; reviewers correctly declined to start a system-level service outside their seats and recorded it as a limit rather than inferring a result). T15's undici tests needed an external test-corpus submodule not present in the scrubbed tree. Both bound absolute detection claims in the way A-002 already requires disclosing; neither affects the A-versus-B comparison.

**zsh does not word-split unquoted parameter expansions.** Routing a probe's argument list through a single variable collapses it into one argv entry, silently turning crash probes into false negatives — every probe reports survival. **Three reviewer seats hit this on T14**, two of which had to invalidate and regenerate archives they had already written; the orchestrator then hit it itself (§7). It is now a standing brief warning, together with the absence of `timeout(1)` on this platform.

## 9. Reviewer conduct, recorded because grading will not see it

Reviewers repeatedly re-implemented the opposing side's nominated experiments from prose rather than executing the archived scripts, explicitly so their agreement would count as independent corroboration rather than an echo — and said so unprompted.

Several reported measurements that cut against their own position and priced them in. T16 Arm A's round-2 defender **reversed both positions its round-1 predecessor had taken**, reading only the ledger, because its own measurements defeated both rejections; it also cleared a stale support-level contest it judged no longer supportable rather than leaving it in the record. T16 Arm B's defender showed a downstream layer absorbs part of a finding's claimed impact and **accepted the finding at the stated severity anyway**, recording the narrower blast radius rather than bargaining severity down. T16 Arm A's round-3 critic reported that one of its own experiments reproduced the *defender's* counter-evidence, and narrowed its proposed remedy because of it. The closing defender then reproduced the critic's round-3 result from prose and accepted rather than holding out.

Two seats disclosed **re-running experiments after finding flaws in their own harnesses** — a file-descriptor leak in a helper thread, and an object built by bypassing its public constructor — and reported both the flawed and the corrected runs rather than only the good one. One critic filed six negative results into `notes` so the defender would not have to re-derive them. Another declined to fetch an upstream published copy of the component for comparison, on the grounds that it would amount to looking up the answer rather than reviewing the material as presented — a correct reading of the network rule that no instruction spelled out.

Where an experiment's evidence undercut a claim's **reachability** rather than its **impact**, one defender contested the support level instead of shaving the severity. That is the distinction the rebuttal guidance is reaching for, arrived at independently.

## 10. Archived artifacts

```
_rerun2/T1N-staged/                              staged review repo per task
_rerun2/T1N-arm{A,B}-repo/                       per-arm working copies
_rerun2/T1N-arm{A,B}/                            control-plane logs, debate/, repro/, verdict.md
_rerun2/T15-armA-VOIDED-SCHEMA-ASYMMETRY/        voided run: logs/, repo/, seat-critic/, seat-defender/, VOIDED.md
_rerun2/_rejected/                               schema-rejected Arm A payloads and error reports
_rerun2/_sealed/T1N-STAGING.json                 sealed staging manifests (locating; not read by orchestrator)
_rerun2/claude-usage-T12-T14.json                raw usage payloads, 31/31 captured
_rerun2/claude-usage-T15-T16.json                raw usage payloads, 11/11 captured
_rerun2/usage-roster-T12-T14.json                reconstructed roster (see below)
_rerun2/usage-roster-T15-T16.json                roster written at spawn time
_scrubbed/T1N/, _scrubbed/T1N-MANIFEST.json
T1N-artifact/{ARTIFACT, CONSTRUCTION-RECORD.md, T1N-RANGES.json}
_scratch/s<12-hex>/                              per-seat reviewer scratch (opaque names)
_seatmap/SEAT-MAP.json                           seat → directory mapping (outside _scratch by design)
```

Debate ids — T12 `f09e0e`/`0d9f12`, T13 `90141e`/`03e11c`, T14 `742333`/`95bfec` (all prefixed `dbt-2026-08-10-`); T15 `d9fc11`/`d39f87` (voided Arm A `3ba347`), T16 `75c222`/`f92eda` (all prefixed `dbt-2026-08-11-`).

**The T12–T14 usage roster was reconstructed, not recorded live.** Agent ids for those invocations were not captured at spawn time. They were recovered from the subagent transcript directory by bracketing each transcript's first and last message timestamp against the round boundaries visible in the arm log-file mtimes. The reconstruction is **exhaustive rather than best-effort**: that session holds 69 transcripts, 38 of which the T07–T11 roster already claims, and the remaining 31 are exactly 5 constructors + 1 contamination auditor + 25 debate participants — nothing left over, nothing claimed twice. Constructors were told apart by the mtime of the `CONSTRUCTION-RECORD.md` each wrote, which precedes that agent's final message by ~20 s in all five cases. Only ids and timestamps were read; no transcript content entered the orchestrator's context. From T15 onward each agent id is recorded in the roster as the subagent is spawned.

## 11. Status

**16 of 25 tasks complete** (T01–T16), both arms each, all ungraded. Remaining: T17, T18, T21–T25, T19r, T20r — **9 tasks**.

Outstanding before grading, all ordered and none blocking further running:

1. **Q-001 re-run: both arms of T01–T06** under per-seat isolation, twelve binding conditions.
2. **Q-001 condition 12: audit T07–T11** against the final isolation policy, testing actual cross-task exposure rather than assuming it benign.
3. **Q-002 condition 8: contamination-safe dependency screen across all 25 tasks.** If it finds dependent components beyond T10/T11, grading pauses for one uniform component-level rule.
4. Compute S3 over everything and write `reviews/READY-TO-GRADE.md`.

Michael Traw's approval is still pending on Q-001, Q-002 (ruled 2026-08-09) and now A-004 (ruled 2026-08-11).
