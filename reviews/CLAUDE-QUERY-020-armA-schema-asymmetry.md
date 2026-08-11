# QUERY 020 — Arm A's critic is not schema-enforced; Arm B's is

**From:** benchmark orchestrator (Claude)
**Date:** 2026-08-11
**Status of the run:** T01–T14 closed in both arms, ungraded. T15 Arm A round 1 in flight. Nothing graded, no S1/S2/S3 computed on the primary metric.

This is an instrumentation question, not a results question. It was found by running the machinery, not by looking at outcomes.

---

## 1. What was found

The two arms differ by more than critic identity. They differ in **whether the critic's output is schema-enforced.**

**Arm B (Codex critic).** `stepCritique` calls the Codex app-server with `outputSchema: readOutputSchema(SCHEMA_PATH)` — the message JSON Schema is handed to the provider and enforced at generation time. If the reply still fails to parse, the runner issues **one retry nudge on the same thread** before aborting.

**Arm A (Claude critic, delivered via `COUNCIL_MOCK_CRITIQUE`).** The same function takes the other branch and does exactly this:

```js
if (process.env.COUNCIL_MOCK_CRITIQUE) {
  message = readJson(process.env.COUNCIL_MOCK_CRITIQUE);
}
```

The file is read and used. **The JSON Schema is never applied to it.** The critic's prompt refers in prose to "the provided schema", but no schema is in the prompt and none is checked afterwards.

The message then passes through `validateMessage()`, which is a hand-rolled check of protocol *legality* — side, round, id format, status legality, response legality, and a numeric range check on `confidence`. It does **not** type-check `evidence`, `claim`, or any other field against `council-message.schema.json`, which declares `evidence` as `string` and sets `additionalProperties: false`.

## 2. How the gap converts into a scoring penalty

The runner's anti-inflation rule:

```js
if (!looksCheckableEvidence(finding.evidence)) {
  finding.support_level = "unsupported";
}
```

and

```js
function looksCheckableEvidence(evidence) {
  if (typeof evidence !== "string") return false;
  ...
}
```

**Any non-string `evidence` is unconditionally forced to `unsupported`, before a single character of it is examined.** Unsupported findings are excluded from the verdict by `stepClose`.

So an Arm A critic that emits well-researched, file:line-citing evidence encoded as a JSON **array of strings** — rather than one string — has every such finding silently deleted from the verdict. No error, no warning, no bounce. The runner reports the round as accepted with N new findings.

## 3. How it surfaced

T15 Arm A round 1. The critic ran ~12 executable experiments over ~38 minutes, archived reproduction scripts and logs, and filed 3 findings. It emitted:

- `confidence` as the string `"high"` — **this bounced.** `validateMessage` has an explicit numeric check for `confidence`, so the runner refused the message at the boundary, nothing entered the ledger, the phase was unchanged, and the critic corrected it in its own seat and resubmitted. This is the system working.
- `evidence` as an **array of strings** — **this did not bounce.** It was accepted, and all three findings were force-rewritten to `support_level: "unsupported"`.

The debate now sits at `awaiting-rebuttal`, round 1, with three findings that are excluded from the verdict by construction.

The two errors are the same kind of error. One was caught because someone hand-wrote a check for that specific field; the other was not, because no one hand-wrote a check for that one. That is the actual defect — the mock path is validated by an ad-hoc subset of the schema instead of by the schema.

## 4. Scope: how much of the run is affected

**T15 Arm A is the first `unsupported` finding in the entire run.** All 28 previously closed debates — T01–T14, both arms — carry zero. Verified via the control-plane projection:

| | debates | findings | any `unsupported`? |
|---|---|---|---|
| T01–T06, both arms | 12 | 40 | no |
| T07–T11, both arms | 10 | 31 | no |
| T12–T14, both arms | 6 | 27 | no |

So **no closed task is contaminated on this axis.** The exposure has existed since T01 and simply never fired. That is luck, not design: it fired the first time a critic chose a list-shaped encoding for a multi-item evidence set.

## 5. Why this is an arm asymmetry and not a reviewer failure

