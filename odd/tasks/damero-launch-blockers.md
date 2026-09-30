# ODD — Damero: bloqueantes de lanzamiento (backlog del stakeholder)

**Estado:** abierto — creado 2026-09-30 para liquidar en una sesión dedicada.
**Origen:** consolidado desde `odd/tasks/damero-release-prep.md` (tabla B1–B8) y `odd/tasks/damero-detail-map-render.md`.

**Ninguno bloquea el build ni el deploy** (el sitio ya deploya en Vercel). Bloquean el **lanzamiento público**.

## Cómo usar este doc

- Cada bloqueante tiene: qué falta, quién decide, dónde impacta (archivo:línea) y cómo se verifica.
- Regla dura: el agente NO resuelve B1–B5 y B7–B10 sin datos del stakeholder y **no inventa datos** (DESIGN §11). B6 ya está cerrado y no figura.
- Al cerrar cada uno: editar el archivo indicado, correr `pnpm test:e2e` (gate verde), commit convencional (sin atribución de IA), y marcar el ítem acá.

## Bloqueantes

### B1 — Las 6 respuestas de FAQ (PRD §8)

**Qué falta:** las 6 respuestas (una por pregunta), redactadas y aprobadas por el stakeholder. Mientras no existan, `/faqs` y el teaser de la landing renderizan el marcador `PENDIENTE` + la línea meta neutral y **nunca** una respuesta inventada (DESIGN §17.3, §11).

**Quién decide:** stakeholder (redacción y aprobación del copy).

**Dónde impacta:**
- `src/data/faqs.ts:42` — `FAQ_ENTRIES`: las 6 preguntas (`:43`–`:48`) sin campo `answer`.
- `src/data/faqs.ts:28` — campo `answer?: string`, donde va cada respuesta.
- `src/data/faqs.ts:32` — `FAQ_PENDING_MARKER = 'PENDIENTE'`.
- `src/data/faqs.ts:39` — `FAQ_PENDING_META` (línea meta del estado pendiente).
- `src/pages/faqs.astro:103` — render del marcador en el acordeón de `/faqs`.
- `src/data/landing.ts:147` — el teaser de la landing deriva el marcador de `src/data/faqs.ts`.
- `docs/PRD_Damero_MVP.md:107` — §8 (6 preguntas semilla; respuestas TBD del stakeholder en `:109`).
- Specs que fijan el estado actual: `e2e/faqs-content.spec.ts:53`, `e2e/landing-content.spec.ts:26`.

**Verificación:** las 6 entradas traen `answer` y el render ya no emite `PENDIENTE`; grep sobre `dist/`: 0 `PENDIENTE`; specs de FAQ/teaser actualizadas al estado final; `pnpm test:e2e` en verde.

**Estado:** Abierto

### B2 — Número real de WhatsApp

**Qué falta:** el número real del corredor y su destino `wa.me`. Hoy el sitio muestra el placeholder **obvio designado por el contrato** y el href es inerte; no es un dato inventado.

**Quién decide:** stakeholder.

**Dónde impacta:**
- `src/data/site.ts:36` — `WHATSAPP_URL_PENDING = '#whatsapp-pendiente'`.
- `src/data/site.ts:46` — `WHATSAPP_NUMBER_PENDING = '+54 9 2304 000000'`.
- `src/lib/whatsapp.ts:22` y `src/lib/whatsapp.ts:47` — `resolveWhatsAppHref` devuelve el href inerte mientras los dígitos sean los del pendiente.
- `src/components/WhatsAppCta.astro:39` — el CTA (inline y sticky) consume `resolveWhatsAppHref`.
- `src/components/SiteHeader.astro:80` — link de WhatsApp del header.
- `src/components/SiteFooter.astro:50` — link del footer (label en `:51`).
- Frontmatter por listing (mismo placeholder): `src/content/propiedades/casa-3-amb-guadalupe-santa-fe.md:18`, `src/content/propiedades/departamento-2-amb-centro-santa-fe.md:19`, `src/content/propiedades/departamento-3-amb-barrio-norte-santa-fe.md:19`, `src/content/propiedades/lote-600-m2-candioti-santa-fe.md:18`.
- `docs/DESIGN.md:756` — §17.4: ningún `wa.me` real se publica hasta que el stakeholder entregue el número.
- Specs que fijan el estado actual: `e2e/propiedades-detalle-content.spec.ts:206`, `e2e/faqs-content.spec.ts:165`, `e2e/propiedades-detalle-structure.spec.ts:215`.

