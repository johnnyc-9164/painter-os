import { describe, it, expect } from "vitest";
import { ConvexError } from "convex/values";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { invokeFunction } from "../../../node_modules/convex/src/server/impl/registration_impl";
import {
  appointmentBoundary,
  refuseAppointment,
} from "../convex/estimateAppointmentErrors";
import {
  EstimateAppointmentPolicyError,
  decodeEstimateAppointmentRefusal,
} from "../../domain/src/estimate-appointments";

describe("native refusal official transport", () => {
  it("official serializer and actual HTTP client preserve only closed structured refusal data", async () => {
    let serialized: unknown;
    try {
      await invokeFunction(
        () =>
          appointmentBoundary(() => {
            throw new EstimateAppointmentPolicyError(
              "APPOINTMENT_RESOURCE_CONFLICT",
            );
          }),
        {},
        [],
      );
    } catch (error) {
      serialized = error;
    }
    expect(serialized).toBeInstanceOf(ConvexError);
    const wire = JSON.parse((serialized as ConvexError<string>).data);
    expect(wire).toEqual({
      kind: "estimate_appointment_refusal",
      version: 1,
      code: "APPOINTMENT_RESOURCE_CONFLICT",
    });
    const client = new ConvexHttpClient("https://fixture.convex.cloud", {
      fetch: async () =>
        new Response(
          JSON.stringify({
            status: "error",
            errorMessage: "opaque production message",
            errorData: wire,
          }),
          { status: 560, headers: { "content-type": "application/json" } },
        ),
    });
    for (const operation of [
      () =>
        client.mutation(
          makeFunctionReference<"mutation">("estimateAppointments:approve"),
          {},
        ),
      () =>
        client.action(
          makeFunctionReference<"action">("estimateAppointmentSlots:save"),
          {},
        ),
      () =>
        client.query(
          makeFunctionReference<"query">("estimateAppointments:list"),
          {},
        ),
    ]) {
      let reconstructed: unknown;
      try {
        await operation();
      } catch (error) {
        reconstructed = error;
      }
      expect(reconstructed).toBeInstanceOf(ConvexError);
      expect(
        decodeEstimateAppointmentRefusal(
          (reconstructed as ConvexError<unknown>).data,
        ),
      ).toEqual(wire);
    }
  });
  it("unbranded failures stay unchanged and malformed data never becomes a refusal", async () => {
    const unknown = new Error("APPOINTMENT_RESOURCE_CONFLICT");
    await expect(
      appointmentBoundary(() => {
        throw unknown;
      }),
    ).rejects.toBe(unknown);
    for (const value of [
      null,
      "APPOINTMENT_RESOURCE_CONFLICT",
      { kind: "estimate_appointment_refusal", version: 1, code: "UNKNOWN" },
      {
        kind: "estimate_appointment_refusal",
        version: 1,
        code: "APPOINTMENT_RESOURCE_CONFLICT",
        input: "private",
      },
      {
        kind: "estimate_appointment_refusal",
        version: 2,
        code: "APPOINTMENT_RESOURCE_CONFLICT",
      },
    ])
      expect(decodeEstimateAppointmentRefusal(value)).toBeNull();
    const client = new ConvexHttpClient("https://fixture.convex.cloud", {
      fetch: async () =>
        new Response(
          JSON.stringify({ status: "error", errorMessage: unknown.message }),
          { status: 560 },
        ),
    });
    let error: unknown;
    try {
      await client.mutation(
        makeFunctionReference<"mutation">("estimateAppointments:approve"),
        {},
      );
    } catch (e) {
      error = e;
    }
    expect(error).not.toBeInstanceOf(ConvexError);
    expect(decodeEstimateAppointmentRefusal(error)).toBeNull();
  });
  it("explicit refusal contains no stack or caller data", () => {
    try {
      refuseAppointment("UNAUTHENTICATED");
    } catch (error) {
      expect((error as ConvexError<unknown>).data).toEqual({
        kind: "estimate_appointment_refusal",
        version: 1,
        code: "UNAUTHENTICATED",
      });
    }
  });
});
