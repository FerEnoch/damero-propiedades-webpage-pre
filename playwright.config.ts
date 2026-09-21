import { defineConfig } from '@playwright/test';

/**
 * Playwright e2e gate for the Damero Propiedades landing (ODD task T7).
 *
 * The suite runs against the production build (`dist/`), never the dev
 * server: the build is part of the acceptance gate. Browser is Playwright's
 * bundled chromium (no `channel`, no `executablePath`). Documented fallback
 * if the download is ever blocked: `use: { channel: 'chrome' }` against the
 * system Chrome — a stakeholder decision, not a default.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-1280',
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile-390',
      use: { viewport: { width: 390, height: 844 } },
    },
    {
      name: 'mobile-320',
      use: { viewport: { width: 320, height: 720 } },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    /*
     * Astro 7.2+ daemonises `astro preview` into a managed background process
     * when it detects an AI coding agent, and the foreground CLI exits — which
     * Playwright reads as "webServer exited early". ASTRO_PREVIEW_BACKGROUND=0
     * pins the documented foreground behaviour so the gate behaves identically
     * under an agent shell and in plain CI.
     */
    env: {
      ASTRO_PREVIEW_BACKGROUND: '0',
    },
  },
});
