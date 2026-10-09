# Damero — Galería a página completa (full-page gallery view)

**Estado:** Track abierto (2026-10-08) en la rama `feat/gallery-full-page` (desde `main` @ `a77d407`). **Implementación autorizada por el stakeholder (2026-10-09)** — tareas T0–T6 en curso. Enmienda de view transitions incorporada al plan sobre el commit de apertura `ac8c172`.
**Decisión del stakeholder (2026-10-08):** Opción B — visor de galería como **página completa dedicada** (ruta `/propiedades/[slug]/galeria`), sin maquinaria modal. **La opción A (lightbox modal fullscreen) sigue abierta como fallback si lo implementado no se aprueba** — ver "Opción A — fallback explícito".
**Decisión del stakeholder (2026-10-09):** la transición ficha → galería debe hacerse con **View Transitions** (API nativa del browser): enfoque CSS cross-document (`@view-transition` + `view-transition-name` emparejado, nombre unificado `propiedad-<slug>`), sin router client-side — ver "Transición ficha → galería con view transitions" y "Coordinación".

**Objetivo:** que al clickear la imagen de una propiedad en la ficha (`/propiedades/<slug>`) se abra la galería de fotos completa en una vista a página completa, acorde al sistema de diseño, sin patrones modales.

## Contexto — qué ya está cableado (no requiere componentes nuevos)

- Schema `fotos[]` (`src`, `titulo?`, `descripcion?`) en `src/content.config.ts`; portada = `fotos[0]` (PRD §7); hoy 6 listings con 28 fotos (5/5/4/5/5/4).
- `[slug].astro` ya renderiza la galería in-page (lead 3:2 + riel de miniaturas `<button>` + contador `1 / N` + flechas de teclado), con JS **inerte** si `fotos: []` (líneas 136–174 y 309–351).
- `PropertyCard.astro` muestra solo la portada en landing y listado → la feature queda **encapsulada en la ficha + la página nueva** (cero cambios en cards).
- Gate de imágenes vigente (`pnpm check:images`, PRD §9 control 3): ≤10 fotos, `.webp`, ancho ≤1600px, <300KB, `src` bajo `/propiedades/<slug>/`. La vista nueva consume los mismos `src` — no cambia el pipeline.
- Patrón de interacción establecido: `<script>` plano de Astro (swap de lead + `aria-current` + contador + ←/→; scroll-snap del riel en mobile).
- **View Transitions cross-document son CSS puro** (`@view-transition { navigation: auto; }` + `view-transition-name`): enhancement progresivo sin JS, consistente con la filosofía del sitio (JS = excepción). La alternativa nativa de Astro (`<ClientRouter />`, `astro:transitions`, incluida en astro@7.3.5) intercepta todas las navegaciones del sitio — descartada (ver la sección de transición).
- `tokens.css` **no tiene escala de z-index** (capas hardcodeadas 30/40/60/70) — irrelevante para B: **B no usa overlay, scrim, focus trap ni scroll-lock** (todo eso es maquinaria de A).

## Por qué B y no A (registro de la decisión)

- `DESIGN.md:492` prohíbe modales donde funciona un patrón inline o de página completa; `:684` declara el bottom sheet de filtros como el **único** modal permitido del sistema; `:226`/`:357`/`:702` definen la galería sin flechas flotantes sobre la foto, sin autoplay, sin dots.
- B es exactamente el patrón de página completa que `:492` prefiere: ruta real, back-button natural, deep-linkeable, **sin contradicción con DESIGN.md**.
- A queda documentada como fallback (abajo) y **no se quema nada implementándola después**: B no introduce dialog/scrim/z-index/focus-trap, así que A sería trabajo aditivo, no retrabajo.

## Transición ficha → galería con view transitions (2026-10-09)

