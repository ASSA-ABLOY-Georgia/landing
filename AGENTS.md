# AGENTS.md — ASSA ABLOY Georgia static site

Project guidance for AI coding agents. `CLAUDE.md` is a symlink to this file.

## What this is

A four-page Georgian-language (`lang="ka"`) marketing site — **Astro 7 (static) + Tailwind CSS v4**.
Built by executing the phased plan in `PLAN.md` §8 (Phases 0–7 with per-phase exit criteria).

## Read these before writing code

1. **`PLAN.md`** — the plan. §4 = tokens + component contracts, §4.5 = accessibility, §7 = page
   blueprints, §8 = phased execution script.
2. **`UX-REPORT.md`** — live-site look/feel/behaviour (the bar the result is judged against).
3. **`CONTENT.md`** — the ONLY source of site copy. Georgian text is copied **byte-for-byte**;
   never reword, "fix" spelling, or machine-translate.

Source-of-truth order: UX-REPORT (observed behaviour) > token values in PLAN §4 > everything else.

## Hard constraints (from PLAN §1)

- **No UI framework** (React/Vue/Svelte/etc.) — pure `.astro` components only.
- **No content collections** for page copy — copy lives in `src/data/*.ts` and pages.
- **Tailwind v4 path only** — `@tailwindcss/vite`. The legacy `@astrojs/tailwind` integration is
  deprecated and must never appear.
- Client JS = **three tiny inline scripts** (mobile-nav toggle, header hide/reveal,
  IntersectionObserver reveal), all progressive enhancement, gated on `prefers-reduced-motion`.
- **Headings are weight 400** (H1, section H2); card titles 500. **Cyan is rationed** (buttons,
  header strip, one Home band, footer wordmark, icon accents — never text on light, never a
  content-panel background). Heroes are white two-column.

## Commands

`pnpm dev` · `pnpm build` · `pnpm preview` · `pnpm format` (app code only — never the `.md` docs).

## Progress

`PROGRESS.md` (cumulative) and `PHASE-CHECK.md` (latest handoff) track phase status;
`DECISIONS.md` logs judgment calls.
