---
title: SpecCraft vs Bombadil
description: Bombadil, from Antithesis, is property-based testing for web and terminal UIs, with TypeScript specs of temporal properties and action generators. It explores real UIs by sampling; SpecCraft explores a spec exhaustively and checks code against it.
tableOfContents: true
adoption:
  github: antithesishq/bombadil
  npm: '@antithesishq/bombadil'
  created: 2025-12-17
---

[Bombadil](https://github.com/antithesishq/bombadil) is property-based testing for web and terminal user
interfaces, built by [Antithesis](https://antithesis.com) and open source since December 2025. Its specs are
TypeScript modules, which makes it the best-known tool where TypeScript developers write temporal properties today.
It is not a model checker, but it is the tool most likely to be compared with SpecCraft first.

## What Bombadil is

- A spec is a plain TypeScript or JavaScript module that exports properties and action generators, or imports
  Bombadil's defaults.
- Properties are temporal formulas: `always`, `eventually` and `next`, over values extracted from the page or the
  terminal.
- Bombadil runs a loop against the real app: extract the current state, check every property, choose and perform the
  next action, wait for the next event, repeat.
- The search is random and systematic, in the manual's words: unexpected action sequences, odd timings, strange
  inputs. A found violation can be replayed with `--reproduce`, though replay can diverge.
- It drives anything that uses the DOM, or any program that reads stdin and writes to a terminal. It runs locally, in
  CI, and inside Antithesis.
- The engine is written in Rust; the spec library is `@antithesishq/bombadil` on npm.

## Side by side

| | Bombadil | SpecCraft |
|---|---|---|
| Spec | TypeScript module: temporal properties and action generators | Plain TypeScript object, or inline next to a real class |
| What is explored | The real running UI | The spec, and real code checked against it |
| Search | Random, guided by action generators | Exhaustive BFS |
| Properties | `always`, `eventually`, `next` | Invariants; liveness not yet |
| A clean run means | Not found in this run | No reachable state breaks an invariant, within the spec's bounds |
| Counterexample | A recorded run you can reproduce | The shortest trace |
| Target | Web and terminal UIs | Workflows, state machines, async coordination |

## Where Bombadil is ahead

- **Real systems, no model.** It tests the UI that ships, with no spec of the app's internals needed to start.
- **Temporal properties.** `eventually` and `next` are there today; SpecCraft checks state invariants only.
- **Defaults.** Built-in properties and actions find bugs before you write any spec.
- **Backing and reach.** Antithesis behind it, about 1,500 stars and about 200,000 npm downloads a month in
  September 2026, and a path into the Antithesis platform.

## Where SpecCraft is ahead

- **Exhaustive, with shortest traces.** A Bombadil run samples; a SpecCraft run covers every reachable state of the
  spec and returns the shortest failing trace.
- **Logic, not screens.** SpecCraft checks the state and ordering rules underneath: which reply may arrive when, what
  a retry does, which endings are possible.
- **Async replies in every order.** SpecCraft's explorer decides when each async reply lands and tries all orders;
  Bombadil sees whatever timing the run produced.

## What SpecCraft takes from it

- **Temporal operators with small names** (`always`, `eventually`, `next`) as the shape for SpecCraft's liveness work.
- **Default properties** that apply to any spec: no stuck states, no unreachable actions.
- **A spec file the CLI runs directly**, which is the same direction as SpecCraft's planned CLI and watch mode.

## Who builds it

Antithesis, the company behind the deterministic simulation platform of the same name. Bombadil is open source and
also runs inside their commercial product.

## Links

- Bombadil on GitHub: https://github.com/antithesishq/bombadil
- The Bombadil manual: https://antithesishq.github.io/bombadil/
- Bombadil on npm: https://www.npmjs.com/package/@antithesishq/bombadil
