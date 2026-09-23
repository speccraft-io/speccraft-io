---
title: SpecCraft vs TypeScript tools
description: A map of the TypeScript tools that check state-machine-shaped correctness, where SpecCraft sits among them, and how it differs from each of the closest ones.
---

**TL;DR:** no existing tool does what SpecCraft does, the way it does it. The closest is
[pnueli](/vs/pnueli): the same engine idea (a plain TypeScript spec, breadth-first search,
shortest traces), but it stops at the model and never checks real code. The others differ at
the core: [Polygraph](/vs/polygraph) has an LLM derive the spec from your code, and
[tla-precheck](/vs/tla-precheck) and [stateproof](/vs/stateproof) translate the spec to TLA+.
The newest, [stifinder](/vs/stifinder), is a search core that finds the failure needing the fewest
departures from the expected schedule; [effect-machine](/vs/effect-machine) explores statecharts
written for Effect; [Bombadil](/vs/bombadil) samples real UIs against TypeScript temporal properties.
None combines a spec written first in full TypeScript, conformance of the real code against it
over the whole state graph, and inline specs with async replies explored in every order.

SpecCraft is a **model checker as a library, in TypeScript**: you write the model as
ordinary data and functions in your own language, and the library explores every
reachable state, checks invariants, and hands back a counterexample trace when one
breaks. No new spec language, no compiler between your guards and what actually gets
checked.

This page covers tools a TypeScript team can use directly. For TLA+, Quint, Alloy, Stateright,
Coyote and the rest of the wider field, see [SpecCraft vs non-TS tools](/tools/speccraft-vs-non-ts-tools).

## The map

The TypeScript tools we have found, placed by how the spec is written and whether
the checker explores every state or samples.

<a href="/assets/positioning-ts.webp" class="lightbox-trigger"><img src="/assets/positioning-ts.webp" alt="A two-by-two map of TypeScript tools: new spec language vs. plain code on one axis, exhaustive checking vs. random sampling on the other. SpecCraft sits in the plain-code, exhaustive quadrant with stifinder, pnueli and Polygraph; tla-precheck and stateproof sit near the axis as TypeScript compiled to TLA+; modality-ts, effect-machine and XState graph are just above the sampling line. tla-checker and uneffect use a spec language from TypeScript; quint-connect-ts, tla-connect and @fizzbee/mbt replay spec traces; chronos, unflake, deja-dst, cloudfault, Bombadil, fast-check and formalizr sample real code."></a>

*Click to enlarge.*

## The landscape

The same tools as a table, grouped by two questions: what language is the spec written in,
and does the checker explore every state or sample randomly?

