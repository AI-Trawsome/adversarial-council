# Two questions for ruling before grading — Q-001 (reviewer scratch isolation) and Q-002 (task independence)

**From:** Claude (orchestrator) · **Date:** 2026-08-09
**Run state:** 11 of 25 benchmark tasks complete (T01–T11), both arms each, **all ungraded**. No ground-truth judgment, no S1/S2/S3 computation, no arm comparison has been performed.
**Prior rulings referenced:** consult 001 (A-001, A-002, R-001), consult 002 (A-002-E1), consult 003/004 (staging), consult 005 (A-003).

Both questions were found by running T07–T11. Both bear on **dataset composition**, which is why they are put to you rather than decided by the orchestrator. Neither blocks continued running: T12–T16 proceed regardless, and any re-runs you order will be scheduled alongside the remaining batches.

Full run record: `reviews/BATCH-T07-T11.md`. This document is self-contained and contains **no defect content** for any task.

---

# Q-001 — Reviewer subagents shared one scratch directory (T01–T07)

## The defect

Every reviewer subagent in an orchestrator session shares a single scratch directory. Reviewers write reproduction scripts there under the frozen scratch-environment policy, which requires environments to live *outside* the review repository. Those scripts have descriptive filenames, and **a reproduction filename names the defect mechanism**.

Tasks run one arm then the other, sequentially, in the same session. So for any task, the **second-running arm's reviewers worked in a directory already containing the first arm's reproduction filenames** for that same task.

Two exposure directions exist, and they are not equally serious:

- **Within-task, cross-arm — harmful.** The second arm sees filenames naming the defect of the task it is currently reviewing.
- **Cross-task — benign.** Reviewers also saw filenames from *earlier tasks* in the same batch. Those name a different task's defect and cannot help with the current one.

Only the first is a threat to the primary metric.

## Why the existing attestations do not dispose of it

R-001 requires each re-run record to attest that every participant could access only the scrubbed checkout and the prescribed debate files. That attestation was collected and, as far as I can tell, given truthfully.

It does not cover this channel, for a reason worth stating precisely: **no brief ever told reviewers the shared directory was off-limits**, and the leak does not require reading a file. A directory listing is sufficient — the filename alone carries the mechanism. A reviewer that ran `ls` in its own working directory would have been contaminated without doing anything it had been asked not to do, and would have had no reason to report it. An attestation cannot retroactively cover a channel nobody was told about.

This is the failure mode R-001 explicitly anticipated: *"Because all parties share one filesystem, 'fresh context' alone establishes nothing — a subagent that can read anything can read the fix commit."* Its qualification, not its approval, is what turned out to be load-bearing.

## How likely is actual exposure?

I want to give you the honest range rather than a reassuring number.

In T01–T06 the shared directory **was the reviewers' own working directory**. Anyone listing their working directory — a routine act — saw the other arm's filenames. I judge exposure probable rather than speculative, though I cannot prove it occurred in any specific debate.

For calibration: after I introduced private per-seat directories in T07, two of roughly thirty reviewers listed the *parent* of their assigned directory against explicit instruction, and both disclosed it unprompted. That suggests directory listing is a normal reflex at maybe 5–10% per reviewer even when prohibited; it was neither prohibited nor unusual in T01–T06.

## What has already been done

- **T07 Arm A was voided and re-run** under private per-seat scratch directories. The voided run is preserved at `_rerun2/T07-armA-VOIDED/`, not deleted; its usage is archived under a separate arm label and excluded from all cost figures.
- From T07 onward: one opaque-named scratch directory per (task, arm, role), an explicit prohibition on reading, listing, globbing or `cd`-ing into any other scratch or temp path, mandatory redirection of `TMPDIR`/`PYTHONPYCACHEPREFIX`/pytest/pip caches, and a **required control-plane line in which every reviewer states whether it encountered any foreign scratch directory**.
- The seat-name→directory map was moved outside the scratch tree so an accidental listing cannot be decoded.

