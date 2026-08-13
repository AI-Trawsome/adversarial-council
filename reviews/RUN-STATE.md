# RUN-STATE.md — live handoff recap for the frozen benchmark run

**Purpose.** This file is the resumption anchor. If the orchestrator's context is compacted or the session restarts, reading this file plus `reviews/BENCHMARK-AMENDMENTS.md` is sufficient to resume losslessly. **Trust disk over memory.** Update this file after every task closes.

**Last updated:** 2026-08-13, after **A-005 was ruled** — 13 tasks voided over installed upstream copies and awaiting a paired re-run. See §0.

---

## 0. RESUME HERE

**T01–T16 are closed, both arms.** The T12–T16 batch is fully closed out — usage collected (31/31 and 11/11 captured, 0 missing), S3 computed, `reviews/BATCH-T12-T16.md` written and committed.

### In flight (2026-08-13)

**No debate is open.** The **T17–T20r batch is complete**: all nine tasks closed in both arms, usage **79/79 captured with 0 missing**, S3 recomputed.

**All 25 task ids now have both arms closed** — but the dataset is **not yet final**. Eight of those tasks are under standing re-run orders and their present debates do not count: **T01–T06** (Q-001) and **T07, T08** (Q-003). Sixteen tasks stand as scoring observations right now; T09–T25 minus none, i.e. T09–T18, T21–T25, T19r, T20r. The S3 figure below is therefore a **running** figure over the current dataset, not the final one.

**Whole-batch mechanical results.** 0 protocol flags in any of the eighteen debates. 0 `unsupported` findings anywhere. Both arms' trees intact on every task, with `arm_clean_check` returning the *same* diff sha for A and B on all nine — so no arm perturbed any reviewed tree. `close.err` empty in all eighteen. Every `arm_context_match` printed `CONTEXT MATCH`. **26 of 26 Arm A injections passed the A-004 schema gate on the first attempt; the one permitted correction was never consumed once in this batch.** Every Arm B Codex turn recorded `usageStatus: captured` — 21 turns, no misses.

Helper scripts (`armlib.sh`, `mkbrief.mjs`, `roster.mjs`, the three brief templates) were carried forward into the current session scratchpad and repointed at it; they are still **not committed**. Recreate from §3.1 and §7 if lost.

- **Frozen-invariant gate re-verified** this session: all six frozen hashes OK, plugin at `f976990` and clean, protocol suite **46/0**, harness schema suite **69/0**. The framing `focusSha256` invariant is checked via `arm_cp` only — see the note in §4 about a redundant checker that was written, got it wrong, and has been deleted.
- **All nine buggy SHAs verified** as their fix commit's parent, dates matching Appendix A. One note: **T20r's fix has author date 2026-07-21 and committer date 2026-07-22**; Appendix A records 2026-07-21. The other eight fixes have identical author and committer dates, so Appendix A's convention is the **author** date and T20r matches under it. The ≥2025-07-01 screen holds under either date. Recorded, not a conflict.
- **Seats minted:** 46 for this batch (9 constructors + 36 reviewer seats + 1 contamination auditor), plus 2 audit seats (`Q001-c12-isolation-audit`, `Q002-c8-dependency-screen`). All verified empty before use, no duplicate directory anywhere in the map (Q-001 condition 7). Map now holds 95 entries.
- **`_rerun2/usage-roster-T17-T20r.json` opened**, with each agent id recorded **at spawn time**.
- **Construction complete, all nine.** Every constructor reported `OK` and `FULLY CONTAINED`, each with its own syntax check re-run and eight self-verifications.

| task | repo | lines | ranges | slice | syntax check |
|---|---|---|---|---|---|
| T17  | aiohttp    | 242 | 3 | subset | `py_compile` PASS |
| T18  | undici     | 197 | 1 | subset | `node --check` PASS |
| T21  | aiohttp    |  97 | 1 | subset | `py_compile` PASS |
| T22  | bullmq     | 358 | 3 | subset | TS compiler API, 0 syntactic diagnostics |
| T23  | fastapi    |  65 | 2 | subset | `py_compile` PASS |
| T24  | ioredis    | 315 | 3 | subset | TS compiler API, 0 syntactic diagnostics |
| T25  | redis-py   | 289 | 2 | subset | `py_compile` PASS |
| T19r | pino       | 134 | 1 | subset | `node --check` PASS |
| T20r | sqlalchemy | 134 | 5 | subset | `py_compile` PASS |

- **Scrub PASS 26/0 ×9** (`--forbidden-sha` asserting the fix commit does not resolve inside each checkout), exclusion policy v2, declared limitation present in every manifest.
- **Staging PASS 16/0 ×9.** Each staged repo shows exactly one changed path, 0 deletions, and an added-line count equal to that task's artifact line count.
- **Contamination audit: ALL CLEAR.** 135/135 checks, **all nine FULLY CONTAINED**, 0 leaks, 0 extra sidecar keys, 0 stray files, no mutated clone. Containment holds under both the literal hunk-header reading and the strict changed-lines-only reading; the auditor applied a stricter both-anchors rule to the seven pure insertions across four tasks and all pass. Every syntax check was re-run by the auditor with a negative control proving the checker fires. Deliverables in seat `T17-T20r-contam-audit`.
- **Q-001 condition-12 isolation audit of T07–T11: DONE**, ruled, and folded into `BENCHMARK-AMENDMENTS.md` §Q-003 (seat `Q001-c12-isolation-audit`).
- **T01–T06 staging re-verified** as still valid under current policy: PASS 16/0 ×6, one changed path and 0 deletions each. **24 fresh Q-001 re-run seats minted** as `T0N-Q001rerun-<arm>-<role>`, verified empty, globally unique. Map now 119 entries.

### Dependency screen: DONE and RULED. Supersedes the earlier matrix.

**The by-product matrix previously recorded here was wrong** — it missed one range-overlap pair and understated another ~4×, because it used a naive numeric intersection of range sets, which is invalid for all five same-path pairs (none has a byte-identical file between its two buggy SHAs). It is preserved as a superseded record in `BENCHMARK-AMENDMENTS.md` §Q-002-R per condition 11. **Do not re-use its numbers for anything.**

The dedicated Q-002 condition-8 screen ran over all 300 pairs with a validated positive control on every sweep. Five dependent components, all size 2: **T10|T11, T01|T17, T07|T21, T09|T25, T15|T18**. Cross-repo: 263 pairs, 0 trip any screen.

**Ruled (consults 009 + 010, amendment Q-002-R):** the orchestrator's visibility-keyed rule and its `INSIDE-ARTIFACT` boundary were **rejected** — reviewers navigate the full scrubbed checkout, so same-file-outside-the-window is *not* invisible. The approved rule is **same-source-path: retain the earliest ground-truth fix date, drop later members from both arms.**

| component | retain | drop |
|---|---|---|
| T01 \| T17 | T17 | **T01** |
| T07 \| T21 | T07 | **T21** |
| T09 \| T25 | T09 | **T25** |
| T10 \| T11 | T10 | **T11** |
| T15 \| T18 | T18 | **T15** |

**Sensitivity drop set: T01, T11, T15, T21, T25. N = 20.** The 25-task primary is untouched.

**Erratum:** ruling 009 §1 illustrated the drops as T11/T17/T21/T25/T18. That list came from the orchestrator's own query §4, which wrongly assumed a higher task id meant a later fix — false for T01|T17 and T15|T18, because T19/T20 were struck pre-freeze. Consult 010 confirmed **the criterion governs over the illustration**. Every sensitivity computation must be derived from the component table, **never from a hard-coded task list**.

**Conditions 12 and 13: DONE, no change to the component set.** Rename/normalization check found **0 renames across 32 same-repo differing-path pairs** (decided by blob coexistence in both buggy trees, 32/32, independent of any similarity threshold), 0 fold-only matches, 0 symlinks, 0 shared blob OIDs. The four alternates were screened over 106 pairs: **none joins any component**. **A07's buggy SHA *is* T24's fix SHA** — the same commit object — yet the two fixes touch disjoint file sets, so even that does not create a dependency. **Caveat that binds if an alternate is ever substituted:** screen 2 (range overlap) is *not computable* without an artifact and must be re-run then — and range overlap is the exact screen that caught the pair the earlier matrix missed.

**Q-002-R is now fully discharged except for reporting.** Nothing further is owed on it before grading.

**Next actions, in order — READ THIS FIRST IF RESUMING.** The 25-task run, the Q-001 re-run of T01–T06, the Q-003 re-run of T07/T08 and the Q-003-E1 transcript audit are **all complete**. They are not, however, the end: **amendment A-005 (consult 012) has voided 13 tasks and ordered them re-run in both arms.**

1. ~~Extended A-005 environment sweep~~ — **DONE**, see `reviews/AUDIT-A005-environment-sweep.md`.
2. **Build the harness-managed dependency environment** under A-005's ten requirements, and freeze it, **before either arm of any re-run begins**.
3. **Re-run both arms of 13 tasks: T01, T04, T06, T07, T08, T09, T10, T11, T12, T13, T15, T21, T24.** Original arm order per task. Fresh seats. Prior debates preserved as `VOIDED-INSTALLED-UPSTREAM`; their usage excluded from S3 and reported as remediation overhead.
4. Final S3 → `reviews/READY-TO-GRADE.md`. **Held until step 3 completes.**


### T17 — CLOSED, both arms

| arm | debate | rounds | findings | claimants | severities | statuses | ship | flags |
|---|---|---|---|---|---|---|---|---|
| A (first) | `dbt-2026-08-12-b176f1` | 3 | 7 | codex 6, claude 1 | 1 crit, 2 high, 3 med, 1 low | accepted 7 | NO-SHIP | 0 |
| B | `dbt-2026-08-12-85005d` | 1 | 2 | codex 2 | 1 high, 1 med | accepted 2 | NO-SHIP | 0 |

- Arm order followed the schedule (A first, byte 136). **`CONTEXT MATCH de37bc62bc6d4575d13a866ff2be4a74b9bc14b6eb58a5189c58558fb4d04fe7`**, re-checked after both closed.
- **All findings `support_level: strong` in both arms; 0 unsupported; 0 protocol flags.** `close.err` empty in both arms, so nothing closed disputed without deciding evidence.
- Both arms' trees intact and, notably, **identical** — `arm_clean_check` returns the same diff sha `93f59f92…` and 1 changed file for A and B, so neither arm perturbed the reviewed tree.
- **All three Arm A injections passed the A-004 gate first attempt**; attempt counters show one valid attempt each and no rejected payload was archived, so no correction was consumed. First task run end to end under the corrected harness with field-type guidance in the brief, and no reviewer encoding error occurred.
- Codex turn: `usageStatus: captured`, `durationMs` 69277, CLI `0.147.0`.
- Seat attestations `match: true` with `cwd == seat` for all three Claude seats.
- **Usage: 19/19 captured, 0 missing** (`_rerun2/claude-usage-T17-T20r.json`), collected against the spawn-time roster with no reconstruction needed.
- **Cost:** Arm A $32.97, Arm B $2.84 (codex $0.06, 2.2%), **B/A 0.09×**. Running median across 17 tasks **0.33×** against the 3.0× ceiling — **PASS**.

