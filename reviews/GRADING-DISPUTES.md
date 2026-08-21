# GRADING-DISPUTES.md — for Michael to resolve

Per BENCHMARK.md §3.1: *"Graded independently by both models … grading disagreements resolved by Michael."* This file is that resolution queue. **The final S1/S2 verdict is not computed and will not be until you have resolved these and completed the blind ranking.**

## How to use this

Two independent graders — one from each model — scored all 50 debates against the ground-truth fix. Write your decision inline under each item. Anything you leave unmarked stays unresolved and will be reported as such rather than silently defaulted.

**These items are presented blind to the arm.** Each debate appears under its opaque packet id. You are resolving *scoring questions*, and knowing which arm produced a finding is not an input to whether that finding names the maintainer's mechanism. The packet→arm mapping is held outside this file and applied only after your decisions are recorded. Ask if you want it earlier — but I'd suggest not.

## Agreement summary

| | |
|---|---|
| debates graded by both models | **50 / 50** |
| debates with **no** disagreement | **39** |
| debates with at least one disagreement | 11 |
| total disagreement items | 25 |
| of which **blocking** (move S1 or S2) | **3** |

Agreement is high: the two models reached identical scores on 39 of 50 debates. The disagreements that remain are concentrated, and they are rule questions rather than factual ones — in several cases *both* graders independently flagged the same ambiguity before disagreeing about it.

---

## 1. Blocking disputes — these move S1 or S2

### 1.1 `T09-ae0fece3` (T09) — ground-truth-detection

**The question: does this count as detecting the ground truth?**

| | detected | locationMatch | mechanismMatch |
|---|---|---|---|
| Grader A | **true** | true | true |
| Grader B | **false** | true | false |

**Grader A's reasoning:**

> Ground truth is 393c8f7b35c9, 'Fix CacheProxyConnection hang when invalidation arrives on another connection (#3600)'. It changes exactly one statement in CacheProxyConnection.send_command: the bare `return` that ends the foreign-cache-entry branch (redis/connection.py:1712 in the reviewed tree, immediately after the `while entry.connection_ref.can_read(): entry.connection_ref.read_response(push_request=True)` drain) becomes `if self._cache.get(self._current_command_cache_key): return`, with the comment 'Re-check: if the entry was invalidated during the drain, fall through to send the command over the network.' The failure the maintainer fixed is: send_command returns having sent nothing, and read_response is then not served from the cache, so it performs a wire read on a connection that has no outstanding command and hangs (the added regression test asserts send_command reaches the wire and an IN_PROGRESS entry is installed).
> 
> R1-F1 names that statement and that failure. Its claim is that 'Any existing cache entry - including IN_PROGRESS - causes send_command to return', that 'The code merely drains responses that are already readable from the owning connection', and that read_response 'then reads from the second connection's socket despite no command having been sent there, causing a hang, timeout, or protocol desynchronization'. Its cited evidence is redis/connection.py:1704-1712 (the branch and the unconditional return) plus 1742-1768 (the hit test that excludes the entry, so control falls through to self._conn.read_response) - the same two sites the fix and the hang run through. I re-read both in the tree at those exact line numbers and they match. repro_f1_wrong_socket.py, which I re-ran, drives the real CacheProxyConnection over two proxies sharing one real DefaultCache and shows B's underlying send_command called 0 times and B's underlying read_response called once, performing a genuine blocking recv on B's own idle socketpair (socket.timeout at 1.0s; socket_timeout defaults to None in production, so the real block is unbounded). That is the maintainer's hang, at the maintainer's line, established mechanically rather than by attestation. R1-F1's proposed fix (a) - treat a foreign-owned entry as a miss, install nothing and send the command - would also eliminate the maintainer's scenario.
> 
> Recorded divergence, because it is real and a stricter reading could score mechanismMatch false: no finding in this ledger, and nothing in the message notes, states the maintainer's precipitating condition - that the drain the connection itself performs can consume an invalidation push that deletes the very entry it is about to rely on, which is why the return needs a re-check. R1-F1's precipitating condition is instead a foreign entry that is still present but IN_PROGRESS. The two share the entire downstream chain (early return -> nothing sent -> read_response not served from cache -> wire read on an idle socket -> indefinite block) and the identical code site, but they are different reasons the return is wrong, and the maintainer's narrow re-check would not cure R1-F1's stated scenario (a still-present IN_PROGRESS entry is truthy, so the new guard would still return). I score this as detection because the rubric asks for the failing mechanism at the correct location, and R1-F1 names the exact statement the fix changes and the exact failure it produces; I record the trigger divergence here and in `uncertainties` so the aggregate can be re-scored if the pre-registered criterion intended trigger-level identity. R1-D1 is adjacent - it is about the same drain loop - but it claims the drain steals the owner's pending command reply, not that the drain removes the cache entry, so I do not list it as jointly identifying the ground truth.

