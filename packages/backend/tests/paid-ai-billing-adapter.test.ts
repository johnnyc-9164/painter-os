import {expect,test} from 'vitest';
import {projectPaidAiBilling,type PaidAiBillingInput} from '../paid-ai-billing-adapter';
import {evaluateAiEntitlement,type AiAdmissionInput} from '../ai-entitlement-policy';
const input=():PaidAiBillingInput=>{
 const binding={workspaceId:'company',customerId:'customer',accountId:'account',livemode:true};
 return {actorId:'actor',workspaceId:'company',nowMs:100,expectedCurrentRevision:4,binding,
  catalog:{accountId:'account',livemode:true,productId:'product',priceId:'price',capabilities:['recommendation_draft'],limitAttempts:10},
  snapshot:{...binding,recordId:'billing',revision:4,auditEventId:'audit',entitlementId:'paid',subscriptionId:'subscription',productId:'product',priceId:'price',status:'active',paidThroughMs:1000,cancelAtPeriodEnd:false,cancelAtMs:null,refundHold:false,disputeHold:false,
   invoice:{...binding,id:'invoice',subscriptionId:'subscription',productId:'product',priceId:'price',status:'paid',qualifiesPaidPurchase:true,periodStartsAtMs:0,periodEndsAtMs:1000,refundHold:false,disputeHold:false}}};
};
const project=(value:unknown)=>projectPaidAiBilling(value as PaidAiBillingInput);
test('trusted paid projection preserves exact existing provenance, scope and catalog descriptor without mutating inputs',()=>{
 const value=input(),before=structuredClone(value);const result=project(value);
 expect(result).toEqual({eligible:true,entitlement:{kind:'paid_customer',id:'paid',revision:4,actorId:'actor',workspaceId:'company',state:'active',expiresAtMs:1000,capabilities:['recommendation_draft'],billingEvidence:{recordId:'billing',revision:4,auditEventId:'audit'}},attemptLimitDescriptor:{limitAttempts:10}});
 expect(project(value)).toEqual(result);expect(value).toEqual(before);
});
test('closed schemas reject browser claims, unknown fields, metadata and malformed revisions without echoing raw input',()=>{
 for(const value of [null,{}, {...input(),paid:true},{...input(),eventCreated:9999},{...input(),snapshot:{...input().snapshot,metadata:{workspaceId:'company'}}},{...input(),catalog:{...input().catalog,tier:'paid'}},{...input(),actorId:' actor'},{...input(),expectedCurrentRevision:NaN}])expect(project(value)).toEqual({eligible:false,reason:'invalid_snapshot'});
});
test('workspace/customer/account/mode/product-price and invoice subscription are exact server binding checks',()=>{
 for(const scope of ['snapshot','invoice'] as const)for(const field of ['workspaceId','customerId','accountId','livemode','productId','priceId'] as const){
  const value=input();const record=scope==='snapshot'?value.snapshot:value.snapshot.invoice;
  Object.assign(record,{[field]:field==='livemode'?false:'foreign'});expect(project(value)).toEqual({eligible:false,reason:'binding_mismatch'});
 }
 for(const patch of [{accountId:'foreign'},{livemode:false},{productId:'foreign'},{priceId:'foreign'}])expect(project({...input(),catalog:{...input().catalog,...patch}})).toEqual({eligible:false,reason:'binding_mismatch'});
 expect(project({...input(),workspaceId:'foreign'})).toEqual({eligible:false,reason:'binding_mismatch'});
 const value=input();value.snapshot.invoice.subscriptionId='foreign';expect(project(value)).toEqual({eligible:false,reason:'binding_mismatch'});
 const testMode=input();testMode.binding.livemode=false;testMode.catalog.livemode=false;testMode.snapshot.livemode=false;testMode.snapshot.invoice.livemode=false;expect(project(testMode).eligible).toBe(true);
 testMode.binding.livemode=true;expect(project(testMode)).toEqual({eligible:false,reason:'binding_mismatch'});
});
test('only current reconciliation revision applies; retries never manufacture newer evidence from event time',()=>{
 for(const revision of [3,5])expect(project({...input(),snapshot:{...input().snapshot,revision}})).toEqual({eligible:false,reason:'stale_snapshot'});
 const revoked=input();revoked.expectedCurrentRevision=5;expect(project(revoked)).toEqual({eligible:false,reason:'stale_snapshot'});
 expect(project({...revoked,eventCreated:Number.MAX_SAFE_INTEGER})).toEqual({eligible:false,reason:'invalid_snapshot'});
});
test('active alone is insufficient; paid qualifying invoice and coherent paid-through are mandatory',()=>{
 for(const status of ['trialing','incomplete','incomplete_expired','past_due','unpaid','canceled','paused'] as const)expect(project({...input(),snapshot:{...input().snapshot,status}})).toEqual({eligible:false,reason:'payment_required'});
 for(const patch of [{status:'open'},{status:'void'},{status:'draft'},{status:'uncollectible'},{qualifiesPaidPurchase:false},{periodStartsAtMs:101},{periodEndsAtMs:0},{periodEndsAtMs:999}])expect(project({...input(),snapshot:{...input().snapshot,invoice:{...input().snapshot.invoice,...patch}}})).toEqual({eligible:false,reason:'payment_required'});
});
test('paid-through and explicit cancel-end boundaries expire; refunds and disputes hold independently',()=>{
 expect(project({...input(),nowMs:1000})).toEqual({eligible:false,reason:'expired'});
 const value=input();value.snapshot.cancelAtPeriodEnd=true;value.snapshot.cancelAtMs=500;const result=project(value);expect(result.eligible&&result.entitlement.expiresAtMs).toBe(500);
 value.nowMs=500;expect(project(value)).toEqual({eligible:false,reason:'expired'});
 value.snapshot.cancelAtMs=null;expect(project(value)).toEqual({eligible:false,reason:'payment_required'});
 for(const scope of ['snapshot','invoice'] as const)for(const field of ['refundHold','disputeHold'] as const){const held=input();(scope==='snapshot'?held.snapshot:held.snapshot.invoice)[field]=true;expect(project(held)).toEqual({eligible:false,reason:'billing_hold'});}
});
test('composition reuses provider and shared budget authority; payment enables neither subscription pooling nor budget reset',()=>{
 const projection=project(input());if(!projection.eligible)throw new Error('fixture');
 const request:AiAdmissionInput={actorId:'actor',workspaceId:'company',operationId:'op',nowMs:100,capability:'recommendation_draft',maxBillableAttempts:1,entitlement:projection.entitlement,
  providerPermission:{actorId:'actor',workspaceId:'company',id:'provider',revision:1,mode:'openai_api',registered:false,commercialUseAllowed:false,state:'active',expiresAtMs:1000,provenance:{recordId:'registration',revision:1,auditEventId:'audit'}},
  budget:{actorId:'actor',workspaceId:'company',entitlementId:'paid',entitlementRevision:4,periodId:'utc-month',revision:2,periodStartsAtMs:0,periodEndsAtMs:1000,limitAttempts:10,settledAttempts:9,reservedAttempts:1}};
 const before=structuredClone(request.budget);expect(evaluateAiEntitlement(request)).toEqual({allowed:false,reason:'provider_not_authorized'});
 request.providerPermission.registered=true;request.providerPermission.commercialUseAllowed=true;request.providerPermission.mode='openai_subscription';expect(evaluateAiEntitlement(request)).toEqual({allowed:false,reason:'provider_not_authorized'});
 request.providerPermission.mode='openai_api';expect(evaluateAiEntitlement(request)).toEqual({allowed:false,reason:'quota_exhausted'});
 for(let retry=0;retry<3;retry++){project(input());expect(request.budget).toEqual(before);}
 request.budget.reservedAttempts=0;expect(evaluateAiEntitlement(request).allowed).toBe(true);
});
