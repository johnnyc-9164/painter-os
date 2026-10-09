import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makeEstimateSlot,
  stageEstimateAppointment,
  type AppointmentContext,
  type EstimateSlotInput,
} from "../packages/domain/src/estimate-appointments.ts";
import { visibleEntities } from "../packages/domain/src/engine.ts";
import type { Actor, Entity } from "../packages/domain/src/contracts.ts";
const context: AppointmentContext = {
  actor: { id: "owner", tenantId: "tenant", role: "owner" },
  nowMs: Date.parse("2026-10-09"),
  resource: {
    tenantId: "tenant",
    userId: "estimator",
    role: "estimator",
    enabled: true,
    identityExists: true,
  },
  lead: {
    id: "lead",
    tenantId: "tenant",
    revision: 1,
    status: "qualified",
    customerId: "customer",
  },
  customer: { id: "customer", tenantId: "tenant", revision: 1 },
};
const input: EstimateSlotInput = {
  id: "slot",
  revision: 1,
  resourceId: "estimator",
  status: "offered",
  localStart: "2026-11-01T01:30",
  offset: "-05:00",
  timeZone: "America/Chicago",
  durationMinutes: 60,
  bufferBeforeMinutes: 15,
  bufferAfterMinutes: 15,
};
test("trusted invocation normalization preserves strict pure defaults and cannot enter slot/command transport", (t) => {
  const slot = makeEstimateSlot(context, input);
  t.mock.method(Intl, "DateTimeFormat", () => {
    throw new Error("Runtime Intl unavailable");
  });
  assert.throws(() => makeEstimateSlot(context, input), /INVALID_TIMEZONE/);
  const options = {
    normalizeSlotInstant: (candidate: Readonly<EstimateSlotInput>) => {
      assert.deepEqual(candidate, input);
      return slot.startAt;
    },
  };
  assert.deepEqual(makeEstimateSlot(context, input, options), slot);
  const command = {
    kind: "propose" as const,
    appointmentId: "appointment",
    requestKey: "proposal",
    leadId: "lead",
    leadRevision: 1,
    customerId: "customer",
    customerRevision: 1,
    slotId: "slot",
    slotRevision: 1,
  };
  assert.equal(
    stageEstimateAppointment(
      { appointments: [], receipts: [] },
      { ...context, slot },
      command,
      options,
    ).appointment.status,
    "proposed",
  );
  assert.throws(
    () =>
      makeEstimateSlot(context, {
        ...input,
        normalizeSlotInstant: () => slot.startAt,
      } as EstimateSlotInput),
    /UNKNOWN_FIELD/,
  );
  assert.throws(
    () =>
      makeEstimateSlot(context, input, {
        normalizeSlotInstant: () => "2026-11-01T07:30:00.000Z",
      }),
    /INVALID_NORMALIZATION/,
  );
  assert.throws(
    () =>
      stageEstimateAppointment(
        { appointments: [], receipts: [] },
        { ...context, slot },
        { ...command, normalizedInstant: slot.startAt } as typeof command,
        options,
      ),
    /UNKNOWN_FIELD/,
  );
});
test("native scheduling snapshot projection grants office and assigned estimator only", () => {
  const entities = ["estimate_slot", "estimate_appointment"].map(
    (type, index) =>
      ({
        id: String(index),
        type,
        tenantId: "tenant",
        revision: 1,
        createdAt: "test",
        updatedAt: "test",
        data: { resourceId: "estimator" },
      }) as Entity,
  );
  const actor = (role: Actor["role"], id = role): Actor => ({
    id,
    role,
    tenantId: "tenant",
    name: "Name",
    email: "user@example.test",
  });
  const state = { entities, events: [], receipts: {} };
  assert.equal(visibleEntities(state, actor("owner")).length, 2);
  assert.equal(visibleEntities(state, actor("office_admin")).length, 2);
  assert.equal(
    visibleEntities(state, actor("estimator", "estimator")).length,
    2,
  );
  for (const role of [
    "salesperson",
    "crew_member",
    "accountant",
    "customer",
    "project_manager",
  ] as const)
    assert.deepEqual(visibleEntities(state, actor(role)), []);
  assert.deepEqual(visibleEntities(state, actor("estimator", "another")), []);
});
