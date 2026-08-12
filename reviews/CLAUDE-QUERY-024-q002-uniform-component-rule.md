# Query 024 — Q-002 condition 10: one uniform component-level sensitivity rule

**From:** Claude (benchmark orchestrator)
**Date:** 2026-08-12
**Subject:** The condition-8 dependency screen has run and found dependent components beyond
T10/T11. Condition 10 requires one uniform component-level sensitivity rule, submitted for
review before grading, rather than pair-by-pair handling.
**Standing:** No task has been graded. No S1/S2/S3 has been computed over any affected task.
The screen exposes only a matrix and mechanical ordering facts, per condition 9 — no defect
descriptions were produced, requested, or seen.

---

## 1. What the screen found

300 unordered pairs (C(25,2)); see §5 for an arithmetic error of mine that the screen caught.

| screen | condition-8 category | pairs |
|---|---|---|
| 1 | identical source files / identity slices | **5** |
| 2 | overlapping artifact ranges | **3** |
| 3 | ancestor/descendant commits, same repo | **37** |
| 4 | fix already present in the other task's buggy tree | **1** *(37 before refinement — see §2)* |
| 5 | direct follow-up / superseding fix | **2 ordered, 0** in any artifact's source file |

Zero byte-identical artifacts and zero subset relations, including across differing paths.
Cross-repo: 263 pairs, **0** trip any screen — tested by commit-object existence with a
validated positive control, not assumed.

**The five dependent components**, every one of size 2, no task in two of them, and fifteen
tasks in none:

| component | screens tripped | earlier fix visible in the later task's review window? |
|---|---|---|
| **T10 \| T11** | 1, 2, 3, 4, 5 | **VISIBLE-IN-WINDOW** |
| T01 \| T17 | 1, 2, 3, 5 | NOT-VISIBLE |
| T07 \| T21 | 1, 2, 3 | NOT-VISIBLE |
| T09 \| T25 | 1, 3 | NOT-VISIBLE |
| T15 \| T18 | 1, 3 | NOT-VISIBLE |

**Exactly one pair in 300 is VISIBLE-IN-WINDOW, and it is the pair Q-002 already knew about.**
The other four share a source file at different commits, with the earlier fix falling outside
the later task's sliced ranges.

One orthogonality worth stating because it constrains any rule: **none of the 7 materially
adjacent pairs shares a source path, and none of the 5 same-path pairs is adjacent.** A rule
keyed on commit adjacency and a rule keyed on window-sharing partition the task set into
disjoint groups; they are not two views of the same thing.

---

## 2. A refinement we added, disclosed because it is ours and not the amendment's

Condition 8 names "ancestor/descendant commit relationships in the same repository" and
"fixes already present in another task's buggy tree". **Applied literally, both are nearly
vacuous:** the repositories have linear histories, so 37 of 37 same-repo pairs trip screen 3
trivially, and stage one of screen 4 also yields 37. A rule keyed on those literal readings
would declare most of the task set dependent and would not discriminate.

So the screen was instructed to resolve, for every screen-4 hit, whether the earlier fix
lands `INSIDE-ARTIFACT`, `SAME-FILE-OUTSIDE-ARTIFACT`, or `ELSEWHERE-IN-TREE`. Result:
**1 / 4 / 32.** Only `INSIDE-ARTIFACT` is a channel a reviewer could actually see.

**This refinement is the orchestrator's, not the amendment's**, and it does the decisive
work in the table above. It should be explicitly accepted or rejected rather than inherited.
If rejected, the dependent set is all 37 same-repo pairs and the rule below changes
completely.

Likewise "materially adjacent" is a stipulated threshold (≤100 commits **and** ≤60 days,
yielding 7 pairs), not a pre-registered one.

---

## 3. The rule we propose

> **Uniform component-level sensitivity rule.** Compute the dependency components over all
> 25 tasks using condition 8's five screens, with screen 4 resolved to `INSIDE-ARTIFACT` and
> screens 3 and 5 counted only where the relationship falls inside a task's artifact ranges.
> For **every** component of size ≥ 2 whose dependence is `VISIBLE-IN-WINDOW`, retain the
> member with the **earlier fix date** and drop every other member **from both arms**.
> Recompute S1, S2 and S3 from the surviving paired tasks. Apply the frozen thresholds
> literally; do not rescale for N. Report primary and sensitivity together with numerators,
> denominators, medians and pass/fail outcomes. Components that are dependent but
> `NOT-VISIBLE` are **reported in the dependency table and not dropped**.

Applied to the current screen this drops **T11 only**, giving the 24-task sensitivity
analysis that Q-002 conditions 2–5 already pre-registered. The rule is uniform, stated before
any outcome is visible, and mechanical: it names a criterion, not a task list.

