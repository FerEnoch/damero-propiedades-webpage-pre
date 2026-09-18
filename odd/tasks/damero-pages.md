# ODD — Damero: fundación del sitio + landing

**Estado:** en curso (2026-09-18)

**Objetivo:** Dejar el sitio Astro con los cimientos de código (tokens, layout, componentes base y content collection) y la landing `/` funcionando contra `docs/DESIGN.md`.

**Problema:** El repo tiene el scaffold de Astro y los artefactos de diseño validados, pero `src/pages/index.astro` sigue siendo un placeholder: cero código de producción.

**Por qué:** El track de diseño cerró y el de fundación también. El siguiente incremento es el vertical slice que prueba el stack de punta a punta: tokens + layout + datos + una página real.

**Alcance:** tokens CSS, estilos globales y fuentes, layout base (header/footer), content collection de propiedades con datos semilla, componentes base de `DESIGN.md` §6, y la landing `/` (§5).
**Fuera de alcance:** `/propiedades`, `/propiedades/<slug>` y `/faqs` (§17); los 5 checks de CI del PRD §9; el deploy.

## Restricciones (decisiones cerradas)

- **Ruta: ODD**, no SDD (stakeholder, 2026-09-18).
- **pnpm 12.4.2**, con los settings en `pnpm-workspace.yaml` (no en `.npmrc`). Ver `damero-web-foundation.md`.
- **Solo tokens de marca.** Sage `#7C916F` NUNCA en texto renderizado (3.42:1); derivado `#4F6144` para links y acento chico.
- **Sin dark mode**, pero con los tokens semánticos listos para agregarlo sin refactor (`DESIGN.md` §13).
- **Fotos:** ratio 3:2 + placeholder de marca hasta que existan las reales (`DESIGN.md` §7).
- **Datos del stakeholder pendientes → placeholders explícitos, nunca inventados** (`DESIGN.md` §17.4). Stitch ya inventó datos legales una vez.
- **Composición canónica de la landing = `DESIGN.md` §5.** No improvisar secciones.
- **Directo a `main`** por PRD §9 (commit → CI gate). Sin PRs.

## Tareas

- [x] T0 — Migración de la política pnpm a `pnpm-workspace.yaml` (ver `damero-web-foundation.md`)
- [ ] T1 — Tokens CSS + estilos globales + las 3 fuentes (Newsreader, Hanken Grotesk, JetBrains Mono) según `DESIGN.md` §14, §3 y §13
- [ ] T2 — Layout base: shell, header y footer con el bloque legal verbatim (`DESIGN.md` §6, §17.4)
- [ ] T3 — Content collection `propiedades` con el schema del PRD §4 + 3 listados semilla con placeholder de marca
- [ ] T4 — Componentes base de `DESIGN.md` §6: Button, Property card, Operation badge, Filter input, WhatsApp CTA, Empty state
- [ ] T5 — Landing `/` según `DESIGN.md` §5: hero (damero + titular + 1 CTA de búsqueda), bloque de destacadas, los 8 servicios con los SVG duotono, teaser de FAQ
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

_(se completa al cerrar cada tarea)_

## Pendientes del stakeholder (bloquean el lanzamiento, no el build)

- Las 6 respuestas de FAQ (PRD §8) — hoy `[PENDIENTE]`.
- WhatsApp y CCI reales; nombre del corredor (¿"Alejandro" o "Alejando"?).
- Confirmar el tinte `#C3CDB8` del logo knockout.
- Confirmar el prefijo `icon-` en los nombres de archivo.
- Revisar `icon-handshake.svg` a 44 px (punto débil del set).

## Progreso

- **2026-09-18 (a):** decisiones del stakeholder — ruta ODD, migración a pnpm 12, primer entregable = fundación + landing.
- **2026-09-18 (b):** T0 completado (migración de la política pnpm; detalle y evidencia en `damero-web-foundation.md`).
