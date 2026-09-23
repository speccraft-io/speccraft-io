---
title: Lean for TypeScript developers
description: A practical first look at Lean from a TypeScript project. Prove a pricing function right for every input, see what a failed proof tells you, and check that the TS code gives the same answers as the proven copy.
---

[Lean](https://lean-lang.org) is a programming language that can also check proofs. You write a function, then you
write a claim about it ("the result is never negative"), and Lean checks that the claim holds for every possible
input. Not for the inputs you thought of. For all of them.

This page shows how to use it next to a normal TypeScript project, with one small example. No math background needed.

## Why you would want this

Unit tests check the cases you wrote. Here is a normal discount function and two normal tests:

```ts
// src/pricing.ts
export function applyDiscount(priceCents: number, percent: number, capCents: number): number {
  const discount = Math.min(Math.floor((priceCents * percent) / 100), capCents);
  return priceCents - discount;
}
```

```ts
// src/pricing.test.ts
test('20% off 50.00', () => {
  expect(applyDiscount(5000, 20, 10000)).toBe(4000);
});

test('discount is capped', () => {
  expect(applyDiscount(5000, 50, 1000)).toBe(4000);
});
```

Both tests pass. The function still has two bugs:

- A `percent` over 100 (say, two coupons stacked) makes the price negative: `applyDiscount(5000, 150, 10000)` is
  `-2500`.
- A negative `percent` (a bad value from an admin form) makes the price go up.

A test only finds these if someone thinks to write that exact case. Lean finds them because it has to cover every
case, so it gets stuck on the ones you missed.

## When Lean fits

- Pure functions with rules that must always hold: prices, fees, limits, rounding, permissions, date ranges, parsers.
- The function is small, and a wrong answer costs real money or trust.
- You can say the rule in one sentence: "the price never goes below zero".

Lean is itself a pure functional language. A pure TS function (same inputs give the same output, no mutation, no
I/O) copies into Lean almost line for line, as `applyDiscount` does below. Code written in a functional style in TS,
with `map`, `filter`, `reduce` and recursion instead of loops over mutable variables, is the easiest to bring over.
Code with mutable loops, classes or `await` has to be rewritten into pure style first. That is more work, and the
copy is more likely to drift from the original. For loops and mutation, [Dafny](/tools/dafny) is the closer fit.

Lean is not the tool for "what happens when two requests arrive at the same time". That is about the order of
events, not one function. See the Quint page for that.

## Install

```sh
curl https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh -sSf | sh
```

This installs `elan` (like `nvm`, for Lean versions), `lean` and `lake` (like `npm`, for Lean projects). For the
editor, install the "Lean 4" extension in VS Code. It shows the proof state next to your code as you type.

Create a Lean project in a `lean/` folder inside your TS repo:

```sh
mkdir lean && cd lean
lake init discount
rm -rf .git .github README.md
lake build
```

`lake init` sets the folder up as its own git repo with its own CI workflow. Inside an existing repo you do not want
either, so remove them. The full layout is in [Project layout and CI](#project-layout-and-ci).

## Step 1: copy the function into Lean

Lean does not read TypeScript. You rewrite the function in Lean, by hand. For small pure functions this is a few lines:

```lean
-- Discount/Pricing.lean
def applyDiscount (price percent cap : Int) : Int :=
  price - min (price * percent / 100) cap

#eval applyDiscount 5000 20 10000
#eval applyDiscount 5000 150 10000
```

`def` is like `function`. The last line of the body is the return value. `Int` is a whole number of any size, so the
Lean version works in cents, like the TS version. `#eval` runs the function during the build, like a quick
`console.log`.

## Step 2: write the rule, and let the proof fail

Now the rule, written as a `theorem`: for any price that is zero or more, the result is zero or more.

```lean
theorem never_negative (price percent cap : Int)
    (hPrice : 0 ≤ price) :
    0 ≤ applyDiscount price percent cap := by
  unfold applyDiscount
  omega
```

How to read it:

- `(price percent cap : Int)`: for any three whole numbers.
- `(hPrice : 0 ≤ price)`: given that the price is not negative. This is an assumption, like a precondition.
- `0 ≤ applyDiscount price percent cap`: the claim.
- `by unfold applyDiscount; omega`: the proof. `unfold` swaps in the function's body. `omega` is a built-in solver for
  claims about whole numbers with `+`, `-`, `<` and `≤`. You do not write the steps yourself.

Run `lake build`:

<a href="/assets/tools/lean/lean-proof-fails.png" class="lightbox-trigger"><img src="/assets/tools/lean/lean-proof-fails.png" alt="lake build output. The two #eval lines print 4000 and -2500. Then: error at line 11, omega could not prove the goal, with a possible counterexample where a is price, c is price * percent / 100, and a - c is at most -1. The build fails."></a>

This is the useful part. Lean does not just say "no". It shows the kind of input that breaks the claim:

- `a := price`, `c := price * percent / 100` (the discount).
- `a - c ≤ -1`: the discount is bigger than the price.

That happens exactly when `percent` is over 100. The `-2500` from `#eval` confirms it.

## Step 3: fix the function, and prove all three rules

Clamp the percent to 0..100, then prove three rules: never negative, never more than the original price, and the
discount never goes over the cap.

```lean
def clampPercent (percent : Int) : Int :=
  max 0 (min percent 100)

def applyDiscount (price percent cap : Int) : Int :=
  price - min (price * clampPercent percent / 100) cap

theorem discount_le_price (price percent : Int) (hPrice : 0 ≤ price) :
    0 ≤ price * clampPercent percent ∧ price * clampPercent percent ≤ price * 100 := by
  have h0 : 0 ≤ clampPercent percent := by unfold clampPercent; omega
  have h1 : clampPercent percent ≤ 100 := by unfold clampPercent; omega
  exact ⟨Int.mul_nonneg hPrice h0, Int.mul_le_mul_of_nonneg_left h1 hPrice⟩

theorem never_negative (price percent cap : Int)
    (hPrice : 0 ≤ price) :
    0 ≤ applyDiscount price percent cap := by
  have := discount_le_price price percent hPrice
  unfold applyDiscount
  omega

theorem never_more_than_price (price percent cap : Int)
    (hPrice : 0 ≤ price) (hCap : 0 ≤ cap) :
    applyDiscount price percent cap ≤ price := by
  have := discount_le_price price percent hPrice
  unfold applyDiscount
  omega

theorem discount_within_cap (price percent cap : Int) :
    price - applyDiscount price percent cap ≤ cap := by
  unfold applyDiscount
  omega

#guard applyDiscount 5000 20 10000 == 4000
#guard applyDiscount 5000 150 10000 == 0
#guard applyDiscount 5000 50 1000 == 4000
```

One new piece needs explaining. `omega` cannot multiply two unknowns (`price * percent`). So `discount_le_price` does
that part with two library facts: a product of two non-negative numbers is non-negative (`Int.mul_nonneg`), and
multiplying by a bigger number gives a bigger result (`Int.mul_le_mul_of_nonneg_left`). After that, the other proofs
hand this fact to `omega` with `have := ...`. You find names like these by searching the docs or asking an AI
assistant. Lean checks every step, so a wrong suggestion fails the build and cannot slip through.

`#guard` is a plain test that runs during the build. It is handy for a few examples next to the proofs.

<a href="/assets/tools/lean/lean-build-ok.png" class="lightbox-trigger"><img src="/assets/tools/lean/lean-build-ok.png" alt="lake build output: all 8 jobs built, build completed successfully."></a>

A green build means all three rules hold for every whole-number input, not just the tested ones.

## Step 4: let the proof tell you the preconditions

Look at `never_more_than_price`. It needs `hCap : 0 ≤ cap`. Remove it and build again:

<a href="/assets/tools/lean/lean-missing-cap.png" class="lightbox-trigger"><img src="/assets/tools/lean/lean-missing-cap.png" alt="lake build output: omega could not prove the goal, with a counterexample where d := cap and d is at most -1. The build fails."></a>

`d := cap` and `d ≤ -1`: a negative cap makes the price go up. You now know a precondition the TS function has
today and nobody wrote down. You can clamp the cap too, or check it where the cap comes in (for example, the admin
form). This is the most common way Lean pays off in practice: it forces every hidden assumption into the open.

## Step 5: check the TS code gives the same answers

The proofs are about the Lean copy. Nothing yet checks that `pricing.ts` does the same thing. The simplest bridge:
Lean computes answers for a grid of inputs, and vitest checks the TS function against them.

<a href="/assets/tools/lean/lean-workflow.png" class="lightbox-trigger"><img src="/assets/tools/lean/lean-workflow.png" alt="Workflow diagram: pricing.ts is rewritten as Pricing.lean. lake build checks the proofs for every input. lake exe discount writes cases.json with Lean's answers. vitest checks that the TS function gives the same answers."></a>

A small Lean program prints the grid as JSON. It includes the tricky values: 0, negatives, just over 100:

```lean
-- Main.lean
import Discount

def main : IO Unit := do
  let prices : List Int := [0, 1, 99, 100, 999, 5000, 123456]
  let percents : List Int := [-50, -1, 0, 1, 33, 50, 99, 100, 101, 150]
  let caps : List Int := [0, 1, 500, 1000, 1000000]
  let rows := prices.flatMap fun p => percents.flatMap fun pc => caps.map fun c =>
    s!"[{p},{pc},{c},{applyDiscount p pc c}]"
  IO.println ("[" ++ ",".intercalate rows ++ "]")
```

```sh
cd lean && lake build && lake exe discount > cases.json
```

This writes `lean/cases.json`. In the project it is the `lean:cases` script, see below.

And one vitest file reads it:

```ts
// src/pricing.lean.test.ts
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { applyDiscount } from './pricing';

const cases: [number, number, number, number][] = JSON.parse(
  readFileSync(new URL('../lean/cases.json', import.meta.url), 'utf8'),
);

test.each(cases)('applyDiscount(%i, %i, %i) is %i, as in the Lean model', (price, percent, cap, expected) => {
  expect(applyDiscount(price, percent, cap)).toBe(expected);
});
```

Against the original, unclamped TS function, 77 of the 350 cases fail:

<a href="/assets/tools/lean/vitest-cross-check-fails.png" class="lightbox-trigger"><img src="/assets/tools/lean/vitest-cross-check-fails.png" alt="vitest output: several failures like applyDiscount(1, -50, 0) is 1, as in the Lean model, with AssertionError expected 2 to be 1. 77 failed, 275 passed, 352 total."></a>

`applyDiscount(1, -50, 0)` returns `2` in TS: a 1-cent item with a -50% "discount" now costs 2 cents. Apply the same
clamp in TS:

```ts
function clampPercent(percent: number): number {
  return Math.max(0, Math.min(percent, 100));
}

export function applyDiscount(priceCents: number, percent: number, capCents: number): number {
  const discount = Math.min(Math.floor((priceCents * clampPercent(percent)) / 100), capCents);
  return priceCents - discount;
}
```

<a href="/assets/tools/lean/vitest-ok.png" class="lightbox-trigger"><img src="/assets/tools/lean/vitest-ok.png" alt="vitest output: 2 test files passed, 352 tests passed."></a>

Commit `cases.json`. The next section shows where everything lives and how CI keeps the three parts (the TS code,
the Lean copy, the grid) in step.

## Project layout and CI

One repo. The Lean project sits in its own folder next to `src/`, the way a `docs/` or `infra/` folder would:

```text
ts-shop/
├── .github/workflows/ci.yml
├── lean/                        the Lean project
│   ├── lean-toolchain           Lean version, like .nvmrc
│   ├── lakefile.toml            like package.json
│   ├── lake-manifest.json       like package-lock.json
│   ├── .gitignore               ignores lean/.lake, the build output
│   ├── Discount.lean            library root: imports the modules below
│   ├── Discount/Pricing.lean    the Lean copy of applyDiscount, the theorems, the #guard lines
│   ├── Main.lean                prints the grid of cases as JSON
│   └── cases.json               generated by Main.lean, committed
├── src/
│   ├── pricing.ts               the real function
│   ├── pricing.test.ts          normal unit tests
│   └── pricing.lean.test.ts     checks pricing.ts against lean/cases.json
├── package.json
└── tsconfig.json
```

Who needs what:

- Everyone runs `npm test` as usual. The cross-check reads the committed `cases.json`, so a developer who never
  touches the Lean code does not need Lean installed.
- Whoever changes `lean/` needs Lean (the `elan` install above), and regenerates `cases.json`.

Scripts in `package.json`:

```json
"scripts": {
  "lean:build": "cd lean && lake build",
  "lean:cases": "cd lean && lake build && lake exe discount > cases.json",
  "typecheck": "tsc",
  "test": "vitest run"
}
```

`lean:cases` builds first. If a proof fails, the build fails, and `cases.json` is not overwritten with an empty
file.

The CI workflow has two jobs:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  lean:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: leanprover/lean-action@v1
        with:
          lake-package-directory: lean
      - name: cases.json matches the Lean model
        run: |
          npm run lean:cases
          git diff --exit-code lean/cases.json

  ts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
```

- `leanprover/lean-action` is the official Lean action. It installs the Lean version from `lean/lean-toolchain`,
  runs `lake build` (so every theorem and `#guard` is checked), and caches `lean/.lake` between runs.
- The next step rebuilds the grid and fails if it differs from the committed file.
- The `ts` job is a normal Node job. The cross-check is one more vitest file in it.

What fails when:

| Change | Where CI fails |
|---|---|
| A change to the Lean function breaks a rule | `lean` job, `lake build`: the theorem no longer proves |
| The Lean function changes, `cases.json` is not regenerated | `lean` job, `git diff`: the grid is stale |
| `pricing.ts` changes, the Lean copy does not | `ts` job, `pricing.lean.test.ts`: TS answers differ from Lean's |
| Both change the same way, `cases.json` regenerated | Nothing fails. This is a normal, reviewed change |

## Making changes

Changing the pricing rule (for example, a new maximum discount):

1. Change `lean/Discount/Pricing.lean` first. Run `npm run lean:build`. If a theorem fails, decide: the new rule is
   wrong, or the theorem should change. Either way, the decision is now explicit in the diff.
2. Run `npm run lean:cases`.
3. Change `src/pricing.ts` the same way. Run `npm test` until the cross-check passes.
4. Commit all three together: `Pricing.lean`, `cases.json`, `pricing.ts`. The reviewer sees the rule change, the
   proof change and the code change in one pull request.

Adding a rule: add a `theorem` to `Pricing.lean`. No other file changes, since a new proof does not change any answer.

Adding a tricky input: add the value to the lists in `Main.lean` and regenerate `cases.json`. When a production bug
comes from an input nobody thought of, this is where it goes, like a regression test.

Upgrading Lean: change the version in `lean/lean-toolchain`, run `npm run lean:build`, fix anything that no longer
builds, commit. `elan` and the CI action both read that file, so everyone moves at once.

Reviewing a pull request: if `src/pricing.ts` changed and `lean/` did not, ask why. The cross-check only catches a
difference that shows up on the grid, so a matching Lean change is the real signal that the rules were thought
through.

## What you get, and what you do not

You get:

- The rules hold for every whole-number input of the Lean copy. No test suite can say that.
- Every hidden assumption shows up as a failed proof (`percent` over 100, a negative cap).
- The cross-check catches the TS code drifting from the proven copy, on the grid you chose.

You do not get:

- A proof about the TS code itself. The link is the grid of cases, not a proof. The grid is only as good as the values
  you put in it.
- Floating point. TS `number` is a float, Lean's `Int` is exact. This example stays safe by working in whole cents.
  For real float math the Lean model and the TS code can disagree at the edges.
- Help with timing, concurrency or I/O. Lean proves functions, not orders of events.
- Easy proofs every time. `omega` handles plus, minus and comparisons. Multiplication, lists and recursion need more
  steps, and that is where the learning curve is.

## How to start in your own project

1. Pick one small pure function where a wrong answer is expensive.
2. Write its rules as plain sentences first.
3. Copy the function into Lean. Keep the same names so the two files are easy to compare.
4. Write one `theorem` per rule. Try `unfold` then `omega` first.
5. When a proof fails, read the counterexample. It is usually a missing check in the code, not a problem with the
   proof.
6. Add the JSON grid and the vitest cross-check, so CI catches drift.

## Related

- [SpecCraft vs LemmaScript](/vs/lemmascript): a tool that skips the manual copy. You write contract comments in the
  TS file, and it translates the function to Lean or Dafny for you.
- [Lean documentation](https://lean-lang.org/documentation/)
- [Functional Programming in Lean](https://lean-lang.org/functional_programming_in_lean/): the book for programmers,
  not mathematicians.
- [Theorem Proving in Lean 4](https://lean-lang.org/theorem_proving_in_lean4/)
