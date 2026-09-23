---
title: SpecCraft vs fast-check
description: fast-check is the standard property-based testing library for TypeScript, with model-based testing and a scheduler for async races. It samples randomly and shrinks; SpecCraft explores every reachable state of a spec and returns the shortest trace. They work well together.
---

[fast-check](https://github.com/dubzzz/fast-check) is the property-based testing library for JavaScript and
TypeScript: about 5,000 stars and about 140 million npm downloads a month in September 2026. It is not a model
checker, but it is the first tool a TypeScript developer will compare SpecCraft to, because its model-based testing
looks close: commands with preconditions, run against a model and the real system.

## What fast-check is

- Properties over generated inputs: arbitraries for numbers, strings, objects and anything built from them. A failure
  is shrunk to a small counterexample.
- Model-based testing: `fc.commands` generates sequences of commands, each with a `check` (the precondition) and a
  `run` that updates a model and the real system and asserts they agree. `modelRun`, `asyncModelRun` and
  `scheduledModelRun` run them.
- The scheduler: `fc.scheduler()` wraps promises so fast-check decides when each one resolves, and tries different
  orders to find race conditions. `fc.schedulerFor([1, 3, 2])` pins one order by hand.
- Replay: a failure prints a `seed` and `path` (and a `replayPath` for commands) that go straight back to the
  minimal counterexample.
- Works with any test runner; integrations for Jest and Vitest.

## Side by side

| | fast-check | SpecCraft |
|---|---|---|
| What you write | Properties, or commands with a model and the real system | A spec: state, actions with guards and effects, invariants |
| Search | Random sequences, shrunk on failure | Every reachable state, breadth-first |
| A clean run means | Not found in the runs made | No reachable state breaks an invariant, within the spec's bounds |
| Counterexample | A shrunk sequence, replayable by seed | The shortest trace |
| Async orders | `fc.scheduler`: sampled orders of wrapped promises | Inline specs: every order of async replies |
| Inputs | Rich generators for any data | Small, finite value sets chosen in the spec |
| Real code | Commands run against the real system every time | `checkConformance`, or inline specs on real classes |
| Output beyond pass or fail | None by design | State count, endings, stuck states, beliefs that must keep failing |

## Where fast-check is ahead

- **Adoption and maturity.** Eight years of development, a large user base, and good documentation.
- **Data.** Generators for arbitrary inputs and shrinking to the smallest one. SpecCraft keeps values small and
  finite on purpose, so it cannot say much about a parser or a price calculation.
- **The real system, always.** Every command runs against the real code, with no separate spec state to keep in step.
- **Async races today.** The scheduler is a practical, well-tested way to shake out promise ordering bugs.

## Where SpecCraft is ahead

- **Exhaustive, not sampled.** fast-check's model-based testing picks some sequences; a bug that needs one rare
  order may never be drawn. SpecCraft walks every reachable state, so a clean run is a statement about all of them.
- **Shortest traces.** SpecCraft's breadth-first search returns the shortest trace to each failure. fast-check
  shrinks a random one, which is usually short but not guaranteed to be shortest.
- **Every async order.** `fc.scheduler` samples orders of the promises it wraps; SpecCraft's inline specs deliver
  async replies in every order the spec allows.
- **Requirements discovery.** Endings, stuck states, and questions for the product owner fall out of the search.
  fast-check answers pass or fail for the properties you thought of.

## How they work together

- fast-check for functions over rich data (parsers, pricing, formatting); SpecCraft for the order of events around
  them (workflows, retries, stale replies).
- A SpecCraft counterexample trace is a ready-made regression test, and fast-check's `fc.schedulerFor` can pin its
  async order in an ordinary test.
- A SpecCraft spec with small value sets can be backed by fast-check tests that check the same functions over the
  full range of inputs.

## What SpecCraft takes from it

- **Replay from a short token**, the way `replayPath` jumps straight to the minimal counterexample.
- **A scheduler API that wraps real promises**, as a model for how inline specs could take over async in real code.
- **Temporal properties over command runs**, as [fast-check-ltl](https://www.npmjs.com/package/fast-check-ltl)
  (September 2026) adds on top of fast-check, as a shape for SpecCraft's liveness checks.

## Who builds it

Nicolas Dubien, who started fast-check in 2017 and still maintains it, with a large group of contributors.

## Links

- fast-check on GitHub: https://github.com/dubzzz/fast-check
- fast-check documentation: https://fast-check.dev
- Model-based testing: https://fast-check.dev/docs/advanced/model-based-testing/
- Race conditions and the scheduler: https://fast-check.dev/docs/advanced/race-conditions/
- fast-check-ltl on npm: https://www.npmjs.com/package/fast-check-ltl
