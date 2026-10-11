import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire, registerHooks} from 'node:module';
const fixture = (name: string) => new URL(`./fixtures/workspace-onboarding/${name}`, import.meta.url).href;
const hooks = registerHooks({resolve(specifier, context, nextResolve) {
  if (specifier === 'next/server') return {url: new URL('./fixtures/auth-routes/next.cjs', import.meta.url).href, shortCircuit: true};
  if (specifier === '@/lib/contact-intake-server') return {url: fixture('contact-intake.cjs'), shortCircuit: true};
  if (specifier === '@/lib/local-runtime' || (specifier === './local-runtime' && context.parentURL?.endsWith('/http.ts'))) return {url: fixture('local.cjs'), shortCircuit: true};
  if (specifier.startsWith('@/lib/')) return {url: new URL(`../apps/web/src/lib/${specifier.slice(6)}.ts`, import.meta.url).href, shortCircuit: true};
  return nextResolve(specifier, context);
}});
const route = createRequire(import.meta.url)('../apps/web/src/app/api/contact-intake/route.ts') as {GET(request: Request): Promise<Response>; POST(request: Request): Promise<Response>};
const seam = globalThis as typeof globalThis & {[key: symbol]: unknown};
const key = Symbol.for('painter.contact.route.test');
const settings = {enabled: true, consentText: 'We may contact you about your painting request.', acknowledgeRetention: true};
const input = {workspaceId: 'company', expectedRevision: 0, requestKey: 'intent', settings};
const request = (body: unknown = input, origin = 'https://painter.test') => new Request('https://painter.test/api/contact-intake', {method: 'POST', headers: {origin, host: 'painter.test'}, body: JSON.stringify(body)});
const get = () => Object.assign(new Request('https://painter.test/api/contact-intake?workspaceId=company'), {nextUrl: new URL('https://painter.test/api/contact-intake?workspaceId=company')});

test('authorization denials from the existing host map to 401/403 for save and read', async () => {
  // Wrong role -> FORBIDDEN; disabled membership / foreign tenant -> WORKSPACE_MEMBERSHIP_REQUIRED; no session -> UNAUTHENTICATED.
  for (const [code, status] of [['UNAUTHENTICATED', 401], ['FORBIDDEN', 403], ['WORKSPACE_MEMBERSHIP_REQUIRED', 403], ['REVISION_CONFLICT', 409]] as const) {
    seam[key] = async () => {throw new Error(code);};
    assert.equal((await route.POST(request())).status, status, code);
    assert.equal((await route.GET(get())).status, status, code);
  }
});
test('absent policy reads as null (disabled) and a read never writes', async () => {
  const calls: unknown[][] = [];
  seam[key] = async (...args: unknown[]) => {calls.push(args); return null;};
  const response = await route.GET(get());
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), {settings: null});
  assert.deepEqual(calls, [['read', 'company']]);
});
test('save forwards only candidate, revision, key and canonical settings', async () => {
  const calls: unknown[][] = [];
  seam[key] = async (...args: unknown[]) => {calls.push(args); return {revision: 1, enabled: true, replayed: false};};
  assert.equal((await route.POST(request())).status, 200);
  assert.deepEqual(calls, [['save', input]]);
});
test('origin, forged authority, invalid enable and local runtime stop before cloud operations', async () => {
  let calls = 0; seam[key] = async () => {calls++;};
  assert.equal((await route.POST(request(input, 'https://other.test'))).status, 403);
  assert.equal((await route.POST(request({...input, role: 'owner'}))).status, 400);
  assert.equal((await route.POST(request({...input, settings: {...settings, acknowledgeRetention: false}}))).status, 400);
  assert.equal((await route.POST(request({...input, settings: {...settings, consentText: ' '}}))).status, 400);
  assert.equal((await route.POST(request({...input, settings: {...settings, consentText: 'x'.repeat(1001)}}))).status, 400);
  seam[Symbol.for('painter.workspace.local.test')] = true;
  try {
    assert.equal((await route.POST(request())).status, 503);
    assert.equal((await route.GET(get())).status, 503);
  } finally {seam[Symbol.for('painter.workspace.local.test')] = false;}
  assert.equal(calls, 0);
});
test.after(() => hooks.deregister());
