import { expect, test } from '@playwright/test';
import { auditTouchTargets } from './browser-audits';

/**
 * CTA discipline and responsive layout — rows 3, 9 and 10 of the T7
 * inventory. The single primary CTA is `.button--primary`; every other call
 * to action is `variant="text-link"` (docs/DESIGN.md §6).
 */

test('row 3: exactly one visible primary CTA per viewport', async ({ page }) => {
  await page.goto('/');

  const primaries = page.locator('.button--primary');
  await expect(primaries).toHaveCount(1);
  await expect(primaries.first()).toBeVisible();
  await expect(primaries.first()).toHaveText(/Ver cartera de propiedades/);

  // Every other CTA on the page is a text link (§6: max one primary per viewport).
  const otherButtons = page.locator('.button:not(.button--primary)');
  const otherCount = await otherButtons.count();
  expect(otherCount).toBeGreaterThan(0);
  for (let i = 0; i < otherCount; i++) {
    await expect(otherButtons.nth(i)).toHaveClass(/button--text-link/);
  }
});

test('row 9: no horizontal overflow', async ({ page }) => {
  await page.goto('/');

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    metrics.scrollWidth,
    `horizontal overflow: scrollWidth ${metrics.scrollWidth} > clientWidth ${metrics.clientWidth} + 1`,
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);
});

test('row 10: every interactive element meets the 44px touch target', async ({
  page,
  viewport,
}, testInfo) => {
  testInfo.skip(
    !viewport || viewport.width >= 768,
    'Touch targets are an inventory requirement at mobile widths (390/320).',
  );

  await page.goto('/');

  const violations = await page.evaluate(auditTouchTargets, 44);
  expect(violations).toEqual([]);
});
