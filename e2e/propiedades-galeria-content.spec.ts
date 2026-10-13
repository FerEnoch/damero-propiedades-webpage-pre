import { expect, test } from '@playwright/test';
import {
  expectedPhotosBySlug,
  expectedProbeSlug,
  expectedSlugs,
  expectedTitlesBySlug,
} from './helpers/content-expectations';

/**
 * Full-page gallery content and interaction (ODD damero-gallery-full-page,
 * T4; docs/DESIGN.md §17.5). Per-listing photo contracts derive from the
 * collection (plan `odd/tasks/damero-e2e-decouple.md`, T3), the viewer copy
 * contract (back link, counter `N / M`), the active photo served from the
 * listing's own folder (PRD §7), and the whole interaction surface: thumbnail swap,
 * prev/next with wrap-around, ←/→/Home/End keys, the `?foto=N` deep link
 * (1-based, `history.replaceState` on move, invalid input degrading to
 * photo 1), and the no-JS degradation — photo 1, inert rail, working back
 * link.
 */

/*
 * Slugs, titles, and photos derive from the collection (plan
 * `odd/tasks/damero-e2e-decouple.md`, T2–T3) — the same source the build
 * renders, so a listing add/remove, a title reword, or a photo add/remove
 * needs no spec edit.
 */
const SLUGS = expectedSlugs();
const TITLES = expectedTitlesBySlug();
test.beforeEach(() => {
  test.skip(SLUGS.length === 0, 'The collection is empty; gallery route probes require a listing.');
});

/**
 * Per-listing photos derive from the collection (plan
 * `odd/tasks/damero-e2e-decouple.md`, T3) — the same source the build
 * renders. Counts, cover alt/src, and indexed photos below derive from this
 * map; photo indices stay structural (positions, never filenames).
 * Mirrors `propiedades-detalle-content.spec.ts`; no invented data (§11).
 */
const PHOTOS = expectedPhotosBySlug();

/*
 * The single-listing probe target derives from the collection (plan
 * `odd/tasks/damero-e2e-decouple-probes.md`, T2): the viewer interactions
 * below exercise photo 3 and a 2↔3 move, so the pick needs a listing with
 * at least 3 photos. When none qualifies, each probing test skips with an
 * explicit reason — never a fallback to a literal slug.
 */
const PROBE_SLUG = expectedProbeSlug(3);

/*
 * End-anchored `src` matcher from a collection-derived path. The initial
 * render serves the frontmatter path verbatim, but the viewer script swaps
 * via the resolved (absolute) URL — so every post-swap attribute carries
 * the origin prefix and only the filename suffix is asserted (T3).
 */
