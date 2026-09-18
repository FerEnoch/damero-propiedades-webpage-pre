# Design System: Damero Propiedades

**Project ID:** `projects/1558288594788685169`
**Product:** Static real-estate catalog for a boutique legal-real-estate studio (Argentina). Four pages: landing, search, listing detail, FAQs. Contact exclusively via WhatsApp.
**Source of truth for color:** pixel-measured from `img/png/damero_logo.png`. The brand has exactly two inks. Everything below is derived from them.

---

## 1. Visual Theme & Atmosphere

**A quiet, sunlit archive — not a marketplace.**

Damero Propiedades is a small, curated portfolio (15–30 listings) run by a legal-real-estate studio. The interface should read like the printed catalogue of a serious boutique practice: generous white space, confident typographic hierarchy, hairline structure, and a single restrained accent. The visitor should feel that every listing was placed there by a person who knows the property and the paperwork behind it.

**Calibration:**

| Axis | Value | Meaning |
|---|---|---|
| Density | 3 / 10 | Gallery-airy. One idea per band. Whitespace is a material, not a gap. |
| Variance | 6 / 10 | Deliberately asymmetric. Off-balance 7/5 and 8/4 splits. Never a centered hero. |
| Motion | 2 / 10 | Static-restrained. Motion confirms state; it never performs. |
| Warmth | 7 / 10 | Olive-tinted neutrals, serif headlines, no clinical blue-greys. |

**The positioning, stated as an opposition.** The explicit anti-pattern for this project is the mass listing portal (Zillow / Argenprop / Zonaprop): dense card grids, saturated status badges, ribbons over photographs, red prices, three competing calls to action per screen, and a filter bar that looks like a spreadsheet. Damero is designed *against* every one of those choices. Where a portal adds a badge, Damero adds space. Where a portal shouts a price in red, Damero sets it in tabular mono and lets it sit.

**The memorable thing.** A single recurring gesture: the **45°-rotated square**. It is the logo's only shape, the hero's background pattern, the image placeholder, and the icon badge silhouette. One geometry, repeated with discipline, at every scale — from a 2px chip corner to a 200px hero field. That repetition is the brand.

---

## 2. Color Palette & Roles

Two brand inks, three neutral surfaces, one accent for links. Nothing else.

### Brand inks

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--color-forest-ink` | `#3E4837` | Primary text, all headings, primary CTA fill, footer surface | **9.60:1** on `surface` — AAA |
| `--color-forest-ink-hover` | `#4A5541` | Primary button hover fill | 7.87:1 with `on-forest` text — AAA |
| `--color-sage-ink` | `#4F6144` | Links, small accent text, focus rings, active filter states | **6.72:1** on `surface` — AA |
| `--color-sage` | `#7C916F` | **Graphic only.** Icon accent masses, 1px interactive borders, hairline emphasis, active indicators | 3.42:1 on `surface` — non-text only |
| `--color-on-forest` | `#FFFFFF` | Text and icons on any `forest-ink` surface | 9.60:1 — AAA |
| `--color-on-forest-muted` | `rgba(255,255,255,0.78)` | Secondary text inside the footer band | 6.60:1 on `forest-ink` — AA |

### Neutral surfaces

| Token | Hex | Role |
|---|---|---|
| `--color-canvas` | `#F4F5F3` | Page background. Never pure white — the whole page carries a 2% olive cast. |
| `--color-surface` | `#FFFFFF` | Cards, inputs, elevated content surfaces |
| `--color-surface-tint` | `#E8EBE3` | Section bands, icon badge containers, media placeholders |
| `--color-muted-text` | `#5F6B57` | Secondary text, metadata, captions, helper text. 5.63:1 on `surface` — AA |

### Structure

| Token | Hex | Role |
|---|---|---|
| `--color-border-hairline` | `#DCE1D6` | Decorative 1px dividers and card outlines. **Never a functional boundary** (1.33:1). |
| `--color-border-on-forest` | `rgba(255,255,255,0.16)` | Decorative divider inside the footer band |

### Semantic aliases (theme-swappable)

These are the tokens components actually consume. They exist so a future dark theme is a token remap, not a refactor. **No dark mode ships in the MVP.**

```
--color-bg-page            → var(--color-canvas)
--color-bg-surface         → var(--color-surface)
--color-bg-subtle          → var(--color-surface-tint)
--color-bg-inverse         → var(--color-forest-ink)
--color-text-primary       → var(--color-forest-ink)
--color-text-secondary     → var(--color-muted-text)
--color-text-accent        → var(--color-sage-ink)
--color-text-on-inverse    → var(--color-on-forest)
--color-border-decorative  → var(--color-border-hairline)
--color-border-interactive → var(--color-sage)
--color-graphic-accent     → var(--color-sage)
--color-action-primary     → var(--color-forest-ink)
--color-focus-ring         → var(--color-sage-ink)
```

### 🚫 Hard accessibility constraint: `#7C916F` is never rendered text

Measured `#7C916F` on `#FFFFFF` = **3.42:1**. This **fails WCAG AA for normal text** (4.5:1 required). It marginally clears the large-text threshold (3:1), but the house rule is stricter and absolute:

> **`--color-sage` (`#7C916F`) MUST NOT be applied to any rendered text — not headings, not body, not labels, not placeholder copy, not disabled states, not text inside SVG icons.** Use `--color-sage-ink` (`#4F6144`, 6.72:1) for anything that carries meaning through type. Sage is permitted only for non-text graphics: icon accent masses, borders of interactive controls, indicators, and decorative fills.

Corollary, also measured: sage on `surface-tint` is **2.84:1**, which fails the 3:1 non-text minimum. Therefore **any interactive control sitting on a `surface-tint` band must use `--color-forest-ink` for its border, not sage.** Sage borders are only valid on `surface` (3.42:1) and `canvas` (3.13:1).

### Verified contrast matrix

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| `forest-ink` #3E4837 | `surface` #FFFFFF | 9.60:1 | AAA |
| `forest-ink` | `canvas` #F4F5F3 | 8.78:1 | AAA |
| `forest-ink` | `surface-tint` #E8EBE3 | 7.97:1 | AAA |
| `on-forest` #FFFFFF | `forest-ink` | 9.60:1 | AAA |
| `sage-ink` #4F6144 | `surface` | 6.72:1 | AA |
| `sage-ink` | `canvas` | 6.14:1 | AA |
| `sage-ink` | `surface-tint` | 5.57:1 | AA |
| `muted-text` #5F6B57 | `surface` | 5.63:1 | AA |
| `muted-text` | `canvas` | 5.15:1 | AA |
| `muted-text` | `surface-tint` | 4.67:1 | AA |
| `on-forest-muted` 78% white | `forest-ink` | 6.60:1 | AA |
| `sage` #7C916F | `surface` | 3.42:1 | **Text banned.** Graphics only. |
| `sage` | `surface-tint` | 2.84:1 | **Not even a valid border here.** |
| `border-hairline` | `surface` | 1.33:1 | Decorative only |

---

## 3. Typography

### Three voices, one rule

| Voice | Typeface | Owns |
|---|---|---|
| **Serif** | **Newsreader** | Content nouns: hero headline, section titles, property titles. Editorial authority. |
| **Sans** | **Hanken Grotesk** | Reading and UI: body copy, descriptions, sub-headings, button labels, form labels. |
| **Mono** | **JetBrains Mono** | Data and apparatus: prices, eyebrow labels, badges, metadata, counts, the legal block. |

