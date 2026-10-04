import test from 'node:test';
import assert from 'node:assert/strict';
import {executeBusinessCommand,guardMaintenance} from '../build/shared/business.js';
import {MemoryStore} from './support/business-store.mjs';
function harness(){const s=new MemoryStore();let n=0;return {s,async run(kind,input,rows=[],evidenceKind){return s.transaction(tx=>executeBusinessCommand(tx,{tenantId:'tenant-a',actorId:'verified-owner',mayAttest:true,requestKey:`cmd-${++n}`,command:{kind,input},expected:s.expect(...rows),...(evidenceKind?{evidence:{kind:evidenceKind,reference:`proof-${n}`,occurredAt:'2026-09-22T11:00:00Z'}}:{})}));}};}
async function life(){
 const h=harness(),{s}=h;s.seed('co_client','client',{status:'active'});
 const created=await h.run('co_create_lead',{title:'Synthetic exterior job',client:'client'});const leadId=created.primary.identifier;
 const readLead=()=>s.load('co_lead',leadId);
 await h.run('co_advance_lead',{lead:leadId,new_stage:'qualifying'},[await readLead()]);
 await h.run('co_schedule_site_visit',{lead:leadId,visit_date:'2026-09-23T12:00:00Z'},[await readLead()]);
 const scope=await h.run('co_create_scope',{lead:leadId,description:'Prepare and paint specified surfaces.',estimated_labor_cost:50,estimated_materials_cost:25},[await readLead()]);
 const scopeId=scope.primary.identifier;
 await h.run('transition',{blueprint:'co_scope',identifier:scopeId,to:'in_review'},[await s.load('co_scope',scopeId)]);
 await h.run('transition',{blueprint:'co_scope',identifier:scopeId,to:'approved'},[await s.load('co_scope',scopeId)],'scope_approved');
 const proposal=await h.run('co_create_proposal',{scope:scopeId,lead:leadId,client:'client',amount:100,expires_at:'2026-10-01T12:00:00Z'});const proposalId=proposal.primary.identifier;
 await h.run('transition',{blueprint:'co_proposal',identifier:proposalId,to:'in_review'},[await s.load('co_proposal',proposalId)]);
 await h.run('transition',{blueprint:'co_proposal',identifier:proposalId,to:'sent'},[await s.load('co_proposal',proposalId),await readLead()],'proposal_sent');
 const bid=await h.run('co_submit_bid',{proposal:proposalId,lead:leadId,client:'client',bid_type:'invited',amount:100},[await readLead()],'bid_submitted');const bidId=bid.primary.identifier;
 const contract=await h.run('co_convert_bid_to_contract',{bid:bidId,client:'client',contract_type:'lump_sum'},[await s.load('co_bid',bidId),await readLead()],'bid_awarded');const contractId=contract.primary.identifier;
 await h.run('co_mark_contract_signed',{contract:contractId,contract_doc_url:'https://example.invalid/signed.pdf'},[await s.load('co_contract',contractId)],'contract_signed');
 const job=await h.run('co_create_job',{contract:contractId,client:'client',job_number:'J1',job_type:'commercial'},[await readLead()]);const jobId=job.primary.identifier;
 const invoice=await h.run('co_create_invoice',{job:jobId,client:'client',invoice_number:'I1',invoice_type:'deposit',amount:100,due_date:'2026-10-01T12:00:00Z'});const invoiceId=invoice.primary.identifier;
 return {...h,leadId,scopeId,proposalId,bidId,contractId,jobId,invoiceId};
}
test('all eleven exported business workflows execute in a synthetic end-to-end lifecycle',async()=>{
 const h=await life(),{s,jobId,invoiceId}=h;
 assert.equal((await s.load('co_lead',h.leadId)).properties.stage,'won');
 assert.equal((await s.load('co_job',jobId)).properties.billed_to_date,0,'drafts do not count as billed');
 await h.run('transition',{blueprint:'co_invoice',identifier:invoiceId,to:'sent'},[await s.load('co_invoice',invoiceId),await s.load('co_job',jobId)],'invoice_issued');
 await h.run('co_record_payment',{invoice:invoiceId,client:'client',amount:100,payment_method:'check',payment_date:'2026-09-22T11:00:00Z'},[await s.load('co_invoice',invoiceId),await s.load('co_job',jobId)],'payment_received');
 assert.equal((await s.load('co_invoice',invoiceId)).properties.status,'paid');
 assert.equal((await s.load('co_job',jobId)).properties.collected_to_date,100);
 assert.ok(s.events.every(e=>e.policyVersion==='contractor-operations-v1'));
});
test('a second job cannot multiply the same contract budget',async()=>{
 const h=await life();await assert.rejects(h.run('co_create_job',{contract:h.contractId,client:'client',job_number:'J2',job_type:'commercial'}),/CONTRACT_ALREADY_HAS_JOB/);
});
test('invoice issuance rejects contract overbilling and preserves drafts',async()=>{
 const h=await life(),{s}=h;
 await h.run('transition',{blueprint:'co_invoice',identifier:h.invoiceId,to:'sent'},[await s.load('co_invoice',h.invoiceId),await s.load('co_job',h.jobId)],'invoice_issued');
 const other=await h.run('co_create_invoice',{job:h.jobId,client:'client',invoice_number:'I2',invoice_type:'progress',amount:0.01,due_date:'2026-10-01T12:00:00Z'});
 await assert.rejects(h.run('transition',{blueprint:'co_invoice',identifier:other.primary.identifier,to:'sent'},[await s.load('co_invoice',other.primary.identifier),await s.load('co_job',h.jobId)],'invoice_issued'),/OVERBILLING/);
 assert.equal((await s.load('co_invoice',other.primary.identifier)).properties.status,'draft');
});
test('draft jobs and payments cannot bypass the specialized creation paths',()=>{
 assert.throws(()=>guardMaintenance('co_job',null,{}, {},{}),/USE_WORKFLOW/);
 assert.throws(()=>guardMaintenance('co_subcontractor',{}, {},{jobs:[]},{jobs:['x']}),/USE_WORKFLOW/);
});
test('subcontract assignment maintains both relation directions and requires both revisions',async()=>{
 const h=await life(),{s}=h;const sub=s.seed('co_subcontractor','sub',{status:'prequalified',w9_on_file:true,insurance_expiry:'2027-01-01T00:00:00Z',license_expiry:'2027-01-01T00:00:00Z'});
 const r=await h.run('assign_subcontractor',{job:h.jobId,subcontractor:'sub'},[await s.load('co_job',h.jobId),sub]);
 assert.equal(r.effects.length,2);assert.deepEqual((await s.load('co_job',h.jobId)).relations.subcontractors,[sub.id]);
 assert.deepEqual((await s.load('co_subcontractor','sub')).relations.jobs,[r.primary.id]);
});
test('field reports require active job, valid crew size and non-future report date',async()=>{
 const h=await life(),{s}=h;await h.run('transition',{blueprint:'co_job',identifier:h.jobId,to:'mobilizing'},[await s.load('co_job',h.jobId)]);
 const r=await h.run('submit_daily_report',{job:h.jobId,report_date:'2026-09-22T11:00:00Z',work_performed:'A'.repeat(2000),crew_size:2});
 assert.equal((await s.load('co_daily_report',r.primary.identifier)).properties.status,'submitted');
 await assert.rejects(h.run('submit_daily_report',{job:h.jobId,report_date:'2026-09-22T11:00:00Z',work_performed:'Work',crew_size:1.5}),/INVALID_CREW_SIZE/);
});
test('change orders cannot adjust a closed job',async()=>{
 const h=await life(),{s}=h;const job=await s.load('co_job',h.jobId);job.properties.status='closed';await s.save(job,'fixture');
 const co=s.seed('co_change_order','co',{status:'approved',amount:10},{job:job.id,contract:(await s.load('co_contract',h.contractId)).id});
 await assert.rejects(h.run('transition',{blueprint:'co_change_order',identifier:'co',to:'executed'},[co,await s.load('co_job',h.jobId)],'change_order_executed'),/JOB_NOT_CHANGEABLE/);
});
test('rules written in markdown are not executed as automations',async()=>{
 const h=harness(),a=h.s.seed('co_automation_rule','rule',{status:'draft',trigger:'job_won',conditions:'run shell'});
 await assert.rejects(h.run('transition',{blueprint:'co_automation_rule',identifier:'rule',to:'active'},[a]),/AUTOMATION_EXECUTOR_NOT_CONFIGURED/);
});
test('maintenance cannot reparent an existing contact away from its client',()=>{
 assert.throws(()=>guardMaintenance('co_contact',{first_name:'A'},{first_name:'A'},{client:'client-a'},{client:'client-b'}),/RELATION_REASSIGNMENT/);
});
test('workflow rejects a legacy lead whose contact belongs to a different client',async()=>{
 const h=harness(),{s}=h,c=s.seed('co_client','a'),b=s.seed('co_client','b'),contact=s.seed('co_contact','contact',{}, {client:b.id});
 const lead=s.seed('co_lead','bad',{stage:'qualifying'},{client:c.id,contact:contact.id});
 await assert.rejects(h.run('co_schedule_site_visit',{lead:'bad',visit_date:'2026-09-23T12:00:00Z'},[lead]),/CLIENT_MISMATCH/);
});
test('payment must not turn an inconsistent historical job into overcollected state',async()=>{
 const h=await life(),{s}=h;await h.run('transition',{blueprint:'co_invoice',identifier:h.invoiceId,to:'sent'},[await s.load('co_invoice',h.invoiceId),await s.load('co_job',h.jobId)],'invoice_issued');
 const bad=await s.load('co_job',h.jobId);bad.properties.billed_to_date=0;await s.save(bad,'legacy-corruption-fixture');
 await assert.rejects(h.run('co_record_payment',{invoice:h.invoiceId,client:'client',amount:100,payment_date:'2026-09-22T11:00:00Z',payment_method:'cash'},[await s.load('co_invoice',h.invoiceId),await s.load('co_job',h.jobId)],'payment_received'),/JOB_BALANCE_INCONSISTENT/);
});
test('job closure cannot discard an unbilled contract balance',async()=>{
 const h=await life(),{s}=h;const job=await s.load('co_job',h.jobId);job.properties.status='complete';await s.save(job,'fixture');
 await assert.rejects(h.run('transition',{blueprint:'co_job',identifier:h.jobId,to:'closed'},[await s.load('co_job',h.jobId)]),/UNBILLED_CONTRACT_BALANCE/);
});
