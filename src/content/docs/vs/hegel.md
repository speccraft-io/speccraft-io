---
title: SpecCraft vs Hegel
description: Hegel brings Hypothesis-style property-based testing to TypeScript, with Hypothesis's generators and shrinking behind a cross-language protocol. It samples inputs; SpecCraft explores every reachable state of a spec.
---

[Hegel](https://hegel.dev) is a property-based testing engine built on [Hypothesis](https://hypothesis.works), the
most widely used property-based testing library, with libraries for Rust, Go, C++, TypeScript, Java and OCaml. The
TypeScript library, `@hegeldev/hegel`, appeared in January 2026 and had about 37,000 npm downloads a month by
September 2026. It is in beta.

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
