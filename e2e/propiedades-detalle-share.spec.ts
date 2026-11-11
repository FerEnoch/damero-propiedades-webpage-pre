import { expect, test } from '@playwright/test';
import { expectedSlugs, expectedTitlesBySlug, expectedWhatsAppHrefsBySlug } from './helpers/content-expectations';

const SLUG = expectedSlugs()[0];
const TITLE = expectedTitlesBySlug()[SLUG];
const TEXT = `Mirá esta propiedad de Damero Propiedades: ${TITLE} — `;

declare global {
  interface Window { detailShares: ShareData[]; detailWrites: string[]; }
}

test.beforeEach(async ({ page }) => {
  test.skip(!SLUG, 'The collection is empty; no detail route exists.');
  await page.route(/openfreemap/, (route) => route.abort());
  await page.addInitScript(() => {
    window.detailShares = [];
    window.detailWrites = [];
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => {
      window.detailShares.push(data);
    } });
    Object.defineProperty(navigator, 'clipboard', { value: {
      writeText: async (text: string) => { window.detailWrites.push(text); },
    } });
  });
});

test('share stays secondary in the price panel, not the sticky WhatsApp bar', async ({ page, viewport }) => {
  await page.goto(`/propiedades/${SLUG}`);
  const button = page.locator('.price-panel__cta').getByRole('button', { name: 'Compartir', exact: true });
  await expect(button).toBeVisible();
  await expect(button).toHaveClass(/share-menu__trigger/);
  await expect(button).not.toHaveClass(/\bbutton(?:--[\w-]+)?\b/);
  await expect(page.locator('[data-share-menu] [data-share-status]')).toHaveCount(0);
  await expect(page.locator('[data-share-status-menu]')).toHaveCount(1);
  expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(viewport!.width < 768 ? 48 : 52);
  await expect(page.locator('.whatsapp-sticky').getByRole('button', { name: 'Compartir' })).toHaveCount(0);
  const inline = page.locator('.price-panel__cta .whatsapp-cta');
  const sticky = page.locator('.whatsapp-sticky__link');
  const href = expectedWhatsAppHrefsBySlug()[SLUG];
  await expect(inline).toHaveAttribute('href', href);
  await expect(sticky).toHaveAttribute('href', href);
  if (viewport!.width < 768) {
    await expect(inline).toBeHidden();
    await expect(sticky).toBeVisible();
  } else {
    await expect(inline).toBeVisible();
    await expect(sticky).toBeHidden();
    const primary = (await inline.boundingBox())!;
    expect((await button.boundingBox())!.y).toBeGreaterThanOrEqual(primary.y + primary.height);
  }
  expect(await page.locator('main [data-band]').evaluateAll((bands) => bands.map((band) => band.getAttribute('data-band'))))
    .toEqual(['gallery', 'title', 'characteristics', 'price', 'zone', 'map', 'more']);
});

for (const mode of ['success', 'abort', 'error'] as const) {
  test(`native ${mode} respects the payload and never auto-copies`, async ({ page }) => {
    await page.goto(`/propiedades/${SLUG}?origen=compartir#precio`);
    await page.evaluate((mode) => {
      Object.defineProperty(navigator, 'share', { value: async (data: ShareData) => {
        window.detailShares.push(data);
        if (mode !== 'success') throw new DOMException('Share unavailable', mode === 'abort' ? 'AbortError' : 'NotAllowedError');
      } });
    }, mode);
    const root = page.locator('[data-share-menu]');
    await root.getByRole('button', { name: 'Compartir', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.detailShares)).toEqual([{ title: TITLE, text: TEXT, url: page.url() }]);
    if (mode === 'error') await expect(root.getByRole('menu')).toBeVisible();
    else await expect(root.getByRole('menu')).toBeHidden();
    await expect(root.getByRole('status', { includeHidden: true })).toHaveText('');
    expect(await page.evaluate(() => window.detailWrites)).toEqual([]);
    expect(new URL(page.url()).hash).toBe('#precio');
  });
}

test('secure clipboard copies only the URL; native cancellation preserves prior visible feedback', async ({ page }) => {
  await page.goto(`/propiedades/${SLUG}`);
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined }));
  const root = page.locator('[data-share-menu]');
  const trigger = root.getByRole('button', { name: 'Compartir', exact: true });
  await trigger.click();
  await root.getByRole('menuitem', { name: 'Copiar enlace', exact: true }).click();
  const status = root.locator('.share-menu__panel').getByRole('status', { includeHidden: true });
  await expect(status).toHaveText('Enlace copiado al portapapeles');
  await expect(status).toBeVisible();
  await expect(status).toHaveAttribute('aria-live', 'polite');
  await page.keyboard.press('Escape');
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: async () => {
    window.detailShares.push({ title: 'cancelled' });
    throw new DOMException('Cancelled', 'AbortError');
  } }));
  await trigger.click();
  await expect.poll(() => page.evaluate(() => window.detailShares.length)).toBe(1);
  await expect(root.getByRole('menu')).toBeHidden();
  await expect(status).toHaveText('Enlace copiado al portapapeles');
  await expect(status).toBeHidden();
  expect(await page.evaluate(() => window.detailWrites)).toEqual([page.url()]);
});
