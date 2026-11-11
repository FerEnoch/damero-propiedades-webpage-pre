# ODD — Damero: rediseño de los íconos de servicios ilegibles

**Objetivo:** recuperar la legibilidad de Negociación y Asesoramiento legal a tamaño de badge.
**Problema:** el apretón de manos y la pluma con sello no se reconocían en la banda de servicios.
**Alcance:** dos glifos, sus referencias, propuestas visuales, contrato de diseño y cierre de B7; los otros seis quedan intactos.

## Specs

- **S1 — Rediseñar los dos SVG y presentar alternativas visuales**, considerando íconos existentes como base:
  > Vamos a hacer un rediseño completo de esos svg. Puntualmente del handshake y el pen-seal no me gustan como están. Los demás están bien. Hacemos un rediseño porque no se entienden bien. Mostrame propuestas para visualizar directamente en el editor y decidir cuál usar. Considera directamente descargar otros íconos hechos.

- **S2 — Resolver la ilegibilidad de los dos servicios a escala real**, no sólo en una vista ampliada:
  > el logo de asesoramiento legal y el de negociación, no se entienden bien. Evalua agrandarlos mas que el resto, o bien reelaborarlos.

- **S3 — Aumentar 2px el glifo en desktop**, de 28px a 30px desde 768px, dentro del badge de 48px:
  > en PC considera si lo ves viable aumentar 2px más

  Confirmación:
  > Sí, subir a 30px en PC

- **S4 — Reelaborar ambos en vez de limitarse a agrandarlos**:
  > Reelaborar ambos (recomendado)

- **S5 — Usar la propuesta A recomendada para Negociación**, elegida en `design/service-icon-redesign/02-negociacion.html`, comentario `cb1jve8n`:
  > I choose this. The recommended one

- **S6 — Usar la propuesta A recomendada para Asesoramiento legal**, elegida en `design/service-icon-redesign/03-asesoramiento-legal.html`, comentario `03vtkwxg`:
  > I choose this. The recommended

## Tareas

Implementación y decisiones completadas; el commit todavía no fue creado. T1–T6 integran la misma unidad prevista: `feat(landing): redesign negotiation and legal service glyphs`.

- [x] **T1 — S1, S2, S4, S5, S6:** diagnóstico del set y propuestas en el canvas → `design/service-icon-redesign/`, artboards `01-diagnosis.html`, `02-negociacion.html` y `03-asesoramiento-legal.html` (con `design.json` y `comments.json`); commit: pending (misma unidad prevista).
- [x] **T2 — S1, S2, S4, S5:** `src/icons/services/icon-handshake.svg` reconstruido sobre la geometría de Lucide, adaptada al duotono; commit: pending (misma unidad prevista).
- [x] **T3 — S1, S2, S4, S6:** `src/icons/services/icon-pen-seal.svg` → `src/icons/services/icon-shield-check.svg`, escudo con check; commit: pending (misma unidad prevista).
- [x] **T4 — S1, S6:** import y mapa de `src/components/ServiceIcon.astro`, union type `ServiceIconName` y servicio en `src/data/landing.ts` actualizados al nuevo nombre; commit: pending (misma unidad prevista).
- [x] **T5 — S2, S3, S5, S6:** `docs/DESIGN.md` §5 y §8 actualizados: badge de 48px, glifos de 28/30px, tabla y “Glyph legibility budget”; commit: pending (misma unidad prevista).
- [x] **T6 — S2, S5, S6:** cierre de B7 en `odd/tasks/damero-launch-blockers.md` y sus referencias en release prep y sistema visual; commit: pending (misma unidad prevista).

## Restricciones

- **Duotono — `docs/DESIGN.md` §8:** viewBox `24×24`, trazo `1.5px` con `stroke="currentColor"`; masa sage `#7C916F` ≤40% del área del ícono, dibujada primero detrás del trazo. Sin tercer color, gradientes ni fondo rounded-rect dentro del SVG.
- **Accesibilidad — `docs/DESIGN.md` §8:** íconos decorativos con `aria-hidden` junto a su etiqueta; sin `<title>` en el DOM renderizado.
- **Contenedor — `docs/DESIGN.md` §8:** badge cuadrado de `48 × 48`, radio `--radius-sm`, nunca círculo; excepción de relleno `--color-bg-surface` explícita. Glifo centrado de 28px, 30px desde 768px.
- **Diferenciación — `docs/DESIGN.md` §8:** la masa de acento no puede ser el único diferenciador entre dos íconos.
- **Contraste — `docs/DESIGN.md` §2:** sage nunca como texto renderizado con significado; no trasladar el acento del SVG al copy.
- **Responsive — `docs/DESIGN.md` §10:** sin overflow horizontal a 1280 / 390 / 320.
- **Copy — `docs/DESIGN.md` §16:** textos de los servicios fijos, sin reescritura.
- **Alcance — S1:** los otros seis glifos no se rediseñan: “Los demás están bien”.

