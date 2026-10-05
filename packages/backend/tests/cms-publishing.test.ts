import { describe, expect, it, vi } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api } from '../convex/runtime';
import type { UserIdentity } from 'convex/server';
import type { Entity } from '../../domain/src/contracts';

// Only the external auth provider is mocked, following painter.test.ts.
// The host resolves enabled database membership; the client supplies no role.
vi.mock('../convex/auth', () => ({ authComponent: {
  safeGetAuthUser: async (ctx: { auth: { getUserIdentity(): Promise<UserIdentity | null> } }) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity ? { _id: identity.subject, name: identity.name ?? 'Member', email: identity.email, emailVerified: identity.emailVerified } : null;
  },
} }));
const modules = {
  './_generated/test-root-marker.ts': () => Promise.resolve({}),
  './painter.ts': () => import('../convex/painter'),
  './runtime.ts': () => import('../convex/runtime'),
};

async function setup() {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: 'cms-owner', name: 'CMS Owner', email: 'owner@example.invalid', emailVerified: true });
  const workspace = await owner.mutation(api.painter.createWorkspace, { name: 'CMS workspace' });
  return { t, owner, workspace };
}
type CmsClient = Awaited<ReturnType<typeof setup>>['owner'];
async function createDraft(owner: CmsClient, key: string, slug: string): Promise<Entity> {
  const result = await owner.mutation(api.painter.command, { command: { action: 'article.create', requestKey: key, input: { title: 'Walls', slug, content: 'Draft content' } } });
  return result.entity;
}
async function publish(owner: CmsClient, draft: Entity, requestKey: string) {
  return owner.mutation(api.painter.command, { command: { action: 'article.publish', entityId: draft.id, expectedRevision: draft.revision, requestKey, input: {} } });
}

