# ODD — Damero currency filter states

**Canonical source:** `odd/tasks/damero-currency-filter.md`  
**Engram mirror:** topic `odd/damero-currency-filter/tasks` (synced 2026-10-07, observation `a050b6237d889545`; the write required the previously registered manual-save session because multiple active runtime sessions matched the project)  
**Status:** Complete. Implemented, verified, committed as `f5adfc4`, and opened as PR #15. PD-02 remains open.  
**Branch:** Current work is on `feat/propiedades-demo-ars`. `feat/currency-filter-states` still points to the same base commit as `main` and lacks the PD-01 ARS listings required by the six-listing CF-01 expectations. Keep the current tree on its existing branch; do not switch or move changes.  
**Delivery strategy:** `ask-on-risk` (default; no chain decision currently needed)  
**Forecast:** approximately 200 authored changed lines, excluding generated files.

## Objective

Make the property currency control filter listings by their displayed currency, with explicit `Todas`, `ARS`, and `USD` states. `Todas` is the initial state and disables the price-range controls.

## Problem and rationale

The existing USD/ARS control only scopes a price range; by itself it does not filter the listing set. This makes the currency selector misleading for people who expect to browse prices in one currency. The accepted behavior is `Todas` = all listings, `ARS` = ARS-priced listings only, and `USD` = USD-priced listings only.

## Scope

- Update filter state, URL serialization/restoration, result matching, active-filter count/chips, and the price-range disabled state.
- When entering `Todas`, clear any active price bounds and remove them from the URL so hidden bounds cannot narrow the all-currency result set.
- Update the authoritative design spec and its affected approved desktop/mobile search references.
- Update Playwright coverage for all currency states, reloadable URLs, cleared price bounds, and responsive presentation.

## Constraints

- Follow `AGENTS.md` and `docs/DESIGN.md`; the design spec is updated as part of this authorized behavior change.
- Do not add dependencies, change package or lock files, or use a framework.
- Preserve the Spanish copy and existing CSS token/radius/accessibility rules.
- Do not commit without an explicit user request; preserve all PD-02 changes unstaged and untouched.
- Test-first: focused Playwright expectations and implementation are already edited in the shared worktree, so the RED state was not observed in this resumed session. Do not revert existing work to manufacture RED; document this evidence gap, then run the focused tests and acceptance gate after any remaining changes.
- RDD is clone-locally disabled. Do not start or enable it; use ordinary checks.
- Remote operations are not authorized. Work locally only.

## Task checklist

### CF-01 — Filter by currency and disable price range for Todas

- [x] Add an explicit `Todas / ARS / USD` control; default to `Todas` and serialize it canonically as no `moneda` parameter.
- [x] Filter the listing set for ARS/USD selections; `Todas` shows every listing and disables price inputs.
- [x] Clear price bounds when switching to `Todas`; keep chips, counts, and URL state consistent.
- [x] Update `docs/DESIGN.md`, the approved desktop/mobile search references, and Playwright behavior coverage.
- [x] Verify with `pnpm exec playwright test e2e/propiedades-filtering.spec.ts` and `pnpm test:e2e`.
- [x] Record verification, commit identity, and next step below.

**Authorized scope:** one delegated implementation task covering the behavior, tests, and design documentation above.  
**Acceptance:** no currency selected means all listings; ARS/USD each show only matching listings; `Todas` is selected on a clean URL and its price-range controls are visibly disabled and non-interactive; switching to `Todas` removes stale price bounds; reloading explicit currency URLs reproduces the same results; all existing acceptance gates pass.  
**Route:** delegated direct. Evidence: behavior spans the search-page state machine, reusable filter controls, design references, and Playwright tests (more than one non-trivial file); repository rules require one bounded writer.  
**Decisions:** `Todas` disables the price-range controls (user-authorized); switching to `Todas` clears min/max bounds and removes those URL params.  
**Authorized edit surfaces (user-approved option 1):** `src/pages/propiedades/index.astro`, `src/components/FilterControls.astro`, `src/components/PriceRange.astro`, `docs/DESIGN.md`, `design/screens/03-busqueda-desktop.html`, `design/screens/04-busqueda-mobile.html`, `e2e/propiedades-filtering.spec.ts`. Note: the two component paths are flat under `src/components/`, not `src/components/propiedades/`.  
**Verification evidence (2026-10-07):**
- Focused spec `pnpm exec playwright test e2e/propiedades-filtering.spec.ts` → **47 passed, 10 skipped** (viewport-gated), **exit 0**, covering Todas default/inert range, `moneda=Todas` canonicalisation, stale-bound clearing, currency URL reload, and chip removal.
- Full gate `pnpm test:e2e` → **346 passed, 17 skipped, 0 failed, exit 0**. An earlier run of the same gate in this session reported 5 failed, all in `e2e/propiedades-structure.spec.ts` (`mobile-320`) with `page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4321/propiedades` — the Astro preview server died mid-run (environmental; no listener remained on 4321). Re-running that spec alone gave **9 passed, exit 0**, and the full-gate re-run was clean, confirming the failures were environmental and unrelated to CF-01.
- Reference alignment is now applied in-tree (parent read-back against `docs/DESIGN.md:650-655`): desktop `design/screens/03-busqueda-desktop.html` moved `MONEDA` after `COCHERA`, replaced the USD select with the segmented `Todas/ARS/USD` control (`Todas` selected), made `PRECIO` visible-but-disabled (`text-on-surface-variant opacity-60`, `cursor-not-allowed`), removed the `USD 30.000–150.000` chip, and dropped `moneda=USD` from the share URL; mobile `design/screens/04-busqueda-mobile.html` made the sheet `MONEDA` segmented `Todas/ARS/USD` (`Todas` selected), corrected the active-filter badge `3 → 2`, removed the price chip, and dropped `min=30000` from the share URL.
- `e2e/propiedades-detalle-content.spec.ts` and `odd/tasks/propiedades-demo-ars.md` remain PD-02 work and were left untouched/unstaged (verified with `git diff`).
- The six-listing/three-ARS expectations depend on PD-01 commits present on `feat/propiedades-demo-ars`; moving CF-01 onto stale `feat/currency-filter-states` would remove that test data.
- RED evidence is unavailable because test and implementation edits were already co-located at resume; it was not manufactured (per the Constraints above). No CF-01 commit exists.

**Commit:** `f5adfc4` — `feat(properties): filter listings by currency with three states` (8 files: the two component paths, `src/pages/propiedades/index.astro`, `docs/DESIGN.md`, the two design references, `e2e/propiedades-filtering.spec.ts`, this document).  
**Next step:** PR #15 (`feat/propiedades-demo-ars` → `main`) is open for review; merge is a human decision. This PR also carries the prerequisite ARS demo listings (PD-01) because the currency filter's six-listing/three-ARS expectations depend on them. Related open work on this branch: PD-02 (ARS demo photos) in `odd/tasks/propiedades-demo-ars.md`.
