import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, chmod, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { importsIn, boundaryError, schemaInventory } from '../scripts/agent-check.mjs';
import { assertNoEnvFiles, agentEnvironment, verificationEnvironment, safeRoute } from '../scripts/agent-common.mjs';
import { allowedNextRewrite } from '../scripts/agent-generated.mjs';

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
  assert.equal(verification.PYTHONDONTWRITEBYTECODE, '1');
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

test('generated restoration accepts only known Next defaults and rejects weakened compiler/source edits', () => {
  const before = JSON.stringify({ compilerOptions: { strict: true }, include: ['src/**/*.ts'] });
  const after = JSON.stringify({ compilerOptions: { strict: true, allowJs: true, incremental: true }, include: ['src/**/*.ts', '.next/dev/types/**/*.ts'] });
  assert.equal(allowedNextRewrite('apps/marketing/tsconfig.json', before, after), true);
  assert.equal(allowedNextRewrite('apps/marketing/tsconfig.json', before, after.replace('"strict":true', '"strict":false')), false);
  assert.equal(allowedNextRewrite('apps/web/next-env.d.ts', before, '// unexpected edit'), false);
  assert.equal(allowedNextRewrite('apps/web/src/lib/http.ts', before, after), false);
});


test('browser override accepts only explicit absolute executable files and retains sandbox', async () => {
  const { browserLaunchOptions } = await import('../scripts/agent-browser-options.mjs');
  assert.deepEqual(await browserLaunchOptions({}), { headless: true, chromiumSandbox: true });
  for (const path of ['', 'chromium', './chromium', '/missing/painter-chromium']) {
    await assert.rejects(browserLaunchOptions({ PAINTER_AGENT_CHROMIUM_EXECUTABLE: path }), /INVALID_CHROMIUM_EXECUTABLE/);
  }
  const fixture = await mkdtemp(join(tmpdir(), 'painter-browser-options-'));
  try {
    await assert.rejects(browserLaunchOptions({ PAINTER_AGENT_CHROMIUM_EXECUTABLE: fixture }), /INVALID_CHROMIUM_EXECUTABLE/);
    const executable = join(fixture, 'chromium');
    await writeFile(executable, '#!/bin/sh\nexit 0\n', { mode: 0o600 });
    await assert.rejects(browserLaunchOptions({ PAINTER_AGENT_CHROMIUM_EXECUTABLE: executable }), /INVALID_CHROMIUM_EXECUTABLE/);
    await chmod(executable, 0o700);
    assert.deepEqual(await browserLaunchOptions({ PAINTER_AGENT_CHROMIUM_EXECUTABLE: executable }), { headless: true, chromiumSandbox: true, executablePath: executable });
  } finally { await rm(fixture, { recursive: true }); }
});

test('request evidence is parseable newline-delimited JSON including multiple requests', async () => {
  const { requestJsonLines } = await import('../scripts/agent-browser-options.mjs');
  const spans = [{ route: '/overview', method: 'GET' }, { route: '/api/:redacted', method: 'POST' }];
  const serialized = requestJsonLines(spans);
  assert.ok(serialized.endsWith('\n'));
  assert.deepEqual(serialized.trimEnd().split('\n').map(line => JSON.parse(line)), spans);
  assert.equal(requestJsonLines([]), '');
  const runner = await readFile(new URL('../scripts/agent-browser.mjs', import.meta.url), 'utf8');
  assert.match(runner, /appendFile\(join\(directory, 'requests\.jsonl'\), requestJsonLines\(spans\)/);
});


test('browser executable selection is forwarded only to browser verification', async () => {
  const { browserGateEnvironment } = await import('../scripts/agent-browser-options.mjs');
  const source = { PAINTER_AGENT_CHROMIUM_EXECUTABLE: '/usr/bin/chromium', CONVEX_DEPLOY_KEY: 'secret' };
  const env = verificationEnvironment(source);
  assert.deepEqual(browserGateEnvironment('browser', env, source), { ...env, PAINTER_AGENT_CHROMIUM_EXECUTABLE: '/usr/bin/chromium' });
  for (const gate of ['doctor', 'web-build', 'http', 'platform-http']) assert.deepEqual(browserGateEnvironment(gate, env, source), env);
  assert.equal(agentEnvironment('http://127.0.0.1:4011', '/owned/run').PAINTER_AGENT_CHROMIUM_EXECUTABLE, undefined);
});
