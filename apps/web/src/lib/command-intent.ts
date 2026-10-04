import type { Command } from '@painter-os-bts/domain/contracts';

type IntentCommand = Omit<Command, 'requestKey'>;
type Intent = { fingerprint: string; requestKey: string };

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  }
  return value;
}

/** Component-lifetime retry journal. No business data is persisted to browser storage.
 * Failed submissions remain ambiguous; only a confirmed result retires their key.
 */
export function createIntentKeys(mint: () => string = () => crypto.randomUUID()) {
  const pending = new Map<string, string>();
  const journal = {
    begin(scope: string, command: IntentCommand): Intent {
      // Match the actual JSON wire representation, including omitted undefined fields.
      const fingerprint = JSON.stringify(canonical(JSON.parse(JSON.stringify([scope, command]))));
      let requestKey = pending.get(fingerprint);
      if (!requestKey) { requestKey = mint(); pending.set(fingerprint, requestKey); }
      return { fingerprint, requestKey };
    },
    complete(intent: Intent) {
      if (pending.get(intent.fingerprint) === intent.requestKey) pending.delete(intent.fingerprint);
    },
  };
  return {
    ...journal,
    async submit<T>(scope: string, command: IntentCommand, send: (command: Command) => Promise<T>): Promise<T> {
      const intent = journal.begin(scope, command);
      const result = await send({ ...command, requestKey: intent.requestKey });
      journal.complete(intent);
      return result;
    },
  };
}
