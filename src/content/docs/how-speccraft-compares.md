---
title: How SpecCraft compares
description: A map of the tools that check state-machine-shaped correctness — where SpecCraft sits, what it trades away to sit there, and how it differs from the closest existing tools in TypeScript.
---

SpecCraft is a **model checker as a library, in TypeScript**: you write the model as
ordinary data and functions in your own language, and the library explores every
reachable state, checks invariants, and hands back a counterexample trace when one
breaks. No new spec language, no compiler between your guards and what actually gets
checked.

That one sentence is a specific spot in a landscape that already has several
well-established corners.

<a href="/positioning.png" class="lightbox-trigger"><img src="/positioning.png" alt="A two-by-two map: new spec language vs. plain code in your language on one axis, exhaustive checking vs. random sampling on the other. SpecCraft sits in the plain-code, exhaustive-checking quadrant alongside Stateright, opposite fast-check (random sampling) and TLA+/Quint/Alloy (new spec language)."></a>

*Click to enlarge.*

Here is the same map as a table, and why SpecCraft's corner is worth having in
TypeScript even though most of the neighboring corners are older and more powerful
along some other axis.

## The landscape

Group tools by two questions: what language is the spec written in, and does the
checker explore every state or sample randomly?

| Corner | What it is | Tools | The trade |
|---|---|---|---|
| **1. Dedicated spec language, industrial checkers** | Write the model in a purpose-built language; a mature checker verifies it. | TLA+ (TLC explicit, Apalache symbolic), Quint, Alloy, FizzBee, SPIN/Promela, P (AWS) | Maximum checking power, including symbolic reasoning over huge value ranges — but the spec is a separate artifact in a separate language your team may not read or maintain. |
| **2. Model checker as a library, in your language** | The model is ordinary code in the language you already use; the library explores it exhaustively. | Stateright (Rust) — the proven occupant. **SpecCraft is the TypeScript entry.** | You keep your language and arbitrary logic in guards and effects. You give up symbolic checking and heavyweight liveness under fairness. |
| **3. Model-based testing, random sampling** | Same idea — commands with preconditions run against a model — but sampled randomly and shrunk on failure, against the real implementation. | fast-check (TS), QuickCheck (Haskell), Hypothesis stateful (Python), proptest (Rust) | Tests the real system, not just a model — which corner 2 mostly doesn't. Adjacent to SpecCraft, not competing: conformance testing (running traces against real code) borrows from this corner. |
| **4. Path coverage over statecharts** | Exhaustive traversal, but the model must already be a statechart; the output is test cases, not invariant violations. | XState graph tools (TS), GraphWalker (Java) | This is the corner people most often mistake for corner 2 in TypeScript — it looks similar but the model has to fit a machine shape first. |
| **5. Systematic concurrency testing of real code** | No separate model at all: control the scheduler and explore interleavings of the actual running code. | Coyote (.NET), loom / shuttle (Rust), Java PathFinder, Concuerror (Erlang) | The most realistic answer to "does my real code have a race," but much harder to build than corner 2, and nothing exists for TypeScript/Node today. |
| **6. Whole-system deterministic simulation** | Run the entire real system inside a simulated world with fault injection. | FoundationDB-style DST, TigerBeetle's VOPR, Antithesis (closed source) | Maximum realism, enormous investment, built per system rather than reused as a library. |
| **7. Proof assistants** | Prove correctness for all cases instead of checking states. | TLAPS, Coq/Lean, Dafny, Ivy | A different sport — proof instead of exhaustive search. |

## Where SpecCraft sits

SpecCraft is in **corner 2**, and that corner is empty in TypeScript. Stateright is the
mature occupant in Rust; nothing comparable exists for TS today (the one attempt is
covered below, and it took a different, weaker path). SpecCraft's bet is that the
corner is worth filling here too: TypeScript is where most workflow and orchestration
code already lives, and the tools people reach for instead — corner 3 and corner 4 —
solve adjacent problems, not this one.

The honest trade for choosing corner 2 over corner 1: you keep your own language and
your guards are genuinely arbitrary code, executed rather than translated — but you
give up symbolic checking (reasoning about a range of a million values as one formula,
the way Apalache does) and full liveness under fairness. For workflow-shaped models —
small, finite, naturally bounded — explicit-state exploration is the right tool and
symbolic checking buys little. If a spec does outgrow explicit checking, the escape
hatch is exporting the same variables, actions, and invariants to Quint, which pairs a
readable spec language with both a random simulator and Apalache's symbolic checker
underneath.

The two nearest false neighbors — the tools people will actually compare SpecCraft to —
are fast-check (corner 3) and XState's graph tools (corner 4). The one-line
differentiation: **exhaustive where fast-check is random, free-form where XState is
machine-shaped.**

## The one TypeScript tool that already tried this: stateproof

