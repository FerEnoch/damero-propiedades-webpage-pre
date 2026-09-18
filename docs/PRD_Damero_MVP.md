# PRD — Damero Propiedades MVP (Pre-Webpage)

**Status:** DRAFT for validation · **Date:** 2026-09-16 · **Audience:** engineering leader

> Static catalog site for Damero Propiedades: 4 pages, markdown-driven listings, WhatsApp contact. No backend in MVP.

## 1. Goal

Ship a fast, mobile-first catalog that lets visitors browse 15–30 properties, filter them, view detail with an approximate zone map, and contact via WhatsApp. Content updates are file-based (10 adds / 5–8 removals per month). Stack: Astro + Content Collections, GitHub free, Vercel free deploy.

## 2. Non-goals

- No SQLite, backend, CMS, or object bucket in MVP.
- No contact forms or lead CRM; WhatsApp only.
- No numeric coordinates shown to visitors; approximate zone only.
- No photo retouching pipeline in code; photographer + designer own quality.

## 3. Pages / Scope

| Page | Purpose |
|------|---------|
| Landing (`/`) | Hero, featured properties, 8 services (unchanged), footer with legal |
| Search (`/propiedades`) | Filterable grid of all listings |
| Detail (`/propiedades/<slug>`) | Full listing: photos, features, price, zone map, WhatsApp CTA |
| FAQs (`/faqs`) | 6 seed questions, content from `faqs.json` |

Assets reused: existing landing copy keeps 8 services block and footer legal (permiso de difusión + corredor Luis Alejandro Da Silva CCI 000).

## 4. Property frontmatter schema

Content Collection: `src/content/propiedades/*.md` (one file per listing).

| Field | Type | Req. | Notes |
|-------|------|------|-------|
| `titulo` | string | Yes | Listing headline |
| `descripcion` | string | Yes | Short summary |
| `slug` | string | Yes | URL-safe, unique |
| `operacion` | enum `venta` \| `alquiler` | Yes | Filterable |
| `tipo` | string | Yes | e.g. casa, depto, lote; filterable, extensible |
| `precio` | number | Yes | — |
| `moneda` | enum `USD` \| `ARS` | Yes | — |
| `expensas` | number \| null | No | Only where applicable |
| `habitaciones` | number | Yes | Filterable |
| `cochera` | boolean \| number | Yes | Filterable |
| `precio_min` / `precio_max` | derived | — | Range filter inputs, extensible set |
| `caracteristicas` | string[] | Yes | Slugs, e.g. `pileta`, `parrilla` |
| `zona` | string | Yes | Free-text, rural-aware (e.g. "Colonia rural, km 12") |
| `localidad` | string | Yes | — |
| `map_lat` / `map_lon` | number | Yes | Manual approximate center **with offset**; never rendered as numbers |
| `whatsapp` | string | Yes | Dynamic per listing (agent number) |
| `fotos` | object[] | Yes | See §7; each `{ src, titulo?, portada?, descripcion? }` |
| `destacada` | boolean | No | Defaults `false`; feeds landing featured block |

Free body: markdown below frontmatter (optional) — free explanatory text, rendered as main description block on detail after `descripcion`.

Minimal example:

```yaml
---
titulo: "Casa 3 amb con patio en zona quinta"
slug: "casa-quinta-3amb"
operacion: "venta"
tipo: "casa"
precio: 95000
moneda: "USD"
habitaciones: 3
cochera: true
caracteristicas: ["patio", "parrilla", "agua-corriente"]
zona: "Zona quintas, camino rural km 12"
localidad: "Luján"
map_lat: -34.55
map_lon: -59.12
whatsapp: "5492304000000"
fotos:
  - src: "/propiedades/casa-quinta-3amb/frente.webp"
    titulo: "Frente"
    portada: true
  - src: "/propiedades/casa-quinta-3amb/fondo.webp"
    titulo: "Fondo"
---
```

## 5. Search behavior

- Filters: `operacion`, `habitaciones`, `cochera`, `tipo`, `precio_min`/`precio_max`. Filter set is extensible.
- Filtering is client-side over the collection; empty result shows a "no matches + clear filters + WhatsApp" state.
- Card shows: cover photo, titulo, precio + moneda, zona + localidad, operacion badge.

## 6. Detail behavior

- Sections: gallery, titulo/descripcion, caracteristicas (slugs), precio + moneda + expensas (if set), zona + localidad, map, WhatsApp CTA.
- Map: OpenFreeMap embed, **circle only** with fixed radius set in code; center = manual approximate `map_lat`/`map_lon` (with offset). Never display numeric coordinates.
- WhatsApp CTA format (prefilled title + slug, no forms):

```text
https://wa.me/<whatsapp>?text=Hola%20Damero%2C%20me%20interesa%20%3Ctitulo%3E%20%28%3Cslug%3E%29
```

- Mobile-first: CTA is sticky on small screens.

## 7. Images pipeline + limits

- Location: `public/propiedades/<slug>/`; per-photo `titulo`/`descripcion` optional.
- Limits: max **10 photos** per listing, max width **1600px**, format **WebP**, each file **< 300 KB**.
- Process is manual (photographer + designer own quality); build rejects oversize/count violations per §9.
- Cover = first entry in `fotos`.

## 8. FAQs

- Source: `src/data/faqs.json`, rendered on `/faqs`. Answers TBD by stakeholder.
- Seed questions (6):
  1. What do I need to list my property for sale?
  2. What do I need to list my property for rent?
  3. What does a mortgage-apt (apto crédito) listing require?
  4. Can I sell without sole title (título único)?
  5. I want to buy — how do you guide me?
  6. What do I need to rent a property?

## 9. Git / CI flow

- Flow: commit direct to `main` → CI gate → Vercel deploys only on green.
- CI checks (5):
  1. Astro build passes.
  2. Content Collections schema validation passes.
  3. Image limits enforced (count ≤ 10, WebP, width ≤ 1600px, each < 300 KB).
  4. No numeric coordinates leaked in rendered output (map circle only).
  5. Internal links + slugs valid (no dead `/propiedades/<slug>` routes).

## 10. Free-tier constraints

- GitHub free (repo + Actions minutes) + Vercel free (bandwidth/build minutes).
- No server-side compute: static output only, client-side filtering.
- Map tiles via OpenFreeMap free usage; fixed-radius circle keeps tile count low.
- Keep total `public/` weight low; WebP + 300 KB cap protects Vercel bandwidth.

## 11. Risks / assumptions

| Risk / assumption | Mitigation |
|-------------------|------------|
| Manual `map_lat`/`map_lon` offset is forgotten → real location exposed | Review checklist: center must be visibly offset; CI check #4 guards numeric leak |
| `zona` free-text inconsistent (rural areas) | Accept free-text by design; localidad stays structured for filtering |
| 10 adds/mo in markdown scales poorly later | Accepted for 15–30 listings; CMS deferred (§12) |
| Photographer delivers oversize/non-WebP files | CI check #3 fails the build; documented limits in §7 |
| WhatsApp number changes per agent | `whatsapp` is per-listing frontmatter, not hardcoded |

## 12. Deferred + Next step

- Deferred: CMS/admin UI, backend/DB, contact forms, advanced filters (m², antigüedad), i18n.
- **Next step:** stakeholder validates this PRD, then the design track starts (layout + visual system for the 4 pages).
