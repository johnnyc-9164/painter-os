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
