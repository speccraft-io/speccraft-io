---
title: State machines and FSMs
description: What a state machine is in Lamport's sense, how a finite state machine (FSM) differs, why hand-drawn FSMs grow unwieldy and miss races, and why a model checker's state machine does not.
---

"State machine" and "FSM" are often used as if they meant the same thing. They do not, and the difference explains
most arguments about whether state machines scale.

A typical example is [this LinkedIn thread](https://www.linkedin.com/feed/update/urn:li:activity:7507784578888237057/).
The post quotes Lamport's definition of a state machine. A comment replies that FSMs start simple, grow unwieldy as
requirements change, and lead to races when logic spans execution contexts, so Petri nets are better. The comment is
right about FSMs, but the post was about the general state machine, and the two get treated as one.

## State machine: the general idea

Leslie Lamport's definition: a state machine is a set of states, a set of initial states, and a next-state relation
that says which steps are allowed from each state. A behavior is a sequence of states, each one reached from the one
before by an allowed step.

A state is the values of all the variables. Nothing says there are few of them, or that they have names. A counter
that can grow forever is a state machine. So is a whole program: its state is every variable plus where each thread
is, and each step is one statement running.

## FSM: one kind of state machine

A finite state machine is a state machine with a finite number of states. In practice the word also means a way of
writing one: every state named (`Idle`, `Capturing`, `Done`) and every transition drawn as an arrow or written as a
`switch` case.

So every FSM is a state machine, but not every state machine is an FSM.

## Why hand-drawn FSMs grow unwieldy

- **States multiply.** Two independent parts with 3 states each make 9 combined states. Add a flag and it is 18. Each
  one must be named and drawn by hand, so every new requirement makes the diagram bigger.
- **Races fall between diagrams.** Logic that spans execution contexts (an interrupt and a main loop, a signal
  handler and a timer, two workers) gets one diagram per context. Each diagram looks right. The bug is in how they
  interleave, and no single diagram shows that.

Both complaints are fair. Both are about writing states by hand, not about state machines.

## FSMs in TypeScript

These are the libraries TypeScript teams use to write states by hand:

| Library | What it is |
|---|---|
| [XState](https://stately.ai/docs/xstate) | Statecharts and actors, about 19 million npm downloads a month in September 2026. [`xstate/graph`](https://stately.ai/docs/xstate-graph) walks a machine's graph to generate test paths |
| [Robot](https://github.com/matthewp/robot) (`robot3`) | A small, functional FSM library |
| [Zag.js](https://zagjs.com) | State machines behind UI components: menus, dialogs, date pickers |
| [javascript-state-machine](https://github.com/jakesgordon/javascript-state-machine) | The classic FSM library: named states and transitions |
| [effect-machine](/vs/effect-machine) | Statecharts for Effect, with bounded exploration and invariants |

XState's statecharts (David Harel's extension of FSMs) are the standard answer to the first complaint. Nested states,
parallel regions and extra data (`context`) stop the diagram from multiplying: two independent parts become two
regions instead of 9 combined states.

The second complaint remains. Each machine or actor is checked on its own. The race between two actors, or between a
machine and the `async` code it calls, is outside every diagram, and no library here tries every interleaving of it.
See [SpecCraft vs TypeScript tools](/how-speccraft-compares) for the tools that do.

## How a model checker's state machine differs

TLA+, Quint and SpecCraft use Lamport's kind. You write the variables and the steps, and the checker works out the
states:

| | Hand-drawn FSM | TLA+, Quint, SpecCraft |
|---|---|---|
| You write | Every state and every arrow | The variables and the steps |
| States | You name all of them, maybe 5 to 20 | The checker finds them, thousands or millions |
| A new requirement | Multiplies the states you draw | Adds a variable or a step |
| Several execution contexts | One diagram each; the race falls between them | All of them in one state; every interleaving is tried |

The payment hold on the [TLA+ page](/tools/tla-plus) is an example: two handlers, each with its own position, and
shared flags. It is written as about 10 lines of steps. TLC finds 13 states and the race among them.

One subtlety: a model checker can only walk a finite state space, which is why models use 2 or 3 workers. So the
model it checks is technically an FSM. The difference is that nobody writes its states by hand.

## Related

- [Petri nets](/concepts/petri-nets): another way to describe concurrency, which also turns into a state machine when
  it is checked.
- [Known methods](/approaches-to-correctness): the families of approaches SpecCraft draws on.
- Leslie Lamport, [Computation and State Machines](https://lamport.azurewebsites.net/pubs/state-machine.pdf).
