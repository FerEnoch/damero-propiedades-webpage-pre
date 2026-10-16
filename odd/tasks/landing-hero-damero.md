# landing-hero-damero — Abstract damero hero redesign (landing)

Objective: replace the placeholder-looking landing hero with a distinctive abstract
damero composition inspired by `public/images/hero_banner_background.jpg`, CSS/SVG only.
Branch: `feat/landing-hero-damero`. Worktree: sibling `realtor_pre_webpage-hero`.
Delivery strategy: single-pr (forecast well under 400 authored lines).
Test runner: `pnpm test:e2e` (acceptance gate) + Playwright screenshots at 1280/390 for visual review.

## Specs

- S1 — Abstract damero direction (user chose "Abstracta damero"): "vamos a hacer un mejor
  hero inspirado en el @public/images/hero_banner_background.jpg". Pure CSS/SVG evolution of
  the 45°-rotated-square gesture, sage accents, clean zone for the headline. Zero new raster
  assets, so the `check:images` gate is unaffected by construction.
- S2 — Spirit/message fit: "tiene que reflejar el espíritu de la página y el diseño, del
  mensaje." Damero Propiedades = Santa Fe real-estate studio, legal-registry character,
  editorial serif (Newsreader), asymmetric 7/5 splits, left-aligned ragged right, never
  centred. The memorable thing is the 45° square repeated with discipline (DESIGN §2).
- S3 — Copy frozen (user chose "Mantener verbatim"): HERO eyebrow/headline/subhead/CTA in
  `src/data/landing.ts` stay byte-identical (DESIGN §16, verbatim from approved screens).
  Single primary CTA `Ver cartera de propiedades` → `/propiedades`; no WhatsApp in hero (§6).
- S4 — Flow: "trabajemos en esto en una rama aparte y analizo cómo queda estéticamente,
  apruebo y luego se crea la PR". Isolated worktree, visual review by stakeholder from
  screenshots + local preview, push + PR only after explicit approval. No auto-merge, ever.
- S5 — Quality/gate constraints (DESIGN.md wins contradictions): tokens only, never a hex
  literal outside `tokens.css` `:root`; `--color-sage` never rendered text (use
  `--color-sage-ink`); never a pill/circle/`border-radius:999px` (scale xs2/sm4/md6/lg12);
  no horizontal overflow at 1280/390/320; hero band `clamp(112px,15vw,200px)` full-bleed;
  mobile stacks band-then-type (headline below band, never over it); lead-adjacent assets
  eager+fetchpriority only if raster added (not planned); `pnpm test:e2e` green
  (landing-structure, landing-content, landing-cta-layout, landing-accessibility untouched
  unless a spec pins superseded decor — then update spec alongside with reason logged).
- S6 — Variants: "Haz varias pruebas si es necesario". Implement variant A, parent
  screenshot-reviews (1280 + 390), iterate; variant B only if A misses. No AI-slop
  fingerprints (no gradients-for-impact, no glassmorphism, no generic cards, no centred
  layout, no filler copy).

## Tasks

- T1 — Setup worktree + branch + this doc + mirror. Route: inline. Status: done. Evidence: worktree `../realtor_pre_webpage-hero`, branch `feat/landing-hero-damero` @82dadb4. S4.
- T2 — Implement variant A (CSS/SVG hero, copy frozen). Route: delegated (Codex gpt-6.1-sol, workspace-write). Status: done. Evidence: commit `a03fffc` "feat(hero): compose abstract damero edge clusters", `src/pages/index.astro` only (+83/-8), `pnpm build` 22 pages OK. S1 S2 S3 S5.
- T3 — Visual review: build + screenshots 1280/390/320, iterate to convergence. Route: inline (parent). Status: done (round 1). Evidence: `/tmp/opencode/hero-a-1280.png` + `hero-a-390.png` reviewed; verdict: clear improvement, on-brand, stacked §5 composition kept; right cluster slightly unresolved, held for stakeholder eyes before iterating. S2 S5 S6.
- T4 — Acceptance gate `pnpm test:e2e` green + docs alongside. Route: inline (parent). Status: done. Evidence: 462 passed / 18 skipped / 0 failed (desktop-1280, mobile-390, mobile-320); zero e2e changes needed. S5.
- T5 — Push + open PR after explicit stakeholder approval. Route: inline (parent, branch-pr skill). Status: done. Evidence: pushed `feat/landing-hero-damero`, PR #41 opened against `main`; repo precedent used for body (no labels/issues — generic skill N/A here). Merge stays manual per standing instruction. S4.
- T6 — Compact header WhatsApp label below 375px (stakeholder review round). Route: inline (parent). Status: done. Evidence: second work-unit commit (see Log L6); screenshots 320 (one line) + 390 (full label intact); gate 462/18/0 with zero spec changes. S5 + stakeholder-authorized §16 exception (L6).

