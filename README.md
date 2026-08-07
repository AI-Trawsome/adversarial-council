# Adversarial AI Council (Claude + Codex)

Structured adversarial review debates between Claude (defender) and Codex (critic), with a neutral runner owning the ledger and termination. Phase 1: `/council:review`, code targets, watch mode. See SPEC.md for the build spec and BENCHMARK.md (frozen before implementation changes) for the evaluation protocol.

## Requirements
- Claude Code, Node >= 18.18
- Codex CLI: `npm install -g @openai/codex`, then `codex login` (ChatGPT subscription)

## Install (local marketplace)
```
/plugin marketplace add /path/to/council-marketplace
/plugin install council@council
/reload-plugins
```

## Use
```
/council:review                     # review working tree
/council:review --base main         # review branch against main
/council:review --rounds 4 focus... # more rounds, focused
```

Debate state lives in `.council/<debateId>/` in the reviewed repo: `ledger.json` (canonical), `verdict.md`, `context.md`, per-round rebuttals. Add `.council/` to your global gitignore if you don't want debate artifacts committed.

## Testing without Codex
`COUNCIL_MOCK_CRITIQUE=<file.json> node scripts/council-runner.mjs critique --debate <id>` substitutes a canned critique — used by the benchmark's Arm A and CI.

Transport libraries under `plugins/council/scripts/lib/` are vendored unchanged from openai/codex-plugin-cc (see LICENSE/NOTICE).

## Direct GPT API bridge (Mac terminal utility)

`plugins/council/tools/gpt-bridge.mjs` talks to the OpenAI API directly (threaded history, model autodetect, usage tracking) — an alternative consult channel that uses an API key instead of the Codex CLI login:

```
export OPENAI_API_KEY=sk-...   # or write it to ~/.council-openai-key (chmod 600)
node plugins/council/tools/gpt-bridge.mjs send --file doc.md --message "please review"
```

Note: this script cannot run in Claude's cloud sandbox (its network egress does not allow api.openai.com); run it on your own machine.
