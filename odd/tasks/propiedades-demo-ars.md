# ODD — Add two ARS demo properties

**Canonical source:** `odd/tasks/propiedades-demo-ars.md`
**Engram mirror:** topic `odd/propiedades-demo-ars/tasks`
**Status:** In progress (reopened for PD-02, user-authorized demo photography)
**Branch:** `feat/propiedades-demo-ars`
**Delivery strategy:** `ask-on-risk` (default; no chain decision currently needed)
**Forecast:** approximately 260 authored changed lines across PD-01 and PD-02, excluding generated image files.

## Objective

Add two fictional, plausible ARS-priced property records to the four existing records, then give both new listings the same provisional demo photography treatment as the existing listings, leaving six visually complete demo properties for the client to explore.

## Problem and rationale

The user wants two more sample listings that demonstrate the site using ARS prices. The repository currently has four records; the user confirmed the correct result is six total. After PD-01 closed, the user explicitly requested provisional test photos for the two new listings using the same approach as the other properties.

## Scope

- Add two property Markdown records matching the existing frontmatter and body style, both with `moneda: "ARS"`.
- Add five provisional Pexels photos to the Zona Sur house and four to the Candioti Norte apartment, following the existing WebP/local-asset workflow.
- Record every new source URL and Pexels photo ID in `odd/tasks/damero-demo-photos.md`; never hotlink or add unlicensed imagery.
- Update the detail gallery fixture and only the Playwright expectations affected by the two new listings.

## Constraints

- Follow `AGENTS.md` and `docs/DESIGN.md`; site copy stays in professional Spanish and technical artifacts in English.
- Preserve all six property records, the existing uncommitted CF-01 edits in the property filters/design references, and the unrelated untracked `odd/tasks/damero-currency-filter.md`.
- If the filtering spec needs a total-count update, make only the necessary count-related edits and do not replace or stage unrelated currency-filter work.
- No remote execution or authenticated session use. The user authorized only the existing public Pexels photo-page/CDN workflow, which uses no credentials; do not access ambient credentials or other hosts.
- No new dependencies, package changes, or lockfile changes. Keep CF-01 changes unstaged and out of PD-02 commits.
- Test-first for PD-02: update the focused gallery fixture to expect both photo sets and observe the detail-content Playwright test fail before adding images/frontmatter; then implement and confirm it passes.
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

### PD-02 — Add provisional photos to the two ARS listings

- [ ] Add five WebP photos for `casa-2-dormitorios-zona-sur-santa-fe` and four for `departamento-1-amb-candioti-norte-santa-fe`, under their own `public/propiedades/<slug>/` folders.
- [ ] Replace each new listing's empty `fotos: []` with ordered `src`/`titulo` entries, keeping the first entry as the cover and all captions faithful to the visible room.
- [ ] Append the nine Pexels source IDs and page URLs to the existing photo provenance table in `odd/tasks/damero-demo-photos.md`, preserving the historical T0–T6 results.
- [ ] Update the per-listing gallery fixture in `e2e/propiedades-detalle-content.spec.ts`; observe RED before adding images/frontmatter.
- [ ] Verify image limits with `pnpm check:images`, gallery behavior with `pnpm exec playwright test e2e/propiedades-detalle-content.spec.ts`, and the full `pnpm test:e2e` gate; record unrelated CF-01 failures separately.
- [ ] Record verification, commit identity, and next step below.

**Authorized scope:** one delegated implementation task for nine local WebP demo assets, the two matching frontmatter blocks, photo provenance, and gallery expectations.
**Acceptance:** each of the two ARS listings displays its locally committed demo gallery; nine new files are WebP, ≤1600px wide, <300KB each, correctly referenced under the listing-specific slug; source IDs/URLs are documented; focused gallery checks pass; unrelated CF-01 work remains intact and unstaged.
**Route:** delegated direct. Evidence: image sourcing/normalization, binary assets, both content records, the gallery spec, and photo provenance all require coordinated edits.
**Verification evidence:** blocked before implementation. The delegated PD-02 worker could not start: runtime request failed with `Insufficient account funds`. This attempt produced no photo assets, frontmatter changes, provenance rows, or verification runs. Handoff warning: the worktree already holds uncommitted `GALLERY` fixture edits in `e2e/propiedades-detalle-content.spec.ts` expecting 5 photos (`Fachada` cover) and 4 photos (`Frente del edificio` cover) for the two ARS listings, while both records still ship `fotos: []` and no asset folders exist — origin of those edits unknown, treat as the RED state, do not assume GREEN coverage.
**Commit:** pending; PD-01 remains recorded in `05aea19` and its documentation close in `3ac06bb`. No PD-02 commit exists.
**Next step:** resume in a new session: relaunch one bounded PD-02 writer, then run `pnpm check:images`, the focused gallery spec, and `pnpm test:e2e`; commit PD-02 separately while keeping CF-01 changes unstaged.