### T18 — CLOSED, both arms

| arm | debate | rounds | findings | claimants | severities | statuses | ship | flags |
|---|---|---|---|---|---|---|---|---|
| B (first) | `dbt-2026-08-12-5fb4a6` | 3 | 5 | codex 2, claude 3 | 1 high, 2 med, 2 low | accepted 4, **partially-accepted 1** | NO-SHIP | 0 |
| A | `dbt-2026-08-12-0b5faf` | 2 | 4 | codex 4 | 1 high, 2 med, 1 low | accepted 4 | NO-SHIP | 0 |

- Arm order followed the schedule (B first, byte 77). **`CONTEXT MATCH 0af808d2c237d73f7bd8f27d03b6179b20b45bdf1286195182306b19c938a775`**, re-checked after both closed. Both arms' trees intact with the **same** diff sha `3c2a3911…`.
- All findings `strong` in both arms; **0 unsupported, 0 protocol flags**; `close.err` empty in both, so T18 Arm B's surviving dispute carries deciding evidence.
- Both Arm A injections passed the A-004 gate **first attempt**; attempt counters show one valid attempt each.
- All three Arm B Codex turns `usageStatus: captured` (59.6s / 21.0s / 15.3s).
- **Cost:** Arm A $9.44, Arm B $7.41 (codex $0.28, 3.8%), **B/A 0.79×**. Running median across 18 tasks **0.45×** vs the 3.0× ceiling — **PASS**.
- **Usage 26/26 captured, 0 missing.**
- **Fidelity: T18's project suite is NOT runnable** as the project defines it — its test targets need dependencies absent from the checkout, and installing into the review tree is forbidden. **All four seats reached this independently**, so it is an environment property of T18 rather than reviewer-dependent. Each ran the dependency-free subset standalone instead; one recorded that the subset **passes with the defects present**, which is itself a fidelity fact worth carrying to grading. Recorded per reviewer, never as evidence.
- **Protocol observations.** Arm B's defender filed **zero responses in two rounds**, legally (no `open` targets; acting on one's own contested finding is optional) and wrote the status-by-status derivation into `notes` so nothing was conceded by silence. Arm B's defender also **out-produced its critic 3 findings to 2** — second time in the run after T13 Arm B; defender-claimed findings are not part of the independent variable, since the defender is Claude in both arms. In Arm A both `partially-accepted` findings **reopened** at round 2 via `partial`-with-new-evidence rather than terminal `accept`.
- **Reviewer conduct.** One seat needed a counterfactual requiring a modified tree and **copied the tree into its own seat to mutate the copy**, leaving the review repo untouched — a resolution the scratch policy implies but never spells out. Four seats separately disclosed seeing foreign scratch **path strings quoted in the ledger** and declining to follow them, rebuilding every experiment from prose instead; no mechanism enforces that, so explicit disclosure is the only evidence it holds.

### T21 — CLOSED, both arms

| arm | debate | rounds | findings | claimants | severities | statuses | ship | flags |
|---|---|---|---|---|---|---|---|---|
| B (first) | `dbt-2026-08-12-1a1b32` | 3 | 4 | codex 3, claude 1 | 3 high, 1 med | accepted 2, **withdrawn 2** | NO-SHIP | 0 |
| A | `dbt-2026-08-12-8105e5` | 3 | 6 | codex 6 | 4 high, 2 med | accepted 4, **partially-accepted 2** | NO-SHIP | 0 |

- Arm order per schedule (B first, byte 51). **`CONTEXT MATCH ebdf80b4677b83dea8dc1b998a5aa09262e9155c86dd4cc86cfdf5d5da06860f`**. Both trees intact, same diff sha `d52344bf…`. `close.err` empty in both — Arm A closed at the round cap with 2 unsettled findings, all carrying deciding evidence. 0 unsupported anywhere; support levels 3 `strong` + 1 `moderate` (B), 5 `strong` + 1 `moderate` (A).
- All three Arm A injections **first attempt** (11 of 11 for the batch).
- **Cost:** Arm A $27.84, Arm B $9.13 (codex $0.37, 4.0%), **B/A 0.33×**. Running median across 19 tasks **0.33×** vs 3.0× — **PASS**. Usage **35/35 captured, 0 missing**.
- **Fidelity, both arms:** an optional **compiled accelerator is not built** in this environment and cannot be built without writing inside the frozen checkout. All four seats hit it, recorded it as an environment limit, and none inferred anything from the resulting test failures. One Arm A critic put the limit **inside the affected finding's own `evidence` field**, so a grader meets the caveat attached to the claim it qualifies rather than only in a fidelity note.
- **The withdrawal contrast, on one task with identical input.** Arm B's Codex critic used terminal `accept` on its own contested findings **twice**, abandoning both — half its findings never reached the verdict. Arm A's critic instead **reopened both of its contested findings with new evidence**, and the round-2 defender then **accepted all four open findings**, including both reopened ones. Same protocol, same artifact, opposite dispositions. See the briefing-asymmetry entry in §6: only Arm A's critic is told that `accept`-on-own-finding is a trap.
- **Reviewer conduct.** Arm A seats built repro scripts that **exit non-zero unless the claim reproduces**, with controls that must come back clean — stronger than the scratch policy requires, which asks only for captured output and exit status. A script that always exits 0 satisfies the letter of that and proves nothing.

### T22 — CLOSED, both arms

| arm | debate | rounds | findings | claimants | severities | statuses | ship | flags |
|---|---|---|---|---|---|---|---|---|
| B (first) | `dbt-2026-08-12-a80837` | 3 | 3 | codex 1, claude 2 | 1 high, 2 low | accepted 2, **partially-accepted 1** | NO-SHIP | 0 |
| A | `dbt-2026-08-12-ca8462` | 3 | 7 | codex 6, claude 1 | 2 high, 4 med, 1 low | accepted 6, **partially-accepted 1** | NO-SHIP | 0 |

- Arm order per schedule (B first). **`CONTEXT MATCH 491a599b689a2c95a67cd20b34e35d9f755f43baa6aa658841a6ff96353407bf`**. Both trees intact, same diff sha `5558a54f…`. `close.err` empty in both — each arm closed at the round cap with one unsettled finding carrying deciding evidence. 0 unsupported anywhere; support 2 `strong` + 1 `moderate` (B), 4 `strong` + 3 `moderate` (A).
- All three Arm A injections **first attempt** (14 of 14 for the batch). All three Arm B Codex turns `usageStatus: captured` (43.1s / 17.8s / 19.3s).
- **Cost:** Arm A $33.48, Arm B $8.22 (codex $0.29, 3.5%), **B/A 0.25×**. Running median across 20 tasks **0.33×** vs 3.0× — **PASS**. Usage **44/44 captured, 0 missing**.
- **Fidelity — the first time in the run a "suite not runnable" verdict was overturned mid-debate, by one reviewer's own construction.** Three of the four seats reported the suite unrunnable for two independent reasons: no installed dependencies (and installing into the checkout is forbidden) and no backing datastore on the host. In round 3, Arm B's defender **built the datastore from source inside its own seat** and ran the project's own tests against an installed scratch copy whose reviewed file it verified hash-identical to the frozen tree: one targeted test file passed entirely, and a broader selection passed five of six, the single failure a child-process spawn timeout unrelated to the material. No Arm A seat attempted this. So T22 carries a **within-task, cross-arm fidelity asymmetry that came from reviewer initiative rather than from the environment** — recorded per reviewer, as T12 established, and worth flagging to grading because it is the kind of difference that could be mistaken for an arm effect.
- **Reviewer conduct.** Two seats independently re-derived the mitigation the T15 `repro/` disclosure recommended but that was deliberately not implemented mid-run: each wrote its artifacts into a **freshly created subdirectory** of the shared per-arm repro archive specifically so it could neither observe nor overwrite the other seat's filenames. The fix the run declined to make to reviewer environments, reviewers made for themselves.
- Arm A's round-3 critic moved against its own earlier positions on two of three responses, one a full concession, on measurements it ran itself.

### T23 — CLOSED, both arms

| arm | debate | rounds | findings | claimants | severities | statuses | ship | flags |
|---|---|---|---|---|---|---|---|---|
| B (first) | `dbt-2026-08-13-3f51c2` | 2 | 3 | codex 2, claude 1 | 1 high, 1 med, 1 low | accepted 3 | NO-SHIP | 0 |
| A | `dbt-2026-08-13-4ea4d9` | 2 | 5 | codex 4, claude 1 | 3 high, 2 med | accepted 5 | NO-SHIP | 0 |

- Arm order per schedule (B first). **`CONTEXT MATCH 2ba08d34c8eca1e2ebc7b7f1ff069acb09bd07d52b00a395a40684277d8e02ca`**. Both trees intact, same diff sha `2de59ce4…`.
- **First task in the run where both arms closed early on `all findings settled`** rather than at the round cap — every finding in both arms is `accepted`, 0 disputed, 0 unsupported, all `strong`. `close.err` empty in both.
- Both Arm A injections **first attempt** (16 of 16 for the batch). Both Arm B Codex turns `usageStatus: captured` (28.6s / 13.3s).
- **Cost:** Arm A $10.56, Arm B $3.87 (codex $0.22, 5.6%), **B/A 0.37×**. Running median across 21 tasks **0.33×** vs 3.0× — **PASS**. Usage **50/50 captured, 0 missing**.
- **Fidelity, and a clean example of why it is recorded per reviewer.** T23's suite is runnable — the first such task in this batch — but the four seats did not agree on its result. Two reported it fully green; the Arm A critic reported the same passing count with six failures and one error, every one a `ModuleNotFoundError` for an optional package it had not installed into its seat venv, none touching the module under review. **Same tree, same suite, different seat-local dependency sets.** No finding in either arm rests on it, and each seat recorded it as an environment limit rather than a result.
- Arm B's round-2 defender filed **zero responses and zero findings**, legally: the ledger held no `open` findings after round 1, and the response-scope rule then permits exactly zero. It recorded in `notes` that it had considered and discharged three candidate issues, two unreachable and one a near-duplicate of a settled finding that the contract forbids re-filing — so the empty message is a decision on the record rather than silence. Third time a defender has used `notes` this way.

