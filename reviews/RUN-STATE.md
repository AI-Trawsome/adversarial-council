# RUN-STATE.md — live handoff recap for the frozen benchmark run

**Purpose.** This file is the resumption anchor. If the orchestrator's context is compacted or the session restarts, reading this file plus `reviews/BENCHMARK-AMENDMENTS.md` is sufficient to resume losslessly. **Trust disk over memory.** Update this file after every task closes.

**Last updated:** 2026-08-10, after **T12 closed (both arms)**; T13 Arm B round 1 done.

---

## 1. Standing authority

The operator has authorized running to completion without check-ins, and authorized the orchestrator to use `/council:consult` directly whenever a ruling, countersign, or interpretation is needed. Questions are escalated to the operator **only** if GPT and the orchestrator deadlock on something the frozen rules cannot resolve.

**Only three valid stops:** (1) a frozen-rule conflict unresolvable even with a GPT ruling — stop and state it plainly; (2) usage-limit exhaustion — stop cleanly at a task boundary; (3) completion.

**Completion** = all 25 tasks run both arms under final isolation policy + all ordered re-runs and audits done + S3 computed + everything committed + `reviews/READY-TO-GRADE.md` written. **Do NOT begin grading** — grading requires the operator and stops there by frozen rule (BENCHMARK.md §3, §5a).

---

## 2. Current state

### Tasks complete (both arms closed, ungraded)

| task | status | note |
|---|---|---|
| T01–T06 | closed, **but superseded by order** | must be re-run under Q-001; see §5 |
| T07 | closed | Arm A voided once for shared-scratch exposure, re-run clean; `_rerun2/T07-armA-VOIDED/` preserved |
| T08–T11 | closed | first batch under per-seat isolation |
| T12 | **closed** | A: 3 rounds, 6 findings (codex 5, claude 1), all accepted, 1 crit/4 high/1 med, NO-SHIP. B: 1 round, 2 findings, both accepted, 2 high, NO-SHIP. 0 flags both arms |
| T13 | **Arm B in progress** | round 1 critique done (2 findings, 1 high 1 med), defender pending |
| T14–T16 | constructed, scrubbed, staged, audited — **not yet run** | ready to run |
| T17, T18, T21–T25, T19r, T20r | not started | 9 tasks remaining |

### T12–T16 construction (done, audited, staged)

| task | repo | buggy SHA | lines | ranges | syntax check | slice |
|---|---|---|---|---|---|---|
| T12 | ioredis | `9618206b93d7` | 499 | 3 | TS compiler API, 0 syntactic diagnostics | subset |
| T13 | celery | `aef7f130e3ca` | 499 | 1 | `py_compile` PASS | prefix |
| T14 | fastify | `9d2914857906` | 458 | 2 | `node --check` PASS | subset |
| T15 | undici | `2f66db7322f4` | 389 | 1 | `node --check` PASS | prefix |
| T16 | redis-py | `b121809bd7c7` | 330 | 1 | `py_compile` PASS | identity |

Audit: 0 contamination leaks, 55/55 verification checks, **all FULLY CONTAINED**, scrub PASS 26/0 ×5, staging PASS 16/0 ×5. No two share a source path.

### Staged context hashes (both arms must match)

T07 `b24a2fa5ae2796f9e0c02cc2b833f989fcc294ae28c66b0eee8623ff01d3c0fb` ·
T08 `f83daecb81e50d718b7f57f1800d179f00933377954623662134c3ab51b36ba3` ·
T09 `a753f1fd5fc097cfb73a08c5be8c1965af880ac3c48854834e2ef41e369b6284` ·
T10 `6e82179453b1769ed331c1a760555ca913750203b954d422c5971f8d7632bdfc` ·
T11 `f2af7b684478a483d9b94390b61ba0ca3c215cdecba72f2344a901213771dd0b` ·
T12 `5c855ad17c130e10ff7492f8bf39a890b0b7810f7d047ca26e3419dded072fea` ·
T13 `b9083bd17d82d418114f9a54693b8e293beaa59856a4c6a343538906b48e9cc4`

---

## 3. Per-task procedure

Working dir `/Users/michaeltraw/Dev/council-bench`; marketplace repo `/Users/michaeltraw/Dev/council-marketplace`.

Helper functions live in the session scratchpad as `armlib.sh` (**not committed** — recreate from §3.1 if lost).

