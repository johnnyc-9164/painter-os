import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { decodePublishedArticles, publicAdminOrigin } from '../packages/backend/published-articles.mjs';
const root = new URL('../apps/marketing/', import.meta.url);
function sources(url) {
  return readdirSync(url, { withFileTypes: true }).flatMap(entry => {
    const child = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, url);
    return entry.isDirectory() ? sources(child) : /\.(tsx?|mjs)$/.test(entry.name) ? [readFileSync(child, 'utf8')] : [];
  });
}
test('public DTO strips fields outside published content and rejects malformed rows', () => {
  const row = { id: '1', title: '<script>plain text</script>', slug: 'walls', content: 'Paint', publishedAt: '2026-10-04', privateNotes: 'secret', tenantId: 'internal' };
  assert.deepEqual(decodePublishedArticles([row]), [{ id: row.id, title: row.title, slug: row.slug, content: row.content, publishedAt: row.publishedAt }]);
  for (const value of [null, {}, [{ ...row, slug: '../admin' }], [{ ...row, content: 1 }]]) {
    assert.throws(() => decodePublishedArticles(value), /INVALID_PUBLIC_ARTICLE/);
  }
});
test('admin CTA is absent by default and only accepts an explicit HTTP origin', () => {
  assert.equal(publicAdminOrigin(undefined), null);
  assert.equal(publicAdminOrigin('https://admin.example.com'), 'https://admin.example.com');
  for (const value of ['javascript:alert(1)', 'https://user:pass@example.com', 'https://example.com/private', 'https://example.com/?token=1']) {
    assert.throws(() => publicAdminOrigin(value));
  }
});
test('marketing has no admin/auth/local runtime, mutation, private API or unsafe HTML boundary', () => {
  const code = sources(root).join('\n');
  assert.doesNotMatch(code, /local-runtime|convex-runtime|auth-server|auth-client|PainterApp|painter-forms|\/api\/snapshot|dangerouslySetInnerHTML|\.mutation\(|CONVEX_DEPLOY_KEY|BETTER_AUTH_SECRET|PAINTER_LINK_SECRET/);
  assert.ok(code.includes('decodePublishedArticles'));
  assert.ok(code.includes("makeFunctionReference<'query'"));
});
test('new workspace is locked and independently buildable without changing admin build', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url)));
  assert.equal(pkg.scripts.build, 'npm run build --workspace web');
  assert.equal(pkg.scripts['build:marketing'], 'npm run build --workspace marketing');
  assert.equal(lock.packages['node_modules/marketing'].resolved, 'apps/marketing');
});

test('marketing configured build runs only its Next app even in production with an admin root config present', () => {
  const config = JSON.parse(readFileSync(new URL('vercel.json', root)));
  const app = JSON.parse(readFileSync(new URL('package.json', root)));
  const adminConfig = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url)));
  assert.equal(config.framework, 'nextjs');
  assert.equal(config.outputDirectory, '.next');
  assert.equal(config.installCommand, 'npm --prefix ../.. ci --no-audit --no-fund');
  assert.equal(adminConfig.buildCommand, 'npm run build:vercel');
  const [runner, ...args] = config.buildCommand.split(' ');
  assert.equal(runner, 'npm');
  const npmCli = [process.env.npm_execpath, join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), join(dirname(process.execPath), '../lib/node_modules/npm/bin/npm-cli.js')].find(path => path && existsSync(path));
  assert.ok(npmCli, 'Existing npm CLI is required; this test does not install dependencies');
  const fixture = mkdtempSync(join(tmpdir(), 'painter-marketing-build-'));
  const appDir = join(fixture, 'apps/marketing');
  const binDir = join(fixture, 'node_modules/.bin');
  try {
    mkdirSync(appDir, { recursive: true });
    mkdirSync(binDir, { recursive: true });
    writeFileSync(join(fixture, 'package.json'), JSON.stringify({ private: true, workspaces: ['apps/*'], scripts: { 'build:vercel': 'node backend-sentinel.cjs' } }));
    writeFileSync(join(fixture, 'vercel.json'), JSON.stringify(adminConfig));
    writeFileSync(join(fixture, 'backend-sentinel.cjs'), "process.stderr.write('BACKEND_DEPLOY_FORBIDDEN');process.exit(97);");
    writeFileSync(join(appDir, 'package.json'), JSON.stringify(app));
    writeFileSync(join(appDir, 'vercel.json'), JSON.stringify(config));
    const stub = join(fixture, 'next-stub.cjs');
    writeFileSync(stub, "process.stdout.write('MARKETING_NEXT_RESULT='+JSON.stringify({cwd:process.cwd(),args:process.argv.slice(2)})+'\\n');");
    writeFileSync(join(binDir, 'next'), `#!/usr/bin/env node\nrequire(${JSON.stringify(stub)});\n`, { mode: 0o755 });
    writeFileSync(join(binDir, 'next.cmd'), `@"${process.execPath}" "${stub}" %*\r\n`);
    const emptyConfig = join(fixture, 'empty.npmrc');
    writeFileSync(emptyConfig, '');
    const emptyGlobalConfig = join(fixture, 'global.npmrc');
    writeFileSync(emptyGlobalConfig, '');
    const result = spawnSync(process.execPath, [npmCli, ...args], { cwd: appDir, encoding: 'utf8', env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, VERCEL_ENV: 'production', NPM_CONFIG_USERCONFIG: emptyConfig, NPM_CONFIG_GLOBALCONFIG: emptyGlobalConfig, NPM_CONFIG_CACHE: join(fixture, 'npm-cache') } });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    assert.doesNotMatch(result.stdout + result.stderr, /BACKEND_DEPLOY_FORBIDDEN|convex deploy|build:vercel/);
    const line = result.stdout.split(/\r?\n/).find(value => value.startsWith('MARKETING_NEXT_RESULT='));
    assert.ok(line, result.stdout);
    assert.deepEqual(JSON.parse(line.slice('MARKETING_NEXT_RESULT='.length)), { cwd: appDir, args: ['build', '--webpack'] });
  } finally {
    assert.ok(resolve(fixture).startsWith(join(resolve(tmpdir()), 'painter-marketing-build-')));
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('marketing holds main Git deployments while unspecified preview branches stay enabled', () => {
  const config = JSON.parse(readFileSync(new URL('vercel.json', root)));
  const rules = config.git.deploymentEnabled;
  assert.deepEqual(rules, { main: false });
  // Documented Vercel behavior: unspecified branches default to enabled.
  for (const [branch, expected] of [['main', false], ['repair/issue-18-marketing-build', true], ['feature/article', true]]) {
    assert.equal(rules[branch] ?? true, expected, branch);
  }
  const adminConfig = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url)));
  assert.equal(adminConfig.git?.deploymentEnabled, undefined);
});
