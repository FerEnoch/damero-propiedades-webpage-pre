# ODD — Damero: fundación del sitio + landing

**Estado:** T0–T5 ✅ commiteados (2026-09-18). Próxima sesión: **T6 + T7**. Ver "Próxima sesión — arrancar acá" más abajo.

**Objetivo:** Dejar el sitio Astro con los cimientos de código (tokens, layout, componentes base y content collection) y la landing `/` funcionando contra `docs/DESIGN.md`.

**Problema:** El repo tiene el scaffold de Astro y los artefactos de diseño validados, pero `src/pages/index.astro` sigue siendo un placeholder: cero código de producción.

**Por qué:** El track de diseño cerró y el de fundación también. El siguiente incremento es el vertical slice que prueba el stack de punta a punta: tokens + layout + datos + una página real.

**Alcance:** tokens CSS, estilos globales y fuentes, layout base (header/footer), content collection de propiedades con datos semilla, componentes base de `DESIGN.md` §6, y la landing `/` (§5).
**Fuera de alcance:** `/propiedades`, `/propiedades/<slug>` y `/faqs` (§17); los 5 checks de CI del PRD §9; el deploy.

## Próxima sesión — arrancar acá (2026-09-18)

**Estado:** T0–T5 ✅ commiteados en `main`, árbol limpio. Lo único untracked es `.opencode/` (ver gotchas). Quedan **T6** y **T7**, y después el track §17 (`/propiedades`, `/propiedades/<slug>`, `/faqs`).

**Commits del track:**

| Tarea | Commits |
|---|---|
| T1 — tokens, base y fuentes | `73987cb` (feat) + `9261b3d` (docs) |
| T2 — shell header/footer | `564615e` (feat) + `6028a59` (docs) |
| T3 — content collection + semillas | `3080dde` (feat) + `1bd82dd` (docs) |
| T4 — componentes base | `f922c28` (feat) |
| T5 — landing | `a6c07ef` (feat) + `0e891ee` (docs) |

**Verificación ya hecha:** T1, T2 y T5 pasaron por verificador independiente en contexto fresco con Chrome real (contraste medido sobre computed styles, teclado, contexto sin JavaScript, overflow). T3 se probó con un test negativo del schema (enum inválido → exit 1). T4 lo auto-verificó el writer con un showcase temporal porque todavía no tenía consumidor. Criterios medidos: build 0 · sage como texto 0 · hex crudos fuera de `tokens.css` 0 · datos inventados 0 · un solo CTA primario por viewport · 0 overflow a 390 y 320.

**Próximo paso concreto — T6.** Faltan `icon-house.svg` y `icon-search-house.svg` (T8 del track de diseño). Las referencias PNG están en `design/reference/house.png` y `design/reference/search_house.png`. Construcción §8: viewBox 24, stroke 1.5px, capa de acento `fill="#7C916F"` sin stroke y ≤40% del área, capa de línea `stroke="currentColor"`, `aria-hidden` + `focusable="false"`.
**Antes de agregarlos, exportar un tipo compartido para `ServiceIcon`/`ServiceIconName`:** hoy el union está duplicado en `ServiceIcon.astro` y en `landing.ts` y va a driftear.

**Después T7.** Build verde + contraste AA + mobile-first 390/1280 + 0 sage en texto renderizado, **y la suite e2e con `@playwright/test`**. La decisión de meterlo como devDependency del repo ya está tomada: pin exacto, y **va a necesitar una entrada en `allowBuilds` de `pnpm-workspace.yaml`** porque la política es deny-by-default con `strictDepBuilds: true` — esa fricción es el control, no un bug.
Para verificación manual, ojo: el `playwright-cli` global pide el browser `chrome-for-testing`, que **no está instalado**. Funciona `playwright-core` con `executablePath: '/usr/bin/google-chrome'` (script de referencia: `/tmp/opencode/shot.cjs`).

