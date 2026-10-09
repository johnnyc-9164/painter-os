import { expect, test } from 'vitest';
import { evaluateAiEntitlement, type AiAdmissionInput } from '../ai-entitlement-policy';

const request = (): AiAdmissionInput => ({
  actorId:'actor',workspaceId:'company',operationId:'operation-1',nowMs:100,capability:'recommendation_draft',maxBillableAttempts:3,
  entitlement:{kind:'paid_customer',id:'paid-1',revision:2,actorId:'actor',workspaceId:'company',state:'active',expiresAtMs:1000,capabilities:['recommendation_draft'],billingEvidence:{recordId:'billing-1',revision:1,auditEventId:'billing-audit'}},
  providerPermission:{id:'provider-1',revision:1,actorId:'actor',workspaceId:'company',mode:'openai_api',registered:true,commercialUseAllowed:true,state:'active',expiresAtMs:1000,provenance:{recordId:'permission-1',revision:1,auditEventId:'permission-audit'}},
  budget:{actorId:'actor',workspaceId:'company',entitlementId:'paid-1',entitlementRevision:2,periodId:'period-1',revision:4,periodStartsAtMs:0,periodEndsAtMs:1000,limitAttempts:10,settledAttempts:4,reservedAttempts:3},
});
const evaluate = (value: unknown) => evaluateAiEntitlement(value as AiAdmissionInput);
const internal = (): AiAdmissionInput => {
  const input=request();
  input.entitlement={kind:'internal',id:'internal-1',revision:3,actorId:'actor',workspaceId:'company',state:'active',expiresAtMs:1000,capabilities:['recommendation_draft'],platformGrant:{recordId:'platform-1',revision:2,auditEventId:'grant-audit',issuedByActorId:'operator',platformOwnerGrantId:'owner-grant',platformOwnerGrantRevision:5}};
  input.budget.entitlementId='internal-1';input.budget.entitlementRevision=3;
  input.providerPermission.mode='openai_subscription';
  return input;
};

test('paid and audited internal admission produce only bounded revision-bearing decisions',()=>{
  const input=request(); const before=structuredClone(input);
  const result=evaluate(input);
  expect(result).toEqual({allowed:true,admission:{actorId:'actor',workspaceId:'company',operationId:'operation-1',capability:'recommendation_draft',entitlementId:'paid-1',entitlementRevision:2,budgetRevision:4,periodId:'period-1',providerPermissionId:'provider-1',providerPermissionRevision:1,maxBillableAttempts:3}});
  expect(evaluate(input)).toEqual(result);expect(input).toEqual(before);
  expect(evaluate(internal()).allowed).toBe(true);
  expect(JSON.stringify(result)).not.toContain('billing-audit');
});
test('role, email, browser paid flag and provider connection establish no entitlement',()=>{
  for(const entitlement of [undefined,null,{paid:true},{kind:'internal',role:'owner',email:'owner@company.test'}]) {
    expect(evaluate({...request(),entitlement})).toEqual({allowed:false,reason:'entitlement_required'});
  }
  const input=internal(); delete (input.entitlement as unknown as Record<string,unknown>).platformGrant;
  expect(evaluate(input)).toEqual({allowed:false,reason:'entitlement_required'});
  expect(evaluate({...request(),paid:true,role:'owner'})).toEqual({allowed:false,reason:'entitlement_required'});
});
test('every grant and budget must match current actor, workspace and grant revision',()=>{
  for(const field of ['actorId','workspaceId'] as const) {
    const input=request();input.entitlement[field]='other';expect(evaluate(input)).toEqual({allowed:false,reason:'entitlement_required'});
    const provider=request();provider.providerPermission[field]='other';expect(evaluate(provider)).toEqual({allowed:false,reason:'provider_not_authorized'});
    const budget=request();budget.budget[field]='other';expect(evaluate(budget)).toEqual({allowed:false,reason:'quota_exhausted'});
  }
  for(const patch of [{entitlementId:'other'},{entitlementRevision:1}]) expect(evaluate({...request(),budget:{...request().budget,...patch}})).toEqual({allowed:false,reason:'quota_exhausted'});
});
test('expiry boundary, revocation, missing capability and malformed time fail closed',()=>{
  const expired=request();expired.entitlement.expiresAtMs=100;expect(evaluate(expired)).toEqual({allowed:false,reason:'expired'});
  const revoked=internal();revoked.entitlement.state='revoked';expect(evaluate(revoked)).toEqual({allowed:false,reason:'revoked'});
  expect(evaluate({...request(),capability:'workspace_summary'})).toEqual({allowed:false,reason:'unsupported'});
  expect(evaluate({...request(),capability:'send_email'})).toEqual({allowed:false,reason:'unsupported'});
  expect(evaluate({...request(),nowMs:NaN})).toEqual({allowed:false,reason:'entitlement_required'});
  expect(evaluate({...request(),entitlement:{...request().entitlement,state:'unknown'}})).toEqual({allowed:false,reason:'entitlement_required'});
});
test('commercial provider permission is independent, registered and current',()=>{
  for(const patch of [{registered:false},{commercialUseAllowed:false},{state:'revoked'},{expiresAtMs:100},{mode:'unregistered'},{revision:0}]) {
    expect(evaluate({...request(),providerPermission:{...request().providerPermission,...patch}})).toEqual({allowed:false,reason:'provider_not_authorized'});
  }
  expect(evaluate({...request(),providerPermission:{...request().providerPermission,mode:'openai_subscription'}})).toEqual({allowed:false,reason:'provider_not_authorized'});
});
test('quota accounts reserved and all requested retry attempts with overflow-safe arithmetic',()=>{
  expect(evaluate({...request(),maxBillableAttempts:4})).toEqual({allowed:false,reason:'quota_exhausted'});
  for(const value of [-1,0.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,'10',null]) {
    for(const field of ['limitAttempts','settledAttempts','reservedAttempts'] as const) expect(evaluate({...request(),budget:{...request().budget,[field]:value}})).toEqual({allowed:false,reason:'quota_exhausted'});
    expect(evaluate({...request(),maxBillableAttempts:value})).toEqual({allowed:false,reason:'quota_exhausted'});
  }
  for(const budget of [{limitAttempts:0,settledAttempts:0,reservedAttempts:0},{limitAttempts:Number.MAX_SAFE_INTEGER,settledAttempts:Number.MAX_SAFE_INTEGER,reservedAttempts:Number.MAX_SAFE_INTEGER}]) expect(evaluate({...request(),budget:{...request().budget,...budget}})).toEqual({allowed:false,reason:'quota_exhausted'});
  expect(evaluate({...request(),maxBillableAttempts:0})).toEqual({allowed:false,reason:'quota_exhausted'});
  for(const budget of [{periodStartsAtMs:101},{periodEndsAtMs:100},{periodStartsAtMs:200,periodEndsAtMs:200}]) expect(evaluate({...request(),budget:{...request().budget,...budget}})).toEqual({allowed:false,reason:'quota_exhausted'});
});
test('malformed inputs yield deterministic safe refusal codes without echoing secrets',()=>{
  for(const input of [undefined,null,[],{secret:'never echo'}, {...request(),entitlement:{...request().entitlement,secret:'never echo'}}]) {
    const result=evaluate(input);expect(result.allowed).toBe(false);expect(evaluate(input)).toEqual(result);expect(JSON.stringify(result)).not.toContain('never echo');
  }
});
