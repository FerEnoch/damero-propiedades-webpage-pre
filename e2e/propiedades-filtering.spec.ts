import { expect, test } from '@playwright/test';
import {
  expectedListingFilters,
  type ListingFilterRecord,
} from './helpers/content-expectations';

/**
 * Search behaviour (ODD §17 slice S2 + CF-01, rulings R1/R2/R9). Covers the
 * contract points that make the page a search page: the derived
 * `RESULTADOS · n` count, client-side filtering with URL rewrite, the
 * three-state currency filter (`Todas` / `ARS` / `USD`) and its disabled
 * price range, chip removal, the empty state, first-paint URL loading, the
 * share strip, sorting, and the sheet's mobile path. Viewport-gated rows
 * follow the landing specs' skip pattern.
 */

const ALLOWED_PARAMS = [
  'operacion',
  'habitaciones',
  'cochera',
  'tipo',
  'precio_min',
  'precio_max',
  'localidad',
  'moneda',
];

/*
 * Filtering expectations derive from the collection (plan
 * `odd/tasks/damero-e2e-decouple.md`, T4) — the same source the build
 * renders. The predicates below mirror the client-side `matches()` in
 * `src/pages/propiedades/index.astro`: equality on
 * operacion/localidad/moneda, minimum (`>=`) on habitaciones, truthy cochera
 * per `hasCochera` (index.astro:117-118), ranges clamped to the selected
 * currency's `[min, max]` domain (§17.1:633), and raw numeric price sorts
 * with collection-order tiebreaks (R9). A moneda/operacion flip or a price
 * reorder passes with zero spec edits. The narrowed `precio_min`
 * (USD_NARROW_MIN) derives from the USD domain itself: the cutoff is a
 * chosen user action, not business data, and the choice tracks the domain
 * when content changes.
 */
const LISTINGS = expectedListingFilters();
const TOTAL = LISTINGS.length;
const countWhere = (pred: (listing: ListingFilterRecord) => boolean): number =>
  LISTINGS.filter(pred).length;
/** Mirrors `hasCochera` in `src/pages/propiedades/index.astro:117-118`. */
const hasCochera = (cochera: boolean | number): boolean =>
  cochera === true || (typeof cochera === 'number' && cochera > 0);
const ALQUILER = countWhere((listing) => listing.operacion === 'alquiler');
const ARS = countWhere((listing) => listing.moneda === 'ARS');
const USD = countWhere((listing) => listing.moneda === 'USD');
const HAB_MIN = countWhere((listing) => listing.habitaciones >= 3);
const HAB_MIN_ALQUILER = countWhere(
  (listing) => listing.habitaciones >= 3 && listing.operacion === 'alquiler',
);
const HAB_MIN_COCHERA = countWhere(
  (listing) => listing.habitaciones >= 3 && hasCochera(listing.cochera),
);
/*
 * The LOCALIDAD probe mirrors the page's option domain (index.astro:60:
 * the select offers exactly the collection's distinct localidades): the
 * pick is the first distinct localidad in canonical order. The expected
 * count after selecting it composes the same predicates the page
 * composes — min habitaciones, truthy cochera, equality on localidad.
 */
const LOCALIDAD_PICK = [...new Set(LISTINGS.map((listing) => listing.localidad))][0];
const HAB_MIN_COCHERA_LOCALIDAD = countWhere(
  (listing) =>
    listing.habitaciones >= 3 &&
    hasCochera(listing.cochera) &&
    listing.localidad === LOCALIDAD_PICK,
);
const ALQUILER_COCHERA = countWhere(
  (listing) => listing.operacion === 'alquiler' && hasCochera(listing.cochera),
);
/* Raw numeric sorts (never a currency conversion), ties keep collection order. */
const SORT_ASC_FIRST = [...LISTINGS].sort((a, b) => a.precio - b.precio)[0].slug;
const SORT_DESC_FIRST = [...LISTINGS].sort((a, b) => b.precio - a.precio)[0].slug;
/*
 * The USD price domain `[min, max]` (index.astro:82-89). The narrowing cutoff
 * derives from the domain itself: the first step-aligned value above the
 * domain min (PriceRange default step = 1000, PriceRange.astro:52) that drops
 * at least one USD listing; `undefined` on a single-point domain, in which
 * case the narrowing tests skip with an explicit reason instead of filling
 * an out-of-domain value. Filling `min=C` serialises `precio_max` as the
 * domain max.
 */
