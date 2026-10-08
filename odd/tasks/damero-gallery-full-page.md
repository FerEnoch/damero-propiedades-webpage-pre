# Damero — Galería a página completa (full-page gallery view)

**Estado:** Track abierto (2026-10-08) en la rama `feat/gallery-full-page` (desde `main` @ `a77d407`). **Solo planificación: las tareas NO están iniciadas** — decisión expresa del stakeholder ("no empieces con las tareas, solo haz el doc"). Este documento es el primer commit del track.
**Decisión del stakeholder (2026-10-08):** Opción B — visor de galería como **página completa dedicada** (ruta `/propiedades/[slug]/galeria`), sin maquinaria modal. **La opción A (lightbox modal fullscreen) sigue abierta como fallback si lo implementado no se aprueba** — ver "Opción A — fallback explícito".

**Objetivo:** que al clickear la imagen de una propiedad en la ficha (`/propiedades/<slug>`) se abra la galería de fotos completa en una vista a página completa, acorde al sistema de diseño, sin patrones modales.

## Contexto — qué ya está cableado (no requiere componentes nuevos)

- Schema `fotos[]` (`src`, `titulo?`, `descripcion?`) en `src/content.config.ts`; portada = `fotos[0]` (PRD §7); hoy 6 listings con 28 fotos (5/5/4/5/5/4).
- `[slug].astro` ya renderiza la galería in-page (lead 3:2 + riel de miniaturas `<button>` + contador `1 / N` + flechas de teclado), con JS **inerte** si `fotos: []` (líneas 136–174 y 309–351).
- `PropertyCard.astro` muestra solo la portada en landing y listado → la feature queda **encapsulada en la ficha + la página nueva** (cero cambios en cards).
- Gate de imágenes vigente (`pnpm check:images`, PRD §9 control 3): ≤10 fotos, `.webp`, ancho ≤1600px, <300KB, `src` bajo `/propiedades/<slug>/`. La vista nueva consume los mismos `src` — no cambia el pipeline.
- Patrón de interacción establecido: `<script>` plano de Astro (swap de lead + `aria-current` + contador + ←/→; scroll-snap del riel en mobile).
- `tokens.css` **no tiene escala de z-index** (capas hardcodeadas 30/40/60/70) — irrelevante para B: **B no usa overlay, scrim, focus trap ni scroll-lock** (todo eso es maquinaria de A).

## Por qué B y no A (registro de la decisión)

- `DESIGN.md:492` prohíbe modales donde funciona un patrón inline o de página completa; `:684` declara el bottom sheet de filtros como el **único** modal permitido del sistema; `:226`/`:357`/`:702` definen la galería sin flechas flotantes sobre la foto, sin autoplay, sin dots.
- B es exactamente el patrón de página completa que `:492` prefiere: ruta real, back-button natural, deep-linkeable, **sin contradicción con DESIGN.md**.
- A queda documentada como fallback (abajo) y **no se quema nada implementándola después**: B no introduce dialog/scrim/z-index/focus-trap, así que A sería trabajo aditivo, no retrabajo.

## Alcance

- Página nueva `src/pages/propiedades/[slug]/galeria.astro` (ruta `/propiedades/<slug>/galeria`): foto activa dominante en marco 3:2, contador `N / M`, prev/next como controles reales **fuera de la fotografía**, riel de miniaturas reutilizado, link de vuelta a la ficha, título de la propiedad.
- Entry point: la foto lead de la ficha pasa a ser **link real** a la galería (nombre accesible con cantidad de fotos). El riel in-page conserva su comportamiento actual.
- Interacción del visor: mismo patrón de script plano que la galería actual (clic en thumb / prev/next / ←/→ / `aria-current` / contador), + deep-link `?foto=N` con `history.replaceState` (enhancement).
- Specs e2e nuevas + extendidas (ver T4).
- Docs: registrar la screen nueva en `docs/DESIGN.md` y el alcance en `docs/PRD_Damero_MVP.md` (T0).

**Fuera de alcance:** cards de landing/listado, copy nuevo más allá del mínimo funcional (labels del visor y link de vuelta, español neutro profesional, documentados en T0), `fotos[].descripcion`, pipeline de imágenes, `astro:assets`, dependencias nuevas, cualquier maquinaria modal (scrim/z-index/focus-trap/Esc), cambios en `pnpm-workspace.yaml`/`pnpm-lock.yaml`.

## Tareas

