# Damero — Decouple e2e from business data

**Status:** Complete (2026-10-12) on `fix/e2e-decouple-business-data` (base `d4bc2d0`, in sync with `origin/main`). Stakeholder authorized full completion 2026-10-12 ("hacé todo hasta finalizar").
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

- [x] **T1 — Price/currency contract.** Replace `prices` map in `e2e/propiedades-detalle-content.spec.ts:147-162` with format + correspondence assertions (currency code present, amount matches `es-AR` grouping of the collection value, or value read from the built JSON). **Route:** delegated direct (writer trigger: spec + helper = 2 non-trivial files). **Evidence:** RED = `precio: 500000` locally fails today; GREEN = same value passes with no spec edit.
- [x] **T2 — Titles/slugs single source.** Deduplicate `TITLES` x3 (`detalle-structure:26-33`, `galeria-content:24-31`, `galeria-structure:26-33`) and `SLUGS` x5 into the shared helper or dynamic collection read; `view-transitions:137` derives from the same source. **Route:** delegated direct (writer trigger: 4+ specs). **Evidence:** title reword + new-listing dry run pass with zero spec edits (T3 gallery fixtures stay literal by design).
- [x] **T3 — Gallery photo contracts.** Unify `GALLERY`/`PHOTO_COUNTS` x3 + alt/filename literals (`detalle-content:28-35,133`, `galeria-content:96-310`) behind the helper; assert lead/rail/counter/shape, not literal filenames beyond structural `slug/` prefix. **Route:** delegated direct (3 spec files). **Evidence:** add/remove one photo locally passes.
- [x] **T4 — Filtering derived counts/ranges/sort.** Derive `ARS/USD`, `alquiler/venta`, `total`, `precio_max`, sort-first expectations in `e2e/propiedades-filtering.spec.ts` (lines ~35-47, 98-107, 179-300, 304-401) from the collection instead of literals. **Route:** delegated direct (largest single spec). **Evidence:** moneda/operacion flip + price reorder pass.
- [x] **T5 — Detail ficha/characteristics/coords/misc.** Derive ficha rows (`detalle-content:165-208`), characteristics (`229-237`), coordinates (`detalle-structure:36-51,177-184`), localidad, destacada probe, WhatsApp inert anchor from content/schema. **Route:** delegated direct. **Evidence:** expensas/cochera/characteristic edit passes.
- [x] **T6 — Full gate + closeout.** `pnpm test:e2e` green on 3 viewports; record baseline; update this doc with commits and counts. **Route:** delegated verification worker for the full suite (parent bash stays bounded to tail/stat). **Evidence:** 444 passed / 18 skipped / 0 failed (55.0s) on desktop-1280 + mobile-390 + mobile-320.

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

**Chain strategy (cached 2026-10-12, stakeholder choice): `feature-branch-chain`.** Slice boundaries per work-unit commit: T1 prices (`8552eac`), T2 titles/slugs (`501bf7b`), T3 gallery (`6f300e1`), T4 filtering (`870893d`), T5 ficha/misc (`0c64514`), T6 gate+closeout. PR #1 targets the tracker branch; later PRs target the previous PR branch; only the tracker merges to main. Running count: T1 ~89 insertions across 2 paths, T2 105 insertions / 84 deletions across 6 paths, T3 220 insertions / 135 deletions across 4 paths, T4 158 insertions / 49 deletions across 2 paths, T5 268 insertions / 95 deletions across 4 paths (cumulative ~840 insertions).

## Progress, evidence and next step

