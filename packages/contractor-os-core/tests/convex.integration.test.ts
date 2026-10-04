/** Authored real convex-test suite. Requires dependencies + genuine Convex codegen; not replaced by test doubles. */
import { convexTest } from 'convex-test';
import { test, expect } from 'vitest';
import schema from '../src/component/schema.js';
import { api } from '../src/component/_generated/api.js';
const modules=import.meta.glob('../src/component/**/*.ts');
const packet=(requestKey:string,tenantId='a')=>({tenantId,actorId:'test|verified',identifier:'synthetic',requestKey,properties:{}});
test('SDK harness: persisted record has event and typed properties',async()=>{
 const t=convexTest(schema,modules);
 const r=await t.mutation(api.records.co_client.create,{...packet('a'),properties:{client_type:'commercial'}});
 const record=await t.query(api.records.co_client.get,{tenantId:'a',identifier:'synthetic'});
 expect(record?._id).toBe(r.id);expect(record?.properties.client_type).toBe('commercial');
 await t.run(async ctx=>{expect((await ctx.db.query('domainEvents').collect()).length).toBe(1);});
});
test('SDK harness: schema rejects enum bypass at direct database write',async()=>{
 const t=convexTest(schema,modules);
 const r=await t.mutation(api.records.co_client.create,packet('a'));
 await expect(t.run(async ctx=>{const invalid=JSON.parse('{"status":"paid"}');await ctx.db.patch(r.id,{properties:invalid});})).rejects.toThrow();
});
test('SDK harness: repeat-safe requests',async()=>{
 const t=convexTest(schema,modules), p=packet('a');await t.mutation(api.records.co_client.create,p);
 expect((await t.mutation(api.records.co_client.create,p)).replayed).toBe(true);
});
test('SDK harness: optimistic revision',async()=>{
 const t=convexTest(schema,modules);await t.mutation(api.records.co_client.create,packet('a'));
 await t.mutation(api.records.co_client.update,{...packet('b'),expectedRevision:1,properties:{city:'New'}});
 await expect(t.mutation(api.records.co_client.update,{...packet('c'),expectedRevision:1,properties:{city:'Stale'}})).rejects.toThrow('REVISION_CONFLICT');
});
test('SDK harness: foreign tenant references refused',async()=>{
 const t=convexTest(schema,modules);const c=await t.mutation(api.records.co_client.create,packet('a','b'));
 await expect(t.mutation(api.records.co_contact.create,{...packet('a'),relations:{client:c.id}})).rejects.toThrow('RELATION_TARGET_MISSING');
});
test('SDK harness: component-local typed link accepted',async()=>{
 const t=convexTest(schema,modules);const c=await t.mutation(api.records.co_client.create,packet('a'));
 await t.mutation(api.records.co_contact.create,{...packet('b'),properties:{first_name:'Synthetic'},relations:{client:c.id}});
 expect((await t.query(api.records.co_contact.get,{tenantId:'a',identifier:'synthetic'}))?.relations.client).toBe(c.id);
});
test('SDK harness: list uses component-compatible pagination',async()=>{
 const t=convexTest(schema,modules);await t.mutation(api.records.co_client.create,packet('a'));
 const p=await t.query(api.records.co_client.list,{tenantId:'a',paginationOpts:{cursor:null,numItems:10}});
 expect(p.page).toHaveLength(1);expect(p.isDone).toBe(true);
});
test('SDK harness: lossless catalog supports newly supplied blueprint',async()=>{
 const t=convexTest(schema,modules);
 await t.mutation(api.entities.importBatch,{tenantId:'a',actorId:'test|verified',source:'synthetic',requestKey:'a',recordsJson:JSON.stringify([{blueprint:'co_contact',identifier:'contact',properties:{first_name:'Synthetic'},relations:{}}])});
 expect((await t.query(api.entities.get,{tenantId:'a',blueprint:'co_contact',identifier:'contact'}))?.identifier).toBe('contact');
});