1. **Verify** buggy SHA is the fix commit's parent and the fix date matches Appendix A.
2. **Construct** — one subagent per task, behind the contamination boundary. Emits `T<NN>-artifact/{ARTIFACT, T<NN>-RANGES.json, CONSTRUCTION-RECORD.md}`. Brief must forbid: quoting repository paths in its final message; reading any other task's artifact directory; reading any other scratch directory.
3. **Contamination audit** — one subagent sweeps all records, independently re-derives every sidecar property, re-runs syntax checks, **verifies defect containment** (fix hunks ∩ artifact ranges), and reports a same-source-path matrix.
4. **Scrub**: `node bench/make-scrubbed-checkout.mjs --repo <clone> --buggy-sha <sha> --out _scrubbed/T<NN> --task T<NN>`
5. **Audit scrub**: `node bench/audit-scrubbed-checkout.mjs --out _scrubbed/T<NN> --manifest _scrubbed/T<NN>-MANIFEST.json --repo <clone> --forbidden-sha <fixSha>` → expect PASS 26/0.
6. **Stage**: `node bench/stage-review-artifact.mjs --sidecar … --artifact … --scrubbed … --out _rerun2/T<NN>-staged --framing bench/framing/review-window.txt --sealed _rerun2/_sealed/T<NN>-STAGING.json`
7. **Audit staging**: `node bench/audit-staging.mjs --staged … --sealed … --artifact … --framing …` → expect PASS 16/0.
8. **Run scheduled arm first, then the second**, each in its own repo copy.
9. **Collect usage**, **compute S3**, **commit**, **update this file**.

### 3.1 armlib.sh essentials

- `arm_init <task> <arm>` — `rm -rf` arm repo+logs, `cp -R` from `_rerun2/T<NN>-staged`, then in the copy: `node council-runner.mjs init --scope working-tree --rounds 3 "$(cat bench/framing/review-window.txt)"`, writes `DEBATE_ID`.
- `arm_cp <task> <arm>` — `node bench/control-plane.mjs --repo … --debate …`. **The only permitted view of a live debate.**
- `arm_context_match <task>` — asserts both arms' `context.md` hash identically.
- `arm_critique_B <task> <round>` — Codex critic; stdout redirected to a file and **never read**.
- `arm_prompt_A <task> <round>` — builds the Arm A critic prompt via `bench/armA-prompt.mjs --template _prompts/critique-armA.md`.
- `arm_inject_A <task> <round>` — `COUNCIL_MOCK_CRITIQUE=<logs>/critique-mock-r<N>.json node council-runner.mjs critique`.
- `arm_rebut <task> <arm> <round>` · `arm_close <task> <arm>` · `arm_clean_check <task> <arm>`.

### 3.2 Arm order (pre-recorded, `bench-schedule.json` — never deviate)

B-first: T01, T02, T05, T07, T09, T10, T13, T16, T18, T21, T22, T23, T24, T19r, T20r
A-first: T03, T04, T06, T08, T11, T12, T14, T15, T17, T25

---

## 4. Invariants and gates (§5a, checked per task)

- `BENCHMARK.md` sha256 = `72d09391d09a91db1083420b293968c8c5c87d3ee3ead92ad0af00734557562f` — **never edit this file.**
- Plugin pinned at `f976990`, no local modifications; protocol suite **46 passed, 0 failed**.
- Codex CLI `0.147.0`; Anthropic `claude-opus-5`; OpenAI `gpt-5.6-sol`.
- Both arms' `context.md` **must hash identically**; framing `focusSha256` must equal `63a64714bdf75511421b8870dfdbf83e541b28391ad7ca92db938ef6c47a22df`.
- Arm A template `_prompts/critique-armA.md` differs from `prompts/critique.md` by exactly two role-reference lines.
- Round cap 3; no env overrides except `COUNCIL_MOCK_CRITIQUE` for Arm A.
- Debates run **strictly sequentially** — never two at once (wall-clock is a recorded metric).
- Orchestrator reads **control-plane only**: never finding text, never a verdict body, never the sidecar or construction record, never a staged repo's source.

---

## 5. Ordered work outstanding

Order is flexible but **all must complete before grading** (amended Sequencing, consult 006).

1. **Finish T12** (Arm B), then **T13–T16**, then **T17, T18, T21–T25, T19r, T20r**.
2. **Q-001 re-run: both arms of T01–T06** under per-seat isolation. Twelve binding conditions in `BENCHMARK-AMENDMENTS.md` §Q-001. Supersede the twelve existing debates as `VOIDED`; original arm order; fresh everything; usage excluded from S3 and reported as **remediation overhead**.
3. **Q-001 condition 12: audit T07–T11** against the final isolation policy. Must test *actual* cross-task exposure, not assume it benign. Opaque seat names → recordable deviation; descriptive filename/content → re-run rule.
4. **Q-002 condition 8: dependency screen across all 25 tasks** — identity slices, overlapping ranges, ancestor/descendant commits, fixes present in another task's buggy tree, follow-up/superseding fixes. Auditor exposes only a matrix. If more dependent components found, **pause and consult** for one uniform rule.
5. **Compute S3** over everything; write `reviews/READY-TO-GRADE.md`.

---

## 6. Recorded exposures and deviations (must appear in batch records)

