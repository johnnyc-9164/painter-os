import {intakeProjectTypes, type IntakeProjectType} from './intake-contract';

export const CONTACT_RETENTION_DAYS = 30 as const;
export const CONTACT_RETENTION_DISCLOSURE = 'Unprocessed requests are deleted after 30 days. Editing, contacting or closing a request does not extend this period. If the company converts your request into a customer record, it manages the retention of that customer record separately.';
export interface ContactIntakeSettings {enabled: boolean; consentText: string; acknowledgeRetention: boolean}
export interface PublicContactSubmission {
  requestKey: string; contactPolicyRevision: number; guidanceRevision: number; consent: true;
  contact: {name: string; email?: string; phone?: string};
  project: {postalCode: string; projectType: IntakeProjectType | 'other'; scope: string; timeline: string};
}
export type PublicSubmissionProof = {state: 'received'|'deletion_pending'|'deleted'|'converted_preserved'; reference: string};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_CONTACT_INTAKE');
  return value as Record<string, unknown>;
}
function keys(input: Record<string, unknown>, allowed: readonly string[]): void {
  for (const key of Object.keys(input)) if (!allowed.includes(key)) throw new Error(`UNKNOWN_FIELD:${key}`);
}
function text(value: unknown, key: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`INVALID_CONTACT_STRING:${key}`);
  return value.trim();
}
function revision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) throw new Error('INVALID_CONTACT_REVISION');
  return value as number;
}
export function validateContactIntakeSettings(value: unknown): ContactIntakeSettings {
  const input = record(value);
  keys(input, ['enabled', 'consentText', 'acknowledgeRetention']);
  if (typeof input.enabled !== 'boolean' || typeof input.acknowledgeRetention !== 'boolean' || typeof input.consentText !== 'string' || input.consentText.length > 1000) throw new Error('INVALID_CONTACT_INTAKE');
  const consentText = input.consentText.trim();
  if (input.enabled && (!consentText || !input.acknowledgeRetention)) throw new Error('CONTACT_POLICY_ACKNOWLEDGEMENT_REQUIRED');
  return {enabled: input.enabled, consentText, acknowledgeRetention: input.acknowledgeRetention};
}

/** No caller digest, actor, source, lead status or customer linkage is accepted. */
export function validatePublicContactSubmission(value: unknown): PublicContactSubmission {
  const input = record(value);
  keys(input, ['requestKey', 'contactPolicyRevision', 'guidanceRevision', 'consent', 'contact', 'project']);
  if (typeof input.requestKey !== 'string' || !/^[A-Za-z0-9_-]{32,80}$/.test(input.requestKey)) throw new Error('INVALID_CONTACT_REFERENCE');
  if (input.consent !== true) throw new Error('CONTACT_CONSENT_REQUIRED');
  const contact = record(input.contact);
  keys(contact, ['name', 'email', 'phone']);
  const name = text(contact.name, 'name', 120);
  const email = contact.email === undefined ? undefined : text(contact.email, 'email', 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('INVALID_EMAIL');
  const phone = contact.phone === undefined ? undefined : text(contact.phone, 'phone', 40);
  if (!email && !phone) throw new Error('CONTACT_METHOD_REQUIRED');
  const project = record(input.project);
  keys(project, ['postalCode', 'projectType', 'scope', 'timeline']);
  if (typeof project.postalCode !== 'string' || !/^\d{5}$/.test(project.postalCode)) throw new Error('INVALID_CONTACT_POSTAL_CODE');
  if (project.projectType !== 'other' && !intakeProjectTypes.includes(project.projectType as IntakeProjectType)) throw new Error('INVALID_CONTACT_PROJECT_TYPE');
  return {
    requestKey: input.requestKey, contactPolicyRevision: revision(input.contactPolicyRevision), guidanceRevision: revision(input.guidanceRevision), consent: true,
    contact: {name, ...(email ? {email} : {}), ...(phone ? {phone} : {})},
    project: {postalCode: project.postalCode, projectType: project.projectType as IntakeProjectType|'other', scope: text(project.scope, 'scope', 2000), timeline: text(project.timeline, 'timeline', 200)},
  };
}

/** Strict normalization establishes digest bytes; cryptographic hashing belongs to the host. */
export function publicSubmissionFingerprintPayload(workspaceId: string, value: unknown): string {
  return JSON.stringify({workspaceId, submission: validatePublicContactSubmission(value)});
}
