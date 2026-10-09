import {defineConfig} from '@playwright/test';
/** Intercepted synthetic authenticated transport only; owned secret-free production server. */
export default defineConfig({testDir: './tests', testMatch: 'company-website-editor.browser.spec.ts', workers: 1, retries: 0, timeout: 90_000, reporter: 'list', outputDir: '.agent/website-playwright', use: {browserName: 'chromium', headless: true, viewport: {width: 1440, height: 1000}, launchOptions: {executablePath: '/usr/bin/chromium', chromiumSandbox: true}}});
