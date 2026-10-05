import { AgentMail } from '@agentmail/convex';
import { internalMutationGeneric, type MutationBuilder } from 'convex/server';
import { v } from 'convex/values';
import { components, query, type DataModel } from './runtime';
import { resolvePainterMembership } from './painter';

const internalMutation = internalMutationGeneric as MutationBuilder<DataModel, 'internal'>;
const workspaceArgs = { workspaceId: v.id('painterWorkspaces') };

export interface InboxCacheProjection {
  binding: 'absent' | 'configured';
  configuredSender?: string;
  cache: 'absent' | 'present';
  transport: { outbound: 'disabled'; inbound: 'disabled'; senderVerification: 'unverified' };
}

/** Trusted host assignment only, not a browser registration or provider ownership proof. */
export const bindInbox = internalMutation({
  args: { ...workspaceArgs, inboxId: v.string(), configuredSender: v.string() },
  handler: async (ctx, args) => {
    const { actor, workspace } = await resolvePainterMembership(ctx, args.workspaceId);
    if (actor.role !== 'owner') throw new Error('FORBIDDEN');
    const inboxId = args.inboxId.trim();
    const configuredSender = args.configuredSender.trim();
    if (!inboxId || inboxId.length > 254 || /[\s\u0000-\u001f]/.test(inboxId) || !configuredSender || configuredSender.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredSender)) {
      throw new Error('INVALID_EMAIL_BINDING');
    }
    const inbox = await ctx.db.query('painterEmailBindings').withIndex('by_inbox', q => q.eq('inboxId', inboxId)).unique();
    if (inbox && inbox.tenantId !== workspace._id) throw new Error('INBOX_ALREADY_BOUND');
    const existing = await ctx.db.query('painterEmailBindings').withIndex('by_tenant', q => q.eq('tenantId', workspace._id)).unique();
    if (existing) {
      if (existing.inboxId !== inboxId || existing.configuredSender !== configuredSender) throw new Error('EMAIL_BINDING_CONFLICT');
      return { bound: true as const, replayed: true, transport: 'disabled' as const };
    }
    await ctx.db.insert('painterEmailBindings', { tenantId: workspace._id, inboxId, configuredSender, enabled: false, createdBy: actor.id });
    return { bound: true as const, replayed: false, transport: 'disabled' as const };
  },
});

/** One tenant-selected cache row, no lists, remote reads, provider status IDs or raw data. */
export const inbox = query({
  args: workspaceArgs,
  handler: async (ctx, args): Promise<InboxCacheProjection> => {
    const { actor, workspace } = await resolvePainterMembership(ctx, args.workspaceId);
    if (!['owner', 'office_admin'].includes(actor.role)) throw new Error('FORBIDDEN');
    const binding = await ctx.db.query('painterEmailBindings').withIndex('by_tenant', q => q.eq('tenantId', workspace._id)).unique();
    const transport = { outbound: 'disabled' as const, inbound: 'disabled' as const, senderVerification: 'unverified' as const };
    if (!binding) return { binding: 'absent' as const, cache: 'absent' as const, transport };
    // Explicit empty webhookSecret prevents constructor environment lookup. Cached read has no API/credentials.
    const provider = new AgentMail(components.agentmail, { webhookSecret: '' });
    const cached = await provider.getCachedInbox(ctx, binding.inboxId);
    return {
      binding: 'configured' as const,
      configuredSender: binding.configuredSender,
      cache: cached ? 'present' as const : 'absent' as const,
      transport,
    };
  },
});