## Log

- L1 (user request verbatim, 2026-10-16): "Consulta de tema diseño: me parece que el hero en la landing parece un placeholder más que un hero. fijate el hero que tenemos en @public/images/hero_banner_background.jpg Sé que no es muy bueno, pero es quizás algo mejor que el que hay... De todas maneras, necesitamos mejorarlo: - vamos a hacer un mejor hero inspirado en el @public/images/hero_banner_background.jpg - tiene que reflejar el espíritu de la página y el diseño, del mensaje. - trabajemos en esto en una rama aparte y analizo cómo queda estéticamente, apruebo y luego se crea la PR - utiliza los skills, mcp y modelos más capacitados para este diseño. - Haz varias pruebas si es necsario - considera los modelos actualmente incluidos en opencode-go (esta subscripción) por si necesitas uno con capaciad de visión (como deepseek v4 vision) - considera a gpt 6.1 sol en codex para tareas de diseño, orquestación y/o creación (el reporte final lo hablo con vos) Pregunta todo lo que necesites antes de empezar"
- L2 (user answers, 2026-10-16): direction = "Abstracta damero", copy = "Mantener verbatim".
- L3 (parent analysis, 2026-10-16): current hero = full-bleed damero band + type block + single diamond outline at 6% opacity (near-invisible brand gesture, reads as empty band = placeholder feel). The jpg has the needed structure: pattern flanks + clean center for headline. Route decision: Codex per established repo pattern + explicit user steer; parent does vision review via screenshots (Read tool on PNGs) and owns git/gate/PR. Codex CLI 0.162.1 verified present; main clean @82dadb4 before branch.
- L4 (skills, 2026-10-16): taste-design + frontend-design loaded. Applicable hero rules forwarded to implementer: asymmetric left-aligned, one CTA, no filler, no slop fingerprints; repo DESIGN.md overrides skill defaults on conflict (Newsreader serif, sage tokens, radius scale).
- L5 (variant A review, 2026-10-16): gate green with zero spec changes; screenshots approved for stakeholder review. Open design tension found and NOT silently resolved: §5 ASCII (band, then type on canvas, stacked) vs §10 prose ("desktop places headline in the clean zone of the pattern"). Implementation keeps the §5 stacked reading the site already ships; switching to overlay would need new specs + stakeholder call. Right-edge cluster refinement held pending stakeholder verdict on A.
- L6 (T6 header fix, 2026-10-16): stakeholder approved variant A overall, asked to fix 2-line "Consultar por WhatsApp" wrap at 320 and to pick the best of: shrink font / change copy / add icon / move into hamburger. Decision: responsive short label `WhatsApp` below 375px (`SiteHeader.astro`, full/short span swap, same href, one accessible name via display:none). Rejected with reasons: shrinking bottoms out at the §10 12px floor without closing the ~30px gap; no WhatsApp glyph exists in the header context and an icon adds width where none exists; moving behind the menu is explicitly banned by §10 and was not implemented. The short visible label is a stakeholder-authorized exception to §16 verbatim (desktop and ≥376px keep the screens' exact text); no spec pins header label text (WhatsApp specs assert hrefs only) so gate stays untouched.
- L7 (PR, 2026-10-16): stakeholder approved ("no más retoques"), PR #41 opened (`feat/landing-hero-damero` → `main`), temp screenshots deleted. Merge is the stakeholder's call; worktree `../realtor_pre_webpage-hero` stays until post-merge cleanup.
