---
title: Bombadil vs SpecCraft
description: Bombadil, from Antithesis, is property-based testing for web and terminal UIs, with TypeScript specs of temporal properties and action generators. This page shows how a TypeScript developer writes and runs a Bombadil spec, then compares it with SpecCraft.
tableOfContents: true
adoption:
  github: antithesishq/bombadil
  npm: '@antithesishq/bombadil'
  created: 2025-12-17
---

[Bombadil](https://github.com/antithesishq/bombadil) is property-based testing for web and terminal user
interfaces, built by [Antithesis](https://antithesis.com) and open source since December 2025. Its specs are
TypeScript modules, which makes it the best-known tool where TypeScript developers write temporal properties today.
It is the tool most likely to be compared with SpecCraft first.

**How close to SpecCraft:** far. It samples runs of a real UI against temporal properties; it does not explore every
state of a spec.

## Using Bombadil

This example is from the Bombadil documentation; we have not run it. The npm version in September 2026 is
0.7.7.

### Install and set up

```sh
npm install --save-dev @antithesishq/bombadil
```

- **One package, two things.** The npm package installs the `bombadil` command and the TypeScript types for writing
  specs. There are also standalone binaries for macOS and Linux, a Nix flake, a Docker image, and a GitHub Action.
- **macOS or Linux.** The browser driver runs Chrome or Chromium; the terminal driver runs any program that reads
  stdin and writes to a terminal.
- **A first smoke test** needs no spec at all. `bombadil browser test https://en.wikipedia.org --output-path my-test`
  runs Bombadil's default properties and actions until you press Ctrl+C.

### A first property

A spec is a plain ES module. Every property and every action generator it exports is used, and the export name is
the name in error reports. This is the manual's first example, a rule that at most five notifications are shown:

```ts
import { extract, always } from "@antithesishq/bombadil";
export * from "@antithesishq/bombadil/browser/defaults";

const notificationCount = extract((state) =>
    state.document.body.querySelectorAll(".notification").length,
);

export const max_notifications_shown = always(() =>
    notificationCount.current <= 5,
);
```

What each part does:

- **`export * from ".../browser/defaults"`** keeps the built-in properties (no uncaught exceptions, no unhandled
  promise rejections, no error logs, no HTTP 4xx or 5xx responses) and the built-in actions (navigation, clicks on
  semantic HTML elements). You can re-export only some of them by name.
- **`extract`** runs a function inside the browser on every state Bombadil captures. It gets `document` and `window`
  and returns JSON-serializable data. The result is a `Cell`, a value that changes over time; `.current` reads it.
- **`always`** takes a thunk, not a boolean, because it is evaluated again in every state.

Rules over time use `eventually` and `next`, joined with `now`, `.and`, `.or`, `.implies` and `not`. This one says an
error message always disappears within five seconds:

```ts
// (shortened) from the manual's examples
const errorMessage = extract((state) =>
    state.document.body.querySelector(".error")?.textContent ?? null,
);

export const errorDisappears = always(
    now(() => errorMessage.current !== null).implies(
        eventually(() => errorMessage.current === null)
            .within(5, "seconds"),
    ),
);
```

Actions are exported the same way. `actions` returns the actions that are possible in the current state, and
`weighted` sets how often each generator is picked:

```ts
// (shortened) from the manual
export const clickCanvas = actions(() => {
    return canvas.current ? [{ Click: canvas.current }] : [];
});

export const navigation = weighted([
    [10, back],
    [1, forward],
    [1, reload],
]);
```

In the browser you can also register custom actions with `registerCustomAction`, for steps such as a login form that
you want to get past quickly.

### Running it

```sh
bombadil browser test https://your-app.example.com spec.ts --time-limit=1m --exit-on-violation --output-path out
```

- **`--time-limit`** stops the run; reaching the limit counts as normal completion. Without it the run goes on until
  Ctrl+C.
- **`--exit-on-violation`** stops at the first failing property, which is what you want in CI.
- **`--output-path`** keeps the trace (`trace.jsonl`) and screenshots for later.
- **The terminal driver** takes the command to test: `bombadil terminal test --specification=spec.ts your-cli --arg
  value`.
- **Exit codes:** 0 for a normal finish (including the time limit), 2 when a property was violated, 1 for any other
  error.

In CI, the manual shows the `antithesishq/bombadil-action` GitHub Action with the same inputs: driver, origin, spec
file, time limit and output path.

### What you get

- **Violations are logged as errors** while the run goes on, under the name of the exported property.
- **`bombadil browser inspect out`** opens a web app over the recorded run: the actions on the left, a timeline you
  can scrub, the state before and after each action, and a mark on the timeline for each violation.
- **`--reproduce=out`** runs the same sequence of actions again, so you can check a fix. Bombadil prints both the
  `inspect` and the `--reproduce` command after each run.

### Limits

From the manual:

- **Replays can diverge.** A reproduction is not guaranteed, and it needs the same options as the original run.
- **The spec runtime is limited.** npm packages that import Node modules may not work inside a spec.
- **The terminal driver is experimental.** It has no `inspect` view yet and does not support custom actions.
- **Still 0.x.** The API may change between versions.

## What Bombadil is

- A loop against the real app: extract the current state, check every property, choose and perform the next action,
  wait for the next event, repeat.
- The search is random and guided by the action generators. The manual describes it as looking for unexpected action
  sequences, odd timings and strange inputs.
- Properties are a flavor of linear temporal logic, written as TypeScript function calls.
- The engine is written in Rust. It runs locally, in CI, and inside the Antithesis platform.

## Compared with SpecCraft

| | Bombadil | SpecCraft |
|---|---|---|
| Spec | TypeScript module: temporal properties and action generators | Plain TypeScript object, or inline next to a real class |
| What is explored | The real running web or terminal UI | The spec, and real code checked against it |
| Search | Random, guided by action generators | Exhaustive BFS |
| Properties | `always`, `eventually`, `next` | Invariants; liveness not yet |
| A clean run means | Not found in this run | No reachable state breaks an invariant, within the spec's bounds |
| Counterexample | A recorded run you can inspect and replay | The shortest trace |

- **Bombadil tests the UI that ships.** It needs no model of the app to start, its defaults find bugs before you
  write a property, and `eventually` and `next` are there today.
- **SpecCraft is exhaustive, with shortest traces.** A Bombadil run samples; a SpecCraft run covers every reachable
  state of the spec and returns the shortest failing trace.
- **SpecCraft checks the logic underneath.** Which reply may arrive when, what a retry does, which endings are
  possible. Its explorer delivers async replies in every order, where Bombadil sees whatever timing the run produced.
- **What SpecCraft takes from it:** temporal operators with small names for its liveness work, default properties
  that apply to any spec (no stuck states, no unreachable actions), and a spec file the CLI runs directly.

## Who builds it

Antithesis, the company behind the deterministic simulation platform of the same name. Bombadil is open source and
also runs inside their commercial product. In September 2026 it had about 1,500 stars and about 200,000 npm
downloads a month.

## Links

- Bombadil on GitHub: https://github.com/antithesishq/bombadil
- The Bombadil manual: https://antithesishq.github.io/bombadil/
- Bombadil on npm: https://www.npmjs.com/package/@antithesishq/bombadil
