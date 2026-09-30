# Damero Propiedades — public site

A static real-estate catalog for Damero Propiedades (Argentina), built with
Astro. The site has four routes: `/` (landing), `/propiedades` (searchable
listing grid), `/propiedades/<slug>` (listing detail), and `/faqs`. Listings
are markdown files; there is no backend.

## Status

The MVP scope is complete and the project builds to a deployable static site,
but the site is **not launched**. Launch is blocked by stakeholder-pending
content — the six FAQ answers, the real WhatsApp number, and the broker's
matrícula from the CCI (the professional registration number issued by the
Colegio de Corredores Inmobiliarios) — plus a few open copy/visual
confirmations; the live list is
maintained in [`odd/tasks/damero-release-prep.md`](odd/tasks/damero-release-prep.md).

The site never fabricates content: any value that is still pending renders as
`PENDIENTE` or as the designated placeholder defined by the design contract
(`docs/DESIGN.md` §11, §17.4).

## Stack

- **Astro 7.3.5**, static output. **No UI framework**: components are `.astro`
  files and client-side JavaScript is the exception, not the rule.
- **Plain CSS driven by design tokens** — the single source of visual truth is
  `src/styles/tokens.css`, consumed by `src/styles/global.css`. No Tailwind,
  no utility framework.
- **Astro Content Layer** collections in `src/content/propiedades/`
  (one markdown file per listing, Spanish frontmatter fields).
- **TypeScript** with `astro/tsconfigs/strict`.
- **MapLibre GL** for the approximate zone map on listing detail pages.
- **pnpm** as the package manager.

## Requirements

- **Node `>=22.12.0`** (declared in `engines` and enforced at install time).
- **pnpm** — the repo pins `packageManager: pnpm@12.4.2` in `package.json`.
  **Never use npm, never use yarn.**

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the Astro dev server |
| `pnpm build` | Build the static site into `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm test:e2e` | Run the Playwright e2e gate (see below) |
| `pnpm install --frozen-lockfile` | Reproducible install from `pnpm-lock.yaml` |
| `pnpm check-deps` | `pnpm audit --audit-level high` + list outdated packages |

## Testing

Testing is **e2e only, with Playwright — there are no unit tests** (stakeholder
decision).

- `pnpm test:e2e` runs three viewport projects — `desktop-1280`, `mobile-390`,
  and `mobile-320` — covering all four routes.
- The suite runs **against the production build**, never the dev server:
  `playwright.config.ts` declares `pnpm build && pnpm preview --port 4321` as
  its `webServer`, so the build is part of the acceptance gate.
- The browser is Playwright's bundled Chromium. Install it once with:
  `pnpm exec playwright install chromium`. On a clean Linux machine add
  `--with-deps`, otherwise Chromium's system libraries are missing at first
  run — that is what CI uses:
  `pnpm exec playwright install --with-deps chromium`
- Environment gotcha, already handled in `playwright.config.ts`:
  `ASTRO_PREVIEW_BACKGROUND=0` is required so that `astro preview` does not
  daemonise into a background process under AI-agent shells (which Playwright
  would read as "webServer exited early"). It is set inside the config; you do
  not need to export it yourself.

## Project structure

```
.
├── src/
│   ├── components/       # .astro UI components (cards, filters, header/footer, CTAs)
│   ├── content/
│   │   └── propiedades/  # Content Layer collection: one markdown file per listing
│   ├── content.config.ts # Collection schema (Spanish field names)
│   ├── data/             # Site-wide data: landing copy, FAQs, contact
│   ├── icons/            # SVG icon set (house + services/)
│   ├── layouts/          # BaseLayout.astro
│   ├── lib/              # Formatting, WhatsApp link building, detail map
│   ├── pages/            # /, /propiedades, /propiedades/[slug], /faqs
│   └── styles/           # tokens.css (design tokens) + global.css
├── e2e/                  # Playwright specs per route + browser-audits helper
├── .github/workflows/    # CI: supply-chain (install/audit/build) + acceptance (e2e gate)
├── docs/                 # DESIGN.md (visual system), PRD_Damero_MVP.md (scope)
├── design/screens/       # Approved HTML layout/copy references
├── odd/tasks/            # Planned work units, with criteria and evidence
└── public/               # Static assets (logos, hero image)
```

## Sources of truth

| Source | What it governs |
| --- | --- |
| `docs/DESIGN.md` | The visual system: color, type, spacing, radii, accessibility. Wins any conflict with the screens. |
| `docs/PRD_Damero_MVP.md` | Product scope and constraints |
| `design/screens/*.html` | Approved layout and copy references |
| `odd/tasks/*.md` | Planned work, acceptance criteria, and verification evidence |
| `AGENTS.md` | The agent/contributor contract for this repo |

## CI

Two GitHub Actions workflows run on every pull request and push to `main`:

| Workflow | What it runs |
| --- | --- |
| `supply-chain` | Frozen install + `pnpm audit --audit-level high` + build |
| `acceptance` | The full Playwright e2e gate |

`main` is protected: merging requires a pull request with one approving review
and the required status check `Playwright e2e (1280 / 390 / 320)`. CI is
therefore a **barrier**, not just a signal — a red gate blocks the merge.

## Deployment

The project builds to a static site deployed on Vercel's free tier. The
repository is connected to Vercel, which builds and deploys on its own: a
`Preview` deployment per branch and a `Production` deployment for `main`. There
is no `vercel.json` and no deploy step in this repository.

The site is deployed but **not launched**: the public launch is still blocked by
the stakeholder-pending content listed under [Status](#status).

## Contributing

`.opencode/` — the per-developer AI agent harness — is gitignored on purpose:
each contributor brings their own. If your harness does not define the project
agents, `AGENTS.md` is the contract to follow.
