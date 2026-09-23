---
title: SpecCraft vs tla-precheck
description: tla-precheck compiles a restricted TypeScript DSL to both TLA+ and a TypeScript interpreter, proves the two state graphs identical, and generates the runtime code. SpecCraft runs a spec in full TypeScript and checks separate code against it.
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

## What tla-precheck is

- A machine is defined with `defineMachine({ variables, actions, invariants })`, using builder functions such as
  `eq`, `and`, `index`, `count`, `forall`, `setMap`. The DSL has 13 expression kinds, on purpose.
- The compiler generates two things from one source: a TLA+ spec that TLC checks exhaustively, and a TypeScript
  interpreter that runs the same machine.
- It then compares the two state graphs and requires them to be identical. A bug in either the TLA+ generator or the
  interpreter fails the build.
- It generates the runtime: typed adapter functions that open a transaction, lock rows, run the interpreter, and
  write the changes; Postgres constraints that enforce the invariants in the database; and a lint rule that blocks
  writes bypassing the adapter.
- Proof tiers: small domains with a state budget for pull requests, larger ones for nightly runs. The budget is
  estimated before TLC starts, so an oversized run fails fast.
- Built for agents: an installed skill, and a loop where the agent edits the machine until the proof and the
  equivalence check both pass.
- Needs Java 17 or newer for TLC. Its biggest example checks 29 million states in under 3 minutes.

## Side by side

| | tla-precheck | SpecCraft |
|---|---|---|
| Spec language | A restricted DSL of builder functions (13 expression kinds) | Full TypeScript |
| Checker | TLC in Java, plus an in-process interpreter compared against it | In-process BFS |
| Trust in the translation | Two backends checked against each other | No translation |
| Spec vs implementation | The same artifact: the runtime is generated from the machine | Kept apart: the code is checked against the spec |
| Code it fits | New state flows, written as a machine and run through the generated adapter | Existing or new code, checked through conformance or inline specs |
| Database | Generates Postgres constraints and transactional adapters | Not covered |
| Async orderings in code | Out of scope: the machine is the code | Inline specs: the explorer delivers async replies in every order |
| Scale controls | Proof tiers and state budgets | Not yet |

## How it differs from stateproof

Both compile a TypeScript-shaped spec to TLA+. stateproof re-parses arbitrary function source and hopes the subset
it supports is translated right. tla-precheck avoids both problems: the DSL is small and explicit, so there is no
function source to parse, and the TLA+ output is checked against an independent interpreter on every run. It keeps a
translator, but one that is checked instead of trusted.

## Where tla-precheck is ahead

- **A checked translation to TLA+**, so it gets TLC's speed and maturity without trusting the compiler.
- **Code generation to the database.** Guards and invariants reach Postgres as constraints, which closes races no
  application code can.
- **Scale controls.** Tiers and budgets that fail before a long run starts. SpecCraft has an open item for exactly
  this.
- **Traction.** About 113 stars and roughly 7,000 downloads a month in September 2026, the most of any tool on these
  pages.

## Where SpecCraft is ahead

- **Full TypeScript.** Guards and effects can call your own helpers and use any language feature; there is no DSL to
  learn and nothing that has to fit 13 expression kinds.
- **No Java.** Nothing to install beyond the package.
- **Works with code you write yourself.** tla-precheck replaces your transition code with generated adapters.
  SpecCraft leaves your code alone and checks it against the spec, so it also fits existing code and code that is not
  a database-backed status column.
- **Async orderings.** Inline specs cover replies and background work landing in any order inside the real code.
  tla-precheck models one transition at a time inside a database transaction, and leaves async work outside it.

## What SpecCraft takes from it

- **State budgets and tiers**: estimate or cap the state count, and fail fast with a clear message.
- **Two backends that check each other**, as the model to follow if SpecCraft ever exports to TLA+ or Quint.
- **Invariants that reach storage**: the idea that a checked rule can also become a database constraint.

## Who builds it

A solo project by the GitHub user kingbootoshi. Created in March 2026, with its last commit in early April 2026.

## Links

- tla-precheck on GitHub: https://github.com/kingbootoshi/tla-precheck
- tla-precheck on npm: https://www.npmjs.com/package/tla-precheck