[stateproof](https://github.com/HexaField/stateproof) is the closest prior attempt at
corner 2 in TypeScript, and it is worth a direct comparison because its architecture
has a load-bearing flaw that SpecCraft's design avoids by construction.

stateproof is a fluent state-machine builder that compiles your model to TLA+ and
shells out to Java/TLC for the actual exhaustive verification, plus a runtime
interpreter, a small TS-side BFS for test-trace coverage, and conformance adapters
against a real implementation.

Where it breaks:

- **The guards and actions are not really TypeScript.** stateproof captures
  `fn.toString()` and re-parses the source with a hand-rolled tokenizer supporting a
  tiny subset — comparisons, `&&`/`||`, arithmetic, a handful of array methods. No
  helper functions, no destructuring, no closures over anything but literals. Most
  real specs die instantly against this subset. The "plain TypeScript" pitch does not
  hold — it is a new language wearing TypeScript syntax, with a compiler as the trust
  boundary.
- **The compiler can be silently wrong.** Some JS methods compile to TLA+ operators
  that do not exist, so the generated spec is either rejected by TLC or, worse, checks
  something other than what was written if a user happens to define those operator
  names. The model TLC verifies and the model the runtime executes can diverge — the
  worst failure mode for a verification tool, because a green check stops meaning
  anything.
- **Verification requires a Java toolchain.** All exhaustive checking goes through
  TLA+ generation, a temp directory, `java tlc2.TLC`, and regex-parsed stdout. The
  in-process BFS exists but only powers test-trace generation, not invariant checking.
- **The model is forced into a state-machine shape.** A mandatory `states()` enum with
  `from`/`to` transitions and a flat context. Free-form, deeply nested state has
  nowhere natural to go — the same shape restriction that limits the XState-graph-tools
  corner, wearing a different hat.
- **No parameterized actions or data nondeterminism.** A transition is one name, one
  guard, one action — no "pick one of N pending items," no "a value different from the
  last one." The composition escape hatch requires writing raw TLA+ strings, which
  quietly drops the "no new language" promise exactly where the interesting problems
  live.

What SpecCraft does differently, as a direct consequence of running the model instead
of compiling it:

1. **Actual TypeScript as the spec language.** Guards and effects are ordinary
   functions that get executed, never source-parsed — helpers, closures, the full
   language, because the checker is the runtime.
2. **Zero translation gap.** The model that gets exhaustively checked is byte-for-byte
   the model you wrote. There is no compiler in between, so there is nothing to trust
   beyond the code itself.
3. **No external toolchain.** In-process BFS, callable as a plain library function
   inside a test runner or CI — installing it is one package.
4. **Free-form state.** Any JSON-shaped state — nested records, no forced status enum.
   A state machine is a special case SpecCraft can express, not the required shape.
5. **Results shaped like the actual method:** reachable state count, the complete list
   of endings and stuck states, the shortest counterexample per invariant, and
   known-false beliefs that must keep failing — not just a pass/fail parsed out of a
   solver's stdout.

The one line that summarizes the difference: **stateproof translates your spec to
another language and asks you to trust the translator; SpecCraft runs your spec.**

To be fair to what a translation-based tool buys you and SpecCraft (at this stage)
does not: a runtime interpreter that doubles as the implementation, conformance
adapters, and liveness checking via TLC. The conformance side is worth building next —
it is the natural companion to a model that is already the test oracle. The runtime
interpreter is, deliberately, not something SpecCraft plans to copy: "the spec is the
implementation" collapses the one separation the whole method depends on — the spec
stays the oracle, the code gets verified against it, and the two are never the same
artifact.

## A second axis: model, or the real thing

The map above answers "what language is the spec in." It doesn't answer a different
question: does the checker run against a model of the system, or the real running
code? That axis cuts across the first one — Coyote, loom/shuttle, and DST/Antithesis
(corners 5 and 6) check the real system directly with no separate model at all, while
SpecCraft, TLA+, Quint, and XState's graph tools all check a model of it instead.
fast-check sits in between: it samples a model, then drives the real implementation
with the sampled sequence.

<a href="/model-vs-real-code.png" class="lightbox-trigger"><img src="/model-vs-real-code.png" alt="A spectrum from 'checks a model of the system' to 'exercises the real running code'. Dedicated spec languages, XState graph tools, Stateright, and SpecCraft sit at the model end; stateproof and property-based testing (fast-check, QuickCheck, Hypothesis) bridge the middle; concurrency testers (Coyote, loom, shuttle) and whole-system simulation (DST, Antithesis) sit at the real-code end. SpecCraft is annotated: today, model only; conformance testing is next."></a>

*Click to enlarge.*

This is exactly the gap conformance testing closes: SpecCraft's model stays the
oracle, and a conformance harness (the natural next module, discussed above) is what
moves a spec from "checked in isolation" to "checked against the code that ships,"
without ever collapsing the two into the same artifact the way stateproof's runtime
interpreter does.

<script>
  (() => {
    const overlay = document.createElement('div');
    overlay.className = 'js-lightbox-overlay';
    overlay.hidden = true;
    const img = document.createElement('img');
    overlay.appendChild(img);
    document.body.appendChild(overlay);

    function close() {
      overlay.hidden = true;
      img.src = '';
    }

    overlay.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hidden) close();
    });

    document.querySelectorAll('.lightbox-trigger').forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        const triggerImg = trigger.querySelector('img');
        if (!triggerImg) return;
        e.preventDefault();
        img.src = triggerImg.src;
        img.alt = triggerImg.alt;
        overlay.hidden = false;
      });
    });
  })();
</script>
