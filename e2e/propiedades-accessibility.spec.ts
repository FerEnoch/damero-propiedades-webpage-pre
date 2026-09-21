import { expect, test } from '@playwright/test';
import {
  auditTouchTargets,
  prepareKeyboardAudit,
  readFocusedElement,
  runColorAudits,
  type MatrixProbe,
} from './browser-audits';

/**
 * Search page accessibility (ODD §17 slice S2). Reuses the browser-audit
 * helpers exactly as the landing specs do: the sage-text ban, the generic
 * contrast scan, the §2 matrix on computed styles, the keyboard walk, and
 * the 44px touch-target audit. Adds the search-specific rows: the R14 bottom
 * sheet semantics and the count-badge announcement rule (§17.1:653).
 */

/**
 * The §2 pairs that actually render on `/propiedades`, each represented by a
 * real element from the markup. Hidden-until-filtered surfaces (chips, the
 * empty state) are covered by the generic scan once visible, not here.
 */
const MATRIX_PROBES: MatrixProbe[] = [
  { name: 'forest-ink on surface', selector: '.results-grid .card__title' },
  { name: 'forest-ink on canvas', selector: '.search-head__title' },
  { name: 'forest-ink on surface-tint', selector: '.search-share__button' },
  { name: 'on-forest on forest-ink', selector: '.site-footer__wordmark' },
  { name: 'sage-ink on surface', selector: '.site-header__whatsapp' },
  { name: 'sage-ink on canvas', selector: '.search-head__eyebrow' },
  { name: 'sage-ink on surface-tint', selector: '.search-share__eyebrow' },
  { name: 'muted-text on surface', selector: '.results-grid .card__location' },
  { name: 'muted-text on canvas', selector: '.search-head__subhead' },
  { name: 'muted-text on surface-tint', selector: '.search-share__body' },
  { name: 'on-forest-muted on forest-ink', selector: '.site-footer__legal p' },
];

test('no rendered text uses sage #7C916F', async ({ page }) => {
  await page.goto('/propiedades');

  const audit = await page.evaluate(runColorAudits, []);
  expect(audit.textElementsChecked).toBeGreaterThan(20);
  expect(audit.sageTextViolations).toEqual([]);
});

test('every rendered text element meets its contrast threshold', async ({ page }) => {
  await page.goto('/propiedades');

  const audit = await page.evaluate(runColorAudits, []);
  expect(audit.textElementsChecked).toBeGreaterThan(20);
  expect(audit.contrastViolations).toEqual([]);
});

test('the DESIGN.md §2 contrast matrix holds on computed styles', async ({ page }) => {
  await page.goto('/propiedades');

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
  await page.goto('/propiedades');

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
  await page.goto('/propiedades');

  const expectedCount = await page.evaluate(prepareKeyboardAudit);
  expect(expectedCount).toBeGreaterThan(0);

  /*
   * Radio groups are a single Tab stop (the checked option); unchecked
   * radios are arrow-key reachable, not Tab stops. The audit's raw list
   * includes every radio, so the expectation is narrowed the same way the
   * platform narrows Tab.
   */
  const tabbableCount = await page.evaluate(() => {
    const w = window as unknown as { __kbdExpected?: Element[] };
    const filtered = (w.__kbdExpected ?? []).filter(
      (el) => !(el instanceof HTMLInputElement && el.type === 'radio' && !el.checked),
    );
    w.__kbdExpected = filtered;
    return filtered.length;
  });
  expect(tabbableCount).toBeGreaterThan(0);
  expect(expectedCount).toBeGreaterThanOrEqual(tabbableCount);

  for (let i = 0; i < tabbableCount; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(readFocusedElement);

    expect(
      focused.index,
      `Tab #${i + 1} focused ${focused.label}; expected the element at DOM-order index ${i}`,
    ).toBe(i);

    if (focused.outlineStyle !== 'none') {
      // §12: the focus ring is 2px solid sage-ink #4F6144 with a 2px offset.
      expect(focused.outlineStyle, `no visible focus ring on ${focused.label}`).toBe('solid');
      expect(focused.outlineWidth).toBe('2px');
      expect(focused.outlineColor).toBe('rgb(79, 97, 68)');
      expect(focused.outlineOffset).toBe('2px');
    } else {
      /*
       * The S1 clipped-input pattern (segmented radios, the cochera checkbox)
       * moves the ring onto the visual control next to the input — moved,
       * never removed (§12). The ring is verified on that sibling.
       */
      const moved = await page.evaluate(() => {
        const el = document.activeElement;
        const sibling = el?.nextElementSibling;
        if (!sibling) return null;
        const style = getComputedStyle(sibling);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          outlineColor: style.outlineColor,
          outlineOffset: style.outlineOffset,
        };
      });
      expect(moved, `no visible focus ring on or beside ${focused.label}`).not.toBeNull();
      expect(moved!.outlineStyle, `no visible focus ring beside ${focused.label}`).toBe('solid');
      expect(moved!.outlineWidth).toBe('2px');
      expect(moved!.outlineColor).toBe('rgb(79, 97, 68)');
      expect(moved!.outlineOffset).toBe('2px');
    }
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

  await page.goto('/propiedades');

  const violations = await page.evaluate(auditTouchTargets, 44);
  expect(violations).toEqual([]);
});

