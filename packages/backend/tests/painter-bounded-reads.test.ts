import {describe, it, expect, vi} from 'vitest';
import {convexTest} from 'convex-test';
import {createHash} from 'node:crypto';
import schema from '../convex/schema';
import {api} from '../convex/runtime';
import {applyCommand, emptyState} from '../../domain/src/engine';
import type {Command, Actor} from '../../domain/src/contracts';
import {loadPainterState} from '../convex/painterStore';
import {persistPainterState} from '../convex/painterStore';
import {loadPainterCommandState, SNAPSHOT_EVENT_LIMIT} from '../convex/painterReadsets';

/**
 * Issue 159. These are real convex-test host tests (real schema, indexes, mutations). convex-test
 * SERIALIZES mutations, so it demonstrates correctness and read-set shape but NOT deployed Convex
 * optimistic concurrency or the per-function read/byte limits; those remain deployment evidence
 * that this source-only change does not claim. Read bounds below are document counts measured
 * through a counting db wrapper, not a server limit simulation.
 */
vi.mock('../convex/auth', () => ({authComponent: {safeGetAuthUser: async (ctx: any) => { const i = await ctx.auth.getUserIdentity(); return i ? {_id: i.subject, name: i.name ?? 'Owner', email: i.email, emailVerified: i.emailVerified} : null; }}}));
const modules = {'./_generated/test-root-marker.ts': () => Promise.resolve({}), './painter.ts': () => import('../convex/painter'), './painterActivity.ts': () => import('../convex/painterActivity'), './runtime.ts': () => import('../convex/runtime')};
const token = 'b'.repeat(64);
const tokenHash = createHash('sha256').update(token).digest('hex');
const NATIVE_RECEIPTS = 650, NATIVE_ENTITIES = 300;

