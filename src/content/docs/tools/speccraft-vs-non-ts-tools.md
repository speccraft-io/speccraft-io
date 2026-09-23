---
title: SpecCraft vs non-TS tools
description: The wider field of tools for state-machine-shaped correctness in other languages - TLA+, Quint, Alloy, P, Stateright, Coyote, deterministic simulation - and where SpecCraft sits among them.
---

SpecCraft is a model checker as a library, in TypeScript. Most of the tools it is measured
against are older, live in other languages, and are more powerful along some axis. This page
places SpecCraft among them. For the tools a TypeScript team can use directly, see
[SpecCraft vs TypeScript tools](/how-speccraft-compares). To try three of these tools from a
TypeScript project, see [Lean](/tools/lean), [Dafny](/tools/dafny) and [Quint](/tools/quint).

## The map

The wider landscape, in any language, with SpecCraft for reference.

<a href="/assets/positioning.webp" class="lightbox-trigger"><img src="/assets/positioning.webp" alt="A two-by-two map across all languages: new spec language vs. plain code on one axis, exhaustive checking vs. random sampling on the other. TLA+, Quint, Alloy, FizzBee, P and SPIN are in the spec-language, exhaustive quadrant; SpecCraft sits in the plain-code, exhaustive quadrant with Stateright, Coyote, loom and shuttle, Java PathFinder and Concuerror, and GraphWalker; FoundationDB and TigerBeetle DST, Antithesis and QuickCheck and Hypothesis are in the sampling half; quint run is the simulator."></a>

*Click to enlarge.*

## The landscape

| Corner | What it is | Tools | The trade |
|---|---|---|---|
| **1. Dedicated spec language, industrial checkers** | Write the model in a purpose-built language; a mature checker verifies it. | TLA+ (TLC explicit, Apalache symbolic; see [TLA+ for TypeScript developers](/tools/tla-plus)), [Quint](https://quint-lang.org) (a TLA+-based language whose toolchain is written in TypeScript and installs from npm; see [Quint for TypeScript developers](/tools/quint)), Alloy, FizzBee, SPIN/Promela, P (AWS). In the browser: [Spectacle](https://github.com/will62794/spectacle), a TLA+ interpreter in JavaScript whose counterexample traces can be shared as URLs. | Maximum checking power, including symbolic reasoning over huge value ranges, but the spec is a separate artifact in a separate language your team may not read or maintain. |
| **2. Model checker as a library, in your language** | The model is ordinary code in the language you already use; the library explores it exhaustively. | Stateright (Rust). SpecCraft is the TypeScript entry. | You keep your language and arbitrary logic in guards and effects. You give up symbolic checking and, in most of these, heavyweight liveness under fairness. |
| **3. Model-based testing, random sampling** | Commands with preconditions run against a model, sampled randomly and shrunk on failure. | QuickCheck (Haskell), Hypothesis stateful (Python), proptest (Rust). | Tests the real system, not just a model, but a clean run means "not found in the runs made." |
| **4. Path coverage over statecharts** | Exhaustive traversal of a model that is already a statechart; the output is test cases. | GraphWalker (Java). | The model has to fit a machine shape first. |
| **5. Controlled scheduling of real code** | No separate model: control the scheduler and run the actual code under many interleavings. | Coyote (.NET), loom / shuttle (Rust), Java PathFinder, Concuerror (Erlang). | The most realistic answer to "does my real code have a race," tied to one runtime. |
| **6. Whole-system deterministic simulation** | Run the entire real system inside a simulated world with a virtual clock and fault injection. | FoundationDB-style DST, TigerBeetle's VOPR, Antithesis (closed source). | Maximum realism, large investment, and seeded sampling: a clean run means "not found," not "impossible." |
| **7. Proof** | Prove correctness for all inputs instead of checking states. | TLAPS, Coq/Lean, Dafny, Ivy. | Proof instead of exhaustive search. Strong on data and arithmetic, silent on the order of async events. |

## Where SpecCraft sits

SpecCraft is in **corner 2**, next to Stateright: the model is ordinary code and the library
explores it. The honest trade for choosing corner 2 over corner 1: you give up symbolic checking
(reasoning about a range of a million values as one formula, the way Apalache does) and
full liveness under fairness. For workflow-shaped models (small, finite, naturally
bounded) explicit-state exploration is the right tool and symbolic checking buys little.
If a spec does outgrow explicit checking, the escape hatch is exporting the same
variables, actions, and invariants to Quint.

## A second axis: model, or the real thing

The map above answers "what language is the spec in." It doesn't answer a different
question: does the checker run against a model of the system, or the real running
code? That axis cuts across the first one. Coyote, loom/shuttle, and DST/Antithesis
(corners 5 and 6) check the real system directly with no separate model at all, while
SpecCraft, TLA+, Quint, and statechart tools all check a model of it instead.
Property-based testing sits in between: it samples a model, then drives the real implementation
with the sampled sequence.

<a href="/assets/model-vs-real-code.webp" class="lightbox-trigger"><img src="/assets/model-vs-real-code.webp" alt="A spectrum from 'checks a model of the system' to 'exercises the real running code'. Dedicated spec languages, statechart tools (GraphWalker), Stateright, and SpecCraft sit at the model end; property-based testing (QuickCheck, Hypothesis, proptest) bridges the middle; concurrency testers (Coyote, loom, shuttle) and whole-system simulation (DST, Antithesis) sit at the real-code end. SpecCraft sits at the model end with an arrow toward real code: conformance and inline specs."></a>

*Click to enlarge.*

SpecCraft now covers both ends for the same spec. The spec stays the oracle, and
`checkConformance` (or an inline spec next to the real class) checks the code that ships
against it, without collapsing the two into the same artifact.

