import { platformWorkspaceResponse } from '@/lib/platform-http';
import { platformReads } from '@/lib/platform-server';
export const runtime = 'nodejs';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return platformWorkspaceResponse((await params).id, platformReads);
}
