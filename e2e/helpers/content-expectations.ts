/**
 * Collection-derived expectations for the e2e suite (plan
 * `odd/tasks/damero-e2e-decouple.md`, T1).
 *
 * The collection under `src/content/propiedades/` is the source of truth for
 * business data: specs assert the rendering contract (format, presence,
 * correspondence with the collection), never a parallel copy of the values.
 * This module reads each listing's frontmatter at test time with Node fs and
 * a deliberately strict, minimal parser — no YAML dependency, and any field
 * that does not match the exact authoring shape throws loudly instead of
 * silently dropping a listing (same failure style as `png-decode.ts`).
 *
 * T1: price/currency derivation. T2: slug/title derivation. T3: photo
 * derivation. T4: filtering derivation. T5: ficha/characteristics/coords/
 * localidad/WhatsApp/destacada derivation. Probe targets (plan
 * `odd/tasks/damero-e2e-decouple-probes.md`, T1): single-listing picks by
 * photo shape, undefined when nothing qualifies.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** One listing's price contract, derived from its frontmatter. */
export interface PriceExpectation {
  /** `moneda` verbatim — the currency code the panel always renders. */
  currency: string;
  /**
   * `precio` formatted exactly as the detail page formats it: `es-AR`
   * thousands grouping, no decimals (mirrors `formatAmount` in
   * `src/lib/format.ts`).
   */
  amount: string;
}

const CONTENT_DIR = fileURLToPath(new URL('../../src/content/propiedades/', import.meta.url));

/*
 * The page formatter (`src/lib/format.ts`) duplicated on purpose: importing
 * `src/` from the suite would couple the gate to the build graph; the sync
 * point is the `es-AR` + no-decimals contract documented in DESIGN §16.
 */
const AMOUNT_FORMATTER = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

function readFrontmatter(file: string): string {
  const raw = readFileSync(file, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  if (!match) throw new Error(`content-expectations: ${file} has no frontmatter block`);
  return match[1];
}

/** Authoring convention: `key: "value"`. Anything else fails loudly. */
function readStringField(frontmatter: string, file: string, field: string): string {
  const match = new RegExp(`^${field}: "([^"]+)"`, 'm').exec(frontmatter);
  if (!match) throw new Error(`content-expectations: ${file} is missing \`${field}: "…"\``);
  return match[1];
}

/** Authoring convention: `key: <integer>`. Anything else fails loudly. */
function readIntegerField(frontmatter: string, file: string, field: string): number {
  const match = new RegExp(`^${field}: (\\d+)`, 'm').exec(frontmatter);
  if (!match) throw new Error(`content-expectations: ${file} is missing \`${field}: <integer>\``);
  return Number(match[1]);
}

/**
 * One photo of a listing, in authored order. `src` mirrors the frontmatter
 * `src` verbatim — the pages render it unchanged (`src={fotos[N].src}`).
 * `titulo` mirrors the `?? ''` render in `galeria.astro:72` and
 * `[slug].astro:154`: a photo without a `titulo` line renders `alt=""`.
 */
export interface PhotoRecord {
  src: string;
  titulo: string;
}

/**
 * The frontmatter fields this module derives, per listing. The authoring
 * convention is the strict parser above; it is verified uniform across the
 * authored collection (2026-10-12), including `titulo` — every file quotes
 * it — and any deviation throws instead of silently dropping a listing.
 */
interface ListingRecord {
  slug: string;
  titulo: string;
  moneda: string;
  precio: number;
  fotos: PhotoRecord[];
  operacion: string;
  habitaciones: number;
  cochera: boolean | number;
  localidad: string;
  expensas: number | null;
  caracteristicas: string[];
  mapLat: number;
  mapLon: number;
  whatsapp: string | undefined;
  destacada: boolean;
}

/** Authoring convention: `key: true|false`. Anything else fails loudly. */
function readBooleanField(frontmatter: string, file: string, field: string): boolean {
  const match = new RegExp(`^${field}: (true|false)$`, 'm').exec(frontmatter);
  if (!match) throw new Error(`content-expectations: ${file} is missing \`${field}: true|false\``);
  return match[1] === 'true';
}

/** Authoring convention: `key: <float>` (signed). Anything else fails loudly. */
function readFloatField(frontmatter: string, file: string, field: string): number {
  const match = new RegExp(`^${field}: (-?\\d+(\\.\\d+)?)$`, 'm').exec(frontmatter);
  if (!match) throw new Error(`content-expectations: ${file} is missing \`${field}: <float>\``);
  return Number(match[1]);
}

/*
 * Authoring convention: `expensas: <integer>`, or the line absent (a
 * legitimate null per the schema — the ficha renders `No aplica`, never a
 * dropped row). A present-but-malformed line throws loudly.
 */
function readExpensasField(frontmatter: string, file: string): number | null {
  const match = /^expensas: (.*)$/m.exec(frontmatter);
  if (!match) return null;
  if (!/^\d+$/.test(match[1].trim())) {
    throw new Error(`content-expectations: ${file} has a malformed \`expensas\` line: ${match[1]}`);
  }
  return Number(match[1].trim());
}

/*
 * Authoring convention: `caracteristicas: ["slug", ...]` (inline flow list).
 * Verified uniform across the authored collection (2026-10-12); any item
 * that is not a quoted string throws loudly.
 */
function readStringListField(frontmatter: string, file: string, field: string): string[] {
  const match = new RegExp(`^${field}: \\[(.*)\\]$`, 'm').exec(frontmatter);
  if (!match) throw new Error(`content-expectations: ${file} is missing \`${field}: [...]\``);
  const inner = match[1].trim();
  if (inner === '') return [];
  return inner.split(',').map((item) => {
    const itemMatch = /^"([^"]*)"$/.exec(item.trim());
    if (!itemMatch) {
      throw new Error(`content-expectations: ${file} has a malformed \`${field}\` item: ${item}`);
    }
    return itemMatch[1];
  });
}

