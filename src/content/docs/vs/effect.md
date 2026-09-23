---
title: SpecCraft vs Effect
description: Effect makes async TypeScript safer by construction - typed errors, structured concurrency, a controllable test clock and property tests from schemas. It does not search the orders events can happen in. SpecCraft does, and the two fit together.
tableOfContents: true
adoption:
  github: Effect-TS/effect
  npm: 'effect'
  created: 2019-11-13
---

[Effect](https://effect.website) is the most popular answer in TypeScript to "how do I write async code that is
correct": about 16,000 stars and about 120 million npm downloads a month in September 2026, with `@effect/vitest`
at about 5.8 million. It is not a checker. It prevents whole classes of bugs by construction, and its test tools
control time and generate inputs. Effect teams are also the TypeScript developers most used to thinking in specs.

## One problem, both tools

A worker takes a job by acquiring a lease, renews the lease every 10 seconds while it works, and releases it when it
stops. The job can be cancelled at any time. In Effect the cancel path is correct by construction: the lease is a
scoped resource, the renewal loop races the work, and interrupting the worker's fiber stops both and runs the release:

```ts
// lease.ts (shortened)
export function runJob(client: LeaseClient, owner: string, work: Effect.Effect<void>) {
  return Effect.scoped(
    Effect.gen(function* () {
      const token = yield* Effect.acquireRelease(client.acquire(owner), (t) => client.release(t));
      const renewal = client.renew(owner, token).pipe(
        Effect.delay('10 seconds'),
        Effect.flatMap((held) => (held ? Effect.void : Effect.fail(new LeaseLost()))),
        Effect.forever,
      );
      yield* Effect.raceFirst(work, renewal);
    }),
  );
}
```

What interruption cannot do is take back a request that is already on the wire. The lease server works like a
plain Redis lock: renew sets the lease to the caller, release deletes it.

```ts
// lease.ts (shortened)
export const setAndDelete: LeaseRules = {
  renew: (table, owner, token, now) => [true, { ...table, lease: { owner, token, expiresAt: now + ttl } }],
  release: (table) => ({ ...table, lease: null }),
};
```

If a renewal is in flight when the cancel comes and lands after the release, it sets the lease again, and the
cancelled job holds a lease that nobody will release until it expires. The same late renewal, landing after the lease
expired and a second worker took the job, takes the lease away from that worker, and both run the job. The fix is a
token: acquire hands one out, and renew and release act only if the lease still carries it.

```ts
// lease.ts (shortened)
export const tokenChecked: LeaseRules = {
  renew: (table, _owner, token, now) => {
    const lease = live(table, now);
    return lease?.token === token ? [true, { ...table, lease: { ...lease, expiresAt: now + ttl } }] : [false, table];
  },
  release: (table, token) => (table.lease?.token === token ? { ...table, lease: null } : table),
};
```

In the tests the client reaches the server through a simulated network: each request is delivered by its own fiber
after a latency the test chooses, so interrupting the caller drops the reply but not the request. The code is in
[examples/job-lease](https://github.com/speccraft-io/speccraft-ts/tree/main/examples/job-lease), written against
Effect 4 (`4.0.0-rc.116`), and runs with `pnpm test`.

### With Effect

`it.effect` runs the test with `TestClock`. The test starts the worker, moves the clock to a moment when a renewal is
in flight, interrupts the worker, and looks at the server:

```ts
// lease.effect.test.ts (shortened)
function leaseAfterCancel(rules: LeaseRules, latency: (call: Call) => Duration.Input, cancelAt: Duration.Input) {
  return Effect.gen(function* () {
    const table = yield* Ref.make(emptyTable);
    const client = leaseClient(table, rules, latency);
    const worker = yield* Effect.forkChild(runJob(client, 'w1', Effect.sleep('5 minutes')));
    yield* TestClock.adjust(cancelAt);
    yield* Effect.forkChild(Fiber.interrupt(worker));
    yield* TestClock.adjust('5 seconds');
    return (yield* Ref.get(table)).lease;
  });
}

const sameLatency = (): Duration.Input => '100 millis';

it.effect('cancelling while a renewal is in flight releases the lease', () =>
  Effect.gen(function* () {
    expect(yield* leaseAfterCancel(setAndDelete, sameLatency, '20250 millis')).toBeNull();
  }),
);
```

The real output, against the buggy server:

```text
 ✓ examples/job-lease/lease.effect.test.ts > job lease under Effect > cancelling the job releases its lease 5ms
 ✓ examples/job-lease/lease.effect.test.ts > job lease under Effect > cancelling while a renewal is in flight releases the lease 1ms
```

It passes, and the bug is there. At 20.25 seconds a renewal sent at 20.2 is in flight; it lands at 20.3 and the
release at 20.35. Every call takes 100 ms, so requests land in the order they were sent and the release always comes
last. The test fails only when it makes the renewal slower than the release (2 seconds against 100 ms, cancel at 23
seconds). Written with `toBeNull()`, that test gives, shortened:

```text
 FAIL  examples/job-lease/lease.effect.test.ts > job lease under Effect > a renewal slower than the release revives the lease
AssertionError: expected { owner: 'w1', token: 1, …(1) } to be null

- Expected:
null

+ Received:
{
  "expiresAt": 54100,
  "owner": "w1",
  "token": 1,
}
```

The repository keeps it as a regression test that asserts the revived lease, next to one that shows the
token-checked server rejects the slow renewal. No test was written for the expiry case.

### With SpecCraft

The spec has one step per message sent and one per message landing, so the explorer tries every order in which the
renewal and the release can reach the server:

```ts
// model.ts (shortened)
const setAndDelete: Action<State>[] = [
  {
    name: 'renew lands',
    guard: (s) => s.wire.includes('renew'),
    effect: (s) => ({ ...delivered(s, 'renew'), lease: 'w1' }),
  },
  {
    name: 'release lands',
    guard: (s) => s.wire.includes('release'),
    effect: (s) => ({ ...delivered(s, 'release'), lease: null, released: true }),
  },
];

function leaseSpec(server: Action<State>[]): Spec<State> {
  return {
    init,
    actions: [...common, ...server],
    invariants: [
      { name: 'a released lease stays released', check: (s) => !(s.released && s.lease === 'w1') },
      { name: 'only the last worker to take the job holds the lease', check: (s) => s.lease === null || s.lease === s.lastTaken },
    ],
  };
}
```

`common` holds the other steps: w1 sends a renewal, the job is cancelled (which stops w1 and puts its release on
the wire), w1's lease expires, and w2 takes the job.

```ts
// lease.speccraft.test.ts (shortened)
const result = explore(buggySpec);
expect(result.visitedCount).toBe(29);
expect(result.invariants).toEqual([
  {
    name: 'a released lease stays released',
    holds: false,
    counterexample: ['w1 sends renew', 'job is cancelled', 'release lands', 'renew lands'],
  },
  {
    name: 'only the last worker to take the job holds the lease',
    holds: false,
    counterexample: ['w1 sends renew', 'w1 lease expires', 'w2 takes the job', 'renew lands'],
  },
]);
```

The search visits all 29 reachable states and returns the shortest trace for each broken rule: the renewal that
lands after the release, and the renewal that lands after the lease expired and w2 took it. With token-checked
renew and release (a rejected renewal also stops w1), the fixed spec has 28 reachable states, 4 endings and no stuck
states, and both invariants hold in every one of them.

### What each run tells you

- **Effect made the cancel path right with no test.** The scope releases the lease on every exit, including an
  interruption in the middle of a renewal. The spec takes that for granted: its cancel step stops w1 and sends the
  release in one move, which is the guarantee Effect gives.
- **The Effect test checks one schedule, and it chose the safe one.** `TestClock` makes the run exact and
  repeatable, but with equal latencies the requests cannot overtake each other, and the test passed on the buggy
  server. It caught the bug only after the test was told which call to slow down, that is, once the order that
  breaks it was already known. SpecCraft found that order, and the expiry case nobody wrote a test for, from the
  spec alone.
- **The Effect test ran the real code.** It exercised the real worker and the real server rules. The SpecCraft check
  covers a model written by hand, which can drift from the code. An inline spec on the Effect code was not tried
  here: the explorer delivers async replies it controls, and Effect's fibers and clock would need an adapter for it.
- **A trace becomes an Effect test.** The cancel trace is the slow-renewal test above, written with `TestClock` and
  two latencies.

### How to start

- Effect: `pnpm add effect @effect/vitest`, then write the test with `it.effect`, give each remote call a latency
  the test controls, and move time with `TestClock.adjust`.
- SpecCraft: `pnpm add -D @speccraft-io/core`, then write one action per message sent and one per message landing,
  and the rule that must hold, and call `explore`.

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
