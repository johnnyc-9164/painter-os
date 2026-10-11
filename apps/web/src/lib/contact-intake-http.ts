import { decodePublicIntake, type PublicIntakeResult } from '@painter-os-bts/backend/intake-contract';
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
export type ContactPublicPolicy = {state: 'unavailable'} | {state: 'ready'; policy: {companyName: string; contactPolicyRevision: number; guidanceRevision: number; consentText: string}};
export interface ContactPreview { guidance: PublicIntakeResult; contact: ContactPublicPolicy }
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
function decodeContactPublic(value: unknown): ContactPublicPolicy {
  if (!isRecord(value)) throw new Error('INVALID_CONTACT_PREVIEW_RESPONSE');
  if (value.state === 'unavailable' && Object.keys(value).length === 1) return {state: 'unavailable'};
  const p = value.policy;
  if (value.state !== 'ready' || Object.keys(value).length !== 2 || !isRecord(p) || Object.keys(p).length !== 6) throw new Error('INVALID_CONTACT_PREVIEW_RESPONSE');
  if (typeof p.companyName !== 'string' || !p.companyName.trim() || p.companyName.length > 120 || typeof p.consentText !== 'string' || !p.consentText.trim() || p.consentText.length > 1000) throw new Error('INVALID_CONTACT_PREVIEW_RESPONSE');
  if (!Number.isSafeInteger(p.contactPolicyRevision) || !Number.isSafeInteger(p.guidanceRevision) || p.retentionDays !== CONTACT_RETENTION_DAYS || p.retentionDisclosure !== CONTACT_RETENTION_DISCLOSURE) throw new Error('INVALID_CONTACT_PREVIEW_RESPONSE');
  return {state: 'ready', policy: {companyName: p.companyName, contactPolicyRevision: p.contactPolicyRevision as number, guidanceRevision: p.guidanceRevision as number, consentText: p.consentText}};
}
/** Strict decode of the two public projections the real /estimate-request page and contact ingress already use. */
export function decodeContactPreview(input: unknown): ContactPreview {
  if (!isRecord(input) || Object.keys(input).length !== 2 || !('guidance' in input) || !('contact' in input)) throw new Error('INVALID_CONTACT_PREVIEW_RESPONSE');
  return {guidance: decodePublicIntake(input.guidance), contact: decodeContactPublic(input.contact)};
}
export type PreviewState = 'public' | 'guidance_off' | 'contact_off';
/** Mirrors the backend: contact is ready only when BOTH policies are enabled. */
export function previewState(p: ContactPreview): PreviewState {
  if (p.guidance.state === 'unavailable') return 'guidance_off';
  return p.contact.state === 'ready' ? 'public' : 'contact_off';
}
