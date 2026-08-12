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
| Q-001 | Shared reviewer scratch directory; T01–T06 treatment | **ruled 2026-08-09 — re-run both arms of T01–T06 (Option 2b)** | consult 006 |
| Q-002 | T10/T11 share a source path; aggregate treatment | **ruled 2026-08-09 — 25-task primary + T11-dropped sensitivity (Option C)** | consult 006 |
| A-004 | Arm A critic messages are schema-enforced in the harness | approved, implemented 2026-08-11 | consult 007 |
| Q-003 | T07 Arm B never used a private seat; T07 re-run in both arms | **ruled 2026-08-12 — re-run both arms, B-first** | consult 008 |

Michael Traw's approval: ☑ A-001 ☑ A-002 ☑ R-001 — all three approved 2026-08-07. ☑ A-002-E1 — approved 2026-08-08. ☐ Q-001 ☐ Q-002 — ruled 2026-08-09, approval pending.

**Third authorization** (Q-001, Q-002): consult exchange 006, 2026-08-10T01:03Z (local 2026-08-09). Committed verbatim at `reviews/CHATGPT-RULING-019-q001-q002-isolation-independence.md`, `sha256 3c64c0179b051c1a63fc455314002c2806f1c211564adc30419abb96769bb7fa` — byte-identical to the runtime log the plugin wrote at `.council/consult/006-2026-08-10T01-03-27-642Z.md`, which is gitignored runtime output. The submission is `reviews/CLAUDE-QUERY-018-isolation-and-independence.md`, `sha256 3e98d67434191d1abce3697a013e6395d0db9a49576f45d0a338cfa3b2c7eddb`. Both questions are stated in full in `reviews/BATCH-T07-T11.md` §6.

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

## Q-001 — Reviewer scratch isolation: T01–T06 are re-run in both arms

**Rules affected:** R-001's isolation attestation, and therefore the validity of every T01–T06 scoring debate.

**The defect.** Every reviewer subagent in an orchestrator session shared one scratch directory. Reviewers write reproduction scripts there under the frozen scratch policy, and a reproduction filename names the defect mechanism. Because arms run sequentially in one session, the **second-running arm's reviewers worked in a directory already holding the first arm's filenames for the same task**. In T01–T06 that directory *was* each reviewer's own working directory, so a routine listing sufficed.

**Why R-001's attestation did not cover it.** No brief told reviewers the directory was off-limits, and the leak needs no file read — the filename alone carries the mechanism. A reviewer listing its own working directory would have been contaminated without violating any instruction and without cause to report it. R-001 anticipated exactly this: *"a subagent that can read anything can read the fix commit."* Its qualification, not its approval, proved load-bearing.

**Ruling (consult 006).** Option 2b, unconditional. The proposed sensitivity-analysis trigger was **rejected** on a point worth preserving: agreement between a 25-task and a 19-task analysis *"could occur despite contamination, particularly with coarse pass/fail gates"* — such agreement would show the threshold verdict was unchanged, not that the recorded findings were uncontaminated, so it *"cannot credibly authorize retaining the affected debates."* Option 2a was rejected for preserving an avoidable within-pair environment asymmetry and contradicting the R-001 precedent.

The orchestrator's characterization of cross-task exposure as benign was **not accepted**: a filename from another task can prime a bug mechanism, especially within one repository or across dependent commits. This does not widen the ordered re-run beyond T01–T06, but the T07–T11 audit must test actual cross-task exposure rather than assume it away.

**Binding conditions, all twelve:**

