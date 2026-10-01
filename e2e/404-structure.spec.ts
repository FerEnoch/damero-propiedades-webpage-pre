import { expect, test } from '@playwright/test';
import {
  auditTouchTargets,
  prepareKeyboardAudit,
  readFocusedElement,
  runColorAudits,
  type MatrixProbe,
} from './browser-audits';

/**
 * Custom 404 page — structure, semantics and brand audits (docs/DESIGN.md
 * §18.6, odd/tasks/damero-error-pages.md W3).
 *
 * Mirrors the structure-spec conventions (route health, landmarks, single
 * heading, horizontal overflow, active nav state, no-dead-internal-links) and
 * reuses the browser-audits helpers exactly as landing-accessibility and
 * faqs-accessibility call them: the sage-text ban, the per-element contrast
 * scan, the §2 contrast matrix over computed styles, and the §12 keyboard walk
 * (reachability in DOM order plus the visible focus ring).
 *
 * Every navigation goes to an UNMATCHED path, so each assertion runs against
 * the real 404 response — status code included (§18.2) — never against a copy
 * of the route rendered on purpose.
 */

/**
 * The §2 pairs the 404 actually renders on every viewport, one real element
 * per pair. The page renders no canvas-backed text and no muted-text on
 * surface, so those matrix rows are left to the per-element scan — the same
 * criterion faqs-accessibility uses for pairs a page does not render.
 */
const MATRIX_PROBES: MatrixProbe[] = [
  { name: 'forest-ink on surface', selector: '.site-header__wordmark' },
  { name: 'forest-ink on surface-tint', selector: '.error-404__title' },
  { name: 'on-forest on forest-ink', selector: '.site-footer__wordmark' },
  { name: 'sage-ink on surface', selector: '.site-header__whatsapp' },
  { name: 'sage-ink on surface-tint', selector: '.error-404__eyebrow' },
  { name: 'muted-text on surface-tint', selector: '.error-404__body' },
  { name: 'on-forest-muted on forest-ink', selector: '.site-footer__legal p' },
];

test('an unmatched URL answers 404 and renders the custom page', async ({ page }) => {
  const response = await page.goto('/ruta-que-no-existe');
  expect(response).not.toBeNull();
  expect(response!.status()).toBe(404);

  await expect(page).toHaveTitle('Página no encontrada | Damero Propiedades');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('No encontramos esta página.');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('header, main and footer landmarks are present', async ({ page }) => {
  await page.goto('/ruta-que-no-existe');

  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);
});

test('the head block is left-aligned — §11 bans centred heroes and centred text blocks', async ({
  page,
}) => {
  await page.goto('/ruta-que-no-existe');

  const alignments = await page.evaluate(() =>
    ['main h1', '.error-404__eyebrow', '.error-404__body'].map((selector) => {
      const el = document.querySelector(selector);
      return { selector, textAlign: el ? getComputedStyle(el).textAlign : 'missing' };
    }),
  );

  for (const { selector, textAlign } of alignments) {
    expect(
      textAlign,
      `${selector} must compute text-align: start or left (§18.3/§11), got "${textAlign}"`,
    ).toMatch(/^(start|left)$/);
  }
});

test('no nav link is marked active on the 404', async ({ page }) => {
  await page.goto('/ruta-que-no-existe');

  await expect(page.locator('.site-nav__link.is-active')).toHaveCount(0);
  await expect(page.locator('.site-nav__link[aria-current="page"]')).toHaveCount(0);
});

test('exactly one visible primary CTA per viewport (§18.5)', async ({ page }) => {
  await page.goto('/ruta-que-no-existe');

  const primaries = page.locator('.button--primary');
  await expect(primaries).toHaveCount(1);
  await expect(primaries.first()).toBeVisible();
  await expect(primaries.first()).toHaveText(/Ver propiedades/);

  // The secondary recovery is a text link: no second primary button (§18.5).
  const otherButtons = page.locator('.button:not(.button--primary)');
  const otherCount = await otherButtons.count();
  expect(otherCount).toBeGreaterThan(0);
  for (let i = 0; i < otherCount; i++) {
    await expect(otherButtons.nth(i)).toHaveClass(/button--text-link/);
    await expect(otherButtons.nth(i)).toHaveText('Volver al inicio');
  }
});

test('the primary CTA is first in the DOM and the text link follows it (§18.3)', async ({
  page,
}) => {
  await page.goto('/ruta-que-no-existe');

  const actions = page.locator('main .button');
  await expect(actions).toHaveCount(2);
  await expect(actions.nth(0)).toHaveClass(/button--primary/);
  await expect(actions.nth(1)).toHaveClass(/button--text-link/);
});

test('no horizontal overflow', async ({ page }) => {
  await page.goto('/ruta-que-no-existe');

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    metrics.scrollWidth,
    `horizontal overflow: scrollWidth ${metrics.scrollWidth} > clientWidth ${metrics.clientWidth} + 1`,
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);
});

