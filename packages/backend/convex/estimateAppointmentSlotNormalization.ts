"use node";
import { appointmentBoundary } from "./estimateAppointmentErrors";
import { internalActionGeneric, type ActionBuilder } from "convex/server";
import { api, type DataModel } from "./runtime";
import {
  estimateSlotInstant,
  validateEstimateSlotTiming,
} from "../../domain/src/estimate-appointments";
import {
  slotWriteArgs,
  slotResultValidator,
} from "./estimateAppointmentValidators";
const internalAction = internalActionGeneric as ActionBuilder<
  DataModel,
  "internal"
>;
/** ICU timezone authority runs in Node; transaction rechecks clock/role/resource. */
export const normalize = internalAction({
  args: slotWriteArgs,
  returns: slotResultValidator,
  handler: async (ctx, args) =>
    appointmentBoundary(async () => {
      const authority = await ctx.runQuery(
        api.estimateAppointmentSlots.authority,
        args,
      );
      if (authority.replay) return authority.replay;
      validateEstimateSlotTiming(args);
      const normalizedInstant = estimateSlotInstant(
        args.localStart,
        args.timeZone,
        args.offset,
      );
      return ctx.runMutation(api.estimateAppointmentSlots.commitNormalized, {
        ...args,
        workspaceId: authority.workspaceId,
        normalizedInstant,
      });
    }),
});
