---
title: LemmaScript vs SpecCraft
description: LemmaScript proves TypeScript functions correct for every input with Dafny or Lean. This page runs its linear search example with Dafny, shows a passing and a failing proof, then compares it with SpecCraft, which explores every ordering of events in a bounded model.
tableOfContents: true
adoption:
  github: midspiral/LemmaScript
  npm: 'lemmascript'
  created: 2026-03-30
---

[LemmaScript](https://github.com/midspiral/LemmaScript) is a verification toolchain for TypeScript by
[Midspiral](https://www.linkedin.com/company/midspiral/), currently a tech preview. It is the most serious
"formal methods for TypeScript" project we know of.

**How close to SpecCraft:** far, and complementary. It proves pure functions correct for every input; SpecCraft
explores orders of events.

## Using LemmaScript

We ran the example below with `lsc` 0.6.4 and Dafny 4.11.0. The code is LemmaScript's own
[linearSearch.ts](https://github.com/midspiral/LemmaScript/blob/main/examples/linearSearch.ts), and the output is
from our run.

### Install and set up

```sh
npm install -g lemmascript
```

- **Node 18 or newer** for `lsc`, the LemmaScript compiler.
- **Dafny 4 or newer** for the Dafny backend. `lsc` generates Dafny and calls `dafny verify`.
- **The Lean 4 backend** needs elan plus forks of Loom and Velvet cloned next to the project. The steps below use
  Dafny only.
- **An existing codebase** opts in per function: once any function in a file has `//@ verify`, `lsc` skips every
  function in that file that is not marked.

### A first proof

A contract is a set of `//@` comments inside ordinary TypeScript. `tsc` and the bundler ignore them.

```ts
// linearSearch.ts (shortened: header comment removed)
export function linearSearch(arr: number[], target: number): number {
  //@ ensures \result >= -1 && \result < arr.length
  //@ ensures \result >= 0 ==> arr[\result] === target
  //@ ensures \result === -1 ==> forall(k: nat, k < arr.length ==> arr[k] !== target)
  //@ type i nat

  let i = 0;
  let result = -1;

  while (i < arr.length) {
    //@ invariant 0 <= i && i <= arr.length
    //@ invariant forall(k: nat, k < i ==> arr[k] !== target)
    //@ invariant result === -1 || (result >= 0 && result < arr.length && arr[result] === target)
    //@ done_with result !== -1 || !(i < arr.length)
    //@ decreases arr.length - i
    if (arr[i] === target) {
      result = i;
      break;
    }
    i = i + 1;
  }

  return result;
}
```

What each annotation does:

- **`//@ ensures`** is a postcondition. `\result` is the return value, `==>` is "implies", and `forall(k: nat, ...)`
  quantifies over every index. Together the three lines say: the result is a valid index or -1, a found index really
  holds the target, and -1 means the target is nowhere in the array.
- **`//@ type i nat`** makes `i` a natural number in the proof. A plain `number` becomes an unbounded integer.
- **`//@ invariant`** is a loop invariant: true before the loop and after every pass. The second one, "nothing
  before `i` is the target", is what lets the prover conclude the -1 case.
- **`//@ decreases`** proves the loop ends: `arr.length - i` goes down on every pass and cannot go below zero.
- **`//@ done_with`** says what holds when the loop exits through `break`. Lean needs it; Dafny handles `break` on its
  own.
- **`//@ requires`** (not used here) is a precondition, for example `lo <= hi` in the library's `clamp` example.

### Running it

`lsc gen` translates the file, and `lsc check` regenerates it and runs Dafny:

```sh
lsc gen --backend=dafny src/linearSearch.ts
lsc check --backend=dafny src/linearSearch.ts
```

Real output (paths shortened):

```text
Generated: .../src/linearSearch.dfy.gen
Created: .../src/linearSearch.dfy
Generated: .../src/linearSearch.dfy.gen
Running dafny verify...

Dafny program verifier finished with 2 verified, 0 errors
```

The generated Dafny follows the TypeScript line for line: the `while` stays a `while`, `arr.length` becomes `|arr|`,
and each `//@` line becomes a Dafny clause:

```dafny
// linearSearch.dfy (shortened)
method linearSearch(arr: seq<int>, target: int) returns (res: int)
  ensures (res >= -1)
  ensures (res < |arr|)
  ensures ((res >= 0) ==> (arr[res] == target))
  ensures ((res == -1) ==> forall k: nat :: ((k < |arr|) ==> (arr[k] != target)))
```

To see a failure, we changed `result = i` to `result = i + 1`, an off-by-one. `lsc check` then says (shortened):

```text
Running dafny verify...
linearSearch.dfy(24,2): Error: a postcondition could not be proved on this return path
   |
24 |   return result;
   |   ^^^^^^^^^^^^^^

linearSearch.dfy(5,15): Related location: this is the postcondition that could not be proved
  |
5 |   ensures (res < |arr|)
  |                ^

linearSearch.dfy(24,2): Error: a postcondition could not be proved on this return path
   ...
linearSearch.dfy(6,36): Related location: this is the postcondition that could not be proved
  |
6 |   ensures ((res >= 0) ==> (arr[res] == target))
  |                                     ^^

Dafny program verifier finished with 1 verified, 2 errors
```

The exit code is 1, so the same command fails a CI job.

### What you get

- **A proof, or the clauses that could not be proved.** A pass holds for every array and every target, not for sampled
  inputs. A failure names each postcondition, invariant or bound that the prover could not show, with its line in
  the generated Dafny.
- **No counterexample input.** The error says which promise is not kept, not which array breaks it. Here both broken
  clauses point straight at the off-by-one.
- **Two Dafny files per source.** `foo.dfy.gen` is always regenerated; `foo.dfy` starts as a copy and is where helper
  lemmas and asserts go. The diff between them must be additions only, and `lsc check` enforces that.
- **CI.** `lsc check` with no file checks every file listed in `LemmaScript-files.txt`, and the reusable GitHub
  Actions workflow `midspiral/LemmaScript/.github/workflows/verify.yml` runs the same list.

When a proof fails, the fix goes either in the TypeScript (tighten a `requires`, weaken an `ensures`, add an
`invariant` or `decreases`) or in `foo.dfy` (a helper lemma or an `assert` that nudges the prover). After editing the
TypeScript, `lsc regen` three-way merges the new translation into `foo.dfy` and keeps the proof additions.

### Tips

From LemmaScript's getting-started guide:

- **Start with small pure functions:** string helpers, predicates, parsers without I/O.
- **Never delete `foo.dfy` and run `gen` again.** That throws away every proof addition; use `regen`.
- **Narrow a hard proof** with `dafny verify --filter-symbol=<name>` or `--isolate-assertions`.
- **Do not let an agent use `//@ assume`.** It tells Dafny to trust an obligation without proof, so the proof stops
  meaning anything.

### Limits

- **Tech preview.** Unsupported TypeScript methods and narrowing patterns still come up; the guide expects you to fix
  some of them in LemmaScript itself.
- **The translation has a model.** Numbers become ideal integers, and some TypeScript unions cannot be translated.
- **I/O is the trust boundary.** The case studies prove the pure core and name the UI, network, Durable Objects and
  WebSockets as unverified.

## What LemmaScript is

- A translator from annotated TypeScript to Dafny, or to Lean 4 via Velvet, construct for construct. Their
  [blog post on shallow embedding](https://lemmascript.org/blog/shallow-embedding/) explains why: the output stays
  close to human-written Dafny, which is what LLMs are good at.
- An LLM writes the proof steps the solver cannot find on its own. The human is not meant to touch anything formal.
- Over twenty case studies, from greenfield apps to in-place verification of real projects (hono's security
  middleware, node-casbin, opencode's permission system and patch parser, balanced-match).

## Compared with SpecCraft

| | LemmaScript | SpecCraft |
|---|---|---|
| Question it answers | Is this function correct for every input? | Can some order of events break a rule? |
| Technique | Deductive proof (Dafny / Lean) | Exhaustive state exploration (explicit-state model checking) |
| Sweet spot | A pure domain core: reducers, splitters, permission checks, parsers | Coordination: handlers, async jobs, timers, replies arriving in any order |
| What you get back | A proof, or a failed proof obligation | A verdict, or the shortest trace that breaks the rule |
| Bounds | None: all inputs | Small bounded model (small scope) |
| Toolchain | TypeScript plus Dafny or Lean, and an LLM for the proofs | TypeScript only, runs in-process |

- **LemmaScript covers all inputs, and data.** Money that never leaks, sums, rankings, graph reachability: properties
  over real-sized values are what a proof handles and a bounded search cannot. It is also further along, with many
  case studies, a VS Code extension and a CI workflow.
- **SpecCraft covers the order of events.** Dafny proves sequential code; it has no notion of three async jobs in
  flight or a reply landing between a check and its write. That is the boundary LemmaScript's case studies draw, and
  it is where SpecCraft works.
- **SpecCraft has nothing in between.** The spec runs as TypeScript, so there is no translation to trust, no Dafny
  or Lean to install, no proof to write, and a failure comes back as a concrete trace.
- **They fit together.** Prove the pure core with LemmaScript and check the coordination around it with SpecCraft.
  SpecCraft takes from it contracts as comments, one file list for local runs and CI, and generated files that may
  only gain additions.

## Links

- LemmaScript on GitHub: https://github.com/midspiral/LemmaScript
- LemmaScript blog: https://lemmascript.org/blog/
- Midspiral on LinkedIn: https://www.linkedin.com/company/midspiral/posts/
