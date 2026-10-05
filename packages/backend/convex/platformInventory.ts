import { v } from 'convex/values';
import { query, type DataModel } from './runtime';
import { resolvePlatformAccess } from './platformAccess';
import { PLATFORM_MAX_CURSOR_LENGTH, PLATFORM_MAX_PAGE_SIZE, type WorkspaceSummary } from '../platform-contract';

const denied = v.union(v.object({ state: v.literal('unauthenticated') }), v.object({ state: v.literal('denied') }));
const summary = v.object({ id: v.id('painterWorkspaces'), name: v.string(), createdAt: v.string(), demo: v.boolean() });
function project(row: DataModel['painterWorkspaces']['document']): WorkspaceSummary & { id: typeof row._id } {
  return { id: row._id, name: row.name, createdAt: row.createdAt, demo: row.demo };
}

export const access = query({
  args: {},
  returns: v.union(v.object({ state: v.literal('ready') }), denied),
  handler: async ctx => ({ state: await resolvePlatformAccess(ctx) }),
});

/** Fixed inventory, not a generic table reader. Authorization precedes all workspace reads. */
export const list = query({
  args: { cursor: v.union(v.string(), v.null()), limit: v.number() },
  returns: v.union(v.object({ state: v.literal('ready'), items: v.array(summary), nextCursor: v.union(v.string(), v.null()) }), denied),
  handler: async (ctx, args) => {
    const state = await resolvePlatformAccess(ctx);
    if (state !== 'ready') return { state };
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > PLATFORM_MAX_PAGE_SIZE || (args.cursor !== null && (!args.cursor || args.cursor.length > PLATFORM_MAX_CURSOR_LENGTH))) throw new Error('INVALID_PLATFORM_PAGINATION');
    // Convex's built-in by_creation_time index provides deterministic creation-order pagination.
    const page = await ctx.db.query('painterWorkspaces').withIndex('by_creation_time').order('desc').paginate({ cursor: args.cursor, numItems: args.limit });
    return { state: 'ready' as const, items: page.page.map(project), nextCursor: page.isDone ? null : page.continueCursor };
  },
});

export const get = query({
  args: { id: v.string() },
  returns: v.union(v.object({ state: v.literal('ready'), workspace: summary }), denied, v.object({ state: v.literal('not_found') })),
  handler: async (ctx, args) => {
    const state = await resolvePlatformAccess(ctx);
    if (state !== 'ready') return { state };
    const id = ctx.db.normalizeId('painterWorkspaces', args.id);
    if (!id) throw new Error('INVALID_PLATFORM_WORKSPACE');
    const workspace = await ctx.db.get(id);
    return workspace ? { state: 'ready' as const, workspace: project(workspace) } : { state: 'not_found' as const };
  },
});
