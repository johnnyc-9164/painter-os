// Generated from explicit aggregate paths. This is application code, not Convex SDK codegen.
import type { QueryCtx } from './_generated/server.js';
import { ConvexError } from 'convex/values';
import { unpack } from './businessRecords.js';
import type { ProjectionReader } from '../shared/projections.js';
import type { StoredRecord } from '../shared/businessTypes.js';
export function projectionReader(ctx: QueryCtx, tenantId: string): ProjectionReader {
 return {
  async byId(blueprint, localId) { const id = ctx.db.normalizeId(blueprint, localId); return id ? unpack(blueprint, await ctx.db.get(id), tenantId) : null; },
  async incoming(blueprint, relation, sourceId, limit) {
   if (!Number.isInteger(limit) || limit < 1 || limit > 51) throw new ConvexError('INVALID_AGGREGATE_LIMIT');
   switch (`${blueprint}:${relation}`) {
    case 'co_bid:proposal': {
     const id = ctx.db.normalizeId('co_proposal', sourceId); if (!id) return [];
     const rows = await ctx.db.query('co_bid').withIndex('by_tenant_proposal', q => q.eq('tenantId', tenantId).eq('relations.proposal', id)).take(limit);
     return rows.map(row => unpack('co_bid', row, tenantId)).filter((row): row is StoredRecord => row !== null);
    }
    case 'co_change_order:contract': {
     const id = ctx.db.normalizeId('co_contract', sourceId); if (!id) return [];
     const rows = await ctx.db.query('co_change_order').withIndex('by_tenant_contract', q => q.eq('tenantId', tenantId).eq('relations.contract', id)).take(limit);
     return rows.map(row => unpack('co_change_order', row, tenantId)).filter((row): row is StoredRecord => row !== null);
    }
    case 'co_change_order:job': {
     const id = ctx.db.normalizeId('co_job', sourceId); if (!id) return [];
     const rows = await ctx.db.query('co_change_order').withIndex('by_tenant_job', q => q.eq('tenantId', tenantId).eq('relations.job', id)).take(limit);
     return rows.map(row => unpack('co_change_order', row, tenantId)).filter((row): row is StoredRecord => row !== null);
    }
    case 'co_contract:client': {
     const id = ctx.db.normalizeId('co_client', sourceId); if (!id) return [];
     const rows = await ctx.db.query('co_contract').withIndex('by_tenant_client', q => q.eq('tenantId', tenantId).eq('relations.client', id)).take(limit);
     return rows.map(row => unpack('co_contract', row, tenantId)).filter((row): row is StoredRecord => row !== null);
    }
    case 'co_daily_report:job': {
     const id = ctx.db.normalizeId('co_job', sourceId); if (!id) return [];
     const rows = await ctx.db.query('co_daily_report').withIndex('by_tenant_job', q => q.eq('tenantId', tenantId).eq('relations.job', id)).take(limit);
     return rows.map(row => unpack('co_daily_report', row, tenantId)).filter((row): row is StoredRecord => row !== null);
    }
    case 'co_invoice:contract': {
     const id = ctx.db.normalizeId('co_contract', sourceId); if (!id) return [];
     const rows = await ctx.db.query('co_invoice').withIndex('by_tenant_contract', q => q.eq('tenantId', tenantId).eq('relations.contract', id)).take(limit);
     return rows.map(row => unpack('co_invoice', row, tenantId)).filter((row): row is StoredRecord => row !== null);
    }
    case 'co_invoice:job': {
     const id = ctx.db.normalizeId('co_job', sourceId); if (!id) return [];
     const rows = await ctx.db.query('co_invoice').withIndex('by_tenant_job', q => q.eq('tenantId', tenantId).eq('relations.job', id)).take(limit);
     return rows.map(row => unpack('co_invoice', row, tenantId)).filter((row): row is StoredRecord => row !== null);
    }
    case 'co_job:client': {
     const id = ctx.db.normalizeId('co_client', sourceId); if (!id) return [];
     const rows = await ctx.db.query('co_job').withIndex('by_tenant_client', q => q.eq('tenantId', tenantId).eq('relations.client', id)).take(limit);
     return rows.map(row => unpack('co_job', row, tenantId)).filter((row): row is StoredRecord => row !== null);
    }
    case 'co_lead:campaign': {
     const id = ctx.db.normalizeId('co_campaign', sourceId); if (!id) return [];
     const rows = await ctx.db.query('co_lead').withIndex('by_tenant_campaign', q => q.eq('tenantId', tenantId).eq('relations.campaign', id)).take(limit);
     return rows.map(row => unpack('co_lead', row, tenantId)).filter((row): row is StoredRecord => row !== null);
    }
    case 'co_lead:client': {
     const id = ctx.db.normalizeId('co_client', sourceId); if (!id) return [];
     const rows = await ctx.db.query('co_lead').withIndex('by_tenant_client', q => q.eq('tenantId', tenantId).eq('relations.client', id)).take(limit);
     return rows.map(row => unpack('co_lead', row, tenantId)).filter((row): row is StoredRecord => row !== null);
    }
    case 'co_outreach:campaign': {
     const id = ctx.db.normalizeId('co_campaign', sourceId); if (!id) return [];
     const rows = await ctx.db.query('co_outreach').withIndex('by_tenant_campaign', q => q.eq('tenantId', tenantId).eq('relations.campaign', id)).take(limit);
     return rows.map(row => unpack('co_outreach', row, tenantId)).filter((row): row is StoredRecord => row !== null);
    }
    case 'co_payment:client': {
     const id = ctx.db.normalizeId('co_client', sourceId); if (!id) return [];
     const rows = await ctx.db.query('co_payment').withIndex('by_tenant_client', q => q.eq('tenantId', tenantId).eq('relations.client', id)).take(limit);
     return rows.map(row => unpack('co_payment', row, tenantId)).filter((row): row is StoredRecord => row !== null);
    }
    case 'co_proposal:lead': {
     const id = ctx.db.normalizeId('co_lead', sourceId); if (!id) return [];
     const rows = await ctx.db.query('co_proposal').withIndex('by_tenant_lead', q => q.eq('tenantId', tenantId).eq('relations.lead', id)).take(limit);
     return rows.map(row => unpack('co_proposal', row, tenantId)).filter((row): row is StoredRecord => row !== null);
    }
    case 'co_site_visit:lead': {
     const id = ctx.db.normalizeId('co_lead', sourceId); if (!id) return [];
     const rows = await ctx.db.query('co_site_visit').withIndex('by_tenant_lead', q => q.eq('tenantId', tenantId).eq('relations.lead', id)).take(limit);
     return rows.map(row => unpack('co_site_visit', row, tenantId)).filter((row): row is StoredRecord => row !== null);
    }
    default: throw new ConvexError('UNKNOWN_AGGREGATE_PATH');
   }
  }
 };
}