- [ ] **T0 — Docs primero (precedente del track de fotos demo).** Registrar en `docs/DESIGN.md` la vista de galería a página completa como patrón del sistema (banda dominante 3:2, controles fuera de la foto, sin autoplay/dots, navegable por teclado, incl. los labels del visor para que el copy tenga fuente de verdad) y en `docs/PRD_Damero_MVP.md` el alcance agregado. Previo o en el mismo commit que la primera slice de código.
- [ ] **T1 — Página `/propiedades/[slug]/galeria`.** `getStaticPaths` desde la colección (mismo patrón que la ficha); layout: link de vuelta (`← Volver a la ficha`), foto activa 3:2 dominante, fila de controles (prev/next `<button>` ≥44px + contador `N / M`), riel reutilizado con scroll-snap mobile, `DameroPlaceholder` cuando `fotos: []`, meta/title siguiendo la convención de la ficha. Verificación: `pnpm build` — la forma de la ruta (página dinámica anidada junto a `[slug].astro`) es ruteo estándar de Astro: patrones de distinta cantidad de segmentos no compiten (`/propiedades/<slug>` vs `/propiedades/<slug>/galeria`); el build lo confirma.
- [ ] **T2 — Entry point en la ficha.** El lead de `propiedades/[slug].astro` pasa a ser link a la galería con nombre accesible (p.ej. `Ver galería de fotos (N fotos)`); sin JS el link navega igual. Con `fotos: []` el placeholder **sigue sin ser interactivo**. No tocar el script del riel in-page.
- [ ] **T3 — Interacción del visor.** Script plano (mismo patrón que la ficha): clic en thumb y prev/next swapean la foto activa + contador + `aria-current`; ←/→ por teclado (+ Home/End); deep-link `?foto=N` leído al cargar y `history.replaceState` al mover. Sin JS la página renderiza la foto 1 con el riel inerte — misma degradación que la galería vigente. **Sin Esc, sin scroll-lock, sin focus trap** (no es modal).
- [ ] **T4 — Specs.** Nuevas `e2e/propiedades-galeria-structure.spec.ts`, `-content.spec.ts`, `-accessibility.spec.ts` siguiendo las convenciones de `propiedades-detalle-*`: fixtures con los 6 slugs, selectores por `data-*`, auditorías custom de `e2e/browser-audits.ts` (sage-text ban, contraste, piso 12px, targets 44px, ring de foco exacto), overflow horizontal en los 3 viewports, teclado, reduced-motion donde aplique. Extender `propiedades-detalle-content.spec.ts` (lead como link: href y nombre accesible) y la rama sin-fotos (placeholder no interactivo).
- [ ] **T5 — Gate completo.** `pnpm test:e2e` (check:images + build + preview + 3 viewports) y `pnpm check:images` en verde; registrar el baseline nuevo contra el vigente al abrir el track (no inventar números).
- [ ] **T6 — Cierre.** Commits por work unit en `feat/gallery-full-page` con la evidencia registrada acá; espejo en Engram (`odd/damero-gallery-full-page/tasks`) actualizado; push/PR/merge: decisión del stakeholder.

## Ruta de implementación

Slices T0–T5 → `engineering-astro-implementer` (delegación por slice; writer trigger: multi-archivo). Verificación por slice → gate delegado (RDD) + `engineering-astro-verifier` según tier. Detalle fino de CSS/tokens durante T1–T3 guiado por `docs/DESIGN.md`.

## Criterios de aceptación

1. Click en el lead de la ficha navega a `/propiedades/<slug>/galeria` **sin JS** (link real).
2. El visor muestra foto activa + contador + prev/next + riel; navegable por teclado (←/→/Home/End); **controles fuera de la fotografía, sin autoplay, sin dots** (DESIGN.md:357/702).
3. `pnpm test:e2e` completo en verde (3 viewports, 0 failed) incluyendo specs nuevas; cero overflow horizontal en 1280/390/320.
4. Solo tokens (sin hex fuera de `:root`, sin radios 999px, sage nunca como texto); focus ring global intacto; targets ≥44px.
5. `fotos: []` conserva el comportamiento actual (placeholder, sin link a galería).
6. Sin dependencias nuevas; `pnpm-workspace.yaml`/`pnpm-lock.yaml` intactos.
7. **No se agrega maquinaria modal** — la opción A sigue siendo trabajo aditivo puro (ver fallback).

## Riesgos / flags

- **Screen sin referencia aprobada**: `design/screens/05`/`06` no incluyen una vista de galería. T0 la documenta en DESIGN.md; si el stakeholder prefiere una referencia visual antes del código, T0 es el gate natural.
- **Interacción depende de JS** (consistente con la galería vigente del sitio); sin JS degrada a foto 1 + riel inerte + link de vuelta funcional.
- **Fotos de 1600px en desktop grande**: se consumen con el mismo `src` (límites de `check:images` intactos, sin pipeline nuevo).
- **Presupuesto de delivery**: forecast ~450–600 líneas autoradas (página + estilos + script + specs + docs) > 400 → la estrategia `ask-on-risk` (default) preguntará por chain strategy al superar el presupuesto; registrar los boundaries de slices acá.
- Baseline e2e actual: registrar al ejecutar T5.

## Opción A — fallback explícito

**La opción A (visor fullscreen como modal/lightbox) sigue abierta** si lo implementado en B **no se aprueba** (validación del stakeholder o review). Requisitos de A si se activa:

1. **Enmienda de `docs/DESIGN.md` primero** — hoy es un patrón prohibido (`:492` modales, `:684` único modal permitido, `:226`/`:357`/`:702` chrome sobre la foto). La enmienda la aprueba el stakeholder, no el track.
2. Maquinaria que B **no** incluye y A sí necesitaría: `<dialog>` + `showModal()` (top-layer, foco, Esc), scrim plano (`color-mix(forest-ink 40%)`, precedente `index.astro:1146`), focus trap + scroll-lock + devolución de foco (precedente del sheet de filtros, `index.astro:842–924`), capa z-index por encima de 40 (sin token hoy: 30/40/60/70).
3. Composición compatible con `:357/:702`: controles **fuera** de la fotografía (sin flechas flotantes, sin autoplay, sin dots).
4. Plan propia bajo su feature doc (p.ej. `odd/tasks/damero-gallery-modal.md`); nada del trabajo de B se descarta: la página de B quedaría como destino no-JS/deep-link del modal.

**No resolver A en silencio** (AGENTS.md): cualquier activación del fallback se decide y documenta explícitamente.
