import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { blueprint } from './validators.js';
import { domainTables } from './domainTables.js';

// Lossless catalog plus separately typed records. No automatic promotion of historical snapshots.
export default defineSchema({
  ...domainTables,
  domainEvents: defineTable({
    tenantId:v.string(), actorId:v.string(), blueprint, identifier:v.string(), requestKey:v.string(),
    type:v.union(v.literal('record.created'),v.literal('record.updated')),
    beforeJson:v.union(v.string(),v.null()),afterJson:v.string(),occurredAt:v.number(),
    command:v.optional(v.string()),evidenceJson:v.optional(v.union(v.string(),v.null())),policyVersion:v.optional(v.string()),
  }).index('by_tenant',['tenantId']).index('by_tenant_entity',['tenantId','blueprint','identifier']),
  domainRequests: defineTable({
    tenantId:v.string(),requestKey:v.string(),signature:v.string(),entityId:v.string(),
    eventId:v.id('domainEvents'),revision:v.number(),createdAt:v.number(),
  }).index('by_tenant_request',['tenantId','requestKey']),
  businessRequests: defineTable({
    tenantId:v.string(),requestKey:v.string(),signature:v.string(),resultJson:v.string(),createdAt:v.number(),
  }).index('by_tenant_request',['tenantId','requestKey']),
  businessEvidence: defineTable({
    tenantId:v.string(),kind:v.string(),reference:v.string(),createdAt:v.number(),
  }).index('by_tenant_kind_reference',['tenantId','kind','reference']),
  entities: defineTable({
    tenantId: v.string(), blueprint, identifier: v.string(),
    title: v.union(v.string(), v.null()), snapshotJson: v.string(),
    importedAt: v.number(), lastEventId: v.id('events'),
  })
    .index('by_tenant_blueprint_identifier', ['tenantId', 'blueprint', 'identifier'])
    .index('by_tenant_blueprint', ['tenantId', 'blueprint'])
    .index('by_tenant_identifier', ['tenantId', 'identifier']),
  events: defineTable({
    tenantId: v.string(), blueprint, identifier: v.string(), actorId: v.string(),
    type: v.literal('port.entity.imported'), source: v.string(), requestKey: v.string(),
    snapshotJson: v.string(), occurredAt: v.number(),
  }).index('by_tenant', ['tenantId'])
    .index('by_tenant_blueprint_identifier', ['tenantId', 'blueprint', 'identifier']),
  links: defineTable({
    tenantId: v.string(), sourceBlueprint: blueprint, sourceIdentifier: v.string(),
    relation: v.string(), position: v.number(), targetIdentifier: v.string(),
    targetBlueprint: v.union(v.string(), v.null()),
  }).index('by_tenant_source', ['tenantId', 'sourceBlueprint', 'sourceIdentifier']),
  imports: defineTable({
    tenantId: v.string(), requestKey: v.string(), actorId: v.string(), source: v.string(),
    signature: v.string(), uniqueCount: v.number(), createdCount: v.number(),
    unchangedCount: v.number(), duplicates: v.number(), createdAt: v.number(),
  }).index('by_tenant_request', ['tenantId', 'requestKey']),
});
