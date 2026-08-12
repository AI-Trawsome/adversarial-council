# Query 022 — T07 Arm B never used a private scratch seat: void one arm or both?

**From:** Claude (benchmark orchestrator)
**Date:** 2026-08-12
**Subject:** Scope of remediation for a Q-001 condition-12 audit failure found in T07 Arm B
**Standing:** Q-001 condition 12 ordered this audit. The audit has now run and returned a
failure the condition anticipated but whose remedy the conditions do not cleanly settle.

Nothing here is driven by benchmark results. **No task has been graded**, no S1/S2/S3 has
been computed over the affected tasks, and the arms' findings have not been compared. This
is an isolation-integrity question about which debates may enter the scoring dataset.

---

## 1. What the audit found

Q-001 condition 12 required, before grading, an audit of T07–T11 against the final
per-seat isolation policy, testing **actual** cross-task exposure rather than assuming it
benign. That audit is complete. Dispositions:

| debate | disposition |
|---|---|
| T07 Arm A | DEVIATION-RECORDABLE |
| **T07 Arm B** | **VOID-ARM** |
| T08 Arm A | DEVIATION-RECORDABLE |
| T08 Arm B | CLEAN |
| T09 A / B | CLEAN / CLEAN |
| T10 A / B | CLEAN / CLEAN |
| T11 A / B | CLEAN / CLEAN |

**The T07 Arm B failure.** Arm B never used a private seat at all. It worked in the
orchestrator session's **shared scratchpad**, which at the same time held the working files
of all five T07–T11 constructors and of the contamination auditor, and which the
subsequently-voided T07 Arm A run later reused. **Arm B's defender listed that directory
twice and received other tasks' constructor filenames in the output.** Cross-task foreign
strings were found for T07 pairing T07←T10 explicitly, and also T07←T08, T07←T09, T07←T11
— in Arm B only.

That is not the opaque-seat-name carve-out. Condition 12 admits a prohibited parent listing
as a recordable deviation **only** when it exposed opaque, undecodable seat names.
Constructor filenames for other tasks are descriptive, and the audit's name inventory
confirms Q-001's premise directly: reproduction and constructor filenames in this batch do
name mechanisms (descriptive/opaque counts per task: T07 14/51, T08 5/10, T09 8/18,
T10 32/12, T11 96/15).

**Everything else tested clean.** T08–T11 show zero foreign strings on disk, cross-arm and
in-transcript. Reachability testing found no channel anywhere: no cross-seat symlinks in
either direction, no hard links, no shared caches, per-seat venvs and bytecode mirrors
referencing only their own seat, no `.pth`/`NODE_PATH`/`PYTHONPATH` artifact crossing
seats, every seat empty before use. T07 **Arm A** passes every clause of condition 12
independently: private seats, empty before use, condition 8 satisfied (no voided-run
artifact name appears in any retained Arm A seat, log, repo or transcript), voided material
unreachable, zero foreign strings.

**Method, because the conclusion depends on it.** The auditor did not trust
`_seatmap/SEAT-MAP.json`; it re-derived every seat from the participant transcripts. That
mattered: **the map asserts a private seat for the T07 Arm B defender that was never used,
and names a T07 Arm A critic directory that does not exist.** The map alone would have
hidden this finding entirely. Scans covered each debate's own seats, arm log directory, arm
repo, all 38 participant transcripts, and the five Codex rollouts — 221–261 foreign terms
per debate, each scan gated on a known-present control string so a silently-empty search
could not pass as clean.

---

## 2. Why the conditions do not settle the remedy

**Condition 6** is literal and gives one answer: *"A participant that encounters a foreign
scratch filename or content voids that arm immediately; if the encounter could expose
task-specific information to the paired arm, both arms are re-run."* The encounter is in
Arm B. The exposure flow is Arm B → nothing: Arm A is independently clean and carries no
trace of Arm B's or the voided run's material. On condition 6 alone, **void Arm B only**.

**Condition 12** is framed differently: *"T07 is valid only if both retained arms used
private seats and neither received intelligible foreign scratch information."* Arm B did
not use a private seat, so **T07 as a pair is not valid** — which is a statement about the
task, not about one arm.

Two further conditions bear on whether a lone Arm B re-run can produce a valid T07:

- **Condition 2** — *"Follow the original pre-registered arm order per task."* T07's
  pre-recorded schedule is **B-first**. A re-run of Arm B alone necessarily runs B *after*
  the retained Arm A, inverting the drawn order. BENCHMARK.md §5 gives the purpose of that
  draw as neutralizing drift from mid-run fixes, so the inversion is not merely cosmetic.
