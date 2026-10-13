/** Backend-only origin selection. Configuration is not domain ownership or a session grant. */
const maxAdditionalOrigins = 8;
// The only wildcard entries accepted: Vercel preview hosts scoped to this project and team.
const previewOriginPatterns: ReadonlySet<string> = new Set([
  'https://painter-os-*-johnnyc.vercel.app',
  'https://painter-os-git-*-johnnyc.vercel.app',
]);
const invalid = () => new Error('INVALID_AUTH_TRUSTED_ORIGINS');

export function painterAuthOrigins(siteUrl: string, configured?: string): string[] {
  // Preserve the current SITE_URL/development behavior when the new option is absent.
  if (configured === undefined) return [siteUrl];
  if (configured.length > 4096) throw invalid();
  let entries: unknown;
  try { entries = JSON.parse(configured); } catch { throw invalid(); }
  if (!Array.isArray(entries) || entries.length > maxAdditionalOrigins) throw invalid();
  for (const entry of entries) {
    if (typeof entry !== 'string') throw invalid();
    if (previewOriginPatterns.has(entry)) continue;
    try {
      const url = new URL(entry);
      const label = url.hostname.split('.')[0];
      if (url.protocol !== 'https:' || url.origin !== entry || url.port || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash || label.length > 63 ||
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.vercel\.app$/.test(url.hostname)) throw invalid();
    } catch { throw invalid(); }
  }
  return [...new Set([siteUrl, ...entries as string[]])];
}
