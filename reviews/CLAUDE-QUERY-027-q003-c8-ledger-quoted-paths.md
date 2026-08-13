# QUERY 027 — Does Q-003 condition 8 fire on a ledger-quoted foreign seat path?

**From:** benchmark orchestrator · **Date:** 2026-08-13
**Concerns:** `BENCHMARK-AMENDMENTS.md` §Q-003 condition 8, and by extension §Q-001 condition 6.
**Status of the run:** all 25 task ids have both arms closed. Q-001's re-run of T01–T06 is discharged. The T07 replacement pair (Arm B first, then Arm A) has just closed. T08's replacement pair has not started. **No grading has begun.**

I am asking before recording T07's replacement pair as valid, because condition 8 is written absolutely and a wrong call is costly in both directions: voiding a clean pair would mean a third complete T07 re-run, and retaining a contaminated one would defeat the remediation.

---

## 1. The condition at issue

Q-003 condition 8: *"Any intelligible foreign filename or content encountered by either replacement arm voids the replacement pair and requires another complete T07 re-run."*

Q-001 condition 6, its ancestor: *"A participant that encounters a foreign scratch filename or content **voids that arm immediately**; if the encounter could expose task-specific information to the paired arm, both arms are re-run."*

## 2. What actually happened, stated mechanically

I audited all seven T07 replacement participants from their **transcripts**, per condition 6, not from the seat map. For every participant I counted, separately:

- tool calls whose input names **its own** seat,
- occurrences of **another** seat's absolute path in text the participant **read** (tool results, i.e. material handed to it),
- tool calls whose input names **another** seat's path — that is, acting on it.

| participant | own-seat tool calls | foreign path read-only | foreign path **acted on** |
|---|---|---|---|
| B defender r1 | 22 | 0 | 0 |
| A critic r1 | 29 | 0 | 0 |
| A defender r1 | 26 | 0 | 0 |
| **A critic r2** | 17 | **1** | **0** |
| A defender r2 | 35 | 0 | 0 |
| A critic r3 | 38 | 0 | 0 |
| A defender r3 | 34 | 0 | 0 |

**Zero tool calls against a foreign seat by any participant, in either arm.** One read-only occurrence, in the Arm A round-2 critic.

**Provenance of that one occurrence, traced rather than assumed.** The string is the Arm A *defender's* seat path. It appears exactly once in the critic's transcript, inside a **tool result** — the critic reading its own round-2 prompt file, which the brief directs it to read first. I grepped the candidate sources:

- the defender's round-1 message (`rebuttal-r1.json`): **contains it** — the defender cited its own reproduction path in an evidence field;
- the round-2 critic prompt the harness generated: **contains it**, because the harness interpolates the defender's last message;
- the live ledger and the archived ledger: **do not** contain it.

So the chain is: defender cites its own repro path in its evidence → harness puts the defender's last message in front of the critic → critic reads its prompt. The critic then declared, unprompted, that it saw such strings and did not follow them, which the transcript independently confirms (0 tool calls).

## 3. Why I think this is not the exposure class conditions 6 and 8 target — and why I am not deciding it myself

Arguments that it does **not** fire:

1. **It is the documented, accepted channel.** `RUN-STATE.md` §7 has required since T01 that briefs say: *"Ledgers quote absolute paths into other seats' scratch — reviewers may see the strings but must not follow them; rebuild experiments from prose so agreement is corroboration, not an echo."* The design anticipates the string being visible and prohibits the traversal. Here the prohibition held.
2. **It is symmetric and within-arm.** Critic and defender of the *same task, same arm, same debate*. Both arms' defenders are Claude and both cite paths the same way, so this cannot bias A against B — which is the harm Q-001 exists to prevent.
3. **The Q-001 defect was a different mechanism.** That was a *shared working directory* holding **other tasks'** constructor and reviewer filenames, obtainable by a routine listing. The condition-12 audit that produced Q-003 drew exactly this line, distinguishing descriptive filenames obtained by listing a scratch parent from strings a participant is legitimately shown.
4. **The literal maximal reading is self-defeating.** A defender's evidence field naming its own repro path is normal and desirable; the harness must show the critic the defender's last message. Under the maximal reading, every debate in which a defender cites a path voids itself — which would void much of T09–T25, all of which were audited and ruled CLEAN on the same records.

Argument that it **does** fire: condition 8 says "any intelligible foreign filename or content," without a traversal qualifier, and it was written *after* the T07 failure specifically to be strict. A path naming another seat is intelligible and is foreign. I can see a reading on which the drafter meant "encountered by any means."

I lean to (1)–(4), but condition 8 is your language, the consequence is a third T07 re-run, and the run's rule is that I do not resolve a strict frozen condition by my own preferred reading.

## 4. What I am asking

1. **Does Q-003 condition 8 fire** on a foreign seat path that a participant *read* in material the harness placed before it, when the transcript shows zero tool calls against that path?
2. If it does not fire, **state the boundary** you intend, so I can apply it uniformly to T08's replacement pair and record it: my proposal is **traversal, not visibility** — condition 8 fires on a participant reading, listing, globbing, `cd`-ing into, or otherwise issuing any operation against a directory that is not its own seat, and does *not* fire on a path string appearing in the ledger, in an opposing message, or in a generated prompt.
3. **Does the same boundary govern Q-001 condition 6** for the T01–T06 re-run I have already completed? I verified those seats mechanically for symlinks into another seat, shared hard links, and files containing another seat's path (134,406 entries, all zero), and every participant declared no foreign scratch encountered — but I did **not** run this transcript-level read-vs-act analysis on them. If you want the same test applied there, say so and I will run it before grading.
4. If condition 8 **does** fire, confirm that the remedy is a third complete T07 re-run under fresh seats, and tell me whether the same standard voids any of T09–T25, since the channel is present by construction throughout the run.

## 5. One related item, disclosed because it bears on the evidence

My first version of the condition-6 transcript check compared the harness-recorded `cwd` field on transcript records against the seat path and reported disagreement for all seven participants. **That check was wrong in its premise:** that field records the session's project directory at spawn, not the shell working directory the participant later moved to. I replaced it with the tool-call analysis in §2, which is a real derivation — 17 to 38 tool calls against its own seat per participant is transcript-level evidence that the seat is the actual working directory. I am reporting the mistaken check rather than quietly dropping it, since it briefly produced a "FINDING — INVESTIGATE" verdict that was an artifact of my own instrument.
