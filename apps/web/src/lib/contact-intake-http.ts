import { CONTACT_RETENTION_DAYS, CONTACT_RETENTION_DISCLOSURE, validateContactIntakeSettings, type ContactIntakeSettings } from '@painter-os-bts/backend/public-lead-contract';
export type SavedContactIntake = ContactIntakeSettings & { revision: number };
export interface ContactIntakeSave { workspaceId: string; expectedRevision: number; requestKey: string; settings: ContactIntakeSettings }
export { CONTACT_RETENTION_DAYS, CONTACT_RETENTION_DISCLOSURE };
/** Only a workspace candidate, expected revision, intent key and canonical settings cross the browser boundary. */
export function parseContactIntakeSave(input: Record<string, unknown>): ContactIntakeSave {
  for (const key of Object.keys(input)) if (!['workspaceId', 'expectedRevision', 'requestKey', 'settings'].includes(key)) throw new Error(`UNKNOWN_FIELD:${key}`);
  if (typeof input.workspaceId !== 'string' || !input.workspaceId || input.workspaceId.length > 200) throw new Error('INVALID_CONTACT_CONFIG_REQUEST');
  if (!Number.isSafeInteger(input.expectedRevision) || (input.expectedRevision as number) < 0 || typeof input.requestKey !== 'string' || !input.requestKey.trim() || input.requestKey.length > 180) throw new Error('INVALID_CONTACT_CONFIG_REQUEST');
  return {workspaceId: input.workspaceId, expectedRevision: input.expectedRevision as number, requestKey: input.requestKey, settings: validateContactIntakeSettings(input.settings)};
}
/** Decodes the private policy row (or null = absent = disabled) strictly; extra metadata is rejected. */
export function decodeContactPolicy(value: unknown): SavedContactIntake | null {
  if (value === null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_CONTACT_CONFIG_RESPONSE');
  const row = value as Record<string, unknown>;
  const allowed = ['enabled', 'consentText', 'acknowledgeRetention', 'revision', 'retentionDays', 'retentionDisclosure'];
  if (Object.keys(row).length !== allowed.length || allowed.some(key => !(key in row))) throw new Error('INVALID_CONTACT_CONFIG_RESPONSE');
  if (!Number.isSafeInteger(row.revision) || (row.revision as number) < 1 || row.retentionDays !== CONTACT_RETENTION_DAYS || row.retentionDisclosure !== CONTACT_RETENTION_DISCLOSURE) throw new Error('INVALID_CONTACT_CONFIG_RESPONSE');
  try { return {...validateContactIntakeSettings({enabled: row.enabled, consentText: row.consentText, acknowledgeRetention: row.acknowledgeRetention}), revision: row.revision as number}; }
  catch { throw new Error('INVALID_CONTACT_CONFIG_RESPONSE'); }
}
export function decodeContactRead(input: unknown): SavedContactIntake | null {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 1 || !('settings' in input)) throw new Error('INVALID_CONTACT_CONFIG_RESPONSE');
  return decodeContactPolicy(input.settings);
}
export type ContactFailure = 'conflict' | 'auth' | 'invalid' | 'unknown';
/** A fetch failure (no status), 5xx or malformed body is unknown: the write may have committed. Only 401/403 are confirmed denials. */
export function classifyContactFailure(status: number | undefined): ContactFailure {
  if (status === 409) return 'conflict';
  if (status === 401 || status === 403) return 'auth';
  if (status === 400) return 'invalid';
  return 'unknown';
}
export function decodeContactWrite(input: unknown): {revision: number; enabled: boolean; replayed: boolean} {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('INVALID_CONTACT_CONFIG_RESPONSE');
  const row = input as Record<string, unknown>;
  if (Object.keys(row).length !== 3 || !Number.isSafeInteger(row.revision) || (row.revision as number) < 1 || typeof row.enabled !== 'boolean' || typeof row.replayed !== 'boolean') throw new Error('INVALID_CONTACT_CONFIG_RESPONSE');
  return {revision: row.revision as number, enabled: row.enabled, replayed: row.replayed};
}
