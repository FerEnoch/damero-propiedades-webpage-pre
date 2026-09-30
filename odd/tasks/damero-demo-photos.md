# Damero — Fotos de prueba para el MVP (demo pre-validación)

**Estado:** **Track cerrado (2026-09-29)** en `feat/demo-photos`: `3c7c84e` (fix del overflow del riel, work unit propio) + `e94e0f0` (`feat(content): add provisional demo photography to the four listings`, commit único de T0–T5). Gate completo verde: **289 passed / 11 skipped / 0 failed** (3 viewports) y `pnpm check:images` 19 fotos referenciadas / 0 violaciones. Push/PR/merge: decisión del stakeholder.
**Decisión del stakeholder (2026-09-29):** Opción A — fotos de banco royalty-free, descargadas y commiteadas. **Sin aviso estático de provisoriedad en la UI** ("no hace falta"). La coherencia con DESIGN.md se resuelve amendando esa parte de DESIGN.md si resulta necesario ("si es necesario, se modifica esa parte del DESIGN.md") — ver T0.

**Objetivo:** que las 4 propiedades muestren fotografía en cards y ficha para la validación del MVP con el cliente, sin inventar datos de las propiedades y con reemplazo trivial (cambio de `src`) por las fotos reales cuando existan.

## Contexto — qué ya está cableado (no requiere componentes nuevos)

- Schema `fotos[]` (`src`, `titulo?`, `descripcion?`) en `src/content.config.ts`; portada = `fotos[0]` (PRD §7).
- `PropertyCard.astro` usa la portada en la landing destacada y en `/propiedades`.
- `[slug].astro` renderiza la galería completa (lead 3:2 + riel de miniaturas + contador `1 / N` + clic + flechas de teclado); el JS está **inerte** con `fotos: []` y se activa solo con fotos.
- `DameroPlaceholder.astro` cambia a `<img>` con solo recibir `src`; mismo marco 3:2, cero CLS.
- Gate `pnpm check:images` (PRD §9 check 3) ya implementado: ≤10 fotos por listing, `.webp`, ancho ≤1600px, <300KB cada una, y `src` bajo `/propiedades/<slug>/`; valida además **todo** archivo bajo `public/propiedades/` (huérfanos incluidos). Hoy pasa **vacuo** (0 fotos): esta será su primera prueba real.

## Excepción declarada (T0)

DESIGN.md §11 prohíbe stock ("❌ Broken or hotlinked stock images. If no real photograph exists, use the brand placeholder tile") y §7 prohíbe texto sobre fotos. Nota: §7 ya contempla "provisory photography" como estado existente. La excepción es: fotografía de banco **descargada y commiteada** (nunca hotlink, nunca rota), para pre-validación, con **reemplazo obligatorio por fotografía real antes del lanzamiento**. Coherencia: AGENTS.md manda reportar contradicciones con DESIGN.md y resolverlas por decisión explícita del stakeholder, no en silencio — la decisión ya fue dada; se materializa amendando DESIGN.md en el mismo commit.

## Alcance

- 4–5 fotos por propiedad (≤10 permitido), coherentes con el tipo y el contenido del listing:
  - `casa-3-amb-guadalupe-santa-fe`: fachada, living-comedor, cocina, dormitorio, patio.
  - `departamento-2-amb-centro-santa-fe`: frente del edificio, living, cocina, dormitorio, balcón.
  - `departamento-3-amb-barrio-norte-santa-fe`: frente, living, cocina, dormitorios, balcón.
  - `lote-600-m2-candioti-santa-fe`: 3–4 tomas de terreno abierto.
- `titulo` por foto = nombre del ambiente (alimenta el `alt` del lead y el `aria-label` del riel). Sin texto inventado sobre la propiedad.
- **Fuera de alcance:** copy del sitio, precios, direcciones, `fotos[].descripcion` (documentado, no renderizado), componentes nuevos de UI.

## Tareas

