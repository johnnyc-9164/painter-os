import type { Snapshot } from '@painter-os-bts/domain/contracts';

export function runtimeLabels(runtime?: Snapshot['runtime']) {
  if (runtime?.kind === 'convex') return runtime.demo
    ? { mini: 'Convex demo workspace', banner: 'SYNTHETIC DEMO · CONVEX RUNTIME' }
    : { mini: 'Convex runtime', banner: 'CONVEX STORAGE RUNTIME' };
  if (runtime?.kind === 'local') return runtime.demo
    ? { mini: 'Local demo mode', banner: 'SYNTHETIC DEMO · LOCAL TEST MODE' }
    : { mini: 'Local verification runtime', banner: 'LOCAL VERIFICATION RUNTIME' };
  return { mini: 'Runtime unavailable', banner: 'RUNTIME UNAVAILABLE' };
}
