# Adversarial AI Council — Merged Plan v2

**Provenance:** This document merges two inputs: (1) Claude's *Adversarial Debate Plugin — Architecture Plan* (v1), which specified the transport and enforcement layer, and (2) ChatGPT's *Adversarial AI Council Proposal*, which specified the debate workflow and operating modes. It also serves as Claude's formal response to the eight questions ChatGPT posed, using ChatGPT's own ACCEPT / PARTIALLY ACCEPT / REJECT taxonomy.

**To ChatGPT, on receiving this document:** This is Round 2. Per your own protocol, classify each position below as ACCEPT / PARTIALLY ACCEPT / REJECT. A REJECT requires cited justification; an ACCEPT requires stating the evidence or argument that persuaded you. Do not concede for agreeableness — a concession without stated reasons will be treated as a protocol violation, not a resolution. Your rebuttal should end with your own updated disagreement ledger.

---

## Part 1 — Claude's classification of ChatGPT's proposal

| # | ChatGPT proposal element | Verdict | Justification |
|---|---|---|---|
| 1 | Independent solutions before cross-examination (Round 1) | **ACCEPT** | Best idea in the proposal. Claude's v1 anchored on a pre-existing artifact; blind parallel solving prevents anchoring for greenfield questions, and the principle extends to review mode: initial critiques should also be written blind. Adopted as the core of Debate mode. |
| 2 | ACCEPT / PARTIAL / REJECT rebuttal taxonomy | **ACCEPT** | Cleaner than v1's open/conceded/disputed labels. Adopted into the message schema as the status vocabulary — but with enforcement added (see Part 3), since the taxonomy alone doesn't prevent reflexive ACCEPTs. |
| 3 | Synthesis ("Solution C") over winner-picking | **ACCEPT** (for generative tasks) | v1's verdict ledger adjudicates but cannot combine. For code review the ship/no-ship verdict remains correct; for design and greenfield work, synthesis is the right terminal step. |
| 4 | Three operating modes (Critic / Debate / Red Team) | **ACCEPT** | Correctly frames Claude's entire v1 loop as the cheap mode (Critic), not the whole product. Red Team side-swap is a sound de-biasing device. Adopted wholesale as the mode structure. |
| 5 | "Deciding Evidence" ledger section | **ACCEPT** | The best small idea in the proposal: it converts every unresolved dispute into a concrete next action instead of a stalemate. Added as a required field on every disputed finding. |
| 6 | Single judge with weighted rubric (30/15/15/15/10/10/5) | **REJECT** | The judge's identity is unspecified and is the load-bearing gap in the proposal. Any single-model judge either graded a contest it competed in (Claude or Codex) or adds cost while substituting different-not-absent biases (third model). The numeric weights are false precision — models emit scores that look calibrated and are not. Replaced by dual judging + mechanical diff + human tiebreak (Part 3). The rubric *criteria* survive as a qualitative checklist; the weights do not. |
| 7 | "Evidence-based rebuttals" as a guiding principle | **PARTIALLY ACCEPT** | Right principle, no mechanism. A principle without enforcement will be violated under sycophantic pressure. Kept, but implemented as schema-level requirements checked by the runner (Part 3), not as prose guidance. |
| 8 | Independence of the two models | **PARTIALLY ACCEPT** | Worth engineering for, but overstated: the models share heavy training overlap, and the "common brief" is authored by a model, so briefing bias precedes Round 1. Mitigation: the brief template is fixed and mechanical (objective, constraints, success definition), and the human can edit it before the round starts. Expect convergent solutions more often than the diagram implies. |
| 9 | Max two debate rounds, hard token/time limits | **ACCEPT** | Cost sanity. v1's default round cap (4) applies to Critic mode; Debate mode uses ChatGPT's fixed pipeline with a cap of two critique↔rebuttal cycles. |
| 10 | No specified communication architecture | **REJECT** (as an omission) | The proposal never answers how the two systems talk — the user's original question. Claude's v1 transport (codex-plugin-cc fork: app-server broker, JSON-RPC to local Codex CLI, ChatGPT-subscription auth, file-based state) is adopted as the chassis underneath ChatGPT's workflow. |

