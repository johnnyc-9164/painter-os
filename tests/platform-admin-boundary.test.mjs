import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const json = path => JSON.parse(read(path));
function sources(path) {
  const directory = new URL(path, root);
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? sources(`${path}/${entry.name}`) : /\.(tsx?|mjs)$/.test(entry.name) ? [read(`${path}/${entry.name}`)] : []);
}
test('fourth app and neutral packages are independently locked and use a frontend-only build', () => {
  const app = json('apps/platform-admin/package.json');
  const config = json('apps/platform-admin/vercel.json');
  const lock = json('package-lock.json');
  assert.equal(app.name, 'platform-admin'); assert.equal(app.scripts.build, 'next build --webpack');
  assert.equal(config.buildCommand, 'npm run build'); assert.equal(config.git.deploymentEnabled.main, false);
  assert.equal(lock.packages['node_modules/platform-admin'].resolved, 'apps/platform-admin');
  assert.equal(lock.packages['node_modules/@painter-os-bts/platform'].resolved, 'packages/platform-admin-ui');
  assert.equal(lock.packages['node_modules/@painter-os-bts/cloud-session'].resolved, 'packages/cloud-session');
  assert.equal(json('package.json').scripts.build, 'npm run build --workspace web');
  assert.equal(json('package.json').scripts['build:platform-admin'], 'npm run build --workspace platform-admin');
  assert.doesNotMatch(JSON.stringify(config) + JSON.stringify(app), /build:vercel|convex deploy|CONVEX_DEPLOY_KEY/);
});
test('platform source never imports an app-private implementation or tenant business writer', () => {
  const code = [...sources('apps/platform-admin/src'), ...sources('packages/platform-admin-ui/src'), ...sources('packages/cloud-session/src')].join('\n');
  assert.doesNotMatch(code, /apps\/(web|marketing|company-site)|local-runtime|convex-runtime|painter-forms|PainterApp|api\.painter\.|fetchAuthMutation|createWorkspace|PAINTER_LINK_SECRET|CONVEX_DEPLOY_KEY|BETTER_AUTH_SECRET/);
  assert.doesNotMatch(code, /trustedOrigins|crossSubDomainCookies|\.mutation\(/);
  assert.match(read('packages/platform-admin-ui/src/server.ts'), /platformInventory\.access/);
  assert.match(read('packages/platform-admin-ui/src/server.ts'), /platformActivity\.list/);
});
test('legacy platform paths are compatibility shims over one canonical shared implementation', () => {
  for (const name of ['client', 'http', 'server']) assert.equal(read(`apps/web/src/lib/platform-${name}.ts`).trim(), `export * from '@painter-os-bts/platform/${name}';`);
  for (const name of ['platform-app', 'platform-view', 'platform-sign-in', 'platform-activity']) assert.equal(read(`apps/web/src/components/platform/${name}.tsx`).trim(), `export * from '@painter-os-bts/platform/components/${name}';`);
  assert.equal(read('apps/web/src/lib/auth-server.ts').trim(), "export * from '@painter-os-bts/cloud-session/server';");
  assert.match(read('apps/platform-admin/src/app/platform/[[...section]]/page.tsx'), /contractorOrigin/);
  assert.match(read('apps/platform-admin/src/app/api/auth/route.ts'), /platformAuthResponse/);
  assert.match(read('apps/platform-admin/src/app/api/auth/[...all]/route.ts'), /platformSessionResponse/);
});
