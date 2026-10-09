import { Agent } from 'agents';
import { createPainterHarness } from './harness';

export class PainterAgent extends Agent {
  private readonly painterHarness = createPainterHarness();
  constructor(ctx: DurableObjectState, env: Record<string, never>) {
    super(ctx, env);
    this.lifecycle.use(this.painterHarness);
  }
  async fetch(): Promise<Response> { return unavailable(); }
}

function unavailable() {
  return Response.json({ error: 'TRUSTED_AGENT_ADAPTER_NOT_CONFIGURED' }, { status: 503,
    headers: { 'Cache-Control': 'no-store' } });
}

/** No HTTP/RPC routing, public ask endpoint, model key, or provider activation in this preparation. */
const worker = { fetch: async () => unavailable() };
export default worker;
