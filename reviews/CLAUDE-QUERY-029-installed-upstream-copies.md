# QUERY 029 — A published copy of the reviewed project is installed in 18 reviewer seats

**From:** benchmark orchestrator · **Date:** 2026-08-13
**Concerns:** A-002 / A-002-E1 (what reviewers can reach), and §1's arm definition — the arms differ by critic identity and nothing else.
**Status:** all 25 tasks have valid observations; every ordered re-run and audit is discharged; S3 recomputes to a median B/A of 0.29×. **No grading has begun.** I am holding `READY-TO-GRADE.md` until this is ruled, because I do not think the handoff should state a position I invented.

---

## 1. How this surfaced

The T08 Arm A defender disclosed, unprompted, that a test plugin had pulled **a published release of the very project under review** into its seat virtualenv as a transitive dependency. It stated that module resolution went to the working tree, printed `require.resolve`-equivalent proof at runtime, and that it did not read, diff or otherwise consult the installed copy.

I did not take that as the end of it, because the T08 ruling itself said the test is **access, not use**. I swept every reviewer seat on disk for an installed distribution matching the project under review for that task.

## 2. What the sweep found — mechanical, no source read

**18 seats across 12 tasks contain an installed published copy of the project under review.**

| task | seats affected |
|---|---|
| T04 | A-critic |
| T06 | A-critic, A-def |
| T07 | A-def |
| T08 | A-def, B-def |
| T09 | A-critic |
| T10 | A-critic, A-def |
| T11 | A-critic |
| T12 | A-critic, A-def, B-def |
| T13 | B-def |
| T15 | A-critic, B-def |
| T21 | B-def |
| T24 | B-def |

By role: **A-critic 7, A-def 5, B-def 6.**

I have deliberately **not** compared any installed version against any fix, because deciding whether the fixed source was on disk is a ground-truth judgment and I am contamination-limited to the control plane.

## 3. Why I think this is materially different from every exposure recorded so far

Everything the run has recorded until now — shared scratch, ledger-quoted paths, the shared `repro/` archive, seeing a changelog *filename* — was **locating** information: it points at the slice reviewers already have. This is the first channel that can put **the fixed source itself** on disk next to a reviewer.

A-002 removes history from the checkout so the fix is unreachable *by construction*. It does not touch the dependency graph. A reviewer that installs the project's own test dependencies can pull a published release of the project, and a published release of a project whose buggy SHA is recent will in general contain the fix. The scrub's guarantee is about the checkout; it was never a guarantee about the seat.

**And the asymmetry is on the independent variable.** Arm A's critic is a Claude subagent with a seat, and installs dependencies: **7 tasks**. Arm B's critic is Codex, invoked directly by the runner, with no seat and no install step: **structurally 0, always**. So on those 7 tasks one arm's critic had a potential path to fixed source that the other arm's critic could not have had, whatever either did with it. Defender-side exposure (A-def 5, B-def 6) is roughly balanced and both defenders are Claude, so that half does not bias A against B — but the critic half is exactly the comparison S1 measures.

## 4. What I am asking

1. **Does an installed published copy of the reviewed project inside a reviewer's seat constitute a contamination event** under A-002's intent, on the access-not-use test the T08 ruling applied — or only if a participant actually consulted it?
2. If it is an event on access, **what is the disposition** for the 7 tasks where Arm A's critic had one (T04, T06, T09, T10, T11, T12, T15)? Re-running them means a further 14 debates, and re-running under the same policy would reproduce the condition unless the policy changes first.
3. **What policy change do you want for any re-run** — forbid installing any distribution whose name matches the project under review, vendor a pinned dependency set that excludes it, or something else? I would rather be told than choose, since choosing after seeing which tasks are affected is the thing pre-registration exists to prevent.
4. If it is **not** a voiding event, I propose to report it as a **conditionality on absolute detection rates** alongside A-002 and A-002-E1, *and* as a **treatment asymmetry** alongside the Arm A briefing asymmetry, with the per-task table above published. Confirm that is sufficient.
5. Whatever you rule, I would like the boundary stated in a form I can apply mechanically, as you did for Q-003-E1.

## 5. Two things I want to be candid about

**I found this late.** The channel has existed since T01 and nothing in my per-task checklist looked for it; it surfaced only because one reviewer volunteered a disclosure it was not obliged to make. That is not a reason to discount it, and it means the same class of gap may exist elsewhere in the seat environment that no reviewer happened to mention.

**I cannot bound the harm from where I sit.** I can see that the copies are present; I cannot see whether any of them contains the relevant fix without reading ground truth, and I should not. Whoever grades can determine that per task. If it would help, I can produce installed-version metadata per seat as mechanical data without interpreting it.
