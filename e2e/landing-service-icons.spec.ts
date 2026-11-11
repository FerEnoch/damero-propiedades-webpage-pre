import { expect, test } from '@playwright/test';

/**
 * Service icon set — the duotone contract of docs/DESIGN.md §8.
 *
 * The set is a design-system artefact, not decoration: every glyph is a
 * two-layer construction (one solid sage accent mass drawn behind a 1.5px
 * `currentColor` line) that has to stay legible at 24–30px inside a 48px
 * badge. Two glyphs of the eight failed that budget and were rebuilt on
 * 2026-11-11 (`odd/tasks/damero-service-icon-redesign.md`).
 *
 * Nothing else in the suite asserts anything about these glyphs, so a
 * regression that removed the accent mass, dropped the line work or left a
 * `<title>` in the DOM would pass every other spec silently. This file is
 * that guard.
 *
 * The glyphs are identified by their adjacent heading, never by position:
 * the services grid is two columns on desktop and one on mobile.
 *
 * The assertions read the *computed* style, not the attribute: the glyphs
 * inherit `stroke`, `stroke-width` and `fill` from an ancestor `<g>` in
 * some cases (`icon-megaphone.svg`), and `currentColor` resolves to the
 * brand ink rather than staying a literal.
 */

const SAGE = 'rgb(124, 145, 111)'; // #7C916F
const FOREST = 'rgb(62, 72, 55)'; // #3E4837, --color-text-primary

/** The eight services, as they read on the landing (docs/DESIGN.md §5). */
const SERVICE_NAMES = [
  'Tasación',
  'Comercialización',
  'Negociación',
  'Gestión documental',
  'Alquileres',
  'Fotografía profesional',
  'Asesoramiento legal',
  'Marketing inmobiliario',
];

/**
 * The painted shapes of a glyph, whatever element type they use:
 * `icon-megaphone.svg` draws its line work with `<rect>`, the rest with
 * `<path>`.
 */
const SHAPE_QUERY = 'path, rect, circle, ellipse, line, polygon, polyline';

interface GlyphShape {
  total: number;
  sage: number;
  stroked: number;
  strokeWidths: string[];
}

async function readGlyph(locator: import('@playwright/test').Locator): Promise<GlyphShape> {
  return locator.evaluate((el, query) => {
    const shapes = Array.from(el.querySelectorAll(query));
    const style = (s: Element) => getComputedStyle(s);
    const sageShapes = shapes.filter((s) => style(s).fill === 'rgb(124, 145, 111)');
    const strokedShapes = shapes.filter((s) => style(s).stroke !== 'none');
    return {
      total: shapes.length,
      sage: sageShapes.length,
      stroked: strokedShapes.length,
      strokeWidths: strokedShapes.map((s) => style(s).strokeWidth),
    };
  }, SHAPE_QUERY);
}

test('every service glyph is a duotone construction: one sage mass behind currentColor line work', async ({
  page,
}) => {
  await page.goto('/');

  const items = page.locator('.services__item');
  await expect(items).toHaveCount(SERVICE_NAMES.length);

  for (const name of SERVICE_NAMES) {
    const item = items.filter({ hasText: name });
    await expect(item, `service row "${name}" is missing`).toHaveCount(1);

    const svg = item.locator('svg.service-icon');
    await expect(svg, `glyph "${name}" is missing`).toHaveCount(1);

    const shape = await readGlyph(svg);

    // Exactly one accent mass (§8 — two inks, the sage layer drawn first).
    expect(shape.sage, `glyph "${name}" sage mass count`).toBe(1);
    // At least one stroked shape: an icon with no line work is not the set.
    expect(shape.stroked, `glyph "${name}" has no stroked shape`).toBeGreaterThan(0);
    // Every stroked shape is 1.5px — the one stroke weight the set uses.
    for (const width of shape.strokeWidths) {
      expect(width, `glyph "${name}" stroke width`).toBe('1.5px');
    }
  }
});

