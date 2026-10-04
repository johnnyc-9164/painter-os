import { paginationOptsValidator } from 'convex/server';
import { paginator } from 'convex-helpers/server/pagination';
import schema from './schema.js';
import { v, ConvexError } from 'convex/values';
import { mutation, query } from './_generated/server.js';
import type { Doc } from './_generated/dataModel.js';
import { blueprint, entityView, importResult, linkResult } from './validators.js';
import { boundedString, canonicalJson, LIMITS, linksOf, parseBatch, planImports, resolveCandidates, type ParsedEntity } from '../shared/port.js';

function tenant(tenantId: string) { boundedString(tenantId, 'INVALID_TENANT', 256); }
function pageLimit(numItems: number) {
  if (!Number.isInteger(numItems) || numItems < 1 || numItems > LIMITS.pageSize) throw new ConvexError('INVALID_PAGE_SIZE');
}
function view(r: Doc<'entities'>) {
  return { id: r._id, blueprint: r.blueprint, identifier: r.identifier, title: r.title, snapshotJson: r.snapshotJson, importedAt: r.importedAt };
}

/** Trusted-server API. Components do not receive the host's ctx.auth. */
export const importBatch = mutation({
  args: { tenantId: v.string(), actorId: v.string(), source: v.string(), requestKey: v.string(), recordsJson: v.string() },
  returns: importResult,
  handler: async (ctx, args) => {
    tenant(args.tenantId);
    boundedString(args.actorId, 'INVALID_ACTOR', 2048);
    boundedString(args.source, 'INVALID_SOURCE', 256);
    boundedString(args.requestKey, 'INVALID_REQUEST_KEY', 256);
    const batch = parseBatch(args.recordsJson);
    // Canonical original array also preserves the duplicate-count semantics of a retry.
    const signature = canonicalJson({ source: args.source, records: JSON.parse(args.recordsJson) });
    const receipt = await ctx.db.query('imports')
      .withIndex('by_tenant_request', q => q.eq('tenantId', args.tenantId).eq('requestKey', args.requestKey)).unique();
    if (receipt) {
      if (receipt.signature !== signature) throw new ConvexError('IDEMPOTENCY_KEY_CONFLICT');
      return { created: 0, unchanged: receipt.uniqueCount, duplicates: receipt.duplicates, replayed: true, receiptId: receipt._id };
    }
    const existing: ParsedEntity[] = [];
    for (const r of batch.records) {
      const found = await ctx.db.query('entities').withIndex('by_tenant_blueprint_identifier', q =>
        q.eq('tenantId', args.tenantId).eq('blueprint', r.blueprint).eq('identifier', r.identifier)).unique();
      if (found) existing.push(found);
    }
    // Resolve all identity conflicts before any writes. Convex also makes the mutation atomic.
    const plan = planImports(batch.records, existing);
    const now = Date.now();
    for (const r of plan.create) {
      // Accepted IMPORT fact, not acceptance of any commercial claim within the snapshot.
      const eventId = await ctx.db.insert('events', {
        tenantId: args.tenantId, blueprint: r.blueprint, identifier: r.identifier,
        actorId: args.actorId, type: 'port.entity.imported', source: args.source,
        requestKey: args.requestKey, snapshotJson: r.snapshotJson, occurredAt: now,
      });
      await ctx.db.insert('entities', { tenantId: args.tenantId, ...r, importedAt: now, lastEventId: eventId });
      for (const link of linksOf(r)) {
        await ctx.db.insert('links', { tenantId: args.tenantId, sourceBlueprint: r.blueprint, sourceIdentifier: r.identifier, ...link });
      }
    }
    const receiptId = await ctx.db.insert('imports', {
      tenantId: args.tenantId, requestKey: args.requestKey, actorId: args.actorId,
      source: args.source, signature, uniqueCount: batch.records.length,
      createdCount: plan.create.length, unchangedCount: plan.unchanged,
      duplicates: batch.duplicates, createdAt: now,
    });
    return { created: plan.create.length, unchanged: plan.unchanged, duplicates: batch.duplicates, replayed: false, receiptId };
  },
});

