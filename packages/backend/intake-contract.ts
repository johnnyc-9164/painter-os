/** Company-owned intake policy. This contract grants no business-command or booking authority. */
export const intakeProjectTypes = ['interior', 'exterior', 'commercial'] as const;
export type IntakeProjectType = typeof intakeProjectTypes[number];
export interface IntakeSettings {
  enabled: boolean;
  servicePostalCodes: string[];
  supportedProjectTypes: IntakeProjectType[];
  consentText: string;
}
export interface PublicIntake extends IntakeSettings { companyName: string; revision: number }
export type PublicIntakeResult = { state: 'ready'; intake: PublicIntake } | { state: 'unavailable' };
export interface SavedIntakeSettings extends IntakeSettings { revision: number }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_INTAKE_CONFIG');
  return value as Record<string, unknown>;
}
export function validateIntakeSettings(value: unknown): IntakeSettings {
  const input = record(value);
  for (const key of Object.keys(input)) if (!['enabled', 'servicePostalCodes', 'supportedProjectTypes', 'consentText'].includes(key)) throw new Error(`UNKNOWN_FIELD:${key}`);
  if (typeof input.enabled !== 'boolean' || !Array.isArray(input.servicePostalCodes) || input.servicePostalCodes.length > 200 || !input.servicePostalCodes.every(code => typeof code === 'string' && /^\d{5}$/.test(code))) throw new Error('INVALID_INTAKE_CONFIG');
  if (!Array.isArray(input.supportedProjectTypes) || input.supportedProjectTypes.length > intakeProjectTypes.length || !input.supportedProjectTypes.every(type => intakeProjectTypes.includes(type))) throw new Error('INVALID_INTAKE_CONFIG');
  if (typeof input.consentText !== 'string' || input.consentText.length > 1000) throw new Error('INVALID_INTAKE_CONFIG');
  const servicePostalCodes = [...new Set(input.servicePostalCodes)].sort();
  const supportedProjectTypes = intakeProjectTypes.filter(type => (input.supportedProjectTypes as unknown[]).includes(type));
  const consentText = input.consentText.trim();
  if (input.enabled && (!servicePostalCodes.length || !supportedProjectTypes.length || !consentText)) throw new Error('INTAKE_POLICY_REQUIRED');
  return { enabled: input.enabled, servicePostalCodes, supportedProjectTypes, consentText };
}

/** Strict transport projection: reject extra fields rather than exposing private data. */
export function decodeSavedIntake(value: unknown): SavedIntakeSettings | null {
  if (value === null) return null;
  const input = record(value);
  for (const key of Object.keys(input)) if (!['enabled', 'servicePostalCodes', 'supportedProjectTypes', 'consentText', 'revision'].includes(key)) throw new Error('INVALID_INTAKE_RESPONSE');
  if (!Number.isSafeInteger(input.revision) || (input.revision as number) < 1) throw new Error('INVALID_INTAKE_RESPONSE');
  return {...validateIntakeSettings({enabled: input.enabled, servicePostalCodes: input.servicePostalCodes, supportedProjectTypes: input.supportedProjectTypes, consentText: input.consentText}), revision: input.revision as number};
}
export function decodePublicIntake(value: unknown): PublicIntakeResult {
  const input = record(value);
  if (input.state === 'unavailable' && Object.keys(input).length === 1) return {state: 'unavailable'};
  if (input.state !== 'ready' || Object.keys(input).length !== 2) throw new Error('INVALID_INTAKE_RESPONSE');
  const policy = record(input.intake);
  if (typeof policy.companyName !== 'string' || !policy.companyName.trim() || policy.companyName.length > 120) throw new Error('INVALID_INTAKE_RESPONSE');
  const {companyName, ...fields} = policy;
  const saved = decodeSavedIntake(fields);
  if (!saved?.enabled) throw new Error('INVALID_INTAKE_RESPONSE');
  return {state: 'ready', intake: {...saved, companyName: companyName as string}};
}

export interface QualificationAnswers { postalCode?: string; projectType?: IntakeProjectType | 'other'; scope?: string; timeline?: string }
export interface QualificationRecommendation {
  outcome: 'eligible_for_follow_up' | 'outside_service_area' | 'unsupported_project' | 'needs_review';
  appointmentStatus: 'not_booked';
}
/** Pure advisory assessment. ZIP coverage is explicitly US-only; no inferred geography,
 * prices, appointment availability, persistence, lead transition, or external dispatch. */
export function assessQualification(settings: IntakeSettings, value: unknown): QualificationRecommendation {
  const policy = validateIntakeSettings({enabled: settings.enabled, servicePostalCodes: settings.servicePostalCodes, supportedProjectTypes: settings.supportedProjectTypes, consentText: settings.consentText});
  const input = record(value);
  for (const key of Object.keys(input)) if (!['postalCode', 'projectType', 'scope', 'timeline'].includes(key)) throw new Error(`UNKNOWN_FIELD:${key}`);
  if (input.postalCode !== undefined && (typeof input.postalCode !== 'string' || !/^\d{5}$/.test(input.postalCode))) throw new Error('INVALID_INTAKE_ANSWERS');
  if (input.projectType !== undefined && input.projectType !== 'other' && !intakeProjectTypes.includes(input.projectType as IntakeProjectType)) throw new Error('INVALID_INTAKE_ANSWERS');
  for (const key of ['scope', 'timeline']) if (input[key] !== undefined && (typeof input[key] !== 'string' || (input[key] as string).length > (key === 'scope' ? 2000 : 200))) throw new Error('INVALID_INTAKE_ANSWERS');
  let outcome: QualificationRecommendation['outcome'] = 'needs_review';
  if (policy.enabled && input.postalCode && input.projectType && typeof input.scope === 'string' && input.scope.trim() && typeof input.timeline === 'string' && input.timeline.trim()) {
    outcome = !policy.servicePostalCodes.includes(input.postalCode as string) ? 'outside_service_area'
      : !policy.supportedProjectTypes.includes(input.projectType as IntakeProjectType) ? 'unsupported_project' : 'eligible_for_follow_up';
  }
  return { outcome, appointmentStatus: 'not_booked' };
}