1. Re-run both arms of T01–T06 under the final per-seat isolation policy; supersede all twelve existing scoring debates and preserve them under explicit `VOIDED` labels.
2. Follow the original pre-registered arm order per task.
3. Fresh review-repository copies, debate contexts, Codex threads, subagents, and opaque scratch seats.
4. No participant may list, glob, traverse, or inspect a parent or sibling scratch directory; temp files, bytecode, package caches, test caches and virtualenvs redirect into its own seat.
5. Archive every participant's control-plane declaration of whether it encountered any foreign scratch path, filename, content, or directory listing.
6. A participant that encounters a foreign scratch filename or content **voids that arm immediately**; if the encounter could expose task-specific information to the paired arm, both arms are re-run.
7. Verify each seat is empty before its arm and unreachable from others after — via symlinks, shared caches, environment variables, or inherited working directories.
8. Do not copy reproduction files from voided runs into new seats.
9. Same finalized staging, prompts, cost capture, provider-rate policy, machine class and harness configuration for both arms.
10. Record provider/model drift and dates, but **do not** use unavoidable drift as a reason to retain the known-defective runs.
11. Exclude voided-run usage from S3; report it separately as **benchmark remediation overhead**, not scoring cost.
12. Before grading, audit T07–T11 against the final isolation policy. T07 is valid only if both retained arms used private seats and neither received intelligible foreign scratch information. A prohibited parent listing that exposed **only opaque, undecodable seat names** may be recorded as a protocol deviation without voiding; exposure to a **descriptive filename or file content** triggers the applicable re-run rule.

A 19-task sensitivity analysis may still be reported as a diagnostic, but it is not a substitute for remediation and must not determine whether the re-runs enter the dataset.

**Status:** ordered, not yet executed. Scheduled alongside the remaining batches; T12–T25 proceed in the meantime. ~~The two disclosed T07–T11 parent listings both exposed only opaque seat names (`_scratch/s<12-hex>`, with the decoding map held outside the tree), which condition 12 admits as a recorded deviation rather than a void — but that determination belongs to the condition-12 audit, not to this note.~~

> **CORRECTION, 2026-08-12 (append-only, required by consult 008 condition 10).** The struck sentence above is the orchestrator's original text, preserved rather than rewritten. **It was wrong on two counts**, both disproved by the condition-12 audit it defers to:
>
> 1. It says *both* disclosed listings exposed only opaque seat names. **True of one, false of the other** — the T07 Arm A round-2 listing returned task/arm/role/round directory names, not hex.
> 2. It counts only two listings. **A third exposure existed and was not then known:** T07 Arm B never used a private seat at all, and its defender listed the shared orchestrator scratchpad twice, receiving other tasks' constructor filenames.
>
> This is precisely the "characterization of cross-task exposure as benign" that consult 006 declined to accept, written by the party the ruling declined to take at its word. The scepticism was warranted. See **Q-003** below.

---

## Q-002 — T10/T11 dependence: 25-task primary stands, with a T11-dropped sensitivity

**Rule affected:** §4's aggregation over 25 tasks.

**The facts.** T10 and T11 are identity slices of the same source file at two different commits; T11's fix is a follow-up to T10's, so T11's buggy tree contains T10's fix as ordinary code. Nothing leaks between them — fresh contexts, per-debate Codex threads — but they are not independent observations, and if T11's defect predates T10's buggy SHA then T10's reviewers could legitimately surface it. Appendix A's pre-freeze screens covered CVEs, backports, class caps and language balance, not same-file adjacency.

**Ruling (consult 006).** Option C. Both tasks stay in the frozen primary dataset: their construction is valid, their contexts are isolated, and substitution was never pre-registered for statistical dependence. Option A was rejected because no cluster-combination rule was pre-registered and different rules would change S1's numerator; Option B alone was insufficient because the dependence can be quantified without touching the primary.

**Binding conditions:**

1. The 25-task analysis remains the sole pre-registered primary.
2. Remove T11 from **both arms** in the sensitivity analysis; never from one metric or arm only.
3. Recompute S1, S2 and S3 from the remaining 24 paired tasks — do not subtract T11 from a displayed total.
4. Apply the frozen thresholds literally unless BENCHMARK.md already defines an N-dependent formula; do not rescale for N=24.
5. Report primary and sensitivity together with numerators, denominators, medians and pass/fail outcomes.
6. On divergence, report it as a robustness limitation. Do not select the more favourable analysis, retrospectively combine the pair, or substitute a task.
7. Grade under the frozen task-local rules. If T10 identifies the defect T11's fix addresses, it may count as a verified additional finding for T10 if it independently satisfies metric 2, and as ground-truth detection for T11 if found there. Disclose the cross-task duplication.
8. **Before grading, run a contamination-safe dependency screen across all 25 tasks** for: identical source files or identity slices; overlapping artifact ranges; ancestor/descendant commit relationships in the same repository; fixes already present in another task's buggy tree; and direct follow-up or superseding fixes.
9. The auditor exposes only a dependency matrix and mechanical ordering facts before grading — never defect descriptions.
10. If further dependent components are found, **pause grading** and submit one uniform component-level sensitivity rule for review. Do not improvise pair-by-pair handling once outcomes are visible.