**Decisiones abiertas que esperan al stakeholder (menores, todas de T5 — ninguna se aplicó sin permiso):**
1. El bajado del hero **no tiene el "¿" de apertura** (*"Tenés dudas y no sabés cómo encarar tu negocio?"*): se copió verbatim del screen.
2. El watermark del hero es **1** diamante al 6% (§5 lo pide así); los screens muestran 3 anidados.
3. Los screens llevan **hairline superior** en cada banda; §5 no lo especifica y se omitió.
4. A **320px el header sube a 97px** porque el link de WhatsApp envuelve a 2 líneas. Cumple §12 (usable, sin overflow) pero no los 64px de §6.
5. El **CTA del hero mobile** no es full-width ni uppercase como en el screen mobile; §6 no opina.
6. `destacada: true` solo en la casa; los screens muestran las 3 bajo "Propiedades destacadas" (igual la landing compone 1 lead + 2 compactas por el fallback de §5).

**Bloqueantes de lanzamiento (no de build):** las 6 respuestas de FAQ (PRD §8), WhatsApp y CCI reales, nombre del corredor (¿"Alejandro" o "Alejando"?), y confirmar el tinte `#C3CDB8` del logo knockout.

**Gotchas de infraestructura:**
- **No hay remote de git configurado** ni upstream en `main`: el CI del PRD §9 no puede correr. Todo es local.
- **`.opencode/agent/engineering-astro-{implementer,mapper,verifier}.md` está untracked.** Son los 3 agentes de proyecto pinneados (implementer `kimi-k3` max, verifier `deepseek-v4-pro` high, mapper `deepseek-v4.1-flash` high), nombrados bajo el glob `engineering-*` de la allowlist del orquestador. **Requieren reiniciar opencode para cargarse** (verificado en caliente: `Unknown agent type`). Falta decidir si se commitean o se ignoran.
- **El MCP de Engram falla en este proyecto** con "multiple active runtime sessions": usar el CLI `engram save <title> <content> --project realtor_pre_webpage --type ... --topic ...` como fallback.
- **Componentes diferidos al track §17:** Filter input, WhatsApp CTA y Empty state. No los consume ninguna página de T1–T5 y `/propiedades` está fuera de alcance; se construyen con su primer consumidor.
- **Coherencia a resolver en §17:** el teaser de FAQ usa voz sans para la pregunta; §17.3 pide serif para el acordeón de `/faqs`. Hay que alinearlos.
- `@playwright/test` **todavía no está en `package.json`**: la decisión está tomada, falta ejecutarla en T7.
- `/propiedades` y `/faqs` dan **404** hasta que existan: es esperado, no un defecto.

## Restricciones (decisiones cerradas)

- **Ruta: ODD**, no SDD (stakeholder, 2026-09-18).
- **pnpm 12.4.2**, con los settings en `pnpm-workspace.yaml` (no en `.npmrc`). Ver `damero-web-foundation.md`.
- **Solo tokens de marca.** Sage `#7C916F` NUNCA en texto renderizado (3.42:1); derivado `#4F6144` para links y acento chico.
- **Sin dark mode**, pero con los tokens semánticos listos para agregarlo sin refactor (`DESIGN.md` §13).
- **Fotos:** ratio 3:2 + placeholder de marca hasta que existan las reales (`DESIGN.md` §7).
- **Datos del stakeholder pendientes → placeholders explícitos, nunca inventados** (`DESIGN.md` §17.4). Stitch ya inventó datos legales una vez.
- **Composición canónica de la landing = `DESIGN.md` §5.** No improvisar secciones.
- **Directo a `main`** por PRD §9 (commit → CI gate). Sin PRs.
- **E2E: solo Playwright**, sin unit testing (stakeholder, 2026-09-18). Runner `@playwright/test` como devDependency pinneada en el repo.
- **Lockup de marca:** el logo real es un lockup completo y a 28/32px su wordmark es ilegible. Se usa `damero_mark.svg` (marca-solo) + wordmark en tipo. Bajo 768px el wordmark se acorta a "DAMERO" (decisión stakeholder, 2026-09-18).