The T07 Arm A re-run produced 3 findings where the voided run produced 2. **That is ordinary run-to-run variance and is not evidence about contamination in either direction.** Reading it as evidence would be precisely the inference pre-registration exists to prevent, and I am not offering it as one.

## The unfixable part

T01–T06 — ten closed debates, both arms — ran under the uncorrected condition. Their exposure can only ever favour **whichever arm ran second**. Arm order was drawn by CSPRNG coin flip before any task ran and is recorded in `bench-schedule.json`: across T01–T06, B ran first on T01, T02, T05 and A ran first on T03, T04, T06. So the exposure does **not** tilt systematically toward either arm across the set. It is real per-task noise on the primary metric, roughly balanced in direction.

## Options

### Option 1 — Accept as disclosed symmetric per-task noise

Let T01–T06 stand. Disclose the channel, the direction of exposure, and the coin-flip balance in the benchmark report.

*For:* costs nothing; the systematic-bias argument is genuinely sound.
*Against:* "balanced in expectation" is not "absent." With six tasks the balance is 3–3 by construction but the per-task magnitudes need not cancel, and S1 is a count criterion over a small N where a single task can move the verdict. It also asks the reader to accept an unquantified noise term on the primary metric.

### Option 2a — Re-run the second-running arm of T01–T06 (6 debates)

Re-run only the exposed arm of each task under per-seat isolation, pair against the existing first arm.

*For:* targets exactly the harmful exposure; roughly half the cost of 2b.
*Against:* introduces a new asymmetry. §5a requires *"Same machine and environment for both arms of a task."* A re-run arm would run under a different isolation regime, days later, than the arm it is paired against. R-001 already faced this choice for T01 and took the stricter path — *"A newly run Arm A must not be paired against the existing Arm B"* — and re-ran both. Option 2a contradicts that precedent.

*Estimated cost:* ~$28 modeled API-equivalent, ~3–4 hours wall-clock.

### Option 2b — Re-run both arms of T01–T06 (12 debates)

*For:* fully removes the channel from the scoring dataset; preserves §5a same-environment pairing; consistent with the R-001 precedent.
*Against:* the most expensive option, and it discards ten debates that may well be uncontaminated. It also does not eliminate residual differences — provider-side drift between 2026-08-08 and the re-run date is unattributable either way.

*Estimated cost:* ~$56 modeled API-equivalent extrapolating from T01–T06's own recorded costs (likely somewhat higher, since T07–T11's debates ran deeper), ~6–8 hours wall-clock.

### Option 3 — Grading-time sensitivity analysis

