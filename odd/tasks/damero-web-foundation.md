# ODD — Damero: fundación del repo (Git + Astro + política pnpm)

**Estado:** ✅ completado (2026-09-18)

**Objetivo:** Dejar `realtor_pre_webpage` como repositorio Git ordenado, con el sitio Astro scaffoldeado y la política de supply chain de pnpm activa y verificada.

**Problema:** El repo estaba en disco pero no era un repositorio Git: sin historial, sin `.gitignore`, y los artefactos de diseño convivían con activos descartados.

**Por qué:** El track de diseño cerró (T1–T7 ✅, screens validadas por el stakeholder). El siguiente paso es implementación, y para eso hace falta control de versiones y el runtime del sitio.

**Alcance:** organización del árbol, `git init`, política `pnpm-supply-chain`, scaffold de Astro con pnpm.
**Fuera de alcance:** implementación de las 4 páginas (`/`, `/propiedades`, `/propiedades/<slug>`, `/faqs`), componentes, tokens en CSS. Eso es el track siguiente.

## Restricciones (decisiones cerradas)

- **pnpm es el único gestor.** Nada de npm ni yarn; nunca commitear `package-lock.json` ni `yarn.lock`.
- **Astro en la raíz** (stakeholder, 2026-09-18): un solo deployable. `pnpm-workspace.yaml` **sin** el campo `packages:` — forma documentada de single-package con settings de seguridad.
- **Astro 7.3.3 con exclusión puntual de cuarentena** (stakeholder, 2026-09-18): se usa el último patch. Se exime **solo a `astro@7.3.3`** vía `minimumReleaseAgeExclude`; el resto del árbol sigue bajo los 3 días.
- **Pin exacto obligatorio** en dependencias directas (skill §6). No `^`, no `~`.
- **`minimumReleaseAgeStrict` en su default `true`.** Ponerlo en `false` no elige una versión más vieja: instala la que viola la cuarentena (bypass), según la doc oficial.
- **`allowBuilds` deny-by-default** + `strictDepBuilds: true`.
- **`ignore-scripts=false` a nivel proyecto.** El `~/.npmrc` global tiene `ignore-scripts=true`, que saltea los scripts en silencio y anula el gate `strictDepBuilds`. No se toca la config global.
- **No se usa `--force`, `--no-frozen-lockfile`, ni `dangerouslyAllowAllBuilds`.**
- Se espeja la convención ya aplicada en `../realtor_sys`.

## Tareas

- [x] T1 — `git init` (rama `main`) + reorganización del árbol + commit de importación de los entregables de diseño
- [x] T2 — Aplicar la política de supply chain: `.npmrc`, `pnpm-workspace.yaml`, `.gitignore`, `.github/`
- [x] T3 — Scaffold de Astro 7.3.3 con pnpm, sin instalar, y pin exacto de versiones
- [x] T4 — Revisar los scripts de build bloqueados, aprobar solo los legítimos con versión exacta, instalar y correr el audit

## Criterios de aceptación — verificados

| Criterio | Resultado |
|---|---|
| Secuencia de work-units legible en `main` | ✅ 3 commits (`49aa676`, `541321c`, `f9308da`) |
| `pnpm-workspace.yaml` sin `packages:` y con los settings | ✅ `grep -E "^packages:"` sin coincidencias; los 6 settings presentes |
| Dependencias directas con versión exacta | ✅ `grep -E '"\^\|"~' package.json` sin coincidencias |
| `pnpm-lock.yaml` con `integrity: sha512` en cada resolución | ✅ **284 / 284**; 0 sin integrity |
| `node_modules/` ausente del índice | ✅ `git ls-files \| grep -c node_modules` = 0 |
| `pnpm audit --audit-level high` sin HIGH ni CRITICAL | ✅ exit 0 — «No known vulnerabilities found» |
| `pnpm build` sin errores | ✅ exit 0 — 1 página generada |

## Verificación ejecutada

- **Estructural:** `git status` limpio; 40 archivos trackeados; sin `dist/`, `.astro/`, `node_modules/`, `package-lock.json` ni `yarn.lock` en el índice.
- **Lockfile:** 0 fuentes exóticas (`tarball:`/`git:`/`repo:`/`url:`) entre transitivas; 284 paquetes.
- **Reproducibilidad:** `pnpm install --frozen-lockfile` exit 0.
- **Build:** `pnpm astro --version` = `7.3.3`; `pnpm build` exit 0.
- **Gate de build scripts:** el install **falló con exit 1** (`ERR_PNPM_IGNORED_BUILDS`) antes de aprobar esbuild — el deny-by-default funciona.
- **Override de `ignore-scripts`:** probado empíricamente — el postinstall de esbuild **corrió** (`node install.js` → `Done`) pese al `ignore-scripts=true` global.