- **Requisito del stakeholder:** al clickear la foto lead en la ficha, la apertura de la galería se hace con View Transitions, no como navegación seca.
- **Enfoque elegido: CSS cross-document, cero JS.** `@view-transition { navigation: auto; }` en `src/styles/global.css` + `view-transition-name` emparejado con el **nombre unificado `propiedad-<slug>`**: el `<img>` lead de la ficha y el `<img>` activo de la galería llevan el mismo nombre; el browser anima posición/tamaño del elemento entre documentos (morph). El prefijo `propiedad-` garantiza un `<custom-ident>` válido (nunca arranca en dígito).
- **Morph de la misma foto:** el lead ES `fotos[0]` (PRD §7) y la galería renderiza `fotos[0]` como foto activa al llegar desde la ficha → el morph es la misma foto creciendo, no un cross-fade entre fotos distintas.
- **Motion, consistente con DESIGN.md:** `:434–442` (motion restringido que confirma un cambio de estado y se aparta) y `:513` (`prefers-reduced-motion` honrado globalmente): `@media (prefers-reduced-motion: reduce) { @view-transition { navigation: none; } }` — la navegación queda normal. El neutralizador blanket existente (`global.css:102–111`, `*` → 0.01ms) **no** alcanza a los pseudo-elementos `::view-transition-*`; el opt-out a nivel `navigation` es la cobertura correcta.
- **Regla global (flag para T0):** `navigation: auto` aplica a todas las navegaciones del sitio (cross-fade sutil por defecto donde el browser lo soporta); no existe scoped por link. T0 registra el patrón de movimiento completo en DESIGN.md para aprobación.
- **Soporte / degradación (verificado 2026-10-09 vía caniuse / MDN / developer.chrome.com):** cross-document en Chromium/Edge 126+, Opera 112+ y Safari 18.2+ (macOS e iOS); Firefox aún no (solo same-document) → navegación normal, cero fallback JS. `<meta name="view-transition">` está deprecado — no usar. Con `fotos: []` no hay nombre ni transición (placeholder no interactivo).
- **Alternativa descartada: `<ClientRouter />`** (`astro:transitions`, presente en astro@7.3.5): mismo API pero intercepta TODAS las navegaciones (swap SPA-like) y cambia la semántica de ejecución de los `<script>` inline existentes (riel de la ficha, sheet de filtros) → re-auditar el JS del sitio para el mismo efecto visual. Solo se retoma por decisión explícita si se exige su fallback animado cross-browser.
- **Fuera de scope:** view transitions same-document (`startViewTransition`) para el swap in-page del visor — el swap sigue instantáneo, consistente con la galería vigente.

## Coordinación con el track `damero-view-transitions` (cards → ficha) — 2026-10-09

Track hermano (rama `feat/view-transitions`, plan propio en `odd/tasks/damero-view-transitions.md`): view transitions en las imágenes de las cards (destacadas del home y listado) → lead de la ficha. Comparte con este track tres superficies:

1. `@view-transition { navigation: auto; }` en `global.css` — regla idéntica en ambos planes; quien mergea primero la establece.
2. **Nombre unificado `propiedad-<slug>` para todo el hilo visual** (card → lead de la ficha → foto activa de la galería). Un elemento = un nombre; unicidad por página (un duplicado invalida la transición). El ejemplo `galeria-lead` del primer borrador de esta enmienda quedó **descartado**. La convención se registra en `docs/DESIGN.md` (T0) como fuente de verdad (reportada al stakeholder, no resuelta en silencio — AGENTS.md).
3. Plomería compartida: prop opcional `transitionName` en `DameroPlaceholder` — esta track la consume para la foto activa; quien mergea segundo rebasa sobre lo mergeado.

Contexto del incidente (2026-10-09): dos sesiones concurrentes compartieron el checkout principal; la primera versión de esta enmienda quedó sin commitear y se preservó fuera del repo (`/tmp/opencode/damero-gallery-full-page.amended.md`) antes de adoptar worktrees aislados por track.

## Alcance

- Página nueva `src/pages/propiedades/[slug]/galeria.astro` (ruta `/propiedades/<slug>/galeria`): foto activa dominante en marco 3:2, contador `N / M`, prev/next como controles reales **fuera de la fotografía**, riel de miniaturas reutilizado, link de vuelta a la ficha, título de la propiedad.
- Entry point: la foto lead de la ficha pasa a ser **link real** a la galería (nombre accesible con cantidad de fotos). El riel in-page conserva su comportamiento actual.
- Transición ficha → galería con view transitions cross-document (CSS puro, nombre unificado `propiedad-<slug>` emparejado lead ↔ foto activa, opt-out reduced-motion).
- Plomería compartida: prop opcional `transitionName` en `DameroPlaceholder` (la foto activa de la galería la usa; el track VT la reutiliza).
- Specs e2e nuevas + extendidas (ver T4).
- Docs: registrar la screen nueva en `docs/DESIGN.md` y el alcance en `docs/PRD_Damero_MVP.md` (T0).

