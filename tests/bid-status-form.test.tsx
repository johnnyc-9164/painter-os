import { test, expect, vi } from 'vitest';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CommandForm, schemas } from '../apps/web/src/components/painter-forms';
import { applyCommand, emptyState } from '../packages/domain/src/engine';
import type { Actor } from '../packages/domain/src/contracts';

let form: ReactElement<{ onSubmit: (event: { preventDefault(): void }) => Promise<void> }>;
vi.mock('@painter-os-bts/ui/components/dialog', () => ({
  ModalDialog: ({ children }: { children: ReactNode }) => {
    form = children as typeof form;
    return children;
  },
}));

for (const status of ['draft', 'submitted', 'won', 'lost', 'withdrawn']) {
  test(`real bid form selects and preserves domain status ${status} on a title edit`, async () => {
    const state = emptyState();
    const owner: Actor = { id: 'owner', tenantId: 'workspace', role: 'owner', name: 'Owner', email: 'owner@example.invalid' };
    let sequence = 0;
    const run = (action: string, input: Record<string, unknown>, entityId?: string) =>
      applyCommand(state, owner, { action, input, entityId, requestKey: `request-${++sequence}` });
    const customer = run('customer.create', { name: 'Customer', email: 'customer@example.invalid' }).entity!;
    const created = run('bid.create', { title: 'Original', customerId: customer.id, value: 1250, deadline: '2026-10-10T12:00:00Z', status: 'draft' }).entity!;
    const bid = run('bid.update', { status }, created.id).entity!;
    const onSubmit = vi.fn(async (input: Record<string, unknown>) => { run('bid.update', input, bid.id); });
    const html = renderToStaticMarkup(createElement(CommandForm, {
      spec: { action: 'bid.update', title: 'Edit bid', entity: bid, initial: { title: 'Edited title' } },
      entities: [customer], busy: false, onClose() {}, onSubmit,
    }));
    const select = html.match(/<select aria-label="Status"[^>]*>(.*?)<\/select>/)?.[1];
    expect(select).toContain(`<option value="${status}" selected="">${status}</option>`);
    await form.props.onSubmit({ preventDefault() {} });
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ title: 'Edited title', status });
    expect(state.entities.find(entity => entity.id === bid.id)?.data).toMatchObject({ title: 'Edited title', status, valueCents: 125000 });
  });
}

test('bid create and update share statuses while invoice choices retain their contract', () => {
  expect(schemas['bid.update']).toBe(schemas['bid.create']);
  expect(schemas['invoice.create'].find(field => field.key === 'kind')?.options).toEqual(['deposit', 'final']);
});
