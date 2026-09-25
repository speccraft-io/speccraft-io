---
title: Industries using formal methods
description: Where formal methods are used today, by industry, with the results companies have reported and who hires for the work.
tableOfContents: true
card: market
---

Where formal methods show up in practice, and what they delivered there. Hiring details are on
[Job postings](/market/jobs); the companies are on [Practitioners and firms](/market/practitioners).

## Cloud and infrastructure

- **AWS** found bugs in DynamoDB and S3 that had slipped past all tests, QA and code review, and cut an estimated 2
  months off a 4-month schedule (via [Hillel Wayne](https://www.hillelwayne.com/consulting/)).
- **AWS** uses its [P language](https://github.com/p-org/P) across S3, DynamoDB and EC2, and has 47 open Automated
  Reasoning postings.
- **Google Cloud** hires for Lean, TLA+ and Verus to prove correctness during a large C/C++-to-Rust migration.
- **Rackspace** found a bug severe enough to redo a year of work, which modeling from the start would have avoided.

## Databases and distributed systems

- **Cockroach Labs** caught a bug that would have taken 10+ hours to find by hand.
- **[Jepsen](https://jepsen.io)** sells safety analyses of distributed databases, for 13+ years.
- **[Antithesis](https://antithesis.com)**: Jane Street's message bus went "from tested to battle-tested"; Turso
  reports moving "ten times faster"; etcd is a client.

## AI labs and math

- **Harmonic's Aristotle** reached Gold Medal level at the 2025 International Math Olympiad, using Lean 4 and
  reinforcement learning.
- **Anthropic**: [Claude produced](https://www.anthropic.com/research/formalizing-fermats-last-theorem) the largest
  Lean proof ever built, formalizing Fermat's Last Theorem: 13M lines, 30,300 machine-checked theorems, over 11 largely
  autonomous days (Sept 2026).
- **OpenAI, Google DeepMind, Microsoft, AWS and ByteDance** all invest directly in Lean for verification work, per
  [Lean FRO's timeline](https://lean-lang.org/fro/about).
- Funded Lean-based startups: Axiom Math, Math, Inc., Cajal. Hiring: Google DeepMind, Harmonic, Oath Technologies.

## Blockchain and DeFi

- **[Certora](https://www.certora.com)** protects $100B+ in DeFi value locked, across MakerDAO, Lido, Aave and
  Coinbase.
- **Antithesis** was used to verify Ethereum's The Merge.
- Other firms: CertiK, Hashlock, Runtime Verification (K framework, KEVM). Hiring: Nethermind, Ethereum Foundation,
  Category Labs, Beyond Tabs.

## Defense and government

- **[Galois](https://galois.com)** does formal methods R&D for DARPA, NASA, NIST, the US DoD and AWS.
- Hiring: RTX/BBN, Riverside Research, Johns Hopkins APL, The Aerospace Corporation. Most roles need US citizenship
  and a security clearance.

## Security and cryptography

- TLS 1.3 and Signal were analyzed with Tamarin, ProVerif and similar tools.
- F\* was used in Project Everest, a verified TLS stack.
- **Trail of Bits** hires to red-team formally verified systems (HACL\*, EverCrypt, seL4, CompCert, CakeML).

## Hardware

- The oldest and most commercially mature branch of the field: SystemVerilog Assertions, JasperGold, SymbiYosys, ACL2.
- **[Axiomise](https://www.axiomise.com)** trains teams in hardware and RISC-V formal verification.

## Other

- **eSpark Learning** (education): two days of modeling saved an estimated $300K/year in revenue and maintenance.
- **Pramaana Labs** turns tax, legal and clinical rules into Lean ($27M from Khosla Ventures, founded 2025).

