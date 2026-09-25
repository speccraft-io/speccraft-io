---
title: Formal methods in public repos
description: Which public JavaScript and TypeScript projects on GitHub use a formal methods tool, what they check with it, and what that says about real-life use.
tableOfContents: true
card: market
---

Do real JavaScript and TypeScript projects use formal methods, or only demos and courses? We searched public GitHub
repos for signs of a formal tool: TLA+ and Quint specs, Alloy models, Dafny compiled to JavaScript, the Z3 solver,
XState's graph tools, and fast-check's model-based and race-condition tests.

## How we searched

- GitHub code search for files and dependencies: `*.tla`, `*.qnt`, `*.als` and `*.dfy` files; `tla2tools` in CI
  workflows; `@informalsystems/quint`, `z3-solver`, `@xstate/graph` and `@xstate/test` in `package.json`; and
  `fc.commands`, `fc.modelRun` and `fc.scheduler` in TypeScript code.
- Kept only repos whose main language is JavaScript or TypeScript, and dropped forks.
- Opened the top repos to check what they actually do with the tool. A dependency in `package.json` alone often
  means nothing.

About 140 JS/TS repos use one of TLA+, Quint, Alloy, Dafny, Z3 or XState's graph tools, and about 40 use fast-check's
model-based or race-condition tests. Most have a handful of stars. Star counts are from September 2026.

## Model-based tests with fast-check

The most common real use. The test runs random sequences of commands against the code and a simple model, and checks
they agree.

- [Liveblocks](https://github.com/liveblocks/liveblocks) (4.7k ★), realtime multiplayer infrastructure: model-based
  tests of its storage and live text, in `liveblocks-server/test/storage/model-based`.
- [TanStack DB](https://github.com/TanStack/db) (3.9k ★), a reactive client store: `fc.scheduler` tests that replay
  subscriptions and queries in random orders.
- [ComfyUI frontend](https://github.com/Comfy-Org/ComfyUI_frontend) (2.0k ★): a state machine test of how workflow
  drafts are saved.
- [funkia/list](https://github.com/funkia/list) (1.6k ★), an immutable list: model-based tests against a plain array.
- Also: [DXOS](https://github.com/dxos/dxos) replication stress tests, [bunqueue](https://github.com/egeominotti/bunqueue),
  [Polykey](https://github.com/MatrixAI/Polykey), [m-ld](https://github.com/m-ld/m-ld-js).

## Model-based tests with XState

- [Abacus](https://github.com/kiesraad/abacus) (103 ★), the Dutch Electoral Council's software for counting votes and
  dividing seats: Playwright end-to-end tests generated from XState models of data entry, with `@xstate/graph`.
- [emberclear](https://github.com/NullVoxPopuli/emberclear) (198 ★), an encrypted chat, and
  [MusicRoom](https://github.com/AdonisEnProvence/MusicRoom): acceptance tests with `@xstate/test`.
- Two German government services, [grundsteuer](https://github.com/digitalservicebund/grundsteuer) and
  [a2j-rechtsantragstelle](https://github.com/digitalservicebund/a2j-rechtsantragstelle), use `@xstate/graph` at run
  time to find paths through long forms, not to check them.

Many repos list `@xstate/test` or `@xstate/graph` in `package.json` and never import it.

## TLA+ and Quint specs next to JS/TS code

- [microsoft/etcd3](https://github.com/microsoft/etcd3) (546 ★), Microsoft's Node client for etcd: a PlusCal spec of
  how a watcher reconnects, in `src/watch.tla`.
- [emilia-protocol](https://github.com/emiliaprotocol/emilia-protocol) (615 ★): TLA+ specs checked by TLC in CI, plus
  Alloy models.
- [roomer](https://github.com/joncody/roomer), a WebSocket framework: runs TLC on `spec/roomer.tla` in CI.
- [trueline-mcp](https://github.com/rjkaes/trueline-mcp), an editing plugin for AI agents: a TLA+ spec of its edit
  protocol.
- [takt](https://github.com/nrslib/takt) (1.4k ★), an AI agent framework: a `/verify` command that asks the AI to
  write the agreed requirements in Quint and Alloy, then runs the checkers on them.
- Smaller projects use Quint with [quint-connect-ts](https://github.com/dearlordylord/quint-connect-ts) to test
  TypeScript code against a Quint model.

## Dafny compiled to JavaScript

- [dafny-replay](https://github.com/metareflection/dafny-replay) and [lemmafit](https://github.com/midspiral/lemmafit):
  state for web apps (undo/redo, client-server sync) written in Dafny, proven, and compiled to JavaScript for React.

## Z3 from JavaScript

- [jshookmcp](https://github.com/vmoranv/jshookmcp) (2.0k ★), a JavaScript reverse-engineering toolkit: runs symbolic
  execution of JavaScript expressions on Z3, for example to undo code obfuscation.
- [estimates](https://github.com/teorth/estimates) (342 ★), by Terence Tao: runs Z3 in the browser to check
  inequalities in analysis.
- Most other `z3-solver` users are Advent of Code solutions and puzzle solvers.

## What stands out

- **Tests, not proofs.** The largest projects use model-based testing (fast-check, XState). Specs and proofs show up
  in small or new projects.
- **Specs live next to the code, not in it.** TLA+ specs sit in their own folder and are checked in CI. Nothing
  connects them to the TypeScript, apart from a few new tools like quint-connect-ts.
- **AI projects drive the new specs.** Almost every repo with TLA+ or Quint and JS/TS code was active in 2026, and
  many are tools for AI agents. The spec is often written or checked with an AI.
- **A dependency is not use.** Many repos install a tool and never call it.
