---
title: Formal specs
description: What a formal spec is, the parts it is made of (constants, variables, actions with guards and effects, invariants, temporal properties), and the same small queue spec written in plain text, in TypeScript and in Quint.
---

A formal spec describes **what a system may do**, not how the code does it. It has three parts: the state, the steps
that change it, and the rules that must hold. It is precise enough that a checker can walk every order in which the
steps can happen and find the one that breaks a rule.

The spec does not replace the code. The code has retries, storage, error answers and logging. The spec keeps only the
parts that decide behavior. A queue's spec, for example, says a message is `ready` or `inflight`. It does not say which
table holds it.

## What a spec is made of

The parts below come from a real spec: the core of an SQS-like queue with a dead-letter queue, written in plain text
in the TLA+ style (about 340 lines). A model of the same spec in Quint, 364 lines, has 9,896 reachable states, and TLC
walks all of them in seconds.

### Constants and bounds

Fixed values, and the bounds that keep the model finite so a checker can walk all of it.

```
- maxReceiveCountBound = 2
- messageSlots = 2 (bound only, shapes the messages variable)
- handleNames = r1, r2
```

A bound is marked as one. A real queue never refuses a send because it holds two messages, so no rule may lean on that
refusal.

### Variables

The state, with the values each variable can take and where it starts.

```
- queueStatus: active | deleted = active
- messages: {
    m1: {
      queue: source | dlq | null = null
      status: absent | ready | inflight = absent
      receiveCount: 0..receiveCountCap = 0
      currentHandle: r1 | r2 | null = null
    },
    m2: { same as m1 }
  }
```

Messages are named slots (`m1`, `m2`), not a list. A list creates states that differ only by order.

### Actions: a guard and an effect

Every step is an action. The **guard** says when the action is allowed, and it reads only the state. The **effect**
says what the next state is.

```
- delete q, m, handle (per queue, per slot, per handle)
  - Guard: active(q) AND message { queue: q, status: inflight, currentHandle: handle }
  - Effect: message { queue: null, status: absent, receiveCount: 0, currentHandle: null }
```

Actions come in two kinds:

- **Commands** are what a caller asks for: send, poll, delete, purge. A command's guard is a refusal.
- **Events** are what happens on its own: a visibility timeout restores a message, or a long poll expires. An event's
  guard is a wait. An event with no clock may fire at any moment while its guard holds, which covers every possible
  duration.

One action can stand for many. "Poll q, m" is expanded per queue and per message, and the checker tries each one.

### Invariants

Rules that must hold in every reachable state:

```
- slot in status absent has receiveCount 0
- slot { queue: source, status: ready } has receiveCount < maxReceiveCount
- queue in queueStatus deleted has no messages residing in source
```

When one breaks, the checker returns the trace that leads to the broken state.

### Temporal properties

Rules about whole runs: something eventually happens, or something never stays true forever. They need
**fairness**, an assumption that an event which stays enabled eventually fires:

```
- an inflight message eventually leaves inflight (becomes ready, or moves to the dlq),
  granted fairness on the restore event.
```

Picking the fairness is part of the claim. Grant too much, and a broken rule passes anyway.

### Refuted beliefs, postponed parts, decisions

A good spec also records what it learned along the way:

- **Refuted beliefs:** rules someone believed, and the checker disproved, with the reason.
- **Postponed:** features the model leaves out for now, so nobody assumes they are covered.
- **Considerations:** decisions and why they were made. For example: "Decided: no clock. Time is only ordering",
  or that the receive count survives dead-lettering, confirmed against the AWS docs.

This part is often the largest. It is where the product decisions that were hiding in guards and waits get written
down.

## One spec in three forms

A small piece of the same queue: one message, a receive limit of 2, and a dead status for a message that reached it.

### Plain text

```
Constants
- MAX_RECEIVES = 2

Variables
- status: absent | ready | inflight | dead = absent
- receiveCount: 0..MAX_RECEIVES = 0

Commands
- send
  - Guard: status = absent
  - Effect: status = ready
- poll
  - Guard: status = ready
  - Effect: status = inflight, receiveCount + 1
- delete
  - Guard: status = inflight
  - Effect: status = absent, receiveCount = 0

Events
- restored after timeout
  - Guard: status = inflight
  - Effect: IF receiveCount < MAX_RECEIVES THEN status = ready ELSE status = dead

Invariants
- an absent message has receiveCount 0
- a ready message has receiveCount < MAX_RECEIVES
- a dead message has receiveCount >= MAX_RECEIVES

Temporal properties
- an inflight message eventually leaves inflight, granted fairness on restore
```

This is the version people read and argue about. Nothing checks it.

### TypeScript

