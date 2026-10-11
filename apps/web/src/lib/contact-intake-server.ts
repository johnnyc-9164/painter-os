import { api } from '@painter-os-bts/backend/convex/runtime';
import { getConvexBridge } from '@painter-os-bts/cloud-session/server';
import type { ContactIntakeSave } from './contact-intake-http';
/** Authenticated bridge only; membership and role are resolved by the existing Convex functions. */
export const contactIntakeReads = (workspaceId: string) => getConvexBridge().fetchAuthQuery(api.contactIntakeConfig.current, {workspaceId});
export const contactIntakeSave = (args: ContactIntakeSave) => getConvexBridge().fetchAuthMutation(api.contactIntakeConfig.configure, args);
