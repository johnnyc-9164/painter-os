export interface HttpErrorResult {
  error: string;
  status: 400 | 401 | 403 | 404 | 409 | 429 | 503;
}

/** Extract the application error, not Convex request metadata or stack frames. */
export function mapHttpError(error: unknown): HttpErrorResult {
  const message = error instanceof Error ? error.message : 'INTERNAL_ERROR';
  const codeLine = message.match(/(?:^|\n)Uncaught Error: ([A-Z][A-Z_]+(?::[^\r\n]*)?)(?:\r?\n|$)/)?.[1]
    ?? message.match(/^(?:Error: )?([A-Z][A-Z_]+(?::[^\r\n]*)?)(?:\r?\n|$)/)?.[1]
    ?? 'INTERNAL_ERROR';
  const status = /UNAUTHENTICATED|INVALID_CREDENTIALS/.test(codeLine) ? 401
    : /FORBIDDEN|OWNER_REQUIRED|INVALID_ORIGIN|BOUNDARY|DENIED|LOCAL_ACCEPTANCE/.test(codeLine) ? 403
    : /NOT_FOUND|INVALID_OR_EXPIRED/.test(codeLine) ? 404
    : /RATE_LIMITED/.test(codeLine) ? 429
    : /DEPLOYMENT_NOT_CONFIGURED|AUTH_BACKEND_NOT_CONFIGURED/.test(codeLine) ? 503
    : /REVISION_CONFLICT|KEY_CONFLICT|DUPLICATE/.test(codeLine) ? 409 : 400;
  return {error: codeLine, status};
}