**Fuera de alcance:** cards de landing/listado, copy nuevo más allá del mínimo funcional (labels del visor y link de vuelta, español neutro profesional, documentados en T0), `fotos[].descripcion`, pipeline de imágenes, `astro:assets`, dependencias nuevas, view transitions same-document (`startViewTransition` para el swap in-page del visor), cualquier maquinaria modal (scrim/z-index/focus-trap/Esc), cambios en `pnpm-workspace.yaml`/`pnpm-lock.yaml`.

## Tareas

- [ ] **T0 — Docs primero.** Registrar en `docs/DESIGN.md` la vista de galería a página completa como patrón del sistema (banda dominante 3:2, controles fuera de la foto, sin autoplay/dots, navegable por teclado, transición ficha → galería vía view transitions cross-document — regla global, nombre unificado `propiedad-<slug>` con unicidad por página, opt-out reduced-motion, degradación sin fallback JS —, incl. los labels del visor para que el copy tenga fuente de verdad) y en `docs/PRD_Damero_MVP.md` el alcance agregado. Previo o en el mismo commit que la primera slice de código.
- [ ] **T1 — Página `/propiedades/[slug]/galeria`.** `getStaticPaths` desde la colección (mismo patrón que la ficha); layout: link de vuelta (`← Volver a la ficha`), foto activa 3:2 dominante, fila de controles (prev/next `<button>` ≥44px + contador `N / M`), riel reutilizado con scroll-snap mobile, `DameroPlaceholder` cuando `fotos: []`, meta/title siguiendo la convención de la ficha. La foto activa lleva `propiedad-<slug>` (via `transitionName` de `DameroPlaceholder`); `@view-transition { navigation: auto; }` + opt-out reduced-motion van en `src/styles/global.css`. Verificación: `pnpm build` — la forma de la ruta (página dinámica anidada junto a `[slug].astro`) es ruteo estándar de Astro: patrones de distinta cantidad de segmentos no compiten (`/propiedades/<slug>` vs `/propiedades/<slug>/galeria`); el build lo confirma.
- [ ] **T2 — Entry point en la ficha.** El lead de `propiedades/[slug].astro` pasa a ser link a la galería con nombre accesible (p.ej. `Ver galería de fotos (N fotos)`); sin JS el link navega igual. El `<img>` del lead lleva `propiedad-<slug>` (mismo nombre que la card del track VT; el morph es la misma foto: el lead ES `fotos[0]`). Con `fotos: []` el placeholder **sigue sin ser interactivo**. No tocar el script del riel in-page.
- [ ] **T3 — Interacción del visor.** Script plano (mismo patrón que la ficha): clic en thumb y prev/next swapean la foto activa + contador + `aria-current`; ←/→ por teclado (+ Home/End); deep-link `?foto=N` leído al cargar y `history.replaceState` al mover. Sin JS la página renderiza la foto 1 con el riel inerte — misma degradación que la galería vigente. **Sin Esc, sin scroll-lock, sin focus trap** (no es modal). El script no participa de la transición entre páginas: el swap del visor sigue instantáneo, sin VT same-document.
- [ ] **T4 — Specs.** Nuevas `e2e/propiedades-galeria-structure.spec.ts`, `-content.spec.ts`, `-accessibility.spec.ts` siguiendo las convenciones de `propiedades-detalle-*`: fixtures con los 6 slugs, selectores por `data-*`, auditorías custom de `e2e/browser-audits.ts` (sage-text ban, contraste, piso 12px, targets 44px, ring de foco exacto), overflow horizontal en los 3 viewports, teclado, reduced-motion donde aplique. View transitions: computar `view-transition-name` en lead/activa (debe ser `propiedad-<slug>`) y verificar la regla `@view-transition` + el opt-out reduced-motion en el CSS servido (ojo minificador: `grep -i`). Extender `propiedades-detalle-content.spec.ts` (lead como link: href y nombre accesible) y la rama sin-fotos (placeholder no interactivo).
- [ ] **T5 — Gate completo.** `pnpm test:e2e` (check:images + build + preview + 3 viewports) y `pnpm check:images` en verde; registrar el baseline nuevo contra el vigente al abrir el track (no inventar números).
- [ ] **T6 — Cierre.** Commits por work unit en `feat/gallery-full-page` con la evidencia registrada acá; espejo en Engram (`odd/damero-gallery-full-page/tasks`) actualizado; push/PR/merge: decisión del stakeholder.

## Ruta de implementación