The rule is semantic, not decorative: **if it is a name or a title, it is serif. If it is a sentence, it is sans. If it is a number, a category, or an apparatus label, it is mono.** This single rule is what keeps the interface from looking like a template with three random fonts.

### Why these three

- **Newsreader** (headline) — A modern editorial serif drawn specifically for on-screen news reading, not a revival of a book face. It has a slightly condensed set, sturdy serifs and moderate stroke contrast, so it holds its authority at 68px in the hero *and* stays readable at 18px in a card title — the two extremes this product actually needs. Its newsroom provenance carries the studio's legal-registry character: this is a practice that publishes facts, not a portal that advertises listings. Explicitly **not** a banned generic serif (Times / Georgia / Garamond / Palatino), and deliberately not `Playfair Display` — that face's fashion-magazine high contrast is a cliché of "luxury" landing pages and collapses at small mobile sizes.
- **Hanken Grotesk** (body) — A warm humanist grotesque with a tall x-height, open apertures and generous counters, which is exactly what survives 14–16px rendering on a mid-range Android screen in daylight. Its subtly organic curves keep the boutique warmth that a pure geometric grotesque would flatten out, and its neutral rhythm never competes with Newsreader for attention. Rejected: `Inter` (banned, and visually anonymous), `DM Sans` and `Work Sans` (both over-exposed to the point of reading as default templates), `Public Sans` (correct but institutional and flat), `IBM Plex Sans` (too technical, pushes the studio toward "software vendor").
- **JetBrains Mono** (label/data) — Chosen for its **tabular figures**. Every price in a card grid aligns on the digit, which is what makes a catalogue look typeset instead of assembled. Its tall x-height keeps 12px uppercase eyebrow labels legible on mobile, and a monospaced price reads as a documented figure — a *ficha técnica*, a registry entry — which reinforces the legal component of the business. Rejected: `Space Mono` (too quirky, reads "developer portfolio"), `Google Sans Mono` (no character, no tabular benefit over the sans).

### Scale

Fluid via `clamp()`. No text below **12px** anywhere. Body text never below **16px** on mobile.

| Token | Font | Size | Line height | Tracking | Weight |
|---|---|---|---|---|---|
| `--text-display-xl` | Newsreader | `clamp(2.25rem, 1.35rem + 4.2vw, 4.25rem)` → 36–68px | 1.04 | −0.022em | 400 |
| `--text-display-lg` | Newsreader | `clamp(1.75rem, 1.25rem + 2.2vw, 2.75rem)` → 28–44px | 1.10 | −0.018em | 400 |
| `--text-card-title-lg` | Newsreader | `clamp(1.25rem, 1.1rem + 0.7vw, 1.5rem)` → 20–24px | 1.22 | −0.012em | 500 |
| `--text-card-title-sm` | Newsreader | `1.125rem` / 18px | 1.30 | −0.008em | 500 |
| `--text-heading-sm` | Hanken Grotesk | `1.0625rem` / 17px | 1.35 | −0.004em | 600 |
| `--text-body-lg` | Hanken Grotesk | `1.125rem` / 18px | 1.60 | 0 | 400 |
| `--text-body-md` | Hanken Grotesk | `1rem` / 16px | 1.65 | 0 | 400 |
| `--text-body-sm` | Hanken Grotesk | `0.875rem` / 14px | 1.55 | 0 | 400 |
| `--text-price-lg` | JetBrains Mono | `clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem)` → 22–28px | 1.15 | −0.01em | 500 |
| `--text-price-md` | JetBrains Mono | `1.0625rem` / 17px | 1.20 | −0.005em | 500 |
| `--text-label-md` | JetBrains Mono | `0.8125rem` / 13px | 1.30 | 0.06em, uppercase | 500 |
| `--text-label-sm` | JetBrains Mono | `0.75rem` / 12px | 1.25 | 0.08em, uppercase | 500 |
| `--text-legal` | Hanken Grotesk | `0.8125rem` / 13px | 1.60 | 0 | 400 |

**Numeric rendering.** Every price, expense figure, room count and surface area uses `font-variant-numeric: tabular-nums lining-nums`. Prices always render as `USD 95.000` / `ARS 120.000.000` — currency code in `--text-label-sm` mono, amount in the price token. Never a bare `$`: this is an Argentine market where the currency is the single most important piece of information on the card.

**Measure.** Body copy is capped at **65ch**. Hero subhead is capped at **52ch**. Long-form listing description (detail page) is capped at **68ch** for comfortable reading.

**Weights loaded:** Newsreader 400 + 500; Hanken Grotesk 400 + 500 + 600; JetBrains Mono 400 + 500. No more.

---

## 4. Spacing, Radius & Elevation

### Spacing — 4px base

```
--space-1: 4px    --space-6: 24px    --space-16: 64px
--space-2: 8px    --space-8: 32px    --space-20: 80px
--space-3: 12px   --space-10: 40px   --space-24: 96px
--space-4: 16px   --space-12: 48px   --space-32: 128px
--space-5: 20px
```

**Semantic rhythm.** Rhythm comes from *variation*, not a single repeated value:

```
--gutter:        clamp(1.25rem, 5vw, 3rem)       /* 20px → 48px container padding */
--section-y:     clamp(4rem, 8vw, 7.5rem)        /* 64px → 120px between major bands */
--section-y-tight: clamp(2.5rem, 5vw, 4rem)      /* 40px → 64px */
--stack-xs: 4px   --stack-sm: 8px    --stack-md: 16px
--stack-lg: 24px  --stack-xl: 40px
--card-body-pad: 20px
```

Tight groupings and generous separations are used together on purpose. The gap between a card's title and its price is `--stack-sm`; the gap between two sections is `--section-y`. That ratio (1:15) is what produces the editorial feel.

### Radius — restrained, echoing the diamond

The logo's only shape is a rotated square with sharp points. Generously rounded corners would fight it. Radii stay small.

```
--radius-xs: 2px    /* badges, chips, checkbox */
--radius-sm: 4px    /* buttons, inputs, icon badges, sticky CTA bar */
--radius-md: 6px    /* property cards, media frames */
--radius-lg: 12px   /* reserved: sheets and overlays (phase 2) */
```

`border-radius: 999px` / `rounded-full` is **not part of this system.** No pill buttons, no pill chips, no circular icon containers. Circles are the single most common generic-AI interface tell and they contradict the brand geometry.

### Elevation — hairlines first, shadows last

```
--shadow-xs: 0 1px 2px rgba(62,72,55,0.05)
--shadow-sm: 0 2px 10px rgba(62,72,55,0.06)
--shadow-md: 0 10px 30px rgba(62,72,55,0.08)
--shadow-lg: 0 24px 56px rgba(62,72,55,0.10)
```

All shadows are **tinted with the brand ink** (`62,72,55`), never neutral black. Grey shadows on olive-tinted surfaces read as dirt.

**The rule:** at rest, a surface is defined by a **1px hairline**, not a shadow. Shadows are reserved for genuinely floating layers — the mobile sticky CTA bar, an open dropdown, and the hover lift on a card. A shadow on a static, resting card is a violation. This is the single biggest structural difference between this design and the portal anti-pattern, which uses heavy drop shadows to fake hierarchy that typography should be carrying.

---

## 5. Grid & Layout Principles

