import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
const role=v.union(v.literal('owner'),v.literal('office_admin'),v.literal('estimator'),v.literal('project_manager'),v.literal('salesperson'),v.literal('crew_lead'),v.literal('crew_member'),v.literal('accountant'),v.literal('customer'));
export default defineSchema({
 authEmailBudgets:defineTable({recipient:v.string(),purpose:v.literal('verify-email'),count:v.number(),windowStartedAt:v.number()}).index('by_recipient_purpose',['recipient','purpose']),
 authEmailReceipts:defineTable({intentHash:v.string(),userId:v.string(),recipient:v.string(),purpose:v.literal('verify-email'),inboxId:v.string(),outboundId:v.string(),createdAt:v.number()}).index('by_intent',['intentHash']),
 platformOwners:defineTable({slot:v.literal('initial-platform-owner'),userId:v.string(),enabled:v.boolean(),grantedAt:v.number()}).index('by_slot',['slot']).index('by_user',['userId']),
 platformOwnerAudit:defineTable({requestKey:v.string(),fingerprint:v.string(),userId:v.string(),action:v.union(v.literal('bootstrap'),v.literal('revoke')),operatorReceiptReference:v.string(),identityProofReference:v.optional(v.string()),occurredAt:v.number(),beforeEnabled:v.boolean(),afterEnabled:v.boolean()}).index('by_request',['requestKey']),
 painterEmailBindings:defineTable({tenantId:v.id('painterWorkspaces'),inboxId:v.string(),configuredSender:v.string(),enabled:v.literal(false),createdBy:v.string()}).index('by_tenant',['tenantId']).index('by_inbox',['inboxId']),
 painterInvites:defineTable({tenantId:v.id('painterWorkspaces'),tokenHash:v.string(),email:v.string(),role,expiresAt:v.number(),acceptedBy:v.optional(v.string())}).index('by_token',['tokenHash']),
 painterPortals:defineTable({tenantId:v.id('painterWorkspaces'),tokenHash:v.string(),estimateId:v.string(),customerId:v.string(),customerEmail:v.string(),expiresAt:v.number(),scope:v.any()}).index('by_token',['tokenHash']),
 painterWorkspaces:defineTable({name:v.string(),ownerId:v.string(),createdAt:v.string(),demo:v.boolean()}).index('by_owner',['ownerId']),
 painterMembers:defineTable({tenantId:v.id('painterWorkspaces'),userId:v.string(),name:v.string(),email:v.string(),role,enabled:v.boolean()}).index('by_tenant',['tenantId']).index('by_user',['userId']).index('by_tenant_user',['tenantId','userId']),
 painterEntities:defineTable({tenantId:v.id('painterWorkspaces'),entityId:v.string(),type:v.string(),revision:v.number(),createdAt:v.string(),updatedAt:v.string(),data:v.any()}).index('by_tenant',['tenantId']).index('by_tenant_entity',['tenantId','entityId']).index('by_tenant_type',['tenantId','type']).index('by_tenant_type_estimate_customer',['tenantId','type','data.estimateId','data.customerId']).index('by_tenant_type_job_customer',['tenantId','type','data.jobId','data.customerId']),
 painterEvents:defineTable({tenantId:v.id('painterWorkspaces'),eventId:v.string(),type:v.string(),entityId:v.string(),actorId:v.string(),occurredAt:v.string(),payload:v.any()}).index('by_tenant',['tenantId']).index('by_tenant_entity',['tenantId','entityId']),
 painterReceipts:defineTable({tenantId:v.id('painterWorkspaces'),requestKey:v.string(),fingerprint:v.string(),result:v.any()}).index('by_tenant',['tenantId']).index('by_tenant_request',['tenantId','requestKey']),
});
