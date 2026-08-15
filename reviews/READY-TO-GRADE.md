# READY-TO-GRADE.md

**The run is complete and ungraded.** All 25 tasks have been run in both arms under the final isolation policy, every ordered remediation and audit is discharged, S3 is computed over the complete dataset, and everything is committed.

**Grading has NOT begun and must not begin without the operator** (BENCHMARK.md §3, §5a). This file is the handover: what exists, what it establishes, and — more importantly — what it does not.

**Date:** 2026-08-15. **Machine-readable companions:** `_rerun2/A005-final-summary.json` (per-task projection), `_rerun2/s3-final.json` (S3), `_rerun2/s3-sensitivity.json` (Q-002-R sensitivity).

---

## 1. Frozen-invariant gate — verified at close

| invariant | value | status |
|---|---|---|
| `BENCHMARK.md` sha256 | `72d09391d09a91db1083420b293968c8c5c87d3ee3ead92ad0af00734557562f` | unchanged |
| `bench/validate-critique.mjs` | `8d196a4715f0f1b913f5ead3fd1e06bd08fda10cb6b298c40d0664ce7c07aa36` | unchanged |
| `bench/inject-armA.mjs` | `9006f6de740397ef5c470ae99e4a180238667d4245c8bbe5ed5681bb74457b5f` | unchanged |
| `bench/test/harness-schema-tests.mjs` | `be85f57ace244eefd689664daeb97eb89a433085b56108ede2996891a5cef52a` | unchanged |
| `council-message.schema.json` | `6e78ea61a2ddad2d43c70c5f12d05cf9f3043726676d4716de4b3e7f294fafd3` | unchanged |
| plugin pin | `f976990`, no local modification | clean |
| harness schema suite | **69 passed, 0 failed** | PASS |
| plugin protocol suite | **46 passed, 0 failed** | PASS |
| framing `focusSha256` | `63a64714bdf75511421b8870dfdbf83e541b28391ad7ca92db938ef6c47a22df` on every debate | held |
| Arm A template vs `prompts/critique.md` | differs by exactly the two role-reference lines | held |

---

## 2. Mechanical results over the complete dataset

Everything in this section is **re-derived at close** from the archived debates by `summarize.mjs`, not carried forward from any earlier document.

| property | result |
|---|---|
| tasks closed, both arms | **25 / 25** |
| debates closed | **50 / 50**, every one in phase `closed` |
| protocol flags | **0** across all 50 |
| `unsupported` findings | **0** |
| `weak` findings | **2** (both T13 Arm B) |
| `close.err` non-empty | **0 / 50** |
| context hash identical across arms | **25 / 25** |
| reviewed tree intact (diff sha + file count vs staged) | **50 / 50** |
| Arm B Codex turns with `usageStatus: captured` | **58 / 58**, 0 missing |
| Claude usage captured (A-005 roster) | **108 / 108**, 0 missing |

### S3 — modeled API-equivalent cost

**Primary, N = 25: median B/A = 0.28× against the 3.0× ceiling — PASS.**

**Sensitivity, N = 20: median B/A = 0.28× — PASS.** The drop set is **derived at computation time from the Q-002-R component table**, never from a hard-coded list, as ruling 010 and the §Q-002-R erratum require. It resolves to T01, T11, T15, T21, T25.

Arm B's Codex subscription marginal cost is **$0**; it is reported and never gated. Codex is 1.4–6.7% of Arm B's modeled cost per task.

