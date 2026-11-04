import { test, expect } from '@playwright/test';

const apps = [
  { name: 'Painter web', port: 3001 },
  { name: 'Marketing', port: 3002 },
  { name: 'Company site', port: 3003 },
  { name: 'Platform admin', port: 3004 },
] as const;

for (const app of apps) {
  test(`${app.name} serves a visible document without runtime errors`, async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    const response = await page.goto(`http://127.0.0.1:${app.port}/`, { waitUntil: 'domcontentloaded' });
    expect(response, `${app.name} must respond`).not.toBeNull();
    expect(response!.status(), `${app.name} must not serve an HTTP error`).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toBeEmpty();
    expect(runtimeErrors, `${app.name} must not throw during initial render`).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`${app.port}-initial.png`), fullPage: true });
  });
}
