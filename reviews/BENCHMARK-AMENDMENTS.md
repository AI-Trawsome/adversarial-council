# BENCHMARK-AMENDMENTS.md — amendment and ruling record for the frozen benchmark

**This file is the Amendment Log referred to by BENCHMARK.md. It lives outside BENCHMARK.md deliberately.**

BENCHMARK.md is frozen at `sha256 72d09391d09a91db1083420b293968c8c5c87d3ee3ead92ad0af00734557562f`, and its §5a per-task checklist re-verifies that hash before every task in every arm. Writing an amendment into the frozen file's own Amendment Log section would change the hash and fail that gate for every remaining task — the spec would invalidate itself the moment it was amended as written.

So amendments are recorded here, and BENCHMARK.md stays byte-identical to the freeze commit. The §5a hash check continues to verify exactly what it was meant to verify: that the *frozen rules* have not moved. What has moved is recorded below, dated, and attributed.

This is a defect in the freeze design, not a liberty being taken with it. §3's status line requires that post-freeze amendments be logged; §5a requires the file's hash to be stable. Both cannot hold if the log lives inside the file. A future revision of the protocol should point §3 at a sibling amendment file from the outset.

## Standing of these entries

No benchmark task has been graded. The pilot (T01) produced two closed debates but no ground-truth detection judgment, no S1/S2/S3 computation, and no comparison between arms. Nothing below is driven by benchmark *results*, which is the thing pre-registration exists to protect against — these are instrumentation and construction fixes found by running the machinery once before scoring anything.

BENCHMARK.md §5 item 3 anticipates this directly: *"implementation bugs discovered mid-run may be fixed, but affected tasks are re-run in both arms and noted."*

Both amendments were submitted for external ruling before adoption and approved.

**Authorization:** consult exchange 001, 2026-08-08T02:46Z (local 2026-08-07), thread `019fdf42-e16d-7b42-9581-8a34444f66d6`. Committed verbatim at `reviews/CHATGPT-RULING-013-pilot-t01-amendments.md`, `sha256 a1f124b8479292cfdd2b972df25c74f9687697e3851089fe422f4bd035e2d358` — byte-identical to the runtime log the plugin wrote at `.council/consult/001-2026-08-08T02-46-01-377Z.md`, which is gitignored runtime output. The hash is recorded here so the committed copy can be checked against the original rather than trusted. The pilot report submitted for that ruling is `reviews/PILOT-T01.md`.

| id | subject | status | authorized by |
|---|---|---|---|
| A-001 | Codex token-capture repair | approved, implemented 2026-08-07 | consult 001 §1 |
| A-002 | Scrubbed full checkouts for all 25 tasks | approved, implemented 2026-08-07 | consult 001 §2 |
| R-001 | Subagent isolation sufficiency; T01 dataset treatment | approved, ruling only — amends no rule | consult 001 §3 |

Michael Traw's approval: ☑ A-001 ☑ A-002 ☑ R-001 — all three approved 2026-08-07.

---

## A-001 — Repair Codex token capture

**Rule affected:** §3 metric 5 (Cost: total tokens and wall-clock per task per arm), and therefore §4 criterion **S3** (*Arm B's median per-task cost is ≤ 3× Arm A's*).

**Defect.** During the T01 pilot the runner recorded `usage: null` for all three Codex critique turns. Token capture in `stepCritique` is best-effort — the value is read from the app-server turn result and silently kept as null when absent. Arm B's token cost was therefore not measured at all, leaving S3 — a pre-registered *gating* criterion — uncomputable on the token axis. Wall-clock was captured correctly and is unaffected.

**Change.** Repair usage capture in the council runner so provider-reported token counts are recorded for every Codex turn. No change to prompts, protocol, schema, round structure, task set, arm definitions, or any scoring rule. The measurement being restored is one the frozen spec already required; nothing new is being measured.

**Conditions attached to the approval, all binding:**

1. The code change, its cause, and its validation are recorded in this entry when implemented.
2. Token capture is validated by a protocol-level test before scoring resumes — an assertion in `scripts/test/protocol-tests.mjs` that a non-mocked turn records non-null usage, so a future silent regression fails the §5a "protocol test suite passes" gate rather than surfacing as another null months later.
3. Both arms of every affected scoring task are re-run. T01 is a pilot and ungraded; its existing runs do not enter the scoring dataset (see R-001).
4. Raw provider-reported usage is preserved alongside whatever normalization S3 uses. An estimated or reconstructed token count is never substituted for provider-reported usage — if a provider returns nothing, that is recorded as missing, not filled in.

