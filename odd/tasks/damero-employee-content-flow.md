# ODD — Damero: flujo de contenido del empleado (portada, límites de imagen, instructivo y PR)

**Estado:** **plan abierto 2026-09-23.** T1–T2 ✅, T3–T5 pendientes.

**Objetivo:** dejar el pipeline de contenido **seguro para un empleado instruido**: una regla de portada sin contradicciones, la carpeta de fotos existente, el check 3 del PRD §9 implementado como barrera real, un instructivo publicable, y el flujo PR + branch protection configurado y verificado.

**Problema:** el stakeholder confirmó que en producción **un empleado instruido publica propiedades** commiteando un markdown más sus fotos. Hoy ese flujo tiene cuatro huecos verificados, y el control que el PRD declara (límites de imagen) **no existe como código**.

**Por qué:** la decisión #995 eligió commit directo a `main` porque *"CI bloquea publish si hay error"*. Ese supuesto es **falso** — `damero-release-prep.md` lo deja escrito: los workflows corren *después* del push, son señal, no candado. Con un autor no técnico y sin barrera, el instructivo documentaría un procedimiento cuyo único control es imaginario. El stakeholder eligió PR + branch protection el 2026-09-23.

**Alcance:** cerrar el campo muerto `portada`, crear `public/propiedades/`, implementar el validador de límites de imagen con su paso de CI, escribir el instructivo del empleado, y configurar/verificar el flujo PR con branch protection.

**Fuera de alcance (decisiones del stakeholder):**
- **El deploy a Vercel no lo hace el agente.** Lo hace el stakeholder desde su cuenta.
- **`fotos[].descripcion`** (documentado, nunca renderizado): es un hueco **distinto** — DESIGN §16 contempla "fotos captions", así que no contradice nada. Merece su propia decisión, no entra acá.
- **El check 2 explícito (`astro check`)** y los checks 1, 4 y 5 del PRD §9: ya cubiertos por el build y por las specs e2e.
- **Los bloqueantes B1–B8** de `damero-release-prep.md`: siguen siendo del stakeholder.

---

## Restricciones cerradas

- **Ruta ODD**, no SDD. Work-unit commit por tarea, **rama de feature + PR** (cambio de flujo respecto de #995, decidido por el stakeholder el 2026-09-23).
- **`pnpm`, nunca `npm` ni `yarn`.** `pnpm-workspace.yaml` y `pnpm-lock.yaml` **no se tocan**.
- **Sin dependencias nuevas.** El validador de T3 se escribe en Node puro: la política de pnpm es deny-by-default y `strictDepBuilds: true` hace fallar el install ante cualquier paquete nuevo con scripts.
- **Documentación en inglés** salvo este archivo (convención ya establecida de `odd/tasks/*.md` en español). El copy del sitio sigue en español.
- **Commits convencionales, sin atribución de IA.**
- **Un commit = una unidad revisable**, con sus tests y docs en el mismo commit.
- **Nada de datos inventados** (DESIGN §11): lo pendiente usa placeholder explícito, nunca un valor plausible.

---

## Hallazgos que fundan las tareas

**H1 — `fotos[].portada` es un campo muerto y, además, una contradicción del PRD.**
El PRD §7 (regla normativa) dice *"Cover = first entry in `fotos`"*, y el código la implementa (`PropertyCard.astro:45`, `[slug].astro`). Pero el schema (`content.config.ts:57-58`) documenta *"Marks the cover when it is not the first entry"* y el ejemplo del PRD §4 marca `portada: true` **sobre la primera foto** — un no-op bajo §7. La contradicción es del contrato, no del código: **se cierra eliminando el campo**, no implementándolo. Implementarlo obligaría a cambiar la regla normativa de §7 (más superficie de contrato, no menos).

**H2 — `public/propiedades/` no existe.**
Esa ruta es el contrato de PRD §7 y del comentario del schema, pero hoy sólo existe `public/images/`. Un empleado que siga el schema apuntaría a una carpeta inexistente.

**H3 — El check 3 del PRD §9 no existe como código.**
Límites declarados: ≤10 fotos, WebP, ancho ≤1600px, cada una <300KB. El schema no tiene `min`/`max` ni valida formato o peso, y ningún workflow lo chequea. Hoy un JPEG de 6MB pasa el build, deploya, e infla el repo.

**H4 — El CI no es una barrera.**
`damero-release-prep.md`: con commits directos a `main` nada bloquea un push. Convertirlo en barrera exige PRs + branch protection, o un "Ignored Build Step" del lado de Vercel. El stakeholder eligió PR + branch protection.

**H5 — El schema es `.strict()`.**
Quitar `portada` hace que cualquier frontmatter que aún lo traiga **falle el build**. Las 3 semillas tienen `fotos: []`, así que hoy no rompe nada — pero las dos menciones del PRD §4 (la tabla de campos y el ejemplo) hay que corregirlas en el mismo commit, o el instructivo nacería enseñando una sintaxis que rompe el build.

**H6 — El repo está en `main` y el árbol limpio.**
No hay candidato de review ni cambios en vuelo. Esta feature es el primer flujo con rama + PR.

---

## Tareas (work units)

| # | Tarea | Commit | Contenido |
|---|---|---|---|
| T1 | Cerrar el campo muerto `portada` | `fix(content)` | Quitar `portada` de `content.config.ts` y de las dos menciones del PRD §4 (tabla de campos + ejemplo). El código de render no se toca: ya implementa §7. |
| T2 | Crear la carpeta de fotos | `chore(content)` | `public/propiedades/.gitkeep`, para que la ruta del contrato exista y el instructivo pueda apuntarle. |
| T3 | Validador de límites de imagen (check 3) | `feat(ci)` | Script Node puro que valida las fotos de cada listing (≤10, WebP, ancho ≤1600px, cada una <300KB) + paso de CI que falla el build. |
| T4 | Instructivo del empleado | `docs` | Guía paso a paso para la interfaz web de GitHub: crear la rama y el PR, dónde van descripción y fotos, la regla de portada y los límites. |
| T5 | Branch protection + flujo PR | — | Configurar required status checks sobre `main` y verificar el flujo PR end-to-end. Requiere autorización explícita para la mutación remota. |

**Regla de cierre:** cada commit deja el árbol limpio y el gate verde (`pnpm build` + `pnpm test:e2e`).

---

## Progreso

- **2026-09-23 (a):** plan abierto. Mapeo completo del pipeline de contenido (schema, render, imágenes, CI) y verificación del estado de RDD (`clone_local: off`, sin candidato). Decisión de `portada` fundada en la contradicción interna PRD §7 vs §4. Flujo PR + branch protection elegido por el stakeholder. Rama `feat/employee-content-flow` creada.
- **2026-09-23 (b): T1 y T2 cerradas.** `2b5d22f` (plan) → `6ccc93f` (T1, `fix(content)`: `portada` fuera del schema y de las dos menciones del PRD §4 — tabla de campos y ejemplo; 1 inserción / 4 borrados; cero referencias residuales en `src/`, `docs/` y `e2e/`) → T2 (`chore(content)`: `public/propiedades/.gitkeep`). **Gate verde en los dos commits: `280 passed / 11 skipped`, idéntico al baseline.** El código de render no se tocó: ya implementaba §7. Siguiente: T3 (validador de límites de imagen).
