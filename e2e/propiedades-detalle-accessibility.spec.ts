import { expect, test } from '@playwright/test';
import {
  auditTouchTargets,
  prepareKeyboardAudit,
  readFocusedElement,
  runColorAudits,
  type MatrixProbe,
} from './browser-audits';

/**
 * Detail page accessibility (ODD §17 slice S3). Reuses the browser-audit
 * helpers exactly as the S2/landing specs do: the sage-text ban, the generic
 * contrast scan, the §2 matrix on computed styles, the 12px floor, the
 * keyboard walk, and the 44px touch-target audit.
 *
 * Map determinism: the basemap provider is aborted in beforeEach, so the
 * §17.2:709 fallback (not the live map) is what the audits see. The map's
 * own chrome (attribution control) only exists once the style loads, which
 * never happens here — by design, since no spec may depend on live tiles.
 */

/**
 * The §2 pairs that actually render on the detail page, each represented by
 * a real element from the markup. There is no muted-text-on-surface-tint
 * probe: no element renders that pair on this page (the fallback message is
 * text-primary, the retry is sage-ink).
 */
const MATRIX_PROBES: MatrixProbe[] = [
  { name: 'forest-ink on surface', selector: '.price-panel__value' },
  { name: 'forest-ink on canvas', selector: '.detail-head__title' },
  { name: 'forest-ink on surface-tint', selector: '.map-fallback__text' },
  { name: 'on-forest on forest-ink', selector: '.site-footer__wordmark' },
  { name: 'sage-ink on surface', selector: '.site-header__whatsapp' },
  { name: 'sage-ink on canvas', selector: '.characteristics .eyebrow' },
  { name: 'sage-ink on surface-tint', selector: '.map-fallback__retry' },
  { name: 'muted-text on surface', selector: '.price-panel__note' },
  { name: 'muted-text on canvas', selector: '.detail-head__summary' },
  { name: 'on-forest-muted on forest-ink', selector: '.site-footer__legal p' },
];

test.beforeEach(async ({ page }) => {
  await page.route(/openfreemap/, (route) => route.abort());
});

test('no rendered text uses sage #7C916F', async ({ page }) => {
  await page.goto('/propiedades/casa-quinta-3amb');

  const audit = await page.evaluate(runColorAudits, []);
  expect(audit.textElementsChecked).toBeGreaterThan(20);
  expect(audit.sageTextViolations).toEqual([]);
});

test('every rendered text element meets its contrast threshold', async ({ page }) => {
  await page.goto('/propiedades/casa-quinta-3amb');

  const audit = await page.evaluate(runColorAudits, []);
  expect(audit.textElementsChecked).toBeGreaterThan(20);
  expect(audit.contrastViolations).toEqual([]);
});

test('the DESIGN.md §2 contrast matrix holds on computed styles', async ({ page }) => {
  await page.goto('/propiedades/casa-quinta-3amb');

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

test('no rendered text is smaller than 12px (§10)', async ({ page }) => {
  await page.goto('/propiedades/casa-quinta-3amb');

  const violations = await page.evaluate(() => {
    const found: Array<{ element: string; size: number; text: string }> = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility !== 'visible') continue;
      if (el.getClientRects().length === 0) continue;
      const hasText = Array.from(el.childNodes).some(
        (child) => child.nodeType === Node.TEXT_NODE && (child.textContent ?? '').trim().length > 0,
      );
      if (!hasText) continue;
      const size = parseFloat(style.fontSize);
      if (size < 12) {
        found.push({
          element: el.tagName.toLowerCase(),
          size,
          text: (el.textContent ?? '').trim().slice(0, 40),
        });
      }
    }
    return found;
  });

  expect(violations).toEqual([]);
});

test('every interactive element is keyboard-reachable in DOM order with a visible focus ring', async ({
  page,
}) => {
  await page.goto('/propiedades/casa-quinta-3amb');

  /*
   * The detail page renders no radio groups, so — unlike the S2 spec — the
   * audit's raw list needs no narrowing: every collected element is a real
   * Tab stop.
   */
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

test('every interactive element meets the 44px touch target', async ({
  page,
  viewport,
}, testInfo) => {
  testInfo.skip(
    !viewport || viewport.width >= 768,
    'Touch targets are an inventory requirement at mobile widths (390/320).',
  );

  await page.goto('/propiedades/casa-quinta-3amb');

  const violations = await page.evaluate(auditTouchTargets, 44);
  expect(violations).toEqual([]);
});
