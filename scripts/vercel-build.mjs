import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));

export function isPreviewDeployKey(key) {
  return typeof key === 'string' && /^preview:[^|\s]+\|\S+$/.test(key.trim());
}

export function buildPlan(environment, repositoryRoot = root) {
  if (environment.VERCEL_ENV === 'preview' && isPreviewDeployKey(environment.CONVEX_DEPLOY_KEY)) {
    // Preview builds get their own isolated Convex preview deployment (per branch).
    // Only a Convex *preview* deploy key enables this; any other key type stays frontend-only,
    // so a production key configured on Preview can never push code to production.
    return {
      command: 'npx',
      args: ['--no-install', 'convex', 'deploy', '--cmd-url-env-var-name',
        'NEXT_PUBLIC_CONVEX_URL', '--cmd', 'node ../../scripts/with-convex-site-url.mjs'],
      cwd: resolve(repositoryRoot, 'packages/backend'),
    };
  }
  if (environment.VERCEL_ENV !== 'production') {
    return { command: 'npm', args: ['run', 'build'], cwd: repositoryRoot };
  }
  if (!environment.CONVEX_DEPLOY_KEY?.trim()) {
    throw new Error('Production build requires CONVEX_DEPLOY_KEY; refusing a frontend-only build.');
  }
  return {
    command: 'npx',
    args: ['--no-install', 'convex', 'deploy', '--cmd-url-env-var-name',
      'NEXT_PUBLIC_CONVEX_URL', '--cmd', 'cd ../.. && npm run build'],
    cwd: resolve(repositoryRoot, 'packages/backend'),
  };
}

export function runBuild(environment, run = spawnSync) {
  const plan = buildPlan(environment);
  const result = run(plan.command, plan.args, {
    cwd: plan.cwd, env: environment, stdio: 'inherit', shell: false,
  });
  if (result.error || result.signal || result.status === null) {
    throw new Error('Build process failed to complete; refusing to report success.');
  }
  return result.status;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = runBuild(process.env);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