- [x] **T0 — Amendar `docs/DESIGN.md` §7/§11** declarando la excepción de pre-validación (fotos de banco descargadas y commiteadas; reemplazo obligatorio antes del lanzamiento; sin aviso en UI). Mismo commit que T1–T4. → Nueva subsección §7 "Pre-validation exception — provisional stock photography (declared 2026-09-29)" y acotamiento del bullet de §11.
- [x] **T1 — Descargar y normalizar imágenes.** Herramienta local: ImageMagick 7 (`magick`, libwebp 1.5; no hay `cwebp`, `ffmpeg` ni `sharp`). Salida: WebP, ancho ≤1600px, <300KB → `public/propiedades/<slug>/01-<ambiente>.webp`… (la primera entrada es la portada). Registrar en este doc las URLs de origen y la licencia por foto (ver "Fuentes y licencias" abajo). Verificación: `pnpm check:images` → **19 fotos referenciadas, 19 archivos, 0 violaciones**. Nota: `casa…/05-patio.webp` se recodificó a 1200×800 porque el ruido de la vegetación no bajaba de 300 KB a 1600px.
- [x] **T2 — Frontmatter.** Completar `fotos:` en los 4 markdown con `src` + `titulo` (5/5/5/4 = 19); ningún otro campo tocado.
- [x] **T3 — Specs.** `e2e/propiedades-detalle-content.spec.ts`: R4 reescrito por listing (fixture `GALLERY` con ramas con-fotos / sin-fotos; hoy las 4 ejercitan la rama con fotos — lead `<img>` con `src` bajo `/propiedades/<slug>/`, alt del cover, `width`/`height`, `loading="eager"`/`fetchpriority="high"`, riel con N thumbs, contador `1 / N`, `aria-label`/`aria-current`). Nuevo test de interacción del riel: clic en la thumb 2 → lead y alt cambian, contador `2 / N`, `aria-current` se mueve. **Hallazgo del gate:** el primer riel real destapó un overflow horizontal en mobile (452px sobre 320) — el track `1fr` del grid + `min-width: auto` de los grid items dejaban que el riel ensanchara la página en vez de scrollear (§17.2:679). Corregido en `[slug].astro`: `min-width: 0` en `.gallery` y `minmax(0, 1fr)` en los tracks. Fix en commit separado (work unit propio).
- [x] **T4 — Gate.** `pnpm test:e2e` completo (check:images + build + preview + 3 viewports): **289 passed / 11 skipped / 0 failed** (300 specs; 287 baseline + 2 tests nuevos). `pnpm check:images`: 4 listings, 19 fotos referenciadas, 0 violaciones.
- [x] **T5 — Commit único:** `feat(content): add provisional demo photography to the four listings` (assets + frontmatter + spec + DESIGN.md + este doc, en el mismo commit). Push/merge/PR: decisión del stakeholder; si `main` deploya a producción, usar rama/preview hasta la validación del cliente.
- [x] **T6 — Cierre.** Evidencia: `e94e0f0` (slice de fotos) + `3c7c84e` (fix del riel), gate `pnpm test:e2e` **289 passed / 11 skipped / 0 failed** (2026-09-29), `pnpm check:images` 19/19 sin violaciones. Espejo en Engram (`odd/damero-demo-photos/tasks`) actualizado con el documento completo.

## Criterios de aceptación

1. `pnpm check:images` en verde: 4 listings, ≥16 fotos referenciadas, 0 violaciones.
2. Las 4 fichas y las cards muestran fotografía; portada = primera de la lista; `width`/`height` presentes (sin CLS); `loading="eager"` + `fetchpriority="high"` solo en el lead.
3. Suite e2e completa en verde en los 3 viewports (`desktop-1280`, `mobile-390`, `mobile-320`).
4. Cero hotlinks: todas las imágenes viven en `public/propiedades/<slug>/`.
5. Sin regresiones: `/propiedades`, landing y las specs de accesibilidad siguen pasando.

## Riesgos / flags

- ~3–4 MB temporales de assets en el repo; trivial de revertir (`fotos: []` + borrar carpeta).
- El check de imágenes del CI deja de ser vacuo: puede fallar por primera vez de verdad si una foto se pasa del límite; por eso T1 verifica con `pnpm check:images` antes del gate. **Verificado en verde con las 19 fotos** (2026-09-29).
- Sin aviso en UI: la provisoriedad queda declarada en DESIGN.md + este doc + commit (decisión explícita del stakeholder, 2026-09-29).
- **Regresión de layout destapada por el primer riel real:** overflow horizontal en mobile-390/mobile-320 (scrollWidth 452 > 320) en la ficha del lote. Causa: el track `1fr` de `.detail-grid` + el `min-width: auto` de los grid items dejaban que el riel de miniaturas expandiera la página en vez de scrollear. Corregido en `src/pages/propiedades/[slug].astro` (`min-width: 0` en `.gallery`, `minmax(0, 1fr)` en los tracks) — work unit separado, por eso T5 sigue siendo un commit único para la slice de fotos.

