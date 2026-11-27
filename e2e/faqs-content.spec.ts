import { expect, test } from '@playwright/test';

/**
 * FAQ page content rules (ODD §17 slice S4, stakeholder answers 2026-11-27):
 * the sixteen stakeholder-owned questions and answers verbatim in the
 * stakeholder's order, the serif question voice (§17.3:716, ruling R8 —
 * asserted on the landing teaser too), the single primary action per
 * viewport (§17.3:722-723), R11's production WhatsApp href, and the §17.4
 * legal block (exactly two lines, verbatim, no extra legal links).
 */

/** The sixteen stakeholder-owned questions, verbatim and in order. */
const QUESTIONS = [
  '¿Por qué me conviene contratar a una inmobiliaria en lugar de publicar y vender o alquilar mi propiedad por mi cuenta en redes sociales?',
  'Cuál es el costo de publicar mi propiedad con ustedes?',
  'Qué debo tener al momento de negociar mi propiedad?',
  '¿Cómo se determina el precio real de venta o alquiler de mi propiedad sin ilusionarme con un valor imposible?',
  'Llegado el caso, un interesado me ofrece otra propiedad como parte de pago, un vehículo o un plan de cuotas. Qué debo hacer?',
  '¿Tengo que dejar mi casa disponible todo el tiempo para las visitas o puedo coordinar días y horarios específicos?',
  'Qué gastos además de los honorarios se pagan al momento de comprar o vender una propiedad?',
  'Si quiero vender mi casa, pero vivo en ella y debo comprar otra antes de abandonarla. Cuál es el procedimiento?',
  'Si encuentro una propiedad que me gusta, ¿puedo hacer una reserva para que se la saquen del mercado mientras juntamos los papeles?',
  '¿Cómo sé que el inmueble no tiene deudas ocultas, juicios o hipotecas que me traigan problemas después?',
  'Quiero alquilar. ¿Qué requisitos exactos y garantías (garantes, recibos de sueldo) me van a pedir para alquilar?',
  'Quiero alquilar y quiero saber quién paga los gastos de mantenimiento extraordinarios o los arreglos estructurales si algo se rompe en el departamento',
  '¿Cómo se calculan y cada cuánto tiempo se realizan los aumentos o actualizaciones del valor del alquiler?',
  '¿Qué porcentaje de la renta mensual se queda la inmobiliaria en concepto de administración y qué tareas incluye ese servicio?',
  '¿Por qué los precios de las propiedades varían tanto y de qué depende que suban o bajen en una zona específica?',
  '¿Qué es una "reserva" y qué pasa con ese dinero si la operación se cae por culpa de alguna de las partes?',
] as const;

/** Spot checks: stakeholder-owned answer bodies, verbatim excerpts. */
const ANSWER_EXCERPTS = [
  'con el aval del CCI (Colegio de Corredores Inmobiliarios)',
  'el monto de los honorarios el 3% del total negociado',
  'todos los propietarios que figuren en el título deben estar de acuerdo',
  'ni más ni menos',
  'cerramos el negocio asegurandonos de que los términos propuestos sean entendidos',
  'siempre se puede coordinar',
  '⅓ lo abona la parte vendedora y ⅔ la parte compradora',
  'promocionarla en forma “condicionada”',
  'esa reserva se devuelve completa',
  'nadie deba hacerse cargo de futuros problemas sorpresivos',
  '4 recibos de sueldo de contactos aptos',
  'los gastos de este tipo de averías corren por parte del propietario',
  'el dato oficial del IPC',
  'Este servicio es el 10% de la renta mensual',
  'el acceso a servicios y distancia a centros de interés',
  'un 3% del valor negociado, generalmente',
] as const;

test('the sixteen questions render verbatim and in the stakeholder order', async ({
  page,
}) => {
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

test('every answer renders its stakeholder-owned body and no PENDIENTE marker', async ({
  page,
}) => {
  await page.goto('/faqs');

  // The launch blocker is closed: sixteen real answers, zero pending markers.
  await expect(page.locator('.faq-item__marker')).toHaveCount(0);
  await expect(page.locator('.faq-item__meta')).toHaveCount(0);

  const bodies = page.locator('.faq-item__body');
  await expect(bodies).toHaveCount(16);
  for (let i = 0; i < 16; i++) {
    await expect(bodies.nth(i)).toContainText(ANSWER_EXCERPTS[i]);
  }

  // Each answer region is exactly the answer body — never the pending state.
  const shapes = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.faq-item__answer')).map((answer) =>
      Array.from(answer.children).map((child) => child.className),
    ),
  );
  for (const shape of shapes) {
    expect(shape).toEqual(['faq-item__body']);
  }
});

test('no invented content renders on the page (§11, §17.3:729)', async ({ page }) => {
  await page.goto('/faqs');

  const renderedText = await page.evaluate(() => document.body.innerText);
  // Percentages, fractions and counts below are stakeholder-owned copy
  // (3%, 10%, ⅓/⅔, 4 recibos), not invented metrics — so they are not
  // banned here. The bans below catch agent or designer inventions.
  const bannedMarkers: Array<[string, RegExp]> = [
    ['lorem ipsum filler (the screens’ answer bodies)', /lorem|ipsum/i],
    ['CUCICBA (superseded regulator name)', /CUCICBA/i],
    ['Ley 5115 (invented legal reference)', /Ley\s*5115/i],
    ['testimonials', /testimonio/i],
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

test('R11: the CTAs ship the production wa.me link (activated 2026-11-11)', async ({
  page,
}) => {
  await page.goto('/faqs');

  // Sync point with `WHATSAPP_URL` in `src/data/site.ts`.
  const href = 'https://wa.me/5493424727748';
  const html = await page.content();
  expect(html.includes('wa.me'), '/faqs ships no wa.me link').toBe(true);

  await expect(page.locator('.faqs-rail .whatsapp-cta')).toHaveAttribute('href', href);
  await expect(page.locator('.faqs-closing .whatsapp-cta')).toHaveAttribute('href', href);
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
    'Damero Propiedades funciona bajo la coordinación del Corredor Inmobiliario Luis Alejandro Da Silva — CCI 677.',
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
  // The teaser carries the first two stakeholder questions, from `src/data/faqs.ts`.
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