const USD_PRICES = LISTINGS.filter((listing) => listing.moneda === 'USD').map(
  (listing) => listing.precio,
);
const USD_MAX = Math.max(...USD_PRICES);
const USD_MIN = Math.min(...USD_PRICES);
/* Mirrors the PriceRange default step (src/components/PriceRange.astro:52). */
const RANGE_STEP = 1000;
const USD_NARROW_MIN: number | undefined = (() => {
  for (let cutoff = USD_MIN + RANGE_STEP; cutoff <= USD_MAX; cutoff += RANGE_STEP) {
    if (USD_PRICES.some((price) => price < cutoff)) return cutoff;
  }
  if (USD_PRICES.some((price) => price < USD_MAX)) return USD_MAX;
  return undefined;
})();
const USD_IN_RANGE =
  USD_NARROW_MIN === undefined
    ? 0
    : countWhere(
        (listing) =>
          listing.moneda === 'USD' &&
          listing.precio >= USD_NARROW_MIN &&
          listing.precio <= USD_MAX,
      );
const AMOUNT_FORMAT = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rangeChip = (narrow: number): RegExp =>
  new RegExp(
    `USD ${escapeRegExp(AMOUNT_FORMAT.format(narrow))}–${escapeRegExp(AMOUNT_FORMAT.format(USD_MAX))}`,
  );

test('RESULTADOS · n is derived from the rendered set', async ({ page }) => {
  await page.goto('/propiedades');

  const rendered = await page.locator('[data-card]:visible').count();
  expect(rendered).toBeGreaterThan(0);
  await expect(page.locator('[data-results-count]')).toHaveText(`RESULTADOS · ${rendered}`);
});

test('a shared URL loads its filter state on first paint (R2)', async ({ page }) => {
  await page.goto('/propiedades?operacion=alquiler');

  await expect(page.locator('[data-results-count]')).toHaveText(`RESULTADOS · ${ALQUILER}`);
  await expect(page.locator('[data-card]:visible')).toHaveCount(ALQUILER);
  await expect(page.locator('.filter-chip:visible').first()).toContainText(/alquiler/i);
});

test('removing a chip re-runs the filter and rewrites the URL (§17.1:641)', async ({ page }) => {
  await page.goto('/propiedades?operacion=alquiler');
  await expect(page.locator('[data-card]:visible')).toHaveCount(ALQUILER);

  await page.locator('.filter-chip:visible').first().click();

  await expect(page.locator('[data-card]:visible')).toHaveCount(TOTAL);
  await expect(page.locator('[data-results-count]')).toHaveText(`RESULTADOS · ${TOTAL}`);
  expect(page.url()).not.toContain('operacion=');
});

test('an impossible filter set renders the empty state (§17.1:664)', async ({ page }) => {
  // No alquiler listing has cochera: the filtered set is empty.
  await page.goto('/propiedades?operacion=alquiler&cochera=si');

  await expect(page.locator('[data-results-count]')).toHaveText(`RESULTADOS · ${ALQUILER_COCHERA}`);
  await expect(page.locator('[data-results-grid]')).toBeHidden();

  const emptyState = page.locator('.empty-state');
  await expect(emptyState).toBeVisible();
  await expect(emptyState.locator('.empty-state__title')).toHaveText(
    'No encontramos propiedades con esos filtros.',
  );

  // It is a designed state, not an apology (§17.1:667).
  const text = await page.evaluate(() => document.body.innerText);
  expect(/lo sentimos/i.test(text)).toBe(false);
});

test('the empty state stays hidden while results exist', async ({ page }) => {
  await page.goto('/propiedades');
  await expect(page.locator('.empty-state')).toBeHidden();
});

test('the share strip shows the current URL and tracks filter changes', async ({ page }) => {
  await page.goto('/propiedades?operacion=venta');

  const field = page.locator('[data-share-field]');
  await expect(field).toContainText('/propiedades');
  await expect(field).toContainText('operacion=venta');
  await expect(field).toHaveAttribute('title', '/propiedades?operacion=venta');
});

