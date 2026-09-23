---
title: SpecCraft vs fake timers
description: Fake timers (@sinonjs/fake-timers, and the fake timers in Jest and Vitest built on it) make async code deterministic by fixing one order of events per test. SpecCraft tries every order the spec allows and returns the shortest one that breaks.
---

Fake timers are what most TypeScript developers reach for when async code has to be deterministic in a test.
[@sinonjs/fake-timers](https://github.com/sinonjs/fake-timers) is the engine: about 250 million npm downloads a
month in September 2026, used directly and underneath `jest.useFakeTimers()` and Vitest's `vi.useFakeTimers()`.
It is not a correctness tool in the formal sense, but it is the tool SpecCraft replaces in one specific job:
checking what happens when async things land in a different order.

## What fake timers are

- They replace `setTimeout`, `setInterval`, `setImmediate`, `Date`, `performance.now` and friends with a clock
  the test controls.
- The test moves time by hand: `clock.tick(ms)`, `clock.next()`, `clock.runAll()`, `clock.runToLast()`, each with
  an async version that also lets promises settle in between.
- Timers fire in time order, deterministically, so a test that passed once passes every time.
- Network replies, database calls and other promises are usually faked by hand next to them (for example with msw),
  and the test decides when each one resolves.

## Side by side

| | Fake timers | SpecCraft |
|---|---|---|
| What you write | A test that moves the clock and resolves fakes in one chosen order | A spec, or an inline spec on the real class |
| Orders covered | The one the test author picked | Every order the spec allows |
| Who picks the order | The test author, by hand | The explorer |
| A passing run means | This order works | No reachable order breaks an invariant, within the spec's bounds |
| Failure | An assertion in that test | The shortest trace that breaks an invariant |
| Setup cost | Minutes | A spec, or annotations on the real class |

## Where fake timers are ahead

- **Everywhere already.** Built into Jest and Vitest, no new concepts, no spec to maintain.
- **Real code, real timers.** The code under test runs unchanged; only the clock is replaced.
- **Exact time.** Retry delays, debounce windows and timeouts are tested at precise millisecond values.

## Where SpecCraft is ahead

- **Every order, not one.** A race needs a specific order; a hand-written test only finds it if its author already
  thought of that order. SpecCraft's explorer delivers async replies in every order and reports the shortest one
  that breaks.
- **Orders you did not think of.** Most async bugs are found in production precisely because nobody wrote the test
  for that interleaving. Exhaustive search removes the guessing.
- **A result about all runs.** A green fake-timer suite says the chosen orders work; a clean SpecCraft run says no
  reachable order breaks an invariant.

## How they work together

- A SpecCraft counterexample is a concrete order of events. Pinning it as a fake-timer test gives a fast regression
  test in the suite you already have.
- Fake timers stay the right tool for exact timing (backoff values, debounce windows); SpecCraft covers the order of
  events, where time only matters as "before" or "after".

## Links

- @sinonjs/fake-timers on GitHub: https://github.com/sinonjs/fake-timers
- Vitest fake timers: https://vitest.dev/guide/mocking#timers
- Jest fake timers: https://jestjs.io/docs/timer-mocks
