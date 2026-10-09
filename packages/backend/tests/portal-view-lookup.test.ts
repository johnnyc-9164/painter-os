import { describe, expect, it } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api } from '../convex/runtime';
const modules = { './_generated/test-root-marker.ts': () => Promise.resolve({}), './painter.ts': () => import('../convex/painter') };
const token = 'c'.repeat(64);
const now = '2026-10-09T00:00:00Z';
async function fixture(noise = 0, documentsRead = 20) {
 const t = convexTest({ schema, modules, transactionLimits: { documentsRead, bytesRead: 32768 } });
 const tokenHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))), b=>b.toString(16).padStart(2,'0')).join('');
 const rows = await t.run(async ctx => {
  const tenantId = await ctx.db.insert('painterWorkspaces',{name:'Synthetic',ownerId:'owner',createdAt:now,demo:false});
  const foreign = await ctx.db.insert('painterWorkspaces',{name:'Foreign',ownerId:'other',createdAt:now,demo:false});
  const insert = (entityId:string,type:string,data:Record<string,unknown>,tenant = tenantId) => ctx.db.insert('painterEntities',{tenantId:tenant,entityId,type,revision:1,createdAt:now,updatedAt:now,data});
  const estimate = await insert('estimate','estimate',{customerId:'customer',status:'approved',notes:'private',title:'Live changed title'});
  await insert('job-a','job',{estimateId:'estimate',customerId:'customer',title:'Job A',status:'active',notes:'private'});
  await insert('job-b','job',{estimateId:'estimate',customerId:'customer',title:'Job B',status:'completed'});
  await insert('schedule-b','schedule',{jobId:'job-b',customerId:'customer',startAt:'first',endAt:'end',status:'scheduled'});
  await insert('schedule-a','schedule',{jobId:'job-a',customerId:'customer',startAt:'second',endAt:'end',status:'cancelled'});
  await insert('invoice-void','invoice',{jobId:'job-a',customerId:'customer',title:'Void',status:'void',totalCents:100,balanceCents:0,notes:'private'});
  await insert('invoice-draft','invoice',{jobId:'job-a',customerId:'customer',status:'draft'});
  await insert('invoice-sent','invoice',{jobId:'job-b',customerId:'customer',title:'Sent',status:'sent',totalCents:200,balanceCents:200});
  for(let i=0;i<noise;i++) {
   for(const type of ['task','job','schedule','invoice']) await insert(`${type}-${i}`,type,{estimateId:'unrelated',jobId:'unrelated',customerId:'customer',private:'x'.repeat(1024)});
   await insert(`wrong-customer-${i}`,'job',{estimateId:'estimate',customerId:'other'});
   for(const type of ['schedule','invoice']) await insert(`wrong-${type}-${i}`,type,{jobId:'job-a',customerId:'other'});
   await insert(`foreign-${i}`,'job',{estimateId:'estimate',customerId:'customer'},foreign);
   await ctx.db.insert('painterEvents',{tenantId,eventId:`event-${i}`,type:'changed',entityId:'estimate',actorId:'owner',occurredAt:now,payload:{private:'x'.repeat(1024)}});
   await ctx.db.insert('painterReceipts',{tenantId,requestKey:`key-${i}`,fingerprint:'x',result:{private:'x'.repeat(1024)}});
  }
  const portal = await ctx.db.insert('painterPortals',{tenantId,tokenHash,estimateId:'estimate',customerId:'customer',customerEmail:'customer@example.test',expiresAt:Date.now()+60000,scope:{id:'estimate',revision:1,title:'Frozen title',status:'sent',totalCents:100}});
  return {estimate,portal};
 });
 return {t,...rows};
}
describe('portalView actual bounded indexed reads',()=>{
 it('preserves the complete projection with unrelated same-type records, foreign tenant rows and history under 20 document reads',async()=>{
  const {t}=await fixture(100);
  const result=await t.query(api.painter.portalView,{token});
  expect(result.estimate).toEqual({id:'estimate',revision:1,title:'Frozen title',status:'approved',totalCents:100});
  expect(result.jobs).toEqual([{id:'job-a',title:'Job A',status:'active'},{id:'job-b',title:'Job B',status:'completed'}]);
  expect(result.schedules.map((row:{id:string})=>row.id)).toEqual(['schedule-b','schedule-a']);
  expect(result.invoices).toEqual([{id:'invoice-void',title:'Void',status:'void',totalCents:100,balanceCents:0},{id:'invoice-sent',title:'Sent',status:'sent',totalCents:200,balanceCents:200}]);
  expect(JSON.stringify(result)).not.toMatch(/private|unrelated|customerEmail|tokenHash/);
 });
 it('excludes malformed nonstring job links at the typed indexed read seam',async()=>{
  const {t,estimate}=await fixture();
  await t.run(async ctx=>{
   const row=await ctx.db.get(estimate);
   for(const [i,jobId] of [['number',7],['array',['job-a']],['object',{value:'job-a'}]] as const) {
    await ctx.db.insert('painterEntities',{tenantId:row!.tenantId,entityId:`malformed-${i}`,type:'schedule',revision:1,createdAt:now,updatedAt:now,data:{jobId,customerId:'customer',status:'scheduled'}});
    await ctx.db.insert('painterEntities',{tenantId:row!.tenantId,entityId:`malformed-invoice-${i}`,type:'invoice',revision:1,createdAt:now,updatedAt:now,data:{jobId,customerId:'customer',status:'sent'}});
   }
  });
  const result=await t.query(api.painter.portalView,{token});
  expect(result.schedules).toHaveLength(2);
  expect(result.invoices).toHaveLength(2);
  expect(JSON.stringify(result)).not.toContain('malformed');
 });
 it('returns all legitimate related records without a product cutoff',async()=>{
  const {t,estimate}=await fixture(0,200);
  await t.run(async ctx=>{
   const row=await ctx.db.get(estimate);
   for(let i=0;i<50;i++) await ctx.db.insert('painterEntities',{tenantId:row!.tenantId,entityId:`related-${i}`,type:'schedule',revision:1,createdAt:now,updatedAt:now,data:{jobId:'job-a',customerId:'customer',status:'scheduled'}});
  });
  const result=await t.query(api.painter.portalView,{token});
  expect(result.schedules).toHaveLength(52);
 });
 it('preserves invalid token, missing token, expired token and wrong-customer estimate denial',async()=>{
  const {t,portal,estimate}=await fixture();
  await expect(t.query(api.painter.portalView,{token:'bad'})).rejects.toThrow('INVALID_TOKEN');
  await expect(t.query(api.painter.portalView,{token:'d'.repeat(64)})).rejects.toThrow('PORTAL_INVALID_OR_EXPIRED');
  await t.run(ctx=>ctx.db.patch(portal,{expiresAt:0}));
  await expect(t.query(api.painter.portalView,{token})).rejects.toThrow('PORTAL_INVALID_OR_EXPIRED');
  await t.run(async ctx=>{await ctx.db.patch(portal,{expiresAt:Date.now()+60000});await ctx.db.patch(estimate,{data:{customerId:'other',status:'approved'}});});
  await expect(t.query(api.painter.portalView,{token})).rejects.toThrow('PORTAL_INVALID');
  await t.run(ctx=>ctx.db.patch(estimate,{type:'job',data:{customerId:'customer'}}));
  await expect(t.query(api.painter.portalView,{token})).rejects.toThrow('PORTAL_INVALID');
  await t.run(ctx=>ctx.db.delete(estimate));
  await expect(t.query(api.painter.portalView,{token})).rejects.toThrow('PORTAL_INVALID');
 });
});
