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
| `pnpm exec wrangler dev` | Serve `./dist/` exactly as Cloudflare will (headers, 404, trailing slashes) — run `pnpm build` first |

## Deployment

Hosted on **Cloudflare Workers (static assets)**, DNS on Cloudflare. Pushes to `main` deploy via
Workers Builds (build `pnpm build`, deploy `pnpm exec wrangler deploy`).

- `wrangler.jsonc` — asset directory, 404 handling, trailing-slash handling, `assa-abloy.ge` custom domain.
- `public/_headers` — `Cache-Control` rules (copied into `dist/` by the build).
- `.node-version` — Node for the build image; pnpm comes from the `packageManager` pin.
- `www` → apex redirect and "Always Use HTTPS" are Cloudflare dashboard settings.
- ⚠ Cloudflare rejects any single file over **25 MiB**; `assa-abloy-catalogue-2024.pdf` is 23.9 MiB.

See `MIGRATION.md` for the move from Netlify and the DNS / Google Workspace email records.

## Project docs

- **`PLAN.md`** — architecture, design tokens, component contracts, phased build plan.
- **`UX-REPORT.md`** — live-site UX reconnaissance (the look/feel bar).
- **`CONTENT.md`** — verbatim site copy (single source of truth for all text).
- **`PROGRESS.md`** / **`PHASE-CHECK.md`** — build progress and phase handoffs.
- **`DECISIONS.md`** — judgment calls and resolutions.
- **`AGENTS.md`** (= `CLAUDE.md`) — guidance for AI coding agents.

## Notes

- The downloadable documents live in `public/catalogue/` on stable, unfingerprinted URLs —
  `assa-abloy-catalogue-2024.pdf`, `assa-abloy-doors-technical-catalog.pdf` and
  `assa-abloy-doors-presentation.pptx`. `/products` lists them (view in new tab / download);
  nothing is ever embedded, and the `.pptx` offers download only. Copy and metadata live in
  `src/data/documents.ts`.
- The contact form posts to **Web3Forms** (access key in `src/components/ContactForm.astro`) and
  redirects to `/contact/thanks/` on the production origin. See `PLAN.md` §9 for open items.