### Grid

- **12 columns.** Gutters: `16px` (< 640px), `24px` (≥ 640px), `32px` (≥ 1280px).
- **Content container:** max-width `1280px`, centred, with `--gutter` inline padding.
- **Full-bleed media band:** max-width `1600px`. Media may exceed the text container; text never does.
- Breakpoints: `base` 0, `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536.

### Principles

1. **Air over density.** One message per band. If a band needs two ideas, it needs two bands.
2. **One accent, used as punctuation.** Sage appears in **at most three places per viewport**. It is a full stop, not a highlighter.
3. **Hairlines, not boxes.** Structure comes from 1px rules, alignment and whitespace. Never wrap content in a card just to group it. Never nest a card inside a card.
4. **Asymmetry is the default.** Use 7/5 and 8/4 splits. A perfectly symmetric, centred composition is the generic-template signature.
5. **Type carries hierarchy.** Weight, size and colour do the work. Not coloured blocks, not ribbons, not oversized icons above headings.
6. **Left-aligned, ragged right.** No centred text blocks anywhere, including the footer legal copy.
7. **No overlap, ever.** Every element occupies its own spatial zone. No absolutely-positioned content stacking, no text over images, no floating elements across a seam.
8. **Media breathes.** Minimum `--space-4` (16px) between any image and any text. Images never touch type.
9. **Density ceiling.** No more than 6 property cards before a visual break or a band change.
10. **Vertical rhythm via `clamp()`.** Section spacing scales with viewport, and full-height bands use `min-height: 100dvh` — never `100vh` (iOS Safari viewport jump).

### Canonical landing composition

```
[ HEADER ]  hairline-bottom, sticky, surface fill
              logo (left) · nav Inicio / Propiedades / Preguntas frecuentes · WhatsApp text link (right)

[ HERO ]    full-bleed damero pattern band, height clamp(112px, 15vw, 200px)
            ↓ on canvas, generous --section-y
            cols 1–7   · eyebrow (mono) → display-xl headline → body-lg subhead (52ch) → ONE primary CTA
            cols 9–12  · intentionally empty. A single oversized diamond outline at 6% opacity bleeds off
                         the right edge as a brand watermark. Whitespace is the composition.

[ DESTACADAS ]  on canvas
            section head: eyebrow + display-lg + "Ver todas las propiedades →" text link (right-aligned on desktop)
            cols 1–7   · lead card (3:2 media, card-title-lg, price-lg)
            cols 9–12  · two compact cards stacked (3:2 media, card-title-sm, price-md)
            fallback: fewer than 3 featured → show 5 most recent. 1–3 items must compose without empty slots.

[ SERVICIOS ]   surface-tint band, full-bleed
            8 items as a 2-column hairline index list (4 rows × 2 cols on desktop, 1 col mobile).
            Each item: 44px square surface-tint badge + duotone icon · heading-sm · body-sm.
            NO cards. NO 3-equal-column feature row. Hairline separators only.

[ FOOTER ]  forest-ink band, on-forest text
            cols 1–4 brand · cols 6–7 nav · cols 9–12 contact
            hairline (--color-border-on-forest), then the full-width legal block in --text-legal
```

---

## 6. Components

### Button

- **Shape:** `--radius-sm` (4px). Height `48px` mobile / `52px` desktop. Inline padding `--space-6`. Label in Hanken Grotesk 600, `1rem`, `-0.004em`.
- **Primary:** fill `--color-action-primary` (`#3E4837`), text `--color-on-forest`. Hover: `--color-forest-ink-hover`, `translateY(-1px)`, `--shadow-sm`. Active: `translateY(0)`, no shadow — a tactile push, not a bounce.
- **Secondary:** transparent fill, `1px solid --color-border-interactive` (sage, valid on `surface`/`canvas` only), text `--color-text-primary`. Hover: fill `--color-bg-subtle`.
- **Ghost:** transparent, no border, text `--color-text-accent` (`sage-ink`). Hover: `--color-bg-subtle` fill.
- **Text link:** `sage-ink` text, underline `1px` at `text-underline-offset: 3px`, underline colour at 40% opacity that goes to 100% on hover. The only "arrow" affordance permitted is a literal `→` character in the label.
- **Disabled:** `--color-bg-subtle` fill, `--color-muted-text` at 60% opacity, `cursor: not-allowed`. Never a reduced-opacity primary fill.
- **Max one primary button per viewport.** A second action must be secondary, ghost, or a text link.

### Property card

Structure, top to bottom:

1. **Media** — `aspect-ratio: 3/2`, `object-fit: cover`, `--radius-md` top corners, flush with card edges (zero padding around the image).
2. **Body** — `--card-body-pad` (20px).
3. **Badge row** — operation badge, then currency code in `--text-label-sm`.
4. **Title** — `--text-card-title-lg` (lead) or `--text-card-title-sm` (compact), Newsreader 500, `--color-text-primary`. Max 2 lines, `-webkit-line-clamp: 2`.
5. **Price** — `--text-price-lg` / `--text-price-md`, JetBrains Mono 500, tabular, `--color-text-primary`.
6. **Location** — `--text-body-sm`, `--color-text-secondary`, format `Zona · Localidad`.

- **Container:** `--color-bg-surface`, `1px solid --color-border-hairline`, `--radius-md`, **no shadow at rest**.
- **Hover:** border → `--color-border-interactive`, `translateY(-2px)`, `--shadow-sm`. Transition `180ms cubic-bezier(0.16, 1, 0.3, 1)`.
- **The badge sits in the body, above the title. It is never overlaid on the photograph.** No ribbon, no corner tag, no text on the image. This is a defining anti-portal decision.
- The whole card is one link target. Focus ring wraps the card.
- **Compact variant** (featured secondary slots, search grid): identical structure, `card-title-sm` + `price-md`, body padding `--space-4`.

### Operation badge

Two operations, two weights. No colour coding, no icons, no ribbons.

- **`venta`** — solid: `--color-action-primary` fill, `--color-on-forest` text, `--radius-xs`, padding `2px 8px`, `--text-label-sm` uppercase. The authoritative weight.
- **`alquiler`** — outline: transparent fill, `1px solid --color-border-interactive` (sage), `--color-text-primary` text, same radius and metrics. The lighter weight.
- Both are uppercase mono at 12px with `0.08em` tracking. The visual difference in weight — not hue — communicates the distinction, which keeps the palette at two inks and stays legible for colour-blind visitors.

### Filter input

- **Label above the control** — `--text-label-sm` uppercase mono, `--color-text-secondary`. Never a floating label.
- **Control:** height `44px` (meets the 44px touch-target minimum), `--color-bg-surface`, `1px solid --color-border-interactive`, `--radius-sm`, inline padding `--space-3`, `--text-body-md` in `--color-text-primary`.
- **Placeholder:** `--color-text-secondary`.
- **Focus:** `outline: 2px solid --color-focus-ring` (`#4F6144`, 6.72:1) with `outline-offset: 2px`. The focus ring uses `sage-ink`, **not** sage — a focus indicator must clear 3:1 and should clear it comfortably.
- **Select:** custom chevron (inline SVG, `currentColor`), native arrow suppressed.
- **Price range:** dual-thumb. Track `--color-bg-subtle` at 4px, filled segment `--color-graphic-accent`, thumbs 20px `--color-forest-ink` with a 2px `--color-surface` ring.
- **Cochera:** a 20px square checkbox, `--radius-xs`, `1px solid --color-border-interactive`, checked = `--color-forest-ink` fill with a white check. **Not a switch** — switches read as application settings, not as filters.
- **Active filter chips:** `--radius-xs`, `--color-bg-subtle` fill, `--color-text-primary` label in `--text-label-sm`, with a 16px `×` affordance. Removable by tap. **Not pills.**
- **Error / invalid:** `--color-text-primary` message below the control at `--text-body-sm`. No red — the palette has no red, and an off-brand error colour would be worse than none. Pair the message with a `1px` `--color-forest-ink` border on the control and a short mono prefix (`REVISAR`).

