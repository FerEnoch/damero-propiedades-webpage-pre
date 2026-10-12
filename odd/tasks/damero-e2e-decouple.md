# Damero — Decouple e2e from business data

**Status:** Planned (2026-10-12) on `fix/e2e-decouple-business-data` (base `d4bc2d0`, in sync with `origin/main`). Awaiting stakeholder approval of this plan before any spec edit.
**Stakeholder decision:** PR #23 (`actualizacion-precio`, `410000 -> 500000` on `casa-2-dormitorios-zona-sur-santa-fe`) turned the acceptance gate red because specs duplicate business values instead of reading them.
**Objective:** e2e asserts rendering contracts (format, presence, correspondence with the collection), never literal business values. Any legitimate content edit (price, title, listing add/remove, photo add/remove, moneda/operacion, expensas, characteristics, coords) passes without touching specs — or touches exactly one shared helper, never N spec files.
**Problem:** the suite hardcodes the full 6-listing dataset: `prices` map (`detalle-content:149-161`), `TITLES` x3, `SLUGS` x5, `GALLERY`/`PHOTO_COUNTS` x3, currency/operation counts (`filtering`), price ranges, sort order, ficha rows, characteristics, coordinates, destacada/localidad assumptions, WhatsApp anchor. One commercial edit = 3-7 spec files (audit 2026-10-12).
**Why this approach:** single static build from `src/content/propiedades/`; the collection IS the source of truth. Specs import/derive expected values (or assert shape + correspondence) instead of maintaining a parallel copy. Separate `content/test` vs `content/prod` folders were evaluated and rejected: duplicated fixtures, drift, conditional build, leak risk into prod/sitemap for 6 static listings. Revisit only if destructive scenarios (empty/malformed) must never reach prod.

## Scope

- `e2e/*.spec.ts`: replace literal business values with derived expectations or contract assertions (format, count-derived, collection-read).
- `e2e/helpers/*`: ONE new shared helper allowed (e.g. `content-expectations.ts`) centralizing collection reads; no other new helpers unless the writer justifies.
- `scripts/check-image-limits.mjs`: touch only if photo-path coupling forces it; otherwise out of scope.
- Docs: one line in `docs/DESIGN.md` only if the writer touches documented behavior (not expected).

**Out of scope:** `src/` rendering changes, `src/content/propiedades/` edits (prod-owned), new routes/sitemap, `astro:transitions`, visual/copy changes, new dependencies, `pnpm-workspace.yaml`/`pnpm-lock.yaml`, push/merge/PR creation (stakeholder decision under ordinary policy).

## Tasks

- [ ] **T1 — Price/currency contract.** Replace `prices` map in `e2e/propiedades-detalle-content.spec.ts:147-162` with format + correspondence assertions (currency code present, amount matches `es-AR` grouping of the collection value, or value read from the built JSON). **Route:** delegated direct (writer trigger: spec + helper = 2 non-trivial files). **Evidence:** RED = `precio: 500000` locally fails today; GREEN = same value passes with no spec edit.
- [ ] **T2 — Titles/slugs single source.** Deduplicate `TITLES` x3 (`detalle-structure:26-33`, `galeria-content:24-31`, `galeria-structure:26-33`) and `SLUGS` x5 into the shared helper or dynamic collection read; `view-transitions:137` derives from the same source. **Route:** delegated direct (writer trigger: 4+ specs). **Evidence:** title reword + new-listing dry run pass with zero spec edits.
- [ ] **T3 — Gallery photo contracts.** Unify `GALLERY`/`PHOTO_COUNTS` x3 + alt/filename literals (`detalle-content:28-35,133`, `galeria-content:96-310`) behind the helper; assert lead/rail/counter/shape, not literal filenames beyond structural `slug/` prefix. **Route:** delegated direct (3 spec files). **Evidence:** add/remove one photo locally passes.
- [ ] **T4 — Filtering derived counts/ranges/sort.** Derive `ARS/USD`, `alquiler/venta`, `total`, `precio_max`, sort-first expectations in `e2e/propiedades-filtering.spec.ts` (lines ~35-47, 98-107, 179-300, 304-401) from the collection instead of literals. **Route:** delegated direct (largest single spec). **Evidence:** moneda/operacion flip + price reorder pass.
- [ ] **T5 — Detail ficha/characteristics/coords/misc.** Derive ficha rows (`detalle-content:165-208`), characteristics (`229-237`), coordinates (`detalle-structure:36-51,177-184`), localidad, destacada probe, WhatsApp inert anchor from content/schema. **Route:** delegated direct. **Evidence:** expensas/cochera/characteristic edit passes.
- [ ] **T6 — Full gate + closeout.** `pnpm test:e2e` green on 3 viewports; record baseline; update this doc with commits and counts. **Route:** delegated verification worker for the full suite (parent bash stays bounded to tail/stat).

## Implementation route

Delegated direct → one `engineering-astro-implementer` per task (writer trigger fires on every task: 2+ non-trivial files; preparation trigger: collection reads prepare the writes). Read-only mapping already done (audit 2026-10-12, ~2k-token handoff with path:line evidence); no second explorer unless the writer reports a gap. Parent does one spot check per task (1 file max) and owns commits.

## Applicable test-first policy

Deterministic runner exists (Playwright e2e against `pnpm build + preview`). RED before GREEN applies per task: observe the focused spec failing on a local content mutation (or on PR #23's price value) before the fix, then GREEN with the same mutation passing and no spec-value edit. If a task has no meaningful runnable RED (pure dedup with identical behavior), the writer records the exception and runs proportional structural checks. Never invent RED/GREEN evidence or a runner.

## Acceptance criteria

1. Setting `casa-2` `precio` to `500000` (PR #23 value) passes the full gate with zero spec edits.
2. Rewording any `titulo`, adding/removing a photo, flipping `moneda`/`operacion`, editing `expensas`/`caracteristicas`/`map_lat|lon` passes with zero spec edits (or exactly one helper line if the helper pins a shape).
3. Adding/removing a listing requires no per-spec map updates; counts, filters, sort, and gallery contracts derive automatically.
4. No new hardcoded business literals introduced; `grep` for the six amounts/titles in `e2e/` returns only helper derivation or zero hits.
5. `pnpm test:e2e` green (3 viewports, 0 failed); no new dependencies; no `src/` behavior change.

## Applicable checks

`pnpm test:e2e` (gate: `check:images` + `build` + `preview` + 3 viewports). `ASTRO_PREVIEW_BACKGROUND=0` in `webServer`; verify tokens over `dist/` with `grep -i` (minifier lowercases hex). Parent bash output bounded to counts/`--stat`/tail.

## Delivery strategy

`ask-on-risk` (default). Forecast: ~600-900 authored changed lines across ~8-12 spec/helper paths (exceeds the ~400 advisory budget), so before the second work-unit commit the parent asks once for the chain strategy (`stacked-to-main` vs `feature-branch-chain`) and caches it with slice boundaries here. Running count updated per work-unit commit below.

## Progress, evidence and next step

- Branch `fix/e2e-decouple-business-data` created from `d4bc2d0` (in sync with `origin/main`); plan doc is the first commit (pending).
- Audit evidence: coupling inventory 2026-10-12 (A-O + Whatsapp/sitemap notes); PR #23 diff (`precio 410000->500000`, 1 file) vs `detalle-content:149` (`ARS 410.000`).
- Work-unit commits: (none yet — recorded here as evidence per task).
- Next step (needs stakeholder approval): approve this plan, then T1 via one bounded writer with `## Allowed edit surfaces` + `## Verification` + `## Key Learnings` closing block.
