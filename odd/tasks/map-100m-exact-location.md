# ODD — Mapa 100m con ubicación exacta (sin offset ni secreto)

**Estado:** delineado 2026-10-12. Worktree aislado `../realtor_pre_webpage-map100m`, branch `feat/map-100m-exact-location` desde `main` (`d4bc2d0`). No toca `fix/e2e-decouple-business-data`. 3 tareas.

**Objetivo:** el círculo de zona pasa a 100m centrado en la ubicación exacta; se elimina el offset manual obligatorio y toda justificación de secreto/privacidad.

**Problema:** hoy hay dos números con roles distintos (400 = radio dibujado, ≥100 = offset mínimo de autoría) y justificaciones de privacidad en comentarios y docs que ya no valen.

**Por qué:** decisión del stakeholder 2026-10-12 — la ubicación de las propiedades no es un secreto; `map_*` es ubicación exacta; basta un radio de 100m como referencia.

**Alcance:**
- `src/lib/map/detail-map.ts` (`ZONE_RADIUS_M` 400 → 100 + comentarios).
- `src/pages/propiedades/[slug].astro` caption `ZONA APROXIMADA · RADIO 100 M` (nota y fallback sin cambios salvo que pidan offset).
- `src/content.config.ts` + 6 frontmatters + `src/pages/propiedades/[slug].json.ts`: `map_lat`/`map_lon` = ubicación exacta, sin offset deliberado.
- Docs: `docs/DESIGN.md` §738-739/742, `docs/PRD_Damero_MVP.md`, `docs/GUIA_CARGA_PROPIEDADES.md`.
- e2e que asserta 400/offset → 100/exacto.

**Fuera de alcance:**
- `design/` no se toca (referencia, no insumo de build). Divergencias `CONFidencial` y dot central se reportan, no se "corrigen" en `design/`.
- Sin cambios visuales fuera del radio y el copy de radio; sin dependencias nuevas.
- Sin push/PR automático; delivery bajo política ordinaria del repo.

---

## Restricciones cerradas

- Ruta ODD, no SDD. Work-unit commit por tarea en la rama de feature, Conventional Commits sin atribución IA.
- **`pnpm`, nunca `npm`/`yarn`.** No tocar `pnpm-workspace.yaml` ni `pnpm-lock.yaml`.
- **Tokens:** sin hex literal fuera de `tokens.css`; sin píldoras/círculos CSS (`999px`); `sage` nunca texto.
- **Sin overflow horizontal** (1280/390/320). **Sin datos inventados** (`PENDIENTE` donde aplique).
- Documentación, comentarios, identificadores y commits en inglés; copy del sitio en español verbatim; este archivo en español.
- `docs/DESIGN.md` gana ante contradicción — el cambio de 400→100 en DESIGN es decisión explícita ya autorizada acá.

---

## Hallazgos que fundan las tareas

**H1 — 400 dibuja, 100 desplazaba.** `detail-map.ts:60` fija el radio; `[slug].json.ts:4` y `DESIGN.md:738` exigen offset ≥100m. No confundirlos al migrar.
**H2 — El copy visible solo declara aproximación.** `ZONA APROXIMADA · RADIO 400 M` + nota mobile-only; no hay justificación de secreto que preservar en UI.
**H3 — Divergencias solo en `design/`.** `06-detalle-mobile.html:226` (`CONFidencial`) y dot central en `05-detalle-desktop.html:221` contradicen `DESIGN.md:739`; fuera de alcance de escritura.

---

## Checklist

### T1 — Radio 100m + copy visible
- **Entregable:** `src/lib/map/detail-map.ts` con `ZONE_RADIUS_M = 100`, comentarios sin "privacy/offset" (decir exact location + 100m reference); `[slug].astro:297` caption `ZONA APROXIMADA · RADIO 100 M`.
- **Criterio:** círculo de 100m centrado en `lat/lon` exactos; caption y `aria-label` consistentes; sin pin/dot/label.
- **Ruta:** delegated direct (writer trigger: 2 ficheros no triviales + e2e asociado). **Checks:** `pnpm build` + `pnpm test:e2e`.
- [x] hecho. Commit: `e8456da`.

### T2 — Contenido exacto sin offset
- **Entregable:** `src/content.config.ts:44-46` y comentarios de los 6 `.md` reescritos a "exact property location"; `src/pages/propiedades/[slug].json.ts:4` sin "already offset ≥100m".
- **Criterio:** ningún comentario exige desfase; schema describe `map_lat`/`map_lon` como ubicación exacta nunca renderizada como número.
- **Ruta:** delegated direct (6+1 ficheros, preparación lectora delegada). **Checks:** `pnpm build` + specs de estructura sin coordenadas en HTML.
- [x] hecho. Commit: `9e7a635`.

### T3 — Docs y e2e a 100m/exacto
- **Entregable:** `DESIGN.md:738-739`, `PRD` (§50/93/127/134/141), `GUIA_CARGA` (§190/202/240) sin offset ni mitigación de privacidad; `e2e/propiedades-detalle-map.spec.ts`, `propiedades-detalle-content.spec.ts:293/309`, `propiedades-detalle-structure.spec.ts` esperan 100m/exacto.
- **Criterio:** `pnpm test:e2e` verde en 3 viewports contra build de producción; `check:images` verde.
- **Ruta:** delegated direct (docs + specs, research previo ya hecho por mapper). **Checks:** `pnpm test:e2e` completo.
- [x] hecho. Commit: `570145a`.

---

## Estrategia de entrega

Forecast <100 líneas autoradas → `single-pr`. Un PR desde `feat/map-100m-exact-location` a `main` cuando T1–T3 estén verdes. Sin chain ni stack.

## Progreso / Evidencia / Siguiente paso

- 2026-10-12: delineado + worktree creado desde `main@d4bc2d0`; mapper devolvió 5 grupos con path:line (400 vs 100 distinguidos).
- Evidencia pendiente: commits T1–T3 + `pnpm test:e2e` en el worktree nuevo.
- Siguiente: ejecutar T1 en el worktree aislado.

## Test-first aplicable

Hay suite e2e determinista y resultado esperado claro (100m/exacto), pero código y expectativas cambian atómicamente en el mismo commit: no hay RED previo con valor (el RED sería `400 ≠ 100` tras cambiar solo un lado). Excepción documentada: cambio atómico código+specs con gate `pnpm test:e2e` como prueba funcional.
