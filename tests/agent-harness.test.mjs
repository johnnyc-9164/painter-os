import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { importsIn, boundaryError, schemaInventory } from '../scripts/agent-check.mjs';
import { assertNoEnvFiles, agentEnvironment, verificationEnvironment, safeRoute } from '../scripts/agent-common.mjs';

test('boundary scanner sees imports, re-exports, dynamic imports and require, ignoring comments', () => {
  assert.deepEqual(importsIn("// import 'forbidden'\nimport x from 'a'; export {x} from 'b'; import('c'); require('d');"), ['a', 'b', 'c', 'd']);
  for (const importPath of ['../../../web/src/lib/local-runtime', '@painter-os-bts/backend', '@painter-os-bts/domain', 'better-auth', 'web/src/lib/local-runtime']) assert.ok(boundaryError('apps/marketing/src/lib/articles.ts', importPath), importPath);
  assert.equal(boundaryError('apps/marketing/src/lib/articles.ts', '@painter-os-bts/backend/published-articles.mjs'), null);
  assert.ok(boundaryError('packages/domain/src/test.ts', '@painter-os-bts/backend'));
  assert.ok(boundaryError('packages/backend/convex/test.ts', '../../../apps/web/src/lib/http'));
  assert.ok(boundaryError('packages/backend/convex/test.ts', 'marketing/src/lib/articles'));
});

test('local environment ignores credentials and request labels omit token/query values', () => {
  const env = agentEnvironment('http://127.0.0.1:4011', '/owned/run');
  assert.equal(env.PAINTER_DATA_DIR, '/owned/run/data'); assert.equal(env.PAINTER_RUNTIME, 'local');
  assert.equal(env.PAINTER_COOKIE_SECURE, 'false'); assert.equal(env.HOME, undefined);
  assert.ok(Object.keys(env).every(key => !/SECRET|TOKEN|CONVEX|API_KEY/.test(key)));
  assert.equal(safeRoute('http://127.0.0.1/p/bearer-secret?email=private'), '/p/:token');
  assert.equal(safeRoute('/api/files/private-id?key=secret'), '/api/:redacted');
  assert.equal(safeRoute('/unknown-user-name'), '/:redacted');
  const verification = verificationEnvironment({ PATH: '/safe', PAINTER_APP_URL: 'https://real', CONVEX_DEPLOY_KEY: 'synthetic-secret' });
  assert.equal(verification.PAINTER_APP_URL, undefined); assert.equal(verification.CONVEX_DEPLOY_KEY, undefined);
  assert.equal(verification.NODE_ENV, 'production');
});

test('Next env files are rejected by filename without reading or deleting them', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'painter-agent-test-'));
  try {
    await mkdir(join(fixture, 'apps/web'), { recursive: true }); await mkdir(join(fixture, 'apps/marketing'), { recursive: true });
    await writeFile(join(fixture, 'apps/web/.env.example'), 'example'); await assertNoEnvFiles(fixture);
    await writeFile(join(fixture, 'apps/web/.env.local'), 'SECRET=untouched');
    await assert.rejects(assertNoEnvFiles(fixture), /LOCAL_ENV_FILES_PRESENT.*\.env.local/);
  } finally { await rm(fixture, { recursive: true }); }
});

test('generated schema comes from real host tables without component or tenant data claims', async () => {
  const inventory = await schemaInventory();
  assert.match(inventory, /painterWorkspaces/); assert.match(inventory, /authEmailReceipts/);
  assert.doesNotMatch(inventory, /\| role \|/); assert.match(inventory, /mounted components own separate schemas/);
});