### T24 — CLOSED, both arms

| arm | debate | rounds | findings | claimants | severities | statuses | ship | flags |
|---|---|---|---|---|---|---|---|---|
| B (first) | `dbt-2026-08-13-476bce` | 1 | 2 | codex 2 | 2 high | accepted 2 | NO-SHIP | 0 |
| A | `dbt-2026-08-13-9903cd` | 1 | 3 | codex 3 | 2 high, 1 low | accepted 3 | NO-SHIP | 0 |

- Arm order per schedule (B first). **`CONTEXT MATCH 839535c613d78beb73e328a5964200fcc0c76231d3fdb1597aedf999c7d79aac`**. Both trees intact, same diff sha `f6d796fe…`. `close.err` empty in both.
- **Shortest task of the run: both arms closed after one round**, on `all findings settled`. Every finding accepted at first response in both arms; 0 disputed, 0 unsupported, all `strong`; neither defender raised a finding of its own. Second consecutive task where both arms settled everything.
- Arm A's single injection passed **first attempt** (17 of 17 for the batch). The one Arm B Codex turn `usageStatus: captured` (54.9s).
- **Cost:** Arm A $5.79, Arm B $3.24 (codex $0.06, 1.7%), **B/A 0.56×**. Running median across 22 tasks **0.35×** vs 3.0× — **PASS**. Usage **53/53 captured, 0 missing**.
- **Fidelity: T24's suite needs a live backing service and a container-backed cluster, and neither exists here.** All four seats hit it; the tiers that need servers were not run by anyone. Two seats found partial footing and reported it differently — the Arm A critic drove the unit tier from a seat-local dependency set and got 153 passing / 1 failing, the single failure arising inside a test-only third-party package whose version its seat resolved independently of the checkout's declared range; Arm B's defender instead reused the project's own mock-server harness, which runs and passes unmodified. **Neither is the project's suite as the project defines it**, both said so, and no finding rests on either. Recorded per reviewer.

### T25 — CLOSED, both arms

| arm | debate | rounds | findings | claimants | severities | statuses | ship | flags |
|---|---|---|---|---|---|---|---|---|
| A (first) | `dbt-2026-08-13-17a435` | 3 | 6 | codex 5, claude 1 | 1 crit, 4 high, 1 med | accepted 5, **withdrawn 1** | NO-SHIP | 0 |
| B | `dbt-2026-08-13-d94600` | 3 | 3 | codex 2, claude 1 | 3 high | accepted 2, **partially-accepted 1** | NO-SHIP | 0 |

- Arm order per schedule (**A first**, byte 28). **`CONTEXT MATCH 4a394cf69f7aab783beff089a16ec4d4be57d490c41d11a43ac13c3380c1e876`**. Both trees intact, same diff sha `96b16a16…`. `close.err` empty in both — Arm B closed at the round cap with one unsettled finding carrying deciding evidence; Arm A closed on `all findings settled`. 0 unsupported anywhere.
- All three Arm A injections **first attempt** (20 of 20 for the batch). All three Arm B Codex turns `usageStatus: captured` (40.9s / 24.0s / 19.5s).
- **Cost:** Arm A $27.11, Arm B $9.34 (codex $0.22, 2.4%), **B/A 0.34×**. Running median across 23 tasks **0.34×** vs 3.0× — **PASS**. Usage **62/62 captured, 0 missing**.
- **The second `withdrawn` finding of the run — and it is in Arm A, which weakens the T21 inference.** §6's briefing-asymmetry entry recorded that the first withdrawal appeared in Arm B, the arm whose Codex critic is *not* warned that terminal `accept` on one's own contested finding abandons the claim, and noted that Arm A critics had taken the `partial`-with-new-evidence route three times. T25 Arm A's critic, holding that warning, withdrew anyway. **One withdrawal per arm across 23 tasks.** The asymmetry in what the two critics are told is real and still must be reported; the withdrawal counts do not evidence it, and the report must not present them as if they did.
- **Fidelity: partially runnable, and every seat said so in the same terms** — the unit tier runs, the integration tier cannot, and every failure traces to one absent local service. Four for four agreement, unlike T23 and T24. One seat additionally recorded that the host interpreter is older than the project's declared minimum and installed a newer one under its own seat.
- **Reviewer conduct — the shared `repro/` surface again, and now three distinct mitigations for it.** T25 Arm A's round-2 critic disclosed that listing the per-arm archive it is *directed* to write into surfaced the opposing seat's filenames; it opened none of them and rebuilt every cross-check from prose. Arm A's defender **filtered its own listing to its own filename prefix**; T22's seats **wrote into a fresh private subdirectory**. Three seats, three independent workarounds for a channel the run deliberately chose not to re-scope mid-flight (see §6). The disposition is unchanged — same task, same arm, same round, symmetric across arms, and the ledger quotes those paths anyway — but the frequency is now the finding: **reviewers keep discovering that the prescribed output location is shared, and keep having to invent a remedy.** Fix it in the next revision by giving every seat its own archive subdirectory.

### T19r — CLOSED, both arms

| arm | debate | rounds | findings | claimants | severities | statuses | ship | flags |
|---|---|---|---|---|---|---|---|---|
| B (first) | `dbt-2026-08-13-1396b5` | 2 | 5 | codex 4, claude 1 | 2 high, 3 med | accepted 5 | NO-SHIP | 0 |
| A | `dbt-2026-08-13-585150` | 3 | 6 | codex 5, claude 1 | 2 high, 4 med | accepted 5, **partially-accepted 1** | NO-SHIP | 0 |

- Arm order per schedule (B first). **`CONTEXT MATCH 6f9fe5c281ced8b32feb98a3dab87f7be2c49927c77614913829b5483ca8f66e`**. Both trees intact, same diff sha `035b980b…`. `close.err` empty in both. **All 11 findings `strong` across both arms**, 0 unsupported. Arm B closed on `all findings settled`; Arm A at the round cap with one unsettled finding carrying deciding evidence.
- All three Arm A injections **first attempt** (23 of 23 for the batch). Both Arm B Codex turns `usageStatus: captured` (53.0s / 21.4s).
- **Cost:** Arm A $19.14, Arm B $4.58 (codex $0.19, 4.2%), **B/A 0.24×**. Running median across 24 tasks **0.34×** vs 3.0× — **PASS**. Usage **70/70 captured, 0 missing**.
- **Fidelity: T19r's suite is the most runnable of the batch, and the four seats still returned four different numbers** — 534 tests (533 pass / 1 fail) from a byte-identical scratch copy; 458 (450/8) from the working tree via `NODE_PATH`; and 334/334 twice on a targeted twelve-file subset. Every seat attributed its failures to absent dev dependencies or to the project's own fixture-build step, none to the material under review, and every seat said which scope it had run. **The spread is entirely explained by how much of the tree each seat could resolve dependencies for** — which is exactly why the run records suite-runnability per reviewer and not per task.
- Arm A's round-3 defender **withdrew a stance its own seat had taken in round 2** on two measurements that went against it, and said so in the control plane. Arm A's round-3 critic filed **0 findings and 2 responses** in a final round, declining to add anything that could only close unadjudicated.
- **Reviewer conduct.** Arm A's round-1 critic ran a filesystem-wide search to locate the enforcing JSON schema so it could self-validate against the real thing, and **pruned the search to exclude scratch and run directories** before executing it. Reviewers reconstructing the schema and validating against it — rather than against the brief's prose description of it — is now routine in this batch and is the behaviour A-004 was meant to make possible.

### T20r — CLOSED, both arms. **All 25 task ids now have both arms closed.**

| arm | debate | rounds | findings | claimants | severities | statuses | ship | flags |
|---|---|---|---|---|---|---|---|---|
| B (first) | `dbt-2026-08-13-a2d830` | 3 | 1 | codex 1 | 1 high | **partially-accepted 1** | NO-SHIP | 0 |
| A | `dbt-2026-08-13-ec2046` | 3 | 7 | codex 7 | 2 high, 5 med | accepted 5, **rejected 1**, **partially-accepted 1** | NO-SHIP | 0 |

- Arm order per schedule (B first). **`CONTEXT MATCH 54e7a5cf6c7b89454e14c2ec4b2e2a02684b5821d24ade1d19f4af5a77c58a3f`**. Both trees intact, same diff sha `435b146e…`. `close.err` empty in both; both closed at the round cap with unsettled findings carrying deciding evidence. 0 unsupported.
- All three Arm A injections **first attempt — 26 of 26 across the whole batch, no correction ever consumed.** All three Arm B Codex turns `usageStatus: captured` (77.1s / 37.1s / 17.3s).
- **Cost:** Arm A $29.59, Arm B $8.66 (codex $0.22, 2.5%), **B/A 0.29×**. **Median across all 25 tasks: 0.33×** vs the 3.0× ceiling — **PASS**. Usage **79/79 captured, 0 missing** for the batch.
- **`rejected` appears as a terminal status for the first time in the run.** Every prior disputed finding closed `partially-accepted` or `withdrawn`. T20r Arm A also produced the run's largest single reopening: the round-2 critic reopened **all five** contested findings at once via `partial`/`reject` with new evidence, taking the ledger from 4 partially-accepted + 1 rejected back to 6 open in one message. The defender then answered all six, and two survived to close.
- **Contrast worth carrying to grading.** Same artifact, same context hash: Arm B's Codex critic raised **one** finding across three rounds and never added another; Arm A's raised **seven**. That is the widest per-task claimant gap of the run, and it sits on the task with the most runnable suite in the batch — both arms ran the project's own suite to completion (~24,000 tests, exit 0 apart from setup errors from one absent optional type-checker). Neither arm was environment-limited here, so the gap is not a fidelity artifact.
- **A new exposure class, disclosed by T20r Arm A's round-3 critic: a filename-only recursive search surfaced the names of documentation files the brief puts off-limits as sources.** None was opened and no content was consulted; the seat disclosed it unprompted and put the substantive part inside its JSON message rather than the control plane. **Assessment: non-contaminating, and not a scrub defect.** A-002's scrub removes benchmark records, fix metadata and issue/PR identifiers — a project's own changelog and release notes are ordinary tree content and were never in scope for removal; the brief's "do not read them" rule is what governs, and it held. Recorded because the run has not previously distinguished *seeing a filename* from *reading the file* for this class, and a future revision should say which it means.

### Q-001 remediation re-run of T01–T06 — **COMPLETE**

