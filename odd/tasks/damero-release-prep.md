# ODD — Damero: release prep (README, CI y repo remoto)

**Estado:** plan abierto 2026-09-22. T1–T4 pendientes, T5 pendiente de confirmar el slug del repo.

**Objetivo:** dejar el MVP publicable: higiene de los documentos de harness, un `README.md` público, un CI que cubra el gate de aceptación real, y el repo remoto público creado con `main` pusheada.

**Problema:** el track §17 cerró el producto (4 rutas, gate verde 280/11) pero **el repo no existe fuera de esta máquina**. Además el CI actual **no corre el gate**: `supply-chain.yml` hace frozen install + audit + build, y las 280 specs de Playwright —que son el gate de aceptación declarado en `AGENTS.md`— nunca corren en el servidor. Un PR puede mergear con el gate roto.

**Por qué:** el PRD §9 define el flujo *commit directo a `main` → CI gate → Vercel deploya sólo en verde*. Hoy ese gate no existe.

**Alcance:** higiene de docs (`AGENTS.md`, punteros stale, los bloqueantes resolubles), `README.md`, el job de aceptación en CI, verificación local y la creación del remoto.

**Fuera de alcance (decisiones del stakeholder):**
- **El deploy a Vercel NO lo hace el agente.** El stakeholder lo hace manualmente desde su cuenta; el repo sólo tiene que estar en GitHub.
- **Las 6 respuestas de FAQ, el WhatsApp real y el CCI real**: diferidos por decisión del stakeholder (2026-09-22).
- **El review nativo de S4** (track §17): diferido, recetario en `odd/tasks/damero-propiedades-faqs.md` Progreso (h).

---

## Restricciones cerradas

- **Ruta ODD**, no SDD. Directo a `main`, work-unit commit por tarea, sin PRs.
- **`pnpm`, nunca `npm` ni `yarn`.** `pnpm-workspace.yaml` y `pnpm-lock.yaml` **no se tocan**.
- **Documentación en inglés** salvo este archivo, que sigue la convención ya establecida de `odd/tasks/*.md` en español. El copy del sitio sigue en español.
- **Ningún secreto sale al remoto.** Antes del push: verificar que `.env*`, `.opencode/`, `.atl/` y los artefactos de build estén ignorados y que no haya credenciales trackeadas.
- **Commits convencionales, sin atribución de IA.**

---

## Hallazgos que fundan las tareas

**H1 — El CI no corre el gate de aceptación.** `pnpm test:e2e` (280 specs, 3 viewports) es el gate declarado en `AGENTS.md` y **no está en ningún workflow**. Es el hueco real de CI/CD.

**H2 — De los 5 checks del PRD §9, dos no existen como código.**

| PRD §9 check | Estado real |
|---|---|
| 1. Astro build pasa | ✅ en `supply-chain.yml` |
| 2. Content Collections schema validation | ✅ implícito en el build (la Content Layer valida en build); conviene cubrirlo explícito con `astro check` |
| 3. Image limits (≤10 fotos, WebP, ancho ≤1600px, cada una <300 KB) | ❌ **no implementado en ningún lado** |
| 4. Sin coordenadas numéricas en el output | ✅ specs e2e (`runColorAudits` / greps), **pero no corren en CI** |
| 5. Links internos y slugs válidos | ✅ specs e2e, **pero no corren en CI** |

O sea: sumar el gate e2e a CI cubre 4 y 5 de una; el check 3 queda como deuda explícita (hoy es **vacuo**: las 3 semillas tienen `fotos: []`).

**H3 — De los bloqueantes de lanzamiento, sólo uno es resoluble sin el stakeholder.**
- **Prefijo `icon-` — resoluble.** Ya está en uso consistente (`src/icons/icon-house.svg`). Se cierra por convención de facto.
- **Nombre del corredor — NO resoluble por código.** `damero-design-system.md:109` registra el conflicto real: **el sitio de fase 1 dice "Luis Alejando Da Silva"** y el brief dice "Luis Alejandro". El build actual usa "Alejandro" (§6), pero el sitio viejo es copy del cliente, así que ninguna de las dos fuentes es autoridad por sí sola. Sigue abierto.
  - **Corrección de una hipótesis del orquestador:** en el primer paseo de esta sesión se afirmó que "Alejando" no existía en ninguna referencia. **Es falso** — la referencia existe, es el sitio de fase 1, y vive fuera de este repo. La conclusión previa ("gana `DESIGN.md`, se cierra") quedó anulada por la evidencia. Se deja registrado para que no se vuelva a cerrar por grep.

**H4 — El tinte `#C3CDB8` sí necesita al stakeholder.** `damero-design-system.md:113` pide confirmar si es el punto justo de claridad. Es percepción visual, no verificable por código. Sigue abierto. Nota: el valor ya está horneado en `public/images/damero_logo_white.svg` y `damero_mark_white.svg`; son assets SVG sueltos (no pueden consumir `var()`), así que el hex es legítimo ahí — se registra como desviación documentada, no como fallo.

