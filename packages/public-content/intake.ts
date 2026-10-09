import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { decodePublicIntake, type PublicIntakeResult } from '@painter-os-bts/backend/intake-contract';
const publicPolicy = makeFunctionReference<'query', {workspaceId: string}, unknown>('intakeConfig:publicPolicy');
export async function readPublicIntake(url: string | undefined, workspaceId: string): Promise<PublicIntakeResult> {
  if (!url) throw new Error('PUBLIC_CONTENT_NOT_CONFIGURED');
  return decodePublicIntake(await new ConvexHttpClient(url).query(publicPolicy, {workspaceId}));
}
