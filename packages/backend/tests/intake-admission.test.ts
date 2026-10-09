import { afterEach, describe, expect, it, vi } from 'vitest';
import { convexTest } from 'convex-test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { anyApi, mutationGeneric } from 'convex/server';
import { v } from 'convex/values';
import schema from '../convex/schema';
import { admitIntake, intakeRateLimiter } from '../convex/intakeAdmission';
import { INTAKE_ADMISSION } from '../intake-admission-contract';
import type { Id } from '../convex/runtime';

const modules = {
 './_generated/test-root-marker.ts': () => Promise.resolve({}),
 './intakeAdmission.ts': () => import('../convex/intakeAdmission'),
 './admissionHarness.ts': () => Promise.resolve({
  // Test-only parent proves real nested component updates rollback on throw.
  failAfter: mutationGeneric({args: {workspaceId: v.id('painterWorkspaces'),requestKey:v.string(),payloadDigest:v.string()},returns:v.null(),handler:async(ctx,args)=>{
   await admitIntake(ctx,args);throw new Error('SYNTHETIC_PARENT_FAILURE');
  }}),
 }),
};
let clock = 1_791_000_000_000;
async function fixture(tenants=1, documentsRead=20, bytesRead=32768) {
 clock=1_791_000_000_000;vi.spyOn(Date,'now').mockImplementation(()=>clock);
 const t=convexTest({schema,modules,transactionLimits:{documentsRead,bytesRead}});
 rateLimiterTest.register(t);
 const ids=await t.run(async ctx=>{
  const ids:Id<'painterWorkspaces'>[]=[];
  for(let i=0;i<tenants;i++){
   const tenantId=await ctx.db.insert('painterWorkspaces',{name:`Synthetic ${i}`,ownerId:`owner-${i}`,createdAt:'2026-10-09',demo:false});
   await ctx.db.insert('painterIntakeConfigs',{tenantId,enabled:true,servicePostalCodes:['55401'],supportedProjectTypes:['interior'],consentText:'Synthetic consent',revision:1,updatedBy:'owner',updatedAt:'2026-10-09'});
   ids.push(tenantId);
  }return ids;
 });
 return {t,ids};
}
const args=(workspaceId:Id<'painterWorkspaces'>,n:number,payloadDigest='a'.repeat(64))=>({workspaceId,requestKey:`request_${n}`,payloadDigest});
afterEach(()=>vi.restoreAllMocks());

