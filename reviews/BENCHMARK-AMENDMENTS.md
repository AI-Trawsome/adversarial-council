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
| A-002-E1 | Agent-instruction files excluded from scrubbed checkouts | countersigned, implemented 2026-08-08 | consult 002 |
| A-003 | S3 cost basis: provider-specific frozen API-equivalent dollars | approved, implemented 2026-08-09 | consult 005 §1–2 |
| R-001 | Subagent isolation sufficiency; T01 dataset treatment | approved, ruling only — amends no rule | consult 001 §3 |
| **Q-001** | **Shared reviewer scratch directory; T01–T06 treatment** | **open — awaiting ruling** | — |
| **Q-002** | **T10/T11 share a source path; aggregate treatment** | **open — awaiting ruling** | — |

Michael Traw's approval: ☑ A-001 ☑ A-002 ☑ R-001 — all three approved 2026-08-07. ☑ A-002-E1 — approved 2026-08-08.

**Q-001 and Q-002 are questions, not amendments.** Nothing has been changed under either, and neither blocks continuing the run. Both were found while running T07–T11 and are stated in full in `reviews/BATCH-T07-T11.md` §6, with the evidence needed to rule on them.

- **Q-001** — every reviewer subagent in a session shares one scratch directory, and reproduction filenames written there name the defect mechanism. T07 Arm A was voided and re-run under per-seat isolation; T01–T06 ran under the uncorrected condition in both arms and cannot be re-run as part of that batch. The exposure can only favour whichever arm ran second, and arm order was coin-flipped per task, so it does not bias systematically toward A or B — but it is real per-task noise on the primary metric. This is the failure mode R-001 explicitly warned about: its qualification, not its approval, is what turned out to be load-bearing.
- **Q-002** — T10 and T11 slice the same source file at two different commits, so they are not statistically independent tasks. Nothing leaks between them, and the frozen task list contains both; the question is only how the aggregate should treat them.

Both bear on dataset composition, which is why they are indexed here rather than only in the batch record. Grading is deferred until all 25 tasks have run, so there is time to rule on both without stalling the run.

**Second authorization** (A-002-E1 only): consult exchange 002, 2026-08-08T14:51Z. Committed verbatim at `reviews/CHATGPT-RULING-014-a002-extension.md`, `sha256 3b7b6c28702e7e8bac7f798b251ba3f20fbcdd3e9195e43eddbdf56966c2153c`.

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

**The agent-instruction exclusion raised by this implementation was carried separately and countersigned — see A-002-E1 below.**

---

## A-002-E1 — Agent-instruction files are excluded from scrubbed checkouts

**Standing:** an extension to A-002, not an application of it. A-002 authorizes excluding benchmark records, fix metadata, and construction artifacts; agent-instruction files are none of those. It was therefore put back for a separate countersign (consult 002, 2026-08-08) rather than folded in silently. Approved.

**Rule affected:** A-002's requirement that both arms receive byte-identical task inputs.

**The problem.** Byte-identical inputs do not preserve a controlled comparison when the two critic implementations automatically consume *different subsets* of those inputs. `CLAUDE.md` and `.claude/` are read by Claude; `AGENTS.md` and `.codex/` are read by Codex. A repository shipping both hands each arm a set of repository-authored instructions the other never sees — a treatment difference beyond critic identity, capable of shifting search priorities, tool use, and reporting thresholds, and in principle capable of carrying task-specific hints. This is not hypothetical: T01's tree ships `CLAUDE.md`, `AGENTS.md`, *and* a `.claude/skills/` entry.

**Resolution.** One deterministic, model-neutral, content-blind exclusion policy, applied to all 25 tasks, both arms, and every participant of either role — defenders included. Allowing the defender's repository-specific instructions while suppressing the critics' would simply relocate the hidden prompt channel.

**Binding conditions, and how each is met:**

