import { createRegistry, Harness, type Registry } from '@earendil-works/pi-durable';
import { createModels, type Models } from '@earendil-works/pi-ai/models';
import { PiHarness, type PiSessionDefaults } from 'agents/harness/pi';

/** Deployment-independent lifecycle adapter. No credentials or model are configured by default. */
export function createPainterHarness(options: {
  models?: Models;
  registry?: Registry;
  defaults?: PiSessionDefaults;
} = {}) {
  const models = options.models ?? createModels({ authContext: {
    env: async () => undefined,
    fileExists: async () => false,
  } });
  const registry = options.registry ?? createRegistry();
  return new PiHarness({
    harness: ({ storage, context }) => Harness.open(storage, { models, registry,
      settings: { retry: { enabled: false } } }, context),
    defaults: options.defaults,
  });
}