## Tareas

- [x] T0 — Migración de la política pnpm a `pnpm-workspace.yaml` (ver `damero-web-foundation.md`)
- [x] T1 — Tokens CSS + estilos globales + las 3 fuentes (Newsreader, Hanken Grotesk, JetBrains Mono) según `DESIGN.md` §14, §3 y §13
- [x] T2 — Layout base: shell, header y footer con el bloque legal verbatim (`DESIGN.md` §6, §17.4)
- [ ] T3 — Content collection `propiedades` con el schema del PRD §4 + 3 listados semilla con placeholder de marca
- [x] T4 — Componentes base que **consume la landing**: Button, Property card, Operation badge (+ `DameroPlaceholder` §7, `ServiceIcon` §8, `formatAmount`). **Diferidos al track §17** (no los consume ninguna página de T1–T5, y `/propiedades` está fuera de alcance): Filter input, WhatsApp CTA y Empty state.
- [x] T5 — Landing `/` según `DESIGN.md` §5: hero (damero + titular + 1 CTA de búsqueda), bloque de destacadas, los 8 servicios con los SVG duotono, teaser de FAQ
- [ ] T6 — Glifos de UI faltantes: `icon-house.svg` y `icon-search-house.svg` (T8 del track de diseño)
- [ ] T7 — Verificación: build verde, contraste AA, mobile-first 390/1280, 0 ocurrencias de sage en texto renderizado

## Criterios de aceptación

| Criterio | Cómo se verifica |
|---|---|
| `pnpm build` exit 0 | comando |
| Ningún texto renderizado en `#7C916F` | grep sobre el HTML de `dist/` |
| Contraste AA en todo par texto/fondo | matriz de `DESIGN.md` §2 |
| Mobile-first a 390 px | revisión contra `DESIGN.md` §10 |
| Datos inventados: 0 | grep de `CUCICBA`, `Ley 5115`, métricas y testimonios |
| Solo tokens de marca en el CSS | revisión: sin hex sueltos fuera de `:root` |

## Forecast de entrega

Presupuesto de revisión: ~400 líneas por slice. Fundación + landing se estima por encima de eso, así que se entrega en work-unit commits por tarea (T1…T5), directo a `main` según PRD §9. Estrategia: `ask-on-risk` — si un slice se pasa de ~400 líneas, se para y se avisa antes de seguir.

## Verificación ejecutada

### T1 — tokens, base y fuentes (2026-09-18)

| Check | Resultado |
|---|---|
| `pnpm build` | ✅ exit 0 — 1 página, 3 fuentes copiadas |
| Tokens en el CSS emitido | ✅ `--color-forest-ink` + las 13 aliases semánticas presentes |
| Sage en texto renderizado | ✅ 1 sola ocurrencia, en la **definición** de `--color-sage` dentro de `:root`; 0 reglas `color:` con sage (grep case-insensitive, minifier lowercases el hex) |
| Fuentes self-hosted | ✅ 3 `.woff2` emitidos; `@font-face` inline en el `<head>`; 0 requests a `fonts.googleapis`/`fonts.gstatic` en `dist/` |
| Valores crudos fuera de `tokens.css` | ✅ grep de hex vacío en `global.css`, `BaseLayout.astro` e `index.astro` |
| Fidelidad de tokens contra §14 y §3 | ✅ value-by-value, sin faltantes ni inventados |
| Verificación independiente (contexto fresco, read-only) | ✅ `success`, 0 CRITICAL, 1 WARNING + 3 SUGGESTION |

**Correcciones aplicadas después de verificar (2):**

1. **WARNING — reduced-motion sobre-alcanzaba.** El bloque global hacía `transform: none !important` sobre `*`. Hoy no rompe nada (el damero es SVG), pero habría roto el diamante a 45° del hero (`§5`) y cualquier `translate(-50%,-50%)` en cuanto T5 usara transforms de geometría. Ahora reduced-motion neutraliza animaciones y transiciones; los transforms de movimiento se autorán dentro de `@media (prefers-reduced-motion: no-preference)` en el componente que los introduce.
2. **SUGGESTION — fallback de los `var()` de fuente.** Los stacks quedaron como `var(--font-newsreader, 'Newsreader')` para que la declaración no se invalide si la variable de Astro no existe.

