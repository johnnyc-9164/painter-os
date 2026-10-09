import test from 'node:test';
import assert from 'node:assert/strict';
import { createCompanyWebsiteReader } from '../packages/public-content/company-website.mjs';
import { emptyCompanyWebsiteContent } from '../packages/domain/src/company-website';
const content={...emptyCompanyWebsiteContent('Actual company'),hero:{heading:'Actual headline',summary:'Actual summary'}};
test('public reader scopes query and validates only canonical publication snapshots',async()=>{
let args:unknown;const result=await createCompanyWebsiteReader(async value=>{args=value;return {state:'published',website:{revision:2,publishedAt:'2026-10-09T12:00:00Z',content,media:[]}};})('company');assert.deepEqual(args,{workspaceId:'company'});assert.equal(result.state,'published');
assert.deepEqual(await createCompanyWebsiteReader(async()=>({state:'unavailable'}))('company'),{state:'unavailable'});
});
test('untrusted projections, unresolved media and transport failures fail closed',async()=>{
for(const value of [{state:'draft',website:content},{state:'published',website:{revision:2,publishedAt:'2026-10-09T12:00:00Z',content:{...content,privateNotes:'secret'},media:[]}}, {state:'published',website:{revision:2,publishedAt:'2026-10-09T12:00:00Z',content:{...content,hero:{...content.hero,media:{mediaId:'missing',alt:'Owned photo'}}},media:[]}}])await assert.rejects(()=>createCompanyWebsiteReader(async()=>value)('company'));
const foreign={state:'published',website:{revision:2,publishedAt:'2026-10-09T12:00:00Z',content:{...content,hero:{...content.hero,media:{mediaId:'image',alt:'Owned photo'}}},media:[{mediaId:'image',url:'/api/company-website-media?workspaceId=foreign&mediaId=image&revision=2',width:100,height:100,contentType:'image/png'}]}};await assert.rejects(()=>createCompanyWebsiteReader(async()=>foreign)('company'));
await assert.rejects(()=>createCompanyWebsiteReader(async()=>{throw new Error('Transport failed');})('company'),/Transport failed/);
for(const workspace of ['', ' '.repeat(2),'x'.repeat(1025)])await assert.rejects(()=>createCompanyWebsiteReader(async()=>({state:'unavailable'}))(workspace));
});