## Hallazgos

- **Presupuesto de trazos:** en una grilla de 24px, el stroke de 1.5px exige espacio entre líneas. El apretón anterior gastaba ocho trazos paralelos en el encuentro de las manos y se leía como un teclado dentro del badge.
- **Detalle subpíxel:** el anillo interior de `0.8px` de la pluma con sello quedaba como una mota subpíxel; la silueta completa se leía como una paleta de caramelo.
- **Regla de silueta — §8:** la forma debe reconocerse sin depender de microdetalles. El apretón nuevo usa dos manos enlazadas y acento en la palma cercana; el legal usa un escudo con check y acento en el check.
- **Doble descarte para documento + sello — §8:** “Gestión documental” ya usa un documento en la misma fila; además, la masa de acento no puede ser la única diferencia. Cambiar el sello no daba una identidad suficiente al servicio legal.
- **Evaluación a escala:** todos los candidatos se renderizaron a **24 / 28 / 30px antes de juzgarlos**, no al tamaño de la previsualización ampliada.

| Servicio | Candidato descartado | Motivo a tamaño de badge |
|---|---|---|
| Negociación | Bloque sage central con dos brazos | Se leía como un pájaro a 24px. |
| Negociación | Dos flechas convergentes sobre una base | Las puntas colapsaban en una X ancha. |
| Asesoramiento legal | Balanza | Los platillos colgantes se leían como árbol o antena. |
| Asesoramiento legal | Mazo | Se leía como una pluma fuente y se acercaba al glifo de “Fotografía profesional”. |
| Asesoramiento legal | Documento con sello | Duplicaba el documento de “Gestión documental”; el acento no alcanza para diferenciarlo (§8). |

**Artefactos de apoyo:** `design/system.md` y `design/system.html` sincronizan el sistema al formato gentle-design desde `src/styles/tokens.css` y `docs/DESIGN.md`; no son insumo del build.

## Veredicto

Se entregaron el apretón de manos basado en Lucide y el escudo con check, con sus referencias actualizadas: ambos son legibles a tamaño de badge y **B7 queda cerrado** por elección del stakeholder. No se cambiaron los otros seis glifos, el copy de servicios ni la geometría del badge más allá del cuadrado documentado de 48px; la escala de los glifos queda en 28px mobile / 30px desktop.

## Log

- **2026-11-11 (a):** L1 — pedido original:
  > Vamos a hacer un rediseño completo de esos svg. Puntualmente del handshake y el pen-seal no me gustan como están. Los demás están bien. Hacemos un rediseño porque no se entienden bien. Mostrame propuestas para visualizar directamente en el editor y decidir cuál usar. Considera directamente descargar otros íconos hechos.

- **2026-11-11 (b):** L2 — antecedente de ilegibilidad:
  > el logo de asesoramiento legal y el de negociación, no se entienden bien. Evalua agrandarlos mas que el resto, o bien reelaborarlos.

- **2026-11-11 (c):** L3 — consulta de escala desktop:
  > en PC considera si lo ves viable aumentar 2px más

- **2026-11-11 (d):** L4 — escala confirmada:
  > Sí, subir a 30px en PC

- **2026-11-11 (e):** L5 — decisión de reelaborar ambos:
  > Reelaborar ambos (recomendado)

- **2026-11-11 (f):** L6 — Negociación, propuesta A, comentario `cb1jve8n` en `design/service-icon-redesign/02-negociacion.html`:
  > I choose this. The recommended one

- **2026-11-11 (g):** L7 — Asesoramiento legal, propuesta A, comentario `03vtkwxg` en `design/service-icon-redesign/03-asesoramiento-legal.html`:
  > I choose this. The recommended

- **2026-11-11 (h):** verificación y atribución registradas del trabajo implementado (no reejecutadas en esta tarea documental):
  - `pnpm test:e2e` → **459 passed / 21 skipped / 0 failed**; `pnpm build` → **exit 0**.
  - HTML de producción: **8 glifos de servicios**, cada uno con exactamente una masa `#7C916F` y trazos `stroke="currentColor"`; sin `<title>` en el DOM (`aria-hidden`). Sin overflow horizontal a **1280 / 390 / 320**.
  - `icon-handshake.svg`: geometría adaptada de `handshake` de **Lucide (`lucide-static` v1.72.0)**, **licencia ISC**, **Copyright (c) Lucide Icons and Contributors**. La atribución vive en un comentario XML dentro del SVG; se registra también aquí porque el repositorio no tiene archivo de avisos de terceros.
