import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
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
