import { internalMutationGeneric, type MutationBuilder } from 'convex/server';
import { v } from 'convex/values';
import type { DataModel } from './runtime';
import { aiCapability, aiAttemptKind, aiBilling } from './aiValidators';
import { requireAiAccess, settleStoredUsage } from './aiUsageStore';
const internalMutation=internalMutationGeneric as MutationBuilder<DataModel,'internal'>;
/** No registry/provider commercial activation exists. There is deliberately no true setter. */
export function providerPermissionAvailable():false{return false;}
export const reserve=internalMutation({args:{workspaceId:v.id('painterWorkspaces'),userId:v.string(),operationId:v.string(),capability:aiCapability,maxAttempts:v.number()},handler:async(ctx,args)=>{
  await requireAiAccess(ctx,args.workspaceId,args.userId,args.capability,Date.now());
  if(!providerPermissionAvailable())throw new Error('AI_PROVIDER_NOT_AUTHORIZED');
  throw new Error('AI_PROVIDER_NOT_AUTHORIZED');
}});
export const claimAttempt=internalMutation({args:{reservationId:v.id('aiUsageReservations'),userId:v.string(),attemptId:v.string(),kind:aiAttemptKind},handler:async(ctx,args)=>{
  const reservation=await ctx.db.get(args.reservationId);
  if(!reservation||reservation.userId!==args.userId)throw new Error('AI_RESERVATION_REQUIRED');
  await requireAiAccess(ctx,reservation.tenantId,args.userId,reservation.capability,Date.now());
  throw new Error('AI_PROVIDER_NOT_AUTHORIZED');
}});
/** Internal operator/worker boundary, not connected to a provider. No public billable flag. */
export const settle=internalMutation({args:{reservationId:v.id('aiUsageReservations'),userId:v.string(),settlementId:v.string(),attempts:v.array(v.object({attemptId:v.string(),kind:aiAttemptKind,billing:aiBilling}))},handler:settleStoredUsage});
