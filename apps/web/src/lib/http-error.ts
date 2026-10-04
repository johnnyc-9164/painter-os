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
  const code = codeLine.split(':', 1)[0];
  const status = /UNAUTHENTICATED|INVALID_CREDENTIALS/.test(code) ? 401
    : /FORBIDDEN|OWNER_REQUIRED|INVALID_ORIGIN|BOUNDARY|DENIED|LOCAL_ACCEPTANCE/.test(code) ? 403
    : /NOT_FOUND|INVALID_OR_EXPIRED/.test(code) ? 404
    : /RATE_LIMITED/.test(code) ? 429
    : /DEPLOYMENT_NOT_CONFIGURED|AUTH_BACKEND_NOT_CONFIGURED/.test(code) ? 503
    : /REVISION_CONFLICT|KEY_CONFLICT|DUPLICATE/.test(code) ? 409 : 400;
  return {error: codeLine, status};
}
