# BATCH T17–T20r — run record

**Date:** 2026-08-12 → 2026-08-13 · **Status:** all eighteen debates run and closed; **ungraded**
**Configuration:** as `reviews/BATCH-T12-T16.md` §1 — staging v2, exclusion policy v2, frozen framing, plugin pinned `f976990`, protocol suite 46/0, harness schema suite 69/0, `BENCHMARK.md` verified `72d09391…`, Codex CLI `0.147.0`, amendment A-004 in force for every Arm A critic message.

This batch closes the last nine of the 25 task ids. **It does not close the dataset.** Eight tasks — T01–T06 under Q-001 and T07, T08 under Q-003 — are under standing re-run orders, and their current debates do not count as scoring observations. See §8.

Grading is deferred until the dataset is final, per BENCHMARK.md §5's run-all-then-grade order. **Nothing here is a result.** Ground-truth detection is the primary metric and has not been judged; no line below should be read as one arm outperforming the other.

## 1. Task construction

| task | repo | artifact lines | ranges | syntax check | slice |
|---|---|---|---|---|---|
| T17  | aiohttp    | 242 | 3 | `py_compile` PASS | subset |
| T18  | undici     | 197 | 1 | `node --check` PASS | subset |
| T21  | aiohttp    |  97 | 1 | `py_compile` PASS | subset |
| T22  | bullmq     | 358 | 3 | TS compiler API, 0 syntactic diagnostics | subset |
| T23  | fastapi    |  65 | 2 | `py_compile` PASS | subset |
| T24  | ioredis    | 315 | 3 | TS compiler API, 0 syntactic diagnostics | subset |
| T25  | redis-py   | 289 | 2 | `py_compile` PASS | subset |
| T19r | pino       | 134 | 1 | `node --check` PASS | subset |
| T20r | sqlalchemy | 134 | 5 | `py_compile` PASS | subset |

All nine verified before construction: the recorded buggy SHA is exactly the fix commit's parent, and the fix dates match Appendix A. One discrepancy, recorded rather than smoothed over: **T20r's fix has author date 2026-07-21 and committer date 2026-07-22**, and Appendix A records 2026-07-21. The other eight fixes have identical author and committer dates, so Appendix A's convention is demonstrably the *author* date and T20r conforms to it. The ≥2025-07-01 recency screen holds under either reading.

**Contamination audit: ALL CLEAR.** 135/135 verification checks, all nine artifacts **FULLY CONTAINED** (fix hunks ∩ artifact ranges), 0 leaks, 0 extra sidecar keys, 0 stray files, no mutated clone. Containment holds under both the literal hunk-header reading and the strict changed-lines-only reading; the auditor applied a stricter both-anchors rule to the seven pure insertions across four tasks, and all seven pass. Every syntax check was re-run by the auditor **with a negative control proving the checker fires** — a check that cannot fail is not a check.

Scrub PASS 26/0 ×9 with `--forbidden-sha` asserting the fix commit does not resolve inside each checkout. Staging PASS 16/0 ×9: each staged repo shows exactly one changed path, 0 deletions, and an added-line count equal to that task's artifact line count.

**Two tasks in this batch share a source path with an earlier task** — T01|T17 and T15|T18 — and two more pair an earlier task with one of these — T07|T21 and T09|T25. That is not a construction defect; it is what the Q-002 condition-8 dependency screen was run to find, and it is handled by the ruled sensitivity rule rather than by substitution. See §8 and `BENCHMARK-AMENDMENTS.md` §Q-002-R.

## 2. Arm inputs were identical, verified by hash

Both arms of each task initialized from separate copies of the same staged repo. Collected context hashed identically in every case, and every debate's `focus` matched the frozen framing file (`63a64714…`), read off the control plane and nowhere else.

