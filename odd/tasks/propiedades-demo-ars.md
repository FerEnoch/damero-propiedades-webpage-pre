# ODD — Add two ARS demo properties

**Canonical source:** `odd/tasks/propiedades-demo-ars.md`
**Engram mirror:** topic `odd/propiedades-demo-ars/tasks`
**Status:** Complete
**Branch:** `feat/propiedades-demo-ars`
**Delivery strategy:** `ask-on-risk` (default; no chain decision currently needed)
**Forecast:** approximately 180 authored changed lines, excluding generated files.

## Objective

Add two fictional, plausible ARS-priced property records to the four existing records, leaving six demo properties for the client to explore.

## Problem and rationale

The user wants two more sample listings that demonstrate the site using ARS prices. The repository currently has four records; the user confirmed the correct result is six total.

## Scope

- Add two property Markdown records matching the existing frontmatter and body style, both with `moneda: "ARS"`.
- Keep sample data fictional and internally consistent, retain the existing WhatsApp placeholder, and use `fotos: []` so no unapproved or misleading image assets are introduced.
- Update only Playwright expectations and route coverage affected by the two new listings.

## Constraints

- Follow `AGENTS.md` and `docs/DESIGN.md`; site copy stays in professional Spanish and technical artifacts in English.
- Preserve all four existing listings, the existing `e2e/propiedades-filtering.spec.ts` edits from the separate currency-filter task, and the unrelated untracked `odd/tasks/damero-currency-filter.md`.
- If the filtering spec needs a total-count update, make only the necessary count-related edits and do not replace or stage unrelated currency-filter work.
- No remote operations, new dependencies, package changes, or lockfile changes.
- Do not create or download image assets; the accepted empty-photo fallback is used for these demo records.
- Test-first: add the new detail-route expectations and observe the focused Playwright test fail before adding the property records; then implement and confirm it passes.
- Receipt-driven development is clone-locally disabled. Do not start or enable it; use ordinary checks.

## Task checklist

### PD-01 — Add two ARS records and cover the six-listing catalog

- [x] Add two schema-valid fictional properties priced in ARS, bringing the collection from four to six.
- [x] Extend detail-page Playwright coverage to assert both new routes and key record data; observe RED before the content records are added.
- [x] Update any catalog count expectations required for six records without disturbing unrelated in-progress test edits.
- [x] Verify with `pnpm exec playwright test e2e/propiedades-detalle-structure.spec.ts` and `pnpm test:e2e`; record any unrelated pre-existing failures separately.
- [x] Record commit identity and close the work unit below.

**Authorized scope:** one delegated implementation task for the two content records and narrowly affected Playwright coverage.
**Acceptance:** the collection builds with six records; exactly two new records have `moneda: "ARS"`; both detail routes render; the full applicable e2e gate passes or any unrelated existing failure is reported with evidence; unrelated worktree changes remain intact.
**Route:** delegated direct. Evidence: multiple non-trivial content and Playwright files require edits, reading prepares those changes, and the filtering spec currently contains separate uncommitted currency-filter work.
**Verification evidence:**
- RED (spec extended before the records existed): `pnpm exec playwright test e2e/propiedades-detalle-structure.spec.ts` → 18 failed / 18 passed (exit 1). Failures: the two new routes 404, the new `dist` HTML and `.json` payloads missing (ENOENT), the R11 CTA scan on the missing routes, and the first-card expectation moving to `casa-2-dormitorios-zona-sur-santa-fe`.
- GREEN (records added): same command → 36 passed, 0 failed (exit 0).
- Full gate: `pnpm test:e2e` (check:images passed, then Playwright) → 326 passed, 17 skipped, 17 failed (exit 1). All 17 failures are the separate in-progress CF-01 currency-filter tests in `e2e/propiedades-filtering.spec.ts` (uncommitted spec-first work whose `src/` implementation does not exist yet): `[data-filter-key="moneda"] input[value=""]` → "element(s) not found"; `?moneda=ARS` does not filter (`Expected: 3, Received: 6`). No PD-01-owned spec fails; the new count expectations (6 total, 3 ARS, 3 alquiler) hold wherever the CF-01 implementation is not required.
- Collection-order note: `casa-2-dormitorios-zona-sur-santa-fe` sorts first by filename, so the `the search cards resolve to the detail routes` expectation moved to it (observed in the GREEN run).
**Commit:** `05aea19` — `feat(properties): add two ARS demo listings`.
**Next step:** PD-01 is complete. The separate in-progress CF-01 implementation remains necessary to clear its 17 currency-filter failures from the current working-tree gate run.