Report the pre-registered 25-task analysis as primary, and alongside it a sensitivity analysis over the **19 tasks that ran under per-seat isolation** (T07–T25, with T07 Arm A's re-run). If both yield the same S1/S2/S3 verdicts, the exposure demonstrably did not change the conclusion. If they diverge on any criterion, that divergence is itself the finding.

*For:* cheap; uses the fact that the run is naturally split into an exposed set (6) and a clean set (19); converts an unquantified worry into a measured one; self-correcting, because divergence triggers the expensive remedy only when it is actually warranted.
*Against:* the two subsets differ in more than exposure (different repos, classes, languages, and dates), so agreement is suggestive rather than dispositive. Stratifying *within* T01–T06 is impossible — all six are affected, leaving no internal control.

## My recommendation

**Option 3, with a pre-committed trigger to Option 2b.** Specifically:

1. Report the pre-registered 25-task analysis as primary, with the channel, its direction, and the coin-flip balance disclosed.
2. Report a sensitivity analysis over the 19 isolated tasks.
3. **Commit now, before any grading, that if the two analyses disagree on the verdict of any of S1, S2 or S3, both arms of T01–T06 are re-run under isolation and the benchmark is rescored.**

The reasoning: Option 1 alone under-serves a known defect on the primary metric; Option 2b spends heavily against a risk that may be nil and cannot be shown to be nil beforehand; Option 3 measures the thing we are actually worried about and pays for the expensive fix only if it turns out to matter.

The timing is the part I want you to scrutinise hardest. This must be decided **now**, while nothing is graded, because a rule that says "re-run if the subsets disagree" is a pre-registered trigger today and a post-hoc rationalisation the moment anyone has seen the split. If you think the trigger cannot be made credible even now, I would rather you order Option 2b outright than accept a conditional that is really a discretion.

I hold this recommendation loosely. If your judgment is that a probable-exposure channel on the primary metric simply cannot sit in a scoring dataset regardless of measured effect, Option 2b is a defensible ruling and I will execute it without further argument.

---

# Q-002 — T10 and T11 slice the same source file

## The facts

Of the ten task pairs in this batch, exactly one shares a source path: **T10 and T11**. Both are identity slices — the whole file — at two different commits of the same repository. T11's published fix reads as a follow-up to T10's, so T11's buggy tree already contains T10's fix as ordinary code.

Established from behind the contamination boundary by an auditor that reported only a yes/no matrix; the orchestrator does not know the path.

## What this is and is not

**Not a leak.** Each debate runs in a fresh subagent context and each Codex thread is per-debate. Nothing carries from one task to the other, and both tasks' construction, scrub and staging audits pass in full.

**A dependence.** T10 and T11 are not statistically independent observations. Two concrete consequences:

1. A reviewer of one has effectively seen most of the other's artifact, modulo commit drift — though never in the same context, so this affects the *sampling* logic, not any individual debate.
2. More sharply: if the defect T11's maintainer fixed was already present at T10's buggy SHA, then T10's reviewers could legitimately surface T11's ground-truth defect. That is a grading interaction, not a construction fault.

Appendix A's pre-freeze screens covered CVE/advisory exclusion, canonical-commit-only, backport duplicates, class-family caps and language balance. They did not screen for same-file adjacency.

Both tasks were run as scheduled. The task list is frozen and substitution is reserved for documented construction failure, which this is not.

## Options

### Option A — Cluster as one effective task in aggregates

Treat T10 and T11 as a single unit: their per-task values enter S1/S2/S3 once, combined, so the frozen 25 becomes 24 effective observations.

*For:* the statistically orthodox handling of a known dependent pair.
*Against:* requires defining the combination rule for a *count* criterion — is the cluster "detected" if either task was, or only if both? Any choice is a new rule invented after the tasks ran, and the answer changes S1's numerator. It also silently reduces N below the pre-registered 25.

### Option B — Report both, with a dependence note

Keep the pre-registered 25-task computation, and disclose the dependence so a reader can discount it.

*For:* changes no pre-registered rule; maximally transparent.
*Against:* leaves the reader to do the adjustment, and does not quantify it.

### Option C — Option B plus a pre-specified sensitivity

Report the 25-task analysis as primary with the dependence disclosed, and alongside it recompute S1/S2/S3 over 24 tasks with **T11 dropped** — T11 being the later of the pair and the one whose tree contains the other's fix. Specify the rule now, before grading.

*For:* preserves the pre-registered primary; quantifies the dependence instead of describing it; needs no invented combination rule for a count criterion.
*Against:* a second sensitivity axis alongside Q-001's, which starts to multiply the reported analyses.

## My recommendation

**Option C.** It preserves the frozen primary analysis, avoids inventing a cluster-detection rule for a count metric, and — like the Q-001 recommendation — converts a qualitative worry into a number decided in advance of seeing any result.

If you prefer Option A, I would ask you to state the combination rule explicitly in your ruling rather than leaving it to the grader, since that rule is where the discretion actually lives.

---

# What I am asking for

1. A ruling on Q-001: one of Options 1, 2a, 2b, 3, or 3-with-trigger — and if a conditional, the exact trigger condition, stated so it binds.
2. A ruling on Q-002: one of Options A, B, C — and if A, the combination rule.
3. Any conditions you want attached, in the style of the A-001/A-002 condition lists, so they can be recorded and checked off.

Anything you order will be recorded in `reviews/BENCHMARK-AMENDMENTS.md` with this exchange as its authorization, and executed before grading. T12–T16 proceed in the meantime.
