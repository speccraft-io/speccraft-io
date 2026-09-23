---
title: SpecCraft vs Polygraph
description: Polygraph has an LLM derive a JavaScript spec from your code, checks the spec against real traces, then model-checks it exhaustively. SpecCraft starts from a spec you write and checks the code against it. Same goal, opposite starting points.
tableOfContents: true
adoption:
  github: cognitive-fab/polygraph
  npm: '@cognitive-fab/polygraph'
  created: 2026-07-07
---

[Polygraph](https://github.com/cognitive-fab/polygraph) is a Claude Code plugin and standalone CLI by Cognitive Fab
LLC, first published in July 2026. It finds bugs in stateful JavaScript and TypeScript code (workflows, reducers,
protocol handlers, checkout flows) by exhaustively exploring every state reachable over a declared, finite set of
actions and payloads. Of the tools we have found, it covers the most of SpecCraft's method end to end, so the
comparison is worth making in detail.

## What Polygraph is

- **Audit existing code.** An LLM reads your source and writes an independent, executable spec of it, in a strict
  state-machine style (the SAM pattern). Several specs are generated and vote.
- **Check the spec is faithful.** Real execution traces, captured by wrapping your dispatch or reducer once, are
  replayed against each spec. Controls run first: a hand-written reference spec must score 100%, and a deliberately
  mutated one must fail.
- **Model-check the spec.** The faithful spec is explored exhaustively over the declared domain against your
  invariants, written as plain JavaScript predicates. Each violation comes with the shortest path to it.
- **Author new code** (polygen): from a one-sentence feature description, an LLM writes the state machine and its
  invariants, model-checks its own output and repairs it until the check passes.
- **More engines around it:** polyrun (durable execution of a verified machine), polyvers (checking a new version
  against running instances), polynv (eliciting invariants and grading them by how many mutated machines they catch),
  and an optional escalation to TLA+ and TLC.
- **Stated plainly in its own README:** experimental, not peer-reviewed, a consistency check rather than a proof, and
  "exhaustive" only over the declared finite domain.

## Side by side

| | Polygraph | SpecCraft |
|---|---|---|
| Where the spec comes from | An LLM derives it from your code | You write it, as TypeScript |
| What the spec is checked against | Recorded execution traces of the real code | The real implementation, walked state by state (`checkConformance`) or inline |
| Model checking | Exhaustive over a declared finite domain | Exhaustive over a bounded model |
| Invariants | Plain JavaScript predicates | Plain TypeScript predicates |
| LLM | Needed to generate specs and author code; checking runs without it | Not needed |
| Async orderings in real code | Covered only as far as the traces and the spec model them | Inline specs: the explorer delivers async replies in every order |
| Scope | Audit, authoring, durable runtime, versioning, invariant elicitation | Spec exploration, conformance, inline specs |
| Packaging | Claude Code plugin plus CLI, Apache-2.0 | npm library, MIT |

## Two different bets

**Polygraph bets that the spec should come from the code.** Hand-writing a formal model and keeping it current is
why almost nobody does it; an LLM can derive one cheaply on every change, and replaying real traces tells you whether
to trust it. The cost is that the spec is a reading of the code as it is. Their own README puts it well: code with a
bug is a faithful description of the wrong behavior. That is why the invariants must come from you, and why model
checking, not replay, is where the bugs are found.

**SpecCraft bets that the spec should come first.** You write what the system should do, in small abstract terms,
before or beside the code. Exploring it finds the missing requirements, the orderings nobody decided on, and those
answers go back into the spec. The code is then checked against the spec, not the other way around. The cost is that
someone has to write the spec.

The two are not exclusive. A derived spec is a good way to understand existing code; a written spec is a good way to
decide what new code should do.

## Where Polygraph is ahead

- **Works on code you already have**, with no spec to write first.
- **Much wider scope:** authoring, a durable runtime, version gating, invariant elicitation.
- **Grading invariants.** polynv measures how many behaviorally different mutated machines your invariants catch, a
  real answer to "are these rules strong enough?"
- **Evidence.** A corroborated double-charge bug on a production billing machine, a seeded-bug evaluation (replay
  alone found 0 of 5 bugs, model checking found 5 of 5), and a paper behind the method.

## Where SpecCraft is ahead

- **No LLM in the loop.** Nothing to generate, vote on, or pay for; the spec is the one you wrote.
- **The code is walked, not sampled.** Conformance explores the real implementation against the spec over the whole
  state graph, not over the traces someone recorded.
- **Async orderings in the real code.** Inline specs let the explorer decide when each reply lands, so a stale reply
  arriving late is found by the search.
- **Small and plain.** One library, used from ordinary tests, with no plugin, runtime, or API key.

## What SpecCraft takes from it

- **Grade the invariants**, by checking how many deliberately broken models they catch.
- **Controls before trust:** a known-good and a known-bad case must behave as expected before a run counts.
- **Replay real traces** against the spec as a cheap first check for existing code.

## Who builds it

Cognitive Fab LLC. The method is introduced in a July 2026 paper by Jean-Jacques Dubray, the author of the SAM
pattern the specs are written in: "Can Code Specify a System Precisely Enough to Formally Verify It?"
(arXiv:2607.05076). In September 2026 the repo had 14 stars, and the npm package about 465 downloads a month.

## Links

- Polygraph on GitHub: https://github.com/cognitive-fab/polygraph
- Polygraph on npm: https://www.npmjs.com/package/@cognitive-fab/polygraph
- Polyflow on npm: https://www.npmjs.com/package/@cognitive-fab/polyflow
- The paper: https://arxiv.org/abs/2607.05076
- Cognitive Fab: https://cognitivefab.com
