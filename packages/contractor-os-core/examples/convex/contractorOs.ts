import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { query, mutation } from './_generated/server.js';
import { components } from './_generated/api.js';
import type { DataModel } from './_generated/dataModel.js';
import { ContractorOS } from '../../src/client.js';
import { blueprint } from '../../src/component/validators.js';

const os = new ContractorOS<DataModel>(components.contractorOs, async (ctx, identity) => {
  const row = await ctx.db.query('contractorOsMemberships')
    .withIndex('by_identity', q => q.eq('tokenIdentifier', identity.tokenIdentifier)).unique();
  if (!row || !row.enabled) return null;
  return { tenantId: row.tenantId, permissions: row.role === 'admin' ? ['read', 'import'] : ['read'] };
});

export const get = query({
  args: { blueprint, identifier: v.string() },
  handler: (ctx, args) => os.get(ctx, args),
});
export const list = query({
  args: { blueprint, paginationOpts: paginationOptsValidator },
  handler: (ctx, args) => os.list(ctx, args),
});
export const relations = query({
  args: { blueprint, identifier: v.string() },
  handler: (ctx, args) => os.relations(ctx, args),
});
export const history = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: (ctx, args) => os.history(ctx, args),
});
export const importSnapshot = mutation({
  args: { source: v.string(), requestKey: v.string(), recordsJson: v.string() },
  handler: (ctx, args) => os.importBatch(ctx, args),
});
