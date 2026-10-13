import { expect, test, type Page } from '@playwright/test';
import {
  expectedFeaturedLeadSlug,
  expectedProbeSlug,
  expectedSlugs,
} from './helpers/content-expectations';

/**
 * Cross-document view transitions on property imagery (docs/DESIGN.md §9 —
 * "Cross-document view transitions (property imagery)"; ODD track
 * `damero-view-transitions`, task T1).
 *
 * The contract under test:
 *  1. the served stylesheet ships the global `@view-transition` opt-in
 *     (`navigation: auto`) and the reduced-motion opt-out
 *     (`navigation: none`) — matched flexibly because the Astro CSS
 *     minifier reflows whitespace and casing;
 *  2. home featured card frames carry `view-transition-name:
 *     propiedad-<slug>` (computed);
 *  3. listing card frames carry the same convention;
 *  4. the detail gallery lead frame carries `propiedad-<slug>`, paired with
 *     the card of the same property on `/` and `/propiedades`;
 *  5. names are unique within each document (a duplicate invalidates the
 *     whole transition);
 *  6. gallery thumbnails and every other image element stay unnamed;
 *  7. the transitioned pages keep zero horizontal overflow.
 *
 * Slugs are read from the rendered card hrefs and cross-checked against the
 * real collection slugs — no invented data.
 */

/*
 * The known slugs derive from the collection (plan
 * `odd/tasks/damero-e2e-decouple.md`, T2) — the same source the build
 * renders, so the membership cross-check and the card-count assertion
 * below need no spec edit when a listing is added or removed.
 */
const KNOWN_SLUGS = new Set(expectedSlugs());

/*
 * The home featured lead derives from the collection (plan
 * `odd/tasks/damero-e2e-decouple.md`, T5): the first `destacada` listing in
 * canonical order. A `destacada` flip passes with zero spec edits.
 */
const FEATURED_LEAD_SLUG = expectedFeaturedLeadSlug();

const HOME_CARDS = '.featured a.card';
const LISTING_CARDS = '[data-results-grid] a.card';

/*
 * The single-listing probe target derives from the collection (plan
 * `odd/tasks/damero-e2e-decouple-probes.md`, T2): the first listing in
 * canonical order carrying a photo. DETAIL_PATH derives from it — no
 * literal slug; the three transitioned-page tests below skip with an
 * explicit reason when no listing qualifies.
 */
const PROBE_SLUG = expectedProbeSlug();
const DETAIL_PATH = PROBE_SLUG !== undefined ? `/propiedades/${PROBE_SLUG}` : undefined;

/**
 * slug → computed `view-transition-name` of the card's placeholder frame.
 * The browser-side function is deliberately self-contained (Playwright
 * serialises and re-evaluates it inside the page).
 */
async function collectCardNames(page: Page, selector: string): Promise<Record<string, string>> {
  const entries = await page.evaluate((sel) => {
    return Array.from(document.querySelectorAll(sel)).map((card) => {
      const href = card.getAttribute('href') ?? '';
      const slug = href.split('/').filter(Boolean).pop() ?? '';
      const frame = card.querySelector('.damero-placeholder');
      const name = frame
        ? getComputedStyle(frame).getPropertyValue('view-transition-name').trim()
        : '';
      return [slug, name] as const;
    });
  }, selector);
  return Object.fromEntries(entries);
}

/**
 * Every non-`none` computed `view-transition-name` in the document, except
 * the document root: Chromium's UA stylesheet assigns
 * `view-transition-name: root` to `<html>` — it is UA-assigned, never an
 * authored name (verified in this spec's RED run).
 */
async function collectAllNames(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const names: string[] = [];
    for (const el of Array.from(document.querySelectorAll('*'))) {
      if (el === document.documentElement) continue;
      const name = getComputedStyle(el).getPropertyValue('view-transition-name').trim();
      if (name && name !== 'none') names.push(name);
    }
    return names;
  });
}

/** Computed `view-transition-name` of every element matching `selector`. */
async function collectNamesFor(page: Page, selector: string): Promise<string[]> {
  return page.evaluate((sel) => {
    return Array.from(document.querySelectorAll(sel)).map((el) =>
      getComputedStyle(el).getPropertyValue('view-transition-name').trim(),
    );
  }, selector);
}

test.beforeEach(async ({ page }) => {
  await page.route(/openfreemap/, (route) => route.abort());
});

test('the served stylesheet ships the @view-transition opt-in and the reduced-motion opt-out', async ({
  page,
}) => {
  await page.goto('/');

  const hrefs = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')).filter((href): href is string => !!href),
    );
  expect(hrefs.length, 'at least one served stylesheet').toBeGreaterThan(0);

  let css = '';
  for (const href of hrefs) {
    const response = await page.request.get(href);
    expect(response.ok(), `stylesheet ${href} serves 200`).toBeTruthy();
    css += `${await response.text()}\n`;
  }

  // Flexible matching: the minifier may drop whitespace and reflow the rule.
  expect(css, 'global @view-transition opt-in').toMatch(
    /@view-transition\s*\{\s*navigation\s*:\s*auto\s*;?\s*\}/i,
  );
  expect(css, 'reduced-motion opt-out at the navigation level').toMatch(
    /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{\s*@view-transition\s*\{\s*navigation\s*:\s*none\s*;?\s*\}/i,
  );
});

