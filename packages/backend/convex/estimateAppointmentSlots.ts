import {
  appointmentBoundary,
  isAppointmentRefusal,
  refuseAppointment,
} from "./estimateAppointmentErrors";
import {
  actionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
  paginationOptsValidator,
  type ActionBuilder,
  type MutationBuilder,
  type QueryBuilder,
} from "convex/server";
import { v } from "convex/values";
import { api, mutation, query, type DataModel } from "./runtime";
import {
  makeEstimateSlot,
  closeEstimateSlot,
  ESTIMATE_APPOINTMENT_LIMITS,
  type EstimateSlotInput,
} from "../../domain/src/estimate-appointments";
import { intakeDigest } from "./intakeCrypto";
import {
  appointmentAuthority,
  appointmentResource,
  nativeRequestKey,
  nativeReceipt,
  nativeReceipts,
  nativeRows,
  slotFromRow,
  canonicalSlotInput,
  verifiedSlot,
  slotProof,
  persistNative,
  NATIVE_FLAGS,
} from "./estimateAppointmentStore";
import {
  slotResultValidator,
  slotWriteArgs,
  estimateSlotValidator,
  nativeFlags,
} from "./estimateAppointmentValidators";
const action = actionGeneric as ActionBuilder<DataModel, "public">;
const internalMutation = internalMutationGeneric as MutationBuilder<
  DataModel,
  "internal"
>;
const internalQuery = internalQueryGeneric as QueryBuilder<
  DataModel,
  "internal"
