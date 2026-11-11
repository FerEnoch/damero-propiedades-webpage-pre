import { expect, test } from '@playwright/test';
import { expectedSlugs, expectedTitlesBySlug } from './helpers/content-expectations';
import { runColorAudits } from './browser-audits';

const COPIED = 'Enlace copiado al portapapeles';
const FAILED = 'No se pudo copiar: seleccioná el enlace y copialo';

declare global {
  interface Window {
    menuCopies: string[];
  }
}

for (const surface of ['detail', 'search'] as const) {
  test.describe(`${surface} share menu without secure-context APIs`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        // Delete both own and inherited implementations to model HTTP origins.
        delete (Navigator.prototype as Partial<Navigator>).share;
        delete (navigator as Partial<Navigator>).share;
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
        window.menuCopies = [];
        document.execCommand = (command: string) => {
          if (command !== 'copy') return false;
          window.menuCopies.push((document.activeElement as HTMLTextAreaElement).value);
          return true;
        };
      });
      await page.route(/openfreemap/, (route) => route.abort());
      const slug = expectedSlugs()[0];
      test.skip(surface === 'detail' && !slug, 'No property detail route exists.');
      await page.goto(surface === 'detail' ? `/propiedades/${slug}` : '/propiedades?operacion=venta');
    });

    test('opens four text actions, a selectable live URL and a node glyph without overflow', async ({ page, viewport }) => {
      const root = page.locator('[data-share-menu]');
      const trigger = root.getByRole('button', { name: 'Compartir', exact: true });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(root.getByRole('menu')).toBeHidden();
      await expect(trigger.locator('svg circle')).toHaveCount(3);
      await expect(trigger.locator('svg line')).toHaveCount(2);
      await expect(trigger.locator('svg path, svg polyline, svg polygon')).toHaveCount(0);
      await expect(trigger.locator('svg')).toHaveAttribute('viewBox', '0 0 24 24');
      await expect(trigger.locator('svg')).toHaveAttribute('stroke', 'currentColor');
      await expect(trigger.locator('svg')).toHaveAttribute('fill', 'none');
      await expect(trigger.locator('svg')).toHaveAttribute('aria-hidden', 'true');
      await expect(trigger).not.toHaveClass(/\bbutton(?:--[\w-]+)?\b/);
      await expect(root.locator('[data-share-status]')).toHaveCount(0);
      await expect(root.locator('[data-share-status-menu]')).toHaveCount(1);
      for (const channel of ['WhatsApp', 'Telegram', 'Email']) {
        await expect(root.locator(`a[data-share-channel="${channel}"]`)).toHaveAttribute('href', '#');
      }
      await trigger.click();
      const panel = root.getByRole('menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(panel).toHaveAttribute('id', (await trigger.getAttribute('aria-controls'))!);
      for (const name of ['WhatsApp', 'Telegram', 'Email', 'Copiar enlace']) {
        const action = panel.getByRole('menuitem', { name, exact: true });
        await expect(action).toBeVisible();
        expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      await expect(panel.locator('[data-share-url]')).toHaveCount(0);
      await expect(panel.locator(':scope > *')).toHaveCount(4);
      await expect(panel.locator(':scope > :not([role="menuitem"])')).toHaveCount(0);
      const url = root.locator('[data-share-url]');
      await expect(root.locator('.share-menu__panel > [data-share-url]')).toHaveCount(1);
      await expect(url).toBeVisible();
      await expect(url).toHaveText(page.url());
      expect(await url.evaluate((el) => getComputedStyle(el).userSelect)).toBe('text');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      const box = (await panel.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport!.width);
      const audit = await page.evaluate(runColorAudits, [
        { name: 'share trigger', selector: '.share-menu__trigger' },
        { name: 'share action', selector: '.share-menu__panel [role="menuitem"]' },
      ]);
      expect(audit.sageTextViolations).toEqual([]);
      expect(audit.contrastViolations).toEqual([]);
      for (const probe of audit.matrix) expect(probe.ratio).toBeGreaterThanOrEqual(probe.threshold);
    });

    for (const direction of ['below', 'above'] as const) {
      test(`composition stays attached and inside the viewport when opening ${direction}`, async ({ page, viewport }) => {
        const root = page.locator('[data-share-menu]');
        const trigger = root.getByRole('button', { name: 'Compartir', exact: true });
        const panel = root.locator('.share-menu__panel');
        const status = panel.getByRole('status', { includeHidden: true });
        await expect.soft(status).toHaveCount(1);
        expect.soft(await root.evaluate((el) => getComputedStyle(el).display)).not.toBe('contents');
        const wrapperHeight = await root.evaluate((el) => el.getBoundingClientRect().height);
        const reserved = await root.evaluate((el) => el.getBoundingClientRect().bottom - el.querySelector('button')!.getBoundingClientRect().bottom);
        expect.soft(reserved).toBeGreaterThanOrEqual(0);
        expect.soft(reserved).toBeLessThan(30);
        if (surface === 'search' && viewport!.width === 320) {
          const field = (await page.locator('[data-share-field]').boundingBox())!;
          const copy = (await page.getByRole('button', { name: 'Copiar búsqueda', exact: true }).boundingBox())!;
          const share = (await trigger.boundingBox())!;
          expect(copy.y).toBeGreaterThanOrEqual(field.y + field.height);
          expect(share.y).toBeGreaterThanOrEqual(copy.y + copy.height);
        }
        // Exercise both directions with the actual rendered URL and panel height.
        await trigger.evaluate((el, direction) => {
          const top = direction === 'below' ? 160 : window.innerHeight - 100;
          window.scrollBy(0, el.getBoundingClientRect().top - top);
        }, direction);
        await trigger.click();
        await expect(panel).toBeVisible();
        await expect.soft(status).toHaveAttribute('aria-live', 'polite');
        const assertComposition = async () => {
          const geometry = await panel.evaluate((el) => {
            const box = el.getBoundingClientRect();
            const trigger = el.closest('[data-share-menu]')!.querySelector('button')!.getBoundingClientRect();
            return {
              top: box.top, bottom: box.bottom, left: box.left, right: box.right,
              gap: box.top >= trigger.bottom ? box.top - trigger.bottom : trigger.top - box.bottom,
              above: box.bottom <= trigger.top,
              height: window.innerHeight, width: window.innerWidth,
            };
          });
          expect.soft(geometry.above).toBe(direction === 'above');
          expect.soft(geometry.gap).toBeGreaterThanOrEqual(0);
          expect.soft(geometry.gap).toBeLessThanOrEqual(16);
          expect.soft(geometry.top).toBeGreaterThanOrEqual(0);
          expect.soft(geometry.bottom).toBeLessThanOrEqual(geometry.height + 1);
          expect(geometry.left).toBeGreaterThanOrEqual(0);
          expect(geometry.right).toBeLessThanOrEqual(geometry.width);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
          expect(await root.evaluate((el) => el.getBoundingClientRect().height)).toBeCloseTo(wrapperHeight, 1);
        };
        await assertComposition();
        await root.getByRole('menuitem', { name: 'Copiar enlace', exact: true }).click();
        await expect(status).toHaveText(COPIED);
        await expect(status).toBeVisible();
        await assertComposition();
        await page.keyboard.press('Escape');
        await expect(panel).toBeHidden();
        expect(await root.evaluate((el) => el.getBoundingClientRect().height)).toBeCloseTo(wrapperHeight, 1);
      });
    }

    test('feedback stays clear of sticky chrome when space is tight', async ({ page }) => {
      const root = page.locator('[data-share-menu]');
      const trigger = root.getByRole('button', { name: 'Compartir', exact: true });
      await trigger.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - (window.innerHeight / 2 - 24)));
      await trigger.click();
      await root.getByRole('menuitem', { name: 'Copiar enlace', exact: true }).click();
      const status = root.locator('.share-menu__panel').getByRole('status');
      await expect(status).toHaveText(COPIED);
      await expect(status).toBeVisible();
      const bounds = await root.evaluate((el) => {
        const panelElement = el.querySelector<HTMLElement>('.share-menu__panel')!;
        const panel = panelElement.getBoundingClientRect();
        const trigger = el.querySelector('button')!.getBoundingClientRect();
        const status = el.querySelector('[role="status"]')!.getBoundingClientRect();
        const pinned = Array.from(document.querySelectorAll<HTMLElement>('.site-header, .mobile-bar')).filter((el) => {
          const style = getComputedStyle(el);
          return style.position === 'sticky' && el.getBoundingClientRect().top <= parseFloat(style.top) + 1;
        });
        const top = Math.max(0, ...pinned.map((el) => el.getBoundingClientRect().bottom));
        const sticky = document.querySelector<HTMLElement>('.whatsapp-sticky');
        const bottom = sticky?.offsetHeight ? sticky.getBoundingClientRect().top : window.innerHeight;
        const gap = parseFloat(getComputedStyle(el).getPropertyValue('--space-2'));
        return { panelTop: panel.top, panelBottom: panel.bottom, statusTop: status.top, statusBottom: status.bottom,
          top, bottom, triggerTop: trigger.top, mustFlip: panelElement.scrollHeight > bottom - trigger.bottom - gap };
      });
      expect(bounds.panelTop).toBeGreaterThanOrEqual(bounds.top);
      expect(bounds.panelBottom).toBeLessThanOrEqual(bounds.bottom);
      if (bounds.mustFlip) expect(bounds.panelBottom).toBeLessThanOrEqual(bounds.triggerTop);
      expect(bounds.statusTop).toBeGreaterThanOrEqual(bounds.panelTop);
      expect(bounds.statusBottom).toBeLessThanOrEqual(bounds.panelBottom);
    });

    for (const channel of ['WhatsApp', 'Telegram', 'Email'] as const) {
      test(`${channel} opens its prepared channel without copying or leaving the site`, async ({ page, context }) => {
        const root = page.locator('[data-share-menu]');
        const url = page.url();
        const title = surface === 'detail' ? expectedTitlesBySlug()[expectedSlugs()[0]] : 'Búsqueda de propiedades';
        const text = surface === 'detail'
          ? `Mirá esta propiedad de Damero Propiedades: ${title} — `
          : 'Te comparto esta búsqueda de Damero Propiedades con los filtros aplicados: ';
        const destinations = {
          WhatsApp: `https://wa.me/?text=${encodeURIComponent(text + url)}`,
          Telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
          Email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + url)}`,
        };
        await root.getByRole('button', { name: 'Compartir', exact: true }).click();
        const action = root.getByRole('menuitem', { name: channel, exact: true });
        expect(await action.evaluate((el) => el.tagName)).toBe('A');
        await expect(action).toHaveAttribute('href', destinations[channel]);
        if (channel === 'Email') {
          await expect(action).not.toHaveAttribute('target');
          const navigations: string[] = [];
          page.on('framenavigated', (frame) => navigations.push(frame.url()));
          await action.click();
          expect(navigations).toEqual([]);
          expect(context.pages()).toHaveLength(1);
        } else {
          await expect(action).toHaveAttribute('target', '_blank');
          await expect(action).toHaveAttribute('rel', 'noopener noreferrer');
          if (channel === 'WhatsApp') expect(new URL(destinations[channel]).pathname).toBe('/');
          const external = /^https:\/\/(wa\.me|t\.me)\//;
          await page.route(external, (route) => route.fulfill({ status: 200, body: 'Intercepted share destination' }));
          // A popup's first request is only intercepted by a context route.
          await context.route(external, (route) => route.fulfill({ status: 200, body: 'Intercepted share destination' }));
          const requested = context.waitForEvent('request', (request) => request.url() === destinations[channel]);
          const opened = page.waitForEvent('popup');
          await action.click();
          const popup = await opened;
          expect((await requested).url()).toBe(destinations[channel]);
          await popup.waitForLoadState();
          await expect(popup).toHaveURL(destinations[channel]);
          await popup.close();
        }
        await expect(page).toHaveURL(url);
        expect(await page.evaluate(() => window.menuCopies)).toEqual([]);
        await expect(root.locator('[data-share-status-menu]')).toHaveText('');
        await expect(root.locator('[data-share-url]')).toBeVisible();
      });
    }

    test('unprepared channel links prevent placeholder navigation', async ({ page, context }) => {
      const root = page.locator('[data-share-menu]');
      const url = page.url();
      await root.getByRole('button', { name: 'Compartir', exact: true }).click();
      for (const channel of ['WhatsApp', 'Telegram', 'Email']) {
        const action = root.getByRole('menuitem', { name: channel, exact: true });
        await action.evaluate((el) => el.setAttribute('href', '#'));
        await action.click();
        await expect(page).toHaveURL(url);
        expect(context.pages()).toHaveLength(1);
      }
      expect(await page.evaluate(() => window.menuCopies)).toEqual([]);
    });

    test('Copiar enlace copies without navigation and provides visible feedback', async ({ page }) => {
      const root = page.locator('[data-share-menu]');
      const url = page.url();
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const trigger = root.getByRole('button', { name: 'Compartir', exact: true });
      await trigger.click();
      const copy = root.getByRole('menuitem', { name: 'Copiar enlace', exact: true });
      expect(await copy.evaluate((el) => el.tagName)).toBe('BUTTON');
      await copy.click();
      const status = root.locator('.share-menu__panel').getByRole('status');
      await expect(status).toHaveAttribute('aria-live', 'polite');
      await expect(status).toHaveText(COPIED);
      await expect(status).toBeVisible();
      expect(await page.evaluate(() => window.menuCopies)).toEqual([url]);
      await expect(page.locator('textarea')).toHaveCount(0);
      await expect(page).toHaveURL(url);
      expect(errors).toEqual([]);
      if (surface === 'search') {
        await expect(page.locator('[data-share-status]')).toHaveText('');
      }
    });

    for (const failure of ['false', 'throw'] as const) {
      test(`legacy copy returning ${failure} exposes an honest failure and manual URL`, async ({ page }) => {
        await page.evaluate((failure) => {
          document.execCommand = () => {
            if (failure === 'throw') throw new Error('copy denied');
            return false;
          };
        }, failure);
        const root = page.locator('[data-share-menu]');
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await root.getByRole('button', { name: 'Compartir', exact: true }).click();
        const status = root.locator('.share-menu__panel').getByRole('status');
        const before = await root.evaluate((el) => el.getBoundingClientRect().height);
        await root.getByRole('menuitem', { name: 'Copiar enlace', exact: true }).click();
        await expect(status).toHaveText(FAILED);
        await expect(status).toBeVisible();
        expect(await root.evaluate((el) => el.getBoundingClientRect().height)).toBeCloseTo(before, 1);
        const bounds = await root.locator('.share-menu__panel').evaluate((el) => ({
          top: el.getBoundingClientRect().top,
          bottom: el.getBoundingClientRect().bottom,
          height: window.innerHeight,
        }));
        expect(bounds.top).toBeGreaterThanOrEqual(0);
        expect(bounds.bottom).toBeLessThanOrEqual(bounds.height + 1);
        const textHeight = await status.evaluate((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return range.getBoundingClientRect().height;
        });
        // In-panel feedback wraps naturally instead of reserving two outer lines.
        expect(textHeight).toBeLessThanOrEqual(await status.evaluate((el) => el.clientHeight));
        const feedback = (await status.boundingBox())!;
        const panel = (await root.locator('.share-menu__panel').boundingBox())!;
        expect(feedback.y).toBeGreaterThanOrEqual(panel.y);
        expect(feedback.y + feedback.height).toBeLessThanOrEqual(panel.y + panel.height);
        const sticky = page.locator('.whatsapp-sticky');
        if (surface === 'detail' && await sticky.isVisible()) {
          expect(panel.y + panel.height).toBeLessThanOrEqual((await sticky.boundingBox())!.y);
        }
        expect(await status.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
        await expect(root.locator('[data-share-url]')).toBeVisible();
        await expect(root.locator('[data-share-url]')).toHaveText(page.url());
        await expect(page.locator('textarea')).toHaveCount(0);
        expect(await page.evaluate(() => window.menuCopies)).toEqual([]);
        expect(errors).toEqual([]);
      });
    }

    test('toggle, outside click, Escape and arrow-key navigation work by keyboard', async ({ page }) => {
      const root = page.locator('[data-share-menu]');
      const trigger = root.getByRole('button', { name: 'Compartir', exact: true });
      const panel = root.getByRole('menu');
      await trigger.click();
      await expect(panel.getByRole('menuitem', { name: 'WhatsApp', exact: true })).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(panel.getByRole('menuitem', { name: 'Telegram', exact: true })).toBeFocused();
      await page.keyboard.press('End');
      await expect(panel.getByRole('menuitem', { name: 'Copiar enlace', exact: true })).toBeFocused();
      await page.keyboard.press('Home');
      await page.keyboard.press('ArrowUp');
      await expect(panel.getByRole('menuitem', { name: 'Copiar enlace', exact: true })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(panel).toBeHidden();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(panel).toBeVisible();
      await trigger.click();
      await expect(panel).toBeHidden();
      await trigger.click();
      await page.locator('h1').click();
      await expect(panel).toBeHidden();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    test('clipboard rejection falls back to legacy copying', async ({ page }) => {
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: async () => { throw new Error('denied'); } },
      }));
      const root = page.locator('[data-share-menu]');
      await root.getByRole('button', { name: 'Compartir', exact: true }).click();
      await root.getByRole('menuitem', { name: 'Copiar enlace', exact: true }).click();
      await expect(root.getByRole('status')).toHaveText(COPIED);
      await expect(root.getByRole('status')).toBeVisible();
      expect(await page.evaluate(() => window.menuCopies)).toEqual([page.url()]);
      await expect(root.getByRole('menuitem', { name: 'Copiar enlace', exact: true })).toBeFocused();
    });
  });
}
