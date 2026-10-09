import { ConvexError } from "convex/values";
import {
  EstimateAppointmentPolicyError,
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
