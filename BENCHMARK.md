# BENCHMARK.md — Pre-Registered Evaluation Specification

**Status:** FROZEN upon commit. This file must be committed to the project repository and its SHA-256 recorded below **before the first benchmark task is executed**, and no implementation change driven by benchmark results may occur before the freeze. No edits are permitted between the freeze and completion of the first full benchmark run. Any post-run amendment must be recorded in the Amendment Log with a rationale, and re-running under amended rules must be reported as a separate result, never merged with the frozen-run result. *(Wording amended per ChatGPT's implementation review, finding #4: the original "before the first line of runner code" condition was overtaken by events — the MVP was implemented alongside spec drafting. The binding constraint is freeze-before-first-run and freeze-before-results-driven-changes, which is what pre-registration actually protects.)*

**Purpose:** Answer the project's central empirical question, agreed by both parties in Rounds 3–5:

> Does structured adversarial review between two frontier models (Claude + Codex) produce measurably more **verified** unique findings than a single frontier model running an equally strong self-critique loop — at a false-positive rate and cost that justify the added complexity?

---

## 1. Experimental arms

Both arms review the identical task artifact under the identical protocol. The **only** independent variable is the identity of the critic.

**Arm A — Self-critique baseline (strong, by construction).**
Claude reviews the change using the *same* adversarial critique prompt, the *same* nine-field finding schema, the *same* evidence and support-level rules, and the *same* round structure (critique → rebut → revise → second critique → close) as the council. The critic role and the defender role are both played by Claude in separate, contextually isolated passes (the critic pass does not see the defender's private reasoning, only the artifact and the ledger). No weakened prompt, no unstructured "review this please" baseline.

**Arm B — Council Review mode.**
Identical protocol; the critic is Codex (via the council plugin), the defender is Claude. Runner, ledger, schema, and round cap identical to Arm A.

**Constraint:** Prompts for the two arms may differ only in unavoidable role references ("you are reviewing another model's defense" vs. "your own prior defense"). A diff of the two prompt files must be included in the benchmark report.

## 2. Task set

**Size:** 25 tasks. **Source:** curated real bugs from public open-source repositories with known ground truth (the bug was later fixed by the maintainers).

**Task construction.** For each task: check out the repository at the commit where the bug was present; the artifact under review is the diff of the change that *introduced* the bug (or, where the introducing commit is impractically large, a scoped slice of ≤500 changed lines containing it). The ground-truth defect is defined by the maintainer's subsequent fix commit and/or linked issue. Reviewers receive the repo checkout and the diff — never the issue, the fix, or any hint of the bug's existence.

**Selection criteria (all required):**
1. The fix commit and/or issue documents a concrete, verifiable defect (not a style change or refactor).
2. Bug class falls in the agreed attack surface: concurrency/races, error/retry/partial-failure handling, boundary and null/empty-state defects, resource leaks, auth/permission checks, data-integrity/idempotency, or injection-class security flaws. Target distribution: no single class exceeds 6 of 25 tasks.
3. Diff size between 30 and 500 changed lines.
4. Language: JavaScript/TypeScript or Python (≥8 tasks each).
5. Fix committed on or after 2025-07-01, to reduce (not eliminate) the chance the fix is in either model's training data. Residual contamination risk is acknowledged and reported per-task (fix date recorded).
6. Repository is not so prominent that the specific bug is plausibly memorized (excluded: bugs with CVEs, bugs discussed in widely-circulated postmortems).

**Task list freeze:** the 25 selected tasks (repo, commit SHA, artifact diff spec, ground-truth fix SHA) are appended to this file as Appendix A *before* the freeze commit. Task selection is performed by Claude, reviewed by ChatGPT, and approved by Michael — selection disputes are resolved before freezing, not after.

## 3. Metrics

Per task and per arm:

1. **Ground-truth detection (primary).** Did any finding identify the known defect? Graded strictly: the finding must name the failing mechanism at the correct location, not merely gesture at the right file. Graded independently by both models *after* both arms complete (graders see finding + ground-truth fix; grading disagreements resolved by Michael).
2. **Verified additional findings.** Findings other than the ground-truth defect count only if verified: a failing test, a demonstrable repro, or Michael's explicit confirmation. Model attestation is not verification.
3. **False positives.** Findings that verification disproves, or that assert behavior contradicted by the code. Reported as a rate per task.
4. **Unsupported findings.** Findings mechanically marked `unsupported` by the runner (no checkable evidence). Reported separately; excluded from both verified and false-positive counts.
5. **Cost.** Total tokens and wall-clock per task per arm.
6. **User preference (secondary).** On a 10-task random subset, Michael blind-ranks the two arms' final verdicts (arm labels stripped).

## 4. Success criteria (pre-registered)

The council (Arm B) is judged worth its complexity if, over the 25 tasks:

- **S1:** Arm B's ground-truth detection count exceeds Arm A's by ≥ 20% relative (e.g., 12 vs. 10), **and**
- **S2:** Arm B's false-positive rate does not exceed Arm A's by more than 5 percentage points, **and**
- **S3:** Arm B's median per-task cost is ≤ 3× Arm A's.

Secondary signal (reported, not gating): verified additional findings and blind user preference.

**Pre-registered interpretations:** S1 fails → adopt ChatGPT's stated fallback: simplify the architecture; the council does not proceed to Solve/Challenge modes; self-critique mode ships instead. S1 passes but S2 fails → the council's extra findings are noise dressed as rigor (the Round 4 highest-risk assumption realized); tighten evidence enforcement and re-run once under an amendment before any expansion. All pass → Phase 2+ proceeds.

## 5. Procedure

1. Freeze this file (commit + record SHA-256 below). 2. Implement the MVP per SPEC.md. 3. Run all 25 tasks through both arms, interleaved A/B order per task (coin-flip recorded) to neutralize drift from plugin fixes mid-run; implementation bugs discovered mid-run may be fixed, but affected tasks are re-run in both arms and noted. 4. Grade per §3. 5. Publish the report: per-task table, aggregate metrics, S1–S3 verdicts, prompt diff, contamination table, and every ledger file as an artifact.

## 5a. Per-task run checklist (frozen with this document)

Every benchmark task, in both arms, must satisfy all items before its result counts. A task run with any unchecked item is voided and re-run.

```
□ Fresh checkout of the task repo at the buggy SHA (no state reused from prior tasks)
□ BENCHMARK.md SHA-256 matches the hash recorded in the freeze commit
□ Council plugin at the pinned commit; protocol test suite passes; no local modifications
□ Model identifiers recorded: Claude model ID + Codex model/CLI version — same pair for every task in the run
□ Prompt files byte-identical to the frozen package (directory hash recorded once per run)
□ Runner defaults unchanged (round cap 3; no env overrides except COUNCIL_MOCK_CRITIQUE for Arm A)
□ Identical timeout policy across arms
□ Arm order for this task follows the pre-recorded coin-flip schedule (§5)
□ Same machine and environment for both arms of a task; machine recorded once per run
□ Full debate directory (ledger.json, debate.json, verdict.md, rebuttals) archived per task per arm
□ Verdict graded by a human per §3 before any implementation change is made
```

Note on sampling parameters: temperature and sampling settings are not user-controllable through the Claude Code and Codex CLI subscription surfaces used here; the checklist therefore pins what is controllable (model identifiers, prompts, runner config, environment) and records versions so any provider-side change is at least attributable.

## 6. Freeze record

- Freeze commit SHA: `<recorded at commit time>`
- File SHA-256: `<recorded at commit time>`
- Approved by: Michael Traw ☐  Claude ☐  ChatGPT ☐

## Amendment Log

*(empty at freeze)*

## Appendix A — Task list (curated 2026-08-07; amended per ChatGPT pre-freeze audit, same date; Michael's approval pending before freeze)

**Artifact spec (uniform):** for each task, check out the repo at the **buggy SHA** (the fix commit's parent). The artifact under review is the file(s) changed by the fix commit, at the buggy SHA, sliced to the enclosing scope (function/class/module) containing the defect, subject to §2's 30–500 changed-line window — enforced mechanically at extraction; a task that cannot satisfy the window is replaced from the alternates and recorded. Reviewers never see the fix commit, its message, or the linked issue. **Ground truth** is the fix commit.

**Pre-freeze substitution record (ChatGPT audit, contamination claims independently CVE-verified by Claude):** original T19 (undici `84235c62e0fe`) struck — CVE-2026-1528 (undici WebSocket 64-bit length overflow, GHSA-f269-vfmq-vjvj). Original T20 (ws `a2f4e7c046c2`) struck — CVE-2026-48779 lineage (ws fragment memory-exhaustion DoS, GHSA-96hv-2xvq-fx4p). Alternate A02 (undici `74495c63ab23`) excluded from the pool — CVE-2026-1525 (undici duplicate Content-Length request smuggling, GHSA-2mjp-6q6p-2qxm). Replacements promoted from screened alternates: T19r (pino, injection) and T20r (sqlalchemy, injection). T25 reclassified data-integrity → resource-leak (capacity restoration, not corruption). T03 relabeled race → concurrency; class caps apply to the §2 family "concurrency/races" so the relabel cannot relax the cap.

**Screens applied:** fix date ≥ 2025-07-01; canonical commits only, no backport duplicates; CVE/advisory screen run by both curator and auditor; class-family caps satisfied (boundary-null 4, concurrency/races 6, data-integrity 1, error-retry 6, injection 2, resource-leak 6 of 25); languages: 13 Python, 12 JS/TS.

### Primary tasks (25)

| id | repo | class | lang | fix date | fix SHA | buggy SHA | subject |
|---|---|---|---|---|---|---|---|
| T01 | aiohttp | race | py | 2026-06-02 | `4eb358863b37` | `4ef04d66fa45` | fix(connector): resolve race condition in TCPConnector.close() (#12787) |
| T02 | redis-py | race | py | 2026-01-05 | `c3895217eab1` | `d2113afaebeb` | Fixed potential race condition between call_later() and run_forever() (#3897) |
| T03 | redis-py | concurrency | py | 2025-12-17 | `920532122840` | `0406e85e77c5` | Fix async connection pool lock contention during connection establishment (#3885) |
| T04 | undici | race | js | 2026-06-07 | `c07a438defe4` | `a8ea6f285a92` | fix: prevent race condition between onEnd and onTrailers in HTTP/2 client (#5216) (#5343) |
| T05 | undici | race | js | 2026-02-05 | `9cc025b13292` | `fc8bb7553827` | Fix clientTtl cleanup race (#4807) |
| T06 | bullmq | race | js | 2025-12-01 | `a8b9d76496af` | `17004b71766e` | fix(stalled): prevent lock errors while job is not longer in active state (#3579) |
| T07 | aiohttp | error-retry | py | 2026-02-22 | `0e2d3ec48a95` | `dc85b4c41839` | Fix server hang on chunked transfer encoding size mismatch (#12119) |
| T08 | aiohttp | error-retry | py | 2026-06-19 | `5c293f4f71f6` | `7b0b01350ce8` | Fix read timeout on a connection returned to the pool (#12954) |
| T09 | redis-py | error-retry | py | 2026-04-02 | `393c8f7b35c9` | `e054f089652b` | Fix CacheProxyConnection hang when invalidation arrives on another connection (#3600) (#40 |
| T10 | undici | error-retry | js | 2026-05-07 | `397bc13d7194` | `204740c3cdba` | fix(retry-handler): validate response body length against Content-Range (#4975) |
| T11 | undici | error-retry | js | 2026-07-29 | `c0e7676c5b63` | `57f50a278b86` | fix(retry): skip the content-length checkpoint for HEAD and for a 206 without content-rang |
| T12 | ioredis | error-retry | js | 2026-07-29 | `6455dbe6c7db` | `9618206b93d7` | fix: clear stale socket timeout on reconnect (#2148) |
| T13 | celery | resource-leak | py | 2026-06-24 | `4a11650b1150` | `aef7f130e3ca` | Redis ResultConsumer: clean up leaked _pending_messages after on_wait_for_pending (#10366) |
| T14 | fastify | resource-leak | js | 2026-06-19 | `8b9c07b645a8` | `9d2914857906` | fix: clear socket._meta after response to prevent keep-alive leaks (#6799) |
| T15 | undici | resource-leak | js | 2026-06-05 | `313f4e016899` | `2f66db7322f4` | fix(fetch): remove abort listener when request settles (#5318) |
| T16 | redis-py | resource-leak | py | 2026-07-07 | `7db7118ee665` | `b121809bd7c7` | fix: detect server-closed pooled connection in can_read (RESP3 + hiredis) (#4156) |
| T17 | aiohttp | resource-leak | py | 2025-07-09 | `e38220fc4ed5` | `9b0153c14a21` | Fix ClientSession.close() hanging with HTTPS proxy connections (#11289) |
| T18 | undici | boundary-null | js | 2025-10-26 | `0c61d52393f5` | `b958ea069b9a` | fix: fetch blob with range off-by-one error (#4643) |
| T21 | aiohttp | boundary-null | py | 2026-07-08 | `fe353185eb5c` | `4416d89e73f4` | Fix IndexError in parser on edge case (#13001) |
| T22 | bullmq | boundary-null | js | 2026-07-10 | `418de1e51db0` | `a7dca4b51889` | fix(job): enforce priority max of 2^21-1 to preserve FIFO at the boundary (#4261) |
| T23 | fastapi | boundary-null | py | 2025-12-02 | `d68c066246c9` | `c3373205d03a` | 🐛 Fix support for form values with empty strings interpreted as missing (`None` if that |
| T24 | ioredis | data-integrity | js | 2026-07-16 | `08c89671790d` | `09ef5a4ec0c6` | fix(cluster): recreate stale connection on circular MOVED (#2135) |
| T25 | redis-py | resource-leak | py | 2026-07-17 | `614df572b92c` | `507a9604544b` | Fix Sentinel pool capacity loss after failover (#4193) |
| T19r | pino | injection | js | 2026-07-16 | `44f983e0a52b` | `98d8fa4d95f1` | fix: escape child binding keys (#2452) |
| T20r | sqlalchemy | injection | py | 2026-07-21 | `dbf2f9583b67` | `10cdc38ccf03` | escape single quotes in postgresql nextval() identifier rendering |

### Alternates (4) — substituted only for documented construction failure, recorded in the Amendment Log post-freeze or in this section pre-freeze

| id | repo | class | lang | fix date | fix SHA | buggy SHA | subject |
|---|---|---|---|---|---|---|---|
| A01 | celery | data-integrity | py | 2026-06-03 | `066e96e01c3e` | `90e2a13cbe2d` | Fix worker consuming unexpected queues after connection loss (#10335) |
| A05 | celery | race | py | 2026-06-10 | `d4eb32a78171` | `74a7a63bb484` | Fix free worker stalling after broker reconnect (AsynPool.flush clearing _busy_workers) (# |
| A06 | fastify | boundary-null | js | 2026-03-28 | `8dee9be05ebf` | `d457aeda8611` | fix: restore trustProxy function for number and string types, add null check for socketAdd |
| A07 | ioredis | boundary-null | js | 2026-07-16 | `a3f9f2dded99` | `08c89671790d` | fix(sentinel): preserve zero preferred slave priority (#2129) |
