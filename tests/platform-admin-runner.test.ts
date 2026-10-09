import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { platformAdminEnvironment } = createRequire(import.meta.url)('../scripts/run-platform-admin-http-acceptance.mjs') as { platformAdminEnvironment(source: Record<string, string>, directory: string): Record<string, string> };
test('platform-admin HTTP runner excludes deployment, identity, provider, runtime and navigation configuration', () => {
  const env = platformAdminEnvironment({ PATH: '/bin', NEXT_PUBLIC_CONVEX_URL: 'private', NEXT_PUBLIC_CONVEX_SITE_URL: 'private', BETTER_AUTH_SECRET: 'private', CONVEX_DEPLOY_KEY: 'private', PAINTER_RUNTIME: 'local', NEXT_PUBLIC_CONTRACTOR_APP_URL: 'private', PLATFORM_APP_URL: 'private', AGENTMAIL_API_KEY: 'private', HOME: '/private' }, '/owned');
  assert.equal(env.PATH, '/bin'); assert.equal(env.HOME, '/owned'); assert.equal(env.NODE_ENV, 'production');
  for (const key of ['NEXT_PUBLIC_CONVEX_URL', 'NEXT_PUBLIC_CONVEX_SITE_URL', 'BETTER_AUTH_SECRET', 'CONVEX_DEPLOY_KEY', 'PAINTER_RUNTIME', 'NEXT_PUBLIC_CONTRACTOR_APP_URL', 'PLATFORM_APP_URL', 'AGENTMAIL_API_KEY']) assert.equal(env[key], undefined);
});
