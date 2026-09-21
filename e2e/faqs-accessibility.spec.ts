import { expect, test } from '@playwright/test';
import {
  auditTouchTargets,
  prepareKeyboardAudit,
  readFocusedElement,
  runColorAudits,
  type MatrixProbe,
} from './browser-audits';

/**
 * FAQ page accessibility (ODD §17 slice S4). Reuses the browser-audit
 * helpers exactly as the S2/S3 specs do: the sage-text ban, the generic
 * contrast scan, the §2 matrix on computed styles, the 12px floor, the
 * keyboard walk, and the 44px touch-target audit.
 */

/**
 * The §2 pairs that actually render on `/faqs` on every viewport, each
 * represented by a real element from the markup. Pairs that only exist on one
 * viewport (the mobile closing band's sage-ink/muted-text on surface-tint)
 * are covered by the generic scan, which runs per viewport — same criterion
 * the S3 spec uses for pairs a page does not render.
 */
const MATRIX_PROBES: MatrixProbe[] = [
  { name: 'forest-ink on surface', selector: '.site-header__wordmark' },
  { name: 'forest-ink on canvas', selector: '.faqs-head__title' },
  { name: 'forest-ink on surface-tint', selector: '.faq-item__marker' },
  { name: 'on-forest on forest-ink', selector: '.site-footer__wordmark' },
  { name: 'sage-ink on surface', selector: '.site-header__whatsapp' },
  { name: 'sage-ink on canvas', selector: '.faqs-head__eyebrow' },
  { name: 'muted-text on canvas', selector: '.faqs-head__subhead' },
  { name: 'on-forest-muted on forest-ink', selector: '.site-footer__legal p' },
];

test('no rendered text uses sage #7C916F', async ({ page }) => {
  await page.goto('/faqs');

  const audit = await page.evaluate(runColorAudits, []);
  expect(audit.textElementsChecked).toBeGreaterThan(20);
  expect(audit.sageTextViolations).toEqual([]);
});

test('every rendered text element meets its contrast threshold', async ({ page }) => {
  await page.goto('/faqs');

  const audit = await page.evaluate(runColorAudits, []);
  expect(audit.textElementsChecked).toBeGreaterThan(20);
  expect(audit.contrastViolations).toEqual([]);
});

test('the DESIGN.md §2 contrast matrix holds on computed styles', async ({ page }) => {
  await page.goto('/faqs');

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
  await page.goto('/faqs');

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
  await page.goto('/faqs');

  /*
   * The FAQ page renders no radio groups, so — like the S3 spec — the
   * audit's raw list needs no narrowing: every collected element is a real
   * Tab stop (the accordion toggles, the per-viewport CTA, the text link).
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

  await page.goto('/faqs');

  const violations = await page.evaluate(auditTouchTargets, 44);
  expect(violations).toEqual([]);
});
