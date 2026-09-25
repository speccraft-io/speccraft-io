---
title: Formal methods tools
description: The formal methods tools that exist, grouped by the problem they check, with job mentions, Google search trends and GitHub stars for each.
tableOfContents: true
card: market
---

What tools exist, what problem each one checks, and how much traction each has: how many job postings name it, its
Google search trend and its GitHub stars.

## Landscape by problem type

Each group below is "what problem you're checking" → the tools that do it.

**Design-level models (find bugs in the protocol before code exists)**
TLA+, Alloy, PlusCal, Quint, P, SPIN/Promela. You write an abstract model, the checker explores states. Best fit for
distributed systems, consensus, cache coherence, API state machines.

**Proof assistants (prove theorems and programs by hand, with tactics)**
Lean, Coq/Rocq, Isabelle/HOL, Agda, Idris. Deep guarantees, high effort. Used for compilers, crypto proofs, math,
language semantics.

**Contract-based verification of real code (annotate functions, a solver proves them)**
SPARK (Ada), Frama-C (C), Dafny, Why3, Verus and Creusot (Rust), JML/OpenJML (Java). You write pre/postconditions and
invariants alongside normal code. This is the closest thing to "verified engineering" as a day job.

**Model checkers for actual source code**
CBMC (C/C++), Java Pathfinder, Kani (Rust). Bounded checking of real programs rather than an abstract model.

**Static analysis / abstract interpretation (prove absence of crash classes, no annotations)**
Astrée, Polyspace, Infer, CodeQL, Coverity. Lower ceiling, much lower cost, so this is what large companies actually
deploy.

**SMT and SAT solvers (the engines under most of the above)**
Z3, CVC5, Yices, MiniSat. Also used directly for scheduling, config validation, program synthesis.

**Cryptographic protocol verification**
Tamarin, ProVerif, EasyCrypt, CryptoVerif. TLS 1.3 and Signal were analyzed with these.

**Hardware verification**
SystemVerilog Assertions, JasperGold, SymbiYosys, ACL2. Oldest and most commercially mature branch of the whole field.

**Type systems as lightweight verification**
Liquid Haskell, refinement types, Rust's borrow checker, dependent types in Idris. Weaker guarantees, but they ride
along with normal development.

**Runtime verification and property testing**
Jepsen, TLA+ trace checking, QuickCheck/Hypothesis, Antithesis, deterministic simulation testing. Doesn't prove
anything, catches a lot. Highest practical payoff per hour.

The field looks huge because it grew from three separate communities — math, hardware, and safety-critical software
— that never merged. Lots of overlapping tools, small user bases each.

## Which tools people actually get hired for

Demand is counted by how many postings on [Job postings](/market/jobs) name each tool directly. It skews hard toward proof assistants,
not model checkers — Lean and Coq/Rocq beat TLA+ by a wide margin, even though neither is a model checker.

The Trend column is Google Trends search interest over the last 12 months (worldwide), included only where the
term maps to a single, unambiguous Trends topic — most tool names here are too generic or collide with unrelated
words ("Coq" is French for rooster, "Agda" without disambiguation returns a food brand) to trust a plain keyword
search, so most rows don't get one rather than showing misleading data. GitHub ★ is each project's current star
count, checked directly via the GitHub API; closed-source or non-GitHub-hosted tools (Antithesis, Certora, UPPAAL,
CryptoVerif, MathSAT) don't get one.

