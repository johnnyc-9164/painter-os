import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { browserLaunchOptions } from '../scripts/agent-browser-options.mjs';
import { assertNoEnvFiles, createRun, unusedPort, spawnNext, observe, stop, waitForReady, gitState, writeJson } from '../scripts/agent-common.mjs';

await assertNoEnvFiles();
const out = await createRun('onboarding-browser');
const base = `http://127.0.0.1:${await unusedPort()}`;
const log = createWriteStream(join(out, 'server.log'), { mode: 0o600 });
let browser, server, state;
try {
  browser = await chromium.launch(await browserLaunchOptions());
  server = spawnNext('start', base, out, ['ignore', 'pipe', 'pipe']);
  state = observe(server);
  server.stdout.pipe(log, {end: false}); server.stderr.pipe(log, {end: false});
  await waitForReady(base, state);
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}, recordVideo: {dir: join(out, 'video')}});
  const page = await context.newPage();
  const errors = [], failures = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 500) failures.push(response.status()); });
  page.on('request', request => { const path = new URL(request.url()).pathname; if (path.startsWith('/api/')) requests.push({path, method: request.method()}); });
  await page.goto(base);
  await page.getByRole('button', {name: 'Create account', exact: true}).click();
  await page.getByLabel('Your name', {exact: true}).fill('Alex Browser');
  await page.getByLabel('Workspace name', {exact: true}).fill('Browser Painting Company');
  await page.getByLabel('Email address', {exact: true}).fill('onboarding@example.invalid');
  await page.getByLabel('Password', {exact: true}).fill('Synthetic-test-password-123');
  await page.getByRole('button', {name: 'Create workspace', exact: true}).click();
  await page.locator('.app-shell').waitFor();
  assert.equal(await page.locator('.workspace-picker strong').textContent(), 'Browser Painting Company');
  const create = requests.findIndex(request => request.path === '/api/workspaces' && request.method === 'POST');
  assert.ok(create >= 0, 'explicit onboarding API called');
  assert.ok(requests.slice(create + 1).some(request => request.path === '/api/snapshot'), 'snapshot loaded after provisioning');
  assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  await page.screenshot({path: join(out, 'company-created.png'), fullPage: true});
  await context.close();
  await writeJson(join(out, 'receipt.json'), {...gitState(), status: 'passed', sandbox: true, browser: browser.version(), runtime: 'local synthetic only', networkMocks: false, scope: ['actual signup form', 'explicit initial setup request', 'company name preserved', 'snapshot after provisioning'], errors, failures});
  console.log(`Onboarding browser passed. Artifacts: ${out}`);
} catch (error) {
  await writeJson(join(out, 'receipt.json'), {...gitState(), status: 'failed', sandbox: true, error: error.message});
  throw error;
} finally {
  try { await browser?.close(); } finally {
    try { if (server) await stop(server, state); } finally { await new Promise(resolve => log.end(resolve)); }
  }
}
