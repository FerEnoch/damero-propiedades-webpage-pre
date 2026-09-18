# ODD — Damero: sistema visual y diseño de páginas (Stitch)

**Objetivo:** Definir el sistema visual de Damero Propiedades y diseñar las 4 páginas del MVP en Stitch, usando el logo y su paleta como fuente de verdad.

**Problema:** El PRD cierra lo funcional, pero no existe sistema visual. Los activos actuales (8 íconos, `illustrative_building.jpg`) son off-brand y contradicen el logo.

**Por qué:** El sitio es mobile-first y orientado a leads por WhatsApp; sin un sistema visual consistente se ve "armado con piezas de distintos lados".

**Alcance:** 4 páginas (`/`, `/propiedades`, `/propiedades/<slug>`, `/faqs`) + design system + set de íconos.
**Fuera de alcance:** código Astro, componentes, implementación. Este es el track de diseño.

## Restricciones (decisiones cerradas con el stakeholder)

- Posicionamiento: **premium boutique / editorial**. Antipatrón explícito: portales masivos (Zillow / Argenprop / Zonaprop).
- Paleta: solo dos tintas de marca — `#3E4837` forest y `#7C916F` sage. Sage **nunca** en texto normal (3.42:1). Derivado `#4F6144` para links y acento chico.
- Íconos de servicios: **set nuevo duotono SVG** (los PNG actuales se descartan).
- Fotos provisorias: ratio fijo **3:2** + placeholder de marca, sin filtros ni duotono.
- **Sin dark mode** en el MVP (tokens semánticos para agregarlo después sin refactor).
- `illustrative_building.jpg` es **off-brand** (azul `#5492BF`): descartado.
- Hero de la landing: **patrón damero + titular + 1 CTA de búsqueda**.

## Tareas

- [x] T1 — Proyecto Stitch + `DESIGN.md` + design system (tokens, tipografía, roundness)
- [x] T2 — Landing `/` (desktop + mobile)
- [x] T3 — Búsqueda `/propiedades` (grilla filtrable, estado vacío)
- [x] T4 — Detalle `/propiedades/<slug>` (galería, mapa zonal, CTA sticky)
- [x] T5 — FAQs `/faqs`
- [x] T6 — Set de 8 íconos duotono SVG
- [x] T7 — Variante knockout blanca del logo
- [ ] T8 — Los 2 glifos restantes: `icon-house.svg` (empty-state/fallback) y `icon-search-house.svg` (buscador) — `DESIGN.md` §8 línea 406

## Criterios de aceptación

- Las 4 páginas usan solo tokens de la paleta de marca.
- Ningún texto renderizado en `#7C916F`.
- Contraste AA mínimo en todo texto.
- Mobile-first verificado en cada página.

## Verificación

- Estructural: cada página existe en Stitch y referencia el design system del proyecto.
- Contraste: todo par texto/fondo ≥ 4.5:1 (o ≥ 3:1 en texto grande).

## Artefactos Stitch

- **Proyecto:** `Damero Propiedades` — ID `1558288594788685169`
- **Design system:** `assets/5c6d34089cb34b22ae8bfdaa315e2d5b` — `Damero Propiedades — Editorial Forest`, LIGHT, ROUND_FOUR

| Página | Device | Screen ID canónico |
|---|---|---|
| Landing `/` | DESKTOP 1280 | `8a1b94ca81a7440caf9c3b8a3d0e52c7` |
| Landing `/` | MOBILE 390 | `9869ce69c6974f9c9a68870d54e93245` |
| Búsqueda `/propiedades` | DESKTOP 1280 | `60a6df205bdd4938b75e95a7c7fddcc1` |
| Búsqueda `/propiedades` | MOBILE 390 | `0ae6f194f3c44457b8f9d09e1e4e3c67` |
| Detalle `/propiedades/<slug>` | DESKTOP 1280 | `08e1ac0281044e28b528861f8eec7e61` |
| Detalle `/propiedades/<slug>` | MOBILE 390 | `1d1b3c795bc54b3ab61c46f325f098f8` |
| FAQs `/faqs` | DESKTOP 1280 | `d99087468a3a4903acaa988b82b2f982` |
| FAQs `/faqs` | MOBILE 390 | `5dadac7182b44bb197246ac2073d34a4` |