**Desviaciones documentadas respecto de `DESIGN.md` (necesarias, no capricho):**

1. **Los stacks de fuente consumen `var(--font-*)` en vez de los nombres literales de §14.** Astro hashea el family name (`Newsreader-7b5985b7229eff39`); transcribir `'Newsreader'` habría caído silenciosamente en Georgia. Los fallbacks de §14 se preservan.
2. **La escala tipográfica de §3 se materializó como tokens** (`--text-*`, `--leading-*`, `--tracking-*`) porque §14 la referencia por nombre pero no repite los valores.
3. **`--breakpoint-*` no son usables dentro de `@media`** (limitación de las custom properties): T2 en adelante hardcodea los valores en las media queries.

**Arrastres para las tareas siguientes:**

- **T2:** sumar header y footer **dentro** de `BaseLayout`; no duplicar los `<Font>` ni re-importar `global.css`. Consumir solo aliases semánticos.
- **T5:** los headings display (`--text-display-*`) deben overridear line-height y tracking; el base layer deja `h1–h6` con métricas de card-title-lg (1.22 / −0.012em), que para el hero son flojas.
- **T4/T5:** el patrón damero va como SVG data-URI (§7), no como `transform: rotate(45deg)`.

### T2 — shell: header y footer (2026-09-18)

| Check | Resultado |
|---|---|
| `pnpm build` | ✅ exit 0 |
| Landmarks | ✅ `header` / `main` / `footer` presentes en `dist/index.html` |
| Copy verbatim | ✅ las 2 líneas legales byte-equal al screen; `CCI 000` preservado |
| Andamiaje de los screens | ✅ 0 Tailwind / Google Fonts / Material Symbols / blur en `dist/` |
| Hex crudos fuera de `tokens.css` | ✅ grep vacío en componentes, layout y `site.ts` |
| Header 64/72 (+hairline) | ✅ medido en Chrome real: **65px @390**, **73px @1280** |
| Toggle a11y + fallback sin JS | ✅ verificado con contexto JS deshabilitado real (la nav sigue operable) |
| Touch targets ≥44px | ✅ todos los interactivos |
| Indicador activo | ✅ underline sage 2px; el texto sigue en forest-ink |
| Verificación independiente | ✅ `success`, 0 CRITICAL, 0 WARNING, 4 SUGGESTION |

**Hallazgo 1 — el logo real no sirve como lockup de header.** `damero_logo.png` es un lockup completo: clúster de 4 rombos + la palabra "DAMERO". A 28/32px (§6) el wordmark queda ilegible (~4px por letra). Decisión del stakeholder: **marca + wordmark en tipo**, como los screens. Se generaron `damero_mark.svg` (forest ink) y `damero_mark_white.svg` (knockout) recortando el `viewBox` al clúster medido por perfil de canal alfa (columnas 62–463, filas 130–663). No se hizo cirugía de paths porque el auto-trazado mete clúster y wordmark en un mismo `d`.

**Hallazgo 2 — el header mobile hacía wrap (lo cazó el screenshot, no el build).** Con el nombre completo a 18px el lockup (236px) + WhatsApp (168px) + toggle (44px) no entran en los 350px de contenido a 390px: el header saltaba a 2 filas = 97px en vez de 64px. Corrección: bajo 768px el wordmark muestra solo **"DAMERO"** — que es exactamente el wordmark del logo real — y desde 768px el nombre completo. Medido después: 65px @390, 73px @1280.

