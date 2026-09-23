---
title: pnueli vs SpecCraft
description: pnueli is an explicit-state model checker in TypeScript with symmetry and partial-order reduction and liveness under weak fairness. This page walks through using it on a distributed lock, then compares it with SpecCraft.
tableOfContents: true
adoption:
  github: BOTIROFF-D/pnueli
  npm: '@botiroff/pnueli'
  created: 2026-08-17
---

[pnueli](https://github.com/BOTIROFF-D/pnueli) is an explicit-state model checker written in TypeScript, published
on npm as `@botiroff/pnueli` in August 2026. A spec is a plain TypeScript object, and the checker walks every
reachable state. Of everything we have found, it is the closest to SpecCraft's own engine, and it is ahead of it on
several features.

## Using pnueli

The code below is in
[examples/distributed-lock](https://github.com/speccraft-io/speccraft-ts/tree/main/examples/distributed-lock) and
runs with `pnpm test`.

### The problem

Several identical nodes share a lock with a lease. A node takes the lock, then writes to shared storage. The lease
can expire while the node is paused (a long GC pause, a slow disk) between taking the lock and writing. Another node
then takes the lock and writes, the first node wakes up and writes too, and the storage now holds older data on top
of newer data. The usual fix is a fencing token: every lock grant carries a number that goes up, and the storage
rejects a write whose token is older than one it has already accepted.

There are two questions. Safety: can the storage ever take a write older than one it already took? Liveness: does
every node keep getting its writes in, or can one be shut out forever?

### Install and set up

```sh
pnpm add -D @botiroff/pnueli
```

Everything comes from one entry point: the `Spec`, `Action` and `Invariant` types, the checks `checkExhaustive`,
`checkReduced` and `checkLiveness`, and `stateKey`, the canonical key pnueli uses for states. The example uses version
0.2.0. The checks are plain functions that return a result, so they run inside any test; the example uses vitest.

### Writing the spec

The transitions live in a plain file, `lock.ts`. Each function takes a state and returns the next one, or `null`
when the step does not apply. The write step is the whole bug and the whole fix:

```ts
// lock.ts (shortened)
export function write(s: State, i: number, store: Store): State | null {
  const node = s.nodes[i];
  if (node?.phase !== 'holding' || node.token === null) {
    return null;
  }
  if (store === 'fencing' && node.token < s.newest) {
    return withNode(s, i, { phase: 'idle', lease: false, token: null });
  }
  const accepted = {
    ...s,
    newest: Math.max(s.newest, node.token),
    stale: s.stale || node.token < s.newest,
  };
  return withNode(accepted, i, { ...node, phase: 'wrote' });
}
```

The node never checks its own lease before writing, because in the real world it cannot: the pause can happen right
after the check. The lease expiring is its own action, so it can happen at any point between "acquires lock" and
"writes". Tokens are renumbered by rank after every step (the storage only compares them), which keeps the state
space finite even though nodes take the lock again and again. So `t0` is the oldest token still in play, not a fixed
number.

The pnueli spec wraps these functions in actions:

```ts
// lock.pnueli.ts (shortened)
function step(next: State | null): State[] {
  return next === null ? [] : [next];
}

function nodeActions(i: number, n: number, store: Store): Action<State>[] {
  return [
    {
      name: `n${i} acquires lock`,
      process: i,
      reads: ['nodes', 'epoch'],
      writes: ['nodes', 'epoch'],
      step: (s) => step(acquire(s, i)),
    },
    {
      name: `n${i} writes`,
      process: i,
      reads: ['nodes', 'newest', 'stale'],
      writes: ['nodes', 'newest', 'stale'],
      step: (s) => step(write(s, i, store)),
    },
    // n${i} releases lock, on process i
    // lease of n${i} expires, on process n (the clock)
  ];
}

function sortNodes(s: State): State {
  return { ...s, nodes: [...s.nodes].sort((a, b) => stateKey(a).localeCompare(stateKey(b))) };
}

export const noStaleWrite: Invariant<State> = {
  name: 'the store never takes a write older than one it already took',
  reads: ['stale'],
  holds: (s) => !s.stale,
};

export function lockSpec(n: number, store: Store, symmetry: boolean): Spec<State> {
  return {
    name: `lock, ${n} nodes, store ${store}${symmetry ? ', symmetry' : ''}`,
    processes: n + 1,
    init: [init(n)],
    actions: Array.from({ length: n }, (_, i) => nodeActions(i, n, store)).flat(),
    invariants: [noStaleWrite],
    ...(symmetry ? { symmetry: sortNodes } : {}),
  };
}
```

What each part does:

- **`step`** returns a list of next states. An empty list means the action is disabled here, so the guard and the
  effect cannot drift apart. A list with several states means the action has several possible outcomes. The small
  `step` helper turns the `null` from `lock.ts` into an empty list.
- **`process`** says which process runs the action. Each node is a process, and the lease clock is one more process
  (number `n`), so weak fairness applies to it too. That is why `processes` is `n + 1`.
- **`reads` and `writes`** name the state fields the action touches. Partial-order reduction uses them to find actions
  that are independent. They are a contract: if an action touches a field it does not declare, the reduction can be
  wrong without any error.
- **`symmetry`** maps a state to a canonical one. The nodes are interchangeable, so `sortNodes` sorts them by
  `stateKey`, and two states that differ only by which node is which count as one.
- **Invariants** have a `name`, their own `reads`, and `holds`. The same shape is used for the liveness goals below:
  "n0 gets a write in" and "some node gets a write in".

### Running it

Three functions run a spec. `checkExhaustive` walks every reachable state (with symmetry, if the spec has it).
`checkReduced` adds partial-order reduction on top. `checkLiveness(spec, goal)` checks "eventually the goal holds"
under weak fairness.

```ts
// lock.pnueli.test.ts (shortened)
checkExhaustive(lockSpec(3, 'accepts any write', false));
checkExhaustive(lockSpec(3, 'accepts any write', true));
checkLiveness(lockSpec(3, 'fencing', true), someNodeWrites);
checkLiveness(lockSpec(2, 'fencing', false), n0Writes);
```

Each call returns a result with `ok`, `states`, and a `violation` with a `trace` (and a `cycle` for liveness). The
output below is printed from those fields by a small formatter in the test. Without fencing, three nodes:

```text
lock, 3 nodes, store accepts any write [exhaustive]: FAILED, 75 states
  invariant "the store never takes a write older than one it already took" does not hold
    (initial)              n0 idle, n1 idle, n2 idle | store t0
    n0 acquires lock       n0 holding t1 lease, n1 idle, n2 idle | store t0
    lease of n0 expires    n0 holding t1, n1 idle, n2 idle | store t0
    n1 acquires lock       n0 holding t1, n1 holding t2 lease, n2 idle | store t0
    n1 writes              n0 holding t0, n1 wrote t1 lease, n2 idle | store t1
    n0 writes              n0 wrote t0, n1 wrote t1 lease, n2 idle | store t1 STALE
lock, 3 nodes, store accepts any write, symmetry [exhaustive]: FAILED, 18 states
  invariant "the store never takes a write older than one it already took" does not hold
    (initial)              n0 idle, n1 idle, n2 idle | store t0
    n0 acquires lock       n0 idle, n1 idle, n2 holding t1 lease | store t0
    lease of n2 expires    n0 holding t1, n1 idle, n2 idle | store t0
    n1 acquires lock       n0 holding t1, n1 idle, n2 holding t2 lease | store t0
    n2 writes              n0 holding t0, n1 idle, n2 wrote t1 lease | store t1
    n0 writes              n0 idle, n1 wrote t0, n2 wrote t1 lease | store t1 STALE
```

Five steps: n0 takes the lock, its lease runs out while it is paused, n1 takes the lock and writes, and n0 wakes up
and writes an older token over it. The search is breadth-first, so this is a shortest trace, and it stops at the
first broken invariant. With symmetry it stops after 18 states instead of 75. The trace is the same five steps, but it
prints canonical states, where the nodes are sorted after every step, so the node names in the states no longer line
up with the names in the actions.

### Fixing the bug

With `'fencing'` the invariant holds. States visited to prove it, with no reduction, with symmetry, and with symmetry
plus partial-order reduction (`checkReduced`):

```text
┌─────────┬───────┬──────┬──────────┬────────────────┐
│ (index) │ nodes │ none │ symmetry │ symmetryAndPor │
├─────────┼───────┼──────┼──────────┼────────────────┤
│ 0       │ 2     │ 37   │ 19       │ 19             │
│ 1       │ 3     │ 283  │ 51       │ 51             │
│ 2       │ 4     │ 2521 │ 119      │ 119            │
└─────────┴───────┴──────┴──────────┴────────────────┘
```

Symmetry pays off quickly: 51 states instead of 283 at three nodes, and 119 instead of 2,521 at four. Partial-order
reduction found nothing more to cut, because every action reads and writes the shared `nodes` array, so no two
actions are independent in this model. That is the reduction being correctly conservative.

Safety is fixed. Liveness, under weak fairness, is a different story. "Some node gets a write in" keeps happening, so
the system as a whole always makes progress:

```text
lock, 3 nodes, store fencing, symmetry [exhaustive]: ok, 51 states
```

"n0 gets a write in" does not:

```text
lock, 2 nodes, store fencing [exhaustive]: FAILED, 37 states
  the system can loop forever without ever reaching "n0 gets a write in". The cycle is fair: processes 1, 0, 2 keep moving; processes 2, 0, 1 are blocked
    (initial)              n0 idle, n1 idle | store t0
  then forever
    n0 acquires lock       n0 holding t1 lease, n1 idle | store t0
    lease of n0 expires    n0 holding t1, n1 idle | store t0
    n1 acquires lock       n0 holding t1, n1 holding t2 lease | store t0
    lease of n1 expires    n0 holding t1, n1 holding t2 | store t0
    n1 writes              n0 holding t0, n1 wrote t1 | store t1
    n0 writes              n0 idle, n1 wrote t0 | store t0
    n1 releases lock       n0 idle, n1 idle | store t0
    n1 acquires lock       n0 idle, n1 holding t1 lease | store t0
    lease of n1 expires    n0 idle, n1 holding t1 | store t0
    n0 acquires lock       n0 holding t2 lease, n1 holding t1 | store t0
    lease of n0 expires    n0 holding t2, n1 holding t1 | store t0
    n1 writes              n0 holding t1, n1 wrote t0 | store t0
    n1 releases lock       n0 holding t1, n1 idle | store t0
    n1 acquires lock       n0 holding t1, n1 holding t2 lease | store t0
    n1 writes              n0 holding t0, n1 wrote t1 lease | store t1
    n0 writes              n0 idle, n1 wrote t0 lease | store t0
    n1 releases lock       n0 idle, n1 idle | store t0
```

This is a lasso: a path into a loop that can repeat forever. In the first six steps of the loop n0 takes the lock,
pauses past its lease, and wakes up to find that n1 has written with a newer token, so the fenced storage rejects its
write. The cycle is fair, because every process either moves in it or is blocked somewhere in it, so this is not a
scheduler that simply never runs n0. Fencing keeps the data safe, but it does nothing for progress: a node whose lease
keeps running out can be fenced out forever.

### Tips

- **Keep the state finite.** A counter that only goes up (here, the lock epoch) makes the state space infinite.
  Renumbering values by rank after every step keeps it finite when only their order matters.
- **Declare `reads` and `writes` honestly.** An undeclared field makes partial-order reduction unsound, and a wrong
  reduction prints the same "no violation found" as a correct one. The example runs `checkExhaustive` and
  `checkReduced` on every size and expects the same verdict from both.
- **Run without symmetry to read a trace.** Symmetric traces print canonical states, so node names shift between
  lines. The unreduced run gives the same trace with stable names.

## What pnueli is

- A spec is a plain object: `init` states, `actions`, `invariants`, and an optional `terminal` predicate.
- An action's `step` returns a list of next states, so one action can have several outcomes.
- Breadth-first search, so every counterexample is a shortest trace.
- Symmetry reduction and partial-order reduction with ample sets, driven by declared `reads` and `writes`.
- Every reduction is checked against the full, unreduced search on every spec small enough to run both.
- Liveness in one form: "eventually P" under weak fairness, found as a fair cycle (a lasso) in the state graph.
- Validated on problems with known answers: Peterson's algorithm, dining philosophers, Raft election safety (up to
  6.8M states), write skew under snapshot isolation.
- Honest scope: no disk-backed storage, no full LTL, no strong fairness, and no link between the spec and the
  implementation.

## Compared with SpecCraft

| | pnueli | SpecCraft |
|---|---|---|
| An action's result | A list of next states (several outcomes allowed) | One next state; parameters are expanded into separate actions |
| Reductions | Symmetry and partial-order, validated against the full search | None yet |
| Liveness | "Eventually P" under weak fairness | Not yet |
| Output | Verdict per invariant, trace, liveness cycle | State count, endings, stuck states, shortest trace per invariant, beliefs that must keep failing |
| Real code | Not covered: "the specification is not the implementation" | `checkConformance` walks the spec against a real implementation |
| Async in real code | Not covered | Inline specs: the explorer delivers async replies in every order |

SpecCraft, on the same `lock.ts`, finds the same five-step trace without fencing after walking all 566 reachable
states, and proves the fenced store in 37, 283 and 2,521 states, exactly pnueli's unreduced counts. Its
`checkConformance` then runs a small real lock client against the fenced spec: it matches in all 283 states with a
fenced storage, and with a plain storage it reports the one step, "n0 writes", where the real code accepts a write the
spec rejects.

- **pnueli found a bug SpecCraft cannot.** SpecCraft has no liveness check, so its clean run on the fenced spec says
  nothing about n0 being shut out forever.
- **pnueli needs far fewer states.** Symmetry cut the proof from 2,521 states to 119 at four nodes; SpecCraft visits
  the full count every time.
- **Only SpecCraft checks real code.** pnueli proves the model and stops there; its author points to separate
  sampling tools (unflake, bulwark) for the code.
- **SpecCraft takes from it** steps that return a list of next states, declared reads and writes as the input to
  partial-order reduction, and validating every reduction against the unreduced search.

## Who builds it

Doniyor Botirov, founder of dbit.one. pnueli is part of a small set of his TypeScript tools: unflake (deterministic
simulation testing with seeded schedules), bulwark (Raft tested under seeded faults), and adya (finding transaction
isolation anomalies). pnueli is the one that proves small instances outright instead of sampling them. It is new and
early: one star and about 55 downloads a month in September 2026.

## Links

- pnueli on GitHub: https://github.com/BOTIROFF-D/pnueli
- pnueli on npm: https://www.npmjs.com/package/@botiroff/pnueli
- unflake on GitHub: https://github.com/BOTIROFF-D/unflake