### WhatsApp CTA

The WhatsApp brand green (`#25D366`) is **banned as a fill** — it is off-palette and it is exactly what every listing portal screams. WhatsApp identity is carried by the **glyph alone**, at 20px, in `--color-on-forest`.

- **Inline (detail page, empty state):** primary button styling. Glyph + label `Consultar por WhatsApp`. Label is Hanken Grotesk 600. The glyph is `aria-hidden`; the label carries meaning.
- **Mobile sticky bar:** fixed to the bottom, full-width, height `56px`, `--color-action-primary` fill, `--shadow-lg` cast upward, `1px` `--color-border-on-forest` top hairline, and `padding-bottom: env(safe-area-inset-bottom)`. `z-index: 40`. Visible only below `md`; the detail page adds `padding-bottom` equal to the bar height so content is never occluded.
- **Hero CTA:** the landing's single primary action is a search action — label `Ver cartera de propiedades`, no glyph. The hero never shows a WhatsApp button; WhatsApp is the *conversion* action on detail and search-empty states, not the landing's primary promise.

### Empty state

Composed, on-brand, never an apology.

- A 3:2 damero placeholder panel (see §7) at reduced scale — not an illustration, not a sad magnifying glass, not an emoji.
- `heading-sm`: `No encontramos propiedades con esos filtros.`
- `body-md`, `--color-text-secondary`, max 48ch: `Probá ajustar los filtros o consultanos: podemos buscar por vos.`
- Two actions, stacked on mobile and inline on desktop: `Limpiar filtros` (secondary) and `Consultar por WhatsApp` (primary). The secondary comes first in the DOM.

### Header

- Sticky, `--color-bg-surface` fill, `1px` `--color-border-hairline` bottom. Height `64px` mobile / `72px` desktop.
- Logo at `28px` height mobile / `32px` desktop. Nav in Hanken Grotesk 500, `0.9375rem`, `--color-text-primary`; active item gets a `2px` `--color-graphic-accent` underline offset `6px` — an indicator, not coloured text.
- Right side: `Consultar por WhatsApp` as a **text link** in `sage-ink`, not a button. On mobile, nav collapses to a single menu affordance; the WhatsApp link stays visible.
- On scroll, the header may drop the bottom hairline and gain `--shadow-xs`. No blur, no glassmorphism.

### Footer

- `--color-bg-inverse` (`forest-ink`) band, `--color-text-on-inverse` text, `--section-y` vertical padding.
- Brand column: logo in its **knockout white variant** (phase 2 deliverable) at `32px`, plus a single line of `body-sm` in `--color-on-forest-muted`.
- Nav column: the three routes, `body-sm`, `on-forest` at rest.
- Contact column: WhatsApp number and hours as `body-sm`.
- Below a `--color-border-on-forest` hairline, the full-width legal block in `--text-legal`, `--color-on-forest-muted`, left-aligned, max `80ch`:
  > Todas las propiedades exhibidas tienen el permiso firmado de los titulares para su difusión y promoción.
  > Damero Propiedades funciona bajo la coordinación del Corredor Inmobiliario Luis Alejandro Da Silva — CCI 000.

  This block is legally meaningful, so it is set in real text at 13px, never smaller, never at reduced contrast below 4.5:1. It is the only place in the interface where a mono voice would be wrong — it is a statement, not a data point.

---

## 7. Image Rules

### Photography

- **Aspect ratio is fixed at 3:2, landscape, everywhere.** Enforced with `aspect-ratio: 3 / 2` plus `object-fit: cover` and `object-position: center`. Listing photographs are never letterboxed, never cropped to squares, never cropped to portrait, never shown at their native ratio.
- **No filters, no duotone, no overlay, no gradient scrim, no vignette.** The photograph is the property. It is presented plainly, on a `--color-surface` or `--color-canvas` field. Provisory photography is already weak; a filter would only make the weakness look deliberate.
- **No text over a photograph.** No price, no badge, no title, no operation tag, no caption overlay. Every text element lives in its own zone below or beside the media. Captions sit under the image in `--text-body-sm`, `--color-text-secondary`.
- **Radius:** `--radius-md` on the media frame. Corners stay tight.
- **Performance:** `width`/`height` attributes always present to reserve layout (no CLS). `loading="lazy"` + `decoding="async"` for everything below the fold; the lead/hero-adjacent image is `loading="eager"` + `fetchpriority="high"`. Deliverables: WebP, ≤1600px wide, <300KB each, ≤10 per listing (per PRD §7).
- **Gallery (detail page):** a lead image at 3:2 with a thumbnail rail beneath it, thumbnails also 3:2, each `1px solid --color-border-hairline`, active thumbnail `1px solid --color-border-interactive`. A keyboard-navigable pattern; no autoplay carousel, no arrows floating over the photo.

### Brand placeholder tile (used until real photography exists)

A placeholder must never be mistakable for a photograph. It is flat, graphic, and obviously brand-owned.

- **Frame:** `aspect-ratio: 3/2`, `--color-canvas` fill, `--radius-md`, `overflow: hidden`, `1px solid --color-border-hairline`.
- **Pattern:** the damero. A checkerboard of 45°-rotated squares on a 56px cell grid, alternating `--color-surface-tint` and `--color-canvas`, with a `1.5px` `--color-graphic-accent` diamond outline recurring every fourth cell at 40% opacity. Implemented as a single inline SVG data-URI, tiled.
- **Mark:** the three-diamond cluster from the logo, centred, `32px` tall, `--color-forest-ink` at **20% opacity**. No text label, no "no image" wording, no icon.
- **Behaviour:** identical box metrics to a real photo, so swapping in a photograph is a `src` change and shifts nothing in the layout.
- This same tile, scaled down, is reused in the empty state. One asset, two jobs.

---

## 8. Icon System — Duotone SVG Set

The eight existing PNG icons (`img/png/*.png`, 4.4MB total) are **discarded**: 3D semi-realistic illustration style, inconsistent perspective, off-palette, and 500KB+ each. They are replaced by an eight-glyph duotone SVG set. **The service copy does not change.**

### Construction spec

- **Grid:** `24 × 24` viewBox. `1.5px` stroke at 24px. `stroke-linecap: round`, `stroke-linejoin: round`.
- **Two layers, in this order:**
  1. **Accent mass** — a solid `fill="#7C916F"` shape with **no stroke**, occupying **≤40% of the icon area**, drawn first so it sits behind. This is the sage layer.
  2. **Primary line** — `stroke="currentColor"`, `fill="none"`. Inherits `--color-forest-ink` by default, and `--color-on-forest` automatically when placed on the footer band.
