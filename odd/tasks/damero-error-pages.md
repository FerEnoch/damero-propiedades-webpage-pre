# ODD — Damero: página 404

**Estado:** **implementado, verificado y aprobado 2026-10-01.** Las 4 work units cerradas, gate verde, copy aprobado por el stakeholder. Pendiente sólo el commit.
Alcance cerrado por el stakeholder: **solo 404**. Sin Stitch (decisión del stakeholder: "con el spec alcanza").
**Objetivo:** que una URL inexistente del sitio deje de mostrar la página 404 genérica de Astro (y, en producción, la de Vercel) y muestre una página propia, on-brand, con un camino de recuperación real.

**Problema:** el sitio tiene 4 rutas (`/`, `/propiedades`, `/propiedades/<slug>`, `/faqs`) y **ningún** `404.astro`. Verificado en vivo: `astro preview` responde **404** con la página por defecto de Astro (4312 bytes, `lang="en"`), fuera de marca y en inglés. Ese es el estado que ve el visitante cuando tipea mal una dirección.

**Por qué:** `AGENTS.md` declara que la suite e2e es el gate de aceptación y que *"nuevas páginas se agregan al gate, no al margen"*. Hoy no hay nada que gatear porque la ruta no existe como página propia.

**Alcance:** spec nueva en `docs/DESIGN.md` (§18) + `src/pages/404.astro` + `e2e/404-structure.spec.ts`.
**Fuera de alcance (decidido):**
- **Página 500 propia.** `src/pages/500.astro` **no está disponible para páginas prerenderizadas** (doc de Astro: *"This custom page is not available for prerendered pages"*, desde v4.10.3). El repo es `output: static` sin adapter: una 500 propia exige on-demand rendering + adapter y cambia el modelo de build/deploy en Vercel. Es decisión de arquitectura, no un archivo. **No se toca.**
- Stitch: el stakeholder lo descartó para este track.
- Cualquier cambio de tokens, layout base, header o footer.

## Hallazgos (reconocimiento, 2026-10-01)

| # | Hallazgo | Evidencia |
|---|---|---|
| H1 | `404.astro` → `404.html` funciona en static; Vercel lo toma automáticamente | doc de Astro, *astro-pages* |
| H2 | El preview de Astro sirve 404 en rutas inexistentes | corrida local: `curl` a `/ruta-que-no-existe` → **404** con el 404 default de Astro |
| H3 | `500.astro` no aplica en static | ver "Fuera de alcance" |
| H4 | No hay referencia de diseño para errores: `DESIGN.md` llega a §17 (ninguna cubre 404) y `design/screens/` no tiene screen de error | grep + listado del directorio |
| H5 | Las piezas para componerla ya existen: `BaseLayout`, `Button`, `EmptyState` (patrón de banda tintada), tokens §2–§4 | `src/components/`, `src/layouts/` |

**Nota de H4:** al no haber screen aprobado, la 404 se compone con los patrones ya existentes y **la spec (§18) es la única autoridad**. El copy nuevo es lo único realmente nuevo; se propone abajo y **queda sujeto a aprobación del stakeholder**.

## Restricciones heredadas (no se reabren)

- Ruta **ODD**, no SDD. Work-unit commits, Conventional Commits, sin atribución de IA.
- `pnpm` únicamente. `pnpm-workspace.yaml` y `pnpm-lock.yaml` **no se tocan**. Ninguna dependencia nueva.
- CSS plano con tokens. Cero hex fuera de `tokens.css`. `--color-sage` **jamás** en texto (§2).
- Nada de píldoras, círculos ni `border-radius: 999px` (§4/§11).
- Holgado a 1280/390/320, sin overflow horizontal (§12).
- Datos inventados: 0 (§11, §17.4).

## Decisiones de diseño de la spec (§18)

