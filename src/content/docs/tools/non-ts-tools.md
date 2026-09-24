---
title: Non-TypeScript tools
description: The wider field of tools for state-machine-shaped correctness in other languages - TLA+, Quint, Alloy, P, Stateright, Coyote, deterministic simulation - grouped by how the spec is written and what gets checked.
---

Most tools for checking the order of events are older than the TypeScript ones, live in other languages, and are
more powerful along some axis. This page maps them. For the tools a TypeScript team can use directly, see
[TypeScript tools](/ts-tools). To try four of these tools from a TypeScript project, see [TLA+](/tools/tla-plus),
[Quint](/tools/quint), [Dafny](/tools/dafny) and [Lean](/tools/lean).

## The map

The wider landscape, in any language.

<a href="/assets/positioning.webp" class="lightbox-trigger"><img src="/assets/positioning.webp" alt="A two-by-two map across all languages: new spec language vs. plain code on one axis, exhaustive checking vs. random sampling on the other. TLA+, Quint, Alloy, FizzBee, P and SPIN are in the spec-language, exhaustive quadrant; Stateright and SpecCraft TS sit in the plain-code, exhaustive quadrant with Coyote, loom and shuttle, Java PathFinder and Concuerror, and GraphWalker; FoundationDB and TigerBeetle DST, Antithesis and QuickCheck and Hypothesis are in the sampling half; quint run is the simulator."></a>

*Click to enlarge.*

## The landscape

| Corner | What it is | Tools | The trade |
|---|---|---|---|
| **1. Dedicated spec language, industrial checkers** | Write the model in a purpose-built language; a mature checker verifies it. | TLA+ (TLC explicit, Apalache symbolic; see [TLA+ for TypeScript developers](/tools/tla-plus)), [Quint](https://quint-lang.org) (a TLA+-based language whose toolchain is written in TypeScript and installs from npm; see [Quint for TypeScript developers](/tools/quint)), Alloy, FizzBee, SPIN/Promela, P (AWS). In the browser: [Spectacle](https://github.com/will62794/spectacle), a TLA+ interpreter in JavaScript whose counterexample traces can be shared as URLs. | Maximum checking power, including symbolic reasoning over huge value ranges, but the spec is a separate artifact in a separate language your team may not read or maintain. |
| **2. Model checker as a library, in your language** | The model is ordinary code in the language you already use; the library explores it exhaustively. | Stateright (Rust). In TypeScript: [SpecCraft TS](/vs/speccraft-ts), [pnueli](/vs/pnueli) and others on [TypeScript tools](/ts-tools). | You keep your language and arbitrary logic in guards and effects. You give up symbolic checking and, in most of these, heavyweight liveness under fairness. |
| **3. Model-based testing, random sampling** | Commands with preconditions run against a model, sampled randomly and shrunk on failure. | QuickCheck (Haskell), Hypothesis stateful (Python), proptest (Rust). | Tests the real system, not just a model, but a clean run means "not found in the runs made." |
| **4. Path coverage over statecharts** | Exhaustive traversal of a model that is already a statechart; the output is test cases. | GraphWalker (Java). | The model has to fit a machine shape first. |
| **5. Controlled scheduling of real code** | No separate model: control the scheduler and run the actual code under many interleavings. | Coyote (.NET), loom / shuttle (Rust), Java PathFinder, Concuerror (Erlang). | The most realistic answer to "does my real code have a race," tied to one runtime. |
| **6. Whole-system deterministic simulation** | Run the entire real system inside a simulated world with a virtual clock and fault injection. | FoundationDB-style DST, TigerBeetle's VOPR, Antithesis (closed source). | Maximum realism, large investment, and seeded sampling: a clean run means "not found," not "impossible." |
| **7. Proof** | Prove correctness for all inputs instead of checking states. | TLAPS, Coq/Lean, Dafny, Ivy. | Proof instead of exhaustive search. Strong on data and arithmetic, silent on the order of async events. |

## Choosing between corner 1 and corner 2

Corner 1 and corner 2 check the same kind of thing: state, steps and "must never happen" rules, in every order. The
trade for choosing corner 2: you give up symbolic checking (reasoning about a range of a million values as one
formula, the way Apalache does) and full liveness under fairness. For workflow-shaped models (small, finite,
naturally bounded) explicit-state exploration is enough and symbolic checking buys little. A model that outgrows
explicit checking can be rewritten in Quint or TLA+.

## A second axis: model, or the real thing

The map above answers "what language is the spec in." It doesn't answer a different
question: does the checker run against a model of the system, or the real running
code? That axis cuts across the first one. Coyote, loom/shuttle, and DST/Antithesis
(corners 5 and 6) check the real system directly with no separate model at all, while
TLA+, Quint, Stateright and statechart tools all check a model of it instead.
Property-based testing sits in between: it samples a model, then drives the real implementation
with the sampled sequence.

<a href="/assets/model-vs-real-code.webp" class="lightbox-trigger"><img src="/assets/model-vs-real-code.webp" alt="A spectrum from 'checks a model of the system' to 'exercises the real running code'. Dedicated spec languages, statechart tools (GraphWalker), Stateright, and SpecCraft TS (with conformance of real code) sit at the model end; property-based testing (QuickCheck, Hypothesis, proptest) bridges the middle; concurrency testers (Coyote, loom, shuttle) and whole-system simulation (DST, Antithesis) sit at the real-code end."></a>

*Click to enlarge.*
