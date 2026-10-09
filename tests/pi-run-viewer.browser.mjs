import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {join} from 'node:path';
import {writeFile} from 'node:fs/promises';
import {browserLaunchOptions} from '../scripts/agent-browser-options.mjs';
const base=process.env.PI_VIEW_TEST_URL,artifacts=process.env.PI_VIEW_ARTIFACTS;
if(!base||new URL(base).hostname!=='127.0.0.1'||!artifacts)throw new Error('OWNED_LOOPBACK_FIXTURE_REQUIRED');
const launch=await browserLaunchOptions();const browser=await chromium.launch(launch);
const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});const page=await context.newPage();const faults=[];page.on('pageerror',error=>faults.push(error.message));
const alerts=()=>page.getByRole('region',{name:'Agent run view'}).getByRole('alert');
const refresh=()=>page.getByRole('button',{name:'Refresh view',exact:true});
async function settled(){await refresh().waitFor();await page.waitForFunction(()=>{const button=[...document.querySelectorAll('button')].find(button=>button.textContent==='Refresh view');const main=document.querySelector('main');return button&&!button.disabled&&main?.getAttribute('data-selected-context')===main?.getAttribute('data-settled-context');});}
async function persisted(){return page.locator('[data-message-id]').evaluateAll(rows=>rows.map(row=>({id:row.getAttribute('data-message-id'),text:row.textContent})));}
try{
 await page.goto(base);await settled();assert.match(await page.title(),/Local run viewer/);assert.ok((await persisted()).some(row=>row.text.includes('fixture completed')));
 const direct=await persisted();await page.getByRole('button',{name:'AG-UI',exact:true}).click();await settled();assert.deepEqual(await persisted(),direct,'both decoders render identical actual persisted messages');
 const hoverBackground=await page.getByRole('button',{name:'AG-UI',exact:true}).evaluate(button=>getComputedStyle(button).backgroundColor);
 await page.mouse.move(0,0);await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(button=>button.textContent==='AG-UI'&&getComputedStyle(button).backgroundColor==='rgb(0, 82, 255)'));
 const style=await page.getByRole('button',{name:'AG-UI',exact:true}).evaluate(button=>({background:getComputedStyle(button).backgroundColor,color:getComputedStyle(button).color,minHeight:getComputedStyle(button).minHeight}));assert.equal(style.background,'rgb(0, 82, 255)');assert.equal(style.color,'rgb(255, 255, 255)');
 await page.getByRole('button',{name:'Running response',exact:true}).click();await settled();assert.match(await page.locator('[data-provisional]').innerText(),/local partial response/);
 await page.getByRole('button',{name:'Interrupted effect',exact:true}).click();await settled();assert.match(await page.locator('[data-ledger-note]').innerText(),/no confirmed effect receipt/);assert.equal(await page.getByRole('button',{name:/approve|resume|send|stop run/i}).count(),0);
 await page.getByRole('button',{name:'Empty view',exact:true}).click();await settled();assert.ok(await page.getByText('No messages in this view.',{exact:true}).isVisible());
 await page.getByRole('button',{name:'Failed request',exact:true}).click();await settled();assert.match(await alerts().innerText(),/unavailable/);
 await page.getByRole('button',{name:'Connection gap',exact:true}).click();await settled();assert.match(await alerts().innerText(),/missed an update/);await refresh().click();await settled();assert.equal(await alerts().count(),0);assert.ok((await persisted()).some(row=>row.text.includes('fixture completed')));
 await page.getByRole('button',{name:'Slow snapshot',exact:true}).click();assert.ok(await page.getByRole('status').filter({hasText:'Loading run view'}).isVisible());await page.getByRole('button',{name:'Empty view',exact:true}).click();await settled();await page.waitForTimeout(900);assert.ok(await page.getByText('No messages in this view.',{exact:true}).isVisible(),'old slow request cannot replace newly selected view');
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Completed run',exact:true}).click();await settled();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.keyboard.press('Tab');await refresh().focus();assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'Refresh view');const outline=await refresh().evaluate(button=>getComputedStyle(button).outlineStyle);assert.notEqual(outline,'none');
 if(process.env.PI_VIEW_CAPTURE==='yes'){await page.screenshot({path:join(artifacts,'viewer-mobile-390.png'),fullPage:true});await page.setViewportSize({width:1280,height:900});await page.screenshot({path:join(artifacts,'viewer-desktop-1280.png'),fullPage:true});}
 assert.deepEqual(faults,[]);await writeFile(join(artifacts,'browser.json'),JSON.stringify({sandbox:true,executable:launch.executablePath??'playwright-installed',desktop:1280,mobile:390,style,hoverBackground,directMessages:direct.length,checks:['encoding-parity','provisional','interrupted-ledger','empty','failed','gap-reset','stale-abort','keyboard','responsive','actual-shadcn-tokens']},null,2),{mode:0o600});console.log('Local Pi viewer sandboxed browser checks passed');
}finally{await context.close();await browser.close();}
