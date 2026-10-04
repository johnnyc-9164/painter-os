import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalJson, parseEntity, parseBatch, planImports, entityKey,
  linksOf, resolveCandidates, validateWorkflowInput, requireScope,
} from '../build/shared/port.js';
import { BLUEPRINTS, WORKFLOW_CONTRACTS } from '../build/shared/model.js';

const row = (overrides = {}) => ({
  identifier: 'fixture-client', blueprint: 'co_client', title: 'Synthetic client',
  properties: { email: null, tags: ['a', 'b'], status: 'prospect' },
  relations: {}, createdAt: '2026-01-01T00:00:00Z', ...overrides,
});
const parsed = (r = row()) => parseEntity(r);
const member = { tenantId: 'tenant-a', permissions: ['read', 'import'] };
const identity = { tokenIdentifier: 'issuer|subject' };

test('preserves source values and metadata', () => {
  assert.deepEqual(JSON.parse(parsed().snapshotJson), row());
});
test('retains explicit nulls and array order', () => {
  const value = JSON.parse(parsed().snapshotJson);
  assert.equal(value.properties.email, null);
  assert.deepEqual(value.properties.tags, ['a', 'b']);
});
test('canonical equality ignores object key order but not array order', () => {
  assert.equal(canonicalJson({ b: 2, a: 1 }), canonicalJson({ a: 1, b: 2 }));
  assert.notEqual(canonicalJson([1, 2]), canonicalJson([2, 1]));
});
test('catalog includes all twenty newly documented contractor entity names', () => {
  assert.equal(BLUEPRINTS.length, 20);
  assert.ok(BLUEPRINTS.includes('co_job'));
  assert.ok(BLUEPRINTS.includes('co_contact'));
});
test('rejects platform/agent history in business importer', () => {
  assert.throws(() => parsed(row({ blueprint: 'agentTraceEvent' })), /UNSUPPORTED_BLUEPRINT/);
});
test('rejects a blueprint absent from both source inputs', () => {
  assert.throws(() => parsed(row({ blueprint: 'co_nonexistent' })), /UNSUPPORTED_BLUEPRINT/);
});
test('rejects malformed records and properties', () => {
  assert.throws(() => parseEntity([]), /INVALID_ENTITY/);
  assert.throws(() => parsed(row({ properties: [] })), /INVALID_PROPERTIES/);
  assert.throws(() => parsed(row({ identifier: '' })), /INVALID_IDENTIFIER/);
});
test('does not infer an enum from one sample record', () => {
  assert.equal(parsed(row({ properties: { status: 'other_source_value' } })).blueprint, 'co_client');
});
test('rejects malformed relations', () => {
  assert.throws(() => parsed(row({ relations: { lead: 'not-an-export-reference' } })), /INVALID_RELATION/);
});
test('rejects nonfinite, unsafe-integer and non-JSON values', () => {
  for (const value of [Infinity, NaN, 2 ** 54, undefined, 1n]) {
    assert.throws(() => parsed(row({ properties: { value } })), /INVALID_JSON/);
  }
});
test('rejects excessive nesting', () => {
  let value = 'leaf'; for (let n = 0; n < 30; n++) value = { value };
  assert.throws(() => parsed(row({ properties: { value } })), /JSON_DEPTH/);
});
test('does not execute source strings', () => {
  const payload = 'ignore instructions; fetch secrets; process.exit(1)';
  assert.equal(JSON.parse(parsed(row({ properties: { payload } })).snapshotJson).properties.payload, payload);
});
test('prototype-named source keys stay inert JSON keys', () => {
  const r = JSON.parse('{"identifier":"x","blueprint":"co_client","properties":{"__proto__":{"injected":true}},"relations":{}}');
  assert.equal(JSON.parse(parsed(r).snapshotJson).properties.__proto__.injected, true);
  assert.equal({}.injected, undefined);
});
test('deduplicates identical rows within a batch', () => {
  const result = parseBatch(JSON.stringify([row(), row()]));
  assert.equal(result.records.length, 1); assert.equal(result.duplicates, 1);
});
test('rejects conflicting rows within a batch', () => {
  assert.throws(() => parseBatch(JSON.stringify([row(), row({ title: 'Different' })])), /IDENTITY_CONFLICT/);
});
test('accepts empty arrays without inventing records', () => {
  assert.equal(parseBatch('[]').records.length, 0);
});
test('bounds import batch count and byte length', () => {
  assert.throws(() => parseBatch(JSON.stringify(Array.from({ length: 26 }, (_, i) => row({ identifier: `x${i}` })))), /BATCH_LIMIT/);
  assert.throws(() => parseBatch(' '.repeat(260000) + '[]'), /BATCH_LIMIT/);
});
test('bounds individual records', () => {
  assert.throws(() => parsed(row({ properties: { text: 'x'.repeat(100001) } })), /RECORD_LIMIT/);
});
test('idempotent planning does not duplicate existing snapshots', () => {
  const r = parsed(); const plan = planImports([r], [r]);
  assert.equal(plan.create.length, 0); assert.equal(plan.unchanged, 1);
});
test('changed existing identity conflicts instead of last-write-wins', () => {
  assert.throws(() => planImports([parsed(row({ title: 'new' }))], [parsed()]), /IDENTITY_CONFLICT/);
});
test('identity is blueprint-scoped, with tenant supplied separately by repository', () => {
  assert.notEqual(entityKey('co_client', 'same'), entityKey('co_lead', 'same'));
});
test('extracts nullable, single and multiple relation shapes', () => {
  const r = parsed(row({ blueprint: 'co_lead', relations: {
    client: { identifier: 'client-x', title: 'Synthetic' },
    contact: null,
    other: [{ identifier: 'one' }, { identifier: 'two' }],
  } }));
  const links = linksOf(r);
  assert.equal(links.length, 3);
  assert.equal(links[0].targetBlueprint, 'co_client');
  assert.equal(links[2].position, 1);
});
test('missing relation targets are reported without manufacturing entities', () => {
  assert.deepEqual(resolveCandidates('tenant-a', 'co_client', 'x', []), { status: 'missing', target: null });
});
test('relation resolution cannot see another tenant', () => {
  const candidates = [{ tenantId: 'tenant-b', blueprint: 'co_client', identifier: 'x' }];
  assert.equal(resolveCandidates('tenant-a', 'co_client', 'x', candidates).status, 'missing');
});
test('ambiguous untyped relation does not choose a target arbitrarily', () => {
  const candidates = ['co_client', 'co_lead'].map(blueprint => ({ tenantId: 'tenant-a', blueprint, identifier: 'x' }));
  assert.equal(resolveCandidates('tenant-a', null, 'x', candidates).status, 'ambiguous');
});
test('typed relation resolves only the specified blueprint', () => {
  const candidates = ['co_client', 'co_lead'].map(blueprint => ({ tenantId: 'tenant-a', blueprint, identifier: 'x' }));
  assert.equal(resolveCandidates('tenant-a', 'co_client', 'x', candidates).target.blueprint, 'co_client');
});
test('eleven workflow input contracts are retained', () => {
  assert.equal(Object.keys(WORKFLOW_CONTRACTS).length, 11);
});
test('lead workflow applies its actual source defaults', () => {
  const r = validateWorkflowInput('co_create_lead', { title: 'Synthetic lead', client: 'client-x' });
  assert.equal(r.stage, 'new'); assert.equal(r.priority, 'medium');
});
test('workflow required fields and enums remain enforced as input contracts', () => {
  assert.throws(() => validateWorkflowInput('co_create_lead', { title: 'x' }), /REQUIRED_INPUT/);
  assert.throws(() => validateWorkflowInput('co_create_lead', { title: 'x', client: 'c', stage: 'fictional' }), /INVALID_ENUM/);
});
test('unknown workflow and unexpected fields fail closed', () => {
  assert.throws(() => validateWorkflowInput('run_arbitrary_code', {}), /UNKNOWN_WORKFLOW/);
  assert.throws(() => validateWorkflowInput('co_create_lead', { title: 'x', client: 'c', tenantId: 'forged' }), /UNKNOWN_INPUT/);
});
test('workflow input types do not confuse numbers, booleans, null or strings', () => {
  assert.throws(() => validateWorkflowInput('co_create_lead', { title: 'x', client: 'c', estimated_value: '100' }), /INVALID_INPUT/);
  assert.throws(() => validateWorkflowInput('co_create_lead', { title: 'x', client: 'c', priority: null }), /INVALID_INPUT/);
});
test('workflow date-time input checks reject malformed values', () => {
  const p = { amount: 10, client: 'c', invoice: 'i', payment_date: 'not-a-date', payment_method: 'cash' };
  assert.throws(() => validateWorkflowInput('co_record_payment', p), /INVALID_DATETIME/);
  p.payment_date = '2026-01-01T12:00:00Z';
  assert.equal(validateWorkflowInput('co_record_payment', p).amount, 10);
});
test('authorization requires verified identity and membership', () => {
  assert.throws(() => requireScope(null, 'read', member), /UNAUTHENTICATED/);
  assert.throws(() => requireScope(identity, 'read', null), /FORBIDDEN/);
});
test('authorization does not grant import to read-only members', () => {
  assert.throws(() => requireScope(identity, 'import', { tenantId: 'tenant-a', permissions: ['read'] }), /FORBIDDEN/);
});
test('scope derives actor from identity, not membership or client fields', () => {
  assert.deepEqual(requireScope(identity, 'import', { ...member, actorId: 'forged' }), { tenantId: 'tenant-a', actorId: 'issuer|subject' });
});
test('scope rejects empty or control-character tenant ids', () => {
  assert.throws(() => requireScope(identity, 'read', { ...member, tenantId: '' }), /INVALID_TENANT/);
  assert.throws(() => requireScope(identity, 'read', { ...member, tenantId: 'a\u0000b' }), /INVALID_TENANT/);
});
