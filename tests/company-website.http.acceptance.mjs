import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { readFile, mkdir } from 'node:fs/promises';
import { test } from 'node:test';
import { chromium } from '@playwright/test';
import { browserLaunchOptions } from '../scripts/agent-browser-options.mjs';
import { websiteFixture } from './fixtures/company-website-content.mjs';
const image=await readFile(new URL('../apps/marketing/public/images/product/house-van.webp',import.meta.url));

test('built shared company templates scope content and media and preserve legacy routes', {timeout:90000},async()=>{
const seen=[];
const backend=createServer(async(req,res)=>{
res.setHeader('Cache-Control','no-store');const target=new URL(req.url,'http://127.0.0.1');
if(req.method==='GET'){
assert.equal(target.pathname,'/company-website-media');seen.push(target.search);
if(target.searchParams.get('revision')!=='1'||target.searchParams.get('mediaId')!=='photo'){res.writeHead(404);return res.end();}
res.writeHead(200,{'Content-Type':'image/webp','Content-Length':String(image.byteLength),'X-Private':'do-not-forward'});return res.end(image);
}
let body='';for await(const chunk of req)body+=chunk;const {path,args:[args]}=JSON.parse(body);let value;
if(path==='companyWebsite:publicSnapshot'){
if(args.workspaceId==='unpublished')value={state:'unavailable'};
else if(args.workspaceId==='malformed')value={state:'published',website:{privateNotes:'secret'}};
else if(!['studio','editorial','direct','sparse'].includes(args.workspaceId))value={state:'unavailable'};
else{const content=websiteFixture(args.workspaceId==='sparse'?'studio':args.workspaceId,args.workspaceId==='sparse');value={state:'published',website:{revision:1,publishedAt:'2026-10-09T12:00:00Z',content,media:args.workspaceId==='sparse'?[]:[{mediaId:'photo',url:`/api/company-website-media?workspaceId=${args.workspaceId}&mediaId=photo&revision=1`,width:1536,height:1024,contentType:'image/webp'}]}};}
}else if(path==='painter:articlesPage')value={page:[{id:'blog',title:'Fixture blog article',slug:'fixture-blog',excerpt:'Existing published CMS fixture article.',publishedAt:'2026-10-09T12:00:00Z'}],isDone:true,continueCursor:null};
else if(path==='painter:articles')value=[{id:'blog',title:'Fixture blog article',slug:'fixture-blog',content:'Existing published CMS fixture article.',publishedAt:'2026-10-09T12:00:00Z'}];
else if(path==='intakeConfig:publicPolicy')value={state:'unavailable'};
else throw new Error(`Unexpected endpoint ${path}`);
res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'success',value}));
});backend.listen(0,'127.0.0.1');await once(backend,'listening');
const allocator=createServer();allocator.listen(0,'127.0.0.1');await once(allocator,'listening');const port=allocator.address().port;await new Promise(resolve=>allocator.close(resolve));
const app=spawn(process.execPath,[new URL('../node_modules/next/dist/bin/next',import.meta.url).pathname,'start','--hostname','127.0.0.1','--port',String(port)],{cwd:new URL('../apps/company-site/',import.meta.url),env:{PATH:process.env.PATH,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_CONVEX_URL:`http://127.0.0.1:${backend.address().port}`},stdio:['ignore','pipe','pipe']});let logs='';app.stdout.on('data',x=>logs+=x);app.stderr.on('data',x=>logs+=x);const base=`http://127.0.0.1:${port}`;let browser;
try{
let ready=false;for(let i=0;i<100;i++){if(app.exitCode!==null)throw new Error(logs);try{if((await fetch(base)).status===200){ready=true;break;}}catch{}await delay(100);}assert.ok(ready,logs);
for(const template of ['studio','editorial','direct']){const response=await fetch(`${base}/company/${template}`);assert.equal(response.status,200);const html=await response.text();assert.match(html,new RegExp(`data-template="${template}"`));for(const text of ['Fixture interior service','Fixture project story','Fixture attribution','From $1,750.00','Fixture City','Fixture blog article'])assert.ok(html.includes(text),text);assert.doesNotMatch(html,/Verified|privateNotes|storageId/);assert.match(html,new RegExp(`href="/site/${template}/fixture-blog"`));assert.match(html,new RegExp(`href="/estimate-request/${template}"`));}
const sparse=await(await fetch(`${base}/company/sparse`)).text();assert.doesNotMatch(sparse,/<img|href="tel:|Customer feedback|Pricing information|Our services/);
for(const route of ['/company/unpublished','/company/unknown','/company/studio/services'])assert.equal((await fetch(base+route)).status,404,route);
assert.equal((await fetch(`${base}/company/malformed`)).status,500);
const media=await fetch(`${base}/api/company-website-media?workspaceId=studio&mediaId=photo&revision=1`);assert.equal(media.status,200);assert.equal(media.headers.get('cache-control'),'no-store');assert.equal(media.headers.get('x-content-type-options'),'nosniff');assert.equal(media.headers.get('x-private'),null);assert.equal(media.headers.get('set-cookie'),null);assert.deepEqual(Buffer.from(await media.arrayBuffer()),image);
assert.equal((await fetch(`${base}/api/company-website-media?workspaceId=studio&mediaId=photo&revision=2`)).status,404);
assert.equal((await fetch(`${base}/api/company-website-media?workspaceId=studio&mediaId=photo&revision=1&url=https://invalid.test`)).status,400);
assert.equal((await fetch(`${base}/site/studio`)).status,200);assert.equal((await fetch(`${base}/site/studio/fixture-blog`)).status,200);assert.equal((await fetch(`${base}/estimate-request/studio`)).status,200);
if(process.env.PAINTER_COMPANY_CAPTURE_DIR){
await mkdir(process.env.PAINTER_COMPANY_CAPTURE_DIR,{recursive:true});browser=await chromium.launch(await browserLaunchOptions());const page=await browser.newPage();
for(const template of ['studio','editorial','direct'])for(const [name,width,height] of [['desktop',1440,1000],['tablet',900,1000],['mobile',390,844]]){
await page.setViewportSize({width,height});await page.goto(`${base}/company/${template}`);await page.getByRole('heading',{name:'A thoughtful finish for the spaces you love.',exact:true}).waitFor();await page.locator('img').first().evaluate(image=>image.decode());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
const button=page.getByRole('link',{name:'Call to discuss your project',exact:true}).first();const styles=await button.evaluate(element=>{const s=getComputedStyle(element);return {background:s.backgroundColor,color:s.color,height:s.height};});assert.notEqual(styles.background,'rgba(0, 0, 0, 0)');assert.notEqual(styles.color,styles.background);const luminance=color=>{const rgb=color.match(/\d+(?:\.\d+)?/g).slice(0,3).map(Number).map(value=>value/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};const l1=luminance(styles.color),l2=luminance(styles.background);assert.ok((Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)>=4.5,JSON.stringify(styles));assert.ok(parseFloat(styles.height)>=48);
await button.focus();assert.notEqual(await button.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
await page.screenshot({path:`${process.env.PAINTER_COMPANY_CAPTURE_DIR}/${template}-${name}.png`,fullPage:true});
}
await page.goto(`${base}/site/studio`);const legacy=await page.evaluate(()=>({background:getComputedStyle(document.body).backgroundColor,padding:getComputedStyle(document.querySelector('main')).paddingTop}));assert.equal(legacy.background,'rgb(246, 245, 240)');assert.equal(legacy.padding,'24px');
console.log(`Actual built Next 3 templates x 3 widths; sandboxed Chromium ${browser.version()}; shared Button colors/focus/48px and legacy journal style checks passed.`);
}
assert.ok(seen.length>0);
}finally{await browser?.close();if(app.exitCode===null){app.kill('SIGTERM');await Promise.race([once(app,'exit'),delay(3000)]);if(app.exitCode===null)app.kill('SIGKILL');}backend.closeAllConnections();await new Promise(resolve=>backend.close(resolve));}
});
