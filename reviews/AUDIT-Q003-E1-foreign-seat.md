# AUDIT — Q-003-E1 transcript-level foreign-seat audit of every retained debate

**Date:** 2026-08-13 · **Ordered by:** consult 011 (`reviews/CHATGPT-RULING-028-q003-c8-authorized-quotation.md`), amendment `BENCHMARK-AMENDMENTS.md` §Q-003-E1, eight binding conditions.
**Machine report:** `_rerun2/Q003-E1-foreign-seat-audit.json` (outside version control, with the rest of the run archive).
**Control-plane only.** This audit reads transcripts for *paths*. It opens no reviewed source, no finding, no verdict, and this record carries no defect text (condition 5).

## Verdict

**No voiding exposure anywhere in the run.** 174 retained critic and defender participants across all 25 tasks. **0 operations, and 0 attempted operations, against any foreign seat.** 24 foreign-seat occurrences, every one an authorized same-debate quotation under the ruling's five-limb exception. 2 of those 24 required provenance work before they could be classified; both resolved from the archive, neither presumed (condition 7).

| measure | result |
|---|---|
| retained participants audited | **174** |
| tasks covered | **all 25** |
| transcripts missing | **0** |
| seats unresolved in the map | **0** |
| operations on a foreign seat | **0** |
| *attempted* operations on a foreign seat | **0** |
| scratch-parent listings / unanchored relative reaches | **0** |
| foreign paths from another task, arm, or voided run | **0** |
| authorized same-debate quotations | **24** |
| unclassifiable after provenance work | **0** |
| participants with zero tool calls against their own seat | **0** (minimum observed: 4) |

Rows excluded, with reasons recorded rather than dropped silently: **22** — 21 overhead invocations that are not debate participants (constructors, the contamination auditor, the Q-001 condition-12 isolation auditor, the Q-002 condition-8 dependency screen), and **1 voided run** (T15's pre-A-004 Arm A critic, whose seat was moved out of `_scratch` entirely when it was voided, and which is not a retained debate).

## Method, and the condition-6 requirement it satisfies

The seat map is not evidence — on the original T07 it asserted a seat that was never used and named a directory that did not exist, which is why condition 6 exists. So every fact below is derived from the participant's **own transcript**:

- **Own-seat operation count.** Every tool call whose input names the participant's assigned seat. Every one of the 174 participants issued at least 4, and most issued 20–60. This is the transcript-level evidence that the seat is the participant's actual working directory.
- **Foreign-seat operations.** Every tool call whose input names any *other* seat in the map — 127 seats checked against each participant, not just the plausible ones. **Zero across the run.**
- **Relative and parent reaches**, which condition 5 of the ruling's audit list requires be accounted for because they omit the absolute path: scratch-parent listings, `Glob`/`Grep` rooted at the scratch parent, and `cd ..` / `ls ..` in Bash. A relative traversal is resolved against the effective working directory where that is reconstructible: if the same Bash invocation establishes its location inside the participant's own seat, a `cd ..` within it cannot reach another seat and is not a reach. **Zero unanchored reaches.**
- **Reads.** Every tool *result* containing a foreign seat path, paired back to the tool call that produced it via `tool_use_id`, so each occurrence has a traced source rather than an assumed one.

**A false positive from the first version of this instrument, recorded because it was reported before it was checked.** The relative-reach rule initially flagged the T14 Arm A round-1 defender for `cd ..`. Inspecting the command showed it setting `S=<its own seat>` and moving between subdirectories it had just created inside that seat — it never left. The rule was corrected to the anchored form described above. **A heuristic that fires on a benign pattern is not a conservative choice; it manufactures findings that then have to be talked back down.**

## The 24 authorized quotations

All 24 have the same shape, and it is the shape the ruling's exception describes: a participant cites **its own** reproduction script or scratch environment by absolute path inside an evidence field; the runner records that message; the harness interpolates it into the counterpart's next-round prompt; the counterpart reads the prompt it is required to read. Same task, same arm, same debate, in every case. No participant followed one.

The channel is **symmetric across arms by construction** — both arms' defenders are Claude and both cite paths the same way — so it cannot bias A against B, which is the harm Q-001 exists to prevent.

## The two occurrences that required provenance work

Both were `Read` calls whose input named no path under `Dev/`, so the instrument could not establish the source and — correctly, per condition 7 — refused to presume the exception applied.

**T14, Arm A defender, round 3.** The `Read` targeted a **harness tool-result spill file** under `~/.claude/projects/…/tool-results/`, which the harness writes when a tool result is large. Checked mechanically, without reading its content: the file contains seat paths for **T14-A-critic and T14-A-def only**, no seat from any other task or arm, no other task id, and no voided-run material. Limbs 1–5 of the exception therefore hold, and the audit already shows this participant issued no operation against the critic's seat. **Classification: authorized same-debate quotation, delivered through a harness spill file rather than directly.**

**T12, Arm A defender, round 3.** The `Read` targeted a working file in an orchestrator session scratchpad that **has since been deleted**, so the file itself could not be inspected. Provenance was established from the archive instead, as condition 7 directs. Two facts settle it: the participant's own transcript shows it created that file itself, by a Bash command that read `ledger.json` **inside its own arm repo** and extracted findings text to the file; and the **archived T12 Arm A ledger contains that foreign seat path**, with 3 of 4 tested text fragments surrounding the occurrence appearing **verbatim** in the archived ledger. The content the participant read was therefore the ledger's own record of the critic's submitted evidence, reached through an intermediate file of its own making. **Classification: authorized same-debate quotation.**

**One deviation recorded from that second case, separately from the classification.** The T12 Arm A round-3 defender wrote a working file into an **orchestrator session scratchpad instead of its own seat**. The content was its own extract of the authorized ledger, so this is not a foreign-seat exposure and it changes no classification — but writing outside the assigned seat is a scratch-policy deviation, and it is recorded as one. It also destroyed the evidence that would have made the classification trivial: the file was cleaned up with that session, which is precisely why the archive had to carry the proof.

## What this audit does not establish

- It tests **paths**, not content. A participant that learned something from a foreign seat without any path appearing in its transcript would not be caught here — the same inherent limit on retrospective isolation audits that consult 008 already recorded.
- Codex-side observability remains incomplete: Arm B's critic is invoked by the runner and writes no participant transcript, so 21 Codex turns across the run are outside this instrument. Arm B's critic also occupies no scratch seat at all, which is why there is nothing for it to expose — but that is a structural argument, not a measurement, and it should be reported as such.
- The T12 spill file is gone. Its classification rests on archived ledger provenance, which is strong, rather than on the file itself, which would have been decisive.