- **No third colour. No gradients. No shadows. No rounded-rectangle backgrounds inside the icon.** Duotone means exactly two inks.
- **Scaling:** the SVG ships at a `24px` viewBox and scales by CSS. Rendered at 32px, the stroke resolves to 2px — optically correct without a second asset. Do not ship separate size variants.
- **Delivery:** inline SVG via an Astro icon component (or an SVG sprite with `<use>`), so `currentColor` resolves. **Not** `<img src="icon.svg">` — that breaks the inherited stroke colour. No icon font.
- **Accessibility:** every icon is decorative and carries `aria-hidden="true"` and `focusable="false"`. The adjacent text label is always the accessible name. No icon is ever the sole carrier of meaning.
- **Do not use the accent mass as the only differentiator** between two icons — shape must differ.

### Badge container

- `44 × 44` (mobile) / `48 × 48` (desktop), `--color-bg-subtle` fill, `--radius-sm` (4px), icon centred at `24px`.
- **Square with a 4px radius — never a circle.** The container echoes the damero cell.
- Sage at 2.84:1 against the `surface-tint` container is acceptable here **only because the icon is decorative**; the service name in real text immediately beside it carries the meaning.

### The eight glyphs

| # | Service (copy unchanged) | File | Concept |
|---|---|---|---|
| 1 | Tasación | `icon-appraisal.svg` | Clipboard with a small rising bar mark — a valuation sheet. |
| 2 | Comercialización | `icon-megaphone.svg` | Megaphone, angled. Accent mass = sound field. |
| 3 | Negociación | `icon-handshake.svg` | Two clasped hands. Accent mass = the joining wrist. |
| 4 | Asesoramiento legal | `icon-pen-seal.svg` | Nib pen over a notarial seal disc. Accent mass = the seal. |
| 5 | Gestión documental | `icon-documents.svg` | Two stacked sheets, folded corner. Accent mass = rear sheet. |
| 6 | Alquileres | `icon-keys.svg` | Key ring with a house outline. Accent mass = the ring. |
| 7 | Fotografía profesional | `icon-camera.svg` | Rangefinder body, top plate. Accent mass = the lens. |
| 8 | Marketing inmobiliario | `icon-target.svg` | Concentric target with an offset mark. Accent mass = inner ring. |

Two further glyphs are required in phase 2 but are **not** part of the service set: `icon-search-house.svg` (search page affordance) and `icon-house.svg` (empty-state and fallback). Same construction spec.

**Also required in phase 2:** a **knockout white variant of the logo** for the footer band — the three-diamond cluster in `--color-on-forest`, wordmark in `--color-on-forest`, delivered as SVG with a transparent background. The existing PNG cannot be recoloured and cannot sit on `forest-ink`.

---

## 9. Motion

Restrained, deliberate, and short. This is a catalogue: motion confirms a state change and then gets out of the way.

- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` — exponential deceleration. **No bounce, no elastic, no linear.**
- **Durations:** `120ms` micro (colour, border), `180ms` hover/state, `320ms` entrance.
- **Scroll entrance:** property cards and service items fade in with a staggered cascade (`40ms` per item, capped at 6 items) using **`opacity` and `transform: translateY(8px)` only**. Nothing else animates.
- **Hover:** card `translateY(-2px)` + border colour + `--shadow-sm`. Button `translateY(-1px)`. Link underline opacity.
- **No perpetual motion.** Unlike a dashboard, no component here runs an infinite loop animation. A pulsing or shimmering element would actively fight the editorial calm that is the entire point of the design. Shimmer is used **only** in skeleton loading states, and only while data is actually loading.
- **Performance:** animate `transform` and `opacity` exclusively. Never animate `top`, `left`, `width`, `height`, `margin` or `padding`. For height transitions use `grid-template-rows`.
- **`prefers-reduced-motion: reduce`:** all transforms, transitions and the entrance cascade are disabled; elements render in their final state immediately. Opacity changes are retained.

---

## 10. Responsive Rules

Mobile-first, and **adapted rather than shrunk**. The mobile layout is the primary design, not a compressed desktop.

- **Collapse:** all multi-column layouts collapse to a single column below `768px`, without exception. Horizontal overflow on mobile is a critical failure.
- **Touch targets:** `44 × 44px` minimum for every interactive element. Filter controls are `44px` tall on both mobile and desktop.
- **Type:** headings scale with `clamp()`. Body copy is never below `16px` on mobile. No rendered text below `12px` at any breakpoint.
- **Hero:** the pattern band holds its full-bleed treatment but shortens to `clamp(112px, 15vw, 200px)` — on a 375px viewport the 3.56:1 source band is only ~105px tall, so the headline block moves **below** the band onto `canvas` rather than attempting to sit over it. Desktop places the headline block in the clean zone of the pattern; mobile stacks band-then-type. Different compositions, same identity.
- **Featured properties:** desktop 7/5 asymmetric split (1 lead + 2 stacked). Mobile: single column, lead first, then the rest in order. Never a 2-up grid on mobile.
- **Services:** desktop 2 columns × 4 rows with hairlines; mobile 1 column × 8 rows with hairlines. Same item component, different flow.
- **Header:** nav collapses to a menu affordance; the WhatsApp link stays visible. Never hide the primary conversion path behind a menu.
- **Detail page:** the WhatsApp CTA becomes the sticky bottom bar below `md`; the sticky bar is absent on desktop, where the CTA sits in a static right-hand column.
- **Section spacing** scales with `clamp(4rem, 8vw, 7.5rem)`. Never a fixed desktop value carried down to mobile.
- **Orientation:** landscape phone is a supported case for the gallery and the map — verify it, do not ignore it.

---

## 11. Anti-Patterns — Explicitly Banned

**The portal anti-pattern (the reference this project is designed against):**

- ❌ Dense 4-up card grids with tight gutters
- ❌ Saturated status badges, "DESTACADO" ribbons, corner tags on photographs
- ❌ Red or green prices; any price colour other than `--color-text-primary`
- ❌ Text, badges, prices or gradients overlaid on property photographs
- ❌ Competing calls to action in one viewport (more than one primary button)
- ❌ A filter bar that reads as a spreadsheet; filter chips rendered as saturated pills
- ❌ Heavy drop shadows on resting cards
- ❌ Stock photography of smiling agents, keys handed over, or generic city skylines
- ❌ Fake urgency, fake scarcity, invented social proof

**AI/template tells:**

- ❌ Emojis anywhere in the interface
- ❌ The `Inter` typeface
- ❌ Generic serifs (Times New Roman, Georgia, Garamond, Palatino)
- ❌ Pure black `#000000`; pure white is used only as `--color-surface` and `--color-on-forest`, never as a page background
- ❌ Neon or outer-glow shadows; coloured glow focus rings
- ❌ Oversaturated accents; any colour outside §2
- ❌ Gradient text on headings
- ❌ Glassmorphism, backdrop blur, translucent panels
- ❌ Circular icon containers; pill-shaped buttons or chips; `border-radius: 999px`
- ❌ A large rounded icon above every section heading
- ❌ The 3-equal-card feature row
- ❌ Nested cards; cards used purely to group content
- ❌ Centred hero sections and centred text blocks
- ❌ Modals where an inline or full-page pattern works
- ❌ Custom mouse cursors
- ❌ Filler UI copy: "Scroll to explore", "Swipe down", bouncing chevrons, scroll arrows
- ❌ `LABEL // YEAR` formatting
- ❌ AI copywriting clichés: "Elevá tu experiencia", "Encontrá el hogar de tus sueños", "Soluciones sinérgicas", "Next-Gen", "Seamless"
- ❌ **Fabricated data of any kind.** No invented property counts, years of experience, satisfaction percentages, response times, or testimonials. If a number has not been supplied by the stakeholder, it does not appear. Where a number is structurally required but unknown, use an explicit placeholder label rather than a plausible-looking invention.
- ❌ Broken or hotlinked stock images. If no real photograph exists, use the brand placeholder tile from §7.