**Preparation, done once for all six (2026-08-13).**

- **Condition 1 — all twelve superseded debates preserved under an explicit label.** Every `_rerun2/T0N-arm{A,B}` and `T0N-arm{A,B}-repo` renamed to `…-VOIDED-Q001`, 24 directories in total. This is not optional housekeeping: `arm_init` begins with `rm -rf` on exactly those paths, so re-running without renaming first would have destroyed the record the condition requires be kept.
- **Condition 11 — voided usage removed from the S3 input.** `T01-claude-usage.json`, `T01-usage-roster.json`, `claude-usage-T02-T06.json` and `usage-roster-T02-T06.json` moved to `_rerun2/_voided-usage/`. `compute-s3-cost.mjs` scans only the top level of `_rerun2` for `claude-usage*.json` and matches Codex payloads on `^(T\d+[a-z]*)-armB$`, so both the Claude and the Codex halves of the superseded runs now fall outside the computation by construction rather than by a flag someone has to remember. Verified: T01–T06 vanished from the S3 table on the next run. **That archive is benchmark remediation overhead and is reported separately, never as scoring cost.**
- **Fresh usage roster** opened at `_rerun2/usage-roster-Q001-T01-T06.json`, agent ids recorded at spawn.
- **Condition 8** holds by construction — the new seats were minted empty and `arm_init` created fresh log directories, so no reproduction file from a voided run can reach a new seat.

**Per-task results.** Arm order follows each task's original pre-registered draw (condition 2), not a new one.

| task | first | A debate | B debate | A rounds/findings | B rounds/findings | ship | flags | context match | seats |
|---|---|---|---|---|---|---|---|---|---|
| T01 | B | `dbt-2026-08-13-217649` | `dbt-2026-08-13-a2057e` | 3 / 6 (codex 5, claude 1) — accepted 6 | 2 / 2 (codex 1, claude 1) — accepted 2 | NO-SHIP / NO-SHIP | 0 / 0 | `aa0f8a29…` | empty before; **mutually unreachable** after |
| T02 | B | `dbt-2026-08-13-25f95f` | `dbt-2026-08-13-1d53b8` | 3 / 10 (codex 8, claude 2) — accepted 9, partially-accepted 1 | 2 / 7 (codex 5, claude 2) — accepted 7 | NO-SHIP / NO-SHIP | 0 / 0 | `a7daa3d1…` | empty before; **mutually unreachable** after |
| T03 | A | `dbt-2026-08-13-40e89d` | `dbt-2026-08-13-b2255e` | 3 / 9 (codex 7, claude 2) — accepted 8, **open 1** | 3 / 7 (codex 2, claude 5) — accepted 6, **open 1** | NO-SHIP / NO-SHIP | 0 / 0 | `9dfb04d2…` | empty before; **mutually unreachable** after |
| T04 | A | `dbt-2026-08-13-c88578` | `dbt-2026-08-13-1a9db2` | 1 / 2 (codex 2) — accepted 2 | 1 / 1 (codex 1) — accepted 1 | NO-SHIP / NO-SHIP | 0 / 0 | `3de9928e…` | empty before; **mutually unreachable** after |
| T05 | B | `dbt-2026-08-13-853845` | `dbt-2026-08-13-c4e18d` | 1 / 4 (codex 4) — accepted 4 | 1 / 1 (codex 1) — accepted 1 | NO-SHIP / NO-SHIP | 0 / 0 | `0e1df4d9…` | empty before; **mutually unreachable** after |
| T06 | A | `dbt-2026-08-13-0950d1` | `dbt-2026-08-13-bfa3cb` | 3 / 6 (codex 6) — accepted 5, partially-accepted 1 | 3 / 3 (codex 2, claude 1) — accepted 3 | NO-SHIP / NO-SHIP | 0 / 0 | `df79e4b8…` | empty before; **mutually unreachable** after |

- **T01.** Both arms closed on `all findings settled`; 0 disputed, 0 unsupported, `close.err` empty in both, both trees intact with the same diff sha `27ee6fd2…`. All three Arm A injections first attempt. Both Codex turns `usageStatus: captured`. Usage **8/8 captured, 0 missing**. **Cost: Arm A $28.43, Arm B $4.35 (codex $0.27, 6.2%), B/A 0.15×.**
- **Condition 7 verified mechanically after the arms closed, not asserted:** across 30,635 filesystem entries in T01's three seats, **0 symlinks resolving into another seat, 0 shared hard links, and 0 files in any seat containing another seat's absolute path**. Every participant's foreign-scratch declaration was "none encountered" (condition 5); no arm triggered condition 6.
- **T02.** All 17 findings across both arms `strong`; 0 unsupported; `close.err` empty in both; both trees intact, same diff sha `f51020d5…`. Arm B closed on `all findings settled`; Arm A at the round cap with one unsettled finding. All three Arm A injections first attempt. Both Codex turns captured. Usage **16/16 cumulative captured, 0 missing**. **Cost: Arm A $22.82, Arm B $6.23 (codex $0.32, 5.1%), B/A 0.27×.** Condition 7 post-check across 9,093 entries: **0 / 0 / 0, seats mutually unreachable.** Every foreign-scratch declaration "none encountered".
- **T03.** `close.err` empty in both; both trees intact, same diff sha `bcefe70b…`; 0 flags. All three Arm A injections first attempt. Both Codex turns captured. Usage **25/25 cumulative captured, 0 missing**. **Cost: Arm A $27.69, Arm B $9.49 (codex $0.33, 3.5%), B/A 0.34×.** Condition 7 post-check across 19,560 entries: **0 / 0 / 0.**

  Two things worth flagging to grading. **First terminal `open` findings in the run, and they appear in both arms** — one each, in each case a finding raised in the final round that the opposing side had no turn left to answer. That is exactly the "closes as unresolved risk" outcome the final-round brief warns about, arrived at by both sides independently on the same task; it is not a protocol error and the runner flagged nothing. **Second, Arm B's Claude defender out-produced the Codex critic 5 findings to 2** — the largest defender-over-critic margin of the run so far, and the third occurrence after T13 and T18. The defender is Claude in *both* arms, so defender-claimed findings are not part of the independent variable; a grader comparing raw finding counts per arm without splitting by claimant would read this backwards.
- **T04.** Both arms closed after **one round** on `all findings settled`; every finding accepted at first response, all `strong`, 0 disputed. `close.err` empty, trees intact, same diff sha `c276376a…`, 0 flags. Arm A's single injection first attempt; the one Codex turn captured. Usage **28/28 cumulative captured, 0 missing**. **Cost: Arm A $5.69, Arm B $2.97 (codex $0.07, 2.4%), B/A 0.52×.** Condition 7 post-check across 5,725 entries: **0 / 0 / 0.** Fidelity: all three seats agreed the checkout ships no dependency tree and that installing into it is forbidden, all three installed under their own seats and resolved by path override, and all three then ran the project's own suite green — one reporting 80/80 and another 78/78 on a differently scoped selection, each stating its scope.
- **T05.** Both arms closed after **one round** on `all findings settled`; every finding accepted at first response, 0 disputed, 0 flags. `close.err` empty, trees intact, same diff sha `608b2220…`. Arm A's single injection first attempt; the one Codex turn captured. Usage **31/31 cumulative captured, 0 missing**. **Cost: Arm A $7.45, Arm B $4.56 (codex $0.06, 1.4%), B/A 0.61×.** Condition 7 post-check across 2,735 entries: **0 / 0 / 0.** Fidelity: the project's configured runner cannot be used at all, because collecting it needs dev dependencies installed inside the checkout and that is forbidden. All three seats independently fell back to the platform's built-in runner with one dependency installed under their own seat, and all three reported the relevant files green; one additionally ran the whole unit directory at 1044 of 1072 passing, every failure a missing dev dependency or a missing runtime flag.
- **T06.** `close.err` empty in both; both trees intact, same diff sha `04c798a7…`; 0 flags; 0 unsupported. All three Arm A injections first attempt. All three Codex turns captured. **Cost: Arm A $30.82, Arm B $6.55 (codex $0.48, 7.4%), B/A 0.21×.** Condition 7 post-check across 76,658 entries — the largest seat footprint of the re-run: **0 / 0 / 0.**

  **Fidelity, and the second time in the run a reviewer overturned "not runnable" by building the missing service itself.** Rounds 1 and 2 recorded T06's suite as unrunnable for three independent reasons: no installed dependencies, a test entry point gated on a pre-step that writes inside the checkout, and no backing datastore on the host. In round 3 **both Arm A seats independently built the datastore from source inside their own seats** and ran the project's own configuration from a scratch copy — 854 passing, 4 pending, 0 failing, exit 0, about seven minutes — then shut the instances down. Arm B's seats did not, and recorded it unrunnable throughout. Same shape as T22, where the initiative came from Arm B instead; **it is reviewer initiative, not an arm property, and the report must not let two instances read as a pattern in either direction.**

  Both Arm A round-3 seats also moved against positions their own seat had taken in round 2, each on measurements it ran itself.
- **Condition 10, drift recorded and deliberately not used as an argument.** T01's re-run costs far more on Arm A than the superseded run did ($28.43 vs $3.75) and its B/A ratio moves from 0.84× to 0.15×. The reviewer environment has changed a great deal since T01 first ran — per-seat isolation, the A-004 schema gate, and briefs that now carry the transition table, the field types and the platform hazards — and Arm A's critic is the seat that receives all of that. **This is exactly the drift condition 10 anticipates, and it is recorded rather than treated as a reason to have kept the defective runs.** It does mean the re-run tasks are not cost-comparable with their own superseded versions, which the report must say.

**Q-001 IS DISCHARGED — all six tasks, both arms, twelve replacement debates.** Cumulative results across the re-run:

- **0 protocol flags** in any of the twelve debates; **0 `unsupported` findings** anywhere; `close.err` empty in all twelve.
- **Every arm's tree intact, and A and B returned the same diff sha on all six tasks** — no arm perturbed any reviewed tree.
- **Every `arm_context_match` printed `CONTEXT MATCH`.**
- **All 14 Arm A injections passed the A-004 gate first attempt**; the permitted correction was never consumed.
- **All 10 Arm B Codex turns recorded `usageStatus: captured`**, 0 missing.
- **Usage 40/40 captured, 0 missing** (`_rerun2/claude-usage-Q001-T01-T06.json`), recorded at spawn.
- **Condition 5:** every participant filed a foreign-scratch declaration and **every one said "none encountered."** **Condition 6 was never triggered.**
- **Condition 7, verified mechanically per task rather than asserted:** 134,406 filesystem entries examined across the eighteen seats, **0 symlinks resolving into another seat, 0 shared hard links, 0 files containing another seat's absolute path.**
- **Conditions 2, 3, 8, 9** held by construction: original arm order per task, fresh repos/debates/threads/subagents/seats, no reproduction file carried over from a voided run, and identical staging, prompts, cost capture, rate policy, machine class and harness configuration in both arms.

