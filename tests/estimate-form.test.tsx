import { test, expect, vi } from 'vitest';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CommandForm } from '../apps/web/src/components/painter-forms';
import type { Entity } from '@painter-os-bts/domain/contracts';

// A portal requires a browser. Expose its actual child form without replacing
// React state, inputs, estimate initialization or the submit handler.
let form: ReactElement<{ onSubmit: (event: { preventDefault(): void }) => Promise<void> }>;
vi.mock('@painter-os-bts/ui/components/dialog', () => ({
  ModalDialog: ({ children }: { children: ReactNode }) => {
    form = children as typeof form;
    return children;
  },
}));

for (const [name, scope, expected] of [
  ['zero waste', { wastePercent: 0 }, 0],
  ['nonzero waste', { wastePercent: 17 }, 17],
  ['missing waste', {}, 10],
  ['missing scope', undefined, 10],
] as const) {
  test(`estimate title edit preserves ${name} in the actual form submission`, async () => {
    const onSubmit = vi.fn(async (_input: Record<string, unknown>) => {});
    const entity = { id: 'estimate-1', type: 'estimate', data: {
      title: 'Original title', customerId: 'customer-1',
      lineItems: [{ description: 'Paint', quantity: 1, unitPriceCents: 10000 }],
      paintingScope: scope,
    } } as Entity;
    const html = renderToStaticMarkup(createElement(CommandForm, {
      spec: { action: 'estimate.update', title: 'Edit estimate', entity, initial: { title: 'Edited title' } },
      entities: [], busy: false, onClose() {}, onSubmit,
    }));
    expect(html).toMatch(new RegExp(`Waste \\(%\\).*?value="${expected}"`));
    await form.props.onSubmit({ preventDefault() {} });
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      title: 'Edited title', paintingScope: { wastePercent: expected },
    });
  });
}
