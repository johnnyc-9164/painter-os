/** Anonymous, tenant-scoped CMS reads. The authenticated article command remains sole writer. */
import { ConvexError, v } from 'convex/values';
import type { GenericQueryCtx } from 'convex/server';
import type { DataModel, Id } from './runtime';
import { query } from './runtime';

type Ctx = GenericQueryCtx<DataModel>;
const LEGACY_LIMIT = 20;
const MAX_PAGE_SIZE = 20;
const articleFields = { id: v.string(), title: v.string(), slug: v.string(), content: v.string(), publishedAt: v.string() };
const summaryFields = { id: v.string(), title: v.string(), slug: v.string(), excerpt: v.string(), publishedAt: v.string() };

async function workspace(ctx: Ctx, value: string): Promise<Id<'painterWorkspaces'>> {
  const id = ctx.db.normalizeId('painterWorkspaces', value);
  if (id === null || await ctx.db.get(id) === null) throw new ConvexError('PUBLIC_WORKSPACE_NOT_FOUND');
  return id;
}
function publicRows(ctx: Ctx, tenantId: Id<'painterWorkspaces'>) {
  return ctx.db.query('painterEntities').withIndex('by_tenant_type_status_public', q =>
    q.eq('tenantId', tenantId).eq('type', 'article').eq('data.status', 'published').eq('data.public', true));
}
function project(row: { entityId: string; data: Record<string, unknown> }) {
  const data = row.data;
  if (['title', 'slug', 'content', 'publishedAt'].some(key => typeof data[key] !== 'string' || (data[key] as string).length > 100000) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(data.slug)) || row.entityId.length > 1024 || String(data.publishedAt).length > 128) throw new ConvexError('INVALID_PUBLIC_ARTICLE');
  return { id: row.entityId, title: data.title as string, slug: data.slug as string, content: data.content as string, publishedAt: data.publishedAt as string };
}
function readCursor(value: string | null, tenantId: string): string | null {
  if (value === null) return null;
  try {
    if (value.length > 8192) throw new Error('large cursor');
    const decoded = JSON.parse(value);
    if (decoded.workspaceId !== tenantId || typeof decoded.cursor !== 'string' || !decoded.cursor) throw new Error('cursor binding');
    return decoded.cursor;
  } catch { throw new ConvexError('INVALID_PUBLIC_ARTICLE_CURSOR'); }
}

/** Compatibility: complete small lists; explicit overflow rather than silently losing articles. */
export const articles = query({
  args: { workspaceId: v.string(), slug: v.optional(v.string()) },
  returns: v.array(v.object(articleFields)),
  handler: async (ctx, args) => {
    const tenantId = await workspace(ctx, args.workspaceId);
    if (args.slug !== undefined) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.slug)) throw new ConvexError('INVALID_PUBLIC_ARTICLE_SLUG');
      const rows = await ctx.db.query('painterEntities').withIndex('by_tenant_type_status_public_slug', q =>
        q.eq('tenantId', tenantId).eq('type', 'article').eq('data.status', 'published').eq('data.public', true).eq('data.slug', args.slug)).take(2);
      if (rows.length > 1) throw new ConvexError('DUPLICATE_PUBLIC_ARTICLE_SLUG');
      return rows.map(project);
    }
    const rows = await publicRows(ctx, tenantId).take(LEGACY_LIMIT + 1);
    if (rows.length > LEGACY_LIMIT) throw new ConvexError('PUBLIC_ARTICLES_PAGINATION_REQUIRED');
    return rows.map(project);
  }
});

export const articlesPage = query({
  args: { workspaceId: v.string(), cursor: v.union(v.null(), v.string()), limit: v.optional(v.number()) },
  returns: v.object({ page: v.array(v.object(summaryFields)), isDone: v.boolean(), continueCursor: v.union(v.null(), v.string()) }),
  handler: async (ctx, args) => {
    const tenantId = await workspace(ctx, args.workspaceId);
    const limit = args.limit ?? 10;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) throw new ConvexError('INVALID_PUBLIC_ARTICLE_PAGE_SIZE');
    const cursor = readCursor(args.cursor, String(tenantId));
    // Byte threshold includes complete stored documents, not the excerpt DTO.
    // Convex checks after a document; one native-size-limited document may cross it.
    // This sequential SSR contract consumes continueCursor even when a byte-limited
    // page is short; reactive interval split hints are not used as completion.
    const result = await publicRows(ctx, tenantId).paginate({ numItems: limit, cursor, maximumRowsRead: MAX_PAGE_SIZE, maximumBytesRead: 1024 * 1024 });
    return {
      page: result.page.map(row => { const { content, ...summary } = project(row); return { ...summary, excerpt: content.slice(0, 300) }; }),
      isDone: result.isDone,
      continueCursor: result.isDone ? null : JSON.stringify({ workspaceId: String(tenantId), cursor: result.continueCursor })
    };
  }
});