> **IDs originales (obsoletos, no usar):** `caa4e68d…`, `7cf5b088…`, `4324ff36…`, `5cdd1866…`, `ae63f8aa…`, `a385fc5f…`, `311b779e…`, `9ee2b8e2…` — quedaron con el contenido previo a la pasada de corrección.
> **`edit_screens` con re-render crea un screen NUEVO con ID nuevo; no edita in-place.** El proyecto acumula versiones huérfanas.

## Artefactos locales

- **Revisión del stakeholder:** `design/screens/` — `index.html` (galería navegable, CSS inline, rutas relativas: funciona copiada a otro host), 8 PNG full-page, 8 HTML exportados y `README.md`. **Los PNG son renders con Chrome headless del HTML exportado, no del canvas de Stitch** (el mapa se ve como stand-in: MapLibre no carga tiles en headless).
- **Íconos de servicios:** `public/icons/services/icon-{appraisal,megaphone,handshake,pen-seal,documents,keys,camera,target}.svg` — **6.550 B total** (vs. 4,4 MB de los PNG viejos, ≈ −99,85%).
- **Logo knockout:** `img/png/damero_logo_white.png` (33 KB) + `img/damero_logo_white.svg` (34,7 KB, trazado automático).
- **Fuera de alcance de T6:** `house.png` y `search_house.png` no eran íconos de servicio, sino los dos glifos de UI (`icon-house.svg` empty-state, `icon-search-house.svg` buscador). Quedan como T8.

## Decisiones de diseño

### Fase 1

- **Tipografías:** Newsreader (titulares, serif editorial) · Hanken Grotesk (cuerpo) · JetBrains Mono (precio/metadatos, por cifras tabulares).
- **Regla semántica:** serif = sustantivos de contenido · sans = oraciones · mono = datos y aparato legal.
- **Restricción de contraste nueva:** sage `#7C916F` sobre `surface-tint` `#E8EBE3` da **2.84:1** → cualquier control interactivo sobre banda `surface-tint` usa borde `forest-ink`, nunca sage.
- **Sin token de error rojo** (paleta de dos tintas): filtro inválido se señala con borde `forest-ink` + prefijo mono `REVISAR`.
- **Badges de operación:** `VENTA` sólido vs. `ALQUILER` outline — diferencia por peso, no por color.

### Fase 2

- **Filtros desktop:** panel horizontal + fila de chips removibles + franja `BÚSQUEDA COMPARTIBLE` con la query visible y `Copiar búsqueda` (el PRD §5 exige estado linkeable; sin la franja es invisible).
- **Filtros mobile:** barra sticky de 56 px con contador de **filtros activos** + riel de chips con scroll horizontal; abre **bottom sheet** (no drawer lateral: en 390 px el pulgar alcanza el borde inferior).
- **Galería:** lead 3:2 + riel de miniaturas + contador mono `1 / 5`. Estado activo por **borde, no por opacidad** (atenuar fotos provisorias las empeora).
- **Fallback del mapa:** mismas métricas 3:2 que el mapa real, glifo en línea, `Ubicación no disponible momentáneamente.` + `Reintentar`, conserva la leyenda `ZONA APROXIMADA · RADIO 400 M`. Diseñado en mobile; mapa renderizado con círculo de 400 m y atribución en desktop.
- **Acordeón FAQ:** filas por hairlines, pregunta en serif, `+`/`−` como carácter plano, primera abierta. Sin tarjetas (agrupar con contenedores es lo que el sistema prohíbe).
- **Expensas nulas:** fila explícita `EXPENSAS — No aplica` en vez de omitir, para que la ficha técnica no cambie de alto entre listados.

### Fase 3

