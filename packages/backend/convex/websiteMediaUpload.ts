import { mediaReceiptValidator } from "./websiteValidators";
import {
  actionGeneric,
  internalActionGeneric,
  httpActionGeneric,
  type ActionBuilder,
} from "convex/server";
import { v } from "convex/values";
import { api, type DataModel } from "./runtime";
import { inspectWebsiteRaster } from "../website-media-contract";
import { WEBSITE_MEDIA_MAX_BYTES } from "../../domain/src/company-website";
const action = actionGeneric as ActionBuilder<DataModel, "public">;
const internalAction = internalActionGeneric as ActionBuilder<
  DataModel,
  "internal"
>;
export const upload = action({
  returns: mediaReceiptValidator,
  args: {
    workspaceId: v.optional(v.id("painterWorkspaces")),
    requestKey: v.string(),
    name: v.string(),
    bytes: v.bytes(),
  },
  handler: async (ctx, args) => {
    if (args.bytes.byteLength > WEBSITE_MEDIA_MAX_BYTES)
      throw new Error("WEBSITE_MEDIA_SIZE");
    // Authentication before image inspection; server-derived digest binds exact bytes/name.
    await ctx.runQuery(api.companyWebsite.current, {
      ...(args.workspaceId ? { workspaceId: args.workspaceId } : {}),
    });
    const metadata = inspectWebsiteRaster(args.bytes);
    const hash = new Uint8Array(
      await crypto.subtle.digest("SHA-256", args.bytes),
    );
    const digest = Array.from(hash, (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    const reservation = await ctx.runMutation(api.websiteMedia.reserve, {
      workspaceId: args.workspaceId,
      requestKey: args.requestKey,
      name: args.name,
      size: metadata.size,
      fingerprint: JSON.stringify([args.name.trim(), digest]),
    });
    if (!reservation.leader) return reservation.receipt;
    let storageId;
    try {
      storageId = await ctx.storage.store(
        new Blob([args.bytes], { type: metadata.contentType }),
      );
      await ctx.runMutation(api.websiteMedia.stage, {
        id: reservation.id,
        storageId,
        width: metadata.width,
        height: metadata.height,
        contentType: metadata.contentType,
      });
      return await ctx.runMutation(api.websiteMedia.finalize, {
        id: reservation.id,
      });
    } catch (error) {
      // A failed RPC is not proof it did not commit. Quarantine refuses ready rows.
      await ctx.runMutation(api.websiteMedia.quarantine, {
        id: reservation.id,
        ...(storageId ? { storageId } : {}),
      });
      await ctx.runAction(api.websiteMediaUpload.reconcile, {
        id: reservation.id,
      });
      throw error;
    }
  },
});
export const reconcile = internalAction({
  returns: v.null(),
  args: { id: v.id("painterWebsiteMedia") },
  handler: async (ctx, args) => {
    await ctx.runMutation(api.websiteMedia.quarantine, args);
    const row = await ctx.runQuery(api.websiteMedia.inspect, args);
    if (row?.state === "cleanup_pending" && row.storageId) {
      await ctx.storage.delete(row.storageId);
      await ctx.runMutation(api.websiteMedia.deleted, args);
    }
  },
});
export const readPrivate = action({
  returns: v.object({
    bytes: v.bytes(),
    contentType: v.union(
      v.literal("image/png"),
      v.literal("image/jpeg"),
      v.literal("image/webp"),
    ),
  }),
  args: {
    workspaceId: v.optional(v.id("painterWorkspaces")),
    mediaId: v.string(),
    expectedRevision: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const row = await ctx.runQuery(api.websiteMedia.privateRead, args);
    const blob = await ctx.storage.get(row.storageId);
    if (!blob) throw new Error("WEBSITE_MEDIA_UNAVAILABLE");
    const bytes = await blob.arrayBuffer();
    const current = await ctx.runQuery(api.websiteMedia.privateRead, args);
    if (current.storageId !== row.storageId)
      throw new Error("WEBSITE_MEDIA_UNAVAILABLE");
    return {
      bytes,
      contentType: row.contentType as "image/png" | "image/jpeg" | "image/webp",
    };
  },
});
export const publicMedia = httpActionGeneric(async (ctx, request) => {
  const url = new URL(request.url),
    params = url.searchParams;
  if ([...params.keys()].sort().join(",") !== "mediaId,revision,workspaceId")
    return new Response(null, { status: 400 });
  const revision = Number(params.get("revision"));
  if (!Number.isSafeInteger(revision) || revision < 1)
    return new Response(null, { status: 400 });
  const args = {
    workspaceId: params.get("workspaceId")!,
    mediaId: params.get("mediaId")!,
    revision,
  };
  const row = await ctx.runQuery(api.websiteMedia.publishedRead, args);
  if (!row) return new Response(null, { status: 404 });
  const blob = await ctx.storage.get(row.storageId);
  if (!blob) return new Response(null, { status: 404 });
  // Recheck immediately before responding as storage retrieval is outside transaction.
  const current = await ctx.runQuery(api.websiteMedia.publishedRead, args);
  if (!current || current.storageId !== row.storageId)
    return new Response(null, { status: 404 });
  return new Response(blob, {
    headers: {
      "Content-Type": row.contentType,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
