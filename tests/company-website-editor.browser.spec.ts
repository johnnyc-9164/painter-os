import {test, expect, type Page} from '@playwright/test';
import {createWriteStream} from 'node:fs';
import {join} from 'node:path';
import {emptyCompanyWebsiteContent, type CompanyWebsiteState} from '@painter-os-bts/domain/company-website';
// Existing lifecycle owns loopback server, secret-free environment and private receipt directories.
import {assertNoEnvFiles, createRun, unusedPort, spawnNext, observe, stop, waitForReady, gitState, writeJson} from '../scripts/agent-common.mjs';
const outcomes: {title: string; status: string}[] = [];
const captures: string[] = [];
let browserVersion = '';
let server: ReturnType<typeof spawnNext>, processState: ReturnType<typeof observe>, log: ReturnType<typeof createWriteStream>, directory: string, base: string;
test.beforeAll(async () => {
  await assertNoEnvFiles(); directory = await createRun('website-editor-browser');
  base = `http://127.0.0.1:${await unusedPort()}`;
  log = createWriteStream(join(directory, 'server.log'), {mode: 0o600});
  server = spawnNext('start', base, directory, ['ignore', 'pipe', 'pipe']); processState = observe(server);
  server.stdout!.pipe(log, {end: false}); server.stderr!.pipe(log, {end: false}); await waitForReady(base, processState);
});
test.afterEach(async ({}, info) => {outcomes.push({title: info.title, status: info.status ?? 'unknown'});});
test.afterAll(async () => {if (directory) await writeJson(join(directory, 'receipt.json'), {...gitState(), status: outcomes.every(item => item.status === 'passed') ? 'passed' : 'failed', sandbox: true, browser: browserVersion, outcomes, scope: 'actual production-built editor with intercepted synthetic authenticated API; no live BetterAuth, storage or provider proof', captures}); try {if (server) await stop(server, processState);} finally {if (log) await new Promise<void>(resolve => log.end(resolve));}});
function fixture() {
  const content = emptyCompanyWebsiteContent('Fixture Painting Co.'); content.hero.heading = 'Your home, thoughtfully painted.'; content.hero.summary = 'Synthetic editor fixture. No provider or real company account.';
  return {revision: 1, draft: content, published: null} satisfies CompanyWebsiteState;
}
async function harness(page: Page, initialStatus = 0) {
  const control = {initialStatus, state: fixture(), actorId: 'fixture-owner', workspaceId: 'fixture-company', conflict: false, failUpload: false, holdWrite: false, releaseWrite: undefined as (() => void) | undefined, uploadRequests: [] as string[], writes: [] as {action: string; expectedRevision: number}[]};
  const media = {mediaId: 'fixture-media', name: 'fixture-project.png', contentType: 'image/png', width: 10, height: 10, size: 4, createdAt: '2026-10-09T00:00:00Z'};
  const envelope = () => ({state: control.state, preview: {revision: control.state.revision, content: control.state.draft, media: []}, mediaPage: {media: [media], cursor: null, done: true}, blogPage: {page: [], isDone: true, continueCursor: null}});
  await page.route('**/api/snapshot', route => route.fulfill({json: {actor: {id: control.actorId, tenantId: control.workspaceId, name: 'Fixture Owner', email: 'fixture@example.invalid', role: 'owner'}, workspace: {id: control.workspaceId, name: control.state.draft.companyName}, entities: [], events: [], runtime: {kind: 'convex', demo: false, storage: 'Synthetic authenticated API fixture', integrations: 'not connected'}}}));
  await page.route('**/api/website**', async route => {
    const request = route.request(), url = new URL(request.url());
    if (control.initialStatus) return route.fulfill({status: control.initialStatus, json: {error: control.initialStatus === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN'}});
    const actor = request.headers().cookie?.match(/fixture-session=([^;]+)/)?.[1] ?? control.actorId;
    if (request.headers()['x-painter-website-actor'] !== actor) return route.fulfill({status: 401, json: {error: 'UNAUTHENTICATED'}});
    if (url.pathname.endsWith('/media')) {
      if (request.method() === 'POST') {
        const body = request.postData() || '';
        control.uploadRequests.push(body.match(/name="requestKey"\r\n\r\n([^\r]+)/)?.[1] || 'missing-key');
        if (control.failUpload) return route.abort('failed');
        return route.fulfill({json: {state: 'ready', media}});
      }
      return route.fulfill({json: null});
    }
    if (request.method() === 'POST') {
      const input = request.postDataJSON(); control.writes.push({action: input.action, expectedRevision: input.expectedRevision});
      if (control.conflict || input.expectedRevision !== control.state.revision) return route.fulfill({status: 409, json: {error: 'REVISION_CONFLICT'}});
      control.state.revision++;
      if (input.action === 'saveDraft') control.state.draft = input.content;
      if (input.action === 'publish') control.state.published = {revision: control.state.revision, publishedAt: '2026-10-09T00:00:00Z'};
      if (input.action === 'unpublish') control.state.published = null;
      if (control.holdWrite) await new Promise<void>(resolve => {control.releaseWrite = resolve;});
    }
    return route.fulfill({json: envelope()});
  });
  await page.goto(`${base}/content/website`); if (initialStatus) await page.locator('.website-editor [role=alert]').waitFor(); else await page.getByLabel('Company name', {exact: true}).waitFor();
  return control;
}
test('initial sign-in and permission denial exit loading and allow explicit recovery', async ({context}) => {
  for (const status of [401, 403]) {
    const page = await context.newPage(); const control = await harness(page, status);
    await expect(page.locator('.website-editor')).not.toContainText('Loading your website draft');
    await expect(page.locator('.website-editor [role=alert]')).toContainText(status === 401 ? 'Sign in again' : 'workspace role');
    await expect(page.getByRole('button', {name: 'Reload saved website', exact: true})).toBeVisible();
    control.initialStatus = 0; await page.getByRole('button', {name: 'Reload saved website', exact: true}).click();
    await expect(page.getByLabel('Company name', {exact: true})).toHaveValue('Fixture Painting Co.');
    await page.close();
  }
});
test('actual editor preserves conflicts, publishes only confirmed draft, and resets account/workspace state', async ({page}) => {
  const control = await harness(page);
  await page.getByLabel('Headline', {exact: true}).fill('My unsaved headline');
  await expect(page.getByRole('button', {name: 'Publish saved draft'})).toBeDisabled();
  await page.getByRole('button', {name: 'Preview website'}).click();
  await expect(page.getByRole('heading', {name: 'Unsaved preview', exact: true})).toBeVisible();
  await expect(page.locator('.company-website h1')).toHaveText('My unsaved headline');
  control.conflict = true; await page.getByRole('button', {name: 'Save draft', exact: true}).click();
  await expect(page.locator('.website-editor [role=alert]')).toContainText('website changed');
  await expect(page.getByLabel('Headline', {exact: true})).toHaveValue('My unsaved headline');
  control.conflict = false; await page.getByRole('button', {name: 'Save draft', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Publish saved draft'})).toBeEnabled();
  await page.getByRole('button', {name: 'Publish saved draft'}).click(); await page.getByRole('button', {name: 'Confirm publish', exact: true}).click();
  await expect(page.getByText('Published version 3', {exact: true})).toBeVisible();
  expect(control.writes.at(-1)).toEqual({action: 'publish', expectedRevision: 2});
  await page.getByLabel('Headline', {exact: true}).fill('Private edits to discard on account change');
  control.actorId = 'fixture-other-owner'; await page.getByRole('button', {name: 'Refresh workspace'}).click();
  await expect(page.getByLabel('Headline', {exact: true})).toHaveValue('My unsaved headline');
  await expect(page.getByRole('heading', {name: 'Unsaved preview', exact: true})).toHaveCount(0);
  control.workspaceId = 'fixture-second-company'; control.state = fixture(); control.state.draft.companyName = 'Second Fixture Company';
  await page.getByRole('button', {name: 'Refresh workspace'}).click();
  await expect(page.getByLabel('Company name', {exact: true})).toHaveValue('Second Fixture Company');
  await expect(page.getByLabel('Headline', {exact: true})).toHaveValue('Your home, thoughtfully painted.');
});
test('cookie account switch denies stale draft and clears private authoring state', async ({page}) => {
  const control = await harness(page);
  await page.getByLabel('Headline', {exact: true}).fill('Private actor A draft');
  await page.getByRole('button', {name: 'Preview website'}).click();
  await page.context().addCookies([{name: 'fixture-session', value: 'fixture-actor-b', domain: '127.0.0.1', path: '/'}]);
  await page.getByRole('button', {name: 'Save draft', exact: true}).click();
  await expect(page.getByLabel('Headline', {exact: true})).toHaveCount(0);
  await expect(page.locator('.website-editor')).toContainText('Sign in again');
  await expect(page.locator('.company-website')).toHaveCount(0); expect(control.writes).toHaveLength(0);
});
test('late successful reply cannot restore private draft after focus detects an account switch', async ({page}) => {
  const control = await harness(page); control.holdWrite = true;
  await page.getByLabel('Headline', {exact: true}).fill('Private actor A pending draft');
  await page.getByRole('button', {name: 'Save draft', exact: true}).click();
  await expect.poll(() => control.writes.length).toBe(1);
  await page.context().addCookies([{name: 'fixture-session', value: 'fixture-actor-b', domain: '127.0.0.1', path: '/'}]);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('.website-editor')).toContainText('Sign in again');
  const response = page.waitForResponse(value => value.url().endsWith('/api/website') && value.request().method() === 'POST');
  control.releaseWrite!(); await response;
  await expect(page.getByLabel('Headline', {exact: true})).toHaveCount(0);
  await expect(page.locator('.website-editor')).not.toContainText('Private actor A pending draft');
});
test('unknown image outcome requires status and preserves the same upload nonce', async ({page}) => {
  const control = await harness(page); await page.getByRole('button', {name: 'Projects', exact: true}).click();
  await page.getByLabel('Upload website image', {exact: true}).setInputFiles({name: 'fixture-project.png', mimeType: 'image/png', buffer: Buffer.from([1, 2, 3, 4])});
  control.failUpload = true; await page.getByRole('button', {name: 'Upload selected image'}).click();
  await expect(page.getByRole('button', {name: 'Check upload status'})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Retry same upload'})).toHaveCount(0);
  expect(control.uploadRequests).toHaveLength(1);
  await page.getByRole('button', {name: 'Check upload status'}).click(); await expect(page.getByRole('button', {name: 'Retry same upload'})).toBeVisible();
  await page.getByRole('button', {name: 'Retry same upload'}).click();
  await expect(page.getByRole('button', {name: 'Retry same upload'})).toHaveCount(0);
  expect(control.uploadRequests).toHaveLength(2);
  await page.getByRole('button', {name: 'Check upload status'}).click();
  control.failUpload = false; await page.getByRole('button', {name: 'Retry same upload'}).click();
  await expect(page.getByRole('button', {name: 'Check upload status'})).toHaveCount(0);
  expect(control.uploadRequests).toHaveLength(3); expect(control.uploadRequests[0]).not.toBe('missing-key');
  expect(new Set(control.uploadRequests).size).toBe(1);
});
test('real form controls and shared preview render on desktop/mobile without overflow', async ({page, browser}) => {
  await harness(page); await page.getByLabel('Headline', {exact: true}).fill('Fixture craftsmanship');
  await page.getByRole('button', {name: 'Services', exact: true}).click(); await page.getByRole('button', {name: 'Add service', exact: true}).click();
  await page.getByLabel('Service 1 name').fill('Interior painting'); await page.getByLabel('Service 1 description').fill('A synthetic owner-authored service.');
  await page.getByRole('button', {name: 'Reviews', exact: true}).click(); await page.getByRole('button', {name: 'Add review', exact: true}).click();
  await page.getByLabel('Review 1 quote').fill('Synthetic review fixture.'); await page.getByLabel('Review 1 attribution').fill('Synthetic reviewer');
  await page.getByRole('button', {name: 'Pricing', exact: true}).click(); await page.getByRole('button', {name: 'Add price', exact: true}).click();
  await page.getByLabel('Price 1 title').fill('Synthetic pricing'); await page.getByLabel('Price 1 format').selectOption('from'); await page.getByLabel('Price 1 amount').fill('250.50');
  await page.getByRole('button', {name: 'Contact', exact: true}).click(); await page.getByLabel('Public phone number').fill('+1 (555) 010-0000'); await page.getByLabel('Address lines').fill('Synthetic public address');
  await page.getByRole('button', {name: 'Template', exact: true}).click(); await page.getByRole('radio', {name: 'Editorial', exact: true}).check();
  await page.getByRole('button', {name: 'Preview website'}).click(); await expect(page.locator('.company-website')).toHaveAttribute('data-template', 'editorial');
  await expect(page.locator('.company-website').getByRole('link', {name: 'Explore your painting project'})).toHaveCount(0);
  await expect(page.locator('.company-website')).toContainText('250.50'); await expect(page.locator('.company-website')).toContainText('Synthetic review fixture.');
  await page.screenshot({path: join(directory, 'desktop.png'), fullPage: true}); captures.push('desktop.png');
  await page.setViewportSize({width: 390, height: 844}); await expect.poll(() => page.locator('.sidebar').evaluate(element => element.getBoundingClientRect().right)).toBeLessThanOrEqual(0); await page.screenshot({path: join(directory, 'mobile.png'), fullPage: true}); captures.push('mobile.png');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  browserVersion = browser.version();
});
