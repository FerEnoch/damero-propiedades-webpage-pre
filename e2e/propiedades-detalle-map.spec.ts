import { expect, test, type Page } from '@playwright/test';
import { expectedCoordinatesBySlug, expectedProbeSlug } from './helpers/content-expectations';
import { decodePng, meanPatchRgb } from './helpers/png-decode';

/**
 * Positive render coverage for the detail-page map (ODD
 * `detail-map-render`, T3) — the hole that let the broken-map bug ship
 * green: until this spec, every detail test aborted the basemap provider in
 * `beforeEach` and asserted ONLY the §17.2:709 fallback, so a regression
 * that broke the real render passed the gate silently.
 *
 * (a) `deterministic` intercepts the style request and serves a minimal
 *     local style with a pure-black background layer; every OTHER request to
 *     the tile host is aborted, so any network leak breaks the render and
 *     fails the test. The overlay assertion is about painted pixels: the
 *     composited frame is screenshotted, the PNG is decoded in Node
 *     (`preserveDrawingBuffer: false` forbids reading the canvas back), and
 *     a patch at the frame centre — where the fixed 100 m reference circle
 *     sits at `zoom: 14.5` (≈17 px radius, viewport-independent) — is compared
 *     against a corner patch that must stay the stub's pure black.
 *
 * (b) `live smoke` runs against the real OpenFreeMap style with no
 *     stubbing, and skips honestly when the provider is unreachable so an
 *     offline environment never breaks the gate.
 *
 * Both tests skip with an explicit reason when WebGL is unavailable: that
 * is an environment gap, not a product regression.
 */

/*
 * The single-listing probe target derives from the collection (plan
 * `odd/tasks/damero-e2e-decouple-probes.md`, T2): the first listing in
 * canonical order carrying a photo — the render probes need a real
 * detail route. Both tests below skip with an explicit reason when no
 * listing qualifies, never fall back to a literal slug.
 */
const PROBE_SLUG = expectedProbeSlug();
const COORDINATES = expectedCoordinatesBySlug();
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

test('external map link waits for the existing payload and opens the exact Google Maps location', async ({
  page,
}) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries a photo');
  const slug = PROBE_SLUG!;
  const { lat, lon } = COORDINATES[slug];
  let payloadRequests = 0;
  let releasePayload!: () => void;
  const pendingPayload = new Promise<void>((resolve) => {
    releasePayload = resolve;
  });
  await page.route(/openfreemap/, (route) => route.abort());
  await page.route(`**/propiedades/${slug}.json`, async (route) => {
    payloadRequests += 1;
    await pendingPayload;
    await route.continue();
  });

  await page.goto(`/propiedades/${slug}`);
  const link = page.locator('[data-map-external-link]');
  await expect(link).toHaveCount(1);
  const requested = page.waitForRequest(`**/propiedades/${slug}.json`);
  await page.locator('[data-map-frame]').scrollIntoViewIfNeeded();
  await requested;
  await expect(link).toHaveJSProperty('hidden', true);
  await expect(link).toBeHidden();
  await expect(link).not.toHaveAttribute('href');

  releasePayload();
  await expect(link).toBeVisible();
  await expect(link).toHaveJSProperty('hidden', false);
  await expect(link).toHaveText('Ver en Google Maps');
  await expect(link).toHaveAttribute(
    'href',
    `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
  );
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener');
  expect(await link.evaluate((el) => el.previousElementSibling?.className)).toBe('map-note');
  expect(payloadRequests, 'the link must reuse the map payload request').toBe(1);
});

test('external map link stays hidden after a payload failure and appears after retry succeeds', async ({
  page,
}) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries a photo');
  const slug = PROBE_SLUG!;
  await page.route(/openfreemap/, (route) => route.abort());
  await page.route(`**/propiedades/${slug}.json`, (route) => route.fulfill({ status: 503 }));
  await page.goto(`/propiedades/${slug}`);
  const failedPayload = page.waitForResponse(`**/propiedades/${slug}.json`);
  await page.locator('[data-map-frame]').scrollIntoViewIfNeeded();
  expect((await failedPayload).status()).toBe(503);

  const link = page.locator('[data-map-external-link]');
  await expect(link).toHaveCount(1);
  await expect(link).toHaveJSProperty('hidden', true);
  await expect(link).toBeHidden();
  await expect(link).not.toHaveAttribute('href');
  await expect(page.locator('[data-map-fallback]')).toBeVisible();
  await page.unroute(`**/propiedades/${slug}.json`);
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  const { lat, lon } = COORDINATES[slug];
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute(
    'href',
    `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
  );
});

test.describe('static external map link', () => {
  test.use({ javaScriptEnabled: false });

  test('HTML contains no coordinates, Google URL or query and the no-JS link stays hidden', async ({ page }) => {
    test.skip(!PROBE_SLUG, 'no listing in the collection carries a photo');
    const slug = PROBE_SLUG!;
    const response = await page.goto(`/propiedades/${slug}`);
    const html = await response!.text();
    const { lat, lon } = COORDINATES[slug];
    expect(html).not.toContain(String(lat));
    expect(html).not.toContain(String(lon));
    expect(html).not.toMatch(/map_lat|map_lon|google\.com\/maps|api=1|query=/);
    const link = page.locator('[data-map-external-link]');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('hidden', '');
    await expect(link).toBeHidden();
    await expect(link).not.toHaveAttribute('href');
  });
});