describe('authenticated CMS writes to anonymous published reads', () => {
  it('creates, edits and publishes via real mutations; exact retry does not append duplicate effects', async () => {
    const { t, owner, workspace } = await setup();
    const draft = await createDraft(owner, 'create', 'walls');
    expect(await t.query(api.painter.articles, { workspaceId: workspace.id })).toEqual([]);
    const edit = await owner.mutation(api.painter.command, { command: { action: 'article.update', entityId: draft.id, expectedRevision: draft.revision, requestKey: 'edit', input: { title: 'Finished walls', content: 'Published craftsmanship' } } });
    const result = await publish(owner, edit.entity, 'publish');
    const beforeReplay = await t.run(async ctx => ({ events: await ctx.db.query('painterEvents').collect(), receipts: await ctx.db.query('painterReceipts').collect() }));
    expect((await publish(owner, edit.entity, 'publish')).replayed).toBe(true);
    expect(await t.run(async ctx => ({ events: await ctx.db.query('painterEvents').collect(), receipts: await ctx.db.query('painterReceipts').collect() }))).toEqual(beforeReplay);
    expect(await t.query(api.painter.articles, { workspaceId: workspace.id, slug: 'walls' })).toEqual([
      { id: draft.id, title: 'Finished walls', slug: 'walls', content: 'Published craftsmanship', publishedAt: result.entity.data.publishedAt },
    ]);
    await expect(owner.mutation(api.painter.command, { command: { action: 'article.update', entityId: draft.id, requestKey: 'edit-published', input: { title: 'Changed' } } })).rejects.toThrow('INVALID_TRANSITION');
  });

  it('isolates tenant output and excludes drafts, private visibility and internal fields after actual publishing', async () => {
    const { t, owner, workspace } = await setup();
    const publicDraft = await createDraft(owner, 'public-create', 'shared-slug');
    await publish(owner, publicDraft, 'public-publish');
    await createDraft(owner, 'draft-create', 'still-draft');
    const privateDraft = await createDraft(owner, 'private-create', 'private');
    await publish(owner, privateDraft, 'private-publish');
    // Internal/private visibility fixtures supplement real create/publish, not replace them.
    await t.run(async ctx => {
      for (const row of await ctx.db.query('painterEntities').collect()) {
        await ctx.db.patch(row._id, { data: { ...row.data, privateNotes: 'INTERNAL_ONLY', ...(row.entityId === privateDraft.id ? { public: false } : {}) } });
      }
    });
    const other = t.withIdentity({ subject: 'other-owner', email: 'other@example.invalid', name: 'Other', emailVerified: true });
    const otherWorkspace = await other.mutation(api.painter.createWorkspace, { name: 'Other workspace' });
    const otherDraft = await createDraft(other, 'other-create', 'shared-slug');
    await publish(other, otherDraft, 'other-publish');
    const publicRows = await t.query(api.painter.articles, { workspaceId: workspace.id });
    expect(publicRows.map((row: { id: string }) => row.id)).toEqual([publicDraft.id]);
    expect(Object.keys(publicRows[0]).sort()).toEqual(['content', 'id', 'publishedAt', 'slug', 'title']);
    expect(JSON.stringify(publicRows)).not.toContain('INTERNAL_ONLY');
    expect(await t.query(api.painter.articles, { workspaceId: workspace.id, slug: 'private' })).toEqual([]);
    expect((await t.query(api.painter.articles, { workspaceId: otherWorkspace.id }))[0].id).toBe(otherDraft.id);
  });

  it('denies unauthenticated, nonmember, unauthorized member and foreign workspace writes without effects', async () => {
    const { t, owner, workspace } = await setup();
    const draft = await createDraft(owner, 'create', 'draft');
    const command = { action: 'article.publish', entityId: draft.id, expectedRevision: draft.revision, requestKey: 'denied', input: {} };
    const before = await t.run(async ctx => ({ entities: await ctx.db.query('painterEntities').collect(), events: await ctx.db.query('painterEvents').collect(), receipts: await ctx.db.query('painterReceipts').collect() }));
    await expect(t.mutation(api.painter.command, { command })).rejects.toThrow('UNAUTHENTICATED');
    await expect(t.withIdentity({ subject: 'nonmember', email: 'nonmember@example.invalid' }).mutation(api.painter.command, { command })).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
    await t.run(async ctx => { await ctx.db.insert('painterMembers', { tenantId: workspace.id, userId: 'crew', name: 'Crew', email: 'crew@example.invalid', role: 'crew_member', enabled: true }); });
    await expect(t.withIdentity({ subject: 'crew', email: 'crew@example.invalid' }).mutation(api.painter.command, { command })).rejects.toThrow('FORBIDDEN');
    const other = t.withIdentity({ subject: 'other-owner', name: 'Other', email: 'other@example.invalid', emailVerified: true });
    const otherWorkspace = await other.mutation(api.painter.createWorkspace, { name: 'Other workspace' });
    await expect(other.mutation(api.painter.command, { workspaceId: workspace.id, command })).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
    await expect(other.mutation(api.painter.command, { workspaceId: otherWorkspace.id, command })).rejects.toThrow('NOT_FOUND_OR_FORBIDDEN');
    expect(await t.run(async ctx => ({ entities: await ctx.db.query('painterEntities').collect(), events: await ctx.db.query('painterEvents').collect(), receipts: await ctx.db.query('painterReceipts').collect() }))).toEqual(before);
    expect(await t.query(api.painter.articles, { workspaceId: workspace.id })).toEqual([]);
  });

  it('reauthorizes membership before replaying a confirmed publish receipt', async () => {
    const { t, owner, workspace } = await setup();
    const draft = await createDraft(owner, 'create', 'walls');
    await publish(owner, draft, 'publish');
    await t.run(async ctx => {
      const member = await ctx.db.query('painterMembers').withIndex('by_tenant_user', q => q.eq('tenantId', workspace.id).eq('userId', 'cms-owner')).unique();
      await ctx.db.patch(member!._id, { enabled: false });
    });
    const beforeReplay = await t.run(async ctx => ({ entities: await ctx.db.query('painterEntities').collect(), events: await ctx.db.query('painterEvents').collect(), receipts: await ctx.db.query('painterReceipts').collect() }));
    await expect(publish(owner, draft, 'publish')).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
    expect(await t.run(async ctx => ({ entities: await ctx.db.query('painterEntities').collect(), events: await ctx.db.query('painterEvents').collect(), receipts: await ctx.db.query('painterReceipts').collect() }))).toEqual(beforeReplay);
    expect((await t.query(api.painter.articles, { workspaceId: workspace.id }))[0].id).toBe(draft.id);
  });
});
