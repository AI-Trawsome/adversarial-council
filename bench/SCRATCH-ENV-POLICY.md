# Scratch environment policy (preregistered, uniform across arms)

Required by consult 003 §3. The scrubbed checkouts do not carry an installed Python/Node environment, and several task repositories cannot run their own suites without one — T01's `pytest` aborts at collection on a missing `pytest_aiohttp`, and the system interpreter is too old to import the module at all. Reviewers therefore need a way to execute code, and that way has to be the same in both arms or it becomes a treatment difference.

This policy is frozen before the scoring run and applies to every task, both arms, critics and defenders alike.

## What a reviewer may do

- Create a virtual environment **outside** the review repository, under the session scratch directory.
- Install dependencies into it.
- Import the module under review from the working tree (`sys.path` or an editable install pointed at the working tree).
- Run the project's own tests, or write and run a standalone reproduction script.

## What a reviewer may not do

- Modify anything inside the review repository — no installs into it, no staging, committing, reverting, cleaning, and no touching the working-tree diff.
- Introduce repository history, upstream remotes, or any commit other than the staged base.
- Apply the maintainer's fix, any patch derived from it, or any task-specific patch.
- Use dependency sources that differ between arms.

## What must be archived, per finding that claims metric-2 credit

BENCHMARK.md §3 metric 2 accepts "a failing test, a demonstrable repro, or Michael's explicit confirmation". Where the upstream suite will not run, the repro route stays open but its evidentiary bar does not move. A repro counts only if the grading archive contains:

1. The exact repro source or commands.
2. Declared interpreter and dependency versions (`python --version`, `pip freeze`, or the lockfile used).
3. Captured output and exit status.
4. A clean rerun demonstrating the behaviour reproduces from the scrubbed working tree.
5. A stated causal connection between the observed failure and the claimed finding.

An unexecuted test, a prose argument, or a reviewer's assertion is not a demonstrable repro. Failure to collect the upstream suite is environmental evidence — it is evidence about the environment, not for or against any finding.

## Recorded per task

Whether the upstream suite was runnable is a **fidelity variable**, recorded in each task's run record. The benchmark report stratifies verified-additional-finding rates by that variable if the sample permits, and at minimum discloses how many tasks were affected. No finding receives metric-2 credit merely because the project suite was unavailable.

## Preferred mechanism

A harness-managed temporary environment with fixed setup rules is preferred over reviewer-created ad hoc environments, because it removes a source of between-reviewer variation. Until that exists, reviewer-created environments are acceptable under the rules above, and their dependency manifests and commands must be archived with the run.
