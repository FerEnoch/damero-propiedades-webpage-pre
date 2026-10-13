import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  expectedCoordinatesBySlug,
  expectedLocalidadesBySlug,
  expectedProbeSlug,
  expectedSlugs,
  expectedTitlesBySlug,
  expectedWhatsAppHrefsBySlug,
} from './helpers/content-expectations';

/**
 * Detail page structure and semantics (ODD §17 slice S3). Mirrors the S2
 * structure spec: route health for every collection entry, the §17.2 band
 * order, landmarks, heading levels, horizontal overflow, the breadcrumb
 * rules (§17.2:673), the PRD §9 / §17.2:705 coordinate ban, the MapLibre
 * bundle separation (R3), the inert WhatsApp href (R11), and the resolution
 * of the S2 card links.
 *
 * Map determinism: every spec in this file aborts the basemap provider, so
 * the suite never depends on live tiles — the §17.2:709 fallback is what
 * renders, every time.
 */

/*
 * Slugs and titles derive from the collection (plan
 * `odd/tasks/damero-e2e-decouple.md`, T2) — the same source the build
 * renders, so a listing add/remove or a title reword needs no spec edit.
 */
const SLUGS = expectedSlugs();
const TITLES = expectedTitlesBySlug();

/*
 * The single-listing probe target derives from the collection (plan
 * `odd/tasks/damero-e2e-decouple-probes.md`, T2): the first listing in
 * canonical order carrying a photo — the detail-template shape the
 * structural probes below exercise. When none qualifies, each probing
 * test skips with an explicit reason — never a fallback to a literal
 * slug.
 */
const PROBE_SLUG = expectedProbeSlug();

/*
 * The coordinate ban markers derive from the collection (plan
 * `odd/tasks/damero-e2e-decouple.md`, T5): every listing's `map_lat`/`map_lon`
 * plus the schema field names. A coordinate move stays exact instead of
 * going stale — a hardcoded marker would keep passing after the numbers
 * moved. The field names are schema-owned and stable.
 */
const COORDINATES = expectedCoordinatesBySlug();
/** The test-listing coordinates plus the schema field names — banned from HTML. */
const COORDINATE_MARKERS = [
  ...Object.values(COORDINATES).flatMap(({ lat, lon }) => [String(lat), String(lon)]),
  'map_lat',
  'map_lon',
];

test.beforeEach(async ({ page }) => {
  await page.route(/openfreemap/, (route) => route.abort());
});

test('each detail route responds 200 with a title and exactly one h1', async ({ page }) => {
  test.skip(SLUGS.length === 0, 'The collection is empty; no detail routes exist.');
  for (const slug of SLUGS) {
    const response = await page.goto(`/propiedades/${slug}`);
    expect(response).not.toBeNull();
    expect(response!.status(), `${slug} did not respond 200`).toBe(200);

    await expect(page, `${slug} title`).toHaveTitle(`${TITLES[slug]} | Damero Propiedades`);
    await expect(page.locator('h1'), `${slug} h1 count`).toHaveCount(1);
    await expect(page.locator('h1'), `${slug} h1 text`).toHaveText(TITLES[slug]);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  }
});

test('the §17.2 section order renders, with the documented CTA divergence', async ({ page }) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries a photo');
  const slug = PROBE_SLUG!;
  await page.goto(`/propiedades/${slug}`);

  /*
   * §17.2:671 fixes gallery → title/description → characteristics → price →
   * zone → map → CTA, but §17.2:697 places the CTA inside the price panel
   * (open item #4: the aside wins, the divergence is documented in the
   * page's docblock). `more` is the desktop screen's locality link, outside
   * §17.2's list.
   */
  const bands = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main [data-band]')).map((band) =>
      band.getAttribute('data-band'),
    ),
  );
  expect(bands).toEqual(['gallery', 'title', 'characteristics', 'price', 'zone', 'map', 'more']);
});

test('header, main, footer and breadcrumb landmarks are present', async ({ page }) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries a photo');
  const slug = PROBE_SLUG!;
  await page.goto(`/propiedades/${slug}`);

  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Miga de pan' })).toHaveCount(1);
});

test('heading levels never skip (h1 to h2 to h3)', async ({ page }) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries a photo');
  const slug = PROBE_SLUG!;
  await page.goto(`/propiedades/${slug}`);

  const levels = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6')).map(
      (heading) => Number(heading.tagName.slice(1)),
    ),
  );

  expect(levels.length).toBeGreaterThan(0);
  expect(levels[0]).toBe(1);
  for (let i = 1; i < levels.length; i++) {
    expect(
      levels[i],
      `heading #${i + 1} jumps from h${levels[i - 1]} to h${levels[i]}`,
    ).toBeLessThanOrEqual(levels[i - 1] + 1);
  }
});

test('no horizontal overflow', async ({ page }) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries a photo');
  const slug = PROBE_SLUG!;
  await page.goto(`/propiedades/${slug}`);

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    metrics.scrollWidth,
    `horizontal overflow: scrollWidth ${metrics.scrollWidth} > clientWidth ${metrics.clientWidth} + 1`,
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);
});

