# ODD — Damero: release prep (README, CI y repo remoto)

**Estado:** **plan cerrado 2026-09-22.** T1–T7 ✅ — higiene de docs, README, gate de CI, verificación independiente, repo público `FerEnoch/damero-propiedades-webpage-pre` y **CI verde end-to-end**. El primer push del track destapó un defecto real del lockfile que nunca se había visto porque no existía remote; se diagnosticó, se arregló y el gate e2e corrió por primera vez en el servidor: **280 passed / 11 skipped**, job de 1m34s. Detalle en Progreso (c)/(d) y en el Veredicto.

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

## Veredicto de CI/CD (2026-09-22)

**Cobertura real, contra los 5 checks del PRD §9:**

| PRD §9 | Hoy |
|---|---|
| 1. Astro build | ✅ en `supply-chain.yml` |
| 2. Content Collections schema | ✅ implícito en el build (la Content Layer valida al construir); sin paso explícito |
| 3. Límites de imagen (≤10 fotos, WebP, ancho ≤1600px, cada una <300 KB) | ❌ **deuda: no existe en ningún lado.** Hoy es vacuo (las 3 semillas tienen `fotos: []`), pero es justo el check que el PRD §11 señala como riesgo cuando lleguen las fotos reales |
| 4. Sin coordenadas numéricas | ✅ specs e2e — que recién ahora pueden correr en CI |
| 5. Links y slugs válidos | ✅ specs e2e — ídem |

**Hallazgo que sólo apareció al pushear: el CI nunca había corrido y no funcionaba.** Los 280 specs estaban verdes en local, pero los dos workflows morían en el primer paso (`pnpm install --frozen-lockfile`, 9 s y 11 s). Lección de proceso: **"verde en local" no es "verde en CI"**. El lockfile y el entorno son parte de la verificación, y ese hueco existía porque no había remote. Fix en `d480bab`, pendiente de push.

**Tres cosas que el CI NO es:**

1. **No es una barrera.** Con commits directos a `main` (PRD §9) nada bloquea un push: los workflows corren *después*. Son una señal para no deployar, no un candado. Convertirlo en barrera exige PRs + branch protection, o un "Ignored Build Step" del lado de Vercel.
2. **No es el deploy.** No hay `vercel.json` ni paso de deploy: Vercel corre su propio install + build desde su integración con GitHub. **Ese install también usa el lockfile**, así que el defecto de arriba no era sólo del CI — era también un riesgo de build en el deploy. (No verificado contra Vercel desde acá.)
3. **No está endurecido del todo.** Las actions van por tags mutables (`@v4`) y no por SHA de commit: riesgo de supply chain real, ya anotado como deuda dentro de ambos archivos y mitigado por el updater de `github-actions` de `dependabot.yml`. `pnpm audit --audit-level high` puede bloquear un push por un advisory sin fix disponible — elección deliberada del repo, con ese costo explícito.