test('service glyphs are decorative: aria-hidden, focusable off and no title in the DOM', async ({
  page,
}) => {
  await page.goto('/');

  const svgs = page.locator('.services__badge svg.service-icon');
  await expect(svgs).toHaveCount(SERVICE_NAMES.length);

  for (const svg of await svgs.all()) {
    await expect(svg).toHaveAttribute('aria-hidden', 'true');
    await expect(svg).toHaveAttribute('focusable', 'false');
    // The <title> is stripped at build time — the adjacent text is the name.
    await expect(svg.locator('title')).toHaveCount(0);
  }
});

test('service glyphs use only the two brand inks of the duotone contract', async ({ page }) => {
  await page.goto('/');

  // The sage accent mass inside the icon SVGs is the one documented
  // exception to the token-layer rule (§13); the line work resolves through
  // `currentColor` to the brand ink. No other colour may appear.
  const offenders = await page.evaluate((query) => {
    const found: string[] = [];
    for (const svg of document.querySelectorAll('.services__badge svg.service-icon')) {
      for (const shape of Array.from(svg.querySelectorAll(query))) {
        const style = getComputedStyle(shape);
        const fill = style.fill;
        const stroke = style.stroke;
        if (fill !== 'none' && fill !== 'rgb(124, 145, 111)') {
          found.push(`${shape.tagName} fill ${fill}`);
        }
        if (stroke !== 'none' && stroke !== 'rgb(62, 72, 55)') {
          found.push(`${shape.tagName} stroke ${stroke}`);
        }
      }
    }
    return found;
  }, SHAPE_QUERY);

  expect(offenders).toEqual([]);
});

test('the two redesigned glyphs ship their new geometry, not the superseded drawings', async ({
  page,
}) => {
  await page.goto('/');

  const items = page.locator('.services__item');
  const glyphOf = (name: string) => items.filter({ hasText: name }).locator('svg.service-icon');

  // Negociación — the Lucide clasp: five stroked shapes and the sage mass
  // on the near palm. The old drawing spent eight strokes on the clasp
  // alone and read as a keyboard at badge size.
  const negotiation = await readGlyph(glyphOf('Negociación'));
  expect(negotiation.stroked).toBe(5);
  expect(negotiation.sage).toBe(1);

  // Asesoramiento legal — the shield: one stroked outline plus the sage
  // check. The old pen-and-seal drawing (a filled disc, a 2.3px ring and a
  // sub-pixel 0.8px circle) is gone.
  const legal = await readGlyph(glyphOf('Asesoramiento legal'));
  expect(legal.stroked).toBe(1);
  expect(legal.sage).toBe(1);
  expect(legal.total).toBe(2);
});

test('service badges are square with a 4px radius and hold the glyph at its shipped size', async ({
  page,
  viewport,
}) => {
  await page.goto('/');

  const expectedGlyphSize = viewport.width! >= 768 ? 30 : 28;

  const badges = page.locator('.services__badge');
  await expect(badges).toHaveCount(SERVICE_NAMES.length);

  for (let index = 0; index < SERVICE_NAMES.length; index += 1) {
    const badge = badges.nth(index);

    const box = await badge.evaluate((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        radius: style.borderTopLeftRadius,
      };
    });

    // §8 — 48 × 48 at every breakpoint, square with a 4px radius.
    expect(box.width, `badge ${index} width`).toBe(48);
    expect(box.height, `badge ${index} height`).toBe(48);
    expect(box.width).toBe(box.height);
    expect(box.radius, `badge ${index} radius`).toBe('4px');
    // Never a pill or a circle (§4, §11).
    expect(box.radius).not.toBe('999px');

    const glyph = await badge.locator('svg.service-icon').evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: Math.round(rect.width), height: Math.round(rect.height) };
    });
    expect(glyph.width, `glyph ${index} width`).toBe(expectedGlyphSize);
    expect(glyph.height).toBe(expectedGlyphSize);
  }
});