**Verificación:** número y href reales en `src/data/site.ts` (y frontmatter de listings si corresponde); specs que hoy assertan `#whatsapp-pendiente` actualizadas; grep sobre `dist/`: 0 `#whatsapp-pendiente` y 0 `2304 000000`; `pnpm test:e2e` en verde.

**Estado:** Abierto

### B3 — CCI / matrícula del corredor

**Qué falta:** el número real de matrícula. CCI = **Colegio de Corredores Inmobiliarios**; el número es la matrícula del corredor. El contrato prohíbe fabricarlo.

**Quién decide:** stakeholder.

**Dónde impacta:**
- `src/data/site.ts:82` — línea legal con `CCI 000` (dentro de `LEGAL_LINES`, `:80`); el placeholder está documentado en `:77`.
- `src/components/SiteFooter.astro:60` — render del bloque legal en el footer.
- `docs/DESIGN.md:342` — la línea legal verbatim del contrato (§6).
- `docs/DESIGN.md:754` — §17.4: nunca fabricar matrícula, CCI ni registro legal.
- Spec que fija el texto actual: `e2e/faqs-content.spec.ts:184`.

**Verificación:** `LEGAL_LINES` con el número real; spec del bloque legal actualizada; grep de `CCI 000` en `src/` y `e2e/` = 0; `pnpm test:e2e` en verde.

**Estado:** Abierto

### B4 — Nombre legal del corredor ("Alejandro" vs "Alejando")

**Qué falta:** confirmación humana del nombre legal exacto. El conflicto es real y está registrado: el brief dice "Luis Alejandro", el sitio de fase 1 (copy del cliente, vive fuera de este repo) dice "Luis Alejando". Ninguna de las dos fuentes es autoridad por sí sola; **no se resuelve por grep ni por contrato**.

**Quién decide:** stakeholder (confirmación humana).

**Dónde impacta:**
- `docs/DESIGN.md:342` — el contrato escribe "Luis Alejandro Da Silva" (§6).
- `src/data/site.ts:82` — el build renderiza "Luis Alejandro Da Silva".
- `docs/PRD_Damero_MVP.md:27` — el PRD también escribe "Luis Alejandro Da Silva".
- `odd/tasks/damero-design-system.md:109` — fuente del conflicto ("Alejando" en el sitio de fase 1).
- `odd/tasks/damero-release-prep.md:48` — registro del conflicto (y la corrección de la hipótesis falsa en `:49`).
- `odd/tasks/damero-propiedades-faqs.md:153` — eco del mismo abierto.
- Spec que fija el texto actual: `e2e/faqs-content.spec.ts:184`.

**Verificación:** confirmación escrita del stakeholder. Si el nombre confirmado difiere de "Alejandro": editar `docs/DESIGN.md:342`, `src/data/site.ts:82` y la spec `e2e/faqs-content.spec.ts:184`, y correr `pnpm test:e2e` en verde. Si confirma "Alejandro": cerrar sin cambios de código y marcar acá.

**Estado:** Abierto

### B5 — Tinte `#C3CDB8` del logo knockout

**Qué falta:** revisión visual del stakeholder — ¿el tinte del rombo sage en el logo knockout es el punto justo de claridad, o más claro / más verde? Es percepción visual, no verificable por código.

**Quién decide:** stakeholder (revisión visual).

