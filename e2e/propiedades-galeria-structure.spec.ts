import { expect, test } from '@playwright/test';

/**
 * Full-page gallery structure and semantics (ODD damero-gallery-full-page,
 * T4; docs/DESIGN.md §17.5). Route health for every collection entry,
 * landmarks, the single h1, the 3:2 active frame with the controls OUTSIDE
 * the photograph (no overlay chrome, §17.2:680), the thumbnail rail, the
 * cross-document view-transition wiring — computed `view-transition-name`
 * `propiedad-<slug>` on both morph endpoints with exactly one named element
 * per page, plus the `@view-transition` rules in the SERVED css — and zero
 * horizontal overflow.
 *
 * The route is plain static HTML: no spec here needs the basemap abort, the
 * gallery page renders no map.
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

/** Per-listing photo counts (PRD §7; the same fixtures as the detail specs). */
const PHOTO_COUNTS: Record<(typeof SLUGS)[number], number> = {
  'casa-2-dormitorios-zona-sur-santa-fe': 5,
  'casa-3-amb-guadalupe-santa-fe': 5,
  'departamento-1-amb-candioti-norte-santa-fe': 4,
  'departamento-2-amb-centro-santa-fe': 5,
  'departamento-3-amb-barrio-norte-santa-fe': 5,
  'lote-600-m2-candioti-santa-fe': 4,
};

/**
 * Every element carrying an AUTHORED `view-transition-name`, browser-side.
 * Once a document opts into cross-document transitions
 * (`@view-transition { navigation: auto }`), the UA computes
 * `view-transition-name: root` on the root element itself (CSS View
 * Transitions L2) — that name is platform-assigned, not authored, so the
 * `<html>` element is excluded from the read. The §9/§17.5 contract is
 * exactly one authored name per page, on the media frame
 * (`.damero-placeholder`) — never on an `<img>`.
 */
function readNamedElements() {
  return Array.from(document.querySelectorAll('*'))
    .map((el) => ({
      name: getComputedStyle(el).getPropertyValue('view-transition-name').trim(),
      tag: el.tagName.toLowerCase(),
      isFrame: el.classList.contains('damero-placeholder'),
      insideActive: el.closest('[data-viewer-active]') !== null,
    }))
    .filter(
      (entry) => entry.name !== '' && entry.name !== 'none' && entry.tag !== 'html',
    );
}

test('each gallery route responds 200 with the title convention and exactly one h1', async ({
  page,
}) => {
  for (const slug of SLUGS) {
    const response = await page.goto(`/propiedades/${slug}/galeria`);
    expect(response).not.toBeNull();
    expect(response!.status(), `${slug}/galeria did not respond 200`).toBe(200);

    // §17.5 page-title convention: `<titulo> · Galería | Damero Propiedades`.
    await expect(page, `${slug} title`).toHaveTitle(
      `${TITLES[slug]} · Galería | Damero Propiedades`,
    );
    await expect(page.locator('h1'), `${slug} h1 count`).toHaveCount(1);
    await expect(page.locator('h1'), `${slug} h1 text`).toHaveText(TITLES[slug]);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  }
});

test('header, main, footer landmarks and the gallery region are present', async ({ page }) => {
  await page.goto('/propiedades/casa-3-amb-guadalupe-santa-fe/galeria');

  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);
  await expect(
    page.getByRole('region', { name: 'Galería de fotos de la propiedad' }),
  ).toHaveCount(1);
});

