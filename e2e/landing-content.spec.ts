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

test('row 8: the FAQ teaser renders the first two stakeholder questions and no answer body', async ({
  page,
}) => {
  await page.goto('/');

  const items = page.locator('.faq-teaser__item');
  await expect(items).toHaveCount(2);

  // The launch blocker is closed: the teaser links to the sixteen real
  // answers on /faqs, so no PENDIENTE marker ships anywhere on the landing.
  await expect(page.locator('.faq-teaser__marker')).toHaveCount(0);

  const questions = page.locator('.faq-teaser__question');
  await expect(questions).toHaveCount(2);
  await expect(questions.nth(0)).toContainText('¿Por qué me conviene contratar a una inmobiliaria');
  await expect(questions.nth(1)).toContainText('Cuál es el costo de publicar mi propiedad');

  // Each item is exactly the question: no answer body ever ships on the
  // landing (§11) — answers live on /faqs.
  const childShapes = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.faq-teaser__item')).map((item) =>
      Array.from(item.children).map((child) => child.className),
    ),
  );
  for (const shape of childShapes) {
    expect(shape).toEqual(['faq-teaser__question']);
  }
});
