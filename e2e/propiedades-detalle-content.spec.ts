import { expect, test } from '@playwright/test';

/**
 * Detail page content rules (ODD §17 slice S3): R4's gallery degradation,
 * R12's ficha técnica rows, the always-present currency code (§17.2:690),
 * the no-dictionary characteristics labels (§17.2:686), the CTA placement
 * and mutual exclusion per viewport (§17.2:697-699), and the map fallback
 * state (§17.2:708-709) — exercised deterministically with the basemap
 * provider aborted, so no spec depends on live tiles.
 */

const SLUGS = [
  'casa-3-amb-guadalupe-santa-fe',
  'departamento-2-amb-centro-santa-fe',
  'departamento-3-amb-barrio-norte-santa-fe',
  'lote-600-m2-candioti-santa-fe',
] as const;

test.beforeEach(async ({ page }) => {
  await page.route(/openfreemap/, (route) => route.abort());
});

test('R4: with fotos: [] the gallery shows the brand tile and omits rail and counter', async ({
  page,
}) => {
  for (const slug of SLUGS) {
    await page.goto(`/propiedades/${slug}`);

    // The brand placeholder renders — never a fabricated photograph (§7).
    await expect(page.locator('.gallery__lead .damero-placeholder')).toBeVisible();
    await expect(page.locator('.gallery__lead img')).toHaveCount(0);

    // R4: no rail, no thumbnails, and never an invented `1 / 5`.
    await expect(page.locator('[data-gallery-rail]')).toHaveCount(0);
    await expect(page.locator('[data-gallery-thumb]')).toHaveCount(0);
    await expect(page.locator('[data-gallery-counter]')).toHaveCount(0);
  }
});

test('the price renders with the currency code always present (§17.2:690)', async ({ page }) => {
  const prices: Record<string, { currency: string; amount: string }> = {
    'casa-3-amb-guadalupe-santa-fe': { currency: 'USD', amount: '118.000' },
    'departamento-2-amb-centro-santa-fe': { currency: 'ARS', amount: '480.000' },
    'departamento-3-amb-barrio-norte-santa-fe': { currency: 'USD', amount: '92.000' },
    'lote-600-m2-candioti-santa-fe': { currency: 'USD', amount: '30.000' },
  };

  for (const [slug, expected] of Object.entries(prices)) {
    await page.goto(`/propiedades/${slug}`);
    await expect(page.locator('.price-panel__currency')).toHaveText(expected.currency);
    await expect(page.locator('.price-panel__value')).toHaveText(expected.amount);
  }
});

test('R12: the ficha técnica rows degrade gracefully and never drop a row', async ({ page }) => {
  const expectations: Record<string, Record<string, string>> = {
    'casa-3-amb-guadalupe-santa-fe': {
      OPERACIÓN: 'Venta',
      HABITACIONES: '3',
      COCHERA: 'Sí',
      MONEDA: 'USD',
      EXPENSAS: 'No aplica',
    },
    'departamento-2-amb-centro-santa-fe': {
      OPERACIÓN: 'Alquiler',
      HABITACIONES: '2',
      COCHERA: 'No',
      MONEDA: 'ARS',
      EXPENSAS: '52.000',
    },
    'departamento-3-amb-barrio-norte-santa-fe': {
      OPERACIÓN: 'Venta',
      HABITACIONES: '3',
      COCHERA: 'No',
      MONEDA: 'USD',
      EXPENSAS: '38.000',
    },
    'lote-600-m2-candioti-santa-fe': {
      OPERACIÓN: 'Venta',
      HABITACIONES: '0',
      COCHERA: 'No',
      MONEDA: 'USD',
      EXPENSAS: 'No aplica',
    },
  };

  for (const [slug, rows] of Object.entries(expectations)) {
    await page.goto(`/propiedades/${slug}`);

    // Every row renders — `expensas` null/absent is `No aplica`, never a
    // dropped row (§17.2:693).
    const rendered = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.price-panel__row')).map((row) => ({
        label: row.querySelector('dt')?.textContent?.trim() ?? '',
        value: row.querySelector('dd')?.textContent?.trim() ?? '',
      })),
    );
    const renderedMap = Object.fromEntries(rendered.map((row) => [row.label, row.value]));
    expect(renderedMap, `${slug} ficha rows`).toEqual(rows);
  }
});

