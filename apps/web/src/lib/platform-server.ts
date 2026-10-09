import { api } from '@painter-os-bts/backend/convex/runtime';
import type { PlatformUnavailable } from '@painter-os-bts/backend/platform-contract';
import { getConvexBridge } from './auth-server';
import type { PlatformReads } from './platform-http';

function unavailable(): PlatformUnavailable | null {
  if (process.env.PAINTER_RUNTIME === 'local') return { state: 'unavailable', reason: 'local_runtime' };
  if (!process.env.NEXT_PUBLIC_CONVEX_URL || !process.env.NEXT_PUBLIC_CONVEX_SITE_URL) return { state: 'unavailable', reason: 'not_configured' };
  return null;
}
/** Existing Better Auth session bridge only. Never calls snapshot or creates a workspace. */
export const platformReads: PlatformReads = {
  activity: async args => unavailable() ?? await getConvexBridge().fetchAuthQuery(api.platformActivity.list, args),
  access: async () => unavailable() ?? await getConvexBridge().fetchAuthQuery(api.platformInventory.access, {}),
  list: async args => unavailable() ?? await getConvexBridge().fetchAuthQuery(api.platformInventory.list, args),
  get: async id => unavailable() ?? await getConvexBridge().fetchAuthQuery(api.platformInventory.get, { id }),
};
