---
title: SpecCraft vs pnueli
description: pnueli is an explicit-state model checker in TypeScript with symmetry and partial-order reduction and liveness under weak fairness. It is the closest thing to SpecCraft's engine. SpecCraft adds conformance against real code and inline specs.
---

[pnueli](https://github.com/BOTIROFF-D/pnueli) is an explicit-state model checker written in TypeScript, published
on npm as `@botiroff/pnueli` in August 2026. Of everything we have found, it is the closest to SpecCraft's own engine:
a spec is a plain TypeScript object, and the checker walks every reachable state. It is also ahead of SpecCraft on
several engine features, so this page is worth reading closely.

## One problem, both tools

Several identical nodes share a lock with a lease. A node takes the lock, then writes to shared storage. The lease
can expire while the node is paused (a long GC pause, a slow disk) between taking the lock and writing. Another
node then takes the lock and writes, the first node wakes up and writes too, and the storage now holds the older
node's data on top of the newer one. The usual fix is a fencing token: every lock grant carries a number that goes
up, and the storage rejects a write whose token is older than one it has already accepted.

There are two questions here. Safety: can the storage ever take a write older than one it already took? Liveness:
does every node keep getting its writes in, or can one be shut out forever?

Both tools check the same model. The transitions live in one file, `lock.ts`, and each tool wraps them in its own
spec format, so the state counts can be compared directly. The write step is the whole bug and the whole fix:

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
space finite even though nodes can take the lock again and again. So `t0` is the oldest token still in play, not a
fixed number.

The code below is in
[examples/distributed-lock](https://github.com/speccraft-io/speccraft-ts/tree/main/examples/distributed-lock) and
runs with `pnpm test`.

### With pnueli

Each node is a process. The lease clock is one more process, so weak fairness applies to it too. The nodes are
interchangeable, so the spec declares a symmetry function that sorts them:

```ts
// lock.pnueli.ts (shortened)
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

```ts
// lock.pnueli.test.ts (shortened)
checkExhaustive(lockSpec(3, 'accepts any write', false));
checkExhaustive(lockSpec(3, 'accepts any write', true));
checkExhaustive(lockSpec(n, 'fencing', false));
checkExhaustive(lockSpec(n, 'fencing', true));
checkReduced(lockSpec(n, 'fencing', true));
checkLiveness(lockSpec(3, 'fencing', true), someNodeWrites);
checkLiveness(lockSpec(2, 'fencing', false), n0Writes);
```

The real output, printed from each result by a small formatter in the test. Without fencing, three nodes:

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
and writes an older token over it. With symmetry the search stops after 18 states instead of 75. The trace is the
same five steps, but it prints canonical states, where the nodes are sorted after every step, so the node names in
the states no longer line up with the names in the actions.

With fencing the invariant holds. States visited to prove it:

```text
┌─────────┬───────┬──────┬──────────┬────────────────┐
│ (index) │ nodes │ none │ symmetry │ symmetryAndPor │
├─────────┼───────┼──────┼──────────┼────────────────┤
│ 0       │ 2     │ 37   │ 19       │ 19             │
│ 1       │ 3     │ 283  │ 51       │ 51             │
│ 2       │ 4     │ 2521 │ 119      │ 119            │
└─────────┴───────┴──────┴──────────┴────────────────┘
```

Liveness, under weak fairness. "Some node gets a write in" keeps happening, so the system as a whole always makes
progress:

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
pauses past its lease, and wakes up to find that n1 has written with a newer token, so the fenced storage rejects
its write. The cycle is fair, because every process either moves in
it or is blocked somewhere in it, so this is not a scheduler that simply never runs n0. Fencing keeps the data safe,
but it does nothing for progress: a node whose lease keeps running out can be fenced out forever.

### With SpecCraft

The same transitions become guarded actions: the guard is "the transition applies here", the effect is the next
state. Actions have no process, and there is no symmetry declaration:

```ts
// lock.speccraft.ts (shortened)
function nodeActions(i: number, store: Store): Action<State>[] {
  return [
    action(`n${i} acquires lock`, (s) => acquire(s, i)),
    action(`n${i} writes`, (s) => write(s, i, store)),
    action(`n${i} releases lock`, (s) => release(s, i)),
    action(`lease of n${i} expires`, (s) => expire(s, i)),
  ];
}

export function lockSpec(n: number, store: Store): Spec<State> {
  return {
    init: () => init(n),
    actions: Array.from({ length: n }, (_, i) => nodeActions(i, store)).flat(),
    invariants: [
      { name: 'the store never takes a write older than one it already took', check: (s) => !s.stale },
    ],
  };
}
```

Without fencing, three nodes, `explore(lockSpec(3, 'accepts any write'))`:

```text
{
  "visitedCount": 566,
  "invariants": [
    {
      "name": "the store never takes a write older than one it already took",
      "holds": false,
      "counterexample": [
        "n0 acquires lock",
        "lease of n0 expires",
        "n1 acquires lock",
        "n1 writes",
        "n0 writes"
      ]
    }
  ]
}
```

The same five-step trace. SpecCraft does not stop at the first failure: it walks all 566 reachable states and
reports every invariant. With fencing:

```text
┌─────────┬───────┬──────────────┬─────────┐
│ (index) │ nodes │ visitedCount │ endings │
├─────────┼───────┼──────────────┼─────────┤
│ 0       │ 2     │ 37           │ 0       │
│ 1       │ 3     │ 283          │ 0       │
│ 2       │ 4     │ 2521         │ 0       │
└─────────┴───────┴──────────────┴─────────┘
```

The counts match pnueli's unreduced search exactly, as they should for the same model. There are no endings,
because the nodes keep taking the lock forever. SpecCraft has no liveness check, so it cannot say anything about
n0 being fenced out; it only proves that the storage never takes a stale write.

What pnueli does not do is look at real code. The example has a small real lock client in `client.ts`: a `LeaseLock`
with a clock and a time to live, a `Worker` that acquires, writes and releases, and two storages, `PlainStorage` and
`FencedStorage`. `checkConformance` walks the fenced spec and replays each path against the real classes, mapping
their fields to the spec's state:

```ts
// lock.speccraft.test.ts (shortened)
checkConformance(lockSpec(3, 'fencing'), realLock(3, fencedStorage));
checkConformance(lockSpec(3, 'fencing'), realLock(3, plainStorage));
```

```text
{
  "visitedCount": 283
}
```

The real client with `FencedStorage` matches the spec in all 283 states. With `PlainStorage` it does not (output
shortened to n0, the node that differs):

```text
{
  "visitedCount": 41,
  "mismatch": {
    "trace": [
      "n0 acquires lock",
      "lease of n0 expires",
      "n1 acquires lock",
      "n1 writes",
      "n0 writes"
    ],
    "action": "n0 writes",
    "expected": { "nodes": [{ "phase": "idle", "lease": false, "token": null }, ...], "stale": false },
    "actual": { "nodes": [{ "phase": "wrote", "lease": false, "token": 0 }, ...], "stale": true }
  }
}
```

The spec says n0's write is rejected and n0 goes back to idle; the real storage accepted it.

### What each run tells you

- **pnueli found a bug SpecCraft cannot.** The liveness check shows that fencing tokens keep the data safe but can
  shut a slow node out forever, and it prints the fair loop that does it. SpecCraft has no liveness check, so its
  clean run on the fixed spec says nothing about progress.
- **Symmetry reduction pays off quickly.** The same proof takes 51 states instead of 283 at three nodes, and 119
  instead of 2,521 at four. SpecCraft visits the full count every time.
- **Partial-order reduction found nothing to cut here.** Every action reads and writes the shared `nodes` array, so
  no two actions are independent in this model. That is the reduction being correctly conservative, not a failure.
- **Both find the same shortest trace.** Five steps, the same actions in the same order. pnueli stops at the first
  broken invariant; SpecCraft walks every state and reports each invariant.
- **Symmetry costs some readability.** The reduced trace prints sorted states, so node names shift between lines.
- **Only SpecCraft checked real code.** pnueli's README says it plainly: the specification is not the
  implementation. `checkConformance` ran the real lock client against the spec and found the one step where a plain
  store differs from a fenced one.

### How to start

- pnueli: `pnpm add -D @botiroff/pnueli`, then give each action a `process`, its `reads` and `writes`, and a `step`
  that returns the next states; add `symmetry` for identical processes and call `checkExhaustive`, `checkReduced`
  or `checkLiveness`.
- SpecCraft: `pnpm add -D @speccraft-io/core`, then write the state, one guarded action per step, and the rule that
  must hold, and call `explore`; add `checkConformance` to run the same spec against the real code.

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
