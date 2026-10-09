import { it, expect, vi } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api } from '../convex/runtime';
vi.mock('../convex/auth', () => ({ authComponent: { safeGetAuthUser: async () => null } }));
const modules = { './_generated/test-root-marker.ts': () => Promise.resolve({}), './painter.ts': () => import('../convex/painter'), './publicArticles.ts': () => import('../convex/publicArticles'), './runtime.ts': () => import('../convex/runtime') };
async function fixture() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => {
    const a = await ctx.db.insert('painterWorkspaces', { name: 'A', ownerId: 'a', demo: false, createdAt: '2026-10-09' });
    const b = await ctx.db.insert('painterWorkspaces', { name: 'B', ownerId: 'b', demo: false, createdAt: '2026-10-09' });
    for (let i = 0; i < 47; i++) await ctx.db.insert('painterEntities', { tenantId: a, entityId: `a-${i}`, type: 'article', revision: 1, createdAt: '2026-10-09', updatedAt: '2026-10-09', data: { title: `Article ${i}`, slug: `article-${i}`, content: 'x'.repeat(500), publishedAt: '2026-10-09', status: 'published', public: true, privateNotes: 'private' } });
    for (const [id, tenantId, status, isPublic] of [['draft', a, 'draft', true], ['private', a, 'published', false], ['other', b, 'published', true]] as const) await ctx.db.insert('painterEntities', { tenantId, entityId: id, type: 'article', revision: 1, createdAt: '2026-10-09', updatedAt: '2026-10-09', data: { title: id, slug: id, content: id, publishedAt: '2026-10-09', status, public: isPublic } });
    return { a, b };
  });
  return { t, ...ids };
}
it('bounded pages enumerate all public articles without private data, gaps or duplicates', async () => {
  const { t, a } = await fixture();
  const seen: string[] = []; let cursor: string | null = null;
  for (let step = 0; step < 10; step++) {
    const page = await t.query(api.painter.articlesPage, { workspaceId: a, cursor, limit: 10 });
    expect(page.page.length).toBeLessThanOrEqual(10);
    for (const row of page.page) { expect(Object.keys(row).sort()).toEqual(['excerpt', 'id', 'publishedAt', 'slug', 'title']); expect(row.excerpt).toHaveLength(300); seen.push(row.id); }
    if (page.isDone) { expect(page.continueCursor).toBeNull(); break; }
    expect(page.continueCursor).not.toBe(cursor); cursor = page.continueCursor;
  }
  expect(seen).toHaveLength(47); expect(new Set(seen).size).toBe(47);
});
it('legacy list fails explicitly on overflow while indexed detail retains full content', async () => {
  const { t, a, b } = await fixture();
  await expect(t.query(api.painter.articles, { workspaceId: a })).rejects.toThrow('PUBLIC_ARTICLES_PAGINATION_REQUIRED');
  expect((await t.query(api.painter.articles, { workspaceId: a, slug: 'article-46' }))[0].content).toHaveLength(500);
  expect(await t.query(api.painter.articles, { workspaceId: a, slug: 'draft' })).toEqual([]);
  expect(await t.query(api.painter.articles, { workspaceId: a, slug: 'other' })).toEqual([]);
  expect((await t.query(api.painter.articles, { workspaceId: b }))[0].id).toBe('other');
});
it('cursor cannot cross workspaces and malformed/oversized inputs fail closed', async () => {
  const { t, a, b } = await fixture();
  const first = await t.query(api.painter.articlesPage, { workspaceId: a, cursor: null });
  await expect(t.query(api.painter.articlesPage, { workspaceId: b, cursor: first.continueCursor })).rejects.toThrow('INVALID_PUBLIC_ARTICLE_CURSOR');
  for (const cursor of ['bad-json', '{}', 'x'.repeat(8193)]) await expect(t.query(api.painter.articlesPage, { workspaceId: a, cursor })).rejects.toThrow('INVALID_PUBLIC_ARTICLE_CURSOR');
  for (const limit of [0, -1, 21, 1.5]) await expect(t.query(api.painter.articlesPage, { workspaceId: a, cursor: null, limit })).rejects.toThrow('INVALID_PUBLIC_ARTICLE_PAGE_SIZE');
  await expect(t.query(api.painter.articlesPage, { workspaceId: 'missing', cursor: null })).rejects.toThrow('PUBLIC_WORKSPACE_NOT_FOUND');
});
it('large stored bodies cause byte-limited continuation rather than silently truncating the journal', async () => {
  const t = convexTest(schema, modules);
  const workspaceId = await t.run(async ctx => {
    const id = await ctx.db.insert('painterWorkspaces', { name: 'Large', ownerId: 'owner', demo: false, createdAt: '2026-10-09' });
    for (let i = 0; i < 1000; i++) await ctx.db.insert('painterEntities', { tenantId: id, entityId: `draft-${i}`, type: 'article', revision: 1, createdAt: '2026-10-09', updatedAt: '2026-10-09', data: { title: 'Private', slug: `draft-${i}`, content: 'private', status: 'draft', public: true } });
    for (let i = 0; i < 20; i++) await ctx.db.insert('painterEntities', { tenantId: id, entityId: `large-${i}`, type: 'article', revision: 1, createdAt: '2026-10-09', updatedAt: '2026-10-09', data: { title: 'Large', slug: `large-${i}`, content: 'x'.repeat(100000), publishedAt: '2026-10-09', status: 'published', public: true } });
    return id;
  });
  await expect(t.query(api.painter.articles, { workspaceId })).rejects.toThrow('PUBLIC_ARTICLES_PAGINATION_REQUIRED');
  const first = await t.query(api.painter.articlesPage, { workspaceId, cursor: null, limit: 20 });
  // The read threshold is checked after each document: at most one document crosses it.
  expect(first.page.length).toBeLessThan(20); expect(first.isDone).toBe(false);
  expect(first.page.length).toBeLessThanOrEqual(11);
  const all: string[] = first.page.map((row: { id: string }) => row.id);
  let cursor = first.continueCursor;
  for (let step = 0; step < 5; step++) {
    const next = await t.query(api.painter.articlesPage, { workspaceId, cursor, limit: 20 });
    all.push(...next.page.map((row: { id: string }) => row.id));
    if (next.isDone) break;
    expect(next.continueCursor).not.toBe(cursor); cursor = next.continueCursor;
  }
  expect(all).toHaveLength(20); expect(new Set(all).size).toBe(20);
});
it('empty, wrong-table and deleted workspaces preserve explicit missing/empty semantics for pages', async () => {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => {
    const empty = await ctx.db.insert('painterWorkspaces', { name: 'Empty', ownerId: 'owner', demo: false, createdAt: '2026-10-09' });
    const deleted = await ctx.db.insert('painterWorkspaces', { name: 'Gone', ownerId: 'owner', demo: false, createdAt: '2026-10-09' });
    const member = await ctx.db.insert('painterMembers', { tenantId: empty, userId: 'owner', name: 'Owner', email: 'owner@example.test', role: 'owner', enabled: true });
    await ctx.db.delete(deleted); return { empty, deleted, member };
  });
  expect(await t.query(api.painter.articlesPage, { workspaceId: ids.empty, cursor: null })).toEqual({ page: [], isDone: true, continueCursor: null });
  for (const workspaceId of [ids.deleted, ids.member]) await expect(t.query(api.painter.articlesPage, { workspaceId, cursor: null })).rejects.toThrow('PUBLIC_WORKSPACE_NOT_FOUND');
});
it('duplicate detail slugs and malformed published projection fail closed', async () => {
  const { t, a } = await fixture();
  await t.run(async ctx => {
    const base = { tenantId: a, type: 'article', revision: 1, createdAt: '2026-10-09', updatedAt: '2026-10-09' };
    await ctx.db.insert('painterEntities', { ...base, entityId: 'duplicate', data: { title: 'Duplicate', slug: 'article-46', content: 'not guessed', publishedAt: '2026-10-09', status: 'published', public: true } });
    await ctx.db.insert('painterEntities', { ...base, entityId: 'bad', data: { title: 'Bad', slug: 'bad', content: 42, publishedAt: '2026-10-09', status: 'published', public: true } });
  });
  await expect(t.query(api.painter.articles, { workspaceId: a, slug: 'article-46' })).rejects.toThrow('DUPLICATE_PUBLIC_ARTICLE_SLUG');
  await expect(t.query(api.painter.articles, { workspaceId: a, slug: 'bad' })).rejects.toThrow('INVALID_PUBLIC_ARTICLE');
});
