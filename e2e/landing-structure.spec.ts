import { expect, test } from '@playwright/test';
import { expectedSlugs } from './helpers/content-expectations';

/**
 * Landing structure and semantics — rows 1, 2, 4 and 5 of the T7 inventory
 * (odd/tasks/damero-pages.md). Selectors derive from the real markup:
 * sections `.hero` / `.featured` / `.services` / `.faq-teaser`, each with
 * `aria-labelledby` pointing at its heading id.
 */

test('row 1: / responds 200, has a title and exactly one h1', async ({ page }) => {
  const response = await page.goto('/');
  expect(response).not.toBeNull();
  expect(response!.status()).toBe(200);

  await expect(page).toHaveTitle('Damero Propiedades');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('row 2: main sections render in the DESIGN.md §5 order', async ({ page }) => {
  await page.goto('/');

  const sectionLabels = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main > section')).map((section) =>
      section.getAttribute('aria-labelledby'),
    ),
  );
  expect(sectionLabels).toEqual(['hero-title', 'featured-title', 'services-title', 'faq-title']);

  // Every aria-labelledby hook resolves to exactly one real heading.
  for (const id of ['hero-title', 'featured-title', 'services-title', 'faq-title']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }

  const featured = page.getByRole('region', { name: 'Propiedades destacadas' });
  const empty = featured.locator('.featured__empty');
  if (expectedSlugs().length === 0) {
    await expect(featured.locator('a.card')).toHaveCount(0);
    await expect(empty).toHaveCount(1);
    await expect(empty).toBeVisible();
    await expect(empty.locator('.damero-placeholder__pattern')).toBeVisible();
    await expect(empty.locator('.damero-placeholder__mark')).toBeVisible();
    await expect(empty.locator('img, a')).toHaveCount(0);
    expect(await empty.innerText()).toBe('');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    );
  } else {
    await expect(empty).toHaveCount(0);
    expect(await featured.locator('a.card').count()).toBeGreaterThan(0);
  }
});

test('row 4: header, main and footer landmarks are present', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);
});

test('row 5: heading levels never skip (h1 to h2 to h3)', async ({ page }) => {
  await page.goto('/');

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
