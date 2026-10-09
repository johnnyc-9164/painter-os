import type { Entity, Role } from '@painter-os-bts/domain/contracts';
import { activeDepositOverride, depositForJob } from '@painter-os-bts/domain/deposit-policy';
import { Button } from '@painter-os-bts/ui/components/button';
import { currency } from './painter-forms';

type DepositAction = 'job.overrideDeposit' | 'job.revokeDepositOverride';
type Props = {
  job: Entity;
  entities: readonly Entity[];
  role: Role;
  busy: boolean;
  onAction: (action: DepositAction, title: string, job: Entity) => void;
};

/** Display only: the authoritative command checks payment evidence and approvals. */
export function JobDepositPanel({ job, entities, role, busy, onAction }: Props) {
  if (!['owner', 'office_admin', 'accountant', 'project_manager'].includes(role)) return null;
  try {
    const deposit = depositForJob(entities, job);
    const override = activeDepositOverride(job);
    const satisfied = deposit.status === 'satisfied' || deposit.status === 'not_required';
    const canApprove = role === 'owner' || role === 'office_admin';
    const eligible = ['planned', 'scheduled', 'active', 'blocked'].includes(String(job.data.status));
    return <section aria-label="Required deposit" className="card">
      <h3>Required deposit</h3>
      <dl className="details">
        <div><dt>Required</dt><dd>{currency(deposit.requiredCents)}</dd></div>
        <div><dt>Received against deposit invoices</dt><dd>{currency(deposit.receivedCents)}</dd></div>
        <div><dt>Remaining</dt><dd>{currency(deposit.remainingCents)}</dd></div>
      </dl>
      <p>{deposit.status === 'not_required' ? 'No deposit is required.' : satisfied ? 'Required deposit received.' : override ? 'Deposit exception approved. Scheduling and starting are allowed.' : 'Scheduling and starting require the full deposit or an approved exception.'}</p>
      {override && <div className="notice">
        <strong>Approved deposit exception</strong>
        <p>{override.reason}</p>
        <small>Approved by {override.approvedBy} ({override.approvedRole}) on {override.approvedAt}</small>
        <p>This exception does not record a payment or reduce the amount owed.</p>
      </div>}
      {canApprove && eligible && (override
        ? <Button variant="outline" disabled={busy} onClick={() => onAction('job.revokeDepositOverride', 'Revoke deposit exception', job)}>Revoke deposit exception</Button>
        : !satisfied && <Button variant="outline" disabled={busy} onClick={() => onAction('job.overrideDeposit', 'Approve deposit exception', job)}>Approve deposit exception</Button>)}
    </section>;
  } catch {
    return <section aria-label="Required deposit" className="card"><h3>Required deposit</h3><p role="alert">Deposit evidence is unavailable. Refresh the workspace; an owner or office admin must resolve invalid records before scheduling or starting.</p></section>;
  }
}
