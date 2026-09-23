---
title: SpecCraft vs LemmaScript
description: LemmaScript proves TypeScript functions correct for every input with Dafny or Lean. SpecCraft explores every ordering of events in a bounded model. Different questions, and they work well together.
---

[LemmaScript](https://github.com/midspiral/LemmaScript) is a verification toolchain for TypeScript by
[Midspiral](https://www.linkedin.com/company/midspiral/), currently a tech preview. It is the most serious
"formal methods for TypeScript" project we know of, so it is worth being precise about where it overlaps with
SpecCraft and where it does not.

## What LemmaScript is

- You write ordinary TypeScript and add contracts as comments: `//@ requires`, `//@ ensures`, `//@ invariant`,
  `//@ decreases`.
- `lsc` translates the file construct for construct into Dafny (or Lean 4 via Velvet). An `if` stays an `if`, a
  `while` stays a `while`. Their [blog post on shallow embedding](https://lemmascript.org/blog/shallow-embedding/)
  explains why: the output stays close to human-written Dafny, which is what LLMs are good at.
- An LLM writes the proof steps the solver cannot find on its own. The human is not meant to touch anything
  formal.
- The result is a proof that holds for every input, with no bounds.
- Over twenty case studies, from greenfield apps to in-place verification of real projects (hono's security
  middleware, node-casbin, opencode's permission system and patch parser, balanced-match).

## Different questions

| | LemmaScript | SpecCraft |
|---|---|---|
| Question it answers | Is this function correct for every input? | Can some order of events break a rule? |
| Technique | Deductive proof (Dafny / Lean) | Exhaustive state exploration (explicit-state model checking) |
| Sweet spot | A pure domain core: reducers, splitters, permission checks, parsers | Coordination: handlers, async jobs, timers, replies arriving in any order |
| What you get back | A proof, or a failed proof obligation | A verdict, or the shortest trace that breaks the rule |
| Bounds | None: all inputs | Small bounded model (small scope) |
| Toolchain | TypeScript plus Dafny or Lean installed | TypeScript only, runs in-process |
| Who does the hard part | An LLM writes the proofs | The engine enumerates; no proofs to write |
| Relation to your code | Translates your code into another language | Runs your spec as TypeScript; conformance compares it with your code |

## Where LemmaScript is stronger

- **All inputs, not a bounded model.** When it proves that an action keeps a 16-part invariant, that holds for
  every state, not just the ones a bounded search reached.
- **Arithmetic and data.** Money that never leaks, sums, rankings, graph reachability: properties over real-sized
  values are exactly what a proof handles and exhaustive search cannot.
- **Maturity and use.** Many case studies, a VS Code extension, a reusable CI workflow, and public reports of
  production use.

## Where SpecCraft is stronger

- **Order of events.** Dafny proves sequential code. It has no notion of three async jobs in flight, a reply
  landing between a check and its write, or a timer firing mid-operation. LemmaScript's case studies name I/O,
  Durable Objects and WebSockets as the trust boundary. That boundary is where SpecCraft works.
- **Traces, not proofs.** A failing check hands back a concrete sequence of events. That trace is often a missing
  requirement, not just a bug: a question you did not know to ask.
- **Nothing to trust in between.** LemmaScript is upfront that the translation has limits: numbers become ideal
  integers, some TypeScript unions cannot be translated, and they are testing that source and target mean the
  same thing. SpecCraft runs the spec as TypeScript, so the model checked is the model written.
- **No extra toolchain and no LLM.** No Dafny or Lean install, no proof search to wait for.

## Using both

The two fit together along the line LemmaScript draws itself. Keep the domain core pure and prove it with
LemmaScript: the fee calculation, the permission decision, the state update. Put the coordination around it
(which events can arrive, in what order, while what is still running) in a SpecCraft spec, explore every
ordering, and check the real code against it.

## Ideas worth borrowing

- **Contracts as comments.** Invisible to `tsc` and the bundler, zero runtime cost, and no decorator support
  needed from the test runner.
- **One file list for local runs and CI.** `lsc check` and their reusable GitHub Actions workflow read the same
  list of files, so what you check locally is what CI checks.
- **Generated file plus additions only.** A regeneratable file and a hand-edited copy that may only add lines, so
  regeneration never destroys human or LLM work.
- **The agent-harness framing.** An AI agent may change the code, but its pull request only counts once the checks
  pass. That framing fits SpecCraft as well as it fits LemmaScript.

## Links

- LemmaScript on GitHub: https://github.com/midspiral/LemmaScript
- LemmaScript blog: https://lemmascript.org/blog/
- Midspiral on LinkedIn: https://www.linkedin.com/company/midspiral/posts/
