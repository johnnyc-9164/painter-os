import { test } from 'node:test';
import assert from 'node:assert/strict';
import { marketingEnvironment } from '../scripts/run-marketing-http-acceptance.mjs';
import { marketingHttpAcceptance } from './marketing-http.acceptance.mjs';

test('marketing loopback child environment excludes auth/provider/public runtime configuration', () => {
  const env = marketingEnvironment({ PATH: 'synthetic-path', HOME: 'original-home', CONVEX_DEPLOY_KEY: 'synthetic', BETTER_AUTH_SECRET: 'synthetic', NEXT_PUBLIC_CONVEX_URL: 'https://example.invalid', NEXT_PUBLIC_ADMIN_ORIGIN: 'https://example.invalid', NODE_OPTIONS: '--synthetic' }, 'owned-temp');
  assert.deepEqual(env, { PATH: 'synthetic-path', NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', HOME: 'owned-temp', USERPROFILE: 'owned-temp' });
});

test('marketing HTTP harness refuses non-loopback or non-HTTP targets before fetching', async () => {
  await assert.rejects(marketingHttpAcceptance('https://127.0.0.1:3000'));
  await assert.rejects(marketingHttpAcceptance('http://public.example.invalid:3000'));
});