export const get = query({
  args: { tenantId: v.string(), blueprint, identifier: v.string() },
  returns: v.union(entityView, v.null()),
  handler: async (ctx, args) => {
    tenant(args.tenantId); boundedString(args.identifier, 'INVALID_IDENTIFIER');
    const r = await ctx.db.query('entities').withIndex('by_tenant_blueprint_identifier', q =>
      q.eq('tenantId', args.tenantId).eq('blueprint', args.blueprint).eq('identifier', args.identifier)).unique();
    return r ? view(r) : null;
  },
});
export const list = query({
  args: { tenantId: v.string(), blueprint, paginationOpts: paginationOptsValidator },
  returns: v.object({ page: v.array(entityView), isDone: v.boolean(), continueCursor: v.string() }),
  handler: async (ctx, args) => {
    tenant(args.tenantId); pageLimit(args.paginationOpts.numItems);
    const page = await paginator(ctx.db, schema).query('entities').withIndex('by_tenant_blueprint', q =>
      q.eq('tenantId', args.tenantId).eq('blueprint', args.blueprint)).paginate(args.paginationOpts);
    return { page: page.page.map(view), isDone: page.isDone, continueCursor: page.continueCursor };
  },
});
export const relations = query({
  args: { tenantId: v.string(), blueprint, identifier: v.string() },
  returns: v.array(linkResult),
  handler: async (ctx, args) => {
    tenant(args.tenantId); boundedString(args.identifier, 'INVALID_IDENTIFIER');
    const links = await ctx.db.query('links').withIndex('by_tenant_source', q =>
      q.eq('tenantId', args.tenantId).eq('sourceBlueprint', args.blueprint).eq('sourceIdentifier', args.identifier)).take(LIMITS.linksPerRecord + 1);
    if (links.length > LIMITS.linksPerRecord) throw new ConvexError('RELATION_LIMIT');
    const results = [];
    for (const link of links) {
      // At most twenty candidate blueprints can share an external identifier.
      // Tenant is always part of this lookup; never follow a foreign-tenant id.
      const candidates = await ctx.db.query('entities').withIndex('by_tenant_identifier', q =>
        q.eq('tenantId', args.tenantId).eq('identifier', link.targetIdentifier)).take(21);
      const result = resolveCandidates(args.tenantId, link.targetBlueprint, link.targetIdentifier, candidates);
      results.push({ relation: link.relation, position: link.position,
        targetIdentifier: link.targetIdentifier, targetBlueprint: link.targetBlueprint, status: result.status,
        target: result.target ? { blueprint: result.target.blueprint, identifier: result.target.identifier, title: result.target.title } : null,
      });
    }
    return results;
  },
});
const eventView = v.object({
  id: v.id('events'), blueprint, identifier: v.string(), actorId: v.string(),
  type: v.literal('port.entity.imported'), source: v.string(), requestKey: v.string(),
  snapshotJson: v.string(), occurredAt: v.number(),
});
export const history = query({
  args: { tenantId: v.string(), paginationOpts: paginationOptsValidator },
  returns: v.object({ page: v.array(eventView), isDone: v.boolean(), continueCursor: v.string() }),
  handler: async (ctx, args) => {
    tenant(args.tenantId); pageLimit(args.paginationOpts.numItems);
    const page = await paginator(ctx.db, schema).query('events').withIndex('by_tenant', q => q.eq('tenantId', args.tenantId)).paginate(args.paginationOpts);
    return {
      page: page.page.map(r => ({ id: r._id, blueprint: r.blueprint, identifier: r.identifier, actorId: r.actorId,
        type: r.type, source: r.source, requestKey: r.requestKey, snapshotJson: r.snapshotJson, occurredAt: r.occurredAt })),
      isDone: page.isDone, continueCursor: page.continueCursor,
    };
  },
});
