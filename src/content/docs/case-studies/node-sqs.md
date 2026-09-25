---
title: "A Small SQS Clone"
description: Building the message core of a minimal AWS SQS in TypeScript spec-first, with a plain-text spec, a Quint model checked by TLC, and conformance tests that hold the code to the model.
---

node-sqs is a learning project: a minimal AWS SQS in TypeScript and Node.js. Standard queues only, at-least-once
delivery, visibility timeouts, long polling, dead-letter queues, and later replication across nodes with no central
coordinator. This page is about one part of it, `queue-core`: the life of a message inside one queue.

Unlike the [config document workflow](/case-studies/config-document-workflow), this one was built spec-first. There
was no tangled code to rescue. The question was whether writing the spec first pays off on new code.

## The system

A message is sent, received, and then either deleted or, after a visibility timeout, made visible again. Each receive
hands out a new receipt handle, and only the latest handle can delete the message. A long poll waits for a message
instead of answering empty. After too many receives the message moves to a dead-letter queue (DLQ), and a redrive
moves it back.

Every rule is simple on its own. The trouble is how they overlap: a delete that arrives after the timeout, a waiter
that is open when a message is sent, a limit that changes while a message is being received.

## How it was built

Each change goes down the same steps, in this order:

1. **The spec page**, written by hand, in plain markdown: constants, variables with small bounds, actions as guard
   and effect, invariants, liveness claims. Every non-obvious choice gets a Considerations entry saying why.
2. **A Quint model**, translated from the page by an LLM, and checked by TLC: every invariant over every reachable
   state, and each liveness claim under its own fairness.
3. **A TS oracle**: a second translation of the same page, done from the page and not from the Quint file, so each
   translation checks the other.
4. **The real code**, written against the oracle. It has no bounds: the "two messages, two handles" limits exist only
   in the model and the tests.
5. **Conformance tests** step the code and the oracle through the same moves and compare the full state after every
   step, with all invariants checked each time. They include chosen traces and 500 random sequences from fast-check.
   Real timer durations, which the model leaves out, get their own fake-clock tests.

The rule for surprises: a surprise is a spec question. The answer is a spec edit, then every step below it again,
never a patch further down.

The model has no clock. The timeout event can fire at any moment while a message is in flight, which covers every
possible duration:

```text
action restoredAfterVisibilityTimeout(m) = all {
  status.get(m) == "inflight",
  status' = status.set(m, "ready"),
  queueOf' = if (deadLetters(m)) queueOf.set(m, "dlq") else queueOf,
  // ready keeps the handle so the next poll picks a different one; a move clears it
  currentHandle' = if (deadLetters(m)) currentHandle.set(m, "null") else currentHandle,
  ...
}
```

The core was built in five passes: the basic lifecycle, receipt handles, long polling, `maxReceiveCount` as a queue
setting, and the DLQ as a second queue.

## What it caught

**A late delete stole another worker's message.** Worker 1 receives a message. Its timeout passes and worker 2
receives it. Then worker 1's late delete arrives. At first the handle was the message id, so that delete removed the
message worker 2 was holding. Found by reviewing the app code. The fix is the receipt handles pass: every receive
gets a new handle, and only the current one deletes.

**The handle feature did nothing.** The first draft of the spec had every poll write handle `r1`, so the old and the
new handle were always the same. Found while writing the spec, before any tool ran.

**Clearing the handle brought the race back.** A review suggested clearing the handle when the timeout restores a
message. That would let the next poll hand out the same handle again, and the stale delete works again. The spec
keeps the handle on restore, and the next poll picks a different one.

**A liveness claim that could not fail.** "An active waiter eventually resolves" stayed true even with the rule that
serves waiters deleted, because every waiter can just expire. The claim that catches a broken handoff is different:
a waiter never waits forever while a message is ready, with fairness on the served event only. To prove the claim
can fail, the served rule was broken on purpose (it asked for an in-flight message instead of a ready one), and TLC
went red.

**The body was stored after the send.** In the app, `sendOne` saved the message body after `core.send`. With a long
poll waiting, `send` delivers the message inside that same call, so the receive ran before the body existed and
failed with "no stored body". Found by a test, not by review. The fix stores the body first and removes it if the
send is refused.

**An invariant that checked nothing.** In the model, 0 stood for "no value", so one invariant held even when the value
was never written. The checker would have stayed green on exactly the mistake the invariant is there to catch. After
the fix, the write was removed on purpose to confirm TLC goes red.

**A belief the next feature broke.** "A message in the DLQ has no handle" was an invariant from the handles pass. Its
reason was "nothing receives from the DLQ", and the DLQ pass exists to make the DLQ receivable. Writing that pass
showed a second problem: dead and dead-in-flight were copies of the normal rules. The spec was rewritten with the DLQ
as an ordinary second queue. That removed the special DLQ actions, and the cross-queue delete race could no longer
happen, because a delete is sent to a queue and a handle from the other queue never matches.

## Numbers

- Pass 1: about 288 states, depth 11. After the DLQ pass: 9,896 states, depth 23.
- TLC walks all of them in about a second. Apalache's bounded check went from 82 seconds to over 10 minutes and was
  dropped for TLC.
- About 340 lines of spec, a 364-line Quint model, and about 1,100 lines of conformance tests.
- Code changes per pass were small: the hard thinking happened in the spec and the checker.

## What it costs, honestly

- **Editing the spec page by hand is slow and error-prone.** In one pass: a flipped comparison in an invariant, an
  effect that forgot to clear a field, an effect that read a value the same step had just changed. All were caught
  by reading, none by a tool, because no tool checks the page. The next step is to mirror every page edit into the
  Quint file right away and run a quick check, so the checker reviews while you think.
- **Quint has boilerplate.** A hand-written list of all actions, and `x' = x` for every variable an action does not
  change.
- **The checks need checking.** Two of the claims above passed for the wrong reason. Every liveness claim, and every
  invariant that could be empty, needs a test that breaks the model on purpose and sees the checker go red.

## Where it stands

- **queue-core:** done through the DLQ pass. Postponed: long polling on the DLQ, sending straight to the DLQ,
  deleting the DLQ, and a redrive policy on the DLQ itself.
- **Replication** (three copies, two to write, two to read, no leader): a draft spec with its variables and guards, not
  yet checked. One design error, read repair bringing deleted messages back, was caught in the notes, before the
  spec.
- **Membership:** not started.

Replication is harder in kind, not in size. In `queue-core` a red trace usually meant the translation was wrong. In
replication it will mean the protocol is wrong.
