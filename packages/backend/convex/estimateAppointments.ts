import {
  appointmentBoundary,
  refuseAppointment,
} from "./estimateAppointmentErrors";
import {
  paginationOptsValidator,
  type GenericMutationCtx,
} from "convex/server";
import { v } from "convex/values";
import { mutation, query, type DataModel, type Id } from "./runtime";
import {
  stageEstimateAppointment,
  type EstimateAppointmentCommand,
  type AppointmentContext,
} from "../../domain/src/estimate-appointments";
import {
  appointmentAuthority,
  appointmentResource,
  appointmentSource,
  loadAppointmentState,
  nativeRequestKey,
  verifiedSlot,
  paddedConflicts,
  activeSourceAppointments,
  persistNative,
  appointmentFromRow,
  NATIVE_FLAGS,
} from "./estimateAppointmentStore";
import {
  appointmentBaseArgs,
  appointmentSelectionArgs,
  appointmentResultValidator,
  estimateAppointmentValidator,
  nativeFlags,
} from "./estimateAppointmentValidators";
type HostArgs = {
  workspaceId?: Id<"painterWorkspaces">;
  requestKey: string;
  appointmentId?: string;
  expectedRevision?: number;
  leadId?: string;
  customerId?: string;
  slotId?: string;
  slotRevision?: number;
  leadRevision?: number;
  customerRevision?: number;
};
async function execute(
  ctx: GenericMutationCtx<DataModel>,
  kind: EstimateAppointmentCommand["kind"],
  args: HostArgs,
) {
  const { actor, workspace } = await appointmentAuthority(
    ctx,
    args.workspaceId,
  );
  const key = await nativeRequestKey(
    String(workspace._id),
    "estimate_appointment",
    args.requestKey,
  );
  const appointmentId =
    kind === "propose"
      ? `appointment:${key.slice(key.lastIndexOf(":") + 1)}`
      : args.appointmentId!;
  const loaded = await loadAppointmentState(
    ctx,
    workspace._id,
    appointmentId,
    key,
  );
  const target = loaded.state.appointments.find(
    (item) => item.id === appointmentId,
  );
  if (kind !== "propose" && !target) refuseAppointment("APPOINTMENT_NOT_FOUND");
  if (kind === "propose" && !target) {
    const collision = await ctx.db
      .query("painterEntities")
      .withIndex("by_tenant_entity", (q) =>
        q.eq("tenantId", workspace._id).eq("entityId", appointmentId),
      )
      .unique();
    if (collision) refuseAppointment("APPOINTMENT_DUPLICATE_ID");
  }
  const context: AppointmentContext = { actor, nowMs: Date.now() };
  let options = {};
  const replaying = loaded.state.receipts.some(
    (receipt) => receipt.requestKey === key,
  );
  if (kind !== "cancel" && !replaying) {
    const slotId =
      kind === "propose" || kind === "reschedule"
        ? args.slotId!
        : target!.slotId;
    const verified = await verifiedSlot(ctx, workspace._id, slotId);
    context.slot = verified.slot;
    options = verified.options;
    context.resource = await appointmentResource(
      ctx,
      workspace._id,
      verified.slot.resourceId,
    );
    Object.assign(
      context,
      await appointmentSource(
        ctx,
        workspace._id,
        kind === "propose" ? args.leadId! : target!.leadId,
        kind === "propose" ? args.customerId! : target!.customerId,
      ),
    );
    // All relevant active records are read in this same OCC transaction; no lifetime scan.
    const selected = [
      ...loaded.state.appointments,
      ...(await paddedConflicts(ctx, workspace._id, verified.slot)),
    ];
    if (kind === "propose" || kind === "reschedule")
      selected.push(
        ...(await activeSourceAppointments(
          ctx,
          workspace._id,
          kind === "propose" ? args.leadId! : target!.leadId,
          verified.slot.id,
        )),
      );
    loaded.state.appointments = [
      ...new Map(selected.map((item) => [item.id, item])).values(),
    ];
  }
  let command: EstimateAppointmentCommand;
  if (kind === "propose")
    command = {
      kind,
      appointmentId,
      requestKey: key,
      leadId: args.leadId!,
      leadRevision: args.leadRevision!,
      customerId: args.customerId!,
      customerRevision: args.customerRevision!,
      slotId: args.slotId!,
      slotRevision: args.slotRevision!,
    };
  else if (kind === "reschedule")
    command = {
      kind,
      appointmentId,
      requestKey: key,
      expectedRevision: args.expectedRevision!,
      slotId: args.slotId!,
      slotRevision: args.slotRevision!,
      leadRevision: args.leadRevision!,
      customerRevision: args.customerRevision!,
    };
  else
    command = {
      kind,
      appointmentId,
      requestKey: key,
      expectedRevision: args.expectedRevision!,
    };
  const result = stageEstimateAppointment(
    loaded.state,
    context,
    command,
    options,
  );
  if (!result.replayed) {
    const receipt = result.state.receipts.find(
      (item) => item.requestKey === key,
    )!;
    await persistNative(
      ctx,
      workspace._id,
      "estimate_appointment",
      loaded.rows,
      result.appointment,
      key,
      receipt.fingerprint,
      actor.id,
      kind,
    );
  }
  return {
    appointment: result.appointment,
    replayed: result.replayed,
    ...NATIVE_FLAGS,
  };
}
export const propose = mutation({
  args: {
    workspaceId: v.optional(v.id("painterWorkspaces")),
    requestKey: v.string(),
    leadId: v.string(),
    customerId: v.string(),
    ...appointmentSelectionArgs,
  },
  returns: appointmentResultValidator,
  handler: (ctx, args) =>
    appointmentBoundary(() => execute(ctx, "propose", args)),
});
export const approve = mutation({
  args: appointmentBaseArgs,
  returns: appointmentResultValidator,
  handler: (ctx, args) =>
    appointmentBoundary(() => execute(ctx, "approve", args)),
});
export const cancel = mutation({
  args: appointmentBaseArgs,
  returns: appointmentResultValidator,
  handler: (ctx, args) =>
    appointmentBoundary(() => execute(ctx, "cancel", args)),
});
export const reschedule = mutation({
  args: { ...appointmentBaseArgs, ...appointmentSelectionArgs },
  returns: appointmentResultValidator,
  handler: (ctx, args) =>
    appointmentBoundary(() => execute(ctx, "reschedule", args)),
});
export const list = query({
  args: {
    workspaceId: v.optional(v.id("painterWorkspaces")),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    items: v.array(estimateAppointmentValidator),
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
                  .eq("type", "estimate_appointment")
                  .eq("data.resourceId", actor.id),
              )
          : ctx.db
              .query("painterEntities")
              .withIndex("by_tenant_type", (q) =>
                q
                  .eq("tenantId", workspace._id)
                  .eq("type", "estimate_appointment"),
              );
      const page = await rows.order("desc").paginate({
        ...args.paginationOpts,
        maximumRowsRead: 25,
        maximumBytesRead: 128 * 1024,
      });
      return {
        items: page.page.map(appointmentFromRow),
        nextCursor: page.isDone ? null : page.continueCursor,
        done: page.isDone,
        ...NATIVE_FLAGS,
      };
    }),
});

