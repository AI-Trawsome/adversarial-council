# BENCHMARK-REPORT.md — final results

**Status: complete and adjudicated.** All 25 tasks ran in both arms under the final isolation policy; 50 debates were graded independently by both models (100 grader runs); the operator resolved every scoring ruling and completed the blind ranking. This report is the pre-registered §5.5 publication.

**Date:** 2026-08-27 · **Spec:** `BENCHMARK.md` sha256 `72d09391d09a91db1083420b293968c8c5c87d3ee3ead92ad0af00734557562f` (unmodified throughout) · **Plugin:** `f976990`

---

## 1. Verdict

| criterion | requirement | result | |
|---|---|---|---|
| **S1** ground-truth detection | Arm B exceeds Arm A by **≥ 20% relative** | Arm A **14**, Arm B **9** — B is **35.7% below** A | **FAIL** |
| **S2** false-positive rate | Arm B exceeds Arm A by **≤ 5 pp** | **0.00%** vs **0.00%** — delta **0.00 pp** | **PASS** |
| **S3** cost | Arm B median ≤ **3×** Arm A | median **0.28×** | **PASS** |

**S1 fails, and it fails in the opposite direction to the hypothesis.** The council arm did not merely fail to beat self-critique by the required margin — it detected *fewer* ground-truth defects, 9 against 14.

### The pre-registered interpretation applies as written

> *"S1 fails → adopt ChatGPT's stated fallback: simplify the architecture; the council does not proceed to Solve/Challenge modes; self-critique mode ships instead."*

That is the outcome. It was fixed in advance, and nothing in the data gives grounds to reopen it.

**S2 passes vacuously and should not be read as reassurance.** Both arms recorded **zero** false positives across 231 findings. That is not evidence that the council suppresses noise; it is evidence that the strict verification bar — a failing test, a demonstrable repro, or human confirmation, with model attestation explicitly excluded — was met by essentially everything that survived to close in *both* arms. S2 was designed to catch "extra findings that are noise dressed as rigor." It caught nothing because there was almost no unverified noise to catch, in either arm.

### The critic-only reading is worse, and it locates the problem

Under R4 the operator ruled debate-level counting primary. The secondary is stark:

| | debate-level | critic-only |
|---|---|---|
| Arm A | 14 | **14** |
| Arm B | 9 | **4** |

**All five of Arm B's defender-assisted detections are in Arm B; Arm A has none.** Arm B's Codex critic found 4 of the 25 ground truths on its own. The other 5 came from the Claude defender — the component both arms share. On the metric that isolates the independent variable, the council critic contributed less than a third of what the self-critique critic did.

## 2. Per-task results

`GT` = ground truth detected · `VA` = verified additional (shown as *graderA/graderB* where they differ; §4 designates this reported-not-gating) · `FP` = false positives · cost = modeled B/A ratio.

| task | GT A | GT B | B via defender | VA A | VA B | FP A | FP B | B/A cost |
|---|---|---|---|---|---|---|---|---|
| T01 | **Y** | n | — | 4 | 3 | 0 | 0 | 0.13x |
| T02 | **Y** | n | — | 9 | 7 | 0 | 0 | 0.27x |
| T03 | **Y** | **Y** | **yes** | 8 | 5 | 0 | 0 | 0.42x |
| T04 | n | n | — | 6/5 | 2 | 0 | 0 | 0.23x |
| T05 | n | n | — | 4 | 1 | 0 | 0 | 0.61x |
| T06 | n | n | — | 8 | 4 | 0 | 0 | 0.28x |
| T07 | n | n | — | 3 | 3 | 0 | 0 | 1.11x |
| T08 | n | n | — | 4 | 1 | 0 | 0 | 0.28x |
| T09 | n | n | — | 9 | 4/5 | 0 | 0 | 0.27x |
| T10 | **Y** | n | — | 7 | 1 | 0 | 0 | 0.08x |
| T11 | **Y** | **Y** | **yes** | 6 | 2 | 0 | 0 | 0.28x |
| T12 | **Y** | **Y** | — | 8 | 5 | 0 | 0 | 0.31x |
| T13 | n | n | — | 6 | 1 | 0 | 0 | 0.33x |
| T14 | n | n | — | 4 | 4 | 0 | 0 | 0.65x |
| T15 | n | n | — | 2 | 2 | 0 | 0 | 0.72x |
| T16 | n | n | — | 5 | 3 | 0 | 0 | 0.12x |
| T17 | **Y** | n | — | 6 | 2 | 0 | 0 | 0.09x |
| T18 | **Y** | **Y** | — | 3 | 4 | 0 | 0 | 0.79x |
| T19r | **Y** | **Y** | — | 5 | 4 | 0 | 0 | 0.24x |
| T20r | **Y** | **Y** | — | 4/3 | 0 | 0 | 0 | 0.29x |
| T21 | **Y** | n | — | 3 | 1 | 0 | 0 | 0.18x |
| T22 | **Y** | **Y** | **yes** | 6/3 | 2 | 0 | 0 | 0.25x |
| T23 | **Y** | **Y** | **yes** | 4 | 2 | 0 | 0 | 0.37x |
| T24 | n | n | — | 6 | 3 | 0 | 0 | 0.21x |
| T25 | **Y** | **Y** | **yes** | 4 | 2 | 0 | 0 | 0.34x |
| **total** | **14** | **9** | **5** | 134/129 | 68/69 | **0** | **0** | median **0.28x** |