| task | arm A debate | arm B debate | `context.md` sha256 (both arms) |
|---|---|---|---|
| T17  | `dbt-2026-08-12-b176f1` | `dbt-2026-08-12-85005d` | `de37bc62bc6d4575d13a866ff2be4a74b9bc14b6eb58a5189c58558fb4d04fe7` |
| T18  | `dbt-2026-08-12-0b5faf` | `dbt-2026-08-12-5fb4a6` | `0af808d2c237d73f7bd8f27d03b6179b20b45bdf1286195182306b19c938a775` |
| T21  | `dbt-2026-08-12-8105e5` | `dbt-2026-08-12-1a1b32` | `ebdf80b4677b83dea8dc1b998a5aa09262e9155c86dd4cc86cfdf5d5da06860f` |
| T22  | `dbt-2026-08-12-ca8462` | `dbt-2026-08-12-a80837` | `491a599b689a2c95a67cd20b34e35d9f755f43baa6aa658841a6ff96353407bf` |
| T23  | `dbt-2026-08-13-4ea4d9` | `dbt-2026-08-13-3f51c2` | `2ba08d34c8eca1e2ebc7b7f1ff069acb09bd07d52b00a395a40684277d8e02ca` |
| T24  | `dbt-2026-08-13-9903cd` | `dbt-2026-08-13-476bce` | `839535c613d78beb73e328a5964200fcc0c76231d3fdb1597aedf999c7d79aac` |
| T25  | `dbt-2026-08-13-17a435` | `dbt-2026-08-13-d94600` | `4a394cf69f7aab783beff089a16ec4d4be57d490c41d11a43ac13c3380c1e876` |
| T19r | `dbt-2026-08-13-585150` | `dbt-2026-08-13-1396b5` | `6f9fe5c281ced8b32feb98a3dab87f7be2c49927c77614913829b5483ca8f66e` |
| T20r | `dbt-2026-08-13-ec2046` | `dbt-2026-08-13-a2d830` | `54e7a5cf6c7b89454e14c2ec4b2e2a02684b5821d24ade1d19f4af5a77c58a3f` |

Every arm exited with its working tree and diff intact. On all nine tasks `arm_clean_check` returned **the same diff sha and changed-file count for A and B**, so neither arm perturbed the reviewed tree in any task.

Arm order followed `bench-schedule.json` in all nine, never deviating: B-first for T18, T21, T22, T23, T24, T19r, T20r; A-first for T17 and T25.

## 3. Results — control-plane only

| task | arm | rounds | findings | claimants | severities | statuses | ship line | flags |
|---|---|---|---|---|---|---|---|---|
| T17  | A (first) | 3 | 7 | codex 6, claude 1 | 1 crit, 2 high, 3 med, 1 low | accepted 7 | NO-SHIP | 0 |
| T17  | B | 1 | 2 | codex 2 | 1 high, 1 med | accepted 2 | NO-SHIP | 0 |
| T18  | B (first) | 3 | 5 | codex 2, claude 3 | 1 high, 2 med, 2 low | accepted 4, partially-accepted 1 | NO-SHIP | 0 |
| T18  | A | 2 | 4 | codex 4 | 1 high, 2 med, 1 low | accepted 4 | NO-SHIP | 0 |
| T21  | B (first) | 3 | 4 | codex 3, claude 1 | 3 high, 1 med | accepted 2, withdrawn 2 | NO-SHIP | 0 |
| T21  | A | 3 | 6 | codex 6 | 4 high, 2 med | accepted 4, partially-accepted 2 | NO-SHIP | 0 |
| T22  | B (first) | 3 | 3 | codex 1, claude 2 | 1 high, 2 low | accepted 2, partially-accepted 1 | NO-SHIP | 0 |
| T22  | A | 3 | 7 | codex 6, claude 1 | 2 high, 4 med, 1 low | accepted 6, partially-accepted 1 | NO-SHIP | 0 |
| T23  | B (first) | 2 | 3 | codex 2, claude 1 | 1 high, 1 med, 1 low | accepted 3 | NO-SHIP | 0 |
| T23  | A | 2 | 5 | codex 4, claude 1 | 3 high, 2 med | accepted 5 | NO-SHIP | 0 |
| T24  | B (first) | 1 | 2 | codex 2 | 2 high | accepted 2 | NO-SHIP | 0 |
| T24  | A | 1 | 3 | codex 3 | 2 high, 1 low | accepted 3 | NO-SHIP | 0 |
| T25  | A (first) | 3 | 6 | codex 5, claude 1 | 1 crit, 4 high, 1 med | accepted 5, withdrawn 1 | NO-SHIP | 0 |
| T25  | B | 3 | 3 | codex 2, claude 1 | 3 high | accepted 2, partially-accepted 1 | NO-SHIP | 0 |
| T19r | B (first) | 2 | 5 | codex 4, claude 1 | 2 high, 3 med | accepted 5 | NO-SHIP | 0 |
| T19r | A | 3 | 6 | codex 5, claude 1 | 2 high, 4 med | accepted 5, partially-accepted 1 | NO-SHIP | 0 |
| T20r | B (first) | 3 | 1 | codex 1 | 1 high | partially-accepted 1 | NO-SHIP | 0 |
| T20r | A | 3 | 7 | codex 7 | 2 high, 5 med | accepted 5, rejected 1, partially-accepted 1 | NO-SHIP | 0 |