test('characteristics render the slugs as uppercase words, no dictionary (§17.2:686)', async ({
  page,
}) => {
  const expectations: Record<string, string[]> = {
    'casa-3-amb-guadalupe-santa-fe': ['PATIO', 'PARRILLA'],
    'departamento-2-amb-centro-santa-fe': ['BALCON'],
    'departamento-3-amb-barrio-norte-santa-fe': ['BALCON', 'LUMINOSO'],
    // The unknown `apto-credito` slug still renders — never dropped.
    'lote-600-m2-candioti-santa-fe': ['APTO CREDITO'],
  };

  for (const [slug, labels] of Object.entries(expectations)) {
    await page.goto(`/propiedades/${slug}`);
    const rendered = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.characteristics__item')).map((item) =>
        (item.textContent ?? '').trim(),
      ),
    );
    expect(rendered, `${slug} characteristics`).toEqual(labels);

    // Labels, not controls: no button, no link, no × affordance (§17.2:685).
    await expect(page.locator('.characteristics__list button')).toHaveCount(0);
    await expect(page.locator('.characteristics__list a')).toHaveCount(0);
  }
});

test('exactly one primary action per viewport (§17.2:697-699)', async ({ page, viewport }) => {
  await page.goto('/propiedades/casa-3-amb-guadalupe-santa-fe');

  const inlineCta = page.locator('.price-panel__cta .whatsapp-cta');
  const stickyBar = page.locator('.whatsapp-sticky__link');

  if (viewport && viewport.width >= 768) {
    // Desktop: the CTA sits inside the price panel; no sticky bar exists.
    await expect(inlineCta).toBeVisible();
    await expect(stickyBar).toBeHidden();
    await expect(inlineCta).toHaveAttribute('href', '#whatsapp-pendiente');
  } else {
    // Mobile: the sticky bar takes over; the in-flow CTA is omitted.
    await expect(inlineCta).toBeHidden();
    await expect(stickyBar).toBeVisible();
    await expect(stickyBar).toHaveAttribute('href', '#whatsapp-pendiente');
  }
});

test('the map fallback keeps the frame, caption and role=status with the style aborted', async ({
  page,
}) => {
  await page.goto('/propiedades/casa-3-amb-guadalupe-santa-fe');

  const frame = page.locator('.map-frame');
  const fallback = page.locator('[data-map-fallback]');
  const canvas = page.locator('[data-map-canvas]');
  const retry = fallback.getByRole('button', { name: 'Reintentar' });

  // The fallback is the default, honest state (JS or style failure).
  await expect(frame).toBeVisible();
  await expect(fallback).toBeVisible();
  await expect(fallback).toHaveAttribute('role', 'status');
  await expect(fallback.locator('svg.map-fallback__icon')).toBeVisible();
  await expect(fallback.locator('svg.map-fallback__icon')).toHaveAttribute('aria-hidden', 'true');
  await expect(
    fallback.getByText('Ubicación no disponible momentáneamente.'),
  ).toBeVisible();
  await expect(retry).toBeVisible();

  // The caption stays in every state (§17.2:708).
  await expect(page.getByText('ZONA APROXIMADA · RADIO 400 M')).toBeVisible();

  /*
   * Scroll the frame into view: the init runs, the coordinates arrive via
   * the build-emitted JSON, but the basemap request is aborted — so the
   * fallback must persist. It is not an error dialog and never names the
   * tile provider (§17.2:709-710).
   */
  const payloadResponse = page.waitForResponse(/\/propiedades\/casa-3-amb-guadalupe-santa-fe\.json/);
  await frame.scrollIntoViewIfNeeded();
  await payloadResponse;
  await page.waitForRequest(/openfreemap/).catch(() => null);
  await page.waitForTimeout(400);

  await expect(fallback).toBeVisible();
  await expect(canvas).not.toBeVisible();
  await expect(page.getByText('ZONA APROXIMADA · RADIO 400 M')).toBeVisible();

  // `Reintentar` retries the init; with the style still aborted the
  // fallback simply persists.
  await retry.click();
  await page.waitForTimeout(400);
  await expect(fallback).toBeVisible();
  await expect(canvas).not.toBeVisible();

  const fallbackText = await fallback.innerText();
  expect(fallbackText).not.toMatch(/openfreemap|openstreetmap|maplibre/i);
});

test('the approximate-zone note is added on mobile only (§17.2:708)', async ({
  page,
  viewport,
}) => {
  await page.goto('/propiedades/casa-3-amb-guadalupe-santa-fe');

  const note = page.getByText('La zona se muestra como referencia aproximada.');
  if (viewport && viewport.width >= 768) {
    await expect(note).toBeHidden();
  } else {
    await expect(note).toBeVisible();
  }
});

test('the map container carries a meaningful accessible name (§12, §17.2:710)', async ({
  page,
}) => {
  await page.goto('/propiedades/casa-3-amb-guadalupe-santa-fe');

  await expect(page.locator('[data-map-canvas]')).toHaveAttribute('role', 'region');
  await expect(page.locator('[data-map-canvas]')).toHaveAttribute(
    'aria-label',
    'Mapa de la zona aproximada',
  );
});
