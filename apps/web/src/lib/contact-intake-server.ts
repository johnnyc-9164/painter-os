import { api } from '@painter-os-bts/backend/convex/runtime';
import { getConvexBridge } from '@painter-os-bts/cloud-session/server';
import type { ContactIntakeSave } from './contact-intake-http';
/** Authenticated bridge only; membership and role are resolved by the existing Convex functions. */
export const contactIntakeReads = (workspaceId: string) => getConvexBridge().fetchAuthQuery(api.contactIntakeConfig.current, {workspaceId});
export const contactIntakeSave = (args: ContactIntakeSave) => getConvexBridge().fetchAuthMutation(api.contactIntakeConfig.configure, args);
/** Preview = the two existing anonymous public projections, read only after the owner/office-admin gate passes. No draft, no writer. */
export async function contactIntakePreview(workspaceId: string) {
  await contactIntakeReads(workspaceId);
  const bridge = getConvexBridge();
  const [guidance, contact] = await Promise.all([bridge.fetchAuthQuery(api.intakeConfig.publicPolicy, {workspaceId}), bridge.fetchAuthQuery(api.contactIntakeConfig.publicPolicy, {workspaceId})]);
  return {guidance, contact};
}
