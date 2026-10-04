// Executes the real adapter handlers against explicit test doubles, NOT Convex.
// This does not verify Convex validators, codegen, transaction isolation or limits.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as core from '../build/shared/port.js';
import * as model from '../build/shared/model.js';
const require = createRequire(import.meta.url);
let ts;
try { ts = require('typescript'); } catch {
  const root = execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['root', '-g'], { encoding: 'utf8' }).trim();
  ts = createRequire(join(root, '_test_loader.cjs'))('typescript');
}
const fakeV = new Proxy({}, { get: () => () => ({}) });
function load(path) {
  const text = readFileSync(new URL(path, import.meta.url), 'utf8');
  const js = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const mockedRequire = name => {
    if (name === 'convex/values') return { v: fakeV, ConvexError: Error };
    if (name === 'convex/server') return { paginationOptsValidator: {} };
    if (name === 'convex-helpers/server/pagination') return { paginator: db => ({ query: table => db.query(table, true) }) };
    if (name === './schema.js') return { default: {} };
    if (name.endsWith('_generated/server.js')) return { mutation: d => d, query: d => d };
    if (name.endsWith('validators.js')) return {};
    if (name.endsWith('/port.js')) return core;
    if (name.endsWith('/model.js')) return model;
    throw new Error(`Unexpected dependency in test double: ${name}`);
  };
  // Execute only our local, transpiled source in the same realm as the strict JSON
  // parser. A VM realm gives object literals foreign prototypes (unlike Convex).
  // User/source record contents are never evaluated.
  new Function('exports', 'require', js)(exports, mockedRequire);
  return exports;
}
const fns = load('../src/component/entities.ts');
const { ContractorOS } = load('../src/client.ts');
function database() {
  const tables = { entities: [], events: [], links: [], imports: [] };
  let sequence = 0;
  return {
    tables,
    insert: async (table, row) => {
      const id = `${table}:${++sequence}`;
      tables[table].push({ ...structuredClone(row), _id: id, _creationTime: sequence });
      return id;
    },
    query(table, helperPagination = false) {
      let conditions = [];
      const chain = {
        withIndex(_name, fn) {
          const q = { eq(key, value) { conditions.push([key, value]); return q; } };
          fn(q); return chain;
        },
        rows: () => tables[table].filter(r => conditions.every(([key, value]) => r[key] === value)),
        async unique() { const r = chain.rows(); if (r.length > 1) throw Error('not unique'); return r[0] ?? null; },
        async take(n) { return chain.rows().slice(0, n); },
        async paginate({ cursor, numItems }) {
          if (!helperPagination) throw Error("Native paginate is unsupported inside a Convex component");
          const start = Number(cursor ?? 0), rows = chain.rows(), end = start + numItems;
          return { page: rows.slice(start, end), isDone: end >= rows.length, continueCursor: String(Math.min(end, rows.length)) };
        },
      };
      return chain;
    },
  };
}
function row(blueprint = 'co_client', identifier = 'fixture', other = {}) {
  return { blueprint, identifier, title: 'Synthetic', properties: {}, relations: {}, ...other };
}
function packet(records, tenantId = 'a', requestKey = 'request-1') {
  return { tenantId, requestKey, actorId: 'verified|actor', source: 'fixture.json', recordsJson: JSON.stringify(records) };
}
const call = (name, db, args) => fns[name].handler({ db }, args);