>;
export const save = action({
  args: slotWriteArgs,
  returns: slotResultValidator,
  handler: (ctx, args) =>
    appointmentBoundary(() =>
      ctx.runAction(api.estimateAppointmentSlotNormalization.normalize, args),
    ),
});
export const authority = internalQuery({
  args: {
    workspaceId: v.optional(v.id("painterWorkspaces")),
    resourceId: v.string(),
  },
  returns: v.object({ workspaceId: v.id("painterWorkspaces") }),
  handler: async (ctx, args) =>
    appointmentBoundary(async () => {
      const { workspace } = await appointmentAuthority(ctx, args.workspaceId);
      await appointmentResource(ctx, workspace._id, args.resourceId);
      return { workspaceId: workspace._id };
    }),
});
/** Internal only: normalizedInstant is derived by authenticated Node action, never browser args. */
export const commitNormalized = internalMutation({
  args: {
    ...slotWriteArgs,
    workspaceId: v.id("painterWorkspaces"),
    normalizedInstant: v.string(),
  },
  returns: slotResultValidator,
  handler: async (ctx, args) =>
    appointmentBoundary(async () => {
      const { actor, workspace } = await appointmentAuthority(
        ctx,
        args.workspaceId,
      );
      const resource = await appointmentResource(
        ctx,
        workspace._id,
        args.resourceId,
      );
      if (
        !Number.isSafeInteger(args.expectedRevision) ||
        args.expectedRevision < 0 ||
        (args.expectedRevision === 0) === (args.slotId !== undefined)
      )
        refuseAppointment("APPOINTMENT_INVALID_REVISION");
      const key = await nativeRequestKey(
        String(workspace._id),
        "estimate_slot",
        args.requestKey,
      );
      const fingerprint = await intakeDigest(
        JSON.stringify([
          actor.id,
          actor.role,
          Object.entries({ ...args, requestKey: key }).sort(([a], [b]) =>
            a < b ? -1 : a > b ? 1 : 0,
          ),
        ]),
      );
      const prior = await nativeReceipt(
        ctx,
        workspace._id,
        "estimate_slot",
        key,
      );
      if (prior) {
        if (prior.fingerprint !== fingerprint)
          refuseAppointment("APPOINTMENT_IDEMPOTENCY_CONFLICT");
        const { slot } = await verifiedSlot(
          ctx,
          workspace._id,
          String(prior.result.entity?.id),
        );
        return { slot, replayed: true, ...NATIVE_FLAGS };
      }
      const receipts = await nativeReceipts(
        ctx,
        workspace._id,
        "estimate_slot",
      );
      if (receipts.length === ESTIMATE_APPOINTMENT_LIMITS.receipts)
        refuseAppointment("APPOINTMENT_STATE_LIMIT");
      let before: DataModel["painterEntities"]["document"][] = [];
      let id = args.slotId;
      if (id) {
        const current = await verifiedSlot(ctx, workspace._id, id);
        if (current.slot.revision !== args.expectedRevision)
          refuseAppointment("APPOINTMENT_SLOT_CHANGED");
        if (current.slot.status !== "offered")
          refuseAppointment("APPOINTMENT_INVALID_TRANSITION");
        before = [current.row];
      } else {
        const rows = await nativeRows(ctx, workspace._id, "estimate_slot");
        if (rows.length === ESTIMATE_APPOINTMENT_LIMITS.appointments)
          refuseAppointment("APPOINTMENT_STATE_LIMIT");
        id = `slot:${key.slice(key.lastIndexOf(":") + 1)}`;
        const collision = await ctx.db
          .query("painterEntities")
          .withIndex("by_tenant_entity", (q) =>
            q.eq("tenantId", workspace._id).eq("entityId", id!),
          )
          .unique();
        if (collision) refuseAppointment("APPOINTMENT_DUPLICATE_ID");
      }
      const input: EstimateSlotInput = {
        id,
        revision: args.expectedRevision + 1,
        resourceId: args.resourceId,
        status: "offered",
        localStart: args.localStart,
        timeZone: args.timeZone,
        offset: args.offset,
        durationMinutes: args.durationMinutes,
        bufferBeforeMinutes: args.bufferBeforeMinutes,
        bufferAfterMinutes: args.bufferAfterMinutes,
      };
      const slot = makeEstimateSlot(
        { actor, nowMs: Date.now(), resource },
        input,
        {
          normalizeSlotInstant: (candidate) => {
            if (canonicalSlotInput(candidate) !== canonicalSlotInput(input))
              refuseAppointment("APPOINTMENT_INVALID_NORMALIZATION");
            return args.normalizedInstant;
          },
        },
      );
      await persistNative(
        ctx,
        workspace._id,
        "estimate_slot",
        before,
        slot,
        key,
        fingerprint,
        actor.id,
        "save",
        { normalizationProof: await slotProof(slot) },
      );
      return { slot, replayed: false, ...NATIVE_FLAGS };
    }),
});
export const close = mutation({
  args: {
    workspaceId: v.optional(v.id("painterWorkspaces")),
    slotId: v.string(),
    expectedRevision: v.number(),
    requestKey: v.string(),
  },
  returns: slotResultValidator,
  handler: async (ctx, args) =>
    appointmentBoundary(async () => {
      const { actor, workspace } = await appointmentAuthority(
        ctx,
        args.workspaceId,
      );
      const key = await nativeRequestKey(
        String(workspace._id),
        "estimate_slot",
        args.requestKey,
      );
      const fingerprint = await intakeDigest(
        JSON.stringify([
          actor.id,
          actor.role,
          "close",
          Object.entries({
            ...args,
            workspaceId: workspace._id,
            requestKey: key,
          }).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
        ]),
      );
      const prior = await nativeReceipt(
        ctx,
        workspace._id,
        "estimate_slot",
        key,
      );
      const current = await verifiedSlot(ctx, workspace._id, args.slotId);
      if (prior) {
        if (prior.fingerprint !== fingerprint)
          refuseAppointment("APPOINTMENT_IDEMPOTENCY_CONFLICT");
        return { slot: current.slot, replayed: true, ...NATIVE_FLAGS };
      }
      if (
        (await nativeReceipts(ctx, workspace._id, "estimate_slot")).length ===
        ESTIMATE_APPOINTMENT_LIMITS.receipts
      )
        refuseAppointment("APPOINTMENT_STATE_LIMIT");
      const slot = closeEstimateSlot(
        { actor, nowMs: Date.now() },
        current.slot,
        args.expectedRevision,
      );
      await persistNative(
        ctx,
        workspace._id,
        "estimate_slot",
        [current.row],
        slot,
        key,
        fingerprint,
        actor.id,
        "close",
        { normalizationProof: await slotProof(slot) },
      );
      return { slot, replayed: false, ...NATIVE_FLAGS };
    }),
});
export const list = query({
  args: {
    workspaceId: v.optional(v.id("painterWorkspaces")),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    items: v.array(estimateSlotValidator),
    nextCursor: v.union(v.string(), v.null()),
    done: v.boolean(),
    ...nativeFlags,
  }),
  handler: async (ctx, args) =>
    appointmentBoundary(async () => {
      const { actor, workspace } = await appointmentAuthority(
        ctx,
        args.workspaceId,
        true,
      );
      if (
        !Number.isSafeInteger(args.paginationOpts.numItems) ||
        args.paginationOpts.numItems < 1 ||
        args.paginationOpts.numItems > 25
      )
        refuseAppointment("APPOINTMENT_INVALID_PAGE");
      const rows =
        actor.role === "estimator"
          ? ctx.db
              .query("painterEntities")
              .withIndex("by_tenant_type_resource_start", (q) =>
                q
                  .eq("tenantId", workspace._id)
                  .eq("type", "estimate_slot")
                  .eq("data.resourceId", actor.id),
              )
          : ctx.db
              .query("painterEntities")
              .withIndex("by_tenant_type", (q) =>
                q.eq("tenantId", workspace._id).eq("type", "estimate_slot"),
              );
      const page = await rows.order("desc").paginate({
        ...args.paginationOpts,
        maximumRowsRead: 25,
        maximumBytesRead: 128 * 1024,
      });
      return {
        items: page.page.map(slotFromRow),
        nextCursor: page.isDone ? null : page.continueCursor,
        done: page.isDone,
        ...NATIVE_FLAGS,
      };
    }),
});
export const resources = query({
  args: { workspaceId: v.optional(v.id("painterWorkspaces")) },
  returns: v.array(
    v.object({
      userId: v.string(),
      name: v.string(),
      role: v.union(
        v.literal("owner"),
        v.literal("office_admin"),
        v.literal("estimator"),
      ),
    }),
  ),
  handler: async (ctx, args) =>
    appointmentBoundary(async () => {
      const { workspace } = await appointmentAuthority(ctx, args.workspaceId);
      const members = await ctx.db
        .query("painterMembers")
        .withIndex("by_tenant", (q) => q.eq("tenantId", workspace._id))
        .take(101);
      if (members.length > 100)
        refuseAppointment("APPOINTMENT_RESOURCE_LIST_LIMIT");
      const result: {
        userId: string;
        name: string;
        role: "owner" | "office_admin" | "estimator";
      }[] = [];
      for (const member of members) {
        if (
          member.enabled &&
          ["owner", "office_admin", "estimator"].includes(member.role)
        ) {
          try {
            await appointmentResource(ctx, workspace._id, member.userId);
            result.push({
              userId: member.userId,
              name: member.name,
              role: member.role as "owner" | "office_admin" | "estimator",
            });
          } catch (error) {
            if (
              !isAppointmentRefusal(error, ["APPOINTMENT_RESOURCE_UNAVAILABLE"])
            )
              throw error;
          }
        }
      }
      return result;
    }),
});
