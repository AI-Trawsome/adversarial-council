# ERRATA — corrections to committed benchmark records

Errors found in already-committed records, with the superseded figures preserved. Nothing here is silently overwritten: each entry states the faulty formula, the corrected formula, what changed, and — where it applies — the fact that the correction moves the result in the council's favour.

Both entries below do. That is stated plainly rather than buried, because a correction that helps the hypothesis under test deserves *more* scrutiny than one that hurts it, not less.

Recomputation is deterministic and committed: `bench/compute-s3-cost.mjs` against `bench/rate-card-frozen.json` and the archived raw payloads. Anyone with the repository can reproduce every corrected figure.

---

## E-001 — Codex `totalTokens` double-counted cached input

**Where:** `reviews/BATCH-T02-T06.md` §4 (commit `16a29fb`).

**Faulty formula.** Arm B's non-cache-read token basis was computed as Claude's `output + fresh input + cache write` **plus Codex's per-turn `totalTokens`**. In the Codex app-server protocol `inputTokens` already includes `cachedInputTokens`, and `totalTokens` bundles both — so cached input was added into a basis defined to exclude it.

**Corrected formula.** `fresh input = inputTokens − cachedInputTokens`; cache reads counted separately and excluded from that basis.

| | superseded | corrected |
|---|---|---|
| median B/A, non-cache-read basis | 0.82× | **0.75×** |
| T04 B/A | 1.12× | **0.92×** |

T04 was the only task where Arm B appeared *more* expensive than Arm A. It never was. **The correction moves in Arm B's favour on every task.**

**Superseded per-task figures** (BATCH-T02-T06 §4, kept for the record): T02 0.88×, T03 0.23×, T04 1.12×, T05 0.26×, T06 0.82×.

---

## E-002 — Claude transcript records double-counted per content block

**Where:** every Claude token and dollar figure in `reviews/RERUN-T01-v2.md` §5 and `reviews/BATCH-T02-T06.md` §4 (commits `5a83487`, `16a29fb`), and the first draft of the S3 cost table.

**Found by** the independent recomputation required under consult 005 §3 — a separate agent recomputing from raw payloads without access to the computation script. It reproduced all six published dollar figures exactly and then reported that the underlying aggregation was wrong. That is the check working as intended: agreement on the arithmetic, disagreement on the premise.

**Faulty formula.** `bench/collect-claude-usage.mjs` summed token classes over every assistant record in the subagent transcript. But the harness writes **one record per streamed content block**, and every record in a call repeats that call's usage snapshot: the input side is byte-identical across the group while `output_tokens` grows to its final value on the last record. Summing over records therefore bills one call's input, cache-read and cache-write tokens once per block, and over-counts output as well.

Scale of the error: **1605 transcript records for 791 actual API calls** across T01–T06 — roughly a 1.7× inflation of every Claude figure.

**Corrected formula.** Group records by `requestId`; take the input side once per group; take `output_tokens` as the maximum (the final cumulative snapshot). Records without a `requestId` are treated as their own call rather than merged. Implemented in `collapseToApiCalls()` in both `bench/collect-claude-usage.mjs` and `bench/compute-s3-cost.mjs`; the raw per-record payloads are still archived verbatim, and each invocation now records `apiCallCount` beside `messageCount`.

**Effect on modeled cost** (USD, rate card v1):

| task | Arm A superseded | Arm A corrected | Arm B superseded | Arm B corrected | B/A superseded | B/A corrected |
|---|---|---|---|---|---|---|
| T01 | $6.53 | **$3.75** | $5.31 | **$3.14** | 0.81× | **0.84×** |
| T02 | $10.86 | **$6.25** | $7.57 | **$4.63** | 0.70× | **0.74×** |
| T03 | $23.86 | **$12.80** | $4.31 | **$2.71** | 0.18× | **0.21×** |
| T04 | $6.89 | **$4.37** | $4.82 | **$2.78** | 0.70× | **0.64×** |
| T05 | $11.48 | **$6.95** | $2.56 | **$1.60** | 0.22× | **0.23×** |
| T06 | $7.37 | **$4.02** | $4.84 | **$2.73** | 0.66× | **0.68×** |
| **median B/A** | | | | | 0.68× | **0.658×** |

The inflation was close to common-mode across arms, so absolute levels fall by roughly 1.7× while ratios barely move. **The corrected median moves in Arm B's favour** (0.68× → 0.658×), and S3 passes under both — as it does under every basis examined.

Token counts quoted in `RERUN-T01-v2.md` §5 and `BATCH-T02-T06.md` §4 are inflated by the same defect and are superseded by the JSON artifacts (`_rerun2/s3-cost-T01-T06.json`, regenerated `claude-usage-*.json`).

**No debate re-run is required.** The raw payloads are intact, no reviewer saw a cost figure, and the error is purely deterministic aggregation downstream of the run.

**Independent check after correction:** the verifier's dedupe-by-`requestId` figures — T01 A $3.75 / B $3.14, T02 $6.25 / $4.63, T03 $12.80 / $2.71, T04 $4.37 / $2.78, T05 $6.95 / $1.60, T06 $4.02 / $2.73, median 0.658 — match the corrected script to the cent, having been derived independently before the script was fixed.

---

## What both errata have in common

Neither error was in the raw data. Both were in aggregation performed *after* the run, over payloads that were archived correctly and remain correct. That is the argument for persisting raw provider payloads rather than pre-summed totals: every figure in this benchmark has been recomputable from source at every point, which is the only reason either error was findable at all.

Both were caught by a check whose whole purpose was to disagree with me — E-001 by recomputing a basis from decomposed token classes, E-002 by an independent agent instructed not to read my script and not to round toward my numbers.
