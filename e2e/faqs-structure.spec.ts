import { expect, test } from '@playwright/test';

/**
 * FAQ page structure and semantics (ODD §17 slice S4). Mirrors the S2/S3
 * structure specs: route health, landmarks, heading levels, horizontal
 * overflow, the §17.3 accordion contract (hairline-only separation, the
 * whole-row toggle with `aria-expanded`/`aria-controls`, the first item
 * expanded by default, the swapped `+`/`−` affordance, `grid-template-rows`
 * animation), the viewport-gated row heights, the active nav state, and the
 * no-dead-internal-links rule.
 */

test('/faqs responds 200, has a title and exactly one h1', async ({ page }) => {
  const response = await page.goto('/faqs');
  expect(response).not.toBeNull();
  expect(response!.status()).toBe(200);

  await expect(page).toHaveTitle('Preguntas frecuentes | Damero Propiedades');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('Preguntas frecuentes');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('header, main and footer landmarks are present', async ({ page }) => {
  await page.goto('/faqs');

  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);
});

test('heading levels never skip (h1 to h2)', async ({ page }) => {
  await page.goto('/faqs');

  const levels = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6')).map(
      (heading) => Number(heading.tagName.slice(1)),
    ),
  );

  expect(levels.length).toBeGreaterThan(0);
  expect(levels[0]).toBe(1);
  for (let i = 1; i < levels.length; i++) {
    expect(
      levels[i],
      `heading #${i + 1} jumps from h${levels[i - 1]} to h${levels[i]}`,
    ).toBeLessThanOrEqual(levels[i - 1] + 1);
  }
});

test('no horizontal overflow', async ({ page }) => {
  await page.goto('/faqs');

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    metrics.scrollWidth,
    `horizontal overflow: scrollWidth ${metrics.scrollWidth} > clientWidth ${metrics.clientWidth} + 1`,
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);
});

test('the header nav marks /faqs as the active route', async ({ page }) => {
  await page.goto('/faqs');

  const active = page.locator('.site-nav__link.is-active');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute('href', '/faqs');
  await expect(active).toHaveAttribute('aria-current', 'page');
});

test('accordion items are separated by a hairline only — no cards, fills, shadows or icons', async ({
  page,
}) => {
  await page.goto('/faqs');

  const items = page.locator('.faq-item');
  await expect(items).toHaveCount(6);

  const style = await items.first().evaluate((el) => {
    const computed = getComputedStyle(el);
    return {
      background: computed.backgroundColor,
      shadow: computed.boxShadow,
      radius: computed.borderRadius,
      borderBottom: computed.borderBottom,
    };
  });
  // §17.3:715 — `1px solid --color-border-hairline` (#DCE1D6) and nothing else.
  expect(style.background).toBe('rgba(0, 0, 0, 0)');
  expect(style.shadow).toBe('none');
  expect(style.radius).toBe('0px');
  expect(style.borderBottom).toBe('1px solid rgb(220, 225, 214)');

  // No icons anywhere in the accordion (§17.3:715).
  await expect(page.locator('.faqs-accordion svg')).toHaveCount(0);
});

test('the accordion wiring: aria-controls resolves and the first item is expanded by default', async ({
  page,
}) => {
  await page.goto('/faqs');

  const toggles = page.locator('.faq-item__toggle');
  await expect(toggles).toHaveCount(6);

  // §17.3:718 — the whole row is a `<button>` with aria-expanded/aria-controls.
  const wiring = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.faq-item__toggle')).map((toggle) => {
      const id = toggle.getAttribute('aria-controls') ?? '';
      return {
        id,
        targets: document.querySelectorAll(`#${CSS.escape(id)}`).length,
        expanded: toggle.getAttribute('aria-expanded'),
      };
    }),
  );
  for (const wire of wiring) {
    expect(wire.id).not.toBe('');
    expect(wire.targets, `aria-controls="${wire.id}" does not resolve to exactly one panel`).toBe(1);
  }

  // §17.3:721 — the first item is expanded by default, the rest collapsed.
  expect(wiring[0].expanded).toBe('true');
  for (let i = 1; i < wiring.length; i++) {
    expect(wiring[i].expanded).toBe('false');
  }
  await expect(page.locator('#faq-panel-1')).toBeVisible();
  for (let i = 2; i <= 6; i++) {
    await expect(page.locator(`#faq-panel-${i}`)).toBeHidden();
  }
});

