# Share mejorado — propiedad + búsqueda (navigator.share sutil, fallback copiar)

Feature branch: `feat/share-mejorado` (desde `main`). Sin iconos de apps explícitas: un botón Compartir con icono + texto por superficie, `navigator.share` cuando existe, copiar link como fallback.

## Specs

- S1 (propiedad): "Agregamos un botón de "compartir" con ícono en la página de cada propiedad. La finalidad es que si una persona está buscando una propiedad y encuentra una que le gusta, pueda, con un botón y sin necesidad de copiar la url, mandarlo por whatsapp o telegram, o email, a quien desee."
- S2 (búsqueda): "la sección "compartir búsqueda", además de la funcionalidad de copiar el link (que es lo que hace actualmente), debería tener un "compartir" con igual fin que el de compartir propiedad: poder compartir por aplicaciones de mensajería o email, la búsqueda con los filtros aplicados."
- S3 (criterio UI): "Este enhacement de la funcionalidad de compartir altera la UI y necesita criterio. Pregunta todo lo que necesites antes de empezar" + decisiones: patrón híbrido (nativo + fallback copiar); ubicación en price-panel como acción secundaria; segundo botón al lado de Copiar búsqueda sin tocar el existente; mensaje con intro comercial; estilo icono + texto; fallback desktop = copiar (sin fila de iconos de apps); alcance = rama + implementación + gate.
- S4 (contratos a respetar): share strip existente intacto (field + `Copiar búsqueda` secondary-tint, status exacto `Enlace copiado al portapapeles`, orden de bandas `head,filters,share,results,empty`); `--color-sage` nunca texto; radios solo tokens (`--radius-sm`, nada `999px`); `Button` no reenvía `data-*` (hooks por `class`); sin `site`/canonical (URLs absolutas solo en cliente).

## Tasks

- T1 (S1,S3,S4 → implementer, `src/pages/propiedades/[slug].astro` + icono share + JS): botón Compartir secondary con icono + texto en `.price-panel__cta` debajo del CTA WhatsApp; `navigator.share({title,text,url})`, fallback copiar `location.href` con live region; texto con intro comercial + título + URL. (commit: 2f2e9bd)
- T2 (S2,S3,S4 → implementer, `src/pages/propiedades/index.astro`): segundo botón Compartir al lado de Copiar búsqueda (secondary-tint, icono + texto, hook por clase); mismo patrón nativo + fallback copiar; no tocar field ni botón existente ni copy del status de copiar. (commit: a41e9c3)
- T3 (S1,S2,S4 → implementer, `e2e/`): specs nuevas para ambos Compartir (mock `navigator.share` + assert fallback clipboard + status) sin romper `propiedades-filtering` (clipboard + status exacto), `propiedades-structure` (bandas) ni `propiedades-accessibility` (contraste). (commit: junto a cada slice)
- T4 (S1–S4 → verifier/gate): `pnpm build` + `pnpm test:e2e` en la rama; reportar fallos/skips y contraste/overflow 1280/390/320. (commit: no commitea)

## Log

- L1 (request verbatim): "haz una rama para agregar una funcionalidad enhacement: hay que mejorar el modo de compartir del site.\n- compartir propiedad: Agregamos un botón de "compartir" con ícono en la página de cada propiedad. La finalidad es que si una persona está buscando una propiedad y encuentra una que le gusta, pueda, con un botón y sin necesidad de copiar la url, mandarlo por whatsapp o telegram, o email, a quien desee.\n\n- compartir búsqueda: la sección "compartir búsqueda", además de la funcionalidad de copiar el link (que es lo que hace actualmente), debería tener un "compartir" con igual fin que el de compartir propiedad: poder compartir por aplicaciones de mensajería o email, la búsqueda con los filtros aplicados.\n\nEste enhacement de la funcionalidad de compartir altera la UI y necesita criterio. Pregunta todo lo que necesites antes de empezar"
- L2 (decisiones 2026-11-11): patrón=Híbrido nativo + fallback; ubicación=price-panel secundario; búsqueda=segundo botón al lado; mensaje=con intro comercial; estilo=icono + texto; fallback custom="No quiero íconos de apps explícitas que ensucien la UI (salvo whatsapp ya incorporado), manejalo con sutileza; como fallback, que copie"; alcance=rama + implementación. Rama `feat/share-mejorado` creada desde `main` (limpio, sin apilar sobre `feat/whatsapp-production-number`).
- L3 (evidencia 2026-11-11): T1 → 2f2e9bd (detalle + icono + spec, 235 líneas); T2 → a41e9c3 (búsqueda + spec, 217 líneas). Gate `pnpm test:e2e` verde: 498 passed, 21 skipped, 0 failed (incluye fix spec mobile-320: apilado por diseño en angosto, lado a lado solo desktop). Sin push ni PR (decisión del usuario).