## Part 2 — Answers to ChatGPT's eight questions

**1. Architectural weaknesses.** (a) The judge hand-wave — see verdict #6. (b) No enforcement layer: the proposal's principles (evidence-based rebuttals, no automatic agreement) have no mechanism; two agreeable LLMs will satisfy the letter of ACCEPT/PARTIAL/REJECT while converging by round two. (c) No grounding: nothing specifies what context each model receives or whether critiques can be *checked* against the artifact (run tests, read files). Critique without artifact access is punditry. (d) No orchestrator specification at all.

**2. Better orchestration patterns.** The orchestrator must be deterministic code, not a model. In the merged design, a Node runner (`debate-runner.mjs`) owns the loop: it packages context, relays structured messages, merges them into a ledger file neither model can rewrite, checks termination rules, and diffs judge scorecards. Models argue; code referees. Claude remains a debater whose *messages* pass through the runner like Codex's do — the fairness asymmetry of v1 is reduced to "Claude's session hosts the runner," with a documented escape hatch to a fully standalone runner (zero protocol changes, since all state is file-based).

**3. Prompt designs per phase.** Each phase gets a distinct prompt with a distinct stance: Solve (independent; no knowledge that a debate follows, to avoid pre-hedging), Critique (the codex-plugin adversarial stance: "break confidence in this solution, do not validate it"; findings must cite checkable evidence), Rebut (classify every criticism; REJECT requires cited counter-evidence; ACCEPT requires naming what persuaded you; "the other model is probably right" is not evidence), Revise (change only what a resolved finding justifies; log each change against its finding ID), Judge (score both solutions qualitatively against the criteria checklist; flag every score where you relied on inference rather than evidence).

**4. Failure modes.** *Sycophantic convergence* — the #1 risk; mitigated by anti-capitulation prompt rules plus a runner-side tripwire: if a side ACCEPTs >80% of criticisms in a round with justifications shorter than a floor length, the runner flags the round as suspect in the ledger. *Confident hallucination* — mitigated by the grounding rule: ungrounded claims are marked `unsupported` and excluded from the verdict; either side may request the runner execute read-only checks (tests, grep, git log) and cite output. *Judge bias* — mitigated by dual judging (Part 3). *Cost blowout* — mode tiering, round caps, and per-run token ceilings. *Context exhaustion in long debates* — each round transmits the compact ledger, never full transcripts.

**5. Separate judge or dual judges?** Dual judges, with a twist: both models judge both final solutions against the criteria checklist; the runner mechanically diffs the two scorecards; *agreements* between judges are recorded as settled; *disagreements* — which are exactly the interesting cases — are elevated to the human with each judge's stated reasons and the Deciding Evidence that would resolve them. No fake-neutral third party. The human is the tiebreaker; the machinery's job is to make the tiebreak small and well-framed.

**6. Disagreement ledger improvements.** Merge with v1's schema: every finding carries `id, claim, evidence, severity, confidence, status (open | accepted | partially-accepted | rejected | resolved), deciding_evidence`. The ledger is a runner-owned JSON file — the single source of truth — with a rendered markdown view. Add provenance (which round, which side, what changed) so history cannot be quietly rewritten, and a final section separating consensus, live disputes, and the evidence that would settle each.

**7. Additional operating modes.** (a) *Auto-gate*: Critic mode fired automatically when Claude completes a task, via the codex-plugin's existing Stop-hook review gate — adversarial review as ambient infrastructure rather than a command. (b) *Tournament*: for N candidate solutions (including human-written ones), pairwise Critic passes feeding one synthesis. Deferred until the core modes prove out. (c) Red Team with the side-swap is kept as proposed.

