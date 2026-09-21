import { expect, test } from '@playwright/test';

/**
 * FAQ page content rules (ODD §17 slice S4): R7's verbatim questions in the
 * PRD §8 order, the §17.3 pending state on every answer (marker + neutral
 * meta line, never an invented answer), the serif question voice (§17.3:716,
 * ruling R8 — asserted on the landing teaser too), the single primary action
 * per viewport (§17.3:722-723), R11's inert WhatsApp href, and the §17.4
 * legal block (exactly two lines, verbatim, no extra legal links).
 */

/** The six questions, verbatim and in the PRD §8 order (R7). */
const QUESTIONS = [
  '¿Qué necesito para publicar mi propiedad en venta?',
  '¿Qué necesito para publicar mi propiedad en alquiler?',
  '¿Qué requisitos tiene una publicación apta crédito?',
  '¿Puedo vender sin título único?',
  'Quiero comprar — ¿cómo me guían?',
  '¿Qué necesito para alquilar una propiedad?',
] as const;

/** §17.3:728 — the neutral meta line from `src/data/faqs.ts`. */
const PENDING_META =
  'Respuesta en preparación: va a cubrir el tema de esta consulta en un párrafo breve.';

test('the six questions render verbatim and in the PRD §8 order (R7)', async ({ page }) => {
  await page.goto('/faqs');

  const rendered = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.faq-item__question')).map((question) =>
      (question.textContent ?? '').trim(),
    ),
  );
  expect(rendered).toEqual([...QUESTIONS]);
});

test('the question uses the serif voice (§17.3:716, ruling R8)', async ({ page }) => {
  await page.goto('/faqs');

  const font = await page
    .locator('.faq-item__question')
    .first()
    .evaluate((el) => {
      const style = getComputedStyle(el);
      return { family: style.fontFamily, weight: style.fontWeight, size: style.fontSize };
    });
  expect(font.family).toMatch(/Newsreader/i);
  expect(font.weight).toBe('500');
  // --text-card-title-sm is 1.125rem = 18px.
  expect(font.size).toBe('18px');
});

test('every answer renders the PENDIENTE marker inline at its start (§17.3:727)', async ({
  page,
}) => {
  await page.goto('/faqs');

  const markers = page.locator('.faq-item__marker');
  await expect(markers).toHaveCount(6);

  for (let i = 0; i < 6; i++) {
    // The DOM text is the data's own case; the uppercase the design asks for
    // is achieved with CSS `text-transform`, which `toHaveText` cannot see.
    await expect(markers.nth(i)).toHaveText(/^PENDIENTE$/);
    await expect(markers.nth(i)).toHaveCSS('text-transform', 'uppercase');
  }

  // The marker is the first element inside the answer's meta line — inline at
  // the start of the answer, never a block of its own.
  const firstChildren = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.faq-item__meta')).map(
      (meta) => meta.firstElementChild?.className ?? '',
    ),
  );
  for (const className of firstChildren) {
    expect(className).toContain('faq-item__marker');
  }
});

test('every answer carries the neutral meta line and nothing else (§17.3:728-729)', async ({
  page,
}) => {
  await page.goto('/faqs');

  const metas = page.locator('.faq-item__meta');
  await expect(metas).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    await expect(metas.nth(i)).toContainText(PENDING_META);
  }

  // Each answer region is exactly the pending meta line — no answer body ever
  // ships while the answers are stakeholder-owned (PRD §8, §17.3:729).
  const shapes = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.faq-item__answer')).map((answer) =>
      Array.from(answer.children).map((child) => child.className),
    ),
  );
  for (const shape of shapes) {
    expect(shape).toEqual(['faq-item__meta']);
  }
});

test('no invented content renders on the page (§11, §17.3:729)', async ({ page }) => {
  await page.goto('/faqs');

  const renderedText = await page.evaluate(() => document.body.innerText);
  const bannedMarkers: Array<[string, RegExp]> = [
    ['lorem ipsum filler (the screens’ answer bodies)', /lorem|ipsum/i],
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

test('exactly one primary action per viewport (§17.3:722-723)', async ({ page, viewport }) => {
  await page.goto('/faqs');

  const railCta = page.locator('.faqs-rail .whatsapp-cta');
  const closingCta = page.locator('.faqs-closing .whatsapp-cta');

  if (viewport && viewport.width >= 768) {
    // Desktop: the CTA lives in the quiet side rail; no closing band exists.
    await expect(railCta).toBeVisible();
    await expect(closingCta).toBeHidden();
  } else {
    // Mobile: the CTA moves to the closing band below the accordion.
    await expect(railCta).toBeHidden();
    await expect(closingCta).toBeVisible();
  }

  const visiblePrimaries = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll('.button--primary')).filter(
        (el) => (el as HTMLElement).getClientRects().length > 0,
      ).length,
  );
  expect(visiblePrimaries).toBe(1);
});

test('the desktop closing row is a text link, never a second primary (§6)', async ({ page }) => {
  await page.goto('/faqs');

  await expect(page.locator('.faqs-more .button--text-link')).toHaveCount(1);
  await expect(page.locator('.faqs-more .button--primary')).toHaveCount(0);
  await expect(page.locator('.faqs-more .button--text-link')).toHaveAttribute(
    'href',
    '/propiedades',
  );
});

test('R11: the CTA is the inert pending anchor — no wa.me ships', async ({ page }) => {
  await page.goto('/faqs');

  const html = await page.content();
  expect(html.includes('wa.me'), '/faqs ships a wa.me link').toBe(false);

  await expect(page.locator('.faqs-rail .whatsapp-cta')).toHaveAttribute(
    'href',
    '#whatsapp-pendiente',
  );
  await expect(page.locator('.faqs-closing .whatsapp-cta')).toHaveAttribute(
    'href',
    '#whatsapp-pendiente',
  );
});

test('the footer legal block is exactly two lines, verbatim, with no extra legal links (§17.4)', async ({
  page,
}) => {
  await page.goto('/faqs');

  const legal = page.locator('.site-footer__legal p');
  await expect(legal).toHaveCount(2);
  await expect(legal.nth(0)).toHaveText(
    'Todas las propiedades exhibidas tienen el permiso firmado de los titulares para su difusión y promoción.',
  );
  await expect(legal.nth(1)).toHaveText(
    'Damero Propiedades funciona bajo la coordinación del Corredor Inmobiliario Luis Alejandro Da Silva — CCI 000.',
  );

  // §17.4 — never a copyright line, a matrícula, a privacy or a terms link.
  await expect(page.locator('.site-footer__legal a')).toHaveCount(0);
});

test('R8: the landing teaser matches the serif voice and derives from the /faqs source', async ({
  page,
}) => {
  await page.goto('/');

  const questions = page.locator('.faq-teaser__question');
  await expect(questions).toHaveCount(2);
  // The teaser carries the first two PRD questions, from `src/data/faqs.ts`.
  await expect(questions.nth(0)).toHaveText(QUESTIONS[0]);
  await expect(questions.nth(1)).toHaveText(QUESTIONS[1]);

  const font = await questions.first().evaluate((el) => {
    const style = getComputedStyle(el);
    return { family: style.fontFamily, weight: style.fontWeight, size: style.fontSize };
  });
  expect(font.family).toMatch(/Newsreader/i);
  expect(font.weight).toBe('500');
  expect(font.size).toBe('18px');
});
