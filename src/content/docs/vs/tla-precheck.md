---
title: tla-precheck vs SpecCraft
description: tla-precheck compiles a restricted TypeScript DSL to both TLA+ and a TypeScript interpreter, proves the two state graphs identical, and generates the runtime code. This page runs its Dog example, passing and broken, then compares it with SpecCraft, which runs a spec in full TypeScript and checks separate code against it.
tableOfContents: true
adoption:
  github: kingbootoshi/tla-precheck
  npm: 'tla-precheck'
  created: 2026-03-15
---

[tla-precheck](https://github.com/kingbootoshi/tla-precheck) is a TypeScript tool, published on npm as
`tla-precheck` in March 2026. You write a state machine once in a restricted TypeScript DSL; it is model-checked with
TLA+ and TLC, and the runtime code is generated from the same source. It is the most-used tool in this group, and the
best answer so far to the translation problem that sinks [stateproof](/vs/stateproof).

**How close to SpecCraft:** close in aim, different in form. Every state is checked, but the spec is a restricted
DSL compiled to TLA+, not plain TypeScript.

## Using tla-precheck

We ran the example below with tla-precheck 0.1.7, TLC 1.8.0 and Java 25. The machine is tla-precheck's own
`src/examples/dog.machine.ts`, with the import changed to the package name. The output is from our run.

### Install and set up

```sh
npm install -D tla-precheck
npx tla-precheck setup
npx tla-precheck doctor
```

- **Java 17 or newer** runs TLC, the TLA+ model checker.
- **`setup`** downloads a pinned `tla2tools.jar` into `~/.tla-precheck` and installs an agent skill for Claude Code
  or Codex. `doctor` checks Java, TLC and the skill. We skipped `setup` and pointed `TLA2TOOLS_JAR` at a jar we
  downloaded ourselves, which the CLI also accepts.
- **A `tsconfig.json`** must exist in the folder you run from. Without one, `check` stopped with `TS5083: Cannot read
  file '.../tsconfig.json'`.
- **`npx tla-precheck init`** scaffolds a new `<name>.machine.ts`.

### A first machine

The Dog machine is the README's minimal example: a dog that sleeps, wakes, eats and gets annoyed, with two rules
about its temper.

```ts
// dog.machine.ts (shortened: two of six actions shown)
import { and, defineMachine, enumType, eq, lit, not, scalarVar, setVar, variable } from "tla-precheck";

const mode = variable("mode");
const temper = variable("temper");

export const dogMachine = defineMachine({
  version: 2,
  moduleName: "Dog",
  variables: {
    mode: scalarVar(enumType("sleeping", "awake", "eating"), lit("sleeping")),
    temper: scalarVar(enumType("calm", "angry"), lit("calm"))
  },
  actions: {
    fallAsleep: {
      params: {},
      guard: and(eq(mode, lit("awake")), eq(temper, lit("calm"))),
      updates: [setVar("mode", lit("sleeping"))]
    },
    annoy: {
      params: {},
      guard: and(eq(mode, lit("awake")), eq(temper, lit("calm"))),
      updates: [setVar("temper", lit("angry"))]
    }
    // wakeUp, serveFood, finishEating, calmDown ...
  },
  invariants: {
    sleepingDogsAreCalm: {
      description: "Sleeping dogs are never angry",
      formula: not(and(eq(mode, lit("sleeping")), eq(temper, lit("angry"))))
    },
    eatingDogsAreCalm: {
      description: "Eating dogs are never angry",
      formula: not(and(eq(mode, lit("eating")), eq(temper, lit("angry"))))
    }
  },
  proof: {
    defaultTier: "pr",
    tiers: {
      pr: { domains: {}, budgets: { maxEstimatedStates: 10, maxEstimatedBranching: 10 } }
    }
  }
});

export default dogMachine;
```

What each part does:

- **`variables`** declare the state. `scalarVar(enumType(...), lit(...))` is one variable with a fixed set of values
  and a starting value. For many rows, such as runs owned by users, `mapVar("Runs", ...)` maps each element of a
  domain to a value.
- **`actions`** each have `params`, a `guard` and a list of `updates`. Guards and updates are built from builder
  functions (`eq`, `and`, `not`, `lit`, `setVar`; in bigger machines `index`, `count`, `forall`, `isin`, `setMap`),
  not written as TypeScript expressions. The DSL has 13 expression kinds, on purpose.
- **`invariants`** are named formulas that must hold in every reachable state.
- **`proof.tiers`** set the domains to check and a budget. The budget is estimated before TLC starts, so an oversized
  run fails at once. Bigger machines add a `nightly` tier with larger domains.

### Running it

```sh
npx tla-precheck check dog.machine.ts
```

`check` validates the machine, estimates the state space, runs TLC, then checks that TLC and the TypeScript
interpreter found the same state graph. It prints the estimate, "Estimate passed. Running TLC verification...", and
then one JSON result. The key part of ours (shortened):

```json
{
  "certificate": {
    "machine": "Dog",
    "tier": "pr",
    "proofPassed": true,
    "graphEquivalenceAttempted": true,
    "invariantsChecked": ["sleepingDogsAreCalm", "eatingDogsAreCalm"],
    "deadlockChecked": true,
    "equivalent": true,
    "tsStateCount": 4,
    "tlcStateCount": 4,
    "tsEdgeCount": 6,
    "tlcEdgeCount": 6
  }
}
```

The types allow 6 states; 4 are reachable, and both backends agree on those 4 states and 6 edges.

To see a failure, we dropped the `calm` check from the `fallAsleep` guard, so an angry dog can fall asleep. The exit
code was 1, the certificate said `"proofPassed": false` and `"equivalent": null`, and its `proofOutput` field held
TLC's trace (shortened):

```text
Error: Invariant sleepingDogsAreCalm is violated.
Error: The behavior up to this point is:
State 1: <Initial predicate>
/\ mode = "sleeping"
/\ temper = "calm"

State 2: <wakeUp line 22, col 3 to line 24, col 25 of module Dog>
/\ mode = "awake"
/\ temper = "calm"

State 3: <annoy line 38, col 3 to line 40, col 23 of module Dog>
/\ mode = "awake"
/\ temper = "angry"

State 4: <fallAsleep line 26, col 3 to line 28, col 25 of module Dog>
/\ mode = "sleeping"
/\ temper = "angry"

7 states generated, 5 distinct states found, 0 states left on queue.
```

### What you get

- **A certificate** per machine and tier, in `.generated-machines/<Module>/<tier>/`, next to the generated `.tla` and
  `.cfg` files. It records whether the proof passed, whether the two backends matched, what was checked, and a hash
  of the machine source.
- **A TLC trace on failure.** It names the broken invariant and each step with its action. The actions point at lines
  in the generated `Dog.tla`, not in your `.machine.ts`.
- **Generated runtime code** from `npx tla-precheck build <machine>`: typed adapter functions in
  `src/machine-adapters/` that open a transaction, lock rows, run the interpreter and write the changes; Postgres
  constraints for the invariants; and a lint rule against writes that bypass the adapter. `build` needs
  `metadata.runtimeAdapter`, `metadata.ownedTables` and `metadata.ownedColumns` in the machine.
- **An interpreter** for machines that do not fit the adapter: `buildInitialState`, `enabled` and `step` from
  `tla-precheck/interpreter`.

### Tips

From the README:

- **One workflow per machine.** Model the billing flow or the subscription lifecycle, not the whole system.
- **Keep domains tiny.** Two users and three runs find most bugs; put larger domains in a nightly tier.
- **A failure means the design is wrong.** Fix the machine, not the code around it.
- **`npx tla-precheck estimate <machine>`** checks the budget without Java, and `check` in CI is the gate.

### Limits

- **The DSL is small.** Every guard, update and invariant must be built from the 13 expression kinds.
- **Java is required** for `check` and `build`; `verify-db`, which compares a live Postgres schema with the generated
  constraints, also needs Bun.

## What tla-precheck is

- One DSL source generates a TLA+ spec that TLC checks exhaustively, and a TypeScript interpreter that runs the same
  machine. The two state graphs must be identical, so a bug in either the TLA+ generator or the interpreter fails the
  build.
- Unlike [stateproof](/vs/stateproof), there is no function source to re-parse: the DSL is explicit, and the
  translation is checked on every run instead of trusted.
- Built for agents: an installed skill, and a loop where the agent edits the machine until `proofPassed: true` and
  `equivalent: true`. Its biggest example checks 29 million states in under 3 minutes.

## Compared with SpecCraft

| | tla-precheck | SpecCraft |
|---|---|---|
| Spec language | A restricted DSL of builder functions (13 expression kinds) | Full TypeScript |
| Checker | TLC in Java, plus an in-process interpreter compared against it | In-process BFS |
| Spec vs implementation | The same artifact: the runtime is generated from the machine | Kept apart: the code is checked against the spec |
| Database | Generates Postgres constraints and transactional adapters | Not covered |
| Async orderings in code | Out of scope: the machine is the code | Inline specs: the explorer delivers async replies in every order |
| Scale controls | Proof tiers and state budgets | Not yet |

- **tla-precheck is ahead on the pipeline.** A checked translation to TLA+ gets TLC's speed without trusting the
  compiler, invariants reach Postgres as constraints, and budgets fail before a long run starts. It also has the most
  traction on these pages: about 113 stars and roughly 7,000 downloads a month in September 2026.
- **SpecCraft is plain TypeScript.** Guards and effects can call your own helpers and use any language feature, and
  there is no Java to install.
- **SpecCraft leaves your code alone.** tla-precheck replaces your transition code with generated adapters and models
  one transition at a time inside a database transaction. SpecCraft checks existing code against the spec, including
  replies and background work landing in any order.
- **What SpecCraft takes from it:** state budgets and tiers that fail fast, two backends that check each other if it
  ever exports to TLA+ or Quint, and the idea that a checked rule can also become a database constraint.

## Who builds it

A solo project by the GitHub user kingbootoshi. Created in March 2026, with its last commit in early April 2026.

## Links

- tla-precheck on GitHub: https://github.com/kingbootoshi/tla-precheck
- tla-precheck on npm: https://www.npmjs.com/package/tla-precheck