test('breadcrumb ancestors are links and the current segment is not (§17.2:673)', async ({
  page,
}) => {
  // Structural probe on one listing; the asserted title derives from the
  // collection (T2), never a literal copy of the business value. The
  // localidad segment derives too (T5): uppercase via CSS, value from data.
  test.skip(!PROBE_SLUG, 'no listing in the collection carries a photo');
  const slug = PROBE_SLUG!;
  const localidad = expectedLocalidadesBySlug()[slug];
  const localidadPattern = new RegExp(
    `^${localidad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
    'i',
  );
  await page.goto(`/propiedades/${slug}`);

  const breadcrumb = page.getByRole('navigation', { name: 'Miga de pan' });
  const links = breadcrumb.getByRole('link');
  await expect(links).toHaveCount(2);

  // §17.2:673 asks for uppercase, and the repo achieves it with CSS
  // `text-transform` on the label, not by uppercasing the copy in markup.
  // `toHaveText` reads the DOM text, so it must match the data's own case
  // while this assertion carries the uppercase requirement.
  await expect(breadcrumb.locator('.breadcrumb__list')).toHaveCSS('text-transform', 'uppercase');
  await expect(links.nth(0)).toHaveText(/^propiedades$/i);
  await expect(links.nth(0)).toHaveAttribute('href', '/propiedades');
  await expect(links.nth(1)).toHaveText(localidadPattern);
  await expect(links.nth(1)).toHaveAttribute(
    'href',
    `/propiedades?localidad=${encodeURIComponent(localidad)}`,
  );

  // The current segment is plain text — never a link. The asserted title
  // derives from the collection (T2), never a literal copy.
  const current = breadcrumb.locator('.breadcrumb__current');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText(TITLES[slug]);
  await expect(current).toHaveAttribute('aria-current', 'page');
  await expect(breadcrumb.locator('li:last-child a')).toHaveCount(0);
});

test('no numeric coordinate renders in the detail HTML (§17.2:705, PRD §9)', async ({ page }) => {
  test.skip(SLUGS.length === 0, 'The collection is empty; no detail HTML exists.');
  for (const slug of SLUGS) {
    await page.goto(`/propiedades/${slug}`);
    const rendered = await page.content();
    for (const marker of COORDINATE_MARKERS) {
      expect(rendered.includes(marker), `${slug}: ${marker} in the rendered HTML`).toBe(false);
    }

    // The raw server-rendered source, not just the live DOM.
    const raw = readFileSync(`dist/propiedades/${slug}/index.html`, 'utf8');
    for (const marker of COORDINATE_MARKERS) {
      expect(raw.includes(marker), `${slug}: ${marker} in dist HTML`).toBe(false);
    }
  }
});

test('the build emits the per-listing map payload as a separate asset', async () => {
  test.skip(SLUGS.length === 0, 'The collection is empty; no per-listing map payloads exist.');
  /*
   * The coordinate pipeline (§17.2:705): the numbers live ONLY in these
   * build-emitted JSON assets, fetched at map init — never in the HTML.
   * The payloads derive from the collection (T5), so a coordinate move
   * passes with zero spec edits.
   */
  for (const [slug, expected] of Object.entries(COORDINATES)) {
    const raw = readFileSync(`dist/propiedades/${slug}.json`, 'utf8');
    expect(JSON.parse(raw), `${slug}.json payload`).toEqual(expected);
  }
});

test('MapLibre stays off the landing and the search page entirely (R3)', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  for (const path of ['/', '/propiedades']) {
    await page.goto(path);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
  }

  const mapRequests = requests.filter((url) => /maplibre|detail-map/i.test(url));
  expect(mapRequests, 'a page outside the detail loaded the map chunk').toEqual([]);
});

test('the initial HTML of every route references no map chunk', async () => {
  const files = [
    'dist/index.html',
    'dist/propiedades/index.html',
    ...SLUGS.map((slug) => `dist/propiedades/${slug}/index.html`),
  ];
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    expect(/maplibre/i.test(html), `${file} references maplibre in the initial HTML`).toBe(false);
  }
});

test('R11: the WhatsApp CTAs carry the derived href — inert while pending, wa.me once real', async ({
  page,
}) => {
  test.skip(SLUGS.length === 0, 'The collection is empty; no per-listing WhatsApp CTAs exist.');
  /*
   * R11 derives from each listing's `whatsapp` field (plan T5): the inert
   * anchor while the number is pending, the `wa.me` deep link once the
   * stakeholder supplies a real number. Activating a CTA is a content
   * change, not a spec change — `wa.me` ships if and only if the derived
   * href carries it.
   */
  const hrefs = expectedWhatsAppHrefsBySlug();
  for (const slug of SLUGS) {
    const href = hrefs[slug];
    await page.goto(`/propiedades/${slug}`);
    const html = await page.content();
    expect(html.includes('wa.me'), `${slug} ships a wa.me link`).toBe(
      href.startsWith('https://wa.me'),
    );

    await expect(page.locator('.price-panel__cta .whatsapp-cta')).toHaveAttribute('href', href);
    await expect(page.locator('.whatsapp-sticky__link')).toHaveAttribute('href', href);
  }
});

test('the search cards resolve to the detail routes', async ({ page }) => {
  test.skip(SLUGS.length === 0, 'The collection is empty; no search cards exist.');
  await page.goto('/propiedades');

  // R9: collection order is canonical, so the first card is the first record
  // in filename order — derived from the collection (T2), never a literal.
  const first = SLUGS[0];
  await page.locator('.results-grid .card').first().click();
  await expect(page).toHaveURL(new RegExp(`/propiedades/${first}/?$`));
  await expect(page.locator('h1')).toHaveText(TITLES[first]);
});
