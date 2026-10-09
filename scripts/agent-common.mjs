import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { createRequire } from 'node:module';
import { mkdir, readdir, writeFile, realpath } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { localEnvironment, observe, stop, waitForReady } from './run-http-acceptance.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const web = join(root, 'apps/web');
export { observe, stop, waitForReady };

export function gitState() {
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  return { head: git(['rev-parse', 'HEAD']), branch: git(['branch', '--show-current']), dirty: Boolean(git(['status', '--porcelain'])) };
}

export async function assertNoEnvFiles(base = root) {
  const found = [];
  for (const directory of [base, join(base, 'apps/web'), join(base, 'apps/marketing'), join(base, 'apps/company-site')]) {
    for (const name of await readdir(directory)) {
      if (/^\.env(?:\.(?:local|development|production|test)(?:\.local)?)?$/.test(name)) found.push(relative(base, join(directory, name)));
    }
  }
  if (found.length) throw new Error(`LOCAL_ENV_FILES_PRESENT: use a fresh worktree without provider configuration (${found.join(', ')}). Files were not read or changed.`);
}

export async function createRun(kind) {
  const directory = join(root, '.agent', 'runs', `${kind}-${randomUUID()}`);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  return directory;
}

export async function ownedRun(path) {
  const parent = await realpath(join(root, '.agent/runs'));
  const directory = await realpath(resolve(path));
  if (!relative(parent, directory) || relative(parent, directory).startsWith('..') || relative(parent, directory).includes('/')) throw new Error('EXPECTED_OWNED_RUN_DIRECTORY');
  return directory;
}

export async function unusedPort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

export function nextBin() { return createRequire(import.meta.url).resolve('next/dist/bin/next', { paths: [web] }); }

export function agentEnvironment(base, directory, mode = 'development') {
  const env = localEnvironment(process.env, base, join(directory, 'data'));
  delete env.HOME; delete env.USERPROFILE;
  return { ...env, NODE_ENV: mode };
}

export function verificationEnvironment(source = process.env) {
  const env = {};
  for (const key of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'CI', 'TZ']) if (source[key] !== undefined) env[key] = source[key];
  return { ...env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', PYTHONDONTWRITEBYTECODE: '1' };
}

export function spawnNext(mode, base, directory, stdio) {
  const args = [nextBin(), mode, '--hostname', '127.0.0.1', '--port', new URL(base).port];
  if (mode === 'dev') args.push('--webpack');
  return spawn(process.execPath, args, { cwd: web, env: agentEnvironment(base, directory, mode === 'dev' ? 'development' : 'production'), stdio, shell: false });
}

export async function writeJson(path, data) { await writeFile(path, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 }); }

export function safeRoute(path) {
  const pathname = new URL(path, 'http://127.0.0.1').pathname;
  const known = new Set(['/', '/overview', '/leads', '/customers', '/estimates', '/jobs', '/schedule', '/field/today', '/invoices', '/api/snapshot', '/api/auth', '/api/command', '/platform', '/content']);
  if (known.has(pathname)) return pathname;
  if (pathname.startsWith('/_next/')) return '/_next/*';
  if (/^\/(p|i)\//.test(pathname)) return pathname.startsWith('/p/') ? '/p/:token' : '/i/:token';
  if (pathname.startsWith('/api/')) return '/api/:redacted';
  return '/:redacted';
}
