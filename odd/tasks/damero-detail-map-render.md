# ODD — Damero: render real del mapa de detalle y data de prueba de Santa Fe

**Estado:** en curso. **T1–T4** abiertas sobre la branch `feat/detail-map-render`.

**Objetivo:** que el mapa de las páginas de detalle **renderice de verdad**, que el gate e2e lo
pruebe (hoy sólo prueba el fallback), y que la cartera de prueba sean cuatro propiedades de la
ciudad de Santa Fe en barrios distintos.

**Problema:** ninguna página de detalle renderiza el mapa. El usuario lo reportó en validación de
MVP. La suite e2e pasa verde porque **nunca asserta el estado renderizado**: aborta el proveedor
de tiles en `beforeEach` y sólo verifica el fallback (§17.2:709).

**Por qué:** `maplibre-gl@6.10.0` deriva la URL de su worker en runtime, relativa a su propio
chunk: `new URL('./maplibre-gl-worker.mjs', <url_del_chunk>)`. Astro/Vite bundlea el chunk
`detail-map.*.js` pero **no emite el worker ni su dependencia** `maplibre-gl-shared.mjs`. El
request `/_astro/maplibre-gl-worker.mjs` devuelve 404 → `map.on('load')` nunca dispara →
`canvas.is-ready` nunca se agrega → el canvas queda `visibility: hidden` y el fallback queda
visible para siempre. Reproducido contra el build de producción:

```
FAILED REQUEST: /_astro/maplibre-gl-worker.mjs :: net::ERR_FAILED
STATE: canvasVisibility: "hidden"  fallbackVisible: true
```

**Alcance:**
- Auto-hospedar el worker de MapLibre con Vite (`?worker&url` + `setWorkerUrl()`), sin API keys ni
  cambios de diseño.
- Agregar cobertura e2e del **render exitoso** (canvas visible, overlay presente), determinista
  (estilo stub local sin red) más un smoke test contra OpenFreeMap real.
- Reemplazar las 3 propiedades semilla (Luján / Mercedes) por 4 propiedades de la ciudad de Santa
  Fe, en los barrios Centro, Guadalupe, Barrio Norte y Candioti.
- Actualizar toda la suite e2e que referencia los slugs semilla.

**Fuera de alcance:**
- Cambios de diseño: §17.2 de `docs/DESIGN.md` no se toca.
- Fotos reales: las 4 propiedades nuevas llevan `fotos: []` (mismo estado que las semilla; el
  placeholder de marca ya está aprobado).
- El deploy: lo hace el stakeholder.

---

## Restricciones cerradas

- **Ruta ODD**, no SDD. Work-unit commit por tarea, rama de feature + PR.
- **`pnpm`, nunca `npm` ni `yarn`.** `pnpm-workspace.yaml` y `pnpm-lock.yaml` no se tocan.
- **Sin dependencias nuevas.** `maplibre-gl` ya está; el worker se toma del paquete instalado.
- **`localidad` = ciudad (`Santa Fe`), `zona` = barrio.** Es la convención de la data semilla
  (`localidad: Luján`, `zona: Barrio Los Aromos`) y el contrato del schema.
- **Sin datos inventados** (DESIGN §11): `whatsapp` sigue siendo el placeholder pendiente; no se
  inventan teléfonos, fotos ni direcciones exactas.
- **Documentación y código en inglés; `odd/tasks/*.md` en español** (convención del repo).
- **Commits convencionales, sin atribución de IA.**

---

## Hallazgos que fundan las tareas

**H1 — El worker de MapLibre no se emite; el mapa nunca carga (causa raíz).**
`detail-map.ts` importa `maplibre-gl` y lo bundlea, pero el worker es un asset runtime que Vite no
detecta (`new Worker(<string runtime>)`, no `new URL(...)`). El paquete expone `setWorkerUrl()`
justamente para entornos con bundler. Verificado además que `tiles.openfreemap.org` responde 200
(estilo y tiles), así que el único bloqueo es el 404 del worker.

**H2 — El gate e2e no tiene ninguna prueba positiva del mapa.**
`propiedades-detalle-content.spec.ts:18-20` y `propiedades-detalle-structure.spec.ts:42` hacen
`page.route(/openfreemap/, abort)` en `beforeEach`. Los asserts son `canvas).not.toBeVisible()`.
Una regresión que rompa el render real pasa el gate sin ruido.

**H3 — La data semilla no es de Santa Fe y está hardcodeada en 5 specs.**
Los slugs viejos aparecen en `propiedades-detalle-content`, `propiedades-detalle-structure`,
`propiedades-detalle-accessibility`, `propiedades-filtering` y en los conteos del index. El swap
de data obliga a actualizar esas specs en el mismo commit.

---

## Checklist

### T1 — Worker auto-hospedado: el mapa renderiza
- **Entregable:** `src/lib/map/detail-map.ts` importa el worker con `?worker&url` de Vite y llama
  `setWorkerUrl()` antes de construir el `Map`.
- **Criterio:** build emite el worker bundleado; el diagnóstico contra `dist/` muestra
  `canvasVisibility: visible`, `canvas.is-ready`, fallback `hidden`, sin request fallido.