/*
 * The per-listing agent number. Optional to mirror the render tolerance:
 * `resolveWhatsAppHref` treats an absent number as pending (inert anchor).
 * A present-but-unquoted line throws loudly.
 */
function readWhatsAppField(frontmatter: string, file: string): string | undefined {
  const match = /^whatsapp: (.*)$/m.exec(frontmatter);
  if (!match) return undefined;
  const valueMatch = /^"([^"]+)"$/.exec(match[1].trim());
  if (!valueMatch) {
    throw new Error(`content-expectations: ${file} has a malformed \`whatsapp\` line: ${match[1]}`);
  }
  return valueMatch[1];
}

/** Authoring convention: `key: true|false|<integer>`. Anything else fails loudly. */
function readCocheraField(frontmatter: string, file: string): boolean | number {
  const match = /^cochera: (true|false|\d+)$/m.exec(frontmatter);
  if (!match) throw new Error(`content-expectations: ${file} is missing \`cochera: true|false|<integer>\``);
  if (match[1] === 'true') return true;
  if (match[1] === 'false') return false;
  return Number(match[1]);
}

/*
 * Every photo of a listing, in authored order. Authoring convention per
 * `fotos` item: `  - src: "<path>"` followed by `    titulo: "<caption>"`.
 * A `- ` item line that does not match the exact `src` shape throws loudly;
 * a missing `titulo` line falls back to `''`, mirroring the `?? ''` render
 * (see `PhotoRecord`). Verified uniform across the authored collection
 * (2026-10-12): every photo quotes both lines. An empty `fotos` block (the
 * R4 `fotos: []` contract) yields zero photos without throwing.
 */
function readFotos(frontmatter: string, file: string): PhotoRecord[] {
  const photos: PhotoRecord[] = [];
  const lines = frontmatter.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '');
    if (!/^  - /.test(line)) continue;
    const srcMatch = /^  - src: "([^"]+)"$/.exec(line);
    if (!srcMatch) {
      throw new Error(`content-expectations: ${file} has a malformed foto \`src\` line: ${line}`);
    }
    let titulo = '';
    const next = (lines[i + 1] ?? '').replace(/\r$/, '');
    if (/^    titulo: /.test(next)) {
      const tituloMatch = /^    titulo: "([^"]*)"$/.exec(next);
      if (!tituloMatch) {
        throw new Error(`content-expectations: ${file} has a malformed foto \`titulo\` line: ${next}`);
      }
      titulo = tituloMatch[1];
    }
    photos.push({ src: srcMatch[1], titulo });
  }
  return photos;
}

/*
 * Every listing in the collection, in canonical order. R9 makes collection
 * order — filename order — the rendered order, so filenames are sorted
 * explicitly instead of trusting `readdirSync` ordering.
 */
