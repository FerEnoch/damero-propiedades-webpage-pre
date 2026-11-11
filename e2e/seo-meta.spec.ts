import { expect, test } from '@playwright/test';

/**
 * SEO/social baseline — the WhatsApp/Telegram card renders from these tags.
 * Crawlers require absolute og:url/og:image, so every URL is asserted against
 * the canonical origin from astro.config.mjs (never a relative path).
 */

const SITE_ORIGIN = 'https://dameropropiedades.com.ar';

test('seo: landing exposes the absolute OG/Twitter card tags', async ({ page }) => {
  await page.goto('/');

  const head = page.locator('head');

  await expect(head.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Catálogo inmobiliario con respaldo jurídico.',
  );
  await expect(head.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${SITE_ORIGIN}/`,
  );
  await expect(head.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    '#3E4837',
  );
  await expect(
    head.locator('link[rel="icon"][type="image/svg+xml"]'),
  ).toHaveAttribute('href', '/favicon.svg');

  await expect(head.locator('meta[property="og:type"]')).toHaveAttribute(
    'content',
    'website',
  );
  await expect(head.locator('meta[property="og:site_name"]')).toHaveAttribute(
    'content',
    'Damero Propiedades',
  );
  await expect(head.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'Damero Propiedades',
  );
  await expect(head.locator('meta[property="og:description"]')).toHaveAttribute(
    'content',
    'Catálogo inmobiliario con respaldo jurídico.',
  );
  await expect(head.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    `${SITE_ORIGIN}/`,
  );
  await expect(head.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    `${SITE_ORIGIN}/og/damero-og.png`,
  );
  await expect(head.locator('meta[property="og:image:width"]')).toHaveAttribute(
    'content',
    '1200',
  );
  await expect(head.locator('meta[property="og:image:height"]')).toHaveAttribute(
    'content',
    '630',
  );
  await expect(head.locator('meta[property="og:locale"]')).toHaveAttribute(
    'content',
    'es_AR',
  );

  await expect(head.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
  await expect(head.locator('meta[name="twitter:title"]')).toHaveAttribute(
    'content',
    'Damero Propiedades',
  );
  await expect(head.locator('meta[name="twitter:description"]')).toHaveAttribute(
    'content',
    'Catálogo inmobiliario con respaldo jurídico.',
  );
  await expect(head.locator('meta[name="twitter:image"]')).toHaveAttribute(
    'content',
    `${SITE_ORIGIN}/og/damero-og.png`,
  );
});

test('seo: brand assets resolve with the right content type', async ({ request }) => {
  const og = await request.get('/og/damero-og.png');
  expect(og.status()).toBe(200);
  expect(og.headers()['content-type']).toContain('image/png');

  const favicon = await request.get('/favicon.svg');
  expect(favicon.status()).toBe(200);
  expect(favicon.headers()['content-type']).toContain('image/svg');
});
