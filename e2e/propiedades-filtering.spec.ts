import { expect, test } from '@playwright/test';

/**
 * Search behaviour (ODD §17 slice S2, rulings R1/R2/R9). Covers the contract
 * points that make the page a search page: the derived `RESULTADOS · n`
 * count, client-side filtering with URL rewrite, chip removal, the empty
 * state, first-paint URL loading, the share strip, sorting, and the sheet's
 * mobile path. Viewport-gated rows follow the landing specs' skip pattern.
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

test('RESULTADOS · n is derived from the rendered set', async ({ page }) => {
  await page.goto('/propiedades');

  const rendered = await page.locator('[data-card]:visible').count();
  expect(rendered).toBeGreaterThan(0);
  await expect(page.locator('[data-results-count]')).toHaveText(`RESULTADOS · ${rendered}`);
});

test('a shared URL loads its filter state on first paint (R2)', async ({ page }) => {
  await page.goto('/propiedades?operacion=alquiler');

  await expect(page.locator('[data-results-count]')).toHaveText('RESULTADOS · 1');
  await expect(page.locator('[data-card]:visible')).toHaveCount(1);
  await expect(page.locator('.filter-chip:visible').first()).toContainText(/alquiler/i);
});

test('removing a chip re-runs the filter and rewrites the URL (§17.1:641)', async ({ page }) => {
  await page.goto('/propiedades?operacion=alquiler');
  await expect(page.locator('[data-card]:visible')).toHaveCount(1);

  await page.locator('.filter-chip:visible').first().click();

  await expect(page.locator('[data-card]:visible')).toHaveCount(3);
  await expect(page.locator('[data-results-count]')).toHaveText('RESULTADOS · 3');
  expect(page.url()).not.toContain('operacion=');
});

test('an impossible filter set renders the empty state (§17.1:664)', async ({ page }) => {
  // No alquiler listing exists in Luján: the filtered set is empty.
  await page.goto('/propiedades?operacion=alquiler&localidad=Luj%C3%A1n');

  await expect(page.locator('[data-results-count]')).toHaveText('RESULTADOS · 0');
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
    '/propiedades/lote-600-m2-apto-credito',
  );

  await page.locator('#ordenar').selectOption('precio-desc');
  await expect(page.locator('[data-card]:visible .card').first()).toHaveAttribute(
    'href',
    '/propiedades/departamento-2-amb-balcon',
  );

  expect(page.url()).not.toContain('orden');
});

test('desktop bar: filtering reduces the set and rewrites the URL (R1/R2)', async ({
  page,
  viewport,
}, testInfo) => {
  testInfo.skip(!viewport || viewport.width < 768, 'The desktop filter bar exists only ≥ 768px.');

  await page.goto('/propiedades');
  await expect(page.locator('[data-card]:visible')).toHaveCount(3);

  // OPERACIÓN segmented → Alquiler.
  await page.locator('[data-filters="desktop"] .segmented__segment', { hasText: 'Alquiler' }).click();
  await expect(page.locator('[data-card]:visible')).toHaveCount(1);
  await expect(page.locator('[data-results-count]')).toHaveText('RESULTADOS · 1');
  expect(page.url()).toContain('operacion=alquiler');
  await expect(page.locator('.search-chips .filter-chip').first()).toContainText(/alquiler/i);

  // HABITACIONES select → 3+ (minimum semantics; only the casa matches).
  await page.locator('#filter-habitaciones').selectOption('3');
  await expect(page.locator('[data-card]:visible')).toHaveCount(0);
  expect(page.url()).toContain('habitaciones=3');

  // Back to a matching combination: operacion = Todas.
  await page.locator('[data-filters="desktop"] .segmented__segment', { hasText: 'Todas' }).click();
  await expect(page.locator('[data-card]:visible')).toHaveCount(1);
  expect(page.url()).not.toContain('operacion=');

  // COCHERA checkbox.
  await page.locator('[data-filters="desktop"]').getByText('Con cochera').click();
  await expect(page.locator('[data-card]:visible')).toHaveCount(1);
  expect(page.url()).toContain('cochera=si');

  // LOCALIDAD select.
  await page.locator('#filter-localidad').selectOption('Mercedes');
  await expect(page.locator('[data-card]:visible')).toHaveCount(0);
  expect(page.url()).toContain('localidad=Mercedes');

  // R2: only the eight canonical params ever appear.
  const keys = [...new URL(page.url()).searchParams.keys()];
  for (const key of keys) {
    expect(ALLOWED_PARAMS).toContain(key);
  }

  // Limpiar filtros resets everything.
  await page.locator('.filter-bar__clear').click();
  await expect(page.locator('[data-card]:visible')).toHaveCount(3);
  await expect(page.locator('[data-results-count]')).toHaveText('RESULTADOS · 3');
  expect(new URL(page.url()).search).toBe('');
});

test('desktop bar: the price range filters within the selected currency only (§17.1:633)', async ({
  page,
  viewport,
}, testInfo) => {
  testInfo.skip(!viewport || viewport.width < 768, 'The desktop filter bar exists only ≥ 768px.');

  await page.goto('/propiedades');

  // Narrow the USD range to 50.000–95.000: the lote (32.000) drops out and so
  // does the ARS listing — the range never reaches across currencies.
  await page
    .locator('[data-filters="desktop"] [data-price-pane="USD"] [data-price-range-min]')
    .fill('50000');

  await expect(page.locator('[data-card]:visible')).toHaveCount(1);
  expect(page.url()).toContain('precio_min=50000');
  // The active range serialises both bounds (they round-trip to the same state).
  expect(page.url()).toContain('precio_max=95000');
  await expect(page.locator('.search-chips .filter-chip').first()).toContainText(
    /USD 50\.000–95\.000/,
  );

  // Switching MONEDA re-derives the range and drops the price params: a
  // carried-over range would imply a conversion (§17.1:633).
  await page.locator('[data-filters="desktop"] .segmented__segment', { hasText: 'ARS' }).click();
  expect(page.url()).toContain('moneda=ARS');
  expect(page.url()).not.toContain('precio_min=');
  // Moneda alone never filters the set — it scopes the range.
  await expect(page.locator('[data-card]:visible')).toHaveCount(3);
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

  await expect(page.locator('[data-results-count]')).toHaveText('RESULTADOS · 1');
  await expect(page.locator('[data-sheet-count-label]')).toHaveText('Ver 1 propiedad');
  await expect(page.locator('[data-filter-count-badge]')).toHaveText('1');
  expect(page.url()).toContain('operacion=alquiler');

  // The applied chip renders in the collapsed bar's rail.
  await expect(page.locator('.mobile-bar__rail .filter-chip').first()).toContainText(/alquiler/i);

  // The sheet's only primary action closes it.
  await page.locator('.sheet__apply').click();
  await expect(page.locator('[data-sheet]')).toBeHidden();
});
