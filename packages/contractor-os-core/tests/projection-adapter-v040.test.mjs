// Explicit database/function doubles. These are NOT official Convex runtime tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { load, db } from './support/convex-adapter-double.mjs';
const projection=load('component/projections.ts'), Client=load('backendClient.ts');
async function seed(d,bp,id,p={},r={},tenantId='a') {return d.insert(bp,{tenantId,identifier:id,title:id,properties:p,relations:r,revision:1,createdAt:0,updatedAt:0,lastEventId:'domainEvents:fixture'});}
test('v040 adapter: registered read calculates fields through actual adapter code',async()=>{
 assert.equal(typeof projection?.get?.handler,'function');const d=db();await seed(d,'co_pricing_rule','rule',{base_rate:100,profit_margin_percent:20});
 const r=await projection.get.handler({db:d},{tenantId:'a',blueprint:'co_pricing_rule',identifier:'rule',asOf:0});assert.equal(r.calculations.effective_rate.value,120);
});
test('v040 adapter: mirrors use local IDs and tenant checks',async()=>{
 assert.equal(typeof projection?.get?.handler,'function');const d=db();const c=await seed(d,'co_client','client');
 await seed(d,'co_contact','contact',{first_name:'A'},{client:c});
 const r=await projection.get.handler({db:d},{tenantId:'a',blueprint:'co_contact',identifier:'contact',asOf:0});assert.equal(r.mirrors.client_name.value,'client');
 assert.equal(await projection.get.handler({db:d},{tenantId:'b',blueprint:'co_contact',identifier:'contact',asOf:0}),null);
});
test('v040 adapter: reverse aggregation uses component relation index',async()=>{
 assert.equal(typeof projection?.get?.handler,'function');const d=db();const c=await seed(d,'co_client','client');
 await seed(d,'co_job','j',{status:'active'},{client:c});
 const r=await projection.get.handler({db:d},{tenantId:'a',blueprint:'co_client',identifier:'client',asOf:0});assert.equal(r.aggregates.active_jobs.value,1);
});
test('v040 host: membership fixes tenant on the new read method',async()=>{
 const calls=[];const ctx={auth:{getUserIdentity:async()=>({tokenIdentifier:'trusted'})},runQuery:async(ref,args)=>{calls.push({ref,args});return null;}};
 const os=new Client.ContractorBackend({projections:{get:'project'}},async()=>({tenantId:'a',permissions:['read']}));
 assert.equal(typeof os.inspectRecord,'function');await os.inspectRecord(ctx,'co_client','client',0);
 assert.deepEqual(calls[0].args,{tenantId:'a',blueprint:'co_client',identifier:'client',asOf:0});
});
test('v040 host: new read denies anonymous callers',async()=>{
 const ctx={auth:{getUserIdentity:async()=>null},runQuery:async()=>assert.fail('unauthorized read')};
 const os=new Client.ContractorBackend({projections:{get:'project'}},async()=>null);assert.equal(typeof os.inspectRecord,'function');
 await assert.rejects(os.inspectRecord(ctx,'co_client','client'),/UNAUTHENTICATED/);
});
test('v040: billing read labels receivable separately from remaining contract balance',async()=>{
 const ops=load('component/operations.ts'), d=db();await seed(d,'co_job','j',{contract_amount:1000,billed_to_date:400,collected_to_date:100});
 const r=await ops.jobFinancials.handler({db:d},{tenantId:'a',identifier:'j'});
 assert.equal(r.billedReceivable,300);assert.equal(r.remainingContractBalance,900);assert.equal(r.outstandingBalance,300);
});
