import { expect, test } from '@playwright/test';

/**
 * Full-page gallery content and interaction (ODD damero-gallery-full-page,
 * T4; docs/DESIGN.md §17.5). Per-slug fixtures (the same six listings and
 * photo counts as the detail specs — 5/5/4/5/5/4), the viewer copy contract
 * (back link, counter `N / M`), the active photo served from the listing's
 * own folder (PRD §7), and the whole interaction surface: thumbnail swap,
 * prev/next with wrap-around, ←/→/Home/End keys, the `?foto=N` deep link
 * (1-based, `history.replaceState` on move, invalid input degrading to
 * photo 1), and the no-JS degradation — photo 1, inert rail, working back
 * link.
 */

const SLUGS = [
  'casa-2-dormitorios-zona-sur-santa-fe',
  'casa-3-amb-guadalupe-santa-fe',
  'departamento-1-amb-candioti-norte-santa-fe',
  'departamento-2-amb-centro-santa-fe',
  'departamento-3-amb-barrio-norte-santa-fe',
  'lote-600-m2-candioti-santa-fe',
] as const;

const TITLES: Record<(typeof SLUGS)[number], string> = {
  'casa-2-dormitorios-zona-sur-santa-fe': 'Casa 2 dormitorios en zona sur',
  'casa-3-amb-guadalupe-santa-fe': 'Casa 3 ambientes con patio en Guadalupe',
  'departamento-1-amb-candioti-norte-santa-fe': 'Departamento 1 ambiente en Candioti Norte',
  'departamento-2-amb-centro-santa-fe': 'Departamento 2 ambientes en el centro',
  'departamento-3-amb-barrio-norte-santa-fe': 'Departamento 3 ambientes en Barrio Norte',
  'lote-600-m2-candioti-santa-fe': 'Lote 600 m² apto crédito en Candioti',
};

/**
 * Per-listing fixture: photo count, the cover's `titulo` (the active alt)
 * and the cover file name. Mirrors `propiedades-detalle-content.spec.ts`;
 * no invented data (§11).
 */
const GALLERY: Record<(typeof SLUGS)[number], { count: number; leadAlt: string; leadFile: string }> =
  {
    'casa-2-dormitorios-zona-sur-santa-fe': {
      count: 5,
      leadAlt: 'Fachada',
      leadFile: '01-fachada.webp',
    },
    'casa-3-amb-guadalupe-santa-fe': {
      count: 5,
      leadAlt: 'Fachada',
      leadFile: '01-fachada.webp',
    },
    'departamento-1-amb-candioti-norte-santa-fe': {
      count: 4,
      leadAlt: 'Frente del edificio',
      leadFile: '01-frente-edificio.webp',
    },
    'departamento-2-amb-centro-santa-fe': {
      count: 5,
      leadAlt: 'Frente del edificio',
      leadFile: '01-frente-edificio.webp',
    },
    'departamento-3-amb-barrio-norte-santa-fe': {
      count: 5,
      leadAlt: 'Frente del edificio',
      leadFile: '01-frente-edificio.webp',
    },
    'lote-600-m2-candioti-santa-fe': {
      count: 4,
      leadAlt: 'Terreno',
      leadFile: '01-terreno.webp',
    },
  };

