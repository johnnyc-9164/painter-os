import { describe, expect, it } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../convex/schema';
import { api } from '../convex/runtime';

const modules = {
  './_generated/test-root-marker.ts': () => Promise.resolve({}),
  './painter.ts': () => import('../convex/painter'),
};
const tokenHash = 'a'.repeat(64);
const now = '2026-10-05T15:00:00.000Z';
const publicFields = { title: 'Paint walls', status: 'sent', lineItems: [{ description: 'Walls', quantity: 1, unitPrice: 100 }], paintingScope: 'Interior', subtotalCents: 10000, taxCents: 0, totalCents: 10000, depositCents: 2500 };
async function fixture(noise = 0) {
  // Enforce a deliberately tight real transaction budget, including nested SDK queries.
  const t = convexTest({ schema, modules, transactionLimits: { documentsRead: 20, bytesRead: 32768 } });
  t.registerComponent('betterAuth', betterAuthTest.schema, {
    ...betterAuthTest.modules,
    './component/adapter.ts': () => import('../../../node_modules/@convex-dev/better-auth/src/component/adapter'),
    './component/_generated/test-root-marker.ts': () => Promise.resolve({}),
  });
  const identity = await t.runInComponent('betterAuth', async ctx => {
    const userId = await ctx.db.insert('user', { name: 'Owner', email: 'owner@example.test', emailVerified: true, createdAt: 1, updatedAt: 1 });
    const sessionId = await ctx.db.insert('session', { userId, token: 'synthetic-portal-test', expiresAt: Date.now() + 60000, createdAt: 1, updatedAt: 1 });
    return { userId, sessionId };
  });
  const owner = t.withIdentity({ subject: identity.userId, sessionId: identity.sessionId });
  const workspace = await owner.mutation(api.painter.createWorkspace, { name: 'Portal source' });
  const records = await t.run(async ctx => {
    const customerRow = await ctx.db.insert('painterEntities', { tenantId: workspace.id, entityId: 'customer-1', type: 'customer', revision: 1, createdAt: now, updatedAt: now, data: { name: 'Customer', email: 'Customer@Example.Test', notes: 'private customer notes' } });
    const estimateRow = await ctx.db.insert('painterEntities', { tenantId: workspace.id, entityId: 'estimate-1', type: 'estimate', revision: 3, createdAt: now, updatedAt: now, data: { ...publicFields, customerId: 'customer-1', notes: 'private estimate notes' } });
    for (let i = 0; i < noise; i++) {
      await ctx.db.insert('painterEntities', { tenantId: workspace.id, entityId: `unrelated-${i}`, type: 'task', revision: 1, createdAt: now, updatedAt: now, data: { title: `Unrelated ${i}`, privatePayload: 'x'.repeat(1024) } });
      await ctx.db.insert('painterEvents', { tenantId: workspace.id, eventId: `event-${i}`, type: 'task.updated', entityId: `unrelated-${i}`, actorId: identity.userId, occurredAt: now, payload: { note: 'x'.repeat(1024) } });
    }
    return { customerRow, estimateRow };
  });
  return { t, owner, workspace, ...identity, ...records };
}

