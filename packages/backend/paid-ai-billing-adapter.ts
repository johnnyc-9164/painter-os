import { z } from 'zod';
import type { AiEntitlement } from './ai-entitlement-policy';

const id=z.string().min(1).max(200).refine(value=>value.trim()===value);
const count=z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const revision=count.min(1);
const binding={workspaceId:id,customerId:id,accountId:id,livemode:z.boolean()};
const capability=z.enum(['workspace_summary','recommendation_draft']);
const schema=z.object({
 actorId:id,workspaceId:id,nowMs:count,expectedCurrentRevision:revision,
 binding:z.object(binding).strict(),
 catalog:z.object({accountId:id,livemode:z.boolean(),productId:id,priceId:id,
  capabilities:z.array(capability).min(1).max(2).refine(values=>new Set(values).size===values.length),limitAttempts:count.min(1)}).strict(),
 snapshot:z.object({...binding,recordId:id,revision,auditEventId:id,entitlementId:id,
  subscriptionId:id,productId:id,priceId:id,
  status:z.enum(['active','trialing','incomplete','incomplete_expired','past_due','unpaid','canceled','paused']),
  paidThroughMs:count,cancelAtPeriodEnd:z.boolean(),cancelAtMs:count.nullable(),refundHold:z.boolean(),disputeHold:z.boolean(),
  invoice:z.object({...binding,id,subscriptionId:id,productId:id,priceId:id,status:z.enum(['paid','open','void','uncollectible','draft']),
   qualifiesPaidPurchase:z.boolean(),periodStartsAtMs:count,periodEndsAtMs:count,refundHold:z.boolean(),disputeHold:z.boolean()}).strict(),
 }).strict(),
}).strict();
export type PaidAiBillingInput=z.infer<typeof schema>;
export type PaidAiBillingProjection={eligible:false;reason:'invalid_snapshot'|'binding_mismatch'|'stale_snapshot'|'payment_required'|'billing_hold'|'expired'}|{
 eligible:true;entitlement:Extract<AiEntitlement,{kind:'paid_customer'}>;attemptLimitDescriptor:{limitAttempts:number};
};
/** Projects a separately trusted, reconciled current server record. Establishes no identity,
 * signed-event authenticity, durable reconciliation, provider permission or budget reservation.
 * The future host must compare current revisions atomically; event timestamps are not ordering. */
export function projectPaidAiBilling(input:PaidAiBillingInput):PaidAiBillingProjection{
 const parsed=schema.safeParse(input);if(!parsed.success)return {eligible:false,reason:'invalid_snapshot'};
 const value=parsed.data;const {snapshot,binding:bound,catalog}=value;const {invoice}=snapshot;
 if(snapshot.revision!==value.expectedCurrentRevision)return {eligible:false,reason:'stale_snapshot'};
 if(value.workspaceId!==bound.workspaceId||snapshot.workspaceId!==bound.workspaceId||invoice.workspaceId!==bound.workspaceId
  ||snapshot.customerId!==bound.customerId||invoice.customerId!==bound.customerId
  ||snapshot.accountId!==bound.accountId||invoice.accountId!==bound.accountId||catalog.accountId!==bound.accountId
  ||snapshot.livemode!==bound.livemode||invoice.livemode!==bound.livemode||catalog.livemode!==bound.livemode
  ||snapshot.productId!==catalog.productId||invoice.productId!==catalog.productId
  ||snapshot.priceId!==catalog.priceId||invoice.priceId!==catalog.priceId||invoice.subscriptionId!==snapshot.subscriptionId)return {eligible:false,reason:'binding_mismatch'};
 if(snapshot.refundHold||snapshot.disputeHold||invoice.refundHold||invoice.disputeHold)return {eligible:false,reason:'billing_hold'};
 if(snapshot.status!=='active'||invoice.status!=='paid'||!invoice.qualifiesPaidPurchase
  ||invoice.periodStartsAtMs>value.nowMs||invoice.periodEndsAtMs<=invoice.periodStartsAtMs
  ||snapshot.paidThroughMs>invoice.periodEndsAtMs||snapshot.paidThroughMs<=invoice.periodStartsAtMs
  ||(snapshot.cancelAtPeriodEnd&&snapshot.cancelAtMs===null)||(!snapshot.cancelAtPeriodEnd&&snapshot.cancelAtMs!==null))return {eligible:false,reason:'payment_required'};
 const expiresAtMs=Math.min(snapshot.paidThroughMs,snapshot.cancelAtMs??snapshot.paidThroughMs);
 if(expiresAtMs<=value.nowMs)return {eligible:false,reason:'expired'};
 return {eligible:true,entitlement:{kind:'paid_customer',id:snapshot.entitlementId,revision:snapshot.revision,actorId:value.actorId,
  workspaceId:bound.workspaceId,state:'active',expiresAtMs,capabilities:[...catalog.capabilities],
  billingEvidence:{recordId:snapshot.recordId,revision:snapshot.revision,auditEventId:snapshot.auditEventId}},attemptLimitDescriptor:{limitAttempts:catalog.limitAttempts}};
}