---

## 12. Accessibility Standards

Target: **WCAG 2.2 AA**, verified rather than assumed.

- **Contrast:** every text/background pair in §2 is measured and recorded. The full matrix is the contract; no pair may be used outside its verdict.
- **The sage text ban** is the single most important constraint in this document. It is a measured failure (3.42:1), and it is enforced by rule, not by judgement.
- **Keyboard:** every interactive element is reachable and operable by keyboard. Visible focus on all of them. The focus ring is `2px solid #4F6144` with a `2px` offset (6.72:1), and it is never removed — only restyled.
- **Focus order** follows DOM order, which follows visual order. Cards are single link targets, not a link plus three nested links.
- **Semantics:** one `<h1>` per page. Property cards are list items. Landmarks (`header`, `main`, `nav`, `footer`) are used. The map container carries a meaningful accessible name and the fallback message is announced.
- **Screen readers:** all icons `aria-hidden`. The operation badge is real text, not a colour. The WhatsApp glyph is decorative; the label is the name. Filter state changes are announced via a live region.
- **Touch targets:** `44 × 44px` minimum, `8px` minimum separation between adjacent targets.
- **Motion:** `prefers-reduced-motion` is honoured globally.
- **Zoom:** the layout must remain usable at 200% browser text scaling without horizontal scrolling, and at 320px viewport width.
- **Colour independence:** `venta` vs `alquiler` is distinguished by fill weight and text, never by hue alone. Filter states are distinguished by fill and border, never by hue alone.
- **Language:** `lang="es"` on the document. All UI copy is neutral professional Spanish; `DESIGN.md` and token names remain English.

---

## 13. Dark Mode Readiness (tokens only — not shipped)

No dark theme ships in the MVP. The semantic alias layer in §2 exists so that adding one later is a **token remap inside a `[data-theme="dark"]` scope**, with zero component changes. Requirements for that future work:

- Components consume **semantic aliases only** — never raw palette values (`--color-forest-ink`) directly in component CSS.
- No hardcoded hex values inside components, SVG icons, or inline styles, with one documented exception: the sage accent mass inside icon SVGs, which is a brand constant.
- Shadows are already brand-tinted; a dark theme redefines them rather than reusing them.
- The sage text ban applies identically in dark mode — the contrast must be re-measured against the dark surfaces before any use, and `sage-ink` will likely need a lightened counterpart token rather than being reused as-is.

---

## 14. Token Reference

```css
:root {
  /* ---- Brand inks ---- */
  --color-forest-ink: #3E4837;
  --color-forest-ink-hover: #4A5541;
  --color-sage-ink: #4F6144;
  --color-sage: #7C916F;            /* GRAPHIC ONLY — never rendered text */
  --color-on-forest: #FFFFFF;
  --color-on-forest-muted: rgba(255, 255, 255, 0.78);

  /* ---- Surfaces ---- */
  --color-canvas: #F4F5F3;
  --color-surface: #FFFFFF;
  --color-surface-tint: #E8EBE3;
  --color-muted-text: #5F6B57;

  /* ---- Structure ---- */
  --color-border-hairline: #DCE1D6;
  --color-border-on-forest: rgba(255, 255, 255, 0.16);

  /* ---- Semantic aliases (theme-swappable) ---- */
  --color-bg-page: var(--color-canvas);
  --color-bg-surface: var(--color-surface);
  --color-bg-subtle: var(--color-surface-tint);
  --color-bg-inverse: var(--color-forest-ink);
  --color-text-primary: var(--color-forest-ink);
  --color-text-secondary: var(--color-muted-text);
  --color-text-accent: var(--color-sage-ink);
  --color-text-on-inverse: var(--color-on-forest);
  --color-border-decorative: var(--color-border-hairline);
  --color-border-interactive: var(--color-sage);
  --color-graphic-accent: var(--color-sage);
  --color-action-primary: var(--color-forest-ink);
  --color-focus-ring: var(--color-sage-ink);

  /* ---- Typography ---- */
  --font-serif: 'Newsreader', Georgia, 'Times New Roman', serif;
  --font-sans: 'Hanken Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace;

  /* ---- Spacing ---- */
  --space-1: 4px;   --space-2: 8px;    --space-3: 12px;  --space-4: 16px;
  --space-5: 20px;  --space-6: 24px;   --space-8: 32px;  --space-10: 40px;
  --space-12: 48px; --space-16: 64px;  --space-20: 80px; --space-24: 96px;
  --space-32: 128px;
  --gutter: clamp(1.25rem, 5vw, 3rem);
  --section-y: clamp(4rem, 8vw, 7.5rem);
  --section-y-tight: clamp(2.5rem, 5vw, 4rem);
  --card-body-pad: 20px;

  /* ---- Radius ---- */
  --radius-xs: 2px;  --radius-sm: 4px;  --radius-md: 6px;  --radius-lg: 12px;

  /* ---- Elevation (brand-tinted) ---- */
  --shadow-xs: 0 1px 2px rgba(62, 72, 55, 0.05);
  --shadow-sm: 0 2px 10px rgba(62, 72, 55, 0.06);
  --shadow-md: 0 10px 30px rgba(62, 72, 55, 0.08);
  --shadow-lg: 0 24px 56px rgba(62, 72, 55, 0.10);

  /* ---- Layout ---- */
  --container-content: 1280px;
  --container-bleed: 1600px;
  --breakpoint-sm: 640px;  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px; --breakpoint-xl: 1280px; --breakpoint-2xl: 1536px;

  /* ---- Motion ---- */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-micro: 120ms;
  --duration-state: 180ms;
  --duration-entrance: 320ms;
}
```

---

## 15. Stitch Design System Mapping

| Stitch field | Value |
|---|---|
| Display name | `Damero Propiedades — Editorial Forest` |
| `colorMode` | `LIGHT` |
| `colorVariant` | `NEUTRAL` |
| `customColor` / `overridePrimaryColor` | `#3E4837` |
| `overrideSecondaryColor` | `#7C916F` |
| `overrideTertiaryColor` | `#4F6144` |
| `overrideNeutralColor` | `#F4F5F3` |
| `headlineFont` | `NEWSREADER` |
| `bodyFont` | `HANKEN_GROTESK` |
| `labelFont` | `JETBRAINS_MONO` |
| `roundness` | `ROUND_FOUR` |

---

## 16. Content Rules

- **Language:** all user-facing copy is neutral professional Spanish (Argentina). No regional slang, no marketing superlatives. Token names and this document remain English.
- **Property titles** are declarative and factual: type, rooms, and a real distinguishing feature. No adjectives selling the property.
- **Prices** always carry the currency code. Never a bare `$`.
- **No invented content.** Descriptions, features and figures come from the listing's own markdown. The design must degrade gracefully when `expensas`, `fotos` captions, or the free-text body are absent.
- **The service copy and the legal footer block are fixed** — carried over verbatim from the current site and not to be rewritten during design work.
- **Legal strings are never truncated, never hidden behind a disclosure, and never rendered below 13px.**