**Status:** conditions 1–7 bind at grading time. Condition 8's screen is scheduled before grading and is a superset of the T07–T11 same-path check already performed.

---

## A-004 — Arm A's critic message is validated against the frozen schema

**Rule affected:** §1's arm definitions — specifically the requirement that the arms differ by critic identity and nothing else — and therefore §4 criterion **S1**.

**Fourth authorization:** consult exchange 007, 2026-08-11T19:38Z. Committed verbatim at `reviews/CHATGPT-RULING-021-armA-schema-asymmetry.md`, `sha256 f01247ceb015deb39f72428e49ffb9bee7d7013d4162e1398e136dc2ee3b87aa` — byte-identical to the runtime log the plugin wrote at `.council/consult/007-2026-08-11T19-38-58-914Z.md`, which is gitignored runtime output. The submission is `reviews/CLAUDE-QUERY-020-armA-schema-asymmetry.md`, `sha256 bb443e3f206005245f8c103d4f410fe769bbd509309cbc258ac0e83b7b663a10`.

**The defect.** The arms differed in whether the critic's *output* was schema-enforced. Arm B's Codex critic is called with `outputSchema: readOutputSchema(SCHEMA_PATH)`, so the provider enforces `council-message.schema.json` at generation time, and a reply that still fails to parse earns one retry nudge on the same thread. Arm A's Claude critic delivers its message through `COUNCIL_MOCK_CRITIQUE`, and the runner does exactly `message = readJson(process.env.COUNCIL_MOCK_CRITIQUE)` — **the schema is never applied.** The runner's `validateMessage()` is a hand-rolled check of protocol *legality*, not of the schema: it range-checks `confidence` but never type-checks `evidence`.

**Why that is not a cosmetic difference.** The anti-inflation rule reads `if (!looksCheckableEvidence(finding.evidence)) finding.support_level = "unsupported"`, and `looksCheckableEvidence` returns `false` for any non-string before examining a single character. Unsupported findings are excluded from the verdict by `stepClose`. So an Arm A critic that cited real file:line evidence, encoded as a JSON array rather than one string, had every such finding silently deleted from its verdict — with no error, no warning, and a runner report saying the round was accepted with N new findings. The penalty lands directly on **S1, ground-truth detection**, in one arm only. It measures which arm had a schema attached, not critic quality.

**How it surfaced.** T15 Arm A round 1. The critic made two errors of the same kind: `confidence` as the string `"high"`, and `evidence` as an array of strings. The first bounced, because someone had hand-written a check for that specific field; nothing entered the ledger, the phase was unchanged, and the critic corrected it in its own seat. The second did not bounce. That asymmetry between two identical mistakes is the defect in miniature — the mock path was validated by an ad-hoc subset of the schema instead of by the schema.

**Resolution (Option 1, approved).** Validate every Arm A critic message against the same frozen `council-message.schema.json` before it is handed to the runner, in the **benchmark harness** rather than in the plugin. `COUNCIL_MOCK_CRITIQUE` is a benchmark affordance, not a product feature; its missing enforcement is a defect in how Arm A's message is delivered, not in the council plugin. Fixing it here **leaves the plugin pinned at `f976990`**, so T15–T25 run against the same code under test as T01–T14. The ruling agreed, and recorded the product-level gap as a post-run engineering item instead.

**Binding conditions, all ten, and how each is met:**

