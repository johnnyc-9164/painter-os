import {
  websiteContentValidator,
  websiteStateValidator,
  websitePreviewValidator,
  websiteWriteValidator,
  publicWebsiteValidator,
} from "./websiteValidators";
import { v } from "convex/values";
import type { GenericQueryCtx } from "convex/server";
import { mutation, query, type DataModel, type Id } from "./runtime";
import { resolvePainterMembership } from "./painter";
import { intakeDigest } from "./intakeCrypto";
import {
  validateCompanyWebsitePublication,
  emptyCompanyWebsiteContent,
  normalizeCompanyWebsiteContent,
  websiteMediaReferences,
  type CompanyWebsiteContent,
  type WebsiteResolvedMedia,
} from "../../domain/src/company-website";
export async function websiteAuthority(
  ctx: GenericQueryCtx<DataModel>,
  workspaceId?: Id<"painterWorkspaces">,
) {
  const result = await resolvePainterMembership(ctx, workspaceId);
  if (!["owner", "office_admin"].includes(result.actor.role))
    throw new Error("FORBIDDEN");
  return result;
}
export async function websiteRow(
  ctx: GenericQueryCtx<DataModel>,
  tenantId: Id<"painterWorkspaces">,
) {
  return ctx.db
    .query("painterCompanyWebsites")
    .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
    .unique();
}
export async function resolveWebsiteMedia(
  ctx: GenericQueryCtx<DataModel>,
  tenantId: Id<"painterWorkspaces">,
  content: CompanyWebsiteContent,
  revision: number,
  publicView: boolean,
): Promise<WebsiteResolvedMedia[]> {
  const ids = [
    ...new Set(websiteMediaReferences(content).map((ref) => ref.mediaId)),
  ];
  const media: WebsiteResolvedMedia[] = [];
  for (const mediaId of ids) {
    const row = await ctx.db
      .query("painterWebsiteMedia")
      .withIndex("by_tenant_media", (q) =>
        q.eq("tenantId", tenantId).eq("mediaId", mediaId),
      )
      .unique();
    if (
      row?.state !== "ready" ||
      !row.storageId ||
      !row.width ||
      !row.height ||
      !["image/png", "image/jpeg", "image/webp"].includes(row.contentType ?? "")
    ) {
      if (publicView) throw new Error("WEBSITE_MEDIA_UNAVAILABLE");
      continue;
    }
    const params = new URLSearchParams({
      workspaceId: String(tenantId),
      mediaId,
      revision: String(revision),
    });
    media.push({
      mediaId,
      url: `${publicView ? "/api/company-website-media" : "/api/website/media"}?${params}`,
      width: row.width,
      height: row.height,
      contentType: row.contentType as WebsiteResolvedMedia["contentType"],
    });
  }
  return media;
}
export const current = query({
  returns: websiteStateValidator,
  args: { workspaceId: v.optional(v.id("painterWorkspaces")) },
  handler: async (ctx, args) => {
    const { workspace } = await websiteAuthority(ctx, args.workspaceId);
    const row = await websiteRow(ctx, workspace._id);
    return {
      revision: row?.revision ?? 0,
      draft: row
        ? normalizeCompanyWebsiteContent(row.draft)
        : emptyCompanyWebsiteContent(workspace.name),
      published: row?.published
        ? {
            revision: row.published.revision,
            publishedAt: row.published.publishedAt,
          }
        : null,
    };
  },
});
export const preview = query({
  returns: websitePreviewValidator,
  args: {
    workspaceId: v.optional(v.id("painterWorkspaces")),
    expectedRevision: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { workspace } = await websiteAuthority(ctx, args.workspaceId);
    const row = await websiteRow(ctx, workspace._id);
    const revision = row?.revision ?? 0;
    if (
      args.expectedRevision !== undefined &&
      args.expectedRevision !== revision
    )
      throw new Error("REVISION_CONFLICT");
    const content = row
      ? normalizeCompanyWebsiteContent(row.draft)
      : emptyCompanyWebsiteContent(workspace.name);
    return {
      revision,
      content,
      media: await resolveWebsiteMedia(
        ctx,
        workspace._id,
        content,
        revision,
        false,
      ),
    };
  },
});
const writeArgs = {
  workspaceId: v.optional(v.id("painterWorkspaces")),
  expectedRevision: v.number(),
  requestKey: v.string(),
};
function write(operation: "saveDraft" | "publish" | "unpublish") {
  return mutation({
    returns: websiteWriteValidator,
    args:
      operation === "saveDraft"
        ? { ...writeArgs, content: websiteContentValidator }
        : { ...writeArgs },
    handler: async (ctx, args) => {
      const { actor, workspace } = await websiteAuthority(
        ctx,
        args.workspaceId,
      );
      if (
        !Number.isSafeInteger(args.expectedRevision) ||
        args.expectedRevision < 0 ||
        !args.requestKey.trim() ||
        args.requestKey.length > 180
      )
        throw new Error("INVALID_WEBSITE_REQUEST");
      const supplied =
        "content" in args
          ? normalizeCompanyWebsiteContent(args.content)
          : undefined;
      const requestHash = await intakeDigest(
        JSON.stringify(["website.write", workspace._id, args.requestKey]),
      );
      const fingerprint = await intakeDigest(
        JSON.stringify([
          operation,
          actor.id,
          actor.role,
          args.expectedRevision,
          supplied ?? null,
        ]),
      );
      const receipt = await ctx.db
        .query("painterWebsiteWrites")
        .withIndex("by_tenant_request", (q) =>
          q.eq("tenantId", workspace._id).eq("requestHash", requestHash),
        )
        .unique();
      if (receipt) {
        if (receipt.fingerprint !== fingerprint)
          throw new Error("IDEMPOTENCY_KEY_CONFLICT");
        return { ...receipt.result, replayed: true };
      }
      const row = await websiteRow(ctx, workspace._id);
      if ((row?.revision ?? 0) !== args.expectedRevision)
        throw new Error("REVISION_CONFLICT");
      const revision = args.expectedRevision + 1;
      if (!Number.isSafeInteger(revision))
        throw new Error("INVALID_WEBSITE_REVISION");
      const content =
        supplied ??
        (row
          ? normalizeCompanyWebsiteContent(row.draft)
          : emptyCompanyWebsiteContent(workspace.name));
      const now = new Date().toISOString();
      let published = row?.published;
      if (operation === "publish") {
        validateCompanyWebsitePublication(content);
        await resolveWebsiteMedia(ctx, workspace._id, content, revision, true);
        published = { revision, publishedAt: now, content };
      }
      if (operation === "unpublish") published = undefined;
      const value = {
        tenantId: workspace._id,
        revision,
        draft: content,
        ...(published ? { published } : {}),
        updatedBy: actor.id,
        updatedAt: now,
      };
      if (row) await ctx.db.replace(row._id, value);
      else await ctx.db.insert("painterCompanyWebsites", value);
      const result = {
        revision,
        publishedRevision: published?.revision ?? null,
        replayed: false,
      };
      await ctx.db.insert("painterWebsiteWrites", {
        tenantId: workspace._id,
        requestHash,
        fingerprint,
        result,
      });
      await ctx.db.insert("painterEvents", {
        tenantId: workspace._id,
        eventId: `website:${requestHash}`,
        entityId: String(workspace._id),
        type: `website.${operation}`,
        actorId: actor.id,
        occurredAt: now,
        payload: {
          schemaVersion: 1,
          tenantId: String(workspace._id),
          beforeRevision: args.expectedRevision,
          revision,
          publishedRevision: result.publishedRevision,
        },
      });
      return result;
    },
  });
}
export const saveDraft = write("saveDraft");
export const publish = write("publish");
export const unpublish = write("unpublish");
export const publicSnapshot = query({
  returns: publicWebsiteValidator,
  args: { workspaceId: v.string() },
  handler: async (ctx, args) => {
    const tenantId = ctx.db.normalizeId("painterWorkspaces", args.workspaceId);
    if (!tenantId || !(await ctx.db.get(tenantId)))
      return { state: "unavailable" as const };
    const row = await websiteRow(ctx, tenantId);
    if (!row?.published) return { state: "unavailable" as const };
    const content = normalizeCompanyWebsiteContent(row.published.content);
    return {
      state: "published" as const,
      website: {
        revision: row.published.revision,
        publishedAt: row.published.publishedAt,
        content,
        media: await resolveWebsiteMedia(
          ctx,
          tenantId,
          content,
          row.published.revision,
          true,
        ),
      },
    };
  },
});