**NO-SHIP in all eighteen.** 0 protocol flags in every debate. **0 `unsupported` findings anywhere in the batch** — the anti-inflation rule fired zero times, which is the outcome A-004 was adopted to make meaningful rather than accidental. `close.err` was empty in all eighteen, so nothing closed disputed without deciding evidence recorded.

`rejected` appears as a terminal status for the first time in the run, on T20r Arm A. Prior disputed findings all closed `partially-accepted` or `withdrawn`.

## 4. Harness behaviour

**26 of 26 Arm A critic messages passed the A-004 schema gate on the first attempt.** The one permitted format correction was never consumed once in this batch. This is the first full batch run end to end under the corrected harness with field-type guidance in the reviewer briefs, and no reviewer encoding error occurred — against T15's two encoding failures in a single message before the guidance existed.

**21 of 21 Arm B Codex turns recorded `usageStatus: captured`**, 0 missing. Turn durations ranged 13.3s–77.1s.

**Claude usage: 79 invocations, 79 captured, 0 missing**, collected against a roster whose agent ids were recorded **at spawn time** rather than reconstructed. The T12–T14 roster had to be rebuilt from transcript timestamps; recording at spawn cost nothing and removed that step entirely.

## 5. Cost — modeled API-equivalent dollars (amendment A-003)

Nine tasks from this batch, against the frozen rate card v1 (`claude-opus-5` / `gpt-5.6-sol`):

| task | Arm A $ | Arm B $ | codex $ | codex % of B | B/A |
|---|---|---|---|---|---|
| T17  | 32.97 | 2.84 | 0.06 | 2.2% | 0.09× |
| T18  |  9.44 | 7.41 | 0.28 | 3.8% | 0.79× |
| T21  | 27.84 | 9.13 | 0.37 | 4.0% | 0.33× |
| T22  | 33.48 | 8.22 | 0.29 | 3.5% | 0.25× |
| T23  | 10.56 | 3.87 | 0.22 | 5.6% | 0.37× |
| T24  |  5.79 | 3.24 | 0.06 | 1.7% | 0.56× |
| T25  | 27.11 | 9.34 | 0.22 | 2.4% | 0.34× |
| T19r | 19.14 | 4.58 | 0.19 | 4.2% | 0.24× |
| T20r | 29.59 | 8.66 | 0.22 | 2.5% | 0.29× |

