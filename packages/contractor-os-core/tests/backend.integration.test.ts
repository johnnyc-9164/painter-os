/** Real convex-test API tests, not our handcrafted adapter doubles. Run after genuine codegen.
 * convex-test itself simulates Convex. Production OCC/resource limits still need real backend tests.
 */
import {convexTest} from 'convex-test';
import {test,expect} from 'vitest';
import schema from '../src/component/schema.js';
import {api} from '../src/component/_generated/api.js';
const modules=import.meta.glob('../src/component/**/*.ts');
const actor={tenantId:'synthetic-a',actorId:'issuer|synthetic',mayAttest:true};
async function prepared(){const t=convexTest(schema,modules);await t.mutation(api.records.co_client.create,{tenantId:actor.tenantId,actorId:actor.actorId,identifier:'client',requestKey:'create-client',properties:{client_type:'commercial'},title:'Synthetic client'});return t;}
test('SDK business: create lead appends an actual domain event and request receipt',async()=>{
 const t=await prepared();const r=await t.mutation(api.workflows.co_create_lead,{...actor,requestKey:'lead-1',input:{title:'Synthetic scope',client:'client'}});
 const lead=await t.query(api.records.co_lead.get,{tenantId:actor.tenantId,identifier:r.primary.identifier});
 expect(lead?.properties.stage).toBe('new');expect(lead?.revision).toBe(1);
 await t.run(async ctx=>{expect(await ctx.db.query('businessRequests').withIndex('by_tenant_request',q=>q.eq('tenantId',actor.tenantId).eq('requestKey','lead-1')).unique()).not.toBeNull();});
});
test('SDK business: identical command replays without new effects',async()=>{
 const t=await prepared();const a={...actor,requestKey:'lead-1',input:{title:'Synthetic',client:'client'}};
 const r=await t.mutation(api.workflows.co_create_lead,a);expect((await t.mutation(api.workflows.co_create_lead,a)).primary.id).toBe(r.primary.id);
 expect((await t.mutation(api.workflows.co_create_lead,a)).replayed).toBe(true);
});
test('SDK business: scheduling changes visit and lead in one command',async()=>{
 const t=await prepared();const r=await t.mutation(api.workflows.co_create_lead,{...actor,requestKey:'lead',input:{title:'Synthetic',client:'client'}});
 const advanced=await t.mutation(api.workflows.co_advance_lead,{...actor,requestKey:'qualify',input:{lead:r.primary.identifier,new_stage:'qualifying'},expected:[{blueprint:'co_lead',identifier:r.primary.identifier,revision:1}]});
 const scheduled=await t.mutation(api.workflows.co_schedule_site_visit,{...actor,requestKey:'visit',input:{lead:r.primary.identifier,visit_date:'2099-01-01T00:00:00Z'},expected:[{blueprint:'co_lead',identifier:r.primary.identifier,revision:advanced.primary.revision}]});
 expect(scheduled.effects).toHaveLength(2);
 expect((await t.query(api.records.co_lead.get,{tenantId:actor.tenantId,identifier:r.primary.identifier}))?.properties.stage).toBe('site_visit_scheduled');
});
test('SDK business: stale revision aborts without an extra visit',async()=>{
 const t=await prepared();const r=await t.mutation(api.workflows.co_create_lead,{...actor,requestKey:'lead',input:{title:'Synthetic',client:'client'}});
 await expect(t.mutation(api.workflows.co_advance_lead,{...actor,requestKey:'bad',input:{lead:r.primary.identifier,new_stage:'qualifying'},expected:[{blueprint:'co_lead',identifier:r.primary.identifier,revision:99}]})).rejects.toThrow('REVISION_CONFLICT');
 expect((await t.query(api.records.co_lead.get,{tenantId:actor.tenantId,identifier:r.primary.identifier}))?.revision).toBe(1);
});
test('SDK business: foreign-tenant client is not usable',async()=>{
 const t=await prepared();await expect(t.mutation(api.workflows.co_create_lead,{...actor,tenantId:'synthetic-b',requestKey:'lead',input:{title:'Synthetic',client:'client'}})).rejects.toThrow('ENTITY_NOT_FOUND');
});
test('SDK business: maintenance cannot forge signed or paid states',async()=>{
 const t=await prepared();await expect(t.mutation(api.records.co_contract.create,{tenantId:actor.tenantId,actorId:actor.actorId,identifier:'forged',requestKey:'forged',properties:{status:'fully_executed'}})).rejects.toThrow('INITIAL_STATE_REQUIRED');
 await expect(t.mutation(api.records.co_payment.create,{tenantId:actor.tenantId,actorId:actor.actorId,identifier:'forged',requestKey:'forged',properties:{amount:10}})).rejects.toThrow('USE_WORKFLOW');
});
test('SDK business: missing attestation permission rejects the command',async()=>{
 const t=await prepared();await expect(t.mutation(api.workflows.co_mark_contract_signed,{...actor,mayAttest:false,requestKey:'signed',input:{contract:'missing',contract_doc_url:'https://example.invalid/signed.pdf'},evidence:{kind:'contract_signed',reference:'manual-proof',occurredAt:'2020-01-01T00:00:00Z'}})).rejects.toThrow('ATTESTATION_FORBIDDEN');
});
test('SDK business: failed command does not leave a replay receipt',async()=>{
 const t=await prepared();await expect(t.mutation(api.workflows.co_create_lead,{...actor,requestKey:'bad-lead',input:{title:'Synthetic',client:'client',contact:'missing'}})).rejects.toThrow('ENTITY_NOT_FOUND');
 await t.run(async ctx=>{expect(await ctx.db.query('businessRequests').withIndex('by_tenant_request',q=>q.eq('tenantId',actor.tenantId).eq('requestKey','bad-lead')).unique()).toBeNull();});
});
