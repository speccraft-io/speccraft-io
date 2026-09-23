---
title: SpecCraft vs stifinder
description: stifinder is a state-space explorer for JavaScript that finds the failure needing the fewest departures from the expected schedule. It is the closest new engine to SpecCraft's. SpecCraft adds a spec layer, conformance against real code, and inline specs.
---

[stifinder](https://github.com/andershessellund/stifinder) is a state-space explorer for JavaScript and TypeScript,
published on npm in September 2026. It is the newest engine in SpecCraft's corner, and it answers a question SpecCraft
does not ask yet: not only "is there a failing trace", but "what is the failing trace that needs the fewest things
to go differently than expected".

## One problem, both tools

A transactional outbox. The order service writes the order and an outbox row in one database transaction. A relay
reads the row, publishes the event to a broker, and marks the row sent. Two things go wrong in production: the relay
can crash at any step and restart from the outbox, and the broker can time out after it has already delivered the
message, so the relay retries.

Two rules must hold: every committed order is published, and the consumer applies each order at most once. There are
three relays to check:

- **Mark, then publish.** The relay marks the row sent before it publishes. A crash in between loses the event.
- **Publish, then mark, no idempotency key.** Nothing is lost, but a retry or a crash after publishing delivers the
  event twice, and the consumer applies it twice.
- **Publish, then mark, with an idempotency key.** The consumer drops a delivery it has already applied. This is the
  fixed relay.

The code below is in [examples/outbox](https://github.com/speccraft-io/speccraft-ts/tree/main/examples/outbox) and
runs with `pnpm test`. Both tools check the same three relays with the same state: the outbox row, the relay's phase,
and how many times the consumer applied the order.

### With stifinder

`getEvents` returns the expected next step first. Faults come after it, each with a cost key, so every fault is one
deviation plus one unit of `crash` or `retry`. The two rules are an `invariant` and a `terminalInvariant`:

```ts
// stifinder-model.ts (shortened)
function faults(v: Variant, s: State): EventDescriptor<Event>[] {
  return [
    ...(publishing(v, s) ? [{ event: 'broker times out after delivery' as const, cost: ['retry'] }] : []),
    ...(s.relay === 'idle' ? [] : [{ event: 'relay crashes' as const, cost: ['crash'] }]),
  ];
}

export function outboxModel(v: Variant): Model<State, Event> {
  return {
    initialState: initial,
    getEvents: (s) => [...expected(v, s), ...faults(v, s)],
    applyEvent: (s, e) => ({ to: effects[e](v, s) }),
    invariant: (s) => (s.applied > 1 ? { error: new Error('the order was applied twice') } : undefined),
    terminalInvariant: (s) =>
      s.applied === 0 ? { error: new Error('the committed order was never published') } : undefined,
  };
}
```

Each relay runs with a budget of up to two crashes and two retries. The real results, as the tests assert them:

```ts
// outbox.stifinder.test.ts (shortened)
const faults = { crash: 2, retry: 2 };

const space = await exploreIteratively(outboxModel(markThenPublish), { baseBudget: faults });
expect(space.violation?.error).toEqual(new Error('the committed order was never published'));
expect(space.violation?.steps.map((s) => [s.event, s.index])).toEqual([
  ['order service commits order and outbox row', 0],
  ['relay reads row', 0],
  ['relay marks row sent', 0],
  ['relay crashes', 2],
]);
expect(Object.fromEntries(space.violation?.cost ?? [])).toEqual({ crash: 1, __deviations__: 1 });
expect(space.violation?.badState).toEqual({ outbox: 'sent', relay: 'idle', applied: 0 });
expect(space.maxDeviationsReached).toBe(1);
expect(space.exhaustive).toBe(false);

const duplicate = await exploreIteratively(outboxModel(publishThenMark), { baseBudget: faults });
expect(duplicate.violation?.steps.map((s) => [s.event, s.index])).toEqual([
  ['order service commits order and outbox row', 0],
  ['relay reads row', 0],
  ['broker times out after delivery', 1],
  ['relay publishes', 0],
]);
expect(Object.fromEntries(duplicate.violation?.cost ?? [])).toEqual({ retry: 1, __deviations__: 1 });

const fixed = await exploreIteratively(outboxModel(publishThenMarkWithKey), { baseBudget: faults });
expect(fixed.violation).toBeNull();
expect(fixed.exhaustive).toBe(true);
expect(fixed.costs.size).toBe(7);
expect(fixed.edgesComputed).toBe(11);
```

The lost event needs one crash, right after the row is marked sent. The duplicate needs one retry. Each report comes
with its price: the cost vector says one fault, and `maxDeviationsReached: 1` says the zero-fault budget was searched
first and was clean. The step `index` tells an expected step (0) from a fault (anything else). With retries taken out
of the budget (`{ crash: 2 }`), the duplicate comes back as the crash path instead: publish, crash, read again,
publish again, 6 steps, `{ crash: 1, __deviations__: 1 }`.

The fixed relay has 7 reachable states and 11 edges, and the result is `exhaustive: true`: every state was explored,
so the rules hold for any number of crashes and retries, not only two. With a budget of one crash and one retry, the
same run is `exhaustive: false`: the budget does not cover every edge of the state space. And a run with no fault
budget at all (`{}`) on the buggy duplicate relay says `violation: null`, `completed: true`, `exhaustive: false`: no
bug without faults, and explicitly not a proof.

### With SpecCraft

The spec has one action per step. Fault counts are part of the state, and the guards bound them:

```ts
// speccraft-model.ts (shortened)
export function outboxSpec(v: Variant, max: Faults): Spec<Bounded> {
  return {
    init: () => ({ ...initial, crashes: 0, retries: 0 }),
    actions: [
      // commit, read, publish and mark sent, as above
      {
        name: 'broker times out after delivery',
        guard: (s) => publishing(v, s) && s.retries < max.retries,
        effect: (s) => ({ ...s, applied: consume(v, s.applied), retries: s.retries + 1 }),
      },
      {
        name: 'relay crashes',
        guard: (s) => s.relay !== 'idle' && s.crashes < max.crashes,
        effect: (s) => ({ ...s, relay: 'idle', crashes: s.crashes + 1 }),
      },
    ],
    invariants: [
      { name: 'the order is applied at most once', check: (s) => s.applied <= 1 },
      {
        name: 'a row marked sent was published or is still held by the relay',
        check: (s) => s.outbox !== 'sent' || s.applied > 0 || s.relay === 'marked',
      },
    ],
    stuck: (s) => s.applied === 0,
  };
}
```

With the same bounds, two crashes and two retries:

```ts
// outbox.speccraft.test.ts (shortened)
const faults = { crashes: 2, retries: 2 };

const lost = explore(outboxSpec(markThenPublish, faults));
expect(lost.visitedCount).toBe(27);
expect(lost.invariants[1]).toEqual({
  name: 'a row marked sent was published or is still held by the relay',
  holds: false,
  counterexample: ['order service commits order and outbox row', 'relay reads row', 'relay marks row sent', 'relay crashes'],
});
expect(lost.stuck).toEqual([
  { outbox: 'sent', relay: 'idle', applied: 0, crashes: 1, retries: 0 },
  { outbox: 'sent', relay: 'idle', applied: 0, crashes: 2, retries: 0 },
]);

const duplicate = explore(outboxSpec(publishThenMark, faults));
expect(duplicate.visitedCount).toBe(71);
expect(duplicate.invariants[0]?.counterexample).toEqual([
  'order service commits order and outbox row',
  'relay reads row',
  'broker times out after delivery',
  'relay publishes',
]);

const fixed = explore(outboxSpec(publishThenMarkWithKey, faults));
expect(fixed.visitedCount).toBe(39);
expect(fixed.invariants.every((invariant) => invariant.holds)).toBe(true);
expect(fixed.stuck).toEqual([]);
```

The traces are the same four steps. With `retries: 0`, SpecCraft also returns the 6-step crash path for the
duplicate. The fixed relay holds in all 39 reachable states within the bounds.

### What each run tells you

- **The traces agree here, for different reasons.** stifinder reports the trace with the fewest faults, SpecCraft
  the trace with the fewest steps. In this model the shortest trace is also the one with the fewest faults, so both
  print the same four steps. A model where a two-fault trace is shorter than any one-fault trace would split them;
  this one does not show that.
- **stifinder says what the failure costs.** `{ crash: 1, __deviations__: 1 }` and a clean zero-fault budget are
  part of the result: no run without a fault breaks the rules, and one crash is enough. SpecCraft's trace names the
  crash too, but that it is the minimum is something you learn by lowering the bounds and running again.
- **stifinder's proof covers every number of faults.** Faults are a budget, not state, so the fixed relay is 7 states
  and `exhaustive: true` means any number of crashes and retries. In SpecCraft the counters are state: 39 states for
  two of each, and the result covers exactly those bounds.
- **stifinder checks the ending directly.** "The committed order was never published" is a `terminalInvariant`, and
  the violation comes with a trace and the bad state. SpecCraft's `stuck` list finds the same end states but without
  a trace, so the spec needed a second, state-level rule to get one.
- **SpecCraft's spec reads as actions.** Each step is a named action with its guard next to its effect, and the
  same spec can be walked against a real relay with `checkConformance` (not done in this example). stifinder is a
  search core by design and has no conformance check.

### How to start

- stifinder: `pnpm add -D stifinder valsem` (Node 22 or newer), then write `getEvents` with the expected step first
  and each fault tagged with a cost key, and call `exploreIteratively` with a `baseBudget` for those keys. A default
  `baseBudget` of `{}` makes every costed event unaffordable. With `skipLibCheck: false` and a target below ESNext,
  valsem's types need `/// <reference lib="esnext.collection" />`.
- SpecCraft: `pnpm add -D @speccraft-io/core`, then write the state with a counter per fault, one action per step
  with the bound in its guard, and the rules as invariants, and call `explore`.

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
