import type { Actor, Role } from "./contracts";

/** Prospective pure policy only. A future host must resolve current Better Auth membership,
 * source records and complete conflict reads, then persist the staged result atomically.
 * Caller-provided context is not proof of any of those authorities. No production writer is wired. */
export const ESTIMATE_APPOINTMENT_LIMITS = {
  appointments: 256,
  receipts: 512,
  durationMinutes: 240,
  bufferMinutes: 120,
} as const;
export interface EstimateSlot {
  id: string;
  tenantId: string;
  revision: number;
  resourceId: string;
  status: "offered" | "closed";
  localStart: string;
  offset: string;
  timeZone: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
}
export interface EstimateAppointment {
  id: string;
  tenantId: string;
  revision: number;
  status: "proposed" | "reserved_internal" | "cancelled";
  leadId: string;
  leadRevision: number;
  customerId: string;
  customerRevision: number;
  slotId: string;
  slotRevision: number;
  resourceId: string;
  timeZone: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  proposedBy: string;
  approvedBy?: string;
  cancelledBy?: string;
}
export interface AppointmentContext {
  actor: Pick<Actor, "id" | "tenantId" | "role">;
  nowMs: number;
  resource?: {
    tenantId: string;
    userId: string;
    role: Role;
    enabled: boolean;
    identityExists: boolean;
  };
  lead?: {
    id: string;
    tenantId: string;
    revision: number;
    status: "new" | "contacted" | "qualified" | "lost";
    customerId: string | null;
  };
  customer?: { id: string; tenantId: string; revision: number };
  slot?: EstimateSlot;
}
type SourceSelection = {
  leadId: string;
  leadRevision: number;
  customerId: string;
  customerRevision: number;
  slotId: string;
  slotRevision: number;
};
export type EstimateAppointmentCommand =
  | ({
      kind: "propose";
      appointmentId: string;
      requestKey: string;
    } & SourceSelection)
  | {
      kind: "approve";
      appointmentId: string;
      expectedRevision: number;
      requestKey: string;
    }
  | {
      kind: "cancel";
      appointmentId: string;
      expectedRevision: number;
      requestKey: string;
    }
  | {
      kind: "reschedule";
      appointmentId: string;
      expectedRevision: number;
      requestKey: string;
      slotId: string;
      slotRevision: number;
      leadRevision: number;
      customerRevision: number;
    };
export interface EstimateAppointmentState {
  appointments: EstimateAppointment[];
  receipts: {
    tenantId: string;
    requestKey: string;
    fingerprint: string;
    appointmentId: string;
  }[];
}
export interface EstimateAppointmentResult {
  state: EstimateAppointmentState;
  appointment: EstimateAppointment;
  replayed: boolean;
  nativeOnly: true;
  customerNotified: false;
  externalCalendarsChecked: false;
}
function fail(code: string): never {
  throw new Error(code);
}
function identifier(value: string) {
  if (typeof value !== "string" || !/^[-A-Za-z0-9_:]{1,200}$/.test(value))
    fail("APPOINTMENT_INVALID_ID");
  return value;
}
function revision(value: number) {
  if (
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value === Number.MAX_SAFE_INTEGER
  )
    fail("APPOINTMENT_INVALID_REVISION");
  return value;
}
function count(value: number, min: number, max: number) {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    fail("APPOINTMENT_INVALID_NUMBER");
  return value;
}
function office(context: AppointmentContext) {
  identifier(context.actor.id);
  identifier(context.actor.tenantId);
  count(context.nowMs, 0, 8_000_000_000_000);
  if (!["owner", "office_admin"].includes(context.actor.role))
    fail("APPOINTMENT_OFFICE_REQUIRED");
}
function resource(context: AppointmentContext, userId: string) {
  const member = context.resource;
  if (
    !member ||
    member.tenantId !== context.actor.tenantId ||
    member.userId !== userId ||
    member.enabled !== true ||
    member.identityExists !== true ||
    !["owner", "office_admin", "estimator"].includes(member.role)
  )
    fail("APPOINTMENT_RESOURCE_UNAVAILABLE");
  identifier(member.userId);
}
/** Mandatory numeric offset disambiguates folds; round-trip rejects gaps or wrong zone offsets.
 * One-off slots avoid inventing a recurring calendar or browser-local timezone authority. */
