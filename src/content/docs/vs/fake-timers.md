---
title: Fake timers vs SpecCraft
description: Fake timers (@sinonjs/fake-timers, and the fake timers in Jest and Vitest built on it) give a test control of the clock. This page shows how to test a debounced autosave with them, then compares them with SpecCraft.
tableOfContents: true
adoption:
  github: sinonjs/fake-timers
  npm: '@sinonjs/fake-timers'
  created: 2014-02-04
---

Fake timers are what most TypeScript developers reach for when async code has to be deterministic in a test.
[@sinonjs/fake-timers](https://github.com/sinonjs/fake-timers) is the engine: about 250 million npm downloads a
month in September 2026, used directly and underneath `jest.useFakeTimers()` and Vitest's `vi.useFakeTimers()`.
It is not a correctness tool in the formal sense, but it is the tool SpecCraft replaces in one specific job:
checking what happens when async things land in a different order.

## Using fake timers

The code below is in [examples/autosave](https://github.com/speccraft-io/speccraft-ts/tree/main/examples/autosave)
and runs with `pnpm vitest run examples/autosave`.

### The problem

An editor saves the text 500 ms after the user stops typing. Each save goes over the network, so a slow save can
come back after a newer one:

```ts
// autosave.ts (shortened)
edit(text: string): void {
  this.text = text;
  this.status = 'unsaved';
  this.cancelTimer?.();
  this.cancelTimer = this.deps.schedule(() => {
    this.cancelTimer = undefined;
    this.flush();
  }, DEBOUNCE_MS);
}

flush(): void {
  const text = this.text;
  this.status = 'saving';
  this.deps.save(text).then(() => {
    this.onSaved(text);
  }, onError);
}

onSaved(text: string): void {
  this.savedText = text;
  this.status = this.text === text ? 'saved' : 'unsaved';
}
```

If the user types while a save is in flight, a second save starts. When the second reply lands first and the first
lands last, `savedText` goes back to the older text, the editor says "unsaved", and no timer is left to save again.
If the server applies writes in the order it answers them, its copy is the older text too.

### Install and set up

```sh
pnpm add -D @sinonjs/fake-timers
```

The package ships its own types. In Vitest or Jest you can skip the install and call `vi.useFakeTimers()` or
`jest.useFakeTimers()`, which use the same engine. The example calls it directly:

```ts
import { install } from '@sinonjs/fake-timers';
import type { Clock } from '@sinonjs/fake-timers';

let clock: Clock;

beforeEach(() => {
  clock = install();
});

afterEach(() => {
  clock.uninstall();
});
```

`install()` replaces `setTimeout`, `clearTimeout`, `Date` and the other timer globals with a clock the test moves by
hand. `uninstall()` puts the real ones back, so one test cannot leave a fake clock for the next.

Fake timers only cover time. The network is faked next to them. The example's `fakeServer()` records each save and
keeps its promise open until the test calls `server.reply(index)`:

```ts
// autosave.fake-timers.test.ts (shortened)
const deps: AutosaveDeps = {
  ...realDeps,
  save: async (text) => {
    server.saves.push(text);
    await new Promise<void>((resolve) => {
      replies.push(resolve);
    });
  },
};
```

### Writing the tests

The first test checks the debounce window to the millisecond:

```ts
// autosave.fake-timers.test.ts (shortened)
it('saves once, 500 ms after the last keystroke', async () => {
  const { server, deps } = fakeServer();
  const editor = new Autosave(deps);
  editor.edit('Hello');
  await clock.tickAsync(300);
  editor.edit('Hello world');
  await clock.tickAsync(499);
  expect(server.saves).toEqual([]);
  await clock.tickAsync(1);
  expect(server.saves).toEqual(['Hello world']);
});
```

The third one checks the case that matters: the user types during a save.

```ts
// autosave.fake-timers.test.ts (shortened)
it('saves the newer text when the user types during a save', async () => {
  const { server, deps } = fakeServer();
  const editor = new Autosave(deps);
  editor.edit('Hello');
  await clock.tickAsync(500);
  editor.edit('Hello world');
  await clock.tickAsync(500);
  await server.reply(0);
  await server.reply(1);
  await clock.runAllAsync();
  expect(editor.savedText).toBe('Hello world');
  expect(editor.status).toBe('saved');
});
```

- `clock.tickAsync(ms)` moves the clock forward and fires every timer that falls due, letting promises settle
  between them.
- `server.reply(index)` resolves one pending save. The test decides which reply lands and when.
- `clock.runAllAsync()` fires whatever timers are left, so nothing is still waiting when the assertions run.

### Running it

The real output, with the three tests on the buggy class:

```text
✓ Autosave with fake timers > saves once, 500 ms after the last keystroke 2ms
✓ Autosave with fake timers > shows saved once the server replies 0ms
✓ Autosave with fake timers > saves the newer text when the user types during a save 0ms
```

All three pass. The third test types during a save, but it answers the saves in the order they were sent. With the
two replies swapped by hand, the same check fails:

```text
AssertionError: expected 'Hello' to be 'Hello world' // Object.is equality
```

A fake-timer test checks the order its author wrote. It finds this bug only once someone writes the order that
breaks, which means already knowing the bug.

### Fixing the bug

The fix sends one save at a time. While a save is in flight, the debounce does nothing, and when the reply lands the
editor saves again if the text changed:

```ts
// autosave.ts, AutosaveFixed (shortened)
flush(): void {
  if (this.inFlight) {
    return;
  }
  const text = this.text;
  this.inFlight = true;
  this.status = 'saving';
  this.deps.save(text).then(() => {
    this.onSaved(text);
  }, onError);
}

onSaved(text: string): void {
  this.inFlight = false;
  this.savedText = text;
  if (this.text === text) {
    this.status = 'saved';
  } else if (this.cancelTimer === undefined) {
    this.flush();
  }
}
```

The same three tests pass on the fixed class:

```text
✓ AutosaveFixed with fake timers > saves once, 500 ms after the last keystroke 0ms
✓ AutosaveFixed with fake timers > shows saved once the server replies 0ms
✓ AutosaveFixed with fake timers > saves the newer text when the user types during a save 1ms
```

The example also pins the breaking order as two more tests: replies in the order 1 then 0 leave the buggy class on
`'Hello'` with status `'unsaved'` and `clock.countTimers()` at 0, and the fixed class sends `'Hello world'` only after
the first reply and ends on it.

```text
✓ the order SpecCraft found, pinned with fake timers > Autosave keeps the older text when the first reply lands last 0ms
✓ the order SpecCraft found, pinned with fake timers > AutosaveFixed sends one save at a time 0ms
```

### Tips

- Use the async versions (`tickAsync`, `runAllAsync`) when the code has promises. The sync `tick` fires timers but
  does not let `.then` callbacks run in between.
- A hand-made reply needs a promise turn to reach the code. The example's `reply` resolves the save and then
  `await Promise.resolve()` so the `.then` in `flush` runs before the next line of the test.
- `clock.countTimers()` tells you whether anything is still scheduled. Here 0 timers with status `'unsaved'` is the
  bug: nothing will ever save again.
- Always `uninstall()` in `afterEach`. A test that throws before the end would otherwise leave the fake clock in place.

## What fake timers are

- They replace `setTimeout`, `setInterval`, `setImmediate`, `Date`, `performance.now` and friends with a clock
  the test controls.
- The test moves time by hand: `clock.tick(ms)`, `clock.next()`, `clock.runAll()`, `clock.runToLast()`, each with
  an async version that also lets promises settle in between.
- Timers fire in time order, deterministically, so a test that passed once passes every time.
- Network replies, database calls and other promises are faked by hand next to them (for example with msw), and the
  test decides when each one resolves.

## Compared with SpecCraft

| | Fake timers | SpecCraft |
|---|---|---|
| What you write | A test that moves the clock and resolves fakes in one chosen order | A spec, or an inline spec on the real class |
| Orders covered | The one the test author picked | Every order the spec allows |
| Who picks the order | The test author, by hand | The explorer |
| A passing run means | This order works | No reachable order breaks an invariant, within the spec's bounds |
| Failure | An assertion in that test | The shortest trace that breaks an invariant |
| Setup cost | Minutes | A spec, or annotations on the real class |

On this example SpecCraft runs an inline spec on the real class and delivers the timer and the saves in every order.
It visits all 77 reachable states and returns a 6-step trace to the bug (type, wait, type, wait, then the second save
returns before the first), which the fake-timer tests above had passed. The fixed class holds in all 41 reachable
states.

- Fake timers are already in Jest and Vitest, run the code unchanged, and test exact time: SpecCraft only knows
  whether the timer has fired, not when.
- SpecCraft finds orders nobody thought to write, and a clean run covers every reachable order within the spec's
  bounds (here two texts, at most two saves in flight).
- SpecCraft costs more to write: each method's effect is written again as a spec, and the timer and network go
  through injected channels.
- They work together: a SpecCraft trace is a concrete order of events, and pinning it as a fake-timer test gives a
  fast regression test in the suite you already have.

## Links

- @sinonjs/fake-timers on GitHub: https://github.com/sinonjs/fake-timers
- Vitest fake timers: https://vitest.dev/guide/mocking#timers
- Jest fake timers: https://jestjs.io/docs/timer-mocks