## Fuentes y licencias (T1)

Todas las fotos provienen de **Pexels** ([Pexels License](https://www.pexels.com/license/): uso comercial libre, modificación permitida, **sin atribución obligatoria**). Descargadas desde el CDN y commiteadas — nunca hotlink. Descarga: `https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&cs=tinysrgb&w=1600`; página de origen: `https://www.pexels.com/photo/<id>/`. Normalización: ImageMagick 7, WebP, ancho ≤1600px, <300 KB.

| Archivo (`public/propiedades/…`) | ID Pexels | Página de origen |
| --- | --- | --- |
| `casa-3-amb-guadalupe-santa-fe/01-fachada.webp` | 7546775 | https://www.pexels.com/photo/7546775/ |
| `casa-3-amb-guadalupe-santa-fe/02-living-comedor.webp` | 6527063 | https://www.pexels.com/photo/6527063/ |
| `casa-3-amb-guadalupe-santa-fe/03-cocina.webp` | 10855212 | https://www.pexels.com/photo/10855212/ |
| `casa-3-amb-guadalupe-santa-fe/04-dormitorio.webp` | 7045354 | https://www.pexels.com/photo/7045354/ |
| `casa-3-amb-guadalupe-santa-fe/05-patio.webp` | 8288955 | https://www.pexels.com/photo/8288955/ |
| `departamento-2-amb-centro-santa-fe/01-frente-edificio.webp` | 15873009 | https://www.pexels.com/photo/15873009/ |
| `departamento-2-amb-centro-santa-fe/02-living.webp` | 6903218 | https://www.pexels.com/photo/6903218/ |
| `departamento-2-amb-centro-santa-fe/03-cocina.webp` | 4030908 | https://www.pexels.com/photo/4030908/ |
| `departamento-2-amb-centro-santa-fe/04-dormitorio.webp` | 6492389 | https://www.pexels.com/photo/6492389/ |
| `departamento-2-amb-centro-santa-fe/05-balcon.webp` | 18559629 | https://www.pexels.com/photo/18559629/ |
| `departamento-3-amb-barrio-norte-santa-fe/01-frente-edificio.webp` | 29744501 | https://www.pexels.com/photo/29744501/ |
| `departamento-3-amb-barrio-norte-santa-fe/02-living.webp` | 6283961 | https://www.pexels.com/photo/6283961/ |
| `departamento-3-amb-barrio-norte-santa-fe/03-cocina.webp` | 15221141 | https://www.pexels.com/photo/15221141/ |
| `departamento-3-amb-barrio-norte-santa-fe/04-dormitorio.webp` | 271624 | https://www.pexels.com/photo/271624/ |
| `departamento-3-amb-barrio-norte-santa-fe/05-balcon.webp` | 12870090 | https://www.pexels.com/photo/12870090/ |
| `lote-600-m2-candioti-santa-fe/01-terreno.webp` | 11288629 | https://www.pexels.com/photo/11288629/ |
| `lote-600-m2-candioti-santa-fe/02-terreno.webp` | 38440476 | https://www.pexels.com/photo/38440476/ |
| `lote-600-m2-candioti-santa-fe/03-terreno.webp` | 37181892 | https://www.pexels.com/photo/37181892/ |
| `lote-600-m2-candioti-santa-fe/04-terreno.webp` | 2317579 | https://www.pexels.com/photo/2317579/ |

**Reemplazo obligatorio antes del lanzamiento:** borrar el contenido de `public/propiedades/<slug>/`, soltar las fotos reales con la misma convención `NN-<ambiente>.webp` y ajustar los `src`/`titulo` del frontmatter. El resto del pipeline (galería, cards, `check:images`) no cambia.