**Median B/A across the full 25-task dataset is now 0.33× against the 3.0× ceiling — PASS**, and this is the first time that figure has been computed over a dataset in which T01–T06 are the *replacement* observations. T07 and T08 are still the superseded ones and remain to be re-run under Q-003.

### Q-003 remediation re-run of T07 and T08 — **COMPLETE**, and Q-003-E1 discharged

**Preparation.** All eight prior T07/T08 arm directories and repos renamed to `…-VOIDED-Q003` (condition 1); T07's pre-isolation Arm A run keeps its distinct existing `T07-armA-VOIDED` label, so the record now carries **three** generations of T07 and they are individually identifiable. Fresh opaque seats were already minted and verified empty (condition 4). Condition 9's usage separation needed a **split, not a move**: T07/T08's Claude usage lived inside `claude-usage-T07-T11.json` alongside T09–T11, which are retained — 18 voided rows went to `_rerun2/_voided-usage/`, 20 retained rows stayed in the scanned file, and the Codex halves left the computation with the directory rename. **Condition 11 held by construction:** the briefs are template-generated and the spawn prompts purely procedural, so no replacement participant was told the audit's contents, the exposed filenames, any prior finding, any prior repro material, or the reason for the re-run.

| task | first | A debate | B debate | A rounds/findings | B rounds/findings | ship | flags | context match |
|---|---|---|---|---|---|---|---|---|
| T07 | B | `dbt-2026-08-13-ad78df` | `dbt-2026-08-13-fbe24d` | 3 / 3 (codex 3) — accepted 3 | 1 / 1 (codex 1) — accepted 1 | NO-SHIP / NO-SHIP | 0 / 0 | `b24a2fa5…` |
| T08 | A | `dbt-2026-08-13-608814` | `dbt-2026-08-13-01c948` | 3 / 2 (codex 2) — accepted 2 | 2 / 1 (codex 1) — partially-accepted 1 | NO-SHIP / NO-SHIP | 0 / 0 | `f83daecb…` |

- Both context hashes **equal the staged values recorded in §2** — `b24a2fa5…` for T07 and `f83daecb…` for T08 — which is independent confirmation that condition 3's "same finalized staging" held across the re-run.
- `close.err` empty in all four; trees intact with A and B returning the same diff sha per task; 0 unsupported; **all 6 Arm A injections first attempt.**
- **Cost:** T07 Arm A $28.75, Arm B $3.19 (codex 1.9%), **B/A 0.11×**. T08 Arm A $23.21, Arm B $5.30 (codex 4.9%), **B/A 0.23×**. Usage **15/15 captured, 0 missing.**
- **A harness failure mid-turn, and how it was handled.** T08's Arm A round-2 critic was terminated by an API connection error after it had built four probe scripts and captured their output, but **before** it wrote its message. The ledger was untouched — phase still `awaiting-critique`, round 1 — so no invalid state entered. The **same seat was resumed** rather than replaced: this was a harness fault, not an invalid submission, so it does not consume A-004's one-correction budget, and resuming preserved experimental work that a fresh seat would have had to redo while also giving that seat a second independent attempt at the search. The resume message was purely procedural, as §7 requires. Recorded because the run has not previously had to distinguish a harness fault from a protocol fault.
- **First `deadlock` close of the run.** T08 Arm B ended at round 2 on the runner's `deadlock` condition — the critic's round-2 message produced no new findings and no status changes, and the defender had no legal target. Distinct from both `all findings settled` and the round cap.

### Q-003-E1 — the ordered transcript-level foreign-seat audit: **NO VOIDING EXPOSURE**

Full record at `reviews/AUDIT-Q003-E1-foreign-seat.md`; machine report at `_rerun2/Q003-E1-foreign-seat-audit.json`.

**174 retained critic and defender participants across all 25 tasks. 0 operations and 0 attempted operations against any foreign seat. 0 scratch-parent listings. 0 foreign paths from another task, arm or voided run. 24 foreign-seat occurrences, all authorized same-debate quotations. 0 unclassifiable after provenance work.** Every participant issued at least 4 tool calls against its own seat (most 20–60), which is the transcript-derived evidence condition 6 demands in place of the seat map.

Two occurrences could not be classified by the instrument and were **not presumed authorized** (condition 7). T14's traced to a harness tool-result spill file, verified mechanically to contain only that debate's two seats and no other task, arm or voided material. T12's traced to a working file since deleted, so provenance came from the archive instead: the participant's transcript shows it created the file itself from `ledger.json` in its own arm repo, and the **archived ledger contains that seat path with three of four surrounding text fragments verbatim**. Both are authorized quotations.

**One deviation recorded separately from the classification:** the T12 Arm A round-3 defender wrote that working file into an **orchestrator session scratchpad rather than its own seat**. Non-contaminating — the content was its own extract of the authorized ledger — but writing outside the assigned seat breaches the scratch policy, and it is exactly why the proof had to come from the archive: the file was cleaned up with that session.

**Two limits the report must carry.** The audit tests *paths*, not content — a participant that learned something without a path appearing in its transcript would not be caught, the same inherent limit on retrospective isolation audits consult 008 already recorded. And Arm B's Codex critic writes no participant transcript, so 21 turns sit outside this instrument; it occupies no scratch seat at all, but that is a structural argument, not a measurement.

### A-005 — installed upstream copies: **13 tasks voided, re-run outstanding.** This is the largest item left.

**What it is.** Reviewers install the project's own test dependencies into their seats. A test plugin can pull **a published release of the project under review** in as a transitive dependency, putting a second, later copy of the reviewed source on disk beside the reviewer. **A-002 removes history from the checkout and says nothing about the dependency graph.** This is the first channel in the run that can expose the fix itself rather than merely locate the slice.

**How it surfaced, and how late.** T08's Arm A defender disclosed it unprompted. Nothing in the §5a checklist looked for it and the channel has existed since T01 — which means the same class of gap may exist elsewhere in the seat environment that no reviewer happened to mention.

**Ruled (consult 012, amendment §A-005): contamination on reachability, not on proven use**, because use is generally unobservable — imports, test discovery, stack traces and dependency introspection all expose it without a source-reading command. Report-only treatment was **rejected**. The orchestrator's argument that balanced defender exposure could not bias A against B was **rejected**: defenders raise findings, rebut, move status and support, and determine convergence, so an exposed defender moves S1 and S2 too.

**The set, after the extended sweep and triage — 13 tasks, both arms each:**

**T01, T04, T06, T07, T08, T09, T10, T11, T12, T13, T15, T21, T24.**

The ruling's twelve, plus **T01** which only the extended sweep found (an extracted release in a `uv` cache). **T16, T20r, T22 and T23 were flagged and cleared** — the first three are working-tree copies verified by file-level hashing against both the review repo and the scrubbed buggy tree, the fourth was an instrument defect. Full record in `reviews/AUDIT-A005-environment-sweep.md`.

**Note what this costs.** T07 and T08 are being re-run for the **third** time and T01 for the **third** time; the record must keep the generations distinct — `T07-armA-VOIDED` (pre-isolation), `…-VOIDED-Q003`, and now `…-VOIDED-INSTALLED-UPSTREAM`.

**Before any re-run**, A-005 requires a harness-managed dependency environment, built and frozen ahead of both arms, that resolves each task's test closure **without** the reviewed project, rejects and removes any matching distribution (including editable installs, `.pth` injections, direct-URL installs, local wheels, vendored copies and namespace contributions), and **proves every reviewed-project import resolves only to the scrubbed tree**. A pin is not sufficient. `--no-deps` is not sufficient. If a test plugin cannot work without installing the reviewed project, it cannot be used in a reviewer seat — substitute it, exercise the behaviour through the working tree, or record the suite as unavailable.

**Reviewer briefs must change accordingly** — participants are pointed at the prepared environment and told not to install; if one installs anything further, its environment is re-audited before its work may enter the debate.

### A seat-map hygiene note, so it is not later mistaken for a Q-003-class finding

The map contains a `T<NN>-B-critic` entry for **every** task, but **Arm B's critic is Codex, driven by the runner, and never occupies a scratch seat at all.** Those entries are therefore permanently unused by construction, and `T17-B-critic` has no `SEAT-ATTEST.json` for exactly that reason. This is *expected*, and it is **not** the T07 defect: there the map asserted a seat for the Arm B **defender** — a Claude seat that should have existed and did not, while the participant actually ran in shared scratch. Distinguish the two when auditing: an unused `B-critic` entry is structural; an unused `B-def` or any `A-*` entry is a red flag.

**Note on where run state lives:** `/Users/michaeltraw/Dev/council-bench` is **not** a git repository. Only `reviews/` in the marketplace repo is committed; the artifacts, staged repos, scrubbed checkouts, seats and usage payloads live on disk outside version control. "Commit after each task" therefore means committing this file and the batch records.

Source clones are all present: `T01`(aiohttp), `_src-redis-py`, `_src-undici`, `_src-bullmq`, `_src-ioredis`, `_src-celery`, `_src-fastify`, `_src-pino` (T19r), `_src-sqlalchemy` (T20r), `_src-fastapi` (T23). **No clone work is owed.**

Helper scripts were recreated this session in the session scratchpad (**not committed**): `armlib.sh` (§3.1), `mkbrief.mjs`, and the brief templates `BRIEF-CONSTRUCT.tmpl` / `BRIEF-CRITIC-A.tmpl` / `BRIEF-DEFENDER.tmpl`. Recreate from §3.1 and §7 if the scratchpad is gone.

To pick up mid-task at any point, run `arm_cp <task> <arm>` (recreate `armlib.sh` from §3.1 first if the scratchpad is gone) and read `phase`:

| phase | what is owed |
|---|---|
| `awaiting-critique` | Arm A: `arm_prompt_A` → spawn critic → it writes `critique-mock-r<N>.json` → `arm_inject_A`. Arm B: `arm_critique_B` |
| `awaiting-rebuttal` | spawn the defender subagent → it writes `rebuttal-r<N>.json` → `arm_rebut` |
| `ready-to-close` | `arm_close`, then `arm_clean_check` |
| `closed` | init the second arm; once both exist, `arm_context_match` must print `CONTEXT MATCH` |

