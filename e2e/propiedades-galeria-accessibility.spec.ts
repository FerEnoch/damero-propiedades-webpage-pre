import { expect, test } from '@playwright/test';
import {
  auditTouchTargets,
  prepareKeyboardAudit,
  readFocusedElement,
  runColorAudits,
  type MatrixProbe,
} from './browser-audits';

/**
 * Full-page gallery accessibility (ODD damero-gallery-full-page, T4;
 * docs/DESIGN.md §17.5, §12). Reuses the browser-audit helpers exactly as
 * the detail specs do: the sage-text ban, the generic contrast scan, the §2
 * matrix on computed styles, the 12px floor, the keyboard walk with the
 * exact focus ring, and the 44px touch-target audit at mobile widths.
 *
 * The gallery page renders no map and no map chrome, so no route aborts are
 * needed; every test still asserts the 200 first so a missing route can
 * never pass as an accessible 404.
 */

/**
 * The §2 pairs that actually render on the gallery page, each represented
 * by a real element from the markup.
 */
const MATRIX_PROBES: MatrixProbe[] = [
  { name: 'forest-ink on canvas', selector: '.gallery-page__title' },
  { name: 'forest-ink on surface', selector: '.site-nav__link' },
  { name: 'sage-ink on canvas', selector: '.gallery-page__back' },
  { name: 'sage-ink on surface', selector: '.site-header__whatsapp' },
  { name: 'muted-text on canvas', selector: '[data-gallery-counter]' },
  { name: 'on-forest on forest-ink', selector: '.site-footer__wordmark' },
  { name: 'on-forest-muted on forest-ink', selector: '.site-footer__legal p' },
];

const GALLERY_URL = '/propiedades/casa-3-amb-guadalupe-santa-fe/galeria';

/*
 * The audit-floor guard proves the scan actually ran. The gallery page is
 * deliberately terse (back link, h1, two control labels, the counter, and
 * the header/footer chrome), and at mobile widths the collapsed header nav
 * hides several text nodes — 18 elements render, not the 20+ of the
 * detail/landing pages. The floor sits below that real count.
 */
const MIN_TEXT_ELEMENTS_SCANNED = 10;

test('no rendered text uses sage #7C916F', async ({ page }) => {
  const response = await page.goto(GALLERY_URL);
  expect(response!.status()).toBe(200);

  const audit = await page.evaluate(runColorAudits, []);
  expect(audit.textElementsChecked).toBeGreaterThan(MIN_TEXT_ELEMENTS_SCANNED);
  expect(audit.sageTextViolations).toEqual([]);
});

test('every rendered text element meets its contrast threshold', async ({ page }) => {
  const response = await page.goto(GALLERY_URL);
  expect(response!.status()).toBe(200);

  const audit = await page.evaluate(runColorAudits, []);
  expect(audit.textElementsChecked).toBeGreaterThan(MIN_TEXT_ELEMENTS_SCANNED);
  expect(audit.contrastViolations).toEqual([]);
});

test('the DESIGN.md §2 contrast matrix holds on computed styles', async ({ page }) => {
  const response = await page.goto(GALLERY_URL);
  expect(response!.status()).toBe(200);

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
  const response = await page.goto(GALLERY_URL);
  expect(response!.status()).toBe(200);

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
  const response = await page.goto(GALLERY_URL);
  expect(response!.status()).toBe(200);

  /*
   * The gallery page renders no radio groups, so the audit's raw list is
   * the real Tab order: header chrome → back link → prev/next → thumbnails
   * → footer chrome.
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

  const response = await page.goto(GALLERY_URL);
  expect(response!.status()).toBe(200);

  const violations = await page.evaluate(auditTouchTargets, 44);
  expect(violations).toEqual([]);
});