## Decisiones de implementación

- **La reorganización fue antes del primer commit.** Sin historial previo no había nada que preservar: el commit de importación nace limpio en vez de cargar ~4,2 MB de activos descartados en el historial de forma permanente.
- **Los PNG de `design/screens/` y su `README.md` se retiraron** a pedido del stakeholder (2026-09-18): lo que importa son los 9 HTML.
- **Los 6 PNG de servicio obsoletos y `illustrative_building.jpg` se descartaron** — ya decidido en el track de diseño.
- **`house.png` y `search_house.png` se conservan** en `design/reference/`: son los 2 glifos de UI pendientes (T8) sin equivalente SVG. 877 KB.
- **`create-astro` rechaza directorios no vacíos** — y no avisa: cae en un subdirectorio con nombre random (`./teal-telescope`). El template oficial se generó en un temp y se trasplantaron los archivos canónicos.
- **El favicon y el README del template se descartaron.** El favicon es el logo de Astro: commitear branding ajeno es basura off-brand. El branding va en el track de páginas.
- **`esbuild@0.28.2` aprobado con versión exacta**, no por nombre. El scaffold oficial de Astro usa el nombre; acá se usa la versión a propósito: un bump de esbuild (vía Astro/Vite) vuelve a fallar el install hasta que un humano lo revise. Esa fricción es el control.
- **`astro` en `dependencies`** (no `devDependencies`), siguiendo el scaffold oficial, para no desalinear la resolución de integraciones que agrega `astro add`.
- **`engines.node` subido a `>=22.12.0`** (el scaffold lo exige), con `engine-strict=true` convirtiéndolo en restricción dura.

## Gaps conocidos (heredados, no bloqueantes)

- **GitHub Actions con tags mutables** (`@v4`), no pineadas por SHA. Documentado en el propio workflow. Es el gap G3 del catálogo del skill.
- **Corepack no está instalado** en esta máquina. No afecta local ni el CI (`pnpm/action-setup@v4` resuelve desde `packageManager`), pero es el prerrequisito A4 para un Dockerfile.
- **pnpm 12.4.2 disponible**; el repo queda pinneado a `10.33.2` por consistencia con `realtor_sys`. `namedRegistries` (calificación por registry en el lockfile) requiere >= 11.20 si algún día se suma un registry privado.
- **`realtor_sys` tiene el mismo problema de herencia**: su `.npmrc` no overridea el `ignore-scripts=true` global, así que su gate `strictDepBuilds` tampoco llega a evaluarse. Hoy no rompe nada porque no tiene dependencias instaladas.

## Actualización post-cierre (2026-09-18)

**Migración a pnpm 12.4.2.** El stakeholder subió `packageManager` de `10.33.2` a `12.4.2`. Eso dejó sin efecto los 5 settings que vivían en `.npmrc`: desde pnpm 11 ese archivo solo se lee para auth y registry (doc oficial: <https://pnpm.io/settings>). Efectos verificados: `pnpm install --frozen-lockfile` fallaba con `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` en local y en CI, y quedaban inertes `engine-strict`, `strict-peer-dependencies`, `auto-install-peers`, `prefer-frozen-lockfile` e `ignore-scripts=false`.

**Mitigación aplicada:** los 5 settings se migraron a `pnpm-workspace.yaml` con sus nombres canónicos camelCase (`preferFrozenLockfile`, `strictPeerDependencies`, `autoInstallPeers`, `engineStrict`, `ignoreScripts`), y `.npmrc` se eliminó. Verificado: los 5 leen valor efectivo con `pnpm config get`, `pnpm install --frozen-lockfile` exit 0 sin modificar el lockfile, `pnpm build` exit 0, `pnpm audit --audit-level high` sin vulnerabilidades.

Queda obsoleto lo que dice este documento sobre el pin a `10.33.2` y sobre el `ignore-scripts=false` en `.npmrc`. El resto de los gaps sigue vigente.

## Progreso

- **2026-09-18 (a):** relevamiento del repo y de la convención de `realtor_sys`; tres hallazgos de seguridad verificados contra doc oficial (ver `security/pnpm-supply-chain` en Engram). Estructura decidida: Astro en la raíz.
- **2026-09-18 (b):** decisiones del stakeholder — Astro 7.3.3 con exclusión puntual de cuarentena; `design/screens` sin PNG ni README.
- **2026-09-18 (c):** track completado. 3 commits, 40 archivos, install/build/audit en verde.

## Siguiente track

Implementación de las 4 páginas contra `docs/DESIGN.md`, con los 8 SVG duotono y los tokens de marca. Pendientes del stakeholder que condicionan el lanzamiento (heredados del track de diseño): las 6 respuestas de FAQ, WhatsApp y CCI reales, y el nombre del corredor.
