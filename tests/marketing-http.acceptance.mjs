import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicAdminOrigin } from '../packages/backend/published-articles.mjs';

export async function marketingHttpAcceptance(base, expectedAdminOrigin = null) {
  const parsed = new URL(base);
  assert.equal(parsed.protocol, 'http:');
  assert.equal(parsed.hostname, '127.0.0.1');
  const origin = publicAdminOrigin(expectedAdminOrigin ?? undefined);
  const response = await fetch(base, { redirect: 'error', signal: AbortSignal.timeout(10_000) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('set-cookie'), null, 'Public landing establishes no auth session');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const html = await response.text();
  assert.ok(html.length < 1024 * 1024, 'Bounded HTML fixture');
  assert.match(html, /Great painting/);
  assert.match(html, /A smoother business/);
  assert.equal((html.match(/<h3(?:\s[^>]*)?>/g) || []).length, 8);
  for (const section of ['features', 'workflow', 'ownership']) {
    assert.match(html, new RegExp(`id="${section}"`));
    assert.match(html, new RegExp(`href="#${section}"`));
  }
  assert.match(html, /manually recorded customer payments/);
  assert.match(html, /customer-owned deployments/);
  assert.doesNotMatch(html, /free trial|thousands of|trusted by|BETTER_AUTH_SECRET|CONVEX_DEPLOY_KEY|PAINTER_LINK_SECRET/i);
  assert.doesNotMatch(html, /<img|\/images\/product\//, 'This exact staged head has null imagery; visual acceptance remains held');
  const anchorPattern = /<a\b[^>]*href="([^"]+)"[^>]*>/g;
  const hrefs = [...html.matchAll(anchorPattern)].map(match => match[1]);
  assert.ok(hrefs.length > 4, 'Actual rendered navigation/CTA anchors');
  for (const href of hrefs) assert.ok(href === '/' || href.startsWith('#') || (origin !== null && href === origin), `Unexpected landing destination: ${href}`);
  if (origin) {
    assert.ok(hrefs.includes(origin));
    assert.match(html, /Open your workspace/);
    assert.match(html, /Sign in/);
  } else {
    assert.doesNotMatch(html, /Open your workspace|Sign in/);
  }
  // This checks absent app surfaces, not live tenant projection or Convex availability.
  for (const path of ['/api/snapshot', '/api/auth', '/dashboard', '/platform', '/p/synthetic-token', '/i/synthetic-token']) {
    const denied = await fetch(base + path, { redirect: 'error', signal: AbortSignal.timeout(10_000) });
    assert.equal(denied.status, 404, `${path} is not part of the public marketing deployment`);
    assert.equal(denied.headers.get('set-cookie'), null);
  }
  console.log(`Built marketing HTTP acceptance PASS: content, eight cards, anchor destinations, ${origin ? 'configured build-origin' : 'absent build-origin'} CTA, null imagery, headers and six absent admin/portal surfaces. No browser/valid-tenant/visual claim.`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  marketingHttpAcceptance(process.env.PAINTER_MARKETING_TEST_URL, process.env.PAINTER_EXPECTED_BUILD_ADMIN_ORIGIN || null).catch(error => { console.error(error); process.exitCode = 1; });
}
