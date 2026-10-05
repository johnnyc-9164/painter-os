import { AgentMail } from '@agentmail/convex';
import { internalMutationGeneric, type GenericMutationCtx, type MutationBuilder } from 'convex/server';
import { v } from 'convex/values';
import { authComponent } from './auth';
import { rejectAgentMailOperation } from './agentmailProvider';
import type { AuthEmailDelivery, AuthEmailMessage } from './authEmailDelivery';
import { api, components, type DataModel } from './runtime';

/** Server-owned scope after separately verified sender/key ownership and operator approval.
 * Never obtain this from signup, workspace membership or a public argument.
 */
export interface ServerVerificationScope {
  readonly inboxId: string;
  readonly userId: string;
  readonly recipient: string;
  readonly authOrigin: string;
}

// Activation remains closed. No environment/config value or caller flag opens it.
const productionScope: ServerVerificationScope | null = null;
const internalMutation = internalMutationGeneric as MutationBuilder<DataModel, 'internal'>;
const messageArgs = { purpose: v.union(v.literal('verify-email'), v.literal('reset-password')), userId: v.string(), to: v.string(), url: v.string() };

/** Prepared core. Call only inside ONE host mutation: budget + receipt + official queue commit atomically.
 * The SDK owns token creation/verification. This function never verifies or changes an auth user.
 */
export async function enqueueConfiguredVerification(
  ctx: GenericMutationCtx<DataModel>, message: AuthEmailMessage, scope: ServerVerificationScope | null,
): Promise<{ state: 'queue-accepted'; delivery: 'unknown'; replayed: boolean; outboundId: string }> {
  if (!scope) rejectAgentMailOperation('send');
  if (message.purpose !== 'verify-email') throw new Error('AUTH_RESET_DELIVERY_HELD');
  if (!scope.inboxId || scope.inboxId.length > 254 || message.url.length > 4096) throw new Error('INVALID_AUTH_DELIVERY_SCOPE');
  if (message.userId !== scope.userId || message.to !== scope.recipient) throw new Error('AUTH_DELIVERY_RECIPIENT_MISMATCH');
  const user = await authComponent.getAnyUserById(ctx, message.userId);
  if (!user || user.email !== message.to) throw new Error('AUTH_DELIVERY_IDENTITY_MISMATCH');
  if (user.emailVerified) throw new Error('AUTH_EMAIL_ALREADY_VERIFIED');
  const origin = new URL(scope.authOrigin);
  const link = new URL(message.url);
  const callback = new URL(link.searchParams.get('callbackURL') || '/', scope.authOrigin);
  if (origin.protocol !== 'https:' || origin.origin !== scope.authOrigin || link.origin !== scope.authOrigin || link.username || link.password || link.pathname !== '/api/auth/verify-email' || !link.searchParams.get('token') || link.searchParams.getAll('token').length !== 1 || link.searchParams.getAll('callbackURL').length > 1 || callback.origin !== scope.authOrigin) throw new Error('INVALID_AUTH_VERIFICATION_LINK');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([message.purpose, message.userId, message.to, message.url])));
  const intentHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const existing = await ctx.db.query('authEmailReceipts').withIndex('by_intent', q => q.eq('intentHash', intentHash)).unique();
  if (existing) {
    if (existing.inboxId !== scope.inboxId) throw new Error('AUTH_DELIVERY_SCOPE_CONFLICT');
    return { state: 'queue-accepted', delivery: 'unknown', replayed: true, outboundId: existing.outboundId };
  }
  const now = Date.now();
  const budget = await ctx.db.query('authEmailBudgets').withIndex('by_recipient_purpose', q => q.eq('recipient', message.to).eq('purpose', 'verify-email')).unique();
  const fresh = !budget || now - budget.windowStartedAt >= 60000;
  if (!fresh && budget.count >= 3) throw new Error('AUTH_EMAIL_RATE_LIMITED');
  if (budget) await ctx.db.patch(budget._id, { count: fresh ? 1 : budget.count + 1, windowStartedAt: fresh ? now : budget.windowStartedAt });
  else await ctx.db.insert('authEmailBudgets', { recipient: message.to, purpose: 'verify-email', count: 1, windowStartedAt: now });
  // Actual published SDK. webhookSecret override avoids inbound credential reads.
  // maxAttempts=1 means one total provider attempt, not an additional retry.
  const provider = new AgentMail(components.agentmail, { webhookSecret: '', retryAttempts: 1 });
  const outboundId = await provider.sendMessage(ctx, scope.inboxId, {
    to: message.to, subject: 'Verify your Painter OS email', text: `Verify your email address: ${message.url}`,
  });
  await ctx.db.insert('authEmailReceipts', { intentHash, userId: user._id, recipient: message.to, purpose: 'verify-email', inboxId: scope.inboxId, outboundId, createdAt: now });
  // A queued ID proves neither delivery nor an exactly-once external side effect.
  return { state: 'queue-accepted', delivery: 'unknown', replayed: false, outboundId };
}

/** Uninstalled callback target, internal only. Production remains denied until separately approved activation. */
export const enqueue = internalMutation({
  args: messageArgs,
  handler: (ctx, args) => enqueueConfiguredVerification(ctx, args, productionScope),
});

/** Prepared adapter for existing SDK callbacks. createAuth does not install this. */
export function createPreparedAgentMailAuthDelivery(ctx: Pick<GenericMutationCtx<DataModel>, 'runMutation'>): AuthEmailDelivery {
  return { async send(message) { await ctx.runMutation(api.authVerificationDelivery.enqueue, { ...message }); } };
}
