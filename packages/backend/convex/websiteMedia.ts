import {
  mediaReceiptValidator,
  mediaDetailsValidator,
  websiteMediaRowValidator,
} from "./websiteValidators";
import {
  internalMutationGeneric,
  internalQueryGeneric,
  type MutationBuilder,
  type QueryBuilder,
} from "convex/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query, api, type DataModel } from "./runtime";
import { websiteAuthority, websiteRow } from "./companyWebsite";
import { intakeDigest } from "./intakeCrypto";
import {
  WEBSITE_MEDIA_MAX_BYTES,
  websiteMediaReferences,
  normalizeCompanyWebsiteContent,
  type WebsiteMediaDetails,
  type WebsiteMediaReceipt,
} from "../../domain/src/company-website";
const internalMutation = internalMutationGeneric as MutationBuilder<
  DataModel,
  "internal"
>;
const internalQuery = internalQueryGeneric as QueryBuilder<
  DataModel,
  "internal"
>;
const workspaceArg = v.optional(v.id("painterWorkspaces"));
const details = (
  row: DataModel["painterWebsiteMedia"]["document"],
): WebsiteMediaDetails => ({
  mediaId: row.mediaId,
  name: row.name,
  width: row.width!,
  height: row.height!,
  size: row.size,
  contentType: row.contentType as WebsiteMediaDetails["contentType"],
  createdAt: new Date(row.createdAt).toISOString(),
});
export function mediaReceipt(
  row: DataModel["painterWebsiteMedia"]["document"],
): WebsiteMediaReceipt {
  return row.state === "ready"
    ? { state: "ready", media: details(row) }
    : { state: row.state, mediaId: row.mediaId };
}
async function requestHash(tenantId: string, key: string) {
  if (!key.trim() || key.length > 180)
    throw new Error("INVALID_UPLOAD_REQUEST");
  return intakeDigest(JSON.stringify(["website.upload", tenantId, key]));
}
export const status = query({
  returns: v.union(v.null(), mediaReceiptValidator),
  args: { workspaceId: workspaceArg, requestKey: v.string() },
  handler: async (ctx, args) => {
    const { actor, workspace } = await websiteAuthority(ctx, args.workspaceId);
    const hash = await requestHash(String(workspace._id), args.requestKey);
    const row = await ctx.db
      .query("painterWebsiteMedia")
      .withIndex("by_tenant_request", (q) =>
        q.eq("tenantId", workspace._id).eq("requestHash", hash),
      )
      .unique();
    if (row && row.actorId !== actor.id)
      throw new Error("IDEMPOTENCY_KEY_CONFLICT");
    return row ? mediaReceipt(row) : null;
  },
});
export const list = query({
  returns: v.object({
    media: v.array(mediaDetailsValidator),
    cursor: v.union(v.string(), v.null()),
    done: v.boolean(),
  }),
  args: { workspaceId: workspaceArg, paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const { workspace } = await websiteAuthority(ctx, args.workspaceId);
    if (args.paginationOpts.numItems < 1 || args.paginationOpts.numItems > 50)
      throw new Error("INVALID_MEDIA_PAGE");
    const result = await ctx.db
      .query("painterWebsiteMedia")
      .withIndex("by_tenant", (q) => q.eq("tenantId", workspace._id))
      .order("desc")
      .paginate({
        ...args.paginationOpts,
        maximumRowsRead: 50,
        maximumBytesRead: 256 * 1024,
      });
    return {
      media: result.page.filter((row) => row.state === "ready").map(details),
      cursor: result.isDone ? null : result.continueCursor,
      done: result.isDone,
    };
  },
});
export const reserve = internalMutation({
  returns: v.object({
    leader: v.boolean(),
    id: v.id("painterWebsiteMedia"),
    receipt: mediaReceiptValidator,
  }),
  args: {
    workspaceId: workspaceArg,
    requestKey: v.string(),
    fingerprint: v.string(),
    name: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const { actor, workspace } = await websiteAuthority(ctx, args.workspaceId);
    if (
      !args.name.trim() ||
      args.name.length > 200 ||
      !Number.isSafeInteger(args.size) ||
      args.size < 1 ||
      args.size > WEBSITE_MEDIA_MAX_BYTES
    )
      throw new Error("INVALID_UPLOAD");
    const hash = await requestHash(String(workspace._id), args.requestKey);
    const prior = await ctx.db
      .query("painterWebsiteMedia")
      .withIndex("by_tenant_request", (q) =>
        q.eq("tenantId", workspace._id).eq("requestHash", hash),
      )
      .unique();
    if (prior) {
      if (prior.actorId !== actor.id || prior.fingerprint !== args.fingerprint)
        throw new Error("IDEMPOTENCY_KEY_CONFLICT");
      return { leader: false, id: prior._id, receipt: mediaReceipt(prior) };
    }
    const rows = await ctx.db
      .query("painterWebsiteMedia")
      .withIndex("by_tenant", (q) => q.eq("tenantId", workspace._id))
      .take(201);
    if (rows.length >= 200) throw new Error("WEBSITE_MEDIA_CAPACITY");
    if (
      rows.filter((row) =>
        ["uploading", "staged", "reconciliation_required"].includes(row.state),
      ).length >= 3
    )
      throw new Error("WEBSITE_UPLOAD_BUSY");
    const now = Date.now();
    const mediaId = `website_${await intakeDigest(JSON.stringify([workspace._id, hash]))}`;
    const id = await ctx.db.insert("painterWebsiteMedia", {
      tenantId: workspace._id,
      actorId: actor.id,
      requestHash: hash,
      fingerprint: args.fingerprint,
      name: args.name.trim(),
      size: args.size,
      mediaId,
      state: "uploading",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(
      10 * 60 * 1000,
      api.websiteMediaUpload.reconcile,
      { id },
    );
    return {
      leader: true,
      id,
      receipt: { state: "uploading" as const, mediaId },
    };
  },
});
export const stage = internalMutation({
  returns: v.null(),
  args: {
    id: v.id("painterWebsiteMedia"),
    storageId: v.id("_storage"),
    width: v.number(),
    height: v.number(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.state !== "uploading")
      throw new Error("UPLOAD_STAGE_CONFLICT");
    await ctx.db.patch(row._id, {
      storageId: args.storageId,
      width: args.width,
      height: args.height,
      contentType: args.contentType,
      state: "staged",
      updatedAt: Date.now(),
    });
  },
});
export const finalize = internalMutation({
  returns: mediaReceiptValidator,
  args: { id: v.id("painterWebsiteMedia") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("UPLOAD_NOT_FOUND");
    const { actor } = await websiteAuthority(ctx, row.tenantId);
    if (actor.id !== row.actorId) throw new Error("FORBIDDEN");
    if (row.state === "ready") return mediaReceipt(row);
    if (row.state !== "staged" || !row.storageId)
      throw new Error("UPLOAD_FINALIZE_CONFLICT");
    await ctx.db.patch(row._id, { state: "ready", updatedAt: Date.now() });
    return mediaReceipt({ ...row, state: "ready" });
  },
});
export const inspect = internalQuery({
  returns: v.union(v.null(), websiteMediaRowValidator),
  args: { id: v.id("painterWebsiteMedia") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});
export const quarantine = internalMutation({
  returns: v.null(),
  args: {
    id: v.id("painterWebsiteMedia"),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row || row.state === "ready" || row.state === "deleted") return;
    if (args.storageId && row.storageId && args.storageId !== row.storageId)
      throw new Error("UPLOAD_STORAGE_CONFLICT");
    await ctx.db.patch(row._id, {
      ...(args.storageId ? { storageId: args.storageId } : {}),
      state:
        row.storageId || args.storageId
          ? "cleanup_pending"
          : "reconciliation_required",
      updatedAt: Date.now(),
    });
  },
});
export const deleted = internalMutation({
  returns: v.null(),
  args: { id: v.id("painterWebsiteMedia") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (row?.state === "cleanup_pending")
      await ctx.db.patch(row._id, {
        storageId: undefined,
        state: "deleted",
        updatedAt: Date.now(),
      });
  },
});
export const privateRead = internalQuery({
  returns: websiteMediaRowValidator,
  args: {
    workspaceId: workspaceArg,
    mediaId: v.string(),
    expectedRevision: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { workspace } = await websiteAuthority(ctx, args.workspaceId);
    const row = await ctx.db
      .query("painterWebsiteMedia")
      .withIndex("by_tenant_media", (q) =>
        q.eq("tenantId", workspace._id).eq("mediaId", args.mediaId),
      )
      .unique();
    if (!row || row.state !== "ready" || !row.storageId)
      throw new Error("WEBSITE_MEDIA_UNAVAILABLE");
    if (args.expectedRevision !== undefined) {
      const website = await websiteRow(ctx, workspace._id);
      if ((website?.revision ?? 0) !== args.expectedRevision)
        throw new Error("REVISION_CONFLICT");
      if (
        !website ||
        !websiteMediaReferences(
          normalizeCompanyWebsiteContent(website.draft),
        ).some((ref) => ref.mediaId === args.mediaId)
      )
        throw new Error("WEBSITE_MEDIA_UNAVAILABLE");
    }
    return row;
  },
});
export const publishedRead = internalQuery({
  returns: v.union(v.null(), websiteMediaRowValidator),
  args: { workspaceId: v.string(), mediaId: v.string(), revision: v.number() },
  handler: async (ctx, args) => {
    const tenantId = ctx.db.normalizeId("painterWorkspaces", args.workspaceId);
    if (!tenantId || !(await ctx.db.get(tenantId))) return null;
    const website = await websiteRow(ctx, tenantId);
    if (
      !website?.published ||
      website.published.revision !== args.revision ||
      !websiteMediaReferences(
        normalizeCompanyWebsiteContent(website.published.content),
      ).some((ref) => ref.mediaId === args.mediaId)
    )
      return null;
    const row = await ctx.db
      .query("painterWebsiteMedia")
      .withIndex("by_tenant_media", (q) =>
        q.eq("tenantId", tenantId).eq("mediaId", args.mediaId),
      )
      .unique();
    return row?.state === "ready" && row.storageId ? row : null;
  },
});
