import { internalMutationGeneric, type GenericMutationCtx, type MutationBuilder } from 'convex/server';
import { v } from 'convex/values';
import { RateLimiter, MINUTE } from '@convex-dev/rate-limiter';
import { components, type DataModel, type Id } from './runtime';
import { validateIntakeSettings } from '../intake-contract';
import { INTAKE_ADMISSION, validateAdmissionInput, type IntakeAdmissionInput, type AdmissionResult, type AdmissionOutcome } from '../intake-admission-contract';
import { admissionResult } from './intakeAdmissionValidators';

const internalMutation = internalMutationGeneric as MutationBuilder<DataModel,'internal'>;
export const intakeRateLimiter = new RateLimiter(components.rateLimiter, {
  intakeGlobalAttempts: {kind: 'fixed window', rate: INTAKE_ADMISSION.globalAttemptsPerMinute, period: MINUTE, start: 0, shards: 1, applyUpdates: 'transactionally'},
  intakeTenantAttempts: {kind: 'fixed window', rate: INTAKE_ADMISSION.tenantAttemptsPerMinute, period: MINUTE, start: 0, shards: 1, applyUpdates: 'transactionally'},
});

/** Private host seam. A future trusted dispatcher resolves site/workspace and
 * derives the digest; no public function or browser actor/IP authority exists.
 * Re-resolve enabled policy even on replay; admission is not effect authority. */
export async function admitIntake(ctx: GenericMutationCtx<DataModel>, args: IntakeAdmissionInput & {workspaceId: Id<'painterWorkspaces'>}): Promise<AdmissionResult> {
  validateAdmissionInput(args);
  const workspace = await ctx.db.get(args.workspaceId);
  if (!workspace) return {state: 'denied', reason: 'unavailable', replayed: false};
  const policy = await ctx.db.query('painterIntakeConfigs').withIndex('by_tenant', q=>q.eq('tenantId',workspace._id)).unique();
  if (!policy?.enabled) return {state: 'denied', reason: 'unavailable', replayed: false};
  validateIntakeSettings({enabled: policy.enabled, servicePostalCodes: policy.servicePostalCodes, supportedProjectTypes: policy.supportedProjectTypes, consentText: policy.consentText});
  if (!Number.isSafeInteger(policy.revision) || policy.revision < 1) throw new Error('INVALID_INTAKE_REVISION');
  const now = Date.now();
  const previous = await ctx.db.query('painterIntakeAdmissionReceipts').withIndex('by_tenant_and_request',q=>q.eq('tenantId',workspace._id).eq('requestKey',args.requestKey)).unique();
  if (previous) {
    if (previous.payloadDigest !== args.payloadDigest) return {state: 'denied', reason: 'request_conflict', replayed: false};
    if (previous.expiresAt <= now) return {state: 'denied', reason: 'receipt_expired', replayed: false};
    if (previous.policyRevision !== policy.revision) return {state: 'denied', reason: 'policy_changed', replayed: false};
    // Preserve absolute retry timing; a replay never re-debits a quota.
    const result = previous.result;
    if (result.state === 'denied') return {...result, retryAfterMs: Math.max(0, previous.createdAt + result.retryAfterMs - now), replayed: true};
    return {...result, replayed: true};
  }
  // Attempt ceilings, not admitted-only fairness: a successful dimension debit
  // remains committed even if the other dimension rejects this attempt.
  // Saturated dimensions do not consume further tokens (upstream semantics).
  const global = await intakeRateLimiter.limit(ctx,'intakeGlobalAttempts');
  const tenant = await intakeRateLimiter.limit(ctx,'intakeTenantAttempts',{key: String(workspace._id)});
  const result: AdmissionOutcome = !global.ok || !tenant.ok
    ? {state: 'denied', reason: !global.ok ? 'global_limit' : 'tenant_limit', retryAfterMs: Math.ceil(Math.max(global.retryAfter ?? 0,tenant.retryAfter ?? 0)), policyRevision: policy.revision}
    : {state: 'admitted', policyRevision: policy.revision};
  // Neither dimension consumed capacity: do not let unique rejected keys
  // create unbounded receipts. Without a durable receipt, a later window may
  // freshly admit this key. Partial debits still require durable deduplication.
  if (!global.ok && !tenant.ok) return {...result,replayed: false};
  // Structured denial deliberately commits quota updates and its small receipt.
  // Throwing from a parent mutation instead would roll back both components.
  await ctx.db.insert('painterIntakeAdmissionReceipts',{tenantId: workspace._id, requestKey: args.requestKey, payloadDigest: args.payloadDigest, policyRevision: policy.revision, result, createdAt: now, expiresAt: now + INTAKE_ADMISSION.receiptTtlMs});
  return {...result,replayed: false};
}

export const admit = internalMutation({
  args: {workspaceId: v.id('painterWorkspaces'), requestKey: v.string(), payloadDigest: v.string()},
  returns: admissionResult,
  handler: admitIntake,
});

/** Bounded internal maintenance. After TTL and deletion, the same key is a new
 * admission attempt; eternal business/effect idempotency belongs to its writer. */
export const cleanupExpired = internalMutation({
  args: {}, returns: v.object({deleted: v.number(), more: v.boolean()}),
  handler: async ctx => {
    const rows = await ctx.db.query('painterIntakeAdmissionReceipts').withIndex('by_expires_at',q=>q.lte('expiresAt',Date.now())).take(INTAKE_ADMISSION.cleanupBatch + 1);
    for (const row of rows.slice(0,INTAKE_ADMISSION.cleanupBatch)) await ctx.db.delete(row._id);
    return {deleted: Math.min(rows.length,INTAKE_ADMISSION.cleanupBatch), more: rows.length > INTAKE_ADMISSION.cleanupBatch};
  },
});
