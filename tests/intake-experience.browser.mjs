import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import { createWriteStream } from 'node:fs';
import { chromium } from '@playwright/test';
import { browserLaunchOptions } from '../scripts/agent-browser-options.mjs';
import { createRun, unusedPort, spawnNext, observe, stop, waitForReady, gitState, writeJson, assertNoEnvFiles } from '../scripts/agent-common.mjs';
await assertNoEnvFiles();
const out = await createRun('intake-experience-browser');
const settings = {enabled: true, servicePostalCodes: ['55401'], supportedProjectTypes: ['interior'], consentText: 'Synthetic consent for a later contact step.', revision: 1};
const publicQueries = [], saves = [], errors = [];
const backend = createServer(async (req, res) => {
  let body = ''; for await (const chunk of req) body += chunk;
  const call = JSON.parse(body); publicQueries.push(call);
  assert.equal(req.url, '/api/query'); assert.equal(call.path, 'intakeConfig:publicPolicy');
  const value = call.args[0].workspaceId === 'company-a' ? {state: 'ready', intake: {...settings, companyName: 'Synthetic Painting Company'}} : {state: 'unavailable'};
  res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({status: 'success', value}));
});
await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
let browser, admin, adminState, company, companyState;
const adminBase = `http://127.0.0.1:${await unusedPort()}`, companyBase = `http://127.0.0.1:${await unusedPort()}`;
const adminLog = createWriteStream(join(out, 'admin.log')), companyLog = createWriteStream(join(out, 'company.log'));
try {
  admin = spawnNext('start', adminBase, out, ['ignore', 'pipe', 'pipe']); adminState = observe(admin);
  admin.stdout.pipe(adminLog); admin.stderr.pipe(adminLog);
  const companyUrl = new URL(companyBase);
  company = spawn(process.execPath, [new URL('../node_modules/next/dist/bin/next', import.meta.url).pathname, 'start', '--hostname', '127.0.0.1', '--port', companyUrl.port], {cwd: new URL('../apps/company-site/', import.meta.url), env: {PATH: process.env.PATH, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_CONVEX_URL: `http://127.0.0.1:${backend.address().port}`}, stdio: ['ignore', 'pipe', 'pipe']});
  // Next binary lives at repo root; use an absolute path in the child app cwd.
  companyState = observe(company); company.stdout.pipe(companyLog); company.stderr.pipe(companyLog);
  await waitForReady(adminBase, adminState);
  let publicReady = false;
  for (let i = 0; i < 50; i++) {
    if (companyState.ended) throw new Error('PUBLIC_APP_EXITED');
    try { if ((await fetch(companyBase)).status === 200) {publicReady = true; break;} } catch {}
    await pause(100);
  }
  assert.ok(publicReady, 'public app readiness');
  browser = await chromium.launch(await browserLaunchOptions());
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}}), page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  // Explicit synthetic cloud UI fixture: no production auth bypass or live Convex calls.
  await page.route('**/api/snapshot', async route => {
    const response = await route.fetch(); const snapshot = await response.json();
    if (snapshot.actor) snapshot.runtime.kind = 'convex';
    await route.fulfill({response, json: snapshot});
  });
  let revision = 1, firstSave = true;
  await page.route('**/api/intake**', async route => {
    if (route.request().method() === 'GET') return route.fulfill({json: {settings: {...settings, revision}}});
    const input = route.request().postDataJSON(); saves.push(input);
    if (firstSave) {firstSave = false; return route.fulfill({status: 503, json: {error: 'UNAVAILABLE'}});}
    if (input.expectedRevision !== revision) return route.fulfill({status: 409, json: {error: 'REVISION_CONFLICT'}});
    revision++; await route.fulfill({json: {revision, enabled: input.settings.enabled, replayed: false}});
  });
  await page.goto(adminBase); await page.getByRole('button', {name: 'Explore demo workspace'}).click(); await page.locator('.app-shell').waitFor();
  await page.goto(adminBase + '/settings/intake'); await page.getByLabel('Service ZIP codes').waitFor();
  await page.getByLabel('Service ZIP codes').fill('55401, 55402');
  await page.getByRole('button', {name: 'Save intake settings'}).click(); await page.getByRole('alert').filter({hasText: 'not been confirmed'}).waitFor();
  await page.getByRole('button', {name: 'Save intake settings'}).click(); await page.getByText('Project guidance is now available').waitFor();
  assert.equal(saves[0].requestKey, saves[1].requestKey, 'uncertain outcome retries same key');
  await page.screenshot({path: join(out, 'settings-desktop.png'), fullPage: true});
  revision++; await page.getByLabel('Service ZIP codes').fill('55403'); await page.getByRole('button', {name: 'Save intake settings'}).click();
  await page.getByRole('alert').filter({hasText: 'settings changed'}).waitFor(); assert.equal(await page.getByLabel('Service ZIP codes').inputValue(), '55403');
  await page.getByRole('button', {name: 'Reload saved settings'}).click(); await page.getByText(`Saved version ${revision}`).waitFor();
  await page.setViewportSize({width: 390, height: 844}); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390); await page.screenshot({path: join(out, 'settings-mobile.png'), fullPage: true, animations: 'disabled'});
  const visitor = await browser.newPage({viewport: {width: 1440, height: 1000}}); visitor.on('pageerror', e => errors.push(e.message));
  await visitor.goto(companyBase + '/estimate-request/company-a'); await visitor.getByText('Question 1 of 4').waitFor(); await visitor.screenshot({path: join(out, 'questionnaire-desktop.png'), fullPage: true});
  await visitor.getByLabel('Interior painting', {exact: true}).check(); await visitor.getByRole('button', {name: 'Continue'}).click();
  await visitor.getByLabel('Project ZIP code').fill('55401'); await visitor.getByRole('button', {name: 'Continue'}).click();
  await visitor.getByLabel('Project description').fill('Two bedrooms'); await visitor.getByRole('button', {name: 'Continue'}).click();
  await visitor.getByLabel('Preferred timeframe').selectOption('flexible'); await visitor.getByRole('button', {name: 'See project guidance'}).click();
  await visitor.getByRole('heading', {name: 'Your project matches the work this company serves.'}).waitFor();
  assert.equal(await visitor.locator('input[type=email],input[type=tel]').count(), 0);
  await visitor.setViewportSize({width: 390, height: 844}); assert.equal(await visitor.evaluate(() => document.documentElement.scrollWidth), 390); await visitor.screenshot({path: join(out, 'questionnaire-mobile.png'), fullPage: true});
  await visitor.goto(companyBase + '/estimate-request/company-b'); await visitor.getByRole('heading', {name: 'Project guidance is unavailable.'}).waitFor(); assert.equal(await visitor.locator('form').count(), 0);
  assert.deepEqual(errors, []); assert.ok(publicQueries.every(call => call.path === 'intakeConfig:publicPolicy'));
  await context.close(); await visitor.close();
  await writeJson(join(out, 'receipt.json'), {...gitState(), status: 'passed', sandbox: true, browser: browser.version(), runtime: 'local fixtures only', settingsNetworkMocks: true, publicBackendFixture: true, liveAuth: false, scope: ['settings save retry', 'revision conflict preserves edits', 'explicit reload', 'public questionnaire', 'disabled policy closed', 'desktop/mobile overflow'], errors});
  console.log(`Intake experience browser passed. Artifacts: ${out}`);
} catch (error) { await writeJson(join(out, 'receipt.json'), {...gitState(), status: 'failed', error: error.message}); throw error; }
finally {
  await browser?.close();
  if (admin) await stop(admin, adminState); if (company) await stop(company, companyState);
  await new Promise(resolve => backend.close(resolve));
  adminLog.end(); companyLog.end();
}
