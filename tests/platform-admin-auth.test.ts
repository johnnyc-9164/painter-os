import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import type { getConvexBridge } from '../packages/cloud-session/src/server';
const require = createRequire(import.meta.url);
const { platformAuthResponse, platformSessionResponse } = require('../packages/cloud-session/src/platform-auth.ts') as typeof import('../packages/cloud-session/src/platform-auth');
const { contractorOrigin } = require('../apps/platform-admin/src/lib/contractor-origin.ts') as typeof import('../apps/platform-admin/src/lib/contractor-origin');
const origin = 'https://platform.example.test';
function request(data: unknown, requestOrigin: string | null = origin) {
  return new Request(`${origin}/api/auth`, { method: 'POST', headers: { 'content-type': 'application/json', ...(requestOrigin ? { origin: requestOrigin } : {}), cookie: 'existing-session=private' }, body: JSON.stringify(data) });
}
function bridge(handler: (request: Request) => Promise<Response>) {
  return (() => ({ handler: { GET: handler, POST: handler } })) as unknown as () => ReturnType<typeof getConvexBridge>;
}
test('platform login rejects origin, action, extra authority and oversized body before contacting identity backend', async () => {
  let called = false;
  const getBridge = bridge(async () => { called = true; return Response.json({}); });
  for (const supplied of [null, 'https://other.example.test', `${origin}/path`]) assert.equal((await platformAuthResponse(request({ action: 'login', email: 'operator@test.example', password: 'private' }, supplied), getBridge)).status, 403);
  for (const data of [{ action: 'signup' }, { action: 'demo' }, { action: 'acceptInvite' }, { action: 'logout', role: 'owner' }, { action: 'login', email: 'x', password: 'x'.repeat(17000) }, null]) assert.equal((await platformAuthResponse(request(data), getBridge)).status, 400);
  assert.equal(called, false);
});
test('platform login and logout preserve same-origin session cookies without exposing user or upstream details', async () => {
  const captured: Request[] = [];
  const getBridge = bridge(async r => { captured.push(r); const response = Response.json({ user: { id: 'private-user' } }); response.headers.append('set-cookie', 'session=private; Path=/; HttpOnly; Secure; SameSite=Lax'); response.headers.append('set-cookie', 'session_data=private; Path=/; HttpOnly'); return response; });
  const login = await platformAuthResponse(request({ action: 'login', email: ' operator@test.example ', password: 'private' }), getBridge, origin);
  assert.equal(login.status, 200); assert.deepEqual(await login.json(), { state: 'ready' });
  assert.equal(captured[0].url, `${origin}/api/auth/sign-in/email`); assert.equal(captured[0].headers.get('cookie'), 'existing-session=private'); assert.equal(captured[0].headers.get('origin'), origin);
  assert.deepEqual(await captured[0].json(), { email: 'operator@test.example', password: 'private' });
  assert.equal(login.headers.getSetCookie().length, 2); assert.match(login.headers.getSetCookie()[0], /HttpOnly; Secure; SameSite=Lax/);
  assert.equal(login.headers.get('cache-control'), 'private, no-store');
  assert.equal((await platformAuthResponse(request({ action: 'logout' }), getBridge)).status, 200);
  assert.equal(captured[1].url, `${origin}/api/auth/sign-out`); assert.deepEqual(await captured[1].json(), {});
});
test('auth failures and unsupported raw endpoints are redacted and remain private', async () => {
  for (const getBridge of [bridge(async () => { throw new Error('secret-host-stack'); }), bridge(async () => new Response('secret-receipt-stack', { status: 500 }))]) {
    const response = await platformAuthResponse(request({ action: 'logout' }), getBridge);
    assert.equal(response.status, 503); assert.deepEqual(await response.json(), { state: 'unavailable' });
    const raw = await platformSessionResponse(new Request(`${origin}/api/auth/get-session`), getBridge);
    assert.equal(raw.status, 503); assert.deepEqual(await raw.json(), { state: 'unavailable' });
  }
  let called = false; const getBridge = bridge(async () => { called = true; return Response.json({}); });
  assert.equal((await platformSessionResponse(new Request(`${origin}/api/auth/sign-up/email`, { method: 'POST' }), getBridge)).status, 404);
  assert.equal((await platformSessionResponse(new Request(`${origin}/api/auth/sign-out`, { method: 'POST', headers: { origin: 'https://other.example.test' } }), getBridge)).status, 403);
  assert.equal(called, false);
});
test('contractor navigation is absent by default and accepts only explicit safe origins', () => {
  assert.equal(contractorOrigin(undefined), null);
  assert.equal(contractorOrigin('https://company-admin.example.test'), 'https://company-admin.example.test/dashboard');
  for (const url of ['javascript:alert(1)', 'https://user:pass@example.test', 'https://example.test/path', 'https://example.test?token=private', 'https://example.test#private']) assert.equal(contractorOrigin(url), null);
});

test('same-origin validation handles Next internal loopback URLs and honors explicit canonical origin', async () => {
  const getBridge = bridge(async () => Response.json({}));
  const make = () => new Request('http://localhost:3004/api/auth', { method: 'POST', headers: { host: '127.0.0.1:3004', origin: 'http://127.0.0.1:3004', 'content-type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
  assert.equal((await platformAuthResponse(make(), getBridge)).status, 200);
  assert.equal((await platformAuthResponse(make(), getBridge, 'https://canonical.example.test')).status, 403);
});
