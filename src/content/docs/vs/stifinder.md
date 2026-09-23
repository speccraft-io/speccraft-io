---
title: SpecCraft vs stifinder
description: stifinder is a state-space explorer for JavaScript that finds the failure needing the fewest departures from the expected schedule. It is the closest new engine to SpecCraft's. SpecCraft adds a spec layer, conformance against real code, and inline specs.
---

[stifinder](https://github.com/andershessellund/stifinder) is a state-space explorer for JavaScript and TypeScript,
published on npm in September 2026. It is the newest engine in SpecCraft's corner, and it answers a question SpecCraft
does not ask yet: not only "is there a failing trace", but "what is the failing trace that needs the fewest things
to go differently than expected".

## What stifinder is

- A model is an `initialState`, `getEvents(state)` and `applyEvent(state, event)`, plus optional `invariant` and
  `terminalInvariant` checks. Every callback may be synchronous or return a promise.
- `getEvents` returns events in preference order. Index 0 is what "should" happen next; every other choice costs one
  unit of a deviation budget.
- The search runs budget levels in ascending order and, within a level, by depth. The reported violation is the
  cheapest one: fewest deviations first, then the smallest total of user-defined costs (`crash`, `retry`, ...), then
  the fewest steps.
- This is delay bounding (Emmi, Qadeer and Rakamaric, POPL 2011), the generalization of CHESS's preemption bounding,
  extended with a vector of user-defined cost keys tracked as a Pareto frontier per state.
- The result says what a clean run means: `exhaustive: true` only when every reachable state was explored at every
  budget. A run capped by budget, `maxEdges` or `timeoutMs` says so instead of reading like a proof.
- `terminalInvariant` checks states where nothing more can happen, which is how it tells an acceptable ending from a
  deadlock.
- States and events are deduplicated by structural equality through its companion library `valsem`, and callbacks
  must be pure, because results are cached across budgets.

## Side by side

| | stifinder | SpecCraft |
|---|---|---|
| Spec | `initialState`, `getEvents`, `applyEvent`, invariants | Plain TypeScript object, or inline next to a real class |
| Search | Iterative deepening over a deviation budget, then depth | BFS, shortest traces |
| Which trace is reported | Fewest deviations, then lowest cost, then fewest steps | Fewest steps |
| Clean result | Says whether it was exhaustive or only budget-bounded | Exhaustive within the spec's own bounds |
| Endings | `terminalInvariant` on states with no events | Endings and stuck states as separate lists |
| Real code | Not covered by the library itself | `checkConformance` walks the spec against a real implementation |
| Async in real code | The author's `kilde/testing` drives real stream code through every pause and delivery decision | Inline specs: the explorer delivers async replies in every order |

## Where stifinder is ahead

- **The least surprising failure.** A trace that needs one departure from the normal schedule is far easier to
  believe and fix than one that needs five. Ordering by deviations first gives that directly.
- **Cost keys.** Crashes, retries or any other named fault get their own budget, so "fails with at most one crash" is
  a question the search can answer.
- **Honest verdicts.** The result separates "no violation exists" from "none found within this budget", in the API
  and in the README.
- **Incremental budgets.** The cache survives a change of budget, so deepening the search never repeats work.

## Where SpecCraft is ahead

- **A spec layer.** stifinder is a search core by design; it has no notion of actions with guards and effects,
  invariants as named checks, endings, or beliefs that must keep failing.
- **Conformance against real code.** SpecCraft walks the same state graph against the real implementation and
  reports the first place the code and the spec disagree.
- **Inline specs.** Guards and effects next to the real methods, real fields mapped to small spec types, and async
  replies delivered in every order. The closest thing in stifinder's world is `kilde/testing`, which applies the
  same idea to one library's own streams.

## What SpecCraft takes from it

- **Deviation-ordered search** as an option: report the trace with the fewest departures from a default schedule,
  not only the shortest one.
- **Named cost budgets** for faults such as crashes and retries.
- **A result that states its own completeness**, so a bounded run can never be mistaken for a proof.

## Who builds it

Anders Hessellund Jensen, a self-employed developer in Aarhus, Denmark. stifinder is one of three libraries he
published in September 2026: `valsem` (value semantics for TypeScript), `stifinder`, and `kilde` (signals, streams and
channels, whose `kilde/testing` entry point uses stifinder to explore every pause and delivery order of real stream
code). It is new and early: version 0.0.1, no stars and about 165 downloads a month in September 2026.

## Links

- stifinder on GitHub: https://github.com/andershessellund/stifinder
- stifinder on npm: https://www.npmjs.com/package/stifinder
- kilde on GitHub: https://github.com/andershessellund/kilde
- valsem on GitHub: https://github.com/andershessellund/valsem
