# Adversarial Debate Plugin — Architecture Plan

**Goal:** A Claude Code plugin (forked from `openai/codex-plugin-cc`) that runs a structured, multi-round adversarial debate between Claude and Codex (GPT) about the quality of a solution — code, design, or any document — ending in a verdict ledger instead of a single one-shot review.

---

## 1. How the two "apps" actually communicate

An important framing point first: the consumer Claude and ChatGPT desktop apps cannot talk to each other and never will. The debate happens between the two **agent runtimes** that ride the same subscriptions:

```
┌─────────────────────────────  Your Mac  ─────────────────────────────┐
│                                                                      │
│  Claude Code session (Claude = Debater A + Moderator)                │
│      │                                                               │
│      │  /debate:* slash commands                                     │
│      ▼                                                               │
│  Debate plugin (fork of codex-plugin-cc)                             │
│      │  node debate-runner.mjs                                       │
│      ▼                                                               │
│  App-server broker  ──JSON-RPC over local socket──►  Codex CLI       │
│  (reused from the repo verbatim)                     (Debater B)     │
│                                                          │           │
│                                                          ▼           │
│                                            OpenAI backend via your   │
│                                            ChatGPT subscription login│
└──────────────────────────────────────────────────────────────────────┘
```

Everything runs locally on the Mac. Auth is whatever `codex login` already established (your ChatGPT plan) on the OpenAI side, and your Claude subscription on the Anthropic side. No API keys, no servers, no network plumbing to build — the repo's broker layer (`app-server-broker.mjs`, `broker-lifecycle.mjs`, `app-server.mjs`) is reused as-is.

**Roles.** Claude is both a debater and the loop orchestrator. That's a mild fairness asymmetry (one debater runs the clock), which we mitigate in the protocol: the debate state lives in files, not in Claude's head, and Claude's moderator duties are mechanical (relay messages, check termination rules) and separated by prompt from its debater duties.

## 2. What we take from the repo vs. build new

**Reused (~80%):** the entire Codex transport (broker, JSON-RPC client, process management), persistent Codex threads (from `/codex:transfer` internals — critical so Codex remembers what it argued in round 1 when writing round 3), background-job tracking (`tracked-jobs.mjs`, `job-control.mjs`, and the `/status` `/result` `/cancel` command pattern), git scoping logic for code targets, and the adversarial prompt + findings schema as the seed for the debate prompts.

**Built new:** the debate loop itself (`debate-runner.mjs`), a debate message schema, per-subject context adapters, both debater prompts with anti-capitulation rules, termination logic, and the verdict ledger renderer.

## 3. The debate protocol

Each round exchanges **structured JSON messages**, not freeform prose — this is what keeps two agreeable LLMs actually arguing.

**Message schema (per side, per round):** a `debate-message.schema.json` extending the repo's `review-output.schema.json`:

```jsonc
{
  "round": 2,
  "side": "codex",                    // or "claude"
  "findings": [{
    "id": "F3",
    "claim": "Retry loop double-charges on timeout",
    "evidence": "billing.ts:141-160; no idempotency key on POST",
    "severity": "high",
    "confidence": 0.8,
    "status": "open"                  // open | conceded | disputed | resolved
  }],
  "rebuttals": [{ "finding_id": "F1", "argument": "...", "evidence": "..." }],
  "concessions": [{ "finding_id": "F2", "reason": "test at x_test.ts:88 covers this" }]
}
```

**Round flow:**

1. **Round 0 — Framing.** Claude packages the subject (see adapters below) and writes a defense brief: what the solution is, why the approach is right, known tradeoffs.
2. **Round N — Attack.** Codex (persistent thread) receives the subject + full ledger so far, and must attack: new findings, escalations of disputed ones, responses to Claude's rebuttals.
3. **Round N — Defense.** Claude answers every open finding: rebut with evidence, concede with reason, or propose a concrete fix that would resolve it. Claude may also counter-attack Codex's reasoning.
4. **Ledger update.** The runner merges both messages into `debate-ledger.json` on disk — the single source of truth, so neither model can quietly rewrite history.
5. **Termination check** (runner, not a model): stop when every finding is `conceded`/`resolved`, when a round produces zero new findings and zero status changes (deadlock), or at the round cap (default 4, `--rounds N`).

