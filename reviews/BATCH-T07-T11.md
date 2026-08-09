# BATCH T07–T11 — run record

**Date:** 2026-08-09 · **Status:** all ten debates run and closed; **ungraded**
**Configuration:** identical to `reviews/BATCH-T02-T06.md` §1 — staging v2, exclusion policy v2, frozen framing, plugin pinned `f976990`, protocol suite 46/0, `BENCHMARK.md` verified `72d09391…`, Codex CLI `0.147.0`.

Grading is deferred until all 25 tasks have run both arms, per BENCHMARK.md §5's run-all-then-grade order. **Nothing here is a result.** Ground-truth detection is the primary metric and has not been judged; no claim below should be read as one arm outperforming the other.

Two items in §6 need a ruling before grading. Neither blocks further running.

## 1. Task construction

| task | repo | buggy SHA | artifact lines | ranges | syntax check | slice |
|---|---|---|---|---|---|---|
| T07 | aiohttp | `dc85b4c41839` | 437 | 2 | `py_compile` PASS | sub-file |
| T08 | aiohttp | `7b0b01350ce8` | 371 | 1 | `py_compile` PASS | identity |
| T09 | redis-py | `e054f089652b` | 468 | 1 | `py_compile` PASS | sub-file |
| T10 | undici | `204740c3cdba` | 393 | 1 | `node --check` PASS | identity |
| T11 | undici | `57f50a278b86` | 471 | 1 | `node --check` PASS | identity |

All five verified before construction: the recorded buggy SHA is exactly the fix commit's parent in every case, and the fix dates match Appendix A. All five syntax checks were real, not substitutes — unlike T06, which had to disclose a TypeScript parser-API substitute.

**Identity slices.** Three of five artifacts are the whole source file: the enclosing module fit inside the 30–500 window without narrowing, so `artifactSha256 == sourceFileSha256`. Three separate constructors flagged this independently as something downstream might read as an anomaly. It is not one — T02 and T05 were the same shape — and it is the strongest available anti-leak property, since a slice that omits nothing carries no included-versus-omitted signal about where the defect sits. It does mean staging built an **empty synthetic base** three times, the exact condition that aborted T02 and T05 before `[].join("\n") + "\n"` was fixed to emit an empty file rather than one blank line. All three staged clean with `diffAddedLines == artifactContentLines`, so that repair holds at volume.

**Contamination sweep: 0 leaks across all five records.** This is a genuine negative, not a skipped sweep. One auditor read all five records in full, then ran targeted greps for leak signatures derived independently from the five fix commits — exact PR and issue identifiers, hunk line numbers from `git show --unified=0`, diffstat counts, the names of every other path each fix touched, and each fix subject's distinctive vocabulary — and finally enumerated every multi-digit number in each record and accounted for it against legitimate provenance. The previous batch's identical sweep found 8 leaks in 5 records; the tightened constructor brief appears to be why this one found none.

Three borderline passages were considered and deliberately left: the count of files each fix touched (explicitly permitted), the statement that exactly one touched path is non-test source, and, in two records, that an excluded sibling path sits under the repository's test directory. The last is a directory kind rather than a file name and narrows nothing; flagged here in case a stricter line is wanted next batch.

**Independent verification.** The auditor re-derived all ten sidecar and artifact properties per task from the source clones rather than trusting the constructors, and re-ran every syntax check itself on copies outside the artifact directories. **50 of 50 checks pass.** No sidecar was modified.

**Scrub + staging:** all five scrubbed checkouts PASS 26 checks with `--forbidden-sha` asserting the fix commit does not resolve inside them; all five staged artifacts PASS 16 checks.

| task | files exported | exclusions | scrub | staging | base commit |
|---|---|---|---|---|---|
| T07 | 440 | 1 | PASS 26/0 | PASS 16/0 | `571e5c023b95` |
| T08 | 459 | 4 | PASS 26/0 | PASS 16/0 | `61acae1868f2` |
| T09 | 384 | 0 | PASS 26/0 | PASS 16/0 | `1be34d01ac8e` |
| T10 | 762 | 2 | PASS 26/0 | PASS 16/0 | `4478f672fa25` |
| T11 | 795 | 2 | PASS 26/0 | PASS 16/0 | `26590eeeabdd` |

## 2. Arm inputs were identical, verified by hash

Both arms of each task initialized from separate copies of the same staged repo. Collected context hashed identically in every case, and the framing text carried in each debate's `focus` matched the frozen file (`63a64714…`) in all ten debates.