Slices T0–T5 → `engineering-astro-implementer` (delegación por slice; writer trigger: multi-archivo). Verificación por slice → checks del writer + spot check del orquestador (RDD off por decisión clone-local). Detalle fino de CSS/tokens durante T1–T3 guiado por `docs/DESIGN.md`.

## Criterios de aceptación

1. Click en el lead de la ficha navega a `/propiedades/<slug>/galeria` **sin JS** (link real).
2. El visor muestra foto activa + contador + prev/next + riel; navegable por teclado (←/→/Home/End); **controles fuera de la fotografía, sin autoplay, sin dots** (DESIGN.md:357/702).
3. `pnpm test:e2e` completo en verde (3 viewports, 0 failed) incluyendo specs nuevas; cero overflow horizontal en 1280/390/320.
4. Solo tokens (sin hex fuera de `:root`, sin radios 999px, sage nunca como texto); focus ring global intacto; targets ≥44px.
5. `fotos: []` conserva el comportamiento actual (placeholder, sin link a galería).
6. Sin dependencias nuevas; `pnpm-workspace.yaml`/`pnpm-lock.yaml` intactos.
7. **No se agrega maquinaria modal** — la opción A sigue siendo trabajo aditivo puro (ver fallback).
8. La navegación ficha → galería (y la vuelta) morfea lead ↔ foto activa (nombre unificado `propiedad-<slug>`) vía view transitions cross-document donde el browser las soporta; `prefers-reduced-motion: reduce` las desactiva; sin soporte la navegación es normal — sin router JS, sin fallback animado, sin VT same-document.

## Riesgos / flags

- **Screen sin referencia aprobada**: `design/screens/05`/`06` no incluyen una vista de galería. T0 la documenta en DESIGN.md; si el stakeholder prefiere una referencia visual antes del código, T0 es el gate natural.
- **Interacción depende de JS** (consistente con la galería vigente del sitio); sin JS degrada a foto 1 + riel inerte + link de vuelta funcional.
- **Fotos de 1600px en desktop grande**: se consumen con el mismo `src` (límites de `check:images` intactos, sin pipeline nuevo).
- **View transitions:** `navigation: auto` es global (cross-fade sutil en todas las navegaciones donde hay soporte; no hay scoped por link) — T0 lo documenta para aprobación. `view-transition-name` duplicado por página invalida la transición: solo el lead (ficha) y solo la foto activa (galería) llevan `propiedad-<slug>`; miniaturas y demás imágenes sin nombre. Coordinación de merge con el track VT: regla de `global.css` idéntica y plomería `transitionName` compartida — quien mergea segundo rebasa. Las VT no mutan el DOM → aserciones e2e estructurales intactas. Deep-link `?foto=N`: la galería renderiza `fotos[0]` al navegar y el script swapea a N tras la carga — el morph inicial es siempre lead → `fotos[0]`.
- **Presupuesto de delivery**: forecast ~500–660 líneas autoradas (página + estilos + script + specs + docs, incl. la capa de view transitions) > 400 → la estrategia `ask-on-risk` (default) preguntará por chain strategy al superar el presupuesto; registrar los boundaries de slices acá.
- Baseline e2e actual: registrar al ejecutar T5.

## Opción A — fallback explícito

**La opción A (visor fullscreen como modal/lightbox) sigue abierta** si lo implementado en B **no se aprueba** (validación del stakeholder o review). Requisitos de A si se activa:

1. **Enmienda de `docs/DESIGN.md` primero** — hoy es un patrón prohibido (`:492` modales, `:684` único modal permitido, `:226`/`:357`/`:702` chrome sobre la foto). La enmienda la aprueba el stakeholder, no el track.
2. Maquinaria que B **no** incluye y A sí necesitaría: `<dialog>` + `showModal()` (top-layer, foco, Esc), scrim plano (`color-mix(forest-ink 40%)`, precedente `index.astro:1146`), focus trap + scroll-lock + devolución de foco (precedente del sheet de filtros, `index.astro:842–924`), capa z-index por encima de 40 (sin token hoy: 30/40/60/70).
3. Composición compatible con `:357/:702`: controles **fuera** de la fotografía (sin flechas flotantes, sin autoplay, sin dots).
4. Plan propia bajo su feature doc (p. ej. `odd/tasks/damero-gallery-modal.md`); nada del trabajo de B se descarta: la página de B quedaría como destino no-JS/deep-link del modal.

**No resolver A en silencio** (AGENTS.md): cualquier activación del fallback se decide y documenta explícitamente.