---

## 17. Phase 2 Components — Search, Detail & FAQ

Specifications for the three phase-2 pages (`/propiedades`, `/propiedades/<slug>`, `/faqs`). Everything below composes the tokens in §2–§4 and obeys §5 and §9–§12. It introduces **no new colour, radius, shadow, typeface or motion primitive**.

### 17.1 Search page (`/propiedades`)

**Results grid.** 3 columns ≥ `md`, 1 column below. Never a 2-up grid on mobile (§10). The compact card variant from §6 is used (`card-title-sm` + `price-md`, body padding `--space-4`). Maximum **6 cards** before a band change (§5, principle 9); a `Ver más propiedades` secondary button follows the sixth.

**Results header.** A single line above the grid: `RESULTADOS · <n>` in `--text-label-md` mono uppercase, `--color-text-secondary`, left-aligned; a compact `Ordenar:` select right-aligned. `<n>` is **derived from the rendered set** — it is never a hard-coded claim about the size of the portfolio (§11, fabricated data).

**Filter bar (desktop ≥ `md`).**
- One `--color-bg-surface` panel, `1px solid --color-border-hairline`, `--radius-sm`, `--space-6` padding. Not a card, not a shadowed surface.
- A single horizontal row of controls. Each control carries its label **above** it in `--text-label-sm` mono uppercase, `--color-text-secondary`. Never a floating label.
- Control order: `OPERACIÓN` (segmented: Todas / Venta / Alquiler), `TIPO` (select), `LOCALIDAD` (select), `HABITACIONES` (select), `COCHERA` (square checkbox + inline label), `MONEDA` (segmented USD / ARS), `PRECIO` (dual-thumb range).
- **Segmented control:** `--radius-sm`, `1px solid --color-border-interactive`. The selected option is marked by `--color-forest-ink` fill + `--color-on-forest` text — **weight and fill, never hue alone** (§12, colour independence). Unselected options are plain text on `surface`.
- Every control is `44px` tall at every breakpoint (§12).
- **Range readout** sits above the track in `--text-label-sm` mono: `USD 30.000 — USD 150.000`. The range applies **only within the selected currency** — there is no USD/ARS conversion, and the readout must never imply one.
- The row ends with `Limpiar filtros` as a **ghost text link**. The filter bar contains **no primary button** — the page's job is browsing, not converting.
- Below `768px` this bar does not exist. See the collapsed pattern below.

**Applied filter chips.**
- `--radius-xs`, `--color-bg-subtle` fill, `--color-text-primary` label in `--text-label-sm` mono uppercase, plus a 16px `×` affordance on the right.
- **Never pills. Never saturated. Never colour-coded by filter type.**
- The `44px` minimum touch target is met by padding the chip, not by growing the `×` glyph.
- One chip per active filter value; the price range collapses to a single chip (`USD 30.000–150.000 ×`). Removing a chip re-runs the filter **and rewrites the URL**.
- Desktop: the chips wrap onto as many lines as needed, placed directly beneath the filter panel.

**Shareable search strip.**
- A full-bleed `--color-bg-subtle` band, `--section-y-tight` padding. One row.
- Left: eyebrow `BÚSQUEDA COMPARTIBLE` in `--text-label-sm` mono.
- Right: a read-only field — `--color-bg-surface`, `1px solid --color-border-hairline`, `--radius-sm` — containing the query string in `--text-body-sm` mono, truncated so the **params stay visible**.
- Action: `Copiar búsqueda` as a **secondary** button. Never primary.
- **Why this exists:** the filter state lives in the URL (PRD §5). This strip is the only place the URL appears as content, and it is the visible proof that a search is linkable. It is functional, not decorative — do not replace it with an icon-only share affordance.

**Collapsed filter pattern (mobile < `md`) — the critical mobile decision.**
- The filter bar collapses to a **56px sticky bar** pinned directly under the header.
- Left: a `Filtros` trigger with a **count badge** — `--radius-xs`, `--color-forest-ink` fill, `--color-on-forest` text, `--text-label-sm`. The badge counts **active filters**, never results.
- Right: the applied-chip rail, horizontally scrollable, with a soft fade at the right edge to signal more content. Chips keep the §17.1 spec — tight corners, never pills.
- Tapping `Filtros` opens a **bottom sheet**:
  - `--radius-lg` on the top corners only, `--color-bg-surface`, `--shadow-md`, `max-height: 85dvh`, scrollable body, `padding-bottom: env(safe-area-inset-bottom)`.
  - A centred 32×4px drag handle in `--color-border-hairline` above the header row.
  - Header row: `Filtros` in `--text-heading-sm` on the left, `Limpiar` as a ghost text link on the right.
  - Controls stack vertically, full width, `--space-5` apart, reusing the §17.1 components unchanged.
  - Footer: one full-width primary button `Ver N propiedades`. It is the sheet's **only** primary action.
  - Scrim: flat `rgba(62,72,55,0.4)`. **No backdrop blur** (§11).
- This sheet is the **only modal pattern permitted** in this system, and only because a filter set genuinely does not fit inline on a 390px viewport. It is not a general-purpose dialog pattern.

**Search empty state** (extends §6 Empty state).
- A full-bleed `--color-bg-subtle` band, `--section-y` padding, **left-aligned with a ragged right edge** — never centred.
- Composition, top to bottom: eyebrow `SIN COINCIDENCIAS`; the reduced 3:2 brand placeholder tile from §7 (never an illustration, never a magnifying glass, never an emoji); `No encontramos propiedades con esos filtros.` in `--text-card-title-lg`; `Probá ajustar los filtros o consultanos: podemos buscar por vos.` in `--text-body-md`, `--color-text-secondary`, max 48ch; then two actions — `Limpiar filtros` (secondary) **first in the DOM**, `Consultar por WhatsApp` (primary) second.
- The empty state is a designed page state, not an apology. It never says "lo sentimos".

### 17.2 Detail page (`/propiedades/<slug>`)

**Section order is fixed** (PRD §6): gallery → title / description → characteristics → price + currency + expenses (only if defined) → zone + locality → map → WhatsApp CTA. Design work may not reorder these.

**Breadcrumb.** `--text-label-sm` mono uppercase, `/` separators. Ancestor segments are links in `--color-text-secondary`; the current segment is plain `--color-text-primary` text, not a link. Sits above the gallery at full content width.

**Gallery.**
- Lead image: 3:2, `--radius-md`, on a `--color-canvas` or `--color-surface` field. `width`/`height` always set. The lead is `loading="eager"` + `fetchpriority="high"`; everything else is lazy (§7).
- Thumbnail rail directly beneath: 3:2 thumbnails, `--space-2` gap, each `1px solid --color-border-hairline`, `--radius-sm`. Inactive thumbnails are **not dimmed**; the active one takes `1px solid --color-border-interactive`.
- Counter at the end of the rail: `--text-label-sm` mono, format `1 / 5`.
- Mobile: the rail scrolls horizontally with `scroll-snap-type: x mandatory`, and the active thumbnail scrolls into view.
- **No arrows floating over the photograph. No autoplay. No dot indicators.** Left/right arrow keys move the active index; each thumbnail is a real `<button>` with an accessible name.
- Swapping the brand placeholder for a real photograph is a `src` change and must shift nothing (§7).

