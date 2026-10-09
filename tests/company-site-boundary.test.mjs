import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { readPublishedArticles, readJournalArticles } from '../packages/public-content/index.mjs';

const row = (id, title) => ({ id, title, slug: 'paint-care', content: 'Care guidance', publishedAt: '2026-10-09', privateNotes: 'secret', tenantId: 'private' });

async function withPublicBackend(run) {
  const requests = [];
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    const query = JSON.parse(body);
    requests.push({ path: req.url, query });
    const args = query.args[0];
    const value = args.workspaceId === 'company-a' ? [row('a', 'Company A')] : args.workspaceId === 'company-b' ? [row('b', 'Company B')] : [];
    res.setHeader('Content-Type', 'application/json');
    if (args.workspaceId === 'missing') res.end(JSON.stringify({ status: 'error', errorMessage: 'Missing workspace', errorData: 'PUBLIC_WORKSPACE_NOT_FOUND' }));
    else if (args.workspaceId === 'offline') res.end(JSON.stringify({ status: 'error', errorMessage: 'Unavailable' }));
    else res.end(JSON.stringify({ status: 'success', value: args.slug === 'absent' ? [] : value }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`, requests); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('company journals use only the published query, isolate tenant requests and strip private fields', async () => {
  await withPublicBackend(async (url, requests) => {
    const [a, b] = await Promise.all([readPublishedArticles(url, 'company-a'), readPublishedArticles(url, 'company-b', 'paint-care')]);
    assert.deepEqual(a, [{ id: 'a', title: 'Company A', slug: 'paint-care', content: 'Care guidance', publishedAt: '2026-10-09' }]);
    assert.equal(b[0].id, 'b');
    assert.deepEqual(requests.map(r => r.query.args[0]).sort((x,y) => x.workspaceId.localeCompare(y.workspaceId)), [{ workspaceId: 'company-a' }, { workspaceId: 'company-b', slug: 'paint-care' }]);
    assert.ok(requests.every(r => r.path === '/api/query' && r.query.path === 'painter:articles'));
  });
});

test('only typed missing-workspace errors become 404; provider errors and missing config stay errors', async () => {
  await withPublicBackend(async url => {
    const missing = () => { throw new Error('ROUTE_404'); };
    await assert.rejects(readJournalArticles(url, 'missing', undefined, missing), /ROUTE_404/);
    await assert.rejects(readJournalArticles(url, 'offline', undefined, missing), /Unavailable/);
    assert.deepEqual(await readJournalArticles(url, 'company-a', 'absent', missing), []);
  });
  await assert.rejects(readPublishedArticles(undefined, 'company-a'), /PUBLIC_CONTENT_NOT_CONFIGURED/);
});

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const path = new URL(`${e.name}${e.isDirectory() ? '/' : ''}`, dir);
    return e.isDirectory() ? sourceFiles(path) : /\.(tsx?|mjs)$/.test(e.name) ? [readFileSync(path, 'utf8')] : [];
  });
}

test('independent company app has no private runtime, mutation, auth, cross-app import or raw HTML', () => {
  const code = sourceFiles(new URL('../apps/company-site/src/', import.meta.url)).join('\n');
  assert.doesNotMatch(code, /apps\/(web|marketing)|auth-server|auth-client|local-runtime|convex-runtime|\.mutation\(|dangerouslySetInnerHTML|CONVEX_DEPLOY_KEY|BETTER_AUTH_SECRET|PAINTER_LINK_SECRET/);
  const page = readFileSync(new URL('../apps/company-site/src/app/site/[workspace]/[[...slug]]/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /slug\.length !== 1/);
  assert.match(page, /articles\.length === 0\) notFound\(\)/);
  assert.match(page, /force-dynamic/);
  const root = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  const config = JSON.parse(readFileSync(new URL('../apps/company-site/vercel.json', import.meta.url)));
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url)));
  assert.equal(root.scripts.build, 'npm run build --workspace web');
  assert.equal(config.buildCommand, 'npm run build');
  assert.deepEqual(config.git.deploymentEnabled, { main: false });
  assert.equal(lock.packages['node_modules/company-site'].resolved, 'apps/company-site');
  assert.equal(lock.packages['node_modules/@painter-os-bts/public-content'].resolved, 'packages/public-content');
});