**Correcciones aplicadas respecto de los screens (gana `DESIGN.md`):** glassmorphism del header fuera (§11), nav en Public Sans 12px → Hanken 500 15px (§6), footer en `#bfcab4` off-palette → `--color-on-forest-muted`, teléfono en voz mono → `body-sm` (§6), columnas del footer 6–8 → 6–7 (§6), y el `wa.me` con número inventado → href inerte (`#whatsapp-pendiente`, §17.4).

**Excepción donde gana el screen:** el badge de servicios usa `--color-bg-surface`. El `--color-bg-subtle` que pide §8 sería invisible sobre la banda `--color-bg-subtle` de §5. Aplica a T5.

**Pendientes introducidos, centralizados en `src/data/site.ts`:** `WHATSAPP_URL_PENDING` (href inerte), `WHATSAPP_NUMBER_PENDING` (`+54 9 2304 000000`, tal cual lo trae el screen), `CCI 000`, `CONTACT_HOURS` y `SITE_TAGLINE`. **El número de WhatsApp y el CCI bloquean el lanzamiento.** Si preferís un label `PENDIENTE` explícito en lugar de un número que parece real, es un cambio de una línea.

### T3 — content collection y semillas (2026-09-18)

| Check | Resultado |
|---|---|
| `pnpm astro sync` | ✅ exit 0 — tipos generados con `propiedades` |
| `pnpm build` | ✅ exit 0 |
| Schema aplicado (test negativo) | ✅ `operacion: "permuta"` → **exit 1** con `InvalidContentEntryDataError`; revertido → exit 0 |
| `.strict()` real | ✅ clave desconocida → `Unrecognized key` |
| Spot check del padre (re-corrido por el orquestador) | ✅ baseline 0 → inválido 1 → restaurado 0, árbol limpio |
| Readback campo por campo contra PRD §4 | ✅ 18 campos con requeridos/opcionales correctos |
| Datos inventados | ✅ grep de CUCICBA / Ley 5115 / testimonios / métricas: vacío |

**API usada:** content layer de Astro 7 — `src/content.config.ts` + `defineCollection` + loader `glob` de `astro/loaders` + `z` de `astro/zod`. Verificado contra la doc vía Context7; **no** es la API legacy `src/content/config.ts`.

**Decisiones de contenido:** `fotos: []` en las 3 semillas (no existe fotografía real; la UI cae al placeholder de marca §7). `expensas` omitido. `map_lat`/`map_lon` son centros aproximados de zona con el offset que pide el PRD §11 y no se renderizan como números. `whatsapp` lleva el placeholder pendiente — el frontmatter no puede importar `site.ts`, así que el valor está espejado y comentado.

**Bandera para T5:** solo la casa quedó `destacada: true`; los 3 screens las muestran todas bajo "Propiedades destacadas". `DESIGN.md` §5 cubre el caso (menos de 3 destacadas → completar con las más recientes), así que la landing igual compone 1 lead + 2 compactas. Si preferís fidelidad literal al screen, se marca `destacada: true` en las 3.

**Limitación honesta:** el repo no tiene `typescript` ni `@astrojs/check`, así que `astro check` / `tsc` no pueden correr. La exposición de tipos se confirmó de forma estructural (tipos generados) y por comportamiento (build + probe temporal). Instalar un typechecker sería una dependencia nueva, prohibida en esta tarea sin reportar.

### T4 — componentes base (2026-09-18)

| Check | Resultado |
|---|---|
| `pnpm build` | ✅ exit 0 |
| Render real (showcase temporal) | ✅ las 2 variantes de card, las 4 de botón, los 2 badges, el placeholder y un `ServiceIcon` real; la página temporal se borró y el build final quedó con solo `index.astro` |
| Geometría 3:2 | ✅ 480×320 y 369×246, ratio 1.500; foto y frame con métricas idénticas |
| `currentColor` en el icono inline | ✅ presente en el SVG emitido |
| Hex crudo en componentes/util | ✅ grep vacío |
| Sage como color de texto | ✅ grep vacío |
| `999px` / emojis | ✅ 0 |
| Screenshot headless del placeholder | ✅ damero tileado + clúster + outline sage |

