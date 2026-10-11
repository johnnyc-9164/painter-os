import assert from 'node:assert/strict';
import { join } from 'node:path';
import { createWriteStream } from 'node:fs';
import { chromium } from '@playwright/test';
import { browserLaunchOptions } from '../scripts/agent-browser-options.mjs';
import { createRun, unusedPort, spawnNext, observe, stop, waitForReady, gitState, writeJson, assertNoEnvFiles } from '../scripts/agent-common.mjs';
// Bounded built-fixture proof of the contact-intake settings and public-form preview.
// The production build is started on loopback; the cloud snapshot and the two settings routes are explicit synthetic fixtures
// (no live auth, Convex, provider or email). Server authority is modelled by a fake that owns revision, receipts and role.
await assertNoEnvFiles();
const out = await createRun('contact-intake-settings-browser');
const disclosure = 'Unprocessed requests are deleted after 30 days. Editing, contacting or closing a request does not extend this period. If the company converts your request into a customer record, it manages the retention of that customer record separately.';
const guidance = {state: 'ready', intake: {companyName: 'Synthetic Painting Company', enabled: true, servicePostalCodes: ['55401'], supportedProjectTypes: ['interior'], consentText: 'Guidance consent', revision: 4}};
const server = {contact: null, receipts: new Map(), writes: 0, posts: [], mode: 'normal', denyReads: false, guidanceOn: true};
const errors = [];
const policyRow = c => c && {...c, retentionDays: 30, retentionDisclosure: disclosure};
async function install(page, role) {
  await page.route('**/api/snapshot', async route => {
    const response = await route.fetch(); const snapshot = await response.json();
    if (snapshot.actor) { snapshot.runtime.kind = 'convex'; snapshot.actor.role = role; }
    await route.fulfill({response, json: snapshot});
  });
  await page.route('**/api/intake**', route => route.fulfill({json: {settings: server.guidanceOn ? {enabled: true, servicePostalCodes: ['55401'], supportedProjectTypes: ['interior'], consentText: 'Guidance consent', revision: 4} : null}}));
  await page.route('**/api/contact-intake/preview**', async route => {
    if (server.denyReads) return route.fulfill({status: 403, json: {error: 'FORBIDDEN'}});
    const c = server.contact;
    const on = c?.enabled && server.guidanceOn;
    await route.fulfill({json: {guidance: server.guidanceOn ? guidance : {state: 'unavailable'}, contact: on ? {state: 'ready', policy: {companyName: guidance.intake.companyName, contactPolicyRevision: c.revision, guidanceRevision: 4, consentText: c.consentText, retentionDays: 30, retentionDisclosure: disclosure}} : {state: 'unavailable'}}});
  });
  await page.route(/\/api\/contact-intake(\?|$)/, async route => {
    if (route.request().method() === 'GET') return server.denyReads ? route.fulfill({status: 403, json: {error: 'FORBIDDEN'}}) : route.fulfill({json: {settings: policyRow(server.contact)}});
    const input = route.request().postDataJSON(); server.posts.push(input);
    const receipt = server.receipts.get(input.requestKey);
    const answer = receipt ? {...receipt, replayed: true} : (() => {
      if (input.expectedRevision !== (server.contact?.revision ?? 0)) return null;
      server.contact = {...input.settings, revision: input.expectedRevision + 1}; server.writes++;
      const result = {revision: server.contact.revision, enabled: input.settings.enabled, replayed: false};
      server.receipts.set(input.requestKey, result); return result;
    })();
    if (!answer) return route.fulfill({status: 409, json: {error: 'REVISION_CONFLICT'}});
    // Unknown outcome: the write committed but the response is lost.
    if (server.mode === 'lose-response') { server.mode = 'normal'; return route.abort('connectionreset'); }
    await route.fulfill({json: answer});
  });
}
const overflow = page => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
let browser, admin, adminState;
const adminBase = `http://127.0.0.1:${await unusedPort()}`;
const adminLog = createWriteStream(join(out, 'admin.log'));
try {
  admin = spawnNext('start', adminBase, out, ['ignore', 'pipe', 'pipe']); adminState = observe(admin);
  admin.stdout.pipe(adminLog); admin.stderr.pipe(adminLog);
  await waitForReady(adminBase, adminState);
  browser = await chromium.launch(await browserLaunchOptions());
  async function open(role, viewport) {
    const context = await browser.newContext({viewport}), page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message)); await install(page, role);
    await page.goto(adminBase); await page.getByRole('button', {name: 'Explore demo workspace'}).click(); await page.locator('.app-shell').waitFor();
    await page.goto(adminBase + '/settings/intake'); return {context, page};
  }
  const { context, page } = await open('owner', {width: 1440, height: 1000});
  const region = page.getByRole('region', {name: 'Contact requests'});
  await region.waitFor(); await page.getByRole('heading', {name: 'Public form preview'}).waitFor();
  // Absent policy: disabled, nothing written on mount, truthful contact-off preview.
  await page.getByText('No policy saved yet: contact collection is off.').waitFor();
  await page.locator('[data-preview-state="contact_off"]').waitFor();
  assert.equal(server.posts.length, 0, 'no mount-time write');
  assert.equal(await page.getByLabel('Collect contact requests on the company site').isChecked(), false);
  await page.screenshot({path: join(out, 'desktop-absent.png'), fullPage: true});
  // Enable; the first response is lost (unknown outcome) and the replay reuses the identical key.
  await page.getByLabel('Collect contact requests on the company site').check();
  await page.getByLabel('Company consent wording').fill('Synthetic consent: we may contact you about this request.');
  await page.getByLabel('I acknowledge this 30-day retention disclosure').check();
  server.mode = 'lose-response';
  await page.getByRole('button', {name: 'Save and enable contact collection'}).click();
  await page.getByRole('alert').filter({hasText: 'could not be confirmed'}).waitFor();
  await page.getByRole('button', {name: 'Save and enable contact collection'}).click();
  await page.getByText('Contact collection is enabled.').waitFor();
  assert.equal(server.posts.length, 2); assert.equal(server.posts[0].requestKey, server.posts[1].requestKey, 'replay is the exact same command');
  assert.equal(server.writes, 1, 'replay did not write twice');
  await page.locator('[data-preview-state="public"]').waitFor();
  await region.getByText('Synthetic consent: we may contact you about this request.').nth(1).waitFor();
  await page.screenshot({path: join(out, 'desktop-enabled.png'), fullPage: true});
  // Revision conflict preserves edits until an explicit reload.
  server.contact = {...server.contact, consentText: 'Changed elsewhere', revision: server.contact.revision + 1};
  await page.getByLabel('Company consent wording').fill('My local edit');
  await page.getByRole('button', {name: 'Save and enable contact collection'}).click();
  await page.getByRole('alert').filter({hasText: 'changed elsewhere'}).waitFor();
  assert.equal(await page.getByLabel('Company consent wording').inputValue(), 'My local edit');
  await region.getByRole('button', {name: 'Reload saved settings'}).click();
  await page.getByText(`Saved version ${server.contact.revision}`).waitFor();
  assert.equal(await page.getByLabel('Company consent wording').inputValue(), 'Changed elsewhere');
  // Disable is an explicit save and closes the public contact policy.
  await page.getByLabel('Collect contact requests on the company site').uncheck();
  await page.getByRole('button', {name: 'Save contact settings (off)'}).click();
  await page.getByText('Contact collection is turned off. Existing requests and receipts are unchanged.').waitFor();
  await page.locator('[data-preview-state="contact_off"]').waitFor();
  // Guidance off makes the whole public form unavailable even with contact saved; preview says so.
  server.contact = {...server.contact, enabled: true}; server.guidanceOn = false;
  await page.getByRole('button', {name: 'Refresh preview'}).click();
  await page.locator('[data-preview-state="guidance_off"]').waitFor();
  assert.equal(await page.getByText('Project guidance is unavailable.').count() > 0, true);
  server.guidanceOn = true; server.contact = {...server.contact, enabled: false};
  assert.ok(await overflow(page) <= 0, 'desktop has no horizontal overflow');
  // Same flows' layout at 390px.
  await page.setViewportSize({width: 390, height: 844});
  await region.getByRole('button', {name: 'Reload saved settings'}).click(); await page.getByRole('heading', {name: 'Public form preview'}).waitFor();
  assert.ok(await overflow(page) <= 0, 'mobile has no horizontal overflow');
  for (const name of ['Reload saved settings', 'Refresh preview']) { const box = await region.getByRole('button', {name}).boundingBox(); assert.ok(box && box.height >= 36, `${name} tap target`); }
  await page.screenshot({path: join(out, 'mobile-settings.png'), fullPage: true});
  await context.close();
  // Denied: a non-owner role never sees the controls; a server 403 keeps the form unloaded and unsavable.
  const crew = await open('crew', {width: 390, height: 844});
  await crew.page.getByText('Only company owners and office administrators can manage project guidance.').waitFor();
  assert.equal(await crew.page.getByRole('region', {name: 'Contact requests'}).count(), 0);
  assert.ok(await overflow(crew.page) <= 0); await crew.page.screenshot({path: join(out, 'mobile-denied-role.png')}); await crew.context.close();
  server.denyReads = true; const posts = server.posts.length;
  const denied = await open('owner', {width: 1440, height: 1000});
  await denied.page.getByRole('alert').filter({hasText: 'does not allow managing contact collection'}).waitFor();
  assert.equal(await denied.page.getByRole('button', {name: /^Save/}).filter({hasText: 'contact'}).isDisabled(), true);
  assert.equal(await denied.page.getByRole('heading', {name: 'Public form preview'}).count(), 0, 'no preview without authorization');
  assert.equal(server.posts.length, posts); await denied.context.close();
  assert.deepEqual(errors, []);
  await writeJson(join(out, 'receipt.json'), {...gitState(), status: 'passed', sandbox: true, browser: browser.version(), runtime: 'built web app on loopback; synthetic settings/preview fixtures', liveAuth: false, scope: ['absent policy, no mount write', 'enable with lost response and identical-key replay', 'revision conflict keeps edits, explicit reload', 'disable', 'preview states: public, contact off, guidance off', 'denied role and server 403', '390px and 1440px overflow'], errors});
  console.log(`Contact intake settings browser passed. Artifacts: ${out}`);
} catch (error) { await writeJson(join(out, 'receipt.json'), {...gitState(), status: 'failed', error: error.message}); throw error; }
finally {
  await browser?.close();
  if (admin) await stop(admin, adminState);
  adminLog.end();
}
