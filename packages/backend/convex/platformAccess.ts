import { internalMutationGeneric, type MutationBuilder } from 'convex/server';
import { v } from 'convex/values';
import { authComponent } from './auth';
import { query, type DataModel } from './runtime';

const internalMutation = internalMutationGeneric as MutationBuilder<DataModel, 'internal'>;
const targetEmail = 'mplsjohnnycage@makeithappenentllc.com';
const slot = 'initial-platform-owner' as const;
const commonArgs = { userId: v.string(), requestKey: v.string(), operatorReceiptReference: v.string() };
function validate(args: { userId: string; requestKey: string; operatorReceiptReference: string; identityProofReference?: string }) {
  for (const value of Object.values(args)) {
    if (typeof value !== 'string' || !value.trim() || value.length > 500) throw new Error('INVALID_PLATFORM_RECEIPT');
  }
}

/** Self capability only. Workspace roles never confer platform authority. */
export const current = query({
  args: {}, returns: v.boolean(),
  handler: async ctx => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user || !user.emailVerified) return false;
    const owner = await ctx.db.query('platformOwners').withIndex('by_user', q => q.eq('userId', user._id)).unique();
    return owner?.enabled === true;
  },
});

/** Deployment-operator only. Receipt references are audit links, NOT verified caller authority.
 * Before live invocation the trusted operator must externally verify identity proof and
 * an approval receipt bound to this deployment, immutable user ID and approved commit.
 */
export const bootstrap = internalMutation({
  args: { ...commonArgs, identityProofReference: v.string() },
  handler: async (ctx, args) => {
    validate(args);
    const fingerprint = JSON.stringify(['bootstrap', args.userId, args.operatorReceiptReference, args.identityProofReference]);
    const previous = await ctx.db.query('platformOwnerAudit').withIndex('by_request', q => q.eq('requestKey', args.requestKey)).unique();
    const owner = await ctx.db.query('platformOwners').withIndex('by_slot', q => q.eq('slot', slot)).unique();
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new Error('PLATFORM_REQUEST_KEY_CONFLICT');
      // A replay after revocation reports disabled and cannot restore privilege.
      return { enabled: owner?.enabled === true, replayed: true };
    }
    if (owner) throw new Error('PLATFORM_ALREADY_BOOTSTRAPPED');
    const user = await authComponent.getAnyUserById(ctx, args.userId);
    if (!user) throw new Error('PLATFORM_IDENTITY_NOT_FOUND');
    if (user.email !== targetEmail) throw new Error('PLATFORM_IDENTITY_EMAIL_MISMATCH');
    if (!user.emailVerified) throw new Error('PLATFORM_IDENTITY_UNVERIFIED');
    const occurredAt = Date.now();
    await ctx.db.insert('platformOwners', { slot, userId: user._id, enabled: true, grantedAt: occurredAt });
    await ctx.db.insert('platformOwnerAudit', { ...args, fingerprint, action: 'bootstrap', occurredAt, beforeEnabled: false, afterEnabled: true });
    return { enabled: true, replayed: false };
  },
});

/** Same trusted deployment-operator boundary as bootstrap; no caller-supplied actor role. */
export const revoke = internalMutation({
  args: commonArgs,
  handler: async (ctx, args) => {
    validate(args);
    const fingerprint = JSON.stringify(['revoke', args.userId, args.operatorReceiptReference]);
    const previous = await ctx.db.query('platformOwnerAudit').withIndex('by_request', q => q.eq('requestKey', args.requestKey)).unique();
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new Error('PLATFORM_REQUEST_KEY_CONFLICT');
      return { enabled: false, replayed: true };
    }
    const owner = await ctx.db.query('platformOwners').withIndex('by_slot', q => q.eq('slot', slot)).unique();
    if (!owner || owner.userId !== args.userId) throw new Error('PLATFORM_OWNER_NOT_FOUND');
    await ctx.db.patch(owner._id, { enabled: false });
    await ctx.db.insert('platformOwnerAudit', { ...args, fingerprint, action: 'revoke', occurredAt: Date.now(), beforeEnabled: owner.enabled, afterEnabled: false });
    return { enabled: false, replayed: false };
  },
});
