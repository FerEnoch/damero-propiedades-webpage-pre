import { expect, test } from '@playwright/test';
import {
  expectedCharacteristicLabelsBySlug,
  expectedFichaRowsBySlug,
  expectedPhotosBySlug,
  expectedPricesBySlug,
  expectedProbeSlug,
  expectedWhatsAppHrefsBySlug,
} from './helpers/content-expectations';

/**
 * Detail page content rules (ODD §17 slice S3): R4's per-listing gallery
 * contract (photos → lead + rail + counter; `fotos: []` → brand tile only),
 * R12's ficha técnica rows, the always-present currency code (§17.2:690),
 * the no-dictionary characteristics labels (§17.2:686), the CTA placement
 * and mutual exclusion per viewport (§17.2:697-699), and the map fallback
 * state (§17.2:708-709) — exercised deterministically with the basemap
 * provider aborted, so no spec depends on live tiles.
 */

/*
 * Per-listing photos derive from the collection (plan
 * `odd/tasks/damero-e2e-decouple.md`, T3) — the same source the build
 * renders, so adding/removing a photo needs no spec edit. As of PD-02 all
 * six listings ship photos, so the empty branch stays as the R4 contract
 * fallback; the cover `alt` mirrors the `?? ''` render contract.
 */
const PHOTOS = expectedPhotosBySlug();

/*
 * The single-listing probe target derives from the collection (plan
 * `odd/tasks/damero-e2e-decouple-probes.md`, T2): the rail thumbnail-2
 * interaction needs a listing with at least 2 photos, which also satisfies
 * every template probe below (the JSON payload wait derives its pattern
 * from the same pick). When none qualifies, each probing test skips with
 * an explicit reason — never a fallback to a literal slug.
 */
const PROBE_SLUG = expectedProbeSlug(2);

/*
 * End-anchored `src` matcher from a collection-derived path. The initial
 * render serves the frontmatter path verbatim, but the gallery script swaps
 * via the resolved (absolute) URL — so post-swap attributes only assert the
 * filename suffix (T3).
 */