test('the copy action writes the live URL to the clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/propiedades?operacion=venta');

  await page.locator('.search-share__button').click();

  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toBe(page.url());
  await expect(page.locator('[data-share-status]')).toHaveText('Enlace copiado al portapapeles');
});

test('Ordenar reorders the grid and is never written to the URL (R2/R9)', async ({ page }) => {
  await page.goto('/propiedades');

  await page.locator('#ordenar').selectOption('precio-asc');
  await expect(page.locator('[data-card]:visible .card').first()).toHaveAttribute(
    'href',
    `/propiedades/${SORT_ASC_FIRST}`,
  );

  await page.locator('#ordenar').selectOption('precio-desc');
  await expect(page.locator('[data-card]:visible .card').first()).toHaveAttribute(
    'href',
    `/propiedades/${SORT_DESC_FIRST}`,
  );

  expect(page.url()).not.toContain('orden');
});

test('Todas is the default currency: every listing, inert range, no currency chip', async ({
  page,
}) => {
  await page.goto('/propiedades');

  // Canonical default: no `moneda` parameter, `Todas` checked in the control.
  expect(new URL(page.url()).searchParams.has('moneda')).toBe(false);
  await expect(
    page.locator('[data-filters="desktop"] [data-filter-key="moneda"] input[value=""]'),
  ).toBeChecked();
  await expect(page.locator('[data-card]:visible')).toHaveCount(TOTAL);
  await expect(page.locator('[data-results-count]')).toHaveText(`RESULTADOS · ${TOTAL}`);

  // The price range is inert under Todas: one pane only, USD stand-in disabled.
  const usdPane = page.locator('[data-filters="desktop"] [data-price-pane="USD"]');
  await expect(usdPane.locator('[data-price-range-min]')).toBeDisabled();
  await expect(usdPane.locator('[data-price-range-max]')).toBeDisabled();
  await expect(page.locator('[data-filters="desktop"] [data-price-pane="ARS"]')).toBeHidden();

  // `Todas` is not a filter: no chip, no badge count.
  await expect(page.locator('.filter-chip:visible')).toHaveCount(0);
});

test('desktop bar: the stand-in range is visible but disabled under Todas', async ({
  page,
  viewport,
}, testInfo) => {
  testInfo.skip(!viewport || viewport.width < 768, 'The desktop filter bar exists only ≥ 768px.');

  await page.goto('/propiedades');

  const usdPane = page.locator('[data-filters="desktop"] [data-price-pane="USD"]');
  await expect(usdPane).toBeVisible();
  await expect(usdPane.locator('[data-price-range-min]')).toBeDisabled();
  await expect(usdPane.locator('[data-price-range-max]')).toBeDisabled();
  await expect(page.locator('[data-filters="desktop"] [data-price-pane="ARS"]')).toBeHidden();
});

test('an explicit moneda=Todas URL canonicalises to no moneda parameter', async ({ page }) => {
  await page.goto('/propiedades?moneda=Todas');

  await expect(page.locator('[data-card]:visible')).toHaveCount(TOTAL);
  expect(new URL(page.url()).searchParams.has('moneda')).toBe(false);
  await expect(
    page.locator('[data-filters="desktop"] [data-filter-key="moneda"] input[value=""]'),
  ).toBeChecked();
});

test('price bounds in a Todas URL never narrow the all-currency set', async ({ page }) => {
  // Stale bounds from an old link: no currency means no range applies, and
  // the params are rewritten away so the shared URL stays canonical (CF-01).
  await page.goto(`/propiedades?precio_min=${USD_MIN}&precio_max=${USD_MAX}`);

  await expect(page.locator('[data-card]:visible')).toHaveCount(TOTAL);
  await expect(page.locator('[data-results-count]')).toHaveText(`RESULTADOS · ${TOTAL}`);
  const params = new URL(page.url()).searchParams;
  expect(params.has('precio_min')).toBe(false);
  expect(params.has('precio_max')).toBe(false);
  await expect(
    page.locator('[data-filters="desktop"] [data-filter-key="moneda"] input[value=""]'),
  ).toBeChecked();
});

