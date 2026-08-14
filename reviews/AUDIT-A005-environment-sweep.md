# AUDIT — A-005 extended environment sweep

**Date:** 2026-08-13 · **Ordered by:** consult 012 (`reviews/CHATGPT-RULING-030-installed-upstream-copies.md`), amendment §A-005.
**Machine reports:** `_rerun2/A005-sweep.json` (final pass) with the superseded passes retained beside it.
**Control-plane only.** Identity is decided by file-level sha256 against reference trees. No reviewed source is read, and nothing is compared against any fix.

## Result

**13 tasks are contaminated and must be re-run in both arms:**

**T01, T04, T06, T07, T08, T09, T10, T11, T12, T13, T15, T21, T24.**

That is the ruling's enumerated twelve **plus T01**, which the extended sweep added. Four tasks the first pass flagged — **T16, T20r, T22, T23** — were cleared on triage, each for a reason established mechanically rather than assumed.

| task | seats | detection | disposition |
|---|---|---|---|
| T01 | A-def | extracted distribution in a `uv` package cache | **contaminated** |
| T04 | A-critic | installed distribution | **contaminated** |
| T06 | A-critic, A-def | installed distribution | **contaminated** |
| T07 | A-def | installed distribution + metadata | **contaminated** |
| T08 | A-def, B-def | installed distribution + metadata | **contaminated** |
| T09 | A-critic | installed distribution + metadata | **contaminated** |
| T10 | A-critic, A-def | installed distribution | **contaminated** |
| T11 | A-critic | installed distribution | **contaminated** |
| T12 | A-critic, A-def, B-def | installed distribution | **contaminated** |
| T13 | B-def | installed distribution + metadata | **contaminated** (its two Arm A D8 hits are permitted, below) |
| T15 | A-critic, B-def | installed distribution | **contaminated** |
| T21 | B-def | installed distribution + metadata | **contaminated** |
| T24 | B-def | installed distribution | **contaminated** |
| T16 | A-critic, B-def | vendored import root | cleared — byte-identical copy of that arm's own review tree (116/116 files) |
| T20r | B-def | vendored import root | cleared — working-tree copy, exactly one file mutated (254/255) |
| T22 | B-def | vendored import root | cleared — byte-identical copy of the review tree (25/25) |
| T23 | A-def, B-def | *(withdrawn — instrument defect)* | cleared — never a hit |

## Detection classes

D1 installed distribution directory · D2 `dist-info`/`egg-info` metadata · D3 editable install (`.egg-link`, `__editable__*`, `direct_url.json`) · D4 `.pth` injection · D5 cached wheel or sdist · D7 import root supplied under a different distribution name · D8 vendored or extracted source anywhere in the seat.

**Final pass: 101 seats scanned, 852,169 filesystem entries walked, 25 seats with hits.**

## Two instrument defects found by checking the output, not by trusting it

**1. Distribution-name prefix over-match — produced a false task.** `fastapi_cli-0.0.32.dist-info` normalizes to `fastapi-cli-…`, which `startsWith("fastapi-")`, so two *sibling* distributions were reported as the project under review and **T23 was wrongly listed as contaminated**. Inspecting the metadata settled it: both `RECORD` manifests carry **zero** `fastapi/` source entries. Identity is now parsed from the `<name>-<version>` field and matched exactly. **T23 was never affected.** This is the "alternate distribution names" hazard the ruling names, operating in the opposite direction to the one it warned about — a matcher loose enough to catch aliases is also loose enough to invent them.

**2. Truncation — the first pass could not have seen what it was looking for.** It carried a 400,000-entry budget and a depth cap of 6–9. T01's only hit sits at **depth 8 inside a `uv` cache**, so any seat whose walk was truncated could have concealed the same thing. The cap was reached in **36 seats**. Re-run at depth 40 with no budget: **cap reached in none**, same 16 raw tasks. Only after that is the absence result worth anything — a sweep that stops early and reports nothing looks exactly like a sweep that finished and found nothing.

## Six seats with unreadable directories — absence established, not assumed

`EACCES` on directories in T17-A-critic, T01-A-critic, T01-A-def, T07-A-critic, T07-A-def, T08-B-def. T01, T07 and T08 are contaminated on other grounds, but **T17 is otherwise clean**, so presuming safety there was not open to me.

Every one is the same object: a fixture the project's own suite creates for a *permission* test, mode `d---------`. `stat` gives **`nlink=2`**, which means no subdirectories — a package cannot be inside one. And mode 000 means it was **not reachable by the participant either**, which is the ruling's permitted case: "an inaccessible package artifact … provided the audit establishes that it was not reachable during the run." Established by inode metadata, not inferred.

