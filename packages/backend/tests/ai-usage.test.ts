import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import { v } from 'convex/values';
import schema from '../convex/schema';
import { api, mutation } from '../convex/runtime';
import { aiCapability, aiAttemptKind, aiBilling } from '../convex/aiValidators';
import { reserveStoredUsage, claimStoredAttempt, settleStoredUsage } from '../convex/aiUsageStore';

// These fixture entrypoints exist ONLY in the test module registry, never deployed Convex.
const reserveArgs={tenantId:v.id('painterWorkspaces'),userId:v.string(),operationId:v.string(),capability:aiCapability,maxAttempts:v.number()};
const syntheticStorage={
  reserve:mutation({args:reserveArgs,handler:(ctx,args)=>reserveStoredUsage(ctx,args,Date.now())}),
  rollback:mutation({args:reserveArgs,handler:async(ctx,args)=>{await reserveStoredUsage(ctx,args,Date.now());throw new Error('SYNTHETIC_ROLLBACK');}}),
  claim:mutation({args:{reservationId:v.id('aiUsageReservations'),userId:v.string(),attemptId:v.string(),kind:aiAttemptKind},handler:(ctx,args)=>claimStoredAttempt(ctx,args,Date.now())}),
  settle:mutation({args:{reservationId:v.id('aiUsageReservations'),userId:v.string(),settlementId:v.string(),attempts:v.array(v.object({attemptId:v.string(),kind:aiAttemptKind,billing:aiBilling}))},handler:settleStoredUsage}),
};
const modules={
  './_generated/test-root-marker.ts':()=>Promise.resolve({}),
  './platformAccess.ts':()=>import('../convex/platformAccess'),
  './aiEntitlements.ts':()=>import('../convex/aiEntitlements'),
  './aiUsage.ts':()=>import('../convex/aiUsage'),
  './syntheticStorage.ts':()=>Promise.resolve(syntheticStorage),
};
async function fixture(limit=2){
  const t=convexTest(schema,modules);
  t.registerComponent('betterAuth',betterAuthTest.schema,{...betterAuthTest.modules,'./component/adapter.ts':()=>import('../../../node_modules/@convex-dev/better-auth/src/component/adapter'),'./component/_generated/test-root-marker.ts':()=>Promise.resolve({})});
  const identities=await t.runInComponent('betterAuth',async ctx=>{
    const result=[];
    for(const email of ['mplsjohnnycage@makeithappenentllc.com','staff@example.test']){
      const userId=await ctx.db.insert('user',{name:'Synthetic staff',email,emailVerified:true,createdAt:1,updatedAt:1});
      const sessionId=await ctx.db.insert('session',{userId,token:`synthetic-${email}`,expiresAt:Date.now()+600000,createdAt:1,updatedAt:1});result.push({userId,sessionId});
    }return result;
  });
  const [a,b]=identities as [typeof identities[number],typeof identities[number]];
  const owner=t.withIdentity({subject:a.userId,sessionId:a.sessionId});
  const staff=t.withIdentity({subject:b.userId,sessionId:b.sessionId});
  const tenantId=await t.run(async ctx=>{
    const tenant=await ctx.db.insert('painterWorkspaces',{name:'Synthetic company',ownerId:a.userId,createdAt:'test',demo:false});
    for(const identity of identities)await ctx.db.insert('painterMembers',{tenantId:tenant,userId:identity.userId,name:'Member',email:'not-authority@example.test',role:'owner',enabled:true});return tenant;
  });
  const bootstrap={userId:a.userId,requestKey:'platform-bootstrap',operatorReceiptReference:'synthetic operator approval',identityProofReference:'synthetic identity proof'};
  const expiresAtMs=Date.now()+600000;
  const grant=(userId:string,requestKey:string,expectedEntitlementRevision?:number)=>({workspaceId:tenantId,targetUserId:userId,requestKey,reason:'Synthetic internal test grant',capabilities:['recommendation_draft'] as Array<'recommendation_draft'>,expiresAtMs,limitAttempts:limit,...(expectedEntitlementRevision?{expectedEntitlementRevision}: {})});
  return {t,owner,staff,a,b,tenantId,bootstrap,grant};
}
async function enabled(limit=2){const f=await fixture(limit);await f.t.mutation(api.platformAccess.bootstrap,f.bootstrap);await f.owner.mutation(api.aiEntitlements.grantInternal,f.grant(f.a.userId,'grant-a'));await f.owner.mutation(api.aiEntitlements.grantInternal,f.grant(f.b.userId,'grant-b',1));return f;}
const request=(f:Awaited<ReturnType<typeof fixture>>,userId=f.a.userId,operationId='operation',maxAttempts=1)=>({tenantId:f.tenantId,userId,operationId,capability:'recommendation_draft' as const,maxAttempts});