**After the nine tasks, in order:** the three ordered remediation items in §5 (Q-001 T01–T06 re-run, Q-001 condition 12 audit of T07–T11, Q-002 condition 8 dependency screen) → final S3 → `reviews/READY-TO-GRADE.md`. **Do not begin grading.**

**Record each agent id in the batch roster as the subagent is spawned** (`_rerun2/usage-roster-T17-*.json`), rather than reconstructing later. The T12–T14 roster had to be rebuilt from transcript timestamps; it worked and is exhaustive, but it cost time that recording at spawn does not.

---

## 1. Standing authority

The operator has authorized running to completion without check-ins, and authorized the orchestrator to use `/council:consult` directly whenever a ruling, countersign, or interpretation is needed. Questions are escalated to the operator **only** if GPT and the orchestrator deadlock on something the frozen rules cannot resolve.

**Only three valid stops:** (1) a frozen-rule conflict unresolvable even with a GPT ruling — stop and state it plainly; (2) usage-limit exhaustion — stop cleanly at a task boundary; (3) completion.

**Completion** = all 25 tasks run both arms under final isolation policy + all ordered re-runs and audits done + S3 computed + everything committed + `reviews/READY-TO-GRADE.md` written. **Do NOT begin grading** — grading requires the operator and stops there by frozen rule (BENCHMARK.md §3, §5a).

---

## 2. Current state

### Tasks complete (both arms closed, ungraded)

| task | status | note |
|---|---|---|
| T01–T06 | closed, **but superseded by order** | must be re-run under Q-001; see §5 |
| T07 | closed, **VOID both arms** | Q-003: Arm B never used a private seat. Re-run B-first. Pre-isolation `_rerun2/T07-armA-VOIDED/` plus the current pair all preserved as VOIDED |
| T08 | closed, **VOID both arms** | Q-003 §3: the opaque-name carve-out failed on decoder reachability. Re-run A-first. Arm B's own conduct was clean |
| T09–T11 | closed, **clean** | retained; audited clean in all six debates |
| T12 | **closed** | A: 3 rounds, 6 findings (codex 5, claude 1), all accepted, 1 crit/4 high/1 med, NO-SHIP. B: 1 round, 2 findings, both accepted, 2 high, NO-SHIP. 0 flags both arms |
| T13 | **closed** | B: 3 rounds, 5 findings (codex 2, claude 3), all accepted, 2 high/3 med, NO-SHIP. A: 3 rounds, 6 findings (codex 4, claude 2), all accepted, 1 high/4 med/1 low, NO-SHIP. 0 flags both arms |
| T14 | **closed** | A: 3 rounds, 4 findings (codex 3, claude 1), 2 accepted + 2 partially-accepted, 2 crit/2 high, NO-SHIP. B: 3 rounds, 4 findings (codex 2, claude 2), 3 accepted + 1 partially-accepted, 3 high/1 med, NO-SHIP. 0 flags both arms |
| T15 | **closed** | First Arm A attempt VOIDED under A-004 (schema asymmetry); restarted with fresh seats. A: 1 round, 3 findings (codex 3), all accepted, 1 high/1 med/1 low, NO-SHIP. B: 1 round, 1 finding (codex 1), accepted, 1 high, NO-SHIP. 0 flags both arms; both trees intact |
| T16 | **closed** | B: 1 round, 3 findings (codex 3), all accepted, 1 high/2 med, NO-SHIP. A: 3 rounds, 5 findings (codex 5), all accepted, 3 high/2 med, NO-SHIP. 0 flags both arms; both trees intact |
| T17, T18, T21–T25, T19r, T20r | **closed** | the T17–T20r batch is complete; see §0 |


### T12–T16 construction (done, audited, staged)

| task | repo | buggy SHA | lines | ranges | syntax check | slice |
|---|---|---|---|---|---|---|
| T12 | ioredis | `9618206b93d7` | 499 | 3 | TS compiler API, 0 syntactic diagnostics | subset |
| T13 | celery | `aef7f130e3ca` | 499 | 1 | `py_compile` PASS | prefix |
| T14 | fastify | `9d2914857906` | 458 | 2 | `node --check` PASS | subset |
| T15 | undici | `2f66db7322f4` | 389 | 1 | `node --check` PASS | prefix |
| T16 | redis-py | `b121809bd7c7` | 330 | 1 | `py_compile` PASS | identity |

Audit: 0 contamination leaks, 55/55 verification checks, **all FULLY CONTAINED**, scrub PASS 26/0 ×5, staging PASS 16/0 ×5. No two share a source path.

### Staged context hashes (both arms must match)

T07 `b24a2fa5ae2796f9e0c02cc2b833f989fcc294ae28c66b0eee8623ff01d3c0fb` ·
T08 `f83daecb81e50d718b7f57f1800d179f00933377954623662134c3ab51b36ba3` ·
T09 `a753f1fd5fc097cfb73a08c5be8c1965af880ac3c48854834e2ef41e369b6284` ·
T10 `6e82179453b1769ed331c1a760555ca913750203b954d422c5971f8d7632bdfc` ·
T11 `f2af7b684478a483d9b94390b61ba0ca3c215cdecba72f2344a901213771dd0b` ·
T12 `5c855ad17c130e10ff7492f8bf39a890b0b7810f7d047ca26e3419dded072fea` ·
T13 `b9083bd17d82d418114f9a54693b8e293beaa59856a4c6a343538906b48e9cc4` ·
T14 `8ca3e62e0f683d8f9c210c441a690339b25845bc3232c7b68735b211fc0959ae` ·
T15 `d71aa61375ec4adbb7ee23d0819de4227f1ec57ba905e62cc58d4d753b43d990` ·
T16 `bdcadb48549621c45bbd1235687043abd420159574500558619366828e10ec93`

---

## 3. Per-task procedure

Working dir `/Users/michaeltraw/Dev/council-bench`; marketplace repo `/Users/michaeltraw/Dev/council-marketplace`.

Helper functions live in the session scratchpad as `armlib.sh` (**not committed** — recreate from §3.1 if lost).

1. **Verify** buggy SHA is the fix commit's parent and the fix date matches Appendix A.
2. **Construct** — one subagent per task, behind the contamination boundary. Emits `T<NN>-artifact/{ARTIFACT, T<NN>-RANGES.json, CONSTRUCTION-RECORD.md}`. Brief must forbid: quoting repository paths in its final message; reading any other task's artifact directory; reading any other scratch directory.
3. **Contamination audit** — one subagent sweeps all records, independently re-derives every sidecar property, re-runs syntax checks, **verifies defect containment** (fix hunks ∩ artifact ranges), and reports a same-source-path matrix.
4. **Scrub**: `node bench/make-scrubbed-checkout.mjs --repo <clone> --buggy-sha <sha> --out _scrubbed/T<NN> --task T<NN>`
5. **Audit scrub**: `node bench/audit-scrubbed-checkout.mjs --out _scrubbed/T<NN> --manifest _scrubbed/T<NN>-MANIFEST.json --repo <clone> --forbidden-sha <fixSha>` → expect PASS 26/0.
6. **Stage**: `node bench/stage-review-artifact.mjs --sidecar … --artifact … --scrubbed … --out _rerun2/T<NN>-staged --framing bench/framing/review-window.txt --sealed _rerun2/_sealed/T<NN>-STAGING.json`
7. **Audit staging**: `node bench/audit-staging.mjs --staged … --sealed … --artifact … --framing …` → expect PASS 16/0.
8. **Run scheduled arm first, then the second**, each in its own repo copy.
9. **Collect usage**, **compute S3**, **commit**, **update this file**.

### 3.1 armlib.sh essentials

- `arm_init <task> <arm>` — `rm -rf` arm repo+logs, `cp -R` from `_rerun2/T<NN>-staged`, then in the copy: `node council-runner.mjs init --scope working-tree --rounds 3 "$(cat bench/framing/review-window.txt)"`, writes `DEBATE_ID`.
- `arm_cp <task> <arm>` — `node bench/control-plane.mjs --repo … --debate …`. **The only permitted view of a live debate.**
- `arm_context_match <task>` — asserts both arms' `context.md` hash identically.
- `arm_critique_B <task> <round>` — Codex critic; stdout redirected to a file and **never read**.
- `arm_prompt_A <task> <round>` — builds the Arm A critic prompt via `bench/armA-prompt.mjs --template _prompts/critique-armA.md`.
- `arm_inject_A <task> <round>` — **schema-gated** via `bench/inject-armA.mjs` (A-004). Exit 0 injected; exit 1 invalid, one correction permitted, bounce the error list back to the same critic seat; exit 3 second invalid submission, critic step aborts. Validation precedes the runner call, so an invalid message cannot mutate the ledger. Rejected payloads and error reports are archived to `_rerun2/_rejected/<arm>/`, outside any directory reviewers read.
- `arm_rebut <task> <arm> <round>` · `arm_close <task> <arm>` · `arm_clean_check <task> <arm>`.

### 3.2 Arm order (pre-recorded, `bench-schedule.json` — never deviate)

B-first: T01, T02, T05, T07, T09, T10, T13, T16, T18, T21, T22, T23, T24, T19r, T20r
A-first: T03, T04, T06, T08, T11, T12, T14, T15, T17, T25

---

## 4. Invariants and gates (§5a, checked per task)

- `BENCHMARK.md` sha256 = `72d09391d09a91db1083420b293968c8c5c87d3ee3ead92ad0af00734557562f` — **never edit this file.**
- Plugin pinned at `f976990`, no local modifications; protocol suite **46 passed, 0 failed**.
- Codex CLI `0.147.0`; Anthropic `claude-opus-5`; OpenAI `gpt-5.6-sol`.
- Both arms' `context.md` **must hash identically**; framing `focusSha256` must equal `63a64714bdf75511421b8870dfdbf83e541b28391ad7ca92db938ef6c47a22df`. **Read this value off `arm_cp` (i.e. `bench/control-plane.mjs`) and nowhere else.** The control plane computes it as `sha256(debate.focus + "\n")`, which reconstitutes the frozen framing file byte for byte; `debate.focus` itself is the file minus its final newline, so hashing `debate.focus` raw gives a *different* value and does not test this invariant.

  > **Recorded 2026-08-12.** The orchestrator wrote a second, ad-hoc implementation of this check into `armlib.sh`, hashed `debate.focus` raw, and it reported `MISMATCH` on T17 Arm A — briefly appearing to show that a frozen invariant had moved. It had not: the control plane had been checking it correctly all along, and this line's recorded value was right. **The redundant checker has been deleted rather than fixed**, since the whole point of A-004 condition 2 is that a second hand-rolled implementation of an existing check is the defect, not the remedy. Cost: one wasted investigation and one incorrect "corrected" note, which this replaces.
