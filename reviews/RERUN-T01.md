# RERUN-T01 — T01 under the final scoring configuration

**Task:** T01 · aiohttp · buggy SHA `4ef04d66fa45` · ground-truth fix SHA `4eb358863b37`
**Date:** 2026-08-08 · **Status:** both arms run and closed; **ungraded**
**Supersedes:** the pilot runs in `reviews/PILOT-T01.md` §6, per R-001

This is the first task run under the configuration the scoring run will use: repaired token capture (A-001), scrubbed full checkout (A-002), agent-instruction exclusion policy v2 (A-002-E1), and the isolation design in `reviews/PILOT-T01.md` §2. Arm order follows the pre-recorded draw — T01 byte 51 → **B first, then A**.

Nothing here is a result. Ground-truth detection is ungraded, and that is the primary metric.

---

## 1. Configuration

| | |
|---|---|
| BENCHMARK.md | `sha256 72d09391d09a91db1083420b293968c8c5c87d3ee3ead92ad0af00734557562f` — verified, byte-identical to the freeze |
| Plugin pin | `f976990bd23a639caf680e112d969200946c1245` (repinned from `70ccee1`; see that commit) |
| Protocol suite | 46 passed, 0 failed |
| Prompt package hash | `d0f31db6840ef6fe5410d018320a58a35e33172e11cc17c01efb16843dc49473` |
| Arm A critic template | `_prompts/critique-armA.md` — two-line role-reference diff from the Arm B template, reproduced in `PILOT-T01.md` §6.2 |
| Models | Defenders and Arm A critic: `claude-opus-5[1m]`. Arm B critic: `codex-cli 0.147.0`, model unpinned (CLI default) |
| Machine | macOS 26.5.2, arm64, node v25.6.1 |
| Round cap | 3, runner defaults otherwise; only `COUNCIL_MOCK_CRITIQUE` set, and only for Arm A |

## 2. How the artifact was staged

The scrubbed checkout and the artifact slice pull in different directions: A-002 gives reviewers a full checkout, Appendix A defines the artifact as a 30–500 line slice, and the consult ruling asks for "a scrubbed buggy-SHA checkout **plus** the frozen review diff/artifact". A repository whose only content is the buggy tree cannot produce a diff at all — there is nothing to diff against.

`bench/stage-review-artifact.mjs` resolves it: the base commit holds the buggy tree with the artifact's own lines elided, and the working tree holds the faithful buggy tree. `git diff` is then exactly the artifact slice, presented as the change under review, while every other file is present and correct for context.

```
scrubbed checkout : 446 files, 4 exclusions, audit PASS on 26 checks, import c79d98ca…
staged review repo: base commit 8d84993202974cf76b1a93f61699962c4dc59a33
                    diff = 445 added lines in aiohttp/connector.py (window 30–500: PASS)
                    working tree byte-identical to the audited scrubbed checkout
artifact sha256   : 9df9bfd18df8b27a758b95aad9f0c52feb7e572dc65e6b364dcafa0117773b14
```

The elided base commit is never executed and is not the object of review; it exists only to give the slice something to be a diff against. What reviewers read and run is the working tree, and the staging script verifies that tree matches the audited checkout before it exits. The slice's line positions are derived by subsequence matching, never read from the construction record — the orchestrator must not learn where the defect lives.

**This construction is new and is flagged for review.** It is the one part of the final configuration that has not been countersigned. It follows from constraints that were each approved separately, but the resolution is ours.

## 3. Input identity

Both arms were initialized against separate copies of the same staged repository, and the runner's collected review input hashed identically:

```
Arm B  context.md  sha256 2e61e2d3b2dc77efda91df39a44fbc98d7aa9db10cb6752c685f442f34e62271
Arm A  context.md  sha256 2e61e2d3b2dc77efda91df39a44fbc98d7aa9db10cb6752c685f442f34e62271
```

Each arm ran in its own copy, so no `.council/` directory from one arm could reach the other's collected context — the failure mode the pilot had to work around by moving directories between runs.

## 4. Results

| | **Arm B** (Codex critic) | **Arm A** (Claude critic) |
|---|---|---|
| Debate id | `dbt-2026-08-08-ac079a` | `dbt-2026-08-08-4572c7` |
| Rounds used | 2 of 3 (settled early) | 3 of 3 (hit the cap) |
| Findings total | 3 | 6 |
| — raised by critic | 2 | 5 |
| — raised by defender | 1 | 1 |
| Final statuses | 3 accepted | 5 accepted, 1 partially-accepted |
| Severities | 1 high, 1 medium, 1 low | 5 medium, 1 low |
| Support levels | 3 strong | 3 strong, 3 moderate |
| Unsupported findings | 0 | 0 |
| Protocol flags | 0 | 0 |
| Ship line | **NO-SHIP** — 1 accepted high finding | **SHIP WITH FIXES** — 6 accepted below high |

Per-round ledger activity (`newFindings` / `responseChanges`):

```
Arm B   r1 codex 2/0   r1 claude 1/2   r2 codex 0/1   r2 claude 0/0
Arm A   r1 codex 2/0   r1 claude 1/2   r2 codex 2/2   r2 claude 0/3   r3 codex 1/2   r3 claude 0/3
```

