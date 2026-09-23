---
title: stateproof vs SpecCraft
description: stateproof compiles a TypeScript-looking state machine to TLA+ and checks it with TLC. This page runs its README counter from source, shows what verify() returns, then compares it with SpecCraft, which runs the spec as real TypeScript.
tableOfContents: true
adoption:
  github: HexaField/stateproof
  created: 2026-03-15
---

[stateproof](https://github.com/HexaField/stateproof) is the closest earlier attempt at what SpecCraft does: write a
model in TypeScript and check every reachable state. It is a small project (one contributor, MIT licensed, last
commit in March 2026), but it is the only other tool in TypeScript aiming at the same corner.

## Using stateproof

We ran the example below from a clone of the repository (commit `4cb6308`, March 2026), on Node 24 with TLC 1.8.0
and Java 25. The machine is the README's quick start. The output is from our run.

### Install and set up

The README says `pnpm add @stateproof/core`, but the package is not on npm. It runs from source:

```sh
git clone https://github.com/HexaField/stateproof
```

- **TypeScript source, no build.** The package points at `src/index.ts`. The repo's examples run with `npx tsx`;
  Node 24 also runs the `.ts` files directly.
- **Java for TLC.** Compiling to TLA+, the runtime and test generation work without Java; `verify()` needs it.
  stateproof looks for Java in the usual places.
- **The TLC jar.** `verify()` downloads `tla2tools.jar` into a temp folder when it finds none, or takes a path in the
  `tlcPath` option.

### A first machine

```ts
import { machine, verify, createRuntime } from '@stateproof/core'

const counter = machine('BoundedCounter')
  .states('counting', 'done')
  .initial('counting')
  .context({ value: 0 })
  .transition('increment', {
    from: 'counting',
    guard: (ctx) => ctx.value < 5,
    action: (ctx) => {
      ctx.value += 1
    }
  })
  .transition('finish', {
    from: 'counting',
    to: 'done',
    guard: (ctx) => ctx.value >= 5
  })
  .invariant('bounded', (ctx) => ctx.value <= 5)
  .invariant('done means five', (ctx) => ctx.state !== 'done' || ctx.value >= 5)
```

What each part does:

- **`machine(name)`** starts a fluent builder in the XState style.
- **`.states(...)` and `.initial(...)`** declare the required state enum and where it starts. The current one is
  `ctx.state`.
- **`.context({...})`** is the flat data next to the state, here one counter.
- **`.transition(name, { from, to, guard, action })`** is an event. `from` may be one state or a list; `to` is
  optional; `action` mutates the context.
- **`.invariant(name, fn)`** is a rule over the context that must hold in every reachable state.
- **Guards, actions and invariants are not run by the checker.** stateproof reads their source text with
  `fn.toString()` and translates it into TLA+. Only a small subset of TypeScript survives.

The same machine also runs as a state machine in your code:

```ts
const rt = createRuntime(counter)
rt.send('increment') // true
rt.context.value     // 1
rt.send('finish')    // false: the guard blocks while value < 5
```

Our run printed `true`, `1` and `false`, as the README says.

### Running it

```ts
const result = await verify(counter, { tlcPath: '/abs/path/tla2tools.jar' })
```

The README comments this call with `result.ok // true`. Our run returned `false`, with one violation (shortened):

```json
{
  "ok": false,
  "statesExplored": 7,
  "distinctStates": 7,
  "depth": 7,
  "violations": [
    {
      "invariant": "deadlock",
      "type": "deadlock",
      "trace": [
        { "action": "state", "state": { "state": "counting", "value": 0 }, "expectedState": "counting" },
        "...",
        { "action": "state", "state": { "state": "done", "value": 5 }, "expectedState": "done" }
      ]
    }
  ]
}
```

`done` has no outgoing transition, and deadlock checking is on by default, so TLC reports the end state as a
deadlock. With `verify(counter, { tlcPath, checkDeadlocks: false })` the result is `"ok": true` with 7 states and no
violations.

To see an invariant fail, we changed the `increment` guard to `ctx.value < 6`. With deadlock checking off, the
result was (shortened):

```json
{
  "ok": false,
  "statesExplored": 7,
  "violations": [
    {
      "invariant": "bounded",
      "type": "invariant",
      "trace": [
        "state {\"state\":\"counting\",\"value\":0}",
        "state {\"state\":\"counting\",\"value\":1}",
        "...",
        "state {\"state\":\"counting\",\"value\":6}"
      ]
    }
  ]
}
```

Each trace line is our `action + ' ' + JSON.stringify(state)`.

### What you get

- **A `VerifyResult`:** `ok`, `statesExplored`, `distinctStates`, `depth`, `duration`, a list of `violations` (each
  with the invariant name, its type, and a trace of states), plus the generated `tlaSpec` and the raw `tlcOutput`.
- **Traces as states, not actions.** In our runs every trace step had `"action": "state"`, so the step that caused a
  change has to be read from the difference between two states.
- **The generated TLA+** to read directly, from `generateTLA()` or in `result.tlaSpec`. For the counter, the guard
  `ctx.value < 5` became `(value < 5)`.
- **More around it,** listed in the README and not tried by us: `concurrent()` to compose N instances with shared
  state, `generateTests()` for BFS test traces, `toMermaidStateDiagram()`, `diffSpecs()`, a CLI, a Vitest plugin, and
  a visual Studio.

### Limits

What we saw, and what the source says:

- **Only a subset of TypeScript translates.** A guard that read a variable from outside the arrow function,
  `(ctx) => ctx.value < limit`, compiled to TLA+ that TLC rejected: the result was `ok: false` with the violation
  `"TLC Error: Parsing or semantic analysis failed."` and no trace.
- **No Java means a silent pass.** When Java or the jar is missing, `verify()` returns `ok: true` with 0 states and
  `tlcOutput` set to `SKIPPED: ...`. Check `statesExplored`, not only `ok`.
- **Pass an absolute `tlcPath`.** A `tla2tools.jar` in the working folder was found, but TLC then failed with `Unable
  to access jarfile tla2tools.jar`, because it runs from a temp folder.
- **Deadlock is on by default,** so a machine with a final state fails until you pass `checkDeadlocks: false`.

## What stateproof is

- A fluent builder that compiles to TLA+, with exhaustive checking in Java through TLC, results parsed from TLC's
  text output.
- The same model is interpreted at runtime, so "the spec is the implementation".
- Around it: a small in-process BFS for generating test traces, conformance adapters for a real implementation,
  liveness through TLC, Mermaid diagrams, spec diff, and a visual Studio.

## Compared with SpecCraft

| | stateproof | SpecCraft |
|---|---|---|
| How guards and effects run | Source captured with `fn.toString()` and re-parsed into TLA+ | Executed as ordinary TypeScript |
| TypeScript you can use | A small subset: comparisons, `&&` / `\|\|`, arithmetic, a few array methods | All of it: helper functions, destructuring, closures, libraries |
| Where checking happens | TLC in Java, results parsed from its text output | In-process, as a library call |
| Shape of the model | Required state enum with from/to transitions and a flat context | Any JSON-shaped state; a state machine is one option, not a requirement |
| What you get back | Pass/fail plus violations parsed from TLC | State count, endings, stuck states, the shortest trace per invariant, beliefs that must keep failing |
| Spec vs implementation | The same artifact at runtime | Kept apart; conformance checks the code against the spec |

- **stateproof has a translator you have to trust.** Its hand-written parser of about 800 lines accepts a small
  subset, and the translation can be silently wrong: `.filter()` and `.some()` compile to `Filter(...)` and
  `Exists(...)`, which are not TLA+ operators, and `null` compiles to the string `"null"`. Because the runtime
  interprets the same parsed model, what TLC checks and what runs can drift apart. SpecCraft has no translator.
- **stateproof is ahead on liveness and tooling.** "Eventually this happens" works through TLC, and it has Mermaid
  diagrams, spec diff and the Studio. SpecCraft checks safety only today and has none of these yet.
- **SpecCraft is plain TypeScript in-process.** No Java, no temp files, no parsing another tool's output, free-form
  state, and parameterized actions as ordinary arrays, where stateproof's escape hatch is raw TLA+ strings.
- **SpecCraft keeps spec and code apart.** The spec is the oracle and the code is checked against it: a standalone
  spec with `checkConformance`, or inline specs as decorators or an `annotate()` call, where the explorer also
  delivers async replies in every order.

## Who builds it

stateproof is a side project of HexaField (Josh Field), an experienced TypeScript and web engineer whose main work
is elsewhere:

- **npm:** 61 packages, mostly from years of work on an open source WebXR engine (XREngine, later Ethereal Engine and
  IR Engine) plus three.js and PhysX tooling. stateproof itself is not published on npm.
- **GitHub:** over 200 public repositories. Recent activity is about agent orchestration and "living web" work:
  personal semantic graphs, decentralized identity, P2P sync, and W3C proposals around them.
- **X:** posts about the semantic web and AD4M, a personal agent runtime.

So stateproof reads as a well-built experiment by a strong engineer rather than a product with a roadmap: one
contributor, a burst of commits, and no activity since March 2026.

## Links

- stateproof on GitHub: https://github.com/HexaField/stateproof
- HexaField on npm: https://www.npmjs.com/~hexafield
- HexaField on StackBlitz: https://stackblitz.com/@HexaField
- HexaField on X: https://x.com/HexaField