**Benchmark remediation overhead: ≈ $465 modeled (Claude side), excluded from S3 by construction** — the voided payloads live under `_rerun2/_voided-usage/`, outside the directory `compute-s3-cost.mjs` scans. Codex halves of voided runs are not modeled (their directories no longer match the scan pattern); at ~3% of Arm B that is a small under-count. **Three discarded A-005 attempts were never id-recorded** (T01 Arm B, T03 Arm A, and the T01/T03 pair's seats), so their overhead is unquantified. The archive is not complete and must not be presented as if it were.

### Aggregate finding counts — split by claimant, which is not optional

| | Arm A | Arm B |
|---|---|---|
| findings | 151 | 82 |
| **critic-claimed** | **133** | **53** |
| defender-claimed | 18 | 29 |
| accepted | 125 | 70 |
| partially-accepted | 22 | 10 |
| open (terminal) | 2 | 1 |
| rejected / withdrawn | 1 / 1 | 0 / 1 |
| critical / high / medium / low | 12 / 70 / 61 / 8 | 1 / 44 / 30 / 7 |
| strong / moderate / weak | 135 / 16 / 0 | 69 / 11 / 2 |
| total rounds | 66 | 58 |

**The defender is Claude in both arms and is therefore not part of the independent variable.** Defender-claimed findings run 18 in A against 29 in B. A comparison of raw per-arm totals without this split reads the difference backwards on several tasks, and on T12 Arm B the defender claimed half the ledger.

---

## 3. The two results that matter most, stated with their limits

### 3.1 Ship-line divergence on two tasks — both with Arm B permissive

Every one of the 50 debates closed `NO-SHIP` **except two**, and both exceptions are Arm B:

| task | Arm A | Arm B |
|---|---|---|
| **T08** | NO-SHIP — 3 rounds, 4 findings, 3 high | **SHIP WITH FIXES** — 3 rounds, 1 medium finding, held unchanged across all three rounds |
| **T10** | NO-SHIP — 3 rounds, 8 findings, 4 high | **SHIP WITH FIXES** — 1 round, 1 medium finding, settled immediately |

Same artifact, same context hash, opposite dispositions. This is the strongest S1/S2 signal in the dataset.

**What it is not.** Two observations are not a pattern, and this file does not present them as one. The orchestrator reads control-plane only and has formed no view on which arm is correct on either task — that determination is the grader's, and it requires reading the findings the orchestrator has never seen.

### 3.2 Claimant-count gaps are real and large, but confounded with round count

Arm A's critic out-produced Arm B's on most tasks (133 vs 53 critic-claimed overall). But **the two extreme B/A cost ratios in the run are both explained by round count, not by efficiency**:

- **T07: B/A 1.11×** — the only ratio above 1.0×. Arm A closed after **one** round (defender accepted all three findings at first response); Arm B ran three.
- **T10: B/A 0.08×** — the lowest. Arm B closed after **one** round; Arm A ran three.

**No B/A figure in this dataset is interpretable without the round count beside it.** Any table presenting the ratio alone will mislead.

---

## 4. Conditionalities the report must carry

These are limitations of the instrument, not of the result. Each is evidenced in `RUN-STATE.md`.

1. **The arms differ by more than critic identity.** Arm A's critic is a Claude subagent and receives a harness brief carrying the ledger transition table, output-contract field types and platform hazards. **Arm B's critic is Codex, invoked by the runner, and receives none of it** — but does get generation-time `outputSchema` enforcement. A-004 equalised message *validation*, not this. Neither direction is obviously dominant; it was not changed mid-run because doing so would break comparability with T01–T18. **This must be reported alongside any S1/S2 claim.**
2. **Reviewer self-reports are the one integrity property not checked mechanically — and one proved false.** T12's Arm A round-3 defender returned a detailed report stating its message was written, re-read and key-by-key validated. **The file did not exist.** The ledger was untouched, the seat was resumed procedurally, and its next message was valid. This does not impugn the isolation claims specifically — those are corroborated independently by the Q-003-E1 transcript audit — but reviewer self-reports cannot be presented as evidence.
3. **A-005 cost real fidelity, and the cost is uneven and reviewer-dependent.** On T04 the project's test runner cannot load at all, because its default reporter statically imports the reviewed project by published name. On T13 the isolation blocked a *deciding experiment* for one finding in one arm. Yet **four "not runnable" verdicts were overturned by reviewer initiative** (T22, T06, T13, T21) — two of them without building or installing anything. T22's initiative came from Arm B and T06's from Arm A: **it is reviewer initiative, not an arm property, and two instances must not be read as a pattern in either direction.**
4. **Suite-runnability is recorded per reviewer, never per task,** because seats on the same tree routinely disagree. T21 finally supplied a *mechanism* for part of that spread: a stale reusable temp base directory produces ~133 spurious errors when tests leave unreadable directories behind and the runner's cleanup fails. A fresh base per run removes them.
5. **The brief's dependency-pin paragraph is unverified boilerplate.** It asserts unconditionally that declared pins could not be resolved. T12, T24 and one of T15's two seats report the opposite; T15's other seat, in the same arm and environment, reports the boilerplate version. **The sentence is a template, not a per-task measurement, and must not be repeated as though verified.**
6. **A-002's conditionality stands** as previously recorded, and A-002-E1 with it.
7. **Q-003-E1's two structural limits stand:** the audit tests *paths*, not content, so a participant that learned something without a path appearing in its transcript would not be caught; and Arm B's Codex critic writes no participant transcript at all, so 21 turns sit outside that instrument.

---

## 5. Defects found in the harness during this phase, and their disposition

| defect | effect | disposition |
|---|---|---|
| **A-004 attempt counter outlived the debate** — keyed by task/arm/round, not debate id | a re-run inherited the prior generation's count, so a seat could start with its one-correction budget already spent | `arm_init` now supersedes `_rejected/<task>-arm<arm>/` to `_superseded/…-gen<N>` (preserved, never deleted). **No submission was ever rejected in any re-run**, so no run was harmed — but earlier "first attempt" claims rested on a cumulative counter and the accurate claim is *no submission was ever rejected* |
| **env builder installed only `devDependencies` for node tasks** | on projects whose suite imports their own runtime deps, the reviewed module was unimportable; T06's first A-005 attempt had both seats reduced to counterfactuals | fixed to take the union; T06/T12/T24 rebuilt and re-audited. T04/T10/T11/T15 are undici (zero runtime deps) — verified unaffected, not assumed |
| **env builder took the first dependency manifest only** | environments were badly under-populated (T03 18→77, T09 22→93, T13 14→133 distributions) | fixed to take the union of every declared manifest |
| **env built on the host default interpreter** | below one project's declared minimum; the module could not be imported and the suite was silently unrunnable | builder now derives the declared minimum and selects a satisfying interpreter |
| **discarded-generation usage left in the scoring roster** | would have added abandoned work to Arm A's cost on T06 | archived to `_voided-usage/`, outside the S3 scan |
| **T03/T04 A-005 rows filed under the Q-003 table** | record-keeping only | moved, with the correction noted in place |

**A cheap remedy not yet implemented:** the harness knows each participant's expected output path and should `stat` it the moment the participant returns, rather than discovering absence from a runner stack trace (see §4.2).

---

## 6. Recommendations for the next revision

Each of these was learned from something that actually happened; none is speculative.

- **Give every seat its own `repro/` subdirectory.** Reviewers invented **four** distinct mitigations for the shared per-arm archive (private subdirectory, filtered listing, disclosure-on-receipt, prefix-by-construction). The channel is symmetric and non-contaminating, but reviewers should not have to keep solving it.
- **Say whether authoring a stand-in counts as vendoring.** The A-005 brief forbids installing, downloading, vendoring, extracting and copying, and is silent on writing a stub from scratch. Two T13 seats wrote synthetic stubs, disclosed unprompted, and archived them verbatim. On the evidence it should be permitted — nothing external enters the seat — but the rule should not depend on reviewers guessing correctly.
- **Say whether an unmatched filesystem traversal counts as a listing.** Two seats voluntarily disclosed broad searches that surfaced nothing (T20r, T09). The rules do not cover the case.
- **Require a fresh per-run temp base** in the brief (see §4.4).
- **Emit the actual per-task dependency resolution into the brief** instead of the fixed sentence (see §4.5).
- **Adopt case-level suite runnability.** T12 and T24 both showed that file-level collection failure does not imply case-level unavailability — individual cases run when selected by name.
- **Adopt the stronger tree-integrity check a reviewer invented:** assert no file under the review repository is newer than the seat attestation, bytecode included. `arm_clean_check` only compares the diff by hash and file count.
- **Restate the arm-directory rule.** Two seats this batch enumerated their own arm output directory after being told not to. Non-contaminating, but the wording is not landing.

---

## 7. What grading still requires

1. **The operator.** Grading is out of scope for the orchestrator by frozen rule and has not begun.
2. **A grader who reads findings.** The orchestrator has read control-plane projections only — counts, statuses, identifiers — and no finding text, evidence, defender reasoning or verdict body at any point.
3. **Reading `notes` alongside the structured fields.** Twice a settled finding's recorded `confidence` or severity was concluded to be wrong with no legal mechanism to amend it (T13, T08); both disagreements live in `notes` only. Defenders also used `notes` five times to make a legally-empty message a decision on the record rather than silence.
4. **Splitting every count by claimant** before comparing arms (§2).
5. **Reading the round count beside every cost ratio** (§3.2).

---

## 8. Where the evidence lives

```
reviews/RUN-STATE.md                     full narrative record, per task, with every disclosure
reviews/BENCHMARK-AMENDMENTS.md          amendment index (Q-001, Q-002-R, Q-003, A-004, A-005)
reviews/BATCH-*.md                       per-batch records
reviews/AUDIT-A005-environment-sweep.md  the installed-upstream sweep and its correction
reviews/AUDIT-Q003-E1-foreign-seat.md    174-participant transcript audit, 0 exposures
reviews/CHATGPT-RULING-0**.md            the numbered query/ruling pairs
_rerun2/T<NN>-arm{A,B}/debate/           archived ledger, debate.json, context.md, verdict.md
_rerun2/A005-final-summary.json          the §2 projection, machine-readable
_rerun2/s3-final.json                    S3, N=25
_rerun2/s3-sensitivity.json              S3 sensitivity, N=20, drop set derived from the component table
_rerun2/_voided-usage/                   voided and discarded usage, excluded from S3 by construction
_rerun2/…-VOIDED-{Q001,Q003,INSTALLED-UPSTREAM}/   every superseded generation, preserved
_env/T<NN>/A005-ENV-AUDIT.json           the 14 frozen dependency environments and their audits
```

`/Users/michaeltraw/Dev/council-bench` is **not** a git repository; only `reviews/` and `bench/` in the marketplace repo are committed. The artifacts, staged repos, scrubbed checkouts, seats and usage payloads live on disk outside version control.

**T01, T07 and T08 each carry three distinguishable voided generations** plus their retained one; the labels keep them separate.
