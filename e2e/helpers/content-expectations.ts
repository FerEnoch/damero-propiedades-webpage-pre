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
 * T1 scope: price/currency derivation only. T2–T5 extend this module
 * (titles/slugs, gallery counts, ficha rows, filtering ranges).
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
 * Expected price rendering for every listing in the collection, keyed by
 * `slug`. A legitimate `precio`/`moneda` edit — or an added/removed listing —
 * requires no spec edit: the expectation derives from the same source the
 * build renders.
 */
export function expectedPricesBySlug(): Record<string, PriceExpectation> {
  const entries: Record<string, PriceExpectation> = {};
  for (const name of readdirSync(CONTENT_DIR)) {
    if (!name.endsWith('.md')) continue;
    const file = join(CONTENT_DIR, name);
    const frontmatter = readFrontmatter(file);
    const slug = readStringField(frontmatter, file, 'slug');
    const currency = readStringField(frontmatter, file, 'moneda');
    const precio = readIntegerField(frontmatter, file, 'precio');
    entries[slug] = { currency, amount: AMOUNT_FORMATTER.format(precio) };
  }
  return entries;
}
