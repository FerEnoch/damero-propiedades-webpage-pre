# Damero — View transitions en las imágenes de propiedades (cards → ficha)

**Estado:** Track abierto (2026-10-09) en la rama `feat/view-transitions` (desde `main` @ `a77d407`, en sync con `origin/main`). **Solo planificación: las tareas NO están iniciadas** — el stakeholder aprueba este plan y después se largan. Este documento es el primer commit del track.
**Decisión del stakeholder (2026-10-09):** view transitions sobre las imágenes de las propiedades en su tránsito hacia la ficha — desde las destacadas del home (`/`) y desde el listado completo (`/propiedades`).

**Objetivo:** al navegar de una card de propiedad (home destacadas o listado) a la ficha `/propiedades/<slug>`, la imagen morfea de la card al lead de la ficha (y la vuelta), vía View Transitions cross-document — CSS puro, enhancement progresivo, cero JS nuevo.

## Contexto — qué ya está cableado (no requiere componentes nuevos)

- Toda imagen del sitio renderiza via `DameroPlaceholder.astro` (img `:60–70`; frame `.damero-placeholder` 3:2, `object-fit: cover` `:83–127`). Cards del home y del listado comparten `PropertyCard.astro` (media `:50–62`; `slug` en la interfaz de datos `:20–29`, destructurado `:42`); el lead de la ficha llama `DameroPlaceholder` directo (`[slug].astro:136–144`, eager + `fetchpriority="high"`).
- Rutas: `/` → `src/pages/index.astro` (destacadas `:60–97`, cards `:74–94`); `/propiedades` → `propiedades/index.astro` (grid `:256–275`, cards `:271`); `/propiedades/<slug>` → `propiedades/[slug].astro` (`getStaticPaths` desde el `slug` de frontmatter `:52–58`).
- `slug` es campo de schema (`src/content.config.ts:23`), disponible en cada sitio de render — pero hoy NO llega al DOM: `DameroPlaceholder` solo expone `class` (`:35`) → hace falta plomería mínima (prop nueva).
- `src/styles/global.css`: `@import` de tokens `:7`, focus `:86–90`, bloque reduced-motion `:92–111`; el bloque de view transitions va después de focus (~`:91+`). Tokens de motion existen (`--duration-*` `:154–158` de `tokens.css`); no hay token de VT.
- El sitio YA tiene JS inline (header `SiteHeader.astro:36/:121`, faqs, `PriceRange`, filtros de `propiedades/index.astro:354`, riel de la ficha `[slug].astro:297`) — pero nada de `ClientRouter`/`astro:transitions` (grep: NONE). El enfoque elegido no agrega JS.
- Gate vigente: `pnpm test:e2e` = `check:images` + build + preview + 3 viewports (`playwright.config.ts:23–52`, `ASTRO_PREVIEW_BACKGROUND=0`).

## Enfoque elegido: CSS cross-document, cero JS (registro de la decisión)

- `@view-transition { navigation: auto; }` en `src/styles/global.css` — opt-in global; el browser anima elementos con `view-transition-name` emparejado entre documento viejo y nuevo en navegaciones same-origin iniciadas por el usuario (clic en link, traverse back/forward).
- `view-transition-name: propiedad-<slug>` emparejado: la imagen de la card (home/listado) y el lead de la ficha llevan EL MISMO nombre por propiedad → morph de posición/tamaño + cross-fade default.
- Nombres únicos por página (regla dura: un `view-transition-name` duplicado en una página invalida la transición): solo imágenes de cards y solo el lead de la ficha; miniaturas del riel y demás imágenes sin nombre.
- Reduced-motion (DESIGN.md `:434–442` motion restringido, `:513` honrado globalmente): `@media (prefers-reduced-motion: reduce) { @view-transition { navigation: none; } }` — misma forma prevista por el track de galería (enmienda en vuelo, sin commit — ver Coordinación). El neutralizador blanket existente (`global.css:102–111`, `*` → 0.01ms) NO alcanza a los pseudo-elementos `::view-transition-*` — el opt-out a nivel `navigation` es la cobertura correcta.
- Plomería: prop opcional `transitionName?: string` en `DameroPlaceholder` → `style` en el frame raíz, solo cuando está seteada; `PropertyCard` pasa `propiedad-${slug}`; el lead de `[slug].astro` pasa `propiedad-${slug}`. El prefijo `propiedad-` garantiza un `<custom-ident>` válido (nunca arranca en dígito).
- Sin duración custom por ahora: timings default del browser (cross-fade sutil, consistente con el motion restringido de DESIGN.md). Si el stakeholder quiere timing del sistema, se agrega token + regla `::view-transition-*` en coordinación con el track de galería.
- Degradación (verificado 2026-10-09 vía caniuse / MDN / developer.chrome.com): Chromium 126+ y Edge 126+ (también Opera 112+), Safari 18.2+ (macOS e iOS) soportan cross-document; Firefox aún no (144+ solo same-document) → navegación normal, sin fallback JS. `<meta name="view-transition">` es DEPRECATED — no usar.
- Alternativa descartada: `<ClientRouter />` (`astro:transitions`, incluido en astro@7.3.5) — intercepta TODAS las navegaciones (swap SPA-like), cambia la semántica de ejecución de los `<script>` inline existentes (riel de la ficha, sheet de filtros) y agrega JS client-side. Mismo registro que el track de galería (enmienda en vuelo del track de galería, sin commit — ver Coordinación).

