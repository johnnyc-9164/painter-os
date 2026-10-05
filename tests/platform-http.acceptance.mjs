import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function platformHttpAcceptance(base, reason = 'local_runtime') {
  let checks = 0;
  const check = Object.fromEntries(['equal', 'deepEqual', 'match', 'doesNotMatch'].map(name => [name, (...args) => { assert[name](...args); checks++; }]));
  const origin = new URL(base);
  check.equal(origin.protocol, 'http:'); check.equal(origin.hostname, '127.0.0.1');
  for (const path of ['/platform', '/platform/login', '/platform/workspaces', '/platform/workspaces/synthetic-id', '/platform/sites', '/platform/health', '/platform/access', '/platform/activity', '/platform/billing']) {
    const response = await fetch(base + path, { redirect: 'error', signal: AbortSignal.timeout(10000) });
    check.equal(response.status, 200, path);
    check.equal(response.headers.get('set-cookie'), null);
    check.equal(response.headers.get('x-content-type-options'), 'nosniff');
    const html = await response.text();
    check.match(html, /aria-label="Platform navigation"/);
    check.match(html, /Checking platform access/);
    check.match(html, /name="robots" content="noindex, nofollow"/);
    check.match(html, /href="\/platform\/workspaces"/);
    check.match(html, /href="\/platform\/access"/);
    check.doesNotMatch(html, /Create workspace|Start demo|BETTER_AUTH_SECRET|private-owner/);
    check.doesNotMatch(html, /<a\b[^>]*role="button"/);
  }
  const unknown = await fetch(base + '/platform/not-a-platform-section', { signal: AbortSignal.timeout(10000) });
  check.equal(unknown.status, 404, 'Unknown platform pages cannot fall through to contractor UI');
  for (const path of ['/api/platform', '/api/platform/not-an-endpoint', '/api/platform/workspaces/too/many']) {
    const missing = await fetch(base + path, { signal: AbortSignal.timeout(10000) });
    check.equal(missing.status, 404); check.deepEqual(await missing.json(), { state: 'not_found' });
  }
  for (const path of ['/api/platform/access', '/api/platform/workspaces', '/api/platform/workspaces/synthetic-id']) {
    const response = await fetch(base + path, { signal: AbortSignal.timeout(10000) });
    check.equal(response.status, 503, path);
    check.deepEqual(await response.json(), { state: 'unavailable', reason });
    check.equal(response.headers.get('cache-control'), 'private, no-store');
    check.match(response.headers.get('vary'), /Cookie/);
    check.equal(response.headers.get('set-cookie'), null);
    const write = await fetch(base + path, { method: 'POST', body: '{}', signal: AbortSignal.timeout(10000) });
    check.equal(write.status, 405, 'Read-only endpoint has no write handler');
  }
  const invalid = await fetch(base + '/api/platform/workspaces?table=painterEntities', { signal: AbortSignal.timeout(10000) });
  check.equal(invalid.status, 400); check.deepEqual(await invalid.json(), { state: 'invalid_request' });
  const compatibility = await fetch(base + '/dashboard', { signal: AbortSignal.timeout(10000) });
  check.equal(compatibility.status, 200);
  check.doesNotMatch(await compatibility.text(), /aria-label="Platform navigation"/);
  console.log(JSON.stringify({ status: 'passed', suite: 'platform-http', checks, runtime: reason, scope: 'Nine explicit pages; read-only API unavailable/no-store states; namespace 404s; contractor route preserved. Not browser or live-owner acceptance.' }, null, 2));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  platformHttpAcceptance(process.env.PAINTER_PLATFORM_TEST_URL, process.env.PAINTER_PLATFORM_EXPECTED_REASON).catch(error => { console.error(error); process.exitCode = 1; });
}
