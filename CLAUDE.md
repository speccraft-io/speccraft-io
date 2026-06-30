# CLAUDE.md

> **Repo scope:** source for **speccraft.io** — a single-page marketing/landing site for **SpecCraft**, tooling to understand, verify, and test complex concurrent and durable-execution workflows (Temporal-first). Built with **Astro Starlight**, static output, deployed to the `dist/` directory.

## What SpecCraft is

SpecCraft targets the correctness gap in durable-execution workflows: as a workflow grows many interleaving signals, timers, and handlers, the dangerous bugs become **logical races** — domain invariants that break under an ordering no test ever samples. SpecCraft aims to **understand** (model the workflow from its code), **verify** (check invariants across every interleaving, TLA+/deterministic-sim lineage), and **test** (exercise the orderings no hand-written test would). Keep landing copy consistent with this framing.

## Stack (decided — don't relitigate)

- **Astro Starlight** (`@astrojs/starlight`), static output, build dir `dist/`.
- The landing page is the **splash template** at `src/content/docs/index.mdx` (`template: splash`, hero + `Card`/`CardGrid`). One page — sidebar/pagination off.
- **Logo & favicons** live in `public/` (the "SC" monogram); the header logo is `src/assets/speccraft-logo.png`. Wired in `astro.config.mjs`.
- **Analytics:** Google Tag Manager (`GTM-N2BNSMZ6`) injected via the Starlight `head` config — same container as the rest of the SpecCraft properties.
- **Site styling tweaks** go in `src/styles/custom.css` (referenced via `customCss`).

## Conventions

- Keep it **one page**. New marketing sections are headings within `index.mdx`, not new routes, unless the site grows on purpose.
- **Value first, low fluff.** Lead with what SpecCraft does and the sharp technical hook (logical races, durable execution); no promo throat-clearing.
- Run `npm run build` before committing; the build must succeed and the page render.
- Off-repo links: SpecCraft is built by [Oleksandr Zalizniak](https://zalizniak.com); GitHub org is `speccraft-io`.

## Commands

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview  # serve the built site
```
