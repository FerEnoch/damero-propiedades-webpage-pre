# ODD — Damero: diagrama del flujo de publicación y corrección del instructivo

**Estado:** abierto (2026-09-30).

**Objetivo:** que un empleado no técnico vea de un vistazo el recorrido completo para **publicar o actualizar** una propiedad, y que el instructivo no desinforme.

**Problema:** `docs/GUIA_CARGA_PROPIEDADES.md` (444 líneas) es sólo texto corrido: no tiene ninguna vista general del proceso, y quedó desactualizado después del PR #11 (fotos demo). Además cubre únicamente publicar una propiedad **nueva**: el flujo de **actualización** no existe, y el pedido del stakeholder explícitamente incluye "suban o actualicen propiedades".

**Por qué:** pedido del stakeholder (2026-09-30): *"algo más para hacer más didáctico el trabajo para los empleados no técnicos que suban o actualicen propiedades… crea uno teniendo en cuenta el instructivo que ya está hecho (de paso, revisalo)"*.

---

## Hallazgos de la revisión del instructivo (2026-09-30)

Contraste hecho contra `src/content.config.ts` (schema real) y `scripts/check-image-limits.mjs` (mensajes reales).

| # | Hallazgo | Gravedad | Evidencia |
| --- | --- | --- | --- |
| **F1** | El bloque **"Ejemplo real"** muestra `fotos: []` y afirma ser el archivo real `casa-3-amb-guadalupe-santa-fe.md`. Ese archivo tiene hoy **5 fotos** (PR #11). Copiarlo como modelo enseña algo falso. | **Alta** | guía `:172`–`:196` vs `src/content/propiedades/casa-3-amb-guadalupe-santa-fe.md:19+` |
| **F2** | El slug de ejemplo `casa-quinta-3amb` **ya no existe** (semilla borrada en el PR #9). Se usa como si fuera real en Parte 1 y Parte 4. | **Media** | guía `:61`–`:64`, `:272`–`:273`, `:296`–`:297` |
| **F3** | El bloque copiable trae **comentarios en inglés con jerga interna**: `PRD §11 offset`, `WHATSAPP_NUMBER_PENDING`, `src/data/site.ts`. Un empleado no técnico que copia el modelo arrastra eso a su archivo. | Baja | guía `:190`, `:193` |
| **F4** | **No existe el flujo de actualización** de una propiedad ya publicada (cambiar un precio, sumar fotos, corregir un dato). El usuario lo pidió explícitamente. | **Alta** | todo el documento |
| **F5** | Nunca dice que el pull request **necesita la aprobación de otra persona** antes de poder fusionarse, ni que el propio autor no puede aprobar el suyo. Un empleado se queda trabado en el paso final. | **Media** | guía `:309`–`:310` |
| **F6** | El ejemplo de salida "OK" del validador dice `3 listing(s), 0 referenced photo(s), 0 file(s)`; hoy la salida real es **4 listings, 19 fotos, 19 archivos**. | Baja | guía `:420` |
| **F7** | `expensas` también admite `null` además de omitirse. La guía sólo dice "se omite". No es un error (omitir funciona), pero la afirmación es incompleta. | Baja | `src/content.config.ts:33` |
| **F8** | El comentario del schema para `fotos[].titulo` dice *"Optional caption shown under the image"*, pero la guía (correctamente) aclara que **no se muestra**: alimenta el `alt`/`aria-label`. Comentario de código desactualizado. | Baja | `src/content.config.ts:55` |

**Lo que sí está bien (verificado):** la tabla de campos coincide exactamente con el schema (16 obligatorios + `expensas`/`destacada` opcionales, `cochera` acepta boolean o número, `.strict()` rechaza campos de más); los límites de foto son correctos (≤10, `.webp`, ≤1600 px, ≤300 KB inclusive); los mensajes de error citados coinciden carácter a carácter con `scripts/check-image-limits.mjs`; la regla de que la portada es la primera foto es correcta; el flujo de rama + pull request coincide con la branch protection activa.

---

## Alcance

**Dentro:** `docs/GUIA_CARGA_PROPIEDADES.md` — diagrama Mermaid del recorrido, sección de actualización, y corrección de **F1, F2, F3, F5, F6**.

**Fuera (sólo se reporta):** F7 y F8 (tienen que ver con `src/`, no con el instructivo); los bloqueantes de lanzamiento (`odd/tasks/damero-launch-blockers.md`); el copy del sitio.

---

## Restricciones cerradas

- **Diagrama Mermaid embebido en el markdown.** Se renderiza en GitHub —que es justo donde trabaja el empleado, sin instalar nada— y se mantiene con el mismo texto del doc: cero deriva entre diagrama y explicación, cero dependencias y cero assets nuevos.
- **Idioma español** (registro profesional neutro, variante Argentina) para la guía y el diagrama: es la única documentación en español por convención del repo, porque su audiencia es el empleado.
- **Sin datos inventados** (DESIGN §11): los ejemplos usan datos reales del repo o están marcados como hipotéticos.
- Sin tocar `pnpm-workspace.yaml` ni `pnpm-lock.yaml`. **Sin dependencias nuevas.**
- Commits convencionales, sin atribución de IA. Ruta **ODD** (no SDD), rama de feature + PR.

## Ruta elegida

**Delegated direct.** Detonante: escritura no trivial + 2 archivos (este doc de trabajo y la guía). Se delega UN writer acotado con especificación exacta; el orquestador verifica.

---

## Tareas

- [ ] **T0 — Diagrama "El recorrido, de un vistazo".** Mermaid `flowchart TD` con colores por quién actúa (manual / sistema / otra persona / corrección), la decisión de controles verdes-rojos y el bucle de corrección. Cubre los dos puntos de entrada (nueva y actualización), porque a partir de la rama el camino es idéntico. Ubicación: después de la introducción y antes de "Qué necesitás antes de empezar", con su leyenda de colores.
- [ ] **T1 — Sección "Actualizar una propiedad que ya existe".** Qué cambia respecto de crear una nueva (se edita el `.md` existente, se suben sólo los archivos de foto nuevos), qué **no** hay que tocar (el `slug`) y que todo lo demás es idéntico.
- [ ] **T2 — Corregir F1, F2 y F3.** Ejemplo con las fotos reales de la propiedad modelo; slug de ejemplo hipotético y claramente marcado; comentarios en español sin jerga interna.
- [ ] **T3 — Corregir F5 y F6.** Aviso explícito de la aprobación obligatoria del pull request; números del mensaje "OK" realistas.
- [ ] **T4 — Gate.** `pnpm test:e2e` en verde (3 viewports).
- [ ] **T5 — Cierre.** Evidencia en este doc + espejo en Engram.

## Criterios de aceptación

1. El Mermaid es sintácticamente válido y muestra las etapas del recorrido **más** el bucle de corrección.
2. La guía cubre **publicar** y **actualizar**; el diagrama refleja los dos caminos de entrada.
3. Cero afirmaciones falsas: el ejemplo coincide con el archivo real, y los mensajes citados del validador coinciden con `scripts/check-image-limits.mjs`.
4. El aviso de aprobación del pull request está explícito.
5. `pnpm test:e2e` en verde en los 3 viewports.

## Verificación aplicada

- `pnpm test:e2e` (gate de aceptación del repo).
- Relectura del Mermaid contra la sintaxis documentada y render en GitHub.
- Contraste de los mensajes citados contra `scripts/check-image-limits.mjs` (hecho en la revisión: 8 de 9 formatos exactos, el restante es F6).
