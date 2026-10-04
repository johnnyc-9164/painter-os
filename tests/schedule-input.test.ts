import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { normalizeScheduleInput } = require('../apps/web/src/lib/schedule-input.ts') as typeof import('../apps/web/src/lib/schedule-input.ts');

test('empty cancellation confirmation reaches command dispatch without invented dates', async () => {
  const dispatched: Record<string, unknown>[] = [];
  const submit = async (input: Record<string, unknown>) => { dispatched.push(input); };
  await submit(normalizeScheduleInput('schedule.cancel', {}));
  assert.deepEqual(dispatched, [{}]);
});
test('create and reschedule preserve existing local-to-UTC conversion', () => {
  for (const action of ['schedule.create', 'schedule.reschedule']) {
    const input = { crew: 'Crew A', startAt: '2026-10-06T09:00', endAt: '2026-10-06T11:00' };
    assert.deepEqual(normalizeScheduleInput(action, input), { ...input, startAt: new Date(input.startAt).toISOString(), endAt: new Date(input.endAt).toISOString() });
  }
});
test('reversed and invalid scheduling dates retain existing form rejection', () => {
  assert.throws(() => normalizeScheduleInput('schedule.create', { startAt: '2026-10-06T11:00', endAt: '2026-10-06T09:00' }), /End time must be after start time/);
  assert.throws(() => normalizeScheduleInput('schedule.reschedule', { startAt: 'invalid', endAt: 'invalid' }), /Invalid time value/);
});
test('unrelated commands pass through without scheduling conversion', () => {
  assert.deepEqual(normalizeScheduleInput('customer.create', { name: 'A' }), { name: 'A' });
});
