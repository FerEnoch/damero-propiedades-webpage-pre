import { expect, test } from '@playwright/test';

/**
 * Search page structure and semantics (ODD §17 slice S2). Mirrors the landing
 * structure spec: route health, the §17.1 band order, landmarks, heading
 * levels, horizontal overflow, the never-2-up grid, R10's omitted `Ver más`,
 * and the PRD §9 coordinate ban. Selectors derive from the real markup:
 * top-level bands carry `data-band`, the grid carries `data-results-grid`.
 */

test('/propiedades responds 200, has a title and exactly one h1', async ({ page }) => {
  const response = await page.goto('/propiedades');
  expect(response).not.toBeNull();
  expect(response!.status()).toBe(200);

  await expect(page).toHaveTitle('Propiedades | Damero Propiedades');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('the §17.1 bands render in order', async ({ page }) => {
  await page.goto('/propiedades');

  const bands = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main [data-band]')).map((band) =>
      band.getAttribute('data-band'),
    ),
  );
  expect(bands).toEqual(['head', 'filters', 'share', 'results', 'empty']);
});

test('header, main and footer landmarks are present', async ({ page }) => {
  await page.goto('/propiedades');

  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);
});

test('heading levels never skip (h1 to h2 to h3)', async ({ page }) => {
  await page.goto('/propiedades');

  const levels = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6')).map(
      (heading) => Number(heading.tagName.slice(1)),
    ),
  );

  expect(levels.length).toBeGreaterThan(0);
  expect(levels[0]).toBe(1);
  for (let i = 1; i < levels.length; i++) {
    expect(
      levels[i],
      `heading #${i + 1} jumps from h${levels[i - 1]} to h${levels[i]}`,
    ).toBeLessThanOrEqual(levels[i - 1] + 1);
  }
});

test('no horizontal overflow', async ({ page }) => {
  await page.goto('/propiedades');

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    metrics.scrollWidth,
    `horizontal overflow: scrollWidth ${metrics.scrollWidth} > clientWidth ${metrics.clientWidth} + 1`,
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);
});

test('the results grid is 3 columns ≥ md, 1 below — never 2-up (§17.1:623)', async ({
  page,
  viewport,
}) => {
  await page.goto('/propiedades');

  const columns = await page.evaluate(() => {
    const grid = document.querySelector('[data-results-grid]');
    if (!grid) return 0;
    return getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
  });

  expect(columns).not.toBe(2);
  if (viewport && viewport.width >= 768) {
    expect(columns).toBe(3);
  } else {
    expect(columns).toBe(1);
  }
});

test('R10: `Ver más propiedades` is omitted with ≤ 6 results', async ({ page }) => {
  await page.goto('/propiedades');

  // A pagination promise with no page behind it is fabricated data: with the
  // current 3 seeds the button must not exist in the DOM at all.
  await expect(page.getByRole('button', { name: 'Ver más propiedades' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Ver más propiedades' })).toHaveCount(0);
});

test('no numeric map coordinates render anywhere in the page (PRD §9)', async ({ page }) => {
  await page.goto('/propiedades');

  const html = await page.content();
  const banned = [
    '-34.55',
    '-59.12',
    '-34.665',
    '-59.445',
    '-34.555',
    '-59.085',
    'map_lat',
    'map_lon',
  ];
  for (const marker of banned) {
    expect(html.includes(marker), `coordinate marker found in HTML: ${marker}`).toBe(false);
  }
});

test('no invented data renders on the page (§11)', async ({ page }) => {
  await page.goto('/propiedades');

  const renderedText = await page.evaluate(() => document.body.innerText);
  const bannedMarkers: Array<[string, RegExp]> = [
    ['CUCICBA (superseded regulator name)', /CUCICBA/i],
    ['Ley 5115 (invented legal reference)', /Ley\s*5115/i],
    ['testimonials', /testimonio/i],
    ['percentage metrics', /\d+([.,]\d+)?\s*%/],
    ['years-of-experience claims', /\d+\+?\s*años/i],
    ['an apology in the empty state', /lo sentimos/i],
  ];

  for (const [label, pattern] of bannedMarkers) {
    expect(pattern.test(renderedText), `invented data marker found: ${label}`).toBe(false);
  }
});