1. *One deterministic policy across all tasks and both arms, including nested instruction files where discovery is recursive.* — `bench/exclusion-policy.mjs` matches instruction basenames at **any depth**, not just the repository root. A nested `CLAUDE.md` governs its subtree, so a root-only rule would leave the channel open everywhere except where it is easiest to notice.
2. *Exact names and path rules declared in the constructor policy; no task-by-task judgment from file contents.* — the policy is path-shaped and content-blind; nothing inspects what a file says.
3. *Every excluded path, source blob identity, hash, and reason recorded in the manifest.* — exclusions carry `{path, mode, oid, oidType, bytes, sha256, rule, reason}`. A bare path would say that *a file called CLAUDE.md* went, not *which bytes* went.
4. *The auditor verifies both that all policy-matched paths were removed and that no non-matching path was.* — six new checks, described below.
5. *No broad directory exclusion of ordinary project source unless declared and reported as a limitation.* — **declared.** See the limitation statement below; it is embedded in every manifest as `policy.limitation`, and the auditor fails if it is absent.
6. *Same policy for defenders as for critics.* — exclusion is physical, so no participant of either role can read the files.
7. *Absolute results reported as conditional on a scrubbed checkout with repository-authored agent instructions removed.* — recorded here and in `reviews/IMPL-A001-A002.md`; it must appear in the benchmark report alongside the A-002 conditionality already required.

**Declared limitation (condition 5).** Directory-level exclusion of `.claude/`, `.codex/`, `.cursor/`, `.windsurf/`, `.aider/`, `.github/copilot/` removes *everything* beneath those paths, including any file that is ordinary project source rather than agent instructions or configuration. Reliable file-level classification is not available: those trees mix skills, prompts, settings, hooks, and arbitrary helpers with no marker separating what an agent reads from what it does not, and the set varies by tool and by version. The ruling permits the broad rule on condition it is declared — it is, here, in every manifest, and it must appear in the results.

**The alternative we did not take.** The ruling notes that if repository-instruction discovery could be conclusively disabled for every participant, retaining the files as inert reviewable source would preserve more of the original tree. We judged that unavailable: whether a subagent's `CLAUDE.md` discovery is truly off is a property of the agent harness, not something the orchestrator can demonstrate from inside a run — the same limit already recorded in R-001's attestation caveat. Physical exclusion is the auditable choice, and auditability is the point.

**Implementation record:** implemented 2026-08-08. Policy in `bench/exclusion-policy.mjs` (version 2), shared by constructor and auditor — deliberately one module, since an auditor carrying its own copy of the rules would only ever confirm that two copies agreed.

*Audit, both directions:* no policy-matched path survives in the checkout; every recorded exclusion is one the policy independently produces, with the same rule; excluded paths carry blob identity and hash; every source-tree path is either exported or recorded as excluded; every policy-matched source path was excluded; manifest policy version matches the auditor.

*Validation:* T01 rebuilt under policy v2 — 446 files, 4 exclusions, `verdict: PASS`, 0 of **26** checks failed, same deterministic import commit `c79d98ca…` as before. Three negative tests, each isolating a new check: an instruction file surviving in the checkout fails "no policy-matched path survives"; a manifest claiming an exclusion the policy does not produce fails "every exclusion is one the policy independently produces" (1 failure, nothing else); an exclusion recorded without blob identity fails "excluded paths record blob identity and hash" (1 failure, nothing else).

Checking only one direction would have been worse than useless: verifying removals alone passes a scrub that deleted half the repository, and verifying justifications alone passes a scrub that missed an instruction file outright. Neither failure is visible from the other side.

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

## A-003 — S3 cost basis: provider-specific frozen API-equivalent dollars

**Rule affected:** §4 criterion **S3** — *"Arm B's median per-task cost is ≤ 3× Arm A's."*