- **Los 8 PNG viejos NO eran los 8 servicios.** El sitio en vivo lista los 8 servicios de `DESIGN.md` §8 palabra por palabra; `house.png` y `search_house.png` son glifos de UI, y "Gestión documental" y "Marketing inmobiliario" no tenían PNG. Se siguió §8 (contrato declarado).
- **Tinte del logo knockout: `#C3CDB8`** — 5,83:1 sobre forest (AA). El sage original daba 2,81:1 y desaparecía. Es el único tinte que además sigue distinguiéndose del blanco.
- **Alpha del logo conservado byte a byte** (remapeo determinístico por tinta más cercana; `-opaque` dejaba 686 píxeles sucios).
- **`aria-hidden`:** los íconos llevan `role="img"` + `<title>`. El componente Astro debe agregar `aria-hidden="true"` cuando el ícono va al lado de su etiqueta, o el lector de pantalla lo anuncia dos veces.

## Gotchas de Stitch (para la fase siguiente)

- `generate_screen_from_text` **falla con el modelo por defecto** (timeout, cero pantallas). Usar `modelId: GEMINI_3_5_FLASH_LITE`.
- `update_design_system` **no persiste** `labelFont` (revierte JetBrains Mono → Public Sans) ni `colorVariant`. No insistir: el generador lee el `DESIGN.md` embebido y el build aplica la fuente por CSS.
- `list_screens` / `get_project` **no reflejan** las pantallas generadas. Única verificación confiable: `get_screen` con el ID devuelto por la generación.
- Una respuesta que trae **solo texto y ningún `design.screens[]`** significa que la pantalla NO se creó, aunque la prosa diga lo contrario.
- **Stitch inventa datos legales**: fabricó `Matrícula CUCICBA N° 7421` y `Ley 5115: Accesible para personas con discapacidades físicas` sin que se lo pidiera, reescribió el nav y cambió un checkbox por un toggle pill. **Hay que declarar el bloque legal verbatim en cada prompt y auditar el resultado por grep.**

## Pendientes del stakeholder

- **Las 6 respuestas de FAQ** — bloqueante de lanzamiento (PRD §8). Hoy son `[PENDIENTE]`.
- **Número real de WhatsApp** y **CCI real** (hoy placeholder / valor de fase 1).
- **Corregir el nombre del corredor:** el sitio actual dice "Luis Alej**ando** Da Silva" (typo probable); se usó "Luis Alej**andro**" del brief.
- **Revisar la sección de FAQ de la landing de fase 1:** Stitch redactó 2 respuestas inventadas, con preguntas que no son las 6 semilla del PRD §8. Contradice el bloqueante de lanzamiento.
- **Métricas / prueba social reales** si las quiere en la landing (no se inventó ninguna).
- **Revisar `icon-handshake.svg` a 44 px** — es el punto débil del set (a 24 px con stroke 1,5 entran pocos trazos paralelos; son los dedos los que hacen reconocible un apretón de manos).
- **Confirmar el tinte `#C3CDB8`** del rombo sage en el logo knockout: ¿punto justo de claridad, o más claro / más verde?
- **Confirmar el prefijo `icon-`** en los nombres de archivo (si se prefiere sin prefijo, es un rename).

## Progreso

- **2026-09-17 (a):** discovery de marca completo — paleta medida con ImageMagick, activos auditados, 7 decisiones cerradas con el stakeholder.
- **2026-09-17 (b):** T1 y T2 completados. Design system registrado y landing generada (desktop + mobile). `DESIGN.md` en 613 líneas. Stakeholder **validó la dirección**.
- **2026-09-17 (c):** T3, T4 y T5 completados — 6 pantallas generadas y verificadas. `DESIGN.md` en 739 líneas (§17 nueva). Datos legales inventados por Stitch detectados y corregidos en 5 de 6 pantallas.
- **2026-09-17 (d):** T6 y T7 completados — 8 íconos duotono (6.550 B) + logo knockout (PNG + SVG). Detectada la contradicción §8 vs. los PNG viejos.
- **2026-09-17 (e):** pasada de corrección sobre las 8 pantallas. Eliminados los datos legales inventados por Stitch (`CUCICBA`, `Ley 5115`) y los links a páginas inexistentes; FAQ con lorem ipsum + badge `PENDIENTE`; detalle y búsqueda unificados entre dispositivos; placeholders de marca en todo. Verificado por grep: **0 ocurrencias** en los 8 exports. Exportado a `design/screens/`.
- **Pendiente:** T8 (2 glifos de UI) y los datos reales del stakeholder.