- Arm A template `_prompts/critique-armA.md` differs from `prompts/critique.md` by exactly two role-reference lines.
- Round cap 3; no env overrides except `COUNCIL_MOCK_CRITIQUE` for Arm A, and that file is now **schema-gated** — never set it by hand, always go through `arm_inject_A` → `bench/inject-armA.mjs`.
- **A-004 harness freeze (verify before each task):** `bench/validate-critique.mjs` `8d196a4715f0f1b913f5ead3fd1e06bd08fda10cb6b298c40d0664ce7c07aa36`, `bench/inject-armA.mjs` `9006f6de740397ef5c470ae99e4a180238667d4245c8bbe5ed5681bb74457b5f`, `bench/test/harness-schema-tests.mjs` `be85f57ace244eefd689664daeb97eb89a433085b56108ede2996891a5cef52a`, schema `6e78ea61a2ddad2d43c70c5f12d05cf9f3043726676d4716de4b3e7f294fafd3`. Harness suite **69 passed, 0 failed**; plugin suite still **46 passed, 0 failed**. (The test file was re-frozen once on 2026-08-11 after a fixture correction; the two executable files have not moved. See A-004 condition 5.)
- Arm A critic gets **exactly one** format correction, sent back to the same seat, format-only — never a comment on finding quality, evidence strength, severity, or correctness. A second invalid message aborts the critic step.
- Debates run **strictly sequentially** — never two at once (wall-clock is a recorded metric).
- Orchestrator reads **control-plane only**: never finding text, never a verdict body, never the sidecar or construction record, never a staged repo's source.

---

## 5. Ordered work outstanding

Order is flexible but **all must complete before grading** (amended Sequencing, consult 006).

1. ~~**T17, T18, T21–T25, T19r, T20r** — the nine, in schedule order.~~ **DONE 2026-08-13.** All nine closed both arms; batch record written at `reviews/BATCH-T17-T20r.md`.
2. ~~**Q-001 re-run: both arms of T01–T06** under per-seat isolation.~~ **DONE 2026-08-13.** All twelve replacement debates closed; all twelve conditions discharged and evidenced in §0. The twelve superseded debates are preserved as `…-VOIDED-Q001` and their usage is archived under `_rerun2/_voided-usage/`, outside the S3 computation, as remediation overhead.
3. ~~**Q-001 condition 12: audit T07–T11.**~~ **DONE 2026-08-12.** Result: T07 Arm B `VOID-ARM`; T07 Arm A, T08 Arm A `DEVIATION-RECORDABLE`; T08 Arm B and all of T09–T11 `CLEAN`. See §Q-003.
4. ~~**Q-003: re-run both arms of T07, Arm B first.**~~ **DONE 2026-08-13.** Replacement pair closed; all twelve conditions discharged; only the clean replacement pair is T07 scoring observation. Original text follows for the record.

   OLD: **NEW — Q-003: re-run both arms of T07, Arm B first**, under twelve binding conditions (`BENCHMARK-AMENDMENTS.md` §Q-003). Preserve the existing pair *and* the pre-isolation Arm A run as `VOIDED`. **Condition 11: the replacement participants must not be told the audit's contents, the exposed filenames, any prior T07 finding or repro material, or the reason T07 is being re-run.** Condition 5 requires mechanical proof each seat is the participant's *actual* working directory — the seat map is not sufficient evidence, and a `SEAT-ATTEST.json` written by each participant is now part of every brief.
5. ~~**Q-003 §3: re-run both arms of T08**, Arm A first.~~ **DONE 2026-08-13.** Replacement pair closed. T08 Arm B own conduct tested clean throughout and it was re-run only by the conditional — the record preserves that distinction. Original text follows for the record.

   OLD: **NEW — Q-003 §3: re-run both arms of T08**, Arm A first. The carve-out verification **failed limb (b)**: the seat-map decoder was created and edited *inside the very directory the T08 Arm A defender listed*, and was moved out only **422 seconds after the listing**, in the same orchestrator turn that submitted that participant's rebuttal — the relocation was the remediation for this disclosure. Limb (a) passed (one opaque entry, zero identifying, truncation ruled out by reproducing the collation). The participant demonstrably did **not** use the decoder, but the ruling tests access, not use. **T08 Arm B tested clean on every measure and is re-run only by the conditional** — preserve that distinction in the record. Same twelve Q-003 conditions.

   **Consequence for the standing record:** the claim that the decoding map is held outside the tree is true only from 08:24:53Z on the run date, and false before it. Any inference elsewhere in these files that rests on that premise for T07–T11-era events is unsound and must be re-checked, not reused.
6. ~~**Q-002 condition 8: dependency screen across all 25 tasks.**~~ **DONE 2026-08-12, and condition 10 discharged.** The dedicated screen ran over all 300 pairs; five size-2 components; the uniform component-level rule was submitted and ruled (consults 009 + 010, amendment §Q-002-R), and conditions 12 and 13 are discharged with no change to the component set. **Sensitivity drop set T01, T11, T15, T21, T25; N = 20**, derived from the component table and never from a hard-coded list. Nothing further is owed on Q-002 before grading except reporting.
7. ~~**Q-003-E1: transcript-level foreign-seat audit of every retained debate.**~~ **DONE 2026-08-13.** 174 participants, all 25 tasks, 0 exposures. See `reviews/AUDIT-Q003-E1-foreign-seat.md`.
8. **Compute S3** over everything; write `reviews/READY-TO-GRADE.md`. **← the only item left.**

---

## 6. Recorded exposures and deviations (must appear in batch records)

- **Q-001 shared scratch** — T01–T06 and T07 Arm A. Remedy ordered; see §5.2.
- **T07 Arm A round-2 critic** listed `_scratch/` parent — three structural seat names, same arm/task. Non-contaminating; naming now opaque.
- **T08 Arm A defender** listed `_scratch/` parent — one opaque sibling name. Non-contaminating.
- **T15 constructor** listed `_scratch/` parent — opaque names only; constructors sit behind the boundary.
- **T12 constructor read T11's artifact directory** — exposure `SIDECAR FIELDS`. Non-contaminating: T11 already closed, different repositories (ioredis vs undici), constructors do not review. Caused by a brief gap; the clause is now standard.
- **T12 Arm A round-1 critic named a repository source path** in its final message, breaching the control-plane rule. Same class as the T01 and T03 exposures — locates the slice, which reviewers see anyway, not the defect. Closing instruction has been strengthened to name the failure mode explicitly (status lines, quoted commands, sweep results, "in passing").
- **Fidelity variables can be reviewer-dependent.** On T12 the Arm A critic and defender initially reported incompatible suite-runnability results; the round-2 critic re-established it and corrected its own round-1 note. Record fidelity per reviewer, not as one fact per task.
- **Protocol semantics (two stumbles so far — brief both sides explicitly).** The ledger's transition table for a claimant acting on its **own** contested finding (status `rejected` or `partially-accepted`) is:
  - `accept` → **withdrawn**, terminal, abandons the whole finding. Cost T11 Arm A two findings whose substance a defender had already accepted; the ledger retains the substance, the status field understates. There is **no** way to narrow a finding via `accept`.
  - `reject` or `partial` **with new checkable evidence** → **open (reopened)**. This is the only legal way to "reopen with corrected scope."
  - `reject` without new evidence → unchanged, dispute stands.

  T13 Arm A's round-2 defender tried to express a reopening by **filing a new finding under the original id**, which the runner refused as a duplicate id; its first correction filed a separate finding instead, which would have left the original sitting contested with a mistaken mitigation plus a near-duplicate superseding it in prose. Corrected to use the response mechanism. **Put the transition table in reviewer briefs**, not just the withdrawal warning.
