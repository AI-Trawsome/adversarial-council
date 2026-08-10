# Consult exchange 6 — 2026-08-10T01-03-27-642Z
Thread: 019fdf42-e16d-7b42-9581-8a34444f66d6
Document: CLAUDE-QUERY-018-isolation-and-independence.md

## Sent
Ruling requested on two dataset-composition questions found while running T07-T11 of the frozen benchmark. Same thread as consults 001-005 (A-001, A-002, A-002-E1, R-001, staging v2, A-003). Nothing is graded; 11 of 25 tasks have run. Q-001 concerns a reviewer-scratch isolation defect affecting T01-T06 that the R-001 attestations do not cover, with remedy options costed. Q-002 concerns a dependent task pair (T10/T11 share a source file). Each option carries my recommendation and its objections. Please rule on both, and state any conditions in the style of the A-001/A-002 condition lists so they can be recorded and checked off. If a conditional trigger cannot be made to bind credibly, say so and order the unconditional remedy instead.

## Reply
# Ruling on Q-001 and Q-002

## Q-001 — **OPTION 2b: rerun both arms of T01–T06**

Order the unconditional remedy. The conditional sensitivity trigger is not sufficient.

The defect creates a plausible direct answer channel from the first-running arm to the second-running arm on the primary metric. Exposure was probable, cannot be reconstructed from the archives, and could affect individual task outcomes even if its direction is balanced 3–3 across arms. Randomized direction protects against systematic favoritism in expectation; it does not make the six paired observations valid.

Option 3 would answer whether excluding T01–T06 changes the final threshold verdict. It would not establish that their recorded findings were uncontaminated. Agreement between the 25-task and 19-task analyses could occur despite contamination, particularly with coarse pass/fail gates. Therefore the proposed trigger cannot credibly authorize retaining the affected debates.

Option 2a is also rejected. Pairing a newly isolated arm with an arm run under the old scratch regime would preserve an avoidable within-pair environment asymmetry and conflict with the established R-001 treatment.

### Binding conditions

1. Rerun both arms of T01–T06 under the final per-seat scratch-isolation policy. Supersede all twelve existing scoring debates; preserve them under explicit `VOIDED` labels.
2. Follow the original preregistered arm order for each task.
3. Use fresh review-repository copies, fresh debate contexts, fresh Codex threads, fresh subagents, and fresh opaque scratch seats.
4. No participant may list, glob, traverse, or inspect a parent or sibling scratch directory. Redirect temporary files, bytecode, package caches, test caches, and virtual environments into its assigned seat.
5. Archive each participant’s control-plane declaration stating whether it encountered any foreign scratch path, filename, content, or directory listing.
6. Any participant that encounters a foreign scratch filename or content voids that arm immediately. If the encounter could expose task-specific information to the paired arm, rerun both arms.
7. Verify before each arm that its seat is empty and after each arm that no other seat was reachable through symlinks, shared caches, environment variables, or inherited working directories.
8. Do not copy reproduction files from the voided runs into the new seats.
9. Use the same finalized staging, prompts, cost capture, provider-rate policy, machine class, and harness configuration for both arms.
10. Record provider/model drift and dates, but do not use unavoidable provider-side drift as a reason to retain the known-defective runs.
11. Exclude voided-run usage from S3. Report it separately as benchmark remediation overhead, not scoring cost.
12. Before grading, audit T07–T11 against the final isolation policy. T07 is valid only if both retained arms used private seats and neither received intelligible foreign scratch information. A prohibited parent listing that exposed only opaque, undecodable seat names may be recorded as a protocol deviation without voiding; exposure to a descriptive filename or file content requires the applicable rerun rule above.

I do not accept the document’s categorical characterization of cross-task exposure as benign. A filename from another task can prime a bug mechanism, especially for tasks from the same repository, related components, or dependent commits. This does not expand the ordered rerun automatically beyond T01–T06, but the T07–T11 audit must check actual cross-task exposure rather than assuming it was harmless.

A 19-task sensitivity analysis may still be reported as a diagnostic, but it is not a substitute for remediation and must not determine whether the reruns enter the dataset.

---

## Q-002 — **OPTION C: retain the 25-task primary analysis and add a T11-dropped sensitivity analysis**

Keep both T10 and T11 in the frozen primary dataset. Their construction is valid, their contexts are isolated, and substitution was not preregistered for statistical dependence. Dropping or combining them in the primary analysis after execution would introduce a new dataset-composition rule.

Add a prespecified 24-task sensitivity analysis with T11 removed. Dropping the later task is a defensible mechanical rule because its buggy tree contains T10’s fix and it is therefore the observation downstream of the dependency. This avoids inventing a post-run “cluster detected” rule for S1.

### Binding conditions

1. The 25-task analysis remains the sole preregistered primary analysis.
2. Remove T11 from both arms in the sensitivity analysis; never remove it from only one metric or arm.
3. Recompute S1, S2, and S3 from the remaining 24 paired tasks. Do not merely subtract T11 from a displayed total.
4. Apply the frozen criterion thresholds literally unless BENCHMARK.md already defines an N-dependent formula. Do not rescale a threshold merely because the sensitivity dataset contains 24 tasks.
5. Report the primary and sensitivity results together, including numerators, denominators, medians, and pass/fail outcomes.
6. If they disagree, report the divergence as a robustness limitation. Do not select whichever analysis is more favorable, combine the pair retrospectively, or substitute an alternate task.
7. Grade findings under the frozen task-local rules. If T10 identifies the defect later fixed by T11, it may count as a verified additional finding for T10 if it independently satisfies metric 2, and as ground-truth detection for T11 if found there. Disclose the resulting cross-task duplication.
8. Before grading, conduct a contamination-safe dependency screen across all 25 tasks for:

   - identical source files or identity slices;
   - overlapping artifact ranges;
   - ancestor/descendant commit relationships in the same repository;
   - fixes already present in another task’s buggy tree;
   - direct follow-up or superseding fixes.

9. The auditor should expose only a dependency matrix and mechanical ordering facts before grading, not defect descriptions.
10. If additional dependent components are found, pause grading and submit one uniform component-level sensitivity rule for review. Do not improvise different handling pair by pair after outcomes are visible.

Option A is rejected because no defensible cluster-combination rule was preregistered, and different rules could change S1’s numerator. Option B alone is insufficient because the known dependence can be quantified without altering the primary analysis.