/** Eligible source identifiers only; display names stay in authorized CRM projection. */
export const sources = query({
  args: {
    workspaceId: v.optional(v.id("painterWorkspaces")),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    items: v.array(
      v.object({
        leadId: v.string(),
        leadRevision: v.number(),
        customerId: v.string(),
        customerRevision: v.number(),
      }),
    ),
    nextCursor: v.union(v.string(), v.null()),
    done: v.boolean(),
    ...nativeFlags,
  }),
  handler: async (ctx, args) =>
    appointmentBoundary(async () => {
      const { workspace } = await appointmentAuthority(ctx, args.workspaceId);
      if (
        !Number.isSafeInteger(args.paginationOpts.numItems) ||
        args.paginationOpts.numItems < 1 ||
        args.paginationOpts.numItems > 25
      )
        refuseAppointment("APPOINTMENT_INVALID_PAGE");
      const page = await ctx.db
        .query("painterEntities")
        .withIndex("by_tenant_type_status_public", (q) =>
          q
            .eq("tenantId", workspace._id)
            .eq("type", "lead")
            .eq("data.status", "qualified"),
        )
        .order("desc")
        .paginate({
          ...args.paginationOpts,
          maximumRowsRead: 25,
          maximumBytesRead: 128 * 1024,
        });
      const items: {
        leadId: string;
        leadRevision: number;
        customerId: string;
        customerRevision: number;
      }[] = [];
      for (const row of page.page) {
        if (typeof row.data.customerId !== "string") continue;
        try {
          const source = await appointmentSource(
            ctx,
            workspace._id,
            row.entityId,
            row.data.customerId,
          );
          items.push({
            leadId: source.lead!.id,
            leadRevision: source.lead!.revision,
            customerId: source.customer!.id,
            customerRevision: source.customer!.revision,
          });
        } catch (error) {
          if (
            !(error instanceof Error) ||
            ![
              "APPOINTMENT_QUALIFIED_SOURCE_REQUIRED",
              "APPOINTMENT_INTAKE_TRANSFER_REQUIRED",
            ].some((code) => error.message.includes(code))
          )
            throw error;
        }
      }
      return {
        items,
        nextCursor: page.isDone ? null : page.continueCursor,
        done: page.isDone,
        ...NATIVE_FLAGS,
      };
    }),
});
