/** Capacity admission only: no identity, lead write, booking or paid-model authority. */
export const INTAKE_ADMISSION = {
  globalAttemptsPerMinute: 30,
  tenantAttemptsPerMinute: 5,
  receiptTtlMs: 10 * 60_000,
  cleanupBatch: 100,
} as const;
export interface IntakeAdmissionInput { requestKey: string; payloadDigest: string }
export type AdmissionOutcome = {state: 'admitted'; policyRevision: number} | {state: 'denied'; reason: 'global_limit'|'tenant_limit'; retryAfterMs: number; policyRevision: number};
export type AdmissionResult = (AdmissionOutcome & {replayed: boolean}) | {state: 'denied'; reason: 'unavailable'|'request_conflict'|'policy_changed'|'receipt_expired'; replayed: false};
/** Digest format is validated, not its relationship to future request contents.
 * The trusted host dispatcher must derive it; browser claims grant no authority. */
export function validateAdmissionInput(input: IntakeAdmissionInput): void {
  if (typeof input.requestKey !== 'string' || typeof input.payloadDigest !== 'string' || !/^[A-Za-z0-9_-]{8,80}$/.test(input.requestKey) || !/^[a-f0-9]{64}$/.test(input.payloadDigest)) throw new Error('INVALID_INTAKE_ADMISSION_INPUT');
}
