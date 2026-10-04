/** Normalize browser scheduling form dates using the existing local-to-UTC rule. */
export function normalizeScheduleInput(action: string, input: Record<string, unknown>) {
  if (action === 'schedule.create' || action === 'schedule.reschedule') {
    if (new Date(String(input.endAt)) <= new Date(String(input.startAt))) throw new Error('End time must be after start time.');
    return { ...input, startAt: new Date(String(input.startAt)).toISOString(), endAt: new Date(String(input.endAt)).toISOString() };
  }
  return input;
}