describe('private intake admission with actual installed RateLimiter component',()=>{
 it('replays one bounded admission without double debit and denies changed payload',async()=>{
  const {t,ids:[id]}=await fixture();const request=args(id,1);
  expect(await t.mutation(anyApi.intakeAdmission.admit,request)).toEqual({state:'admitted',policyRevision:1,replayed:false});
  expect(await t.mutation(anyApi.intakeAdmission.admit,request)).toEqual({state:'admitted',policyRevision:1,replayed:true});
  expect(await t.mutation(anyApi.intakeAdmission.admit,{...request,payloadDigest:'b'.repeat(64)})).toEqual({state:'denied',reason:'request_conflict',replayed:false});
  const global=await t.run(ctx=>intakeRateLimiter.getValue(ctx,'intakeGlobalAttempts'));
  expect(global.value).toBe(INTAKE_ADMISSION.globalAttemptsPerMinute-1);
  expect(await t.run(ctx=>ctx.db.query('painterIntakeAdmissionReceipts').collect())).toHaveLength(1);
 });
 it('commits attempted global debit and denial receipt when tenant capacity rejects; replay does not debit',async()=>{
  const {t,ids:[id]}=await fixture();
  for(let i=0;i<INTAKE_ADMISSION.tenantAttemptsPerMinute;i++)expect((await t.mutation(anyApi.intakeAdmission.admit,args(id,i))).state).toBe('admitted');
  const request=args(id,99);const denial=await t.mutation(anyApi.intakeAdmission.admit,request);
  expect(denial).toMatchObject({state:'denied',reason:'tenant_limit',replayed:false,retryAfterMs:expect.any(Number)});
  expect((await t.run(ctx=>intakeRateLimiter.getValue(ctx,'intakeGlobalAttempts'))).value).toBe(INTAKE_ADMISSION.globalAttemptsPerMinute-6);
  clock+=1000;
  expect(await t.mutation(anyApi.intakeAdmission.admit,request)).toEqual({...denial,replayed:true,retryAfterMs:denial.retryAfterMs-1000});
  expect((await t.run(ctx=>intakeRateLimiter.getValue(ctx,'intakeGlobalAttempts'))).value).toBe(INTAKE_ADMISSION.globalAttemptsPerMinute-6);
 });
 it('rolls back actual nested component debits and host receipt when parent throws',async()=>{
  const {t,ids:[id]}=await fixture();
  await expect(t.mutation(anyApi.admissionHarness.failAfter,args(id,1))).rejects.toThrow('SYNTHETIC_PARENT_FAILURE');
  expect((await t.run(ctx=>intakeRateLimiter.getValue(ctx,'intakeGlobalAttempts'))).value).toBe(INTAKE_ADMISSION.globalAttemptsPerMinute);
  expect(await t.run(ctx=>ctx.db.query('painterIntakeAdmissionReceipts').collect())).toHaveLength(0);
  expect((await t.mutation(anyApi.intakeAdmission.admit,args(id,1))).state).toBe('admitted');
 });
 it('resolves enabled policy every time, including before replay, without cached authorization',async()=>{
  const {t,ids:[id]}=await fixture();const request=args(id,1);await t.mutation(anyApi.intakeAdmission.admit,request);
  const policy=await t.run(ctx=>ctx.db.query('painterIntakeConfigs').withIndex('by_tenant',q=>q.eq('tenantId',id)).unique());
  await t.run(ctx=>ctx.db.patch(policy!._id,{enabled:false,revision:2}));
  expect(await t.mutation(anyApi.intakeAdmission.admit,request)).toEqual({state:'denied',reason:'unavailable',replayed:false});
  await t.run(ctx=>ctx.db.patch(policy!._id,{enabled:true}));
  expect(await t.mutation(anyApi.intakeAdmission.admit,request)).toEqual({state:'denied',reason:'policy_changed',replayed:false});
  expect((await t.mutation(anyApi.intakeAdmission.admit,args(id,2))).state).toBe('admitted');
  await t.run(ctx=>ctx.db.delete(policy!._id));
  expect((await t.mutation(anyApi.intakeAdmission.admit,args(id,3))).reason).toBe('unavailable');
  await t.run(ctx=>ctx.db.delete(id));
  expect((await t.mutation(anyApi.intakeAdmission.admit,args(id,4))).reason).toBe('unavailable');
 });
 it('fails closed on malformed enabled policy or ambiguous policy rows before component debit',async()=>{
  const {t,ids:[id]}=await fixture();
  const policy=await t.run(ctx=>ctx.db.query('painterIntakeConfigs').withIndex('by_tenant',q=>q.eq('tenantId',id)).unique());
  await t.run(ctx=>ctx.db.patch(policy!._id,{consentText:''}));
  await expect(t.mutation(anyApi.intakeAdmission.admit,args(id,1))).rejects.toThrow('INTAKE_POLICY_REQUIRED');
  await t.run(ctx=>ctx.db.patch(policy!._id,{consentText:'Synthetic consent',revision:0}));
  await expect(t.mutation(anyApi.intakeAdmission.admit,args(id,1))).rejects.toThrow('INVALID_INTAKE_REVISION');
  await t.run(async ctx=>{
   await ctx.db.patch(policy!._id,{revision:1});
   await ctx.db.insert('painterIntakeConfigs',{tenantId:id,enabled:true,servicePostalCodes:['55401'],supportedProjectTypes:['interior'],consentText:'Duplicate',revision:1,updatedBy:'owner',updatedAt:'2026-10-09'});
  });
  await expect(t.mutation(anyApi.intakeAdmission.admit,args(id,1))).rejects.toThrow(/unique|more than one/i);
  expect((await t.run(ctx=>intakeRateLimiter.getValue(ctx,'intakeGlobalAttempts'))).value).toBe(INTAKE_ADMISSION.globalAttemptsPerMinute);
  expect(await t.run(ctx=>ctx.db.query('painterIntakeAdmissionReceipts').collect())).toHaveLength(0);
 });
 it('bounds inputs and rejects browser actor/IP claims before writes',async()=>{
  const {t,ids:[id]}=await fixture();
  for(const request of [{...args(id,1),requestKey:'x'.repeat(81)},{...args(id,1),requestKey:'short'},{...args(id,1),payloadDigest:'not-digest'},{...args(id,1),payloadDigest:'a'.repeat(65)},{...args(id,1),actorId:'owner'},{...args(id,1),ip:'127.0.0.1'}])await expect(t.mutation(anyApi.intakeAdmission.admit,request)).rejects.toThrow();
  expect(await t.run(ctx=>ctx.db.query('painterIntakeAdmissionReceipts').collect())).toHaveLength(0);
  expect((await t.run(ctx=>intakeRateLimiter.getValue(ctx,'intakeGlobalAttempts'))).value).toBe(INTAKE_ADMISSION.globalAttemptsPerMinute);
 });
 it('keeps tenants isolated while enforcing one deployment ceiling on concurrent attempts',async()=>{
  const {t,ids}=await fixture(8);
  const results=await Promise.all(ids.flatMap((id,i)=>Array.from({length:5},(_,j)=>t.mutation(anyApi.intakeAdmission.admit,args(id,i*100+j)))));
  expect(results.filter(result=>result.state==='admitted')).toHaveLength(INTAKE_ADMISSION.globalAttemptsPerMinute);
  expect(results.filter(result=>result.reason==='global_limit')).toHaveLength(10);
  for(const id of ids)expect((await t.run(ctx=>intakeRateLimiter.getValue(ctx,'intakeTenantAttempts',{key:String(id)}))).value).toBe(0);
 });
 it('writes no receipts for unique keys when both dimensions are saturated, then retries with fresh capacity',async()=>{
  const {t,ids:[id]}=await fixture();
  for(let i=0;i<30;i++)await t.mutation(anyApi.intakeAdmission.admit,args(id,i));
  const receiptIds=async()=>{let cursor:string|null=null;const ids=[];for(;;){const page=await t.run(ctx=>ctx.db.query('painterIntakeAdmissionReceipts').withIndex('by_tenant_and_request',q=>q.eq('tenantId',id)).paginate({numItems:10,cursor}));ids.push(...page.page.map(row=>row._id));if(page.isDone)return ids;cursor=page.continueCursor;}};
  const before=await receiptIds();expect(before).toHaveLength(30);
  const counters=()=>t.run(async ctx=>({global:await intakeRateLimiter.getValue(ctx,'intakeGlobalAttempts'),tenant:await intakeRateLimiter.getValue(ctx,'intakeTenantAttempts',{key:String(id)})}));
  const saturated=await counters();
  for(let i=100;i<200;i++)expect(await t.mutation(anyApi.intakeAdmission.admit,args(id,i))).toMatchObject({state:'denied',reason:'global_limit',replayed:false});
  expect(await receiptIds()).toEqual(before);expect(await counters()).toEqual(saturated);
  clock+=60_000;
  expect(await t.mutation(anyApi.intakeAdmission.admit,args(id,100))).toEqual({state:'admitted',policyRevision:1,replayed:false});
  expect(await t.mutation(anyApi.intakeAdmission.admit,args(id,100))).toEqual({state:'admitted',policyRevision:1,replayed:true});
 });
 it('admits only final tenant capacity under concurrent calls and replays concurrent same-key once',async()=>{
  const {t,ids:[id,other]}=await fixture(2);
  const results=await Promise.all(Array.from({length:8},(_,i)=>t.mutation(anyApi.intakeAdmission.admit,args(id,i))));
  expect(results.filter(result=>result.state==='admitted')).toHaveLength(5);
  const same=await Promise.all([t.mutation(anyApi.intakeAdmission.admit,args(other,99)),t.mutation(anyApi.intakeAdmission.admit,args(other,99))]);
  expect(same.map(result=>result.replayed).sort()).toEqual([false,true]);
  expect((await t.run(ctx=>intakeRateLimiter.getValue(ctx,'intakeTenantAttempts',{key:String(other)}))).value).toBe(4);
 });
 it('denies stale receipts and cleans only a bounded expired batch; TTL is not effect idempotency',async()=>{
  const {t,ids:[id]}=await fixture(1,300,131072);const request=args(id,1);await t.mutation(anyApi.intakeAdmission.admit,request);
  clock+=INTAKE_ADMISSION.receiptTtlMs;
  expect((await t.mutation(anyApi.intakeAdmission.admit,request)).reason).toBe('receipt_expired');
  await t.mutation(anyApi.intakeAdmission.admit,args(id,2));
  await t.run(async ctx=>{
   for(let i=0;i<101;i++)await ctx.db.insert('painterIntakeAdmissionReceipts',{tenantId:id,requestKey:`old_${i}`,payloadDigest:'a'.repeat(64),policyRevision:1,result:{state:'admitted',policyRevision:1},createdAt:clock-1000,expiresAt:clock-1});
  });
  expect(await t.mutation(anyApi.intakeAdmission.cleanupExpired,{})).toEqual({deleted:100,more:true});
  expect(await t.mutation(anyApi.intakeAdmission.cleanupExpired,{})).toEqual({deleted:2,more:false});
  expect(await t.run(ctx=>ctx.db.query('painterIntakeAdmissionReceipts').withIndex('by_tenant_and_request',q=>q.eq('tenantId',id).eq('requestKey','request_2')).unique())).not.toBeNull();
  expect((await t.mutation(anyApi.intakeAdmission.admit,request)).state).toBe('admitted');

 });
});
