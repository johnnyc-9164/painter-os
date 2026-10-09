import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { browserLaunchOptions } from '../scripts/agent-browser-options.mjs';

// Actual built Next app, local backend fixture; no production data or provider.
test('built company pages publish escaped content, navigate optional pages and fail closed', {timeout:60000}, async()=>{
const requests=[];
const backend=createServer(async(req,res)=>{
let body='';for await(const chunk of req)body+=chunk;
const {path,args:[args]}=JSON.parse(body);requests.push({path,args});res.setHeader('Content-Type','application/json');
if(path==='intakeConfig:publicPolicy')return res.end(JSON.stringify({status:'success',value:{state:'unavailable'}}));
if(args.workspaceId==='missing')return res.end(JSON.stringify({status:'error',errorMessage:'Missing workspace',errorData:'PUBLIC_WORKSPACE_NOT_FOUND'}));
const all=['company-profile','company-services','company-contact'].map((slug,i)=>({id:`page-${i}`,slug,title:i===0?'Fixture company <script>plain</script>':i===1?'Owner-authored services':'Owner-authored contact',content:i===0?'Fixture-only published company introduction.\n<script>alert("escaped")</script>':i===1?'Owner-authored service description. No invented service defaults.':'Fixture-only contact information supplied by author.',publishedAt:'2026-10-09T12:00:00Z',privateNotes:'DO_NOT_PUBLISH'}));
let rows=args.workspaceId==='profile-only'?all.slice(0,1):args.workspaceId==='draft-only'?[]:all;
if(args.workspaceId==='malformed')rows=[{...all[0],content:42}];
if(args.slug)rows=rows.filter(row=>row.slug===args.slug);
const value=path==='painter:articlesPage'?{page:rows.map(({content,...row})=>({...row,excerpt:content})),isDone:true,continueCursor:null}:rows;
assert.ok(['painter:articles','painter:articlesPage'].includes(path));res.end(JSON.stringify({status:'success',value}));
});backend.listen(0,'127.0.0.1');await once(backend,'listening');
const allocator=createServer();allocator.listen(0,'127.0.0.1');await once(allocator,'listening');const port=allocator.address().port;await new Promise(resolve=>allocator.close(resolve));
const app=spawn(process.execPath,[new URL('../node_modules/next/dist/bin/next',import.meta.url).pathname,'start','--hostname','127.0.0.1','--port',String(port)],{cwd:new URL('../apps/company-site/',import.meta.url),env:{PATH:process.env.PATH,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_CONVEX_URL:`http://127.0.0.1:${backend.address().port}`},stdio:['ignore','pipe','pipe']});
let logs='';app.stdout.on('data',chunk=>logs+=chunk);app.stderr.on('data',chunk=>logs+=chunk);const base=`http://127.0.0.1:${port}`;let browser;
try{
let ready=false;for(let attempt=0;attempt<100;attempt++){if(app.exitCode!==null)throw new Error(logs);try{if((await fetch(base)).status===200){ready=true;break;}}catch{}await delay(100);}assert.ok(ready,logs);
const response=await fetch(`${base}/company/fixture`);assert.equal(response.status,200);assert.equal(response.headers.get('x-frame-options'),'DENY');const html=await response.text();
assert.match(html,/&lt;script&gt;plain&lt;\/script&gt;/);assert.match(html,/&lt;script&gt;alert/);assert.doesNotMatch(html,/<script>alert|DO_NOT_PUBLISH/);
for(const route of ['/company/fixture/services','/company/fixture/contact','/site/fixture','/estimate-request/fixture'])assert.match(html,new RegExp(`href="${route}"`));
for(const section of ['services','contact']){const page=await fetch(`${base}/company/fixture/${section}`);assert.equal(page.status,200);assert.match(await page.text(),new RegExp(`Owner-authored ${section}`));}
const only=await fetch(`${base}/company/profile-only`);assert.equal(only.status,200);const onlyHtml=await only.text();assert.doesNotMatch(onlyHtml,/href="\/company\/profile-only\/(services|contact)"/);
for(const route of ['/company/draft-only','/company/missing','/company/profile-only/services','/company/fixture/unknown','/company/fixture/services/extra'])assert.equal((await fetch(base+route)).status,404,route);
assert.equal((await fetch(`${base}/company/malformed`)).status,500);
assert.equal((await fetch(`${base}/site/fixture/company-profile`)).status,200); // Reserved articles remain in journal.
const guide=await fetch(`${base}/estimate-request/fixture`);assert.equal(guide.status,200);assert.match(await guide.text(),/unavailable/i); // Existing unavailable-guide behavior.
if(process.env.PAINTER_COMPANY_CAPTURE_DIR){
await mkdir(process.env.PAINTER_COMPANY_CAPTURE_DIR,{recursive:true});browser=await chromium.launch(await browserLaunchOptions());const page=await browser.newPage();
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){await page.setViewportSize({width,height});await page.goto(`${base}/company/fixture`);await page.getByRole('heading',{name:'Fixture company <script>plain</script>',exact:true}).waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await page.screenshot({path:`${process.env.PAINTER_COMPANY_CAPTURE_DIR}/${name}.png`,fullPage:true});}
console.log(`Built Next fixture captures; sandboxed Chromium ${browser.version()}`);
}
assert.ok(requests.some(request=>request.path==='painter:articles'&&request.args.slug==='company-profile'));
}finally{await browser?.close();if(app.exitCode===null){app.kill('SIGTERM');await Promise.race([once(app,'exit'),delay(3000)]);if(app.exitCode===null)app.kill('SIGKILL');}backend.closeAllConnections();await new Promise(resolve=>backend.close(resolve));}
});
