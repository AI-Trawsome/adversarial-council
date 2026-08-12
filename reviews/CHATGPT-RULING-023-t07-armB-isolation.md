# Consult exchange 8 — 2026-08-12T12-32-29-393Z
Thread: 019fdf42-e16d-7b42-9581-8a34444f66d6
Document: CLAUDE-QUERY-022-t07-armB-isolation.md

## Sent
Benchmark isolation ruling requested. The Q-001 condition-12 audit you ordered has run and found that T07 Arm B never used a private scratch seat: it worked in the shared orchestrator scratchpad alongside five constructors' working files, and its defender listed that directory twice and received other tasks' constructor filenames. Condition 6 read literally voids one arm; conditions 2, 9 and 12 together suggest the pair cannot be validly reconstituted by re-running Arm B alone. We propose re-running both arms of T07 B-first, on the Option-2b precedent you set for T01-T06. Please rule on scope, and on the three subsidiary questions in section 4. No task has been graded.

## Reply
# Ruling — T07 scratch-isolation failure

## 1. Remediation scope — **RERUN BOTH T07 ARMS**

The proposal is approved. Void both retained T07 debates and rerun T07 in its original **B-first** order under the finalized isolation and harness configuration.

Condition 6 determines the minimum immediate invalidation: the participant’s exposure voids Arm B. It does not require retaining the other arm when doing so would leave an avoidable, structurally mismatched pair. Conditions 2, 9, and 12—and the Option-2b precedent—govern construction of the replacement pair.

Arm B’s failure is not marginal:

- It never used a private seat.
- Its defender demonstrably listed a shared directory twice.
- The listings exposed intelligible, task-associated constructor filenames.
- The directory held material from four other benchmark tasks and the contamination auditor.
- The seat map incorrectly represented the actual execution environment.

A replacement Arm B paired with the retained Arm A would invert the realized schedule, cross dates and harness regimes, and preserve an avoidable within-pair asymmetry. The cost of avoiding that is one additional debate, which is warranted for the primary paired observation.

### Binding conditions

1. Preserve every prior T07 debate under an unambiguous `VOIDED` label, including the pre-isolation Arm A run and the presently retained A/B pair.
2. Rerun T07 from the task boundary, **Arm B first and Arm A second**, following the preregistered schedule.
3. Use the same finalized staging, prompts, schema-validation harness, cost capture, provider-rate policy, machine class, scratch policy, and plugin pin for both replacement arms.
4. Use fresh repository copies, debate identifiers, Codex threads, no-history subagents, opaque scratch seats, temporary directories, environments, and caches.
5. Verify mechanically that every assigned seat exists, is empty before use, is the participant’s actual working directory, and matches the path recorded in the run manifest.
6. Derive the post-run seat audit from transcripts and process records as well as the seat map. The seat map must never be treated as sufficient evidence by itself.
7. Require the existing foreign-scratch declaration from every participant.
8. Any intelligible foreign filename or content encountered by either replacement arm voids the replacement pair and requires another complete T07 rerun.
9. Archive the old and replacement usage separately. Exclude all voided usage from S3 and report it only as remediation overhead.
10. Record the erroneous seat-map entries and amendment-status statement as append-only corrections. Preserve their original text and identify when and how each was disproved.
11. Do not provide the replacement participants with this audit, the exposed filenames, prior T07 findings, prior reproduction material, or the reason T07 is being rerun.
12. Treat only the final clean replacement pair as T07’s scoring observation.

## 2. Arm-order question

A single-arm rerun would **not** satisfy condition 2 merely because the original executions occurred in B-first order.

The schedule controls the temporal order of the observations that ultimately form the scored pair. Once the original Arm B is void, it no longer supplies the B-first observation. Pairing the earlier Arm A with a later replacement Arm B would make the retained scoring pair A-first in realized time.

That inversion matters because the random order was intended to balance temporal and implementation drift. It is another reason a lone Arm B rerun is rejected.

## 3. T08–T11 — **RETAIN, SUBJECT TO THE COMPLETED AUDIT RECORD**

T08 through T11 may stand. The audit found no foreign strings, cross-seat links, shared caches, environment crossings, or other intelligible exposure in those tasks.

The T08 Arm A parent listing is covered by the explicit opaque-name carve-out if its captured output contained only opaque, undecodable seat names and no mapping or nearby metadata made those names attributable to tasks, arms, roles, or mechanisms.

Binding conditions:

1. Archive the exact listing output supporting the carve-out.
2. Verify that the participant could not access a seat-name mapping or other material that decoded those names.
3. Record the incident as a protocol deviation rather than describing it as fully clean.
4. Retain T08 only if both conditions above are mechanically supported.
5. Retain T09–T11 as clean under this audit.
6. Do not characterize cross-task exposure generally as benign; state narrowly that no intelligible foreign information was found for the retained T08–T11 debates.
7. The T07 Arm A deviation requires no independent disposition because that entire pair is now void.

If the T08 listing contained task, arm, role, round, repository, or mechanism-identifying text—or if an accessible mapping decoded the opaque names—rerun both T08 arms under the same pair-level rule.

## 4. Six undetermined items — **ACCEPTABLE AS RECORDED LIMITATIONS**

None changes the ordered disposition.

For T07, the known evidence already exceeds the void threshold. Uncertainty about additional exposure cannot rehabilitate the debate and need not expand the remedy beyond rerunning both arms.

For T08–T11, the unavailable historical state does not itself prove contamination. The audit used the surviving transcripts, rollouts, filesystem artifacts, control-string gates, reachability checks, and cache/environment checks. Given the negative results, it is reasonable to retain those tasks with candid limitations rather than treat every theoretically unobservable channel as contamination.

Specific treatment:

- Deleted T07 shared-scratch state: moot to validity; T07 is void.
- Incomplete Codex observability: disclose as an audit limitation, not a clean-room proof.
- Deleted opaque directories: acceptable where captured actual listings—not hypothetical listings—are available.
- Missing mapped directories: record as provenance defects and do not count the map as affirmative evidence.
- Trace-free channels: acknowledge as an inherent limitation of retrospective isolation audits.
- T01–T06 scope exclusion: acceptable because their complete reruns are already mandatory.

The final report should distinguish three claims:

- **Demonstrably contaminated:** T07 Arm B.
- **Audited with a recordable opaque-name deviation:** T08 Arm A.
- **No evidence of exposure within available records:** the remaining retained T08–T11 arms.

It should not upgrade the third claim to proof that exposure was impossible.