Condition 4 deserves its own sentence: a cost criterion that quietly accepts estimates is a cost criterion that cannot fail. If usage is unavailable for a task, the honest report is a gap, not a guess.

**Implementation record:** implemented 2026-08-07. Full detail in `reviews/IMPL-A001-A002.md`.

*Cause:* the runner read `result.turn?.usage`, a field the Codex app-server protocol never sends. Not a flaky capture — it could only ever have been null. Usage arrives on its own `thread/tokenUsage/updated` notification, keyed by thread; `turn/completed` carries none.

*Change:* capture the notification's payload verbatim (thread-matched, so subagent turns are not billed to the main turn); project `.last` for per-turn cost; record `usageStatus` of `captured` / `missing` / `not-applicable` so a null can no longer mean two different things; sum across calls, since a malformed-output retry is a second billed turn.

*Validation:* 15 new assertions in `scripts/test/protocol-tests.mjs` §13, driven by a payload captured from a live session rather than hand-written, including a direct assertion that a `turn/completed` payload yields no usage — so reverting to `turn.usage` fails the suite. Protocol suite: 46 passed, 0 failed. Verified live end to end: `usageStatus: "captured"`, 20,226 tokens on a real Codex turn.

Conditions 1–4 are met. S3 is computable on the token axis.

---

## A-002 — Reviewers receive a scrubbed full checkout, not a slice

**Rules affected:** §2 (*"Reviewers receive the repo checkout and the diff"*) and Appendix A's uniform artifact spec (*"the artifact under review is the file(s) changed by the fix commit, at the buggy SHA, sliced to the enclosing scope"*).

**The conflict.** These two provisions pull apart, and the pilot forced the issue. Supplying the task clone literally — as §2 reads — hands reviewers the answer key: the clone's object store contains the fix commit, so `git log --all` or `git show <fix SHA>` retrieves the ground truth directly. Detaching HEAD at the buggy SHA does not help; the objects are still there. The pilot therefore followed Appendix A and gave reviewers the slice only, and flagged the deviation rather than burying it.

**Resolution.** Neither horn. For all 25 tasks and both arms, reviewers receive a **scrubbed full checkout**: the repository tree exported at the buggy SHA into a freshly initialized, history-free Git repository. This honours §2's intent — reviewers get a real checkout they can navigate and run — while making ground truth unreachable by construction rather than by instruction.

**Scrub requirements.** The scrub must be stronger than exporting a tree. Each review repository must:

- contain a newly initialized Git history derived only from the buggy tree;
- carry no original object database, alternates, packfiles, reflogs, remotes, tags, branches, submodule metadata, worktrees, or replace/graft references;
- exclude benchmark records, fix metadata, issue and PR identifiers, and construction artifacts;
- present byte-identical task inputs to both arms, verified by hashing the runner's collected context;
- be verified mechanically by a construction-and-audit process that does not disclose defect content to the orchestrator;
- retain a manifest or hash set sufficient to prove the exported files match the buggy tree.

Alternates, grafts, replace refs, and submodule metadata are each an independent path back to the fix commit; the manifest is what lets a third party confirm the export is faithful rather than trusting that it is.

**Reporting constraint.** Absolute detection rates must be described as review of *a scrubbed buggy-SHA checkout plus the frozen artifact* — not as review of the original clone, and not as review of a bare slice. The A-versus-B comparison is unaffected either way, since both arms receive identical inputs; the absolute numbers are conditional on this construction and must be reported as such.

**Consequence for the pilot.** Supplying a full checkout changes the runner's collected context, so T01's slice-only pilot runs are not comparable with scoring runs and are superseded (see R-001).

**Implementation record:** implemented 2026-08-07 as `bench/make-scrubbed-checkout.mjs` and `bench/audit-scrubbed-checkout.mjs`. Full detail in `reviews/IMPL-A001-A002.md`.

*Constructor:* exports the tree blob-by-blob from `git ls-tree` + `git cat-file` rather than via `git archive`, because `git archive` honours `export-ignore` and would silently drop paths — producing a checkout that does not match the tree its manifest claims. Fresh `git init`, one commit, fixed harness identity and date, reflogs removed, `git add -A -f` so the tree's own `.gitignore` cannot skip tracked paths. Every scrub requirement in this entry is enforced.

