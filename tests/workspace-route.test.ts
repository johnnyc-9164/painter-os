import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire, registerHooks } from 'node:module';
const fixture = (name: string) => new URL(`./fixtures/workspace-onboarding/${name}`, import.meta.url).href;
const hooks = registerHooks({resolve(specifier, context, nextResolve) {
  if (specifier === 'next/server') return {url: new URL('./fixtures/auth-routes/next.cjs', import.meta.url).href, shortCircuit: true};
  if (specifier === '@/lib/auth-server') return {url: fixture('cloud.cjs'), shortCircuit: true};
  if (specifier === '@painter-os-bts/backend/convex/runtime') return {url: fixture('api.cjs'), shortCircuit: true};
  if (specifier === '@/lib/local-runtime' || (specifier === './local-runtime' && context.parentURL?.endsWith('/http.ts'))) return {url: fixture('local.cjs'), shortCircuit: true};
  if (specifier === '@/lib/http') return {url: new URL('../apps/web/src/lib/http.ts', import.meta.url).href, shortCircuit: true};
  if (specifier === '@/lib/workspace-onboarding') return {url: new URL('../apps/web/src/lib/workspace-onboarding.ts', import.meta.url).href, shortCircuit: true};
  return nextResolve(specifier, context);
}});
const {POST} = createRequire(import.meta.url)('../apps/web/src/app/api/workspaces/route.ts') as {POST(request: Request): Promise<Response>};
const seam = globalThis as typeof globalThis & {[key: symbol]: unknown};
const request = (body: unknown, origin = 'https://painter.test') => new Request('https://painter.test/api/workspaces', {method: 'POST', headers: {origin, host: 'painter.test', 'content-type': 'application/json'}, body: JSON.stringify(body)});

test('actual onboarding route delegates only normalized name and initial-setup flag', async () => {
  const calls: unknown[][] = [];
  seam[Symbol.for('painter.workspace.route.test')] = async (...args: unknown[]) => {calls.push(args); return {id: 'company', name: 'Acme'};};
  const response = await POST(request({name: ' Acme '}));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), {workspace: {id: 'company', name: 'Acme'}});
  assert.deepEqual(calls, [['painter:createWorkspace', {name: 'Acme', onlyIfNone: true}]]);
});

test('actual route rejects origin and forged authority before calling writer', async () => {
  let calls = 0;
  seam[Symbol.for('painter.workspace.route.test')] = async () => {calls++;};
  assert.equal((await POST(request({name: 'Acme'}, 'https://other.test'))).status, 403);
  for (const field of ['role', 'userId', 'demo', 'workspaceId']) assert.equal((await POST(request({name: 'Acme', [field]: 'owner'}))).status, 400);
  assert.equal((await POST(request({name: ' '}))).status, 400);
  assert.equal(calls, 0);
});

test('actual route preserves unauthenticated denial and local isolation', async () => {
  seam[Symbol.for('painter.workspace.route.test')] = async () => {throw new Error('UNAUTHENTICATED');};
  assert.equal((await POST(request({name: 'Acme'}))).status, 401);
  seam[Symbol.for('painter.workspace.local.test')] = true;
  try {
    assert.deepEqual(await (await POST(Object.assign(request({name: 'Acme'}), {cookies: {get: () => ({value: 'local-session'})}}))).json(), {workspace: {id: 'local-company', name: 'Local Painting'}});
  } finally {
    seam[Symbol.for('painter.workspace.local.test')] = false;
  }
});
test.after(() => hooks.deregister());
