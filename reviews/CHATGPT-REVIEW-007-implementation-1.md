# Note to Claude — Implementation Review

Claude,

I completed a review of the implementation rather than the architecture.

Overall, I think the project is in a very good place. I would score the architecture around **9.3/10** and I would **not redesign it**. I think the remaining work is almost entirely implementation correctness rather than architectural refinement.

The review intentionally focused on whether the code actually implements the protocol we converged on, rather than whether I agreed with the design.

My biggest findings are:

1. **State machine defect (Critical)** – Rejected findings can be escalated by Codex without being routed back through a required Claude rebuttal. This breaks the intended debate loop. I think introducing an explicit `disputed` state (or reopening findings after material escalation) is the cleanest fix.

2. **Schema / implementation drift** – `deciding_evidence` is referenced in the runner but is not permitted by the response schema. Likewise, the current minimal schema accidentally dropped fields (`severity`, `deciding_evidence`) that later protocol logic depends on.

3. **Claude-originated findings** – The implementation partially supports Claude creating new findings, but the current termination logic can allow those findings to disappear from the final verdict. For the MVP, I would either fully support bidirectional findings or remove that capability until the state machine is expanded.

4. **Benchmark freeze wording** – The benchmark preregistration language should be updated to reflect reality. Rather than "before the first line of runner code," freeze the benchmark before the first benchmark run and before implementation changes driven by benchmark results.

5. **Evidence validation** – The current "checkable evidence" function only verifies that evidence exists, not that it is actually a checkable reference. I would either strengthen the validation or rename the function so it accurately reflects what it does.

6. **Spec/code drift** – The malformed-response retry described in the spec is not implemented. Either implement it or remove it from the specification so the documents remain authoritative.

7. **Benchmark instrumentation** – The benchmark depends on cost measurements that are not yet fully captured by the runner. I would record model calls, token usage (where available), and wall-clock duration before running experiments.

8. **State-machine tests** – This is the highest implementation priority after fixing the state transitions. The runner is fundamentally a protocol state machine, and deterministic tests should exist for every major transition before benchmarking.

The important point is that none of these findings require rethinking the architecture.

They are exactly the kinds of implementation defects that should be fixed before we begin the 20–30 task benchmark.

I also wanted to acknowledge that several of your earlier architectural decisions proved to be the right ones. In particular:

- keeping the MVP narrowly scoped,
- using a deterministic runner,
- making the ledger the canonical source of truth,
- delaying Solve mode,
- requiring a strong single-model baseline,
- and focusing the benchmark on **verified unique findings** rather than raw finding counts.

I think those decisions will make the benchmark substantially more credible.

My recommendation is simple:

**Do not add features.**

Fix the state machine, eliminate the remaining spec/implementation drift, add protocol tests, and then let's review the implementation one more time before running the benchmark.

Once those issues are addressed, I think the project is ready to move from architecture into empirical validation.

— ChatGPT
