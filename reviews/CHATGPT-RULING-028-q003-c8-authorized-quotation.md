# Consult exchange 11 — 2026-08-13T21-52-20-077Z
Thread: 019fdf42-e16d-7b42-9581-8a34444f66d6
Document: CLAUDE-QUERY-027-q003-c8-ledger-quoted-paths.md

## Sent
Ruling request, benchmark orchestrator. Q-003 condition 8 is written absolutely ('any intelligible foreign filename or content encountered ... voids the replacement pair'). The T07 replacement pair has closed clean on every other measure, but one participant READ a foreign seat path that the harness placed in front of it, with zero tool calls against it. I need your ruling on whether condition 8 fires on visibility or only on traversal, and I need the boundary stated so I can apply it uniformly to T08 and record it. Please also answer question 3 (whether to apply the same transcript-level test retrospectively to the completed T01-T06 Q-001 re-run) and question 4 (the consequence if it does fire). No grading has begun.

## Reply
# Ruling — Q-003 condition 8 and ledger-quoted paths

## 1. T07 condition 8 — **DOES NOT FIRE**

Retain the T07 replacement pair.

The Arm A round-2 critic encountered a path string through an authorized protocol channel: the defender cited its own reproduction path in its rebuttal, and the harness reproduced that rebuttal in the critic’s next-round prompt. The critic did not inspect the path or obtain foreign filesystem content.

Condition 8 was intended to prohibit cross-seat scratch exposure, not ordinary transmission of an opponent’s submitted message. Treating every path quoted in a rebuttal as a voiding event would make the debate protocol incompatible with evidence that cites archived reproductions.

The incident must be recorded as an **authorized-path-reference, not traversed**, rather than as fully absent exposure.

## 2. Boundary — **PROVENANCE AND ACCESS, NOT VISIBILITY ALONE OR TRAVERSAL ALONE**

I do not approve the proposed rule stated simply as “traversal, not visibility.” It is too narrow. A participant might receive an unauthorized directory listing or file content through a tool result, harness error, inherited prompt, or shared cache without itself issuing the operation. That can contaminate the participant even with zero foreign-path tool calls.

Apply this uniform boundary:

### Permitted; does not void

A foreign seat path appears only as inert text inside an **authorized debate artifact**, such as:

- an opponent’s submitted critique or rebuttal;
- the ledger’s faithful quotation of that message;
- a generated prompt that faithfully interpolates either;
- a protocol record the participant is explicitly required to read.

This exception applies only when:

1. The reference originated in the submitting participant’s own authorized work.
2. It concerns the same task and debate.
3. No foreign file contents, directory listing, glob result, metadata, or reproduction output are embedded beyond what the opponent intentionally submitted as debate evidence.
4. The receiving participant does not access or attempt to access the referenced path.
5. The path is not accompanied by information from another task, arm, or voided run.

A path string is not itself “content” for condition 8 when it satisfies this exception.

### Voiding exposure

Condition 8 fires if a participant:

- lists, reads, globs, searches, stats, traverses, executes, copies, imports, or otherwise operates on a foreign seat or its contents;
- attempts such an operation, even if permission is denied or the path no longer exists;
- receives an unauthorized listing, filename, metadata, file content, reproduction output, cache artifact, or other scratch-derived information through any channel, whether or not it requested it;
- receives a foreign path that identifies another task, arm, voided run, constructor, auditor, or hidden benchmark mechanism outside the authorized same-debate exchange;
- follows an authorized path reference into the foreign seat.

Thus the operative distinction is **authorized same-debate protocol quotation versus unauthorized scratch-derived observation or attempted access**.

## 3. Q-001 and T01–T06 — **SAME BOUNDARY APPLIES; RETROSPECTIVE TRANSCRIPT AUDIT REQUIRED**

Apply this rule to the completed T01–T06 replacement runs before grading.

The existing filesystem, link, cache, and participant-declaration checks are strong but do not cover unauthorized foreign material delivered through prompts or tool results. Run a transcript-level audit that distinguishes:

- authorized same-debate path quotations;
- foreign-path operations or attempted operations;
- unauthorized foreign paths, filenames, listings, or contents received without participant action.

Binding conditions:

1. Audit every retained critic and defender transcript for T01–T06.
2. Trace every foreign-seat occurrence to its source.
3. Classify authorized debate quotations separately from scratch exposure.
4. Verify that no participant acted on an authorized foreign path.
5. Archive a control-plane report containing task, arm, role, round, classification, and counts—without defect text.
6. An authorized, untraversed same-debate reference does not invalidate a run.
7. Any unclassifiable occurrence remains unresolved and must not be presumed authorized. Investigate from archived provenance; if provenance cannot establish the exception, apply the voiding rule.
8. Any confirmed voiding exposure requires rerunning both arms of that task under the established pair-level remedy.

The same audit standard should be applied to T08’s replacement pair and, before grading, to all retained T09–T25 debates. This need not void them merely because the protocol can carry path strings; it verifies that each occurrence stayed within the authorized exception.

## 4. Consequence had T07 fired

If the T07 occurrence had met the voiding definition, the remedy would have been another complete T07 rerun—both arms, B-first, with fresh seats and contexts. It does not meet that definition, so no third rerun is ordered.

The mere presence of the same authorized quotation channel in T09–T25 does not invalidate those tasks. Only an unauthorized exposure, attempted foreign access, or traversal does.

## 5. Related audit correction

Replacing the transcript-record `cwd` comparison was correct. A spawn-time project-directory field does not prove the participant’s later shell working directory. Tool-call paths provide better evidence, provided the audit also checks operations that omit absolute paths and resolves relative paths against the effective working directory where that can be reconstructed.

Preserve the discarded `cwd` check and its false finding as a superseded audit method, with the reason it was invalid.

## Final disposition

- T07 replacement pair: **VALID; retain**.
- Ledger-quoted defender path: **authorized protocol reference; no void**.
- Governing boundary: **authorized quotation versus unauthorized exposure/access**, not merely visibility versus traversal.
- T01–T06 transcript-level retrospective audit: **REQUIRED before grading**.
- Uniform application to T08 and retained T09–T25: **REQUIRED**.
