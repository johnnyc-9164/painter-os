/** Parent-authentication tests using a mounted component in the official SDK test harness. */
import {convexTest} from 'convex-test';
import {test,expect} from 'vitest';
import schema from '../examples/convex/schema.js';
import componentSchema from '../src/component/schema.js';
import {api,internal} from '../examples/convex/_generated/api.js';
const modules=import.meta.glob('../examples/convex/**/*.ts');
const componentModules=import.meta.glob('../src/component/**/*.ts');
function setup(){const t=convexTest(schema,modules);t.registerComponent('contractorOs',componentSchema,componentModules);return t;}
test('SDK host: anonymous command rejected',async()=>{
 const t=setup();await expect(t.mutation(api.backend.co_create_lead,{requestKey:'anon',input:{title:'Synthetic',client:'client'}})).rejects.toThrow('UNAUTHENTICATED');
});
test('SDK host: membership is required for authenticated users',async()=>{
 const t=setup().withIdentity({tokenIdentifier:'issuer|unknown'});await expect(t.query(api.backend.listJobs,{paginationOpts:{numItems:10,cursor:null}})).rejects.toThrow('FORBIDDEN');
});
test('SDK host: viewer cannot write even with a claimed evidence reference',async()=>{
 const base=setup();await base.mutation(internal.memberships.set,{tokenIdentifier:'issuer|viewer',tenantId:'a',enabled:true,role:'viewer'});
 const t=base.withIdentity({tokenIdentifier:'issuer|viewer'});await expect(t.mutation(api.backend.co_create_lead,{requestKey:'viewer',input:{title:'Synthetic',client:'client'}})).rejects.toThrow('FORBIDDEN');
});
test('SDK host: operator has record authority but not signing attestation authority',async()=>{
 const base=setup();await base.mutation(internal.memberships.set,{tokenIdentifier:'issuer|operator',tenantId:'a',enabled:true,role:'operator'});
 const t=base.withIdentity({tokenIdentifier:'issuer|operator'});await expect(t.mutation(api.backend.co_mark_contract_signed,{requestKey:'signed',input:{contract:'missing'},evidence:{kind:'contract_signed',reference:'synthetic',occurredAt:'2020-01-01T00:00:00Z'}})).rejects.toThrow('ATTESTATION_FORBIDDEN');
});
test('SDK host: two tenants can use the same identifier without data leakage',async()=>{
 const base=setup();for(const tenant of ['a','b'])await base.mutation(internal.memberships.set,{tokenIdentifier:`issuer|${tenant}`,tenantId:tenant,enabled:true,role:'admin'});
 const a=base.withIdentity({tokenIdentifier:'issuer|a'}),b=base.withIdentity({tokenIdentifier:'issuer|b'});
 await a.mutation(api.typedRecords.createClient,{identifier:'same',requestKey:'same',title:'A',properties:{}});
 await b.mutation(api.typedRecords.createClient,{identifier:'same',requestKey:'same',title:'B',properties:{}});
 expect((await a.query(api.typedRecords.getClient,{identifier:'same'}))?.title).toBe('A');
 expect((await b.query(api.typedRecords.getClient,{identifier:'same'}))?.title).toBe('B');
});
