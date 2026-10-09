import { z } from 'zod';
import { PLATFORM_MAX_CURSOR_LENGTH, PLATFORM_MAX_PAGE_SIZE, type PlatformActivityPage, type PlatformAccess, type PlatformFailure, type WorkspaceDetail, type WorkspacePage } from '@painter-os-bts/backend/platform-contract';

export type PlatformSection = 'overview' | 'workspaces' | 'detail' | 'sites' | 'health' | 'access' | 'activity' | 'billing' | 'login';
export type PlatformResult = PlatformAccess | PlatformActivityPage | WorkspacePage | WorkspaceDetail | PlatformFailure | { state: 'loading' };
const failure = z.union([
  z.object({ state: z.enum(['unauthenticated', 'denied', 'not_found', 'invalid_request']) }).strict(),
  z.object({ state: z.literal('unavailable'), reason: z.enum(['local_runtime', 'not_configured', 'backend_unavailable']) }).strict(),
]);
const summary = z.object({ id: z.string(), name: z.string(), createdAt: z.string(), demo: z.boolean() }).strict();
const access = z.object({ state: z.literal('ready') }).strict();
const page = z.object({ state: z.literal('ready'), items: z.array(summary).max(PLATFORM_MAX_PAGE_SIZE), nextCursor: z.string().min(1).max(PLATFORM_MAX_CURSOR_LENGTH).nullable() }).strict();
const activity = z.object({ state: z.literal('ready'), items: z.array(z.object({ id: z.string(), action: z.enum(['bootstrap', 'revoke']), occurredAt: z.number().finite(), beforeEnabled: z.boolean(), afterEnabled: z.boolean() }).strict()).max(PLATFORM_MAX_PAGE_SIZE), nextCursor: z.string().min(1).max(PLATFORM_MAX_CURSOR_LENGTH).nullable() }).strict();
const detail = z.object({ state: z.literal('ready'), workspace: summary }).strict();

export function decodePlatformResult(section: PlatformSection, input: unknown): PlatformResult {
  return z.union([section === 'activity' ? activity : section === 'workspaces' ? page : section === 'detail' ? detail : access, failure]).parse(input);
}
export async function readPlatform(section: PlatformSection, url: string, signal: AbortSignal): Promise<PlatformResult> {
  const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin', signal });
  const result = decodePlatformResult(section, await response.json());
  const status: Record<string, number> = { ready: 200, unauthenticated: 401, denied: 403, not_found: 404, invalid_request: 400, unavailable: 503 };
  if (status[result.state] !== response.status) throw new Error('INVALID_PLATFORM_RESPONSE');
  return result;
}
