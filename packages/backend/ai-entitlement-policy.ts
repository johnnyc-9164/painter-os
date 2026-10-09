import { z } from 'zod';

const id = z.string().trim().min(1).max(200);
const count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const revision = count.min(1);
const scope = { actorId: id, workspaceId: id };
const capability = z.enum(['workspace_summary', 'recommendation_draft']);
const provenance = z.object({ recordId: id, revision, auditEventId: id }).strict();
const grantBase = {
  ...scope, id, revision, state: z.enum(['active', 'revoked']), expiresAtMs: count,
  capabilities: z.array(capability).min(1).refine(values => new Set(values).size === values.length),
};
const entitlement = z.discriminatedUnion('kind', [
  z.object({ ...grantBase, kind: z.literal('paid_customer'), billingEvidence: provenance }).strict(),
  z.object({ ...grantBase, kind: z.literal('internal'), platformGrant: z.object({
    ...provenance.shape, issuedByActorId: id, platformOwnerGrantId: id, platformOwnerGrantRevision: revision,
  }).strict() }).strict(),
]);
const providerPermission = z.object({
  ...scope, id, revision, mode: z.enum(['openai_api', 'openai_subscription']),
  registered: z.boolean(), commercialUseAllowed: z.boolean(),
  state: z.enum(['active', 'revoked']), expiresAtMs: count, provenance,
}).strict();
const budget = z.object({
  ...scope, entitlementId: id, entitlementRevision: revision, periodId: id, revision,
  periodStartsAtMs: count, periodEndsAtMs: count,
  limitAttempts: count, settledAttempts: count, reservedAttempts: count,
}).strict();
const admission = z.object({
  ...scope, operationId: id, nowMs: count, capability,
  maxBillableAttempts: count.min(1), entitlement, providerPermission, budget,
}).strict();

export type AiEntitlement = z.infer<typeof entitlement>;
export type AiProviderPermission = z.infer<typeof providerPermission>;
export type AiBudgetView = z.infer<typeof budget>;
export type AiAdmissionInput = z.infer<typeof admission>;
export type AiRefusal = 'quota_exhausted' | 'provider_not_authorized' | 'entitlement_required' | 'expired' | 'revoked' | 'unsupported';
export type AiAdmissionDecision = { allowed: false; reason: AiRefusal } | {
  allowed: true;
  admission: {
    actorId: string; workspaceId: string; operationId: string; capability: AiAdmissionInput['capability'];
    entitlementId: string; entitlementRevision: number; budgetRevision: number; periodId: string;
    providerPermissionId: string; providerPermissionRevision: number; maxBillableAttempts: number;
  };
};

function deny(reason: AiRefusal): AiAdmissionDecision { return { allowed: false, reason }; }
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/** Validates a supplied server-authoritative view; establishes no identity, grant or reservation.
 * The caller must atomically reserve against current persisted grant/provider/budget revisions.
 */
export function evaluateAiEntitlement(input: AiAdmissionInput): AiAdmissionDecision {
  const raw = object(input);
  if (!capability.safeParse(raw.capability).success) return deny('unsupported');
  const grantResult = entitlement.safeParse(raw.entitlement);
  if (!grantResult.success) return deny('entitlement_required');
  const grant = grantResult.data;
  if (grant.actorId !== raw.actorId || grant.workspaceId !== raw.workspaceId) return deny('entitlement_required');
  if (grant.state === 'revoked') return deny('revoked');
  if (!count.safeParse(raw.nowMs).success) return deny('entitlement_required');
  if (grant.expiresAtMs <= (raw.nowMs as number)) return deny('expired');
  if (!grant.capabilities.includes(raw.capability as AiAdmissionInput['capability'])) return deny('unsupported');
  const permissionResult = providerPermission.safeParse(raw.providerPermission);
  if (!permissionResult.success) return deny('provider_not_authorized');
  const permission = permissionResult.data;
  if (permission.actorId !== raw.actorId || permission.workspaceId !== raw.workspaceId
    || !permission.registered || !permission.commercialUseAllowed || permission.state !== 'active'
    || permission.expiresAtMs <= (raw.nowMs as number)
    || (permission.mode === 'openai_subscription' && grant.kind !== 'internal')) return deny('provider_not_authorized');
  const budgetResult = budget.safeParse(raw.budget);
  if (!budgetResult.success || !count.min(1).safeParse(raw.maxBillableAttempts).success) return deny('quota_exhausted');
  const view = budgetResult.data;
  if (view.actorId !== raw.actorId || view.workspaceId !== raw.workspaceId
    || view.entitlementId !== grant.id || view.entitlementRevision !== grant.revision
    || view.periodStartsAtMs > (raw.nowMs as number) || view.periodEndsAtMs <= (raw.nowMs as number)
    || view.periodEndsAtMs <= view.periodStartsAtMs) return deny('quota_exhausted');
  // Subtraction avoids overflow even when individually valid counters approach MAX_SAFE_INTEGER.
  const remaining = view.limitAttempts - view.settledAttempts;
  if (remaining < 0 || view.reservedAttempts > remaining
    || (raw.maxBillableAttempts as number) > remaining - view.reservedAttempts) return deny('quota_exhausted');
  const parsed = admission.safeParse(input);
  if (!parsed.success) return deny('entitlement_required');
  const request = parsed.data;
  return { allowed: true, admission: {
    actorId: request.actorId, workspaceId: request.workspaceId, operationId: request.operationId,
    capability: request.capability, entitlementId: grant.id, entitlementRevision: grant.revision,
    budgetRevision: view.revision, periodId: view.periodId, providerPermissionId: permission.id,
    providerPermissionRevision: permission.revision, maxBillableAttempts: request.maxBillableAttempts,
  } };
}

/** Future authoritative store contracts. Admission is not a reservation. */
export interface AiUsageReservation {
  reservationId: string; operationId: string; actorId: string; workspaceId: string;
  entitlementId: string; entitlementRevision: number; providerPermissionId: string;
  providerPermissionRevision: number; periodId: string; budgetRevision: number;
  maxBillableAttempts: number; state: 'reserved' | 'settled';
}
export interface AiUsageAttempt {
  attemptId: string;
  kind: 'initial' | 'model_retry' | 'recovery_model';
  outcome: 'succeeded' | 'failed' | 'cancelled' | 'unknown';
  billable: boolean;
}
export interface AiUsageSettlement {
  settlementId: string; reservationId: string; operationId: string;
  actorId: string; workspaceId: string; periodId: string;
  attempts: AiUsageAttempt[];
  /** Includes failed/retry/recovery attempts whenever billable; never just successful output. */
  actualBillableAttempts: number;
}
