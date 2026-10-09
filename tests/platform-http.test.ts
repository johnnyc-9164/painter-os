import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import type { PlatformReads } from '../apps/web/src/lib/platform-http.ts';
const { platformActivityResponse, platformAccessResponse, platformWorkspacesResponse, platformWorkspaceResponse } = createRequire(import.meta.url)('../apps/web/src/lib/platform-http.ts') as typeof import('../apps/web/src/lib/platform-http.ts');

function reads(state: 'ready' | 'denied' | 'unauthenticated' = 'ready'): PlatformReads {
  return {
    activity: async () => state === 'ready' ? { state, items: [], nextCursor: null } : { state },
    access: async () => ({ state }),
    list: async () => state === 'ready' ? { state, items: [], nextCursor: null } : { state },
    get: async () => state === 'ready' ? { state: 'not_found' } : { state },
  };
}
test('platform HTTP statuses preserve anonymous, denied, unavailable and ready states without caching', async () => {
  for (const [state, status] of [['ready', 200], ['unauthenticated', 401], ['denied', 403]] as const) {
    const response = await platformAccessResponse(reads(state));
    assert.equal(response.status, status); assert.deepEqual(await response.json(), { state });
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('vary'), 'Cookie');
    assert.equal((await platformWorkspacesResponse(new Request('http://localhost/api/platform/workspaces'), reads(state))).status, status);
  }
  for (const reason of ['local_runtime', 'not_configured', 'backend_unavailable'] as const) {
    const response = await platformAccessResponse({ ...reads(), access: async () => ({ state: 'unavailable', reason }) });
    assert.equal(response.status, 503); assert.deepEqual(await response.json(), { state: 'unavailable', reason });
  }
});
test('platform transport sends only bounded cursor/limit and rejects browser-selected role/table', async () => {
  let captured: unknown;
  const service = { ...reads(), list: async (args: unknown) => { captured = args; return { state: 'ready' as const, items: [], nextCursor: null }; } };
  assert.equal((await platformWorkspacesResponse(new Request('http://localhost/?cursor=opaque&limit=3'), service)).status, 200);
  assert.deepEqual(captured, { cursor: 'opaque', limit: 3 });
  for (const query of ['limit=0', 'limit=51', 'limit=1.5', 'limit=2&limit=3', 'table=painterEntities', 'role=owner', 'cursor=', `cursor=${'x'.repeat(4097)}`]) {
    captured = null;
    assert.equal((await platformWorkspacesResponse(new Request(`http://localhost/?${query}`), service)).status, 400);
    assert.equal(captured, null);
  }
});
test('backend failures remain unavailable and redact stack traces; known invalid input remains 400', async () => {
  for (const message of ['network failed: private-host', '[Request ID: secret]\nUncaught Error: DATABASE_UNAVAILABLE\n  at private-path']) {
    const response = await platformAccessResponse({ ...reads(), access: async () => { throw new Error(message); } });
    assert.equal(response.status, 503); assert.deepEqual(await response.json(), { state: 'unavailable', reason: 'backend_unavailable' });
  }
  const bad = await platformWorkspaceResponse('bad', { ...reads(), get: async () => { throw new Error('INVALID_PLATFORM_WORKSPACE'); } });
  assert.equal(bad.status, 400); assert.deepEqual(await bad.json(), { state: 'invalid_request' });
  assert.equal((await platformWorkspaceResponse('unknown', reads())).status, 404);
});

test('activity transport is bounded, private and preserves authorization and errors', async () => {
  for (const [state, status] of [['ready', 200], ['denied', 403], ['unauthenticated', 401]] as const) {
    const response = await platformActivityResponse(new Request('http://localhost/api/platform/activity'), reads(state));
    assert.equal(response.status, status); assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(response.headers.get('vary'), 'Cookie');
  }
  let called = false;
  const service = { ...reads(), activity: async () => { called = true; throw new Error('private audit receipt'); } };
  assert.equal((await platformActivityResponse(new Request('http://localhost/?limit=51'), service)).status, 400); assert.equal(called, false);
  const failed = await platformActivityResponse(new Request('http://localhost/'), service);
  assert.equal(failed.status, 503); assert.deepEqual(await failed.json(), { state: 'unavailable', reason: 'backend_unavailable' });
});