describe('bounded portal issuance with actual Better Auth and transaction limits', () => {
  it('issues and replays a portal under the same read budget with 500 unrelated entities and audit events', async () => {
    const { t, owner, workspace } = await fixture(500);
    const args = { estimateId: 'estimate-1', tokenHash, expectedRevision: 3 };
    const created = await owner.mutation(api.painter.createPortal, args);
    expect(created).toEqual({ expiresAt: expect.any(Number) });
    expect(created.expiresAt).toBeGreaterThan(Date.now());
    expect(await owner.mutation(api.painter.createPortal, args)).toEqual({ expiresAt: created.expiresAt, replayed: true });
    const row = await t.run(ctx => ctx.db.query('painterPortals').withIndex('by_token', q => q.eq('tokenHash', tokenHash)).unique());
    expect(row).toMatchObject({ tenantId: workspace.id, estimateId: 'estimate-1', customerId: 'customer-1', customerEmail: 'customer@example.test', expiresAt: created.expiresAt });
    expect(row?.scope).toEqual({ id: 'estimate-1', revision: 3, ...publicFields });
    expect(JSON.stringify(row?.scope)).not.toMatch(/notes|private|unrelated|owner/);
    await expect(owner.mutation(api.painter.createPortal, { ...args, expectedRevision: 2 })).rejects.toThrow('REVISION_CONFLICT');
  });

  it('keeps missing, wrong-type, unsent and foreign-tenant estimates unavailable', async () => {
    const { t, owner, estimateRow } = await fixture();
    await expect(owner.mutation(api.painter.createPortal, { estimateId: 'missing', tokenHash })).rejects.toThrow('ESTIMATE_NOT_SENT');
    await expect(owner.mutation(api.painter.createPortal, { estimateId: 'customer-1', tokenHash })).rejects.toThrow('ESTIMATE_NOT_SENT');
    const foreign = await t.run(async ctx => {
      const tenantId = await ctx.db.insert('painterWorkspaces', { name: 'Foreign', ownerId: 'other', createdAt: now, demo: false });
      await ctx.db.insert('painterEntities', { tenantId, entityId: 'foreign-estimate', type: 'estimate', revision: 1, createdAt: now, updatedAt: now, data: { ...publicFields, customerId: 'customer-1' } });
      return tenantId;
    });
    await expect(owner.mutation(api.painter.createPortal, { estimateId: 'foreign-estimate', tokenHash })).rejects.toThrow('ESTIMATE_NOT_SENT');
    await expect(owner.mutation(api.painter.createPortal, { workspaceId: foreign, estimateId: 'foreign-estimate', tokenHash })).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
    await t.run(ctx => ctx.db.patch(estimateRow, { data: { ...publicFields, status: 'draft', customerId: 'customer-1' } }));
    await expect(owner.mutation(api.painter.createPortal, { estimateId: 'estimate-1', tokenHash })).rejects.toThrow('ESTIMATE_NOT_SENT');
    expect(await t.run(ctx => ctx.db.query('painterPortals').collect())).toEqual([]);
  });

  it('requires a linked same-tenant customer with email, preserving denial and no writes', async () => {
    const { t, owner, estimateRow, customerRow } = await fixture();
    await t.run(ctx => ctx.db.patch(customerRow, { type: 'lead' }));
    await expect(owner.mutation(api.painter.createPortal, { estimateId: 'estimate-1', tokenHash })).rejects.toThrow('CUSTOMER_EMAIL_REQUIRED');
    await t.run(ctx => ctx.db.patch(customerRow, { type: 'customer', data: { name: 'Customer' } }));
    await expect(owner.mutation(api.painter.createPortal, { estimateId: 'estimate-1', tokenHash })).rejects.toThrow('CUSTOMER_EMAIL_REQUIRED');
    await t.run(ctx => ctx.db.patch(estimateRow, { data: { ...publicFields } }));
    await expect(owner.mutation(api.painter.createPortal, { estimateId: 'estimate-1', tokenHash })).rejects.toThrow('CUSTOMER_EMAIL_REQUIRED');
    expect(await t.run(ctx => ctx.db.query('painterPortals').collect())).toEqual([]);
  });

  it('never resolves the linked customer from a different tenant with the same business ID', async () => {
    const { t, owner, customerRow } = await fixture();
    await t.run(async ctx => {
      const tenantId = await ctx.db.insert('painterWorkspaces', { name: 'Foreign', ownerId: 'other', createdAt: now, demo: false });
      await ctx.db.insert('painterEntities', { tenantId, entityId: 'customer-1', type: 'customer', revision: 1, createdAt: now, updatedAt: now, data: { name: 'Foreign customer', email: 'foreign@example.test' } });
      await ctx.db.delete(customerRow);
    });
    await expect(owner.mutation(api.painter.createPortal, { estimateId: 'estimate-1', tokenHash })).rejects.toThrow('CUSTOMER_EMAIL_REQUIRED');
    expect(await t.run(ctx => ctx.db.query('painterPortals').collect())).toEqual([]);
  });

  it('preserves anonymous, expired-session and customer-role denial before portal writes', async () => {
    const { t, owner, userId, sessionId } = await fixture(50);
    const args = { estimateId: 'estimate-1', tokenHash };
    await expect(t.mutation(api.painter.createPortal, args)).rejects.toThrow('UNAUTHENTICATED');
    await t.run(async ctx => { const member = await ctx.db.query('painterMembers').withIndex('by_user', q => q.eq('userId', userId)).unique(); await ctx.db.patch(member!._id, { role: 'customer' }); });
    await expect(owner.mutation(api.painter.createPortal, args)).rejects.toThrow('FORBIDDEN');
    await t.runInComponent('betterAuth', ctx => ctx.db.patch(sessionId, { expiresAt: 0 }));
    await expect(owner.mutation(api.painter.createPortal, args)).rejects.toThrow('UNAUTHENTICATED');
    expect(await t.run(ctx => ctx.db.query('painterPortals').collect())).toEqual([]);
  });

  it('fails closed on ambiguous duplicate business IDs instead of selecting one row', async () => {
    const { t, owner, workspace } = await fixture();
    await t.run(ctx => ctx.db.insert('painterEntities', { tenantId: workspace.id, entityId: 'estimate-1', type: 'estimate', revision: 3, createdAt: now, updatedAt: now, data: { ...publicFields, customerId: 'customer-1' } }));
    await expect(owner.mutation(api.painter.createPortal, { estimateId: 'estimate-1', tokenHash })).rejects.toThrow(/unique|more than one/i);
    expect(await t.run(ctx => ctx.db.query('painterPortals').collect())).toEqual([]);
  });

  it('preserves hash validation, viewed status, token conflicts and unchanged replay expiry', async () => {
    const { t, owner, estimateRow } = await fixture();
    await expect(owner.mutation(api.painter.createPortal, { estimateId: 'estimate-1', tokenHash: 'not-a-hash' })).rejects.toThrow('INVALID_TOKEN_HASH');
    const args = { estimateId: 'estimate-1', tokenHash };
    const created = await owner.mutation(api.painter.createPortal, args);
    await t.run(ctx => ctx.db.patch(estimateRow, { revision: 4, data: { ...publicFields, status: 'viewed', customerId: 'customer-1' } }));
    await expect(owner.mutation(api.painter.createPortal, args)).rejects.toThrow('LINK_TOKEN_CONFLICT');
    const second = await owner.mutation(api.painter.createPortal, { ...args, tokenHash: 'b'.repeat(64), expectedRevision: 4 });
    expect(second.expiresAt).toBeGreaterThanOrEqual(created.expiresAt);
    expect(await owner.mutation(api.painter.createPortal, { ...args, tokenHash: 'b'.repeat(64), expectedRevision: 4 })).toEqual({ expiresAt: second.expiresAt, replayed: true });
  });
});