**The ambiguity.** S3 never defines "cost". That was harmless while both arms were Claude and any token basis gave the same answer. It stopped being harmless once Arm B's critic became a different provider with different token accounting: the three plausible token bases differ by ~1.25× in the reported margin, and one of them (counting cache reads at par with fresh input) makes the metric track conversation length rather than work performed.

**Rejected: a common weight vector.** Our first proposal applied Anthropic's published price ratios to both providers' tokens. Consult 005 rejected it, correctly: that yields *Anthropic-equivalent input units*, not cost for the other provider.

**Adopted.** Modeled API-equivalent dollar cost, computed **separately per provider and model** from that provider's frozen public rate card, then summed across every billed critic and defender invocation in the arm. Per invocation: `fresh input × fresh rate + cache read × cache-read rate + cache write × cache-write rate + output × output rate`. **The gate is the median of per-task ratios, never a ratio of aggregates.**

**Frozen inputs:** `bench/rate-card-frozen.json` (v1) — provider, model identity, identity source, rate source URL, retrieval date, currency, cache-write TTL categories, and rates. **Frozen before T07 and never retroactively updated** when public rates change; this card governs all 25 tasks.

**Codex model identity — evidence, not convention.** Consult 005 required that if the CLI does not disclose an API-priceable model identity, no convenient model may be silently chosen. It does disclose one: `turn_context.model` in Codex's own rollout logs under `~/.codex/sessions/` records **`gpt-5.6-sol`**, independently in all six Arm B runs, unanimous, `cli_version 0.147.0`. That identity appears on OpenAI's public rate card ($5.00 fresh input / $0.50 cached input / $30.00 output per MTok), so the mapping is evidence-based end to end and no conservative-mapping rule was needed. OpenAI publishes no separate cache-write rate, so cache-write tokens are billed at the fresh-input rate — the conservative choice, since any real discount would only lower Arm B. Observed Codex cache writes were zero throughout, so the convention is currently moot.

**Subscription billing, stated rather than exploited.** Codex ran under a ChatGPT subscription: its *observed* billed cost is subscription-flat and its marginal cash outlay is zero. Zero is **not** used in the gate. It describes this deployment's billing arrangement rather than the resource cost of the council, it does not generalize to an API user, and it is the convention that flatters Arm B. Three figures are reported and only one is gated: `observed billed cost` (unavailable / subscription-flat), **`modeled API-equivalent cost` (the S3 input)**, and `subscription marginal cost` ($0, reported, never gated). No fraction of the subscription fee is allocated per task — that would depend on unrelated monthly usage and be less reproducible than the model.

**Disclosure condition (required by consult 005).** **T01–T06 cost data were already known when this ambiguity was resolved.** This is not blind pre-registration. It is defensible because every candidate basis agreed on every observed task and none came near the 3× ceiling — the choice moves the reported number, not the verdict. Having said that, the rule is now frozen and **no further basis change may be made after additional task costs are seen.**

**Sensitivity views.** Bases A (non-cache-read tokens), B (total tokens including cache reads), the rejected common-weight C, and wall-clock are still reported for every task, labelled as token-accounting views rather than the gating monetary cost.

**Implementation record:** implemented 2026-08-09. `bench/rate-card-frozen.json` + `bench/compute-s3-cost.mjs` (deterministic, reads only archived raw payloads). Independent recomputation by a separate agent, forbidden to read the script, reproduced every figure to the cent and additionally exposed erratum **E-002** — see `reviews/ERRATA.md`. Corrected T01–T06: median B/A **0.658×** against a 3.0× ceiling; Codex is 4.2%–8.4% of Arm B's modeled cost.

## Sequencing

The order is forced by dependency, not preference:

1. Implement A-001 and its protocol test.
2. Build the A-002 scrubbed-checkout constructor, its audit path, and the manifest format.
3. Re-run T01 both arms under the final configuration; record the R-001 attestation.
4. Begin the scoring run over all 25 tasks.

No task result counts toward S1/S2/S3 until steps 1–3 are complete.
