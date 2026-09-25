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
- [ ] hecho

### T2 — Data de prueba: cuatro propiedades de Santa Fe
- **Entregable:** se borran `casa-quinta-3amb.md`, `departamento-2-amb-balcon.md`,
  `lote-600-m2-apto-credito.md`; se agregan 4 markdown en Centro, Guadalupe, Barrio Norte y
  Candioti. Toda la suite que referencia los slugs viejos se actualiza en el mismo commit.
- **Criterio:** build verde; las 4 rutas nuevas responden 200; los conteos y filtros e2e
  actualizados quedan consistentes con la nueva data.
- [ ] hecho

### T3 — Cobertura e2e del render real del mapa
- **Entregable:** spec nueva con (a) test determinista que intercepta la URL del estilo y la
  sirve con un estilo mínimo local (sin red) y asserta canvas visible + overlay + fallback
  oculto; (b) smoke test contra OpenFreeMap real que no rompe el gate si no hay red.
- **Criterio:** el test determinista pasa sin red externa; el live pasa con red.
- [ ] hecho

### T4 — Gate completo y verificación
- [ ] `pnpm test:e2e` verde en los 3 viewports.
- [ ] verificación independiente read-only de la slice.

---

## Evidencia

_(se completa a medida que cierran las tareas)_

---

## Próximo paso

Crear la branch `feat/detail-map-render`, aplicar T1 (causa raíz), luego T2 y T3, gate y PR.
