import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextActionQueue } from '../packages/domain/src/next-action-queue';
import { applyCommand, emptyState } from '../packages/domain/src/engine';
import type { Actor, Entity, Role } from '../packages/domain/src/contracts';

const now = '2026-10-10T12:00:00.000Z';
const actor: Actor = { id: 'owner', tenantId: 'company', name: 'Owner', email: 'owner@example.test', role: 'owner' };
const entity = (type: 'lead' | 'estimate', id = type, patch: Partial<Entity> = {}): Entity => ({
  id, type, tenantId: actor.tenantId, revision: 2, createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-09T12:00:00.000Z', data: { title: 'Actual record', status: type === 'lead' ? 'new' : 'draft' }, ...patch,
});

test('explicit 24-hour threshold, future records, terminal statuses and malformed dates', () => {
  assert.equal(nextActionQueue(actor, [entity('lead')], '2026-10-10T11:59:59.999Z').length, 0);
  assert.equal(nextActionQueue(actor, [entity('lead')], now)[0]?.dueAt, now);
  for (const updatedAt of ['bad', '2026-02-30T12:00:00Z', '2026-10-11T12:00:00Z', '2026-10-09T12:00:00']) {
    assert.deepEqual(nextActionQueue(actor, [entity('lead', 'lead', { updatedAt })], now), []);
  }
  for (const status of ['qualified', 'lost', 'draft']) assert.deepEqual(nextActionQueue(actor, [entity('lead', 'lead', { data: { title: 'Lead', status } })], now), []);
  for (const status of ['sent', 'viewed', 'approved', 'rejected']) assert.deepEqual(nextActionQueue(actor, [entity('estimate', 'estimate', { data: { title: 'Estimate', status } })], now), []);
  assert.throws(() => nextActionQueue(actor, [], 'invalid'), /INVALID_QUEUE_NOW/);
});

test('source facts and revision are preserved without fabricated money or physical readiness', () => {
  const sources = [entity('lead'), entity('estimate', 'estimate', { data: { title: 'Actual scope', status: 'changes_requested', totalCents: 12345, email: 'private@example.test' } })];
  const before = structuredClone(sources);
  const queue = nextActionQueue(actor, sources, now);
  assert.equal(queue.length, 2);
  const proposal = queue.find(item => item.kind === 'estimate_review')!;
  assert.deepEqual(proposal.facts, { title: 'Actual scope', status: 'changes_requested' });
  assert.equal(proposal.source.revision, 2);
  assert.equal(proposal.draft.action, 'task.create');
  assert.equal(proposal.requiresApproval, true);
  assert.match(proposal.rationale, /before any send decision/);
  assert.doesNotMatch(JSON.stringify(queue), /12345|private@example/);
  assert.deepEqual(sources, before);
  assert.deepEqual(nextActionQueue(actor, [...sources].reverse(), now), queue);
  const revised = nextActionQueue(actor, [entity('estimate', 'estimate', { revision: 3 })], now)[0]!;
  assert.notEqual(revised.key, proposal.key);
});

test('trusted actor visibility and current capabilities restrict drafts', () => {
  const sources = [entity('lead'), entity('estimate'), entity('lead', 'foreign', { tenantId: 'other' })];
  assert.equal(nextActionQueue(actor, sources, now).length, 2);
  assert.equal(nextActionQueue({ ...actor, role: 'office_admin' }, sources, now).length, 2);
  for (const role of ['estimator', 'salesperson', 'project_manager', 'accountant', 'crew_lead', 'crew_member', 'customer'] satisfies Role[]) {
    assert.deepEqual(nextActionQueue({ ...actor, role }, sources, now), [], role);
  }
});

test('approved draft uses existing writer and open task prevents duplicate even after source changes', () => {
  const lead = entity('lead');
  const state = emptyState();
  state.entities = [lead];
  const proposal = nextActionQueue(actor, state.entities, now)[0]!;
  assert.equal(state.entities.length, 1);
  applyCommand(state, actor, { ...proposal.draft, requestKey: 'operator-approved' }, { now });
  assert.deepEqual(nextActionQueue(actor, state.entities, now), []);
  lead.revision++;
  state.entities[0]!.revision++;
  assert.deepEqual(nextActionQueue(actor, state.entities, now), []);
  const task = state.entities.find(item => item.type === 'task')!;
  task.tenantId = 'foreign';
  assert.equal(nextActionQueue(actor, state.entities, now).length, 1);
  task.tenantId = actor.tenantId;
  task.data.status = 'complete';
  assert.equal(nextActionQueue(actor, state.entities, now).length, 1);
});

test('ambiguous source IDs and malformed revisions cannot create false duplicate matches', () => {
  const source = entity('lead', 'lead\n\"odd');
  const proposal = nextActionQueue(actor, [source], now)[0]!;
  const task: Entity = { ...source, type: 'task', id: 'task', data: { status: 'open', notes: proposal.draft.input.notes } };
  assert.deepEqual(nextActionQueue(actor, [source, task], now), []);
  task.data.notes = `prefix${proposal.draft.input.notes}`;
  assert.equal(nextActionQueue(actor, [source, task], now).length, 1);
  for (const revision of [0, -1, 1.5, NaN]) assert.deepEqual(nextActionQueue(actor, [{ ...source, revision }], now), []);
});

test('immutable public intake namespace prevents task copies even when editable source is changed',()=>{
  const intake=entity('lead','intake-lead:'+ 'a'.repeat(64),{data:{title:'Private visitor',name:'Private visitor',status:'new',source:'manual'}});
  const manual=entity('lead','manual-lead',{data:{title:'Manual lead',status:'new',source:'consented_public_intake'}});
  const queue=nextActionQueue(actor,[intake,manual],now);
  assert.equal(queue.length,1);assert.equal(queue[0]!.source.id,manual.id);
  assert.doesNotMatch(JSON.stringify(queue),/Private visitor/);
});
