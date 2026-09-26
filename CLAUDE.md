# CLAUDE.md

> **Repo scope:** source for **speccraft.io** — for now, a neutral guide to **formal methods applied to TypeScript**: the concepts, the tools that exist, and how to use them from a TypeScript project. Built with **Astro Starlight**, static output, deployed to the `dist/` directory.

## What the site is (for now)

Until the SpecCraft implementation has traction, the site is not a SpecCraft landing page. It covers concepts (state
machines, Petri nets), TypeScript tools (`/ts-tools`, `/vs/*`), non-TypeScript tools used from TS (`/tools/*`),
durable execution and the formal methods market.

- **SpecCraft is one tool among others.** Its own page is `/vs/speccraft-ts`, written like every other tool page. Do
  not compare other tools against SpecCraft, add "vs SpecCraft" sections, or position pages around it.
- Tool pages are titled with the tool's name and end with a neutral "Strengths and limits" section; comparisons, when
  useful, are with the other tools on the site.
- The `/vs/` path is kept for existing URLs; it no longer means "versus SpecCraft".

## Who reads the site and how to write for them

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

- **Catch attention, guide, paint a picture.** Do not scare the reader off. No glossary, theory, arc types, proof
  output or API details up front: they have no chance to learn them on a first visit. Detail goes lower on the page,
  for those who stay.
- **Do not explain Node basics** (`try/finally`, `p-limit`) and do not judge a tool against a toy bug the reader can fix
  in one line.
- **Every "use it when" claim names the other tools for that job and says what this tool does that they do not.** If
  there is no such reason, drop the claim. "Pools, rate limits, budgets" alone is not a reason: many tools handle those.
- **Plain English,** on the site and in replies to Alex (he is not a native speaker):
  - Do NOT use fancy words on purpose for no reason.
  - Do NOT use archaic words.
  - Do NOT use needlessly complicated English.
  - Do NOT use heavy jargon.
  - Do NOT coin new words, idioms or expressions.
  - Keep formal-methods and tool terms (invariant, model checker, counterexample), explained where first used.
## Stack (decided — don't relitigate)

- **Astro Starlight** (`@astrojs/starlight`), static output, build dir `dist/`.
- The home page is `src/content/docs/index.mdx` (`Card`/`CardGrid`); the sidebar groups are in `astro.config.mjs`.
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
