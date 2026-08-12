# Query 025 — correction: the approved rule and its illustrated drop list disagree

**From:** Claude (benchmark orchestrator) · **Date:** 2026-08-12
**Subject:** An arithmetic error of ours propagated into ruling 009's §1 drop list.
**Standing:** No task graded, no S1/S2/S3 computed. This changes *which* tasks the approved
sensitivity rule removes, so it must be settled before anything is computed.

## The discrepancy

Ruling 009 approves the same-source-path rule and states it as binding condition 3:

> retain only the task with the **earliest ground-truth fix date**

Its §1 then illustrates the effect as dropping **T11, T17, T21, T25, T18**.

Those two disagree. The §1 list is the one **we** wrote in §4 of query 024, and it was
wrong: we assumed the higher task id was the later fix. It is not, for two pairs. Appendix A
fix dates:

| component | fix dates | earliest → retain | so the rule drops |
|---|---|---|---|
| T01 \| T17 | T01 2026-06-02, **T17 2025-07-09** | **T17** | **T01** |
| T07 \| T21 | **T07 2026-02-22**, T21 2026-07-08 | T07 | T21 |
| T09 \| T25 | **T09 2026-04-02**, T25 2026-07-17 | T09 | T25 |
| T10 \| T11 | **T10 2026-05-07**, T11 2026-07-29 | T10 | T11 |
| T15 \| T18 | T15 2026-06-05, **T18 2025-10-26** | **T18** | **T15** |

**Rule-derived drop set: T01, T11, T15, T21, T25.** N = 20 either way, but the membership
differs on four tasks — T01 and T15 drop instead of T17 and T18.

T19r and T20r were struck pre-freeze and replaced, so ids are not chronological; that is
where our assumption failed.

## What we are asking

We read binding condition 3 as governing and §1's list as an illustration that inherited our
error, so the drop set is **T01, T11, T15, T21, T25**. Two reasons: condition 3 states a
criterion rather than a list, and condition 4's tie-break hierarchy only makes sense as a
refinement of "earliest fix date". The rationale you approved also points that way — retaining
the later member would systematically retain the one whose tree already contains the earlier
fix as ordinary code.

**Please confirm**, or tell us the §1 list governs and why.

One consequence worth surfacing rather than burying: under the rule-derived set, **T01 is
dropped from the sensitivity analysis**. T01 is the pilot task, already singular under R-001.
Nothing about that drives our reading — the rule is mechanical and we are applying it — but
you should know it is an effect, not a coincidence we noticed afterwards.

We are also, per your conditions 12 and 13, screening the four alternates and running a
mechanical path-normalization and rename check; if a rename proves two differently-named
paths are the same file, the component set could grow and we will bring that back separately.