| Tool | Job mentions | What it is | Trend (12mo) | GitHub ★ |
|---|---|---|---|---|
| [Lean / Lean 4](https://lean-lang.org) | 9 | Interactive theorem prover — the single most-named tool found, concentrated at AI labs (Harmonic, DeepMind, Oath Technologies). | [![Lean search trend](/trends/lean.svg)](https://trends.google.com/trends/explore?date=today%2012-m&q=%2Fg%2F11j7dt82fy) | [9,234](https://github.com/leanprover/lean4) |
| [Coq / Rocq](https://rocq-prover.org) | 8 | Interactive theorem prover, same AI-lab cluster as Lean. | [![Rocq search trend](/trends/rocq.svg)](https://trends.google.com/trends/explore?date=today%2012-m&q=%2Fm%2F02s7zd) | [5,581](https://github.com/rocq-prover/rocq) |
| SMT solvers ([Z3](https://github.com/Z3Prover/z3), [CVC5](https://cvc5.github.io), [MathSAT](https://mathsat.fbk.eu)) | 8 | Underlying decision engine for most higher-level tools; rarely hired for by name alone. | [![Z3 search trend](/trends/z3.svg)](https://trends.google.com/trends/explore?date=today%2012-m&q=%2Fg%2F11j3r_lybp) | Z3: [12,702](https://github.com/Z3Prover/z3) · CVC5: [1,361](https://github.com/cvc5/cvc5) |
| [TLA+ / TLC / Apalache](https://lamport.azurewebsites.net/tla/tla.html) | 6 | Exhaustive model checker — Huawei, Oracle, Architect Labs, Sigil Logic, Johns Hopkins APL, Google Cloud. | [![TLA+ search trend](/trends/tla-plus.svg)](https://trends.google.com/trends/explore?date=today%2012-m&q=%2Fm%2F0134r96j) | TLA+: [3,058](https://github.com/tlaplus/tlaplus) · Apalache: [599](https://github.com/informalsystems/apalache) |
| [Isabelle/HOL](https://isabelle.in.tum.de) | 4 | Interactive theorem prover; used for the seL4 verified microkernel. | [![Isabelle search trend](/trends/isabelle.svg)](https://trends.google.com/trends/explore?date=today%2012-m&q=%2Fm%2F015gp5) | — |
| [Agda](https://agda.readthedocs.io) | 2 | Interactive theorem prover, both mentions at Harmonic. | [![Agda search trend](/trends/agda.svg)](https://trends.google.com/trends/explore?date=today%2012-m&q=%2Fm%2F0c1r9r) | [2,928](https://github.com/agda/agda) |
| [Verus](https://github.com/verus-lang/verus) | 1 | Verification-aware Rust, used for Google Cloud's C++→Rust migration. | — | [3,192](https://github.com/verus-lang/verus) |
| [Alloy](https://alloytools.org) | 1 | Spec language + model finder (Kodkod engine); 1 posting (Sigil Logic). | [![Alloy search trend](/trends/alloy.svg)](https://trends.google.com/trends/explore?date=today%2012-m&q=%2Fg%2F11bc5xkpcr) | [868](https://github.com/AlloyTools/org.alloytools.alloy) |
| [SPIN](https://spinroot.com) | 1 | Model checker for protocols, its own language (Promela); 1 posting (Johns Hopkins APL). | [![SPIN search trend](/trends/spin.svg)](https://trends.google.com/trends/explore?date=today%2012-m&q=%2Fm%2F04hnrd) | [476](https://github.com/nimble-code/Spin) |
| [Quint](https://quint-lang.org) | 0 | Modern executable-spec successor to TLA+, built by Informal Systems. | — | [1,685](https://github.com/informalsystems/quint) |
| [P](https://github.com/p-org/P) (AWS) | 0 | State-machine modeling language, used internally across S3/DynamoDB/EC2. | — | [3,687](https://github.com/p-org/P) |
| [Antithesis](https://antithesis.com) | 0 | Closed deterministic-simulation SaaS — can't have a job posting since it's proprietary tooling companies buy, not a skill anyone lists. | — | — |
| [QuickCheck/Hypothesis](https://hypothesis.readthedocs.io) | 0 | Property-based testing (Haskell/Python); widely adopted, never hired for by name. | — | Hypothesis: [8,997](https://github.com/HypothesisWorks/hypothesis) · QuickCheck: [790](https://github.com/nick8325/quickcheck) |
| [Coyote](https://github.com/microsoft/coyote) | 0 | Microsoft's systematic concurrency tester for C#, internal Azure tool. | — | [1,598](https://github.com/microsoft/coyote) |
| [FizzBee](https://fizzbee.io) | 0 | Open-source, more approachable alternative to TLA+. | — | [350](https://github.com/fizzbee-io/fizzbee) |
| [Stateright](https://github.com/stateright/stateright) | 0 | Embedded model checker as a Rust library. | — | [1,882](https://github.com/stateright/stateright) |
| [stateproof](https://github.com/HexaField/stateproof) | 0 | TypeScript DSL compiling to TLA+; the closest TS-to-TLA+ tool found. | — | [2](https://github.com/HexaField/stateproof) |
| [loom](https://github.com/tokio-rs/loom) | 0 | Rust concurrency-permutation tester, under the Tokio project. | — | [2,823](https://github.com/tokio-rs/loom) |
| [XState graph](https://stately.ai/docs/xstate-graph) | 0 | Exhaustive state-graph traversal for XState machines, from Stately.ai. | — | [30,138](https://github.com/statelyai/xstate) |
| [fast-check](https://fast-check.dev/) | 0 | TypeScript/JS property-based testing, 139M downloads/month. | — | [5,149](https://github.com/dubzzz/fast-check) |
| [Certora Prover/CVL](https://www.certora.com) | 0 | SMT-based prover for smart contracts (Solidity/Solana/Move). | — | — |
| [K Framework/KEVM](https://github.com/runtimeverification/k) | 0 | Semantics framework; KEVM targets EVM bytecode. | — | [591](https://github.com/runtimeverification/k) |
| [Cryptol/SAW](https://galois.com) | 0 | Haskell-hosted crypto spec DSL + Software Analysis Workbench (Galois). | [![Cryptol search trend](/trends/cryptol.svg)](https://trends.google.com/trends/explore?date=today%2012-m&q=%2Fm%2F05c414v) | Cryptol: [1,221](https://github.com/GaloisInc/cryptol) · SAW: [518](https://github.com/GaloisInc/saw-script) |
| [Dafny](https://dafny.org) | 0 | Verification-aware language, compiles to C#/Java/JS/Go/Python. | [![Dafny search trend](/trends/dafny.svg)](https://trends.google.com/trends/explore?date=today%2012-m&q=%2Fg%2F11f3f1hqn2) | [3,548](https://github.com/dafny-lang/dafny) |
| [UPPAAL](https://uppaal.org) | 0 | Timed-automata model checker (academic, Uppsala/Aalborg). | — | — |
| [EasyCrypt](https://www.easycrypt.info) | 1 | Cryptography-specific interactive theorem prover; 1 posting (Riverside Research). | — | [416](https://github.com/EasyCrypt/easycrypt) |
| [F\*](https://www.fstar-lang.org) | 1 | Dependently-typed proof assistant, used in Project Everest (verified TLS); 1 posting (Riverside Research). | — | [3,109](https://github.com/FStarLang/FStar) |
| [CryptoVerif](https://bblanche.gitlabpages.inria.fr/CryptoVerif/) | 1 | Automated cryptographic protocol verifier, game-hopping proofs; 1 posting (Riverside Research). | — | — |

