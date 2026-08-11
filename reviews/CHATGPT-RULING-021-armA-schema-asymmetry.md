# Consult exchange 7 — 2026-08-11T19-38-58-914Z
Thread: 019fdf42-e16d-7b42-9581-8a34444f66d6
Document: CLAUDE-QUERY-020-armA-schema-asymmetry.md

## Sent
Benchmark orchestrator here, mid-run. This is a pre-registration/instrumentation question found by running the machinery, not a results question -- nothing is graded and no S1/S2/S3 has been computed on the primary metric.

We have found that the two arms differ in whether the critic's output is schema-enforced: Arm B's Codex critic gets the message JSON Schema as a provider-enforced outputSchema plus one malformed-output retry, while Arm A's Claude critic is delivered through COUNCIL_MOCK_CRITIQUE and is never checked against the schema at all. The consequence is not cosmetic -- a non-string 'evidence' field is unconditionally rewritten to support_level 'unsupported', which excludes the finding from the verdict, so the penalty lands directly on S1 in one arm only.

The attached document states the mechanism, the exact code paths, the scope (T15 Arm A is the first unsupported finding in the run; all 28 previously closed debates carry zero), why we read this as an arm asymmetry rather than a reviewer failure, and three options with our recommendation. Five specific questions are at the end. Please rule.

## Reply
# Ruling — Arm A schema-enforcement asymmetry

## 1. Harness-side fix — **APPROVE OPTION 1**

Validate every Arm A critic message against the exact frozen `council-message.schema.json` before supplying it through `COUNCIL_MOCK_CRITIQUE`. Leaving the plugin pinned at `f976990` is correct.

This is an arm-delivery defect in the benchmark harness. Changing the plugin now would alter the code under test for later tasks and create a broader comparability problem. A product-level fix should be recorded separately after the benchmark.

The current behavior is not a legitimate critic-quality penalty. Arm B is structurally protected by provider schema enforcement and receives a retry, while Arm A can unknowingly submit the same class of malformed output and have findings silently removed from the verdict. Because that affects S1, the asymmetry is material.

## 2. T15 disposition — **REJECT (a); REQUIRE A FRESH-SEAT RERUN**

Do not re-initialize and reinject a corrected message from the existing T15 Arm A seat.

Although the seat received no substantive feedback, it has already completed its search, learned that two encodings crossed different validation boundaries, and would be receiving a remediation opportunity designed after its actual output was observed. Restricting changes to “encoding only” would also require a semantic-equivalence judgment that was not preregistered.

Apply disposition **(b)**:

- Void the current T15 Arm A debate.
- Preserve it with an explicit `VOIDED-SCHEMA-ASYMMETRY` label.
- Start Arm A from a fresh, no-history seat under the corrected harness.
- Do not expose the old findings, experiments, scripts, filenames, schema errors, or message to the new seat.

If T15’s other arm has already begun or closed, rerun **both T15 arms** under the finalized configuration, following the original arm order. That is required by §5’s affected-task rerun rule and the prior same-environment precedent. If the other arm has not begun, restart T15 from the beginning in its scheduled order; do not preserve a partially completed task boundary.

## 3. T01–T14 reruns — **CONDITIONALLY NOT REQUIRED**

Zero `unsupported` findings is necessary but not sufficient. Other schema violations—wrong field types, undeclared properties, missing required fields, or malformed nested values—may have been accepted without producing `support_level: "unsupported"`.

Before exempting T01–T14:

1. Validate every archived Arm A critic payload, including every round and resubmission, against the exact schema now being enforced.
2. Produce a contamination-safe audit table containing task, arm, round, schema-valid status, and error-category counts only.
3. If all accepted Arm A critic payloads are schema-valid, no rerun is required on this ground.
4. If any accepted payload is schema-invalid, rerun both arms of that task under the corrected harness. Do not make post-hoc materiality judgments based on whether the malformed field appears to have changed the verdict.
5. Also verify that the archived payload being checked is the exact pre-ingestion critic output, not a ledger-normalized representation.

Thus: **no blanket rerun of T01–T14, but no exemption based solely on the absence of `unsupported`.**

## 4. Retry policy — **MIRROR ARM B’S ONE-RETRY LIMIT**

Arm A should receive one correction attempt after an initial schema-invalid message. An unlimited bounce-and-correct loop would advantage Arm A and distort cost and convergence.

The required sequence is:

1. Validate the initial payload against the complete JSON Schema and existing protocol-legality checks.
2. If invalid, return all detected schema and protocol errors together in one format-only response.
3. Permit one corrected submission from the same seat.
4. Validate the correction in full.
5. If it remains invalid, abort the critic step under the same failure policy used after Arm B exhausts its malformed-output retry.

The error response may identify paths, expected types, missing fields, and forbidden fields. It must not comment on finding quality, evidence strength, code content, severity, or likely correctness.

The correction attempt and its usage must be archived and included in that arm’s scoring cost, just as Arm B’s billed retry would be.

## Binding implementation conditions

1. Pin and record the schema file’s SHA-256. Both arms must use the same schema version.
2. Use a standards-compliant JSON Schema validator; do not reproduce the schema with another hand-written subset.
3. Validate before ledger ingestion or anti-inflation rewriting.
4. Retain `validateMessage()` for protocol/state legality, but run both validation layers and report their complete errors together.
5. Add protocol tests covering at least:

   - array-valued `evidence`;
   - string-valued `confidence`;
   - missing required fields;
   - unexpected properties;
   - invalid nested response fields;
   - valid messages passing unchanged;
   - one successful correction;
   - a second invalid submission causing failure;
   - no ledger mutation before successful validation.

6. Archive the original invalid payload, validation errors, corrected payload, attempt count, and usage outside reviewer-visible paths.
7. Ensure neither critic nor defender in the paired arm can access rejected messages or validation artifacts.
8. Freeze the corrected harness and its hash before restarting T15.
9. Record this as a §5 implementation repair discovered before grading, including the T01–T14 retrospective audit and T15 void/rerun disposition.
10. Do not change defender enforcement mid-run. Defender schema validation is a legitimate post-run engineering fix, but changing it now is unnecessary to correct the critic-arm asymmetry and would alter both arms’ debate dynamics partway through the benchmark.

## Final disposition

- Harness-side Arm A schema validation: **APPROVE**.
- Keep plugin pin unchanged: **APPROVE**.
- Reinject T15’s existing findings: **REJECT**.
- Fresh T15 restart, with both arms rerun if either has already run: **REQUIRED**.
- T01–T14 exemption: **APPROVE only after full archived-payload validation**.
- Arm A retry allowance: **exactly one**, matching Arm B.