**Ruling aplicado (ambigüedad real de `DESIGN.md`):** §6 paso 3 pone el código de moneda en la fila del badge; §3 dice que todo precio se renderiza como `USD 95.000` con el código en `--text-label-sm` y el monto en el token de precio. Se aplicó **§3 + los screens + PRD §5**: código y monto juntos en la línea de precio, y el badge row queda solo con el `OperationBadge`.

**Decisiones del implementador, todas fundadas:**
1. **`--pattern-damero-tile`, token nuevo.** Un SVG data-URI es su propio documento y no puede leer custom properties, así que sus colores deben ser literales; §13 permite valores crudos solo en la capa de tokens.
2. **`--color-forest-ink-hover` directo en el hover del botón primario.** §6 lo nombra explícitamente y no existe alias semántico para él.
3. **`DameroPlaceholder` con prop `bordered` (default `true`).** §7 da hairline al tile y la card ya dibuja la suya; dentro de la card se pasa `bordered={false}` para que el placeholder y una foto real sean intercambiables sin doble línea.
4. **Sin separador hairline entre media y body.** Los screens lo tienen, §6 no lo especifica. Se siguió §6. **Vetá esta si preferís el screen.**
5. **`Button` variant `text-link` sin el padding de 24px** (conserva min-height 44 y el subrayado): §6 especifica el subrayado, no la caja, y con padding se desalineaba en una fila de heading.

**Movimiento de assets:** los 8 SVG duotono pasaron de `public/icons/services/` a `src/icons/services/` (git detectó los renames). §8 exige inlinear el SVG para que `currentColor` resuelva, y `<img src="icon.svg">` está prohibido. `public/icons/` ya no existe.

**Deuda de verificación declarada:** los componentes base no tienen consumidor hasta T5, así que su verificación independiente en contexto la hace la landing (que los renderiza con contenido real en 390 y 1280). Verificarlos aislados exigía una página temporal que un verificador read-only no puede escribir. Este es el único punto donde la verificación independiente se difiere a propósito.

### T5 — landing `/` (2026-09-18)

| Check | Resultado |
|---|---|
| `pnpm build` | ✅ exit 0 |
| Orden de secciones en el DOM | ✅ `hero → destacadas → servicios → FAQ teaser` |
| CTA primario por viewport | ✅ exactamente **1** en 1280, 390 y 320 (§6) |
| Banda del hero | ✅ 192px @1280, 112px @390 y @320 (dentro del clamp de §5) |
| Overflow horizontal | ✅ 0px a 390 y 320 |
| Sage como texto | ✅ 0 elementos; sage solo en masa de icono, borde del badge `alquiler` y underline activo |
| Matriz de contraste §2 | ✅ los 11 pares renderizados medidos sobre computed styles, todos dentro de su veredicto |
| Semántica | ✅ un `<h1>`, sin saltos de nivel, landmarks presentes, todas las secciones nombradas |
| Teclado + foco | ✅ 15 interactivos alcanzables en orden de DOM; foco `2px #4F6144` offset 2px |
| Datos inventados | ✅ 0; placeholders visibles: `PENDIENTE` ×2, el teléfono y `CCI 000` |
| Verificación independiente | ✅ `success`, 0 CRITICAL, 1 WARNING, 5 SUGGESTION |

**Único gap de fidelidad contra los screens (WARNING, corregido):** la densidad del damero. El tile de §7 usa celdas de 56px (≈25% de cobertura de tinte); los screens usan un tejido de 40px desktop / 30px mobile (≈75% / 50%). Se corrigió la **banda del hero** a celdas de 40px (`background-size: 160px 160px`); el placeholder de las cards conserva los 56px que §7 especifica literalmente.

