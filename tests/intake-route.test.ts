import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire, registerHooks} from 'node:module';
const fixture = (name: string) => new URL(`./fixtures/workspace-onboarding/${name}`, import.meta.url).href;
const hooks = registerHooks({resolve(specifier, context, nextResolve) {
  if (specifier === 'next/server') return {url: new URL('./fixtures/auth-routes/next.cjs', import.meta.url).href, shortCircuit: true};
  if (specifier === '@/lib/intake-server') return {url: fixture('intake.cjs'), shortCircuit: true};
  if (specifier === '@/lib/local-runtime' || (specifier === './local-runtime' && context.parentURL?.endsWith('/http.ts'))) return {url: fixture('local.cjs'), shortCircuit: true};
  if (specifier.startsWith('@/lib/')) return {url: new URL(`../apps/web/src/lib/${specifier.slice(6)}.ts`, import.meta.url).href, shortCircuit: true};
  return nextResolve(specifier, context);
}});
const route = createRequire(import.meta.url)('../apps/web/src/app/api/intake/route.ts') as {GET(request: Request): Promise<Response>; POST(request: Request): Promise<Response>};
const seam = globalThis as typeof globalThis & {[key: symbol]: unknown};
const settings = {enabled: true, servicePostalCodes: ['55401'], supportedProjectTypes: ['interior'], consentText: 'Consent'};
const input = {workspaceId: 'company', expectedRevision: 0, requestKey: 'intent', settings};
const request = (body: unknown = input, origin = 'https://painter.test') => new Request('https://painter.test/api/intake', {method: 'POST', headers: {origin, host: 'painter.test'}, body: JSON.stringify(body)});
test('actual authenticated route maps permissions and revisions without returning private data', async () => {
  for (const [code, status] of [['UNAUTHENTICATED', 401], ['FORBIDDEN', 403], ['REVISION_CONFLICT', 409]] as const) {
    seam[Symbol.for('painter.intake.route.test')] = async () => {throw new Error(code);};
    assert.equal((await route.POST(request())).status, status);
  }
  const calls: unknown[][] = [];
  seam[Symbol.for('painter.intake.route.test')] = async (...args: unknown[]) => {calls.push(args); return args[0] === 'read' ? {...settings, revision: 1} : {revision: 2, enabled: true, replayed: false};};
  const get = Object.assign(new Request('https://painter.test/api/intake?workspaceId=company'), {nextUrl: new URL('https://painter.test/api/intake?workspaceId=company')});
  const response = await route.GET(get);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), {settings: {...settings, revision: 1}});
  assert.equal((await route.POST(request())).status, 200);
  assert.deepEqual(calls, [['read', 'company'], ['save', input]]);
});
test('origin, forged authority and local unavailability stop before cloud operations', async () => {
  let calls = 0; seam[Symbol.for('painter.intake.route.test')] = async () => {calls++;};
  assert.equal((await route.POST(request(input, 'https://other.test'))).status, 403);
  assert.equal((await route.POST(request({...input, role: 'owner'}))).status, 400);
  seam[Symbol.for('painter.workspace.local.test')] = true;
  try {assert.equal((await route.POST(request())).status, 503);} finally {seam[Symbol.for('painter.workspace.local.test')] = false;}
  assert.equal(calls, 0);
});
test.after(() => hooks.deregister());
