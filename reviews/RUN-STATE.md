# RUN-STATE.md — live handoff recap for the frozen benchmark run

**Purpose.** This file is the resumption anchor. If the orchestrator's context is compacted or the session restarts, reading this file plus `reviews/BENCHMARK-AMENDMENTS.md` is sufficient to resume losslessly. **Trust disk over memory.** Update this file after every task closes.

**Last updated:** 2026-08-12, during the **T17–T20r construction batch**. See §0.

---

## 0. RESUME HERE

**T01–T16 are closed, both arms.** The T12–T16 batch is fully closed out — usage collected (31/31 and 11/11 captured, 0 missing), S3 computed, `reviews/BATCH-T12-T16.md` written and committed.

### In flight (2026-08-12)

**No debate is open.** The batch is in **construction**, step 2 of §3.

- **Frozen-invariant gate re-verified** this session: all six frozen hashes OK, plugin at `f976990` and clean, protocol suite **46/0**, harness schema suite **69/0**.
- **All nine buggy SHAs verified** as their fix commit's parent, dates matching Appendix A. One note: **T20r's fix has author date 2026-07-21 and committer date 2026-07-22**; Appendix A records 2026-07-21. The other eight fixes have identical author and committer dates, so Appendix A's convention is the **author** date and T20r matches under it. The ≥2025-07-01 screen holds under either date. Recorded, not a conflict.
- **Seats minted:** 46 for this batch (9 constructors + 36 reviewer seats + 1 contamination auditor), plus 2 audit seats (`Q001-c12-isolation-audit`, `Q002-c8-dependency-screen`). All verified empty before use, no duplicate directory anywhere in the map (Q-001 condition 7). Map now holds 95 entries.
- **`_rerun2/usage-roster-T17-T20r.json` opened**, with each agent id recorded **at spawn time**.
- **Construction complete, all nine.** Every constructor reported `OK` and `FULLY CONTAINED`, each with its own syntax check re-run and eight self-verifications.

| task | repo | lines | ranges | slice | syntax check |
|---|---|---|---|---|---|
| T17  | aiohttp    | 242 | 3 | subset | `py_compile` PASS |
| T18  | undici     | 197 | 1 | subset | `node --check` PASS |
| T21  | aiohttp    |  97 | 1 | subset | `py_compile` PASS |
| T22  | bullmq     | 358 | 3 | subset | TS compiler API, 0 syntactic diagnostics |
| T23  | fastapi    |  65 | 2 | subset | `py_compile` PASS |
| T24  | ioredis    | 315 | 3 | subset | TS compiler API, 0 syntactic diagnostics |
| T25  | redis-py   | 289 | 2 | subset | `py_compile` PASS |
| T19r | pino       | 134 | 1 | subset | `node --check` PASS |
| T20r | sqlalchemy | 134 | 5 | subset | `py_compile` PASS |

- **Scrub PASS 26/0 ×9** (`--forbidden-sha` asserting the fix commit does not resolve inside each checkout), exclusion policy v2, declared limitation present in every manifest.
- **Staging PASS 16/0 ×9.** Each staged repo shows exactly one changed path, 0 deletions, and an added-line count equal to that task's artifact line count.
- **Contamination audit: ALL CLEAR.** 135/135 checks, **all nine FULLY CONTAINED**, 0 leaks, 0 extra sidecar keys, 0 stray files, no mutated clone. Containment holds under both the literal hunk-header reading and the strict changed-lines-only reading; the auditor applied a stricter both-anchors rule to the seven pure insertions across four tasks and all pass. Every syntax check was re-run by the auditor with a negative control proving the checker fires. Deliverables in seat `T17-T20r-contam-audit`.
- **Q-001 condition-12 isolation audit of T07–T11:** still running (seat `Q001-c12-isolation-audit`).
- **T01–T06 staging re-verified** as still valid under current policy: PASS 16/0 ×6, one changed path and 0 deletions each. **24 fresh Q-001 re-run seats minted** as `T0N-Q001rerun-<arm>-<role>`, verified empty, globally unique. Map now 119 entries.

### Dependency facts already in hand (feed the Q-002 screen; do not re-derive from memory)