test('each gallery page renders its listing contract', async ({ page }) => {
  for (const slug of SLUGS) {
    const { count, leadAlt, leadFile } = GALLERY[slug];
    const response = await page.goto(`/propiedades/${slug}/galeria`);
    expect(response!.status(), `${slug}/galeria status`).toBe(200);

    await expect(page, `${slug} title`).toHaveTitle(
      `${TITLES[slug]} · Galería | Damero Propiedades`,
    );

    // §17.5: the back link is a real link to the ficha.
    await expect(
      page.getByRole('link', { name: '← Volver a la ficha', exact: true }),
      `${slug} back link`,
    ).toHaveAttribute('href', `/propiedades/${slug}`);

    // The active photo is the cover (`fotos[0]`, PRD §7), served from the
    // listing's own folder, eager + high priority, with layout reserved.
    const active = page.locator('[data-viewer-active] img');
    await expect(active, `${slug} active`).toBeVisible();
    await expect(active).toHaveAttribute(
      'src',
      new RegExp(`/propiedades/${slug}/${leadFile.replace('.', '\\.')}$`),
    );
    await expect(active).toHaveAttribute('alt', leadAlt);
    await expect(active).toHaveAttribute('width', /\d+/);
    await expect(active).toHaveAttribute('height', /\d+/);
    await expect(active).toHaveAttribute('loading', 'eager');
    await expect(active).toHaveAttribute('fetchpriority', 'high');

    // Rail + counter: one thumbnail per photo, `1 / N`, the first active.
    await expect(page.locator('[data-gallery-thumb]'), `${slug} thumbs`).toHaveCount(count);
    await expect(page.locator('[data-gallery-counter]'), `${slug} counter`).toHaveText(
      `1 / ${count}`,
    );
    await expect(page.locator('[data-gallery-thumb]').first()).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(page.locator('[data-gallery-thumb]').first()).toHaveAttribute(
      'aria-label',
      `Ver foto 1 de ${count}`,
    );
  }
});