**Grader B's reasoning:**

> The fix changes CacheProxyConnection.send_command at the post-drain return: after draining another connection, an invalidation may have removed the previously observed cache entry, so the code must re-check the cache and send the command if the entry disappeared. R1-F1 and R1-D1 identify the same drain/return region, so location matches, but neither names this invalidation-during-drain stale-decision mechanism. R1-F1 instead concerns a still-present foreign IN_PROGRESS entry; R1-D1 concerns consuming a normal command reply. The other findings concern unrelated mechanisms.

**Your decision:** ______________________________________________

---

### 1.2 `T20r-0e767ca5` (T20r) — count:falsePositives

Grader A: `0` · Grader B: `1`

_This count difference follows from the finding-level dispute in this same debate; resolving that resolves this._

**Your decision:** ______________________________________________

---

### 1.3 `T20r-0e767ca5` (T20r) — finding-classification · R1-F5

**The question: how is finding `R1-F5` classified?**

| | classification | verification |
|---|---|---|
| Grader A | **unverified-additional** | michael-confirmation-required |
| Grader B | **false-positive** | demonstrable-repro |

**Grader A's reasoning:**

> Not a false positive: everything the finding asserts about this tree is true and reproduced, and nothing in the code contradicts it -- so under the brief it cannot be scored as disproved. Not verified either, because the only thing that would make the rendering a defect is the server's grammar, which no artefact here reaches. The ledger status 'rejected' reflects the defender's causal objection, measured and re-measured by both seats and reproduced by me: rebinding reserved_words to the base class's set changes the rendering of none of the four named words (nor of the concurrently collision), so deleting base.py:3248 -- the only in-window line the finding cites -- would not move any of the statements it shows. That falsifies the finding's implicit attribution of these renderings to the reviewed diff; it does not falsify the renderings themselves, which is why I classify unverified rather than false-positive. Recorded in uncertainties.

**Grader B's reasoning:**

> The finding attributes the named omissions and version-skew behavior to the reviewed binding, but removing that binding does not change any named behavior. The notes explicitly retract the earlier claim that the binding strictly increases coverage. Any PostgreSQL grammar impact remains unobserved, but the asserted in-window causal behavior is contradicted by the code and repro.

**Your decision:** ______________________________________________

---

## 2. Review-level disputes

These change reported figures but not the pass/fail of a criterion on their own.

