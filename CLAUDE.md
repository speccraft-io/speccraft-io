# CLAUDE.md

> **Repo scope:** source for **speccraft.io**, the site of **SpecCraft**: a tool, framework and method for spec-driven
> development with AI (human requirements, AI spec, AI tests, AI code). The site also keeps a neutral guide to
> **formal methods applied to TypeScript** as one section. Built with **Astro Starlight**, static output, deployed to
> the `dist/` directory.

## What the site is

- **The root page** (`src/content/docs/index.mdx`) is the SpecCraft page: the pipeline, the editor at
  app.speccraft.io, the Claude Code plugin. The implementation lives in a private repo
  (`/Users/alex/work/speccraft/speccraft`); its `-req/idea.md` is the vision and the source of truth for what SpecCraft
  is. Do not link to that repo from the site.
- **The formal-methods section** has its index at `/formal-methods/` (`src/content/docs/formal-methods/index.mdx`,
  the former home page). It covers TypeScript tools
  (`/typescript-formal-methods/*`), and non-TypeScript tools used from TS (`/formal-methods/*`). The section is neutral: SpecCraft is not the frame of the tool pages.
  - Tool pages are titled with the tool's name and end with a neutral "Strengths and limits" section; comparisons,
    when useful, are with the other tools on the site.
  - Tool pages live under `/typescript-formal-methods/`; the old `/vs/` URLs redirect there.
- **The spec-driven section** is one page for now, `/spec-driven/` (`src/content/docs/spec-driven/index.mdx`): a
  neutral survey of spec-driven tools for AI agents (Spec Kit, Kiro, OpenSpec, BMAD, ...). SpecCraft is one entry.
- The market pages, the use cases, the case studies and the canvas were removed in October 2026; their old URLs redirect to `/formal-methods/`.
- The concept pages, the design and contact pages and the speccraft-ts page were removed in October 2026; their old
  URLs redirect to `/formal-methods/` (`/design` and `/contact` to `/`).

## Who reads the formal-methods section and how to write for them

**The reader is a Node.js developer who is looking around.** They do not have a specific task, and often do not know
they have the problem. They are not here to learn a tool or a theory. They want to see what exists, how it compares
with everything else, and whether it is worth their time.

Every tool page answers, in this order:

1. **What is it?** A picture in everyday Node words (async functions, steps, a pool), not the tool's theory terms.
2. **How does it compare** with the other tools and with what Node developers already use?
3. **Pros and cons.** Plain, honest, no promo.
4. **What do we recommend,** and does it look like it has a future?
5. **Is it worth your time** to go deeper, and where to look next?

Rules:

- **The first sentence names what the reader already uses and what the tool replaces or adds to it** ("replaces
  `async-mutex`, `p-limit` and the code around them"). Never open with what the tool is made of or how it works.
  Every later paragraph passes the same test: does it start from the reader's code, or from the tool?
- **Catch attention, guide, paint a picture.** Do not scare the reader off. No glossary, theory, arc types, proof
  output or API details up front: they have no chance to learn them on a first visit. Detail goes lower on the page,
  for those who stay.
- **Do not explain Node basics** (`try/finally`, `p-limit`) and do not judge a tool against a toy bug the reader can fix
  in one line.
- **Every "use it when" claim names the other tools for that job and says what this tool does that they do not.** If
  there is no such reason, drop the claim. "Pools, rate limits, budgets" alone is not a reason: many tools handle those.
  Name only tools at the same layer: a tool that does a different job (a durable execution engine next to an
  in-process library) is not an alternative and does not belong on the page.
- **Every "not for" item says what to use instead,** with a link to that tool's page on the site.
- **Every "best", "only" or "no other" names the set it was compared against, in the same sentence or the next.**
  A true claim with a hidden qualifier ("best, checked on the code itself" while TLA+ is stronger on a model) reads as
  a lie once the reader finds the qualifier.
- **The recommendation is a verdict from our research:** is it the best tool for its job? Sometimes, and then when
  exactly; or never, and then say so. A description of a good fit is not a verdict. "Spend an hour on it if..." and
  "run this test on your code" are not either.
- **Each point once.** Do not say the same thing under "good fit", "how it compares", "other tools", "strengths" and
  "limits". Pick the one place.
- **State only what is hard to infer.** The adoption box already shows the age, stars and author count; the text does
  not repeat them. "Young, one author" is obvious; "runs a named company's production system" is not.
- **The example:** the smallest case that fits the tool. Start with standard-looking plain TypeScript for the same
  problem, then the product case and what is hard about it, then why tests miss it, then the tool's version, the
  check with its real output, and the fix. Code is copied from `formal-methods-samples/<folder>` as is, never
  "(shortened)"; if it is too long, make the sample smaller.
- **Verify every fact against the source** (the repo, its README, npm) before it goes on the page. Do not trust a
  brief or a previous page; "planned" features may already ship, and a claim like "the bug cannot be written" may be
  contradicted by the sample itself.
- **Before rewriting a page, ask questions, and keep them short.** Once Alex says go, go.
- **Plain English,** on the site and in replies to Alex (he is not a native speaker):
  - Do NOT use fancy words on purpose for no reason.
  - Do NOT use archaic words.
  - Do NOT use needlessly complicated English.
  - Do NOT use heavy jargon.
  - Do NOT coin new words, idioms or expressions.
  - Keep formal-methods and tool terms (invariant, model checker, counterexample), explained where first used.

### Tool page shape

1. What it is, in Node words, and the bug it is built against. One line: you do not need the theory.
2. The problem in plain TypeScript (code first).
3. The same thing with the tool: code, the check, its real output, the fix, then the one point that is hard to see.
4. Where it fits and where it does not: what it replaces, what it alone adds, the recommendation test, "not for" with
   what to use instead.
5. Which tool instead: one rule per tool on the site.
6. Costs, and what is easy to miss.
7. Links.

No Install, Project layout, CI or Making changes sections.

## Stack (decided — don't relitigate)

- **Astro Starlight** (`@astrojs/starlight`), static output, build dir `dist/`.
- The root page is `src/content/docs/index.mdx`; the formal-methods index is `src/content/docs/formal-methods/index.mdx`.
  The sidebar is in `astro.config.mjs`: "Home" (the root), then the groups "Spec-driven" and "Formal methods".
- **Logo & favicons** live in `public/` (the "SC" monogram); the header logo is `src/assets/speccraft-logo.png`. Wired in `astro.config.mjs`.
- **Analytics:** Google Tag Manager (`GTM-N2BNSMZ6`) injected via the Starlight `head` config — same container as the rest of the SpecCraft properties.
- **Site styling tweaks** go in `src/styles/custom.css` (referenced via `customCss`).

## Conventions

- New pages go into an existing sidebar group in `astro.config.mjs`; a new tool page also goes into `src/tool-kinds.ts`.
- **Value first, low fluff.** Plain, short sentences; facts about the tools, no promo.
- Run `npm run build` before committing; the build must succeed and the page render.
- Off-repo links: SpecCraft is built by [Oleksandr Zalizniak](https://zalizniak.com); GitHub org is `speccraft-io`.

## Commands

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview  # serve the built site
```
