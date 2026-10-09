import { test, expect, vi } from 'vitest';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CommandForm } from '../apps/web/src/components/painter-forms';
import { applyCommand, emptyState } from '../packages/domain/src/engine';
import type { Actor } from '../packages/domain/src/contracts';

let form: ReactElement<{ onSubmit: (event: { preventDefault(): void }) => Promise<void> }>;
vi.mock('@painter-os-bts/ui/components/dialog', () => ({
  ModalDialog: ({ children }: { children: ReactNode }) => {
    form = children as typeof form;
    return children;
  },
}));

for (const [dollars, override] of [[1250, undefined], [0, undefined], [1250.37, undefined], [1250, 42.5], [1250, 0]] as const) {
  test(`domain-created bid ${dollars} dollars survives a real form edit with override ${override}`, async () => {
    const state = emptyState();
    const owner: Actor = { id: 'owner', tenantId: 'workspace', role: 'owner', name: 'Owner', email: 'owner@example.invalid' };
    let sequence = 0;
    const run = (action: string, input: Record<string, unknown>, entityId?: string) =>
      applyCommand(state, owner, { action, input, entityId, requestKey: `request-${++sequence}` });
    const customer = run('customer.create', { name: 'Customer', email: 'customer@example.invalid' }).entity!;
    const bid = run('bid.create', { title: 'Original', customerId: customer.id, value: dollars, deadline: '2026-10-10T12:00:00Z', status: 'draft' }).entity!;
    expect(bid.data.value).toBeUndefined();
    expect(bid.data.valueCents).toBe(Math.round(dollars * 100));
    const expected = override ?? dollars;
    const onSubmit = vi.fn(async (input: Record<string, unknown>) => { run('bid.update', input, bid.id); });
    const html = renderToStaticMarkup(createElement(CommandForm, {
      spec: { action: 'bid.update', title: 'Edit bid', entity: bid, initial: { title: 'Edited title', ...(override === undefined ? {} : { value: override }) } },
      entities: [customer], busy: false, onClose() {}, onSubmit,
    }));
    expect(html).toMatch(new RegExp(`aria-label="Bid value \\(\\$\\)"[^>]*value="${expected}"`));
    await form.props.onSubmit({ preventDefault() {} });
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ title: 'Edited title', value: expected });
    expect(state.entities.find(entity => entity.id === bid.id)?.data).toMatchObject({ title: 'Edited title', valueCents: Math.round(expected * 100) });
  });
}
