import type { DepositOverride, DepositView, Entity } from './contracts';
const invalid = (): never => { throw new Error('INVALID_DEPOSIT_RECORD'); };
function amount(value: unknown): number {
 if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 1e12) invalid();
 return value as number;
}
function required(job: Entity): number {
 const snapshot = job.data.financialSnapshot;
 if (job.type !== 'job' || !snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot) || typeof job.data.customerId !== 'string' || !job.data.customerId) invalid();
 return amount((snapshot as Record<string, unknown>).depositCents);
}
/** Uses recorded receipts, never invoice/job cached totals or final-invoice payments. */
export function depositForJob(entities: readonly Entity[], job: Entity): DepositView {
 const requiredCents = required(job);
 let receivedCents = 0;
 const invoices = new Map(entities.filter(e => e.tenantId === job.tenantId && e.type === 'invoice').map(e => [e.id, e]));
 for (const payment of entities) {
  if (payment.tenantId !== job.tenantId || payment.type !== 'payment' || payment.data.status !== 'recorded') continue;
  const invoice = typeof payment.data.invoiceId === 'string' ? invoices.get(payment.data.invoiceId) : undefined;
  const linked = payment.data.jobId === job.id || invoice?.data.jobId === job.id;
  if (!linked) continue;
  if (!invoice) return invalid();
  if (payment.data.jobId !== job.id || invoice.data.jobId !== job.id || payment.data.customerId !== job.data.customerId || invoice.data.customerId !== job.data.customerId) invalid();
  if (!['deposit', 'final'].includes(String(invoice.data.kind))) invalid();
  if (invoice.data.kind !== 'deposit' || invoice.data.status === 'void') continue;
  if (!['issued', 'partially_paid', 'paid', 'overdue'].includes(String(invoice.data.status))) invalid();
  const value = amount(payment.data.amountCents);
  if (value === 0) invalid();
  receivedCents = amount(receivedCents + value);
 }
 if (receivedCents > requiredCents) invalid();
 const remainingCents = requiredCents - receivedCents;
 return {requiredCents, receivedCents, remainingCents, status: requiredCents === 0 ? 'not_required' : remainingCents === 0 ? 'satisfied' : receivedCents === 0 ? 'unpaid' : 'partial'};
}
/** Only trusted engine evidence tied to the immutable required amount grants permission. */
export function activeDepositOverride(job: Entity): DepositOverride | undefined {
 const value = job.data.depositOverride;
 if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
 const row = value as Record<string, unknown>;
 if (row.requiredCents !== required(job) || !['owner', 'office_admin'].includes(String(row.approvedRole)) || typeof row.approvedBy !== 'string' || !row.approvedBy.trim() || typeof row.reason !== 'string' || !row.reason.trim() || row.reason.length > 1000 || typeof row.approvedAt !== 'string' || !Number.isFinite(Date.parse(row.approvedAt))) return undefined;
 return value as DepositOverride;
}
export function requireDeposit(entities: readonly Entity[], job: Entity): void {
 const view = depositForJob(entities, job);
 if (view.remainingCents > 0 && !activeDepositOverride(job)) throw new Error('DEPOSIT_REQUIRED');
}
