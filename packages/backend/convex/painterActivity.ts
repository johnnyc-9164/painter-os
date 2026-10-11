import {v} from 'convex/values';
import {query} from './runtime';
import {resolvePainterMembership} from './painter';
import {painterEntityFromRow, painterEventFromRow} from './painterStore';
import {ACTIVITY_PAGE_MAX, projectAuditEvent} from './painterReadsets';
import {visibleEntities} from '../../domain/src/engine';

/** Paginated audit history read model. Same membership authority and role/customer
 * projection as snapshot; newest first; no history is dropped, only paged. */
export const activityPage = query({
  args: {workspaceId: v.optional(v.id('painterWorkspaces')), cursor: v.union(v.string(), v.null()), numItems: v.optional(v.number())},
  handler: async (ctx, args) => {
    const {actor, workspace} = await resolvePainterMembership(ctx, args.workspaceId);
    if (actor.role === 'customer') return {page: [], continueCursor: '', isDone: true};
    const numItems = Math.min(Math.max(Math.trunc(args.numItems ?? 50), 1), ACTIVITY_PAGE_MAX);
    const result = await ctx.db.query('painterEvents').withIndex('by_tenant', q => q.eq('tenantId', workspace._id)).order('desc').paginate({cursor: args.cursor, numItems});
    const ids = [...new Set(result.page.map(event => event.entityId))];
    const rows = (await Promise.all(ids.map(id => ctx.db.query('painterEntities').withIndex('by_tenant_entity', q => q.eq('tenantId', workspace._id).eq('entityId', id)).unique()))).filter(row => row !== null);
    const visible = new Set(visibleEntities({entities: rows.map(painterEntityFromRow), events: [], receipts: {}}, actor).map(entity => entity.id));
    return {page: result.page.map(painterEventFromRow).filter(event => visible.has(event.entityId)).map(event => projectAuditEvent(actor, event)), continueCursor: result.continueCursor, isDone: result.isDone};
  },
});