| task | `context.md` sha256 (both arms) |
|---|---|
| T07 | `b24a2fa5ae2796f9e0c02cc2b833f989fcc294ae28c66b0eee8623ff01d3c0fb` |
| T08 | `f83daecb81e50d718b7f57f1800d179f00933377954623662134c3ab51b36ba3` |
| T09 | `a753f1fd5fc097cfb73a08c5be8c1965af880ac3c48854834e2ef41e369b6284` |
| T10 | `6e82179453b1769ed331c1a760555ca913750203b954d422c5971f8d7632bdfc` |
| T11 | `f2af7b684478a483d9b94390b61ba0ca3c215cdecba72f2344a901213771dd0b` |

On T08 both arms' reviewers independently reported the same working-tree diff hash (`bb0a4cc7…`), a second confirmation of identical stimulus arrived at from inside the debates rather than from the harness.

## 3. Results — control-plane only

| task | arm | rounds | findings | claimants | severities | statuses | ship line |
|---|---|---|---|---|---|---|---|
| T07 | B | 3 | 1 | codex 1 | high 1 | accepted 1 | NO-SHIP |
| T07 | A | 3 | 5 | codex 5 | high 1, medium 3, low 1 | accepted 4, withdrawn 1 | SHIP WITH FIXES |
| T08 | A | 1 | 2 | codex 2 | high 1, medium 1 | accepted 2 | NO-SHIP |
| T08 | B | 2 | 1 | codex 1 | medium 1 | withdrawn 1 | CLEAN |
| T09 | B | 3 | 5 | codex 3, claude 2 | high 3, medium 1, low 1 | accepted 5 | NO-SHIP |
| T09 | A | 1 | 2 | codex 2 | high 1, medium 1 | accepted 2 | NO-SHIP |
| T10 | B | 2 | 2 | codex 2 | high 1, medium 1 | accepted 1, withdrawn 1 | SHIP WITH FIXES |
| T10 | A | 1 | 4 | codex 4 | critical 1, high 1, medium 2 | accepted 4 | NO-SHIP |
| T11 | A | 3 | 6 | codex 5, claude 1 | critical 1, high 4, medium 1 | accepted 4, withdrawn 2 | NO-SHIP |
| T11 | B | 2 | 3 | codex 2, claude 1 | high 2, medium 1 | accepted 2, withdrawn 1 | NO-SHIP |

**Zero protocol flags across all ten debates** — the sycophancy tripwire did not fire once. **Every finding in the batch carries support level `strong`**; none was mechanically downgraded to `unsupported`, and **nothing closed as `open`/unadjudicated**. Arm order followed the pre-recorded schedule in every case (T07 B-first, T08 A-first, T09 B-first, T10 B-first, T11 A-first).

The tripwire's non-firing is informative rather than vacuous: three debates closed with a 100% accept ratio (T07 Arm B round 3 at 1/1, T08 Arm A at 2/2, T10 Arm A at 4/4), above the 0.8 threshold, and each cleared the 240-character median-justification bar. The tripwire is discriminating between reasoned concession and capitulation, which is what it exists to do.

**Defender-claimed findings appeared for the first time in this run.** T09 Arm B (2) and T11 Arm B (1) and T11 Arm A (1) carry findings raised by the defender and subsequently adjudicated by the critic — all accepted. The protocol's bidirectional path had not been exercised in T01–T06.

**Two debates turned on executed counter-evidence.** In T10 Arm B the defender rejected a high-severity finding with a reproduction and contested its support level down to `unsupported`; the critic then withdrew it. In T11 Arm B the same pattern ran in both directions — the defender rejected the critic's finding and raised its own, and the critic withdrew its own and accepted the defender's.

**Reviewer conduct, recorded because grading will not see it.** Reviewers repeatedly re-implemented the opposing side's nominated experiments from their prose descriptions rather than executing the archived scripts, explicitly so their agreement would count as independent corroboration rather than an echo. Several reported measurements that cut against their own position and priced them in — including a T07 Arm A critic that recorded a negative result against its own new finding and lowered the severity because of it, and a T10 Arm A defender that ran an experiment the critic had marked as *inference rather than execution* and found it favoured the critic.

**Fidelity variable — upstream suite runnability.** Runnable for the code under review in all five tasks, which is a marked improvement over T06 last batch, where defenders could not build an environment at all. Two limits recorded rather than smoothed over: on T08 the accelerated C extension cannot be built in a scrubbed history-free checkout (a vendored submodule is absent and building would write into the review repository), so one leg of a nominated experiment rested on source reading for both sides; and on T09 integration tests requiring a live server were unavailable to either arm. Both limits apply identically to both arms, so the A-versus-B comparison is unaffected, but they bound absolute detection claims in the same way A-002 already requires disclosing.