| packet | task | item | Grader A | Grader B |
|---|---|---|---|---|
| `T04-47891ea5` | T04 | count:verifiedAdditional | 6 | 5 |
| `T04-47891ea5` | T04 | count:unverifiedAdditional | 0 | 1 |
| `T04-47891ea5` | T04 | finding-classification · R1-F3 | verified-additional | unverified-additional |
| `T04-47891ea5` | T04 | escalated-to-michael | 0 | 1 |
| `T09-ae0fece3` | T09 | count:verifiedAdditional | 4 | 5 |
| `T09-ae0fece3` | T09 | finding-classification · R1-F1 | ground-truth | verified-additional |
| `T10-c9d43e3e` | T10 | suite-runnable | "partial" | "yes" |
| `T13-73671ab7` | T13 | suite-runnable | "partial" | "yes" |
| `T13-8c4c821c` | T13 | escalated-to-michael | 3 | 3 |
| `T18-21003367` | T18 | suite-runnable | "partial" | "no" |
| `T18-2cb2cff0` | T18 | suite-runnable | "partial" | "no" |
| `T20r-0e767ca5` | T20r | count:verifiedAdditional | 4 | 3 |
| `T20r-0e767ca5` | T20r | finding-classification · R1-F4 | verified-additional | unverified-additional |
| `T20r-0e767ca5` | T20r | escalated-to-michael | 1 | 1 |
| `T20r-8145d0cb` | T20r | suite-runnable | "partial" | "yes" |
| `T21-b9dfba11` | T21 | suite-runnable | "yes" | "partial" |
| `T22-9c6d52d2` | T22 | count:verifiedAdditional | 6 | 3 |
| `T22-9c6d52d2` | T22 | count:unverifiedAdditional | 0 | 3 |
| `T22-9c6d52d2` | T22 | finding-classification · R1-D1 | verified-additional | unverified-additional |
| `T22-9c6d52d2` | T22 | finding-classification · R1-F1 | verified-additional | unverified-additional |
| `T22-9c6d52d2` | T22 | finding-classification · R3-F1 | verified-additional | unverified-additional |
| `T22-9c6d52d2` | T22 | escalated-to-michael | 0 | 3 |

**Your decisions (note any you want changed; silence = accept the split as reported):**

______________________________________________

---
## 3. Systemic rulings — each applies across many tasks

These are not per-task disagreements. They are places where §3's wording underdetermines the score, surfaced repeatedly and independently by graders who flagged the ambiguity rather than resolving it silently. **Ruling once here settles many items at once**, and several affect S1 directly.

Across the 100 grader runs there are **324 recorded uncertainties**, of which **45 explicitly flag an alternative scoring** that would change a count. They are not hidden in prose; each is machine-readable in the grader outputs.

### R1. Trigger-level identity

**Situation.** A finding names the exact statement the maintainer changed and the exact downstream failure, but its *precipitating condition* differs — and the maintainer's narrow fix would not cure the scenario the finding describes.

**Question.** Detection requires only mechanism-at-location, or also the same triggering condition?

**Your ruling:** ______________________________________________

### R2. Attribution to the reviewed change

**Situation.** The described behaviour is real and reproduced, but it predates the reviewed change (still present at upstream HEAD, or byte-identical to the buggy SHA). Several graders confirmed this by checking upstream directly.

**Question.** Does a real but pre-existing defect count as a verified additional finding, or is asserting it as in-window a false positive?

**Your ruling:** ______________________________________________

### R3. Bundled false clause on a demonstrated core

**Situation.** A finding's core defect reproduces while a sub-clause in its claim text is refuted — often conceded by its own claimant, with no legal way to amend the stored text.

**Question.** Score at finding granularity (core stands) or sentence granularity (any false clause taints)?

**Your ruling:** ______________________________________________

### R4. Detection via a defender-claimed finding

**Situation.** The defender is the same model in both arms, so a detection it contributes is not evidence about the arm's critic.

**Question.** Does S1 count detection by the debate, or by the critic seat? Both aggregates are computable.

**Your ruling:** ______________________________________________

### R5. Compound ground truth

**Situation.** The maintainer's commit fixes two distinct defects; a finding names one. Conversely, one finding has two legs and only one is the maintainer's.

**Question.** Full credit for a half-catch, or partial?

**Your ruling:** ______________________________________________

### R6. Threat-class disagreement

**Situation.** Same mechanism, same fix, different account of what the bug *is*: one finding understated a log-forging issue as output formatting; another overstated a malformed-statement issue as SQL injection.