**Why visibility is the criterion.** The harm Q-002 identified has two parts: that the tasks
are not independent observations, and that "if T11's defect predates T10's buggy SHA then
T10's reviewers could legitimately surface it". The second is a leakage channel into **S1**,
the primary metric, and it exists only where one task's ground truth is inside the other's
review window. The four `NOT-VISIBLE` components cannot carry it: the earlier fix is not in
the later reviewer's window at all.

**What we are not claiming.** The four `NOT-VISIBLE` components are not *fully* independent.
They share a file, its maintainers, and its general quality, so their difficulties plausibly
correlate. We are proposing that this residual correlation be **disclosed and not corrected
for**, on the ground that it is the same kind and roughly the same degree as the correlation
among the 32 same-repo, different-file pairs — and a rule that dropped it would have to drop
those too, taking the analysis well below any useful N.

---

## 4. The alternative we rejected, so it can be overridden

> **Same-source-path rule.** Drop all but the earliest member of every component sharing a
> source path, visible or not. This drops **T11, T17, T21, T25 and T18** — five of 25,
> leaving **N = 20**.

It is defensible: same-file adjacency is exactly the screen Appendix A's pre-freeze checks
missed, and a bright line at "same file" needs no visibility judgment and no refinement of
ours. We rejected it because it costs 20% of the task set to correct a channel the screen
shows is not open in four of the five cases, and because at N=20 the frozen S1 threshold
(a ≥20% relative margin on a count) becomes very coarse.

**We would rather be told to use this one than have chosen it ourselves after seeing
outcomes** — which is precisely why it is here, before grading, with no results computed.

If it is preferred, we ask that "earliest member" be confirmed as the retention rule, since
the alternative (retain the *later*, whose tree contains the earlier fix as ordinary code)
would systematically retain the harder-to-defend member.

---

## 5. Errors and limits, disclosed

**Our error, caught by the screen.** The brief stated 325 pairs. C(25,2) = **300**. The screen
reported the discrepancy rather than adopting the number it was given.

**The earlier matrix was wrong, twice.** A cross-task matrix produced as a by-product of the
T17–T20r contamination audit was sealed into the screen's seat and opened only after the
screen had frozen and hashed its own independent results — both snapshots retained, so the
independence can be checked rather than trusted. On reconciliation:

- It **missed one range-overlap pair entirely and understated another by roughly 4×.** Its
  three entries are exactly what a naive numeric intersection of range sets produces. The
  screen verified that **no** same-path pair has a byte-identical file between its two buggy
  SHAs, so naive intersection is invalid for all of them; its content-aligned figures agree
  exactly in both mapping directions.
- Its ancestry list is a strict subset (20 of 37, no false positives) with no
  INSIDE/OUTSIDE/ELSEWHERE refinement, so a rule keyed on it would have treated 32
  non-dependencies as dependent.

The earlier matrix found nothing the screen lacks. **We report this because the earlier
matrix's numbers were already recorded in our run state**, and anything downstream of them
must be re-derived from the screen instead.

**What the screen could not determine:**

1. **Semantic dependence** — excluded by condition 9, which forbids defect descriptions. So
   "dependent" here means structurally dependent, never semantically.
2. **Semantic supersession**, which no diff test can see. This bears directly on the one
   visible pair: its two fixes are 56 lines apart in the same file and the same reported
   section yet trip no strict follow-up detector, and the screen declined to decide whether
   that is a "follow-up". Under our proposed rule the pair is dropped anyway, so the
   ambiguity is not load-bearing — but under a different rule it might be.
3. All overlap figures are **lower bounds**; per-pair non-surviving-line counts are recorded.
4. Only **pairwise** relations were screened. No transitive path was searched. With all five
   components at size 2 and no task in two components, transitivity cannot currently change
   the partition, but that is a property of this result, not a proof.
5. **Visibility is defined solely as "inside the artifact ranges."** What reviewers could
   actually reach in the scrubbed checkout was not verified. Reviewers do receive a full
   scrubbed tree, so a determined reviewer can read the whole file, not only the window —
   we flag this as the weakest joint in our proposed criterion.
6. **The four alternates were not screened, and one sits at commit distance zero from a
   primary task's fix.** If any alternate is ever substituted in, this screen must be re-run
   before grading.

---

## 6. Questions

1. **Approve the proposed visibility-keyed rule**, or direct the same-source-path rule in §4,
   or specify another?
2. **Is the `INSIDE-ARTIFACT` refinement of screens 3–5 accepted?** It is ours, and it does
   the decisive work. If rejected, the dependent set becomes all 37 same-repo pairs.
3. Limit 5 above: reviewers receive the full scrubbed file, not only the sliced window. Does
   visibility therefore need to be defined at **file** scope rather than **range** scope? That
   change alone would move T01/T17, T07/T21, T09/T25 and T15/T18 into the visible set and make
   our rule and the §4 alternative identical.
4. Does the unresolved semantic-supersession question in limit 2 need settling before grading,
   given that the pair it concerns is dropped under both candidate rules?
