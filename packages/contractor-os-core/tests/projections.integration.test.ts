/** Official convex-test suite. Authored here; requires real dependency installation and codegen. */
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';
import schema from '../src/component/schema.js';
import { api } from '../src/component/_generated/api.js';
const modules = import.meta.glob('../src/component/**/*.ts');
test('SDK projection: typed trade fields and supplied JQ calculation', async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.records.co_trade_spec.create, {
    tenantId: 'a', actorId: 'synthetic', identifier: 'trade', requestKey: 'trade',
    properties: {trade:'painting',measurement_value:700,number_of_coats:2,paint_finish:'eggshell'},
  });
  const result = await t.query(api.projections.get, {tenantId:'a',blueprint:'co_trade_spec',identifier:'trade',asOf:0});
  expect(result?.calculations.estimated_gallons?.value).toBe(4);
});
test('SDK projection: rejects a many value for a single-ID relation at validator boundary', async () => {
  const t = convexTest(schema, modules);
  await expect(t.mutation(api.records.co_contact.create, {
    tenantId:'a',actorId:'synthetic',identifier:'c',requestKey:'c',properties:{},
    // @ts-expect-error Deliberately invalid cardinality is part of this runtime validation test.
    relations:{client:[]},
  })).rejects.toThrow();
});
test('SDK projection: tenant read does not expose a different tenant record', async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.records.co_client.create, {tenantId:'a',actorId:'synthetic',identifier:'c',requestKey:'c',properties:{}});
  expect(await t.query(api.projections.get,{tenantId:'b',blueprint:'co_client',identifier:'c',asOf:0})).toBeNull();
});
test('SDK projection: mirrors use stored local IDs', async () => {
  const t = convexTest(schema, modules);
  const client = await t.mutation(api.records.co_client.create,{tenantId:'a',actorId:'synthetic',identifier:'c',requestKey:'c',title:'Synthetic',properties:{}});
  await t.mutation(api.records.co_contact.create,{tenantId:'a',actorId:'synthetic',identifier:'p',requestKey:'p',properties:{first_name:'Test'},relations:{client:client.id}});
  const result=await t.query(api.projections.get,{tenantId:'a',blueprint:'co_contact',identifier:'p',asOf:0});
  expect(result?.mirrors.client_name?.value).toBe('Synthetic');
});
