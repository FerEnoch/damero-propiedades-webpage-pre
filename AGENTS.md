# AGENTS.md — Damero Propiedades (realtor_pre_webpage)

Este archivo es la fuente de contexto para cualquier agente que trabaje en este repo.
Un subagente **no hereda** la conversación del orquestador: si algo no está acá, no lo sabe.

## Stack

- **Astro 7.3.3** (sitio estático). **Sin framework de UI**: nada de React, Vue ni Svelte.
  Los componentes son `.astro`; el JavaScript de cliente es la excepción, no la regla.
- **CSS plano con tokens.** El único punto de verdad visual es `src/styles/tokens.css`,
  consumido por `global.css`. Nada de Tailwind ni de utilidades.
- **Contenido**: Content Layer (`src/content.config.ts`) + colecciones en `src/content/propiedades/`.
  Los campos del schema están **en español** (`titulo`, `operacion`, `precio`, `moneda`, `zona`).
- **TypeScript strict**: `astro/tsconfigs/strict`.
- Node >= 22.12.0 · pnpm 12.4.2 · repo **single-package** (el sitio vive en la raíz).

## Comandos

| Acción | Comando |
| --- | --- |
| Desarrollo | `pnpm dev` |
| Build | `pnpm build` |
| Previsualizar el build | `pnpm preview` |
| **Suite e2e (gate de aceptación)** | `pnpm test:e2e` |
| Instalar reproducible | `pnpm install --frozen-lockfile` |
| Auditar dependencias | `pnpm check-deps` |

**Nunca `npm`. Nunca `yarn`.** El repo depende de la política de pnpm de `pnpm-workspace.yaml`.

## Política de dependencias (no negociable)

1. `allowBuilds` es **deny-by-default**: solo `esbuild@0.28.2` puede ejecutar scripts de instalación.
   `strictDepBuilds: true` hace *fallar* el install ante cualquier paquete nuevo con scripts.
   No agregues nada a `allowBuilds` sin decisión explícita del stakeholder.
2. **Verificá antes de asumir fricción.** `pnpm view <pkg> scripts --json` dice si el paquete
   realmente declara scripts. `@playwright/test` **no** necesitó entrada en `allowBuilds`:
   la descarga del browser la hace `playwright install`, no un postinstall.
3. `minimumReleaseAge: 4320` (3 días) bloquea versiones recién publicadas.
   Única excepción autorizada: `astro@7.3.3`.
   Ojo: `pnpm view <pkg> version time.modified` **no** es la fecha de publicación.
   Usá `pnpm view <pkg>@<version> time --json` y leé el mapa por versión.
4. `engineStrict: true` convierte `engines` en error de instalación.
5. **No toques `pnpm-workspace.yaml` ni `pnpm-lock.yaml`** fuera de una decisión explícita.

## Fuentes de verdad

| Fuente | Qué gobierna |
| --- | --- |
| `docs/DESIGN.md` | Sistema visual: color, tipografía, spacing, radios, accesibilidad |
| `docs/PRD_Damero_MVP.md` | Alcance del producto |
| `design/screens/*.html` | Layout y copy aprobado |
| `odd/tasks/*.md` | Trabajo planificado, criterios y evidencia |

Si una referencia contradice `docs/DESIGN.md`, **gana `DESIGN.md` — y hay que reportar la
contradicción**, nunca resolverla en silencio.

## Reglas visuales que ya causaron fallos

- **`--color-sage` (`#7C916F`) NUNCA es texto renderizado** (3.42:1, falla AA). No en headings,
  body, labels, placeholders ni texto dentro de SVG. Para texto con significado:
  `--color-sage-ink` (`#4F6144`).
- **Nunca una píldora, nunca un círculo, nunca `border-radius: 999px`.**
  Escala real: `--radius-xs: 2px`, `--radius-sm: 4px`, `--radius-md: 6px`, `--radius-lg: 12px`.
- **Ningún hex literal fuera de la capa de tokens** (`:root` en `tokens.css`). Siempre `var(--token)`.
  Única excepción documentada: la masa de acento sage dentro de los SVG de iconos.
- **Sin overflow horizontal.** Viewports del gate: `1280` (desktop-1280), `390` (mobile-390),
  `320` (mobile-320).
- **Sin datos inventados.** Lo pendiente usa el marcador `PENDIENTE`; precios, direcciones y fotos
  salen del contenido o de `DameroPlaceholder`. Ver `DESIGN.md` §11 y §17.4.

## Testing

**Solo e2e con Playwright. No hay unit testing** (decisión del stakeholder, 2026-09-18).

- `pnpm test:e2e` ejecuta `playwright test` con 3 proyectos de viewport: `desktop-1280`,
  `mobile-390`, `mobile-320`.
- La suite corre **contra el build de producción**, no contra el dev server: `playwright.config.ts`
  levanta `pnpm build && pnpm preview --port 4321` como `webServer`.
- Specs en `e2e/`: `landing-structure`, `landing-content`, `landing-cta-layout`,
  `landing-accessibility`, más el helper `e2e/browser-audits.ts`.
- Browser: chromium empaquetado de Playwright (revisión 1243 para 1.63.0).
  Fallback documentado si la descarga se bloquea: `use: { channel: 'chrome' }` — decisión del
  stakeholder, no default.
- `playwright-report/` está gitignoreado.

### Gotchas de entorno que ya costaron ida y vuelta

- **`ASTRO_PREVIEW_BACKGROUND=0` es obligatorio en el `webServer`.** Astro >= 7.2 daemoniza
  `astro preview` cuando detecta un shell de agente de IA: el comando de foreground sale 0,
  Playwright aborta con `webServer exited early` y queda un server huérfano en 4321 que
  `reuseExistingServer` después reusa **sin rebuild** — o sea, tests contra un `dist/` viejo.
- **El minificador CSS de Astro pasa los hex a minúscula** (`#7C916F` -> `#7c916f`) y convierte
  `rgba()` a hex8. Al verificar tokens sobre `dist/`, usá `grep -i` o vas a leer un falso negativo.

## Idioma

- Documentación, comentarios, identificadores, CSS, config, commits y reportes: **inglés**.
- Copy del sitio: **español** (registro profesional neutro, variante Argentina), verbatim desde
  las referencias y `DESIGN.md` §16. No traducir ni parafrasear.

## Delegación

| Para | Agente |
| --- | --- |
| Leer 4+ archivos y devolver un handoff compacto | `engineering-astro-mapper` |
| Implementar una slice (Astro + CSS + e2e) | `engineering-astro-implementer` |
| Verificar una slice terminada (read-only) | `engineering-astro-verifier` |
| Revisión adversarial de código | `engineering-code-reviewer` |
| Arquitectura CSS / sistema de diseño | `engineering-frontend-developer` |

Los tres `engineering-astro-*` viven en `.opencode/agent/`, que **está gitignoreado**: el harness
es local de cada persona y no viaja con el repo (decisión del stakeholder, 2026-09-22). Si tu
harness los define, son los que conocen las reglas de este sitio; los agentes genéricos **no tienen
Astro en su stack**, así que para trabajo acá preferí los específicos. Si no los tenés, este archivo
es el contrato que hay que respetar: traé tu propio equivalente.

## Commits

Conventional Commits, sin atribución de IA. Un commit = una unidad de trabajo revisable,
con sus tests y docs en el mismo commit.