- **A settled finding's fields cannot be amended.** T13 Arm A's closing defender concluded the recorded `confidence` on a settled finding understates it (0.75 vs an honest 0.9, severity unchanged) and found no legal mechanism to correct it — the ledger closes at the original figure with the disagreement in `notes` only. Graders should read `notes` alongside the fields.
- **zsh does not word-split unquoted parameter expansions.** Routing a probe's argument list through a single variable collapses it into one argv entry, which silently turns crash probes into false negatives — every probe reports survival. **Three seats hit this** (T14 Arm A rounds 1 and 2, and it is now a standing brief warning). Two had to invalidate and regenerate archives they had already written. Brief reviewers to pass arguments literally or use an array.
- **A reopening is not mechanically required to carry new evidence.** The runner's transition table expects `reject`/`partial` on your own contested finding to come with new checkable evidence, but T14 Arm B's critic reopened the same finding in rounds 2 **and** 3 citing only the defender's own prior outputs. Both times the defender produced fresh evidence rather than arguing from the record. Worth reporting as a gap between the documented expectation and what is enforced; do not assume a reopening means new evidence exists.
- **Fidelity variables are reviewer-dependent, and severity disputes can outlast mechanism agreement.** T14 closed with `partially-accepted` findings in **both** arms — the first task where disputes survived to close. Mechanism was agreed throughout in both; what persisted was impact and severity. Deciding evidence is recorded in every case.
- **The per-arm log directory is also a shared read surface**, disclosed by T16 Arm A's round-2 defender, which read one runner-produced artifact there that was not on its prescribed reading list. **Non-contaminating.** Everything in `_rerun2/T<NN>-arm{A,B}/` is derived from the debate itself — prompts, the two sides' messages, runner output, the debate id — and both seats already receive all of it through the ledger and `context.md`. **No ground truth lives there:** the sidecar, construction record, ranges file and sealed staging manifest are all in other directories. Like `repro/`, it is per-arm, so the channel is symmetric and A-vs-B is unaffected. Same disposition: recorded, layout left stable for the rest of the run.
- **The per-arm `repro/` archive is shared between that arm's critic and defender** — disclosed by T15 Arm A's round-1 defender, which listed its own output directory there and saw the critic's filenames. **Non-contaminating, and it does not bias A against B.** The two seats are the same task, the same arm and the same round; the defender already holds the critic's full claims and evidence through the ledger, which quotes those paths anyway, so filenames carry nothing the ledger does not. The defender rebuilt every experiment from prose and opened none of the scripts. Most importantly the channel is **symmetric across arms** — `_rerun2/T<NN>-arm{A,B}/repro/` are separate directories, and `arm_init` wipes the arm's log directory, so there is no cross-arm and no cross-task path. Left as-is for the rest of the run rather than re-scoped per seat: changing reviewer environment mid-run would introduce an inconsistency with T01–T14 for no contamination gain. Worth fixing in a future revision by giving each seat its own subdirectory.
- **The orchestrator hit the zsh word-splitting hazard it had been briefing reviewers about (2026-08-11).** Verifying that the `--overhead` addition left S3 untouched, it routed the command through a shell variable (`$S3`), which zsh delivered as a single argv entry; both captured files were empty and the diff **passed vacuously**. Caught by checking byte counts, then redone with the command written literally — S3 output confirmed byte-identical. Same failure mode that turned three reviewer crash probes into false negatives on T14. **Knowing about a hazard is not immunity to it.** General lesson worth carrying: a comparison that can pass on empty input needs a non-emptiness assertion, not just a diff.
- **Orchestrator read T14's sealed staging manifest (2026-08-11).** While reconstructing `armlib.sh` after a context restart, the orchestrator dumped the key/value structure of `_rerun2/_sealed/T14-STAGING.json` to work out how to write the tree-integrity check. That file is on the orchestrator's own do-not-read list (§4), and the dump disclosed T14's `sourcePath`. **Assessment: non-contaminating in effect but a real breach of the rule.** T14 was closed in both arms before the read, so no live debate could be influenced; a source path locates the reviewed slice, which reviewers see anyway, and does not disclose the defect; and the orchestrator does not grade. **Remedy:** `arm_clean_check` was written to compare the arm repo's diff against the *staged* repo's diff by hash and file count only, so it never opens a sealed manifest and never prints a path. No sealed manifest has been opened for T15 or later.
- **The runner's validation has now stopped three malformed messages at the boundary** — T03's stale-round refusal (previous batch), T13 Arm A's duplicate id, and T15 Arm A round 1, where the critic wrote `confidence` as the string `"high"` on all three findings instead of a number in [0,1] (it also carried three out-of-contract keys, which the validator does not police). In every case no invalid state entered the ledger and the phase was unchanged, so the debate resumed cleanly after correction. Worth reporting as evidence the neutral-runner design earns its cost. **Corrections are sent back to the same seat** — the orchestrator must never edit a reviewer's message itself, even for a purely mechanical field, and the correction instruction must say plainly that no claim, evidence, severity or support level may change.
- **The orchestrator was editorialising ledger state into reviewer spawn prompts, and a reviewer pushed back (2026-08-12).** Alongside "read your brief and execute it", spawn prompts had begun carrying the orchestrator's own summary of ledger state — e.g. *"one of your own earlier findings is on the ledger carrying a contested status"*, or which transition-table branch therefore mattered. T18 Arm B's closing defender recorded **an explicit disagreement with the round framing it was handed**, in its JSON message. The orchestrator reads control-plane only and therefore **cannot see what the disagreement was**; it is in the ledger for graders to read, and graders should read it.

  **Assessment: a real process defect, independent of who was right.** The summaries were (a) redundant — every brief points the seat at the ledger, which is canonical and which reviewers are told to read themselves and not to trust any summary of — and (b) a channel for the orchestrator to shape a reviewer's attention, which is precisely what R-001's isolation ruling identifies as the risk that survives fresh-context isolation: *"the contaminated orchestrator cannot transmit information through prompts, summaries, file modifications, environment variables, or selectively chosen inputs."* An orchestrator-authored gloss on which findings are contested is a summary and a form of selective emphasis, even when accurate. It also asymmetrically touches **Arm A and Arm B defenders but never Arm B's critic**, which is Codex and receives no orchestrator prompt at all.

  **Remedy, effective immediately:** spawn prompts are now **purely procedural** — read this brief path, execute it as written, the brief is authoritative. No ledger state, no round-specific emphasis, no naming of which transition-table branch applies. Everything a seat needs about the ledger it reads from the ledger; everything it needs about the round is in the brief the generator produced. Affected turns are recorded in the run record rather than voided: no summary supplied any information the ledger did not already contain, none touched defect content, and none altered the material under review.

- **A briefing asymmetry between the arms, disclosed 2026-08-12 — longstanding, not newly introduced.** Arm A's critic is a Claude subagent, so it necessarily receives a **harness brief** on top of the frozen critique prompt: where its seat is, where to write its message, the isolation rules, the scratch policy — and, as the run has gone on, **protocol guidance**: the ledger transition table, the output contract's field types, and the platform hazards (zsh word-splitting, `timeout(1)` absence, empty-input comparisons). **Arm B's critic is Codex, invoked directly by the runner, and receives none of it** — only the frozen `critique.md` plus provider-level `outputSchema` enforcement.

  So the arms differ in more than critic identity: **Arm A's critic gets more protocol instruction; Arm B's critic gets generation-time schema enforcement.** A-004 equalized the *validation* of the two critics' messages but not this. The two may partly offset, and neither direction is obviously dominant, but it is a treatment difference and the report must say so rather than claim the arms differ only by critic identity.

  **Concretely observed on T21 Arm B:** the Codex critic used `accept` on its own contested finding, which is terminal — the ledger records it `withdrawn`. The frozen `critique.md` *does* document this ("withdraw it (verdict 'accept'…); withdrawal means you abandon the claim"), so it was informed, and it may well have been deliberate. But Arm A's critic additionally receives an explicit warning that this is a trap and that `partial`-with-new-evidence is the only way to narrow a claim — and Arm A critics have now taken that route three times in this batch. **First `withdrawn` finding in the batch, and it is in the arm without the warning.**

  **Not changed mid-run.** Stripping Arm A's brief would break comparability with T01–T18; adding an equivalent to Arm B would mean injecting orchestrator-authored text into the frozen Codex path, which is a larger intervention than the problem. Recorded as a limitation, to be reported alongside the A-002 and A-002-E1 conditionalities and put to the operator before grading.

  > **Updated 2026-08-13 — the T21 observation did not hold up, and the correction belongs next to the claim.** T25 Arm A's critic used terminal `accept` on its own contested finding, producing the run's **second** `withdrawn` finding — in the arm that *does* receive the trap warning. The count is now one per arm across 23 tasks. **The treatment difference itself is unchanged and still must be reported**: Arm A's critic gets protocol instruction Arm B's does not, and Arm B's gets generation-time schema enforcement Arm A's does not. What is withdrawn is the suggestion that withdrawal behaviour evidences it. Two events split one-and-one across two arms is not a signal, and the T21 entry above should be read with this attached.

- **Brief the output contract's field types, not just its shape.** The T15 stumble was a reviewer encoding a confidence *level* where the schema wants a probability. Reviewer briefs should state that `confidence` is a number in [0,1] and that findings carry no keys beyond those the contract names.

---

## 7. Reviewer brief requirements (learned the hard way — keep all of these)

- Private per-seat scratch dir, opaque name, from `_seatmap/SEAT-MAP.json` (**kept outside `_scratch/`** so a listing cannot decode it). Seats are per-(task, arm, role), reused across rounds — critic and defender must stay separate per §1.
- **A directory listing is a read.** No reading/listing/globbing/`cd`-ing any other scratch or temp dir, and no listing its parent. Find an interpreter by querying candidate names, not by listing directories.
- Ledgers quote absolute paths into other seats' scratch — reviewers may see the strings but **must not follow them**; rebuild experiments from prose so agreement is corroboration, not an echo.
- The harness mirrors backgrounded command output to a system temp path — **kill and re-run** capturing locally rather than reading the mirror.
- Redirect `TMPDIR`, `PYTHONPYCACHEPREFIX`, pytest basetemp/cache, pip cache, `npm_config_cache`. Set the bytecode prefix **before the first import**.
- **Network is permitted for dependency installation only** — never to look anything up. Changelog/release-note fragments inside the checkout are off-limits.
- Node projects: `npm install` inside the checkout is forbidden; install to scratch + `NODE_PATH`, or use a scratch copy — **state which**, and print `require.resolve` at runtime.
- Final message: control-plane only, **no repository path, file name, directory name, or symbol name**, and an explicit statement about foreign scratch directories.
- Final-round briefs: warn that a new finding cannot be adjudicated and closes as unresolved risk; require deciding evidence for anything closing disputed.
- **Spawn prompts stay procedural.** The message that launches a seat says only: read this brief, execute it as written, it is authoritative. It must not summarise ledger state, name which findings are contested, flag which transition-table branch applies, or otherwise direct attention — the ledger is canonical and the seat reads it directly. An accurate orchestrator summary is still an orchestrator-authored channel, and R-001 names summaries and selectively chosen inputs as the risk that fresh-context isolation does not remove.
- **State the output contract's field TYPES, not just its shape** (added after A-004). Spell out that `evidence` is a single **string** — several pieces go into one string, not a list; that `confidence` is a **number in [0,1]**, not `"high"` and not `90`; that findings carry no key beyond the contract, so no `title`, `impact` or `suggested_fix`; and that the critic gets one correction before the step aborts. Tell them to parse their own file back and inspect the types before finishing.

---

## 8. Archive layout

```
_rerun2/T<NN>-staged/                  staged review repo
_rerun2/T<NN>-arm{A,B}-repo/           per-arm working copies
_rerun2/T<NN>-arm{A,B}/                control-plane logs, debate/, repro/, verdict.md
_rerun2/T07-armA-VOIDED/               voided pre-isolation run (preserved)
_rerun2/_sealed/T<NN>-STAGING.json     sealed manifests (locating; never read by orchestrator)
_rerun2/claude-usage-*.json            raw usage payloads
_rerun2/usage-roster-*.json            invocation → task/arm/role/round
_scrubbed/T<NN>/, _scrubbed/T<NN>-MANIFEST.json
T<NN>-artifact/{ARTIFACT, CONSTRUCTION-RECORD.md, T<NN>-RANGES.json}
_scratch/s<12-hex>/                    per-seat reviewer scratch (opaque)
_seatmap/SEAT-MAP.json                 seat → dir map (outside _scratch by design)
```

Source clones: `T01` (aiohttp), `_src-redis-py`, `_src-undici`, `_src-bullmq`, `_src-ioredis`, `_src-celery`, `_src-fastify`. Still needed: pino (T19r), sqlalchemy (T20r), fastapi (T23).

---

## 9. Batch records written so far

`reviews/PILOT-T01.md`, `RERUN-T01.md`, `RERUN-T01-v2.md`, `BATCH-T02-T06.md`, `BATCH-T07-T11.md`, `BATCH-T12-T16.md`, **`BATCH-T17-T20r.md`**, plus `BENCHMARK-AMENDMENTS.md` (index) and the numbered query/ruling pairs 018–026.

Next to write: the Q-001 and Q-003 remediation records, then `READY-TO-GRADE.md`.