## 4. Cost

S3 basis is frozen as **modeled API-equivalent dollars, computed per provider from `bench/rate-card-frozen.json`** (amendment A-003). Regenerate with `node bench/compute-s3-cost.mjs --runs _rerun2 --rates bench/rate-card-frozen.json`.

Claude usage is raw per-message payloads copied verbatim from the harness's per-subagent transcripts: **38 invocations, 38 captured, 0 missing.** Every Codex turn recorded `usageStatus: captured`; every Arm A round recorded `not-applicable`. No round recorded `missing`.

| task | Arm A | Arm B | of which Codex | B/A |
|---|---|---|---|---|
| T07 | $22.90 | $6.43 | $0.28 (4.4%) | 0.28× |
| T08 | $6.77 | $3.88 | $0.16 (4.2%) | 0.57× |
| T09 | $4.69 | $6.37 | $0.42 (6.5%) | **1.36×** |
| T10 | $4.99 | $3.18 | $0.23 (7.1%) | 0.64× |
| T11 | $16.28 | $3.72 | $0.20 (5.4%) | 0.23× |

**Median B/A across T01–T11: 0.64×**, against S3's 3.0× ceiling. **T09 is the first task in the run where Arm B costs more than Arm A** (1.36×) — Arm B ran three rounds and produced five findings there while Arm A settled in one round with two. That is a reminder that these ratios track how long each debate ran, not how efficient each critic is.

Codex remains 4.2%–7.1% of Arm B's modeled cost. These are **modeled API-equivalent** figures, not observed spend: Codex ran on a ChatGPT subscription whose marginal cash cost is $0, reported but deliberately not gated, per A-003.

**Wall-clock (§3 metric 5) — a measurement gap, closed.** The runner's `durationMs` measures only the Codex turn. Arm A's critic runs outside the runner via `COUNCIL_MOCK_CRITIQUE`, so its rounds record ~1 ms, and Arm B's defender time is not captured either. Comparing arms on the runner's own stats would be meaningless. The archived usage payloads carry per-message timestamps, so reviewer wall-clock is recoverable from committed artifacts; derived that way:

| task | Arm A reviewers | Arm B reviewers | Arm B Codex | Arm B total | B/A |
|---|---|---|---|---|---|
| T07 | 95.3m | 20.5m | 2.5m | 23.0m | 0.24× |
| T08 | 21.9m | 12.2m | 1.9m | 14.1m | 0.64× |
| T09 | 14.1m | 18.6m | 2.0m | 20.6m | 1.46× |
| T10 | 24.0m | 10.1m | 1.3m | 11.4m | 0.47× |
| T11 | 66.0m | 12.1m | 1.7m | 13.8m | 0.21× |

Median wall-clock B/A **0.47×**, and the ordering agrees with the dollar basis on all five tasks including T09's reversal. Shared overhead outside both arms: construction 19.5m, contamination audit 7.0m.

## 5. Process errors, recorded

**Orchestrator brief contradicted the frozen scratch policy.** Reviewer briefs said "no network access" flatly, while `bench/SCRATCH-ENV-POLICY.md` permits installing dependencies into a scratch virtualenv. A T07 Arm A critic noticed the conflict, resolved it correctly on its own (confining network use to installs), and disclosed the reasoning. The brief was corrected mid-batch to state the rule as the policy does. No reviewer used the network for anything else in any debate.

**Scratch granularity was initially too fine.** Per-round scratch directories meant a seat could not reach the environment it had built in an earlier round, forcing a rebuild over the network; T07 Arm A's round-3 critic spent most of a 35-minute round on it. Corrected to per-(task, arm, role) seats, which preserves isolation across arms and tasks and preserves BENCHMARK.md §1's separation of critic and defender, while letting a seat reuse its own environment. `_seatmap/SEAT-MAP.json` records the mapping.

**Two disclosed scratch-parent listings, both assessed as non-contaminating.** A T07 Arm A round-2 critic and a T08 Arm A defender each listed the parent of their scratch directory against instruction, and each disclosed it unprompted — one also recording it in its message's `notes` for the neutral runner. The first saw three directory names, all seats of its own arm and task; the second saw one. Directory names were purely structural at the time and carried no defect information. Response: names are now opaque 12-hex digests, `SEAT-MAP.json` was moved out of `_scratch/` so it cannot be used to decode them, and briefs now state that a directory listing *is* a read and that an interpreter should be located by querying candidate names rather than listing directories.