## Coordinación con el track de galería (damero-gallery-full-page) — importante

El track de galería (solo plan, rama `feat/gallery-full-page`, tareas no iniciadas) decidió HOY (2026-10-09) view transitions ficha → galería con este mismo enfoque CSS. **Esa decisión vive en una enmienda en vuelo, aún sin commit**: el doc commiteado (`ac8c172`) no contiene nada de view transitions; la versión enmendada se preservó fuera del repo en `/tmp/opencode/damero-gallery-full-page.amended.md` (2026-10-09 07:48) tras una colisión de sesiones concurrentes en este worktree (ver Riesgos) — restaurarla y committearla en `feat/gallery-full-page` al retomar ese track. Convergencia real en tres superficies:

1. `@view-transition { navigation: auto; }` en `global.css` — ambos tracks lo agregan: regla idéntica, merge trivial; quien mergea primero la establece.
2. El lead de la ficha lleva nombre — ambos tracks lo requieren. **UN elemento = UN `view-transition-name`**: el ejemplo `galeria-lead` de la enmienda en vuelo NO puede coexistir con `propiedad-<slug>` en el mismo lead. **Resolución registrada acá: nombre unificado `propiedad-<slug>` para todo el hilo visual de la propiedad** (card → lead de ficha → foto activa de la galería). Satisface ambos tracks con un solo esquema; la enmienda del doc de galería debe adoptar el nombre unificado al restaurarla en `feat/gallery-full-page`. La convención queda registrada en `docs/DESIGN.md` (T0) como fuente de verdad — reportada, no resuelta en silencio (AGENTS.md).
3. Plomería `transitionName` en `DameroPlaceholder` — la galería la consume para su foto activa. Quien mergea segundo rebasa.

## Alcance

- `src/styles/global.css`: at-rule `@view-transition` + opt-out reduced-motion.
- `src/components/DameroPlaceholder.astro`: prop opcional `transitionName`.
- `src/components/PropertyCard.astro`: pasa `propiedad-${slug}`.
- `src/pages/propiedades/[slug].astro`: el lead pasa `propiedad-${slug}`.
- `src/styles/tokens.css`: sin cambios (timings default).
- Spec e2e nueva `e2e/propiedades-view-transitions.spec.ts`.
- Docs: `docs/DESIGN.md` (patrón VT: opt-in, nombres, reduced-motion, degradación) + línea de la spec nueva en `AGENTS.md` (sección Testing).

**Fuera de alcance:** view transitions ficha → galería (track propio `damero-gallery-full-page`), VT same-document (`startViewTransition`) para el riel/visor, `ClientRouter`, animaciones custom (`::view-transition-*` + keyframes), token de duración, miniaturas con nombre, cambios en el pipeline de imágenes, dependencias nuevas, `pnpm-workspace.yaml`/`pnpm-lock.yaml`, empujar/abrir PR (decisión del stakeholder).

## Tareas

- [ ] **T0 — Docs primero (precedente del track de galería).** Registrar en `docs/DESIGN.md` el patrón de view transitions cross-document del sistema: opt-in global (`navigation: auto` en `global.css`), convención de nombres `propiedad-<slug>` unificada (card → lead → galería futura; unicidad por página: nombre duplicado invalida la transición), opt-out reduced-motion (`navigation: none`), degradación sin fallback JS (Chromium/Safari sí, Firefox hoy no), timings default. Registrar como coordinación explícita el desempate con el ejemplo `galeria-lead` del track de galería (ver sección Coordinación).
- [ ] **T1 — Implementación RED→GREEN (un commit de work unit: spec + código).** (a) **RED**: spec nueva `e2e/propiedades-view-transitions.spec.ts` siguiendo las convenciones de `propiedades-detalle-*` (fixtures con slugs reales, selectores por `data-*`/estructura vigente): (1) el CSS servido contiene `@view-transition { navigation: auto }` y el opt-out reduce (fetch del stylesheet desde el DOM; ojo minificador: matching flexible, lowercase); (2) computed `view-transition-name` = `propiedad-<slug>` en las imágenes de las destacadas del home; (3) ídem en las cards del listado; (4) ídem en el lead de la ficha, emparejado con la card del mismo slug; (5) unicidad: sin nombres duplicados por página; (6) miniaturas y demás imágenes sin nombre; (7) cero overflow horizontal en los 3 viewports. Correr focused y observar RED. (b) **GREEN**: `DameroPlaceholder` prop `transitionName` (style en el frame, solo si está seteada); `PropertyCard` y lead de `[slug].astro` pasan `propiedad-${slug}`; `global.css` agrega el at-rule + opt-out. La aserción (1) cubre que el at-rule sobreviva al build (el minifier podría reescribirlo; complementar con `grep -i` sobre `dist/` — precedente del gotcha hex lowercase). Focused GREEN y después `pnpm test:e2e` completo.
- [ ] **T2 — Gate + cierre.** `pnpm test:e2e` completo en verde (check:images + 3 viewports, 0 failed); baseline registrado acá (no inventar números); línea de la spec nueva en `AGENTS.md`; progreso y commits registrados acá; espejo Engram (`odd/damero-view-transitions/tasks`) actualizado. Push/PR/merge: decisión del stakeholder.

