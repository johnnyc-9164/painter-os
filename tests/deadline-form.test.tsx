import { test, expect, vi } from 'vitest';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CommandForm } from '../apps/web/src/components/painter-forms';
import { deadlineInputValue } from '../apps/web/src/lib/deadline-input';
import type { Entity } from '@painter-os-bts/domain/contracts';

let form: ReactElement<{ onSubmit: (event: { preventDefault(): void }) => Promise<void> }>;
vi.mock('@painter-os-bts/ui/components/dialog', () => ({
  ModalDialog: ({ children }: { children: ReactNode }) => {
    form = children as typeof form;
    return children;
  },
}));

for (const timezone of ['UTC', 'Pacific/Auckland']) {
  test(`bid deadline survives real form reopening and repeated unchanged saves in ${timezone}`, async () => {
    const previous = process.env.TZ;
    process.env.TZ = timezone;
    try {
      const selected = '2026-10-10';
      const stored = new Date(`${selected}T12:00:00`).toISOString();
      expect(stored).toBe(timezone === 'UTC' ? '2026-10-10T12:00:00.000Z' : '2026-10-09T23:00:00.000Z');
      let deadline: unknown = selected;
      for (let save = 0; save < 4; save++) {
        const onSubmit = vi.fn(async (_input: Record<string, unknown>) => {});
        const entity = { id: 'bid-1', type: 'bid', data: {
          title: 'Original', customerId: 'customer-1', value: 100, status: 'draft', deadline,
        } } as Entity;
        const html = renderToStaticMarkup(createElement(CommandForm, {
          spec: { action: 'bid.update', title: 'Edit bid', entity, initial: { title: 'Edited title' } },
          entities: [], busy: false, onClose() {}, onSubmit,
        }));
        expect(html).toMatch(/aria-label="Submission deadline"[^>]*value="2026-10-10"/);
        await form.props.onSubmit({ preventDefault() {} });
        expect(onSubmit).toHaveBeenCalledOnce();
        expect(onSubmit.mock.calls[0][0]).toMatchObject({ title: 'Edited title', deadline: stored });
        deadline = onSubmit.mock.calls[0][0].deadline;
      }
      expect(deadlineInputValue(selected)).toBe(selected);
      expect(deadlineInputValue(undefined)).toBe('');
      expect(deadlineInputValue('invalid')).toBe('invalid');
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });
}

test('a command without a deadline does not acquire one', async () => {
  const onSubmit = vi.fn(async (_input: Record<string, unknown>) => {});
  renderToStaticMarkup(createElement(CommandForm, {
    spec: { action: 'customer.update', title: 'Edit customer', initial: { name: 'A', email: 'a@example.invalid' } },
    entities: [], busy: false, onClose() {}, onSubmit,
  }));
  await form.props.onSubmit({ preventDefault() {} });
  expect(onSubmit).toHaveBeenCalledWith({ name: 'A', email: 'a@example.invalid' });
});
