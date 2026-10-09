import { refuseAppointment } from "./estimateAppointmentErrors";
import type { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import type { DataModel, Id } from "./runtime";
import { resolvePainterMembership } from "./painter";
import { authComponent } from "./auth";
import { intakeDigest } from "./intakeCrypto";
import { persistPainterState } from "./painterStore";
import { PUBLIC_INTAKE_LEAD_ID_PREFIX } from "../../domain/src/lead-aggregate";
import {
  estimateSlotOffsetInstant,
  ESTIMATE_APPOINTMENT_LIMITS,
  type EstimateSlot,
  type EstimateSlotInput,
  type EstimateSlotNormalization,
  type EstimateAppointment,
  type AppointmentContext,
  type EstimateAppointmentState,
} from "../../domain/src/estimate-appointments";
import { slotFields, appointmentFields } from "./estimateAppointmentValidators";
import type { Entity } from "../../domain/src/contracts";
import type { State } from "../../domain/src/engine";
type QueryCtx = GenericQueryCtx<DataModel>;
export const NATIVE_FLAGS = {
  nativeOnly: true,
  customerNotified: false,
  externalCalendarsChecked: false,
} as const;
export type NativeKind = "estimate_slot" | "estimate_appointment";
export async function appointmentAuthority(
  ctx: QueryCtx,
  workspaceId?: Id<"painterWorkspaces">,
  readOnly = false,
) {
  let resolved;
  try {
    resolved = await resolvePainterMembership(ctx, workspaceId);
  } catch (error) {
    // This exact current-auth seam has three explicit refusal sites. No generic error mapping.
    if (
      error instanceof Error &&
      (error.message === "UNAUTHENTICATED" ||
        error.message === "WORKSPACE_MEMBERSHIP_REQUIRED" ||
        error.message === "WORKSPACE_NOT_FOUND")
    )
      refuseAppointment(error.message);
    throw error;
  }
  if (
    !["owner", "office_admin", ...(readOnly ? ["estimator"] : [])].includes(
      resolved.actor.role,
    )
  )
    refuseAppointment("APPOINTMENT_OFFICE_REQUIRED");
  return resolved;
}
export async function appointmentResource(
  ctx: QueryCtx,
  tenantId: Id<"painterWorkspaces">,
  userId: string,
) {
  if (!userId || userId.length > 200)
    refuseAppointment("APPOINTMENT_RESOURCE_UNAVAILABLE");
  const member = await ctx.db
    .query("painterMembers")
    .withIndex("by_tenant_user", (q) =>
      q.eq("tenantId", tenantId).eq("userId", userId),
    )
    .unique();
  if (
    !member?.enabled ||
    !["owner", "office_admin", "estimator"].includes(member.role) ||
    !(await authComponent.getAnyUserById(ctx, userId))
  )
    refuseAppointment("APPOINTMENT_RESOURCE_UNAVAILABLE");
  return {
    tenantId: String(tenantId),
    userId,
    role: member.role,
    enabled: true,
    identityExists: true,
  };
}
export function slotInput(slot: EstimateSlot): EstimateSlotInput {
  const { tenantId: _tenant, startAt: _start, endAt: _end, ...input } = slot;
  return input;
}
export function canonicalSlotInput(input: Readonly<EstimateSlotInput>): string {
  return JSON.stringify(
    Object.entries(input).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
}
export async function slotProof(slot: EstimateSlot) {
  return {
    version: 1,
    inputDigest: await intakeDigest(canonicalSlotInput(slotInput(slot))),
    instant: slot.startAt,
  };
}
function publicFields<T>(
  data: Record<string, unknown>,
  fields: Record<string, unknown>,
  row: DataModel["painterEntities"]["document"],
): T {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(fields))
    if (key in data) result[key] = data[key];
  return {
    ...result,
    id: row.entityId,
    tenantId: String(row.tenantId),
    revision: row.revision,
  } as T;
}
export function appointmentFromRow(
  row: DataModel["painterEntities"]["document"],
): EstimateAppointment {
  if (row.type !== "estimate_appointment")
    refuseAppointment("APPOINTMENT_NOT_FOUND");
  return publicFields<EstimateAppointment>(row.data, appointmentFields, row);
}
export function slotFromRow(
  row: DataModel["painterEntities"]["document"],
): EstimateSlot {
  if (row.type !== "estimate_slot")
    refuseAppointment("APPOINTMENT_SLOT_NOT_FOUND");
  return publicFields<EstimateSlot>(row.data, slotFields, row);
}
export async function readNativeRow(
  ctx: QueryCtx,
  tenantId: Id<"painterWorkspaces">,
  id: string,
  kind: NativeKind,
) {
  if (!id || id.length > 200) refuseAppointment("APPOINTMENT_INVALID_ID");
  const row = await ctx.db
    .query("painterEntities")
    .withIndex("by_tenant_entity", (q) =>
      q.eq("tenantId", tenantId).eq("entityId", id),
    )
    .unique();
  if (!row || row.type !== kind)
    throw new Error(
      kind === "estimate_slot"
        ? "APPOINTMENT_SLOT_NOT_FOUND"
        : "APPOINTMENT_NOT_FOUND",
    );
  return row;
}
export async function verifiedSlot(
  ctx: QueryCtx,
  tenantId: Id<"painterWorkspaces">,
  id: string,
) {
  const row = await readNativeRow(ctx, tenantId, id, "estimate_slot");
  const slot = slotFromRow(row);
  const proof = row.data.normalizationProof;
  const expected = await slotProof(slot);
  if (
    !proof ||
    typeof proof !== "object" ||
    Object.keys(proof).sort().join(",") !== "inputDigest,instant,version" ||
    ("version" in proof ? proof.version : undefined) !== expected.version ||
    ("inputDigest" in proof ? proof.inputDigest : undefined) !==
      expected.inputDigest ||
    ("instant" in proof ? proof.instant : undefined) !== expected.instant ||
    estimateSlotOffsetInstant(slot.localStart, slot.timeZone, slot.offset) !==
      slot.startAt ||
    new Date(
      Date.parse(slot.startAt) + slot.durationMinutes * 60000,
    ).toISOString() !== slot.endAt
  )
    refuseAppointment("APPOINTMENT_INVALID_NORMALIZATION");
  return {
    row,
    slot,
    options: {
      normalizeSlotInstant: (input: Readonly<EstimateSlotInput>) => {
        if (canonicalSlotInput(input) !== canonicalSlotInput(slotInput(slot)))
          refuseAppointment("APPOINTMENT_INVALID_NORMALIZATION");
        return slot.startAt;
      },
    } satisfies EstimateSlotNormalization,
  };
}
export async function nativeRequestKey(
  tenantId: string,
  kind: NativeKind,
  requestKey: string,
) {
  if (
    typeof requestKey !== "string" ||
    !requestKey.trim() ||
    requestKey.length > 180
  )
    refuseAppointment("APPOINTMENT_INVALID_REQUEST");
  return `native-${kind === "estimate_slot" ? "slot" : "appointment"}:${await intakeDigest(JSON.stringify([tenantId, kind, requestKey]))}`;
}
export async function nativeReceipt(
  ctx: QueryCtx,
  tenantId: Id<"painterWorkspaces">,
  kind: NativeKind,
  key: string,
) {
  const receipt = await ctx.db
    .query("painterReceipts")
    .withIndex("by_tenant_request", (q) =>
      q.eq("tenantId", tenantId).eq("requestKey", key),
    )
    .unique();
  if (receipt && receipt.nativeKind !== kind)
    refuseAppointment("APPOINTMENT_IDEMPOTENCY_CONFLICT");
  return receipt;
}
export async function nativeReceipts(
  ctx: QueryCtx,
  tenantId: Id<"painterWorkspaces">,
  kind: NativeKind,
) {
  const receipts = await ctx.db
    .query("painterReceipts")
    .withIndex("by_tenant_native_kind", (q) =>
      q.eq("tenantId", tenantId).eq("nativeKind", kind),
    )
    .take(ESTIMATE_APPOINTMENT_LIMITS.receipts + 1);
  if (receipts.length > ESTIMATE_APPOINTMENT_LIMITS.receipts)
    refuseAppointment("APPOINTMENT_STATE_LIMIT");
  return receipts;
}
export async function nativeRows(
  ctx: QueryCtx,
  tenantId: Id<"painterWorkspaces">,
  kind: NativeKind,
) {
  const rows = await ctx.db
    .query("painterEntities")
    .withIndex("by_tenant_type", (q) =>
      q.eq("tenantId", tenantId).eq("type", kind),
    )
    .take(ESTIMATE_APPOINTMENT_LIMITS.appointments + 1);
  if (rows.length > ESTIMATE_APPOINTMENT_LIMITS.appointments)
    refuseAppointment("APPOINTMENT_STATE_LIMIT");
  return rows;
}
export async function appointmentSource(
  ctx: QueryCtx,
  tenantId: Id<"painterWorkspaces">,
  leadId: string,
  customerId: string,
): Promise<Pick<AppointmentContext, "lead" | "customer">> {
  const [lead, customer, receipt] = await Promise.all([
    ctx.db
      .query("painterEntities")
      .withIndex("by_tenant_entity", (q) =>
        q.eq("tenantId", tenantId).eq("entityId", leadId),
      )
      .unique(),
    ctx.db
      .query("painterEntities")
      .withIndex("by_tenant_entity", (q) =>
        q.eq("tenantId", tenantId).eq("entityId", customerId),
      )
      .unique(),
    ctx.db
      .query("painterPublicLeadReceipts")
      .withIndex("by_tenant_entity", (q) =>
        q.eq("tenantId", tenantId).eq("leadEntityId", leadId),
      )
      .unique(),
  ]);
  if (
    !lead ||
    lead.type !== "lead" ||
    lead.data.status !== "qualified" ||
    lead.data.customerId !== customerId ||
    !customer ||
    customer.type !== "customer"
  )
    refuseAppointment("APPOINTMENT_QUALIFIED_SOURCE_REQUIRED");
  if (receipt || leadId.startsWith(PUBLIC_INTAKE_LEAD_ID_PREFIX)) {
    if (
      !receipt ||
      receipt.state !== "converted_preserved" ||
      receipt.customerId !== customerId ||
      !receipt.transferredBy ||
      !Number.isFinite(receipt.transferredAt)
    )
      refuseAppointment("APPOINTMENT_INTAKE_TRANSFER_REQUIRED");
  }
  return {
    lead: {
      id: leadId,
      tenantId: String(tenantId),
      revision: lead.revision,
      status: "qualified",
      customerId,
    },
    customer: {
      id: customerId,
      tenantId: String(tenantId),
      revision: customer.revision,
    },
  };
}
export async function loadAppointmentState(
  ctx: QueryCtx,
  tenantId: Id<"painterWorkspaces">,
) {
  const [rows, receipts] = await Promise.all([
    nativeRows(ctx, tenantId, "estimate_appointment"),
    nativeReceipts(ctx, tenantId, "estimate_appointment"),
  ]);
  const state: EstimateAppointmentState = {
    appointments: rows.map(appointmentFromRow),
    receipts: receipts.map((receipt) => ({
      tenantId: String(tenantId),
      requestKey: receipt.requestKey,
      fingerprint: receipt.fingerprint,
      appointmentId: String(receipt.result.entity?.id ?? ""),
    })),
  };
  return { rows, receipts, state };
}
/** Complete padded conflict window; never silently truncate. Values are canonical UTC. */
export async function paddedConflicts(
  ctx: QueryCtx,
  tenantId: Id<"painterWorkspaces">,
  slot: EstimateSlot,
) {
  const candidateStart =
      Date.parse(slot.startAt) - slot.bufferBeforeMinutes * 60000,
    candidateEnd = Date.parse(slot.endAt) + slot.bufferAfterMinutes * 60000;
  const lower = new Date(
      candidateStart -
        (ESTIMATE_APPOINTMENT_LIMITS.durationMinutes +
          ESTIMATE_APPOINTMENT_LIMITS.bufferMinutes) *
          60000,
    ).toISOString(),
    upper = new Date(
      candidateEnd + ESTIMATE_APPOINTMENT_LIMITS.bufferMinutes * 60000,
    ).toISOString();
  const rows = await ctx.db
    .query("painterEntities")
    .withIndex("by_tenant_type_resource_start", (q) =>
      q
        .eq("tenantId", tenantId)
        .eq("type", "estimate_appointment")
        .eq("data.resourceId", slot.resourceId)
        .gte("data.startAt", lower)
        .lte("data.startAt", upper),
    )
    .take(ESTIMATE_APPOINTMENT_LIMITS.appointments + 1);
  if (rows.length > ESTIMATE_APPOINTMENT_LIMITS.appointments)
    refuseAppointment("APPOINTMENT_CONFLICT_LIMIT");
  return rows.map(appointmentFromRow);
}
export function painterEntity(
  row: DataModel["painterEntities"]["document"],
): Entity {
  const { _id: _id, _creationTime: _time, entityId, ...fields } = row;
  return { ...fields, id: entityId, type: row.type as Entity["type"] };
}
export async function persistNative(
  ctx: GenericMutationCtx<DataModel>,
  tenantId: Id<"painterWorkspaces">,
  kind: NativeKind,
  beforeRows: DataModel["painterEntities"]["document"][],
  value: EstimateSlot | EstimateAppointment,
  key: string,
  fingerprint: string,
  actorId: string,
  operation: string,
  extra: Record<string, unknown> = {},
) {
  const now = new Date().toISOString(),
    existing = beforeRows.find((row) => row.entityId === value.id);
  const { id, tenantId: _tenant, revision, ...data } = value;
  const entity: Entity = {
    id,
    tenantId: String(tenantId),
    type: kind,
    revision,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    data: { ...data, ...extra },
  };
  const receiptKey = JSON.stringify([String(tenantId), key]);
  const before: State = {
    entities: beforeRows.map(painterEntity),
    events: [],
    receipts: {},
  };
  const after: State = {
    entities: [...before.entities.filter((item) => item.id !== id), entity],
    events: [
      {
        id: `${key}:audit`,
        type: `${kind}.${operation}`,
        entityId: id,
        actorId,
        occurredAt: now,
        payload: {
          schemaVersion: 1,
          tenantId: String(tenantId),
          revision,
          beforeRevision: existing?.revision ?? 0,
          startAt: value.startAt,
          endAt: value.endAt,
          ...(existing
            ? {
                beforeStartAt: existing.data.startAt,
                beforeEndAt: existing.data.endAt,
                beforeResourceId: existing.data.resourceId,
              }
            : {}),
          ...("slotId" in value
            ? {
                slotId: value.slotId,
                ...(existing ? { beforeSlotId: existing.data.slotId } : {}),
              }
            : {}),
          action: operation,
          status: value.status,
          resourceId: value.resourceId,
          ...NATIVE_FLAGS,
        },
      },
    ],
    receipts: { [receiptKey]: { fingerprint, result: { entity } } },
  };
  await persistPainterState(ctx, tenantId, before, after, key, undefined, kind);
  return entity;
}
