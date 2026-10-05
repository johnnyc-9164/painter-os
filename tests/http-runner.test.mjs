import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { localEnvironment, observe, removeOwnedDirectory, stop, waitForHarness, waitForReady } from '../scripts/run-http-acceptance.mjs';

test('child environment forces loopback/local and never reads or copies credential values', () => {
  const accesses = [];
  const source = new Proxy({ PATH: '/safe/bin' }, { get(target, name) { accesses.push(name); return target[name]; } });
  const env = localEnvironment(source, 'http://127.0.0.1:4011', '/fresh/task-data');
  assert.equal(env.PAINTER_RUNTIME, 'local');
  assert.equal(env.PAINTER_DATA_DIR, '/fresh/task-data');
  assert.equal(env.PAINTER_COOKIE_SECURE, 'false');
  assert.equal(env.PAINTER_TEST_URL, env.PAINTER_APP_URL);
  assert.ok(accesses.every(name => !/SECRET|KEY|CONVEX|TOKEN|PAINTER/.test(name)));
  assert.throws(() => localEnvironment(source, 'https://production.example', '/unused'), /LOOPBACK_REQUIRED/);
});

test('real child failure propagates and timed-out owned child is stopped', async () => {
  const env = localEnvironment(process.env, 'http://127.0.0.1:4011', '/unused');
  const failed = spawn(process.execPath, ['-e', 'process.exit(7)'], { env, shell: false, stdio: 'ignore' });
  await assert.rejects(waitForHarness(observe(failed), 3000), /HTTP_ACCEPTANCE_FAILED:7/);
  const hanging = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { env, shell: false, stdio: 'ignore' });
  const state = observe(hanging);
  try { await assert.rejects(waitForHarness(state, 100), /HTTP_ACCEPTANCE_TIMEOUT/); }
  finally { await stop(hanging, state); }
  assert.equal(state.ended, true);
});

test('readiness requires the real unauthenticated snapshot shape and handles failure within deadline', async () => {
  let valid = false;
  const server = createServer((_request, response) => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(valid ? { session: null } : { session: 'wrong-service' })); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await assert.rejects(waitForReady(base, { ended: false }, 100), /NEXT_READINESS_TIMEOUT/);
    valid = true;
    await waitForReady(base, { ended: false }, 1000);
    await assert.rejects(waitForReady(base, { ended: true }, 1000), /NEXT_EXITED_BEFORE_READY/);
    await assert.rejects(waitForReady('http://remote.example', { ended: false }), /LOOPBACK_REQUIRED/);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('cleanup removes only its owned task directory and preserves unrelated data', async () => {
  const parent = tmpdir();
  const owned = await mkdtemp(join(parent, 'painter-http-'));
  const other = await mkdtemp(join(parent, 'painter-http-test-unrelated-'));
  try {
    await writeFile(join(other, 'keep'), 'untouched');
    await assert.rejects(removeOwnedDirectory(owned, other), /UNOWNED_CLEANUP_PATH/);
    assert.equal(await readFile(join(other, 'keep'), 'utf8'), 'untouched');
    await removeOwnedDirectory(parent, owned);
    await assert.rejects(stat(owned), { code: 'ENOENT' });
  } finally { await removeOwnedDirectory(parent, owned); await removeOwnedDirectory(parent, other); }
});
