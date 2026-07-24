# ASSA ABLOY Georgia — static website

Four-page Georgian-language (`lang="ka"`) marketing site for the ASSA ABLOY representative in
Georgia, built with **Astro 7** (static output) and **Tailwind CSS v4**.

Pages: `/` (Home) · `/about` (ჩვენს შესახებ) · `/products` (პროდუქტები) · `/contact` (კონტაქტი),
plus `/contact/thanks` and a `404`.

## Requirements

- Node ≥ 22.12 (developed on v24)
- pnpm 10.34.5 (`corepack enable` respects the `packageManager` pin)

## Commands

| Command          | Action                                       |
| :--------------- | :------------------------------------------- |
| `pnpm install`   | Install dependencies                         |
| `pnpm dev`       | Dev server at `http://localhost:4321`        |
| `pnpm build`     | Build the static site to `./dist/`           |
| `pnpm preview`   | Preview the production build locally         |
| `pnpm format`    | Prettier-format app code (never the docs)    |

## Project docs

- **`PLAN.md`** — architecture, design tokens, component contracts, phased build plan.
- **`UX-REPORT.md`** — live-site UX reconnaissance (the look/feel bar).
- **`CONTENT.md`** — verbatim site copy (single source of truth for all text).
- **`PROGRESS.md`** / **`PHASE-CHECK.md`** — build progress and phase handoffs.
- **`DECISIONS.md`** — judgment calls and resolutions.
- **`AGENTS.md`** (= `CLAUDE.md`) — guidance for AI coding agents.

## Notes

- The product catalogue PDF lives at `public/catalogue/assa-abloy-catalogue-2024.pdf` and is
  linked (view in new tab / download), never embedded.
- The contact form posts to **Web3Forms**; it needs the client's real access key before it can
  deliver mail (placeholder `YOUR_ACCESS_KEY_HERE` until then). See `PLAN.md` §9 for open items.
