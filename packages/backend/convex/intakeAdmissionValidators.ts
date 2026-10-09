import { v } from 'convex/values';
export const admissionOutcome = v.union(
  v.object({state: v.literal('admitted'), policyRevision: v.number()}),
  v.object({state: v.literal('denied'), reason: v.union(v.literal('global_limit'),v.literal('tenant_limit')), retryAfterMs: v.number(), policyRevision: v.number()}),
);
export const admissionResult = v.union(
  v.object({state: v.literal('admitted'), policyRevision: v.number(), replayed: v.boolean()}),
  v.object({state: v.literal('denied'), reason: v.union(v.literal('global_limit'),v.literal('tenant_limit')), retryAfterMs: v.number(), policyRevision: v.number(), replayed: v.boolean()}),
  v.object({state: v.literal('denied'), reason: v.union(v.literal('unavailable'),v.literal('request_conflict'),v.literal('policy_changed'),v.literal('receipt_expired')), replayed: v.literal(false)}),
);
export const intakeAdmissionReceiptFields = {
  tenantId: v.id('painterWorkspaces'), requestKey: v.string(), payloadDigest: v.string(), policyRevision: v.number(), result: admissionOutcome, createdAt: v.number(), expiresAt: v.number(),
};
