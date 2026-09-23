---
title: SpecCraft vs Effect
description: Effect makes async TypeScript safer by construction - typed errors, structured concurrency, a controllable test clock and property tests from schemas. It does not search the orders events can happen in. SpecCraft does, and the two fit together.
---

[Effect](https://effect.website) is the most popular answer in TypeScript to "how do I write async code that is
correct": about 16,000 stars and about 120 million npm downloads a month in September 2026, with `@effect/vitest`
at about 5.8 million. It is not a checker. It prevents whole classes of bugs by construction, and its test tools
control time and generate inputs. Effect teams are also the TypeScript developers most used to thinking in specs.

## What Effect brings to correctness

- **Typed errors and resources.** Every effect declares what it can fail with and what it needs, and the compiler
  checks both. Scopes close resources on every path, including interruption.
- **Structured concurrency.** Fibers are started, raced and interrupted under a parent, so a cancelled request does
  not leave work running.
- **TestClock.** `it.effect` in `@effect/vitest` provides test services, including a `TestClock` that starts at 0
  and moves only when the test calls `TestClock.adjust`. `it.live` runs with the real clock.
- **Property tests.** `it.prop` runs property tests over values generated from Effect `Schema` and `Arbitrary`.
  Effect 3 ships fast-check as `effect/FastCheck`.
- **What it does not do.** There is no exploration of the orders fibers and replies can take. A deterministic
  simulation scheduler for Effect fibers was proposed in May 2026 and closed without merging, with a request to bring
  it to the next major version.

## Side by side

| | Effect | SpecCraft |
|---|---|---|
| Approach | Prevent bugs by construction: types, scopes, structured concurrency | Find bugs by exploring every reachable state of a spec |
| Time in tests | `TestClock`, moved by the test | Time as order only: before or after |
| Orders of async events | The one the test produces | Every order the spec allows |
| Generated inputs | `it.prop` over Schema arbitraries | Small, finite value sets chosen in the spec |
| Output | Test pass or fail | Shortest trace per broken invariant, endings, stuck states |
| Scope | A whole runtime and ecosystem | One library for specs and checks |

## Where Effect is ahead

- **Prevention.** Typed errors and scopes rule out bugs that SpecCraft would only find: an unhandled failure, a
  leaked connection, a forgotten cancellation.
- **One ecosystem.** Schema, testing, tracing, concurrency and services in one consistent model.
- **Scale and community.** A large, active user base and a well-documented testing story.

## Where SpecCraft is ahead

- **The orders nobody wrote down.** Effect makes each fiber correct; it does not check what happens when two
  correct fibers, a retry and a late reply interleave. That is the question SpecCraft answers exhaustively.
- **A spec as a document.** Guards, effects and invariants in one place, with endings and stuck states listed, is
  something Effect code does not produce on its own.
- **No framework required.** SpecCraft checks any TypeScript, including code that does not use Effect.

## How they work together

- Effect's `Layer` and services are the same idea as SpecCraft's real and explorable dependencies: swap the real
  service for one the explorer controls.
- Schema arbitraries can generate the payloads a SpecCraft action takes, where the spec would otherwise list them.
- `it.prop` for data laws of pure functions; SpecCraft for the protocol those functions take part in.

## Links

- Effect: https://effect.website
- Effect on GitHub: https://github.com/Effect-TS/effect
- @effect/vitest on npm: https://www.npmjs.com/package/@effect/vitest
- Effect deterministic simulation proposal (closed): https://github.com/Effect-TS/effect/pull/6216
- effect-machine, a statechart library for Effect with bounded search: [SpecCraft vs effect-machine](/vs/effect-machine)
