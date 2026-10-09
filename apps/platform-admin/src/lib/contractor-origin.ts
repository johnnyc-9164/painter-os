/** Navigation only. Never establishes authority or forwards a session to another origin. */
export function contractorOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    return `${url.origin}/dashboard`;
  } catch { return null; }
}
