import test from 'node:test';
import assert from 'node:assert/strict';
import { platformEnvironment } from '../scripts/run-platform-http-acceptance.mjs';
test('platform loopback harness excludes real cloud configuration and auth secrets', () => {
  const source = { PATH: '/bin', HOME: '/private/home', NEXT_PUBLIC_CONVEX_URL: 'https://private.convex.cloud', NEXT_PUBLIC_CONVEX_SITE_URL: 'https://private.convex.site', BETTER_AUTH_SECRET: 'do-not-inherit', CONVEX_DEPLOY_KEY: 'do-not-inherit', PAINTER_DATA_DIR: '/private/data' };
  for (const runtime of ['local', 'unconfigured']) {
    const env = platformEnvironment(source, '/tmp/painter-http-platform-test', runtime);
    assert.equal(env.HOME, '/tmp/painter-http-platform-test'); assert.equal(env.USERPROFILE, env.HOME);
    assert.equal(env.PAINTER_RUNTIME, runtime === 'local' ? 'local' : undefined);
    for (const name of ['NEXT_PUBLIC_CONVEX_URL', 'NEXT_PUBLIC_CONVEX_SITE_URL', 'BETTER_AUTH_SECRET', 'CONVEX_DEPLOY_KEY', 'PAINTER_DATA_DIR']) assert.equal(name in env, false);
  }
  assert.throws(() => platformEnvironment(source, '/tmp/test', 'production'), /ISOLATED_RUNTIME_REQUIRED/);
});