test('no dead internal links', async ({ page }) => {
  await page.goto('/ruta-que-no-existe');

  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]'))
      .map((anchor) => anchor.getAttribute('href') ?? '')
      .filter((href) => href.startsWith('/')),
  );
  const unique = [...new Set(hrefs)];
  expect(unique.length).toBeGreaterThan(0);

  for (const href of unique) {
    const response = await page.request.get(href);
    expect(response.status(), `${href} is a dead internal link`).toBe(200);
  }
});

/*
 * Sanity floor for the two colour scans. The landing/FAQ specs use > 20, but
 * that number is a property of those pages, not of the audit: the 404 is
 * deliberately minimal (§18.3 — type and the band carry it) and the mobile
 * nav panel is collapsed, so the visible-text population is 18 at 390/320 and
 * higher at 1280. The floor only guards against the audit silently scanning
 * nothing; the real contract is the empty violation lists below.
 */
const MIN_TEXT_ELEMENTS_SCANNED = 15;

test('no rendered text uses sage #7C916F', async ({ page }) => {
  await page.goto('/ruta-que-no-existe');

  const audit = await page.evaluate(runColorAudits, []);
  expect(audit.textElementsChecked).toBeGreaterThan(MIN_TEXT_ELEMENTS_SCANNED);
  expect(audit.sageTextViolations).toEqual([]);
});

test('every rendered text element meets its contrast threshold', async ({ page }) => {
  await page.goto('/ruta-que-no-existe');

  const audit = await page.evaluate(runColorAudits, []);
  expect(audit.textElementsChecked).toBeGreaterThan(MIN_TEXT_ELEMENTS_SCANNED);
  expect(audit.contrastViolations).toEqual([]);
});

test('the DESIGN.md §2 contrast matrix holds on computed styles', async ({ page }) => {
  await page.goto('/ruta-que-no-existe');

  const audit = await page.evaluate(runColorAudits, MATRIX_PROBES);
  expect(audit.matrix).toHaveLength(MATRIX_PROBES.length);
  for (const measurement of audit.matrix) {
    expect(
      measurement.ratio,
      `${measurement.name}: ${measurement.ratio}:1 < ${measurement.threshold}:1 ` +
        `(${measurement.foreground} on ${measurement.background})`,
    ).toBeGreaterThanOrEqual(measurement.threshold);
  }
});

test('every interactive element meets the 44px touch target', async ({
  page,
  viewport,
}, testInfo) => {
  testInfo.skip(
    !viewport || viewport.width >= 768,
    'Touch targets are an inventory requirement at mobile widths (390/320).',
  );

  await page.goto('/ruta-que-no-existe');

  const violations = await page.evaluate(auditTouchTargets, 44);
  expect(violations).toEqual([]);
});

test('every interactive element is keyboard-reachable in DOM order with a visible focus ring (§12)', async ({
  page,
}) => {
  await page.goto('/ruta-que-no-existe');

  const expectedCount = await page.evaluate(prepareKeyboardAudit);
  expect(expectedCount).toBeGreaterThan(0);

  for (let i = 0; i < expectedCount; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(readFocusedElement);

    expect(
      focused.index,
      `Tab #${i + 1} focused ${focused.label}; expected the element at DOM-order index ${i}`,
    ).toBe(i);

    // §12: the focus ring is 2px solid sage-ink #4F6144 with a 2px offset.
    expect(focused.outlineStyle, `no visible focus ring on ${focused.label}`).toBe('solid');
    expect(focused.outlineWidth).toBe('2px');
    expect(focused.outlineColor).toBe('rgb(79, 97, 68)');
    expect(focused.outlineOffset).toBe('2px');
  }
});
