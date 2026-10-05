import { describe, expect, it, vi } from 'vitest';
import { convexTest } from 'convex-test';
import agentmailTest from '@agentmail/convex/test';
import schema from '../convex/schema';
import { api } from '../convex/runtime';

// Only Better Auth identity lookup is mocked. Real host resolver/database and official cache SDK/component run.
vi.mock('../convex/auth', () => ({ authComponent: { safeGetAuthUser: async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  return identity ? { _id: identity.subject, name: identity.name, email: identity.email } : null;
} } }));
const modules = {
  './_generated/test-root-marker.ts': () => Promise.resolve({}),
  './painter.ts': () => import('../convex/painter'),
  './agentmailCache.ts': () => import('../convex/agentmailCache'),
  './runtime.ts': () => import('../convex/runtime'),
};
async function fixture() {
  const t = convexTest(schema, modules);
  // Published test glob includes .ts functions but its generated runtime files are .js.
  // Add only a virtual root marker; real official schema and all actual function modules remain unchanged.
  t.registerComponent('agentmail', agentmailTest.schema, {
    ...agentmailTest.modules,
    // The published helper's node_modules glob omits the runtime lib in Vitest.
    // Load the actual installed official function module explicitly; no handler is copied or mocked.
    './component/lib.ts': () => import('../../../node_modules/@agentmail/convex/src/component/lib'),
    './component/_generated/test-root-marker.ts': () => Promise.resolve({}),
  });
  const owner = t.withIdentity({ subject: 'owner', name: 'Owner', email: 'owner@example.test' });
  const otherOwner = t.withIdentity({ subject: 'other-owner', name: 'Other', email: 'other@example.test' });
  const workspace = await owner.mutation(api.painter.createWorkspace, { name: 'Workspace' });
  const otherWorkspace = await otherOwner.mutation(api.painter.createWorkspace, { name: 'Other' });
  await t.run(async ctx => {
    for (const [userId, role, enabled] of [['admin', 'office_admin', true], ['crew', 'crew_member', true], ['revoked', 'owner', false]] as const) {
      await ctx.db.insert('painterMembers', { tenantId: workspace.id, userId, role, enabled, name: userId, email: `${userId}@example.test` });
    }
  });
  return { t, owner, otherOwner, workspaceId: workspace.id, otherWorkspaceId: otherWorkspace.id };
}
const binding = { inboxId: 'configured-inbox', configuredSender: 'configured@example.test' };

