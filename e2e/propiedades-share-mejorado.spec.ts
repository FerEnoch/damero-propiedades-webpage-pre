import { expect, test } from '@playwright/test';

const TITLE = 'Búsqueda de propiedades';
const TEXT = 'Te comparto esta búsqueda de Damero Propiedades con los filtros aplicados: ';
const COPIED = 'Enlace copiado al portapapeles';

declare global {
  interface Window { searchShares: ShareData[]; searchWrites: string[]; }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.searchShares = [];
    window.searchWrites = [];
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => {
      window.searchShares.push(data);
    } });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (text: string) => { window.searchWrites.push(text); },
    } });
  });
});

test('search has one labeled share action in the heading and no separate copy strip', async ({ page }) => {
  await page.goto('/propiedades?operacion=venta');

  const main = page.getByRole('main');
  const share = main.getByRole('button', { name: 'Compartir', exact: true });
  await expect.soft(share).toHaveCount(1);
  await expect.soft(main.getByRole('region', { name: 'Propiedades', exact: true })
    .getByRole('button', { name: 'Compartir', exact: true })).toBeVisible({ timeout: 1500 });
  await expect.soft(main.getByRole('button', { name: 'Copiar búsqueda', exact: true })).toHaveCount(0, { timeout: 1500 });
  await expect.soft(main.getByRole('region', { name: 'Búsqueda compartible', exact: true })).toHaveCount(0, { timeout: 1500 });
  await expect.soft(main.getByText('/propiedades?operacion=venta', { exact: true })).toHaveCount(0, { timeout: 1500 });
});

for (const mode of ['success', 'abort', 'error'] as const) {
  test(`native ${mode} uses the live filtered URL without automatic copying`, async ({ page, viewport }) => {
    await page.goto('/propiedades');
    const mobile = viewport!.width < 768;
    if (mobile) await page.getByRole('button', { name: 'Filtros', exact: true }).click();
    await page.locator(`[data-filters="${mobile ? 'sheet' : 'desktop'}"]`).getByText('Venta', { exact: true }).click();
    if (mobile) await page.locator('.sheet__apply').click();
    await expect(page).toHaveURL(/\?operacion=venta$/);
    await page.evaluate((mode) => {
      Object.defineProperty(navigator, 'share', { value: async (data: ShareData) => {
        window.searchShares.push(data);
        if (mode !== 'success') throw new DOMException('Share unavailable', mode === 'abort' ? 'AbortError' : 'NotAllowedError');
      } });
    }, mode);
    const root = page.locator('[data-share-menu]');
    await root.getByRole('button', { name: 'Compartir', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.searchShares)).toEqual([{ title: TITLE, text: TEXT, url: page.url() }]);
    if (mode === 'error') await expect(root.getByRole('menu')).toBeVisible();
    else await expect(root.getByRole('menu')).toBeHidden();
    await expect(root.getByRole('status', { includeHidden: true })).toHaveText('');
    expect(await page.evaluate(() => window.searchWrites)).toEqual([]);
    await expect(page).toHaveURL(/\?operacion=venta$/);
  });
}

test('reopening reads changed filters and prepares encoded channel destinations without launching apps', async ({ page }) => {
  await page.goto('/propiedades');
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined }));
  const root = page.locator('[data-share-menu]');
  const trigger = root.getByRole('button', { name: 'Compartir', exact: true });
  await trigger.click();
  await expect(root.locator('[data-share-url]')).toHaveText(page.url());
  await page.keyboard.press('Escape');
  // Remove an actual applied filter in-place, then reopen the same component.
  await page.goto('/propiedades?operacion=venta');
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined }));
  await trigger.click();
  await page.keyboard.press('Escape');
  await page.locator('.filter-chip:visible').first().click();
  await expect(page).toHaveURL(/\/propiedades$/);
  await trigger.click();
  const url = page.url();
  await expect(root.locator('[data-share-url]')).toHaveText(url);
  const destinations = {
    WhatsApp: `https://wa.me/?text=${encodeURIComponent(TEXT + url)}`,
    Telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(TEXT)}`,
    Email: `mailto:?subject=${encodeURIComponent(TITLE)}&body=${encodeURIComponent(TEXT + url)}`,
  };
  for (const [channel, destination] of Object.entries(destinations)) {
    const action = root.getByRole('menuitem', { name: channel, exact: true });
    expect(await action.evaluate((el) => el.tagName)).toBe('A');
    await expect(action).toHaveAttribute('href', destination);
  }
  await root.getByRole('menuitem', { name: 'Copiar enlace', exact: true }).click();
  const status = root.locator('.share-menu__panel').getByRole('status');
  await expect(status).toHaveText(COPIED);
  await expect(status).toBeVisible();
  await expect(status).toHaveAttribute('aria-live', 'polite');
  await expect(page).toHaveURL(url);
  expect(await page.evaluate(() => window.searchWrites)).toEqual([url]);
});

test('a refused clipboard leaves the filtered URL available for manual copy', async ({ page }) => {
  await page.goto('/propiedades?operacion=venta');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { value: undefined });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => { throw new Error('Permission denied'); } },
    });
    document.execCommand = () => false;
  });

  await page.getByRole('button', { name: 'Compartir', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Copiar enlace', exact: true }).click();

  const status = page.locator('[data-share-menu]').getByRole('status');
  await expect(status).toHaveText('No se pudo copiar: seleccioná el enlace y copialo');
  await expect(status).toBeVisible();
  await expect(page.locator('[data-share-url]')).toBeVisible();
  await expect(page.locator('[data-share-url]')).toHaveText(page.url());
  expect(await page.evaluate(() => window.searchWrites)).toEqual([]);
});
