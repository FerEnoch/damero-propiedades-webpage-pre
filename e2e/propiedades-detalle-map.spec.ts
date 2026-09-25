import { expect, test, type Page } from '@playwright/test';
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
 *     a patch at the frame centre — where the fixed 400 m zone circle sits
 *     at `zoom: 14.5` (≈70 px radius, viewport-independent) — is compared
 *     against a corner patch that must stay the stub's pure black.
 *
 * (b) `live smoke` runs against the real OpenFreeMap style with no
 *     stubbing, and skips honestly when the provider is unreachable so an
 *     offline environment never breaks the gate.
 *
 * Both tests skip with an explicit reason when WebGL is unavailable: that
 * is an environment gap, not a product regression.
 */

const SLUG = 'casa-3-amb-guadalupe-santa-fe';
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

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

  await page.goto(`/propiedades/${SLUG}`);
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
  await page.goto(`/propiedades/${SLUG}`);

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
