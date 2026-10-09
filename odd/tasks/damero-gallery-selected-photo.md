# Damero — Gallery preserves the selected photo (detail → full-page)

**Estado:** En implementación (2026-10-09) sobre la PR abierta #21 (`feat/gallery-full-page`, worktree `/tmp/opencode/realtor-gallery-wt`). Enmienda del track cerrado `damero-gallery-full-page` — no lo reabre ni lo reescribe.
**Decisión del stakeholder (2026-10-09):** cuando el usuario agrandó una foto del riel en la ficha y desde ahí abre la galería full-page, la foto grande al llegar debe ser la misma que eligió, sin reordenar la galería.

**Objetivo:** el lead de la ficha propaga la foto activa (`?foto=N`) y la galería full-page llega renderizando esa foto como activa, conservando el morph cross-document (`propiedad-<slug>`) sobre la misma fotografía.

**Problema:** hoy el lead enlaza a `/galeria` sin parámetro y la galería siempre renderiza `fotos[0]` en el HTML inicial; el `?foto=N` se aplica por JS después del load — tarde para el snapshot de la view transition (morph siempre foto-1 → foto-1 + flash a la N).

**Por qué este enfoque:** el sitio es estático (un solo HTML por galería; el query no genera variantes en el build). La única forma de que el snapshot de entrada ya traiga la foto N sin rutas nuevas ni reorden es: (a) el detalle sincroniza el `href` del lead con la foto activa, y (b) un script síncrono mínimo en el `<head>` de la galería reescribe el frame activo antes del primer render. Sin JS se conserva la degradación actual (foto 1).

## Alcance

- `src/pages/propiedades/[slug].astro`: el `activate(index)` del riel además actualiza el `href` del lead a `/propiedades/<slug>/galeria?foto=<index+1>` (+ estado inicial `?foto=1`). Sin cambios visuales ni de copy.
- `src/pages/propiedades/[slug]/galeria.astro`: script bloqueante mínimo en `<head>` que lee `?foto=N` (entero 1-based en rango; inválidos → foto 1) y reescribe `src/alt` del frame activo, contador y `aria-current` antes del primer render. El script principal conserva su lógica (el deep-link post-load pasa a ser convergente, no el mecanismo primario). Sin reorden de `fotos[]`, sin segundo elemento con nombre de transición.
- Specs: extender `e2e/propiedades-detalle-content.spec.ts` (el href sigue a la selección) y `e2e/propiedades-galeria-content.spec.ts` (llegada con `?foto=3` renderiza la foto 3 como activa sin flash/reorden). Sin specs nuevas salvo que el writer lo justifique.
- Docs: una línea en `docs/DESIGN.md` §17.5 (propagación de la foto activa) solo si el writer toca conducta documentada.

**Fuera de alcance:** reordenar `fotos[]`, rutas por foto (`/galeria/2`), `astro:transitions`/router client-side, VT same-document para el swap in-page, cambios visuales o de copy, cards, pipeline de imágenes, dependencias nuevas, `pnpm-workspace.yaml`/`pnpm-lock.yaml`, push/merge de la PR (decisión del stakeholder).

## Tareas

- [x] **S1 — Detalle propaga la selección.** `activate()` sincroniza el `href` del lead (`?foto=N`); inicial `?foto=1`. **Evidencia:** test-first RED (2 failed / 8 passed, `propiedades-detalle-content`, desktop-1280) → GREEN (10 passed, desktop-1280).
- [x] **S2 — Galería llega en la foto pedida.** Script sincrónico `is:inline` tras el riel (solo `src/alt` + contador + `aria-current`; inválidos → foto 1; `fotos: []` inerte; no toca la URL). **Evidencia:** test-first RED (1 failed / 10 passed — el test pre-paint con el módulo diferido extirpado del documento servido) → GREEN (21 passed detalle+galería, desktop-1280).
- [x] **S3 — Gate completo.** `pnpm test:e2e` en verde (3 viewports, 0 failed); registrar baseline. **Evidencia:** `CI=1 pnpm test:e2e`: **444 passed / 18 skipped / 0 failed** (51.2s) — baseline del track 435/18/0, delta +9 (3 specs nuevos × 3 viewports).

## Ruta de implementación

Delegated direct → un solo `engineering-astro-implementer` en `/tmp/opencode/realtor-gallery-wt` (writer trigger: 2 archivos no triviales + specs; preparation trigger: la lectura prepara la escritura). RDD off (clone-local): el writer ejecuta la verificación autorizada y reporta `<comando>: <resultado observado>`; el padre hace spot check + `review assess` sobre el diff. Verificación independiente solo si el writer reporta `partial`/`blocked`.

## Política test-first aplicable

Hay runner determinístico vigente (Playwright e2e) y resultado esperado claro: S1/S2 observan RED (spec nuevo/extendido falla sobre el árbol actual) antes de implementar GREEN. Excepción solo documentada (sin runner o sin RED con sentido) con checks proporcionales.

## Criterios de aceptación

1. En la ficha, tras clickear el thumbnail 3, el lead enlaza a `/galeria?foto=3` y muestra la foto 3; clickear el lead navega sin JS.
2. Abrir `/galeria?foto=3` muestra la foto 3 como activa desde el primer render (sin flash a foto 1), con contador `3 / N`, `aria-current` en el thumb 3 y el orden intacto.
3. `?foto=0`, `?foto=99`, `?foto=abc` degradan a foto 1; `fotos: []` sin cambios.
4. Un solo `view-transition-name` por página (`propiedad-<slug>` en el frame); tokens/visual intactos; cero overflow en 1280/390/320.
5. `pnpm test:e2e` en verde; sin dependencias nuevas.

## Checks aplicables

`pnpm test:e2e` (gate: `check:images` + `build` + `preview` + 3 viewports). `ASTRO_PREVIEW_BACKGROUND=0` vigente en el `webServer`; verificar tokens sobre `dist/` con `grep -i`.

## Progreso, evidencia y siguiente paso

- S1 + S2 implementados con test-first (RED observado en ambos antes del GREEN); S3 gate completo en verde.
- Verificación estructural sobre `dist/`: el script de llegada viaja como `<script>` clásico inline ubicado tras `</section>` y antes del módulo diferido; el detalle sirve el lead con `?foto=1`.
- Commits en `feat/gallery-full-page` (ver historia por identidades finales en el commit de cierre).
- Siguiente paso (decisión del stakeholder): push a `origin/feat/gallery-full-page` para actualizar la PR #21; merge NO autorizado aquí.
