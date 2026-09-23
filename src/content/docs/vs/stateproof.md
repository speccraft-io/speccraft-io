---
title: SpecCraft vs stateproof
description: stateproof compiles a TypeScript-looking state machine to TLA+ and checks it with TLC. SpecCraft runs the spec as real TypeScript. The difference is the translator you have to trust.
---

[stateproof](https://github.com/HexaField/stateproof) is the closest earlier attempt at what SpecCraft does: write a
model in TypeScript and check every reachable state. It is a small project (one contributor, MIT licensed, last
commit in March 2026), but it is the only other tool in TypeScript aiming at the same corner, so the comparison is
worth making precisely.

## What stateproof is

- A fluent builder in the XState style: `machine().states(...).transition(...)`.
- The model compiles to TLA+, and exhaustive checking runs in Java through TLC.
- The same model is also interpreted at runtime, so "the spec is the implementation".
- Around it: a small in-process BFS for generating test traces, conformance adapters for a real implementation, a
  CLI, Mermaid diagrams, spec diff, and a visual Studio.

## Side by side

| | stateproof | SpecCraft |
|---|---|---|
| How guards and effects run | Source captured with `fn.toString()` and re-parsed into TLA+ | Executed as ordinary TypeScript |
| TypeScript you can use | A small subset: comparisons, `&&` / `\|\|`, arithmetic, a few array methods | All of it: helper functions, destructuring, closures, libraries |
| Where checking happens | TLC in Java, results parsed from its text output | In-process, as a library call |
| Shape of the model | Required state enum with from/to transitions and a flat context | Any JSON-shaped state; a state machine is one option, not a requirement |
| Parameterized actions | No; the escape hatch is raw TLA+ strings | Yes, built as ordinary arrays of actions |
| What you get back | Pass/fail plus violations parsed from TLC | State count, endings, stuck states, the shortest trace per invariant, beliefs that must keep failing |
| Spec vs implementation | The same artifact at runtime | Kept apart; conformance checks the code against the spec |
| Liveness | Yes, through TLC | Not yet |

## The core problem: a translator you have to trust

stateproof's guards look like TypeScript, but they are not run as TypeScript. Their source text is re-parsed by a
hand-written tokenizer and parser of about 800 lines, and only a small subset survives. Every real spec we wrote
while building SpecCraft used helper predicates and nested record updates, and none of them would compile.

Worse, the translation can be silently wrong. `.filter()` and `.some()` compile to `Filter(...)` and `Exists(...)`,
which are not TLA+ operators, and a `null` literal compiles to the string `"null"`. Because the same parsed model
also drives the runtime interpreter, the model TLC checks and the model that runs can drift apart. A green check
then means nothing, which is the worst failure a verification tool can have.

SpecCraft has no translator. The model that is explored is the model you wrote.

## Where stateproof is ahead

- **Liveness** ("eventually this happens") through TLC. SpecCraft checks safety only today.
- **Visual tooling:** Mermaid diagrams, spec diff and the Studio. SpecCraft has none of these yet.

## Where SpecCraft is ahead

- **Real TypeScript** in guards, effects and invariants, with nothing to translate.
- **No Java**, no temp files, no parsing another tool's output.
- **Free-form state** instead of a required machine shape.
- **Spec and code kept apart.** stateproof's "the spec is the implementation" removes the separation the method
  depends on: the spec is the oracle, and the code is checked against it. SpecCraft offers that three ways: a
  standalone spec checked with `checkConformance`, and inline specs next to the real code as decorators or as an
  `annotate()` call.
- **Async replies** can be delivered by the explorer in every order, so a stale reply landing late is found by the
  search, not by luck.

## Who builds it

stateproof is a side project of HexaField (Josh Field), an experienced TypeScript and web engineer whose main work
is elsewhere:

- **npm:** 61 packages, mostly from years of work on an open source WebXR engine (XREngine, later Ethereal Engine and
  IR Engine) plus three.js and PhysX tooling. stateproof itself is not published on npm.
- **GitHub:** over 200 public repositories. Recent activity is about agent orchestration and "living web" work:
  personal semantic graphs, decentralized identity, P2P sync, and W3C proposals around them.
- **X:** posts about the semantic web and AD4M, a personal agent runtime.

So stateproof reads as a well-built experiment by a strong engineer rather than a product with a roadmap: one
contributor, a burst of commits, and no activity since March 2026.

## Links

- stateproof on GitHub: https://github.com/HexaField/stateproof
- HexaField on npm: https://www.npmjs.com/~hexafield
- HexaField on StackBlitz: https://stackblitz.com/@HexaField
- HexaField on X: https://x.com/HexaField

## In one line

stateproof translates your spec into another language and asks you to trust the translator. SpecCraft runs your spec.