**Detections.** Arm A: T01, T02, T03, T10, T11, T12, T17, T18, T19r, T20r, T21, T22, T23, T25. Arm B: T03, T11, T12, T18, T19r, T20r, T22, T23, T25 — of which **T03, T11, T22, T23, T25 rest solely on a defender-claimed finding.**

Every task Arm B detected, Arm A also detected. There is no task where the council found the defect and self-critique missed it.

---

## 3. Secondary: blind user preference (§3.6)

Ten tasks, selected from the frozen schedule's pre-registered entropy (bytes drawn 2026-08-07, before any task ran). Verdicts stripped of arm labels, cost, debate ids and paths; presentation order forced to 5/5 so position could not correlate with arm; key held outside `reviews/`.

**Result: Arm A preferred on 9 of 10 tasks; Arm B on 1.**

| task | preferred | task | preferred |
|---|---|---|---|
| T04 | A | T12 | A |
| T05 | A | T14 | A |
| T06 | **B** | T16 | A |
| T07 | A | T24 | A |
| T10 | A | T11 | A |

This is a secondary, non-gating signal from a single rater, and it is not independent of S1 — but it points the same way, and it was collected blind.

---

## 4. Adjudication rulings applied

The operator resolved seven systemic rulings and three blocking disputes. **These rulings were made after grading, which is what §3.1 provides for ("grading disagreements resolved by Michael") — but the reader should know the rules were settled with the grader outputs visible.** Each is recorded in `GRADING-DISPUTES.md` with both graders' full reasoning.

| ruling | decision | effect |
|---|---|---|
| **R1** trigger identity | Detection requires the maintainer's fix to **cure the scenario the finding describes** | T09 Arm A → not detected |
| **R2** attribution | Not scored — the staging makes every reviewed diff a **pure insertion** (zero deletions on all 25 tasks), so "introduced by the change" is undefined | pre-existing defects still count as verified |
| **R3** bundled false clauses | Finding granularity; core stands | separate tally reported below |
| **R4** defender-claimed detections | Debate-level primary, critic-only reported | see §1 |
| **R5** compound ground truth | Binary metric preserved, full credit for a genuine half | affected tasks disclosed below |
| **R6** threat-class | Mechanism governs | disclosed below |
| **R7** incidental repair | Stays verified-additional | — |
| **1.1 / 1.2 / 1.3** | resolved by R1 and R2 respectively | T20r R1-F5 → unverified-additional |

R1 and the grader brief compose into the run's operative detection test: **a finding detects the ground truth if it names the mechanism AND the maintainer's fix cures the scenario it describes.** Both halves required.

---

## 5. Disclosed limitations

Everything here is a reason to trust the headline less, or to scope it more narrowly. None of it was discovered by looking for excuses after the result; all of it is recorded in `RUN-STATE.md` with dates, most of it before grading began.

### 5.1 The arms differ by more than critic identity — the most important caveat

Arm A's critic is a Claude subagent and necessarily receives a **harness brief**: seat location, isolation rules, scratch policy, and — as the run went on — the ledger transition table, output-contract field types, and platform hazards. **Arm B's critic is Codex, invoked directly by the runner, and receives none of it**, only the frozen `critique.md` plus provider-level `outputSchema` enforcement.