**Characteristics labels.**
- A wrapping flex row. Each label: `--radius-xs`, `--color-bg-subtle` fill, `--color-text-primary`, `--text-label-sm` mono uppercase, `4px 8px` padding, `--space-2` gap.
- These are **labels, not controls** — no `×`, no hover state, no border, no icon.
- Source values are the `caracteristicas` slugs (PRD §4). The rendered string is the slug with `-` replaced by a space and uppercased. **An unmapped slug still renders** — the design never depends on a curated dictionary, and an unknown feature must not be silently dropped.

**Price / data panel (ficha técnica).**
- `--color-bg-surface`, `1px solid --color-border-hairline`, `--radius-md`, `--space-6` padding, **no shadow at rest** (§4).
- Top: eyebrow `PRECIO` in `--text-label-sm` mono; the amount in `--text-price-lg` mono, `tabular-nums`, **with the currency code always present**.
- Hairline.
- Data rows: label left in `--text-label-sm` mono uppercase, value right in `--text-body-sm` with `tabular-nums`. Rows: `OPERACIÓN`, `HABITACIONES`, `COCHERA` (`Sí` / `No`), `MONEDA`, and `EXPENSAS`.
- **Graceful degradation.** When `expensas` is `null`, render `EXPENSAS — No aplica` rather than dropping the row: the panel keeps a stable height and the visitor learns the field is not being hidden. When `descripcion` is absent, the summary line collapses without leaving a gap.
- Hairline, then the CTA.

**Detail CTA placement.**
- Desktop (≥ `md`): the CTA lives in the static right-hand column (columns 9–12), inside the price panel. **There is no sticky bar on desktop** (§10).
- Mobile (< `md`): the sticky bottom bar from §6 takes over and the in-flow CTA is omitted. The page reserves `padding-bottom` equal to the bar height plus `env(safe-area-inset-bottom)` so nothing is ever occluded.
- Exactly **one** primary action per viewport in both cases.

**Map panel.**
- Framed in a `--color-bg-subtle` surface: `--radius-md`, `1px solid --color-border-hairline`, `overflow: hidden`. The map never bleeds past the frame.
- Basemap: **MapLibre GL JS** consuming the **OpenFreeMap** style URL. Lazy-loaded via dynamic import / `client:visible` so it never enters the initial bundle (PRD §6).
- **Exactly one overlay:** a translucent circle of **fixed 400 m radius**, centred on `map_lat`/`map_lon` (already offset ≥100 m at authoring time). Fill `--color-graphic-accent` at ~15% opacity; stroke `--color-graphic-accent` at ~45%, `1px`.
- **No pin, no marker, no dot, no radius label, and no numeric coordinate anywhere** — not in visible text, not in metadata, not in JSON-LD (PRD §9, check 3). The privacy mitigation is the manual offset plus the fixed radius; the absence of a pin is the design expression of it.
- Interaction: `scrollZoom: false`, `dragRotate: false`, `touchZoomRotate` enabled, and `cooperativeGestures` on desktop so the page still scrolls.
- **Attribution is mandatory and permanent.** MapLibre's `© OpenFreeMap © OpenStreetMap` control stays visible in the bottom-right corner of the map frame, in `--text-label-sm` on a `--color-surface` chip with `--radius-xs`. It is never removed, never collapsed behind a disclosure, and never restyled below legibility. **Any refactor that hides it is a defect**, not a styling choice.
- Caption below the frame: `ZONA APROXIMADA · RADIO 400 M` in `--text-label-sm` mono, `--color-text-secondary`. On mobile, add the muted note `La zona se muestra como referencia aproximada.`
- **Fallback state** (style fails to load, or JS disabled): replace the map with a static panel of the **same 3:2 box metrics** so nothing shifts. `--color-bg-subtle` fill, `--radius-md`, `1px solid --color-border-hairline`, left-aligned content: a simple line-art house glyph at 24px (`aria-hidden`), `Ubicación no disponible momentáneamente.` in `--text-body-md`, and `Reintentar` as a ghost text link. The `ZONA APROXIMADA` caption stays. The message is announced via `role="status"`.
- The map container carries a meaningful accessible name and the fallback is announced (§12). The fallback is **not** an error dialog and never mentions the tile provider.

### 17.3 FAQ accordion (`/faqs`)

**Accordion.**
- Items are separated by `1px solid --color-border-hairline` **only**. No cards, no boxes, no background fills, no shadows, no icons.
- Row: the question in the serif voice (`--text-card-title-sm`, Newsreader 500, `--color-text-primary`), max 2 lines on desktop / 3 on mobile; the affordance at the far right.
- Affordance: a plain `+` (collapsed) / `−` (expanded) character in the label voice, `--color-text-primary`. **Never inside a circle, never inside a rounded container, never a chevron.** The glyph is swapped, not rotated.
- Minimum row height `56px` mobile / `64px` desktop. The whole row is the toggle: a `<button>` with `aria-expanded` and `aria-controls`.
- Answer body: `--text-body-md`, `--color-text-secondary`, max 65ch, `--space-4` top padding.
- Height animation uses `grid-template-rows`, never `height` (§9). Under `prefers-reduced-motion` it collapses instantly.
- The **first item is expanded by default** so the pattern documents itself. Multiple items may be open; collapsing all is allowed.
- Desktop: accordion in columns 1–7, quiet side rail in columns 9–12 carrying the page's single primary CTA.
- Mobile: single column, no side rail; the CTA moves to a closing band below the accordion.

**Pending-content placeholder.**
- FAQ answers are stakeholder-owned and a **launch blocker** (PRD §8). Until they exist, an answer renders as a marker plus a neutral meta line.
- Marker: `--radius-xs`, `--color-bg-subtle` fill, `--text-label-sm` mono uppercase, `--color-text-primary`, inline at the start of the answer.
- Meta line: `--text-body-sm`, `--color-text-secondary`, stating the scope and expected length of the answer that is still to be written.
- **Never invent answer content.** No legal, notarial, credit, tax or tenancy statement may be written by a designer or an agent. A placeholder that reads as real advice is worse than an obvious gap.

### 17.4 Placeholder and legal-content rules

- The footer legal block is **exactly two lines, verbatim** (§6). It is never joined by a copyright line, a matrícula, a licence number, an accessibility statement, a privacy link or a terms link unless the stakeholder supplies the exact wording.
- **Never fabricate a matrícula, a CCI, a licence, a certification, a CUCICBA-style registration or any legal reference.** The only legal identifiers that may appear in this product are the two supplied in §6.
- Sample listing data in mockups is fictional, plausible and internally consistent with the PRD example. It is never derived from a real person, address or property.
- The WhatsApp number in mockups stays an **obvious** placeholder (`+54 9 2304 000000`). No `wa.me` link ships with a real number until the stakeholder provides it.
- The service copy and the legal block remain fixed (§16).

**Open item carried into implementation.** The registered Stitch asset `assets/5c6d34089cb34b22ae8bfdaa315e2d5b` currently exposes `labelFont = PUBLIC_SANS`, which diverges from the mapping recorded in §15 (`JETBRAINS_MONO`). The Astro build must follow §3 and §14 — prices, counters and apparatus labels in JetBrains Mono with tabular figures — regardless of what the mockups render. Align the Stitch asset before the next design round so mockups and build stop diverging.
