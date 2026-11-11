import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const COPIED = 'Enlace copiado al portapapeles';

declare global {
  interface Window {
    searchShareMock: {
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
    window.searchShareMock = state;
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

const shareStrip = (page: Page) =>
  page.getByRole('region', { name: 'Búsqueda compartible', exact: true });
const shareButton = (page: Page) =>
  shareStrip(page).getByRole('button', { name: 'Compartir', exact: true });
const shareStatus = (page: Page) => shareStrip(page).getByRole('status');

test('Compartir adds an icon and tint-safe action beside the unchanged copy strip', async ({ page }) => {
  await page.goto('/propiedades?operacion=venta');

  const copy = shareStrip(page).getByRole('button', { name: 'Copiar búsqueda', exact: true });
  const share = shareButton(page);
  await expect(copy).toBeVisible();
  await expect(share).toBeVisible();
  await expect(copy).toHaveClass(/\bbutton--secondary-tint\b/);
  await expect(share).toHaveClass(/\bbutton--secondary-tint\b/);
  await expect(share.locator('svg')).toHaveAttribute('width', '24');
  await expect(share.locator('svg')).toHaveAttribute('height', '24');
  await expect(share.locator('svg')).toHaveAttribute('stroke', 'currentColor');
  await expect(share.locator('svg')).toHaveAttribute('aria-hidden', 'true');
  await expect(shareStatus(page)).toHaveText('');
  await expect(shareStatus(page)).toHaveClass(/visually-hidden/);
  await expect(page.locator('[data-share-field]')).toHaveText('/propiedades?operacion=venta');
  await expect(page.locator('[data-share-field]')).toHaveAttribute('title', '/propiedades?operacion=venta');
  await expect(page.locator('.search-share__eyebrow')).toHaveText('BÚSQUEDA COMPARTIBLE');
  await expect(page.locator('.search-share__body')).toHaveText(
    'Copiá este enlace para compartir exactamente los filtros aplicados actualmente.',
  );
  expect(await page.locator('main [data-band]').evaluateAll((bands) =>
    bands.map((band) => band.getAttribute('data-band')),
  )).toEqual(['head', 'filters', 'share', 'results', 'empty']);
  const copyBox = (await copy.boundingBox())!;
  const shareBox = (await share.boundingBox())!;
  if (test.info().project.name === 'desktop-1280') {
    expect(shareBox.x).toBeGreaterThanOrEqual(copyBox.x + copyBox.width + 8);
    expect(shareBox.y).toBe(copyBox.y);
  } else {
    // Narrow viewports wrap the actions by design (no horizontal overflow
    // wins over side-by-side): Compartir sits at or below the copy row,
    // left-aligned within the strip.
    expect(shareBox.y).toBeGreaterThanOrEqual(copyBox.y);
    expect(shareBox.x).toBeGreaterThanOrEqual(copyBox.x - 1);
  }
  expect(shareBox.height).toBeGreaterThanOrEqual(44);
  expect(await share.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, border: style.borderTopColor };
  })).toEqual({ color: 'rgb(62, 72, 55)', border: 'rgb(62, 72, 55)' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth
    <= document.documentElement.clientWidth + 1)).toBe(true);
});

test('native share uses the title, commercial intro and live URL after applying a filter', async ({
  page, viewport,
}) => {
  await mockSharing(page, 'success');
  await page.goto('/propiedades');
  const mobile = !!viewport && viewport.width < 768;
  if (mobile) await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await page.locator(`[data-filters="${mobile ? 'sheet' : 'desktop'}"]`)
    .getByText('Venta', { exact: true }).click();
  if (mobile) await page.locator('.sheet__apply').click();
  await expect(page).toHaveURL(/\?operacion=venta$/);
  const url = page.url();

  await shareButton(page).click();

  await expect.poll(() => page.evaluate(() => window.searchShareMock.shares)).toEqual([{
    title: await page.title(),
    text: 'Te comparto esta búsqueda de Damero Propiedades con los filtros aplicados: ',
    url,
  }]);
  expect(await page.evaluate(() => window.searchShareMock.writes)).toEqual([]);
  expect(await page.evaluate(() => window.searchShareMock.clipboard)).toBe('unchanged');
  await expect(shareStatus(page)).toHaveText('');
  await expect(page).toHaveURL(url);
});

test('absent native share copies the live URL and announces the existing exact status', async ({ page }) => {
  await mockSharing(page, 'absent');
  await page.goto('/propiedades?operacion=venta');
  const url = page.url();

  await shareButton(page).click();

  await expect(shareStatus(page)).toHaveText(COPIED);
  expect(await page.evaluate(() => window.searchShareMock.shares)).toEqual([]);
  expect(await page.evaluate(() => window.searchShareMock.writes)).toEqual([url]);
  expect(await page.evaluate(() => window.searchShareMock.clipboard)).toBe(url);
  await expect(page).toHaveURL(url);
});

for (const share of ['abort', 'error'] as const) {
  test(`${share} from native share stays silent without copying or navigating`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await mockSharing(page, share);
    await page.goto('/propiedades?operacion=venta');
    const url = page.url();

    await shareButton(page).click();

    await expect.poll(() => page.evaluate(() => window.searchShareMock.shares.length)).toBe(1);
    expect(await page.evaluate(() => window.searchShareMock.writes)).toEqual([]);
    expect(await page.evaluate(() => window.searchShareMock.clipboard)).toBe('unchanged');
    await expect(shareStatus(page)).toHaveText('');
    expect(errors).toEqual([]);
    await expect(page).toHaveURL(url);
  });
}

test('clipboard rejection stays silent without claiming a successful copy', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mockSharing(page, 'absent', true);
  await page.goto('/propiedades?operacion=venta');
  const url = page.url();

  await shareButton(page).click();

  await expect.poll(() => page.evaluate(() => window.searchShareMock.writes)).toEqual([url]);
  expect(await page.evaluate(() => window.searchShareMock.shares)).toEqual([]);
  expect(await page.evaluate(() => window.searchShareMock.clipboard)).toBe('unchanged');
  await expect(shareStatus(page)).toHaveText('');
  expect(errors).toEqual([]);
  await expect(page).toHaveURL(url);
});

test('the existing copy action still copies directly even when native share exists', async ({ page }) => {
  await mockSharing(page, 'success');
  await page.goto('/propiedades?operacion=venta');
  const url = page.url();

  await shareStrip(page).getByRole('button', { name: 'Copiar búsqueda', exact: true }).click();

  await expect(shareStatus(page)).toHaveText(COPIED);
  expect(await page.evaluate(() => window.searchShareMock.shares)).toEqual([]);
  expect(await page.evaluate(() => window.searchShareMock.writes)).toEqual([url]);
  expect(await page.evaluate(() => window.searchShareMock.clipboard)).toBe(url);
  await expect(page).toHaveURL(url);
});
