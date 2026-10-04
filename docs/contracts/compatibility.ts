/** Additive interface freeze examples, not deployed endpoints or an authorization layer. */
import type { Actor, AuditEvent, Command, CommandResult, Entity, Snapshot, actionContract } from '../../packages/domain/src/contracts.ts';
import type { BusinessArgs, BusinessResult } from '../../packages/contractor-os-core/src/shared/businessTypes.ts';

export type PainterAction = (typeof actionContract)[keyof typeof actionContract][number];
export type PainterCommand = Omit<Command, 'action'> & { action: PainterAction };
export type SourceCommand =
  | { source: 'painter-host'; command: PainterCommand }
  | { source: 'contractor-os'; command: BusinessArgs };
export type SourceResult =
  | { source: 'painter-host'; result: CommandResult }
  | { source: 'contractor-os'; result: BusinessResult };
/** Server-only resolved identity. Neither identifier is supplied by the browser. */
export interface ResolvedIdentity {
  betterAuthUserId: Actor['id'];
  convexTokenIdentifier: string;
  tenantId: Actor['tenantId'];
  role: Actor['role'];
}
export interface DepositView {
  requiredCents: number;
  receivedCents: number;
  remainingCents: number;
  status: 'not_required' | 'unpaid' | 'partial' | 'satisfied';
}
/** receivedCents is deposit-invoice receipts, never the job's total collections. */
export function depositView(requiredCents: number, receivedCents: number): DepositView {
  for (const cents of [requiredCents, receivedCents]) {
    if (!Number.isSafeInteger(cents) || cents < 0 || cents > 1e12) throw new Error('INVALID_DEPOSIT_CENTS');
  }
  if (receivedCents > requiredCents) throw new Error('DEPOSIT_OVERPAYMENT');
  return { requiredCents, receivedCents, remainingCents: requiredCents - receivedCents,
    status: requiredCents === 0 ? 'not_required' : receivedCents === 0 ? 'unpaid' : receivedCents < requiredCents ? 'partial' : 'satisfied' };
}
/** Current Painter audit shape, not an IR event translated into a new schema. */
export interface PainterTransitionPayload {
  /** Additive audit evidence on new payment.record transitions only; legacy history may omit it. */
  paymentId?: string;
  invoiceId?: string;
  amountCents?: number;
  schemaVersion: 1;
  tenantId: string;
  requestKey: string;
  action: PainterAction;
  revision: number;
  customerId: string | null;
  jobId: string | null;
  occurredAt: string;
  before: Entity['data'] | null;
  after: Entity['data'];
}
export type PainterTransitionEvent = Omit<AuditEvent, 'payload'> & { source: 'painter-host'; payload: PainterTransitionPayload };
/** Target adapter seam for Issue 6; current transport still returns Snapshot. */
export type SnapshotView = Snapshot & { source: 'painter-host'; runtime: Snapshot['runtime'] & { kind: 'convex' | 'local' } };
export interface PainterFacade {
  snapshot(): Promise<SnapshotView>;
  execute(command: PainterCommand): Promise<CommandResult>;
}