export function estimateSlotOffsetInstant(
  localStart: string,
  timeZone: string,
  offset: string,
): string {
  if (
    typeof localStart !== "string" ||
    !/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localStart)
  )
    fail("APPOINTMENT_INVALID_LOCAL_TIME");
  if (
    typeof timeZone !== "string" ||
    timeZone.length > 100 ||
    (timeZone !== "UTC" &&
      !/^[A-Za-z_+-]+\/[A-Za-z0-9_+.-]+(?:\/[A-Za-z0-9_+.-]+)?$/.test(timeZone))
  )
    fail("APPOINTMENT_INVALID_TIMEZONE");
  if (
    typeof offset !== "string" ||
    !/^[-+]\d{2}:\d{2}$/.test(offset) ||
    offset === "-00:00"
  )
    fail("APPOINTMENT_EXPLICIT_OFFSET_REQUIRED");
  const year = Number(localStart.slice(0, 4)),
    month = Number(localStart.slice(5, 7)),
    day = Number(localStart.slice(8, 10)),
    hour = Number(localStart.slice(11, 13)),
    minute = Number(localStart.slice(14, 16));
  const local = Date.UTC(year, month - 1, day, hour, minute);
  if (new Date(local).toISOString().slice(0, 16) !== localStart)
    fail("APPOINTMENT_INVALID_LOCAL_TIME");
  const offsetHour = Number(offset.slice(1, 3)),
    offsetMinute = Number(offset.slice(4, 6));
  if (
    offsetHour > 14 ||
    offsetMinute > 59 ||
    (offsetHour === 14 && offsetMinute !== 0)
  )
    fail("APPOINTMENT_INVALID_OFFSET");
  const delta = (offsetHour * 60 + offsetMinute) * (offset[0] === "-" ? -1 : 1);
  const instant = local - delta * 60000;
  return new Date(instant).toISOString();
}
/** Node/trusted timezone normalization; default pure policy retains zone roundtrip. */
export function estimateSlotInstant(
  localStart: string,
  timeZone: string,
  offset: string,
): string {
  const instant = Date.parse(
    estimateSlotOffsetInstant(localStart, timeZone, offset),
  );
  let parts: Record<string, string>;
  try {
    parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone,
        calendar: "gregory",
        numberingSystem: "latn",
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
        .formatToParts(instant)
        .map((part) => [part.type, part.value]),
    );
  } catch {
    fail("APPOINTMENT_INVALID_TIMEZONE");
  }
  if (
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}` !==
    localStart
  )
    fail("APPOINTMENT_ZONE_OFFSET_MISMATCH");
  return new Date(instant).toISOString();
}

export type EstimateSlotInput = Omit<
  EstimateSlot,
  "tenantId" | "startAt" | "endAt"
>;
export interface EstimateSlotNormalization {
  /** Host invocation capability only, never command/context/transport data. */
  normalizeSlotInstant?: (input: Readonly<EstimateSlotInput>) => string;
}
export function makeEstimateSlot(
  context: AppointmentContext,
  input: EstimateSlotInput,
  options: EstimateSlotNormalization = {},
): EstimateSlot {
  office(context);
  const allowed = [
    "id",
    "revision",
    "resourceId",
    "status",
    "localStart",
    "offset",
    "timeZone",
    "durationMinutes",
    "bufferBeforeMinutes",
    "bufferAfterMinutes",
  ];
  if (Object.keys(input).some((key) => !allowed.includes(key)))
    fail("APPOINTMENT_UNKNOWN_FIELD");
  identifier(input.id);
  revision(input.revision);
  identifier(input.resourceId);
  resource(context, input.resourceId);
  if (!["offered", "closed"].includes(input.status))
    fail("APPOINTMENT_INVALID_SLOT_STATUS");
  count(input.durationMinutes, 15, ESTIMATE_APPOINTMENT_LIMITS.durationMinutes);
  count(
    input.bufferBeforeMinutes,
    0,
    ESTIMATE_APPOINTMENT_LIMITS.bufferMinutes,
  );
  count(input.bufferAfterMinutes, 0, ESTIMATE_APPOINTMENT_LIMITS.bufferMinutes);
  const startAt = options.normalizeSlotInstant
    ? options.normalizeSlotInstant(input)
    : estimateSlotInstant(input.localStart, input.timeZone, input.offset);
  if (
    startAt !==
    estimateSlotOffsetInstant(input.localStart, input.timeZone, input.offset)
  )
    fail("APPOINTMENT_INVALID_NORMALIZATION");
  if (Date.parse(startAt) <= context.nowMs) fail("APPOINTMENT_SLOT_NOT_FUTURE");
  return {
    ...input,
    tenantId: context.actor.tenantId,
    startAt,
    endAt: new Date(
      Date.parse(startAt) + input.durationMinutes * 60000,
    ).toISOString(),
  };
}
function currentSlot(
  context: AppointmentContext,
  id: string,
  expectedRevision: number,
  options: EstimateSlotNormalization,
): EstimateSlot {
  const slot = context.slot;
  if (!slot || slot.tenantId !== context.actor.tenantId || slot.id !== id)
    fail("APPOINTMENT_SLOT_NOT_FOUND");
  if (slot.revision !== expectedRevision || slot.status !== "offered")
    fail("APPOINTMENT_SLOT_CHANGED");
  const { tenantId: _, startAt, endAt, ...input } = slot;
  const normalized = makeEstimateSlot(context, input, options);
  if (normalized.startAt !== startAt || normalized.endAt !== endAt)
    fail("APPOINTMENT_INVALID_SLOT");
  return normalized;
}
function currentSource(
  context: AppointmentContext,
  expected: {
    leadId: string;
    leadRevision: number;
    customerId: string;
    customerRevision: number;
  },
) {
  const { lead, customer } = context;
  if (
    !lead ||
    !customer ||
    lead.tenantId !== context.actor.tenantId ||
    customer.tenantId !== context.actor.tenantId ||
    lead.id !== expected.leadId ||
    customer.id !== expected.customerId ||
    lead.customerId !== customer.id ||
    lead.status !== "qualified"
  )
    fail("APPOINTMENT_QUALIFIED_SOURCE_REQUIRED");
  revision(lead.revision);
  revision(customer.revision);
  if (
    lead.revision !== expected.leadRevision ||
    customer.revision !== expected.customerRevision
  )
    fail("APPOINTMENT_SOURCE_CHANGED");
}
function selection(slot: EstimateSlot) {
  return {
    slotId: slot.id,
    slotRevision: slot.revision,
    resourceId: slot.resourceId,
    timeZone: slot.timeZone,
    startAt: slot.startAt,
    endAt: slot.endAt,
    durationMinutes: slot.durationMinutes,
    bufferBeforeMinutes: slot.bufferBeforeMinutes,
    bufferAfterMinutes: slot.bufferAfterMinutes,
  };
}
function conflicts(
  appointments: EstimateAppointment[],
  candidate: EstimateAppointment,
) {
  for (const other of appointments) {
    if (
      other.id === candidate.id ||
      other.tenantId !== candidate.tenantId ||
      other.resourceId !== candidate.resourceId ||
      other.status !== "reserved_internal"
    )
      continue;
    const starts =
        Date.parse(other.startAt) -
        count(other.bufferBeforeMinutes, 0, 120) * 60000,
      ends =
        Date.parse(other.endAt) +
        count(other.bufferAfterMinutes, 0, 120) * 60000;
    if (!Number.isFinite(starts) || !Number.isFinite(ends) || starts >= ends)
      fail("APPOINTMENT_INVALID_CONFLICT_RECORD");
    if (
      Date.parse(candidate.startAt) - candidate.bufferBeforeMinutes * 60000 <
        ends &&
      Date.parse(candidate.endAt) + candidate.bufferAfterMinutes * 60000 >
        starts
    )
      fail("APPOINTMENT_RESOURCE_CONFLICT");
  }
}
function fingerprint(
  context: AppointmentContext,
  command: EstimateAppointmentCommand,
) {
  return JSON.stringify([
    context.actor.id,
    context.actor.tenantId,
    context.actor.role,
    Object.entries(command).sort(([a], [b]) => a.localeCompare(b)),
  ]);
}
function validateState(state: EstimateAppointmentState) {
  if (
    Object.keys(state).some(
      (key) => !["appointments", "receipts"].includes(key),
    )
  )
    fail("APPOINTMENT_UNKNOWN_FIELD");
  if (
    !Array.isArray(state.appointments) ||
    state.appointments.length > ESTIMATE_APPOINTMENT_LIMITS.appointments ||
    !Array.isArray(state.receipts) ||
    state.receipts.length > ESTIMATE_APPOINTMENT_LIMITS.receipts
  )
    fail("APPOINTMENT_STATE_LIMIT");
  const fields = [
    "id",
    "tenantId",
    "revision",
    "status",
    "leadId",
    "leadRevision",
    "customerId",
    "customerRevision",
    "slotId",
    "slotRevision",
    "resourceId",
    "timeZone",
    "startAt",
    "endAt",
    "durationMinutes",
    "bufferBeforeMinutes",
    "bufferAfterMinutes",
    "proposedBy",
    "approvedBy",
    "cancelledBy",
  ];
  for (const appointment of state.appointments) {
    if (Object.keys(appointment).some((key) => !fields.includes(key)))
      fail("APPOINTMENT_UNKNOWN_FIELD");
    for (const field of [
      "id",
      "tenantId",
      "leadId",
      "customerId",
      "slotId",
      "resourceId",
      "proposedBy",
    ] as const)
      identifier(appointment[field]);
    for (const field of [
      "revision",
      "leadRevision",
      "customerRevision",
      "slotRevision",
    ] as const)
      revision(appointment[field]);
    if (
      !["proposed", "reserved_internal", "cancelled"].includes(
        appointment.status,
      )
    )
      fail("APPOINTMENT_INVALID_TRANSITION");
    for (const field of ["approvedBy", "cancelledBy"] as const)
      if (appointment[field] !== undefined) identifier(appointment[field]!);
    if (
      (appointment.status === "reserved_internal" && !appointment.approvedBy) ||
      (appointment.status === "cancelled" && !appointment.cancelledBy)
    )
      fail("APPOINTMENT_INVALID_TRANSITION");
    count(appointment.durationMinutes, 15, 240);
    count(appointment.bufferBeforeMinutes, 0, 120);
    count(appointment.bufferAfterMinutes, 0, 120);
    for (const instant of [appointment.startAt, appointment.endAt])
      if (
        typeof instant !== "string" ||
        !Number.isFinite(Date.parse(instant)) ||
        new Date(instant).toISOString() !== instant
      )
        fail("APPOINTMENT_INVALID_CONFLICT_RECORD");
    if (
      Date.parse(appointment.endAt) - Date.parse(appointment.startAt) !==
      appointment.durationMinutes * 60000
    )
      fail("APPOINTMENT_INVALID_CONFLICT_RECORD");
    if (
      typeof appointment.timeZone !== "string" ||
      appointment.timeZone.length > 100
    )
      fail("APPOINTMENT_INVALID_TIMEZONE");
  }
  for (const receipt of state.receipts) {
    if (
      Object.keys(receipt).some(
        (key) =>
          !["tenantId", "requestKey", "fingerprint", "appointmentId"].includes(
            key,
          ),
      )
    )
      fail("APPOINTMENT_UNKNOWN_FIELD");
    identifier(receipt.tenantId);
    identifier(receipt.requestKey);
    identifier(receipt.appointmentId);
    if (
      typeof receipt.fingerprint !== "string" ||
      !receipt.fingerprint.length ||
      receipt.fingerprint.length > 8192
    )
      fail("APPOINTMENT_INVALID_RECEIPT");
  }
}
/** Returns a staged copy; never mutates inputs. This is NOT an atomic durable reservation.
 * Future host must query all relevant native conflicts and persist under Convex OCC. */
export function stageEstimateAppointment(
  state: EstimateAppointmentState,
  context: AppointmentContext,
  command: EstimateAppointmentCommand,
  options: EstimateSlotNormalization = {},
): EstimateAppointmentResult {
  office(context);
  identifier(command.appointmentId);
  identifier(command.requestKey);
  validateState(state);
  const allowed =
    command.kind === "propose"
      ? [
          "kind",
          "appointmentId",
          "requestKey",
          "leadId",
          "leadRevision",
          "customerId",
          "customerRevision",
          "slotId",
          "slotRevision",
        ]
      : command.kind === "reschedule"
        ? [
            "kind",
            "appointmentId",
            "requestKey",
            "expectedRevision",
            "slotId",
            "slotRevision",
            "leadRevision",
            "customerRevision",
          ]
        : ["kind", "appointmentId", "requestKey", "expectedRevision"];
  if (
    Object.keys(command).some((key) => !allowed.includes(key)) ||
    !["propose", "approve", "cancel", "reschedule"].includes(command.kind)
  )
    fail("APPOINTMENT_UNKNOWN_FIELD");
  if ("slotId" in command) {
    identifier(command.slotId);
    revision(command.slotRevision);
  }
  if ("leadRevision" in command) {
    revision(command.leadRevision);
    revision(command.customerRevision);
  }
  if ("expectedRevision" in command) revision(command.expectedRevision);
  if (command.kind === "propose") {
    identifier(command.leadId);
    identifier(command.customerId);
  }
  const tenantId = context.actor.tenantId;
  const sameIds = state.appointments.filter(
    (appointment) =>
      appointment.id === command.appointmentId &&
      appointment.tenantId === tenantId,
  );
  if (sameIds.length > 1) fail("APPOINTMENT_DUPLICATE_ID");
  const target = sameIds[0];
  const digest = fingerprint(context, command);
  const prior = state.receipts.filter(
    (receipt) =>
      receipt.tenantId === tenantId &&
      receipt.requestKey === command.requestKey,
  );
  if (prior.length > 1) fail("APPOINTMENT_DUPLICATE_RECEIPT");
  const result = (
    next: EstimateAppointmentState,
    appointment: EstimateAppointment,
    replayed: boolean,
  ): EstimateAppointmentResult => ({
    state: next,
    appointment: { ...appointment },
    replayed,
    nativeOnly: true,
    customerNotified: false,
    externalCalendarsChecked: false,
  });
  const copy = () => ({
    appointments: state.appointments.map((appointment) => ({ ...appointment })),
    receipts: state.receipts.map((receipt) => ({ ...receipt })),
  });
  if (prior[0]) {
    if (
      prior[0].fingerprint !== digest ||
      prior[0].appointmentId !== command.appointmentId
    )
      fail("APPOINTMENT_IDEMPOTENCY_CONFLICT");
    if (!target) fail("APPOINTMENT_RECEIPT_TARGET_MISSING");
    return result(copy(), target, true);
  }
  if (state.receipts.length === ESTIMATE_APPOINTMENT_LIMITS.receipts)
    fail("APPOINTMENT_STATE_LIMIT");
  let appointment: EstimateAppointment;
  if (command.kind === "propose") {
    if (
      target ||
      state.appointments.some(
        (existing) => existing.id === command.appointmentId,
      )
    )
      fail("APPOINTMENT_DUPLICATE_ID");
    if (state.appointments.length === ESTIMATE_APPOINTMENT_LIMITS.appointments)
      fail("APPOINTMENT_STATE_LIMIT");
    identifier(command.leadId);
    identifier(command.customerId);
    revision(command.leadRevision);
    revision(command.customerRevision);
    revision(command.slotRevision);
    currentSource(context, command);
    const slot = currentSlot(
      context,
      command.slotId,
      command.slotRevision,
      options,
    );
    if (
      state.appointments.some(
        (existing) =>
          existing.tenantId === tenantId &&
          existing.leadId === command.leadId &&
          existing.slotId === slot.id &&
          existing.status !== "cancelled",
      )
    )
      fail("APPOINTMENT_DUPLICATE_PROPOSAL");
    appointment = {
      id: command.appointmentId,
      tenantId,
      revision: 1,
      status: "proposed",
      leadId: command.leadId,
      leadRevision: command.leadRevision,
      customerId: command.customerId,
      customerRevision: command.customerRevision,
      ...selection(slot),
      proposedBy: context.actor.id,
    };
  } else {
    if (!target) fail("APPOINTMENT_NOT_FOUND");
    revision(target.revision);
    revision(command.expectedRevision);
    if (target.revision !== command.expectedRevision)
      fail("APPOINTMENT_REVISION_CONFLICT");
    if (target.status === "cancelled") fail("APPOINTMENT_INVALID_TRANSITION");
    if (target.revision >= Number.MAX_SAFE_INTEGER - 1)
      fail("APPOINTMENT_REVISION_EXHAUSTED");
    appointment = { ...target, revision: target.revision + 1 };
    if (command.kind === "cancel") {
      appointment.status = "cancelled";
      appointment.cancelledBy = context.actor.id;
    } else if (command.kind === "approve") {
      if (target.status !== "proposed") fail("APPOINTMENT_INVALID_TRANSITION");
      currentSource(context, target);
      const slot = currentSlot(
        context,
        target.slotId,
        target.slotRevision,
        options,
      );
      if (
        JSON.stringify(selection(slot)) !==
        JSON.stringify({
          slotId: target.slotId,
          slotRevision: target.slotRevision,
          resourceId: target.resourceId,
          timeZone: target.timeZone,
          startAt: target.startAt,
          endAt: target.endAt,
          durationMinutes: target.durationMinutes,
          bufferBeforeMinutes: target.bufferBeforeMinutes,
          bufferAfterMinutes: target.bufferAfterMinutes,
        })
      )
        fail("APPOINTMENT_SLOT_CHANGED");
      appointment.status = "reserved_internal";
      appointment.approvedBy = context.actor.id;
      conflicts(state.appointments, appointment);
    } else {
      revision(command.leadRevision);
      revision(command.customerRevision);
      revision(command.slotRevision);
      currentSource(context, {
        ...target,
        leadRevision: command.leadRevision,
        customerRevision: command.customerRevision,
      });
      const slot = currentSlot(
        context,
        command.slotId,
        command.slotRevision,
        options,
      );
      if (
        state.appointments.some(
          (existing) =>
            existing.id !== target.id &&
            existing.tenantId === tenantId &&
            existing.leadId === target.leadId &&
            existing.slotId === slot.id &&
            existing.status !== "cancelled",
        )
      )
        fail("APPOINTMENT_DUPLICATE_PROPOSAL");
      appointment = {
        ...appointment,
        ...selection(slot),
        leadRevision: command.leadRevision,
        customerRevision: command.customerRevision,
      };
      if (appointment.status === "reserved_internal") {
        appointment.approvedBy = context.actor.id;
        conflicts(state.appointments, appointment);
      }
    }
  }
  const next = copy();
  if (target)
    next.appointments = next.appointments.map((existing) =>
      existing.tenantId === tenantId && existing.id === target.id
        ? appointment
        : existing,
    );
  else next.appointments.push(appointment);
  next.receipts.push({
    tenantId,
    requestKey: command.requestKey,
    fingerprint: digest,
    appointmentId: appointment.id,
  });
  return result(next, appointment, false);
}

export interface EstimateSlotWriteResult {
  slot: EstimateSlot;
  replayed: boolean;
  nativeOnly: true;
  customerNotified: false;
  externalCalendarsChecked: false;
}
export type EstimateAppointmentWriteResult = Omit<
  EstimateAppointmentResult,
  "state"
>;
export interface EstimateNativePage<T> {
  items: T[];
  nextCursor: string | null;
  done: boolean;
  nativeOnly: true;
  customerNotified: false;
  externalCalendarsChecked: false;
}
export function closeEstimateSlot(
  context: AppointmentContext,
  slot: EstimateSlot,
  expectedRevision: number,
): EstimateSlot {
  office(context);
  revision(expectedRevision);
  revision(slot.revision);
  if (slot.tenantId !== context.actor.tenantId)
    fail("APPOINTMENT_SLOT_NOT_FOUND");
  if (slot.revision !== expectedRevision) fail("APPOINTMENT_SLOT_CHANGED");
  if (slot.status !== "offered") fail("APPOINTMENT_INVALID_TRANSITION");
  if (slot.revision >= Number.MAX_SAFE_INTEGER - 1)
    fail("APPOINTMENT_REVISION_EXHAUSTED");
  return { ...slot, status: "closed", revision: slot.revision + 1 };
}
