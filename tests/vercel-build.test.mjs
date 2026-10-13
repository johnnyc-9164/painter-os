import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { buildPlan, runBuild, isPreviewDeployKey } from '../scripts/vercel-build.mjs';
import { siteUrlFor } from '../scripts/with-convex-site-url.mjs';

test('production deploys from backend and injects the production URL into frontend build', () => {
  const plan = buildPlan({ VERCEL_ENV: 'production', CONVEX_DEPLOY_KEY: 'synthetic' }, '/repo');
  assert.equal(plan.command, 'npx');
  assert.equal(plan.cwd, resolve('/repo', 'packages/backend'));
  assert.deepEqual(plan.args, ['--no-install', 'convex', 'deploy', '--cmd-url-env-var-name',
    'NEXT_PUBLIC_CONVEX_URL', '--cmd', 'cd ../.. && npm run build']);
});

test('preview with a Convex preview deploy key deploys an isolated preview backend', () => {
  const plan = buildPlan({ VERCEL_ENV: 'preview', CONVEX_DEPLOY_KEY: 'preview:team:project|synthetic' }, '/repo');
  assert.equal(plan.command, 'npx');
  assert.equal(plan.cwd, resolve('/repo', 'packages/backend'));
  assert.deepEqual(plan.args, ['--no-install', 'convex', 'deploy', '--cmd-url-env-var-name',
    'NEXT_PUBLIC_CONVEX_URL', '--cmd', 'node ../../scripts/with-convex-site-url.mjs']);
});

test('preview never deploys with a production, dev or malformed key', () => {
  for (const CONVEX_DEPLOY_KEY of ['prod:aromatic-crow-448|synthetic', 'dev:small-parakeet-618|synthetic', 'preview:', 'preview:x', 'synthetic', 'xpreview:a|b', undefined]) {
    assert.equal(isPreviewDeployKey(CONVEX_DEPLOY_KEY), false);
    assert.deepEqual(buildPlan({ VERCEL_ENV: 'preview', CONVEX_DEPLOY_KEY }, '/repo'), { command: 'npm', args: ['run', 'build'], cwd: '/repo' });
  }
  for (const VERCEL_ENV of ['development', undefined]) {
    assert.deepEqual(buildPlan({ VERCEL_ENV, CONVEX_DEPLOY_KEY: 'preview:team:project|synthetic' }, '/repo'), { command: 'npm', args: ['run', 'build'], cwd: '/repo' });
  }
});

test('preview site URL is derived only from a convex.cloud https URL', () => {
  assert.equal(siteUrlFor('https://happy-otter-123.convex.cloud'), 'https://happy-otter-123.convex.site');
  for (const bad of ['http://a.convex.cloud', 'https://a.convex.cloud.evil.test', 'https://evil.test', '']) assert.throws(() => siteUrlFor(bad));
});

test('preview, development and unclassified builds retain frontend-only behavior', () => {
  for (const VERCEL_ENV of ['preview', 'development', undefined, 'production; injected']) {
    assert.deepEqual(buildPlan({ VERCEL_ENV }, '/repo'), {
      command: 'npm', args: ['run', 'build'], cwd: '/repo',
    });
  }
});

test('missing production deploy key fails before starting a process', () => {
  for (const CONVEX_DEPLOY_KEY of [undefined, '', '  ']) {
    assert.throws(() => runBuild({ VERCEL_ENV: 'production', CONVEX_DEPLOY_KEY },
      () => assert.fail('process must not start')), /requires CONVEX_DEPLOY_KEY/);
  }
});

test('fixed argv uses no shell and does not interpolate environment values', () => {
  const environment = { VERCEL_ENV: 'production', CONVEX_DEPLOY_KEY: 'synthetic; injected' };
  assert.equal(runBuild(environment, (command, args, options) => {
    assert.equal(command, 'npx');
    assert.equal(options.shell, false);
    assert.equal(options.env, environment);
    assert.ok(!args.some(argument => argument.includes('injected')));
    return { status: 0 };
  }), 0);
});

test('failed configuration/deployment/build propagates failure without fallback', () => {
  let calls = 0;
  assert.equal(runBuild({ VERCEL_ENV: 'production', CONVEX_DEPLOY_KEY: 'synthetic' }, () => {
    calls++;
    return { status: 1 };
  }), 1);
  assert.equal(calls, 1);
  for (const result of [{ error: new Error('launch failed') }, { status: null }, { signal: 'SIGTERM' }]) {
    assert.throws(() => runBuild({}, () => result), /failed to complete/);
  }
});

test('Vercel and package scripts select the tested helper', () => {
  const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url)));
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  assert.equal(vercel.buildCommand, 'npm run build:vercel');
  assert.equal(pkg.scripts['build:vercel'], 'node scripts/vercel-build.mjs');
  assert.equal(pkg.scripts.build, 'npm run build --workspace web');
});
