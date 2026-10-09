import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, readdir, stat, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { root, ownedRun, verificationEnvironment } from '../scripts/agent-common.mjs';

function run(extra) {
  return spawnSync(process.execPath, ['tests/browser.acceptance.mjs'], {
    cwd: root, env: { ...verificationEnvironment(), ...extra }, encoding: 'utf8', timeout: 15_000,
  });
}

test('legacy lifecycle rejects operator URLs before creating artifacts or browser state', () => {
  const result = run({ PAINTER_TEST_URL: 'https://operator.example.invalid/p/private-token' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /OWNED_BROWSER_SERVER_REQUIRED/);
  assert.doesNotMatch(result.stderr, /private-token|Artifacts:/);
});

test('invalid browser executable leaves a private failure receipt without starting server or data', async () => {
  const result = run({ PAINTER_AGENT_CHROMIUM_EXECUTABLE: '/missing/private-chromium' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /INVALID_CHROMIUM_EXECUTABLE/);
  assert.doesNotMatch(result.stderr, /private-chromium/);
  const match = result.stderr.match(/Artifacts: ([^\n]+)/);
  assert.ok(match, 'failed run prints its owned evidence directory');
  const directory = await ownedRun(match[1]);
  try {
    assert.equal((await stat(directory)).mode & 0o777, 0o700);
    assert.equal((await stat(join(directory, 'receipt.json'))).mode & 0o777, 0o600);
    const receipt = JSON.parse(await readFile(join(directory, 'receipt.json'), 'utf8'));
    assert.equal(receipt.status, 'failed'); assert.equal(receipt.sandbox, true);
    assert.equal(receipt.runtime, 'local synthetic only'); assert.equal(receipt.browser, undefined);
    const files = await readdir(directory);
    assert.deepEqual(files.sort(), ['receipt.json', 'server.log']);
    assert.equal(await readFile(join(directory, 'server.log'), 'utf8'), '');
  } finally { await rm(directory, { recursive: true }); }
});
