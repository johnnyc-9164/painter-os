import { v } from 'convex/values';
import { query } from './runtime';
import { resolvePlatformAccess } from './platformAccess';
import { PLATFORM_MAX_CURSOR_LENGTH, PLATFORM_MAX_PAGE_SIZE } from '../platform-contract';
const denied = v.union(v.object({ state: v.literal('unauthenticated') }), v.object({ state: v.literal('denied') }));
const item = v.object({ id: v.id('platformOwnerAudit'), action: v.union(v.literal('bootstrap'), v.literal('revoke')), occurredAt: v.number(), beforeEnabled: v.boolean(), afterEnabled: v.boolean() });
/** Fixed redacted access audit. Check current authority before reading any audit records. */
export const list = query({
  args: { cursor: v.union(v.string(), v.null()), limit: v.number() },
  returns: v.union(v.object({ state: v.literal('ready'), items: v.array(item), nextCursor: v.union(v.string(), v.null()) }), denied),
  handler: async (ctx, args) => {
    const state = await resolvePlatformAccess(ctx);
    if (state !== 'ready') return { state };
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > PLATFORM_MAX_PAGE_SIZE || (args.cursor !== null && (!args.cursor || args.cursor.length > PLATFORM_MAX_CURSOR_LENGTH))) throw new Error('INVALID_PLATFORM_PAGINATION');
    // Convex's built-in by_creation_time index provides deterministic creation-order pagination.
    const page = await ctx.db.query('platformOwnerAudit').withIndex('by_creation_time').order('desc').paginate({ cursor: args.cursor, numItems: args.limit });
    return { state: 'ready' as const, items: page.page.map(row => ({ id: row._id, action: row.action, occurredAt: row.occurredAt, beforeEnabled: row.beforeEnabled, afterEnabled: row.afterEnabled })), nextCursor: page.isDone ? null : page.continueCursor };
  },
});