**Recomendaciones, en orden de valor:** (1) ✅ **hecho** — fix pusheado y verde real confirmado; (2) implementar el check 3 antes de cargar fotos reales; (3) pinear las actions por SHA; (4) ✅ **`paths-ignore` hecho** (`245c5f9`) — queda pendiente cachear el browser de Playwright (~30 s por run).

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
- **2026-09-22 (c): T2–T5 cerrados, y el CI encontró su primer defecto real.**
  - **T2/T3 (`bf76ce0`, `2f70e5f`)** — README público + `.github/workflows/acceptance.yml`. El writer delegado corrió el gate completo; el diff se clasificó **`high`** (señal `shell_process` por el workflow), así que el tier exigió **verificador independiente** además del self-check. Veredicto del verificador: `success`, 0 CRITICAL, **280/11 reproducidos por su cuenta**. Apliqué 3 correcciones suyas: el comando de install de Chromium del README no servía en Linux limpio (faltaba `--with-deps` — el WARNING real), `(licence)` → `matrícula` (CCI es el colegio; el número es la matrícula) y `.github/workflows/` agregado al árbol de estructura.
  - **Error mío, corregido y reportado:** el writer dejó el workflow **en el índice de git**, así que mi `git add README.md && git commit` commiteó **los dos archivos** bajo un mensaje que sólo hablaba del README. Lo deshice con `git reset --soft` (commit local de segundos, sin pushear) y rehice la separación: un archivo por commit. **Lección: antes de commitear, verificar el índice, no sólo el working tree.**
  - **T5 — repo público creado.** `FerEnoch/damero-propiedades-webpage-pre`, público, descripción "Damero Propiedades Webpage (pre)". `main` pusheada en `2f70e5f`. Escaneo de secretos previo: limpio (0 patrones de credencial, 0 `.env*`, 0 `.opencode/`, 0 `.atl/`, 96 archivos).
    - **Fricción real con el transporte:** `gh repo create --source=. --push` **colgó 180 s sin output**, con el remote agregado en **SSH**. Diagnóstico: `ssh -T git@github.com` → `Permission denied (publickey)`; `ssh-add -l` → "The agent has no identities". El `gh` del stakeholder está configurado con `git_protocol: https`. Corregí el remote a HTTPS y pusheé con el helper de `gh` de forma puntual (`git -c credential.helper='...'`), sin persistir config. **`gh repo create` agrega un remote SSH que no funciona en este entorno.** El push disparó los dos workflows y Dependabot (npm + github-actions).
  - **EL HALLAZGO: los dos workflows fallaron en el primer paso.** `supply-chain` y `acceptance` murieron en `pnpm install --frozen-lockfile` (9 s y 11 s) con `ERR_PNPM_FROZEN_LOCKFILE_WITH_OUTDATED_LOCKFILE`. Todo lo anterior (checkout, action-setup con pnpm 12.4.2, setup-node) pasó. **Diagnóstico con fuente primaria** (docs de pnpm + issue #14124 + PRs #14013/#14132): desde pnpm 12 el proyecto debe registrar la versión de pnpm resuelta en el **env lockfile** (el primer documento YAML de `pnpm-lock.yaml`), bajo `packageManagerDependencies`; desde pnpm 11.23 un frozen install **ya no reescribe** ese bloque. Nuestro lockfile tenía **un solo documento** y ningún `packageManagerDependencies`.
    - **Por qué en local no se notaba:** el pnpm local **es** el pin (12.4.2), así que no hay nada que resolver, no escribe el bloque y el frozen pasa (verificado: exit 0 en un clone limpio). En CI, `pnpm/action-setup` instala pnpm de modo que el proceso tiene que resolver el pin del proyecto: ahí quiere escribir el bloque y `--frozen-lockfile` se lo prohíbe.
    - **El fix obvio no funciona:** `pnpm install --lockfile-only` con el pnpm local **no escribe nada** (mismo lockfile, "Done in 22ms"). El bloque se escribe sólo cuando el pnpm que arranca **difiere** del pin. Receta reproducible: `pnpm dlx pnpm@12.5.1 install --lockfile-only` (arranca 12.5.1, resuelve el pin 12.4.2, escribe el bloque).
    - **Verificado en las dos direcciones, en sandbox antes de tocar el repo:** sin el bloque → falla; con el bloque y en la condición de CI (entry ≠ pin) → `pnpm dlx pnpm@12.5.1 install --frozen-lockfile` da **exit 0** ("Lockfile is up to date, resolution step is skipped") y deja el lockfile **byte-idéntico**.
    - **Fix en `d480bab` (local, sin pushear por decisión del stakeholder):** +158 líneas, **0 borrados**. El env document pinea `12.4.2` y sólo agrega sus propias entradas de plataforma; el grafo del proyecto, `settings` (`autoInstallPeers: false`) y las otras 2797 líneas quedan idénticas. Después del cambio: `pnpm install --frozen-lockfile` local verde y `pnpm build` verde (6 páginas).
    - **Aprendizaje de proceso:** el gate verde local **no** cubría el flujo real de instalación. Nadie había corrido el CI hasta hoy porque no existía remote. Ese es exactamente el hueco que el push destapó — y valió la pena encontrarlo antes del deploy.
- **2026-09-22 (d): CI VERDE end-to-end, confirmado en el runner.** El stakeholder aprobó el push del fix. Pusheado `2f70e5f..a7fa894`; local y remoto coinciden.
  - **`supply-chain`: `success`.**
  - **`acceptance`: `success`, job de 1m34s.** El log del runner prueba que el gate corrió de verdad, no que se salteó pasos: `Lockfile is up to date, resolution step is skipped` (el fix funcionó — ya no aparece `ERR_PNPM_FROZEN_LOCKFILE_WITH_OUTDATED_LOCKFILE`), `Running 291 tests using 2 workers`, `11 skipped`, **`280 passed (54.4s)`** — idéntico a local. El artefacto `playwright-report` (380 KB) se subió, así que la ruta del reporte también es correcta.
  - **Anotaciones, todas benignas:** Node 20 deprecado en las actions (el runner las fuerza en Node 24) y el aviso de que `ubuntu-latest` migra a Ubuntu 26 en octubre de 2026. Hubo un warning de reserva de caché de setup-node, sin efecto.
  - **Cierre del plan:** el MVP tiene repo público, README, gate de aceptación real corriendo en el servidor y un CI honesto. Para lanzar sólo quedan los bloqueantes B1–B5 y B7–B8, y el deploy de Vercel, que hace el stakeholder.
- **2026-09-22 (e): `paths-ignore` aplicado a los dos workflows (`245c5f9`).** Contexto nuevo del stakeholder que condiciona el diseño: **en producción un empleado instruido publica propiedades commiteando un markdown en `src/content/propiedades/` más sus fotos en `public/`**. Eso obliga a que el ignore sea **angosto**: `odd/**`, `docs/**`, `design/**`, `README.md` y `AGENTS.md` no son insumo de nada (verificado: el único `readFileSync` de la suite lee `dist/`, ninguna spec depende de `design/`, y `astro.config.mjs` no los referencia), mientras que `src/**`, `public/**`, `e2e/**` y toda la config **no se listan a propósito** — ése es exactamente el push que tiene que correr el gate. El comentario en `acceptance.yml` deja la advertencia para quien edite el archivo después.
  - De paso, los comentarios y el nombre de step que quedaban en español en `supply-chain.yml` pasaron a inglés, cerrando la desviación contra `AGENTS.md`.
  - **Verificación empírica del ignore, en dos pushes separados:** `245c5f9` (toca `.github/workflows/**`, que no está ignorado) disparó y pasó los dos workflows; el commit siguiente, que toca **sólo `odd/**`**, no creó ningún run. Ese contraste es la prueba de que el ignore hace lo que dice.
  - **Implicación para el empleado, y la deuda que ahora pesa más:** el build ya atrapa violaciones de schema (check 2), y las specs atrapan slugs muertos y coordenadas (checks 4 y 5). Lo que **no atrapa nada** es el **check 3 (límites de imagen: ≤10 fotos, WebP, ancho ≤1600px, cada una <300 KB)**: hoy el empleado puede pushear un JPEG de 6 MB y no lo frena nadie — ni el CI ni Vercel. Con fotos reales entrando al repo, ese check deja de ser deuda cosmética y pasa a ser el más importante de los cinco.