**Three scratch-adjacent channels found by reviewers, all disclosed rather than concealed.** Beyond the shared scratchpad in §6: ledgers quote absolute paths into other reviewers' scratch directories (reviewers may see the strings in allowlisted files but must not follow them, and several noted that rebuilding from description is what makes their agreement corroboration rather than an echo); and the harness mirrors backgrounded command output to a system temp path, which a T10 Arm A critic handled by killing the process and re-running with capture in its own directory. Both are now explicit in the briefs.

**Bytecode written into a checkout, caught and swept.** A T07 Arm A critic's first import wrote `__pycache__` into the review repository before it had set `PYTHONPYCACHEPREFIX`. It removed exactly those directories using `rm -rf` — no `git clean`, `checkout`, or `restore` — set the prefix for all later runs, and disclosed it. Bytecode is gitignored so the diff was never affected; verified zero strays afterwards. Briefs now tell reviewers to set the prefix *before* the first import.

**Every arm exited with its working tree and diff intact**, verified by hash against the sealed staging manifest in all ten debates.

## 6. Two items needing a ruling before grading

### 6.1 Shared scratch directory across reviewers (affects T01–T07)

**What was found.** Every reviewer subagent in a session shares one scratchpad directory. Reviewers write reproduction scripts there, and those filenames name the defect mechanism. T07 runs B-first, so Arm B's files were present, and visible to a bare `ls`, while Arm A's critic and defender worked. The prior session's scratchpad shows the same pattern across T01–T06.

**Why the attestations do not cover it.** Both T07 Arm A reviewers attested they did not read pre-existing material, and there is no reason to doubt them. But no brief had told them the shared directory was off-limits, and the leak does not require reading a file — the filenames alone carry it. A reviewer that listed its own working directory would have been contaminated without doing anything it had been asked not to do. This is precisely the hazard R-001 names: *"Because all parties share one filesystem, 'fresh context' alone establishes nothing."* The isolation controls covered conversation history and brief allowlists; they did not cover this.

**Action taken.** T07 Arm A was **voided and re-run** under private per-seat scratch directories with an explicit prohibition, a requirement to redirect `TMPDIR`/`PYTHONPYCACHEPREFIX`/pytest/pip caches, and a mandatory control-plane line in which every reviewer states whether it encountered any foreign scratch directory. The voided run is preserved at `_rerun2/T07-armA-VOIDED/` rather than deleted; its Claude usage is archived under arm label `voided-A` and is excluded from all cost figures. The re-run produced 3 findings where the voided run produced 2 — ordinary run-to-run variance, and **it is not evidence about contamination in either direction**; reading it as such is exactly the inference pre-registration exists to prevent.

**What needs a ruling.** T01–T06 ran under this condition, in both arms, across ten closed debates, and cannot be re-run as part of this batch. The exposure is directional — it can only favour whichever arm ran second — and arm order was coin-flipped per task, so it does not bias systematically toward A or B across the set. It remains real per-task noise on the primary metric. Options are to let T01–T06 stand with the exposure disclosed, to re-run them under the corrected regime, or to treat them as descriptive evidence only. That is a pre-registration decision, not the orchestrator's.

### 6.2 T10 and T11 slice the same source path

Confirmed from behind the contamination boundary: of the ten task pairs in this batch, exactly one shares a source path — **T10 and T11**, both identity slices of the same file at two different commits. T11's fix reads as a follow-up to T10's, so T11's buggy tree already contains T10's fix as ordinary code.

This does not leak: each debate runs in a fresh subagent context and each Codex thread is per-debate, so nothing carries from one task to the other. What it means is that **T10 and T11 are not statistically independent tasks**, and more sharply, if the defect T11 fixes was already present at T10's buggy SHA, T10's reviewers could legitimately surface T11's defect. Appendix A's pre-freeze screens covered CVEs, backport duplicates, and class-family caps, but not same-file adjacency.

Both were run as scheduled: the task list is frozen and substitution is reserved for documented construction failure, which this is not. The open question is whether the aggregate should treat them as one effective task, or report a sensitivity analysis with and without one of them.

## 7. Protocol observation: `accept` on your own contested finding withdraws it entirely

In T11 Arm A round 2 the critic intended a **scoped** concession — give up the sub-component the defender had rejected, keep the substance the defender had accepted. The runner does not express that. A claimant responding `accept` to its own contested finding means *"claimant abandons the finding"*, and both findings were recorded `withdrawn` in full.

