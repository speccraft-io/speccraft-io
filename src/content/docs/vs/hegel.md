---
title: SpecCraft vs Hegel
description: Hegel brings Hypothesis-style property-based testing to TypeScript, with Hypothesis's generators and shrinking behind a cross-language protocol. It samples inputs; SpecCraft explores every reachable state of a spec.
tableOfContents: true
adoption:
  github: hegeldev/hegel-typescript
  npm: '@hegeldev/hegel'
  created: 2026-01-14
---

[Hegel](https://hegel.dev) is a property-based testing engine built on [Hypothesis](https://hypothesis.works), the
most widely used property-based testing library, with libraries for Rust, Go, C++, TypeScript, Java and OCaml. The
TypeScript library, `@hegeldev/hegel`, appeared in January 2026 and had about 37,000 npm downloads a month by
September 2026. It is in beta.

## One problem, both tools

A shop holds stock for a customer while they check out. `reserve` checks that there is enough, saves the
reservation, then takes the units out of stock:

```ts
// inventory.ts (shortened)
async reserve(sku: string, quantity: number): Promise<string | null> {
  if (quantity > (this.stock[sku] ?? 0)) {
    return null;
  }
  const id = await this.deps.saveReservation({ sku, quantity });
  this.stock[sku] = (this.stock[sku] ?? 0) - quantity;
  return id;
}
```

It has two bugs. The check only compares the quantity with the stock, so a quantity of 0, a negative one or a
fraction gets through. And the check runs before the `await` while the units are taken after it, so two
reservations that start together both pass the check against the same stock.

The code below is in
[examples/stock-reservation](https://github.com/speccraft-io/speccraft-ts/tree/main/examples/stock-reservation) and
runs with `pnpm test`.

### With Hegel

The first test draws a stock level and any integer quantity, makes one reservation, and checks that a successful one
took units out of stock without going below zero:

```ts
// inventory.hegel.test.ts (shortened)
const deps = { saveReservation: async () => 'r1' };

await hegel.testAsync(async (tc) => {
  const before = tc.draw(gs.integers({ minValue: 0, maxValue: 100 }));
  const quantity = tc.draw(gs.integers());
  const inventory = new Inventory({ mug: before }, deps);
  const id = await inventory.reserve('mug', quantity);
  const after = inventory.stock['mug'] ?? 0;
  if (id !== null && (after < 0 || after >= before)) {
    throw new Error(`reserved ${quantity} of ${before}, stock is now ${after}`);
  }
});
```

The real output (stack trace left out):

```text
var draw_1 = 0;
var draw_2 = 0;

reserved 0 of 0, stock is now 0
```

Hegel shrinks the failure to the smallest case: an empty shelf and a reservation for 0 units, which succeeds.

The second test draws a stock level and two quantities that each fit, and starts both reservations at once:

```ts
// inventory.hegel.test.ts (shortened)
await hegel.testAsync(async (tc) => {
  const before = tc.draw(gs.integers({ minValue: 1, maxValue: 100 }));
  const first = tc.draw(gs.integers({ minValue: 1, maxValue: before }));
  const second = tc.draw(gs.integers({ minValue: 1, maxValue: before }));
  const inventory = new Inventory({ mug: before }, deps);
  await Promise.all([inventory.reserve('mug', first), inventory.reserve('mug', second)]);
  const after = inventory.stock['mug'] ?? 0;
  if (after < 0) {
    throw new Error(`reserved ${first} and ${second} of ${before}, stock is now ${after}`);
  }
});
```

```text
var draw_1 = 1;
var draw_2 = 1;
var draw_3 = 1;

reserved 1 and 1 of 1, stock is now -1
```

It finds the oversell too, shrunk to one mug and two reservations of one. With the fix (reject a quantity that is
not a whole number of at least 1, and take the units before the save), both tests pass 100 test cases.

### With SpecCraft

The spec sits on the real class. `@spec.State` marks the stock, and `reserve` carries two actions: the call itself,
and the reply to the save it awaits, which the explorer delivers in every order:

```ts
// inventory.ts (shortened)
@spec.Model<StockState>({
  invariants: { 'stock never goes negative': (s) => s.stock.mug >= 0 },
})
export class Inventory {
  @spec.State stock: Record<string, number>;

  @spec.Action<StockState, [number, string]>({
    name: 'deliver save',
    delivers: 'save',
    requestAs: quantityOf,
    maxPending: 2,
    args: [[0, 'r1'], [1, 'r1']],
    guard: (s, index) => index < s.pending.save.length,
    effect: (s, index) => {
      const quantity = s.pending.save[index] ?? 0;
      return { ...withoutPending(s, index), stock: { mug: s.stock.mug - quantity } };
    },
  })
  @spec.Action<StockState, ['mug', number]>({
    name: 'reserve',
    args: [['mug', 1], ['mug', 2]],
    guard: () => true,
    effect: (s, _sku, quantity) =>
      quantity > s.stock.mug ? s : { ...s, pending: { save: [...s.pending.save, quantity] } },
  })
  async reserve(sku: string, quantity: number): Promise<string | null> {
    // the code shown above
  }
}
```

```ts
// inventory.speccraft.test.ts
const result = await exploreAnnotated(Inventory, (env) => new Inventory({ mug: 3 }, explorableDeps(env)));
expect(result.spec.visitedCount).toBe(25);
expect(result.spec.invariants).toEqual([
  {
    name: 'stock never goes negative',
    holds: false,
    counterexample: ['reserve("mug", 2)', 'reserve("mug", 2)', 'deliver save(0, "r1")', 'deliver save(0, "r1")'],
  },
]);
expect(result.conformance).toEqual({ visitedCount: 25 });
```

With 3 mugs in stock, the search visits all 25 reachable states and returns the shortest trace to negative stock:
two reservations of 2 pass the check before either save comes back. The conformance run replays every trace on the
real class and finds it matches the spec in all 25 states, so the trace is one the real `reserve` follows. With the
fix, the spec has 13 reachable states, the invariant holds in every one, and the real class matches in all 13.

### What each run tells you

- **Hegel found the data bug, and SpecCraft did not.** The spec only tries quantities 1 and 2, the values written in
  it, so a quantity of 0 never comes up. Hegel drew from the whole safe integer range and shrank to 0 of 0.
- **Hegel found the oversell too.** `Promise.all` with a save that resolves at once runs both checks before either
  save returns, which is the order that breaks. Hegel draws the numbers, not the order: every test case runs that same
  order, and we found no scheduler or stateful testing in the TypeScript library (0.4.6) to vary it.
- **A clean run means different things.** Hegel's fixed run says 100 drawn cases passed in one order of events.
  SpecCraft's says every order of two reservations and their saves was checked, in all 13 states, against the real
  class.
- **Bounds.** SpecCraft checked 3 mugs and at most 2 saves in flight. Hegel drew stock levels up to 100.
- **The report reads differently.** Hegel gives the smallest inputs; SpecCraft gives the shortest sequence of steps,
  named in the spec.

### How to start

- Hegel: `pnpm add -D @hegeldev/hegel`, then wrap a test body in `hegel.testAsync` and draw its inputs with
  `tc.draw`. Its type declarations import `node:buffer`, so a strict typecheck also needs `@types/node`.
- SpecCraft: `pnpm add -D @speccraft-io/core`, then mark the fields with `@spec.State`, give the method an
  `@spec.Action` for the call and one for each async reply, and call `exploreAnnotated`.

## What Hegel is

- A test draws values from generators: `tc.draw(gs.arrays(gs.integers()))`. Any thrown error fails the test.
- Hypothesis's internal shrinking, so the reported failure is a small, readable example.
- A test database: a failing test fails again the same way on rerun.
- `hegel.testAsync` for async tests.
- One engine shared across languages through the Hegel protocol; in TypeScript it runs through a native library on
  Node, Bun and Deno, and through WebAssembly in the browser.
- The Rust library has a stateful testing module; we found none in the TypeScript library yet.

## Side by side

| | Hegel | SpecCraft |
|---|---|---|
| What you write | Tests that draw generated values | A spec: state, actions with guards and effects, invariants |
| Search | Random generation, guided by Hypothesis | Every reachable state, breadth-first |
| A clean run means | Not found in the runs made | No reachable state breaks an invariant, within the spec's bounds |
| Counterexample | A shrunk input, replayed from its database | The shortest trace |
| Sequences of actions | Stateful testing in Rust; not in TypeScript yet | The core of what it does |
| Async orders | Not controlled | Every order of async replies, in inline specs |
| Languages | Six, one engine | TypeScript; shared JSON formats for future engines |

## Where Hegel is ahead

- **Generators and shrinking.** Hypothesis-quality data generation and shrinking, the best known in the field.
- **One engine, many languages.** The same behavior across a polyglot codebase.
- **Pedigree.** Built by the people behind Hypothesis.

## Where SpecCraft is ahead

- **Exhaustive over states.** Hegel samples inputs; SpecCraft covers every reachable state of a spec, so a clean run
  is a statement about all of them.
- **Orders of events.** Races and stale replies come from orders, not from values. SpecCraft explores orders;
  Hegel in TypeScript does not model them.
- **Conformance.** SpecCraft checks real code against a spec over the whole state graph.

## How they work together

Hegel for functions over rich data, SpecCraft for the order of events around them, the same split as with
[fast-check](/vs/fast-check).

## Who builds it

David R. MacIver, who created Hypothesis, and Liam DeVoe, a Hypothesis maintainer who works at Antithesis, are the
main contributors.

## Links

- Hegel: https://hegel.dev
- Hegel for TypeScript on GitHub: https://github.com/hegeldev/hegel-typescript
- @hegeldev/hegel on npm: https://www.npmjs.com/package/@hegeldev/hegel
