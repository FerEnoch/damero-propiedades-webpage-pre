import { expect, test } from '@playwright/test';
import {
  prepareKeyboardAudit,
  readFocusedElement,
  runColorAudits,
  type MatrixProbe,
} from './browser-audits';

/**
 * Accessibility — rows 6, 11 and 12 of the T7 inventory.
 *
 * Row 6 enforces the house rule of docs/DESIGN.md §2: sage `#7C916F` is a
 * graphic-only ink and must never be the computed `color` of rendered text.
 * Colour on non-text surfaces (icon accent masses, badge borders, indicator
 * underlines) is legitimate and is not flagged.
 *
 * Row 11 measures the §2 contrast matrix on computed styles, resolving the
 * effective background by walking ancestors past transparent fills — the same
 * method used for the manual verification of T1/T2/T5.
 */

/**
 * The §2 pairs that actually render on the landing, each represented by a
 * real element from the markup. All of them clear 4.5:1 at their rendered
 * size, so the threshold is size-aware (4.5 normal / 3 large).
 */
const MATRIX_PROBES: MatrixProbe[] = [
  { name: 'forest-ink on surface', selector: '.featured .card--lead .card__title' },
  { name: 'forest-ink on canvas', selector: '.hero__headline' },
  { name: 'forest-ink on surface-tint', selector: '.services__item .services__name' },
  { name: 'on-forest on forest-ink', selector: '.site-footer__wordmark' },
  { name: 'sage-ink on surface', selector: '.site-header__whatsapp' },
  { name: 'sage-ink on canvas', selector: '.hero__eyebrow' },
  { name: 'sage-ink on surface-tint', selector: '.services .section-head .eyebrow' },
  { name: 'muted-text on surface', selector: '.featured .card--lead .card__location' },
  { name: 'muted-text on canvas', selector: '.hero__subhead' },
  { name: 'muted-text on surface-tint', selector: '.services__item .services__description' },
  { name: 'on-forest-muted on forest-ink', selector: '.site-footer__legal p' },
];

test('row 6: no rendered text uses sage #7C916F', async ({ page }) => {
  await page.goto('/');

  const audit = await page.evaluate(runColorAudits, []);
  expect(audit.textElementsChecked).toBeGreaterThan(20);
  expect(audit.sageTextViolations).toEqual([]);
});

test('row 11: every rendered text element meets its contrast threshold', async ({ page }) => {
  await page.goto('/');

  const audit = await page.evaluate(runColorAudits, []);
  expect(audit.textElementsChecked).toBeGreaterThan(20);
  expect(audit.contrastViolations).toEqual([]);
});

test('row 11: the DESIGN.md §2 contrast matrix holds on computed styles', async ({ page }) => {
  await page.goto('/');

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

test('row 12: every interactive element is keyboard-reachable in DOM order with a visible focus ring', async ({
  page,
}) => {
  await page.goto('/');

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
