/** Convex-supported Web Crypto. Hash canonical host-derived bytes, never browser digests. */
export async function intakeDigest(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
export function intakeCommandReceiptKey(tenantId: string, requestKey: string): Promise<string> {
  return intakeDigest(JSON.stringify(['intake.command', tenantId, requestKey])).then(digest => `intake.command:${digest}`);
}
export function intakeSubmissionReference(tenantId: string, requestKey: string): Promise<string> {
  return intakeDigest(JSON.stringify(['intake.submission', tenantId, requestKey]));
}