function srcEnd(src: string): RegExp {
  const base = src.split('/').pop() ?? src;
  return new RegExp(`${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

test('each gallery page renders its listing contract', async ({ page }) => {
  for (const slug of SLUGS) {
    const photos = PHOTOS[slug];
    const count = photos.length;
    const cover = photos[0];
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
    if (count === 0) {
      // R4 sync: [slug]/galeria.astro:53-55,69-72 omits photographic chrome.
      const frame = page.locator('[data-viewer-active] .damero-placeholder');
      await expect(frame, `${slug} brand tile`).toBeVisible();
      await expect(frame).toHaveCSS('view-transition-name', 'none');
      await expect(active).toHaveCount(0);
      await expect(page.locator('[data-viewer-controls]')).toHaveCount(0);
      await expect(page.locator('[data-gallery-rail]')).toHaveCount(0);
      await expect(page.locator('[data-gallery-thumb]')).toHaveCount(0);
      await expect(page.locator('[data-gallery-counter]')).toHaveCount(0);
      continue;
    }
    await expect(active, `${slug} active`).toBeVisible();
    await expect(active).toHaveAttribute('src', srcEnd(cover.src));
    await expect(active).toHaveAttribute('alt', cover.titulo);
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
  // Structural probe on one listing; every asserted photo value derives
  // from the collection (T3). Indices are positions, never filenames.
  test.skip(!PROBE_SLUG, 'no listing in the collection carries at least 3 photos');
  const slug = PROBE_SLUG!;
  const photos = PHOTOS[slug];
  const count = photos.length;
  await page.goto(`/propiedades/${slug}/galeria`);

  const thumbs = page.locator('[data-gallery-thumb]');
  const active = page.locator('[data-viewer-active] img');
  const counter = page.locator('[data-gallery-counter]');

  await expect(active).toHaveAttribute('alt', photos[0].titulo);
  await expect(counter).toHaveText(`1 / ${count}`);

  await thumbs.nth(1).click();

  await expect(active).toHaveAttribute('src', srcEnd(photos[1].src));
  await expect(active).toHaveAttribute('alt', photos[1].titulo);
  await expect(counter).toHaveText(`2 / ${count}`);
  await expect(thumbs.nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(thumbs.nth(0)).not.toHaveAttribute('aria-current', 'true');
});

test('prev and next buttons move the active photo with wrap-around', async ({ page }) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries at least 3 photos');
  const slug = PROBE_SLUG!;
  const photos = PHOTOS[slug];
  const count = photos.length;
  const last = photos[count - 1];
  await page.goto(`/propiedades/${slug}/galeria`);

  const active = page.locator('[data-viewer-active] img');
  const counter = page.locator('[data-gallery-counter]');
  const thumbs = page.locator('[data-gallery-thumb]');
  const prev = page.getByRole('button', { name: 'Foto anterior', exact: true });
  const next = page.getByRole('button', { name: 'Foto siguiente', exact: true });

  await next.click();
  await expect(counter).toHaveText(`2 / ${count}`);
  await expect(active).toHaveAttribute('src', srcEnd(photos[1].src));

  await prev.click();
  await expect(counter).toHaveText(`1 / ${count}`);
  await expect(active).toHaveAttribute('src', srcEnd(photos[0].src));

  // Wrap-around: prev from the first photo lands on the last, next wraps back.
  await prev.click();
  await expect(counter).toHaveText(`${count} / ${count}`);
  await expect(active).toHaveAttribute('src', srcEnd(last.src));
  await expect(thumbs.nth(count - 1)).toHaveAttribute('aria-current', 'true');

  await next.click();
  await expect(counter).toHaveText(`1 / ${count}`);
  await expect(active).toHaveAttribute('src', srcEnd(photos[0].src));
});

test('the arrow keys and Home/End drive the viewer', async ({ page }) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries at least 3 photos');
  const slug = PROBE_SLUG!;
  const count = PHOTOS[slug].length;
  await page.goto(`/propiedades/${slug}/galeria`);

  const counter = page.locator('[data-gallery-counter]');

  await page.keyboard.press('ArrowRight');
  await expect(counter).toHaveText(`2 / ${count}`);
  await page.keyboard.press('ArrowRight');
  await expect(counter).toHaveText(`3 / ${count}`);
  await page.keyboard.press('ArrowLeft');
  await expect(counter).toHaveText(`2 / ${count}`);

  await page.keyboard.press('End');
  await expect(counter).toHaveText(`${count} / ${count}`);
  await page.keyboard.press('ArrowRight');
  await expect(counter).toHaveText(`1 / ${count}`);
  await page.keyboard.press('Home');
  await expect(counter).toHaveText(`1 / ${count}`);
});

test('?foto=N opens the requested photo after load', async ({ page }) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries at least 3 photos');
  const slug = PROBE_SLUG!;
  const photos = PHOTOS[slug];
  const count = photos.length;
  const third = photos[2];
  await page.goto(`/propiedades/${slug}/galeria?foto=3`);

  const active = page.locator('[data-viewer-active] img');
  await expect(active).toHaveAttribute('src', srcEnd(third.src));
  await expect(active).toHaveAttribute('alt', third.titulo);
  await expect(page.locator('[data-gallery-counter]')).toHaveText(`3 / ${count}`);
  await expect(page.locator('[data-gallery-thumb]').nth(2)).toHaveAttribute('aria-current', 'true');
  await expect(page).toHaveURL(/\?foto=3$/);
});

test('?foto=N arrives on the requested photo without the deferred viewer script', async ({
  page,
}) => {
  // Serve the document with the deferred viewer module stripped: only the
  // synchronous pre-paint script may run, so the active photo must already
  // be correct without the post-load deep-link apply (§17.5). Without the
  // pre-paint script the page would still show photo 1 here. (Astro inlines
  // page scripts into the HTML, so there is no external script to block —
  // the document itself is intercepted instead.)
  await page.route(
    (url) => url.pathname.endsWith('/galeria') && url.searchParams.get('foto') === '3',
    async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        /<script type="module">[\s\S]*?<\/script>/,
        '',
      );
      await route.fulfill({ response, body });
    },
  );

  test.skip(!PROBE_SLUG, 'no listing in the collection carries at least 3 photos');
  const slug = PROBE_SLUG!;
  const photos = PHOTOS[slug];
  const count = photos.length;
  const third = photos[2];
  await page.goto(`/propiedades/${slug}/galeria?foto=3`);

  const active = page.locator('[data-viewer-active] img');
  await expect(active).toHaveAttribute('src', srcEnd(third.src));
  await expect(active).toHaveAttribute('alt', third.titulo);
  await expect(page.locator('[data-gallery-counter]')).toHaveText(`3 / ${count}`);
  await expect(page.locator('[data-gallery-thumb]').nth(2)).toHaveAttribute('aria-current', 'true');
  // The rail order is untouched — photo 1 still first, photo N still last.
  await expect(page.locator('[data-gallery-thumb]').first()).toHaveAttribute(
    'aria-label',
    `Ver foto 1 de ${count}`,
  );
  await expect(page.locator('[data-gallery-thumb]').nth(count - 1)).toHaveAttribute(
    'aria-label',
    `Ver foto ${count} de ${count}`,
  );
});

test('opening the gallery from the detail lands on the selected photo', async ({ page }) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries at least 3 photos');
  const slug = PROBE_SLUG!;
  const photos = PHOTOS[slug];
  const count = photos.length;
  const third = photos[2];
  await page.goto(`/propiedades/${slug}`);

  // Enlarge the third photo on the detail page, then follow the lead link.
  await page.locator('[data-gallery-thumb]').nth(2).click();
  await page
    .getByRole('link', {
      name: `Ver galería de fotos (${count} ${count === 1 ? 'foto' : 'fotos'})`,
      exact: true,
    })
    .click();

  // The lead href carries the selection and the gallery arrives on it —
  // same order, no reset to photo 1.
  await expect(page).toHaveURL(new RegExp(`/propiedades/${slug}/galeria\\?foto=3`));
  const active = page.locator('[data-viewer-active] img');
  await expect(active).toHaveAttribute('src', srcEnd(third.src));
  await expect(active).toHaveAttribute('alt', third.titulo);
  await expect(page.locator('[data-gallery-counter]')).toHaveText(`3 / ${count}`);
  await expect(page.locator('[data-gallery-thumb]').nth(2)).toHaveAttribute('aria-current', 'true');
});

test('an invalid or out-of-range ?foto degrades to photo 1', async ({ page }) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries at least 3 photos');
  const slug = PROBE_SLUG!;
  const photos = PHOTOS[slug];
  const count = photos.length;
  for (const query of ['?foto=99', '?foto=0', '?foto=-2', '?foto=abc', '?foto=2.5']) {
    await page.goto(`/propiedades/${slug}/galeria${query}`);
    await expect(page.locator('[data-gallery-counter]'), query).toHaveText(`1 / ${count}`);
    await expect(page.locator('[data-viewer-active] img'), query).toHaveAttribute(
      'src',
      photos[0].src,
    );
    await expect(page.locator('[data-gallery-thumb]').first(), query).toHaveAttribute(
      'aria-current',
      'true',
    );
  }
});

test('moving the viewer keeps the deep link in sync via replaceState', async ({ page }) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries at least 3 photos');
  const slug = PROBE_SLUG!;
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
    test.skip(!PROBE_SLUG, 'no listing in the collection carries at least 3 photos');
    const slug = PROBE_SLUG!;
    const photos = PHOTOS[slug];
    const count = photos.length;
    const cover = photos[0];
    const response = await page.goto(`/propiedades/${slug}/galeria`);
    expect(response!.status()).toBe(200);

    const active = page.locator('[data-viewer-active] img');
    await expect(active).toHaveAttribute('src', srcEnd(cover.src));
    await expect(page.locator('[data-gallery-counter]')).toHaveText(`1 / ${count}`);
    await expect(page.locator('[data-gallery-thumb]')).toHaveCount(count);

    // The rail is inert: clicking swaps nothing without the script.
    await page.locator('[data-gallery-thumb]').nth(1).click();
    await expect(active).toHaveAttribute('src', srcEnd(cover.src));
    await expect(page.locator('[data-gallery-counter]')).toHaveText(`1 / ${count}`);

    // The back link still navigates — plain HTML, no JS involved.
    await expect(
      page.getByRole('link', { name: '← Volver a la ficha', exact: true }),
    ).toHaveAttribute('href', `/propiedades/${slug}`);
  });

  test('a ?foto=N deep link still renders photo 1 (the document is static)', async ({ page }) => {
    // Without JS nothing applies the deep link before or after load: the
    // served document always carries photo 1 (§17.5).
    test.skip(!PROBE_SLUG, 'no listing in the collection carries at least 3 photos');
    const slug = PROBE_SLUG!;
    const photos = PHOTOS[slug];
    const count = photos.length;
    await page.goto(`/propiedades/${slug}/galeria?foto=3`);

    await expect(page.locator('[data-viewer-active] img')).toHaveAttribute(
      'src',
      photos[0].src,
    );
    await expect(page.locator('[data-gallery-counter]')).toHaveText(`1 / ${count}`);
  });
});