## Ruta de implementación

T0–T2 → `engineering-astro-implementer` (delegación por slice; writer trigger: multi-archivo). Test-first: T1 observa RED antes de GREEN (e2e es el único nivel de testing del repo). Verificación: `pnpm test:e2e` por task + assess RDD por commit de work unit (`gentle-ai review assess --base-ref <boundary> --committed-only`) + `engineering-astro-verifier` según tier. Detalle de CSS/tokens guiado por `docs/DESIGN.md`.

## Criterios de aceptación

1. Navegar card (home destacadas o listado) → ficha morfea la imagen de la card al lead (y la vuelta) en browsers con soporte; sin soporte, navegación normal — sin JS nuevo, sin ClientRouter.
2. `prefers-reduced-motion: reduce` desactiva la transición (navegación normal).
3. Un `view-transition-name` único por página; el lead de la ficha empareja con la card de la misma propiedad (`propiedad-<slug>`).
4. `pnpm test:e2e` completo en verde (3 viewports, 0 failed) incluyendo la spec nueva; cero overflow horizontal en 1280/390/320.
5. Solo tokens (sin hex fuera de `:root`, sin radios 999px, sage nunca como texto); sin dependencias nuevas; lockfiles intactos.
6. El at-rule `@view-transition` sobrevive al build (verificado contra el CSS servido + `grep -i` sobre `dist/`).
7. Ningún comportamiento vigente regresa: specs existentes en verde; el script del riel in-page no se toca.

## Riesgos / flags

- **Sesiones concurrentes en un solo worktree (2026-10-09):** la enmienda VT del track de galería quedó sin commit y preservada SOLO en `/tmp/opencode/damero-gallery-full-page.amended.md` (fuera del repo — frágil; `/tmp` no sobrevive reinicios). Restaurarla y committearla en `feat/gallery-full-page` al retomar ese track. Fix estructural: una sesión por worktree (`git worktree add`) para que dos sesiones vivas nunca compartan directorio de trabajo.
- **Convergencia con `feat/gallery-full-page`** (ver Coordinación): `global.css`, la región del lead (`[slug].astro:136–174`) y la plomería de `DameroPlaceholder` se editan en ambos tracks → quien mergea segundo rebasa; el nombre unificado `propiedad-<slug>` desempata el ejemplo `galeria-lead`.
- **Minificador CSS de Astro**: verificar el at-rule sobre el CSS servido/`dist/` con matching flexible (precedente del gotcha hex lowercase — `grep -i`).
- **`navigation: auto` es global**: todas las navegaciones del sitio cross-fadean sutilmente donde hay soporte (no existe scoped por link) — T0 lo documenta; mismo flag que el track de galería.
- **Firefox sin soporte cross-document hoy** (verificado 2026-10-09): degradación = navegación normal. Re-chequear al implementar por si llega.
- **Timeout de 4s del browser**: si la página nueva no es renderable en 4s la transición se salta — sitio estático, riesgo mínimo.
- **Presupuesto de delivery:** forecast ~230–300 líneas autoradas (spec ~130–160, impl ~50–70, docs ~50) < 400 → single PR; estrategia `ask-on-risk` (default), sin chain.
- Baseline e2e: registrar al ejecutar T2.

## Alternativa descartada (registro explícito)

`<ClientRouter />` (`astro:transitions`, incluido en astro@7.3.5): mismo efecto visual pero intercepta TODAS las navegaciones y obligaría a re-auditar el JS inline existente (riel de la ficha, sheet de filtros) — solo se retoma por decisión explícita del stakeholder si se exige fallback animado cross-browser. Mismo registro que el track de galería (enmienda en vuelo del track de galería, sin commit — ver Coordinación).