- **Condition 9** — *"Same finalized staging, prompts, cost capture, provider-rate policy,
  machine class and harness configuration for both arms."* The retained Arm A ran on
  2026-08-09 under the then-current harness. A new Arm B would run on or after 2026-08-12,
  after **amendment A-004** added schema enforcement to the Arm A critic delivery path.
  A-004 changes Arm A's path only, so a fresh Arm B is not itself altered by it — but the
  pair would then straddle a harness amendment, and condition 10 requires drift be recorded
  while forbidding its use as an excuse to retain defective runs.

So condition 6 points at one arm and conditions 2, 9 and 12 point at the pair. That is the
question.

---

## 3. The precedent that seems to govern

Consult 006 chose **Option 2b** for T01–T06 — re-run both arms — and **rejected Option 2a**
specifically for *"preserving an avoidable within-pair environment asymmetry and
contradicting the R-001 precedent."*

T07 is the same shape. If Arm B alone is re-run, the final T07 pair consists of an Arm A run
in one environment and on one date and an Arm B run in another, in inverted schedule order,
straddling an amendment. That is an avoidable within-pair asymmetry, avoidable at the cost
of exactly one additional debate.

Against that: Arm A is genuinely, independently clean, and re-running a clean arm discards
valid data and spends budget. The auditor recorded the two consequences above rather than
deciding them, and recommended both arms.

---

## 4. What we propose, and what we are asking

**Proposal: void and re-run both arms of T07**, B-first per the pre-recorded schedule, with
fresh review-repository copies, fresh debate contexts, a fresh Codex thread, fresh
subagents and fresh opaque seats — i.e. treat T07 exactly as Q-001 treats T01–T06.
Preserve both existing debates under explicit `VOIDED` labels alongside the already-voided
pre-isolation Arm A run. Exclude the voided usage from S3 and report it as benchmark
remediation overhead under condition 11.

**Questions:**

1. **Is that the correct scope**, or does condition 6's literal "voids that arm" govern, so
   that only Arm B is re-run and the retained Arm A is paired with it despite the inverted
   order and the date/amendment straddle?
2. If Arm B alone is re-run, **how should condition 2 be satisfied**, given that the drawn
   order cannot be honoured by a single-arm re-run? Is the drawn order satisfied by the
   original run's order, or is it violated in a way that matters?
3. **Do T08–T11 stand?** The audit found them clean on every test, with two recordable
   deviations (T07 Arm A round-2 critic; T08 Arm A defender) of which the second falls
   squarely inside condition 12's opaque-name carve-out. We propose recording both and
   retaining all four tasks.
4. The audit's **six undetermined items** are listed in §5 below. Do any of them change the
   disposition, or are they acceptable as recorded limitations?

---

## 5. What the audit could not determine

Recorded rather than resolved, because a clean-looking audit with buried gaps is worse than
a frank one:

1. The shared scratchpad **has since been deleted**; its exact state during T07 Arm B
   round 1 (the round that performed no listing) is inferable only. Mtimes captured inside
   the round-3 listing put the constructor files 11–18 minutes ahead of Arm B's first write.
2. Whether the five Arm B **Codex** critics saw foreign scratch material. All five rollouts
   are negative on every test, but Codex-side output capture cannot be assumed as complete
   as the Claude transcripts.
3. About **66 opaque directories** present in the scratch parent on the run date no longer
   exist, so what some *other* hypothetical listing would have returned cannot be
   reconstructed. Both listings that actually occurred are captured verbatim.
4. Whether the two mapped-but-missing directories were provisioned and pruned, or never
   created.
5. Exposure through a channel leaving no filesystem or transcript trace is untestable in
   principle. All available records are negative.
6. T01–T06 was out of scope for this audit; it is already ordered for re-run under Q-001.

---

## 6. Two record defects, disclosed

Neither needs a ruling; both are being corrected in the run record rather than silently.

- `_seatmap/SEAT-MAP.json` asserts a T07 Arm B defender seat that was never used and a T07
  Arm A critic directory that does not exist. The map is a record, so it will carry a
  correction note rather than be rewritten to look right.
- The **Q-001 Status note** in `BENCHMARK-AMENDMENTS.md` states that both disclosed T07–T11
  parent listings exposed only opaque seat names. That is **true of one and false of the
  other** — the T07 Arm A listing returned task/arm/role/round directory names, not hex —
  and the note does not mention the Arm B exposure at all, because it was not then known.
  That note was written by the orchestrator, and it is exactly the kind of
  "characterization of cross-task exposure as benign" that consult 006 declined to accept.
  The audit vindicates that scepticism.
