import { v } from 'convex/values';
import { mutation } from './runtime';
import { authComponent } from './auth';
import { resolvePlatformAccess } from './platformAccess';
import { resolvePainterMembership } from './painter';
import { aiCapability, aiCount, aiPositive, aiText, aiFingerprint } from './aiValidators';
import { requireAiAccess } from './aiUsageStore';

const scope = {workspaceId:v.id('painterWorkspaces'),targetUserId:v.string(),requestKey:v.string(),reason:v.string()};
export const grantInternal = mutation({
  args:{...scope,capabilities:v.array(aiCapability),expiresAtMs:v.number(),limitAttempts:v.number(),expectedGrantRevision:v.optional(v.number()),expectedEntitlementRevision:v.optional(v.number())},
  returns:v.object({revision:v.number(),entitlementRevision:v.optional(v.number()),enabled:v.boolean(),replayed:v.boolean()}),
  handler:async(ctx,args)=>{
    if(await resolvePlatformAccess(ctx)!=='ready')throw new Error('AI_PLATFORM_OWNER_REQUIRED');
    const user=(await authComponent.safeGetAuthUser(ctx))!;
    const owner=(await ctx.db.query('platformOwners').withIndex('by_user',q=>q.eq('userId',user._id)).unique())!;
    aiText(args.targetUserId);aiText(args.requestKey);aiText(args.reason,1000);
    aiPositive(args.limitAttempts,100000);aiCount(args.expiresAtMs);
    const now=Date.now();
    if(args.expiresAtMs<=now||args.expiresAtMs>now+90*86400000||!args.capabilities.length||new Set(args.capabilities).size!==args.capabilities.length)throw new Error('AI_INVALID_GRANT');
    const member=await ctx.db.query('painterMembers').withIndex('by_tenant_user',q=>q.eq('tenantId',args.workspaceId).eq('userId',args.targetUserId)).unique();
    const targetIdentity=await authComponent.getAnyUserById(ctx,args.targetUserId);
    if(!member?.enabled||member.role==='customer'||!targetIdentity||!await ctx.db.get(args.workspaceId))throw new Error('AI_TARGET_MEMBERSHIP_REQUIRED');
    const grant=await ctx.db.query('aiInternalGrants').withIndex('by_tenant_user',q=>q.eq('tenantId',args.workspaceId).eq('userId',args.targetUserId)).unique();
    const entitlement=await ctx.db.query('aiWorkspaceEntitlements').withIndex('by_tenant',q=>q.eq('tenantId',args.workspaceId)).unique();
    const fingerprint=aiFingerprint({issuerId:user._id,action:'grant',...args});
    const prior=await ctx.db.query('aiGrantAudit').withIndex('by_tenant_request',q=>q.eq('tenantId',args.workspaceId).eq('requestKey',args.requestKey)).unique();
    if(prior){if(prior.fingerprint!==fingerprint)throw new Error('AI_REQUEST_CONFLICT');return {revision:grant?.revision??0,enabled:grant?.enabled===true,replayed:true};}
    if((grant?.revision)!==args.expectedGrantRevision||(entitlement?.revision)!==args.expectedEntitlementRevision)throw new Error('AI_REVISION_CONFLICT');
    if(args.expectedGrantRevision!==undefined)aiPositive(args.expectedGrantRevision);
    if(args.expectedEntitlementRevision!==undefined)aiPositive(args.expectedEntitlementRevision);
    const nextRevision=(grant?.revision??0)+1;aiPositive(nextRevision);
    const entitlementRevision=(entitlement?.revision??0)+1;aiPositive(entitlementRevision);
    const auditId=await ctx.db.insert('aiGrantAudit',{tenantId:args.workspaceId,requestKey:args.requestKey,fingerprint,issuerId:user._id,targetUserId:args.targetUserId,action:'grant',reason:args.reason,occurredAtMs:now,beforeRevision:grant?.revision??0,afterRevision:nextRevision,platformOwnerId:owner._id});
    const company={revision:entitlementRevision,expiresAtMs:args.expiresAtMs,capabilities:args.capabilities,limitAttempts:args.limitAttempts,auditId};
    if(entitlement)await ctx.db.patch(entitlement._id,company);else await ctx.db.insert('aiWorkspaceEntitlements',{tenantId:args.workspaceId,kind:'internal',...company});
    const access={revision:nextRevision,enabled:true,expiresAtMs:args.expiresAtMs,capabilities:args.capabilities,auditId};
    if(grant)await ctx.db.patch(grant._id,access);else await ctx.db.insert('aiInternalGrants',{tenantId:args.workspaceId,userId:args.targetUserId,...access});
    // Budget counters are never reset when access changes. Existing limits update on next reserve.
    return {revision:nextRevision,entitlementRevision,enabled:true,replayed:false};
  },
});
export const revokeInternal = mutation({args:{...scope,expectedGrantRevision:v.number()},returns:v.object({enabled:v.boolean(),replayed:v.boolean()}),handler:async(ctx,args)=>{
  if(await resolvePlatformAccess(ctx)!=='ready')throw new Error('AI_PLATFORM_OWNER_REQUIRED');
  const user=(await authComponent.safeGetAuthUser(ctx))!;
  const owner=(await ctx.db.query('platformOwners').withIndex('by_user',q=>q.eq('userId',user._id)).unique())!;
  aiText(args.targetUserId);aiText(args.requestKey);aiText(args.reason,1000);aiPositive(args.expectedGrantRevision);
  const grant=await ctx.db.query('aiInternalGrants').withIndex('by_tenant_user',q=>q.eq('tenantId',args.workspaceId).eq('userId',args.targetUserId)).unique();
  const fingerprint=aiFingerprint({issuerId:user._id,action:'revoke',...args});
  const prior=await ctx.db.query('aiGrantAudit').withIndex('by_tenant_request',q=>q.eq('tenantId',args.workspaceId).eq('requestKey',args.requestKey)).unique();
  if(prior){if(prior.fingerprint!==fingerprint)throw new Error('AI_REQUEST_CONFLICT');return {enabled:grant?.enabled===true,replayed:true};}
  if(!grant||grant.revision!==args.expectedGrantRevision)throw new Error('AI_REVISION_CONFLICT');
  const revision=grant.revision+1;aiPositive(revision);
  const auditId=await ctx.db.insert('aiGrantAudit',{tenantId:args.workspaceId,requestKey:args.requestKey,fingerprint,issuerId:user._id,targetUserId:args.targetUserId,action:'revoke',reason:args.reason,occurredAtMs:Date.now(),beforeRevision:grant.revision,afterRevision:revision,platformOwnerId:owner._id});
  await ctx.db.patch(grant._id,{enabled:false,revision,auditId});return {enabled:false,replayed:false};
}});
/** Point-in-time status mutation: server time is authoritative, never a reactive expiry timer.
 * No paid writer or active provider permission exists in this slice.
 */
export const eligibility=mutation({args:{workspaceId:v.id('painterWorkspaces'),capability:aiCapability},returns:v.object({allowed:v.literal(false),reason:v.union(v.literal('provider_not_authorized'),v.literal('entitlement_required'),v.literal('revoked'),v.literal('expired'),v.literal('unsupported'))}),handler:async(ctx,args)=>{
  const {actor}=await resolvePainterMembership(ctx,args.workspaceId);
  try{await requireAiAccess(ctx,args.workspaceId,actor.id,args.capability,Date.now());return {allowed:false as const,reason:'provider_not_authorized' as const};}
  catch(cause){const code=cause instanceof Error?cause.message:'';const reason:'revoked'|'expired'|'unsupported'|'entitlement_required'=code==='AI_REVOKED'?'revoked':code==='AI_EXPIRED'?'expired':code==='AI_UNSUPPORTED'?'unsupported':'entitlement_required';return {allowed:false as const,reason};}
}});
