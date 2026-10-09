import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
const { workspaceName, companyOnboarding } = createRequire(import.meta.url)('../apps/web/src/lib/workspace-onboarding.ts') as typeof import('../apps/web/src/lib/workspace-onboarding.ts');

test('company name is normalized and authority fields are rejected', () => {
  assert.equal(workspaceName({ name: '  Acme Painting  ' }), 'Acme Painting');
  for (const name of ['', ' ', 'x'.repeat(121), null, 4]) assert.throws(() => workspaceName({ name }), /INVALID_NAME/);
  for (const field of ['role', 'userId', 'ownerId', 'demo', 'onlyIfNone', 'workspaceId']) assert.throws(() => workspaceName({ name: 'Acme', [field]: 'owner' }), /UNKNOWN_FIELD/);
});

test('onboarding provisions submitted company only after successful authentication', async () => {
  const flow = companyOnboarding();
  const calls: string[] = [];
  await flow.submit('  Acme Painting ', {
    signUp: async () => { calls.push('signup'); },
    ensureWorkspace: async name => { calls.push(name); },
  });
  assert.deepEqual(calls, ['signup', 'Acme Painting']);
  assert.equal(flow.pending(), false);
});

test('provisioning retry retains initial company name and does not repeat signup', async () => {
  const flow = companyOnboarding();
  let signups = 0;
  const names: string[] = [];
  const signUp = async () => { signups++; };
  await assert.rejects(flow.submit('Acme', { signUp, ensureWorkspace: async () => { throw new Error('offline'); } }), /offline/);
  assert.equal(flow.pending(), true);
  await flow.submit('Edited form', { signUp, ensureWorkspace: async name => { names.push(name); } });
  assert.equal(signups, 1);
  assert.deepEqual(names, ['Acme']);
  assert.equal(flow.pending(), false);
});

test('authentication failure never invokes provisioning; reset drops pending setup', async () => {
  const flow = companyOnboarding();
  await assert.rejects(flow.submit('Acme', {
    signUp: async () => { throw new Error('ACCOUNT_EXISTS'); },
    ensureWorkspace: async () => { assert.fail('provisioned before authentication'); },
  }), /ACCOUNT_EXISTS/);
  assert.equal(flow.pending(), false);
  await assert.rejects(flow.submit('Acme', { signUp: async () => {}, ensureWorkspace: async () => { throw new Error('offline'); } }));
  flow.reset();
  assert.equal(flow.pending(), false);
});
