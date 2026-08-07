# Proposal: Adversarial AI Council (Claude + OpenAI)

## Objective

Build a reusable system where Claude and OpenAI act as independent peers
that challenge one another's work before producing a final
recommendation. The goal is not agreement, but higher-quality outcomes
through structured adversarial review.

## Guiding Principles

-   Independent reasoning before either model sees the other's work.
-   Explicit criticism instead of passive review.
-   Evidence-based rebuttals.
-   Structured synthesis rather than "majority vote."
-   Limited debate rounds to control cost and latency.

------------------------------------------------------------------------

# High-Level Architecture

``` text
                USER TASK
                    │
         ┌──────────┴──────────┐
         │                     │
      Claude               OpenAI
   Independent          Independent
     Solution             Solution
         │                     │
         └──────────┬──────────┘
                    │
          Cross Examination
                    │
      Claude critiques OpenAI
      OpenAI critiques Claude
                    │
                    ▼
               Rebuttal Round
                    │
        Accept / Partial / Reject
                    │
                    ▼
              Revised Solutions
                    │
                    ▼
            Judge / Synthesizer
                    │
                    ▼
      Final Recommendation
```

------------------------------------------------------------------------

# Proposed Workflow

## Round 0 -- Normalize the Problem

The orchestrator prepares a common brief containing:

-   Objective
-   Known facts
-   Constraints
-   Unknowns
-   Definition of success
-   Required evidence
-   Decisions to be made

Both models receive exactly the same brief.

------------------------------------------------------------------------

## Round 1 -- Independent Solutions

Claude produces Solution A.

OpenAI produces Solution B.

Neither sees the other's response.

This preserves independent reasoning and avoids anchoring.

------------------------------------------------------------------------

## Round 2 -- Cross Examination

Each model reviews the other's work with one objective:

> Make the competing solution fail if it deserves to fail.

Critique areas include:

-   Incorrect assumptions
-   Missing evidence
-   Logical flaws
-   Security risks
-   Scalability
-   Simplicity
-   Practical implementation
-   Better alternatives
-   Hidden costs
-   Failure modes

------------------------------------------------------------------------

## Round 3 -- Rebuttal

Each model must classify every criticism as:

-   ACCEPT
-   PARTIALLY ACCEPT
-   REJECT

Rejected criticisms must include a justification.

The goal is to force explicit reasoning rather than automatic agreement.

------------------------------------------------------------------------

## Round 4 -- Revision

Each model revises its proposal after considering the critiques.

Outputs become:

-   Claude v2
-   OpenAI v2

------------------------------------------------------------------------

## Round 5 -- Judgment

A judge evaluates both solutions using a rubric.

Example:

  Criterion               Weight
  --------------------- --------
  Factual correctness        30%
  Completeness               15%
  Evidence                   15%
  Logical consistency        15%
  Practicality               10%
  Risk awareness             10%
  Simplicity                  5%

The objective is not to choose a winner.

Instead, produce **Solution C**, combining the strongest surviving
ideas.

------------------------------------------------------------------------

# Disagreement Ledger

Rather than hiding disagreements inside prose, track them explicitly.

  Issue        Claude     OpenAI     Judge
  ------------ ---------- ---------- ------------
  Assumption   Position   Position   Resolution
  Risk         Position   Position   Resolution
  Cost         Position   Position   Resolution

Final output should include:

## Consensus

Items both models agree on.

## Remaining Disagreements

Issues still unresolved.

## Deciding Evidence

What evidence would resolve those disagreements.

## Final Recommendation

A concise recommendation with confidence level.

------------------------------------------------------------------------

# Operating Modes

## Level 1 --- Critic

Claude solves.

OpenAI critiques.

Claude revises.

Fast and inexpensive.

------------------------------------------------------------------------

## Level 2 --- Debate

Both solve independently.

Both critique.

Both revise.

Judge synthesizes.

Recommended default mode.

------------------------------------------------------------------------

## Level 3 --- Red Team

Assign asymmetric roles.

Example:

Claude: Build the strongest possible case FOR an investment.

OpenAI: Assume the investment is bad. Find the fatal flaw.

Then switch sides before final judgment.

This prevents bias toward a preferred position.

------------------------------------------------------------------------

# Practical Safeguards

-   Maximum of two debate rounds.
-   Hard token and time limits.
-   Preserve full reasoning history.
-   Record accepted and rejected critiques.
-   Allow users to inspect debate artifacts.

------------------------------------------------------------------------

# Existing Infrastructure

The OpenAI `codex-plugin-cc` repository already provides:

-   Claude → OpenAI task delegation
-   Persistent Codex sessions
-   Adversarial review commands
-   Review gates before completion
-   Conversation transfer/resume

The proposal extends those capabilities into a general-purpose
multi-agent reasoning framework.

------------------------------------------------------------------------

# Questions for Claude

Please review this proposal and provide feedback on:

1.  Architectural weaknesses.
2.  Better orchestration patterns.
3.  Prompt designs for each debate phase.
4.  Failure modes (bias, convergence, cost, hallucination).
5.  Whether the judge should be a separate role or dual judges.
6.  Improvements to the disagreement ledger.
7.  Additional operating modes worth supporting.
8.  Whether there is a simpler architecture that achieves nearly the
    same quality.

Please be critical. The goal is to stress-test this design before
implementation.
