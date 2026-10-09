import { decodeSavedIntake, validateIntakeSettings, type SavedIntakeSettings, type IntakeSettings } from '@painter-os-bts/backend/intake-contract';
export interface IntakeSave { workspaceId: string; expectedRevision: number; requestKey: string; settings: IntakeSettings }
export function parseIntakeSave(input: Record<string, unknown>): IntakeSave {
  for (const key of Object.keys(input)) if (!['workspaceId', 'expectedRevision', 'requestKey', 'settings'].includes(key)) throw new Error(`UNKNOWN_FIELD:${key}`);
  if (typeof input.workspaceId !== 'string' || !input.workspaceId || input.workspaceId.length > 200) throw new Error('INVALID_INTAKE_REQUEST');
  if (!Number.isSafeInteger(input.expectedRevision) || (input.expectedRevision as number) < 0 || typeof input.requestKey !== 'string' || !input.requestKey.trim() || input.requestKey.length > 180) throw new Error('INVALID_INTAKE_REQUEST');
  return {workspaceId: input.workspaceId, expectedRevision: input.expectedRevision as number, requestKey: input.requestKey, settings: validateIntakeSettings(input.settings)};
}
export function decodeIntakeRead(input: unknown): SavedIntakeSettings | null {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 1 || !('settings' in input)) throw new Error('INVALID_INTAKE_RESPONSE');
  return decodeSavedIntake(input.settings);
}
export function decodeIntakeWrite(input: unknown): {revision: number; enabled: boolean; replayed: boolean} {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('INVALID_INTAKE_RESPONSE');
  const row = input as Record<string, unknown>;
  if (Object.keys(row).length !== 3 || !Number.isSafeInteger(row.revision) || (row.revision as number) < 1 || typeof row.enabled !== 'boolean' || typeof row.replayed !== 'boolean') throw new Error('INVALID_INTAKE_RESPONSE');
  return {revision: row.revision as number, enabled: row.enabled, replayed: row.replayed};
}