test('explicit currency URLs filter the set and survive a reload', async ({ page }) => {
  await page.goto('/propiedades?moneda=ARS');

  // The ARS listings only; the currency counts as an active filter.
  await expect(page.locator('[data-card]:visible')).toHaveCount(ARS);
  await expect(page.locator('[data-results-count]')).toHaveText(`RESULTADOS · ${ARS}`);
  await expect(page.locator('.search-chips .filter-chip').first()).toContainText('Moneda ARS');
  expect(new URL(page.url()).searchParams.get('moneda')).toBe('ARS');

  // The ARS pane is the one shown, and it is interactive again. (Attribute
  // state, not computed visibility: at mobile widths the desktop bar itself
  // is display:none and visibility is asserted in the viewport-gated rows.)
  const arsPane = page.locator('[data-filters="desktop"] [data-price-pane="ARS"]');
  await expect(arsPane).not.toHaveAttribute('hidden', '');
  await expect(arsPane.locator('[data-price-range-min]')).toBeEnabled();
  await expect(page.locator('[data-filters="desktop"] [data-price-pane="USD"]')).toHaveAttribute(
    'hidden',
    '',
  );

  // Reload restores the same state (R2: the URL is the source of truth).
  await page.reload();
  await expect(page.locator('[data-card]:visible')).toHaveCount(ARS);
  await expect(
    page.locator('[data-filters="desktop"] [data-filter-key="moneda"] input[value="ARS"]'),
  ).toBeChecked();
  expect(new URL(page.url()).searchParams.get('moneda')).toBe('ARS');

  await page.goto('/propiedades?moneda=USD');
  await expect(page.locator('[data-card]:visible')).toHaveCount(USD);
  await expect(page.locator('[data-results-count]')).toHaveText(`RESULTADOS · ${USD}`);
  await expect(page.locator('.search-chips .filter-chip').first()).toContainText('Moneda USD');
});

test('desktop bar: the price range filters within the selected currency only (§17.1:633)', async ({
  page,
  viewport,
}, testInfo) => {
  testInfo.skip(!viewport || viewport.width < 768, 'The desktop filter bar exists only ≥ 768px.');
  test.skip(
    USD_NARROW_MIN === undefined,
    'USD domain is a single point; the range cannot narrow',
  );
  const narrow = USD_NARROW_MIN!;

  // The range is only reachable inside a currency: pick USD first.
  await page.goto('/propiedades?moneda=USD');
  await expect(page.locator('[data-card]:visible')).toHaveCount(USD);

  // Narrow the USD range to <derived cutoff just above the domain min>–<domain max>:
  // the cheapest USD listing drops out.
  await page
    .locator('[data-filters="desktop"] [data-price-pane="USD"] [data-price-range-min]')
    .fill(String(narrow));

  await expect(page.locator('[data-card]:visible')).toHaveCount(USD_IN_RANGE);
  expect(page.url()).toContain('moneda=USD');
  expect(page.url()).toContain(`precio_min=${narrow}`);
  // The active range serialises both bounds (they round-trip to the same state).
  expect(page.url()).toContain(`precio_max=${USD_MAX}`);
  await expect(page.locator('.search-chips .filter-chip').first()).toContainText('Moneda USD');
  await expect(page.locator('.search-chips .filter-chip').nth(1)).toContainText(rangeChip(narrow));

  // Switching MONEDA re-derives the range and drops the price params: a
  // carried-over range would imply a conversion (§17.1:633).
  await page
    .locator('[data-filters="desktop"] [data-filter-key="moneda"] .segmented__segment', {
      hasText: 'ARS',
    })
    .click();
  expect(page.url()).toContain('moneda=ARS');
  expect(page.url()).not.toContain('precio_min=');
  // A currency filters the set by itself (CF-01).
  await expect(page.locator('[data-card]:visible')).toHaveCount(ARS);
});

