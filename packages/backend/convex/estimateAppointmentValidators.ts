import { v, type Infer } from "convex/values";
import type {
  EstimateSlot,
  EstimateAppointment,
} from "../../domain/src/estimate-appointments";
export const nativeFlags = {
  nativeOnly: v.literal(true),
  customerNotified: v.literal(false),
  externalCalendarsChecked: v.literal(false),
};
export const slotFields = {
  id: v.string(),
  tenantId: v.string(),
  revision: v.number(),
  resourceId: v.string(),
  status: v.union(v.literal("offered"), v.literal("closed")),
  localStart: v.string(),
  offset: v.string(),
  timeZone: v.string(),
  startAt: v.string(),
  endAt: v.string(),
  durationMinutes: v.number(),
  bufferBeforeMinutes: v.number(),
  bufferAfterMinutes: v.number(),
};
export const estimateSlotValidator = v.object(slotFields);
export const appointmentFields = {
  id: v.string(),
  tenantId: v.string(),
  revision: v.number(),
  status: v.union(
    v.literal("proposed"),
    v.literal("reserved_internal"),
    v.literal("cancelled"),
  ),
  leadId: v.string(),
  leadRevision: v.number(),
  customerId: v.string(),
  customerRevision: v.number(),
  slotId: v.string(),
  slotRevision: v.number(),
  resourceId: v.string(),
  timeZone: v.string(),
  startAt: v.string(),
  endAt: v.string(),
  durationMinutes: v.number(),
  bufferBeforeMinutes: v.number(),
  bufferAfterMinutes: v.number(),
  proposedBy: v.string(),
  approvedBy: v.optional(v.string()),
  cancelledBy: v.optional(v.string()),
};
export const estimateAppointmentValidator = v.object(appointmentFields);
export const slotResultValidator = v.object({
  slot: estimateSlotValidator,
  replayed: v.boolean(),
  ...nativeFlags,
});
export const appointmentResultValidator = v.object({
  appointment: estimateAppointmentValidator,
  replayed: v.boolean(),
  ...nativeFlags,
});
export const slotWriteArgs = {
  workspaceId: v.optional(v.id("painterWorkspaces")),
  slotId: v.optional(v.string()),
  expectedRevision: v.number(),
  requestKey: v.string(),
  resourceId: v.string(),
  localStart: v.string(),
  timeZone: v.string(),
  offset: v.string(),
  durationMinutes: v.number(),
  bufferBeforeMinutes: v.number(),
  bufferAfterMinutes: v.number(),
};
export const appointmentBaseArgs = {
  workspaceId: v.optional(v.id("painterWorkspaces")),
  appointmentId: v.string(),
  expectedRevision: v.number(),
  requestKey: v.string(),
};
export const appointmentSelectionArgs = {
  slotId: v.string(),
  slotRevision: v.number(),
  leadRevision: v.number(),
  customerRevision: v.number(),
};
type Assert<T extends true> = T;
export type SlotTransportCheck = Assert<
  Infer<typeof estimateSlotValidator> extends EstimateSlot ? true : false
>;
export type AppointmentTransportCheck = Assert<
  Infer<typeof estimateAppointmentValidator> extends EstimateAppointment
    ? true
    : false
>;