- **Q-001 shared scratch** — T01–T06 and T07 Arm A. Remedy ordered; see §5.2.
- **T07 Arm A round-2 critic** listed `_scratch/` parent — three structural seat names, same arm/task. Non-contaminating; naming now opaque.
- **T08 Arm A defender** listed `_scratch/` parent — one opaque sibling name. Non-contaminating.
- **T15 constructor** listed `_scratch/` parent — opaque names only; constructors sit behind the boundary.
- **T12 constructor read T11's artifact directory** — exposure `SIDECAR FIELDS`. Non-contaminating: T11 already closed, different repositories (ioredis vs undici), constructors do not review. Caused by a brief gap; the clause is now standard.
- **T12 Arm A round-1 critic named a repository source path** in its final message, breaching the control-plane rule. Same class as the T01 and T03 exposures — locates the slice, which reviewers see anyway, not the defect. Closing instruction has been strengthened to name the failure mode explicitly (status lines, quoted commands, sweep results, "in passing").
- **Fidelity variables can be reviewer-dependent.** On T12 the Arm A critic and defender initially reported incompatible suite-runnability results; the round-2 critic re-established it and corrected its own round-1 note. Record fidelity per reviewer, not as one fact per task.
- **Protocol semantics:** a claimant responding `accept` to its **own** contested finding is recorded as abandoning it entirely (`withdrawn`), not narrowing it. Cost T11 Arm A two findings whose substance a defender had accepted; the ledger retains the substance, the status field understates. Brief critics about this explicitly.

---

## 7. Reviewer brief requirements (learned the hard way — keep all of these)

- Private per-seat scratch dir, opaque name, from `_seatmap/SEAT-MAP.json` (**kept outside `_scratch/`** so a listing cannot decode it). Seats are per-(task, arm, role), reused across rounds — critic and defender must stay separate per §1.
- **A directory listing is a read.** No reading/listing/globbing/`cd`-ing any other scratch or temp dir, and no listing its parent. Find an interpreter by querying candidate names, not by listing directories.
- Ledgers quote absolute paths into other seats' scratch — reviewers may see the strings but **must not follow them**; rebuild experiments from prose so agreement is corroboration, not an echo.
- The harness mirrors backgrounded command output to a system temp path — **kill and re-run** capturing locally rather than reading the mirror.
- Redirect `TMPDIR`, `PYTHONPYCACHEPREFIX`, pytest basetemp/cache, pip cache, `npm_config_cache`. Set the bytecode prefix **before the first import**.
- **Network is permitted for dependency installation only** — never to look anything up. Changelog/release-note fragments inside the checkout are off-limits.
- Node projects: `npm install` inside the checkout is forbidden; install to scratch + `NODE_PATH`, or use a scratch copy — **state which**, and print `require.resolve` at runtime.
- Final message: control-plane only, **no repository path, file name, directory name, or symbol name**, and an explicit statement about foreign scratch directories.
- Final-round briefs: warn that a new finding cannot be adjudicated and closes as unresolved risk; require deciding evidence for anything closing disputed.

---

## 8. Archive layout

```
_rerun2/T<NN>-staged/                  staged review repo
_rerun2/T<NN>-arm{A,B}-repo/           per-arm working copies
_rerun2/T<NN>-arm{A,B}/                control-plane logs, debate/, repro/, verdict.md
_rerun2/T07-armA-VOIDED/               voided pre-isolation run (preserved)
_rerun2/_sealed/T<NN>-STAGING.json     sealed manifests (locating; never read by orchestrator)
_rerun2/claude-usage-*.json            raw usage payloads
_rerun2/usage-roster-*.json            invocation → task/arm/role/round
_scrubbed/T<NN>/, _scrubbed/T<NN>-MANIFEST.json
T<NN>-artifact/{ARTIFACT, CONSTRUCTION-RECORD.md, T<NN>-RANGES.json}
_scratch/s<12-hex>/                    per-seat reviewer scratch (opaque)
_seatmap/SEAT-MAP.json                 seat → dir map (outside _scratch by design)
```

Source clones: `T01` (aiohttp), `_src-redis-py`, `_src-undici`, `_src-bullmq`, `_src-ioredis`, `_src-celery`, `_src-fastify`. Still needed: pino (T19r), sqlalchemy (T20r), fastapi (T23).

---

## 9. Batch records written so far

`reviews/PILOT-T01.md`, `RERUN-T01.md`, `RERUN-T01-v2.md`, `BATCH-T02-T06.md`, `BATCH-T07-T11.md`, plus `BENCHMARK-AMENDMENTS.md` (index), `CLAUDE-QUERY-018-*`, `CHATGPT-RULING-019-*`.

Next to write: `BATCH-T12-T16.md`, then subsequent batch records, then `READY-TO-GRADE.md`.
