import type {
  EstimateSlot,
  EstimateAppointment,
  EstimateAppointmentResult,
} from "./estimate-appointments";
/** Closed production refusal contract. Unknown errors never become confirmed refusals. */
export const ESTIMATE_APPOINTMENT_REFUSAL_CODES = [
  "APPOINTMENT_CONFLICT_LIMIT",
  "APPOINTMENT_DUPLICATE_ID",
  "APPOINTMENT_DUPLICATE_PROPOSAL",
  "APPOINTMENT_DUPLICATE_RECEIPT",
  "APPOINTMENT_EXPLICIT_OFFSET_REQUIRED",
  "APPOINTMENT_IDEMPOTENCY_CONFLICT",
  "APPOINTMENT_INCOMPLETE_CONFLICT_STATE",
  "APPOINTMENT_INTAKE_TRANSFER_REQUIRED",
  "APPOINTMENT_INVALID_CONFLICT_RECORD",
  "APPOINTMENT_INVALID_ID",
  "APPOINTMENT_INVALID_LOCAL_TIME",
  "APPOINTMENT_INVALID_NORMALIZATION",
  "APPOINTMENT_INVALID_NUMBER",
  "APPOINTMENT_INVALID_OFFSET",
  "APPOINTMENT_INVALID_PAGE",
  "APPOINTMENT_INVALID_RECEIPT",
  "APPOINTMENT_INVALID_REQUEST",
  "APPOINTMENT_INVALID_REVISION",
  "APPOINTMENT_INVALID_SLOT",
  "APPOINTMENT_INVALID_SLOT_STATUS",
  "APPOINTMENT_INVALID_TIMEZONE",
  "APPOINTMENT_INVALID_TRANSITION",
  "APPOINTMENT_NOT_FOUND",
  "APPOINTMENT_OFFICE_REQUIRED",
  "APPOINTMENT_QUALIFIED_SOURCE_REQUIRED",
  "APPOINTMENT_RECEIPT_TARGET_MISSING",
  "APPOINTMENT_RESOURCE_CONFLICT",
  "APPOINTMENT_RESOURCE_LIST_LIMIT",
  "APPOINTMENT_RESOURCE_UNAVAILABLE",
  "APPOINTMENT_REVISION_CONFLICT",
  "APPOINTMENT_REVISION_EXHAUSTED",
  "APPOINTMENT_SLOT_CHANGED",
  "APPOINTMENT_SLOT_NOT_FOUND",
  "APPOINTMENT_SLOT_NOT_FUTURE",
  "APPOINTMENT_SOURCE_CHANGED",
  "APPOINTMENT_STATE_LIMIT",
  "APPOINTMENT_UNKNOWN_FIELD",
  "APPOINTMENT_ZONE_OFFSET_MISMATCH",
  "UNAUTHENTICATED",
  "WORKSPACE_MEMBERSHIP_REQUIRED",
  "WORKSPACE_NOT_FOUND",
] as const;
export type EstimateAppointmentRefusalCode =
  (typeof ESTIMATE_APPOINTMENT_REFUSAL_CODES)[number];
export interface EstimateAppointmentRefusal {
  kind: "estimate_appointment_refusal";
  version: 1;
  code: EstimateAppointmentRefusalCode;
}
export function decodeEstimateAppointmentRefusal(
  value: unknown,
): EstimateAppointmentRefusal | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  if (
    Object.keys(obj).sort().join(",") !== "code,kind,version" ||
    obj.kind !== "estimate_appointment_refusal" ||
    obj.version !== 1 ||
    !ESTIMATE_APPOINTMENT_REFUSAL_CODES.includes(
      obj.code as EstimateAppointmentRefusalCode,
    )
  )
    return null;
  return {
    kind: "estimate_appointment_refusal",
    version: 1,
    code: obj.code as EstimateAppointmentRefusalCode,
  };
}
export class EstimateAppointmentPolicyError extends Error {
  constructor(readonly code: EstimateAppointmentRefusalCode) {
    super(code);
    this.name = "EstimateAppointmentPolicyError";
  }
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

export type EstimateQualifiedSource = Pick<
  EstimateAppointment,
  "leadId" | "leadRevision" | "customerId" | "customerRevision"
>;
