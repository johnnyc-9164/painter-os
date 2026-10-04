import test from 'node:test';
import assert from 'node:assert/strict';
const core=await import('../build/shared/business.js').catch(()=>null);
test('executable backend exports real command engine and money policy',()=>{
 assert.ok(core,'Business command module has not been implemented');
 assert.equal(typeof core.executeBusinessCommand,'function');
 assert.equal(typeof core.minorUnits,'function');
 assert.equal(core.minorUnits(12.34),1234);
});
test('monetary policy rejects fractions of cents and unsafe values',()=>{
 assert.ok(core,'Business command module has not been implemented');
 for(const value of [NaN,Infinity,0.001,1e16]) assert.throws(()=>core.minorUnits(value));
 assert.equal(core.minorUnits(0.1+0.2),30);
});
import {MemoryStore} from './support/business-store.mjs';
const envelope=(kind,input,extra={})=>({tenantId:'tenant-a',actorId:'human:owner',mayAttest:true,requestKey:'request-001',command:{kind,input},expected:[],...extra});
async function run(s,args){assert.ok(core,'Business command module has not been implemented');return s.transaction(tx=>core.executeBusinessCommand(tx,args));}
const ev=(kind,reference='receipt-001')=>({kind,reference,occurredAt:'2026-09-22T11:00:00Z'});
test('createLead validates client and contact lineage and saves an event',async()=>{
 const s=new MemoryStore(),c=s.seed('co_client','client',{status:'active'});
 const result=await run(s,envelope('co_create_lead',{title:'Exterior',client:c.identifier}));
 assert.equal(result.effects.length,1);assert.equal(s.events.length,1);
 const lead=await s.load('co_lead',result.primary.identifier);
 assert.equal(lead.properties.stage,'new');assert.equal(lead.relations.client,c.id);
});
test('source workflow does not allow new lead to pretend it was won',async()=>{
 const s=new MemoryStore();s.seed('co_client','client');
 await assert.rejects(run(s,envelope('co_create_lead',{title:'X',client:'client',stage:'won'})),/INITIAL_STATE/);
 assert.equal(s.events.length,0);
});
test('scheduled visit and lead advancement are one transaction',async()=>{
 const s=new MemoryStore(),c=s.seed('co_client','client'),l=s.seed('co_lead','lead',{stage:'qualifying'},{client:c.id});
 const r=await run(s,envelope('co_schedule_site_visit',{lead:'lead',visit_date:'2026-09-23T12:00:00Z'},{expected:s.expect(l)}));
 assert.equal(r.effects.length,2);assert.equal((await s.load('co_lead','lead')).properties.stage,'site_visit_scheduled');
 assert.equal((await s.load('co_site_visit',r.primary.identifier)).relations.client,c.id);
});
test('every changed existing record needs an explicit revision precondition',async()=>{
 const s=new MemoryStore();s.seed('co_lead','lead',{stage:'new'});
 await assert.rejects(run(s,envelope('co_advance_lead',{lead:'lead',new_stage:'qualifying'})),/PRECONDITION_REQUIRED/);
});
test('replay returns original result; changed input under same key is refused',async()=>{
 const s=new MemoryStore();s.seed('co_client','client');const a=envelope('co_create_lead',{title:'X',client:'client'});
 const r=await run(s,a);const replay=await run(s,a);assert.equal(replay.primary.id,r.primary.id);assert.equal(replay.replayed,true);assert.equal(s.events.length,1);
 await assert.rejects(run(s,{...a,command:{kind:'co_create_lead',input:{title:'Y',client:'client'}}}),/IDEMPOTENCY_KEY_CONFLICT/);
});
test('cross-tenant and cross-client links are rejected',async()=>{
 const s=new MemoryStore();s.seed('co_client','foreign',{}, {},'tenant-b');
 await assert.rejects(run(s,envelope('co_create_lead',{title:'X',client:'foreign'})),/ENTITY_NOT_FOUND/);
 const c=s.seed('co_client','client'),c2=s.seed('co_client','other');s.seed('co_contact','contact',{}, {client:c2.id});
 await assert.rejects(run(s,envelope('co_create_lead',{title:'X',client:c.identifier,contact:'contact'})),/CLIENT_MISMATCH/);
});
function billingFixture(){const s=new MemoryStore(),c=s.seed('co_client','client');const contract=s.seed('co_contract','contract',{status:'fully_executed',amount:100,signed_at:'2026-09-20T12:00:00Z'},{client:c.id});const job=s.seed('co_job','job',{status:'active',contract_amount:100,billed_to_date:100,collected_to_date:0},{client:c.id,contract:contract.id});const inv=s.seed('co_invoice','invoice',{status:'sent',amount:100,amount_paid:0,due_date:'2026-10-01T00:00:00Z'},{client:c.id,contract:contract.id,job:job.id});return {s,c,contract,job,inv};}
test('payment records payment + invoice balance + job collection atomically',async()=>{
 const {s,job,inv}=billingFixture();
 const r=await run(s,envelope('co_record_payment',{invoice:'invoice',client:'client',amount:40.25,payment_date:'2026-09-22T11:00:00Z',payment_method:'check'},{expected:s.expect(inv,job),evidence:ev('payment_received')}));
 assert.equal(r.effects.length,3);assert.equal((await s.load('co_invoice','invoice')).properties.amount_paid,40.25);
 assert.equal((await s.load('co_invoice','invoice')).properties.status,'partial_payment');assert.equal((await s.load('co_job','job')).properties.collected_to_date,40.25);
});
test('overpayment, non-attestor and duplicate payment evidence refused',async()=>{
 const {s,job,inv}=billingFixture(),input={invoice:'invoice',client:'client',amount:100.01,payment_date:'2026-09-22T11:00:00Z',payment_method:'ach'};
 await assert.rejects(run(s,envelope('co_record_payment',input,{expected:s.expect(inv,job),evidence:ev('payment_received')})),/OVERPAYMENT/);
 await assert.rejects(run(s,envelope('co_record_payment',{...input,amount:10},{expected:s.expect(inv,job),evidence:ev('payment_received'),mayAttest:false})),/ATTESTATION_FORBIDDEN/);
 await run(s,envelope('co_record_payment',{...input,amount:10},{expected:s.expect(inv,job),evidence:ev('payment_received')}));
 await assert.rejects(run(s,envelope('co_record_payment',{...input,amount:10},{requestKey:'another',expected:s.expect(await s.load('co_invoice','invoice'),await s.load('co_job','job')),evidence:ev('payment_received')})),/EVIDENCE_ALREADY_USED/);
});
test('a storage failure rolls back payment and all associated materializations',async()=>{
 const {s,job,inv}=billingFixture();s.failAfterWrites=1;
 await assert.rejects(run(s,envelope('co_record_payment',{invoice:'invoice',client:'client',amount:10,payment_date:'2026-09-22T11:00:00Z',payment_method:'cash'},{expected:s.expect(inv,job),evidence:ev('payment_received')})),/INJECTED_STORAGE_FAILURE/);
 assert.equal(s.events.length,0);assert.equal(s.receipts.size,0);assert.equal((await s.load('co_invoice','invoice')).properties.amount_paid,0);assert.equal([...s.rows.values()].filter(r=>r.blueprint==='co_payment').length,0);
});
test('job creation refuses an unsigned contract',async()=>{
 const s=new MemoryStore(),c=s.seed('co_client','client');s.seed('co_contract','contract',{status:'draft',amount:100},{client:c.id});
 await assert.rejects(run(s,envelope('co_create_job',{contract:'contract',client:'client',job_number:'J1',job_type:'commercial'})),/SIGNED_CONTRACT_REQUIRED/);
});
test('generic maintenance cannot forge an outcome or edit financial totals',()=>{
 assert.ok(core);assert.throws(()=>core.guardMaintenance('co_contract',null,{status:'fully_executed'},{},{}),/INITIAL_STATE/);
 assert.throws(()=>core.guardMaintenance('co_invoice',{status:'draft',amount:100},{status:'paid',amount:100},{},{}),/USE_WORKFLOW/);
 assert.throws(()=>core.guardMaintenance('co_job',null,{collected_to_date:10},{},{}),/MANAGED_FIELD/);
 assert.throws(()=>core.guardMaintenance('co_payment',null,{amount:10},{},{}),/USE_WORKFLOW/);
});