function readListings(): ListingRecord[] {
  return readdirSync(CONTENT_DIR)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => {
      const file = join(CONTENT_DIR, name);
      const frontmatter = readFrontmatter(file);
      return {
        slug: readStringField(frontmatter, file, 'slug'),
        titulo: readStringField(frontmatter, file, 'titulo'),
        moneda: readStringField(frontmatter, file, 'moneda'),
        precio: readIntegerField(frontmatter, file, 'precio'),
        fotos: readFotos(frontmatter, file),
        operacion: readStringField(frontmatter, file, 'operacion'),
        habitaciones: readIntegerField(frontmatter, file, 'habitaciones'),
        cochera: readCocheraField(frontmatter, file),
        localidad: readStringField(frontmatter, file, 'localidad'),
        expensas: readExpensasField(frontmatter, file),
        caracteristicas: readStringListField(frontmatter, file, 'caracteristicas'),
        mapLat: readFloatField(frontmatter, file, 'map_lat'),
        mapLon: readFloatField(frontmatter, file, 'map_lon'),
        whatsapp: readWhatsAppField(frontmatter, file),
        destacada: readBooleanField(frontmatter, file, 'destacada'),
      };
    });
}

/**
 * Every collection slug, in canonical (filename) order. An added/removed
 * listing requires no spec edit: per-listing loops and count assertions
 * derive from the same source the build renders.
 */
export function expectedSlugs(): string[] {
  return readListings().map((listing) => listing.slug);
}

/**
 * Expected `titulo` for every listing, keyed by `slug` — the rendered h1
 * text and the `<title>` source. A title reword passes with zero spec edits.
 */
export function expectedTitlesBySlug(): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const listing of readListings()) entries[listing.slug] = listing.titulo;
  return entries;
}

/**
 * Every listing photo, in authored order, keyed by `slug` — the gallery
 * contract source (lead/rail/counter/shape). Adding or removing a photo
 * requires no spec edit: counts, cover alt/src, and indexed photos derive
 * from the same source the build renders.
 */
export function expectedPhotosBySlug(): Record<string, PhotoRecord[]> {
  const entries: Record<string, PhotoRecord[]> = {};
  for (const listing of readListings()) entries[listing.slug] = listing.fotos;
  return entries;
}

/**
 * The single-listing probe target for structural tests (plan
 * `odd/tasks/damero-e2e-decouple-probes.md`, T1): the first listing in
 * canonical (filename) order whose gallery carries at least `minPhotos`
 * photos — the shape the probing test needs (viewer deep links, rail
 * thumbnails, template invariants). `undefined` when no listing
 * qualifies: callers skip with an explicit reason, never fall back to a
 * literal slug.
 */
export function expectedProbeSlug(minPhotos = 1): string | undefined {
  return readListings().find((listing) => listing.fotos.length >= minPhotos)?.slug;
}

/**
 * The filterable listing fields, in canonical (filename) order. Specs mirror
 * the client-side `matches()` semantics in
 * `src/pages/propiedades/index.astro` over this data (equality on
 * `operacion`/`localidad`/`moneda`, minimum on `habitaciones`, truthy
 * `cochera` per `hasCochera`, ranges within the selected currency, raw
 * numeric price sorts). A `moneda`/`operacion` flip or a price reorder
 * passes with zero spec edits.
 */
export interface ListingFilterRecord {
  slug: string;
  operacion: string;
  moneda: string;
  precio: number;
  habitaciones: number;
  cochera: boolean | number;
  localidad: string;
}

/**
 * Every listing's filterable fields — the filtering-contract source. Counts,
 * sort-first slugs, and currency price domains derive from the same source
 * the build renders.
 */
export function expectedListingFilters(): ListingFilterRecord[] {
  return readListings().map(
    ({ slug, operacion, moneda, precio, habitaciones, cochera, localidad }) => ({
      slug,
      operacion,
      moneda,
      precio,
      habitaciones,
      cochera,
      localidad,
    }),
  );
}

/**
 * Expected ficha técnica rows for every listing, keyed by `slug`. Mirrors
 * the render in `src/pages/propiedades/[slug].astro:80-88,235-255`:
 * `venta` → `Venta` (anything else → `Alquiler`), raw `habitaciones`,
 * `Sí` for `true`/positive counts (numeric counts never promise the exact
 * number), verbatim `moneda`, and `No aplica` for null/absent `expensas`
 * (the row is never dropped — R12).
 */