async function setup() {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({subject: 'owner', name: 'Owner', email: 'owner@example.com', emailVerified: true});
  const workspace = await owner.mutation(api.painter.createWorkspace, {name: 'Bounded'});
  return {t, owner, tenantId: workspace.id as any};
}
async function seedNativeHistory(t: any, tenantId: any) {
  await t.run(async (ctx: any) => {
    for (let i = 0; i < NATIVE_ENTITIES; i++) {
      const slot = i % 2 === 0;
      await ctx.db.insert('painterEntities', {tenantId, entityId: `native-${i}`, type: slot ? 'estimate_slot' : 'estimate_appointment', revision: 1, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', data: slot ? {resourceId: 'r1', status: 'open', startAt: `2026-02-${String(1 + (i % 27)).padStart(2, '0')}T10:00:00.000Z`, normalizationProof: {secret: 'proof'}} : {resourceId: 'r1', leadId: `lead-${i}`, slotId: `native-${i - 1}`, status: 'cancelled', startAt: `2026-02-${String(1 + (i % 27)).padStart(2, '0')}T10:00:00.000Z`}});
    }
    for (let i = 0; i < NATIVE_RECEIPTS; i++) await ctx.db.insert('painterReceipts', {tenantId, requestKey: `native-appointment:${i}`, fingerprint: `fp-${i}`, result: {entity: {id: `native-${i % NATIVE_ENTITIES}`}}, nativeKind: i % 2 ? 'estimate_slot' : 'estimate_appointment'});
  });
}
const run = (owner: any, action: string, requestKey: string, input: Record<string, unknown> = {}, entityId?: string, expectedRevision?: number) => owner.mutation(api.painter.command, {command: {action, requestKey, input, ...(entityId ? {entityId} : {}), ...(expectedRevision ? {expectedRevision} : {})}});

/** Counts every document returned through ctx.db.query terminals. */
function counting(ctx: any) {
  const docs: {table: string; type?: string}[] = [];
  const wrap = (query: any, table: string): any => new Proxy(query, {get(target, prop) {
    const member = target[prop];
    if (typeof member !== 'function') return member;
    return (...args: any[]) => {
      const out = member.apply(target, args);
      if (['collect', 'take', 'unique', 'first', 'paginate'].includes(String(prop))) return Promise.resolve(out).then((value: any) => { const rows = Array.isArray(value) ? value : value?.page ? value.page : value ? [value] : []; docs.push(...rows.map((row: any) => ({table, type: row.type}))); return value; });
      return out && typeof out === 'object' && typeof out.then !== 'function' ? wrap(out, table) : out;
    };
  }});
  const db = new Proxy(ctx.db, {get(target, prop) { if (prop === 'query') return (table: string) => wrap(target.query(table), table); const member = target[prop]; return typeof member === 'function' ? member.bind(target) : member; }});
  return {ctx: {...ctx, db}, docs};
}

async function ordinaryOperations(t: any, owner: any, prefix: string) {
  const customer = await run(owner, 'customer.create', `${prefix}customer`, {name: 'Pat', email: `${prefix}pat@example.com`});
  const est = await run(owner, 'estimate.create', `${prefix}estimate`, {customerId: customer.entity.id, title: 'Interior', lineItems: [{description: 'Walls', quantity: 1, unitPrice: 1000}], depositPercent: 25});
  await run(owner, 'estimate.send', `${prefix}send`, {}, est.entity.id);
  const portalToken = createHash('sha256').update(prefix).digest('hex'), hash = createHash('sha256').update(portalToken).digest('hex');
  await owner.mutation(api.painter.createPortal, {estimateId: est.entity.id, tokenHash: hash});
  const approved = await t.mutation(api.painter.portalCommand, {token: portalToken, action: 'approve', requestKey: `${prefix}approve`});
  const job = await run(owner, 'job.create', `${prefix}job`, {estimateId: est.entity.id});
  return {customer: customer.entity.id, estimate: est.entity.id, job: job.entity.id, approved};
}

describe('bounded generic Painter reads with large native history', () => {
  it('runs ordinary CRM, scheduling, billing and portal commands beside >600 native receipts and >256 native entities', async () => {
    const {t, owner, tenantId} = await setup();
    await seedNativeHistory(t, tenantId);
    const a = await ordinaryOperations(t, owner, 'a-');
    expect(a.approved.status).toBe('approved');
    const sched = await run(owner, 'schedule.create', 'a-sched', {jobId: a.job, crew: 'Crew A', startAt: '2026-11-01T09:00:00Z', endAt: '2026-11-01T17:00:00Z'});
    expect(sched.entity.data.status).toBe('confirmed');
    const b = await ordinaryOperations(t, owner, 'b-');
    await expect(run(owner, 'schedule.create', 'b-sched', {jobId: b.job, crew: ' crew a ', startAt: '2026-11-01T12:00:00Z', endAt: '2026-11-01T13:00:00Z'})).rejects.toThrow('CREW_SCHEDULE_CONFLICT');
    await expect(run(owner, 'job.create', 'a-job-dup', {estimateId: a.estimate})).rejects.toThrow('DUPLICATE_JOB');
    const inv = await run(owner, 'invoice.create', 'a-inv', {jobId: a.job, title: 'Deposit', kind: 'deposit'});
    await expect(run(owner, 'invoice.create', 'a-inv2', {jobId: a.job, title: 'Deposit again', kind: 'deposit'})).rejects.toThrow('DUPLICATE_INVOICE');
    await run(owner, 'invoice.issue', 'a-issue', {}, inv.entity.id);
    await run(owner, 'payment.record', 'a-pay', {invoiceId: inv.entity.id, amount: 100, reference: 'CHK-1', method: 'check'});
    const inv2 = await run(owner, 'invoice.create', 'b-inv', {jobId: b.job, title: 'Deposit B', kind: 'deposit'});
    await run(owner, 'invoice.issue', 'b-issue', {}, inv2.entity.id);
    await expect(run(owner, 'payment.record', 'b-pay', {invoiceId: inv2.entity.id, amount: 50, reference: 'CHK-1', method: 'check'})).rejects.toThrow('DUPLICATE_PAYMENT_REFERENCE');
    const jobs = await run(owner, 'job.cancel', 'b-cancel', {}, b.job);
    expect(jobs.entity.data.status).toBe('cancelled');
    const snap = await owner.query(api.painter.snapshot, {});
    expect(snap.entities.some((e: any) => e.type === 'estimate_slot' || e.type === 'estimate_appointment')).toBe(false);
    expect(snap.entities.filter((e: any) => e.type === 'customer')).toHaveLength(2);
    expect(snap.eventsPage).toEqual({limit: SNAPSHOT_EVENT_LIMIT, complete: true});
    // Native history is untouched: nothing pruned, truncated or rewritten.
    await t.run(async (ctx: any) => {
      expect((await ctx.db.query('painterReceipts').withIndex('by_tenant_native_kind', (q: any) => q.eq('tenantId', tenantId).eq('nativeKind', 'estimate_slot')).collect()).length).toBe(NATIVE_RECEIPTS / 2);
      expect((await ctx.db.query('painterEntities').withIndex('by_tenant_type', (q: any) => q.eq('tenantId', tenantId).eq('type', 'estimate_appointment')).collect()).length).toBe(NATIVE_ENTITIES / 2);
    });
  });

  it('exact-key replay and conflict stay indexed, permanent and unaffected by receipt history', async () => {
    const {t, owner, tenantId} = await setup();
    await seedNativeHistory(t, tenantId);
    const first = await run(owner, 'customer.create', 'replay-1', {name: 'Replay', email: 'replay@example.com'});
    const again = await run(owner, 'customer.create', 'replay-1', {name: 'Replay', email: 'replay@example.com'});
    expect(again.replayed).toBe(true);
    expect(again.entity.id).toBe(first.entity.id);
    await expect(run(owner, 'customer.create', 'replay-1', {name: 'Different', email: 'replay@example.com'})).rejects.toThrow('IDEMPOTENCY_KEY_CONFLICT');
    await t.run(async (ctx: any) => {
      const probe = counting(ctx);
      const state = await loadPainterCommandState(probe.ctx, tenantId, {action: 'customer.create', requestKey: 'replay-1', input: {}} as Command, 'replay-1');
      expect(Object.keys(state.receipts)).toHaveLength(1);
      expect(probe.docs.filter(d => d.table === 'painterReceipts')).toHaveLength(1);
      const all = await ctx.db.query('painterReceipts').withIndex('by_tenant', (q: any) => q.eq('tenantId', tenantId)).collect();
      expect(all.length).toBeGreaterThanOrEqual(NATIVE_RECEIPTS + 1);
    });
  });

  it('command readsets are constant-size with respect to native history, events and receipts, and match the full oracle', async () => {
    const {t, owner, tenantId} = await setup();
    const a = await ordinaryOperations(t, owner, 'a-');
    await seedNativeHistory(t, tenantId);
    const inv = await run(owner, 'invoice.create', 'a-inv', {jobId: a.job, title: 'Deposit', kind: 'deposit'});
    await run(owner, 'invoice.issue', 'a-issue', {}, inv.entity.id);
    const actor: Actor = {id: 'owner', tenantId: String(tenantId), name: 'Owner', email: 'owner@example.com', role: 'owner'};
    const commands: Command[] = [
      {action: 'customer.create', requestKey: 'p-1', input: {name: 'X'}},
      {action: 'payment.record', requestKey: 'p-2', input: {invoiceId: inv.entity.id, amount: 100, reference: 'REF-9', method: 'cash'}},
      {action: 'schedule.create', requestKey: 'p-3', input: {jobId: a.job, crew: 'Crew', startAt: '2026-12-01T09:00:00Z', endAt: '2026-12-01T10:00:00Z'}},
      {action: 'job.cancel', requestKey: 'p-4', entityId: a.job, input: {}},
      {action: 'estimate.update', requestKey: 'p-5', entityId: a.estimate, input: {title: 'Changed'}},
    ];
    await t.run(async (ctx: any) => {
      const full = await loadPainterState(ctx, tenantId);
      expect(full.entities.filter(e => e.type.startsWith('estimate_')).length).toBeGreaterThan(256 - 1);
      for (const command of commands) {
        const probe = counting(ctx);
        const bounded = await loadPainterCommandState(probe.ctx, tenantId, command, command.requestKey);
        expect(probe.docs.filter(d => d.type === 'estimate_slot' || d.type === 'estimate_appointment')).toHaveLength(0);
        expect(probe.docs.filter(d => d.table === 'painterEvents')).toHaveLength(0);
        expect(probe.docs.length).toBeLessThan(25);
        const options = {now: '2026-10-11T00:00:00.000Z', id: (() => { let n = 0; return () => `${tenantId}:parity:${++n}`; })()};
        const withFull = JSON.parse(JSON.stringify({...full, receipts: {}}));
        const withBounded = JSON.parse(JSON.stringify(bounded));
        const expected = (() => { try { return applyCommand(withFull, actor, command, {...options, id: (() => { let n = 0; return () => `${tenantId}:parity:${++n}`; })()}); } catch (e) { return String(e); } })();
        const actual = (() => { try { return applyCommand(withBounded, actor, command, options); } catch (e) { return String(e); } })();
        expect(actual).toEqual(expected);
        const changed = (s: typeof withFull) => (typeof expected === 'string' ? [] : s.entities.filter((e: any) => !full.entities.some(f => f.id === e.id && f.revision === e.revision)).map((e: any) => e.id).sort());
        expect(changed(withBounded)).toEqual(changed(withFull));
      }
    });
  });

  it('snapshot keeps the newest audit page inline and activityPage pages the complete history without loss', async () => {
    const {t, owner, tenantId} = await setup();
    const customer = await run(owner, 'customer.create', 'c-1', {name: 'Hist', email: 'hist@example.com'});
    await t.run(async (ctx: any) => { for (let i = 0; i < SNAPSHOT_EVENT_LIMIT + 120; i++) await ctx.db.insert('painterEvents', {tenantId, eventId: `bulk-${i}`, type: 'customer.changed', entityId: customer.entity.id, actorId: 'owner', occurredAt: '2026-10-01T00:00:00.000Z', payload: {schemaVersion: 1, tenantId: String(tenantId), action: 'customer.update', revision: 2, before: {secret: 1}}}); });
    const snap = await owner.query(api.painter.snapshot, {});
    expect(snap.events).toHaveLength(SNAPSHOT_EVENT_LIMIT);
    expect(snap.eventsPage).toEqual({limit: SNAPSHOT_EVENT_LIMIT, complete: false});
    expect(snap.events.at(-1).id).toBe(`bulk-${SNAPSHOT_EVENT_LIMIT + 119}`);
    const seen: string[] = [];
    let cursor: string | null = null;
    for (let guard = 0; guard < 20; guard++) {
      const page: any = await owner.query(api.painterActivity.activityPage, {cursor, numItems: 200});
      expect(page.page.length).toBeLessThanOrEqual(200);
      seen.push(...page.page.map((e: any) => e.id));
      if (page.isDone) break;
      cursor = page.continueCursor;
    }
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen.filter(id => id.startsWith('bulk-'))).toHaveLength(SNAPSHOT_EVENT_LIMIT + 120);
    expect(seen.length).toBeGreaterThanOrEqual(SNAPSHOT_EVENT_LIMIT + 121);
  });

  it('role projection and privacy are identical for snapshot and paged history; customers and non-members see no history', async () => {
    const {t, owner, tenantId} = await setup();
    const customer = await run(owner, 'customer.create', 'r-1', {name: 'Priv', email: 'priv@example.com'});
    await t.run(async (ctx: any) => { await ctx.db.insert('painterMembers', {tenantId, userId: 'crew1', name: 'Crew', email: 'crew@example.com', role: 'project_manager', enabled: true}); await ctx.db.insert('painterMembers', {tenantId, userId: 'client1', name: 'Client', email: 'priv@example.com', role: 'customer', enabled: true}); await ctx.db.insert('painterMembers', {tenantId, userId: 'sales1', name: 'Sales', email: 'sales@example.com', role: 'salesperson', enabled: true}); });
    const sales = t.withIdentity({subject: 'sales1', name: 'Sales', email: 'sales@example.com', emailVerified: true});
    const client = t.withIdentity({subject: 'client1', name: 'Client', email: 'priv@example.com', emailVerified: true});
    const salesSnap = await sales.query(api.painter.snapshot, {});
    const salesPage = await sales.query(api.painterActivity.activityPage, {cursor: null, numItems: 50});
    const ownerPage = await owner.query(api.painterActivity.activityPage, {cursor: null, numItems: 50});
    const snapEvent = salesSnap.events.find((e: any) => e.entityId === customer.entity.id);
    expect(snapEvent.payload.after).toBeUndefined();
    expect(Object.keys(snapEvent.payload).sort()).toEqual(['action', 'revision', 'schemaVersion', 'tenantId']);
    expect(salesPage.page.find((e: any) => e.id === snapEvent.id)).toEqual(snapEvent);
    expect(ownerPage.page.find((e: any) => e.id === snapEvent.id).payload.after).toBeDefined();
    expect((await client.query(api.painterActivity.activityPage, {cursor: null, numItems: 50})).page).toEqual([]);
    expect((await client.query(api.painter.snapshot, {})).events).toEqual([]);
    await expect(t.withIdentity({subject: 'stranger', email: 's@example.com'}).query(api.painterActivity.activityPage, {cursor: null})).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
    await expect(t.query(api.painterActivity.activityPage, {cursor: null})).rejects.toThrow('UNAUTHENTICATED');
  });

  it('the sole writer refuses to overwrite an existing entity id that bounded state did not load', async () => {
    const {t, owner, tenantId} = await setup();
    const customer = await run(owner, 'customer.create', 'w-1', {name: 'Keep', email: 'keep@example.com'});
    await t.run(async (ctx: any) => {
      const collided = {...customer.entity, revision: 1, data: {...customer.entity.data, name: 'Overwritten'}};
      await expect(persistPainterState(ctx, tenantId, emptyState(), {entities: [collided], events: [], receipts: {}})).rejects.toThrow('ID_COLLISION');
      const row = await ctx.db.query('painterEntities').withIndex('by_tenant_entity', (q: any) => q.eq('tenantId', tenantId).eq('entityId', customer.entity.id)).unique();
      expect(row.data.name).toBe('Keep');
    });
  });
});
