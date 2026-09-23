---
title: SpecCraft vs fake timers
description: Fake timers (@sinonjs/fake-timers, and the fake timers in Jest and Vitest built on it) make async code deterministic by fixing one order of events per test. SpecCraft tries every order the spec allows and returns the shortest one that breaks.
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

## One problem, both tools

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

The code below is in [examples/autosave](https://github.com/speccraft-io/speccraft-ts/tree/main/examples/autosave)
and runs with `pnpm vitest run examples/autosave`.

### With fake timers

The test installs a fake clock, fakes the server by hand, and checks the case that matters: the user types during a
save.

```ts
// autosave.fake-timers.test.ts (shortened)
beforeEach(() => {
  clock = install();
});

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

The real output, with two more tests for the debounce window and the "saved" status:

```text
✓ Autosave with fake timers > saves once, 500 ms after the last keystroke 2ms
✓ Autosave with fake timers > shows saved once the server replies 0ms
✓ Autosave with fake timers > saves the newer text when the user types during a save 0ms
```

All three pass on the buggy class. The third test types during a save, but it answers the saves in the order they
were sent. With the two replies swapped by hand, the same check fails:

```text
AssertionError: expected 'Hello' to be 'Hello world' // Object.is equality
```

The fix sends one save at a time: while a save is in flight, the debounce does nothing, and when the reply lands the
editor saves again if the text changed. The same three tests pass on the fixed class too.

### With SpecCraft

The spec sits on the real class. Each method says what it does to the state, and the debounce timer and the save
are async replies the explorer delivers in every order:

```ts
// autosave.ts (shortened)
@spec.Model<EditorState>({
  invariants: {
    'once nothing is pending, the saved text is the current text': (s) =>
      s.pending.timer.length > 0 || s.pending.save.length > 0 || s.savedText === s.text,
  },
})
export class Autosave {
  @spec.State text = '';
  @spec.State savedText = '';
  @spec.State status: SaveStatus = 'saved';

  @spec.Action<EditorState, [Text]>({ name: 'type', args: [['Hello'], ['Hello world']], guard: () => true, effect: typed })
  edit(text: string): void { /* as above */ }

  @spec.Action<EditorState, [number]>({
    name: 'debounce fires',
    delivers: 'timer',
    requestAs: (handle: { ms: number }) => handle.ms,
    args: [[0]],
    guard: (s) => s.pending.timer.length > 0,
    effect: (s) => ({ ...s, status: 'saving', pending: { timer: [], save: [...s.pending.save, s.text] } }),
  })
  flush(): void { /* as above */ }

  @spec.Action<EditorState, [number]>({
    name: 'save returns',
    delivers: 'save',
    maxPending: 2,
    args: [[0], [1]],
    guard: (s, index) => index < s.pending.save.length,
    effect: (s, index) => {
      const text = s.pending.save[index] ?? '';
      return {
        ...s,
        savedText: text,
        status: s.text === text ? 'saved' : 'unsaved',
        pending: { ...s.pending, save: removed(s.pending.save, index) },
      };
    },
  })
  onSaved(text: string): void { /* as above */ }
}
```

The test gives the class a timer and a network made of `Environment` channels, so the explorer decides when the
debounce fires and when each save returns:

```ts
// autosave.speccraft.test.ts (shortened)
const result = await exploreAnnotated(Autosave, (env) => new Autosave(explorableDeps(env)));
expect(result.conformance).toEqual({ visitedCount: 77 });
expect(result.spec.invariants).toEqual([
  {
    name: 'once nothing is pending, the saved text is the current text',
    holds: false,
    counterexample: [
      'type("Hello")',
      'debounce fires(0)',
      'type("Hello world")',
      'debounce fires(0)',
      'save returns(1)',
      'save returns(0)',
    ],
  },
]);
```

The search visits all 77 reachable states and returns the shortest trace to the bug: type, wait, type, wait, then
the second save returns before the first. Every trace was also run on the real class, and its state matched the
spec in all 77 states. With one save at a time, the fixed class has 41 reachable states, it matches its spec in all
of them, and the invariant holds in every one.

### What each run tells you

- **Fake timers checked the time.** The first test checks that nothing is saved at 499 ms and one save goes out at
  500 ms. SpecCraft only knows whether the timer has fired, not when.
- **The fake-timer tests passed on the buggy class.** They check the orders their author wrote. The bug showed up
  only after the replies were swapped by hand, which means already knowing the bug.
- **SpecCraft found the order on its own.** It tried every order of keystrokes, timers and replies within the
  spec's bounds (two texts, at most two saves in flight) and returned the shortest one that breaks the rule, 6
  steps long.
- **SpecCraft costs more to write.** Each method's effect is written a second time as a spec, and the timer and
  network go through injected channels. If the spec and the code disagree, the conformance check reports it.
- **A clean run means different things.** The fixed class passes three hand-picked orders under fake timers. Under
  SpecCraft it passes all 41 reachable states.
- **The trace becomes a fake-timer test.** The example pins SpecCraft's order as an ordinary fake-timer test: the
  buggy class ends on the older text, the fixed class on the newer one.

### How to start

- Fake timers: `vi.useFakeTimers()` in Vitest or `install()` from `@sinonjs/fake-timers`, move the clock with
  `tickAsync`, and resolve faked replies in the order you want to test.
- SpecCraft: `pnpm add -D @speccraft-io/core`, put `@spec.State` on the fields and `@spec.Action` on the methods,
  route the timer and network calls through `Environment.channel`, and call `exploreAnnotated`.

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
