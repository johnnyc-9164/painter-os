import assert from 'node:assert/strict';
import test from 'node:test';
import {decodeContactPolicy,decodeInquiryResult,validatePublicInquiry} from '../packages/public-content/public-lead.mjs';
import {createInquiryIntent,reconcileInquiry} from '../apps/company-site/src/lib/inquiry-intent';
import {parseInquiryRequest} from '../apps/company-site/src/lib/inquiry-proxy';
const submission={requestKey:'a'.repeat(32),contactPolicyRevision:2,guidanceRevision:3,consent:true,contact:{name:' Jane ',email:'jane@example.test'},project:{postalCode:'55401',projectType:'interior',scope:'Two rooms',timeline:'flexible'}};
const policy={companyName:'Company',contactPolicyRevision:2,guidanceRevision:3,consentText:'Please review my project.',retentionDays:30,retentionDisclosure:'Deleted after 30 days.'};
test('canonical minimal contact normalization rejects claims without disclosing input',()=>{
 assert.equal(validatePublicInquiry(submission).contact.name,'Jane');
 for(const value of [{...submission,consent:false},{...submission,role:'owner'},{...submission,contact:{name:'a'}},{...submission,project:{...submission.project,scope:'x'.repeat(2001)}},{...submission,['private@example.test']:'secret'}])assert.throws(()=>validatePublicInquiry(value),/^Error: INVALID_INQUIRY$/);
});
test('strict public projections reject private fields and malformed proofs',()=>{
 assert.deepEqual(decodeContactPolicy({state:'unavailable'}),{state:'unavailable'});
 assert.deepEqual(decodeContactPolicy({state:'ready',policy}),{state:'ready',policy});
 assert.throws(()=>decodeContactPolicy({state:'ready',policy:{...policy,actorId:'private'}}));
 assert.throws(()=>decodeContactPolicy({state:'ready',policy:{...policy,retentionDays:31}}));
 assert.throws(()=>decodeInquiryResult({state:'received',reference:'lead-id'}));
 assert.throws(()=>decodeInquiryResult({state:'received',reference:'a'.repeat(64),email:'private'}));
});
test('unknown and unavailable status preserve exact key, contact and policy revisions',()=>{
 const intent=createInquiryIntent(submission);const original=JSON.stringify(intent.submission);
 const unknown=reconcileInquiry(intent,{error:'lost'});
 assert.equal(unknown.phase,'unknown');const checked=reconcileInquiry(unknown,{state:'unavailable'},true);
 assert.equal(checked.phase,'checked');assert.equal(JSON.stringify(checked.submission),original);
 const received=reconcileInquiry(checked,{state:'received',reference:'a'.repeat(64)});
 assert.equal(received.phase,'complete');assert.equal(JSON.stringify(received.submission),original);
 assert.equal(reconcileInquiry(unknown,{state:'denied',reason:'policy_changed'}).phase,'denied');
 assert.equal(reconcileInquiry(unknown,{state:'unavailable',contact:'private'},true).phase,'unknown');
});
const request=(body:unknown,origin='http://company.test')=>new Request('http://company.test/api/inquiry/company-a',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
test('same-origin POST body closes action and workspace overrides before transport',async()=>{
 assert.deepEqual(await parseInquiryRequest(request({action:'submit',submission})),{action:'submit',submission:validatePublicInquiry(submission)});
 assert.deepEqual(await parseInquiryRequest(request({action:'status',requestKey:submission.requestKey})),{action:'status',requestKey:submission.requestKey});
 for(const body of [{action:'submit',submission,workspaceId:'other'},{action:'arbitrary',function:'painter:dispatch'},{action:'status',requestKey:'short'}])await assert.rejects(parseInquiryRequest(request(body)));
 await assert.rejects(parseInquiryRequest(request({action:'submit',submission},'http://foreign.test')));
});
test('actual streamed bytes are bounded even with a misleading content length',async()=>{
 let cancelled=false;const stream=new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new TextEncoder().encode('x'.repeat(16_385)));},cancel(){cancelled=true;}});
 const req=new Request('http://company.test/api/inquiry/a',{method:'POST',headers:{Origin:'http://company.test','Content-Type':'application/json','Content-Length':'1'},body:stream,duplex:'half'} as RequestInit);
 await assert.rejects(parseInquiryRequest(req));assert.equal(cancelled,true);
});
test('stalled body containing a valid prefix still times out and cancels without admission',{timeout:7000},async()=>{
 let cancelled=false;const stream=new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new TextEncoder().encode(JSON.stringify({action:'status',requestKey:submission.requestKey})));},cancel(){cancelled=true;}});
 const req=new Request('http://company.test/api/inquiry/a',{method:'POST',headers:{Origin:'http://company.test','Content-Type':'application/json'},body:stream,duplex:'half'} as RequestInit);
 await assert.rejects(parseInquiryRequest(req));assert.equal(cancelled,true);
});
test('actual Convex HTTP client exposes only fixed anonymous capabilities and strict safe results',async()=>{
 const {createServer}=await import('node:http');const {readContactPolicy,submitPublicInquiry,readInquiryStatus}=await import('../packages/public-content/public-lead.mjs');
 const calls:{path:string;args:unknown[]}[]=[];const server=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;const call=JSON.parse(body);calls.push(call);assert.equal(req.headers.authorization,undefined);const value=call.path==='contactIntakeConfig:publicPolicy'?{state:'ready',policy}:call.path==='publicLead:status'?{state:'unavailable'}:{state:'received',reference:'a'.repeat(64)};res.setHeader('Content-Type','application/json');res.end(JSON.stringify({status:'success',value}));});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();assert.ok(address&&typeof address!=='string');const url=`http://127.0.0.1:${address.port}`;
 try{await readContactPolicy(url,'company-a');await submitPublicInquiry(url,'company-a',submission);await readInquiryStatus(url,'company-a',submission.requestKey);assert.deepEqual(calls.map(call=>call.path),['contactIntakeConfig:publicPolicy','publicLead:submit','publicLead:status']);assert.deepEqual(calls[1].args,[{workspaceId:'company-a',submission:validatePublicInquiry(submission)}]);await assert.rejects(submitPublicInquiry(url,'company-b',{...submission,actorId:'spoof'}));assert.equal(calls.length,3);}finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
