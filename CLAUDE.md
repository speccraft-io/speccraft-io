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