test('home featured card frames carry the paired propiedad-<slug> name', async ({ page }) => {
  await page.goto('/');

  // The lead card is the featured (`destacada`) listing (index.astro:24-26).
  await expect(page.locator('.featured__lead a.card')).toHaveAttribute(
    'href',
    `/propiedades/${FEATURED_LEAD_SLUG}`,
  );

  const names = await collectCardNames(page, HOME_CARDS);
  const slugs = Object.keys(names);
  expect(slugs.length, 'featured cards render on the home').toBeGreaterThan(0);

  for (const slug of slugs) {
    expect(KNOWN_SLUGS.has(slug), `home card slug "${slug}" comes from the collection`).toBe(true);
    expect(names[slug], `home featured frame for ${slug}`).toBe(`propiedad-${slug}`);
  }
});

test('listing card frames carry the paired propiedad-<slug> name', async ({ page }) => {
  await page.goto('/propiedades');

  const names = await collectCardNames(page, LISTING_CARDS);
  const slugs = Object.keys(names);
  expect(slugs, 'every collection listing renders a card').toHaveLength(KNOWN_SLUGS.size);

  for (const slug of slugs) {
    expect(KNOWN_SLUGS.has(slug), `listing card slug "${slug}" comes from the collection`).toBe(
      true,
    );
    expect(names[slug], `listing card frame for ${slug}`).toBe(`propiedad-${slug}`);
  }
});

test('the detail lead frame pairs with the card of the same property on / and /propiedades', async ({
  page,
}) => {
  await page.goto('/');
  const homeNames = await collectCardNames(page, HOME_CARDS);

  await page.goto('/propiedades');
  const listingNames = await collectCardNames(page, LISTING_CARDS);

  for (const [slug, listingName] of Object.entries(listingNames)) {
    await page.goto(`/propiedades/${slug}`);
    const leadName = await page.evaluate(() => {
      const frame = document.querySelector('.gallery__lead .damero-placeholder');
      return frame
        ? getComputedStyle(frame).getPropertyValue('view-transition-name').trim()
        : '';
    });

    expect(leadName, `detail lead frame for ${slug}`).toBe(`propiedad-${slug}`);
    expect(leadName, `detail lead pairs with the listing card for ${slug}`).toBe(listingName);
    if (slug in homeNames) {
      expect(leadName, `detail lead pairs with the home card for ${slug}`).toBe(homeNames[slug]);
    }
  }
});

test('transition names are unique within each transitioned page', async ({ page }) => {
  test.skip(!DETAIL_PATH, 'no listing in the collection carries a photo');
  const detailPath = DETAIL_PATH!;
  const pages: Array<{ path: string; expectedCount: number }> = [];

  await page.goto('/');
  const homeCount = await page.locator(HOME_CARDS).count();
  pages.push({ path: '/', expectedCount: homeCount });

  await page.goto('/propiedades');
  const listingCount = await page.locator(LISTING_CARDS).count();
  pages.push({ path: '/propiedades', expectedCount: listingCount });

  pages.push({ path: detailPath, expectedCount: 1 });

  for (const { path, expectedCount } of pages) {
    await page.goto(path);
    const names = await collectAllNames(page);
    expect(names, `${path}: only the card frames (or the detail lead) are named`).toHaveLength(
      expectedCount,
    );
    expect(
      new Set(names).size,
      `${path}: duplicated view-transition-name invalidates the transition — ${names.join(', ')}`,
    ).toBe(names.length);
  }
});

test('gallery thumbnails and every other image element stay unnamed', async ({ page }) => {
  test.skip(!DETAIL_PATH, 'no listing in the collection carries a photo');
  const detailPath = DETAIL_PATH!;
  for (const path of ['/', '/propiedades', detailPath]) {
    await page.goto(path);

    const imgNames = await collectNamesFor(page, 'img');
    expect(imgNames.length, `${path}: images render`).toBeGreaterThan(0);
    for (const name of imgNames) {
      expect(name, `${path}: no img carries a view-transition-name`).toBe('none');
    }

    if (path === detailPath) {
      // The rail exists for listings with photographs; every thumbnail and
      // its image stay unnamed — only the lead frame is named.
      const thumbs = await collectNamesFor(page, '[data-gallery-thumb]');
      expect(thumbs.length, 'the gallery rail renders thumbnails').toBeGreaterThan(0);
      for (const name of thumbs) {
        expect(name, 'no gallery thumbnail carries a view-transition-name').toBe('none');
      }
    }
  }
});

test('no horizontal overflow on the transitioned pages', async ({ page }) => {
  test.skip(!DETAIL_PATH, 'no listing in the collection carries a photo');
  const detailPath = DETAIL_PATH!;
  for (const path of ['/', '/propiedades', detailPath]) {
    await page.goto(path);

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      metrics.scrollWidth,
      `${path} — horizontal overflow: scrollWidth ${metrics.scrollWidth} > clientWidth ${metrics.clientWidth} + 1`,
    ).toBeLessThanOrEqual(metrics.clientWidth + 1);
  }
});
