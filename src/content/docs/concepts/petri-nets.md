---
title: Petri nets
description: What a Petri net is, why it is popular for concurrency, how Petri net tools enumerate and check states, how it compares with TLA+ and Quint, and why workflow-net soundness is the workflow correctness question.
---

A Petri net is a way of describing concurrent systems as tokens moving between places. It is a popular answer to
"[FSMs](/concepts/state-machines) do not scale to concurrency", and it has its own family of checkers.

## Places, tokens, transitions

- **Places** are circles: "hold open", "capture in flight", "timer armed".
- **Tokens** are dots in places. Where the tokens are right now is the state, called the marking.
- **Transitions** are bars with input and output places. A transition can fire when every input place has a token.
  Firing takes those tokens and puts new ones in the output places.

## Why people like it for concurrency

- **Concurrency is built in.** Two tokens in different places are two things happening at once. There is no combined
  state to name, so the approval handler and the timer are two tokens moving on their own.
- **Shared resources are visible.** A shared flag is one place with one token. Whichever transition takes it first
  wins, and the other cannot fire. Mutual exclusion is how the net is drawn.
- **It stays small.** An independent part adds a few places. It does not multiply the drawing the way it multiplies
  an FSM.

## How Petri net tools check a net

- **Reachability graph.** List every marking the net can reach. This is the same as TLC walking every reachable
  state, and it has the same state explosion.
- **Coverability graph** (Karp and Miller). For nets where a place can collect tokens without limit: "grows without
  limit" is written as ω, so some questions about infinite nets can still be answered.
- **Invariants from linear algebra.** Some properties follow from the net's structure alone, with no enumeration. For
  example, "the tokens in these two places always add up to 1" proves mutual exclusion directly.
- **Unfoldings** (McMillan). Keep a partial order of which events cause which, instead of every interleaving. A
  thousand independent events stay a thousand events.
- **Symbolic checking** with decision diagrams, close in spirit to what Apalache does with Z3.

## Tools

| Tool | From | What it does |
|---|---|---|
| [CPN Tools](https://cpntools.org) | Aarhus University, Eindhoven University of Technology | Coloured Petri nets, where tokens carry data, with full state-space analysis. The closest thing to TLA+ in this family |
| [TAPAAL](https://www.tapaal.net) | Aalborg University | Timed-arc Petri nets and temporal-logic model checking. Regularly near the top of the Model Checking Contest |
| LoLA | University of Rostock | Explicit-state checking with strong reductions: stubborn sets (partial-order reduction) and symmetry |
| [ITS-Tools](https://lip6.github.io/ITSTools-web/) | LIP6, Sorbonne University | Symbolic checking with decision diagrams |
| [Tina](https://projects.laas.fr/tina/) | LAAS-CNRS, Toulouse | Time Petri nets |
| [GreatSPN](https://github.com/greatspn/SOURCES) | University of Turin | Stochastic Petri nets for performance models, plus model checking |
| [WoPeD](https://woped.dhbw-karlsruhe.de), [ProM](https://promtools.org) | Process-mining community | Workflow nets and their soundness |

The [Model Checking Contest](https://mcc.lip6.fr), held every year with the Petri Nets conference, compares these
tools on the same models. Its results pages are the best current index.

## Compared with TLA+ and Quint

- **Plain Petri nets have no data.** Tokens are anonymous. A net can say "one capture is in flight", not "a capture of
  42.50 EUR for order o1". Coloured Petri nets add data, and at that point they are about as expressive as TLA+.
- **Drawn, not written.** A net is usually a diagram. That shows concurrency well, but is hard to diff, review in a
  pull request or keep next to the code. TLA+ and Quint are text.
- **One-way translation.** A Petri net is easy to write in TLA+: one variable per place holding its token count, one
  action per transition. The other way is not possible in general.
- **Underneath, the same thing.** The markings and firings of a net are a [state machine](/concepts/state-machines) in
  Lamport's sense. Checking it means walking that state machine, just as TLC does.

## Workflow nets and soundness

A workflow net is a Petri net with one start place and one end place, used for business processes. Its standard
correctness check is soundness:

- every case can always reach the end,
- when it does, nothing else is still running, and
- every step can fire in some run.

That is the durable-execution correctness question under another name. The stuck cache key on the
[TLA+ page](/tools/tla-plus), where requests keep failing and none of them can reach the end, is a soundness failure.
Model checkers ask the same questions of workflow code written as steps, instead of drawn as a net.

## Related

- [State machines and FSMs](/concepts/state-machines)
- [TLA+ for TypeScript developers](/tools/tla-plus) and [Quint for TypeScript developers](/tools/quint)
- [Non-TypeScript tools](/tools/non-ts-tools)
