import { platformWorkspaceResponse } from '@painter-os-bts/platform/http';
import { platformReads } from '@painter-os-bts/platform/server';
export const runtime = 'nodejs';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return platformWorkspaceResponse((await params).id, platformReads);
}
