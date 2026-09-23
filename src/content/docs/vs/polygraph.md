---
title: SpecCraft vs Polygraph
description: Polygraph has an LLM derive a JavaScript spec from your code, checks the spec against real traces, then model-checks it exhaustively. This page runs its turnstile example through replay and the model checker, then compares it with SpecCraft, which starts from a spec you write.
tableOfContents: true
adoption:
  github: cognitive-fab/polygraph
  npm: '@cognitive-fab/polygraph'
  created: 2026-07-07
---

[Polygraph](https://github.com/cognitive-fab/polygraph) is a Claude Code plugin and standalone CLI by Cognitive Fab
LLC, first published in July 2026. It finds bugs in stateful JavaScript and TypeScript code (workflows, reducers,
protocol handlers, checkout flows) by exhaustively exploring every state reachable over a declared, finite set of
actions and payloads. Of the tools we have found, it covers the most of SpecCraft's method end to end.

## Using Polygraph

We ran the steps below from a clone of the repository at version 8.3.0, on Node 24, with no API key. The spec,
contract and traces are Polygraph's own `examples/turnstile-v2`. The invariants file is ours, because that example
ships without one. The output is from our run.

### Install and set up

As a Claude Code plugin:

```text
/plugin marketplace add cognitive-fab/polygraph
/plugin install polygraph@polygraph
```

Or as a plain CLI, from a clone:

```sh
git clone https://github.com/cognitive-fab/polygraph
```

- **Node 20 or newer.** The core loop needs no `npm install`; the SAM runtime it uses is vendored in the repo.
- **An API key only for the LLM steps.** Generating specs from source and authoring new code call the Anthropic API
  with `ANTHROPIC_API_KEY`. Replay, model checking, invariant grading and versioning run locally with no key.
- **In Claude Code** you mostly ask in plain words ("verify this state machine") or use the entry points:
  `/polygraph:polygraph` for a guided audit, `/polygraph:verify` when you already have a contract and traces,
  `/polygraph:polygen` to write a new machine.

### A first spec

An audit has three files you can read and diff. The first is a contract, `contract.json`, which says what is
observable: the state fields, the actions, the data each action carries, and any special rules. For the turnstile,
the state is `{ state: 'LOCKED' | 'UNLOCKED', coins }`, the actions are `COIN` and `PUSH`, and one special rule says a
`PUSH` while locked does nothing.

The second is the spec. In a real audit an LLM writes several of them from your source and they vote; the example
ships a hand-written reference. It is a module in the SAM pattern, v2 strict profile:

```js
// specs/reference.js (shortened)
const { createInstance } = require('@cognitive-fab/sam-pattern');

const instance = createInstance({ strict: true, hasAsyncActions: false, instanceName: 'turnstileV2' });

const control = instance({
  initialState: { state: 'LOCKED', coins: 0 },
  component: {
    modelShape: {
      state: { type: 'string' },
      coins: { type: 'number' },
    },
    actions: {
      COIN: { action: (data = {}) => ({ ...data }), schema: {}, domain: [{}] },
      PUSH: { action: (data = {}) => ({ ...data }), schema: {}, domain: [{}] },
    },
    acceptors: {
      COIN: (model) => (proposal, { next }) => {
        next.state = 'UNLOCKED';
        next.coins = model.coins + 1;
      },
      PUSH: (model) => (proposal, { reject, next, unchanged }) => {
        if (model.state === 'LOCKED') return reject('push-while-locked-is-noop');
        next.state = 'LOCKED';
        unchanged('coins');
      },
    },
    reactors: [],
  },
});

module.exports = { instance, init, actions, getState, setState };
```

What each part does:

- **`modelShape`** declares every state field. The strict profile does not allow hidden bookkeeping state.
- **`actions`** declares each action with a payload `schema` and a `domain`: the payload values the model checker
  will try. Both turnstile actions carry no data, so the domain is one empty payload.
- **`acceptors`** compute the next state. `next` sets fields, `unchanged` says a field stays, and `reject(reason)`
  says the action does not apply and why. A spec may not ignore an action silently.
- **`reactors: []`** is required: the checker only explores state that acceptors write.

The traces are ground truth from the real code: one JSON line per step, `{pre, action, data, post}`. You get them by
wrapping your dispatch or reducer once with `withTracing` from `scripts/instrument/`, or by letting the agent do it:

```text
{"pre":{"state":"LOCKED","coins":0},"action":"COIN","data":{},"post":{"state":"UNLOCKED","coins":1}}
{"pre":{"state":"UNLOCKED","coins":1},"action":"PUSH","data":{},"post":{"state":"LOCKED","coins":1}}
```

The third file is the invariants, `invariants.mjs`: your rules as plain JavaScript predicates, in two arrays,
`stateInvariants` over a state and `transitionInvariants` over `(pre, action, data, post)`. Ours has one true rule
and one deliberately wrong one:

```js
export const stateInvariants = [
  { name: 'unlocked-means-paid', pred: (s) => s.state !== 'UNLOCKED' || s.coins >= 1 },
  { name: 'at-most-two-coins', pred: (s) => s.coins <= 2 },
];
```

### Running it

Replay first, to check that the spec matches the code's real behavior:

```sh
node scripts/verify.mjs --contract examples/turnstile-v2/contract.json --traces examples/turnstile-v2/traces \
  --specs examples/turnstile-v2/specs --out out/turnstile
```

```text
12/12 windows consistent across 1 spec(s).
findings: 0 spec-error, 0 code-finding/contract, 0 unscoreable-all
report: out/turnstile/findings.md
```

Then the model checker, which explores the spec from its initial state over the declared domain:

```sh
node scripts/check.mjs --spec examples/turnstile-v2/specs/reference.js \
  --contract examples/turnstile-v2/contract.json --invariants invariants.mjs --max-states 50
```

```text
states explored: 50 (CAP HIT - exploration bounded)
rejections explored: push-while-locked-is-noop ×23
1 invariant violation(s):

  ✗ at-most-two-coins [state] - reachable state violates the rule
    counterexample (shortest path from init):
      init            {"state":"LOCKED","coins":0}
      COIN({}) -> {"state":"UNLOCKED","coins":1}
      COIN({}) -> {"state":"UNLOCKED","coins":2}
      COIN({}) -> {"state":"UNLOCKED","coins":3}
```

Two edits to the real output: the report path is shortened, and the checker printed a long dash where this page shows
a hyphen, plus a one-line SAM warning before it, left out here.
The exit code was 1. `coins` grows without bound, so the run needs `--max-states`; that is what "CAP HIT" means.

### What you get

- **A replay report** (`findings.md` and `findings.json`). Each disagreement between spec and traces is sorted into a
  spec-error (the LLM misread the code), a code-finding (all specs disagree with the code) or a contract-error. With
  no invariants, the report says the bug-finding half did not run.
- **A shortest counterexample** for each broken invariant, as actions with payloads from the initial state. It is a
  ready-made repro to try against the real code.
- **Rejection counts.** "push-while-locked-is-noop ×23" shows the special rule was actually reached. A declared rule
  that never fires is flagged as a warning.
- **Controls.** Before a generated spec is trusted, a hand-written reference must replay at 100% and a deliberately
  mutated spec must fail. The turnstile example ships both (`specs/` and `specs-mutant/`).

Polygraph's own guidance is that every finding is a lead to check by hand, not a verdict.

### Limits

- **A consistency check, not a proof.** The README says so first: experimental, not peer-reviewed, and "exhaustive"
  only over the finite action and data domain declared in the contract.
- **The code must run in isolation.** Traces come from executing it, so code tied to a database or device needs test
  doubles first.
- **Unbounded fields need a cap.** Without `--max-states`, the turnstile check did not finish within two minutes for
  us; the default cap is 100,000 states.
- **The 8.0 format change.** Version 8.0 removed the older `next(state, action, data)` spec format. Some examples
  still in the repo (`subscription`, `polygen-otp`) use it, and the 8.3.0 checker refused them by name when we tried.

## What Polygraph is

- **An audit loop:** an LLM writes independent specs from your source, replay against real traces checks they are
  faithful, and model checking against your invariants finds the bugs.
- **polygen** runs it in reverse: from a one-sentence feature description, an LLM writes the machine and its
  invariants, model-checks its own output, and repairs it until the check passes.
- **More engines around it:** polyrun (durable execution of a verified machine), polyvers (checking a new version
  against running instances), polynv (eliciting invariants and grading them by how many mutated machines they catch),
  and an optional escalation to TLA+ and TLC with `--tla`.

## Compared with SpecCraft

| | Polygraph | SpecCraft |
|---|---|---|
| Where the spec comes from | An LLM derives it from your code | You write it, as TypeScript |
| What the spec is checked against | Recorded execution traces of the real code | The real implementation, walked state by state (`checkConformance`) or inline |
| Model checking | Exhaustive over a declared finite domain, plain JS invariants | Exhaustive over a bounded model, plain TS invariants |
| LLM | Needed to generate specs and author code; checking runs without it | Not needed |
| Async orderings in real code | Covered only as far as the traces and the spec model them | Inline specs: the explorer delivers async replies in every order |
| Scope and packaging | Audit, authoring, runtime, versioning, invariant grading; Claude Code plugin plus CLI, Apache-2.0 | Spec exploration, conformance, inline specs; npm library, MIT |

- **Opposite starting points.** Polygraph derives the spec from the code, so it works on code you already have, but
  the spec is a reading of the code as it is: code with a bug is a faithful description of the wrong behavior. That
  is why its invariants must come from you. SpecCraft starts from a spec of what the code should do, and someone has
  to write it.
- **Polygraph is wider and has evidence.** Authoring, a durable runtime, version gating, invariant grading, a
  corroborated double-charge bug on a production billing machine, and a seeded-bug evaluation where replay found 0
  of 5 bugs and model checking found 5 of 5.
- **SpecCraft needs no LLM and walks the real code.** Conformance explores the implementation against the spec over
  the whole state graph, not over recorded traces, and inline specs find a stale reply arriving late. It is one
  library, used from ordinary tests.
- **What SpecCraft takes from it:** grade invariants by how many broken models they catch, run a known-good and a
  known-bad control before a run counts, and replay real traces as a cheap first check for existing code.

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
