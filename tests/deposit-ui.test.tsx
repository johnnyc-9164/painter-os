import { test, expect, vi } from 'vitest';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CommandForm } from '../apps/web/src/components/painter-forms';
import { JobDepositPanel } from '../apps/web/src/components/job-deposit-panel';
import { applyCommand, emptyState } from '../packages/domain/src/engine';
import type { Actor, Entity, Role } from '../packages/domain/src/contracts';

let form: ReactElement<{ onSubmit: (event: { preventDefault(): void }) => Promise<void> }>;
vi.mock('@painter-os-bts/ui/components/dialog', () => ({
  ModalDialog: ({ children }: { children: ReactNode }) => { form = children as typeof form; return children; },
}));
const owner: Actor = { id: 'owner', tenantId: 'workspace', role: 'owner', name: 'Owner', email: 'owner@example.invalid' };
function fixture(depositPercent = 30) {
  const state = emptyState();
  let sequence = 0;
  const run = (action: string, input: Record<string, unknown> = {}, entity?: Entity) =>
    applyCommand(state, owner, { action, input, entityId: entity?.id, expectedRevision: entity?.revision, requestKey: `ui-${++sequence}` }, { now: '2026-10-09T12:00:00Z' });
  const customer = run('customer.create', { name: 'Customer', email: 'customer@example.invalid' }).entity!;
  const estimate = run('estimate.create', { title: 'Paint', customerId: customer.id, lineItems: [{ description: 'Paint', quantity: 1, unitPrice: 1000 }], depositPercent }).entity!;
  const sent = run('estimate.send', {}, estimate).entity!;
  applyCommand(state, { ...owner, id: 'customer', role: 'customer', email: 'customer@example.invalid' }, { action: 'estimate.approve', entityId: sent.id, input: {}, requestKey: 'approve' });
  const job = run('job.create', { estimateId: estimate.id }).entity!;
  const read = () => state.entities.find(e => e.id === job.id)!;
  const render = (role: Role = 'owner', current = read()) => renderToStaticMarkup(createElement(JobDepositPanel, { job: current, entities: state.entities, role, busy: false, onAction() {} }));
  return { state, job, read, run, render };
}

test('actual deposit panel shows partial receipts and approval controls for authorized roles', () => {
  const f = fixture();
  const invoice = f.run('invoice.create', { jobId: f.job.id, title: 'Deposit', kind: 'deposit' }).entity!;
  f.run('invoice.issue', {}, invoice);
  f.run('payment.record', { invoiceId: invoice.id, amount: 100, reference: 'deposit-part', method: 'cash' });
  const html = f.render();
  expect(html).toContain('$300.00');
  expect(html).toContain('$100.00');
  expect(html).toContain('$200.00');
  expect(html).toContain('Approve deposit exception');
  expect(f.render('office_admin')).toContain('Approve deposit exception');
  expect(f.render('project_manager')).not.toContain('Approve deposit exception');
  expect(f.render('accountant')).not.toContain('Approve deposit exception');
});

test('crew and customer panels disclose neither balances nor exception reasons', () => {
  const f = fixture();
  f.run('job.overrideDeposit', { reason: 'Private approval reason' }, f.read());
  expect(f.render('crew_lead')).toBe('');
  expect(f.render('crew_member')).toBe('');
  expect(f.render('customer')).toBe('');
});

test('zero required and fully received deposits offer no unnecessary approval', () => {
  const zero = fixture(0);
  expect(zero.render()).toContain('No deposit is required.');
  expect(zero.render()).not.toContain('Approve deposit exception');
  const paid = fixture();
  const invoice = paid.run('invoice.create', { jobId: paid.job.id, title: 'Deposit', kind: 'deposit' }).entity!;
  paid.run('invoice.issue', {}, invoice);
  paid.run('payment.record', { invoiceId: invoice.id, amount: 300, reference: 'full', method: 'cash' });
  expect(paid.render()).toContain('Required deposit received.');
  expect(paid.render()).not.toContain('Approve deposit exception');
});

test('invalid finance evidence displays a resolution message without approving an exception', () => {
  const f = fixture();
  const malformed = { ...f.job, data: { ...f.job.data, financialSnapshot: null } };
  expect(f.render('owner', malformed)).toContain('Deposit evidence is unavailable');
  expect(f.render('owner', malformed)).not.toContain('Approve deposit exception');
});

test('actual approval and revocation forms submit only the reason and persist trusted audit metadata', async () => {
  const f = fixture();
  for (const [action, label, reason] of [
    ['job.overrideDeposit', 'Reason for deposit exception', 'Approved customer terms'],
    ['job.revokeDepositOverride', 'Reason for revoking deposit exception', 'Approval withdrawn'],
  ]) {
    const onSubmit = vi.fn(async (input: Record<string, unknown>) => { f.run(action, input, f.read()); });
    const html = renderToStaticMarkup(createElement(CommandForm, {
      spec: { action, title: 'Deposit exception', entity: f.read(), initial: { reason: `  ${reason}  `, approvedBy: 'spoofed', approvedAt: 'spoofed' } },
      entities: f.state.entities, busy: false, onClose() {}, onSubmit,
    }));
    expect(html).toContain(`aria-label="${label}"`);
    expect(html).toContain('maxLength="1000"');
    await form.props.onSubmit({ preventDefault() {} });
    expect(onSubmit.mock.calls).toEqual([[{ reason }]]);
    if (action === 'job.overrideDeposit') {
      expect(f.read().data.depositOverride).toMatchObject({ reason, approvedBy: owner.id, approvedRole: 'owner', approvedAt: '2026-10-09T12:00:00.000Z' });
      expect(f.render()).toContain('Approved deposit exception');
      expect(f.render()).toContain('Revoke deposit exception');
      expect(f.render()).toContain('does not record a payment');
    } else {
      expect(f.render()).not.toContain('Approved deposit exception');
      expect(f.render()).toContain('Approve deposit exception');
    }
  }
});

for (const reason of ['', '   ', 'x'.repeat(1001)]) {
  test(`approval form rejects ${reason.length > 1000 ? 'overlong' : reason ? 'whitespace' : 'empty'} reasons before dispatch`, async () => {
    const f = fixture();
    const onSubmit = vi.fn(async (_input: Record<string, unknown>) => {});
    renderToStaticMarkup(createElement(CommandForm, {
      spec: { action: 'job.overrideDeposit', title: 'Approve', entity: f.read(), initial: { reason } },
      entities: [], busy: false, onClose() {}, onSubmit,
    }));
    await form.props.onSubmit({ preventDefault() {} });
    expect(onSubmit).not.toHaveBeenCalled();
  });
}