**H5 — El teléfono `+54 9 2304 000000` NO es un invento nuestro.** `DESIGN.md` §17.4:736 lo designa placeholder **obvio** del contrato, y `src/data/site.ts` lo documenta. El `href` es inerte y el gate verifica 0 `wa.me`. No requiere acción.

---

## Tareas (work units)

| # | Tarea | Commit | Contenido |
|---|---|---|---|
| T1 | Higiene de docs + switch | `docs(odd)` / `chore` | Nota de harness local en `AGENTS.md`; punteros stale de `damero-pages.md`; cerrar B6 y centralizar B1–B8; registrar la decisión sobre `.opencode/`; desactivar RDD clone-scoped |
| T2 | `README.md` público | `docs(readme)` | Qué es, stack, comandos, gate, estructura, bloqueantes de lanzamiento |
| T3 | Gate de aceptación en CI | `ci` | Workflow que corre `pnpm test:e2e` con chromium, en PR y push a `main`; veredicto escrito de CI/CD |
| T4 | Verificación local | — | `pnpm install --frozen-lockfile` + `pnpm build` + `pnpm test:e2e` + validación del YAML |
| T5 | Repo remoto | — | `gh repo create --public` + push de `main`. El slug se confirma con el stakeholder (el nombre literal tiene espacios y paréntesis, inválidos en GitHub) |

**Regla de cierre:** cada commit deja el árbol limpio y el gate verde. Si T3 cambia el CI, T4 lo verifica con los mismos comandos que usa el workflow.

---

## Criterios de aceptación

| Criterio | Cómo se verifica |
|---|---|
| `README.md` existe y no miente | lectura contra `package.json`, `AGENTS.md` y el árbol real |
| El workflow corre el gate | el YAML invoca `pnpm test:e2e` con chromium instalado, en `pull_request` y `push` a `main` |
| Los comandos del workflow funcionan localmente | exit 0 en los 3 comandos |
| El YAML es válido | parseo del YAML |
| El remoto es público y tiene `main` | `gh repo view` + `git ls-remote` |
| Cero secretos en el push | `git ls-files` sin `.env*` ni credenciales; `.opencode/` y `.atl/` fuera |
| El veredicto de CI/CD nombra el check 3 como deuda | lectura del veredicto |

---

## Veredicto de CI/CD (se completa en T3)

Pendiente.

---

## Bloqueantes de lanzamiento (lista vigente, centralizada acá)

Ninguno bloquea el build ni el deploy: bloquean el **lanzamiento**.

| # | Bloqueante | Estado |
|---|---|---|
| B1 | Las 6 respuestas de FAQ (PRD §8) | Diferido por el stakeholder (2026-09-22). Hoy `PENDIENTE` ×6. |
| B2 | Número real de WhatsApp | Diferido. Hoy `#whatsapp-pendiente` inerte + `+54 9 2304 000000`, placeholder **obvio designado por el contrato** (`DESIGN.md` §17.4:736), no un invento nuestro. |
| B3 | CCI real | Diferido. Hoy `CCI 000`. CCI = **Colegio de Corredores Inmobiliarios**; el número es la matrícula del corredor. `DESIGN.md` §734 prohíbe inventarlo. |
| B4 | Nombre legal del corredor | **Abierto.** Brief: "Alejandro" · sitio fase 1: "Alejando". Requiere confirmación humana. |
| B5 | Tinte `#C3CDB8` del logo knockout | **Abierto.** Percepción visual, no verificable por código. |
| B6 | Prefijo `icon-` en los nombres de archivo | ✅ **Cerrado (2026-09-22):** en uso consistente en todo `src/icons/`. |
| B7 | `icon-handshake.svg` a 44 px | **Abierto.** Punto débil declarado del set. Revisión visual. |
| B8 | Métricas / prueba social en la landing | **Abierto.** No se inventó ninguna; sólo si el stakeholder las quiere. |

---

## Progreso

- **2026-09-22 (a):** plan abierto. Verificados H1–H5 con evidencia: `supply-chain.yml` leído completo (3 steps, sin e2e); PRD §9 leído (5 checks); `CCI` resuelto por búsqueda externa (Colegio de Corredores Inmobiliarios — el número es la matrícula del corredor); `#C3CDB8` localizado en `damero-design-system.md:93` y en los 2 SVG de logo. `gh` autenticado como `FerEnoch` con scope `repo`. Sin remote configurado.
- **2026-09-22 (b):** **corregida H3.** El nombre del corredor no se cierra: `damero-design-system.md:109` documenta que el sitio de fase 1 dice "Alejando" y el brief "Alejandro". El primer paseo de esta sesión había concluido lo contrario por un grep incompleto (buscó dentro del repo, y la referencia está en el sitio en producción). Sólo B6 queda cerrado.
