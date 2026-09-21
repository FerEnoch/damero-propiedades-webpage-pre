import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

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

const SLUGS = [
  'casa-quinta-3amb',
  'departamento-2-amb-balcon',
  'lote-600-m2-apto-credito',
] as const;

const TITLES: Record<(typeof SLUGS)[number], string> = {
  'casa-quinta-3amb': 'Casa 3 ambientes con patio en zona quinta',
  'departamento-2-amb-balcon': 'Departamento 2 ambientes con balcón',
  'lote-600-m2-apto-credito': 'Lote 600 m² apto crédito',
};

/** The seed coordinates plus the schema field names — banned from HTML. */
const COORDINATE_MARKERS = [
  '-34.55',
  '-59.12',
  '-34.665',
  '-59.445',
  '-34.555',
  '-59.085',
  'map_lat',
  'map_lon',
];

test.beforeEach(async ({ page }) => {
  await page.route(/openfreemap/, (route) => route.abort());
});

test('each detail route responds 200 with a title and exactly one h1', async ({ page }) => {
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
  await page.goto('/propiedades/casa-quinta-3amb');

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
  await page.goto('/propiedades/casa-quinta-3amb');

  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Miga de pan' })).toHaveCount(1);
});

test('heading levels never skip (h1 to h2 to h3)', async ({ page }) => {
  await page.goto('/propiedades/casa-quinta-3amb');

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
  await page.goto('/propiedades/lote-600-m2-apto-credito');

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
  await page.goto('/propiedades/casa-quinta-3amb');

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
  await expect(links.nth(1)).toHaveText(/^luján$/i);
  await expect(links.nth(1)).toHaveAttribute('href', '/propiedades?localidad=Luj%C3%A1n');

  // The current segment is plain text — never a link.
  const current = breadcrumb.locator('.breadcrumb__current');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText('Casa 3 ambientes con patio en zona quinta');
  await expect(current).toHaveAttribute('aria-current', 'page');
  await expect(breadcrumb.locator('li:last-child a')).toHaveCount(0);
});

test('no numeric coordinate renders in the detail HTML (§17.2:705, PRD §9)', async ({ page }) => {
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
  /*
   * The coordinate pipeline (§17.2:705): the numbers live ONLY in these
   * build-emitted JSON assets, fetched at map init — never in the HTML.
   */
  const payloads: Record<string, { lat: number; lon: number }> = {
    'casa-quinta-3amb': { lat: -34.55, lon: -59.12 },
    'departamento-2-amb-balcon': { lat: -34.665, lon: -59.445 },
    'lote-600-m2-apto-credito': { lat: -34.555, lon: -59.085 },
  };
  for (const [slug, expected] of Object.entries(payloads)) {
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

test('R11: every WhatsApp CTA is the inert pending anchor — no wa.me ships', async ({ page }) => {
  for (const slug of SLUGS) {
    await page.goto(`/propiedades/${slug}`);
    const html = await page.content();
    expect(html.includes('wa.me'), `${slug} ships a wa.me link`).toBe(false);

    await expect(page.locator('.price-panel__cta .whatsapp-cta')).toHaveAttribute(
      'href',
      '#whatsapp-pendiente',
    );
    await expect(page.locator('.whatsapp-sticky__link')).toHaveAttribute(
      'href',
      '#whatsapp-pendiente',
    );
  }
});

test('the search cards resolve to the detail routes', async ({ page }) => {
  await page.goto('/propiedades');

  await page.locator('.results-grid .card').first().click();
  await expect(page).toHaveURL(/\/propiedades\/casa-quinta-3amb\/?$/);
  await expect(page.locator('h1')).toHaveText('Casa 3 ambientes con patio en zona quinta');
});
