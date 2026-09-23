---
title: SpecCraft vs effect-machine
description: effect-machine is a schema-first statechart library for Effect with bounded breadth-first exploration, invariants and coverage in its testing module. SpecCraft works on free-form TypeScript state and checks real code, including async replies in every order.
---

[effect-machine](https://github.com/typeonce-dev/effect-machine) is a statechart library for
[Effect](https://effect.website), published on npm as `@typeonce/effect-machine` since July 2026. Its testing module
includes a bounded breadth-first explorer with invariants and shortest counterexamples. It is the most used tool in
this group: about 53,000 downloads a month in September 2026.

## What effect-machine is

- A machine is declared from Effect `Schema` classes: states, events, and handlers that choose the next state.
- `MachineTest.explore` walks the machine's state graph breadth-first. You supply `events(context)`, the events to
  try from each state, and `stateKey(context)`, which decides when two snapshots count as the same state.
- Invariants are checked on every planned edge, so a failure comes with a shortest discovered counterexample.
- Hard limits (by default 20 events deep, 1,000 states, 10,000 transitions) are reported as a completeness result.
  In its own words, a limit never makes an incomplete result appear exhaustive.
- Transition and branch coverage are reported for every plan the explorer computed.
- Besides exploration: scenario generation from schemas, a reference model to check traces against, and a runtime
  `probe` that acknowledges live commands, timers and invokes.

## Side by side

| | effect-machine | SpecCraft |
|---|---|---|
| Model | A statechart built from Effect schemas | Plain TypeScript state and actions, any shape |
| Search | Bounded BFS over the machine's planner | BFS, shortest traces |
| Event choice | You list representative events per state | Actions with guards; parameters expanded into actions |
| State identity | A user-defined `stateKey` | The full spec state |
| Result | Shortest counterexample, completeness, coverage | State count, endings, stuck states, shortest trace per invariant |
| Async work | Not run during exploration: "staged actions and runtime activities are not executed" | Inline specs deliver async replies in every order |
| Real code | The machine is the real code, when the app is written with it | `checkConformance`, or inline specs on existing classes |
| Ecosystem | Effect only | Any TypeScript |

## Where effect-machine is ahead

- **Adoption.** A real user base, a fast release cadence (47 versions in two months), and an API reference.
- **Coverage.** Exact transition and branch coverage for every exploration.
- **The model is the program.** For an app built on effect-machine there is no second artifact: the machine that
  runs is the machine that is explored.
- **Completeness is part of the result**, not a footnote.

## Where SpecCraft is ahead

- **No required shape.** effect-machine explores machines written in its own format, inside Effect. SpecCraft
  explores any TypeScript state and actions, and checks existing code that was never written as a machine.
- **Async orders.** effect-machine's explorer plans transitions and does not run invokes or time; runtime behaviour
  is covered by probes on single scenarios. SpecCraft's inline specs deliver async replies in every order, so a
  stale reply is found by search.
- **A spec written first.** SpecCraft keeps the spec as the oracle and checks code against it; effect-machine checks
  the machine against its own invariants.

## What SpecCraft takes from it

- **Transition and guard coverage** in the exploration result, so an action that never fires is visible.
- **Hard limits reported as completeness**, which is the same lesson as the missing max-states limit on SpecCraft's
  list.
- **A user-defined state key** as an option for collapsing states that differ only in detail the spec does not care
  about.

## Who builds it

Typeonce, an open-source course and library project from Italy; nearly all commits are by Sandro Maglione, who
writes and teaches about Effect. The repository has about 200 stars in September 2026.

## Links

- effect-machine on GitHub: https://github.com/typeonce-dev/effect-machine
- effect-machine on npm: https://www.npmjs.com/package/@typeonce/effect-machine
- Effect: https://effect.website
