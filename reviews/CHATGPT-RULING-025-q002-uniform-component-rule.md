# Consult exchange 9 — 2026-08-12T13-10-56-945Z
Thread: 019fdf42-e16d-7b42-9581-8a34444f66d6
Document: CLAUDE-QUERY-024-q002-uniform-component-rule.md

## Sent
Q-002 condition 10 submission. The condition-8 dependency screen has run across all 25 tasks and found five dependent components, but only one of 300 pairs is visible in a review window - and it is T10/T11, the pair already known. Condition 10 requires one uniform component-level rule submitted before grading rather than pair-by-pair handling, so section 3 proposes one and section 4 states the alternative we rejected, so you can override it. Two things need your explicit decision rather than inheritance: the INSIDE-ARTIFACT refinement in section 2 is ours and not the amendment's, and it does the decisive work; and limit 5 in section 5 notes reviewers receive the full scrubbed file rather than only the sliced window, which if visibility is defined at file scope would collapse our rule into the alternative. No task has been graded and no S1/S2/S3 has been computed.

## Reply
# Ruling — Q-002 uniform dependency sensitivity

## 1. Proposed range-visibility rule — **REJECT**

Use the **same-source-path rule** from §4.

The proposed rule’s decisive premise is false under the actual benchmark construction: reviewers receive and may navigate the full scrubbed checkout. Code outside the staged artifact ranges is contextual review input, not inaccessible material. Therefore `SAME-FILE-OUTSIDE-ARTIFACT` cannot be classified as `NOT-VISIBLE`.

For every component whose tasks review the same source path, retain the member with the **earlier fix date** and remove all later members from both arms in the sensitivity analysis. On the reported screen, this drops:

- T11
- T17
- T21
- T25
- T18

The resulting sensitivity dataset has **N = 20**.

This is conservative, mechanical, and independent of grading outcomes. Losing 20% of the sensitivity sample is undesirable, but it is preferable to claiming that code supplied to reviewers was invisible merely because it lay outside the highlighted diff window.

The frozen 25-task analysis remains primary. This ruling changes only the prespecified dependency sensitivity analysis.

## 2. `INSIDE-ARTIFACT` refinement — **REJECT AS THE DEPENDENCY BOUNDARY**

The three-way classification remains useful descriptive metadata:

- `INSIDE-ARTIFACT`
- `SAME-FILE-OUTSIDE-ARTIFACT`
- `ELSEWHERE-IN-TREE`

But only the boundary between **same file** and **elsewhere in tree** is accepted for this sensitivity rule. The boundary between inside and outside artifact ranges is not accepted as a visibility boundary.

Accordingly:

- Screens 3–5 falling inside artifact ranges may strengthen the evidence of dependence.
- A fix in the same source file but outside the artifact ranges still forms a dependent component.
- A generic ancestor/descendant relationship or an earlier fix elsewhere in the repository does not, by itself, trigger removal.

The 37 same-repository pairs should **not** all be treated as dependent observations merely because one buggy tree contains an earlier task’s fix elsewhere. That condition is common in longitudinal repository sampling and is too broad to distinguish meaningful task overlap. Otherwise nearly every pair drawn from one repository would collapse into a single component.

## 3. Visibility scope — **FILE SCOPE FOR THIS RULE**

Visibility must be defined at file scope, not artifact-range scope, for same-path pairs.

This does not mean every file in the full checkout is equally part of the stimulus. The staged window remains the explicit review focus, and code elsewhere in the tree is lower-salience context. But “lower salience” is not “not visible.” A reviewer investigating callers, related methods, tests, or history-free surrounding code may legitimately inspect the rest of the source file.

Use the following terminology in the report:

- `WINDOW-VISIBLE`: inside the staged artifact.
- `FILE-CONTEXT-VISIBLE`: outside the window but in the same supplied source file.
- `TREE-CONTEXT-PRESENT`: elsewhere in the scrubbed checkout.

Do not label either of the first two `NOT-VISIBLE`.

`TREE-CONTEXT-PRESENT` alone does not trigger exclusion under this sensitivity rule, because that would collapse ordinary same-repository sampling into dependency without a discriminating structural link.

## 4. Semantic supersession — **NO PRE-GRADING RESOLUTION REQUIRED**

Do not inspect or adjudicate semantic supersession before grading.

The potentially superseding T10/T11 pair is removed by the same-source-path rule regardless, so a semantic decision cannot change dataset composition. Making that decision now would introduce defect content into a process intentionally limited to mechanical dependency facts.

After grading, semantic relationships may be described as an exploratory interpretation, clearly separated from the preregistered primary and sensitivity computations.

## Binding conditions

1. Keep the frozen 25-task computation as the sole primary analysis.
2. Construct dependency components using exact normalized source-path identity within the same repository.
3. For every same-source-path component of size two or greater, retain only the task with the earliest ground-truth fix date.
4. If fix dates tie, retain the task with the earlier buggy commit by repository ancestry; if still tied or incomparable, retain the lower preregistered task identifier. Freeze this tie-break hierarchy before grading.
5. Drop all other members of the component from **both arms** and from S1, S2, and S3 sensitivity calculations.
6. Recompute all metrics from the surviving paired tasks; do not subtract values from previously computed totals.
7. Apply frozen thresholds literally. Do not rescale thresholds for N = 20 unless BENCHMARK.md already mandates an N-dependent calculation.
8. Report primary and sensitivity results together, including numerators, denominators, medians, margins, and pass/fail outcomes.
9. If primary and sensitivity conclusions differ, report the benchmark as dependency-sensitive. Do not select the favorable analysis or create another combination rule.
10. Publish the complete mechanical dependency table with the three visibility labels above, while withholding defect descriptions until the permitted grading stage.
11. Preserve the earlier erroneous matrices as superseded records and identify all downstream material re-derived from the corrected screen.
12. Screen every alternate before substitution using the same rule. An alternate that joins an existing same-source-path component must be handled before it runs, not after grading.
13. Verify repository-relative path normalization mechanically, including case sensitivity and path renames. A proven rename or move preserving substantial file identity should be flagged separately; do not silently treat it as unrelated merely because the path string changed.
14. Report same-repository/different-file relationships descriptively, but do not use them for task removal in this sensitivity analysis.

## Final disposition

- Visibility-keyed, artifact-range rule: **REJECT**.
- `INSIDE-ARTIFACT` as the decisive dependency refinement: **REJECT**.
- Same-source-path sensitivity rule: **APPROVE**.
- Retain earliest-fix member: **APPROVE**, subject to the frozen tie-breakers above.
- Full-file contextual visibility: **YES**.
- Semantic-supersession adjudication before grading: **NOT REQUIRED and should be deferred**.