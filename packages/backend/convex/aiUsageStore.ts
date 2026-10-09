import type { GenericMutationCtx, GenericQueryCtx } from 'convex/server';
import type { DataModel, Id } from './runtime';
import { aiCount, aiPositive, aiText, aiFingerprint } from './aiValidators';
import { authComponent } from './auth';
type ReadCtx=GenericQueryCtx<DataModel>;
type WriteCtx=GenericMutationCtx<DataModel>;
type Capability='workspace_summary'|'recommendation_draft';
type Kind='initial'|'model_retry'|'recovery_model';
type Billing='billable'|'not_billable'|'unknown';

/** Private storage authorization; IDs come from the trusted worker or existing membership resolver. */
export async function requireAiAccess(ctx:ReadCtx,tenantId:Id<'painterWorkspaces'>,userId:string,capability:Capability,now:number){
  aiCount(now);aiText(userId);
  const member=await ctx.db.query('painterMembers').withIndex('by_tenant_user',q=>q.eq('tenantId',tenantId).eq('userId',userId)).unique();
  const targetIdentity=await authComponent.getAnyUserById(ctx,userId);
  if(!member?.enabled||member.role==='customer'||!targetIdentity||!await ctx.db.get(tenantId))throw new Error('AI_MEMBERSHIP_REQUIRED');
  const entitlement=await ctx.db.query('aiWorkspaceEntitlements').withIndex('by_tenant',q=>q.eq('tenantId',tenantId)).unique();
  const grant=await ctx.db.query('aiInternalGrants').withIndex('by_tenant_user',q=>q.eq('tenantId',tenantId).eq('userId',userId)).unique();
  if(!entitlement||!grant)throw new Error('AI_ENTITLEMENT_REQUIRED');
  aiPositive(entitlement.revision);aiPositive(grant.revision);aiCount(entitlement.expiresAtMs);aiCount(grant.expiresAtMs);aiPositive(entitlement.limitAttempts,100000);
  if(!grant.enabled)throw new Error('AI_REVOKED');
  if(Math.min(grant.expiresAtMs,entitlement.expiresAtMs)<=now)throw new Error('AI_EXPIRED');
  if(!grant.capabilities.includes(capability)||!entitlement.capabilities.includes(capability))throw new Error('AI_UNSUPPORTED');
  const audit=await ctx.db.get(grant.auditId);
  const issuer= audit ? await ctx.db.get(audit.platformOwnerId) : null;
  const issuerIdentity=issuer ? await authComponent.getAnyUserById(ctx,issuer.userId) : null;
  if(!audit||audit.action!=='grant'||audit.afterRevision!==grant.revision||audit.targetUserId!==userId||audit.tenantId!==tenantId
    ||!issuer?.enabled||audit.issuerId!==issuer.userId||!issuerIdentity?.emailVerified)throw new Error('AI_REVOKED');
  return {member,entitlement,grant};
}
function period(now:number){const d=new Date(now);const start=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1),end=Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1);aiCount(start);aiCount(end);return {periodId:new Date(start).toISOString().slice(0,7),periodStartsAtMs:start,periodEndsAtMs:end};}

/** Private atomic mechanics, NOT provider authorization. Never expose as a public mutation.
 * Positive tests explicitly call this helper with synthetic admission; real entrypoint is held.
 */
export async function reserveStoredUsage(ctx:WriteCtx,args:{tenantId:Id<'painterWorkspaces'>;userId:string;operationId:string;capability:Capability;maxAttempts:number},now:number){
  aiText(args.operationId);aiPositive(args.maxAttempts,128);
  const {entitlement,grant}=await requireAiAccess(ctx,args.tenantId,args.userId,args.capability,now);
  const fingerprint=aiFingerprint(args);
  const previous=await ctx.db.query('aiUsageReservations').withIndex('by_tenant_operation',q=>q.eq('tenantId',args.tenantId).eq('operationId',args.operationId)).unique();
  if(previous){if(previous.fingerprint!==fingerprint)throw new Error('AI_OPERATION_CONFLICT');return {reservationId:previous._id,replayed:true,state:previous.state};}
  const window=period(now);
  let budget=await ctx.db.query('aiUsageBudgets').withIndex('by_tenant_period',q=>q.eq('tenantId',args.tenantId).eq('periodId',window.periodId)).unique();
  if(!budget){const budgetId=await ctx.db.insert('aiUsageBudgets',{tenantId:args.tenantId,...window,revision:1,limitAttempts:entitlement.limitAttempts,reservedAttempts:0,settledAttempts:0});budget=(await ctx.db.get(budgetId))!;}
  for(const value of [budget.settledAttempts,budget.reservedAttempts,entitlement.limitAttempts])aiCount(value);
  const remaining=entitlement.limitAttempts-budget.settledAttempts;
  if(remaining<budget.reservedAttempts||args.maxAttempts>remaining-budget.reservedAttempts)throw new Error('AI_QUOTA_EXHAUSTED');
  const revision=budget.revision+1;aiPositive(revision);
  await ctx.db.patch(budget._id,{limitAttempts:entitlement.limitAttempts,reservedAttempts:budget.reservedAttempts+args.maxAttempts,revision});
  const reservationId=await ctx.db.insert('aiUsageReservations',{...args,fingerprint,entitlementId:entitlement._id,entitlementRevision:entitlement.revision,accessGrantRevision:grant.revision,budgetId:budget._id,heldAttempts:args.maxAttempts,chargedAttempts:0,state:'reserved'});
  return {reservationId,replayed:false,state:'reserved' as const};
}