**8. Is there a simpler architecture with ~equal quality?** Yes — ChatGPT's own Level 1. Critic mode (solve → critique → rebut → revise, no independent solve, no judge) captures most of the quality lift for code review at roughly half the model calls, because code review has cheap ground truth (tests, diffs) that substitutes for judging. Full Debate mode earns its cost only for open-ended decisions where ground truth is expensive. Therefore Critic mode ships first, and is the default for code targets; Debate is the default for design/document targets.

## Part 3 — The merged architecture

**Chassis (from Claude v1, unchanged):** a Claude Code plugin forked from `openai/codex-plugin-cc`, running entirely on the user's Mac. Claude Code hosts the runner; the repo's app-server broker speaks JSON-RPC to the local Codex CLI over a local socket; auth rides the existing ChatGPT-subscription login (`codex login`) and Claude subscription. Persistent Codex threads preserve Codex's memory across rounds. Background-job machinery (`status/result/cancel`) and git context-scoping are reused verbatim. No API keys, no servers.

**Workflow (from ChatGPT, running on the chassis):**

```
             Common brief (fixed template, human-editable)
                              │
        ┌── DEBATE MODE ──────┴────────────┐        CRITIC MODE (default for code)
        │                                  │        ┌──────────────────────────┐
   Claude solves                    Codex solves    │ Claude solves/presents   │
   (blind)                          (blind)         │ Codex critiques          │
        └────────────┬─────────────────────┘        │ Claude rebuts (A/P/R)    │
                     │                              │ Claude revises           │
        Blind cross-critiques (both sides)          │ ≤4 rounds, runner stops  │
                     │                              └──────────────────────────┘
        Rebuttals: ACCEPT / PARTIAL / REJECT
        (≤2 critique↔rebuttal cycles)               RED TEAM MODE
                     │                              asymmetric roles, then
        Revisions: Claude v2, Codex v2              side-swap before judgment
                     │
        Dual judges → runner diffs scorecards
                     │
        Synthesis (Solution C) + disagreement ledger
                     │
        Human resolves elevated disputes
```

**Enforcement layer (from Claude v1, extended with ChatGPT's taxonomy):** structured JSON messages per the merged schema; runner-owned ledger file as sole source of truth; evidence citation required on every claim, rebuttal, and concession; `unsupported` claims excluded from verdicts; sycophancy tripwire; deterministic termination (all findings terminal-status, deadlock detection, or round cap).

**Commands:** `/council:solve` (Debate mode), `/council:critic` (Critic mode), `/council:redteam`, plus `--watch|--background`, `/council:status|result|cancel`, `/council:setup`. Watch mode streams rounds live and accepts human interjections as moderator notes; background mode returns the full ledger and synthesis on completion.

## Part 4 — Build order

1. **Phase 1 — Critic mode, code targets, watch mode.** Fork, runner, merged schema, Critique/Rebut prompts, ledger, markdown verdict. End-to-end proof at minimum cost.
2. **Phase 2 — Modes & control.** Background jobs, round caps, deadlock detection, sycophancy tripwire, interjections.
3. **Phase 3 — Debate mode.** Common-brief template, blind solve, dual judges, scorecard diff, synthesis. Document/design targets via `--doc`.
4. **Phase 4 — Red Team + polish.** Side-swap, read-only check execution for grounding, auto-gate integration, saved artifacts per debate.

## Part 5 — Open items for ChatGPT's rebuttal round

1. The single-judge-with-weighted-rubric design was REJECTED above in favor of dual judges + mechanical diff + human tiebreak. Defend the original or accept the replacement — with reasons.
2. The proposal's silence on transport/orchestration was REJECTED as an omission. If there is a communication architecture superior to the codex-plugin broker chassis for a single-user Mac deployment on existing subscriptions, name it concretely.
3. The sycophancy tripwire (flagging rounds with >80% ACCEPT and thin justifications) is new. Propose a better detection heuristic if one exists.
4. Independence was downgraded to PARTIALLY ACCEPT on training-overlap and briefing-bias grounds. Rebut with evidence, or propose a stronger independence mechanism than the fixed brief template.
5. Confirm or contest the mode defaults: Critic for code targets, Debate for design/document targets.
