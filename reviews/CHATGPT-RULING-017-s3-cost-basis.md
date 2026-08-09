# Consult exchange 5 — 2026-08-09T04-50-53-313Z
Thread: 019fdf42-e16d-7b42-9581-8a34444f66d6
Document: SPEC-S3-COST-BASIS.md

## Sent
GPT: ruling requested before T07 runs. BENCHMARK.md S3 gates on 'Arm B's median per-task cost is <= 3x Arm A's' but never defines cost — harmless when both arms were Claude, not harmless now that Arm B's critic is a different provider with different token accounting. We propose gating on a billing-weighted basis (fresh input 1.0, cache read 0.1, cache write 1.25, output 5.0 — Anthropic's published Opus 5 ratios) and reporting all bases in the final report. The argument from principle: S3's intent is cost, and the two unweighted bases distort in opposite directions — excluding cache reads pretends a cached token is free, counting them at par inflates them 10x and makes the metric track conversation length rather than work. Three things we want you to check specifically. (1) Motivated reasoning: section 4 shows all three bases on all six tasks. Every basis favours Arm B on every task and every basis passes the 3x ceiling by a wide margin, so the choice moves the reported number and not the verdict — we think that is what makes fixing it now safe rather than self-serving, but that is exactly the judgement you should audit. (2) Codex runs on a ChatGPT subscription, so Arm B's critic has no per-token bill. We propose modeling it at OpenAI API list rates rather than treating it as zero, because zero is the convention that flatters the council; Codex is only 2.4-5.1% of Arm B's weighted cost either way. Is modeled-and-labelled right, or should it be reported subscription-flat and excluded from the dollar figure? (3) This analysis surfaced an error in an already-committed record: BATCH-T02-T06 reported median 0.82x on the non-cache-read basis with T04 at 1.12x, because it added Codex per-turn totalTokens into a basis that excludes cache reads, and totalTokens bundles cached input. Correct figures are 0.75x median and T04 at 0.92x. The correction moves in the council's favour, which is why we are flagging it rather than quietly fixing it. APPROVE/REJECT with reasons.

## Reply
## S3 cost-basis ruling

### 1. Basis C as specified — **REJECT**

The principle is right but the proposed formula is not yet a valid cross-provider cost measure. Anthropic’s Opus ratios describe the relative prices of Anthropic token classes. Applying those weights to Codex tokens produces “Anthropic-equivalent input units,” not observed or modeled spend for the Codex provider.

If S3 means monetary cost, the gate should use:

> **Modeled API-equivalent dollar cost, calculated separately for each provider and model using that provider’s frozen public rate card, then summed across all critic and defender calls in the arm.**

For each invocation:

```text
fresh input × provider fresh-input rate
+ cache read × provider cache-read rate
+ cache write × provider cache-write rate
+ output × provider output rate
```

Binding requirements:

- Freeze the provider, model identifier, rate-card source, retrieval date, currency, cache-write TTL category, and rates before T07.
- Use the model identity reported by each run. If the Codex CLI does not disclose an API-priceable model identity, do not silently select a convenient model. Establish and document a conservative mapping rule before continuing, or report the Codex component as unpriceable.
- Include retries, malformed-output retries, and every billed critic/defender invocation.
- Preserve raw token-class counts and provider payloads.
- Do not retroactively update historical task costs when public rates later change.
- Gate on the median of per-task `Arm B modeled dollars / Arm A modeled dollars`, not on a ratio of aggregate dollars.
- Continue reporting bases A, B, the proposed common-weight C, and wall-clock as sensitivity measures, clearly labeled as token-accounting views rather than the gating monetary cost.

If a provider lacks a separately reported token class, record that limitation and apply a frozen conservative rule; do not infer a more favorable decomposition.

### Motivated-reasoning audit

The disclosure substantially reduces, but does not eliminate, the basis-shopping concern. Six of 25 tasks have already been observed, so this is not a blind preregistration decision. Nevertheless, all three disclosed bases agree on every observed task and remain far from the 3× boundary. That supports treating this as resolution of a genuine specification ambiguity rather than selection of a currently winning basis.

The safe course is to freeze the provider-specific API-equivalent rule now, before T07, and make no further basis changes after additional task costs are seen. The amendment should explicitly state that T01–T06 cost data were known when the ambiguity was resolved.

### 2. Subscription-billed Codex — **APPROVE modeled API-equivalent pricing, with qualifications**

Do not treat Codex as zero in the S3 gate. Zero describes current marginal cash outlay under an already-paid subscription; it does not measure the resource cost of the council or generalize to API users, different subscription utilization, or future deployment.

Use provider-specific API-equivalent pricing when the model can be mapped defensibly, and label it:

- `observed billed cost`: unavailable or subscription-flat;
- `modeled API-equivalent cost`: the S3 input;
- `subscription marginal cost`: zero for these calls, reported separately but not gated.

Do not allocate an arbitrary fraction of the subscription fee per task. That would depend on unrelated monthly usage and would be less reproducible than the API-equivalent model.

The statement that Codex contributes only 2.4–5.1% must be recomputed under provider-specific dollar rates. The current percentage appears to come from the proposed common-weight basis and should not be used to justify the monetary ruling until recalculated.

### 3. T02–T06 correction — **APPROVE**

Correct basis A from the raw archived token-class payloads:

```text
fresh input = input tokens − cached input
basis A = fresh input + cache write + output
```

Do not add `totalTokens`, because that reintroduces cached input into a basis defined to exclude it.

The correction should be handled as an explicit erratum:

- Preserve the originally committed figures and identify them as superseded.
- State the faulty formula and corrected formula.
- Commit per-task recomputation inputs or a deterministic script.
- Have the corrected T01–T06 table independently checked against the raw usage artifacts.
- Update every downstream table that used the erroneous figures.
- State prominently that the correction moves the result in Arm B’s favor.

No debate rerun is required because the underlying usage payloads are intact and the error is purely deterministic aggregation.

## Final disposition

- Common Anthropic-weighted Basis C as the S3 gate: **REJECT**.
- Provider-specific, frozen API-equivalent dollar cost as the S3 gate: **APPROVE**.
- Modeled Codex API cost instead of zero marginal subscription cost: **APPROVE**, provided the model-to-rate mapping is defensible and disclosed.
- T02–T06 arithmetic correction: **APPROVE** after independent reproducibility checks.

Freeze that rule before T07 and make it the final S3 basis for all 25 tasks.