1. *Pin and record the schema's sha256; both arms use the same version.* — `plugins/council/schemas/council-message.schema.json`, `sha256 6e78ea61a2ddad2d43c70c5f12d05cf9f3043726676d4716de4b3e7f294fafd3`. The validator loads that exact file, and a test asserts the loaded schema still declares `evidence` a string, `confidence` a number, and `additionalProperties: false`.
2. *Use a standards-compliant JSON Schema validator; do not reproduce the schema with another hand-written subset.* — Ajv 8.20.0, vendored under `bench/vendor/`. Writing a second hand-rolled checker is what caused the defect; the fix must not repeat it.
3. *Validate before ledger ingestion or anti-inflation rewriting.* — `bench/inject-armA.mjs` validates before the runner process is spawned at all. A test writes a sentinel ledger and asserts it is byte-identical after both an invalid attempt and an abort.
4. *Retain `validateMessage()` for protocol/state legality; run both layers and report their errors together.* — the runner's checks are untouched. The harness additionally re-checks round, side, claimant and id format so the critic sees **every** reason its message would be refused in one report, rather than discovering the second only after fixing the first.
5. *Protocol tests for nine named cases.* — `bench/test/harness-schema-tests.mjs`, **69 assertions, 0 failures**, covering array-valued `evidence`, string-valued `confidence`, each missing required field, undeclared properties, invalid nested response fields, valid messages passing unmutated, one successful correction, a second invalid submission aborting, and no ledger mutation before successful validation. These live in `bench/` on purpose: adding them to the plugin's own suite would move the pin.

   **Fixture correction, 2026-08-11, disclosed rather than silently patched.** The first version of the nested-response cases built their fixtures with a key named `id` where the schema requires `finding_id`. Every such case therefore failed validation for *two* reasons at once, and the assertions — which only checked that *at least one* error of the expected category was present — passed without actually testing the defect they named. The fixtures were rebuilt from a response object that is valid on its own, so each case now injects exactly one defect and asserts `errors.length === 1`, and four further cases were added (missing `finding_id`, an undeclared response property, an out-of-enum `contest_support_level`, and a positive control asserting the fixture itself validates). Count went 59 → 69. **`validate-critique.mjs` and `inject-armA.mjs` were not touched**, so no run behaviour changed; only the test file's frozen hash moves, and both values are recorded below. A test that passes for the wrong reason is worse than a missing test, because it is counted as coverage.
6. *Archive the invalid payload, errors, corrected payload, attempt count and usage outside reviewer-visible paths.* — written to `_rerun2/_rejected/<arm>/`, never into the arm log directory, which reviewers do read. A test asserts no rejected artifact appears in the log directory.
7. *Neither critic nor defender in the paired arm may access rejected messages or validation artifacts.* — same mechanism; the rejected directory is named in no brief.
8. *Freeze the corrected harness and its hash before restarting T15.* — `bench/validate-critique.mjs` `sha256 8d196a4715f0f1b913f5ead3fd1e06bd08fda10cb6b298c40d0664ce7c07aa36`; `bench/inject-armA.mjs` `sha256 9006f6de740397ef5c470ae99e4a180238667d4245c8bbe5ed5681bb74457b5f`. Both frozen before T15 restarted and **unchanged since**. The test file was frozen at `f737e464cfcea0e6ca25c616d1ef29532282af9d30717400b4087af4669e915d` and re-frozen the same day at **`be85f57ace244eefd689664daeb97eb89a433085b56108ede2996891a5cef52a`** after the fixture correction described under condition 5; it is a test artifact and executes no part of a run.
9. *Record as a §5 implementation repair discovered before grading, with the retrospective audit and the T15 disposition.* — this entry.
10. *Do not change defender enforcement mid-run.* — unchanged. Defenders are Claude in both arms and equally unenforced, so that gap is symmetric and cannot bias A against B. It is a post-run item.

**Contamination safety of the error reports.** Validation errors emit JSON Pointer paths, expected types, and error keywords only — **instance values are never printed**. A test feeds a sentinel string into four different fields and asserts it appears in no error string. So a validation failure cannot teach the orchestrator, or a log reader, anything about finding content.

**Retry budget.** Exactly one correction, mirroring Arm B's single malformed-output retry. A second invalid submission aborts the critic step under the same policy Arm B faces when its retry is exhausted. An unlimited bounce-and-correct loop was rejected as an advantage to Arm A that would also distort cost and convergence. The correction attempt's usage stays inside the same seat's transcript and is therefore counted in that arm's scoring cost, exactly as Arm B's billed retry would be.

