---
title: Durable workflow correctness
description: A survey of the tools, techniques, papers, and practices for establishing the logical concurrency correctness of complex durable-execution workflows — the race-in-an-interleaving bug class, not replay/determinism safety.
---

A survey of what exists to establish the **logical concurrency correctness** of complex
durable-execution workflows — **logical races**, not replay/determinism safety. Engines
already make replay deterministic; what remains are domain invariants that break under an
ordering no test suite ever samples.

The aim was to find the real gap before building anything. Every entry was read **at
source**, and the central negative claim was stress-tested against counter-evidence before
being accepted.

We went in with six claims worth trying to disprove. Each gets a verdict in the [conclusions](#conclusions):

- **H1** — No turnkey tool verifies logical correctness of a complex durable-execution workflow.
- **H2** — Only formal methods give a real correctness gradient.
- **H3** — Temporal's official guidance tops out at coding patterns, no verification.
- **H4** — The gap is general to durable execution, not Temporal-specific.
- **H5** — Formally verifying one nontrivial workflow is research-grade effort.
- **H6** — Prevention-by-construction is often cheaper than verifying the ad-hoc design.

---

## The territory

### Durable-execution engines & their verification stories

| Engine | Finding |
|---|---|
| **Temporal** | The target platform. Names three concurrency problems itself — interleaved handlers, initialization races, dangling handlers — and answers with **patterns + primitives** (`Mutex.runExclusive`, `workflow.condition`, `allHandlersFinished`, queue-and-serialize) plus warnings. **No verification.** The case studies apply the full toolkit and *still* race — necessary but not sufficient. |
| **Cadence** | **Not investigated — deliberately subsumed by Temporal.** Temporal is a fork by Cadence's own authors; same execution model, same gap. A second engine sharing the model confirms H4 by inspection. |
| **Restate** | Durable structured-concurrency primitives (`RestatePromise` `.all`/`.any`/`.race`) on an append-only total-order journal. The guarantee is **deterministic replay + auditability, not logical-race-freedom.** Prevention-by-structure, not verification. |
| **DBOS** | Postgres-backed, research lineage (Stonebraker). Its rigorous testing validates the **engine's** reliability (durability, queue limits, delivery), *not* user-workflow logic; it explicitly **declines formal methods** and relies on chaos testing. Sharpens the gap: the industry's correctness investment sits one layer *below* where the problem lives. |
| **Azure Durable Functions** | The richest engine toolkit — deterministic replay + built-in **Durable Entities** (non-reentrant actors) + **`LockAsync`** durable cross-entity locks — and the **only engine with a published formal semantics** (Burckhardt, OOPSLA 2021). But the semantics formalizes the *engine*, not user-orchestration races → still no user-logic verification. The best-grounded engine, same gap: the strongest evidence for H4. |
| **AWS Step Functions** | The odd one out: **declarative** (Amazon States Language). The intra-workflow race class is **not expressible** — no free-form handlers mutating shared state — so it's **dodged by construction**. Trades expressiveness for safety; two-store hazards remain, and pushing complex state outward reintroduces them. |
| **Inngest** | TS-first step-functions platform; same replay model and same gap. Its concurrency features are operational controls (limits/throttling), not verification. Confirms H4. |
| **Resonate** | Go engine, Durable Promises, DST-first (founder Dominik Tornow, ex-Temporal chief architect). Same model/gap. Confirms H4. *(Distinct from Restate — different product.)* |
| **Infinitic / Orkes Conductor / Trigger.dev** | **Not investigated** — same class as the lightweight engines above; revisit only on a divergent correctness story. |
| **Golem / other WASM durable runtimes** | **Unchecked** — newer designs may bake in guarantees; left open. |

### Concurrency & model-checking tools (verification)

| Tool | Finding |
|---|---|
| **TLA+ / PlusCal** | The formal-methods **substrate** most of the verification and autoformalization work sits on. **No expressiveness ceiling** for this domain. Three real limits: manual modeling (H5), state explosion (only bounded instances checkable), and the model-vs-code gap. PlusCal lowers the authoring barrier. |
| **Specula** *(measured)* | AI-assisted **LLM → TLA+ → TLC**, run blind on both case studies and oracle-graded. Caught the one-store hazards, **missed every two-store** hazard — and produced **0 faithfulness-trap false positives across both runs**, real evidence that faithful LLM→TLA+ is achievable here. The closest existing inhabitant of the gap, but a research prototype needing an expert orchestrator and per-bug-family source instrumentation. |
| **Quint + Apalache** | Modern TLA+ stack (Informal Systems). Quint = approachable language + type checker + simulator; Apalache = symbolic SMT checker (default backend). **TLC bounds *data*, Apalache bounds *depth*** — Apalache swallows large data ranges TLC can't. Lowers authoring cost; inductive invariants (for unbounded guarantees) stay expert work. |
| **P language** | Async event-driven **communicating state machines + logical invariants**, systematically interleaving-checked; industrial (S3, DynamoDB, EC2). **Structurally the closest mainstream formal tool to Temporal's shape** — but a hand-written model in its own language, not wired to Temporal. Bridges model↔code via PObserve. |
| **Microsoft Coyote** | Systematically explores interleavings of **real .NET async code**, reproduces failures deterministically; production-grade in Azure. The *right shape* of tool — but **.NET-only** (no TS equivalent), and driving a Temporal workflow under it is unproven. |
| **stateright** | Rust explicit-state model checker for actors that checks the **runnable implementation** (narrows the model-vs-code gap). Rust-only, niche, state-explosion-bound. |
| **Shuttle / Loom** | Rust real-code interleaving testers — Shuttle randomized/scalable, Loom exhaustive/small (the same exhaustive-vs-sampled trade as TLC-vs-DST). Thread + shared-memory model, Rust-only → not Temporal's event-loop / arrival-order model. |
| **Antithesis** | Commercial **DST-as-a-service** (Will Wilson, ex-FoundationDB); hypervisor-level determinism that runs **real dependencies** (answering DST's "mock the store" weakness), property-based, perfectly reproducible. The strongest "close to turnkey" — but aimed at **whole-system** faults/inputs, not fine-grained single-workflow interleaving; commercial and heavyweight. |
| **Java Pathfinder / CHESS / rr-based tools** | Classic systematic concurrency testers; prior art on interleaving exploration. **Unchecked at source** — noted, not deep-dived. |
| **Deterministic simulation testing (DST)** | Run real code under a **seeded deterministic scheduler**; reproducible, virtual time. Gives a real-code gradient (refutes H2) but **samples** — finds races, doesn't prove absence. Temporal is unusually well-suited (deterministic by construction) yet **ships no interleaving-exploration harness** — a concrete unfilled gap. Weakness: mocking external stores. |
| **Jepsen + Elle** | Black-box fault-injection testing (Jepsen) + isolation-anomaly checker (Elle, spec-free against a *fixed* anomaly catalog). Tests the **store side** of the two-store hazard — a datastore's own consistency, not the workflow↔store interaction or handler interleavings. Adjacent, not on-target. |
| **Trace oracles / runtime conformance** | Instrument the real code to emit **spec-shaped traces**, then check them against a spec (PObserve; TLA+ trace validation — semi-official, maintainers Kuppe/Merz). **The model↔code bridge.** Coverage-bound (only observed runs), not a proof, instrumentation cost — but it found spec↔impl discrepancies in *every* program tried. Central to any practical answer. |
| **Process calculi** (CSP/FDR, π-calculus, mCRL2, Spin) | Alternative concurrency formalism; channel-native, with first-class deadlock-freedom (CSP/FDR). Same capability class and same limits as TLA+; the theoretical root of the channel/session-type prevention models. **Subsumed** — notation, not new capability. |
| **UPPAAL** (timed automata) | Timed model checker for timer-heavy workflows. **Unchecked** — revisit only if timer semantics need first-class time. |

### Academic literature

| Source | Finding |
|---|---|
| **arXiv:2606.17182** (Khan, 2026) | TLA+ + TLC + Verus. Targets multi-agent LLM shared state, not single-workflow interleaving — **but names the two-store anomaly class**: stale-generation, phantom-tool, causal-cascade, tool-effect reordering, plus an **L₀–L₄ consistency lattice** to grade two-store safety. 274 hand-discharged Verus obligations → confirms H5. Best external vocabulary for the two-store class. |
| **Its references + citing works** | **Unchecked** — open snowball into the surrounding sub-field. |
| **Scholar / DBLP / Semantic Scholar sweep** | **Unchecked** — the canonical-paper sweep remains open. |
| **Saga / long-running-transaction theory** | **Unchecked** (Garcia-Molina 1987 + modern formal treatments); compensation correctness is a case-study concern. |
| **Event-sourcing / exactly-once TLA+ writeups** | **Snippet-only** — messaging-semantics prior art, not read at source. |

### Practitioner reality

| Source | Finding |
|---|---|
| **Temporal community forum** | Ground-truth coping strategy = apply the official patterns, keep workflows small, lean on unit/integration tests. No exhaustive-interleaving practice in the mainstream. |
| **Temporal engineering talks / Replay conf** | **Unchecked** — possible internal practices not surveyed. |
| **AWS correctness portfolio** (Brooker & Desai, CACM 2025) | The authoritative practitioner state-of-the-art. **No turnkey path** — AWS assembles a *portfolio* (spec-as-oracle + DST/shuttle + property-based testing + fault injection + runtime monitoring) with heavy in-house expertise, and explicitly names **LLM-assisted formal modeling** as the future. Refutes H2; confirms H1 and H5 with authority. |
| **GitHub code search** | **No dedicated Temporal-workflow specs** in `tlaplus/Examples`; no standard tool or library for model-checking Temporal workflows; the nearest inhabitant is Specula itself. Confirms H1 from the practitioner side (bounded by absence-of-evidence). |
| **War-story blogs** | **Snippet-only** — the recurring advice is "keep workflows small/boring": architectural discipline, not verification. |

### Prevention-by-construction (concurrency programming models)

The orthogonal strategy: adopt a model where whole hazard classes are **unrepresentable or
uncompilable** — "if it compiles, it probably runs." Judged by one test: does it make a
hazard class **impossible**, or merely **easier to avoid**?

| Model | Finding |
|---|---|
| **Rust ownership + `Send`/`Sync`** | Data races are a **compile error** — the archetype the axis is named after. But *memory* races only, not logic races or deadlock. Not applicable to TS Temporal. |
| **Structured concurrency** (nurseries) | Makes leaked/orphaned tasks and unwaited handlers **structurally impossible** — the drain barrier becomes structural, not hand-managed. Doesn't prevent shared-state races between concurrently-live children. Direct hit on the case studies' fire-and-forget fibers; strong H6 support. |
| **Actor model / message passing** | No shared mutable state → eliminates *data* races, **not** logical/message-ordering races. Temporal is already actor-like, so the residual is exactly the logical kind actors don't remove. |
| **CSP / channels** (Go) | "Share by communicating" — covers some shared-state races (Go still allows sharing). Same family as actors. |
| **CRDTs / commutative-idempotent state** | Order-insensitive merge → **ordering/interleaving hazards become impossible** where state fits a CRDT (counters, sets, accumulators). The principled maximum of "make state order-insensitive." Sequencing-dependent logic can't be expressed as a CRDT. |
| **Software Transactional Memory** | Composable atomic blocks → **non-atomic composite updates / lost updates impossible** within a transaction; cleaner than ad-hoc mutexes. Needs runtime support; retry contention. |
| **Session types / MPST** | Protocol conformance becomes a **compile-time type** → out-of-order/illegal messages are type errors. The **closest pure-theory fit** (a request→grant slot handshake is literally a session) — but academic, immature tooling, especially in TS. |
| **Typestate** | Object-protocol states checked at compile time; illegal method sequences caught. Foundational; same family. |
| **Algebraic effects / effect systems** | Effect systems make *unexpected effects* type errors (modest prevention); handlers give structured async. Bonus framing: **durable execution ≈ effect + replay handler** — a clean conceptual model, low practical leverage for logical races. |
| **Petri nets / Workflow nets** (van der Aalst) | The workflow-native standout. **Soundness** (option-to-complete, proper completion, no dead transitions) is **decidable**, with mature tooling (Woflan/WoPeD/ProM) — simultaneously prevention *and* verification. Maps almost 1:1 onto the one-store/control-flow hazards. Catch: **control-flow only** (adding data makes soundness undecidable), and nobody compiles a Temporal workflow into a WF-net — a translation gap, not a capability one. |
| **Statecharts / explicit FSM** (Harel; XState) | Invalid state *combinations* and illegal transitions become **unrepresentable**; finite ⇒ exhaustively testable. **XState is TypeScript — usable in-language today.** Fixes the flag/mode subclass (e.g. `submitted`/`deleted`/`converted` soup), not collections/data/two-store. |
| **Virtual actors / entity-per-key** (Orleans; Temporal entity-workflow) | Single-writer-per-key → cross-entity races **impossible by construction**. The sharp insight: Orleans grains are **non-reentrant by default**, Temporal handlers are **reentrant** — so **reentrancy is the root of intra-workflow races**. Fix = serialize / non-reentrant discipline. |
| **Durable structured concurrency** (Restate 1.3) | Structured durable combinators + append-only total-order journal. Prevents replay non-determinism, orphaned tasks, and ad-hoc shared-state sprawl — **not** logical races. |

### Autoformalization / modeling-cost collapse (the enabler)

The *enabler* axis: it neither verifies nor prevents — it **produces the spec/invariant**
the verification tools check, attacking the survey's recurring bottleneck (modeling-labor cost, H5).

| Thread | Finding |
|---|---|
| **LLM autoformalization (math-first)** — Wu 2022; DeepSeek-Prover; LeanDojo | Mature in theorem-proving (NL math → Lean/Isabelle). Strongest results, but least directly applicable to *systems* specs. |
| **NL → temporal-logic properties** — nl2spec | NL → LTL/STL with human-in-the-loop subformula repair. Produces individual **properties**, not full models. |
| **NL/code → TLA+ model synthesis** — Loyola 2025 | NL → TLA+ validated by SANY (syntax) + TLC (semantics). Explicitly **work-in-progress**; no empirical results yet. |
| **Invariant synthesis — dynamic (Daikon)** | Runs code over tests → **likely** (unsound, coverage-bound) *data* invariants. The pre-LLM ancestor of "generate what to check." Finds data invariants, not temporal/concurrency properties — could seed one-store invariants from the trace sink verification already needs. |
| **Invariant synthesis — LLM-augmented / for concurrency** | The **highest-value, largely open** frontier — auto-discovering the *right* invariants (not just a model) for concurrency/temporal properties. |
| **Applied instance: Specula** | See the verification tools above. The applied test of whether autoformalization works for systems specs; its 0-false-positive result is the key evidence that faithful LLM→spec is achievable in this domain. |

**Verdict:** the lever on H5, and eventually H1. Math side mature, systems/TLA+ side
emerging/WIP; **faithfulness is the gate.** The thread to watch.

### Cross-cutting lenses

These cut *across* the categories above rather than adding territory — they change no capability verdict.

| Lens | Finding |
|---|---|
| **Provenance & sustainability** | The most turnkey options are the most **commercially fragile** (Antithesis, Resonate); the most durable are the **least turnkey** (TLA+/TLC, workflow-net soundness). Domain bias is fundraising-shaped — nobody's money currently points at durable-execution *workflow logic*, a structural reason the gap persists. Engine vendors won't close it: correctness tooling isn't their revenue line. |
| **Observation-based / history inference** | Isolates the three **spec-light escapes** from modeling cost: *infer* the spec (Daikon), *check against a fixed generic model* (Elle), or *LLM-generate* the spec (autoformalization). All coverage-bound; distinct from spec-first trace-checking. |
| **Reentrancy** | The root of intra-workflow races, stated in one line: Temporal is **reentrant by default**, Durable Entities/Orleans are **non-reentrant**, Step Functions has **no shared state**. The cheapest fix is to impose non-reentrancy (serialize) on paths that don't need concurrency — but it leaves the two-store/cross-workflow class untouched. |

---

## Conclusions

### The central boundary — one-store vs. two-store

Every thread converges on a single line that cuts the problem in two:

- **One-store / intra-workflow hazards** — correctness depends only on a *single* workflow's
  own bookkeeping (drain barriers, untimed waits, counter/budget accounting, invalid-state
  combinations, handler interleavings). **This half is tractable:** prevention dissolves much
  of it, verification reaches it, and for pure control-flow it is even **decidable**
  (workflow-net soundness). Specula caught these empirically.
- **Two-store / cross-process hazards** — correctness depends on staying consistent with a
  *second* stateful entity the workflow doesn't control: an external store, a peer workflow,
  or a child workflow. **This is the hard core.** It's *expressible* in TLA+ but not
  auto-scaffolded; DST must mock the store and may hide bugs; Jepsen/Elle test the store's
  *own* consistency, not the workflow↔store interaction; the arXiv catalog *names* it but at
  research cost. **No tier cleanly nails it**, and Specula missed exactly these.

### Verdicts on the hypotheses

- **H1 — no turnkey tool. → CONFIRMED.** The closest tools — P (wrong ecosystem), Coyote
  (.NET), TLA+ + trace validation (hand-modeled), Specula (research prototype) — are each
  wrong-ecosystem, hand-modeled, or a prototype; **none is wired to Temporal**, and the
  practitioner sweep found no practice or spec corpus. Antithesis is closest to turnkey, but
  whole-system and commercial.
- **H2 — only formal methods give a gradient. → REFUTED.** Real-*code* gradients exist and
  are production-grade: Coyote, DST/Shuttle/Antithesis, property-based testing, Elle, trace
  validation. Formal methods are *one* source of a gradient, not the only one.
- **H3 — Temporal tops out at patterns. → CONFIRMED.** It names the problems and answers with
  primitives + warnings, never verification. The case studies apply the full toolkit and
  still race.
- **H4 — the gap is general to durable execution. → CONFIRMED (strongly).** Eight engines
  share the model and the gap; even the best-grounded (Azure DF, with formal semantics) ships
  no user-logic verification. The one partial escape is *declarative* Step Functions, which
  dodges the intra-workflow subset by construction.
- **H5 — verifying one workflow is research-grade. → CONFIRMED, but softening.** Confirmed by
  the arXiv work (274 proof obligations) and AWS's own account — but PlusCal/Quint lower the
  authoring barrier, autoformalization attacks the modeling cost, and Specula's 0
  false-positives show faithful LLM→TLA+ is achievable. State explosion and faithfulness
  remain the gates.
- **H6 — prevention often cheaper. → SUPPORTED, with a hard boundary.** Prevention dissolves
  the one-store class (non-reentrancy, CRDTs, statecharts, structured concurrency, entity-
  per-key, workflow-net soundness, or a declarative platform) — several cheap and in-language.
  **But prevention cannot reach the two-store core.** The rule is **prevent first, verify the
  residual**, not either/or.

### How the landscape organizes — three strategies + one bridge

- **Verify** — model checking (TLA+/Quint/Apalache, P, stateright), real-code interleaving
  (Coyote, Shuttle/Loom), DST, fault/consistency testing (Jepsen/Elle).
- **Prevent** — make the hazard class unrepresentable (structured concurrency, actors, CRDTs,
  statecharts, session types, workflow nets, declarative models).
- **Autoformalize** — collapse the modeling cost (LLM→spec, Specula, dynamic invariant
  detection). The lever most likely to move H1/H5 over time.
- **The bridge — trace validation.** The industrially-proven way to connect a *model* to the
  *real code*: instrument at linearization points, check the trace conforms. It closes the
  model-vs-code gap; coverage-bound, so it *pairs with* model checking.

### The gap, stated plainly

There is **no off-the-shelf tool** that takes a complex **Temporal (TS/Go) workflow** and
checks its **logical concurrency correctness.** The capability exists in adjacent form (P,
Coyote, TLA+ + trace validation, Specula), and the enabling research (autoformalization) is
moving — but the specific, wired-up, turnkey thing does not exist, and **no vendor's
incentives point at building it.** The hardest, least-served slice is the two-store class.

> **One-line takeaway:** durable-execution engines give you durability, not race-freedom.
> The intra-workflow race class is preventable (cheaply) and verifiable (with effort); the
> two-store class is the unsolved core; and the practical path is **prevent first, verify the
> residual, and validate traces to connect the model to the real code.**

---

## Best candidates

Cheapest-and-highest-leverage first — a practitioner decision guide.

1. **Prevent the intra-workflow class by construction (do this first).** The cheapest wins,
   several available in-language today:
   - **Impose non-reentrancy** where concurrency isn't needed — serialize handler bodies
     (`Mutex`/`runExclusive`) or queue-and-process-one-at-a-time.
   - **Model workflow status as a statechart** (XState, in-language for TS) so invalid state
     combinations can't exist.
   - **Make state order-insensitive** (idempotent/commutative, CRDT-shaped) and **bound every
     collection/counter** — which also makes checking feasible.
2. **For control-flow soundness, use the decidable tool.** Extract the control skeleton to a
   **workflow net** and check **soundness** — decidable and tooled. (Needs a Temporal→WF-net
   extraction that doesn't exist yet.)
3. **Verify the genuinely-concurrent residual** with **TLA+ / Quint + Apalache**, using
   **LLM-assisted modeling (Specula-style)** to cut authoring cost. Keep instances small;
   expect the two-store hazards to be the hard part.
4. **Bridge model → real code with trace validation** — instrument the workflow to emit
   spec-shaped deltas at linearization points, check executions conform. This is how you go
   from "model-checked a model" to "the actual workflow conforms."
5. **For the external store specifically**, if isolation is in doubt, **Jepsen/Elle** the
   store — noting that checks the store's own consistency, not the workflow↔store logic.
6. **Accept the residual.** The two-store / cross-workflow core has no clean single answer;
   combine prevention (narrow interfaces, single-writer entities) + verification + trace
   validation, and know that confidence there is *high effort, not turnkey*.

**Strongest single candidates by category:**

- **Closest to turnkey (whole-system):** **Antithesis** — language-agnostic DST that runs
  real dependencies, if you can accept commercial + whole-system-fault scope.
- **Closest formal model to the shape:** **P** — if you'll hand-model the workflow and bridge
  with PObserve-style trace validation.
- **Closest inhabitant of the exact gap:** **Specula** — the only tool actually aimed at
  logical races in a real Temporal workflow, though a research prototype needing expert
  orchestration.
- **Cheapest prevention of all:** a **declarative platform (Step Functions)** — if the
  expressiveness trade is acceptable, it prevents the intra-workflow class wholesale.

*(This page distills an internal survey of 30+ findings read at source. Confidence is high
on the shape of the territory and the verdicts; bounded where cells are foundational
knowledge, negative results are absence-of-evidence, or the fast-moving autoformalization
frontier will date.)*
