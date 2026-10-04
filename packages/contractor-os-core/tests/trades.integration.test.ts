import {convexTest} from 'convex-test';
import {expect,test} from 'vitest';
import {components,api,internal} from '../examples/convex/_generated/api.js';
import hostSchema from '../examples/convex/schema.js';
import coreSchema from '../src/component/schema.js';
import paintingSchema from '../src/trades/painting/component/schema.js';
import {api as paintingApi} from '../src/trades/painting/component/_generated/api.js';
import {PaintingClient} from '../src/trades/painting/client.js';
import {TRADE_FIELDS} from '../src/shared/tradeManifest.js';
const hostModules=import.meta.glob('../examples/convex/**/*.ts');
const coreModules=import.meta.glob('../src/component/**/*.ts');
const paintingModules=import.meta.glob('../src/trades/painting/component/**/*.ts');
const allModules=import.meta.glob('../src/trades/*/component/**/*.ts');
const schemas=import.meta.glob('../src/trades/*/component/schema.ts',{eager:true,import:'default'});
const packet=(key:string,tenantId='a')=>({tenantId,actorId:'issuer|test',identifier:'same',requestKey:key,properties:{}});
function host(){const t=convexTest(hostSchema,hostModules);t.registerComponent('contractorOs',coreSchema,coreModules);t.registerComponent('contractorPainting',paintingSchema,paintingModules);return t;}
async function member(t:ReturnType<typeof host>,tenantId='a',role:'admin'|'viewer'='admin',identity=`issuer|${tenantId}`){await t.mutation(internal.memberships.set,{tokenIdentifier:identity,tenantId,role,enabled:true});return t.withIdentity({tokenIdentifier:identity});}
for(const trade of Object.keys(TRADE_FIELDS))test(`SDK trade ${trade}: independent schema rejects mixed fields`,async()=>{
 const prefix=`../src/trades/${trade}/component/`;
 const schema=schemas[prefix+'schema.ts'] as typeof paintingSchema;
 const modules=Object.fromEntries(Object.entries(allModules).filter(([key])=>key.startsWith(prefix)));
 const t=convexTest(schema,modules);
 await t.mutation(paintingApi.records.create,packet('create'));
 expect((await t.query(paintingApi.records.get,{tenantId:'a',identifier:'same'}))?.revision).toBe(1);
 const properties=trade==='roofing'?{paint_finish:'flat'}:{roof_type:'metal'};
 await expect(t.mutation(paintingApi.records.create,{...packet('bad'),identifier:'bad',properties} as any)).rejects.toThrow();
 await expect(t.mutation(paintingApi.records.update,{...packet('bad-update'),expectedRevision:1,properties} as any)).rejects.toThrow();
 await expect(t.mutation(paintingApi.records.update,{...packet('bad-unset'),expectedRevision:1,unsetProperties:[Object.keys(properties)[0]!]})).rejects.toThrow('WRONG_TRADE_FIELD');
 expect(await t.query(paintingApi.records.get,{tenantId:'a',identifier:'bad'})).toBeNull();
});
test('SDK mounted components and same-trade instances isolate tenant, identifier and request keys',async()=>{
 const t=host();t.registerComponent('paintingSecond',paintingSchema,paintingModules);
 const {componentsGeneric}=await import('convex/server');
 const second=componentsGeneric().paintingSecond as unknown as typeof components.contractorPainting;
 const first=await t.mutation(components.contractorPainting.records.create,packet('key'));
 const next=await t.mutation(second.records.create,{...packet('key'),properties:{paint_finish:'flat'}});
 // Component IDs are opaque and may have equal encodings in different stores.
 expect(first.revision).toBe(1);expect(next.revision).toBe(1);
 expect((await t.query(components.contractorPainting.records.get,{tenantId:'a',identifier:'same'}))?.properties).toEqual({});
 expect((await t.query(second.records.get,{tenantId:'a',identifier:'same'}))?.properties).toEqual({paint_finish:'flat'});
 expect(await t.query(second.records.get,{tenantId:'b',identifier:'same'})).toBeNull();
});
test('SDK trade mutation idempotency, revision, audit and multi-page pagination',async()=>{
 const t=convexTest(paintingSchema,paintingModules),p={...packet('create'),properties:{number_of_coats:2}};
 await t.mutation(paintingApi.records.create,p);
 const u={...packet('update'),expectedRevision:1,properties:{paint_finish:'flat' as const}};
 await t.mutation(paintingApi.records.update,u);
 expect((await t.mutation(paintingApi.records.create,p)).revision).toBe(1);
 expect((await t.mutation(paintingApi.records.update,u)).replayed).toBe(true);
 await expect(t.mutation(paintingApi.records.update,{...u,requestKey:'stale'})).rejects.toThrow('REVISION_CONFLICT');
 await expect(t.mutation(paintingApi.records.create,{...p,properties:{number_of_coats:3}})).rejects.toThrow('IDEMPOTENCY_KEY_CONFLICT');
 await expect(t.mutation(paintingApi.records.update,{...u,requestKey:'ambiguous',expectedRevision:2,unsetProperties:['paint_finish']})).rejects.toThrow('AMBIGUOUS_PATCH');
 await expect(t.mutation(paintingApi.records.update,{...u,tenantId:'b',requestKey:'foreign'})).rejects.toThrow('RECORD_NOT_FOUND');
 await t.mutation(paintingApi.records.create,{...packet('second'),identifier:'second'});
 const one=await t.query(paintingApi.records.list,{tenantId:'a',paginationOpts:{cursor:null,numItems:1}});
 const two=await t.query(paintingApi.records.list,{tenantId:'a',paginationOpts:{cursor:one.continueCursor,numItems:1}});
 expect(one.page).toHaveLength(1);expect(two.page).toHaveLength(1);expect(one.page[0]!._id).not.toBe(two.page[0]!._id);
 expect((await t.query(paintingApi.records.list,{tenantId:'b',paginationOpts:{cursor:null,numItems:1}})).page).toEqual([]);
 await t.run(async ctx=>{expect(await ctx.db.query('events').collect()).toHaveLength(3);});
});
test('SDK host rejects anonymous, viewer and spoofed context',async()=>{
 const base=host(),args={identifier:'same',requestKey:'same',properties:{}};
 await expect(base.mutation(api.trades.createPainting,args)).rejects.toThrow('UNAUTHENTICATED');
 const viewer=await member(base,'a','viewer');await expect(viewer.mutation(api.trades.createPainting,args)).rejects.toThrow('FORBIDDEN');
 const admin=await member(base,'b');await expect(admin.mutation(api.trades.createPainting,{...args,tenantId:'a'} as any)).rejects.toThrow();
});
test('SDK host validates core references in bound instance and tenant before any write',async()=>{
 const base=host(),a=await member(base,'a'),b=await member(base,'b');
 await base.mutation(components.contractorOs.records.co_scope.create,{...packet('scope'),identifier:'scope'});
 await base.mutation(components.contractorOs.records.co_pricing_rule.create,{...packet('rate'),identifier:'rate'});
 const args={identifier:'spec',requestKey:'spec',properties:{},coreReferences:{scope:'scope',pricing_rule:'rate'}};
 await a.mutation(api.trades.createPainting,args);
 await expect(b.mutation(api.trades.createPainting,args)).rejects.toThrow('CORE_REFERENCE_MISSING');
 await expect(a.mutation(api.trades.createPainting,{...args,identifier:'bad',requestKey:'bad',coreReferences:{scope:'rate'}})).rejects.toThrow('CORE_REFERENCE_MISSING');
 expect(await a.query(api.trades.getPainting,{identifier:'bad'})).toBeNull();
 expect(await b.query(api.trades.getPainting,{identifier:'spec'})).toBeNull();
 await expect(a.mutation(api.trades.updatePainting,{identifier:'spec',requestKey:'bad-update',expectedRevision:1,coreReferences:{scope:'missing'}})).rejects.toThrow('CORE_REFERENCE_MISSING');
 expect((await a.query(api.trades.getPainting,{identifier:'spec'}))?.revision).toBe(1);
});
test('SDK trade accepts identity lengths already supported by shared core',async()=>{
 const base=host(),a=await member(base,'a','admin','x'.repeat(513));
 await a.mutation(api.trades.createPainting,{identifier:'same',requestKey:'same',properties:{}});
 expect((await a.query(api.trades.getPainting,{identifier:'same'}))?.revision).toBe(1);
});
test('SDK host-client calculation derives trade, supplies time and preserves unit warning',async()=>{
 const base=host(),a=await member(base);
 await a.mutation(api.trades.createPainting,{identifier:'spec',requestKey:'spec',properties:{measurement_value:700,measurement_unit:'units'}});
 await a.run(async ctx=>{
  const client=new PaintingClient(components.contractorPainting,components.contractorOs,async()=>({tenantId:'a',permissions:['read']}));
  const result=await client.calculations(ctx,'spec');
  expect(result?.estimated_gallons).toMatchObject({status:'computed',value:2});
  expect(result?.warnings).toContain('SOURCE_FORMULA_ASSUMES_SQUARE_FEET');
 });
});
test('SDK host client cannot resolve a core reference from a different mounted instance',async()=>{
 const base=host();base.registerComponent('otherCore',coreSchema,coreModules);
 await base.mutation(components.contractorOs.records.co_scope.create,{...packet('scope'),identifier:'only-first-core'});
 const a=await member(base);
 const {componentsGeneric}=await import('convex/server');
 const other=componentsGeneric().otherCore as unknown as typeof components.contractorOs;
 await expect(a.run(async ctx=>{
  const client=new PaintingClient(components.contractorPainting,other,async()=>({tenantId:'a',permissions:['write']}));
  await client.create(ctx,{identifier:'bad-instance',requestKey:'bad-instance',properties:{},coreReferences:{scope:'only-first-core'}});
 })).rejects.toThrow('CORE_REFERENCE_MISSING');
 expect(await a.query(api.trades.getPainting,{identifier:'bad-instance'})).toBeNull();
});
