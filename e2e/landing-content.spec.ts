import { expect, test } from '@playwright/test';

/**
 * Content honesty — rows 7 and 8 of the T7 inventory. Stakeholder-pending
 * values render as explicit placeholders, never as plausible-looking
 * inventions (docs/DESIGN.md §11, §17.4).
 */

test('row 7: no invented data renders on the page', async ({ page }) => {
  await page.goto('/');

  const renderedText = await page.evaluate(() => document.body.innerText);
  const bannedMarkers: Array<[string, RegExp]> = [
    ['CUCICBA (superseded regulator name)', /CUCICBA/i],
    ['Ley 5115 (invented legal reference)', /Ley\s*5115/i],
    ['testimonials', /testimonio/i],
    ['percentage metrics', /\d+([.,]\d+)?\s*%/],
    ['years-of-experience claims', /\d+\+?\s*años/i],
  ];

  for (const [label, pattern] of bannedMarkers) {
    expect(pattern.test(renderedText), `invented data marker found: ${label}`).toBe(false);
  }
});

test('row 8: the FAQ teaser renders the PENDIENTE marker and no answer body', async ({ page }) => {
  await page.goto('/');

  const items = page.locator('.faq-teaser__item');
  await expect(items).toHaveCount(2);

  const markers = page.locator('.faq-teaser__marker');
  await expect(markers).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    await expect(markers.nth(i)).toHaveText(/^PENDIENTE$/);
  }

  // Each item is exactly marker + question: no answer body ever ships (§11).
  const childShapes = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.faq-teaser__item')).map((item) =>
      Array.from(item.children).map((child) => child.className),
    ),
  );
  for (const shape of childShapes) {
    expect(shape).toEqual(['faq-teaser__marker', 'faq-teaser__question']);
  }
});
