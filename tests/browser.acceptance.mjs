import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { browserLaunchOptions } from '../scripts/agent-browser-options.mjs';
import { assertNoEnvFiles, createRun, unusedPort, spawnNext, observe, stop, waitForReady, safeRoute, gitState, writeJson } from '../scripts/agent-common.mjs';

// Lifecycle mutations always target a fresh owned local server, never an operator URL.
if (process.env.PAINTER_TEST_URL !== undefined) throw new Error('OWNED_BROWSER_SERVER_REQUIRED: unset PAINTER_TEST_URL');
await assertNoEnvFiles();
const out = await createRun('browser-acceptance');
const base = `http://127.0.0.1:${await unusedPort()}`;
const log = createWriteStream(join(out, 'server.log'), { mode: 0o600 });
const errors = [], failed = [];
let browser, browserDetails, server, state;
let interrupted = false;
const interrupt = () => { interrupted = true; server?.kill('SIGTERM'); };
process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
try {
 const options = await browserLaunchOptions();
 browserDetails = { executablePath: options.executablePath ?? chromium.executablePath() };
 browser = await chromium.launch(options);
 browserDetails.version = browser.version();
 server = spawnNext('start', base, out, ['ignore', 'pipe', 'pipe']); state = observe(server);
 server.stdout.pipe(log, { end: false }); server.stderr.pipe(log, { end: false });
 await waitForReady(base, state);
 if (interrupted) throw new Error('BROWSER_ACCEPTANCE_INTERRUPTED');
 const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, recordVideo: { dir: join(out, 'video') } });
 const page = await context.newPage();
 page.on('pageerror', error => errors.push(error.message));
 page.on('response', response => { if (response.status() >= 500) failed.push({ route: safeRoute(response.url()), status: response.status() }); });
 page.on('dialog', dialog => dialog.accept());

 await page.goto(base);await page.getByRole('button',{name:'Explore demo workspace'}).waitFor();await page.screenshot({path:out+'/01-auth.png',fullPage:true});await page.getByRole('button',{name:'Explore demo workspace'}).click();await page.locator('.app-shell').waitFor();await page.screenshot({path:out+'/02-overview.png',fullPage:true});
 await page.locator('aside nav').getByRole('link',{name:'Leads & pipeline'}).click();await page.getByRole('button',{name:'New lead',exact:true}).click();await page.getByLabel('Full name').fill('Browser test client');await page.getByLabel('Email',{exact:true}).fill('browser-client@example.invalid');await page.getByLabel('Property address').fill('20 Synthetic Avenue');await page.getByRole('button',{name:'Save changes',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.getByRole('textbox',{name:'Search Leads & pipeline'}).fill('Browser test client');assert.equal(await page.locator('.pipeline-card').count(),1);await page.screenshot({path:out+'/03-leads.png',fullPage:true});await page.locator('.pipeline-card h3').click();await page.getByRole('button',{name:'Qualify',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Qualify',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.ok(await page.locator('.detail-heading').textContent());
 await page.getByRole('button',{name:'Create estimate',exact:true}).click();await page.getByLabel('Estimate title').fill('Browser-tested interior repaint');await page.getByLabel('Unit price ($)').fill('2000');await page.getByRole('button',{name:'Save estimate',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.getByRole('heading',{name:'Browser-tested interior repaint',exact:true}).waitFor();await page.screenshot({path:out+'/04-estimate.png',fullPage:true});await page.getByRole('button',{name:'Send proposal',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Send proposal',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.getByRole('button',{name:'Customer portal link',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Customer portal link',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});const link=await page.locator('.share-notice a').getAttribute('href');assert.ok(link?.startsWith('/p/'));
 const customerContext=await browser.newContext({viewport:{width:1280,height:900}}),customer=await customerContext.newPage();customer.on('dialog',d=>d.accept());customer.on('pageerror',e=>errors.push(e.message));await customer.goto(base+link);await customer.getByRole('button',{name:'Approve proposal'}).waitFor();await customer.screenshot({path:out+'/05-customer-portal.png',fullPage:true});await customer.getByRole('button',{name:'Approve proposal'}).click();await customer.getByText('Your response was saved. Thank you.').waitFor();await customerContext.close();
 await page.reload();await page.getByRole('button',{name:'Create project',exact:true}).waitFor();await page.getByRole('button',{name:'Create project',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Save changes',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.locator('.detail-heading h1').waitFor();
 const routes=['/overview','/leads','/customers','/estimates','/jobs','/schedule','/field/today','/invoices','/reviews','/commercial/bids','/automation/knowledge','/automation/workflows','/settings/integrations','/settings/billing','/settings/team','/tasks','/files','/activity','/content'];
 for(const route of routes){await page.goto(base+route);await page.locator('.app-shell').waitFor();assert.equal(await page.locator('.error').count(),0,'route error '+route);}
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/overview');await page.locator('.app-shell').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390,'mobile horizontal overflow');await page.screenshot({path:out+'/06-mobile.png',fullPage:true});await page.getByRole('button',{name:'Open navigation'}).click();await page.locator('aside nav').getByRole('link',{name:'Field workspace'}).click();await page.getByRole('heading',{name:'Field workspace',exact:true}).waitFor();
 await context.close();
 if (interrupted) throw new Error('BROWSER_ACCEPTANCE_INTERRUPTED');
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);const report={status:'passed',routes:routes.length,realBrowserFlows:['demo login','lead creation','search','lead qualification','estimate creation','proposal send','portal issuance','anonymous customer approval','project creation','mobile navigation'],pageErrors:errors,serverFailures:failed,networkMocks:false,runtime:'local acceptance runtime on production Next build',mobileWidth:390};await writeJson(join(out, 'results.json'), report);
 await writeJson(join(out, 'receipt.json'), { ...gitState(), status: 'passed', sandbox: true, browser: browserDetails, scope: report.realBrowserFlows, runtime: 'local synthetic only', errors, failures: failed });
 console.log(`Browser acceptance passed. Artifacts: ${out}`);

} catch (error) {
 await writeJson(join(out, 'receipt.json'), { ...gitState(), status: 'failed', sandbox: true, browser: browserDetails, runtime: 'local synthetic only', error: error.message, errors, failures: failed });
 console.error(`Browser acceptance failed. Artifacts: ${out}`);
 throw error;
} finally {
 process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
 try { await browser?.close(); } finally {
  try { if (server) await stop(server, state); } finally { await new Promise(resolve => log.end(resolve)); }
 }
}
