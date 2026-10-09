import { ConvexError } from "convex/values";
import {
  EstimateAppointmentPolicyError,
  decodeEstimateAppointmentRefusal,
  type EstimateAppointmentRefusalCode,
} from "../../domain/src/estimate-appointments";

/** Only call at an explicit trusted refusal site; never classify arbitrary messages. */
export function refuseAppointment(code: EstimateAppointmentRefusalCode): never {
  throw new ConvexError({
    kind: "estimate_appointment_refusal",
    version: 1,
    code,
  });
}
/** Branded pure policy errors are trusted; unexpected failures keep their opaque transport behavior. */
export async function appointmentBoundary<R>(
  operation: () => Promise<R> | R,
): Promise<R> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof EstimateAppointmentPolicyError)
      refuseAppointment(error.code);
    throw error;
  }
}

/** Omission in bounded lists is allowed only for a structured, explicit refusal. */
export function isAppointmentRefusal(
  error: unknown,
  codes: readonly EstimateAppointmentRefusalCode[],
): boolean {
  if (!(error instanceof ConvexError)) return false;
  const refusal = decodeEstimateAppointmentRefusal(error.data);
  return refusal !== null && codes.includes(refusal.code);
}
