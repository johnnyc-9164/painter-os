import assert from 'node:assert/strict';
const base = process.env.PAINTER_PLATFORM_ADMIN_TEST_URL;
if (!base || new URL(base).hostname !== '127.0.0.1') throw new Error('ISOLATED_PLATFORM_ADMIN_REQUIRED');
const get = path => fetch(base + path, { redirect: 'manual', signal: AbortSignal.timeout(10000) });
for (const path of ['/platform', '/platform/activity', '/platform/workspaces', '/platform/login']) {
  const response = await get(path); assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-frame-options'), 'DENY'); assert.equal(response.headers.get('referrer-policy'), 'no-referrer'); assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const html = await response.text(); assert.match(html, /Painter OS/); assert.match(html, /Platform navigation/); assert.doesNotMatch(html, /href="\/dashboard"|Create workspace|Start demo/);
}
assert.equal((await get('/')).headers.get('location'), '/platform');
for (const path of ['/dashboard', '/site/company', '/p/portal', '/i/invite', '/platform/unknown']) assert.equal((await get(path)).status, 404);
for (const path of ['/api/platform/access', '/api/platform/workspaces', '/api/platform/workspaces/invalid', '/api/platform/activity']) {
  const response = await get(path); assert.equal(response.status, 503); assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.ok(response.headers.get('vary').split(',').map(value => value.trim().toLowerCase()).includes('cookie')); assert.deepEqual(await response.json(), { state: 'unavailable', reason: 'not_configured' });
}
assert.equal((await get('/api/platform/activity?role=owner')).status, 400);
assert.equal((await get('/api/platform/unknown')).status, 404);
assert.equal((await get('/api/snapshot')).status, 404);
const auth = (data, origin = base) => fetch(base + '/api/auth', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(10000) });
assert.equal((await auth({ action: 'logout' }, 'https://foreign.example.test')).status, 403);
assert.equal((await auth({ action: 'signup' })).status, 400);
const unavailable = await auth({ action: 'logout' }); assert.equal(unavailable.status, 503); assert.deepEqual(await unavailable.json(), { state: 'unavailable' });
assert.equal((await fetch(base + '/api/auth/sign-up/email', { method: 'POST', headers: { origin: base }, body: '{}' })).status, 404);
assert.equal((await get('/api/auth/get-session')).status, 503);
console.log('Independent platform-admin HTTP acceptance passed: own routes, headers, redacted APIs, origin/action boundaries, absent tenant routes.');
