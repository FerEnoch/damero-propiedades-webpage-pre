# Damero — Decouple de sondas e2e (probe targets)

**Estado:** en curso (2026-10-13). Slice 06 de la cadena `damero-e2e-decouple`: branch `fix/e2e-decouple-06-probes` desde la tracker `fix/e2e-decouple-business-data` (`20f34ed`). PR pendiente.

**Objetivo:** ninguna spec depende de un slug de las propiedades de muestra. Cada test elige su propiedad sonda desde la colección con la forma que necesita; si ninguna cumple, se saltea con razón explícita. El gate pasa con datos reales, sin editar specs.

**Problema:** el track T1–T6 derivó los valores asertados pero dejó 35 referencias literales a `casa-3-amb-guadalupe-santa-fe` y `lote-600-m2-candioti-santa-fe` en 8 specs (consts y `page.goto`). Cuando las muestras se borren (planificado), esos tests navegan a rutas inexistentes (404) o evalúan la página equivocada. Caso hermano: `filtering:383` selecciona `'Santa Fe'` asumiendo que todo el portfolio es Santa Fe.

**Por qué:** hallazgo del 2026-10-13 (stakeholder, revisando `galeria-structure:93`). Las propiedades de muestra se reemplazan por datos reales: ese es el contrato del decouple; hoy el gate todavía exige que existan las muestras.

## Alcance

- `e2e/helpers/content-expectations.ts`: selector de sonda con forma (`expectedProbeSlug(minPhotos)`).
- 8 specs, 35 referencias: `galeria-content` (10), `detalle-content` (6), `detalle-accessibility` (6), `galeria-structure` (5), `detalle-structure` (5), `view-transitions` (1), `galeria-accessibility` (1), `detalle-map` (1).
- `e2e/propiedades-filtering.spec.ts:382-385`: derivar localidad del select y conteo esperado.

**Fuera de alcance:** loops existentes (ya derivan); `src/`; contenido; dependencias nuevas; `pnpm-workspace.yaml`/`pnpm-lock.yaml`; el diseño de sonda única por test se mantiene (runtime).

## Restricciones

- Ruta ODD, no SDD. `pnpm`, nunca `npm`/`yarn`.
- Documentación, comentarios e identificadores en inglés; este archivo en español.
- **Política sin-forma:** skip con razón explícita; nunca un fallback silencioso a un literal.
- Dry-run de aceptación: la eliminación temporal de las dos muestras se restaura byte-idéntica (sha256 verificado) antes de cerrar.
- Sin commit/push desde el writer; la orquestación los ejecuta.

## Tareas

- [x] **T1 — Helper `expectedProbeSlug(minPhotos = 1)`.** Primer listing en orden canónico con ≥ minPhotos fotos; `undefined` si no hay. **Ruta:** delegated direct (writer trigger). **Checks:** focused desktop-1280.
- [x] **T2 — Derivar las 35 referencias en los 8 specs.** Forma por test: visor/galería `?foto=3` → ≥3; rail-thumbnail → ≥2; template/a11y/map/view-transitions → ≥1. Imports faltantes: `detalle-map`, `galeria-accessibility`, `detalle-accessibility`. **Checks:** focused + grep cero literales.
- [x] **T3 — Filtering localidad + corte USD.** `selectOption` derivado + conteo esperado (`hab ≥ umbral ∧ cochera ∧ localidad`). Scope extendido en curso: el `50000` literal del narrowing (fill, URLs, chip) también se deriva del dominio USD (`USD_NARROW_MIN`: primer valor step-aligned sobre el min que baja ≥1 listing; skip explícito en dominio de un punto). **Checks:** focused.
- [ ] **T4 — Aceptación.** RED: con las muestras borradas (temp), los specs actuales fallan. GREEN: con el fix, los 8 specs pasan (o skipean con razón) con las muestras borradas; restaurar byte-idéntico; gate completo verde. **Ruta:** verificador independiente.

## Estrategia de entrega

Cadena `feature-branch-chain` (ya elegida): slice 06 → tracker → #25 → main. Forecast <250 líneas → una sola slice.

## Progreso / Evidencia / Siguiente paso

- 2026-10-13: doc creado. Worktree `../realtor_pre_webpage-map100m`, branch `fix/e2e-decouple-06-probes` desde `20f34ed`.
- 2026-10-13: T1–T3 implementados por worker (sin subagentes desde acá por falta de fondos; resto inline). RED dry-run pre-fix con las 2 muestras borradas: 7 failed (galeria-structure/detalle-content probes). GREEN dry-run post-fix: 9 specs desktop → **74 passed, 7 skipped, 0 failed** (skips: 4 viewport gates preexistentes + 3 narrowing por dominio USD de un punto). Restauración byte-idéntica verificada por sha256. Grep cero: slugs de muestra y `50000`/`Santa Fe` → vacío en `e2e/*.ts`.
- 2026-10-13: hallazgo extra del dry-run: `filtering` hardcodeaba `50000` (fill + URLs + chip) y rompía al colapsar el dominio USD; derivado a `USD_NARROW_MIN` con skip explícito. Focused normal filtering desktop: 17 passed, 2 skipped.
- 2026-10-13: gate completo `pnpm test:e2e` → **444 passed, 18 skipped, 0 failed (51.9s)**, igual al baseline de la cadena.
- Siguiente: commit + push de la branch + PR slice 06 → tracker (pendiente autorización); luego #25 a main.
