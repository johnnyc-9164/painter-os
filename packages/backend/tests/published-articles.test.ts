import { it, expect, vi } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api } from '../convex/runtime';
vi.mock('../convex/auth', () => ({ authComponent: { safeGetAuthUser: async () => null } }));
const modules = { './_generated/test-root-marker.ts': () => Promise.resolve({}), './painter.ts': () => import('../convex/painter'), './runtime.ts': () => import('../convex/runtime') };
it('anonymous CMS reads exclude draft/private/other-tenant records and all internal fields', async () => {
  const t = convexTest(schema, modules);
  const { workspace, other } = await t.run(async ctx => {
    const workspace = await ctx.db.insert('painterWorkspaces', { name: 'Public', ownerId: 'owner', demo: false, createdAt: '2026-10-04' });
    const other = await ctx.db.insert('painterWorkspaces', { name: 'Other', ownerId: 'other', demo: false, createdAt: '2026-10-04' });
    for (const [id, tenantId, status, isPublic] of [['published', workspace, 'published', true], ['draft', workspace, 'draft', true], ['private', workspace, 'published', false], ['other', other, 'published', true]] as const) {
      await ctx.db.insert('painterEntities', { tenantId, entityId: id, type: 'article', revision: 1, createdAt: '2026-10-04', updatedAt: '2026-10-04', data: { title: 'Walls', slug: id, content: 'Paint', publishedAt: '2026-10-04', status, public: isPublic, privateNotes: 'never public' } });
    }
    return { workspace, other };
  });
  expect(await t.query(api.painter.articles, { workspaceId: workspace })).toEqual([{ id: 'published', title: 'Walls', slug: 'published', content: 'Paint', publishedAt: '2026-10-04' }]);
  expect(await t.query(api.painter.articles, { workspaceId: workspace, slug: 'draft' })).toEqual([]);
  expect((await t.query(api.painter.articles, { workspaceId: other }))[0].id).toBe('other');
});

it('invalid public workspace input has an explicit application error instead of validator failure', async () => {
  const t = convexTest(schema, modules);
  const error = await t.query(api.painter.articles, { workspaceId: 'not-a-workspace' }).then(() => null, error => error);
  expect(error).toBeTruthy();
  expect(error.data, String(error)).toBe('PUBLIC_WORKSPACE_NOT_FOUND');
});

it('wrong-table IDs are invalid while valid empty and deleted workspace IDs stay empty', async () => {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => {
    const empty = await ctx.db.insert('painterWorkspaces', { name: 'Empty', ownerId: 'owner', demo: false, createdAt: '2026-10-04' });
    const deleted = await ctx.db.insert('painterWorkspaces', { name: 'Deleted', ownerId: 'owner', demo: false, createdAt: '2026-10-04' });
    const wrongTable = await ctx.db.insert('painterMembers', { tenantId: empty, userId: 'owner', name: 'Owner', email: 'owner@example.test', role: 'owner', enabled: true });
    await ctx.db.delete(deleted);
    return { empty, deleted, wrongTable };
  });
  const error = await t.query(api.painter.articles, { workspaceId: ids.wrongTable }).then(() => null, error => error);
  expect(error.data).toBe('PUBLIC_WORKSPACE_NOT_FOUND');
  expect(await t.query(api.painter.articles, { workspaceId: ids.empty })).toEqual([]);
  expect(await t.query(api.painter.articles, { workspaceId: ids.deleted })).toEqual([]);
});