/** Revalidates every dispatch; exact attempt replay supplies no new dispatch authorization. */
export async function claimStoredAttempt(ctx:WriteCtx,args:{reservationId:Id<'aiUsageReservations'>;userId:string;attemptId:string;kind:Kind},now:number){
  aiText(args.attemptId);
  const reservation=await ctx.db.get(args.reservationId);
  if(!reservation||reservation.userId!==args.userId)throw new Error('AI_RESERVATION_REQUIRED');
  const {entitlement,grant}=await requireAiAccess(ctx,reservation.tenantId,args.userId,reservation.capability,now);
  if(entitlement.revision!==reservation.entitlementRevision||grant.revision!==reservation.accessGrantRevision)throw new Error('AI_REVOKED');
  if(reservation.state!=='reserved')throw new Error('AI_RESERVATION_CLOSED');
  const budget=await ctx.db.get(reservation.budgetId);
  if(!budget||budget.periodStartsAtMs>now||budget.periodEndsAtMs<=now)throw new Error('AI_EXPIRED');
  const attempts=await ctx.db.query('aiUsageAttempts').withIndex('by_reservation',q=>q.eq('reservationId',reservation._id)).collect();
  const prior=attempts.find(attempt=>attempt.attemptId===args.attemptId);
  if(prior){if(prior.kind!==args.kind)throw new Error('AI_ATTEMPT_CONFLICT');return {dispatch:false,replayed:true};}
  if(attempts.length>=reservation.maxAttempts)throw new Error('AI_ATTEMPT_CAP');
  await ctx.db.insert('aiUsageAttempts',{reservationId:reservation._id,attemptId:args.attemptId,kind:args.kind,billing:'unknown'});
  return {dispatch:true,replayed:false};
}

/** Trusted billing reconciliation only. Revocation must not erase real already-incurred costs. */
export async function settleStoredUsage(ctx:WriteCtx,args:{reservationId:Id<'aiUsageReservations'>;userId:string;settlementId:string;attempts:{attemptId:string;kind:Kind;billing:Billing}[]}){
  aiText(args.userId);aiText(args.settlementId);
  if(args.attempts.length>256||new Set(args.attempts.map(a=>a.attemptId)).size!==args.attempts.length)throw new Error('AI_INVALID_SETTLEMENT');
  for(const attempt of args.attempts)aiText(attempt.attemptId);
  const reservation=await ctx.db.get(args.reservationId);
  if(!reservation||reservation.userId!==args.userId)throw new Error('AI_RESERVATION_REQUIRED');
  const fingerprint=aiFingerprint(args);
  const prior=await ctx.db.query('aiUsageSettlements').withIndex('by_reservation_settlement',q=>q.eq('reservationId',reservation._id).eq('settlementId',args.settlementId)).unique();
  if(prior){if(prior.fingerprint!==fingerprint)throw new Error('AI_SETTLEMENT_CONFLICT');return {replayed:true,chargedAttempts:prior.chargedAttempts,heldAttempts:prior.heldAttempts};}
  for(const supplied of args.attempts){
    const stored=await ctx.db.query('aiUsageAttempts').withIndex('by_reservation_attempt',q=>q.eq('reservationId',reservation._id).eq('attemptId',supplied.attemptId)).unique();
    if(stored){if(stored.kind!==supplied.kind||(stored.billing!=='unknown'&&stored.billing!==supplied.billing))throw new Error('AI_ATTEMPT_CONFLICT');await ctx.db.patch(stored._id,{billing:supplied.billing});}
    else await ctx.db.insert('aiUsageAttempts',{reservationId:reservation._id,...supplied}); // Reconcile unexpected real billable attempts too.
  }
  const all=await ctx.db.query('aiUsageAttempts').withIndex('by_reservation',q=>q.eq('reservationId',reservation._id)).collect();
  if(all.length>256)throw new Error('AI_INVALID_SETTLEMENT');
  const chargedAttempts=all.filter(a=>a.billing==='billable').length;
  const heldAttempts=all.filter(a=>a.billing==='unknown').length;
  const budget=(await ctx.db.get(reservation.budgetId))!;
  const reserved=budget.reservedAttempts-reservation.heldAttempts+heldAttempts;
  const settled=budget.settledAttempts-reservation.chargedAttempts+chargedAttempts;
  aiCount(reserved);aiCount(settled);const revision=budget.revision+1;aiPositive(revision);
  await ctx.db.patch(budget._id,{reservedAttempts:reserved,settledAttempts:settled,revision});
  await ctx.db.patch(reservation._id,{heldAttempts,chargedAttempts,state:heldAttempts?'reconciliation':'settled'});
  await ctx.db.insert('aiUsageSettlements',{reservationId:reservation._id,settlementId:args.settlementId,fingerprint,chargedAttempts,heldAttempts});
  return {replayed:false,chargedAttempts,heldAttempts};
}
