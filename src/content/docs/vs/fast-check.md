---
title: SpecCraft vs fast-check
description: fast-check is the standard property-based testing library for TypeScript, with model-based testing and a scheduler for async races. It samples randomly and shrinks; SpecCraft explores every reachable state of a spec and returns the shortest trace. They work well together.
---

[fast-check](https://github.com/dubzzz/fast-check) is the property-based testing library for JavaScript and
TypeScript: about 5,000 stars and about 140 million npm downloads a month in September 2026. It is not a model
checker, but it is the first tool a TypeScript developer will compare SpecCraft to, because its model-based testing
looks close: commands with preconditions, run against a model and the real system.

## One bug, both tools

A service receives an `order.confirmed` webhook and charges the card. The sender retries when it does not hear back
in time, so the same order can arrive twice. The handler checks the order first:

```ts
// webhook.ts
export async function handleOrderConfirmed(orderId: string, deps: Deps): Promise<void> {
  const status = await deps.getStatus(orderId);
  if (status === 'unpaid') {
    await deps.chargeCard(orderId);
    await deps.setStatus(orderId, 'paid');
  }
}
```

A test that runs the retry after the first delivery passes. In production two workers take the two deliveries at the
same time, and each `await` is a point where the other worker can run. The same example is on the
[Quint page](/tools/quint), so the tools can be compared on one problem.

The code below is in [examples/webhook](https://github.com/speccraft-io/speccraft-ts/tree/main/examples/webhook)
and runs with `pnpm test`.

### With fast-check

`fc.scheduler()` wraps each dependency, so fast-check decides when each call resolves. The test runs two deliveries
at once against the real handler:

```ts
// webhook.fast-check.test.ts (shortened)
const property = fc.asyncProperty(fc.scheduler(), async (s) => {
  const db: Db = { status: 'unpaid', charges: 0 };
  const deps = {
    getStatus: s.scheduleFunction(async (_id: string) => db.status),
    chargeCard: s.scheduleFunction(async (_id: string) => { db.charges += 1; }),
    setStatus: s.scheduleFunction(async (_id: string, status: OrderStatus) => { db.status = status; }),
  };
  const run = Promise.all([handleOrderConfirmed('o1', deps), handleOrderConfirmed('o1', deps)]);
  await s.waitIdle();
  await run;
  expect(db.charges).toBe(1);
});
await fc.assert(property, { seed: 1 });
```

The real output:

```text
Property failed after 1 tests
{ seed: 1, path: "0", endOnFailure: true }
Counterexample: [schedulerFor()`
-> [task${2}] function::("o1") resolved with value "unpaid"
-> [task${1}] function::("o1") resolved with value "unpaid"
-> [task${4}] function::("o1") resolved
-> [task${3}] function::("o1") resolved
-> [task${5}] function::("o1","paid") resolved
-> [task${6}] function::("o1","paid") resolved`]
Shrunk 0 time(s)
```

It fails on the first run. Both status reads return `"unpaid"`, both workers charge, and the report is the order in
which the scheduled calls resolved. With the fix (a `claimOrder` that sets `'charging'` only if the order is still
`'unpaid'`), the same test passes 100 sampled runs.

### With SpecCraft

The spec says what each worker can do next, one step per `await`, and what must always hold:

```ts
// model.ts (shortened)
function readThenCharge(w: Worker): Action<State>[] {
  return [
    {
      name: `${w} reads status`,
      guard: (s) => s.phase[w] === 'queued',
      effect: (s) => ({ ...moved(s, w, 'read'), seen: { ...s.seen, [w]: s.status } }),
    },
    {
      name: `${w} skips`,
      guard: (s) => s.phase[w] === 'read' && s.seen[w] !== 'unpaid',
      effect: (s) => moved(s, w, 'done'),
    },
    {
      name: `${w} charges card`,
      guard: (s) => s.phase[w] === 'read' && s.seen[w] === 'unpaid',
      effect: (s) => ({ ...moved(s, w, 'charged'), charges: s.charges + 1 }),
    },
  ];
}

export const buggySpec: Spec<State> = {
  init,
  actions: workers.flatMap((w) => [...readThenCharge(w), marksPaid(w)]),
  invariants: [{ name: 'the card is charged at most once', check: (s) => s.charges <= 1 }],
};
```

```ts
// webhook.speccraft.test.ts
const result = explore(buggySpec);
expect(result.visitedCount).toBe(20);
expect(result.invariants).toEqual([
  {
    name: 'the card is charged at most once',
    holds: false,
    counterexample: ['w1 reads status', 'w1 charges card', 'w2 reads status', 'w2 charges card'],
  },
]);
```

The search visits all 20 reachable states and returns the shortest trace to a double charge, in the spec's own
words: worker 1 reads and charges, and worker 2 reads before worker 1 marks the order paid. It also lists 3 endings,
one of them with two charges. With the claim made atomic, the fixed spec has 12 reachable states and 1 ending, and the
invariant holds in every one of them.

### What each run tells you

- **fast-check finds this bug just as easily as SpecCraft does.** It fails on the first run, because every order of
  these calls breaks the rule. This example does not show where full search beats sampling.
- **fast-check tested the real handler.** The SpecCraft check above covers the design, written as a spec. To check
  the real handler's `await`s, SpecCraft uses an inline spec on the real class, where the explorer delivers each async
  reply in every order (see the cart example in the
  [speccraft-ts repository](https://github.com/speccraft-io/speccraft-ts/tree/main/examples/annotated-cart)).
- **A clean run means different things.** fast-check's fixed run says 100 sampled orders passed. SpecCraft's says
  all 12 reachable states were checked.
- **The trace reads differently.** fast-check reports the order in which calls resolved; SpecCraft reports steps
  named in the spec.

:::note[To do]
A second example with a bug that only one rare order triggers, where sampling can miss it, and the SpecCraft side run
on the real handler with an inline spec instead of a separate model.
:::

### How to start

- fast-check: `pnpm add -D fast-check`, then wrap each async dependency with `s.scheduleFunction` in one test.
- SpecCraft: `pnpm add -D @speccraft-io/core`, then write the state, one action per `await`, and the rule that must
  hold, and call `explore`.

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