- **Composición canónica = patrón `EmptyState`**: banda full-bleed `--color-bg-subtle`, `--section-y`, **alineada a la izquierda con borde derecho irregular**. Nunca centrada: §11 prohíbe explícitamente *"Centred hero sections and centred text blocks"*. Una 404 centrada sería una violación directa del sistema.
- **Sin ilustración, sin emoji, sin lupa, sin ícono.** El sistema resuelve con tipo y hairlines (§4, §11). La 404 es tipográfica.
- **Un solo CTA primario** (§6/§11): `Ver propiedades` → `/propiedades`. La recuperación secundaria es un `text-link` `Volver al inicio` → `/` (un text-link no es una segunda acción primaria).
- **`<meta name="robots">` no se agrega**: el status 404 es el mecanismo; no hace falta tocar `BaseLayout`.
- Header y footer se heredan de `BaseLayout` (la nav es parte del camino de recuperación). En la 404 **ningún** link de nav queda `is-active`.

## Copy propuesto (ES, registro del sitio — voseo, sin superlativos ni clichés §11/§16)

| Slot | Texto |
|---|---|
| `title` | `Página no encontrada \| Damero Propiedades` |
| eyebrow | `ERROR 404` |
| h1 | `No encontramos esta página.` |
| body | `Puede que la dirección esté mal escrita o que el enlace ya no exista. Podés buscar una propiedad o volver al inicio.` |
| CTA primario | `Ver propiedades` → `/propiedades` |
| text-link | `Volver al inicio` → `/` |

**Estado del copy: APROBADO por el stakeholder (2026-10-01).** Es el único texto del sitio sin screen de origen: se propuso, se revisó y se aprobó tal cual. Cambiarlo después es una edición de una línea por slot.

## Tareas (work units)

| # | Tarea | Archivos | Estado |
|---|---|---|---|
| W1 | Spec §18 en `DESIGN.md` (alcance, composición, copy, cómo se verifica) | `docs/DESIGN.md` | ✅ |
| W2 | Implementar la 404 componiendo primitivas existentes | `src/pages/404.astro` | ✅ |
| W3 | Specs e2e de la ruta (status 404 + estructura + a11y + audaces de marca + no-centrado) | `e2e/404-structure.spec.ts` | ✅ |
| W4 | Gate verde + verificación independiente + evidencia | — | ✅ |

## Criterios de aceptación

| Criterio | Cómo se verifica |
|---|---|
| Una URL inexistente responde **404** y renderiza la página propia | e2e: `page.goto('/ruta-que-no-existe')` → status 404 + `<title>`/`<h1>` propios |
| `lang="es"` y exactamente un `<h1>` | e2e |
| Landmarks `header`/`main`/`footer` | e2e |
| **Exactamente 1** `.button--primary` visible por viewport (1280/390/320) | e2e |
| El bloque principal **no está centrado** (§11) | e2e: `text-align` computado del h1 ∈ {`start`, `left`} |
| 0 overflow horizontal a 390 y 320 | e2e |
| 0 texto renderizado en `#7C916F` | e2e (audit compartido) |
| Matriz de contraste §2 sobre computed styles | e2e (audit compartido) |
| Touch targets ≥ 44px a 390 | e2e |
| Links internos de la 404 no muertos (`/`, `/propiedades` → 200) | e2e |
| 0 hex crudos fuera de `tokens.css` | grep sobre `src/` |
| `pnpm build` exit 0 y gate completo verde | comando |
| Ninguna dependencia nueva; `pnpm-workspace.yaml` y lockfile intactos | `git diff --stat` |

## Forecast de entrega

~3 archivos + 1 sección de doc. Muy por debajo del presupuesto de ~400 líneas autoradas: **un solo work-unit commit** (`feat(...)` + su spec e2e en el mismo commit). Estrategia heredada: `ask-on-risk`; si se pasa de ~400, se para y se avisa.

## Verificación ejecutada (2026-10-01)

**Entregable:** `src/pages/404.astro` (131 líneas) + `e2e/404-structure.spec.ts` (13 tests × 3 viewports). `docs/DESIGN.md` +46 líneas (§18, doc-only). Cero componentes nuevos, cero tokens nuevos, cero dependencias, cero archivos existentes modificados.