The asymmetry sits on **the critic — the one variable the benchmark manipulates.** A-002-E1 already established the principle: inputs must not differ between arms in any way beyond critic identity, and a channel that lets one arm receive something the other does not is a treatment difference, not a detail. The same logic applies to outputs. Arm B is *structurally prevented* from emitting a malformed message; Arm A is not, and its penalty for the same mistake is the silent deletion of findings from the verdict — landing directly on **S1, ground-truth detection**, the primary metric.

Arm B also gets a **malformed-output retry** that Arm A does not.

Two things that are *not* asymmetric, for completeness: defenders are Claude in both arms and equally unenforced, so the defender path carries the same gap symmetrically; and no scoring rule, prompt, round structure, or task input is involved.

## 6. What we propose, and the alternatives

We believe this falls squarely under BENCHMARK.md §5 item 3 — *"implementation bugs discovered mid-run may be fixed, but affected tasks are re-run in both arms and noted."*

**Option 1 — fix in the benchmark harness (our recommendation).** Validate the Arm A critique file against `council-message.schema.json` *before* it is handed to `COUNCIL_MOCK_CRITIQUE`, and bounce it back to the critic's own seat with the schema errors when it fails, exactly as the `confidence` error was bounced. Mirror Arm B's one-nudge allowance.

The argument for putting it here: `COUNCIL_MOCK_CRITIQUE` is a **benchmark affordance, not a product feature.** It exists so that Arm A's critic can be a Claude subagent. Its lack of schema enforcement is a defect in how we deliver Arm A's message, not a defect in the council plugin. Fixing it in the harness restores symmetry and **leaves the plugin pin at `f976990` untouched**, so T15–T25 run against the same code under test as T01–T14.

**Option 2 — fix in the plugin.** Make the runner validate *any* message it accepts against the schema regardless of source. This is arguably the more correct engineering fix, and the gap it closes is real. But it moves the pinned commit mid-run, so T01–T14 would have run against different code from T15–T25 — a worse comparability problem than the one being fixed, for a path that only the benchmark uses. We would rather record this as a post-run design item than take it now.

**Option 3 — do nothing.** Treat `unsupported` as a legitimate protocol penalty the critic earned. We do not recommend it: the penalty is not available to Arm B on equal terms, so it does not measure critic quality, it measures which arm had a schema attached.

## 7. The narrower question: what happens to T15 Arm A now

Whatever the ruling on the fix, the current T15 Arm A round 1 needs a disposition. Three readings:

**(a) Re-initialize the debate and re-inject the corrected message.** Void the current debate, `arm_init` fresh, have the same critic seat re-encode the *same three findings* with `evidence` as a string, and inject that. The critic's analysis was authored before any feedback about its content; only the encoding changes, and no information about the task reaches it that it did not already have. This is the minimal, least-distorting remedy and preserves ~38 minutes of independent experimental work.

**(b) Void T15 Arm A and re-run round 1 from a fresh seat.** Cleaner on paper, but it discards genuine independent work over an encoding error, and a fresh seat would re-derive the same experiments at real cost.

**(c) Let it stand.** Not defensible if the fix is adopted, since the message would not have been accepted under the corrected regime.

We propose **(a)**, and we would apply the same rule to any future occurrence. We flag one honest wrinkle for you to weigh: under (a) the critic learns that its round-1 message was rejected twice on format. It learns nothing about the code, the defect, or the defender's position — but it is a signal that would not have reached an Arm B critic, whose corrections happen inside the provider's generation loop rather than through us. We judge that immaterial; you may not.

## 8. What we are asking

1. Is the harness-side fix (Option 1) the right place, and is leaving the plugin pin untouched correct?
2. Is disposition (a) acceptable for T15 Arm A, or is a fresh-seat re-run required?
3. Given that no closed task carries an `unsupported` finding, do you agree no re-run of T01–T14 is required on this ground?
4. Should the one-nudge retry allowance be mirrored for Arm A, or is a bounce-and-correct loop with no cap the better match to Arm B's treatment?
5. Any condition you want attached to the amendment record.
