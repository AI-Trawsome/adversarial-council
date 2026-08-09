# SPEC — S3 cost basis

BENCHMARK.md §4 gates on **S3: "Arm B's median per-task cost is ≤ 3× Arm A's."** It never says what "cost" counts. That was harmless when both arms were Claude; it is not harmless now that Arm B's critic is a different provider with different accounting. This proposes a basis, shows what every candidate yields on T01–T06 so the countersigner can check for motivated reasoning, and asks for a ruling before T07 runs.

## 1. Why this can't be deferred

The three plausible bases differ by a factor of ~1.25 in the reported margin. Deciding after more tasks run means deciding with knowledge of which basis flatters which arm — the exact thing pre-registration exists to prevent. Six tasks is already more than enough to see the shape.

## 2. Candidate bases

| | Definition | Character |
|---|---|---|
| **A — non-cache-read tokens** | `output + fresh input + cache write` | Ignores cache reads entirely |
| **B — total tokens** | A + cache reads | Counts every token the provider processed |
| **C — billing-weighted** | `fresh×1.0 + cache_read×0.1 + cache_write×1.25 + output×5.0`, in input-token equivalents | Weights each token class by what it actually costs |
| **D — wall-clock** | seconds | Secondary, reported not gating |

Weights in C are Anthropic's published ratios for Claude Opus 5: input $5/MTok, output $25/MTok (5×), cache reads ~0.1×, cache writes 1.25× at the 5-minute TTL we use.

## 3. Argument from principle

S3's intent is **cost** — the criterion exists to decide whether the council is worth paying for. So the basis should track spend, and the two unweighted bases distort it in opposite directions:

- **A undercounts.** Cache reads are not free; they bill at ~0.1× input. Excluding them entirely pretends a cached token costs nothing.
- **B overcounts.** Counting a cache read as equal to a fresh input token inflates it 10×. A 90-message agent turn re-reads its cached context every message, so B is dominated by a quantity that reflects conversation length, not work performed.
- **C is the honest middle.** A cache read is neither free nor full price; C prices it at what it costs. Output tokens are 5× input and C says so — which matters, because Arm A's critic and Arm B's critic generate very different output volumes.

C is also the only basis that survives a change in caching behaviour. If a future task caches more aggressively, A and B move for reasons unrelated to spend; C does not.

**Proposal: gate S3 on basis C. Report A, B, C, and wall-clock for every task in the final report.** Publishing all four is what lets a reader who disagrees with C recompute the verdict themselves, and it costs nothing — the raw per-message payloads are already archived.

## 4. What each basis yields on T01–T06

Per-task Arm B ÷ Arm A. Lower favours Arm B. Construction and contamination-audit costs are excluded throughout — they are shared overhead, incurred once per task regardless of arm.

| task | A non-cache-read | B total | C billing-weighted |
|---|---|---|---|
| T01 | 0.84× | 0.84× | 0.81× |
| T02 | 0.79× | 0.61× | 0.70× |
| T03 | 0.19× | 0.17× | 0.18× |
| T04 | 0.92× | 0.58× | 0.70× |
| T05 | 0.21× | 0.23× | 0.22× |
| T06 | 0.71× | 0.63× | 0.66× |
| **median** | **0.75×** | **0.60×** | **0.68×** |

**Every basis favours Arm B on every task, and every basis passes S3's ≤ 3× ceiling by a wide margin.** The choice moves the reported number and changes nothing about the verdict. That is the strongest argument that fixing it now is safe: we are not choosing a winner, only choosing how to measure a result that is not close.

Claude-side spend at Opus 5 list rates, for scale — Arm A $6.53–$23.86 per task, Arm B $2.50–$7.18.

Wall-clock (D, secondary) tracks the same direction: Codex critic turns run 62–104 s per task against Claude critic turns of many minutes.

## 5. The problem C does not solve, stated plainly

**Codex here runs on a ChatGPT subscription. There is no per-token bill for Arm B's critic.** Weighted units are computable for both providers, but converting Arm B's to dollars requires a per-token price that does not exist for this configuration.

This cuts against the arm we are proposing to gate on, which is why it needs saying:

- Treating Codex as **$0** (true for marginal subscription spend) makes Arm B cheaper still and would flatter the council.
- Treating it at **OpenAI API list rates** is a modeled equivalent, not observed spend, and must be labelled as such.

We propose the second — the less flattering of the two — with the model and rates recorded per task, and the modeled portion reported separately so no reader mistakes it for a bill.

The exposure is bounded: **Codex accounts for 2.4%–5.1% of Arm B's weighted cost** on T01–T06 (the defenders, which are Claude in both arms, dominate). So whichever convention is chosen, it cannot move the S3 verdict — but it must be fixed in advance and disclosed.

## 6. A correction this analysis surfaced

`reviews/BATCH-T02-T06.md` §4 reported a median B/A of **0.82×** on basis A, with T04 at **1.12×** — the only task where Arm B looked more expensive. That figure was wrong. It added Codex's per-turn `totalTokens` into a basis that excludes cache reads, and `totalTokens` bundles cached input. Decomposing Codex usage properly (`fresh = input − cachedInput`, cache reads counted separately) gives median **0.75×** and T04 at **0.92×**.

The error inflated Arm B's apparent cost, so correcting it moves the number in the council's favour — worth stating explicitly, since a correction that helps the hypothesis deserves more scrutiny than one that hurts it. The committed record is being corrected alongside this proposal.

## 7. Questions for the countersign

1. Is basis C the right gate, with A, B and wall-clock reported alongside?
2. Is modeled API-equivalent pricing the right convention for subscription-billed Codex, given it is the less favourable of the two available conventions — or should Arm B's critic cost be reported as subscription-flat and excluded from the dollar figure?
3. Does anything in §4 read as basis-shopping? Every basis agrees here, which is the condition under which fixing it now is defensible; if the countersign disagrees, the alternative is to fix the basis blind before any further task runs.
