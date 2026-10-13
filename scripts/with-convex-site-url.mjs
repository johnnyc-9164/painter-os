// Runs the web build with NEXT_PUBLIC_CONVEX_SITE_URL derived from the NEXT_PUBLIC_CONVEX_URL
// that `convex deploy --cmd-url-env-var-name` injects for a preview deployment.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function siteUrlFor(convexUrl) {
  const url = new URL(convexUrl);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.convex.cloud')) throw new Error('INVALID_CONVEX_URL');
  return `https://${url.hostname.slice(0, -'.convex.cloud'.length)}.convex.site`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const env = { ...process.env, NEXT_PUBLIC_CONVEX_SITE_URL: siteUrlFor(process.env.NEXT_PUBLIC_CONVEX_URL) };
  const result = spawnSync('npm', ['run', 'build'], { cwd: root, env, stdio: 'inherit', shell: false });
  process.exitCode = result.status ?? 1;
}