**Retrospective audit (condition 3 of the ruling's §3).** Zero `unsupported` findings was held to be necessary but not sufficient, so every archived Arm A critic payload was validated against the schema now enforced. The audited files are `critique-mock-r<N>.json` — the exact bytes `COUNCIL_MOCK_CRITIQUE` pointed at, i.e. pre-ingestion critic output, not a ledger-normalized representation.

**Result: 29 of 29 payloads across T01–T14 are schema-valid**, including the three rounds of the voided pre-isolation T07 Arm A run. Only T15 Arm A round 1 fails, with 3 `wrong-type` errors. **No re-run of T01–T14 is required on this ground.** The audit table carries task, round, validity and error-category counts only.

**T15's disposition.** Re-injecting a corrected message from the existing seat was **rejected**: the seat had completed its search, had learned that two encodings crossed different validation boundaries, and would have been receiving a remediation opportunity designed after its output was observed — and "encoding only" would require a semantic-equivalence judgment that was never pre-registered. T15 Arm A is voided and preserved at `_rerun2/T15-armA-VOIDED-SCHEMA-ASYMMETRY/`, including both scratch seats, which were moved out of `_scratch/` entirely so no future participant can reach them even by a prohibited parent listing. Arm B had not begun, so T15 restarts from the beginning in its scheduled order (A first) with fresh seats. Voided usage is **excluded from S3 and reported as benchmark remediation overhead**, following the Q-001 precedent.

---

## Q-003 — T07 Arm B never used a private seat: T07 is re-run in both arms

**Rules affected:** Q-001 conditions 2, 6, 9 and 12, and therefore the validity of T07 as a
paired scoring observation.

**Fifth authorization:** consult exchange 008, 2026-08-12T12:32Z. Committed verbatim at
`reviews/CHATGPT-RULING-023-t07-armB-isolation.md`,
`sha256 28863a28973741a86733c047407c2d0c2b8bfc28255cce23868b8fd22e105eb6` — byte-identical
to the runtime log the plugin wrote at `.council/consult/008-2026-08-12T12-32-29-393Z.md`,
which is gitignored runtime output. The submission is
`reviews/CLAUDE-QUERY-022-t07-armB-isolation.md`,
`sha256 6d39c3963139f4c2f297caac5b9f58cc44caf7ce4cbc7608c67ccc681bf9a07f`.

**The defect.** Q-001 condition 12 ordered an audit of T07–T11 against the final per-seat
isolation policy. It found that **T07 Arm B never used a private seat**. It worked in the
orchestrator session's shared scratchpad, which simultaneously held the working files of all
five T07–T11 constructors and of the contamination auditor, and which the already-voided
pre-isolation Arm A run later reused. **Arm B's defender listed that directory twice and
received other tasks' constructor filenames.** Cross-task foreign strings were confirmed for
T07 pairing T07←T10 explicitly, and also T07←T08, T07←T09, T07←T11 — in Arm B only. That is
not the opaque-name carve-out; constructor filenames are descriptive, and the audit's name
inventory confirms Q-001's premise directly (descriptive/opaque counts per task: T07 14/51,
T08 5/10, T09 8/18, T10 32/12, T11 96/15).

**Why the seat map did not catch it.** The map asserts a T07 Arm B defender seat **that was
never used**, and names a T07 Arm A critic directory **that does not exist**. The auditor
re-derived every seat from the 38 participant transcripts instead of trusting the map, which
is the only reason the finding surfaced. Scans covered each debate's seats, arm log
directory, arm repo, all participant transcripts and the five Codex rollouts — 221–261
foreign terms per debate, each scan gated on a known-present control string so a silently
empty search could not pass as clean.

**Ruling (consult 008): re-run both arms of T07, B-first.** Condition 6 sets the minimum
immediate invalidation — the exposure voids Arm B — but does not require retaining the other
arm when that leaves an avoidable, structurally mismatched pair. A replacement Arm B paired
with the retained Arm A would invert the realized schedule, cross dates and harness regimes,
and preserve exactly the within-pair asymmetry for which consult 006 rejected Option 2a. The
cost of avoiding it is one additional debate.

On arm order specifically: a single-arm re-run does **not** satisfy condition 2 merely
because the original executions ran B-first. Once the original Arm B is void it no longer
supplies the B-first observation, so pairing the earlier Arm A with a later replacement Arm B
would make the scored pair A-first in realized time — defeating the draw's purpose of
balancing temporal and implementation drift.

**Binding conditions, all twelve:**

