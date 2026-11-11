import { expect, test } from '@playwright/test';
import {
  expectedPhotosBySlug,
  expectedProbeSlug,
  expectedTitlesBySlug,
} from './helpers/content-expectations';

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

test('seo: listing detail card uses the listing cover photo', async ({
  page,
  request,
}) => {
  const slug = expectedProbeSlug(1);
  test.skip(!slug, 'no listing with photos in the collection');
  const photos = expectedPhotosBySlug()[slug!];
  const titles = expectedTitlesBySlug();

  await page.goto(`/propiedades/${slug}`);
  const head = page.locator('head');

  await expect(head.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    `${SITE_ORIGIN}${photos[0].src}`,
  );
  await expect(head.locator('meta[name="twitter:image"]')).toHaveAttribute(
    'content',
    `${SITE_ORIGIN}${photos[0].src}`,
  );
  // Per-photo dimensions are unknown at build time, so no width/height
  // tags ship for covers — a wrong tag is worse than none.
  await expect(head.locator('meta[property="og:image:width"]')).toHaveCount(0);
  await expect(head.locator('meta[property="og:image:height"]')).toHaveCount(0);
  const url = await head.locator('meta[property="og:url"]').getAttribute('content');
  expect(url).toMatch(/^https:\/\/dameropropiedades\.com\.ar\/propiedades\/.+\/?$/);
  expect(url).not.toContain('?');
  await expect(head.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    `${titles[slug!]} | Damero Propiedades`,
  );

  const cover = await request.get(photos[0].src);
  expect(cover.status()).toBe(200);
});

test('seo: filtered search keeps the static card with a clean canonical', async ({
  page,
}) => {
  await page.goto('/propiedades?operacion=venta&moneda=USD');
  const head = page.locator('head');

  await expect(head.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    `${SITE_ORIGIN}/og/damero-og.png`,
  );
  const url = await head.locator('meta[property="og:url"]').getAttribute('content');
  expect(url).toMatch(/^https:\/\/dameropropiedades\.com\.ar\/propiedades\/?$/);
  expect(url).not.toContain('?');
});
