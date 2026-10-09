import { Agent } from 'agents';
import { createRegistry } from '@earendil-works/pi-durable';
import { Type } from '@earendil-works/pi-ai';
import { createModels } from '@earendil-works/pi-ai/models';
import { createPainterHarness } from '../../src/harness';
import { fixtureProvider, model } from './provider';

type Env = { RELEASE: string; FIXTURE: DurableObjectNamespace<FixtureAgent> };

/** Deliberately separate test-only worker: never included by the production Wrangler entrypoint. */
export class FixtureAgent extends Agent<Env> {
  private readonly fixtureHarness;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS fixture_metrics (name TEXT PRIMARY KEY, count INTEGER NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS fixture_effects (id TEXT PRIMARY KEY, outcome TEXT NOT NULL)');
    const models = createModels({ authContext: { env: async () => undefined, fileExists: async () => false } });
    models.setProvider(fixtureProvider(() => this.increment('model'), env.RELEASE === 'yes'));
    const registry = createRegistry();
    registry.install({ name: 'local-fixture', tools: [{
      name: 'fixture_read', description: 'Deterministic local read', parameters: Type.Object({}), replay: 'safe',
      execute: async (_args, _api, context) => {
        this.increment('read');
        if (env.RELEASE !== 'yes') await this.interrupted(context.abortSignal);
        return { content: [{ type: 'text', text: 'local read result' }] };
      } }, {
      name: 'fixture_effect', description: 'Local-only fake effect with an outcome ledger', parameters: Type.Object({}), replay: 'unsafe', executionMode: 'sequential',
      execute: async (_args, _api, context) => {
        const existing = ctx.storage.sql.exec('SELECT outcome FROM fixture_effects WHERE id = ?', 'fixed-effect').toArray();
        if (existing.length > 0) { this.increment('blocked'); return { content: [{ type: 'text', text: 'OUTCOME_UNKNOWN_RECONCILIATION_REQUIRED' }] }; }
        ctx.storage.sql.exec('INSERT INTO fixture_effects VALUES (?, ?)', 'fixed-effect', 'dispatching');
        this.increment('effect');
        if (env.RELEASE !== 'yes') await this.interrupted(context.abortSignal);
        ctx.storage.sql.exec('UPDATE fixture_effects SET outcome = ? WHERE id = ?', 'confirmed', 'fixed-effect');
        return { content: [{ type: 'text', text: 'local fake effect receipt' }] };
      } }] });
    this.fixtureHarness = createPainterHarness({ models, registry, defaults: { model } });
    this.lifecycle.use(this.fixtureHarness);
  }
  private increment(name: string) { this.ctx.storage.sql.exec('INSERT INTO fixture_metrics VALUES (?, 1) ON CONFLICT(name) DO UPDATE SET count = count + 1', name); }
  private interrupted(signal: AbortSignal | undefined) {
    return new Promise<never>((_resolve, reject) => {
      if (signal?.aborted) reject(new Error('FIXTURE_ABORTED'));
      signal?.addEventListener('abort', () => reject(new Error('FIXTURE_ABORTED')), { once: true });
    });
  }
  async submit(prompt: string, operationId: string) { return this.fixtureHarness.submit(prompt, { operationId }); }
  async result(operationId: string) { return this.fixtureHarness.wait(operationId); }
  async snapshot(): Promise<unknown> {
    const stream = await this.fixtureHarness.session().events();
    await stream.stop();
    return stream.snapshot;
  }
  async abort(operationId: string) { await this.fixtureHarness.session().abort(operationId); return { aborted: true }; }
  async inspect(): Promise<{metrics: Record<string, SqlStorageValue>[]; effects: Record<string, SqlStorageValue>[]; pending: unknown}> { return { metrics: this.ctx.storage.sql.exec('SELECT * FROM fixture_metrics').toArray(), effects: this.ctx.storage.sql.exec('SELECT * FROM fixture_effects').toArray(), pending: await this.fixtureHarness.pending() }; }
}

const fixtureWorker = { async fetch(request: Request, env: Env) {
  const url = new URL(request.url);
  const agent = env.FIXTURE.getByName(url.searchParams.get('conversation') ?? 'local-fixture');
  if (url.pathname === '/inspect') return Response.json(await agent.inspect());
  if (url.pathname === '/snapshot') return Response.json(await agent.snapshot());
  const operationId = url.searchParams.get('operation') ?? 'fixture-operation';
  if (url.pathname === '/submit') return Response.json(await agent.submit(url.searchParams.get('prompt') ?? 'read', operationId));
  if (url.pathname === '/result') return Response.json(await agent.result(operationId));
  if (url.pathname === '/abort') return Response.json(await agent.abort(operationId));
  return new Response('Fixture route missing', { status: 404 });
} };

export default fixtureWorker;
