import { browserLaunchOptions, requestJsonLines } from './agent-browser-options.mjs';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { appendFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { assertNoEnvFiles, createRun, unusedPort, spawnNext, observe, stop, waitForReady, safeRoute, gitState, writeJson } from './agent-common.mjs';

await assertNoEnvFiles();
const directory = await createRun('browser');
const base = `http://127.0.0.1:${await unusedPort()}`;
const log = createWriteStream(join(directory, 'server.log'), { mode: 0o600 });
let server, state, browser, browserDetails;
const interrupt = () => server?.kill('SIGTERM');
process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
try {
  // Sandbox remains enabled; a runner limitation is a failure, never a reason to disable it.
  const options = await browserLaunchOptions();
  browserDetails = { executablePath: options.executablePath ?? chromium.executablePath() };
  browser = await chromium.launch(options);
  browserDetails.version = browser.version();
  server = spawnNext('start', base, directory, ['ignore', 'pipe', 'pipe']); state = observe(server);
  server.stdout.pipe(log, { end: false }); server.stderr.pipe(log, { end: false });
  await waitForReady(base, state);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, recordVideo: { dir: join(directory, 'video') } });
  const page = await context.newPage();
  const errors = [], failures = [], spans = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 500) failures.push({ route: safeRoute(response.url()), status: response.status() }); });
  page.on('requestfinished', request => { const timing = request.timing(); spans.push({ traceId: randomUUID(), route: safeRoute(request.url()), method: request.method(), durationMs: timing.responseEnd }); });
  await page.goto(base); await page.getByRole('button', { name: 'Explore demo workspace' }).waitFor();
  await page.screenshot({ path: join(directory, 'before.png'), fullPage: true });
  await page.getByRole('button', { name: 'Explore demo workspace' }).click(); await page.locator('.app-shell').waitFor();
  for (const route of ['/overview', '/leads', '/customers', '/estimates', '/jobs', '/schedule', '/invoices', '/content']) {
    await page.goto(base + route); await page.locator('.app-shell').waitFor();
    assert.equal(await page.locator('.error').count(), 0, route);
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(base + '/overview'); await page.locator('.app-shell').waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390, 'mobile overflow');
  await page.screenshot({ path: join(directory, 'after-mobile.png'), fullPage: true });
  await context.close(); assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  await appendFile(join(directory, 'requests.jsonl'), spans.map(span => JSON.stringify(span)).join('\n') + '\n', { mode: 0o600 });
  await writeJson(join(directory, 'receipt.json'), { ...gitState(), status: 'passed', sandbox: true, browser: browserDetails, runtime: 'local', scope: 'demo login, navigation, mobile layout; not cloud auth or full financial lifecycle', errors, failures });
  console.log(`Browser smoke passed. Artifacts: ${directory}`);
} catch (error) {
  await writeJson(join(directory, 'receipt.json'), { ...gitState(), status: 'failed', sandbox: true, browser: browserDetails, error: error.message });
  console.error(`Browser smoke failed. Artifacts: ${directory}`); throw error;
} finally {
  process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
  try { await browser?.close(); } finally {
    try { if (server) await stop(server, state); } finally { await new Promise(resolve => log.end(resolve)); }
  }
}
