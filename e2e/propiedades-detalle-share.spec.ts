import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  expectedSlugs,
  expectedTitlesBySlug,
  expectedWhatsAppHrefsBySlug,
} from './helpers/content-expectations';

const SLUG = expectedSlugs()[0];
const COPIED = 'Enlace copiado al portapapeles';

declare global {
  interface Window {
    detailShareMock: {
      shares: ShareData[];
      writes: string[];
      clipboard: string;
    };
  }
}

async function mockSharing(
  page: Page,
  share: 'success' | 'absent' | 'abort' | 'error',
  clipboardFails = false,
) {
  await page.addInitScript(({ share, clipboardFails }) => {
    const state = { shares: [] as ShareData[], writes: [] as string[], clipboard: 'unchanged' };
    window.detailShareMock = state;
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: share === 'absent' ? undefined : async (data: ShareData) => {
        state.shares.push(data);
        if (share === 'abort') throw new DOMException('Cancelled', 'AbortError');
        if (share === 'error') throw new DOMException('Unavailable', 'NotAllowedError');
      },
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          state.writes.push(text);
          if (clipboardFails) throw new DOMException('Denied', 'NotAllowedError');
          state.clipboard = text;
        },
      },
    });
  }, { share, clipboardFails });
}

const shareButton = (page: Page) =>
  page.getByRole('complementary', { name: 'PRECIO' }).getByRole('button', {
    name: 'Compartir', exact: true,
  });
const shareStatus = (page: Page) =>
  page.getByRole('complementary', { name: 'PRECIO' }).getByRole('status');

test.beforeEach(async ({ page }) => {
  test.skip(!SLUG, 'The collection is empty; no detail route exists.');
  await page.route(/openfreemap/, (route) => route.abort());
});

test('Compartir is secondary below WhatsApp in the price panel, never in the sticky bar', async ({
  page, viewport,
}) => {
  await page.goto(`/propiedades/${SLUG}`);
  const button = shareButton(page);
  await expect(button).toBeVisible();
  await expect(button).toHaveClass(/\bbutton--secondary\b/);
  await expect(button.locator('svg')).toHaveAttribute('width', '24');
  await expect(button.locator('svg')).toHaveAttribute('height', '24');
  await expect(button.locator('svg')).toHaveAttribute('stroke', 'currentColor');
  await expect(button.locator('svg')).toHaveAttribute('aria-hidden', 'true');
  await expect(shareStatus(page)).toHaveText('');
  await expect(shareStatus(page)).toHaveClass(/visually-hidden/);
  await expect(page.locator('.whatsapp-sticky button')).toHaveCount(0);

  // Preserve the detail bands, hrefs and single-primary responsive placement.
  expect(await page.locator('main [data-band]').evaluateAll((bands) =>
    bands.map((band) => band.getAttribute('data-band')),
  )).toEqual(['gallery', 'title', 'characteristics', 'price', 'zone', 'map', 'more']);
  const inline = page.locator('.price-panel__cta .whatsapp-cta');
  const sticky = page.locator('.whatsapp-sticky__link');
  const href = expectedWhatsAppHrefsBySlug()[SLUG];
  await expect(inline).toHaveAttribute('href', href);
  await expect(sticky).toHaveAttribute('href', href);
  expect(await button.evaluate((element) => {
    const inline = document.querySelector('.price-panel__cta .whatsapp-cta');
    return !!inline && !!(inline.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
  })).toBe(true);
  if (viewport && viewport.width >= 768) {
    await expect(inline).toBeVisible();
    await expect(sticky).toBeHidden();
    const primaryBox = await inline.boundingBox();
    const shareBox = await button.boundingBox();
    expect(shareBox!.y).toBeGreaterThanOrEqual(primaryBox!.y + primaryBox!.height);
  } else {
    await expect(inline).toBeHidden();
    await expect(sticky).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth
    <= document.documentElement.clientWidth + 1)).toBe(true);
});

test('native share receives the document title, commercial intro and live absolute URL', async ({ page }) => {
  await mockSharing(page, 'success');
  await page.goto(`/propiedades/${SLUG}?origen=compartir#precio`);
  const url = page.url();
  await shareButton(page).click();
  await expect.poll(() => page.evaluate(() => window.detailShareMock.shares)).toEqual([{
    title: await page.title(),
    text: `Mirá esta propiedad de Damero Propiedades: ${expectedTitlesBySlug()[SLUG]} — `,
    url,
  }]);
  expect(await page.evaluate(() => window.detailShareMock.writes)).toEqual([]);
  expect(await page.evaluate(() => window.detailShareMock.clipboard)).toBe('unchanged');
  await expect(shareStatus(page)).toHaveText('');
  await expect(page).toHaveURL(url);
});

for (const share of ['absent', 'error'] as const) {
  test(`${share} native share copies the live URL and announces the exact status`, async ({ page }) => {
    await mockSharing(page, share);
    await page.goto(`/propiedades/${SLUG}?origen=compartir#precio`);
    const url = page.url();
    await shareButton(page).click();
    await expect(shareStatus(page)).toHaveText(COPIED);
    expect(await page.evaluate(() => window.detailShareMock.writes)).toEqual([url]);
    expect(await page.evaluate(() => window.detailShareMock.clipboard)).toBe(url);
    expect(await page.evaluate(() => window.detailShareMock.shares.length)).toBe(share === 'absent' ? 0 : 1);
    await expect(page).toHaveURL(url);
  });
}

test('AbortError stays silent without copying or navigating', async ({ page }) => {
  await mockSharing(page, 'abort');
  await page.goto(`/propiedades/${SLUG}`);
  const url = page.url();
  await shareButton(page).click();
  await expect.poll(() => page.evaluate(() => window.detailShareMock.shares.length)).toBe(1);
  expect(await page.evaluate(() => window.detailShareMock.writes)).toEqual([]);
  expect(await page.evaluate(() => window.detailShareMock.clipboard)).toBe('unchanged');
  await expect(shareStatus(page)).toHaveText('');
  await expect(page).toHaveURL(url);
});

test('clipboard rejection stays silent and does not claim a successful copy', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mockSharing(page, 'absent', true);
  await page.goto(`/propiedades/${SLUG}`);
  const url = page.url();
  await shareButton(page).click();
  await expect.poll(() => page.evaluate(() => window.detailShareMock.writes)).toEqual([url]);
  expect(await page.evaluate(() => window.detailShareMock.clipboard)).toBe('unchanged');
  await expect(shareStatus(page)).toHaveText('');
  expect(errors).toEqual([]);
  await expect(page).toHaveURL(url);
});