- [x] hecho. Commit `e73cf8c`. Build emite `_astro/maplibre-gl-worker-CD0Mhlp9.js` (507 KB) y el
  script de página lo referencia. Diagnóstico contra `dist/` en Chromium: `canvasClasses:
  "map-canvas maplibregl-map is-ready"`, `canvasVisibility: visible`, `fallbackHidden: true`,
  `FAILED REQUESTS:` vacío.

### T2 — Data de prueba: cuatro propiedades de Santa Fe
- **Entregable:** se borran `casa-quinta-3amb.md`, `departamento-2-amb-balcon.md`,
  `lote-600-m2-apto-credito.md`; se agregan 4 markdown en Centro, Guadalupe, Barrio Norte y
  Candioti. Toda la suite que referencia los slugs viejos se actualiza en el mismo commit.
- **Criterio:** build verde; las 4 rutas nuevas responden 200; los conteos y filtros e2e
  actualizados quedan consistentes con la nueva data.
- [x] hecho. Commit `f3fab36`. Las 3 semillas Luján / Mercedes se reemplazan por 4
  propiedades de la ciudad de Santa Fe (`casa-3-amb-guadalupe-santa-fe`,
  `departamento-2-amb-centro-santa-fe`, `departamento-3-amb-barrio-norte-santa-fe`,
  `lote-600-m2-candioti-santa-fe`), todas `localidad: Santa Fe`, `fotos: []` y `whatsapp` con el
  placeholder pendiente. Specs actualizadas en el mismo commit: `propiedades-detalle-structure`
  (slugs, títulos, marcadores de coordenadas y payloads JSON desde el frontmatter nuevo),
  `propiedades-filtering` (conteos recomputados: total 4; alquiler 1; habitaciones 3+ → 2, ambas
  venta; cochera → 1; rango USD 50.000–118.000 → 2; orden precio asc → lote Candioti, desc →
  depto Centro; estado vacío con `operacion=alquiler&cochera=si`, combinación imposible en la
  data nueva), el comentario R10 de `src/pages/propiedades/index.astro` ("the current 4
  listings") y el puntero del modelo en `docs/GUIA_CARGA_PROPIEDADES.md` (el bloque "Ejemplo real"
  se alinea con el archivo modelo en el commit de docs siguiente). Gate `pnpm test:e2e`
  verde: `check:images` OK (4 listings) y Playwright 280 passed / 11 skipped en los 3 viewports
  (desktop-1280, mobile-390, mobile-320).

### T3 — Cobertura e2e del render real del mapa
- **Entregable:** spec nueva con (a) test determinista que intercepta la URL del estilo y la
  sirve con un estilo mínimo local (sin red) y asserta canvas visible + overlay + fallback
  oculto; (b) smoke test contra OpenFreeMap real que no rompe el gate si no hay red.
- **Criterio:** el test determinista pasa sin red externa; el live pasa con red.
- [x] hecho. Commit `5a68ef6`.
  Spec nueva `e2e/propiedades-detalle-map.spec.ts` + helper `e2e/helpers/png-decode.ts`
  (decodificador PNG mínimo con `node:zlib`, sin dependencias). (a) Test determinista: intercepta
  `https://tiles.openfreemap.org/styles/positron` y la sirve con un estilo stub local (fondo negro
  puro); todo otro request al host de tiles se aborta, así que cualquier fuga de red rompe el
  render y falla el test. Asserta canvas visible + `is-ready` + fallback `hidden`, que el handler
  del estilo stub efectivamente disparó, y — a nivel de píxeles pintados, no de clases — que el
  centro del frame (dentro del círculo de zona de 400 m a zoom 14.5) difiere de la esquina (negro
  puro del stub): screenshot del frame → PNG decodificado en Node → media de parche 8×8 en centro
  vs. esquina (el canal verde levanta ≥ 12 por el fill sage al 0.15 sobre negro). (b) Smoke live
  contra OpenFreeMap real: preflight DENTRO de la página (`fetch` con timeout 8 s) y `test.skip`
  honesto si es inalcanzable — el preflight usa el stack de red del browser porque puede diferir
  del del proceso de test: verificado con proxy muerto (`HTTPS_PROXY=http://127.0.0.1:9`) que
  `page.request` ignora el proxy de entorno y Chromium lo honra, así que con `page.request` el
  test fallaba en vez de skipear. Ambos tests skipean con razón explícita si WebGL no está
  disponible (gap de entorno, no regresión). Verificación: spec sola → 6 passed (3 viewports × 2
  tests); simulacro offline → determinista 3 passed + live 3 skipped; gate completo
  `pnpm test:e2e` → `check:images` OK y Playwright 286 passed / 11 skipped en los 3 viewports.

### T4 — Gate completo y verificación
- [x] `pnpm test:e2e` verde en los 3 viewports (verificación del orquestador sobre el árbol
  final: `check:images` OK y Playwright 286 passed / 11 skipped / 0 failed en 28.6 s —
  desktop-1280, mobile-390, mobile-320).
- [ ] verificación independiente read-only de la slice.

---

## Evidencia

_(se completa a medida que cierran las tareas)_

---

## Próximo paso

Crear la branch `feat/detail-map-render`, aplicar T1 (causa raíz), luego T2 y T3, gate y PR.
