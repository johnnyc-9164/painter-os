import { test, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextActionPanel, currentProposal } from '../apps/web/src/components/next-action-panel';
import { nextActionQueue } from '../packages/domain/src/next-action-queue';
import type { Snapshot } from '../packages/domain/src/contracts';

const now = '2026-10-10T12:00:00Z';
const snapshot: Snapshot = {
  actor: {id:'owner', tenantId:'company', name:'Owner', email:'owner@example.test', role:'owner'},
  workspace: {id:'company', name:'Company'}, events: [], runtime: {storage:'test', integrations:'none', demo:true},
  entities: [{id:'estimate-1', type:'estimate', tenantId:'company', revision:3, createdAt:now, updatedAt:now, data:{title:'Real estimate', status:'draft'}}],
};
test('real panel renders factual version and approval control without executing', () => {
  let writes = 0;
  const html = renderToStaticMarkup(createElement(NextActionPanel, {snapshot, loadSnapshot:async()=>snapshot, createTask:async()=>{writes++;}, now:()=>now}));
  expect(html).toContain('Real estimate'); expect(html).toContain('Version 3');
  expect(html).toContain('Review task'); expect(html).toContain('Nothing runs automatically');
  expect(html).not.toContain('Approve suggested task'); expect(writes).toBe(0);
});
test('fresh snapshot rejects changed source, capability removal and pending duplicate', () => {
  const proposal = nextActionQueue(snapshot.actor,snapshot.entities,now)[0]!;
  expect(currentProposal(snapshot,proposal.key,now)).toEqual(proposal);
  const changed = structuredClone(snapshot); changed.entities[0]!.revision++;
  expect(()=>currentProposal(changed,proposal.key,now)).toThrow(/changed/);
  expect(()=>currentProposal({...snapshot,actor:{...snapshot.actor,role:'crew_member'}},proposal.key,now)).toThrow(/changed/);
  const pending = structuredClone(snapshot);
  pending.entities.push({...pending.entities[0]!,type:'task',id:'task',data:{status:'open',notes:proposal.draft.input.notes}});
  expect(()=>currentProposal(pending,proposal.key,now)).toThrow(/open task/);
});