**Question.** Must the finding agree with the maintainer on consequence class?

**Your ruling:** ______________________________________________

### R7. Incidental repair

**Situation.** The maintainer's fix happens to repair an additional finding, or would not repair it. Graders tested this by applying the patch and re-running.

**Question.** Does incidental repair fold a finding into the ground-truth set?

**Your ruling:** ______________________________________________

---

## 4. Both graders' scores, per debate

The record §3 requires. Blind to arm, keyed by packet id. `GT` = ground truth detected, `VA` = verified additional, `UA` = unverified additional, `FP` = false positives, `WD` = withdrawn-excluded, `Def` = defender-claimed findings in that debate.

| packet | task | GT (A/B) | VA (A/B) | UA (A/B) | FP (A/B) | WD (A/B) | Def | agree |
|---|---|---|---|---|---|---|---|---|
| `T01-cd35b829` | T01 | 1/1 | 4/4 | 0/0 | 0/0 | 0/0 | 0 | yes |
| `T01-172071ae` | T01 | 0/0 | 3/3 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T02-e21966d7` | T02 | 1/1 | 9/9 | 0/0 | 0/0 | 0/0 | 2 | yes |
| `T02-ed22a6fc` | T02 | 0/0 | 7/7 | 0/0 | 0/0 | 0/0 | 2 | yes |
| `T03-898402bd` | T03 | 1/1 | 8/8 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T03-a1ddd384` | T03 | 1/1 | 5/5 | 0/0 | 0/0 | 1/1 | 3 | yes |
| `T04-47891ea5` | T04 | 0/0 | 6/5 | 0/1 | 0/0 | 0/0 | 0 | **no** |
| `T04-81dcf92b` | T04 | 0/0 | 2/2 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T05-8d514b26` | T05 | 0/0 | 4/4 | 0/0 | 0/0 | 0/0 | 0 | yes |
| `T05-5fa73c92` | T05 | 0/0 | 1/1 | 0/0 | 0/0 | 0/0 | 0 | yes |
| `T06-faebacd1` | T06 | 0/0 | 8/8 | 0/0 | 0/0 | 0/0 | 0 | yes |
| `T06-4843352d` | T06 | 0/0 | 4/4 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T07-1708db13` | T07 | 0/0 | 3/3 | 0/0 | 0/0 | 0/0 | 0 | yes |
| `T07-381bcead` | T07 | 0/0 | 3/3 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T08-3c8dce77` | T08 | 0/0 | 4/4 | 0/0 | 0/0 | 0/0 | 0 | yes |
| `T08-c79d7447` | T08 | 0/0 | 1/1 | 0/0 | 0/0 | 0/0 | 0 | yes |
| `T09-f3a6f63d` | T09 | 0/0 | 9/9 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T09-ae0fece3` | T09 | 1/0 | 4/5 | 0/0 | 0/0 | 0/0 | 2 | **no** |
| `T10-c9d43e3e` | T10 | 1/1 | 7/7 | 0/0 | 0/0 | 0/0 | 2 | yes |
| `T10-f72a669e` | T10 | 0/0 | 1/1 | 0/0 | 0/0 | 0/0 | 0 | yes |
| `T11-d8de4dd3` | T11 | 1/1 | 6/6 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T11-8de9c2a8` | T11 | 1/1 | 2/2 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T12-5383e7a9` | T12 | 1/1 | 8/8 | 0/0 | 0/0 | 0/0 | 2 | yes |
| `T12-e219d9cb` | T12 | 1/1 | 5/5 | 0/0 | 0/0 | 0/0 | 3 | yes |
| `T13-73671ab7` | T13 | 0/0 | 6/6 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T13-8c4c821c` | T13 | 0/0 | 1/1 | 3/3 | 0/0 | 0/0 | 2 | yes |
| `T14-36da9870` | T14 | 0/0 | 4/4 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T14-daeec4c7` | T14 | 0/0 | 4/4 | 0/0 | 0/0 | 0/0 | 2 | yes |
| `T15-c13c1899` | T15 | 0/0 | 2/2 | 0/0 | 0/0 | 0/0 | 0 | yes |
| `T15-7b61bfa7` | T15 | 0/0 | 2/2 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T16-30465962` | T16 | 0/0 | 5/5 | 0/0 | 0/0 | 0/0 | 0 | yes |
| `T16-6f6a0a0b` | T16 | 0/0 | 3/3 | 0/0 | 0/0 | 0/0 | 0 | yes |
| `T17-b0106418` | T17 | 1/1 | 6/6 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T17-5adf5cf4` | T17 | 0/0 | 2/2 | 0/0 | 0/0 | 0/0 | 0 | yes |
| `T18-21003367` | T18 | 1/1 | 3/3 | 0/0 | 0/0 | 0/0 | 0 | yes |
| `T18-2cb2cff0` | T18 | 1/1 | 4/4 | 0/0 | 0/0 | 0/0 | 3 | yes |
| `T19r-4dda475e` | T19r | 1/1 | 5/5 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T19r-07e9eee5` | T19r | 1/1 | 4/4 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T20r-0e767ca5` | T20r | 1/1 | 4/3 | 1/1 | 0/1 | 0/0 | 0 | **no** |
| `T20r-8145d0cb` | T20r | 1/1 | 0/0 | 0/0 | 0/0 | 0/0 | 0 | yes |
| `T21-cf45ec9d` | T21 | 1/1 | 3/3 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T21-b9dfba11` | T21 | 0/0 | 1/1 | 0/0 | 0/0 | 0/0 | 0 | yes |
| `T22-9c6d52d2` | T22 | 1/1 | 6/3 | 0/3 | 0/0 | 0/0 | 1 | **no** |
| `T22-13b9250c` | T22 | 1/1 | 2/2 | 0/0 | 0/0 | 0/0 | 2 | yes |
| `T23-c72d0312` | T23 | 1/1 | 4/4 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T23-68774ec3` | T23 | 1/1 | 2/2 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T24-18dd3ac5` | T24 | 0/0 | 6/6 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T24-a263cba6` | T24 | 0/0 | 3/3 | 0/0 | 0/0 | 0/0 | 1 | yes |
| `T25-4a4732a9` | T25 | 1/1 | 4/4 | 0/0 | 0/0 | 1/1 | 1 | yes |
| `T25-4e5d3663` | T25 | 1/1 | 2/2 | 0/0 | 0/0 | 0/0 | 1 | yes |