The contamination auditor ran the cross-task matrices over all 25 tasks:

- **Same repo + same source path:** T01/T17, T07/T21, T09/T25, T10/T11, T15/T18. No pair shares a buggy SHA.
- **Overlapping artifact ranges:** **T01/T17 (partial)**, T10/T11 (total). T10/T11 was the named positive control and it fired, validating the method.
- **Fix already present in the other task's tree** (fix-owner → tree-owner): T17→T01, T17→T21, T07→T21, T07→T01, T07→T08, T08→T21, T18→T15, T18→T04, T18→T10, T18→T11, T09→T25, T02→T25, T16→T25, T24→T12, T06→T22, T05→T10, T05→T11, T05→T15, T04→T11, T10→T11.
- Going past its brief, the auditor content-tested the five same-path pairs for whether the later artifact **actually displays** the earlier fix: **T10/T11 yes, in full**; the four pairs touching the nine — **no disclosure**.

**This means Q-002 condition 10 is engaged: dependent components exist beyond T10/T11** (T01/T17 overlap the same file's ranges partially). Condition 10 pauses **grading**, not running, and requires one uniform component-level sensitivity rule submitted for review rather than pair-by-pair improvisation. Plan: run the dedicated Q-002 condition-8 screen (seat `Q002-c8-dependency-screen`) to produce the formal matrix independently, **then** consult once with complete data. Do not improvise a rule.

**Next actions, in order:** run the nine in schedule order (§3.2) → Q-001 T01–T06 re-run → Q-002 dependency screen → consult on the uniform component rule → S3 → `READY-TO-GRADE.md`.

### T17 — in flight

Arm A first (schedule byte 136). Debate `dbt-2026-08-12-b176f1`. Round 1 critic spawned; phase `awaiting-critique`. Arm B not yet initialized.

**Note on where run state lives:** `/Users/michaeltraw/Dev/council-bench` is **not** a git repository. Only `reviews/` in the marketplace repo is committed; the artifacts, staged repos, scrubbed checkouts, seats and usage payloads live on disk outside version control. "Commit after each task" therefore means committing this file and the batch records.

Source clones are all present: `T01`(aiohttp), `_src-redis-py`, `_src-undici`, `_src-bullmq`, `_src-ioredis`, `_src-celery`, `_src-fastify`, `_src-pino` (T19r), `_src-sqlalchemy` (T20r), `_src-fastapi` (T23). **No clone work is owed.**

Helper scripts were recreated this session in the session scratchpad (**not committed**): `armlib.sh` (§3.1), `mkbrief.mjs`, and the brief templates `BRIEF-CONSTRUCT.tmpl` / `BRIEF-CRITIC-A.tmpl` / `BRIEF-DEFENDER.tmpl`. Recreate from §3.1 and §7 if the scratchpad is gone.

To pick up mid-task at any point, run `arm_cp <task> <arm>` (recreate `armlib.sh` from §3.1 first if the scratchpad is gone) and read `phase`:

| phase | what is owed |
|---|---|
| `awaiting-critique` | Arm A: `arm_prompt_A` → spawn critic → it writes `critique-mock-r<N>.json` → `arm_inject_A`. Arm B: `arm_critique_B` |
| `awaiting-rebuttal` | spawn the defender subagent → it writes `rebuttal-r<N>.json` → `arm_rebut` |
| `ready-to-close` | `arm_close`, then `arm_clean_check` |
| `closed` | init the second arm; once both exist, `arm_context_match` must print `CONTEXT MATCH` |

**After the nine tasks, in order:** the three ordered remediation items in §5 (Q-001 T01–T06 re-run, Q-001 condition 12 audit of T07–T11, Q-002 condition 8 dependency screen) → final S3 → `reviews/READY-TO-GRADE.md`. **Do not begin grading.**

**Record each agent id in the batch roster as the subagent is spawned** (`_rerun2/usage-roster-T17-*.json`), rather than reconstructing later. The T12–T14 roster had to be rebuilt from transcript timestamps; it worked and is exhaustive, but it cost time that recording at spawn does not.

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
| T13 | **closed** | B: 3 rounds, 5 findings (codex 2, claude 3), all accepted, 2 high/3 med, NO-SHIP. A: 3 rounds, 6 findings (codex 4, claude 2), all accepted, 1 high/4 med/1 low, NO-SHIP. 0 flags both arms |
| T14 | **closed** | A: 3 rounds, 4 findings (codex 3, claude 1), 2 accepted + 2 partially-accepted, 2 crit/2 high, NO-SHIP. B: 3 rounds, 4 findings (codex 2, claude 2), 3 accepted + 1 partially-accepted, 3 high/1 med, NO-SHIP. 0 flags both arms |
| T15 | **closed** | First Arm A attempt VOIDED under A-004 (schema asymmetry); restarted with fresh seats. A: 1 round, 3 findings (codex 3), all accepted, 1 high/1 med/1 low, NO-SHIP. B: 1 round, 1 finding (codex 1), accepted, 1 high, NO-SHIP. 0 flags both arms; both trees intact |
| T16 | **closed** | B: 1 round, 3 findings (codex 3), all accepted, 1 high/2 med, NO-SHIP. A: 3 rounds, 5 findings (codex 5), all accepted, 3 high/2 med, NO-SHIP. 0 flags both arms; both trees intact |
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
T13 `b9083bd17d82d418114f9a54693b8e293beaa59856a4c6a343538906b48e9cc4` ·
T14 `8ca3e62e0f683d8f9c210c441a690339b25845bc3232c7b68735b211fc0959ae` ·
T15 `d71aa61375ec4adbb7ee23d0819de4227f1ec57ba905e62cc58d4d753b43d990` ·
T16 `bdcadb48549621c45bbd1235687043abd420159574500558619366828e10ec93`

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
- `arm_inject_A <task> <round>` — **schema-gated** via `bench/inject-armA.mjs` (A-004). Exit 0 injected; exit 1 invalid, one correction permitted, bounce the error list back to the same critic seat; exit 3 second invalid submission, critic step aborts. Validation precedes the runner call, so an invalid message cannot mutate the ledger. Rejected payloads and error reports are archived to `_rerun2/_rejected/<arm>/`, outside any directory reviewers read.
- `arm_rebut <task> <arm> <round>` · `arm_close <task> <arm>` · `arm_clean_check <task> <arm>`.

### 3.2 Arm order (pre-recorded, `bench-schedule.json` — never deviate)

B-first: T01, T02, T05, T07, T09, T10, T13, T16, T18, T21, T22, T23, T24, T19r, T20r
A-first: T03, T04, T06, T08, T11, T12, T14, T15, T17, T25

---

## 4. Invariants and gates (§5a, checked per task)

- `BENCHMARK.md` sha256 = `72d09391d09a91db1083420b293968c8c5c87d3ee3ead92ad0af00734557562f` — **never edit this file.**
- Plugin pinned at `f976990`, no local modifications; protocol suite **46 passed, 0 failed**.
- Codex CLI `0.147.0`; Anthropic `claude-opus-5`; OpenAI `gpt-5.6-sol`.
- Both arms' `context.md` **must hash identically**. Framing: the file `bench/framing/review-window.txt` hashes to `63a64714bdf75511421b8870dfdbf83e541b28391ad7ca92db938ef6c47a22df`, and every debate's `debate.focus` — that same text with the trailing newline stripped, which is what `init` stores — hashes to `f96421a87c29ea7ca08d2881258c349d5de3df363f8f3d62a61faf9ea1cfd07b`. **Both values must be checked; they are different hashes of the same frozen text.** Earlier revisions of this file recorded only the first and labelled it `focusSha256`, which is the field name of the second — a wording defect found on 2026-08-12 when the gate tripped on T17 Arm A. Verified at that point that T14, T15 and T16 carry `f96421a8…` in **both** arms, so the substantive invariant never moved; only this note was wrong.
- Arm A template `_prompts/critique-armA.md` differs from `prompts/critique.md` by exactly two role-reference lines.
- Round cap 3; no env overrides except `COUNCIL_MOCK_CRITIQUE` for Arm A, and that file is now **schema-gated** — never set it by hand, always go through `arm_inject_A` → `bench/inject-armA.mjs`.
- **A-004 harness freeze (verify before each task):** `bench/validate-critique.mjs` `8d196a4715f0f1b913f5ead3fd1e06bd08fda10cb6b298c40d0664ce7c07aa36`, `bench/inject-armA.mjs` `9006f6de740397ef5c470ae99e4a180238667d4245c8bbe5ed5681bb74457b5f`, `bench/test/harness-schema-tests.mjs` `be85f57ace244eefd689664daeb97eb89a433085b56108ede2996891a5cef52a`, schema `6e78ea61a2ddad2d43c70c5f12d05cf9f3043726676d4716de4b3e7f294fafd3`. Harness suite **69 passed, 0 failed**; plugin suite still **46 passed, 0 failed**. (The test file was re-frozen once on 2026-08-11 after a fixture correction; the two executable files have not moved. See A-004 condition 5.)
- Arm A critic gets **exactly one** format correction, sent back to the same seat, format-only — never a comment on finding quality, evidence strength, severity, or correctness. A second invalid message aborts the critic step.
- Debates run **strictly sequentially** — never two at once (wall-clock is a recorded metric).
- Orchestrator reads **control-plane only**: never finding text, never a verdict body, never the sidecar or construction record, never a staged repo's source.

---

## 5. Ordered work outstanding

Order is flexible but **all must complete before grading** (amended Sequencing, consult 006).

1. **T15, T16**, then **T17, T18, T21–T25, T19r, T20r**. (T12–T14 done.)
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
- **Protocol semantics (two stumbles so far — brief both sides explicitly).** The ledger's transition table for a claimant acting on its **own** contested finding (status `rejected` or `partially-accepted`) is:
  - `accept` → **withdrawn**, terminal, abandons the whole finding. Cost T11 Arm A two findings whose substance a defender had already accepted; the ledger retains the substance, the status field understates. There is **no** way to narrow a finding via `accept`.
  - `reject` or `partial` **with new checkable evidence** → **open (reopened)**. This is the only legal way to "reopen with corrected scope."
  - `reject` without new evidence → unchanged, dispute stands.

  T13 Arm A's round-2 defender tried to express a reopening by **filing a new finding under the original id**, which the runner refused as a duplicate id; its first correction filed a separate finding instead, which would have left the original sitting contested with a mistaken mitigation plus a near-duplicate superseding it in prose. Corrected to use the response mechanism. **Put the transition table in reviewer briefs**, not just the withdrawal warning.
- **A settled finding's fields cannot be amended.** T13 Arm A's closing defender concluded the recorded `confidence` on a settled finding understates it (0.75 vs an honest 0.9, severity unchanged) and found no legal mechanism to correct it — the ledger closes at the original figure with the disagreement in `notes` only. Graders should read `notes` alongside the fields.
- **zsh does not word-split unquoted parameter expansions.** Routing a probe's argument list through a single variable collapses it into one argv entry, which silently turns crash probes into false negatives — every probe reports survival. **Three seats hit this** (T14 Arm A rounds 1 and 2, and it is now a standing brief warning). Two had to invalidate and regenerate archives they had already written. Brief reviewers to pass arguments literally or use an array.
- **A reopening is not mechanically required to carry new evidence.** The runner's transition table expects `reject`/`partial` on your own contested finding to come with new checkable evidence, but T14 Arm B's critic reopened the same finding in rounds 2 **and** 3 citing only the defender's own prior outputs. Both times the defender produced fresh evidence rather than arguing from the record. Worth reporting as a gap between the documented expectation and what is enforced; do not assume a reopening means new evidence exists.
- **Fidelity variables are reviewer-dependent, and severity disputes can outlast mechanism agreement.** T14 closed with `partially-accepted` findings in **both** arms — the first task where disputes survived to close. Mechanism was agreed throughout in both; what persisted was impact and severity. Deciding evidence is recorded in every case.
- **The per-arm log directory is also a shared read surface**, disclosed by T16 Arm A's round-2 defender, which read one runner-produced artifact there that was not on its prescribed reading list. **Non-contaminating.** Everything in `_rerun2/T<NN>-arm{A,B}/` is derived from the debate itself — prompts, the two sides' messages, runner output, the debate id — and both seats already receive all of it through the ledger and `context.md`. **No ground truth lives there:** the sidecar, construction record, ranges file and sealed staging manifest are all in other directories. Like `repro/`, it is per-arm, so the channel is symmetric and A-vs-B is unaffected. Same disposition: recorded, layout left stable for the rest of the run.
- **The per-arm `repro/` archive is shared between that arm's critic and defender** — disclosed by T15 Arm A's round-1 defender, which listed its own output directory there and saw the critic's filenames. **Non-contaminating, and it does not bias A against B.** The two seats are the same task, the same arm and the same round; the defender already holds the critic's full claims and evidence through the ledger, which quotes those paths anyway, so filenames carry nothing the ledger does not. The defender rebuilt every experiment from prose and opened none of the scripts. Most importantly the channel is **symmetric across arms** — `_rerun2/T<NN>-arm{A,B}/repro/` are separate directories, and `arm_init` wipes the arm's log directory, so there is no cross-arm and no cross-task path. Left as-is for the rest of the run rather than re-scoped per seat: changing reviewer environment mid-run would introduce an inconsistency with T01–T14 for no contamination gain. Worth fixing in a future revision by giving each seat its own subdirectory.
- **The orchestrator hit the zsh word-splitting hazard it had been briefing reviewers about (2026-08-11).** Verifying that the `--overhead` addition left S3 untouched, it routed the command through a shell variable (`$S3`), which zsh delivered as a single argv entry; both captured files were empty and the diff **passed vacuously**. Caught by checking byte counts, then redone with the command written literally — S3 output confirmed byte-identical. Same failure mode that turned three reviewer crash probes into false negatives on T14. **Knowing about a hazard is not immunity to it.** General lesson worth carrying: a comparison that can pass on empty input needs a non-emptiness assertion, not just a diff.
- **Orchestrator read T14's sealed staging manifest (2026-08-11).** While reconstructing `armlib.sh` after a context restart, the orchestrator dumped the key/value structure of `_rerun2/_sealed/T14-STAGING.json` to work out how to write the tree-integrity check. That file is on the orchestrator's own do-not-read list (§4), and the dump disclosed T14's `sourcePath`. **Assessment: non-contaminating in effect but a real breach of the rule.** T14 was closed in both arms before the read, so no live debate could be influenced; a source path locates the reviewed slice, which reviewers see anyway, and does not disclose the defect; and the orchestrator does not grade. **Remedy:** `arm_clean_check` was written to compare the arm repo's diff against the *staged* repo's diff by hash and file count only, so it never opens a sealed manifest and never prints a path. No sealed manifest has been opened for T15 or later.
- **The runner's validation has now stopped three malformed messages at the boundary** — T03's stale-round refusal (previous batch), T13 Arm A's duplicate id, and T15 Arm A round 1, where the critic wrote `confidence` as the string `"high"` on all three findings instead of a number in [0,1] (it also carried three out-of-contract keys, which the validator does not police). In every case no invalid state entered the ledger and the phase was unchanged, so the debate resumed cleanly after correction. Worth reporting as evidence the neutral-runner design earns its cost. **Corrections are sent back to the same seat** — the orchestrator must never edit a reviewer's message itself, even for a purely mechanical field, and the correction instruction must say plainly that no claim, evidence, severity or support level may change.
- **Brief the output contract's field types, not just its shape.** The T15 stumble was a reviewer encoding a confidence *level* where the schema wants a probability. Reviewer briefs should state that `confidence` is a number in [0,1] and that findings carry no keys beyond those the contract names.

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
- **State the output contract's field TYPES, not just its shape** (added after A-004). Spell out that `evidence` is a single **string** — several pieces go into one string, not a list; that `confidence` is a **number in [0,1]**, not `"high"` and not `90`; that findings carry no key beyond the contract, so no `title`, `impact` or `suggested_fix`; and that the critic gets one correction before the step aborts. Tell them to parse their own file back and inspect the types before finishing.

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
