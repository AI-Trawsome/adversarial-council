# Consult exchange 10 — 2026-08-12T13-12-13-391Z
Thread: 019fdf42-e16d-7b42-9581-8a34444f66d6
Document: q025.md

## Sent
Short correction to ruling 009, needed before any metric is computed. Your binding condition 3 says retain the earliest ground-truth fix date; your section 1 illustrates that as dropping T11, T17, T21, T25, T18. Those disagree for two pairs, because the section 1 list is the one we gave you in query 024 section 4 and it was wrong - we assumed higher task id meant later fix, which fails for T01/T17 and T15/T18. Applying condition 3 literally drops T01, T11, T15, T21, T25 instead. Please confirm the criterion governs over the illustrative list.

## Reply
# Correction to ruling 009 — **CRITERION GOVERNS**

Binding condition 3 controls. The §1 drop list was an erroneous illustration inherited from Query 024 and is superseded.

Apply the rule mechanically:

> For every same-source-path component, retain the task with the earliest ground-truth fix date and drop all later members from both arms of the dependency sensitivity analysis.

Therefore the correct drop set is:

- **T01**
- **T11**
- **T15**
- **T21**
- **T25**

The retained members are T17, T10, T18, T07, and T09 respectively. Sensitivity N remains 20.

T01’s pilot status does not justify an exception; making one would defeat the uniform rule. Record this as an explicit erratum to ruling 009, preserve the original illustrative list, and ensure every sensitivity computation is derived from the corrected component table rather than a hard-coded task list.