export function expectedFichaRowsBySlug(): Record<string, Record<string, string>> {
  const entries: Record<string, Record<string, string>> = {};
  for (const listing of readListings()) {
    entries[listing.slug] = {
      OPERACIÓN: listing.operacion === 'venta' ? 'Venta' : 'Alquiler',
      HABITACIONES: String(listing.habitaciones),
      COCHERA:
        listing.cochera === true || (typeof listing.cochera === 'number' && listing.cochera > 0)
          ? 'Sí'
          : 'No',
      MONEDA: listing.moneda,
      EXPENSAS:
        listing.expensas === null ? 'No aplica' : AMOUNT_FORMATTER.format(listing.expensas),
    };
  }
  return entries;
}

/**
 * Expected characteristic labels for every listing, keyed by `slug`. Mirrors
 * `characteristicLabel` in `src/pages/propiedades/[slug].astro:91`: slugs
 * become words, uppercased, with no dictionary.
 */
export function expectedCharacteristicLabelsBySlug(): Record<string, string[]> {
  const entries: Record<string, string[]> = {};
  for (const listing of readListings()) {
    entries[listing.slug] = listing.caracteristicas.map((value) =>
      value.replace(/-/g, ' ').toUpperCase(),
    );
  }
  return entries;
}

/**
 * Every listing's map coordinates, keyed by `slug` — the numbers that live
 * ONLY in the build-emitted per-listing JSON payloads, never in the HTML
 * (§17.2:705). Deriving them here keeps the coordinate ban and the payload
 * assertions exact when coordinates move, instead of going stale.
 */
export function expectedCoordinatesBySlug(): Record<string, { lat: number; lon: number }> {
  const entries: Record<string, { lat: number; lon: number }> = {};
  for (const listing of readListings()) {
    entries[listing.slug] = { lat: listing.mapLat, lon: listing.mapLon };
  }
  return entries;
}

/** Expected `localidad` for every listing, keyed by `slug`. */
export function expectedLocalidadesBySlug(): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const listing of readListings()) entries[listing.slug] = listing.localidad;
  return entries;
}

/*
 * Sync points with `src/data/site.ts:36,46` and `src/lib/whatsapp.ts`: the
 * stakeholder pending placeholder (digits-normalised the same way real
 * numbers are) and the inert anchor it resolves to. A `wa.me` URL never
 * ships pointing at the placeholder (R11).
 */
const PENDING_WHATSAPP_DIGITS = '5492304000000';
const WHATSAPP_URL_PENDING = '#whatsapp-pendiente';

/**
 * Expected WhatsApp CTA href for every listing, keyed by `slug`. Mirrors
 * `resolveWhatsAppHref` in `src/lib/whatsapp.ts`: the inert pending anchor
 * while the number is absent or still the placeholder, otherwise the
 * `wa.me` deep link carrying the listing title and slug. Activating a CTA
 * is then a content change, not a spec change.
 */
export function expectedWhatsAppHrefsBySlug(): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const listing of readListings()) {
    const digits = (listing.whatsapp ?? '').replace(/\D/g, '');
    if (digits === '' || digits === PENDING_WHATSAPP_DIGITS) {
      entries[listing.slug] = WHATSAPP_URL_PENDING;
    } else {
      const text = encodeURIComponent(`Hola Damero, me interesa ${listing.titulo} (${listing.slug})`);
      entries[listing.slug] = `https://wa.me/${digits}?text=${text}`;
    }
  }
  return entries;
}

/**
 * The home featured lead slug: the first `destacada` listing in canonical
 * order, else the first listing. Mirrors `src/pages/index.astro:24-26`.
 * A `destacada` flip passes with zero spec edits. An empty collection has no lead.
 */
export function expectedFeaturedLeadSlug(): string | undefined {
  const listings = readListings();
  return (listings.find((listing) => listing.destacada) ?? listings[0])?.slug;
}

/**
 * Expected price rendering for every listing in the collection, keyed by
 * `slug`. A legitimate `precio`/`moneda` edit — or an added/removed listing —
 * requires no spec edit: the expectation derives from the same source the
 * build renders.
 */
export function expectedPricesBySlug(): Record<string, PriceExpectation> {
  const entries: Record<string, PriceExpectation> = {};
  for (const listing of readListings()) {
    entries[listing.slug] = {
      currency: listing.moneda,
      amount: AMOUNT_FORMATTER.format(listing.precio),
    };
  }
  return entries;
}
