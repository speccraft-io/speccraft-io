---
title: "Case Study: A Config Document Workflow"
description: How a small Temporal workflow became impossible to reason about, and how a two-page formal spec gave the control back.
---

This is the story of a small workflow that could not be understood, and of the
method that fixed it. Not fixed the bugs first, fixed the understanding. The
bugs followed.

It is modeled on a real production Temporal workflow I wrote myself. After
months of refactoring it, I had clean layers, good types, and no answers. The
case study below is a synthetic twin of that workflow: same shape of trouble,
none of the product details.

## The system

A config document. A user uploads files, and each file goes through a
conversion. Once two files are converted, a background job detects a document
name. Another job keeps an archive of the converted files. A third builds a
summary from the current name and the converted files. The user can rename the
document, delete files, download the archive, request the summary, submit the
document, or delete it.

That is the whole thing. Three background jobs, a handful of user actions, one
document. It fits in one paragraph, and every rule alone is trivial.

## The trouble

The rules interleave. The user renames the document while the summary job is
running and a file finishes converting in the same moment. What should happen?
Is the running summary still valid? Should it be cancelled? Served anyway?

The answer was not in the code. It was not anywhere, because nobody had ever
decided it. The code did something, and what it did depended on the order the
events happened to arrive in.

This is the specific kind of stuck worth recognizing:

- You can name two events that could arrive in either order, and you cannot
  say what should happen.
- Hand-made boolean flags multiply around the same spot. Each one is a patch
  over an ordering problem nobody has stated.
- Every "what if" question ends in an opinion, not an answer.

The usual medicine does not work here. I refactored for weeks: better
encapsulation, a functional core, types that make illegal states
unrepresentable. All of it real improvement, none of it help. The layers were
fine. I was still lost.

Diagrams do not work either, and it is worth being honest about why. A state
diagram of this system needs a node for every combination of thirteen
variables. A sequence diagram shows exactly one ordering per drawing, and the
problem lives in the orderings you did not draw. A head cannot enumerate
combinations. A machine can.

## The move: write the system down

The fix was to write a formal spec. Not TLA+, not math. Two pages of plain
text.

**Page 1 is the state.** Every variable, with a bounded set of values and a
starting value:

```text
name:    n1 | n2 | null
files:   { f1, f2, f3: absent | converting | converted | removed }
archive: null | { f1, f2, f3: boolean }
summary: null | { fromName: n1 | n2, f1, f2, f3: boolean }
status:  new | submitted | deleted
plus job flags (nameDetecting, fileArchiving, summaryGenerating)
and requested flags (submitRequested, summaryRequested, archiveRequested)
```

Two names and three files are enough. If a race exists, it shows up with two
of something; ten files find nothing new. Note that the summary records the
name it was built from. Without that one field, "the summary is stale" cannot
even be written down.

**Page 2 is the rules.** One action per message the system can receive. Each
action is a guard (when it may happen) and an effect (what it writes):

```text
rename document to n2
  guard:  status is new
  effect: name = n2; cancel a running summary job
          (the job reads the name; the write changed what it reads)
```

Writing this page is where most of the missed requirements surface, before any
tool runs. Every corner case you meet is a product decision: decide it, write
the reasoning down, move on. The rename rule above is one of those decisions:
a running job is cancelled the moment a write changes something the job reads.
That single sentence replaced a pile of flags.

**Page 3 is the claims.** One-sentence beliefs about the whole system:

```text
if status is submitted, the summary matches the current name and the converted files
if a summary exists, its name is not null
if status is deleted, everything is reset
a requested download eventually ends: served, or released with an error
```

## The machine does the rest

The two pages translate mechanically into a small program: the state as an
object, each action as a guard function and an effect function. An LLM does
this translation fine, because it is transcription, not design.

Then a checker walks every reachable state. Breadth-first search, a visited
set, about 80 lines of machinery. For this workflow that is 283,951 reachable
states, enumerated in seconds. In return you get answers no amount of staring
gives you:

- **The complete list of endings.** This system has exactly one: the deleted
  document. Every other story loops forever by design. When the endings list
  surprises you, the spec is wrong, and you found out at the cheapest
  possible moment.
- **No one waits forever.** Every state where someone requested something and
  nothing can happen is found, with the exact sequence of events that leads
  there.
- **Every claim proven or refuted.** A refuted claim comes back as the
  shortest trace that breaks it. You read the trace like a story: upload,
  rename, conversion finished, and there is the hole.

## What it actually caught

Three real bugs, each invisible to normal testing, each found by a different
layer of the method.

**Submitting with a stale artifact hangs forever.** No job ever runs on a
submitted document. So if submit completes while the archive is out of date,
every later download request waits for a fix that can never come. Found while
writing the rules, by walking them. The fix is in the submit guard: submit
completes only when the artifacts match.

**A pointless cancel starves the summary.** Renaming the document to the name
it already has cancelled the summary job, for nothing changed. A user (or a
retry loop) repeating that rename postpones the summary forever. Every single
state looks healthy; the run as a whole never serves. This is a liveness bug,
and only the temporal check ("once the user goes quiet, every wait ends")
could see it. The fix is the cancel rule taken seriously: cancel only when the
write changes what the job reads.

**The library read stale state.** The second implementation used XState, and
inside a transition, reading the machine through getSnapshot() returns the
state from before the transition. By design. The archive job launched with a
stale file list. The model's invariants, asserted on the running code after
every step, caught it on the first trace.

That last one matters for a reason beyond the bug: the model is not only a
design tool. It stays alive as the oracle the implementation is tested
against, replaying traces and random runs against the real code and comparing
every field.

## What it costs, honestly

Less than its reputation says.

- **Scope.** You spec the subsystem that needs it, maybe 5-10% of a project.
  The rest stays traditional. A single Temporal workflow can carry its own
  spec while the monolith around it never hears about any of this.
- **Skill.** The hard part is thinking in variables, guards, effects, and
  invariants, in plain text. That is a week of practice, not a degree. The
  translations into runnable models and test harnesses are mechanical, and an
  LLM does the mechanical part.
- **Tools.** A homemade checker is 80 lines and teaches you what is inside
  the box. When you want liveness (the "eventually" claims), you hand the
  same model to a standard tool. You still do not need to write TLA+ by hand
  to get there.

## Why bother

Because the alternative is the state I started in: a system I built, could
not explain, and was afraid to touch.

The main gain is not correctness. It is comprehension. After the spec, every
"what happens if" question about this workflow has an answer that is a trace,
not an opinion. The spec is two readable pages that new people can absorb in
an hour, and when a rule changes, the change starts on those pages and every
layer below re-checks itself in seconds.

And the honest version of "are we bug-free": one hundred percent, for the
claims written down, within the stated bounds. The checker proves answers; it
does not ask questions. Knowing what the system must guarantee is still your
job. Now you have a place to write it down and a machine that holds you to it.
