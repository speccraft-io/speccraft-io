---
title: More TS tools
description: Popular TypeScript tools around correctness checking - test-strength and contract tools, schema and pattern libraries that look similar but check something else, static verification, and a few niche engines.
---

Beyond the tools with their own pages, a TypeScript team asking "is my stateful, async code correct?" will
meet these. None of them explores every order of events; most of them work well next
to a tool that does. Download counts are npm monthly downloads in September 2026.

## Complements

Tools that check something a model checker does not, and fit into the same test suite.

| Tool | What it checks | Traction | Where it fits |
|---|---|---|---|
| [Fake timers](https://github.com/sinonjs/fake-timers) (`@sinonjs/fake-timers`, behind `vi.useFakeTimers` and `jest.useFakeTimers`) | Replace timers and `Date` with a clock the test moves, so async code runs the same way every time | 249M/mo | One order of events per test, picked by its author. In the [autosave example](https://github.com/speccraft-io/speccraft-io/tree/main/formal-methods-samples/fake-timers-autosave), three fake-timer tests pass on the buggy code. A counterexample trace from a model checker can be pinned as a fake-timer test |
| [Effect](https://effect.website) (with `@effect/vitest`) | Prevents whole classes of async bugs by design: typed errors, scopes, structured concurrency; `TestClock` and Schema arbitraries in tests | 120M/mo | One order of events per test. In the [job lease example](https://github.com/speccraft-io/speccraft-io/tree/main/formal-methods-samples/effect-job-lease), the Effect cancel tests pass on the buggy code, and only a hand-picked slow renewal makes one fail. `Layer` services make it easy to swap real dependencies for test ones |
| [Stryker](https://github.com/stryker-mutator/stryker-js) | Mutation testing: whether your tests catch small injected bugs | 9.1M/mo | Measures the strength of any suite, not the orders of events it covers |
| [Pact](https://github.com/pact-foundation/pact-js) | Consumer-driven contracts: request and response pairs between services | 2.1M/mo | Checks each interaction at a boundary, not the order of interactions |
| [msw](https://github.com/mswjs/msw) | Network mocking with scripted responses | 75M/mo | Controls replies in real code; the test script picks their order |
| [testcontainers](https://github.com/testcontainers/testcontainers-node) (with Toxiproxy) | Behavior against real databases and brokers, with injected latency and cuts | 22M/mo | Real infrastructure, one order of events per run |
| [Jazzer.js](https://github.com/CodeIntelligenceTesting/jazzer.js) | Coverage-guided fuzzing for crashes and injection bugs | 67k/mo | Explores inputs by coverage, not states and orders |
| [zod-fast-check](https://github.com/DavidTimms/zod-fast-check) | fast-check generators from zod schemas | 777k/mo | Generated payloads for spec actions |

## Look-alike tools

Tools that sound like correctness checking, but check something else.

| Tool | What it checks | Traction | The difference |
|---|---|---|---|
| [zod](https://github.com/colinhacks/zod), [valibot](https://github.com/open-circle/valibot), [arktype](https://github.com/arktypeio/arktype), [typia](https://github.com/samchon/typia), [io-ts](https://github.com/gcanti/io-ts) | The shape of data at a boundary, at runtime | About 1.1B/mo together | A schema says what one value may look like; an invariant says what must hold in every state after any sequence of actions |
| [ts-pattern](https://github.com/gvergnaud/ts-pattern) | Exhaustive matching: every case handled, checked at compile time | 23M/mo | Exhaustive over cases in one place, not over states and orders |
| [tiny-invariant](https://github.com/alexreardon/tiny-invariant) | One condition at one point in one run | 305M/mo | An assertion in the run that happened, not in every run a spec allows |

## Static verification

Tools that prove properties of code without running it. They answer "is this function right for every input", a
different question from "can these events happen in an order that breaks something".

| Tool | What it does | Traction | Relation |
|---|---|---|---|
| [z3-solver](https://github.com/Z3Prover/z3) | The official Z3 SMT solver, compiled to WebAssembly, with TypeScript bindings | 495k/mo | The solver most TS verification tools are built on |
| [theoremts](https://github.com/theoremts/theorem) | `requires`, `ensures` and `invariant` written as plain TS calls, proved with Z3, stripped at build time | 395/mo, 4 stars | Specs as plain TypeScript, applied to single functions instead of state spaces |
| [ts-refinement](https://github.com/trvswgnr/ts-refinement) | Refinement types such as `Refined<number, "n > 0">`, checked by a compiler plugin | 365/mo | Stronger types; no behavior over time |
| [Flow](https://github.com/facebook/flow), [ReScript](https://github.com/rescript-lang/rescript) | Stricter or sound type systems for JavaScript | 1.6M/mo, 162k/mo | Type safety, not protocol correctness |
| [Thales](https://github.com/jessealama/thales) | Compiles a strict subset of TypeScript (no mutation, classes or async) to Lean 4 for proofs | 66 stars, started April 2026 | Like LemmaScript, proof for pure functions; says nothing about the order of async events |
| [pabst](https://github.com/jessealama/pabst) (npm `pabst-checker`) | Properties written as JSDoc `@ensures` comments on functions, checked by fast-check | New, July 2026 | Contracts as comments, sampled; the same author's Thales is the proof side |

[LemmaScript](/vs/lemmascript) has its own page, and [Dafny](/tools/dafny) and [Lean](/tools/lean) show proof
from a TypeScript project.

## Niche engines and older libraries

| Tool | What it does | Status | Relation |
|---|---|---|---|
| [ts-fuzzing](https://github.com/mizchi/ts-fuzzing) | Generators from TS types or zod and valibot schemas, guided fuzzing, and random stateful command sequences | 2 stars, 13/mo | Random stateful testing like fast-check; no exhaustive search |
| [chaosbringer](https://github.com/mizchi/chaosbringer) | A Playwright crawler that injects network, lifecycle and runtime faults and checks invariants | 45 stars, 2.6k/mo | Fault injection into a real app, not state exploration |
| [dspec](https://github.com/mizchi/dspec) | A prototype where a typed formal model is the main spec, with conformance evidence from the code | 35 stars, not on npm | Spec-first: the model is the source of truth and the code is checked against it; an early prototype |
| [@doeixd/machine](https://www.npmjs.com/package/@doeixd/machine) | Typestate machines: a wrong transition is a type error | Active, 168/mo | Prevents illegal calls; no exploration |
| [jsverify](https://github.com/jsverify/jsverify), [testcheck-js](https://github.com/leebyron/testcheck-js) | Early QuickCheck ports for JavaScript | Unmaintained since 2018 and 2017, still 150k/mo and 75k/mo | Predecessors of fast-check |

## What TypeScript does not have yet

We found no maintained linearizability checker (like Porcupine or Knossos), no maintained LTL runtime monitor, and no
maintained session-types library for TypeScript.
