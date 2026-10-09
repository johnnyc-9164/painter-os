import { describe, expect, it } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../convex/schema';
import { api } from '../convex/runtime';

const modules = {
  './_generated/test-root-marker.ts': () => Promise.resolve({}),
  './platformAccess.ts': () => import('../convex/platformAccess'),
  './platformActivity.ts': () => import('../convex/platformActivity'),
  './platformInventory.ts': () => import('../convex/platformInventory'),
};

async function fixture(documentsRead?: number) {
  const t = convexTest({ schema, modules, transactionLimits: documentsRead === undefined ? false : { documentsRead, bytesRead: 32768 } });
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

describe('redacted platform activity with actual Better Auth sessions', () => {
  it('reads only a bounded page plus authorization despite hundreds of audit and unrelated rows', async () => {
    const { t, user, grant, userId, workspaceIds } = await fixture(8); await grant();
    await t.run(async ctx => {
      for (let i = 0; i < 200; i++) {
        await ctx.db.insert('platformOwnerAudit', { userId, requestKey: `private-noise-${i}`, fingerprint: 'private', operatorReceiptReference: 'private', action: 'bootstrap', occurredAt: i, beforeEnabled: false, afterEnabled: true });
        await ctx.db.insert('painterEntities', { tenantId: workspaceIds[0], entityId: `noise-${i}`, type: 'customer', revision: 1, createdAt: 'test', updatedAt: 'test', data: { private: 'x'.repeat(1024) } });
        await ctx.db.insert('painterEvents', { tenantId: workspaceIds[0], eventId: `noise-${i}`, type: 'changed', entityId: `noise-${i}`, actorId: userId, occurredAt: 'test', payload: { private: 'x'.repeat(1024) } });
      }
    });
    const first = await user.query(api.platformActivity.list, { cursor: null, limit: 2 });
    const second = await user.query(api.platformActivity.list, { cursor: first.nextCursor, limit: 2 });
    expect(first.items.map(item => item.occurredAt)).toEqual([199, 198]);
    expect(second.items.map(item => item.occurredAt)).toEqual([197, 196]);
    expect(first.nextCursor).toEqual(expect.any(String));
    expect(JSON.stringify(first)).not.toMatch(/private|userId|requestKey|fingerprint/);
  });
  it('denies anonymous and tenant owner callers before reading audit records or validating cursors', async () => {
    const { t, user } = await fixture();
    expect(await t.query(api.platformActivity.list, { cursor: null, limit: 2 })).toEqual({ state: 'unauthenticated' });
    expect(await user.query(api.platformActivity.list, { cursor: '', limit: 0 })).toEqual({ state: 'denied' });
  });
  it('paginates in reverse creation order, redacts private audit references, and rechecks revoked access', async () => {
    const { t, user, grant, userId } = await fixture(); const owner = await grant();
    const ids = await t.run(async ctx => {
      const ids = [];
      for (let i = 0; i < 5; i++) ids.push(await ctx.db.insert('platformOwnerAudit', { userId, requestKey: `private-${i}`, fingerprint: 'private-fingerprint', operatorReceiptReference: 'private-receipt', identityProofReference: 'private-proof', action: i % 2 ? 'revoke' : 'bootstrap', occurredAt: i, beforeEnabled: false, afterEnabled: true }));
      return ids;
    });
    const first = await user.query(api.platformActivity.list, { cursor: null, limit: 2 });
    const second = await user.query(api.platformActivity.list, { cursor: first.nextCursor, limit: 2 });
    const last = await user.query(api.platformActivity.list, { cursor: second.nextCursor, limit: 2 });
    const items = [...first.items, ...second.items, ...last.items];
    expect(items.map(item => item.id)).toEqual(ids.reverse()); expect(last.nextCursor).toBeNull();
    for (const item of items) expect(Object.keys(item).sort()).toEqual(['action', 'afterEnabled', 'beforeEnabled', 'id', 'occurredAt']);
    expect(JSON.stringify(items)).not.toMatch(/private|userId|requestKey|fingerprint|Receipt|Proof/);
    await t.run(ctx => ctx.db.patch(owner, { enabled: false }));
    expect(await user.query(api.platformActivity.list, { cursor: first.nextCursor, limit: 2 })).toEqual({ state: 'denied' });
  });
  it('returns an empty page, enforces bounds, and rejects unverified or expired identities', async () => {
    const { t, user, grant, userId, sessionId } = await fixture(); await grant();
    expect(await user.query(api.platformActivity.list, { cursor: null, limit: 50 })).toEqual({ state: 'ready', items: [], nextCursor: null });
    for (const limit of [0, -1, 1.5, 51]) await expect(user.query(api.platformActivity.list, { cursor: null, limit })).rejects.toThrow('INVALID_PLATFORM_PAGINATION');
    await expect(user.query(api.platformActivity.list, { cursor: 'x'.repeat(4097), limit: 1 })).rejects.toThrow('INVALID_PLATFORM_PAGINATION');
    await expect(user.query(api.platformActivity.list, { cursor: null, limit: 1, role: 'owner' })).rejects.toThrow();
    await t.runInComponent('betterAuth', ctx => ctx.db.patch(userId, { emailVerified: false }));
    expect(await user.query(api.platformActivity.list, { cursor: null, limit: 1 })).toEqual({ state: 'denied' });
    await t.runInComponent('betterAuth', ctx => ctx.db.patch(sessionId, { expiresAt: 0 }));
    expect(await user.query(api.platformActivity.list, { cursor: null, limit: 1 })).toEqual({ state: 'unauthenticated' });
  });
});