*Manifest:* source repo, buggy SHA and tree SHA, import commit and tree, policy, counts, every exclusion with its reason, and per file `{path, mode, oid, bytes, sha256}`. The blob `oid` taken from the source tree is what makes the export provable rather than plausible.

*Audit:* 20 checks, re-deriving rather than trusting — content hashes and blob ids recomputed, file set compared both ways. `--forbidden-sha` asserts the fix commit does not resolve inside the scrubbed repository, and the audit reports that the decisive check did not run rather than passing quietly if it is omitted. Output is a verdict and counts only, safe for a contamination-sensitive orchestrator.

*Validation:* T01 built and audited — 446 files, 4 exclusions, `verdict: PASS`, 0 of 20 checks failed. Negative test against the unscrubbed clone fails 8 checks including fix-commit reachability, confirming the audit detects the condition it exists to prevent.

**One open item raised by the implementation.** Agent-instruction files (`CLAUDE.md`, `AGENTS.md`, `.claude/`, `.codex/`, …) are excluded by default, because CLAUDE.md is read by Claude and AGENTS.md by Codex — leaving both in place gives each arm different repository-authored instructions in exactly the variable the benchmark holds constant. T01's tree ships both. This exclusion is an *extension* of the ruling above, not an application of it: the approved spec authorizes excluding benchmark records, fix metadata, and construction artifacts, and these are none of those. It needs a decision before the scoring run since it applies to all 25 tasks. `--keep-agent-instructions` reverses it; every manifest records which way it went.

---

## R-001 — Subagent isolation is sufficient; T01's pilot runs are superseded

**This entry amends no rule.** It rules that the isolation design already documented in `reviews/PILOT-T01.md` §2 satisfies the frozen spec, and settles how T01 is treated in the dataset. It is recorded here because it determines dataset composition and because the authorization is the same exchange.

**Ruling.** Fresh-subagent isolation is sufficient to break contamination of the orchestrator's conversational context — **provided** it is genuine no-history isolation *and* the contaminated orchestrator cannot transmit information through prompts, summaries, file modifications, environment variables, or selectively chosen inputs. The controls documented in the pilot report are adequate in principle: fresh critic and defender contexts, no benchmark framing or ground-truth material supplied to them, file-path handoff rather than orchestrator-authored summaries, contamination-safe construction records reviewed by a separate auditor, byte-identical arm inputs, findings hidden from the orchestrator during execution, and a fresh defender per round carrying state only through the frozen ledger.

The qualification matters more than the approval. Because all parties share one filesystem, "fresh context" alone establishes nothing — a subagent that can read anything can read the fix commit. The allowlisted input discipline in each brief, and the hashes proving both arms saw identical input, are load-bearing parts of this ruling, not supporting detail.

**Attestation required in each re-run record.** That every participant could access only the scrubbed checkout and the prescribed debate files, and that subagents were spawned without inherited conversation history.

One honest limit on that second clause: the orchestrator can attest to what it passes each subagent and to the allowlisted paths in each brief, and those are auditable from the run record. Whether a subagent truly begins with no inherited context is a property of the agent harness, not something the orchestrator can prove from inside a run. The attestation should say exactly that rather than overclaim.

**T01's treatment.** T01 Arm A may be re-run clean and scored. But the cleaner course, and the one adopted: **re-run both T01 arms** under the final scoring configuration — repaired token capture (A-001) and scrubbed checkout (A-002) — and replace both pilot outputs. A newly run Arm A must not be paired against the existing Arm B, which is slice-only and token-incomplete. The pilot's two closed debates survive as descriptive evidence about the machinery, not as data about the question.

If the attestation conditions above cannot be demonstrated at re-run time, T01 remains unpaired: excluded from paired A-versus-B aggregates, with its Arm B result reported separately as descriptive pilot evidence only.

---

## Sequencing

The order is forced by dependency, not preference:

1. Implement A-001 and its protocol test.
2. Build the A-002 scrubbed-checkout constructor, its audit path, and the manifest format.
3. Re-run T01 both arms under the final configuration; record the R-001 attestation.
4. Begin the scoring run over all 25 tasks.

No task result counts toward S1/S2/S3 until steps 1–3 are complete.