The same spec as a plain TypeScript object, in the shape that [SpecCraft TS](/vs/speccraft-ts) takes. Other
TypeScript model checkers use a similar shape; in [pnueli](/vs/pnueli), a step returns a list of next states instead of
one.

```ts
const MAX_RECEIVES = 2;

type State = {
  status: 'absent' | 'ready' | 'inflight' | 'dead';
  receiveCount: number;
};

export const spec: Spec<State> = {
  init: () => ({ status: 'absent', receiveCount: 0 }),
  actions: [
    // commands
    { name: 'send', guard: (s) => s.status === 'absent', effect: (s) => ({ ...s, status: 'ready' }) },
    {
      name: 'poll',
      guard: (s) => s.status === 'ready',
      effect: (s) => ({ ...s, status: 'inflight', receiveCount: s.receiveCount + 1 }),
    },
    { name: 'delete', guard: (s) => s.status === 'inflight', effect: () => ({ status: 'absent', receiveCount: 0 }) },
    // event
    {
      name: 'restored after timeout',
      guard: (s) => s.status === 'inflight',
      effect: (s) => ({ ...s, status: s.receiveCount < MAX_RECEIVES ? 'ready' : 'dead' }),
    },
  ],
  invariants: [
    { name: 'an absent message has no count', check: (s) => s.status !== 'absent' || s.receiveCount === 0 },
    { name: 'a ready message is under the limit', check: (s) => s.status !== 'ready' || s.receiveCount < MAX_RECEIVES },
    { name: 'a dead message reached the limit', check: (s) => s.status !== 'dead' || s.receiveCount >= MAX_RECEIVES },
  ],
};
```

The checker finds 6 reachable states, and all three invariants hold. There is no temporal property: SpecCraft TS
checks invariants only for now.

### Quint

The same spec in [Quint](/tools/quint). Each action lists the next value of every variable (`status'`), and anything
left out is an error. That is how TLA+ works too.

```
module queue {
  pure val MAX_RECEIVES = 2

  // "absent" | "ready" | "inflight" | "dead"
  var status: str
  var receiveCount: int

  action init = all {
    status' = "absent",
    receiveCount' = 0,
  }

  // commands
  action send = all {
    status == "absent",
    status' = "ready",
    receiveCount' = receiveCount,
  }

  action poll = all {
    status == "ready",
    status' = "inflight",
    receiveCount' = receiveCount + 1,
  }

  action delete = all {
    status == "inflight",
    status' = "absent",
    receiveCount' = 0,
  }

  // event
  action restoredAfterTimeout = all {
    status == "inflight",
    status' = if (receiveCount < MAX_RECEIVES) "ready" else "dead",
    receiveCount' = receiveCount,
  }

  action step = any { send, poll, delete, restoredAfterTimeout }

  // invariants
  val absentHasNoCount = status != "absent" or receiveCount == 0
  val readyIsUnderTheLimit = status != "ready" or receiveCount < MAX_RECEIVES
  val deadReachedTheLimit = status != "dead" or receiveCount >= MAX_RECEIVES
  val allInvariants = absentHasNoCount and readyIsUnderTheLimit and deadReachedTheLimit

  // temporal property: an inflight message eventually leaves inflight,
  // granted fairness on the restore event
  temporal inflightEventuallyLeaves =
    weakFair(restoredAfterTimeout, (status, receiveCount))
    implies always(status == "inflight" implies eventually(status != "inflight"))
}
```

```sh
quint verify queue.qnt --invariant=allInvariants --backend=tlc
quint verify queue.qnt --temporal=inflightEventuallyLeaves --backend=tlc
```

TLC finds the same 6 states. Both checks pass.

### When a rule breaks

Change the restore event so that it always makes the message ready, and forget the limit:

```
status' = "ready",
```

The invariant `readyIsUnderTheLimit` fails, and TLC returns the trace to the broken state:

```
State 1: status = "absent",   receiveCount = 0
State 2: status = "ready",    receiveCount = 0   (send)
State 3: status = "inflight", receiveCount = 1   (poll)
State 4: status = "ready",    receiveCount = 1   (restoredAfterTimeout)
State 5: status = "inflight", receiveCount = 2   (poll)
State 6: status = "ready",    receiveCount = 2   (restoredAfterTimeout)
```

A message that reached the limit is back in the queue for a third delivery.

## Related

- [State machines and FSMs](/concepts/state-machines): why a model checker's spec lists variables and steps, not
  states.
- [TLA+ for TypeScript developers](/tools/tla-plus) and [Quint for TypeScript developers](/tools/quint): the spec
  languages, step by step.
- [TypeScript tools](/ts-tools): the tools that check a spec written in TypeScript.
- Leslie Lamport, [Specifying Systems](https://lamport.azurewebsites.net/tla/book.html): the book on TLA+ specs.