| Check | Resultado |
|---|---|
| `pnpm build` | ✅ exit 0 — `404.html` emitido en la raíz del sitio |
| `pnpm exec playwright test e2e/404-structure.spec.ts` | ✅ exit 0 — **38 passed / 1 skipped** (el skip es el touch-target a `desktop-1280`, convención repo-wide) |
| `pnpm test:e2e` (gate completo, corrida del padre) | ✅ exit 0 — **327 passed / 12 skipped** en 35.4s |
| Status real de la ruta | ✅ `page.goto('/ruta-que-no-existe')` → **404** con la página propia. No se testea `/404` (daría 200) |
| Hex crudos fuera de `tokens.css` en los archivos tocados | ✅ 0 (grep propio + verificado) |
| Reglas `color:` con sage | ✅ 0 |
| Un solo CTA primario por viewport | ✅ 1 `.button--primary` (`Ver propiedades`); el resto son `.button--text-link`. El WhatsApp del header no es `.button` |
| No-centrado (§11) | ✅ `text-align` computado de `h1`/eyebrow/body ∈ {`start`, `left`}; el test discrimina (un `center` real lo pone rojo) |
| Teclado + anillo de foco (§12) | ✅ agregado en el pase de corrección, mismo patrón que `landing-accessibility` |
| `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `package.json` | ✅ intactos |
| Limitación honesta | `astro check` / `tsc` **no corren**: el repo no tiene `typescript` ni `@astrojs/check` (limitación ya documentada en `damero-pages.md` T3). La exposición de tipos se confirma por build + e2e |

**Verificación independiente (contexto fresco, read-only):** `pass-with-findings` — **0 CRITICAL, 0 WARNING, 4 SUGGESTION**. Confirmó de forma no tautológica los 3 puntos que importaban: el assert de no-centrado discrimina, el de status 404 es real (ruta inexistente, no `/404`), y cada claim de composición/copy contra §18.3/§18.4.

**Corrección única aplicada tras verificar (1 ronda):**
1. **SUGGESTION — gap de §12.** La spec no cubría reachability/teclado, que **todas** las otras rutas gatean (`landing-`, `faqs-`, `propiedades-*`). Se agregó el test del row 12 con `prepareKeyboardAudit`/`readFocusedElement`, el mismo patrón exacto. Re-corrido el gate: **38 → 41 tests** de la spec, suite total **324 → 327 passed**.

**SUGGESTIONs no aplicadas (reportadas, sin acción):**
- **Umbral del sanity floor.** El writer bajó `MIN_TEXT_ELEMENTS_SCANNED` de `> 20` (convención de las otras specs) a `> 15`, porque la 404 es deliberadamente mínima (18 elementos de texto a 390/320). Documentado en el código. El verificador confirmó que **no hay falso verde**: una página vacía falla en mobile por el floor y en todos los viewports por el assert de texto del `h1`. En 1280 el floor queda sin dientes; riesgo residual bajo y aceptado.
- **§18.3 decía que la banda iguala "the empty state and the FAQ closing band"**. Es impreciso: el closing de FAQ usa `--section-y-tight`. **Corregido en `DESIGN.md`** (el código ya usaba `--section-y`, que es lo correcto).

## Progreso

- **2026-10-01 (a):** reconocimiento y alcance. Verificado en vivo que el preview responde 404 con la página default de Astro (H2) y que el repo es static sin adapter (H3 ⇒ la 500 queda fuera). El stakeholder descartó Stitch y eligió **solo 404**.
- **2026-10-01 (b):** W1–W4 cerradas. Spec §18 en `DESIGN.md`, `src/pages/404.astro`, `e2e/404-structure.spec.ts`. Gate completo verde (327/12), verificación independiente `pass-with-findings` (0 CRITICAL / 0 WARNING / 4 SUGGESTION) y una ronda única de corrección (gap de teclado §12 + nit de §18.3). Copy aprobado por el stakeholder el mismo día.
