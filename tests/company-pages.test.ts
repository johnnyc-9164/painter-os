import test from 'node:test';
import assert from 'node:assert/strict';
import { createCompanyPageReader, companyPageSlugs } from '../packages/public-content/company-pages.mjs';
const row=(slug:string)=>({id:'article',slug,title:'Owner-authored title',content:'Actual owner copy <script>text</script>',publishedAt:'2026-10-09',privateNotes:'must not project'});
test('exact published query slugs and workspace are used; projection excludes all private metadata',async()=>{
const calls:unknown[]=[];const read=createCompanyPageReader(async(workspace,slug)=>{calls.push([workspace,slug]);return [row(slug)];});const result=await read('workspace');
assert.equal(result.state,'ready');if(result.state!=='ready')return;
assert.deepEqual(calls,Object.values(companyPageSlugs).map(slug=>['workspace',slug]));assert.deepEqual(Object.keys(result.pages.profile).sort(),['content','publishedAt','title']);assert.equal(result.pages.profile.content,'Actual owner copy <script>text</script>');
});
test('unpublished/missing profile unavailable; optional pages remain null without invented fields',async()=>{
assert.deepEqual(await createCompanyPageReader(async()=>[])('workspace'),{state:'unavailable'});
const result=await createCompanyPageReader(async(_,slug)=>slug==='company-profile'?[row(slug)]:[])('workspace');assert.equal(result.state,'ready');if(result.state==='ready'){assert.equal(result.pages.services,null);assert.equal(result.pages.contact,null);}
});
test('duplicate, wrong-slug, blank and malformed projections fail closed',async()=>{
for(const value of [[row('other')],[row('company-profile'),row('company-profile')],[{...row('company-profile'),title:' '}],[{...row('company-profile'),content:' '}],[{...row('company-profile'),content:12}],[{...row('company-profile'),title:'x'.repeat(100001)}],[{...row('company-profile'),publishedAt:'2026-02-30'}],null]) {
await assert.rejects(()=>createCompanyPageReader(async()=>value)('workspace'));
}
for(const workspace of ['', ' '.repeat(3),'x'.repeat(1025)])await assert.rejects(()=>createCompanyPageReader(async()=>[]) (workspace),/INVALID_COMPANY_WORKSPACE/);
});
test('transport failures and unknown workspace errors are not downgraded into empty company content',async()=>{
await assert.rejects(()=>createCompanyPageReader(async()=>{throw new Error('backend failed');})('workspace'),/backend failed/);
});