- Branch `fix/e2e-decouple-business-data` created from `d4bc2d0` (in sync with `origin/main`); plan doc is the first commit (`bad0b9e`).
- Audit evidence: coupling inventory 2026-10-12 (A-O + Whatsapp/sitemap notes); PR #23 diff (`precio 410000->500000`, 1 file) vs `detalle-content:149` (`ARS 410.000`).
- Work-unit commits:
  - `8552eac` test(e2e): derive price expectations from collection (T1). RED/GREEN observed on focused price spec: old spec fails on `precio 500000`, derived contract passes with zero spec edits. 1 passed desktop-1280 both baselines.
  - `501bf7b` test(e2e): derive titles/slugs from collection (T2). RED/GREEN observed: old hardcoded spec fails on reworded `titulo` (unexpected "AMPLIO" value), derived contract passes with zero spec edits. New-listing dry run (`aa-dry-run-test.md`): title loop auto-discovers (1 passed, zero edits); `GALLERY[slug]` fails loud as designed (T3 boundary). Focused verification desktop-1280: 38 passed (detalle-structure, galeria-content, galeria-structure, view-transitions) + 10 passed (detalle-content). `src/content/` restored byte-identical (sha-verified, status clean). No title literals remain in `e2e/` (grep clean); all `SLUGS`/`TITLES`/`KNOWN_SLUGS` derive from the helper.
  - `6f300e1` test(e2e): derive gallery photo contracts from collection (T3). RED/GREEN observed: old hardcoded spec fails on 5th-photo removal (expects `1 / 5`, renders `1 / 4`); derived contract passes with the same 4-photo mutation and zero spec edits. Photo restored byte-identical (sha `acbebe24`, status clean). Discovery: the viewer script swaps via the resolved absolute URL, so post-swap `src` asserts use a derived filename-suffix matcher (`srcEnd()`), not verbatim equality. Focused verification desktop-1280: 29 passed (detalle-content 10 + galeria-content 11 + galeria-structure 8) + 1 passed detalle-structure title spot check. No photo alt/filename/counter literals remain in the 3 specs (grep clean).
  - `870893d` test(e2e): derive filtering counts/ranges/sort from collection (T4). RED/GREEN observed: old hardcoded spec fails on `casa-2` `moneda ARS->USD` flip (expects ARS 3, renders 2); derived contract passes with the same mutation and zero spec edits. Content restored byte-identical (sha `6ce403f2`, status clean). Predicates mirror `matches()` in `src/pages/propiedades/index.astro` (sync points cited inline). Focused verification desktop-1280: 17 passed. No business counts, `precio_max`, or sort-first slugs remain literal (chip-count 0/2 structural asserts kept).
  - `0c64514` test(e2e): derive ficha/characteristics/coords/misc from collection (T5). RED/GREEN observed: old hardcoded ficha fails on `depto-1` `expensas 35000->99000` (expects `35.000`, renders `99.000`); derived contract passes with the same mutation and zero spec edits. Content restored byte-identical (sha `11fb2c2c`, status clean). Label mirrors: `operacion`/`cochera`/`expensas` per `[slug].astro:80-88`, `characteristicLabel` per `[slug].astro:91`, `resolveWhatsAppHref` per `whatsapp.ts` (pending digits + inert anchor pinned as sync points), featured lead per `index.astro:24-26`. Derived coordinate markers eliminate stale-marker false-passes. Focused verification desktop-1280: 29 passed (detalle-content 10 + detalle-structure 12 + view-transitions 7). No ficha/characteristic/coordinate/localidad/WhatsApp business literals remain (field names + protocol-shape checks kept).
  - T6 gate (no code commit): `pnpm test:e2e` green — 444 passed / 18 skipped / 0 failed (55.0s) across desktop-1280 + mobile-390 + mobile-320. Acceptance re-verified at close: `grep` for the six amounts/titles in `e2e/` returns zero hits; `git diff d4bc2d0..HEAD -- src/ pnpm-workspace.yaml pnpm-lock.yaml package.json` is empty (no render, content, or dependency changes); tree clean. Total authored: 874 insertions / 344 deletions across 8 paths (within the 600-900 forecast).
- Next step: done. No push/merge/PR (stakeholder decision under ordinary policy).