test('thumbnail click swaps the active photo, aria-current and the counter', async ({ page }) => {
  const slug = 'casa-3-amb-guadalupe-santa-fe';
  await page.goto(`/propiedades/${slug}/galeria`);

  const thumbs = page.locator('[data-gallery-thumb]');
  const active = page.locator('[data-viewer-active] img');
  const counter = page.locator('[data-gallery-counter]');

  await expect(active).toHaveAttribute('alt', 'Fachada');
  await expect(counter).toHaveText('1 / 5');

  await thumbs.nth(1).click();

  await expect(active).toHaveAttribute('src', /02-living-comedor\.webp$/);
  await expect(active).toHaveAttribute('alt', 'Living-comedor');
  await expect(counter).toHaveText('2 / 5');
  await expect(thumbs.nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(thumbs.nth(0)).not.toHaveAttribute('aria-current', 'true');
});

test('prev and next buttons move the active photo with wrap-around', async ({ page }) => {
  const slug = 'casa-3-amb-guadalupe-santa-fe';
  await page.goto(`/propiedades/${slug}/galeria`);

  const active = page.locator('[data-viewer-active] img');
  const counter = page.locator('[data-gallery-counter]');
  const thumbs = page.locator('[data-gallery-thumb]');
  const prev = page.getByRole('button', { name: 'Foto anterior', exact: true });
  const next = page.getByRole('button', { name: 'Foto siguiente', exact: true });

  await next.click();
  await expect(counter).toHaveText('2 / 5');
  await expect(active).toHaveAttribute('src', /02-living-comedor\.webp$/);

  await prev.click();
  await expect(counter).toHaveText('1 / 5');
  await expect(active).toHaveAttribute('src', /01-fachada\.webp$/);

  // Wrap-around: prev from the first photo lands on the last, next wraps back.
  await prev.click();
  await expect(counter).toHaveText('5 / 5');
  await expect(active).toHaveAttribute('src', /05-patio\.webp$/);
  await expect(thumbs.nth(4)).toHaveAttribute('aria-current', 'true');

  await next.click();
  await expect(counter).toHaveText('1 / 5');
  await expect(active).toHaveAttribute('src', /01-fachada\.webp$/);
});

test('the arrow keys and Home/End drive the viewer', async ({ page }) => {
  const slug = 'casa-3-amb-guadalupe-santa-fe';
  await page.goto(`/propiedades/${slug}/galeria`);

  const counter = page.locator('[data-gallery-counter]');

  await page.keyboard.press('ArrowRight');
  await expect(counter).toHaveText('2 / 5');
  await page.keyboard.press('ArrowRight');
  await expect(counter).toHaveText('3 / 5');
  await page.keyboard.press('ArrowLeft');
  await expect(counter).toHaveText('2 / 5');

  await page.keyboard.press('End');
  await expect(counter).toHaveText('5 / 5');
  await page.keyboard.press('ArrowRight');
  await expect(counter).toHaveText('1 / 5');
  await page.keyboard.press('Home');
  await expect(counter).toHaveText('1 / 5');
});

test('?foto=N opens the requested photo after load', async ({ page }) => {
  const slug = 'casa-3-amb-guadalupe-santa-fe';
  await page.goto(`/propiedades/${slug}/galeria?foto=3`);

  const active = page.locator('[data-viewer-active] img');
  await expect(active).toHaveAttribute('src', /03-cocina\.webp$/);
  await expect(active).toHaveAttribute('alt', 'Cocina');
  await expect(page.locator('[data-gallery-counter]')).toHaveText('3 / 5');
  await expect(page.locator('[data-gallery-thumb]').nth(2)).toHaveAttribute('aria-current', 'true');
  await expect(page).toHaveURL(/\?foto=3$/);
});

test('an invalid or out-of-range ?foto degrades to photo 1', async ({ page }) => {
  const slug = 'casa-3-amb-guadalupe-santa-fe';
  for (const query of ['?foto=99', '?foto=0', '?foto=-2', '?foto=abc', '?foto=2.5']) {
    await page.goto(`/propiedades/${slug}/galeria${query}`);
    await expect(page.locator('[data-gallery-counter]'), query).toHaveText('1 / 5');
    await expect(page.locator('[data-viewer-active] img'), query).toHaveAttribute(
      'src',
      /01-fachada\.webp$/,
    );
    await expect(page.locator('[data-gallery-thumb]').first(), query).toHaveAttribute(
      'aria-current',
      'true',
    );
  }
});

test('moving the viewer keeps the deep link in sync via replaceState', async ({ page }) => {
  const slug = 'casa-3-amb-guadalupe-santa-fe';
  await page.goto(`/propiedades/${slug}/galeria`);

  await page.locator('[data-gallery-thumb]').nth(1).click();
  await expect(page).toHaveURL(/\?foto=2$/);

  await page.getByRole('button', { name: 'Foto siguiente', exact: true }).click();
  await expect(page).toHaveURL(/\?foto=3$/);

  await page.getByRole('button', { name: 'Foto anterior', exact: true }).click();
  await expect(page).toHaveURL(/\?foto=2$/);

  // replaceState, never pushState: the moves above grew no history entries,
  // so Back leaves the gallery page entirely.
  await page.goBack();
  await expect(page).not.toHaveURL(/galeria/);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the page renders photo 1 with an inert rail and a working back link', async ({ page }) => {
    const slug = 'casa-3-amb-guadalupe-santa-fe';
    const response = await page.goto(`/propiedades/${slug}/galeria`);
    expect(response!.status()).toBe(200);

    const active = page.locator('[data-viewer-active] img');
    await expect(active).toHaveAttribute('src', /01-fachada\.webp$/);
    await expect(page.locator('[data-gallery-counter]')).toHaveText('1 / 5');
    await expect(page.locator('[data-gallery-thumb]')).toHaveCount(5);

    // The rail is inert: clicking swaps nothing without the script.
    await page.locator('[data-gallery-thumb]').nth(1).click();
    await expect(active).toHaveAttribute('src', /01-fachada\.webp$/);
    await expect(page.locator('[data-gallery-counter]')).toHaveText('1 / 5');

    // The back link still navigates — plain HTML, no JS involved.
    await expect(
      page.getByRole('link', { name: '← Volver a la ficha', exact: true }),
    ).toHaveAttribute('href', `/propiedades/${slug}`);
  });
});