**Running median across the current 25-task dataset: 0.33×, against the S3 ceiling of 3.0× — PASS.** This is a *running* figure over a dataset that still contains eight to-be-replaced tasks; it is not the final S3. Codex is 1.7%–5.6% of Arm B's modeled cost in this batch. Subscription marginal cost is $0, reported and never gated, per A-003.

## 6. Fidelity — recorded per reviewer, never as one fact per task

This batch made the per-reviewer rule earn its keep. On four of the nine tasks the four seats did not agree on whether the project's suite runs, and in every case the disagreement was real rather than sloppy.

- **T18** — not runnable as the project defines it; test targets need dependencies absent from the checkout and installing into the review tree is forbidden. **All four seats reached this independently**, so it is a property of T18. One seat recorded that the dependency-free subset it ran instead **passes with the defects present**, which is itself a fidelity fact worth carrying to grading.
- **T21** — an optional compiled accelerator is not built and cannot be built without writing inside the frozen checkout. All four seats hit it; none inferred anything from the resulting failures. One Arm A critic put the limit **inside the affected finding's own `evidence` field**, so a grader meets the caveat attached to the claim it qualifies rather than only in a fidelity note. That is the right pattern.
- **T22** — three seats reported the suite unrunnable (no dependencies, no backing datastore). In round 3, Arm B's defender **built the datastore from source inside its own seat** and ran the project's own tests against an installed scratch copy it verified hash-identical to the frozen tree: one targeted file green, a broader selection five of six, the failure an unrelated spawn timeout. **No Arm A seat attempted this.** The resulting cross-arm difference came from reviewer initiative, not from the environment, and must not be read as an arm effect.
- **T23** — runnable. Two seats reported it fully green; the Arm A critic reported the same passing count with six failures and one error, every one a `ModuleNotFoundError` for an optional package it had not installed into its seat venv.
- **T24** — needs a live backing service and a container-backed cluster; neither exists here, and no seat ran the suite as the project defines it. The two partial footings found — a seat-local unit tier at 153/1, and the project's own mock-server harness — differ from each other, and both seats said so.
- **T19r** — the most runnable suite in the batch, and **four seats returned four different totals**: 533/534, 450/458, and 334/334 twice. Every one is explained by how much of the tree that seat could resolve dependencies for, every seat stated its scope, and every seat attributed its failures to the environment.
- **T25** — partially runnable, and here all four agreed in the same terms: unit tier runs, integration tier cannot, one absent local service explains every failure.
- **T20r** — fully runnable in both arms (~24,000 tests, exit 0 apart from setup errors from one absent optional type-checker). Neither arm was environment-limited, which is what makes T20r's 7-vs-1 finding count worth a second look at grading time rather than a shrug.

## 7. Protocol and conduct observations

**A retraction, recorded next to the claim it corrects.** After T21 the run recorded that the first `withdrawn` finding had appeared in Arm B — the arm whose Codex critic receives no warning that terminal `accept` on one's own contested finding abandons it — and noted that Arm A critics had taken the `partial`-with-new-evidence route three times. **T25 Arm A then withdrew a finding anyway.** The count is one per arm across 25 tasks. The **treatment difference is real and still must be reported**: Arm A's critic receives harness and protocol instruction that Arm B's does not, and Arm B's critic receives generation-time `outputSchema` enforcement that Arm A's does not. What is withdrawn is the suggestion that withdrawal behaviour evidences it. Two events split one-and-one is not a signal.

**Reopening behaviour.** T20r Arm A produced the largest single reopening of the run: the round-2 critic reopened **all five** contested findings at once via `partial`/`reject` with new evidence, taking the ledger from 4 partially-accepted + 1 rejected back to 6 open in one message. T21 Arm A reopened both of its contested findings and the round-2 defender then accepted all four open items, including both reopened ones — on the same artifact where Arm B's critic had abandoned two findings by terminal `accept`.

