import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
// The web workspace has no type:module; tsx compiles these helpers as CommonJS.
// require also supports native Node 24 type stripping, so both runners exercise them.
const require = createRequire(import.meta.url);
const { createIntentKeys } = require('../apps/web/src/lib/command-intent.ts') as typeof import('../apps/web/src/lib/command-intent.ts');
const { runtimeLabels } = require('../apps/web/src/lib/runtime-label.ts') as typeof import('../apps/web/src/lib/runtime-label.ts');

test('runtime identifiers win over display text and cloud demo is not labeled local', () => {
  const runtime = { storage: 'Convex transactional database', integrations: 'Metadata only', demo: false };
  assert.equal(runtimeLabels({ ...runtime, kind: 'convex' }).mini, 'Convex runtime');
  assert.equal(runtimeLabels({ ...runtime, kind: 'local' }).mini, 'Local verification runtime');
  assert.equal(runtimeLabels({ ...runtime, kind: 'convex', demo: true }).banner, 'SYNTHETIC DEMO · CONVEX RUNTIME');
  assert.equal(runtimeLabels(runtime).mini, 'Runtime unavailable');
});

const command = { action: 'payment.record', input: { invoiceId: 'invoice-1', amount: 25, reference: 'receipt-1' } };
test('ambiguous transport failure retries the wire command with its original key', async () => {
  let next = 0;
  const intents = createIntentKeys(() => `key-${++next}`);
  const keys: string[] = [];
  const send = async (wire: { requestKey: string }) => {
    keys.push(wire.requestKey);
    if (keys.length === 1) throw new Error('Timeout after submission');
    return { replayed: true };
  };
  await assert.rejects(intents.submit('tenant/user', command, send), /Timeout/);
  assert.deepEqual(await intents.submit('tenant/user', command, send), { replayed: true });
  assert.deepEqual(keys, ['key-1', 'key-1']);
  await intents.submit('tenant/user', command, send);
  assert.deepEqual(keys, ['key-1', 'key-1', 'key-2']);
});
test('timeout or unreadable response retains the same key on retry', () => {
  let next = 0;
  const intents = createIntentKeys(() => `key-${++next}`);
  const first = intents.begin('tenant/user', command);
  assert.equal(intents.begin('tenant/user', command).requestKey, first.requestKey);
  assert.equal(next, 1);
});
test('changed input, revision, actor or workspace starts a different intent', () => {
  let next = 0;
  const intents = createIntentKeys(() => `key-${++next}`);
  const first = intents.begin('tenant/user', command);
  assert.notEqual(intents.begin('tenant/user', { ...command, input: { ...command.input, amount: 30 } }).requestKey, first.requestKey);
  assert.notEqual(intents.begin('tenant/user', { ...command, expectedRevision: 2 }).requestKey, first.requestKey);
  assert.notEqual(intents.begin('other/user', command).requestKey, first.requestKey);
  assert.equal(intents.begin('tenant/user', command).requestKey, first.requestKey);
});
test('confirmed completion retires only that intent and retry ordering ignores object key order', () => {
  let next = 0;
  const intents = createIntentKeys(() => `key-${++next}`);
  const first = intents.begin('tenant/user', command);
  const other = intents.begin('tenant/user', { ...command, action: 'invoice.issue' });
  assert.equal(intents.begin('tenant/user', { input: { reference: 'receipt-1', amount: 25, invoiceId: 'invoice-1' }, action: 'payment.record' }).requestKey, first.requestKey);
  intents.complete(first);
  assert.notEqual(intents.begin('tenant/user', command).requestKey, first.requestKey);
  assert.equal(intents.begin('tenant/user', { ...command, action: 'invoice.issue' }).requestKey, other.requestKey);
});
