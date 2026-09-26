---
title: Formal methods practitioners
description: Companies and solo practitioners who offer formal methods services or build formal methods tools, and the communities where experts meet.
tableOfContents: true
card: market
---

Who are the known names in formal methods? Who makes a living from it, and which skills do they sell? Below are the
firms and people who do this work, and the communities where the experts talk.

## People

| Person | What they do | Note |
|---|---|---|
| Kyle Kingsbury ([Jepsen](https://jepsen.io)) | Paid safety analyses of distributed databases | 13+ years, built purely on reputation from published findings. |
| [Hillel Wayne](https://www.hillelwayne.com/consulting/) | TLA+/Alloy consulting, workshops, retainers | Dominant named brand; clients incl. Netflix, NASA, Meta. |
| [Nicolas Dubien](https://github.com/dubzzz) ([fast-check](https://fast-check.dev/)) | Property-testing library, TypeScript/JavaScript | 139M downloads/month — proof OSS distribution works in this ecosystem. |
| [Josh Field](https://au.linkedin.com/in/josh-field) ([stateproof](https://github.com/HexaField/stateproof)) | TypeScript DSL compiling to TLA+, runs TLC | The closest TS-to-TLA+ tool found. |
| [Jonathan Nadal](https://github.com/jonnadal) ([Stateright](https://github.com/stateright/stateright)) | Embedded model checker as a Rust library | Model checker as a library, the Rust counterpart of the TS ones. |
| [Jack Vanlightly](https://jack-vanlightly.com) | Public technical writing on distributed systems + formal verification | Builds credibility via writing rather than a direct consulting offer. |
| [JP Kadarkarai](https://sessionize.com/jayaprabhakar-kadarkarai/) ([FizzBee](https://fizzbee.io)) | Open-source, more approachable alternative to TLA+ | Tool/OSS project, not an active paid practice. |
| [Jean-Jacques Dubray](https://www.linkedin.com/in/jdubray/) ([Polygraph](/typescript-formal-method-tools/polygraph)) | An LLM writes a JavaScript spec in SAM, his State-Action-Model pattern, which is then checked against the code | Builds it as Cognitive Fab LLC; method from his July 2026 paper. |
| [David R. MacIver](https://hegel.dev) ([Hegel](/typescript-formal-method-tools/hegel)) | Hypothesis-style property-based testing, including for TypeScript | Created Hypothesis. |
| [Liam DeVoe](https://hegel.dev) ([Hegel](/typescript-formal-method-tools/hegel)) | Co-builds Hegel | Hypothesis maintainer at Antithesis. |
| [Sandro Maglione](https://github.com/typeonce-dev) ([effect-machine](/typescript-formal-method-tools/effect-machine)) | Schema-first statecharts for Effect, with state exploration in tests | Writes and teaches about Effect, as Typeonce. |
| [Nada Amin](https://github.com/midspiral/LemmaScript) ([LemmaScript](/typescript-formal-method-tools/lemmascript)) | Proves TypeScript functions correct with Dafny or Lean | Associate professor of computer science at Harvard; builds it with Midspiral. |
| [Doniyor Botirov](https://github.com/BOTIROFF-D) ([pnueli](/typescript-formal-method-tools/pnueli)) | Explicit-state model checker in TypeScript | Founder of dbit.one; also builds unflake, bulwark and adya. |
| [Anders Hessellund Jensen](https://github.com/andershessellund) ([stifinder](/typescript-formal-method-tools/stifinder)) | State-space explorer for JavaScript | Self-employed developer in Denmark; also `valsem` and `kilde`. |
| [kingbootoshi](https://github.com/kingbootoshi) ([tla-precheck](/typescript-formal-method-tools/tla-precheck)) | Compiles a TypeScript DSL to TLA+ and proves both match | Solo project, no commits since early April 2026. |
| [Dennis Berger](https://www.linkedin.com/in/deb3rg/) ([libpetri](https://github.com/debe/libpetri)) | Runs async code written as a graph of steps (a Petri net), and checks it for leaks and waits that never end; TypeScript, Java and Rust | Staff engineer at Otto; it runs their production commerce assistant. Also builds opt-in add-ons that run n8n and Google ADK workflows on a net. |
| [Oleksandr Zalizniak](https://zalizniak.com) ([SpecCraft TS](/typescript-formal-method-tools/speccraft-ts)) | Model checker as a TypeScript library | Author of this site; started September 2026. |
| [Leslie Lamport](https://lamport.azurewebsites.net/tla/tla.html) ([TLA+](/formal-method-tools/tla-plus)) | Created TLA+ | Also teaches it in the TLA+ Video Course. |
| [K. Rustan M. Leino](https://mitpress.mit.edu/9780262546232/program-proofs/) ([Dafny](/formal-method-tools/dafny)) | Created Dafny | Wrote the book *Program Proofs*. |

## Communities

| Community | Status |
|---|---|
| [Lean Zulip](https://leanprover.zulipchat.com) | Most active community found — hundreds of participants, 12,800+ topics in the new-members stream alone. |
| [TLA+ Google Group](https://groups.google.com/g/tlaplus) | 1,679 threads, genuinely active (most recent thread 2 days before this was checked). |
| [Rocq (Coq) Zulip](https://rocq-prover.zulipchat.com) | Official current channel, replaced the Coq-Club mailing list after its Oct 2025 shutdown. |
| [Isabelle-users mailing list](https://lists.cam.ac.uk/sympa/arc/cl-isabelle-users) | Old mailing-list format, mirrored to Zulip, active with same-day posts. |
| [r/tlaplus](https://www.reddit.com/r/tlaplus/) | Real per TLA+'s own community page; unverifiable firsthand since Reddit blocks automated checks. |
| [TLA+ Community Event](https://conf.tlapl.us/) | Real, recurring annual event co-located with ETAPS (2024-2026 confirmed). |
| [Rocq Discourse](https://discourse.rocq-prover.org/) | Active secondary forum, 551 topics in its main category. |
| [Jepsen mailing lists](https://groups.google.com/a/jepsen.io/g/talk) | Real but thin — only 33 threads since 2019. |
| [dist-sys Slack](https://slofile.com/slack/dist-sys) | 5,201 members, but general distributed-systems chat, not formal-methods-specific. |
| r/formalmethods | Could not confirm this subreddit exists as a real, active community. |
| [DeepSpec](https://deepspec.org) | Dormant — its workshop series ended in 2019. |
| comp.specification.z / Z FORUM | Real once, dead now. |
| Antithesis / DST Discord | No dedicated community found; discussion happens on vendor blogs instead. |

## Firms

| Firm | What they do | Note |
|---|---|---|
| [Lean FRO](https://lean-lang.org/fro/about) | Nonprofit steward of Lean itself | Funded partly by "the single largest donation in the FRO's history," from AWS. |
| [Axiom Math](https://axiommath.ai) | "Verified AI," Lean-based | $200-300M raised; 98.93% on a Lean verification benchmark. |
| [Pramaana Labs](https://jobs.ashbyhq.com/pramaana-labs) | Formalizes human knowledge (tax/legal/clinical rules) into Lean | $27M from Khosla Ventures, founded 2025. |
| Math, Inc. / [Cajal](https://www.ycombinator.com/companies/cajal-technologies) | AI applied to formal verification of math/science problems | Both real, funded, same Lean-AI cluster as Axiom. |
| [Certora](https://www.certora.com) | Smart-contract formal verification | $100B+ in DeFi value locked protected (MakerDAO, Lido, Coinbase). |
| [CertiK](https://www.certik.com) | Formal verification + security audits, Web3 | $544B market cap assessed, 117,000+ vulnerabilities found. |
| [Hashlock](https://hashlock.com) | Smart-contract auditing, incl. formal verification | Smaller regional comparable to Certora/CertiK. |
| [Runtime Verification Inc](https://runtimeverification.com) | General formal-methods consulting, built on the K framework | Closest firm to a general formal-methods-as-a-service model. |
| [Antithesis](https://antithesis.com) | Deterministic simulation testing | Clients: Jane Street, etcd, Ethereum Foundation. |
| [QuviQ](https://www.quviq.com) | Property-based testing as a commercial service | Running since the mid-2000s — the longest commercial precedent found. |
| [Galois](https://galois.com) | Formal methods R&D for defense/government | DARPA, NASA, NIST, US DoD, AWS. |
| [Axiomise](https://www.axiomise.com) | Hardware/RISC-V formal verification training | Solo-founder-grown-into-firm path. |
| [Informal Systems](https://informal.systems) | Builds and stewards Quint (TLA+'s executable-spec successor) | Fintech/crypto product focus. |
| [Stately](https://stately.ai/) | Builds XState and its graph tools ([XState](/typescript-formal-method-tools/xstate)) | The company of David Khourshid. |
| [Midspiral](https://midspiral.com) | Builds LemmaScript, which proves TypeScript functions with Dafny or Lean ([LemmaScript](/typescript-formal-method-tools/lemmascript)) | Almost all commits by Nada Amin. |