**Verdict ledger (final output):** agreed issues (with the fix both sides accept), disputed issues with each side's final position and confidence, conceded points on each side, and a ship / no-ship / ship-with-fixes call. Rendered as markdown in the session, with the raw JSON ledger saved alongside.

**Anti-capitulation rules — the make-or-break prompt work.** Both models drift toward agreement. Both debater prompts carry explicit rules: never concede without citing the specific evidence that changed your mind; never soften a severity to be agreeable; a rebuttal that just restates the original claim doesn't count; "the other model is probably right" is not evidence. The repo's existing stance ("break confidence in the change, do not validate it") becomes Codex's standing role; Claude gets the mirrored defender stance ("do not abandon a defensible position; conceding without evidence is a protocol violation").

**Grounding rule.** Every claim and every rebuttal must cite something checkable — `file:line`, a test run, a doc section, a measurable property. For code subjects, either side may request the runner execute a read-only check (run tests, grep, git log) and cite the output. Ungrounded claims are marked `unsupported` in the ledger and excluded from the verdict.

## 4. Subject adapters (what gets debated)

One command, three context adapters chosen by target:

| Subject | Invocation | Context packaged | Grounding |
|---|---|---|---|
| Code changes | `/debate:start` or `--base <ref>` | Reuses the repo's git scoping (working tree / branch / base-diff) verbatim | file:line, tests |
| Design / architecture | `/debate:start --doc design.md ["focus"]` | The doc + optionally referenced code paths | doc sections, code refs |
| Any solution/document | `/debate:start --doc plan.md` or pasted text | The document text | internal consistency, cited facts, stated requirements |

Code debates ship first — they're the most grounded and reuse the most machinery. Design and freeform debates share the same protocol with looser evidence standards (the prompts adjust what counts as "checkable").

## 5. Commands and modes

- `/debate:start [target] [--rounds N] [--watch|--background] [focus...]` — begin a debate.
- **Watch mode:** rounds stream into your session as they complete; you can interject between rounds ("focus on the migration risk", "call it, Claude wins F2") — interjections become moderator notes in the next round's context.
- **Background mode:** reuses the repo's tracked-jobs pattern; `/debate:status` shows round progress and open-finding count, `/debate:result` returns the verdict ledger, `/debate:cancel` kills it. Same `AskUserQuestion` recommend-a-mode flow as the repo's review command.
- `/debate:setup` — verifies Codex CLI presence + login (thin wrapper on the repo's setup).

## 6. Build phases

1. **Phase 1 — Core loop (code subjects, watch mode).** Fork repo, add `debate-runner.mjs`, message schema, both debater prompts, ledger, fixed 3 rounds, markdown verdict. *This is the end-to-end proof.*
2. **Phase 2 — Modes & control.** Background jobs, `/debate:status|result|cancel`, `--rounds`, deadlock detection, user interjections in watch mode.
3. **Phase 3 — Subject adapters.** `--doc` for design/freeform debates; adjusted grounding prompts.
4. **Phase 4 — Polish.** Read-only check execution for grounding, verdict as a saved artifact, optional stop-gate integration (auto-debate whenever Claude finishes a task, mirroring the repo's stop-review-gate hook).

## 7. What you need on the Mac

Claude Code, Node ≥ 18.18, Codex CLI (`npm i -g @openai/codex`) with `codex login` completed against your ChatGPT account. The forked plugin installs from a local marketplace directory (`/plugin marketplace add ~/dev/debate-plugin`) — no publishing needed.

## 8. Known risks & open questions

- **Sycophantic convergence** is the #1 quality risk; the structured schema + anti-capitulation prompts are the mitigation, but expect prompt iteration after the first few real debates.
- **Codex thread context limits** on long debates — mitigated by sending the compact ledger each round rather than full transcripts.
- **Orchestrator bias** — Claude runs the loop it's also debating in. If that ever bothers you in practice, Phase 5 is porting the runner to a standalone script (option B from our discussion) with zero protocol changes, since all state is already file-based.
- **Cost/limits** — every round burns both subscriptions' usage. A 4-round debate ≈ 5 Codex calls + Claude's turns. Worth defaulting `--rounds` conservatively.
