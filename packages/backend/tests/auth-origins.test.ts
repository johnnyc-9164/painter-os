import { describe, expect, it } from 'vitest';
import { convexTest } from 'convex-test';
import { betterAuth } from 'better-auth/minimal';
import betterAuthTest from '@convex-dev/better-auth/test';
import type { GenericMutationCtx } from 'convex/server';
import schema from '../convex/schema';
import { authComponent } from '../convex/auth';
import type { DataModel } from '../convex/runtime';
import { painterAuthOrigins } from '../convex/authOrigins';

const site = 'https://painter-os.vercel.app';
const platform = 'https://approved-platform-app.vercel.app';
const email = 'fixture-owner@example.test';
const password = 'public-fixture-password-123';
const modules = { './_generated/test-root-marker.ts': () => Promise.resolve({}) };
function fixtureAuth(ctx: GenericMutationCtx<DataModel>, configured?: string) {
  return betterAuth({
    baseURL: site, secret: 'public-fixture-secret-at-least-32-characters',
    trustedOrigins: painterAuthOrigins(site, configured), database: authComponent.adapter(ctx),
    telemetry: { enabled: false }, logger: { disabled: true }, rateLimit: { enabled: false },
    // Better Auth skips origin checks under NODE_ENV=test unless forced on.
    advanced: { disableOriginCheck: false, disableCSRFCheck: false },
    emailAndPassword: { enabled: true, requireEmailVerification: false },
  });
}
async function fixture(configured?: string) {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t, 'betterAuth');
  await t.run(async ctx => { await fixtureAuth(ctx, configured).api.signUpEmail({ body: { name: 'Fixture owner', email, password } }); });
  const login = (origin: string) => t.run(async ctx => {
    const auth = fixtureAuth(ctx, configured);
    const response = await auth.handler(new Request(`${site}/api/auth/sign-in/email`, {
      method: 'POST', headers: { origin, 'content-type': 'application/json', cookie: 'better-auth.session_token=synthetic-fixture-cookie' },
      body: JSON.stringify({ email, password }),
    }));
    return { status: response.status, cookies: response.headers.getSetCookie(), body: await response.json() };
  });
  return { t, login };
}

describe('explicit backend origin selection', () => {
  it('preserves default SITE_URL and development behavior exactly when unset', () => {
    for (const original of [site, 'http://localhost:3001', 'https://legacy.example.test/']) expect(painterAuthOrigins(original)).toEqual([original]);
    expect(painterAuthOrigins(site, '[]')).toEqual([site]);
  });
  it('accepts only explicit canonical HTTPS Vercel origins and deduplicates after validation', () => {
    expect(painterAuthOrigins(site, JSON.stringify([site, platform, platform]))).toEqual([site, platform]);
    const eight = Array.from({ length: 8 }, (_, i) => `https://approved-${i}.vercel.app`);
    expect(painterAuthOrigins(site, JSON.stringify(eight))).toEqual([site, ...eight]);
    expect(() => painterAuthOrigins(site, JSON.stringify([...eight, platform]))).toThrow('INVALID_AUTH_TRUSTED_ORIGINS');
  });
  it('rejects malformed, reflected, wildcard, alternate-host and noncanonical origins without echoing them', () => {
    const bad = ['', 'null', '{}', '[null]', '[true]', '[1]', 'not-json', ' '.repeat(4097)];
    const urls = ['https://*.vercel.app', 'https://vercel.app', 'https://other.example', 'https://foo.vercel.app.evil.test', 'http://foo.vercel.app', 'https://foo.vercel.app:443', 'https://foo.vercel.app:8443', 'https://foo.vercel.app/', 'https://foo.vercel.app/path', 'https://foo.vercel.app?x=1', 'https://foo.vercel.app#x', 'https://user:secret@foo.vercel.app', 'https://FOO.vercel.app', 'https://127.0.0.1', 'https://localhost', 'https://a.b.vercel.app', 'https://-bad.vercel.app', 'https://bad-.vercel.app', `https://${'a'.repeat(64)}.vercel.app`, ' https://foo.vercel.app', 'https://foo.vercel.app\n'];
    for (const value of [...bad, ...urls.map(url => JSON.stringify([url]))]) {
      try { painterAuthOrigins(site, value); throw new Error('EXPECTED_REJECTION'); }
      catch (error) { expect((error as Error).message).toBe('INVALID_AUTH_TRUSTED_ORIGINS'); }
    }
  });
});

describe('installed Better Auth with real Convex component origin checks', () => {
  it('default accepts the original host while denying the other app before creating a session', async () => {
    const { t, login } = await fixture();
    expect((await login(site)).status).toBe(200);
    const before = await t.runInComponent('betterAuth', ctx => ctx.db.query('session').take(10));
    const denied = await login(platform);
    expect(denied.status).toBe(403); expect(denied.cookies).toEqual([]);
    expect(denied.body.code).toBe('INVALID_ORIGIN');
    expect(await t.runInComponent('betterAuth', ctx => ctx.db.query('session').take(10))).toEqual(before);
  });
  it('configured exact additional host can sign in; neighboring/foreign origins remain denied', async () => {
    const { login } = await fixture(JSON.stringify([platform]));
    const accepted = await login(platform);
    expect(accepted.status).toBe(200); expect(accepted.cookies.length).toBeGreaterThan(0);
    // Source configuration does not widen cookie domains or make a cross-host SSO claim.
    expect(accepted.cookies.every(cookie => !/;\s*Domain=/i.test(cookie))).toBe(true);
    for (const origin of ['https://unapproved-platform-app.vercel.app', `${platform}.evil.test`, 'https://evil.test', 'null']) {
      const denied = await login(origin); expect(denied.status).toBe(403); expect(denied.cookies).toEqual([]);
    }
  });
});