The critic noticed and recorded it in its round-3 `notes`, once, without re-litigating and without refiling the abandoned claims under new ids — owning it as its error. The closing defender then independently checked the ledger history and **corrected the account**: the critic's note named one finding, but it is true of both, and both defects still reproduce against the current tree. Its conclusion, now in the ledger: *a reader should count six demonstrated defects, not four* — the claim, evidence, and the prior defender's acceptance text all survive in the ledger, so the substance is recoverable in place; it is the status field, and any count derived from it, that understates.

**This matters for grading.** T11 Arm A's verdict lists two findings under "Withdrawn by claimant" whose substance a defender had accepted. A grader reading the verdict alone would undercount; the ledger carries what is needed. Whether the runner should offer a narrowing verdict distinct from abandonment is a design question for after the run, not a mid-run change.

## 8. Archived artifacts

```
_rerun2/T0N-staged/                     staged review repo per task
_rerun2/T0N-arm{A,B}-repo/              per-arm working copies
_rerun2/T0N-arm{A,B}/                   control-plane logs, debate/, repro/, verdict.md
_rerun2/T07-armA-VOIDED/                voided pre-isolation Arm A run (see §6.1)
_rerun2/T07-armA-repo-VOIDED/           its working copy
_rerun2/_sealed/T0N-STAGING.json        sealed staging manifests (locating; unread by orchestrator)
_rerun2/claude-usage-T07-T11.json       raw Claude usage payloads, 38/38 captured
_rerun2/usage-roster-T07-T11.json       invocation → task/arm/role/round mapping
_scrubbed/T0N/, _scrubbed/T0N-MANIFEST.json
T0N-artifact/{ARTIFACT, CONSTRUCTION-RECORD.md, T0N-RANGES.json}
_scratch/s<12-hex>/                     per-seat reviewer scratch (opaque names)
_seatmap/SEAT-MAP.json                  seat → directory mapping (outside _scratch by design)
```

Debate ids: T07 `ee0049`/`987db4` (voided `130f4d`), T08 `d73188`/`58e308`, T09 `58c1dd`/`5f1fcf`, T10 `e0255c`/`db1fc0`, T11 `85ca9e`/`b79bea`, all prefixed `dbt-2026-08-09-`.

## 9. Harness change

`bench/control-plane.mjs` replaces the ad-hoc `jq` projection the orchestrator used to read live debates. It is a closed allowlist emitting only counts, statuses, and identifiers — never claim text, evidence, defender reasoning, or the verdict body — and it recomputes the ship line from statuses and severities rather than reading `verdict.md`, so the orchestrator never opens a file containing finding text. It includes `phase`, whose omission from the hand-written `jq` caused the T03 sequencing error recorded in `BATCH-T02-T06.md` §5. Validated against the closed T06 Arm B debate, where it reproduces that task's published row exactly and confirms `focusSha256` equals the frozen framing hash.

## 10. Chain of custody: a sidecar edit after construction

The constructor brief specified a shorter phrasing for the sidecar's descriptive `lineNumbering` key than `reviews/SPEC-STAGING-v2.md` declares canonical, so **all five** sidecars carried the off-spec value — a brief defect, not a per-task choice. The orchestrator harmonized all five to the spec string after the records were written, using a script that emitted only key counts and booleans so no sidecar content entered its context; the key set stayed at exactly nine and no other field was touched.

The auditor detected the edit from modification timestamps and flagged that two records then asserted a value their sidecar no longer held. Those two assertions were corrected and a uniform dated note was appended to all five records recording what happened, that each constructor's verification therefore ran against pre-harmonization bytes, and that the key participates in no hash and no range, count, or window computation, so no verified quantity changed. The edited records were re-swept for contamination (clean) and all 50 verification checks re-run (pass).

## 11. Status

**11 of 25 tasks complete** (T01–T11), both arms each, all ungraded. Remaining: T12–T18, T21–T25, T19r, T20r — 14 tasks.

Open before scoring:

1. **The T01–T06 shared-scratch exposure** (§6.1) — needs a ruling on whether those tasks stand, are re-run, or become descriptive only.
2. **T10/T11 task independence** (§6.2) — needs a ruling on aggregate treatment.
3. Everything else from `BATCH-T02-T06.md` §7 is closed: S3's cost basis is named and frozen (A-003), staging countersigned, usage persisted, scratch policy frozen, framing frozen.