The two arms diverge in a way the pilot did not. Arm A produced twice as many findings and used its full round budget; Arm B produced fewer, all at `strong` support, and converged a round early — but Arm B's set contains a **high**-severity finding and Arm A's contains none, which is the difference between NO-SHIP and SHIP WITH FIXES.

Resist reading that as a verdict. More findings is not better, and a high-severity finding is not automatically the ground-truth defect. Whether either arm identified the actual defect is exactly what grading determines, and grading has not happened.

## 5. Cost

| | Arm B | Arm A |
|---|---|---|
| Critic tokens | **105,785** (Codex, runner-captured: 45,105 + 60,680) | 316,783 (Claude, harness-reported) |
| Defender tokens | 144,017 (Claude, harness-reported) | 277,592 (Claude, harness-reported) |
| **Total tokens** | **249,802** | **594,375** |
| Critic wall-clock | 72.5 s | 1601 s |
| Defender wall-clock | 436 s | 1194 s |
| **Total wall-clock** | **≈ 509 s** | **≈ 2795 s** |

`usageStatus` was `captured` for both Codex turns and `not-applicable` for all three Arm A rounds — the distinction A-001 introduced, doing its job. No round recorded `missing`.

On this one task Arm B costs **0.42×** Arm A, well inside S3's ≤ 3× ceiling. Arm A is the expensive arm because it pays Claude for both roles and, here, ran a full three rounds against Arm B's two.

**A measurement-provenance asymmetry to fix before scoring.** Codex tokens come from the runner, which now captures provider-reported usage per turn and writes it to `debate.json`. Claude tokens come from the agent harness's per-subagent accounting, which the runner never sees and which is not written to any ledger. The two numbers in the table above therefore have different provenance and different auditability: one is reproducible from committed artifacts, the other is not. S3 compares total per-task cost across arms, so this matters. It is not a blocker for a pilot; it is a blocker for a defensible S3 verdict.

## 6. Fidelity notes

- **The test suite does not run in the scrubbed checkout.** `pytest` aborts at collection with `No module named 'pytest_aiohttp'`, and the system Python (3.9.6) cannot import the module. Reviewers in both arms worked around it with a scratch virtualenv outside the repository. So reviewers can navigate the full checkout — a real gain over the pilot's slice-only view — but cannot run the project's own tests without setup the harness does not provide. Both arms hit this identically, so the comparison is unaffected; §3 metric 2 ("verified additional findings" requires a failing test or demonstrable repro) is affected, and the grading step should account for it.
- Both arms' reviewers were instructed not to leave the repository root, and all reported the working tree and diff untouched at exit.
- The orchestrator read no finding text, verdict, or ledger body during either arm — only control-plane projections (ids, counts, statuses, severities, support levels, cost). Subagents received file paths, never pasted content, and reported counts rather than claims.

## 7. Archived artifacts

```
_rerun/T01-staged/                 staged review repo (source for both arms)
_rerun/T01-armB-repo/              Arm B working copy
_rerun/T01-armA-repo/              Arm A working copy
_rerun/T01-armB/  init.json, critique-r{1,2}.json, rebut-r{1,2}.json, verdict.md,
                  debate/{context.md, debate.json, ledger.json, rebuttal-r{1,2}.json, verdict.md}
_rerun/T01-armA/  init.json, prompt-r{1,2,3}.txt, critique-mock-r{1,2,3}.json,
                  critique-r{1,2,3}.json, rebut-r{1,2,3}.json, verdict.md,
                  debate/{context.md, debate.json, ledger.json, rebuttal-r{1,2,3}.json, verdict.md}
_scrubbed/T01/, _scrubbed/T01-MANIFEST.json
```

## 8. Checklist (BENCHMARK.md §5a)

```
☑ Fresh checkout at the buggy SHA, no state reused        scrubbed export, audit PASS (26 checks)
☑ BENCHMARK.md SHA-256 matches the freeze                 72d09391… (frozen spec only; amendments
                                                          live in reviews/BENCHMARK-AMENDMENTS.md)
☑ Plugin at the pinned commit; suite passes; no local mods f976990; 46 passed, 0 failed; tree clean
☑ Model identifiers recorded                              §1
☑ Prompt files byte-identical to the frozen package       d0f31db6…
☑ Runner defaults unchanged; only COUNCIL_MOCK_CRITIQUE   Arm A only
☑ Identical timeout policy across arms
☑ Arm order follows the pre-recorded schedule             T01 byte 51 → B first
☑ Same machine and environment for both arms              §1
☑ Full debate directory archived per task per arm         §7
☐ Verdict graded by a human per §3                        pending Michael
```

## 9. What this run asks for

1. **Countersign the artifact-staging construction (§2).** It is the only part of the configuration not yet reviewed, and it applies to all 25 tasks.
2. **Close the cost-provenance asymmetry (§5).** Claude-side tokens need to land in the ledger the same way Codex's now do, or S3 rests on two numbers that are not comparably auditable.
3. **Decide how §3 metric 2 handles an unrunnable test suite (§6).** "Verified additional findings" requires a failing test or a demonstrable repro; reviewers cannot currently produce the former without out-of-band setup.
4. **Grade both arms** — the primary metric, still outstanding, and the only thing that turns any of this into a result.
