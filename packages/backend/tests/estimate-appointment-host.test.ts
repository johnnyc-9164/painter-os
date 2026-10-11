import { ConvexError } from "convex/values";
import { decodeEstimateAppointmentRefusal } from "../../domain/src/estimate-appointments";
import { afterEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import betterAuthTest from "@convex-dev/better-auth/test";
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import schema from "../convex/schema";
import { api } from "../convex/runtime";
const modules = {
  "./_generated/test-root-marker.ts": () => Promise.resolve({}),
  "./painter.ts": () => import("../convex/painter"),
  "./estimateAppointments.ts": () => import("../convex/estimateAppointments"),
  "./estimateAppointmentSlots.ts": () =>
    import("../convex/estimateAppointmentSlots"),
  "./estimateAppointmentSlotNormalization.ts": () =>
    import("../convex/estimateAppointmentSlotNormalization"),
  "./intakeConfig.ts": () => import("../convex/intakeConfig"),
  "./contactIntakeConfig.ts": () => import("../convex/contactIntakeConfig"),
  "./publicLead.ts": () => import("../convex/publicLead"),
  "./intakePrivacy.ts": () => import("../convex/intakePrivacy"),
};
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
async function fixture() {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-09T12:00:00Z"));
  const t = convexTest(schema, modules);
  t.registerComponent("betterAuth", betterAuthTest.schema, {
    ...betterAuthTest.modules,
    "./component/adapter.ts": () =>
      import("../../../node_modules/@convex-dev/better-auth/src/component/adapter"),
    "./component/_generated/test-root-marker.ts": () => Promise.resolve({}),
  });
  rateLimiterTest.register(t);
  async function identity(name: string) {
    const ids = await t.runInComponent("betterAuth", async (ctx) => {
      const userId = await ctx.db.insert("user", {
        name,
        email: `${name}@example.test`,
        emailVerified: true,
        createdAt: 1,
        updatedAt: 1,
      });
      const sessionId = await ctx.db.insert("session", {
        userId,
        token: `session-${name}`,
        expiresAt: Date.now() + 86400000,
        createdAt: 1,
        updatedAt: 1,
      });
      return { userId, sessionId };
    });
    return {
      ...ids,
      client: t.withIdentity({ subject: ids.userId, sessionId: ids.sessionId }),
    };
  }
  const owner = await identity("owner"),
    estimator = await identity("estimator"),
    otherEstimator = await identity("other-estimator");
  const company = await t.run(async (ctx) => {
    const id = await ctx.db.insert("painterWorkspaces", {
      name: "Painting company",
      ownerId: owner.userId,
      createdAt: "2026-10-09",
      demo: false,
    });
    const ownerMember = await ctx.db.insert("painterMembers", {
      tenantId: id,
      userId: owner.userId,
      name: "Owner",
      email: "owner@example.test",
      role: "owner",
      enabled: true,
    });
    const estimatorMember = await ctx.db.insert("painterMembers", {
      tenantId: id,
      userId: estimator.userId,
      name: "Estimator",
      email: "estimator@example.test",
      role: "estimator",
      enabled: true,
    });
    await ctx.db.insert("painterMembers", {
      tenantId: id,
      userId: otherEstimator.userId,
      name: "Other estimator",
      email: "other@example.test",
      role: "estimator",
      enabled: true,
    });
    for (const [entityId, type, data] of [
      [
        "customer",
        "customer",
        { name: "PRIVATE-CUSTOMER", email: "private-customer@example.test" },
      ],
      [
        "lead",
        "lead",
        {
          name: "PRIVATE-LEAD",
          email: "private-lead@example.test",
          status: "qualified",
          customerId: "customer",
        },
      ],
      [
        "lead-two",
        "lead",
        { name: "PRIVATE-OTHER", status: "qualified", customerId: "customer" },
      ],
    ] as const)
      await ctx.db.insert("painterEntities", {
        tenantId: id,
        entityId,
        type,
        revision: 1,
        createdAt: "test",
        updatedAt: "test",
        data,
      });
    return { id, ownerMember, estimatorMember };
  });
  const slotArgs = (
    key = "slot",
    localStart = "2026-10-12T09:00",
    resourceId = estimator.userId,
  ) => ({
    requestKey: key,
    expectedRevision: 0,
    resourceId,
    localStart,
    timeZone: "America/Chicago",
    offset: "-05:00",
    durationMinutes: 60,
    bufferBeforeMinutes: 15,
    bufferAfterMinutes: 15,
  });
  async function slot(
    key = "slot",
    localStart = "2026-10-12T09:00",
    resourceId = estimator.userId,
  ) {
    return (
      await owner.client.action(
        api.estimateAppointmentSlots.save,
        slotArgs(key, localStart, resourceId),
      )
    ).slot;
  }
  const proposalArgs = (slot: any, key = "proposal", leadId = "lead") => ({
    requestKey: key,
    leadId,
    leadRevision: 1,
    customerId: "customer",
    customerRevision: 1,
    slotId: slot.id,
    slotRevision: slot.revision,
  });
  const propose = async (slot: any, key = "proposal", leadId = "lead") =>
    owner.client.mutation(
      api.estimateAppointments.propose,
      proposalArgs(slot, key, leadId),
    );
  return {
    t,
    owner,
    estimator,
    otherEstimator,
    company,
    slotArgs,
    slot,
    proposalArgs,
    propose,
  };
}
describe("native appointment host with actual Better Auth", () => {
  it("actual missing slot refusal has structured closed data", async () => {
    const f = await fixture();
    let failure: unknown;
    try {
      await f.owner.client.mutation(api.estimateAppointmentSlots.close, {
        slotId: "slot:missing",
        expectedRevision: 1,
        requestKey: "missing",
      });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(ConvexError);
    expect(
      decodeEstimateAppointmentRefusal((failure as ConvexError<unknown>).data),
    ).toEqual({
      kind: "estimate_appointment_refusal",
      version: 1,
      code: "APPOINTMENT_SLOT_NOT_FOUND",
    });
  });
  it("actual registered Node action and mutations expose closed refusal data", async () => {
    const f = await fixture();
    for (const operation of [
      () =>
        f.owner.client.action(api.estimateAppointmentSlots.save, {
          ...f.slotArgs(),
          localStart: "2027-03-14T02:30",
          timeZone: "America/New_York",
          offset: "-05:00",
        }),
      () =>
        f.estimator.client.mutation(api.estimateAppointments.cancel, {
          appointmentId: "appointment:missing",
          expectedRevision: 1,
          requestKey: "deny",
        }),
    ]) {
      let failure: unknown;
      try {
        await operation();
      } catch (error) {
        failure = error;
      }
      expect(failure).toBeInstanceOf(ConvexError);
      expect(
        decodeEstimateAppointmentRefusal(
          (failure as ConvexError<unknown>).data,
        ),
      ).toMatchObject({ kind: "estimate_appointment_refusal", version: 1 });
    }
  });
  it("normalizes DST explicitly and commits through the sole writer without contact copies", async () => {
    const f = await fixture();
    const slot = await f.slot();
    expect(slot.startAt).toBe("2026-10-12T14:00:00.000Z");
    const proposal = await f.propose(slot);
    expect(proposal.appointment.status).toBe("proposed");
    const approved = await f.owner.client.mutation(
      api.estimateAppointments.approve,
      {
        appointmentId: proposal.appointment.id,
        expectedRevision: 1,
        requestKey: "approve",
      },
    );
    expect(approved).toMatchObject({
      appointment: { status: "reserved_internal", revision: 2 },
      nativeOnly: true,
      customerNotified: false,
      externalCalendarsChecked: false,
    });
    const saved = await f.t.run(async (ctx) => ({
      entities: await ctx.db
        .query("painterEntities")
        .withIndex("by_tenant_type", (q) =>
          q.eq("tenantId", f.company.id).eq("type", "estimate_appointment"),
        )
        .collect(),
      receipts: await ctx.db
        .query("painterReceipts")
        .withIndex("by_tenant_native_kind", (q) =>
          q
            .eq("tenantId", f.company.id)
            .eq("nativeKind", "estimate_appointment"),
        )
        .collect(),
      events: await ctx.db.query("painterEvents").collect(),
    }));
    expect(saved.entities).toHaveLength(1);
    expect(saved.receipts).toHaveLength(2);
    expect(JSON.stringify(saved)).not.toMatch(/PRIVATE-|private-.*@/);
    expect(
      saved.events.every(
        (event) => !("before" in event.payload) && !("after" in event.payload),
      ),
    ).toBe(true);
  });
  it("requires actual session/current office authority and cannot accept client role or instant proof", async () => {
    const f = await fixture();
    await expect(
      f.t.action(api.estimateAppointmentSlots.save, f.slotArgs()),
    ).rejects.toThrow("UNAUTHENTICATED");
    await expect(
      f.t
        .withIdentity({ subject: f.owner.userId, sessionId: "fake" })
        .action(api.estimateAppointmentSlots.save, f.slotArgs()),
    ).rejects.toThrow("UNAUTHENTICATED");
    for (const role of [
      "estimator",
      "salesperson",
      "crew_member",
      "accountant",
      "customer",
    ] as const) {
      await f.t.run((ctx) => ctx.db.patch(f.company.ownerMember, { role }));
      await expect(
        f.owner.client.action(api.estimateAppointmentSlots.save, f.slotArgs()),
      ).rejects.toThrow("APPOINTMENT_OFFICE_REQUIRED");
    }
    await f.t.run((ctx) =>
      ctx.db.patch(f.company.ownerMember, { role: "office_admin" }),
    );
    await expect(
      f.owner.client.action(api.estimateAppointmentSlots.save, {
        ...f.slotArgs(),
        normalizedInstant: "2026-10-12T14:00:00.000Z",
      }),
    ).rejects.toThrow();
    await expect(
      f.owner.client.action(api.estimateAppointmentSlots.save, {
        ...f.slotArgs(),
        actor: { role: "owner" },
      }),
    ).rejects.toThrow();
    await expect(
      f.owner.client.action(api.estimateAppointmentSlots.save, {
        ...f.slotArgs(),
        slotId: "",
      }),
    ).rejects.toThrow("APPOINTMENT_INVALID_REVISION");
    expect(
      (
        await f.owner.client.action(
          api.estimateAppointmentSlots.save,
          f.slotArgs(),
        )
      ).slot.status,
    ).toBe("offered");
  });
  it("rechecks membership/resource/clock at internal commit after prior normalization", async () => {
    const f = await fixture();
    const args = {
      ...f.slotArgs(),
      workspaceId: f.company.id,
      normalizedInstant: "2026-10-12T14:00:00.000Z",
    };
    await f.owner.client.query(api.estimateAppointmentSlots.authority, {
      resourceId: f.estimator.userId,
    });
    await f.t.run((ctx) =>
      ctx.db.patch(f.company.ownerMember, { enabled: false }),
    );
    await expect(
      f.owner.client.mutation(
        api.estimateAppointmentSlots.commitNormalized,
        args,
      ),
    ).rejects.toThrow("WORKSPACE_MEMBERSHIP_REQUIRED");
    await f.t.run((ctx) =>
      ctx.db.patch(f.company.ownerMember, { enabled: true }),
    );
    await f.t.run((ctx) =>
      ctx.db.patch(f.company.estimatorMember, { enabled: false }),
    );
    await expect(
      f.owner.client.mutation(
        api.estimateAppointmentSlots.commitNormalized,
        args,
      ),
    ).rejects.toThrow("APPOINTMENT_RESOURCE_UNAVAILABLE");
    await f.t.run((ctx) =>
      ctx.db.patch(f.company.estimatorMember, { enabled: true }),
    );
    await f.t.runInComponent("betterAuth", (ctx) =>
      ctx.db.patch(f.owner.sessionId, { expiresAt: Date.parse("2026-10-14") }),
    );
    vi.setSystemTime(new Date("2026-10-12T14:01:00Z"));
    await expect(
      f.owner.client.mutation(
        api.estimateAppointmentSlots.commitNormalized,
        args,
      ),
    ).rejects.toThrow("APPOINTMENT_SLOT_NOT_FUTURE");
  });
  it("rejects missing resource identities and forged normalization proofs", async () => {
    const f = await fixture();
    await f.t.runInComponent("betterAuth", (ctx) =>
      ctx.db.delete(f.estimator.userId),
    );
    await expect(f.slot()).rejects.toThrow("APPOINTMENT_RESOURCE_UNAVAILABLE");
    const slot = await f.slot("own", "2026-10-12T09:00", f.owner.userId);
    await f.t.run(async (ctx) => {
      const row = await ctx.db
        .query("painterEntities")
        .withIndex("by_tenant_entity", (q) =>
          q.eq("tenantId", f.company.id).eq("entityId", slot.id),
        )
        .unique();
      await ctx.db.patch(row!._id, {
        data: { ...row!.data, startAt: "2026-10-12T15:00:00.000Z" },
      });
    });
    await expect(f.propose(slot)).rejects.toThrow(
      "APPOINTMENT_INVALID_NORMALIZATION",
    );
  });
  it("default-runtime transitions use persisted proof rather than invoking Intl", async () => {
    const f = await fixture();
    const slot = await f.slot();
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
      throw new Error("Mutation runtime Intl unavailable");
    });
    const proposed = await f.propose(slot);
    expect(
      (
        await f.owner.client.mutation(api.estimateAppointments.approve, {
          appointmentId: proposed.appointment.id,
          expectedRevision: 1,
          requestKey: "approve",
        })
      ).appointment.status,
    ).toBe("reserved_internal");
  });
  it("rejects DST gaps, requires an explicit offset and distinguishes both fold instants", async () => {
    const f = await fixture();
    await expect(
      f.owner.client.action(api.estimateAppointmentSlots.save, {
        ...f.slotArgs(),
        localStart: "2027-03-14T02:30",
        offset: "-06:00",
      }),
    ).rejects.toThrow("APPOINTMENT_ZONE_OFFSET_MISMATCH");
    await expect(
      f.owner.client.action(api.estimateAppointmentSlots.save, {
        ...f.slotArgs(),
        offset: "",
      }),
    ).rejects.toThrow("APPOINTMENT_EXPLICIT_OFFSET_REQUIRED");
    const early = await f.owner.client.action(
        api.estimateAppointmentSlots.save,
        {
          ...f.slotArgs("early"),
          localStart: "2026-11-01T01:30",
          offset: "-05:00",
        },
      ),
      late = await f.owner.client.action(api.estimateAppointmentSlots.save, {
        ...f.slotArgs("late"),
        localStart: "2026-11-01T01:30",
        offset: "-06:00",
      });
    expect(Date.parse(late.slot.startAt) - Date.parse(early.slot.startAt)).toBe(
      3600000,
    );
  });
  it("keeps exact source and slot revisions and current customer qualification before reservation", async () => {
    const f = await fixture();
    const slot = await f.slot();
    const proposed = await f.propose(slot);
    await f.t.run(async (ctx) => {
      const lead = await ctx.db
        .query("painterEntities")
        .withIndex("by_tenant_entity", (q) =>
          q.eq("tenantId", f.company.id).eq("entityId", "lead"),
        )
        .unique();
      await ctx.db.patch(lead!._id, { revision: 2 });
    });
    await expect(
      f.owner.client.mutation(api.estimateAppointments.approve, {
        appointmentId: proposed.appointment.id,
        expectedRevision: 1,
        requestKey: "approve",
      }),
    ).rejects.toThrow("APPOINTMENT_SOURCE_CHANGED");
    await expect(f.propose(slot, "stale-source")).rejects.toThrow(
      "APPOINTMENT_SOURCE_CHANGED",
    );
    await f.owner.client.mutation(api.estimateAppointmentSlots.close, {
      slotId: slot.id,
      expectedRevision: 1,
      requestKey: "close",
    });
    await expect(f.propose(slot, "closed-slot", "lead-two")).rejects.toThrow(
      "APPOINTMENT_SLOT_CHANGED",
    );
  });
  it("reads complete padded conflicts and serialized fixtures admit only one overlapping reservation", async () => {
    const f = await fixture();
    const first = await f.slot("first", "2026-10-12T09:00"),
      second = await f.slot("second", "2026-10-12T10:00");
    const a = await f.propose(first, "a"),
      b = await f.propose(second, "b", "lead-two");
    const outcomes = await Promise.allSettled([
      f.owner.client.mutation(api.estimateAppointments.approve, {
        appointmentId: a.appointment.id,
        expectedRevision: 1,
        requestKey: "approve-a",
      }),
      f.owner.client.mutation(api.estimateAppointments.approve, {
        appointmentId: b.appointment.id,
        expectedRevision: 1,
        requestKey: "approve-b",
      }),
    ]);
    expect(
      outcomes.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      outcomes.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    const list = await f.owner.client.query(api.estimateAppointments.list, {
      paginationOpts: { numItems: 25, cursor: null },
    });
    expect(
      list.items.filter((item) => item.status === "reserved_internal"),
    ).toHaveLength(1);
  });
  it("cancel releases occupancy and exact old approve replay reports current cancelled status without rebooking", async () => {
    const f = await fixture();
    const slot = await f.slot();
    const proposed = await f.propose(slot);
    const approve = {
      appointmentId: proposed.appointment.id,
      expectedRevision: 1,
      requestKey: "approve",
    };
    await f.owner.client.mutation(api.estimateAppointments.approve, approve);
    await f.owner.client.mutation(api.estimateAppointments.cancel, {
      appointmentId: proposed.appointment.id,
      expectedRevision: 2,
      requestKey: "cancel",
    });
    await f.t.run((ctx) =>
      ctx.db.patch(f.company.estimatorMember, { enabled: false }),
    );
    const replay = await f.owner.client.mutation(
      api.estimateAppointments.approve,
      approve,
    );
    expect(replay).toMatchObject({
      appointment: { status: "cancelled", revision: 3 },
      replayed: true,
    });
    await expect(
      f.owner.client.mutation(api.estimateAppointments.approve, {
        ...approve,
        requestKey: "new-approve",
        expectedRevision: 3,
      }),
    ).rejects.toThrow();
  });
  it("rescheduling conflicts leave the old reservation intact and safe new slots preserve status", async () => {
    const f = await fixture();
    const s1 = await f.slot("s1", "2026-10-12T09:00"),
      s2 = await f.slot("s2", "2026-10-12T11:00"),
      s3 = await f.slot("s3", "2026-10-12T13:00");
    const a = await f.propose(s1, "a"),
      b = await f.propose(s2, "b", "lead-two");
    for (const result of [a, b])
      await f.owner.client.mutation(api.estimateAppointments.approve, {
        appointmentId: result.appointment.id,
        expectedRevision: 1,
        requestKey: `approve-${result.appointment.id}`,
      });
    await expect(
      f.owner.client.mutation(api.estimateAppointments.reschedule, {
        appointmentId: a.appointment.id,
        expectedRevision: 2,
        requestKey: "conflict",
        slotId: s2.id,
        slotRevision: 1,
        leadRevision: 1,
        customerRevision: 1,
      }),
    ).rejects.toThrow("APPOINTMENT_RESOURCE_CONFLICT");
    expect(
      (
        await f.owner.client.query(api.estimateAppointments.list, {
          paginationOpts: { numItems: 25, cursor: null },
        })
      ).items.find((item) => item.id === a.appointment.id).slotId,
    ).toBe(s1.id);
    const moved = await f.owner.client.mutation(
      api.estimateAppointments.reschedule,
      {
        appointmentId: a.appointment.id,
        expectedRevision: 2,
        requestKey: "safe",
        slotId: s3.id,
        slotRevision: 1,
        leadRevision: 1,
        customerRevision: 1,
      },
    );
    expect(moved.appointment).toMatchObject({
      status: "reserved_internal",
      revision: 3,
      slotId: s3.id,
    });
  });
  it("role-scoped pages show only assigned estimator data and reject revoked reads/replays", async () => {
    const f = await fixture();
    const mine = await f.slot("mine"),
      theirs = await f.slot(
        "theirs",
        "2026-10-12T11:00",
        f.otherEstimator.userId,
      );
    await f.propose(mine, "mine");
    await f.propose(theirs, "theirs", "lead-two");
    const args = { paginationOpts: { numItems: 25, cursor: null } };
    expect(
      (
        await f.estimator.client.query(api.estimateAppointmentSlots.list, args)
      ).items.map((item) => item.resourceId),
    ).toEqual([f.estimator.userId]);
    expect(
      (
        await f.estimator.client.query(api.estimateAppointments.list, args)
      ).items.map((item) => item.resourceId),
    ).toEqual([f.estimator.userId]);
    await expect(
      f.estimator.client.mutation(
        api.estimateAppointments.propose,
        f.proposalArgs(mine, "forbidden"),
      ),
    ).rejects.toThrow("APPOINTMENT_OFFICE_REQUIRED");
    await f.t.run((ctx) =>
      ctx.db.patch(f.company.estimatorMember, { enabled: false }),
    );
    await expect(
      f.estimator.client.query(api.estimateAppointments.list, args),
    ).rejects.toThrow("WORKSPACE_MEMBERSHIP_REQUIRED");
    await f.t.run((ctx) =>
      ctx.db.patch(f.company.ownerMember, { enabled: false }),
    );
    await expect(
      f.owner.client.action(
        api.estimateAppointmentSlots.save,
        f.slotArgs("mine"),
      ),
    ).rejects.toThrow("WORKSPACE_MEMBERSHIP_REQUIRED");
  });
  it("slot idempotency is actor-bound and old save replay returns current closed state", async () => {
    const f = await fixture();
    const original = f.slotArgs();
    const result = await f.owner.client.action(
      api.estimateAppointmentSlots.save,
      original,
    );
    await f.t.run(async (ctx) => {
      const row = await ctx.db
        .query("painterEntities")
        .withIndex("by_tenant_entity", (q) =>
          q.eq("tenantId", f.company.id).eq("entityId", result.slot.id),
        )
        .unique();
      const proof = row!.data.normalizationProof as {
        instant: string;
        inputDigest: string;
        version: number;
      };
      await ctx.db.patch(row!._id, {
        data: {
          ...row!.data,
          normalizationProof: {
            instant: proof.instant,
            inputDigest: proof.inputDigest,
            version: proof.version,
          },
        },
      });
    });
    const closeArgs = {
      slotId: result.slot.id,
      expectedRevision: 1,
      requestKey: "close",
    };
    await f.owner.client.mutation(
      api.estimateAppointmentSlots.close,
      closeArgs,
    );
    expect(
      await f.owner.client.mutation(
        api.estimateAppointmentSlots.close,
        Object.fromEntries(
          Object.entries(closeArgs).reverse(),
        ) as typeof closeArgs,
      ),
    ).toMatchObject({ replayed: true, slot: { status: "closed" } });
    expect(
      await f.owner.client.action(
        api.estimateAppointmentSlots.save,
        Object.fromEntries(
          Object.entries(original).reverse(),
        ) as typeof original,
      ),
    ).toMatchObject({
      slot: { status: "closed", revision: 2 },
      replayed: true,
    });
    await expect(
      f.owner.client.action(api.estimateAppointmentSlots.save, {
        ...original,
        durationMinutes: 30,
      }),
    ).rejects.toThrow("APPOINTMENT_IDEMPOTENCY_CONFLICT");
  });
  it("fails closed on cap+1 rather than silently truncating native conflicts or receipts", async () => {
    const f = await fixture();
    const slot = await f.slot();
    const proposal = await f.propose(slot);
    const row = await f.t.run((ctx) =>
      ctx.db
        .query("painterEntities")
        .withIndex("by_tenant_entity", (q) =>
          q
            .eq("tenantId", f.company.id)
            .eq("entityId", proposal.appointment.id),
        )
        .unique(),
    );
    await f.t.run(async (ctx) => {
      for (let i = 0; i < 256; i++)
        await ctx.db.insert("painterEntities", {
          tenantId: f.company.id,
          entityId: `appointment:overflow_${i}`,
          type: "estimate_appointment",
          revision: 1,
          createdAt: "test",
          updatedAt: "test",
          data: {
            ...row!.data,
            status: "cancelled",
            cancelledBy: f.owner.userId,
          },
        });
    });
    await expect(
      f.owner.client.mutation(api.estimateAppointments.approve, {
        appointmentId: proposal.appointment.id,
        expectedRevision: 1,
        requestKey: "overflow",
      }),
    ).rejects.toThrow("APPOINTMENT_STATE_LIMIT");
    expect(
      await f.t.run((ctx) =>
        ctx.db
          .query("painterReceipts")
          .withIndex("by_tenant_native_kind", (q) =>
            q
              .eq("tenantId", f.company.id)
              .eq("nativeKind", "estimate_appointment"),
          )
          .collect(),
      ),
    ).toHaveLength(1);
    const g = await fixture();
    await g.t.run(async (ctx) => {
      for (let i = 0; i < 513; i++)
        await ctx.db.insert("painterReceipts", {
          tenantId: g.company.id,
          requestKey: `seed:${i}`,
          fingerprint: "seed",
          result: {},
          nativeKind: "estimate_slot",
        });
    });
    await expect(g.slot()).rejects.toThrow("APPOINTMENT_STATE_LIMIT");
    expect(
      await g.t.run((ctx) =>
        ctx.db
          .query("painterEntities")
          .withIndex("by_tenant_type", (q) =>
            q.eq("tenantId", g.company.id).eq("type", "estimate_slot"),
          )
          .collect(),
      ),
    ).toEqual([]);
  });
  it("lifetime receipt capacity rejects new cancellation but exact replay stays valid", async () => {
    const f = await fixture();
    const slot = await f.slot();
    const proposal = await f.propose(slot);
    const intent = {
      appointmentId: proposal.appointment.id,
      expectedRevision: 1,
      requestKey: "approve",
    };
    await f.owner.client.mutation(api.estimateAppointments.approve, intent);
    await f.t.run(async (ctx) => {
      for (let i = 0; i < 510; i++)
        await ctx.db.insert("painterReceipts", {
          tenantId: f.company.id,
          requestKey: `seed:${i}`,
          fingerprint: "seed",
          result: { entity: { id: proposal.appointment.id } },
          nativeKind: "estimate_appointment",
        });
    });
    await expect(
      f.owner.client.mutation(api.estimateAppointments.cancel, {
        appointmentId: proposal.appointment.id,
        expectedRevision: 2,
        requestKey: "capacity-cancel",
      }),
    ).rejects.toThrow("APPOINTMENT_STATE_LIMIT");
    expect(
      await f.owner.client.mutation(api.estimateAppointments.approve, intent),
    ).toMatchObject({
      appointment: { status: "reserved_internal", revision: 2 },
      replayed: true,
    });
  });
  it("closes past slots without inventing a new future normalization", async () => {
    const f = await fixture();
    const slot = await f.slot();
    await f.t.runInComponent("betterAuth", (ctx) =>
      ctx.db.patch(f.owner.sessionId, { expiresAt: Date.parse("2026-10-14") }),
    );
    vi.setSystemTime(new Date("2026-10-12T16:00:00Z"));
    const closed = await f.owner.client.mutation(
      api.estimateAppointmentSlots.close,
      { slotId: slot.id, expectedRevision: 1, requestKey: "past-close" },
    );
    expect(closed.slot).toMatchObject({
      status: "closed",
      revision: 2,
      startAt: slot.startAt,
    });
  });
  it("pages eligible source IDs without contacts and excludes orphaned linkage", async () => {
    const f = await fixture();
    await f.t.run(async (ctx) => {
      for (let i = 0; i < 26; i++)
        await ctx.db.insert("painterEntities", {
          tenantId: f.company.id,
          entityId: `extra-lead-${i}`,
          type: "lead",
          revision: 1,
          createdAt: "test",
          updatedAt: "test",
          data: {
            name: "PRIVATE-PAGED",
            status: "qualified",
            customerId: i === 25 ? "missing-customer" : "customer",
          },
        });
    });
    const page = await f.owner.client.query(api.estimateAppointments.sources, {
      paginationOpts: { numItems: 25, cursor: null },
    });
    expect(page.done).toBe(false);
    expect(page.items).toHaveLength(24);
    expect(JSON.stringify(page)).not.toMatch(/PRIVATE|name|email/);
    const next = await f.owner.client.query(api.estimateAppointments.sources, {
      paginationOpts: { numItems: 25, cursor: page.nextCursor },
    });
    expect(next.done).toBe(true);
    expect([...page.items, ...next.items]).toHaveLength(27);
    await expect(
      f.estimator.client.query(api.estimateAppointments.sources, {
        paginationOpts: { numItems: 25, cursor: null },
      }),
    ).rejects.toThrow("APPOINTMENT_OFFICE_REQUIRED");
  });
  it("rejects foreign company candidate/context and supplied create IDs before writing", async () => {
    const f = await fixture();
    const foreign = await f.t.run((ctx) =>
      ctx.db.insert("painterWorkspaces", {
        name: "Foreign",
        ownerId: "another-owner",
        createdAt: "test",
        demo: false,
      }),
    );
    await expect(
      f.owner.client.action(api.estimateAppointmentSlots.save, {
        ...f.slotArgs(),
        workspaceId: foreign,
      }),
    ).rejects.toThrow("WORKSPACE_MEMBERSHIP_REQUIRED");
    const slot = await f.slot();
    await expect(
      f.owner.client.mutation(api.estimateAppointments.propose, {
        ...f.proposalArgs(slot),
        appointmentId: "client-created",
      }),
    ).rejects.toThrow();
    await expect(
      f.owner.client.mutation(api.estimateAppointments.propose, {
        ...f.proposalArgs(slot),
        customerId: "foreign-customer",
      }),
    ).rejects.toThrow("APPOINTMENT_QUALIFIED_SOURCE_REQUIRED");
    expect(
      await f.t.run((ctx) =>
        ctx.db
          .query("painterEntities")
          .withIndex("by_tenant_type", (q) =>
            q.eq("tenantId", f.company.id).eq("type", "estimate_appointment"),
          )
          .collect(),
      ),
    ).toEqual([]);
  });
  it("public-origin contact cannot be scheduled without explicit audited customer transfer", async () => {
    const f = await fixture();
    await f.owner.client.mutation(api.intakeConfig.configure, {
      expectedRevision: 0,
      requestKey: "guidance",
      settings: {
        enabled: true,
        servicePostalCodes: ["00501"],
        supportedProjectTypes: ["interior"],
        consentText: "Guidance only.",
      },
    });
    await f.owner.client.mutation(api.contactIntakeConfig.configure, {
      expectedRevision: 0,
      requestKey: "contacts",
      settings: {
        enabled: true,
        consentText: "Contact me about my project.",
        acknowledgeRetention: true,
      },
    });
    const result = await f.t.mutation(api.publicLead.submit, {
      workspaceId: f.company.id,
      submission: {
        requestKey: "public_opaque_nonce_000000000000000001",
        contactPolicyRevision: 1,
        guidanceRevision: 1,
        consent: true,
        contact: {
          name: "PRIVATE-VISITOR",
          email: "private-visitor@example.test",
        },
        project: {
          postalCode: "00501",
          projectType: "interior",
          scope: "PRIVATE-SCOPE",
          timeline: "Fall",
        },
      },
    });
    const publicLead = await f.t.run(async (ctx) =>
      (
        await ctx.db
          .query("painterEntities")
          .withIndex("by_tenant_type", (q) =>
            q.eq("tenantId", f.company.id).eq("type", "lead"),
          )
          .collect()
      ).find((row) => row.entityId.startsWith("intake-lead:"))!,
    );
    const slot = await f.slot();
    await expect(
      f.propose(slot, "unprocessed", publicLead.entityId),
    ).rejects.toThrow("APPOINTMENT_QUALIFIED_SOURCE_REQUIRED");
    await f.t.run((ctx) =>
      ctx.db.patch(publicLead._id, {
        data: {
          ...publicLead.data,
          status: "qualified",
          customerId: "customer",
        },
      }),
    );
    await expect(
      f.propose(slot, "forged-transfer", publicLead.entityId),
    ).rejects.toThrow("APPOINTMENT_INTAKE_TRANSFER_REQUIRED");
    await f.t.run((ctx) =>
      ctx.db.patch(publicLead._id, { data: publicLead.data }),
    );
    const qualified = await f.owner.client.mutation(api.painter.command, {
      command: {
        action: "lead.qualify",
        entityId: publicLead.entityId,
        expectedRevision: 1,
        requestKey: "explicit-transfer",
        input: {},
      },
    });
    const current = qualified.entity;
    const proposed = await f.owner.client.mutation(
      api.estimateAppointments.propose,
      {
        ...f.proposalArgs(slot, "converted", current.id),
        leadRevision: current.revision,
        customerId: current.data.customerId,
        customerRevision: 1,
      },
    );
    expect(proposed.appointment.status).toBe("proposed");
    expect(JSON.stringify(proposed)).not.toMatch(/PRIVATE-|private-visitor/);
    const receipt = await f.t.run((ctx) =>
      ctx.db
        .query("painterPublicLeadReceipts")
        .withIndex("by_tenant_entity", (q) =>
          q.eq("tenantId", f.company.id).eq("leadEntityId", current.id),
        )
        .unique(),
    );
    expect(receipt.state).toBe("converted_preserved");
    expect(result.state).toBe("received");
  });
});
