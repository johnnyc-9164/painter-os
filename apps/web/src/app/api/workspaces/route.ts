import { NextRequest } from 'next/server';
import { api } from '@painter-os-bts/backend/convex/runtime';
import { getConvexBridge } from '@/lib/auth-server';
import { actor, body, error, reply, requireOrigin } from '@/lib/http';
import { localEnabled, snapshotLocal } from '@/lib/local-runtime';
import { workspaceName } from '@/lib/workspace-onboarding';

export const runtime = 'nodejs';

/** Initial setup only. Existing membership is reused; this is not a rename,
 * workspace selector, demo creator, or a second membership writer. */
export async function POST(request: NextRequest) {
  try {
    requireOrigin(request);
    const name = workspaceName(await body(request));
    if (localEnabled()) return reply({ workspace: snapshotLocal(actor(request)).workspace });
    const workspace = await getConvexBridge().fetchAuthMutation(api.painter.createWorkspace, { name, onlyIfNone: true });
    return reply({ workspace });
  } catch (e) {
    return error(e);
  }
}