One further `ENOENT`: the map's original pre-Q-003 `T07-A-critic` directory no longer exists. That is the seat-map provenance defect consult 008 already recorded, not a sweep failure.

## How the vendored copies were cleared

A-005 permits the scrubbed working tree and build outputs produced solely from it, so a reviewer working from a scratch **copy of the review checkout** is permitted while a copy of a **different version** is voiding. "Differs from the review tree" does not decide it: a reviewer mutating its own copy for a counterfactual — the conduct T18 recorded and the scratch policy implies — produces exactly the same signature.

Each copy was therefore hashed file-by-file against **two** references: the arm's own review repo, and the scrubbed buggy-SHA checkout.

- **T16 (both seats), T22:** every file identical to the review tree. Permitted.
- **T13 Arm A critic and defender, T20r Arm B defender:** 160/161, 160/161 and 254/255 identical against **both** references, one file differing from both — the signature of a participant mutating a single file in its own copy. The directory names the participants chose (`fixcopy`, `fixtree`, `baseline`) match that reading. Permitted: derived solely from the working tree, no other-version content.
- **T01 Arm A defender:** 3 of 55 files identical, **49 differing, 3 present only in the copy**, against both references. That is a different release of the project, unpacked in a package cache. **Contaminated.**

## Limits

- The sweep tests for **copies of the reviewed project**. A dependency that merely *documents* the project's behaviour, or a transitively installed package embedding a fragment of it under an unrecognised name, would not be caught.
- Import-root identity uses the project's conventional root name. A distribution shipping the reviewed source under an unrelated directory name would evade D7 and D8.
- Only seats that still exist on disk can be swept. Seats belonging to voided runs were removed when those runs were voided, so this sweep speaks to retained environments.

---

## CORRECTION, same day — the sweep was re-run on derived identities, and the set changed

**The passes above used a repo map I wrote from memory. It was wrong for three tasks.** T02 and T03 are **redis-py**, not aiohttp; **T06 is bullmq**, not ioredis. A sweep that searches a seat for the wrong project cannot find the right one, and can report an unrelated dependency as though it were the project under review — both happened.

It surfaced by accident: the environment builder derives identity from the checkout, and its T06 run printed `bullmq` where the sweep had assumed ioredis.

**Identity is now derived per task from the checkout's own packaging metadata** — `package.json`, `[project]`/`[tool.poetry]` in `pyproject.toml`, `[metadata]` in `setup.cfg`, `setup.py`, plus top-level and `src`/`lib` import roots. Two parsing traps were fixed on the way: an unanchored `name =` in `setup.cfg` matched a prose line and yielded the "distribution" **"bug fixes"**, and `sqlalchemy`'s import root sits under `lib/` and was missed entirely.

### Corrected disposition

| change | task | why |
|---|---|---|
| **added** | **T03** | it is redis-py, and an installed `redis` distribution sits in two of its seats. The earlier pass searched it for aiohttp and so found nothing. |
| **added** | **T01** | extracted release in a `uv` cache (unchanged from the first extended pass) |
| **evidence withdrawn** | T06 | the `ioredis` directories in its seats are an ordinary dependency — T06 reviews **bullmq**. Its actual bullmq copies are **byte-identical** to its own review tree, 24/24 files across three seats. **On the corrected evidence T06 shows no reachable foreign copy.** |

**T06 is nevertheless retained in the re-run set.** The ruling enumerated it; the enumeration rested on my incorrect table; and a task named in a ruling is not something to drop on my own re-analysis — particularly when keeping it costs two debates and wrongly dropping it costs a contaminated scoring observation. **The report must state plainly that T06's original flag was an identification error of mine**, so that its presence in the set is never read as evidence of an exposure that was never demonstrated.

### Final set — 14 tasks, both arms each

**T01, T03, T04, T06, T07, T08, T09, T10, T11, T12, T13, T15, T21, T24.**

Cleared on triage against both the review repo and the scrubbed buggy tree: **T16, T20r, T22** (byte-identical or single-file-mutation working-tree copies) and **T23** (a name-prefix false positive). T13 stays in on ground independent of identity: an **installed celery distribution** in its Arm B defender seat.

### A third instrument trap, recorded because it fired twice

Where packaging metadata yields no distribution name the code falls back to the import root — and celery's test package is called **`t`**. Treating `t` as a distribution identity made every dependency shipping a `t/` directory look like the project under review: two bogus "contaminated" rows in the sweep triage, and three false findings in T13's environment audit. Generic tokens are now dropped once a real identity exists.

**All three instrument defects in this audit were over-matching, and every one manufactured contamination rather than concealing it** — the failure direction that wastes re-runs rather than the one that corrupts results. That is the safer direction to fail in, but only if the output is actually checked; each was found by reading a result that looked wrong, not by the instrument reporting a problem with itself.