**Dónde impacta:**
- `public/images/damero_logo_white.svg:4` — `fill="#C3CDB8"` horneado en el path del rombo.
- `public/images/damero_mark_white.svg:4` — idem en la marca suelta (son los **únicos** 2 archivos con ese hex).
- `odd/tasks/damero-design-system.md:93` — la decisión (5,83:1 sobre forest; el sage original daba 2,81:1 y desaparecía).
- `odd/tasks/damero-design-system.md:113` — el abierto (confirmar el tinte).
- `docs/DESIGN.md:337` y `docs/DESIGN.md:428` — la especificación de la variante knockout (§6 y entregable de fase 2). **Nota verificada por grep: `DESIGN.md` no escribe el hex `#C3CDB8` en ningún lugar** — el valor está sólo en los 2 SVG y en `odd/tasks/damero-design-system.md:93`. El hex en los SVG es la excepción documentada (assets sueltos que no pueden consumir `var()`, ver `odd/tasks/damero-release-prep.md:51`).

**Verificación:** el stakeholder confirma el tinte o pide ajuste. Si se confirma tal cual: sólo marcar acá. Si se ajusta: recolorear el path en los 2 SVG preservando el alpha, re-medir contraste AA sobre forest y correr `pnpm test:e2e` en verde.

**Estado:** Abierto

### B7 — `icon-handshake.svg` a 44 px

**Qué falta:** revisión visual del ícono "Negociación" (manos estrechadas), declarado punto débil del set: a 24 px con stroke 1,5 entran pocos trazos paralelos y son los dedos los que hacen reconocible un apretón de manos. Decisión: se deja como está o se rediseña.

**Quién decide:** stakeholder (revisión visual).

**Dónde impacta:**
- `src/icons/services/icon-handshake.svg:1` — el asset (viewBox `0 0 24 24`; trazos `stroke-width="1.5"` desde `:4`).
- `src/components/ServiceIcon.astro:16` — import del SVG; `:26` — mapa del nombre.
- `src/components/ServiceIcon.astro:48` — tamaño de render: `width="24" height="24"`; CSS 24 px en `:58`.
- `src/pages/index.astro:293` — badge host de 44 px (`.services__badge`; comentario "44px square" en `:287`).
- `docs/DESIGN.md:251` — el badge de 44 px del contrato (§5).
- `odd/tasks/damero-design-system.md:112` — el abierto ("Revisar `icon-handshake.svg` a 44 px").
- Nota de contexto: el ícono se renderiza a **24 px dentro** del badge de **44 px**; el abierto está registrado "a 44 px". La escala que se revisa la define el stakeholder.

**Verificación:** el stakeholder ve el ícono en contexto (landing `/`, banda SERVICIOS) y decide. Si se rediseña: mismo tratamiento duotono (masa sage + trazo `currentColor`, excepción documentada en `docs/DESIGN.md:525`) y `pnpm test:e2e` en verde.

**Estado:** Abierto

### B8 — Métricas / prueba social en la landing

**Qué falta:** decisión del stakeholder sobre si quiere métricas / prueba social en la landing y, si las quiere, los números reales. Hoy **no existe ninguna** y no se inventó ninguna (DESIGN §11 prohíbe prueba social inventada y datos fabricados de cualquier tipo).

**Quién decide:** stakeholder (si las quiere + datos reales).

**Dónde impacta:**
- `src/pages/index.astro:33` — banda HERO de `/` (una banda de métricas se insertaría entre las bandas existentes).
- `src/pages/index.astro:60` (DESTACADAS), `:99` (SERVICIOS), `:132` (FAQ TEASER) — bandas actuales de `/`; **no hay banda de métricas ni de prueba social en ninguna** (estado actual verificado).
- `src/data/landing.ts:46` — capa de datos de la landing, donde vivirían los valores.
- `docs/DESIGN.md:231` — composición canónica de la landing (§5): sin banda de métricas.
- `docs/DESIGN.md:475` y `docs/DESIGN.md:497` — §11: prohibido inventar prueba social, contadores o testimonios.
- `odd/tasks/damero-design-system.md:111` — el abierto ("si las quiere").
- `odd/tasks/damero-release-prep.md:141` — fila B8 de la tabla centralizada.

**Verificación:** (a) si el stakeholder decide que no: cerrar marcando acá, sin cambios; (b) si decide que sí: banda nueva con datos **provistos por él** (nunca inventados), specs de landing extendidas y `pnpm test:e2e` en verde.

**Estado:** Abierto

