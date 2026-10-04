/** Real Convex transaction adapter. No independent calls, scheduler hops, or external side effects. */
import type { MutationCtx } from './_generated/server.js';
import { ConvexError } from 'convex/values';
import { canonicalJson } from '../shared/port.js';
import { checkRead } from './domainRuntime.js';
import type { BusinessStore, BusinessResult } from '../shared/businessTypes.js';
import { readRecord, unpack, insertRecord, patchRecord } from './businessRecords.js';
export function convexBusinessStore(ctx: MutationCtx, tenantId: string): BusinessStore {
    checkRead(tenantId);
    const now = Date.now();
    return {
        now,
        async hasJobForContract(contractId) { const id = ctx.db.normalizeId('co_contract', contractId); if (!id)
            throw new ConvexError('ENTITY_NOT_FOUND'); return (await ctx.db.query('co_job').withIndex('by_tenant_contract', q => q.eq('tenantId', tenantId).eq('relations.contract', id)).take(1)).length > 0; },
        load: (blueprint, identifier) => readRecord(ctx, tenantId, blueprint, identifier),
        async loadId(blueprint, localId) { const id = ctx.db.normalizeId(blueprint, localId); return id ? unpack(blueprint, await ctx.db.get(id), tenantId) : null; },
        async create(bp, r, eventId) { if (r.tenantId !== tenantId)
            throw new ConvexError('TENANT_MISMATCH'); return insertRecord(ctx, bp, r, eventId, now); },
        async save(r, eventId) { if (r.tenantId !== tenantId)
            throw new ConvexError('TENANT_MISMATCH'); await patchRecord(ctx, r, eventId, now); },
        async event(e) { if (e.tenantId !== tenantId)
            throw new ConvexError('TENANT_MISMATCH'); return ctx.db.insert('domainEvents', e); },
        async receipt(requestKey) { const r = await ctx.db.query('businessRequests').withIndex('by_tenant_request', q => q.eq('tenantId', tenantId).eq('requestKey', requestKey)).unique(); return r ? { signature: r.signature, result: JSON.parse(r.resultJson) as BusinessResult } : null; },
        async saveReceipt(requestKey, value) { await ctx.db.insert('businessRequests', { tenantId, requestKey, signature: value.signature, resultJson: canonicalJson(value.result), createdAt: now }); },
        async evidenceUsed(kind, reference) { return (await ctx.db.query('businessEvidence').withIndex('by_tenant_kind_reference', q => q.eq('tenantId', tenantId).eq('kind', kind).eq('reference', reference)).unique()) !== null; },
        async claimEvidence(kind, reference) { await ctx.db.insert('businessEvidence', { tenantId, kind, reference, createdAt: now }); },
    };
}
