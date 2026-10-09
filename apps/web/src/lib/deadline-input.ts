/** Keep date-only input values and display stored instants in the local calendar. */
export function deadlineInputValue(value: unknown): string {
  const text = String(value ?? '');
  if (!text || /^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text.slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