### B9 — Reemplazo obligatorio de la fotografía demo antes del lanzamiento

**Qué falta:** fotografía real de las 4 propiedades. Las 19 fotos actuales son de banco (Pexels), descargadas y commiteadas bajo una **excepción de pre-validación declarada** que exige reemplazo por fotografía real antes del lanzamiento.

**Quién decide:** stakeholder (proveer o encargar las fotos reales de cada propiedad).

**Dónde impacta:**
- `odd/tasks/damero-demo-photos.md:18` — la excepción declarada ("reemplazo obligatorio por fotografía real antes del lanzamiento").
- `odd/tasks/damero-demo-photos.md:81` — el procedimiento de reemplazo (borrar `public/propiedades/<slug>/`, soltar las reales con la convención `NN-<ambiente>.webp`, ajustar `src`/`titulo` del frontmatter).
- `docs/DESIGN.md:359` — §7: subsección "Pre-validation exception — provisional stock photography (declared 2026-09-29)".
- `docs/DESIGN.md:498` — §11: el bullet de stock, acotado por esa excepción.
- `src/content/propiedades/casa-3-amb-guadalupe-santa-fe.md:19` — `fotos:` (portada = primera entrada); mismo campo en los otros 3 markdown (`:20`).
- `odd/tasks/damero-demo-photos.md:59` — tabla de fuentes/licencias Pexels de las 19 fotos actuales.

**Verificación:** fotos reales bajo `public/propiedades/<slug>/` (WebP, ancho ≤1600 px, <300 KB, ≤10 por listing), frontmatter ajustado, `pnpm check:images` en verde con las fotos reales, `pnpm test:e2e` en verde, y la excepción de `docs/DESIGN.md` §7/§11 retirada o marcada como consumida.

**Estado:** Abierto

### B10 — Validar el mapa de detalle en el deploy

**Qué falta:** validación del stakeholder sobre el deploy (Vercel) de que el mapa de la ficha **renderiza de verdad** — canvas visible, círculo de 400 m, atribución — y no queda en el fallback. El render real se implementó y mergeó (PR #9), pero nunca se validó contra la URL en producción.

**Quién decide:** stakeholder (validación manual sobre el deploy).

**Dónde impacta:**
- `odd/tasks/damero-detail-map-render.md:183` — "Queda **validar el mapa en el deploy** (stakeholder)" (sección "Próximo paso", `:181`).
- `src/pages/propiedades/[slug].astro:249` — banda UBICACIÓN que aloja el mapa.
- `src/pages/propiedades/[slug].astro:269` — contenedor del mapa (`aria-label="Mapa de la zona aproximada"`).
- `docs/DESIGN.md:723` — contrato del mapa (MapLibre + OpenFreeMap, lazy-load; atribución obligatoria en `:727`).

**Verificación:** revisión visual sobre las 4 fichas en la URL de producción: mapa renderizado (no el fallback `Ubicación no disponible momentáneamente.`), círculo de 400 m y atribución `© OpenFreeMap © OpenStreetMap` visibles. Si en el deploy no renderiza: diagnosticar primero el worker auto-hospedado (`odd/tasks/damero-detail-map-render.md:78`) antes de tocar código.

**Estado:** Abierto

## No bloqueantes (sólo registro)

- **Review nativo de S4 (FAQs) — diferido, no descartado** (decisión del stakeholder, 2026-09-22). Recetario para retomarlo en `odd/tasks/damero-propiedades-faqs.md` Progreso (h) (`:195`), con la receta exacta en `:202`: `gentle-ai sync` y preflight con la base exacta `472e2b7` (o `git worktree` a `6db7b1d` para que el candidato sea sólo S4). No bloquea el lanzamiento.
- **`fotos[].descripcion` — documentado, nunca renderizado.** El schema lo define (`src/content.config.ts:58`) pero ninguna vista lo muestra (verificado por grep en `src/`: la galería consume sólo `src` + `titulo`). Es un hueco aparte que merece su propia decisión y está registrado como tal en `odd/tasks/damero-employee-content-flow.md:15` y `odd/tasks/damero-demo-photos.md:28`. No es un bloqueante de lanzamiento.