A-004 equalised message *validation* between the arms. It did not equalise instruction. **S1 therefore compares "Claude critic with protocol coaching" against "Codex critic without it", not two critics on equal terms.** The direction of that bias favours Arm A on any metric sensitive to protocol fluency. It was recorded on 2026-08-12 and deliberately not changed mid-run, because stripping Arm A's brief would have broken comparability with T01–T18 and adding an equivalent to Arm B would have meant injecting orchestrator-authored text into the frozen Codex path.

A visible consequence: **Arm A critics wrote message `notes` in 65 of 66 messages; Arm B critics in 1 of 58.** Nothing instructs the Codex critic to use the field.

### 5.2 Reviewer self-reports are the one property not mechanically checked — and one was false

Tree integrity, context hashes, usage capture, seat attestation and schema validation are all verified mechanically. Participants' own accounts of their conduct are not. **T12's Arm A round-3 defender returned a detailed report stating its message was written, re-read and validated; the file did not exist.** The ledger was untouched, the seat was resumed procedurally, and its next message was valid. This does not impugn the isolation claims specifically — those are corroborated independently by the Q-003-E1 transcript audit — but reviewer self-reports are not evidence and are not treated as such here.

### 5.3 The misses are mostly inference failures, not search failures

On **five tasks the arm reached the exact ground-truth code and did not file it** — visible only in the message `notes`, not in any ledger:

- **T16** — the critic ran a probe that printed the ground-truth behaviour and filed it as a deliberate *negative* result, reading the code as working as its own comment documents. The comment is what the maintainer's fix changes.
- **T21** — the defender named the mechanism at the exact lines in rounds 1 *and* 2 and declined to file it both times, on unverified reachability. A grader then verified reachability using the maintainer's own trigger.
- **T17** — a finding names the changed line, and the archived repro output *prints the diagnostic key* that is the bug's fingerprint. The conclusion was never drawn.
- **T13** — a finding names the exact call the maintainer's commit exists to clean up, and argues it is harmless. The defender accepted that reasoning.
- **T01** — the correct mechanism was stated, then conceded away in round 2 on reasoning that rebuts a different reading than the maintainer's.

**This matters for the S1 fallback.** "Simplify the architecture" is the pre-registered response, and nothing here contradicts it — but these five misses would not have been fixed by more reviewers, more rounds, or more debate. The evidence was already in hand and the inference was not made. Any successor design that adds *search* capacity is treating the wrong failure.

### 5.4 A-005 isolation cost real fidelity, unevenly

Reviewers were given prepared dependency environments with the reviewed project deliberately absent. On **T04** the project's own test runner cannot load at all, because its default reporter statically imports the reviewed project by published name. On **T13** the isolation blocked the *deciding experiment* for one finding in one arm.

Against that, **four "not runnable" verdicts were overturned by reviewer initiative** (T22, T06, T13, T21) — two without building or installing anything. That initiative came from Arm B on T22 and Arm A on T06: **it is a reviewer property, not an arm property**, and two instances must not be read as a pattern in either direction.

Suite runnability is recorded **per reviewer, never per task**, because seats on the same tree routinely disagreed. One mechanism for that spread was finally identified on T21: a stale reusable temp base directory produces ~133 spurious errors when tests leave unreadable directories behind and the runner's cleanup fails.

### 5.5 A green suite proves nothing here

On **T14** the project's own suite runs clean — 2241 tests, 2237 passing, exit 0 — on a tree carrying four independently demonstrated defects *plus* the ground-truth leak nobody found. On **T19r** 334 tests pass while all six findings reproduce; the maintainer had to *add* the regression test with the fix. Suite results were used as evidence about the environment and never to credit a finding.

### 5.6 Grader blinding is partial

Graders were blinded to the arm — 1049 arm-labelled path occurrences neutralised, plus prose mentions and machine-generated filenames. **But the critic-`notes` channel is a near-perfect discriminator** (65/66 vs 1/58, §5.1), and the operator's instruction to read the notes governs over my optional blinding. The brief tells graders that notes distribution is not a permitted inference route to the arm; that instruction is the only control and it is not mechanically enforced.

### 5.7 Harness defects found during grading, all by graders

- A **staged tree had drifted** to contain the maintainer's fix (T23). Swept all 25 — isolated to T23; both arm repos still hashed the value recorded at close, so **no debate was affected**. Restored and re-graded.
- **Arm labels survived in machine-generated filenames** (a v8 compile-cache mangles absolute paths into names). One packet; purged, guard extended, both graders re-run. **The re-grade returned identical scores**, so the breach demonstrably moved nothing.
- One Codex grade came back **summary-only** with an empty findings array, because the runner installs the schema-enforced last message over anything richer. Caught by a coverage check and re-run.

