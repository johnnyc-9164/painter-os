/** Public read-only platform DTOs. No user IDs, members, operational rows or provider configuration. */
export type PlatformAccess = { state: 'ready' | 'unauthenticated' | 'denied' };
export interface WorkspaceSummary { id: string; name: string; createdAt: string; demo: boolean }
export type WorkspacePage = { state: 'ready'; items: WorkspaceSummary[]; nextCursor: string | null }
  | { state: 'unauthenticated' | 'denied' };
export type WorkspaceDetail = { state: 'ready'; workspace: WorkspaceSummary }
  | { state: 'unauthenticated' | 'denied' | 'not_found' };
export type PlatformUnavailable = { state: 'unavailable'; reason: 'local_runtime' | 'not_configured' | 'backend_unavailable' };
export type PlatformFailure = PlatformUnavailable | { state: 'invalid_request' };
export const PLATFORM_PAGE_SIZE = 20;
export const PLATFORM_MAX_PAGE_SIZE = 50;
export const PLATFORM_MAX_CURSOR_LENGTH = 4096;