test('switching into Todas clears price bounds and the moneda parameter', async ({
  page,
  viewport,
}, testInfo) => {
  testInfo.skip(!viewport || viewport.width < 768, 'The desktop filter bar exists only ≥ 768px.');
  test.skip(
    USD_NARROW_MIN === undefined,
    'USD domain is a single point; the range cannot narrow',
  );
  const narrow = USD_NARROW_MIN!;

  await page.goto(`/propiedades?moneda=USD&precio_min=${narrow}&precio_max=${USD_MAX}`);
  await expect(page.locator('[data-card]:visible')).toHaveCount(USD_IN_RANGE);

  await page
    .locator('[data-filters="desktop"] [data-filter-key="moneda"] .segmented__segment', {
      hasText: 'Todas',
    })
    .click();

  // Stale bounds cannot narrow the all-currency set: both are gone.
  await expect(page.locator('[data-card]:visible')).toHaveCount(TOTAL);
  const params = new URL(page.url()).searchParams;
  expect(params.has('moneda')).toBe(false);
  expect(params.has('precio_min')).toBe(false);
  expect(params.has('precio_max')).toBe(false);

  // Back to the inert stand-in pane.
  const usdPane = page.locator('[data-filters="desktop"] [data-price-pane="USD"]');
  await expect(usdPane).toBeVisible();
  await expect(usdPane.locator('[data-price-range-min]')).toBeDisabled();
  await expect(page.locator('.search-chips .filter-chip')).toHaveCount(0);
});

test('removing the currency chip returns to Todas and clears the price bounds', async ({
  page,
}) => {
  test.skip(
    USD_NARROW_MIN === undefined,
    'USD domain is a single point; the range cannot narrow',
  );
  const narrow = USD_NARROW_MIN!;

  await page.goto(`/propiedades?moneda=USD&precio_min=${narrow}&precio_max=${USD_MAX}`);
  await expect(page.locator('.search-chips .filter-chip')).toHaveCount(2);

  // Chip order follows the control order: MONEDA first, PRECIO second.
  await page.locator('.filter-chip:visible').first().click();

  await expect(page.locator('[data-card]:visible')).toHaveCount(TOTAL);
  const params = new URL(page.url()).searchParams;
  expect(params.has('moneda')).toBe(false);
  expect(params.has('precio_min')).toBe(false);
  expect(params.has('precio_max')).toBe(false);
  await expect(page.locator('.search-chips .filter-chip')).toHaveCount(0);
});

test('desktop bar: filtering reduces the set and rewrites the URL (R1/R2)', async ({
  page,
  viewport,
}, testInfo) => {
  testInfo.skip(!viewport || viewport.width < 768, 'The desktop filter bar exists only ≥ 768px.');

  await page.goto('/propiedades');
  await expect(page.locator('[data-card]:visible')).toHaveCount(TOTAL);

  // OPERACIÓN segmented → Alquiler (scoped: MONEDA also offers `Todas`).
  await page.locator('[data-filters="desktop"] .segmented__segment', { hasText: 'Alquiler' }).click();
  await expect(page.locator('[data-card]:visible')).toHaveCount(ALQUILER);
  await expect(page.locator('[data-results-count]')).toHaveText(`RESULTADOS · ${ALQUILER}`);
  expect(page.url()).toContain('operacion=alquiler');
  await expect(page.locator('.search-chips .filter-chip').first()).toContainText(/alquiler/i);

  // HABITACIONES select → 3+ (minimum semantics; the 3+ listings that are
  // venta make the alquiler intersection derive to its collection count).
  await page.locator('#filter-habitaciones').selectOption('3');
  await expect(page.locator('[data-card]:visible')).toHaveCount(HAB_MIN_ALQUILER);
  expect(page.url()).toContain('habitaciones=3');

  // Back to a matching combination: operacion = Todas.
  await page
    .locator('[data-filters="desktop"] [data-filter-key="operacion"] .segmented__segment', {
      hasText: 'Todas',
    })
    .click();
  await expect(page.locator('[data-card]:visible')).toHaveCount(HAB_MIN);
  expect(page.url()).not.toContain('operacion=');

  // COCHERA checkbox (of the 3+ listings only the cochera ones remain).
  await page.locator('[data-filters="desktop"]').getByText('Con cochera').click();
  await expect(page.locator('[data-card]:visible')).toHaveCount(HAB_MIN_COCHERA);
  expect(page.url()).toContain('cochera=si');

  // LOCALIDAD select — the pick is a collection localidad, so it is a real
  // option; the URL carries it URLSearchParams-encoded.
  await page.locator('#filter-localidad').selectOption(LOCALIDAD_PICK);
  await expect(page.locator('[data-card]:visible')).toHaveCount(HAB_MIN_COCHERA_LOCALIDAD);
  expect(new URL(page.url()).searchParams.get('localidad')).toBe(LOCALIDAD_PICK);

  // R2: only the eight canonical params ever appear.
  const keys = [...new URL(page.url()).searchParams.keys()];
  for (const key of keys) {
    expect(ALLOWED_PARAMS).toContain(key);
  }

  // Limpiar filtros resets everything.
  await page.locator('.filter-bar__clear').click();
  await expect(page.locator('[data-card]:visible')).toHaveCount(TOTAL);
  await expect(page.locator('[data-results-count]')).toHaveText(`RESULTADOS · ${TOTAL}`);
  expect(new URL(page.url()).search).toBe('');
});