/*
 * A valid MapLibre style with a single opaque black background. No glyphs,
 * no sprites, no tile sources — nothing else the map could ask the network
 * for. The black field makes the overlay probe unambiguous: the accent fill
 * (--color-graphic-accent = --color-sage #7C916F, per §13 read at runtime)
 * at fill-opacity 0.15 over black lifts the centre patch to ≈ rgb(19, 22,
 * 17) while every corner stays rgb(0, 0, 0).
 */
const STUB_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#000000' } }],
} as const;

/** WebGL preflight — MapLibre cannot render without it. */
async function webglAvailable(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    try {
      const probe = document.createElement('canvas');
      return Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'));
    } catch {
      return false;
    }
  });
}

test('deterministic: the stub style renders the canvas, hides the fallback and paints the zone overlay', async ({
  page,
}, testInfo) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries a photo');
  const slug = PROBE_SLUG!;
  let styleRequestsServed = 0;
  await page.route(/tiles\.openfreemap\.org/, (route) => {
    const url = route.request().url();
    if (url === STYLE_URL || url === `${STYLE_URL}/`) {
      styleRequestsServed += 1;
      // ACAO mirrors the real provider: without it the renderer blocks the
      // cross-origin fetch even though the response is synthesised locally.
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(STUB_STYLE),
      });
    }
    // Anything else leaking to the tile host breaks the render — the proof
    // that this test runs with zero external network.
    return route.abort();
  });

  await page.goto(`/propiedades/${slug}`);
  testInfo.skip(
    !(await webglAvailable(page)),
    'WebGL unavailable in this environment — map render test skipped (environment gap, not a product regression).',
  );

  const frame = page.locator('[data-map-frame]');
  const canvas = page.locator('[data-map-canvas]');
  const fallback = page.locator('[data-map-fallback]');

  // The map lazy-inits via IntersectionObserver when the frame approaches.
  await frame.scrollIntoViewIfNeeded();

  // The ready contract: `is-ready` is added only after addSource('zone')
  // and both overlay layers succeed, and the fallback is hidden on ready.
  await expect(canvas).toHaveClass(/is-ready/, { timeout: 15_000 });
  await expect(canvas).toBeVisible();
  await expect(fallback).toBeHidden();
  await expect(fallback).toHaveJSProperty('hidden', true);

  // The stub — not the network — served the style.
  expect(styleRequestsServed, 'the stub style route never fired').toBeGreaterThan(0);

  // Painted pixels, not classes: poll the composited frame until the zone
  // fill shows over the stub's black field (screenshot timing vs. the
  // WebGL repaint is the only non-determinism here).
  const probe = async () => {
    const png = decodePng(await frame.screenshot());
    return {
      centre: meanPatchRgb(png, Math.floor(png.width / 2) - 4, Math.floor(png.height / 2) - 4, 8),
      corner: meanPatchRgb(png, 4, 4, 8),
    };
  };
  await expect
    .poll(async () => (await probe()).centre[1], {
      timeout: 5_000,
      message: 'the zone overlay fill never painted at the frame centre',
    })
    .toBeGreaterThanOrEqual(12);

  const { corner, centre } = await probe();
  expect(
    Math.max(...corner),
    `frame corner is not the stub black background (rgb ${corner.map(Math.round).join(', ')}) — the real style may have leaked in`,
  ).toBeLessThanOrEqual(4);
  expect(
    centre[1] - corner[1],
    'no accent fill detected at the frame centre',
  ).toBeGreaterThanOrEqual(12);
});

test('live smoke: the real OpenFreeMap style renders the map (skips when offline)', async ({
  page,
}, testInfo) => {
  test.skip(!PROBE_SLUG, 'no listing in the collection carries a photo');
  const slug = PROBE_SLUG!;
  await page.goto(`/propiedades/${slug}`);

  /*
   * Offline must skip, never fail the gate. The preflight runs INSIDE the
   * page: the browser's network stack is the one the map render will use,
   * and it can differ from the test process's (proxy env, sandboxed
   * browsers). OpenFreeMap serves `Access-Control-Allow-Origin: *`, so the
   * cross-origin fetch resolves; any failure means unreachable → skip.
   */
  const reachable = await page.evaluate(async (url) => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      return response.ok;
    } catch {
      return false;
    }
  }, STYLE_URL);
  testInfo.skip(!reachable, 'OpenFreeMap unreachable — offline');

  testInfo.skip(
    !(await webglAvailable(page)),
    'WebGL unavailable in this environment — map render test skipped (environment gap, not a product regression).',
  );

  const frame = page.locator('[data-map-frame]');
  const canvas = page.locator('[data-map-canvas]');
  const fallback = page.locator('[data-map-fallback]');

  await frame.scrollIntoViewIfNeeded();
  // Real tiles over a real network: generous timeout, strict assertions.
  await expect(canvas).toHaveClass(/is-ready/, { timeout: 30_000 });
  await expect(canvas).toBeVisible();
  await expect(fallback).toBeHidden();
});
