import { describe, expect, it } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../convex/schema';
import { api } from '../convex/runtime';

const modules = {
  './_generated/test-root-marker.ts': () => Promise.resolve({}),
  './platformAccess.ts': () => import('../convex/platformAccess'),
  './platformInventory.ts': () => import('../convex/platformInventory'),
};

async function fixture() {
  const t = convexTest(schema, modules);
  t.registerComponent('betterAuth', betterAuthTest.schema, {
    ...betterAuthTest.modules,
    './component/adapter.ts': () => import('../../../node_modules/@convex-dev/better-auth/src/component/adapter'),
    './component/_generated/test-root-marker.ts': () => Promise.resolve({}),
  });
  const identity = await t.runInComponent('betterAuth', async ctx => {
    const userId = await ctx.db.insert('user', { name: 'Operator', email: 'synthetic@example.test', emailVerified: true, createdAt: 1, updatedAt: 1 });
    const sessionId = await ctx.db.insert('session', { userId, token: 'synthetic-inventory-test', expiresAt: Date.now() + 60000, createdAt: 1, updatedAt: 1 });
    return { userId, sessionId };
  });
  const user = t.withIdentity({ subject: identity.userId, sessionId: identity.sessionId });
  const workspaceIds = await t.run(async ctx => {
    const ids = [];
    for (let i = 0; i < 7; i++) ids.push(await ctx.db.insert('painterWorkspaces', { name: `Workspace ${i}`, ownerId: `private-owner-${i}`, createdAt: `2026-10-0${i + 1}T12:00:00.000Z`, demo: i === 0 }));
    await ctx.db.insert('painterMembers', { tenantId: ids[0], userId: identity.userId, name: 'Tenant owner', email: 'private-customer@example.test', role: 'owner', enabled: true });
    await ctx.db.insert('painterEntities', { tenantId: ids[0], entityId: 'private-customer', type: 'customer', revision: 1, createdAt: 'test', updatedAt: 'test', data: { email: 'private-customer@example.test', balance: 500 } });
    return ids;
  });
  const grant = () => t.run(ctx => ctx.db.insert('platformOwners', { slot: 'initial-platform-owner', userId: identity.userId, enabled: true, grantedAt: 1 }));
  return { t, user, grant, workspaceIds, ...identity };
}

describe('read-only platform inventory with actual Better Auth adapter', () => {
  it('denies anonymous reads and tenant owners without disclosing workspace existence', async () => {
    const { t, user, workspaceIds } = await fixture();
    for (const [caller, state] of [[t, 'unauthenticated'], [user, 'denied']] as const) {
      expect(await caller.query(api.platformInventory.access, {})).toEqual({ state });
      expect(await caller.query(api.platformInventory.list, { cursor: null, limit: 3 })).toEqual({ state });
      expect(await caller.query(api.platformInventory.get, { id: workspaceIds[0] })).toEqual({ state });
      expect(await caller.query(api.platformInventory.get, { id: 'invalid' })).toEqual({ state });
    }
    expect(await t.run(ctx => ctx.db.query('painterWorkspaces').collect())).toHaveLength(7);
  });

  it('returns only the four allowed fields, and stable bounded cursor pages without duplicates', async () => {
    const { user, grant, workspaceIds } = await fixture();
    await grant();
    expect(await user.query(api.platformInventory.access, {})).toEqual({ state: 'ready' });
    const first = await user.query(api.platformInventory.list, { cursor: null, limit: 3 });
    expect(first.state).toBe('ready'); expect(first.items).toHaveLength(3); expect(first.nextCursor).toEqual(expect.any(String));
    const second = await user.query(api.platformInventory.list, { cursor: first.nextCursor, limit: 3 });
    const last = await user.query(api.platformInventory.list, { cursor: second.nextCursor, limit: 3 });
    expect(last.items).toHaveLength(1); expect(last.nextCursor).toBeNull();
    const items = [...first.items, ...second.items, ...last.items];
    expect(new Set(items.map(x => x.id)).size).toBe(7);
    expect(items.map(x => x.id)).toEqual([...workspaceIds].reverse());
    for (const item of items) expect(Object.keys(item).sort()).toEqual(['createdAt', 'demo', 'id', 'name']);
    expect(JSON.stringify(items)).not.toMatch(/private|ownerId|email|balance|entities|members|_creationTime/);
    expect(await user.query(api.platformInventory.get, { id: items[0].id })).toEqual({ state: 'ready', workspace: items[0] });
  });

  it('checks current privilege again for every page and detail after revocation', async () => {
    const { t, user, grant, workspaceIds } = await fixture();
    const ownerId = await grant();
    const first = await user.query(api.platformInventory.list, { cursor: null, limit: 2 });
    await t.run(ctx => ctx.db.patch(ownerId, { enabled: false }));
    expect(await user.query(api.platformInventory.list, { cursor: first.nextCursor, limit: 2 })).toEqual({ state: 'denied' });
    expect(await user.query(api.platformInventory.get, { id: workspaceIds[0] })).toEqual({ state: 'denied' });
    expect(await user.query(api.platformAccess.current, {})).toBe(false);
  });

  it('rejects expired or missing sessions, nonexistent users and newly unverified users', async () => {
    const { t, user, userId, sessionId, grant } = await fixture(); await grant();
    expect(await t.withIdentity({ subject: userId, sessionId: 'missing-session' }).query(api.platformInventory.list, { cursor: null, limit: 1 })).toEqual({ state: 'unauthenticated' });
    expect(await t.withIdentity({ subject: 'different-user', sessionId }).query(api.platformInventory.access, {})).toEqual({ state: 'unauthenticated' });
    await t.runInComponent('betterAuth', ctx => ctx.db.patch(userId, { emailVerified: false }));
    expect(await user.query(api.platformInventory.list, { cursor: null, limit: 1 })).toEqual({ state: 'denied' });
    await t.runInComponent('betterAuth', ctx => ctx.db.patch(sessionId, { expiresAt: 0 }));
    expect(await user.query(api.platformInventory.get, { id: 'invalid' })).toEqual({ state: 'unauthenticated' });
  });

  it('bounds page size and cursor, rejects browser role/table overrides, and distinguishes an empty inventory', async () => {
    const { t, user, grant, workspaceIds } = await fixture(); await grant();
    for (const limit of [0, -1, 1.5, 51]) await expect(user.query(api.platformInventory.list, { cursor: null, limit })).rejects.toThrow('INVALID_PLATFORM_PAGINATION');
    await expect(user.query(api.platformInventory.list, { cursor: 'x'.repeat(4097), limit: 1 })).rejects.toThrow('INVALID_PLATFORM_PAGINATION');
    await expect(user.query(api.platformInventory.list, { cursor: null, limit: 1, role: 'owner', table: 'painterEntities' })).rejects.toThrow();
    await expect(user.query(api.platformInventory.get, { id: 'invalid' })).rejects.toThrow('INVALID_PLATFORM_WORKSPACE');
    await t.run(async ctx => { for (const id of workspaceIds) await ctx.db.delete(id); });
    expect(await user.query(api.platformInventory.list, { cursor: null, limit: 50 })).toEqual({ state: 'ready', items: [], nextCursor: null });
    expect(await user.query(api.platformInventory.get, { id: workspaceIds[0] })).toEqual({ state: 'not_found' });
  });
});
