import { defineConfig } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ci = Boolean(process.env.CI);
const visualTestDir = join(process.cwd(), 'tests/visual-regression');
function hasVisualSpecs(dir: string): boolean {
  if (!existsSync(dir)) return false;
  return readdirSync(dir, { withFileTypes: true }).some((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? hasVisualSpecs(path) : entry.isFile() && entry.name.endsWith('.spec.ts');
  });
}
const webServers = hasVisualSpecs(visualTestDir) && !process.env.PW_TEST_NO_SERVER ? [
  server('web', 3001),
  server('marketing', 3002),
  server('company-site', 3003),
  server('platform-admin', 3004),
] : undefined;
function server(workspace: string, port: number) {
  return {
    command: `npm run start --workspace ${workspace} -- --port ${port}`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: !ci,
    timeout: 120_000,
    stdout: 'pipe' as const,
    stderr: 'pipe' as const,
  };
}

export default defineConfig({
  testDir: './tests/visual-regression',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/visual', open: 'never' }]],
  outputDir: 'test-results/visual',
  use: {
    browserName: 'chromium',
    headless: true,
    baseURL: 'http://127.0.0.1:3001',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  ...(webServers ? { webServer: webServers } : {}),
});
