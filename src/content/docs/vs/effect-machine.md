---
title: SpecCraft vs effect-machine
description: effect-machine is a schema-first statechart library for Effect with bounded breadth-first exploration, invariants and coverage in its testing module. SpecCraft works on free-form TypeScript state and checks real code, including async replies in every order.
tableOfContents: true
adoption:
  github: typeonce-dev/effect-machine
  npm: '@typeonce/effect-machine'
  created: 2026-07-28
---

[effect-machine](https://github.com/typeonce-dev/effect-machine) is a statechart library for
[Effect](https://effect.website), published on npm as `@typeonce/effect-machine` since July 2026. Its testing module
includes a bounded breadth-first explorer with invariants and shortest counterexamples. It is the most used tool in
this group: about 53,000 downloads a month in September 2026.

## One problem, both tools

A checkout has four states: `Cart` (items can be edited), `PaymentPending`, `Paid` and `Failed`. Checkout sends a
charge for the cart total to the payment provider and waits for its reply. While the payment is pending the user
can press Back, edit the cart and check out again. The first charge is still in flight, and its reply can arrive
while the second one is pending:

```ts
// checkout.effect-machine.test.ts (shortened)
const cart = {
  on: {
    AddItem: { update: targets.root, data: ({ root }: { root: { items: number } }) => ({ items: root.items + 1 }) },
    RemoveItem: {
      update: targets.root,
      data: ({ root }: { root: { items: number } }) => ({ items: root.items - 1 }),
    },
    Checkout: {
      target: targets.root.PaymentPending,
      data: ({ root }: { root: { items: number } }) => ({ amount: root.items * price }),
    },
  },
} as const;

const buggyMachine = Machine.make({ root: States, events: Events }).handle({
  root: () => ({ items: 1 }),
  initial: { target: targets.root.Cart },
  states: {
    Cart: cart,
    PaymentPending: {
      on: {
        Back: { target: targets.root.Cart },
        PaymentSucceeded: { target: targets.root.Paid, data: ({ event }) => ({ amount: event.amount }) },
        PaymentFailed: { target: targets.root.Failed },
      },
    },
    Paid: {},
    Failed: {},
  },
});
```

The rule that must hold: in `Paid`, the paid amount is the cart total. The fix used on both sides is the simplest
one: Back is not allowed while the payment is pending. (Tagging each reply with a cart version and rejecting a stale
one would also work.)

The code below is in [examples/checkout](https://github.com/speccraft-io/speccraft-ts/tree/main/examples/checkout)
and runs with `pnpm test`.

### With effect-machine

**The natural way first.** In effect-machine, async work belongs to the state that owns it, so the charge is an
`invoke` on `PaymentPending`:

```ts
// checkout.effect-machine.test.ts (shortened)
PaymentPending: {
  invoke: {
    src: 'charge',
    input: ({ state }) => state.amount,
    onDone: { target: targets.root.Paid, data: ({ output }) => ({ amount: output }) },
  },
  on: { Back: { target: targets.root.Cart } },
},
```

```ts
const explored = yield* MachineTest.explore(invokeMachine, {
  events: ({ snapshot }) => userEvents(snapshot),
  stateKey: ({ snapshot }) => JSON.stringify(snapshot),
  invariants: [invokeInvariant],
});
```

`userEvents` offers AddItem, RemoveItem and Checkout in `Cart` (up to two items) and Back in `PaymentPending`. The
real output:

```text
{ states: 4, plannedTransitions: 6, retainedEdges: 6, maxDepth: 2 } Complete
[
  {
    source: 'PaymentPending',
    trigger: { type: 'invoke', id: 'charge', outcome: 'done' }
  }
]
```

The exploration is complete and the invariant passes, but `Paid` is never reached: the explorer plans transitions
and does not run invokes. Coverage says so directly: the one missed transition is the invoke's `onDone`. At runtime,
per its docs, the machine cancels the invoke when Back leaves `PaymentPending`, so the machine itself drops the late
reply, even if the provider has already charged the card. The planner cannot show that either.

**The reply as a public event.** A provider that answers through a webhook sends its reply to the machine as an
event, `PaymentSucceeded { amount }` or `PaymentFailed { amount }`, which is the machine shown above. The explorer
only tries the events the test lists. Listing the reply to the current request:

```ts
const explored = yield* MachineTest.explore(buggyMachine, {
  events: ({ snapshot }) => [...userEvents(snapshot), ...currentReply(snapshot)],
  stateKey: ({ snapshot }) => JSON.stringify(snapshot),
  invariants: [buggyInvariant],
});
```

```text
{ states: 8, plannedTransitions: 10, retainedEdges: 10, maxDepth: 3 } Complete
6 / 6
```

It passes: a complete exploration with all 6 transition definitions covered, and the bug is not found. The reply
from the first checkout is never offered while the second one is pending.

To find it, the test has to list every reply still in flight. `inFlight` reads the trace (a Checkout adds the cart
total, a reply removes its amount), and the state key includes that set so two states with different replies in
flight are not merged:

```ts
// checkout.effect-machine.test.ts (shortened)
function inFlight(steps: readonly Step[]): number[] {
  const amounts = new Set<number>();
  for (const { event, before } of steps) {
    if (event._tag === 'Checkout' && States.matches(before, 'Cart')) {
      amounts.add(before.value.items * price);
    }
    if (event._tag === 'PaymentSucceeded' || event._tag === 'PaymentFailed') {
      amounts.delete(event.amount);
    }
  }
  return [...amounts].sort((a, b) => a - b);
}

const error = yield* Effect.flip(
  MachineTest.explore(buggyMachine, {
    events: ({ snapshot, trace }) => [...userEvents(snapshot), ...inFlightReplies(trace.steps)],
    stateKey: ({ snapshot, trace }) => JSON.stringify([snapshot, inFlight(trace.steps)]),
    invariants: [buggyInvariant],
  }),
);
console.log(MachineTest.formatTrace(error.trace));
console.log(error.violations.map((violation) => violation.message));
```

The real output (shortened: the `initial` line, the microstep lines and the end of each step line are left out):

```text
scenario: {"events":[{"_tag":"Checkout"},{"_tag":"Back"},{"_tag":"AddItem"},{"_tag":"Checkout"},{"_tag":"PaymentSucceeded","amount":10}]}
step 0: event={"_tag":"Checkout"} before=[(root), Cart] after=[(root), PaymentPending] ...
step 1: event={"_tag":"Back"} before=[(root), PaymentPending] after=[(root), Cart] ...
step 2: event={"_tag":"AddItem"} before=[(root), Cart] after=[(root), Cart] ...
step 3: event={"_tag":"Checkout"} before=[(root), Cart] after=[(root), PaymentPending] ...
step 4: event={"_tag":"PaymentSucceeded","amount":10} before=[(root), PaymentPending] after=[(root), Paid] ...
final: configuration=[(root), Paid] state={"path":"","state":{"path":"Paid","value":{"_tag":"Paid","amount":10}},"value":{"_tag":"","items":2}}
[ 'paid 10 for a cart of 20' ]
```

That is the shortest counterexample: check out one item, go back, add a second item, check out again, and the reply
to the first charge marks the order paid at 10 for a cart of 20. With Back removed from `PaymentPending`, the same
exploration passes:

```text
{ states: 8, plannedTransitions: 10, retainedEdges: 10, maxDepth: 3 } Complete
```

### With SpecCraft

The spec is plain state and actions. The replies in flight are part of the state, and each reply is an action that
can fire whenever its charge is in flight, whatever screen the user is on:

```ts
// model.ts (shortened)
const back: Action<State> = {
  name: 'back',
  guard: (s) => s.screen === 'pending',
  effect: (s) => ({ ...s, screen: 'cart' }),
};

const replies: Action<State>[] = amounts.flatMap((amount): Action<State>[] => [
  {
    name: `payment of ${amount} succeeds`,
    guard: (s) => s.inFlight.includes(amount),
    effect: (s) => ({
      ...s,
      inFlight: without(s.inFlight, amount),
      ...(s.screen === 'pending' ? { screen: 'paid', paid: amount } : {}),
    }),
  },
  // `payment of ${amount} fails` is the same, with screen 'failed'
]);

function checkoutSpec(actions: Action<State>[]): Spec<State> {
  return {
    init,
    actions: [...actions, ...replies],
    invariants: [
      { name: 'the paid amount matches the cart', check: (s) => s.screen !== 'paid' || s.paid === s.items * price },
    ],
  };
}

export const buggySpec: Spec<State> = checkoutSpec([...cartActions, back]);
export const fixedSpec: Spec<State> = checkoutSpec(cartActions);
```

```ts
// checkout.speccraft.test.ts
const result = explore(buggySpec);
expect(result.visitedCount).toBe(26);
expect(result.endings).toHaveLength(6);
expect(result.invariants).toEqual([
  {
    name: 'the paid amount matches the cart',
    holds: false,
    counterexample: ['checkout', 'back', 'add item', 'checkout', 'payment of 10 succeeds'],
  },
]);
```

The search visits all 26 reachable states and returns the same five-step trace. Of its 6 endings, two are paid with
the wrong amount: 10 for a cart of 20, and 20 for a cart of 10. The fixed spec has 8 reachable states and 4 endings,
and the invariant holds in every one of them.

### What each run tells you

- **effect-machine found the bug, but only once the test was written for it.** With the charge as an `invoke`, the
  explorer does not run it and cannot find the bug. With the reply as an event, it found the bug only when the test
  offered every reply still in flight and put that set in the state key. Offering just the reply to the current
  request gave a complete result, full transition coverage, and no bug.
- **effect-machine's coverage report is ahead here.** In the invoke version it named the exact transition that
  exploration never took. SpecCraft reports no coverage, so an action that never fires is not flagged.
- **In this example SpecCraft also needed the replies written by hand.** The `inFlight` list in the spec does the same
  job as `inFlight` in the effect-machine test. The difference is where it lives: in the spec's state, where the
  search treats it like any other state, instead of in the test's event list and state key. SpecCraft's inline specs
  deliver async replies in every order without that list (see the
  [annotated cart example](https://github.com/speccraft-io/speccraft-ts/tree/main/examples/annotated-cart)); this
  example does not use them.
- **effect-machine explored the machine that runs.** The SpecCraft spec is a second artifact; connecting it to real
  code takes `checkConformance` or an inline spec.
- **The traces read differently.** effect-machine prints each step with its configuration and microsteps, and the
  invariant's own message; SpecCraft prints the step names from the spec.

### How to start

- effect-machine: `pnpm add @typeonce/effect-machine effect@<its exact peer version>`, then call
  `MachineTest.explore(machine, { events, stateKey, invariants })`. Model replies from outside as public events and
  list every reply that can still arrive.
- SpecCraft: `pnpm add -D @speccraft-io/core`, then write the state (including the replies in flight), one action per
  step, and the rule that must hold, and call `explore`.

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