**Defenders using `notes` as a decision record.** T18 Arm B's defender filed zero responses across two rounds, legally, and wrote the status-by-status derivation into `notes` so nothing was conceded by silence. T23 Arm B's round-2 defender did the same with zero responses *and* zero findings, recording that it had considered and discharged three candidate issues — two unreachable, one a near-duplicate of a settled finding that the contract forbids re-filing. An empty message that says why it is empty is a decision on the record.

**Reviewers repeatedly re-derived a mitigation the run declined to make.** The per-arm `repro/` archive is shared between that arm's critic and defender — disclosed on T15, assessed then as non-contaminating and symmetric across arms, and deliberately left unchanged mid-run rather than introduce an inconsistency with T01–T14. In this batch **three seats independently invented three different workarounds**: T22's seats wrote into a freshly created private subdirectory; T25 Arm A's defender filtered its own listing to its own filename prefix; T25 Arm A's round-2 critic disclosed that listing the directory it is *directed* to write into surfaced the opposing seat's filenames, opened none of them, and rebuilt every cross-check from prose. The disposition stands. **The frequency is now the finding:** reviewers keep discovering that the prescribed output location is shared and keep having to invent a remedy. Give each seat its own archive subdirectory in the next revision.

**A new exposure class, disclosed by T20r Arm A's round-3 critic.** A filename-only recursive search surfaced the *names* of documentation files that the brief puts off-limits as sources. None was opened, no content was consulted, the seat disclosed it unprompted, and it put the substantive part inside its JSON message rather than in the control plane. **Non-contaminating, and not a scrub defect** — A-002's scrub removes benchmark records, fix metadata and issue/PR identifiers; a project's own changelog and release notes are ordinary tree content and were never in scope for removal. The brief's read prohibition is what governs, and it held. Recorded because the run has not previously distinguished *seeing a filename* from *reading the file* for this class, and a future revision should say which it means.

**Reviewers validating against the real schema.** Several seats located `council-message.schema.json` and validated their own message against it with a standards-compliant validator before submitting, some with a negative control proving the validator rejects a deliberately malformed field. One pruned its filesystem search to exclude scratch and run directories before executing it. This is the behaviour A-004 made possible, and it is now routine.

**Seats correcting themselves on their own measurements.** T22 Arm A's round-3 critic moved against its own earlier positions on two of three responses, one a full concession. T19r Arm A's round-3 defender withdrew a stance its own seat had taken in round 2 on two measurements that went against it. Both said so in the control plane.

**Seat attestations.** Every Claude participant in this batch wrote `SEAT-ATTEST.json` with `cwd` taken from the shell's own report, and every one returned `match: true` with `cwd == seat`. This is the mechanism Q-003 condition 5 requires and it is now standard in every brief — the seat map alone is not evidence, as T07 demonstrated.

## 8. What this batch does *not* settle

All 25 task ids have both arms closed, and the dataset is still incomplete:

- **T01–T06** — twelve debates superseded by order under **Q-001**; re-run pending under per-seat isolation, original arm order, fresh everything. Voided usage is excluded from S3 and reported as **benchmark remediation overhead**.
- **T07** — both arms void under **Q-003**; re-run pending, **Arm B first**, under twelve binding conditions including the instruction that replacement participants be told nothing of the audit, the exposed filenames, prior findings, prior repro material, or the reason for the re-run.
- **T08** — both arms re-run pending under Q-003 §3, **Arm A first**. T08 Arm B tested clean on every measure and is re-run only by the conditional; the record preserves that distinction.
- **Q-002-R sensitivity** — the ruled same-source-path rule drops **T01, T11, T15, T21, T25** for the sensitivity analysis, **N = 20**, derived from the component table and never from a hard-coded task list. The 25-task primary is untouched. Three of this batch's tasks are *retained* members of dependent components (T17, T18) and two are *dropped* members (T21, T25).

Sixteen tasks stand as scoring observations as of this record. **No grading has begun, and none may begin until the dataset is final** — that step requires the operator, by frozen rule.
