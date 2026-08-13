# Consult exchange 12 — 2026-08-13T23-45-33-832Z
Thread: 019fdf42-e16d-7b42-9581-8a34444f66d6
Document: CLAUDE-QUERY-029-installed-upstream-copies.md

## Sent
Ruling request, benchmark orchestrator. Late-surfacing finding, and I think the most serious one of the run: a published copy of the project under review is installed inside 18 reviewer seats across 12 tasks, because reviewers install the project's own test dependencies and a plugin can pull the project itself as a transitive dependency. Unlike every prior exposure this is a path to FIXED SOURCE, not merely locating information, and the split is asymmetric on the independent variable (Arm A critic 7 tasks; Arm B critic structurally 0, since Codex has no seat). All ordered re-runs and audits are otherwise discharged and S3 is computed; I am holding READY-TO-GRADE until you rule. Please answer questions 1-5, and state the boundary mechanically as you did for Q-003-E1.

## Reply
# Ruling — installed upstream project copies

## 1. Installed published copy — **CONTAMINATION EVENT ON REACHABILITY**

An installed copy of the project under review inside a participant’s accessible seat violates A-002’s isolation intent whether or not the transcript proves consultation.

The benchmark construction promises a history-free buggy-SHA tree as the review source. A second project version supplies an unauthorized comparison oracle and may contain the ground-truth fix, related later changes, tests, documentation, or symbol arrangements that reveal the defect. Actual use is generally unobservable: imports, searches, test discovery, stack traces, IDE-like tooling, or dependency introspection can expose it without an explicit source-reading command.

The participant’s statement that runtime resolution selected the working tree is useful evidence about that execution, but it does not remove the accessible alternate source.

## 2. Disposition — **RERUN BOTH ARMS OF ALL 12 AFFECTED TASKS**

The affected set is not limited to the seven tasks with Arm A critic exposure. Defenders can raise findings, rebut findings, change ledger status and support, and determine convergence. An exposed defender can therefore affect S1 and S2 even when defender exposure is approximately balanced in aggregate.

Void and rerun both arms of:

- T04
- T06
- T07
- T08
- T09
- T10
- T11
- T12
- T13
- T15
- T21
- T24

Why both arms:

- The finalized observation must be a contemporaneous pair under one environment policy.
- Pairing a remediated arm with an old arm repeats the environment-asymmetry problem rejected in Q-001 and Q-003.
- Aggregate balance of defender exposure does not validate individual paired observations.
- Determining after the fact whether a particular installed release contained the exact fix would condition retention on ground-truth proximity and still would not address related later source or tests.

Preserve prior debates as `VOIDED-INSTALLED-UPSTREAM`, exclude their usage from S3, and report it as remediation overhead.

## 3. Replacement policy — **DENY, REMOVE, AND VERIFY PROJECT SELF-INSTALLATION**

Do not merely instruct participants not to consult the installed copy. Prevent it mechanically.

Use a harness-managed dependency environment built before either arm begins, under a frozen policy:

1. Determine the reviewed project’s normalized distribution names and top-level import roots from the buggy-SHA checkout and authoritative package metadata.
2. Resolve the required test dependency closure without installing the reviewed project itself.
3. Reject any dependency closure containing a distribution whose normalized name matches the reviewed project.
4. After installation, remove or fail on any matching distribution, including editable installs, `.egg-link` files, direct-URL installs, local wheels, `.pth` injections, vendored copies, and namespace-package contributions.
5. Audit `site-packages`, executable scripts, package-manager metadata, import paths, and module-resolution results before releasing the environment to a participant.
6. Prove that every reviewed-project import resolves only to the scrubbed working tree.
7. Make the environment immutable after audit where practical. If a participant installs anything further, rerun the audit before its work may enter the debate.
8. Use the same dependency policy and frozen resolver inputs for both arms.
9. Archive the dependency specification, lock or resolution output, package inventory, audit result, and module-resolution proof.
10. Keep the audit output contamination-safe: package names, versions, paths, and pass/fail status are permissible; no comparison against the ground-truth fix is required.

A curated lock is acceptable, but “pinned” alone is insufficient: the resolved environment must still pass the self-installation audit. Installing with `--no-deps` is also insufficient unless the complete dependency closure is supplied and verified.

If a required test plugin cannot function without installing the reviewed project as a dependency, that plugin cannot be used in reviewer seats under this benchmark. Use a compatible isolated substitute, exercise the relevant behavior through the working tree, or record the upstream suite as unavailable and rely on an archived demonstrable reproduction under the earlier metric-2 ruling.

## 4. Non-voiding/report-only option — **REJECT**

Disclosure alone is insufficient. The exposure is a material treatment asymmetry for Arm A critics and an uncontrolled secondary-source channel for defenders. Because no grading has begun and clean reruns remain possible, retaining these observations would knowingly place potentially answer-bearing inputs in the scoring dataset.

The final report should still publish:

- the per-task and per-role exposure table;
- discovery timing;
- the fact that presence, not proven consultation, triggered remediation;
- the number and cost of voided debates;
- the corrected environment policy.

These disclosures accompany remediation; they do not replace it.

## 5. Mechanical boundary

### Voiding condition

A participant environment is contaminated if, while that participant’s work is active, it can resolve, enumerate, read, import, execute, search, inspect, or otherwise access any non-working-tree copy or partial copy of the project under review, including:

- installed distributions;
- editable installs or source links;
- cached wheels or extracted source distributions;
- package-manager build directories;
- vendored project source;
- namespace-package contributions;
- generated API/source documentation derived from another project version;
- compiled modules or source maps from another version;
- test or example files shipped with another version;
- package caches accessible from the seat.

No demonstrated tool call or intentional consultation is required. Reachability is the trigger.

### Permitted condition

The following do not void a run:

- The scrubbed buggy-SHA working tree itself.
- Build outputs produced solely from that working tree during the participant’s run.
- Third-party dependencies that contain no copy of the reviewed project.
- Package metadata created from the working tree, provided it contains no source or behavioral material from another version.
- An inaccessible package artifact outside the participant’s filesystem and search paths, provided the audit establishes that it was not reachable during the run.

### Required response

- Discovery before participant work: block the seat and rebuild its environment.
- Discovery after an arm begins: void that arm.
- Discovery after either arm begins or closes: rerun both task arms under the corrected policy.
- Uncertain identity or reachability: investigate mechanically. If the archive cannot establish absence or inaccessibility, treat the environment as contaminated rather than presume safety.

## Additional sweep required before grading

The current sweep matched installed distributions. Before accepting the remaining 13 tasks, extend it to all retained participant environments and relevant shared caches for:

- source distributions and wheels;
- editable links and `.pth` files;
- build and package-manager caches;
- alternate distribution names;
- reviewed-project import roots supplied by another distribution;
- vendored or extracted source copies.

If any new task meets the reachability rule, add it to the paired rerun set. A clean package-name sweep alone is not enough if the same source is present under another packaging mechanism.

## Final disposition

- Installed accessible upstream copy: **voiding contamination, regardless of proven use**.
- Scope: **both arms of all 12 listed tasks must be rerun**.
- Remedy: **mechanically exclude and audit all non-working-tree copies before participant access**.
- Report-only treatment: **rejected**.
- Extended environment sweep of all retained tasks: **required before grading**.