test('mobile sheet: filtering from the sheet updates results, badge and URL', async ({
  page,
  viewport,
}, testInfo) => {
  testInfo.skip(
    !viewport || viewport.width >= 768,
    'The bottom sheet exists only below 768px (§17.1:635).',
  );

  await page.goto('/propiedades');

  await page.locator('[data-sheet-open]').click();
  await expect(page.locator('[data-sheet]')).toBeVisible();

  await page.locator('[data-filters="sheet"] .segmented__segment', { hasText: 'Alquiler' }).click();

  await expect(page.locator('[data-results-count]')).toHaveText(`RESULTADOS · ${ALQUILER}`);
  await expect(page.locator('[data-sheet-count-label]')).toHaveText(`Ver ${ALQUILER} propiedades`);
  await expect(page.locator('[data-filter-count-badge]')).toHaveText('1');
  expect(page.url()).toContain('operacion=alquiler');

  // The applied chip renders in the collapsed bar's rail.
  await expect(page.locator('.mobile-bar__rail .filter-chip').first()).toContainText(/alquiler/i);

  // The sheet's only primary action closes it.
  await page.locator('.sheet__apply').click();
  await expect(page.locator('[data-sheet]')).toBeHidden();
});

test('mobile sheet: currency filter and its disabled range stay coherent', async ({
  page,
  viewport,
}, testInfo) => {
  testInfo.skip(
    !viewport || viewport.width >= 768,
    'The bottom sheet exists only below 768px (§17.1:635).',
  );

  await page.goto('/propiedades');
  await page.locator('[data-sheet-open]').click();

  // Under Todas the sheet's price range is visible but inert.
  const standInPane = page.locator('[data-filters="sheet"] [data-price-pane="USD"]');
  await expect(standInPane).toBeVisible();
  await expect(standInPane.locator('[data-price-range-min]')).toBeDisabled();
  await expect(page.locator('[data-filters="sheet"] [data-price-pane="ARS"]')).toBeHidden();

  // ARS filters the set and counts as one active filter in the badge.
  await page
    .locator('[data-filters="sheet"] [data-filter-key="moneda"] .segmented__segment', {
      hasText: 'ARS',
    })
    .click();

  await expect(page.locator('[data-results-count]')).toHaveText(`RESULTADOS · ${ARS}`);
  await expect(page.locator('[data-sheet-count-label]')).toHaveText(`Ver ${ARS} propiedades`);
  await expect(page.locator('[data-filter-count-badge]')).toHaveText('1');
  expect(new URL(page.url()).searchParams.get('moneda')).toBe('ARS');
  await expect(page.locator('.mobile-bar__rail .filter-chip').first()).toContainText('Moneda ARS');

  const arsPane = page.locator('[data-filters="sheet"] [data-price-pane="ARS"]');
  await expect(arsPane).toBeVisible();
  await expect(arsPane.locator('[data-price-range-min]')).toBeEnabled();

  // Back to Todas: the currency filter and its chip disappear.
  await page
    .locator('[data-filters="sheet"] [data-filter-key="moneda"] .segmented__segment', {
      hasText: 'Todas',
    })
    .click();

  await expect(page.locator('[data-card]:visible')).toHaveCount(TOTAL);
  await expect(page.locator('[data-filter-count-badge]')).toBeHidden();
  expect(new URL(page.url()).searchParams.has('moneda')).toBe(false);
  await expect(page.locator('.mobile-bar__rail .filter-chip')).toHaveCount(0);
  await expect(standInPane.locator('[data-price-range-min]')).toBeDisabled();
});