test('the active photo keeps the 3:2 frame with the controls outside the photograph', async ({
  page,
}) => {
  await page.goto('/propiedades/casa-3-amb-guadalupe-santa-fe/galeria');

  // §7: the frame holds 3:2 at every viewport (measured, not trusted).
  const ratio = await page.evaluate(() => {
    const frame = document.querySelector('[data-viewer-active] .damero-placeholder');
    if (!frame) return 0;
    const box = frame.getBoundingClientRect();
    return box.height === 0 ? 0 : box.width / box.height;
  });
  expect(Math.abs(ratio - 1.5), `active frame ratio ${ratio} is not 3:2`).toBeLessThan(0.02);

  // §17.5: the controls row is real chrome BELOW the photo, never inside it.
  await expect(page.locator('[data-viewer-controls]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Foto anterior', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Foto siguiente', exact: true })).toBeVisible();
  await expect(page.locator('[data-gallery-counter]')).toHaveText('1 / 5');
  await expect(page.locator('[data-viewer-active] [data-viewer-controls]')).toHaveCount(0);
  await expect(page.locator('[data-viewer-active] button')).toHaveCount(0);
  await expect(page.locator('[data-viewer-active] a')).toHaveCount(0);
});

test('no overlay chrome sits on top of the active photograph', async ({ page }) => {
  await page.goto('/propiedades/casa-3-amb-guadalupe-santa-fe/galeria');

  // §17.2:680 — nothing floats over the photo: no absolute/fixed element
  // inside the frame (the frame itself is position:relative, its img static).
  const overlaid = await page.evaluate(() => {
    const frame = document.querySelector('[data-viewer-active]');
    if (!frame) return ['[data-viewer-active] missing'];
    return Array.from(frame.querySelectorAll('*'))
      .filter((el) => {
        const position = getComputedStyle(el).position;
        return position === 'absolute' || position === 'fixed';
      })
      .map((el) => el.tagName.toLowerCase());
  });
  expect(overlaid).toEqual([]);
});

test('the rail renders one thumbnail per photo with the honest counter', async ({ page }) => {
  for (const slug of SLUGS) {
    await page.goto(`/propiedades/${slug}/galeria`);
    await expect(page.locator('[data-gallery-rail]'), `${slug} rail`).toBeVisible();
    await expect(page.locator('[data-gallery-thumb]'), `${slug} thumbs`).toHaveCount(
      PHOTO_COUNTS[slug],
    );
    await expect(page.locator('[data-gallery-counter]'), `${slug} counter`).toHaveText(
      `1 / ${PHOTO_COUNTS[slug]}`,
    );
  }
});

test('the morph endpoints carry propiedad-<slug> — exactly one named element per page', async ({
  page,
}) => {
  for (const slug of SLUGS) {
    // §9/§17.5: the ficha lead frame is the only named element on the detail.
    await page.goto(`/propiedades/${slug}`);
    const detailNamed = await page.evaluate(readNamedElements);
    expect(detailNamed, `${slug} detail named elements`).toEqual([
      { name: `propiedad-${slug}`, tag: 'div', isFrame: true, insideActive: false },
    ]);

    // The gallery active frame is the only named element on the gallery —
    // it sits inside the active photo, never on a thumbnail. The `<img>`
    // elements stay unnamed, matching the §9 rule.
    await page.goto(`/propiedades/${slug}/galeria`);
    const galleryNamed = await page.evaluate(readNamedElements);
    expect(galleryNamed, `${slug} gallery named elements`).toEqual([
      { name: `propiedad-${slug}`, tag: 'div', isFrame: true, insideActive: true },
    ]);

    const imgNames = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img')).map((el) =>
        getComputedStyle(el).getPropertyValue('view-transition-name').trim(),
      ),
    );
    expect(
      imgNames.every((name) => name === '' || name === 'none'),
      `${slug} gallery: no img carries a view-transition-name`,
    ).toBe(true);
  }
});

test('the served CSS opts in to cross-document view transitions with the reduced-motion opt-out', async ({
  page,
}) => {
  await page.goto('/propiedades/casa-3-amb-guadalupe-santa-fe/galeria');

  // Fetch every stylesheet the page actually ships — the assertion is over
  // the SERVED css, not the source (the minifier lowercases; match loosely).
  const hrefs = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((links) =>
      links.map((link) => (link as HTMLLinkElement).href).filter(Boolean),
    );
  expect(hrefs.length).toBeGreaterThan(0);

  let css = '';
  for (const href of hrefs) {
    const response = await page.request.get(href);
    expect(response.ok(), `stylesheet ${href}`).toBe(true);
    css += `${await response.text()}\n`.toLowerCase();
  }

  // §17.5: global opt-in `@view-transition { navigation: auto; }`.
  expect(css).toContain('@view-transition');
  expect(css).toMatch(/navigation\s*:\s*auto/);

  // §17.5: the reduced-motion opt-out at the `navigation` level — the §9
  // blanket neutralizer does not reach the ::view-transition-* pseudos.
  const motionIndex = css.indexOf('prefers-reduced-motion');
  expect(motionIndex).toBeGreaterThan(-1);
  const afterMotion = css.slice(motionIndex);
  expect(afterMotion).toContain('@view-transition');
  expect(afterMotion).toMatch(/navigation\s*:\s*none/);
});

test('no horizontal overflow', async ({ page }) => {
  await page.goto('/propiedades/lote-600-m2-candioti-santa-fe/galeria');

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    metrics.scrollWidth,
    `horizontal overflow: scrollWidth ${metrics.scrollWidth} > clientWidth ${metrics.clientWidth} + 1`,
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);
});