test('adapter double: imports entity, event, links and receipt', async () => {
  const db = database(); const r = await call('importBatch', db, packet([row('co_lead', 'lead', { relations: { client: { identifier: 'client' } } })]));
  assert.equal(r.created, 1); assert.equal(db.tables.events.length, 1); assert.equal(db.tables.links.length, 1);
  assert.equal(db.tables.entities[0].lastEventId, db.tables.events[0]._id);
});
test('adapter double: repeated request is idempotent', async () => {
  const db = database(); const p = packet([row()]); await call('importBatch', db, p);
  const r = await call('importBatch', db, p);
  assert.equal(r.replayed, true); assert.equal(r.created, 0); assert.equal(db.tables.events.length, 1); assert.equal(db.tables.imports.length, 1);
});
test('adapter double: idempotency key cannot be reused for changed content', async () => {
  const db = database(); await call('importBatch', db, packet([row()]));
  await assert.rejects(call('importBatch', db, packet([row('co_client', 'different')])), /IDEMPOTENCY_KEY_CONFLICT/);
  assert.equal(db.tables.entities.length, 1);
});
test('adapter double: new request of unchanged records creates only receipt', async () => {
  const db = database(); await call('importBatch', db, packet([row()]));
  const r = await call('importBatch', db, packet([row()], 'a', 'request-2'));
  assert.equal(r.unchanged, 1); assert.equal(db.tables.events.length, 1); assert.equal(db.tables.imports.length, 2);
});
test('adapter double: same external id stays isolated between tenants', async () => {
  const db = database(); await call('importBatch', db, packet([row('co_client', 'same', { title: 'A' })], 'a'));
  await call('importBatch', db, packet([row('co_client', 'same', { title: 'B' })], 'b'));
  const a = await call('get', db, { tenantId: 'a', blueprint: 'co_client', identifier: 'same' });
  assert.equal(a.title, 'A'); assert.equal(db.tables.entities.length, 2);
});
test('adapter double: conflicts are detected before writes in the batch', async () => {
  const db = database(); await call('importBatch', db, packet([row()]));
  await assert.rejects(call('importBatch', db, packet([row('co_client', 'new'), row('co_client', 'fixture', { title: 'changed' })], 'a', 'request-2')), /IDENTITY_CONFLICT/);
  assert.equal(db.tables.entities.length, 1); assert.equal(db.tables.events.length, 1);
});
test('adapter double: missing target resolves after its later import', async () => {
  const db = database(); await call('importBatch', db, packet([row('co_lead', 'lead', { relations: { client: { identifier: 'later' } } })]));
  const args = { tenantId: 'a', blueprint: 'co_lead', identifier: 'lead' };
  assert.equal((await call('relations', db, args))[0].status, 'missing');
  await call('importBatch', db, packet([row('co_client', 'later')], 'a', 'request-2'));
  assert.equal((await call('relations', db, args))[0].status, 'resolved');
});
test('adapter double: foreign tenant relation target remains invisible', async () => {
  const db = database(); await call('importBatch', db, packet([row('co_client', 'target')], 'b'));
  await call('importBatch', db, packet([row('co_lead', 'lead', { relations: { client: { identifier: 'target' } } })], 'a'));
  assert.equal((await call('relations', db, { tenantId: 'a', blueprint: 'co_lead', identifier: 'lead' }))[0].status, 'missing');
});
test('adapter double: history queries are tenant-scoped', async () => {
  const db = database(); await call('importBatch', db, packet([row('co_client', 'a-record')], 'a'));
  await call('importBatch', db, packet([row('co_client', 'b-record')], 'b'));
  const result = await call('history', db, { tenantId: 'a', paginationOpts: { numItems: 10, cursor: null } });
  assert.equal(result.page.length, 1); assert.equal(result.page[0].identifier, 'a-record');
});
test('adapter double: list filters blueprint and paginates', async () => {
  const db = database(); await call('importBatch', db, packet([row('co_client', '1'), row('co_client', '2'), row('co_lead', '3')]));
  const result = await call('list', db, { tenantId: 'a', blueprint: 'co_client', paginationOpts: { numItems: 1, cursor: null } });
  assert.equal(result.page.length, 1); assert.equal(result.isDone, false);
});
test('adapter double: rejects invalid page size', async () => {
  await assert.rejects(call('list', database(), { tenantId: 'a', blueprint: 'co_client', paginationOpts: { numItems: 101, cursor: null } }), /INVALID_PAGE_SIZE/);
});
test('adapter double: unsupported history cannot be imported as contractor data', async () => {
  const db = database(); await assert.rejects(call('importBatch', db, packet([row('agentTraceEvent')])), /UNSUPPORTED_BLUEPRINT/);
  assert.equal(db.tables.events.length, 0); assert.equal(db.tables.entities.length, 0);
});
function clientFixture(permissions = ['read', 'import'], authenticated = true) {
  const refs = { entities: { get: 'get', list: 'list', relations: 'relations', history: 'history', importBatch: 'import' } };
  const calls = [];
  const ctx = { auth: { getUserIdentity: async () => authenticated ? { tokenIdentifier: 'issuer|real-user' } : null },
    runQuery: async (ref, args) => { calls.push({ ref, args }); return null; },
    runMutation: async (ref, args) => { calls.push({ ref, args }); return null; } };
  const os = new ContractorOS(refs, async () => ({ tenantId: 'real-tenant', permissions }));
  return { os, ctx, calls };
}
test('client double: unauthenticated requests never reach component', async () => {
  const { os, ctx, calls } = clientFixture([], false);
  await assert.rejects(os.get(ctx, { blueprint: 'co_client', identifier: 'x' }), /UNAUTHENTICATED/);
  assert.equal(calls.length, 0);
});
test('client double: read-only member cannot invoke import', async () => {
  const { os, ctx, calls } = clientFixture(['read']);
  await assert.rejects(os.importBatch(ctx, { source: 'fixture', requestKey: 'k', recordsJson: '[]' }), /FORBIDDEN/);
  assert.equal(calls.length, 0);
});
test('client double: extra browser arguments cannot override trusted scope', async () => {
  const { os, ctx, calls } = clientFixture();
  await os.importBatch(ctx, { source: 'fixture', requestKey: 'k', recordsJson: '[]', tenantId: 'forged', actorId: 'forged' });
  assert.equal(calls[0].args.tenantId, 'real-tenant'); assert.equal(calls[0].args.actorId, 'issuer|real-user');
});
test('client double: read wrapper ignores forged tenant fields', async () => {
  const { os, ctx, calls } = clientFixture();
  await os.get(ctx, { blueprint: 'co_client', identifier: 'x', tenantId: 'forged' });
  assert.equal(calls[0].args.tenantId, 'real-tenant');
});
