# Damero Propiedades — Design system

A quiet, sunlit archive, not a listing portal. This is a reference sync, not a new theme. Raw values come from `src/styles/tokens.css`; component and accessibility rules come from `docs/DESIGN.md`. Production components consume semantic aliases. No dark theme ships.

## Colors

Source: `src/styles/tokens.css`; `docs/DESIGN.md` §2, §13, §14.

> **Hard accessibility constraint:** `--color-sage` (#7C916F) is **3.42:1** on `--color-surface` and **MUST NEVER be applied to rendered text**: headings, body, labels, placeholders, disabled states, or text inside SVG icons. Use `--color-sage-ink` (#4F6144, **6.72:1**) for anything carrying meaning through type. Sage is graphic only: icon accent masses, interactive borders, indicators, decorative fills. Sage on `--color-surface-tint` is **2.84:1**, below the non-text minimum; interactive controls on that band must use **`--color-forest-ink` borders**. Sage borders are valid on surface and canvas only.

| Token | Value | Usage | Source |
|---|---|---|---|
| `--color-forest-ink` | `#3E4837` | Primary text, headings, primary CTA, footer | `src/styles/tokens.css`; `docs/DESIGN.md` §2 |
| `--color-forest-ink-hover` | `#4A5541` | Primary hover fill | Same sources, §2 |
| `--color-sage-ink` | `#4F6144` | Links, accent text, focus | Same sources, §2 |
| `--color-sage` | `#7C916F` | **Graphics only, never text** | Same sources, §2 |
| `--color-on-forest` | `#FFFFFF` | Text/icons on forest | Same sources, §2 |
| `--color-on-forest-muted` | `rgba(255,255,255,0.78)` | Footer secondary text | Same sources, §2 |
| `--color-canvas` | `#F4F5F3` | Page background | Same sources, §2 |
| `--color-surface` | `#FFFFFF` | Cards, inputs | Same sources, §2 |
| `--color-surface-tint` | `#E8EBE3` | Bands, badge containers, placeholders | Same sources, §2 |
| `--color-muted-text` | `#5F6B57` | Secondary text, metadata, helpers | Same sources, §2 |
| `--color-border-hairline` | `#DCE1D6` | Decorative 1px rules; never a functional boundary | Same sources, §2 |
| `--color-border-on-forest` | `rgba(255,255,255,0.16)` | Decorative footer divider | Same sources, §2 |
| `--color-bg-page` | `var(--color-canvas)` | Page | Same sources, §2, §13 |
| `--color-bg-surface` | `var(--color-surface)` | Content surfaces | Same sources, §2, §13 |
| `--color-bg-subtle` | `var(--color-surface-tint)` | Subtle bands | Same sources, §2, §13 |
| `--color-bg-inverse` | `var(--color-forest-ink)` | Inverse band | Same sources, §2, §13 |
| `--color-text-primary` | `var(--color-forest-ink)` | Meaningful primary text | Same sources, §2, §13 |
| `--color-text-secondary` | `var(--color-muted-text)` | Secondary text | Same sources, §2, §13 |
| `--color-text-accent` | `var(--color-sage-ink)` | Accent text | Same sources, §2, §13 |
| `--color-text-on-inverse` | `var(--color-on-forest)` | Inverse text | Same sources, §2, §13 |
| `--color-border-decorative` | `var(--color-border-hairline)` | Decorative rules | Same sources, §2, §13 |
| `--color-border-interactive` | `var(--color-sage)` | Control borders on surface/canvas only | Same sources, §2, §13 |
| `--color-graphic-accent` | `var(--color-sage)` | Non-text graphics | Same sources, §2, §13 |
| `--color-action-primary` | `var(--color-forest-ink)` | Primary action fill | Same sources, §2, §13 |
| `--color-focus-ring` | `var(--color-sage-ink)` | Keyboard focus | Same sources, §2, §13 |

### Verified contrast matrix

Source: `docs/DESIGN.md` §2. Ratios are the documented measurements, not newly calculated values.

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| forest-ink #3E4837 | surface #FFFFFF | 9.60:1 | AAA |
| forest-ink | canvas #F4F5F3 | 8.78:1 | AAA |
| forest-ink | surface-tint #E8EBE3 | 7.97:1 | AAA |
| on-forest #FFFFFF | forest-ink | 9.60:1 | AAA |
| sage-ink #4F6144 | surface | 6.72:1 | AA |
| sage-ink | canvas | 6.14:1 | AA |
| sage-ink | surface-tint | 5.57:1 | AA |
| muted-text #5F6B57 | surface | 5.63:1 | AA |
| muted-text | canvas | 5.15:1 | AA |
| muted-text | surface-tint | 4.67:1 | AA |
| on-forest-muted, 78% white | forest-ink | 6.60:1 | AA |
| sage #7C916F | surface | 3.42:1 | **Text banned. Graphics only.** |
| sage | surface-tint | 2.84:1 | **Not even a valid border here.** |
| border-hairline | surface | 1.33:1 | Decorative only |

## Typography

Source: `src/styles/tokens.css`; `docs/DESIGN.md` §3, §6 Footer, §14.

| Voice | Production typeface | Semantic ownership |
|---|---|---|
| Serif | Newsreader | Content nouns/names/titles: hero, sections, properties |
| Sans | Hanken Grotesk | Reading and UI: sentences, descriptions, controls |
| Mono | JetBrains Mono | Data and apparatus: prices, categories, badges, metadata, counts |

**Semantic, not decorative:** names/titles are serif; sentences are sans; numbers/categories/apparatus are mono. **The legal block is a statement, not data: it is sans** (§6 Footer), overriding §3's introductory voice-table mention of legal as mono.

Production stacks (Astro supplies hashed families through the leading variables):

- `--font-serif: var(--font-newsreader, 'Newsreader'), Georgia, 'Times New Roman', serif`
- `--font-sans: var(--font-hanken-grotesk, 'Hanken Grotesk'), system-ui, -apple-system, 'Segoe UI', sans-serif`
- `--font-mono: var(--font-jetbrains-mono, 'JetBrains Mono'), ui-monospace, 'SFMono-Regular', monospace`

The offline `design/system.html` intentionally uses only these stacks' **system fallbacks**; no web fonts. Georgia/Times are artifact fallbacks, not permission to replace production Newsreader (§11).

| Token | Font | Size | Line height | Tracking | Weight |
|---|---|---|---|---|---|
| `--text-display-xl` | Newsreader | `clamp(2.25rem, 1.35rem + 4.2vw, 4.25rem)` / 36–68px | 1.04 | -0.022em | 400 |
| `--text-display-lg` | Newsreader | `clamp(1.75rem, 1.25rem + 2.2vw, 2.75rem)` / 28–44px | 1.10 | -0.018em | 400 |
| `--text-card-title-lg` | Newsreader | `clamp(1.25rem, 1.1rem + 0.7vw, 1.5rem)` / 20–24px | 1.22 | -0.012em | 500 |
| `--text-card-title-sm` | Newsreader | `1.125rem` / 18px | 1.30 | -0.008em | 500 |
| `--text-heading-sm` | Hanken Grotesk | `1.0625rem` / 17px | 1.35 | -0.004em | 600 |
| `--text-body-lg` | Hanken Grotesk | `1.125rem` / 18px | 1.60 | 0 | 400 |
| `--text-body-md` | Hanken Grotesk | `1rem` / 16px | 1.65 | 0 | 400 |
| `--text-body-sm` | Hanken Grotesk | `0.875rem` / 14px | 1.55 | 0 | 400 |
| `--text-price-lg` | JetBrains Mono | `clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem)` / 22–28px | 1.15 | -0.01em | 500 |
| `--text-price-md` | JetBrains Mono | `1.0625rem` / 17px | 1.20 | -0.005em | 500 |
| `--text-label-md` | JetBrains Mono | `0.8125rem` / 13px | 1.30 | 0.06em; uppercase | 500 |
| `--text-label-sm` | JetBrains Mono | `0.75rem` / 12px | 1.25 | 0.08em; uppercase | 500 |
| `--text-legal` | Hanken Grotesk | `0.8125rem` / 13px | 1.60 | 0 | 400 |

Sizes use `--text-*`; corresponding line heights use `--leading-*`. Nonzero tracking uses `--tracking-*`; zero tracking is literal `0`, not an invented token. Loaded weights: Newsreader 400/500, Hanken Grotesk 400/500/600, JetBrains Mono 400/500.

- Measures: body **65ch**, hero subhead **52ch**, long-form listing description **68ch**.
- No text below **12px**; mobile body copy at least **16px**.
- Every numeric datum uses `font-variant-numeric: tabular-nums lining-nums`.
- Prices always have a **currency-code prefix**, never a bare `$`. Documented format examples: `USD 95.000`, `ARS 120.000.000`; code in label-sm mono, amount in price token. These examples are formats, not listing facts. The board uses `USD PENDIENTE` to avoid inventing property data.

## Spacing

Source: `src/styles/tokens.css`; `docs/DESIGN.md` §4, §14.

**4px base. Rhythm comes from variation, not one repeated value.** Tight groupings and generous separations coexist: title-to-price stack-sm versus section-y.

| Token | Value | Token | Value |
|---|---|---|---|
| `--space-1` | 4px | `--space-2` | 8px |
| `--space-3` | 12px | `--space-4` | 16px |
| `--space-5` | 20px | `--space-6` | 24px |
| `--space-8` | 32px | `--space-10` | 40px |
| `--space-12` | 48px | `--space-16` | 64px |
| `--space-20` | 80px | `--space-24` | 96px |
| `--space-32` | 128px | | |

| Semantic token | Value | Role |
|---|---|---|
| `--gutter` | `clamp(1.25rem, 5vw, 3rem)` | Container inset, 20–48px |
| `--section-y` | `clamp(4rem, 8vw, 7.5rem)` | Major bands, 64–120px |
| `--section-y-tight` | `clamp(2.5rem, 5vw, 4rem)` | Tight bands, 40–64px |
| `--stack-xs` | 4px | Closest grouping |
| `--stack-sm` | 8px | Title/price |
| `--stack-md` | 16px | Standard grouping |
| `--stack-lg` | 24px | Larger grouping |
| `--stack-xl` | 40px | Group separation |
| `--card-body-pad` | 20px | Lead-card body |

## Radius

Source: `src/styles/tokens.css`; `docs/DESIGN.md` §4, §14.

| Token | Value | Role |
|---|---|---|
| `--radius-xs` | 2px | Badges, chips, checkbox |
| `--radius-sm` | 4px | Buttons, inputs, service-icon badges, sticky CTA |
| `--radius-md` | 6px | Property cards, media frames |
| `--radius-lg` | 12px | Sheets/overlays; reserved in §4, used by §17.1 filter sheet |

**Never `border-radius: 999px`, `rounded-full`, pills, or circular icon containers.** Geometry echoes the rotated square. The board's struck-through “999px / pill” specimen is a labelled prohibition, not a pill-shaped component.

## Shadows

Source: `src/styles/tokens.css`; `docs/DESIGN.md` §4, §6 WhatsApp CTA, §14.

| Token | Value | Role |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(62,72,55,0.05)` | Header scrolled state |
| `--shadow-sm` | `0 2px 10px rgba(62,72,55,0.06)` | Card/button hover lift |
| `--shadow-md` | `0 10px 30px rgba(62,72,55,0.08)` | Floating dropdown/sheet |
| `--shadow-lg` | `0 24px 56px rgba(62,72,55,0.10)` | Floating layer |

`--shadow-lg-up: 0 -24px 56px rgba(62,72,55,0.1)` is the mobile sticky CTA's upward variant, not a fifth elevation level. **All shadows use brand tint `62,72,55`, never neutral black. At rest, a surface is defined by a 1px hairline, not a shadow.** The board's elevation cards are labelled token specimens, not resting property cards.

## Component rules

Source: `docs/DESIGN.md` §5–§9, §17; raw values in `src/styles/tokens.css`.

### Button — §6 Button

Radius-sm; 48px mobile / 52px desktop; space-6 inline padding; sans 600, 1rem, -0.004em. Primary: action-primary fill, on-forest label; hover forest-ink-hover, -1px lift, shadow-sm; active returns to 0 with no shadow. Secondary: transparent, 1px border-interactive (forest-ink on tint bands), primary text; hover bg-subtle. Ghost: transparent, accent text, no border; hover bg-subtle. Text link: sage-ink, 1px underline, 3px offset, underline opacity 40% → 100%; only literal `→` for an arrow affordance. Disabled: bg-subtle fill, muted-text at 60%, not-allowed cursor; never fade a primary fill. **Max one primary per viewport**; further actions use secondary, ghost or text link. Disabled styling is a documented exception, not permission to use low-contrast enabled text.

### Property card — §6 Property card; §7 Brand placeholder

One link target with focus wrapping the card; list-item semantics. Top to bottom: **3:2 media → 20px body → operation badge + currency code → serif title → mono tabular price → `Zona · Localidad`**. Surface fill, decorative 1px hairline, radius-md, no resting shadow. Title max two lines. Lead uses card-title-lg / price-lg; compact uses card-title-sm / price-md and 16px body padding. Badge is **in the body above the title, never over the photo**. Hover: interactive border, -2px lift, shadow-sm, 180ms ease-out-expo. Media stays flush to edges with radius-md top corners; at least 16px separates image and type.

`--pattern-damero-tile` is the existing SVG data-URI token: 45° squares on a 56px cell grid, tint against canvas; 1.5px sage diamond outline every fourth cell at 40% opacity. Placeholder frame is 3:2; three-diamond mark centred, 32px high, forest at 20%; no text on media. Reuse this token rather than redrawing a different pattern.

### Operation badge — §6 Operation badge

Uppercase mono label-sm, 12px, 0.08em tracking, radius-xs, 2px 8px padding. **Venta**: solid action-primary / on-forest. **Alquiler**: transparent, 1px interactive border, primary text. Weight and text distinguish operations, **not hue**, icons or ribbons. On tint, any interactive boundary must be forest-ink (§2).

### Service icon / badge container — §8 Construction spec; §8 Badge container

Container **44×44px mobile / 48×48px desktop**, bg-subtle fill, radius-sm, **never a circle**; 24px icon centred. SVG viewBox 24×24, 1.5px stroke, round caps/joins. Two layers in order: a solid sage accent mass with no stroke and **≤40% icon area**, then a `currentColor` primary line with `fill="none"`. Primary line inherits forest (white on inverse). Exactly two inks: no third colour, gradients, shadows or internal rounded-rectangle backgrounds. Scale the same asset, not separate size variants. Inline SVG or sprite, never an external image or icon font. All icons `aria-hidden="true"`, `focusable="false"`; adjacent real text supplies meaning; shapes must differ, not merely accent masses. Sage's 2.84:1 on tint is allowed **only because these icons are decorative**.

### Section bands — §5 Grid / Canonical landing; §4 Rhythm

Services use surface-tint; hero/featured use canvas; footer uses forest-ink. Services are a 2-column hairline index on desktop, 1-column mobile, **not cards**. One idea per band; asymmetric 7/5 or 8/4 layouts; left-aligned ragged-right type. No overlap, no text on images, no nested cards. No more than six property cards before a visual break. Sage punctuation normally appears at most three times per viewport (§5); the token specimen board necessarily repeats swatches.

Layout tokens: `--container-content: 1280px`, `--container-bleed: 1600px`; 12 columns, gutters 16px below 640px, 24px from 640px, 32px from 1280px. `--breakpoint-sm: 640px`, `--breakpoint-md: 768px`, `--breakpoint-lg: 1024px`, `--breakpoint-xl: 1280px`, `--breakpoint-2xl: 1536px`. Multi-column site layouts collapse below md; full-height bands use 100dvh, never 100vh. The reference board is intentionally fixed at **1440px**, not a production responsive page.

### Header — §6 Header

Sticky surface band, bottom hairline; 64px mobile / 72px desktop. Logo 28px / 32px. Nav sans 500 at 0.9375rem; active state is a 2px graphic underline with 6px offset, not sage text. WhatsApp stays a sage-ink **text link**, visible even when mobile nav collapses. On scroll, shadow-xs may replace the hairline. **No glassmorphism, blur or translucent panels.**

### Footer — §6 Footer; §17.4 Legal content

Forest-ink inverse band, on-forest text, section-y padding; brand/nav/contact columns. Decorative on-forest border, then full-width, left-aligned legal block, max 80ch, **real sans text at 13px**, on-forest-muted (6.60:1); never hidden, truncated, or below 4.5:1. The legal block is the two supplied lines verbatim; do not add identifiers, copyright or legal links without stakeholder wording.

### Filter controls — §6 Filter input; §17.1 Search

Labels above controls, uppercase mono label-sm; 44px controls, surface fill, interactive 1px boundary, radius-sm, 12px inline padding; primary text and secondary placeholders. Select chevron is inline currentColor SVG. Checkbox is a 20px radius-xs square, never a switch; selected uses forest fill. Segmented controls mark selection with forest fill and on-forest text, not hue alone. Text input invalid state uses forest border and a body-sm message prefixed `REVISAR`, never red. Price range: 4px subtle track, sage graphic segment, 20px forest thumbs with 2px surface ring; currency-specific, disabled with no bounds under Todas. Chips: radius-xs, subtle fill, uppercase mono primary text, 16px × with a 44px padded target, never pills. Search panel has no primary action; sharing uses a secondary button. Mobile filter sheet is the only permitted modal: radius-lg top corners, shadow-md, max 85dvh; one primary action. Filter changes announce state and preserve the shareable URL.

### Empty state — §6 Empty state; §17.1 Search empty state

Left-aligned tint band; reduced 3:2 brand tile, never a magnifying glass, emoji or illustration. Use the approved no-results sentence and helper from §6 verbatim. Secondary `Limpiar filtros` precedes primary `Consultar por WhatsApp` in DOM order. No apologies or invented counts.

### WhatsApp CTA — §6 WhatsApp CTA; §17.2 Detail CTA

**WhatsApp brand green is banned as a fill.** Identity is the decorative 20px glyph alone; forest primary styling and `Consultar por WhatsApp` label. Mobile sticky CTA below md: 56px high, upward shadow-lg, top inverse hairline, safe-area padding, z-index 40; reserve content space. Desktop CTA is static; do not render both primaries in one viewport. Landing hero is search-only: `Ver cartera de propiedades`, no WhatsApp glyph/button.

### FAQ accordion / pending marker — §17.3 FAQ accordion

Hairlines only; serif card-title-sm question, plain mono `+` / `−`, no circles/chevrons. Full-row button with aria-expanded/aria-controls; minimum height 56px mobile / 64px desktop. First item open by default; multiple may remain open. Body-md secondary answer, max 65ch, 16px top padding; grid-template-rows for height animation, instant under reduced motion. Pending answer: **`PENDIENTE`** marker, radius-xs, bg-subtle, uppercase mono label-sm, primary text, followed by a body-sm secondary meta line stating scope and expected length. Answers are stakeholder-owned launch blockers: **never invent legal, notarial, credit, tax or tenancy advice**.

### Detail data / gallery / map — §17.2, §17.5; §9 View transitions

Gallery: 3:2 media, controls outside images, real thumbnail buttons, no autoplay/dots/overlays; full gallery is a page, not a modal. Ficha uses hairlines, radius-md, no resting shadow, tabular data; missing expenses say `No aplica`. Map stays framed, meaningfully named and attributed; no pins or coordinates rendered as content. Fallback uses same 3:2 metrics, decorative house and announced status. Property media transitions use one unique `propiedad-<slug>` name per document; only media frames are named, never thumbnails or img elements. Browser defaults, no custom timing or JS fallback; reduced motion disables navigation transitions.

## Anti-patterns

Source: `docs/DESIGN.md` §11; **sage-text prohibition additionally from §2 and §12**.

- **Sage as rendered text, including disabled/placeholder/SVG text; use sage-ink.**
- Dense 4-up grids; saturated status badges; DESTACADO ribbons or photo corner tags.
- Red/green prices, or any price colour other than text-primary.
- Text, badges, prices, gradients or other overlays on property photographs.
- Competing primary actions; spreadsheet-like filters; saturated pill chips.
- Heavy resting-card shadows; neon/outer glows; coloured-glow focus rings.
- Smiling-agent, key-handover or generic skyline stock clichés; broken/hotlinked images. Only the declared §7 downloaded, committed provisional-photo exception applies until launch.
- Fake urgency/scarcity/social proof; **fabricated data**, counts, credentials, testimonials, legal identifiers or advice. Unknown required values use explicit pending markers.
- Emoji; Inter; generic production serifs (Times, Georgia, Garamond, Palatino).
- Pure black; pure-white page backgrounds (white is only surface/on-forest).
- Off-palette or oversaturated colours; gradient headings.
- Glassmorphism, blur, translucent panels.
- Circular icon containers, pill buttons/chips, 999px radii; oversized rounded icons above every heading.
- Three-equal-card feature rows; nested cards or cards used just to group content.
- Centred heroes or text blocks; modals when inline/full-page patterns work.
- Custom cursors; “Scroll to explore” / “Swipe down”, bouncing chevrons or scroll arrows.
- `LABEL // YEAR` formatting; clichés such as “Elevá tu experiencia”, “Encontrá el hogar de tus sueños”, “Soluciones sinérgicas”, “Next-Gen”, “Seamless”.

## Accessibility

Source: `docs/DESIGN.md` §2, §9, §10, §12; motion primitives in `src/styles/tokens.css` §14 transcription.

- Target **WCAG 2.2 AA**, verified. Respect every verdict in the contrast matrix; decorative hairlines do not define functional boundaries. Never sage text. Interactive controls on tint use forest borders.
- Focus: **2px solid `--color-focus-ring` (sage-ink), 2px offset**; always visible. All actions keyboard operable; focus order follows visual/DOM order, no nested card links.
- Semantics: one h1; header/main/nav/footer landmarks; property cards as list items; real links/buttons; named maps; announced fallback and filter-state changes.
- Decorative icons and WhatsApp glyph: aria-hidden, focusable=false; adjacent text provides the accessible name. Operation labels are real text.
- Touch targets **44×44px**, **8px separation** minimum.
- Motion: `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`; `--duration-micro: 120ms`, `--duration-state: 180ms`, `--duration-entrance: 320ms`. No bounce/elastic/linear or perpetual effects. Entrance stagger 40ms, capped at six, opacity and 8px translate only. Do not animate geometry; accordion uses grid-template-rows.
- `prefers-reduced-motion: reduce` disables transforms, transitions and cascades; final states render immediately. Cross-document transitions opt out with navigation:none. The board disables its hover travel and transitions too.
- Site remains usable at **200% text scaling and 320px** without horizontal overflow; columns collapse below 768px. The requested 1440px artboard is an explicit artifact exception, not a site layout pattern.
- Colour independence: operation text and fill weight; filter fill/border and text, never hue alone.
- Production document language is Spanish (`lang="es"`); the English-labelled reference board intentionally uses `lang="en"`, with Spanish component samples marked `lang="es"`.
