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
 * derivation. T4–T5 extend this module (ficha rows, filtering ranges).
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
