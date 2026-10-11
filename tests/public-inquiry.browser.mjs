import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {createWriteStream} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from '@playwright/test';
import {browserLaunchOptions} from '../scripts/agent-browser-options.mjs';
import {createRun,unusedPort,observe,stop,gitState,writeJson,assertNoEnvFiles} from '../scripts/agent-common.mjs';
await assertNoEnvFiles();const out=await createRun('public-inquiry-browser');
const calls=[],errors=[];let mode='received',contactEnabled=true,guidanceEnabled=true;const records=new Map();
const policy={companyName:'Synthetic Company',contactPolicyRevision:2,guidanceRevision:3,consentText:'I agree to share these details for project review.',retentionDays:30,retentionDisclosure:'Unprocessed requests are deleted after 30 days.'};
const backend=createServer(async(req,res)=>{
 let body='';for await(const chunk of req)body+=chunk;const call=JSON.parse(body);calls.push(call);const args=call.args[0];let value;
 if(call.path==='intakeConfig:publicPolicy')value=!guidanceEnabled?{state:'unavailable'}:{state:'ready',intake:{companyName:args.workspaceId==='company-b'?'Synthetic Company B':'Synthetic Company',revision:3,enabled:true,servicePostalCodes:['55401'],supportedProjectTypes:['interior'],consentText:'Guidance only'}};
 else if(call.path==='contactIntakeConfig:publicPolicy')value=args.workspaceId==='closed'||!contactEnabled?{state:'unavailable'}:{state:'ready',policy};
 else if(call.path==='publicLead:submit'){
  assert.equal(req.url,'/api/mutation');const key=args.workspaceId+args.submission.requestKey;
  if(mode==='policy_changed')value={state:'denied',reason:'policy_changed'};
  else {records.set(key,args.submission);value={state:'received',reference:'a'.repeat(64)};}
 }else if(call.path==='publicLead:status')value=records.has(args.workspaceId+args.requestKey)?{state:'received',reference:'a'.repeat(64)}:{state:'unavailable'};
 else throw new Error('UNEXPECTED_PUBLIC_CAPABILITY');
 res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'success',value}));
});
await new Promise(resolve=>backend.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${await unusedPort()}`;const log=createWriteStream(join(out,'company.log'));
const app=spawn(process.execPath,[new URL('../node_modules/next/dist/bin/next',import.meta.url).pathname,'start','--hostname','127.0.0.1','--port',new URL(base).port],{cwd:new URL('../apps/company-site/',import.meta.url),env:{PATH:process.env.PATH,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_CONVEX_URL:`http://127.0.0.1:${backend.address().port}`},stdio:['ignore','pipe','pipe']});
const appState=observe(app);app.stdout.pipe(log);app.stderr.pipe(log);let browser;
const project={postalCode:'55401',projectType:'interior',scope:'Two rooms',timeline:'flexible'};
async function answers(page){await page.getByLabel('Interior painting',{exact:true}).check();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByLabel('Project ZIP code').fill('55401');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByLabel('Project description').fill('Two rooms');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByLabel('Preferred timeframe').selectOption('flexible');await page.getByRole('button',{name:'See project guidance'}).click();}
async function contacts(page){await page.getByLabel('Full name').fill('Synthetic Visitor');await page.getByLabel('Email address').fill('visitor@example.test');await page.getByLabel(policy.consentText).check();}
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await delay(100);}
 const post=(workspace,body,origin=base)=>fetch(`${base}/api/inquiry/${workspace}`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const before=calls.length;assert.equal((await post('company-a',{action:'status',requestKey:'x'.repeat(32)},'https://foreign.test')).status,400);assert.equal(calls.length,before);
 assert.equal((await post('company-a',{action:'status',requestKey:'x'.repeat(32),workspaceId:'company-b'})).status,400);assert.equal(calls.length,before);
 const response=await post('company-a',{action:'status',requestKey:'x'.repeat(32)});assert.equal(response.headers.get('cache-control'),'no-store');assert.deepEqual(await response.json(),{state:'unavailable'});
 browser=await chromium.launch(await browserLaunchOptions());const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();page.setDefaultTimeout(15_000);page.setDefaultNavigationTimeout(20_000);page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/estimate-request/closed');await answers(page);assert.equal(await page.getByLabel('Full name').count(),0);
 await page.goto(base+'/estimate-request/company-a');await answers(page);assert.equal(await page.getByRole('button',{name:'Submit project request'}).isEnabled(),false);assert.equal(calls.filter(c=>c.path==='publicLead:submit').length,0);await contacts(page);
 await page.screenshot({path:join(out,'desktop-consent.png'),fullPage:true});
 // Simulate a lost HTTP response AFTER the actual built route/backend recorded the submission.
 let lost=true;await page.route('**/api/inquiry/company-a',async route=>{const body=route.request().postDataJSON();if(body.action==='submit'&&lost){lost=false;await route.fetch();await route.abort('failed');}else await route.continue();});
 await page.getByRole('button',{name:'Submit project request'}).click();await page.getByRole('button',{name:'Check request status'}).waitFor();assert.equal(await page.getByLabel('Full name').isDisabled(),true);assert.equal(await page.getByRole('button',{name:'Review your answers'}).count(),0);
 contactEnabled=false;guidanceEnabled=false;const refreshed=page.waitForResponse(response=>response.url().includes('/estimate-request/company-a')&&response.request().headers().rsc==='1');await page.evaluate(()=>window.next.router.refresh());await refreshed;await page.getByText('New project requests are unavailable. You can still check the receipt for your original request.').waitFor();assert.equal(await page.getByRole('button',{name:'Check request status'}).count(),1);
 await page.getByRole('button',{name:'Check request status'}).click();await page.getByRole('heading',{name:'Your request has been recorded.'}).waitFor();assert.equal(calls.filter(c=>c.path==='publicLead:submit').length,1);
 // Installed Next exposes its debug router: fixture uses it only to prove client route reuse resets tenant state.
 contactEnabled=true;guidanceEnabled=true;await page.evaluate(()=>window.next.router.push('/estimate-request/company-b'));await page.getByText('Question 1 of 4').waitFor();await answers(page);assert.equal(await page.getByLabel('Full name').inputValue(),'');await contacts(page);
 // An unavailable receipt after a loss preserves the SAME nonce and payload on retry.
 let first=true,original;await page.route('**/api/inquiry/company-b',async route=>{const body=route.request().postDataJSON();if(body.action==='submit'&&first){first=false;original=body;await route.abort('failed');}else if(body.action==='status'){await route.fulfill({json:{state:'unavailable'}});}else {assert.deepEqual(body,original);await route.continue();}});
 await page.getByRole('button',{name:'Submit project request'}).click();await page.getByRole('button',{name:'Check request status'}).click();await page.getByRole('button',{name:'Retry original request'}).waitFor();await page.getByRole('button',{name:'Retry original request'}).click();await page.getByRole('heading',{name:'Your request has been recorded.'}).waitFor();
 assert.deepEqual(calls.filter(c=>c.path==='publicLead:submit').map(c=>c.args[0].workspaceId),['company-a','company-b']);assert.deepEqual(calls.at(-1).args[0].submission.project,project);
 await page.goto(base+'/estimate-request/company-a');await answers(page);await contacts(page);mode='policy_changed';await page.getByRole('button',{name:'Submit project request'}).click();await page.getByText(/consent policy changed/).waitFor();assert.equal(await page.getByLabel(policy.consentText).isChecked(),false);assert.equal(await page.getByRole('button',{name:'Submit project request'}).count(),0);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await page.screenshot({path:join(out,'mobile-denial.png'),fullPage:true});assert.equal(await page.evaluate(()=>Object.keys(localStorage).length),0);assert.equal(await page.evaluate(()=>Object.keys(sessionStorage).length),0);assert.ok(!page.url().includes('visitor'));assert.deepEqual(errors,[]);
 await writeJson(join(out,'receipt.json'),{...gitState(),status:'passed',browser:browser.version(),sandbox:true,runtime:'built company app + loopback synthetic Convex fixtures only',scope:['Origin/body action before transport','no-store status POST','default closed','explicit consent','lost recorded response reconciliation','same workspace contact+guidance revocation preserves unknown receipt controls','same frozen request retry after unavailable status','Next client workspace navigation reset','policy changed clears consent','390px fit','no storage'],captures:['desktop-consent.png','mobile-denial.png'],liveAuth:false,liveProvider:false});console.log(out);
}catch(error){await writeJson(join(out,'receipt.json'),{...gitState(),status:'failed',error:error.message});throw error;}
finally{await browser?.close();await stop(app,appState);await new Promise(resolve=>backend.close(resolve));log.end();}
