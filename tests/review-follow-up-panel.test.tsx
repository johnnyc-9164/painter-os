import { test, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReviewFollowUpPanel } from '../apps/web/src/components/review-follow-up-panel';
import type { Snapshot } from '../packages/domain/src/contracts';
const now='2026-10-09T12:00:00Z';
const snapshot:Snapshot={actor:{id:'owner',tenantId:'company',name:'Owner',email:'owner@test.example',role:'owner'},workspace:{id:'company',name:'Company'},events:[],runtime:{storage:'test',integrations:'none',demo:true},entities:[
{id:'job',type:'job',tenantId:'company',revision:1,createdAt:now,updatedAt:now,data:{title:'Finished project',status:'complete',customerId:'customer'}},
{id:'customer',type:'customer',tenantId:'company',revision:1,createdAt:now,updatedAt:now,data:{name:'Customer without contact'}},
]};
test('real panel renders job/customer and missing contact honestly without writes',()=>{
let writes=0;const html=renderToStaticMarkup(createElement(ReviewFollowUpPanel,{snapshot,loadSnapshot:async()=>snapshot,createTask:async()=>{writes++;}}));
expect(html).toContain('Finished project');expect(html).toContain('Customer without contact');expect(html).toContain('No customer contact is recorded');expect(html).toContain('Prepare draft');expect(html).toContain('Saving never sends a message');expect(writes).toBe(0);
});
test('non-owner UI is absent and empty eligible queue explains suppression',()=>{
const props={snapshot,loadSnapshot:async()=>snapshot,createTask:async()=>{}};
expect(renderToStaticMarkup(createElement(ReviewFollowUpPanel,{...props,snapshot:{...snapshot,actor:{...snapshot.actor,role:'salesperson'}}}))).toBe('');
expect(renderToStaticMarkup(createElement(ReviewFollowUpPanel,{...props,snapshot:{...snapshot,entities:[]}}))).toContain('previously prepared tasks are excluded');
});