test('actual Better Auth/platform owner/current target membership authorize grants, not tenant role',async()=>{
  const f=await fixture();
  await expect(f.t.mutation(api.aiEntitlements.grantInternal,f.grant(f.a.userId,'anonymous'))).rejects.toThrow('AI_PLATFORM_OWNER_REQUIRED');
  await expect(f.owner.mutation(api.aiEntitlements.grantInternal,f.grant(f.a.userId,'tenant-owner'))).rejects.toThrow('AI_PLATFORM_OWNER_REQUIRED');
  await f.t.mutation(api.platformAccess.bootstrap,f.bootstrap);
  await expect(f.staff.mutation(api.aiEntitlements.grantInternal,f.grant(f.b.userId,'role-owner'))).rejects.toThrow('AI_PLATFORM_OWNER_REQUIRED');
  await expect(f.owner.mutation(api.aiEntitlements.grantInternal,{...f.grant('foreign-user','missing-member'),paid:true})).rejects.toThrow();
  await expect(f.owner.mutation(api.aiEntitlements.grantInternal,f.grant('foreign-user','missing-member'))).rejects.toThrow('AI_TARGET_MEMBERSHIP_REQUIRED');
  await f.t.runInComponent('betterAuth',ctx=>ctx.db.patch(f.a.sessionId,{expiresAt:0}));
  await expect(f.owner.mutation(api.aiEntitlements.grantInternal,f.grant(f.a.userId,'expired-session'))).rejects.toThrow('AI_PLATFORM_OWNER_REQUIRED');
  expect(await f.t.run(ctx=>ctx.db.query('aiWorkspaceEntitlements').collect())).toEqual([]);
});
test('audited idempotent internal grants preserve revoked state; production provider remains unavailable',async()=>{
  const f=await enabled();
  expect(await f.owner.query(api.aiEntitlements.eligibility,{workspaceId:f.tenantId,capability:'recommendation_draft'})).toEqual({allowed:false,reason:'provider_not_authorized'});
  await expect(f.t.mutation(api.aiUsage.reserve,{workspaceId:f.tenantId,userId:f.a.userId,operationId:'live-held',capability:'recommendation_draft',maxAttempts:1})).rejects.toThrow('AI_PROVIDER_NOT_AUTHORIZED');
  const usageModule=await import('../convex/aiUsage');expect(usageModule.reserve.isInternal).toBe(true);expect(usageModule.claimAttempt.isInternal).toBe(true);expect(usageModule.settle.isInternal).toBe(true);
  const revoke={workspaceId:f.tenantId,targetUserId:f.a.userId,requestKey:'revoke-a',reason:'Synthetic revocation',expectedGrantRevision:1};
  await f.owner.mutation(api.aiEntitlements.revokeInternal,revoke);
  expect(await f.owner.mutation(api.aiEntitlements.grantInternal,f.grant(f.a.userId,'grant-a'))).toMatchObject({enabled:false,replayed:true});
  expect(await f.owner.mutation(api.aiEntitlements.revokeInternal,revoke)).toEqual({enabled:false,replayed:true});
  await expect(f.owner.mutation(api.aiEntitlements.grantInternal,{...f.grant(f.a.userId,'grant-a'),reason:'altered'})).rejects.toThrow('AI_REQUEST_CONFLICT');
  expect(await f.t.run(ctx=>ctx.db.query('aiGrantAudit').collect())).toHaveLength(3);
  expect(await f.t.run(ctx=>ctx.db.query('aiUsageReservations').collect())).toEqual([]);
});
test('two actors share final company capacity atomically; operation replays cannot change actor or payload',async()=>{
  const f=await enabled(1);
  const results=await Promise.allSettled([f.t.mutation(api.syntheticStorage.reserve,request(f,f.a.userId,'a')),f.t.mutation(api.syntheticStorage.reserve,request(f,f.b.userId,'b'))]);
  expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(results.filter(r=>r.status==='rejected')).toHaveLength(1);
  const reservations=await f.t.run(ctx=>ctx.db.query('aiUsageReservations').collect());expect(reservations).toHaveLength(1);
  const winner=reservations[0]!;
  expect(await f.t.mutation(api.syntheticStorage.reserve,request(f,winner.userId,winner.operationId))).toMatchObject({replayed:true});
  await expect(f.t.mutation(api.syntheticStorage.reserve,request(f,winner.userId===f.a.userId?f.b.userId:f.a.userId,winner.operationId))).rejects.toThrow('AI_OPERATION_CONFLICT');
  await expect(f.t.mutation(api.syntheticStorage.reserve,request(f,winner.userId,winner.operationId,2))).rejects.toThrow('AI_OPERATION_CONFLICT');
  const budgets=await f.t.run(ctx=>ctx.db.query('aiUsageBudgets').collect());expect(budgets).toHaveLength(1);expect(budgets[0]).toMatchObject({reservedAttempts:1,settledAttempts:0});
});
test('revocation or disabled membership prevents replay/dispatch, but real billing settles after revocation',async()=>{
  const f=await enabled();const reservation=await f.t.mutation(api.syntheticStorage.reserve,request(f));
  expect(await f.t.mutation(api.syntheticStorage.claim,{reservationId:reservation.reservationId,userId:f.a.userId,attemptId:'initial',kind:'initial'})).toEqual({dispatch:true,replayed:false});
  expect(await f.t.mutation(api.syntheticStorage.claim,{reservationId:reservation.reservationId,userId:f.a.userId,attemptId:'initial',kind:'initial'})).toEqual({dispatch:false,replayed:true});
  await f.owner.mutation(api.aiEntitlements.revokeInternal,{workspaceId:f.tenantId,targetUserId:f.a.userId,requestKey:'revoke',reason:'Synthetic revoked',expectedGrantRevision:1});
  await expect(f.t.mutation(api.syntheticStorage.reserve,request(f))).rejects.toThrow('AI_REVOKED');
  await expect(f.t.mutation(api.syntheticStorage.claim,{reservationId:reservation.reservationId,userId:f.a.userId,attemptId:'initial',kind:'initial'})).rejects.toThrow('AI_REVOKED');
  expect(await f.t.mutation(api.aiUsage.settle,{reservationId:reservation.reservationId,userId:f.a.userId,settlementId:'final',attempts:[{attemptId:'initial',kind:'initial',billing:'billable'}]})).toMatchObject({chargedAttempts:1,heldAttempts:0});
  const member=await f.t.run(ctx=>ctx.db.query('painterMembers').withIndex('by_tenant_user',q=>q.eq('tenantId',f.tenantId).eq('userId',f.b.userId)).unique());await f.t.run(ctx=>ctx.db.patch(member!._id,{enabled:false}));
  await expect(f.t.mutation(api.syntheticStorage.reserve,request(f,f.b.userId,'disabled'))).rejects.toThrow('AI_MEMBERSHIP_REQUIRED');
});
test('unknown retry/recovery billing retains capacity; settlement is idempotent and conflicting replay rolls back',async()=>{
  const f=await enabled();const reservation=await f.t.mutation(api.syntheticStorage.reserve,request(f,f.a.userId,'operation',2));
  for(const [attemptId,kind] of [['initial','initial'],['retry','recovery_model']] as const)await f.t.mutation(api.syntheticStorage.claim,{reservationId:reservation.reservationId,userId:f.a.userId,attemptId,kind});
  await expect(f.t.mutation(api.syntheticStorage.claim,{reservationId:reservation.reservationId,userId:f.a.userId,attemptId:'excess',kind:'model_retry'})).rejects.toThrow('AI_ATTEMPT_CAP');
  const settle={reservationId:reservation.reservationId,userId:f.a.userId,settlementId:'unknown-first',attempts:[{attemptId:'initial',kind:'initial',billing:'billable'}]};
  expect(await f.t.mutation(api.aiUsage.settle,settle)).toMatchObject({chargedAttempts:1,heldAttempts:1});
  expect(await f.t.mutation(api.aiUsage.settle,settle)).toMatchObject({replayed:true});
  await expect(f.t.mutation(api.aiUsage.settle,{...settle,attempts:[]})).rejects.toThrow('AI_SETTLEMENT_CONFLICT');
  await expect(f.t.mutation(api.syntheticStorage.reserve,request(f,f.b.userId,'blocked'))).rejects.toThrow('AI_QUOTA_EXHAUSTED');
  expect(await f.t.mutation(api.aiUsage.settle,{...settle,settlementId:'resolved',attempts:[{attemptId:'retry',kind:'recovery_model',billing:'billable'}]})).toMatchObject({chargedAttempts:2,heldAttempts:0});
  const before=await f.t.run(ctx=>ctx.db.query('aiUsageBudgets').unique());
  await expect(f.t.mutation(api.aiUsage.settle,{...settle,settlementId:'conflict',attempts:[{attemptId:'new',kind:'model_retry',billing:'billable'},{attemptId:'initial',kind:'initial',billing:'not_billable'}]})).rejects.toThrow('AI_ATTEMPT_CONFLICT');
  expect(await f.t.run(ctx=>ctx.db.query('aiUsageBudgets').unique())).toEqual(before);
  expect(await f.t.run(ctx=>ctx.db.query('aiUsageAttempts').collect())).toHaveLength(2);
});
test('unexpected real overrun is counted, amendments preserve counters and failed atomic reserve leaves no writes',async()=>{
  const f=await enabled(1);
  await expect(f.t.mutation(api.syntheticStorage.rollback,request(f))).rejects.toThrow('SYNTHETIC_ROLLBACK');
  expect(await f.t.run(ctx=>ctx.db.query('aiUsageBudgets').collect())).toEqual([]);expect(await f.t.run(ctx=>ctx.db.query('aiUsageReservations').collect())).toEqual([]);
  const reservation=await f.t.mutation(api.syntheticStorage.reserve,request(f));
  await f.t.mutation(api.aiUsage.settle,{reservationId:reservation.reservationId,userId:f.a.userId,settlementId:'overrun',attempts:[{attemptId:'actual-1',kind:'initial',billing:'billable'},{attemptId:'actual-2',kind:'recovery_model',billing:'billable'}]});
  expect(await f.t.run(ctx=>ctx.db.query('aiUsageBudgets').unique())).toMatchObject({settledAttempts:2,reservedAttempts:0});
  await f.owner.mutation(api.aiEntitlements.grantInternal,{...f.grant(f.a.userId,'amend',2),expectedGrantRevision:1});
  expect(await f.t.run(ctx=>ctx.db.query('aiUsageBudgets').unique())).toMatchObject({settledAttempts:2,reservedAttempts:0});
  await expect(f.t.mutation(api.syntheticStorage.reserve,request(f,f.b.userId,'after-overrun'))).rejects.toThrow('AI_QUOTA_EXHAUSTED');
});
test('invalid grants and current capability/expiry/issuer revocation fail closed',async()=>{
  const f=await enabled();
  for(const patch of [{limitAttempts:-1},{limitAttempts:NaN},{limitAttempts:100001},{expiresAtMs:Date.now()-1},{capabilities:[]},{capabilities:['recommendation_draft','recommendation_draft']}])await expect(f.owner.mutation(api.aiEntitlements.grantInternal,{...f.grant(f.a.userId,'invalid',2),expectedGrantRevision:1,...patch})).rejects.toThrow();
  await expect(f.owner.mutation(api.aiEntitlements.grantInternal,f.grant(f.a.userId,'missing-revision',2))).rejects.toThrow('AI_REVISION_CONFLICT');
  await expect(f.t.mutation(api.syntheticStorage.reserve,{...request(f),capability:'workspace_summary'})).rejects.toThrow('AI_UNSUPPORTED');
  const grant=await f.t.run(ctx=>ctx.db.query('aiInternalGrants').withIndex('by_tenant_user',q=>q.eq('tenantId',f.tenantId).eq('userId',f.a.userId)).unique());
  await f.t.run(ctx=>ctx.db.patch(grant!._id,{expiresAtMs:0}));
  await expect(f.t.mutation(api.syntheticStorage.reserve,request(f))).rejects.toThrow('AI_EXPIRED');
  expect(await f.owner.query(api.aiEntitlements.eligibility,{workspaceId:f.tenantId,capability:'recommendation_draft'})).toEqual({allowed:false,reason:'expired'});
  await f.t.mutation(api.platformAccess.revoke,{userId:f.a.userId,requestKey:'revoke-platform',operatorReceiptReference:'synthetic revoke approval'});
  await expect(f.t.mutation(api.syntheticStorage.reserve,request(f,f.b.userId,'issuer-revoked'))).rejects.toThrow('AI_REVOKED');
});
