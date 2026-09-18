# ODD — Damero: fundación del repo (Git + Astro + política pnpm)

**Objetivo:** Dejar `realtor_pre_webpage` como repositorio Git ordenado, con el sitio Astro scaffoldeado y la política de supply chain de pnpm activa y verificada.

**Problema:** El repo está en disco pero no es un repositorio Git: no hay historial, no hay `.gitignore`, y los artefactos de diseño conviven con activos descartados. Sin fundación no se puede empezar a implementar las páginas.

**Por qué:** El track de diseño cerró (T1–T7 ✅, screens validadas por el stakeholder). El siguiente paso es implementación, y para eso hace falta control de versiones y el runtime del sitio.

**Alcance:** organización del árbol, `git init`, política `pnpm-supply-chain`, scaffold de Astro con pnpm.
**Fuera de alcance:** implementación de las 4 páginas (`/`, `/propiedades`, `/propiedades/<slug>`, `/faqs`), componentes, tokens en CSS. Eso es el track siguiente.

## Restricciones (decisiones cerradas)

- **pnpm es el único gestor.** Nada de npm ni yarn; nunca commitear `package-lock.json` ni `yarn.lock`.
- **Astro en la raíz** (stakeholder, 2026-09-18): un solo deployable. `pnpm-workspace.yaml` **sin** el campo `packages:` — forma documentada de single-package con settings de seguridad.
- **Astro 7.3.3 con exclusión puntual de cuarentena** (stakeholder, 2026-09-18): se usa el último patch, que tiene 39 h de publicado. Se exime **solo a `astro@7.3.3`** vía `minimumReleaseAgeExclude`; el resto del árbol sigue bajo los 3 días. Es una excepción acotada, no un cambio de política.
- **Pin exacto obligatorio** en dependencias directas (skill §6). No `^`, no `~`.
- **`minimumReleaseAgeStrict` se queda en su default `true`.** Ponerlo en `false` no elige una versión más vieja: instala la que viola la cuarentena (bypass), según la doc oficial.
- **`allowBuilds` deny-by-default** + `strictDepBuilds: true`. Ningún script de build se aprueba sin revisión explícita.
- **`ignore-scripts=false` a nivel proyecto.** El `~/.npmrc` global tiene `ignore-scripts=true`, que saltea los scripts en silencio y anula el gate `strictDepBuilds`. No se toca la config global.
- **No se usa `--force`, `--no-frozen-lockfile`, ni `dangerouslyAllowAllBuilds`.**
- Se espeja la convención ya aplicada en `../realtor_sys` (mismo template, mismos scripts de `package.json`).

## Tareas

- [ ] T1 — `git init` (rama `main`) + reorganización del árbol + commit de importación de los entregables de diseño
- [ ] T2 — Aplicar la política de supply chain: `.npmrc`, `pnpm-workspace.yaml`, `.gitignore`, `.github/`, campos de `package.json`
- [ ] T3 — Scaffold de Astro 7.3.3 con pnpm, sin instalar, y pin exacto de versiones
- [ ] T4 — Revisar los scripts de build que pnpm bloquee, aprobar solo los legítimos con versión exacta, instalar y correr `pnpm audit --audit-level high`

## Criterios de aceptación

- `git log` en `main` con una secuencia de work-units legible; nada de un commit único con todo mezclado.
- `pnpm-workspace.yaml` sin `packages:` y con `minimumReleaseAge: 4320`, `trustPolicy: no-downgrade`, `blockExoticSubdeps: true`, `strictDepBuilds: true`.
- Toda dependencia directa de `package.json` con versión exacta.
- `pnpm-lock.yaml` commiteado, con `integrity: sha512-...` en cada entrada de resolución.
- `node_modules/` ausente del índice de Git.
- `pnpm audit --audit-level high` sin HIGH ni CRITICAL.
- `pnpm build` ejecuta sin errores.

## Verificación

- **Estructural:** `git log --oneline`, `git ls-files | grep -c node_modules` = 0, `grep -c 'packages:' pnpm-workspace.yaml` = 0.
- **Lockfile:** cada entrada de `pnpm-lock.yaml` con `integrity: sha512-`; sin fuentes `git+`/`file:`/`http` entre transitivas.
- **Build:** `pnpm astro --version` = `7.3.3` y `pnpm build` exit 0.
- **Política:** `pnpm audit --audit-level high` exit 0.

## Decisiones de implementación

- **La reorganización va antes del primer commit, no después.** Sin historial previo no hay nada que preservar: el commit de importación ya nace limpio en vez de cargar activos descartados y retirarlos en un segundo paso. Eso elimina ~4,2 MB de basura del historial de forma permanente.
- **Los PNG de `design/screens/` y su `README.md` se retiraron a pedido del stakeholder** (2026-09-18): lo que importa son los 9 HTML, que quedan como referencia visual del track de diseño.
- **Los 6 PNG de servicio obsoletos y `illustrative_building.jpg` se descartan** — ya decidido en el track de diseño (reemplazados por los 8 SVG duotono que ocupan 6.550 B vs. 4,4 MB).
- **`house.png` y `search_house.png` se conservan** en `design/reference/`: son los 2 glifos de UI pendientes (T8 del track de diseño) y no tienen equivalente SVG todavía. Son 877 KB; si se decide diseñarlos desde cero contra los tokens de `DESIGN.md`, se retiran.
- **`docs/`** agrupa el sistema visual y el PRD: son referencia de implementación, no assets servidos.
- **`public/` es el destino de los assets servidos** (Astro los sirve desde la raíz): `public/icons/services/*.svg`, `public/images/` con logos y `hero_banner_background.jpg`.

## Progreso

- **2026-09-18 (a):** relevamiento del repo, de la convención de `realtor_sys` y de las políticas de pnpm. Tres hallazgos de seguridad verificados contra doc oficial (ver `security/pnpm-supply-chain` en Engram). Estructura decidida con el stakeholder: Astro en la raíz.
- **2026-09-18 (b):** decisiones del stakeholder — Astro 7.3.3 con exclusión puntual de cuarentena; `design/screens` sin PNG ni README. Árbol reorganizado y listo para el commit de importación.