Every defect in the grading harness was found by a grader rather than by the orchestrator, and only because the brief instructed them to verify rather than trust.

### 5.8 Metric-specific disclosures required by the rulings

- **R3 tally.** Across both graders, **58 finding-classifications across 21 tasks** were flagged as carrying a refuted or retracted clause over a demonstrated core. Under the finding-granularity ruling these count as verified; under sentence-granularity many would become false positives. **S2's 0.00% should be read with that number beside it.** This is the single figure most likely to change under a different ruling.
- **R5.** At least two tasks have compound ground truths — one commit fixing two distinct defects (T11), and one finding with two legs of which only one is the maintainer's (T23). Both scored as full detections under the preserved binary metric.
- **R6.** Two threat-class divergences, in opposite directions: T19r understated log forging as malformed output; T20r overstated a malformed-statement defect as SQL injection. Both counted as detections.

### 5.9 Scope and statistical limits

- **N = 25, single run, no repetitions.** There is no variance estimate and no confidence interval. A 14-vs-9 split on 25 paired trials is suggestive, not conclusive — though the critic-only 14-vs-4 is a wider margin.
- **Preference is n = 10, one rater**, not blinded to task identity, and not independent of S1.
- **Cost is modeled**, not billed: token counts against a frozen rate card. Arm B's Codex subscription marginal cost is **$0** and is reported, never gated.
- **B/A ratios are uninterpretable without round counts.** The two extremes of the run — T07 at 1.11× and T10 at 0.08× — are both one round against three, not efficiency effects.
- **Q-002-R sensitivity:** dropping the five dependent-component members leaves N = 20 and median B/A **0.28×** — unchanged.
- **A-002 and A-002-E1 conditionalities stand** as previously recorded.
- **Q-003-E1's structural limits stand:** the isolation audit tests *paths*, not content, and Arm B's Codex critic writes no participant transcript, so 21 turns sit outside that instrument.
- **Benchmark remediation overhead ≈ $465 modeled (Claude side), excluded from S3 by construction.** The archive is incomplete: three discarded attempts were never id-recorded, so that overhead is unquantified and is not presented as complete.

---

## 6. What this run does and does not establish

**Establishes.** Under this protocol, on these 25 tasks, an adversarial council of Codex-critic-plus-Claude-defender detected fewer known defects than Claude self-critique (9 vs 14; 4 vs 14 attributing to the critic seat), at lower cost (median 0.28×), with no measurable difference in false-positive rate (0 vs 0), and was less preferred by the operator in blind comparison (1 vs 9). **S1 fails; the pre-registered fallback applies.**

**Does not establish.** That Codex is a weaker critic than Claude in general — the two critics were not equally instructed (§5.1), and that asymmetry favours Arm A on exactly the axis S1 measures. Nor that the council architecture is worthless: it produced 68–69 verified additional findings, and both arms surfaced large numbers of genuine, reproducible defects the maintainers never fixed.

**The most useful finding is not S1 itself.** Both arms found real bugs prolifically and both walked past the target defect on most tasks — Arm A missed 11 of 25, Arm B 16 of 25. Five of those misses were failures to draw a conclusion from evidence already collected (§5.3). The bottleneck this run actually measured is inference on found evidence, not breadth of search — and neither more critics nor more rounds addresses it.

---

## 7. Artefacts

```
reviews/RUN-STATE.md              full narrative record, every task and disclosure
reviews/GRADING-DISPUTES.md       both graders' scores, the disputes, the rulings
reviews/BLIND-RANK.md             the blind preference set as presented
reviews/READY-TO-GRADE.md         pre-grading handover
reviews/AUDIT-*.md                environment sweep and foreign-seat audits
_rerun2/T<NN>-arm{A,B}/debate/    archived ledger, debate.json, context.md, verdict.md
_grading/<gid>/                   the 50 blinded grading packets
_grading-out/{claude,codex}/      100 grader outputs
_final-scores.json                the resolved per-task scores behind §2
_blind-rank-RESULT.json           unblinded preference result
_rerun2/s3-final.json             S3, N=25 · _rerun2/s3-sensitivity.json  N=20
```

`/Users/michaeltraw/Dev/council-bench` is not a git repository; only `reviews/` and `bench/` are committed.
