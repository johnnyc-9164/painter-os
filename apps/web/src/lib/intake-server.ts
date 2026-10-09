import { api } from '@painter-os-bts/backend/convex/runtime';
import { getConvexBridge } from '@painter-os-bts/cloud-session/server';
import type { IntakeSave } from './intake-http';
export const intakeReads = (workspaceId: string) => getConvexBridge().fetchAuthQuery(api.intakeConfig.current, {workspaceId});
export const intakeSave = (args: IntakeSave) => getConvexBridge().fetchAuthMutation(api.intakeConfig.configure, args);