**Sugerencias no aplicadas (quedan a decisión del stakeholder):**
- El watermark del hero es **1** diamante al 6% (§5 lo pide así); los screens muestran 3 anidados.
- Los screens llevan hairline superior en cada banda; §5 no lo especifica y se omitió.
- El CTA del hero mobile no es full-width ni uppercase como en el screen mobile; §6 no opina.
- A **320px el header sube a 97px** porque el link de WhatsApp envuelve a 2 líneas. §12 exige usabilidad a 320 (se cumple: sin overflow y todo operable) pero no los 64px de §6.
- El bajado del hero **no tiene el "¿" de apertura** ("Tenés dudas y no sabés cómo encarar tu negocio?"): se copió verbatim del screen. Es un typo del copy del stakeholder y no se corrigió sin autorización.

**Copy tomado verbatim de los screens:** titular y bajada del hero, eyebrow, label del CTA, eyebrows y títulos de sección, los 8 pares servicio + descripción, y las 2 preguntas del teaser de FAQ. Las respuestas de FAQ **no se escribieron**: los screens las rellenan con texto de relleno y §11 lo prohíbe, así que se renderiza el marcador `PENDIENTE` y ningún cuerpo de respuesta.

**Arrastres para T6/T7:** (a) `/propiedades` y `/faqs` dan 404 hasta que existan, esperado; (b) `priority` es no-op mientras `fotos: []` — el wiring queda activo cuando lleguen fotos reales; (c) el teaser usa voz sans para la pregunta y §17.3 pide serif para el acordeón de `/faqs`, hay que alinear cuando se haga ese track; (d) `ServiceIcon` y el union `ServiceIconName` de `landing.ts` están duplicados: al agregar `icon-house`/`icon-search-house` en T6 conviene exportar un tipo compartido.

## Pendientes del stakeholder (bloquean el lanzamiento, no el build)

- Las 6 respuestas de FAQ (PRD §8) — hoy `[PENDIENTE]`.
- WhatsApp y CCI reales; nombre del corredor (¿"Alejandro" o "Alejando"?).
- Confirmar el tinte `#C3CDB8` del logo knockout.
- Confirmar el prefijo `icon-` en los nombres de archivo.
- Revisar `icon-handshake.svg` a 44 px (punto débil del set).

## Progreso

- **2026-09-18 (a):** decisiones del stakeholder — ruta ODD, migración a pnpm 12, primer entregable = fundación + landing.
- **2026-09-18 (b):** T0 completado (migración de la política pnpm; detalle y evidencia en `damero-web-foundation.md`).
- **2026-09-18 (c):** T1 completado. Tokens, base global y las 3 fuentes self-hosted, con verificación independiente en contexto fresco. 2 correcciones aplicadas post-verificación (reduced-motion y fallback de fuentes). Ver detalle arriba.
- **2026-09-18 (d):** T2 completado. Shell (header/footer) convertido de los screens; lockup de marca resuelto con SVG marca-solo + wordmark en tipo; header mobile ajustado a 64px tras detectar wrap por screenshot. Verificación independiente en contexto fresco + medición real en Chrome. Commits: `73987cb` + `9261b3d` (T1), `564615e` + `6028a59` (T2).
- **2026-09-18 (e):** T3 completado. Content collection `propiedades` con schema estricto del PRD §4 y 3 semillas tomadas de los screens; schema probado con test negativo y spot check del padre. Commit: `3080dde`.
- **2026-09-18 (f):** T4 completado. Primitivas que consume la landing (`DameroPlaceholder` §7, `Button`, `OperationBadge`, `PropertyCard`, `ServiceIcon`, `formatAmount`) y los 8 SVG duotono movidos a `src/icons/services/` para poder inlinearlos con `currentColor`. Filter input, WhatsApp CTA y Empty state diferidos al track §17 por no tener consumidor en T1–T5.
- **2026-09-18 (g):** T5 completado. Landing `/` compuesta según §5 con las primitivas de T4 y las 3 semillas. Verificación independiente con Chrome real (orden de secciones, un solo CTA primario por viewport, los 11 pares de contraste medidos sobre computed styles, semántica, teclado, 0 overflow a 390/320) y corrección del único gap de fidelidad visual: la densidad del damero en la banda del hero.