### What the table already shows, before any ruling

- **23 debates** where both graders agree the ground truth was detected.
- **1 debate** where the graders disagree about detection (item 1.1 above).
- **5 of the agreed detections rest solely on a defender-claimed finding** — ruling **R4** moves those.

**No S1/S2 verdict is computed here, by instruction.** The per-arm aggregation happens after your rulings, and it will be reported under whichever readings you choose — including both, where a ruling is genuinely arguable.

---

## 5. What the graders did, so you can weigh their scores

Every grader was told model attestation is not verification, and that agreement between the two debaters is not evidence. In practice they went further than the brief required, unprompted:

- **Re-running the archives themselves** rather than reading captured output — in several cases rebuilding the reviewed tree from the buggy SHA, and in one case building `redis-server` from source and verifying the tarball hash.
- **Applying the maintainer's patch to a scratch copy and re-running**, to test both directions: that the ground-truth probe flips, *and* that the additional findings survive — proving they are genuinely separate rather than second routes to the same defect.
- **Checking upstream HEAD** to see whether a finding is a live defect or long-standing code.

Two graders also caught defects in my own harness that I had missed: a staged tree that had drifted to contain the maintainer's fix, and arm labels surviving in machine-generated filenames. Both are recorded in `RUN-STATE.md` §0a and were fixed and re-graded before this file was produced.