| Corner | What it is | TypeScript tools | The trade |
|---|---|---|---|
| **1. A spec language, used from TS** | The model is written in, or compiled to, a dedicated spec language, and a mature checker verifies it. | [tla-precheck](/vs/tla-precheck) (a small TS DSL compiled to TLA+ and checked against its own interpreter), [stateproof](/vs/stateproof) (TS-looking source re-parsed into TLA+), [tla-checker](https://www.npmjs.com/package/tla-checker) (TLC compiled to WebAssembly), [uneffect](https://github.com/mizchi/uneffect) (spec comments on existing TS, checked by Quint), [weavecheck](https://github.com/Ikteder/weavecheck) (a JSON concurrency model, every interleaving explored). | Checking power from mature tools, but the spec that is checked is not the TypeScript your team reads. |
| **2. Model checker as a library** | The model is ordinary TypeScript; the library explores it exhaustively. | **SpecCraft**, [pnueli](/vs/pnueli) (with symmetry and partial-order reduction, and liveness), [Polygraph](/vs/polygraph) (the spec is derived from your code by an LLM, then model-checked), [stifinder](/vs/stifinder) (a search core ordered by fewest departures from the expected schedule). | You keep your language and arbitrary logic in guards and effects. You give up symbolic checking and, in most of these, heavyweight liveness under fairness. |
| **3. Model-based testing, random sampling** | Commands with preconditions run against a model, sampled randomly and shrunk on failure, or traces from a spec replayed against the real implementation. | [fast-check](/vs/fast-check), [Hegel](/vs/hegel) (Hypothesis for TypeScript), [Effect](/vs/other-ts-tools#complements) property tests (`it.prop` over Schema arbitraries). Spec-trace replay: [quint-connect-ts](https://github.com/dearlordylord/quint-connect-ts) (Quint), [@fizzbee/mbt](https://www.npmjs.com/package/@fizzbee/mbt) (FizzBee), [tla-connect](https://www.npmjs.com/package/tla-connect) (Apalache), [quint-refinements](https://www.npmjs.com/package/quint-refinements) (Quint, Rust binding only so far). Model versus real code, sampled: [formalizr](https://github.com/Tomperez98/formalizr). Temporal properties over sampled runs: [Bombadil](/vs/bombadil) (real web and terminal UIs, from Antithesis), [fast-check-ltl](https://www.npmjs.com/package/fast-check-ltl), [eventlaw](https://www.npmjs.com/package/eventlaw). | Tests the real system, not just a model. Adjacent to SpecCraft, not competing: SpecCraft's conformance check walks the whole state graph instead of sampling it. |
| **4. Path coverage over statecharts and UI state** | Exhaustive traversal, but the model must already be a statechart or come from a supported framework; the output is test cases. | XState graph tools (path utilities in `xstate/graph`; the old `@xstate/test` is deprecated), [modality-ts](https://github.com/Harineko0/modality-ts) (extracts a bounded model from React components and checks properties), [effect-machine](/vs/effect-machine) (bounded BFS over Effect statecharts, with invariants and coverage). | The corner people most often mistake for corner 2: it looks similar, but the model has to fit a machine shape or a framework first. |
| **5. Controlled scheduling of real code** | No separate model: control the scheduler and run the actual code under many interleavings. | [Fake timers](/vs/other-ts-tools) (one order per test, picked by hand), [unflake](https://github.com/BOTIROFF-D/unflake), [determined](https://github.com/glideapps/determined), [deja-dst](https://github.com/sagarrsharmaa/deja) (all seeded schedules, sampled rather than exhaustive); [cloudfault](https://github.com/gmackie/cloudfault) (fault combinations on real Cloudflare Workers, with a depth-bounded exhaustive mode). Prior art: [typescript-actors](https://github.com/p-org/typescript-actors) from the P team (2017, dormant) controlled all asynchrony to explore interleavings. | The most realistic answer to "does my real code have a race," but in TypeScript today it samples schedules instead of exploring all of them. |
| **6. Whole-system deterministic simulation** | Run the entire real system inside a simulated world with a virtual clock and fault injection. | [chronos](https://github.com/sx4im/chronos), [unluck](https://github.com/001Sir/unluck), [crashlab](https://www.npmjs.com/package/crashlab), [moirae](https://github.com/pchrysostomou/moirae). | Maximum realism, large investment, and seeded sampling: a clean run means "not found," not "impossible." |
| **7. Proof** | Prove correctness for all inputs instead of checking states. | [LemmaScript](/vs/lemmascript) (TS with contract comments, translated to Dafny or Lean, proofs written by an LLM). | A different sport: proof instead of exhaustive search. Strong on data and arithmetic, silent on the order of async events. |

## Where SpecCraft sits

SpecCraft is in **corner 2**. Until 2026 that corner was empty in TypeScript; it now has
company, and each neighbor made a different bet:

- **[pnueli](/vs/pnueli)** is the closest engine: a plain TypeScript spec, breadth-first
  search, and reductions and liveness SpecCraft does not have yet. It stops at the model.
- **[Polygraph](/vs/polygraph)** derives the spec from your code with an LLM, checks it
  against recorded traces, then model-checks it. SpecCraft starts from a spec you write.
- **[tla-precheck](/vs/tla-precheck)** and **[stateproof](/vs/stateproof)** compile a
  TypeScript-shaped spec to TLA+; tla-precheck checks its translation, stateproof trusts
  it. Both need Java.
- **[stifinder](/vs/stifinder)** is a search core with no spec layer: it finds the failure that
  needs the fewest departures from the expected schedule, and says when a clean run was only
  budget-bounded.
- **[effect-machine](/vs/effect-machine)** (corner 4) explores statecharts written for Effect,
  without running their async work. **[Bombadil](/vs/bombadil)** (corner 3) samples real UIs
  against TypeScript temporal properties.
- **[LemmaScript](/vs/lemmascript)** proves functions correct for every input; it does not
  model the order of async events, which is where SpecCraft works.

What stays SpecCraft's own: the spec is full TypeScript, executed rather than translated;
`checkConformance` walks the real implementation against the spec over the whole state
graph; and inline specs sit next to real classes, with the explorer delivering async
replies in every order.

The nearest false neighbors, the tools people compare SpecCraft to first, are [fast-check](/vs/fast-check)
(corner 3) and XState's graph tools (corner 4). The one-line difference: **exhaustive
where fast-check is random, free-form where XState is machine-shaped.** For async code, the
tool most teams use today is [fake timers](/vs/other-ts-tools), which fix one order per test; and
[Effect](/vs/other-ts-tools#complements) prevents many bugs by construction without searching orders.

The popular tools that sit next to SpecCraft without competing with it (Stryker, Pact, msw,
schema libraries, SMT solvers and others) are on [SpecCraft and other TS tools](/vs/other-ts-tools).

