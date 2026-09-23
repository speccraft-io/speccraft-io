---
title: SpecCraft vs pnueli
description: pnueli is an explicit-state model checker in TypeScript with symmetry and partial-order reduction and liveness under weak fairness. It is the closest thing to SpecCraft's engine. SpecCraft adds conformance against real code and inline specs.
---

[pnueli](https://github.com/BOTIROFF-D/pnueli) is an explicit-state model checker written in TypeScript, published
on npm as `@botiroff/pnueli` in August 2026. Of everything we have found, it is the closest to SpecCraft's own engine:
a spec is a plain TypeScript object, and the checker walks every reachable state. It is also ahead of SpecCraft on
several engine features, so this page is worth reading closely.

## What pnueli is

- A spec is a plain object: `init` states, `actions`, `invariants`, and an optional `terminal` predicate.
- An action's `step` returns a list of next states. An empty list means the action is disabled, so the guard and the
  effect cannot drift apart, and one action can have several possible outcomes.
- Breadth-first search, so every counterexample is a shortest trace.
- Symmetry reduction: states that differ only by swapping interchangeable processes count as one.
- Partial-order reduction with ample sets: when two actions touch nothing in common, only one order is explored.
  Actions declare what they `reads` and `writes`, and that declaration is the contract.
- Every reduction is checked against the full, unreduced search on every spec small enough to run both. The README
  is clear about why: a wrong reduction prints the same "no violation found" as a correct one.
- Liveness in one form: "eventually P" under weak fairness, found as a fair cycle (a lasso) in the state graph.
- Validated on problems with known answers: Peterson's algorithm, dining philosophers, Raft election safety (up to
  6.8M states), write skew under snapshot isolation.

## Side by side

| | pnueli | SpecCraft |
|---|---|---|
| Spec | Plain TypeScript object | Plain TypeScript object, or inline next to a real class |
| An action's result | A list of next states (several outcomes allowed) | One next state; parameters are expanded into separate actions |
| Search | BFS, shortest traces | BFS, shortest traces |
| Reductions | Symmetry and partial-order, validated against the full search | None yet |
| Liveness | "Eventually P" under weak fairness | Not yet |
| Output | Verdict per invariant, trace, liveness cycle | State count, endings, stuck states, shortest trace per invariant, beliefs that must keep failing |
| Real code | Not covered: "the specification is not the implementation" | `checkConformance` walks the spec against a real implementation |
| Async in real code | Not covered | Inline specs: the explorer delivers async replies in every order |
| Size | A few hundred lines, by design | A small engine plus conformance and inline modes |

## Where pnueli is ahead

- **Several outcomes per action.** A step returning a list is exactly the "data nondeterminism" item on SpecCraft's
  roadmap, already solved.
- **Reductions.** Symmetry and partial-order reduction push the reachable size of a spec down by large factors (625x
  on its six-worker example), and the validation against the full search is the right way to trust them.
- **Liveness.** A real "eventually" check under weak fairness, with the fair cycle printed as the counterexample.
- **Honest scope.** The README says plainly what it does not do: no disk-backed storage, no full LTL, no strong
  fairness, and no link between the spec and the implementation.

## Where SpecCraft is ahead

- **Conformance against real code.** pnueli proves the model and stops there; its author points to separate sampling
  tools (unflake, bulwark) for the code. SpecCraft walks the same state graph against the real implementation and
  reports the first place the code and the spec disagree.
- **Inline specs.** Guards and effects next to the real methods, real fields mapped to small spec types, and async
  replies delivered by the explorer in every order, so a stale reply is found by search.
- **Results shaped for requirements discovery.** Endings and stuck states as separate lists, and beliefs you know are
  false kept as checks that must keep failing, so a change that makes one pass is noticed.

## What SpecCraft takes from it

- **Steps that return a list of next states**, for the data nondeterminism roadmap item.
- **Declared reads and writes** on actions, as the input partial-order reduction needs.
- **Validate every reduction against the unreduced search**, in the test suite, before trusting it.

## Who builds it

Doniyor Botirov, founder of dbit.one. pnueli is part of a small set of his TypeScript tools: unflake (deterministic
simulation testing with seeded schedules), bulwark (Raft tested under seeded faults), and adya (finding transaction
isolation anomalies). pnueli is the one that proves small instances outright instead of sampling them. It is new and
early: one star and about 55 downloads a month in September 2026.

## Links

- pnueli on GitHub: https://github.com/BOTIROFF-D/pnueli
- pnueli on npm: https://www.npmjs.com/package/@botiroff/pnueli
- unflake on GitHub: https://github.com/BOTIROFF-D/unflake