describe('host-owned disabled AgentMail cache facade', () => {
  it('assigns an inbox internally once, rejects cross-tenant claim and keeps transport disabled', async () => {
    const { t, owner, otherOwner, workspaceId, otherWorkspaceId } = await fixture();
    expect((await owner.mutation(api.agentmailCache.bindInbox, { workspaceId, ...binding })).replayed).toBe(false);
    expect((await owner.mutation(api.agentmailCache.bindInbox, { workspaceId, ...binding })).replayed).toBe(true);
    await expect(otherOwner.mutation(api.agentmailCache.bindInbox, { workspaceId: otherWorkspaceId, ...binding })).rejects.toThrow('INBOX_ALREADY_BOUND');
    await expect(owner.mutation(api.agentmailCache.bindInbox, { workspaceId, ...binding, inboxId: 'changed' })).rejects.toThrow('EMAIL_BINDING_CONFLICT');
    await expect(owner.mutation(api.agentmailCache.bindInbox, { workspaceId, ...binding, enabled: true })).rejects.toThrow();
    const row = await t.run(ctx => ctx.db.query('painterEmailBindings').unique());
    expect(row).toMatchObject({ tenantId: workspaceId, enabled: false, createdBy: 'owner', ...binding });
    const module = await import('../convex/agentmailCache');
    expect(module.bindInbox.isInternal).toBe(true);
  });

  it('reuses actual host membership for anonymous, revoked, role and cross-workspace denial', async () => {
    const { t, owner, workspaceId, otherWorkspaceId } = await fixture();
    await expect(t.query(api.agentmailCache.inbox, { workspaceId })).rejects.toThrow('UNAUTHENTICATED');
    await expect(owner.query(api.agentmailCache.inbox, { workspaceId: otherWorkspaceId })).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
    for (const subject of ['crew', 'revoked']) {
      const user = t.withIdentity({ subject });
      await expect(user.query(api.agentmailCache.inbox, { workspaceId })).rejects.toThrow(subject === 'crew' ? 'FORBIDDEN' : 'WORKSPACE_MEMBERSHIP_REQUIRED');
      await expect(user.mutation(api.agentmailCache.bindInbox, { workspaceId, ...binding })).rejects.toThrow();
    }
    const admin = t.withIdentity({ subject: 'admin' });
    await expect(admin.mutation(api.agentmailCache.bindInbox, { workspaceId, ...binding })).rejects.toThrow('FORBIDDEN');
    expect(await admin.query(api.agentmailCache.inbox, { workspaceId })).toMatchObject({ binding: 'absent', cache: 'absent' });
  });

  it('runs actual official single-inbox SDK/component read without environment lookup or transport and strips all provider fields', async () => {
    const { t, owner, otherOwner, workspaceId, otherWorkspaceId } = await fixture();
    await owner.mutation(api.agentmailCache.bindInbox, { workspaceId, ...binding });
    // Test-only fixture data in the official component's own schema; no provider API or mailbox action.
    await t.runInComponent('agentmail', async ctx => {
      for (const inboxId of ['configured-inbox', 'unowned-inbox']) {
        await ctx.db.insert('inboxes', { inboxId, email: 'private@example.test', podId: 'private-pod', clientId: 'private-client', displayName: 'x'.repeat(20000), createdAt: 1, updatedAt: 2 });
      }
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const originalProcess = globalThis.process;
    const envReads: string[] = [];
    vi.stubGlobal('process', new Proxy(originalProcess, { get(target, key) {
      if (key !== 'env') return Reflect.get(target, key);
      return new Proxy({}, { get(_target, envKey) {
        if (String(envKey).startsWith('AGENTMAIL_')) { envReads.push(String(envKey)); throw new Error('UNEXPECTED_PROVIDER_ENV_READ'); }
        return undefined;
      } });
    } }));
    try {
      const projection = await owner.query(api.agentmailCache.inbox, { workspaceId });
      expect(projection).toEqual({ binding: 'configured', configuredSender: binding.configuredSender, cache: 'present', transport: { outbound: 'disabled', inbound: 'disabled', senderVerification: 'unverified' } });
      expect(new TextEncoder().encode(JSON.stringify(projection)).byteLength).toBeLessThan(1024);
      expect(await otherOwner.query(api.agentmailCache.inbox, { workspaceId: otherWorkspaceId })).toMatchObject({ binding: 'absent', cache: 'absent' });
      expect(await t.withIdentity({ subject: 'admin' }).query(api.agentmailCache.inbox, { workspaceId })).toEqual(projection);
      expect(envReads).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); fetchSpy.mockRestore(); }
  });

  it('missing cache does not claim connected, verified or activated and identifiers are bounded', async () => {
    const { owner, workspaceId } = await fixture();
    await expect(owner.mutation(api.agentmailCache.bindInbox, { workspaceId, ...binding, configuredSender: 'x'.repeat(255) })).rejects.toThrow('INVALID_EMAIL_BINDING');
    await expect(owner.mutation(api.agentmailCache.bindInbox, { workspaceId, ...binding, inboxId: 'x'.repeat(255) })).rejects.toThrow('INVALID_EMAIL_BINDING');
    await owner.mutation(api.agentmailCache.bindInbox, { workspaceId, ...binding });
    expect(await owner.query(api.agentmailCache.inbox, { workspaceId })).toMatchObject({ binding: 'configured', cache: 'absent', transport: { outbound: 'disabled', inbound: 'disabled', senderVerification: 'unverified' } });
    await expect(owner.query(api.agentmailCache.inbox, { workspaceId, inboxId: 'unowned' })).rejects.toThrow();
  });
});
