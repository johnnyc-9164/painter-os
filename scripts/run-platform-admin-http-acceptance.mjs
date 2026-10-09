import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:net';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { observe, stop, waitForHarness, removeOwnedDirectory } from './run-http-acceptance.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
export function platformAdminEnvironment(source, directory) {
  const env = {};
  for (const key of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'CI', 'TZ']) if (source[key] !== undefined) env[key] = source[key];
  return { ...env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', HOME: directory, USERPROFILE: directory };
}
async function unusedPort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}
export async function runPlatformAdminHttpAcceptance() {
  const parent = resolve(process.env.RUNNER_TEMP || tmpdir());
  const directory = await mkdtemp(join(parent, 'painter-http-platform-admin-'));
  let server, serverState, harness, harnessState;
  let interrupted = false;
  const interrupt = () => { interrupted = true; harness?.kill('SIGTERM'); server?.kill('SIGTERM'); };
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
  try {
    const base = `http://127.0.0.1:${await unusedPort()}`;
    const env = platformAdminEnvironment(process.env, directory);
    const app = join(root, 'apps', 'platform-admin');
    const nextBin = createRequire(import.meta.url).resolve('next/dist/bin/next', { paths: [app] });
    server = spawn(process.execPath, [nextBin, 'start', '--hostname', '127.0.0.1', '--port', new URL(base).port], { cwd: app, env, stdio: 'inherit', shell: false });
    serverState = observe(server);
    const deadline = Date.now() + 45000;
    let ready = false;
    while (Date.now() < deadline && !ready) {
      if (serverState.ended) throw new Error('PLATFORM_ADMIN_EXITED_BEFORE_READY');
      try { ready = (await fetch(base + '/platform', { redirect: 'error', signal: AbortSignal.timeout(500) })).status === 200; } catch { /* bounded readiness */ }
      if (!ready) await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error('PLATFORM_ADMIN_READINESS_TIMEOUT');
    if (interrupted) throw new Error('PLATFORM_ADMIN_ACCEPTANCE_INTERRUPTED');
    harness = spawn(process.execPath, [join(root, 'tests', 'platform-admin-http.acceptance.mjs')], { cwd: root, env: { ...env, PAINTER_PLATFORM_ADMIN_TEST_URL: base }, stdio: 'inherit', shell: false });
    harnessState = observe(harness); await waitForHarness(harnessState, 90000);
    if (interrupted) throw new Error('PLATFORM_ADMIN_ACCEPTANCE_INTERRUPTED');
  } finally {
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
    try { await stop(harness, harnessState); } finally { try { await stop(server, serverState); } finally { await removeOwnedDirectory(parent, directory); } }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runPlatformAdminHttpAcceptance().catch(error => { console.error(error.message); process.exitCode = 1; });