1. Preserve every prior T07 debate under an unambiguous `VOIDED` label, including the
   pre-isolation Arm A run and the presently retained A/B pair.
2. Re-run T07 from the task boundary, **Arm B first, Arm A second**, per the pre-registered
   schedule.
3. Same finalized staging, prompts, schema-validation harness, cost capture, provider-rate
   policy, machine class, scratch policy and plugin pin for both replacement arms.
4. Fresh repository copies, debate identifiers, Codex threads, no-history subagents, opaque
   scratch seats, temporary directories, environments and caches.
5. Verify mechanically that every assigned seat exists, is empty before use, **is the
   participant's actual working directory**, and matches the path recorded in the manifest.
6. Derive the post-run seat audit from transcripts and process records **as well as** the
   seat map. The map is never sufficient evidence by itself.
7. Require the foreign-scratch declaration from every participant.
8. Any intelligible foreign filename or content encountered by either replacement arm voids
   the replacement pair and requires another complete T07 re-run.
9. Archive old and replacement usage separately; exclude all voided usage from S3 and report
   it only as remediation overhead.
10. Record the erroneous seat-map entries and the amendment-status statement as **append-only
    corrections**, preserving the original text and identifying when and how each was
    disproved. (Done: see the correction block under Q-001's Status, and the run record.)
11. **Do not** give the replacement participants this audit, the exposed filenames, prior T07
    findings, prior reproduction material, or the reason T07 is being re-run.
12. Only the final clean replacement pair is T07's scoring observation.

**T08–T11: T09–T11 retained clean; T08 re-run in both arms.** The audit found no foreign
strings, cross-seat links, shared caches or environment crossings in those tasks, and no
reachability channel anywhere (no cross-seat symlinks in either direction, no hard links,
per-seat venvs and bytecode mirrors referencing only their own seat, every seat empty before
use). **T09, T10 and T11 are retained as clean in all six debates.**

**T08's conditional retention failed.** The ruling made T08 contingent on two limbs, and
required re-running both arms if either failed.

- **Limb (a) — the listing's own text — passes.** The prohibited listing produced exactly
  **one** entry: a 12-hex opaque seat name behind a literal prefix character, naming a
  directory that no longer exists and appearing as neither key nor value in the mapping.
  Zero identifying entries. The six adjacent lines in the same tool result identify no
  foreign entity — the participant's own assigned seat, two interpreter locations, two
  "not found" strings, and a version string. The auditor also reproduced the collation under
  the same locale to confirm that **output truncation was not doing the work**; the
  identifying material sorts well past the truncation point either way. Tested, not asserted.
  This is materially unlike the T07 Arm A listing, which returned three entries identifying
  on four axes at once.
- **Limb (b) — decodability — fails, on a positive finding rather than absent evidence.**
  Treating "the mapping lives outside the scratch parent by design" as a claim to verify
  rather than a premise, the auditor traced the mapping's location over time from three
  independent sources — the orchestrator's own tool calls, filesystem birth/modification
  times, and the participant's transcript. All three agree: **the seat-map file was created
  inside the very directory the participant listed** (06:59:19Z), rewritten there into the
  per-(task, arm, role) form governing T07–T11 (07:49:48Z) and patched there (07:50:06Z).
  The listing ran at **08:17:51Z**. The map was moved out to its present location at
  **08:24:53Z — 422 seconds after the listing**, in the same orchestrator turn that
  submitted that participant's round-1 rebuttal. *The relocation was the remediation for
  this very disclosure.* Corroborated by birth timestamps: the present parent was born at the
  relocation time while the file inside retains its 06:59:19Z birth, the signature of a file
  created elsewhere and moved in.

So at the instant of the listing, a complete decoder for every opaque seat name in T07–T11
sat one unrestricted read away at a fixed relative path from the participant's own seat.
**The pre-existing record's premise — that the decoding map is held outside the tree — is
true only from 08:24:53Z onward, and false for the moment that matters.**

For the record, the participant did **not** use it: zero decoder-related tokens anywhere in
its transcript, the only scratch token being its own seat, its brief never mentioned the
mapping and named no other seat, and it disclosed the breach unprompted. But the ruling
tests **access, not use**, and that is the right test — the participant had already crossed
the same instruction boundary that was the only thing standing between it and the decoder.

**Disposition: re-run both arms of T08** under the same pair-level rule as T07, i.e. Q-003's
twelve conditions applied to T08 with its own pre-registered arm order (**A-first**).
**T08 Arm B's own conduct tested clean on every measure** — it is re-run by the conditional,
not by any exposure of its own, and the record preserves that distinction.

**Scope, checked rather than assumed.** The decoder was exposed in that directory from
06:59:19Z to 08:24:53Z. Four participants were active in that window: the T07 Arm A round-3
pair and the T08 Arm A pair. Only the T08 Arm A defender listed the parent; the other three
never referenced it and never named the decoder. T07 is void in both arms regardless, so the
window adds nothing further to the re-run list.

**Two further undetermined items**, recorded: about 66 opaque directories present in the
scratch parent on that date have since been deleted, so whether any *other* non-seat file sat
there at 08:17:51Z cannot be reconstructed — the decoder is the only non-seat entry that can
be positively placed there; and the orchestrator's session helper library, which defined the
arm functions and may or may not have carried seat attributions, sat in a brief-prohibited
path and has since been deleted, so it cannot be inspected. The participant's transcript
shows no access to either.

**Three claims the final report must keep distinct**, per the ruling — and it must not
upgrade the third into proof that exposure was impossible:

- **Demonstrably contaminated:** T07 Arm B.
- **Audited with a recordable opaque-name deviation:** T08 Arm A.
- **No evidence of exposure within available records:** the remaining retained T08–T11 arms.

**Six undetermined items accepted as recorded limitations**, none changing the disposition:
the deleted shared-scratch state (moot — T07 is void); incomplete Codex-side observability
(disclose as an audit limitation, not a clean-room proof); ~66 opaque directories since
deleted (acceptable where the listings that actually occurred are captured verbatim);
mapped-but-missing directories (record as provenance defects; the map is not affirmative
evidence); trace-free channels (an inherent limit of retrospective isolation audits); and
T01–T06 being out of scope (already fully ordered for re-run).

---

## Sequencing

The order is forced by dependency, not preference:

1. Implement A-001 and its protocol test.
2. Build the A-002 scrubbed-checkout constructor, its audit path, and the manifest format.
3. Re-run T01 both arms under the final configuration; record the R-001 attestation.
4. Begin the scoring run over all 25 tasks.

No task result counts toward S1/S2/S3 until steps 1–3 are complete.

**Amended 2026-08-09 by consult 006.** Steps 1–4 stand; three obligations are added after step 4 and before grading:

5. Re-run both arms of T01–T06 under per-seat scratch isolation (Q-001, twelve conditions). The superseded debates are preserved as `VOIDED` and their usage is excluded from S3, reported instead as remediation overhead.
6. Audit T07–T11 against the final isolation policy (Q-001 condition 12), testing actual cross-task exposure rather than assuming it benign.
7. Run the contamination-safe dependency screen across all 25 tasks (Q-002 condition 8). If it finds dependent components beyond T10/T11, grading pauses for one uniform component-level rule (Q-002 condition 10).

Steps 5–7 may run in any order relative to the remaining task batches, but all three must complete before any grading begins. No T01–T06 result counts toward S1/S2/S3 until step 5 is complete.

**Amended 2026-08-12 by consult 008.** Step 6 has now executed and produced two further obligations:

8. **Re-run both arms of T07**, Arm B first, under Q-003's twelve conditions. The prior pair and the pre-isolation Arm A run are all preserved as `VOIDED`; only the clean replacement pair is T07's scoring observation. No T07 result counts toward S1/S2/S3 until this completes.
9. **Establish the T08 Arm A opaque-name carve-out mechanically** — archive the verbatim listing output and prove no reachable mapping decoded the names. If either leg fails, both T08 arms are re-run as well.

Step 7 has **already been triggered in substance**: the T17–T20r contamination audit's cross-task matrices found dependent components beyond T10/T11 (T01/T17 partially overlap ranges in the same source file). Q-002 condition 10 therefore binds — grading pauses for **one uniform component-level sensitivity rule submitted for review**, and pair-by-pair improvisation is forbidden. The dedicated screen still runs, so that the rule is proposed against an independently derived matrix rather than against a by-product of another audit.