function srcEnd(src: string): RegExp {
  const base = src.split('/').pop() ?? src;
  return new RegExp(`${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

test.beforeEach(async ({ page }) => {
  test.skip(
    Object.keys(PHOTOS).length === 0,
    'The collection is empty; detail probes require a listing.',
  );
  await page.route(/openfreemap/, (route) => route.abort());
});

test('R4: each gallery matches its fotos contract — lead + rail + counter, or brand tile alone', async ({
  page,
}) => {
  for (const [slug, photos] of Object.entries(PHOTOS)) {
    const count = photos.length;
    // The cover alt mirrors the `?? ''` render contract (T3 sync point).
    const leadAlt = photos[0]?.titulo ?? '';
    await page.goto(`/propiedades/${slug}`);

    const leadImg = page.locator('.gallery__lead img');

    if (count > 0) {
      // The cover photo renders from the listing's own folder (PRD §7) and
      // is the first `fotos` entry.
      await expect(leadImg).toBeVisible();
      await expect(leadImg).toHaveAttribute('src', new RegExp(`/propiedades/${slug}/`));
      await expect(leadImg).toHaveAttribute('alt', leadAlt);

      // CLS contract: layout-reserving attributes and the eager lead (§7).
      await expect(leadImg).toHaveAttribute('width', /\d+/);
      await expect(leadImg).toHaveAttribute('height', /\d+/);
      await expect(leadImg).toHaveAttribute('loading', 'eager');
      await expect(leadImg).toHaveAttribute('fetchpriority', 'high');

      // Rail, one thumbnail per photo, and the honest counter (§17.2:678).
      await expect(page.locator('[data-gallery-rail]')).toBeVisible();
      await expect(page.locator('[data-gallery-thumb]')).toHaveCount(count);
      await expect(page.locator('[data-gallery-counter]')).toHaveText(`1 / ${count}`);
      await expect(page.locator('[data-gallery-thumb]').first()).toHaveAttribute(
        'aria-label',
        `Ver foto 1 de ${count}`,
      );
      await expect(page.locator('[data-gallery-thumb]').first()).toHaveAttribute(
        'aria-current',
        'true',
      );
    } else {
      // R4 empty contract: the brand placeholder only — never a fabricated
      // photograph, never an invented `1 / N` (§7).
      await expect(page.locator('.gallery__lead .damero-placeholder')).toBeVisible();
      await expect(leadImg).toHaveCount(0);
      await expect(page.locator('[data-gallery-rail]')).toHaveCount(0);
      await expect(page.locator('[data-gallery-thumb]')).toHaveCount(0);
      await expect(page.locator('[data-gallery-counter]')).toHaveCount(0);
      // §17.5: with no photographs the lead is NOT a link — the placeholder
      // stays non-interactive, no morph target, no gallery route entry.
      await expect(page.locator('.gallery__lead a')).toHaveCount(0);
    }
  }
});

test('the gallery lead links to the full-page gallery, with the photo count in its accessible name', async ({
  page,
}) => {
  for (const [slug, photos] of Object.entries(PHOTOS)) {
    const count = photos.length;
    await page.goto(`/propiedades/${slug}`);

    if (count > 0) {
      // §17.5: the lead is a real link — it navigates without JS — and its
      // accessible name carries the photo count.
      const leadLink = page.getByRole('link', {
        name: `Ver galería de fotos (${count} ${count === 1 ? 'foto' : 'fotos'})`,
        exact: true,
      });
      await expect(leadLink, `${slug} lead link`).toHaveCount(1);
      await expect(leadLink).toHaveAttribute('href', `/propiedades/${slug}/galeria?foto=1`);
      // The link wraps the lead photo, and nothing else interactive.
      await expect(leadLink.locator('img')).toHaveCount(1);
    } else {
      // `fotos: []`: the placeholder stays non-interactive (R4, §17.5).
      await expect(page.locator('.gallery__lead a')).toHaveCount(0);
      await expect(page.locator('.gallery__lead .damero-placeholder')).toBeVisible();
    }
  }
});

test('rail interaction: thumbnail 2 swaps the lead, moves aria-current and counts 2 / N', async ({
  page,
}) => {
  // Structural probe on one listing; every asserted photo value derives
  // from the collection (T3), never a literal copy of the business data.
  test.skip(!PROBE_SLUG, 'no listing in the collection carries at least 2 photos');
  const slug = PROBE_SLUG!;
  const photos = PHOTOS[slug];
  const count = photos.length;
  const second = photos[1];
  await page.goto(`/propiedades/${slug}`);

  const thumbs = page.locator('[data-gallery-thumb]');
  const leadImg = page.locator('.gallery__lead img');
  const counter = page.locator('[data-gallery-counter]');

  await expect(leadImg).toHaveAttribute('alt', photos[0].titulo);
  await expect(counter).toHaveText(`1 / ${count}`);

  // §17.2:680 — activating a thumbnail swaps the lead, its alt, the
  // `aria-current` marker and the counter.
  await thumbs.nth(1).click();

  await expect(leadImg).toHaveAttribute('src', srcEnd(second.src));
  await expect(leadImg).toHaveAttribute('alt', second.titulo);
  await expect(counter).toHaveText(`2 / ${count}`);
  await expect(thumbs.nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(thumbs.nth(0)).not.toHaveAttribute('aria-current', 'true');

  // §17.5: the lead link follows the selection — opening the gallery from
  // here lands on the enlarged photo instead of resetting to photo 1.
  const leadLink = page.getByRole('link', {
    name: `Ver galería de fotos (${count} ${count === 1 ? 'foto' : 'fotos'})`,
    exact: true,
  });
  await expect(leadLink).toHaveAttribute('href', `/propiedades/${slug}/galeria?foto=2`);
});

test('the price renders with the currency code always present (§17.2:690)', async ({ page }) => {
  /*
   * Rendering contract, not literal business values (plan T1): the currency
   * code is the listing's `moneda` and the amount is `precio` grouped
   * `es-AR`, both derived from the collection — the same source the build
   * renders. A legitimate price edit passes with zero spec edits.
   */
  for (const [slug, expected] of Object.entries(expectedPricesBySlug())) {
    await page.goto(`/propiedades/${slug}`);
    await expect(page.locator('.price-panel__currency')).toHaveText(expected.currency);
    await expect(page.locator('.price-panel__value')).toHaveText(expected.amount);
  }
});

test('R12: the ficha técnica rows degrade gracefully and never drop a row', async ({ page }) => {
  /*
   * Rendering contract, not literal business values (plan T5): every row
   * derives from the collection — the same source the build renders. An
   * expensas/cochera/operacion edit passes with zero spec edits.
   */
  const expectations = expectedFichaRowsBySlug();

  for (const [slug, rows] of Object.entries(expectations)) {
    await page.goto(`/propiedades/${slug}`);

    // Every row renders — `expensas` null/absent is `No aplica`, never a
    // dropped row (§17.2:693).
    const rendered = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.price-panel__row')).map((row) => ({
        label: row.querySelector('dt')?.textContent?.trim() ?? '',
        value: row.querySelector('dd')?.textContent?.trim() ?? '',
      })),
    );
    const renderedMap = Object.fromEntries(rendered.map((row) => [row.label, row.value]));
    expect(renderedMap, `${slug} ficha rows`).toEqual(rows);
  }
});

test('characteristics render the slugs as uppercase words, no dictionary (§17.2:686)', async ({
  page,
}) => {
  /*
   * Rendering contract, not literal business values (plan T5): the labels
   * derive from the collection's `caracteristicas` through the same
   * slug-to-words rule the page uses. A characteristic add/remove passes
   * with zero spec edits.
   */
  const expectations = expectedCharacteristicLabelsBySlug();

  for (const [slug, labels] of Object.entries(expectations)) {
    await page.goto(`/propiedades/${slug}`);
    const rendered = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.characteristics__item')).map((item) =>
        (item.textContent ?? '').trim(),
      ),
    );
    expect(rendered, `${slug} characteristics`).toEqual(labels);

    // Labels, not controls: no button, no link, no × affordance (§17.2:685).
    await expect(page.locator('.characteristics__list button')).toHaveCount(0);
    await expect(page.locator('.characteristics__list a')).toHaveCount(0);
  }
});

test('exactly one primary action per viewport (§17.2:697-699)', async ({ page, viewport }) => {
  // Structural probe on one listing; the CTA href derives from the
  // listing's `whatsapp` field (plan T5) — inert while pending, `wa.me`
  // once the stakeholder supplies a real number.
  test.skip(!PROBE_SLUG, 'no listing in the collection carries at least 2 photos');
  const slug = PROBE_SLUG!;
  const ctaHref = expectedWhatsAppHrefsBySlug()[slug];
  await page.goto(`/propiedades/${slug}`);

  const inlineCta = page.locator('.price-panel__cta .whatsapp-cta');
  const stickyBar = page.locator('.whatsapp-sticky__link');

  if (viewport && viewport.width >= 768) {
    // Desktop: the CTA sits inside the price panel; no sticky bar exists.
    await expect(inlineCta).toBeVisible();
    await expect(stickyBar).toBeHidden();
    await expect(inlineCta).toHaveAttribute('href', ctaHref);
  } else {
    // Mobile: the sticky bar takes over; the in-flow CTA is omitted.
    await expect(inlineCta).toBeHidden();
    await expect(stickyBar).toBeVisible();
    await expect(stickyBar).toHaveAttribute('href', ctaHref);
  }
});

test('the map fallback keeps the frame, caption and role=status with the style aborted', async ({
  page,
}) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries at least 2 photos');
  const slug = PROBE_SLUG!;
  await page.goto(`/propiedades/${slug}`);

  const frame = page.locator('.map-frame');
  const fallback = page.locator('[data-map-fallback]');
  const canvas = page.locator('[data-map-canvas]');
  const retry = fallback.getByRole('button', { name: 'Reintentar' });

  // The fallback is the default, honest state (JS or style failure).
  await expect(frame).toBeVisible();
  await expect(fallback).toBeVisible();
  await expect(fallback).toHaveAttribute('role', 'status');
  await expect(fallback.locator('svg.map-fallback__icon')).toBeVisible();
  await expect(fallback.locator('svg.map-fallback__icon')).toHaveAttribute('aria-hidden', 'true');
  await expect(
    fallback.getByText('Ubicación no disponible momentáneamente.'),
  ).toBeVisible();
  await expect(retry).toBeVisible();

  // The caption stays in every state (§17.2:708).
  await expect(page.getByText('REFERENCIA · RADIO 100 M')).toBeVisible();

  /*
   * Scroll the frame into view: the init runs, the coordinates arrive via
   * the build-emitted JSON, but the basemap request is aborted — so the
   * fallback must persist. It is not an error dialog and never names the
   * tile provider (§17.2:709-710).
   */
  const payloadResponse = page.waitForResponse(new RegExp(`/propiedades/${slug}\\.json`));
  await frame.scrollIntoViewIfNeeded();
  await payloadResponse;
  await page.waitForRequest(/openfreemap/).catch(() => null);
  await page.waitForTimeout(400);

  await expect(fallback).toBeVisible();
  await expect(canvas).not.toBeVisible();
  await expect(page.getByText('REFERENCIA · RADIO 100 M')).toBeVisible();

  // `Reintentar` retries the init; with the style still aborted the
  // fallback simply persists.
  await retry.click();
  await page.waitForTimeout(400);
  await expect(fallback).toBeVisible();
  await expect(canvas).not.toBeVisible();

  const fallbackText = await fallback.innerText();
  expect(fallbackText).not.toMatch(/openfreemap|openstreetmap|maplibre/i);
});

test('the approximate-zone note is added on mobile only (§17.2:708)', async ({
  page,
  viewport,
}) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries at least 2 photos');
  const slug = PROBE_SLUG!;
  await page.goto(`/propiedades/${slug}`);

  const note = page.getByText('La ubicación mostrada es exacta; el círculo es una referencia de 100 m.');
  if (viewport && viewport.width >= 768) {
    await expect(note).toBeHidden();
  } else {
    await expect(note).toBeVisible();
  }
});

test('the map container carries a meaningful accessible name (§12, §17.2:710)', async ({
  page,
}) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries at least 2 photos');
  const slug = PROBE_SLUG!;
  await page.goto(`/propiedades/${slug}`);

  await expect(page.locator('[data-map-canvas]')).toHaveAttribute('role', 'region');
  await expect(page.locator('[data-map-canvas]')).toHaveAttribute(
    'aria-label',
    'Mapa de la ubicación',
  );
});