test('toggling swaps aria-expanded, the panel state and the affordance glyph', async ({ page }) => {
  await page.goto('/faqs');

  const toggle1 = page.locator('#faq-toggle-1');
  const panel1 = page.locator('#faq-panel-1');
  const toggle2 = page.locator('#faq-toggle-2');
  const panel2 = page.locator('#faq-panel-2');
  const glyph2 = toggle2.locator('.faq-item__affordance');

  // Collapsed affordance is `+`; expanded is `−` (U+2212) — swapped, not rotated.
  await expect(glyph2).toHaveText('+');
  await toggle2.click();
  await expect(toggle2).toHaveAttribute('aria-expanded', 'true');
  await expect(panel2).toHaveClass(/faq-item__panel--open/);
  await expect(glyph2).toHaveText('−');
  await expect(panel2).toBeVisible();

  // §17.3:721 — multiple items may be open: item 1 stayed expanded.
  await expect(toggle1).toHaveAttribute('aria-expanded', 'true');
  await expect(panel1).toBeVisible();

  // Collapsing all is allowed.
  await toggle1.click();
  await expect(toggle1).toHaveAttribute('aria-expanded', 'false');
  await expect(panel1).toBeHidden();
  await expect(panel2).toBeVisible();

  await toggle2.click();
  await expect(toggle2).toHaveAttribute('aria-expanded', 'false');
  await expect(panel2).toBeHidden();
  await expect(glyph2).toHaveText('+');
});

test('the affordance is a bare glyph — never rotated, never inside a circle or a rounded container', async ({
  page,
}) => {
  await page.goto('/faqs');

  const style = await page
    .locator('.faq-item__affordance')
    .first()
    .evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        transform: computed.transform,
        borderRadius: computed.borderRadius,
        background: computed.backgroundColor,
      };
    });
  // §17.3:717 — the glyph is swapped, not rotated; no container at all.
  expect(style.transform).toBe('none');
  expect(style.borderRadius).toBe('0px');
  expect(style.background).toBe('rgba(0, 0, 0, 0)');
});

test('the row meets its minimum height: 56px on mobile, 64px on desktop (§17.3:718)', async ({
  page,
  viewport,
}) => {
  await page.goto('/faqs');

  const minHeight = await page
    .locator('.faq-item__toggle')
    .first()
    .evaluate((el) => parseFloat(getComputedStyle(el).minHeight));

  if (viewport && viewport.width >= 768) {
    expect(minHeight).toBe(64);
  } else {
    expect(minHeight).toBe(56);
  }
});

test('the height animation uses grid-template-rows, never height (§17.3:720, §9)', async ({
  page,
}) => {
  await page.goto('/faqs');

  const transition = await page
    .locator('.faq-item__panel')
    .first()
    .evaluate((el) => {
      const computed = getComputedStyle(el);
      return { property: computed.transitionProperty };
    });
  expect(transition.property).toContain('grid-template-rows');
  expect(transition.property).not.toContain('height');
});

test('under prefers-reduced-motion the panel collapses instantly (§17.3:720)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/faqs');

  const seconds = await page
    .locator('.faq-item__panel')
    .first()
    .evaluate((el) => {
      const raw = getComputedStyle(el).transitionDuration;
      return raw.split(',').map((value) => {
        const time = value.trim();
        return time.endsWith('ms') ? parseFloat(time) / 1000 : parseFloat(time);
      });
    });
  expect(Math.max(...seconds)).toBeLessThan(0.001);
});

test('/faqs has no dead internal links', async ({ page }) => {
  await page.goto('/faqs');

  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]'))
      .map((anchor) => anchor.getAttribute('href') ?? '')
      .filter((href) => href.startsWith('/')),
  );
  const unique = [...new Set(hrefs)];
  expect(unique.length).toBeGreaterThan(0);

  for (const href of unique) {
    const response = await page.request.get(href);
    expect(response.status(), `${href} is a dead internal link`).toBe(200);
  }
});

test('no numeric map coordinates render anywhere in the page (PRD §9)', async ({ page }) => {
  await page.goto('/faqs');

  const html = await page.content();
  const banned = [
    '-34.55',
    '-59.12',
    '-34.665',
    '-59.445',
    '-34.555',
    '-59.085',
    'map_lat',
    'map_lon',
  ];
  for (const marker of banned) {
    expect(html.includes(marker), `coordinate marker found in HTML: ${marker}`).toBe(false);
  }
});
