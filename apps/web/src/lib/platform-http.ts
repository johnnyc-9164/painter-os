import { PLATFORM_MAX_CURSOR_LENGTH, PLATFORM_MAX_PAGE_SIZE, PLATFORM_PAGE_SIZE, type PlatformAccess, type PlatformUnavailable, type WorkspaceDetail, type WorkspacePage } from '@painter-os-bts/backend/platform-contract';

export interface PlatformReads {
  access(): Promise<PlatformAccess | PlatformUnavailable>;
  list(args: { cursor: string | null; limit: number }): Promise<WorkspacePage | PlatformUnavailable>;
  get(id: string): Promise<WorkspaceDetail | PlatformUnavailable>;
}

function reply<T extends { state: string }>(result: T) {
  const statuses: Record<string, number> = { ready: 200, unauthenticated: 401, denied: 403, not_found: 404, invalid_request: 400, unavailable: 503 };
  const status = statuses[result.state] ?? 503;
  return Response.json(result, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
}
function failure(error: unknown) {
  // Never return upstream hosts, stack frames, request IDs or arbitrary backend messages.
  const message = error instanceof Error ? error.message : '';
  const invalid = /(?:^|\n)(?:Uncaught Error: )?INVALID_PLATFORM_(?:PAGINATION|WORKSPACE)(?:\r?\n|$)/.test(message);
  return reply(invalid ? { state: 'invalid_request' } : { state: 'unavailable', reason: 'backend_unavailable' });
}
export async function platformAccessResponse(reads: PlatformReads): Promise<Response> {
  try { return reply(await reads.access()); } catch (error) { return failure(error); }
}
export async function platformWorkspacesResponse(request: Request, reads: PlatformReads): Promise<Response> {
  try {
    const query = new URL(request.url).searchParams;
    if ([...query.keys()].some(key => !['cursor', 'limit'].includes(key)) || query.getAll('cursor').length > 1 || query.getAll('limit').length > 1) return reply({ state: 'invalid_request' });
    const cursor = query.get('cursor');
    const rawLimit = query.get('limit');
    const limit = rawLimit === null ? PLATFORM_PAGE_SIZE : Number(rawLimit);
    if ((rawLimit !== null && !/^\d+$/.test(rawLimit)) || !Number.isInteger(limit) || limit < 1 || limit > PLATFORM_MAX_PAGE_SIZE || (cursor !== null && (!cursor || cursor.length > PLATFORM_MAX_CURSOR_LENGTH))) return reply({ state: 'invalid_request' });
    return reply(await reads.list({ cursor, limit }));
  } catch (error) { return failure(error); }
}
export async function platformWorkspaceResponse(id: string, reads: PlatformReads): Promise<Response> {
  try { return reply(await reads.get(id)); } catch (error) { return failure(error); }
}