test('the Filtros badge counts active filters and is never announced as a result count', async ({
  page,
  viewport,
}, testInfo) => {
  testInfo.skip(
    !viewport || viewport.width >= 768,
    'The collapsed filter bar exists only below 768px (§17.1:635).',
  );

  await page.goto('/propiedades?operacion=venta&cochera=si');

  const trigger = page.locator('[data-sheet-open]');
  const name = await trigger.getAttribute('aria-label');
  expect(name).toContain('filtros activos');
  expect(name).not.toMatch(/resultado|propiedades/i);

  // The badge itself is decorative; the trigger's name carries the count.
  const badge = page.locator('[data-filter-count-badge]');
  await expect(badge).toHaveText('2');
  await expect(badge).toHaveAttribute('aria-hidden', 'true');
});

test('R14: the bottom sheet is a modal dialog — trap, Escape, focus restore, scroll lock', async ({
  page,
  viewport,
}, testInfo) => {
  testInfo.skip(
    !viewport || viewport.width >= 768,
    'The bottom sheet exists only below 768px (§17.1:635).',
  );

  await page.goto('/propiedades');

  const trigger = page.locator('[data-sheet-open]');
  const sheet = page.locator('[data-sheet]');
  const scrim = page.locator('[data-sheet-scrim]');

  await expect(sheet).toBeHidden();
  await trigger.click();

  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveAttribute('role', 'dialog');
  await expect(sheet).toHaveAttribute('aria-modal', 'true');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  // Body scroll is locked while the sheet is modal.
  const overflow = await page.evaluate(() => document.body.style.overflow);
  expect(overflow).toBe('hidden');

  // Focus trap: from the last focusable, Tab wraps to the first; Shift+Tab
  // from the first wraps to the last. DOM elements cannot cross the evaluate
  // boundary, so the list is kept on `window` between probes.
  const trapCount = await page.evaluate(() => {
    const dialog = document.querySelector('[data-sheet]');
    if (!dialog) return 0;
    const focusables = Array.from(
      dialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => (el as HTMLElement).getClientRects().length > 0);
    (window as unknown as { __sheetFocusables: Element[] }).__sheetFocusables = focusables;
    return focusables.length;
  });
  expect(trapCount).toBeGreaterThan(1);

  await page.evaluate(() => {
    const list = (window as unknown as { __sheetFocusables: HTMLElement[] }).__sheetFocusables;
    list[list.length - 1].focus();
  });
  await page.keyboard.press('Tab');
  const wrappedToFirst = await page.evaluate(() => {
    const list = (window as unknown as { __sheetFocusables: HTMLElement[] }).__sheetFocusables;
    return document.activeElement === list[0];
  });
  expect(wrappedToFirst).toBe(true);

  await page.evaluate(() => {
    const list = (window as unknown as { __sheetFocusables: HTMLElement[] }).__sheetFocusables;
    list[0].focus();
  });
  await page.keyboard.press('Shift+Tab');
  const wrappedToLast = await page.evaluate(() => {
    const list = (window as unknown as { __sheetFocusables: HTMLElement[] }).__sheetFocusables;
    return document.activeElement === list[list.length - 1];
  });
  expect(wrappedToLast).toBe(true);

  // Escape closes, unlocks scroll and restores focus to the trigger (R14).
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(scrim).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
  const overflowAfter = await page.evaluate(() => document.body.style.overflow);
  expect(overflowAfter).toBe('');
});
