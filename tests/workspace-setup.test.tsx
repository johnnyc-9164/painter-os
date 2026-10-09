import {test,expect,vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {WorkspaceSetup,snapshotCustomers} from '../apps/web/src/components/workspace-setup';
import type {Snapshot} from '../packages/domain/src/contracts';
const snapshot:Snapshot={actor:{id:'owner',tenantId:'company',name:'Owner',email:'owner@example.test',role:'owner'},workspace:{id:'company',name:'Company'},entities:[],events:[],runtime:{storage:'test',integrations:'none',demo:true}};
test('setup offers honest three paths and performs no writes on render',()=>{
 let writes=0;const html=renderToStaticMarkup(createElement(WorkspaceSetup,{snapshot,loadSnapshot:async()=>snapshot,onReviewCustomer:()=>writes++,go:()=>{}}));
 for(const text of ['Start fresh','Import from a CRM','Keep my CRM','Workspace setup'])expect(html).toContain(text);expect(writes).toBe(0);
});
test('duplicate inputs use current authorized tenant customers only, with no finance or CRM authority',()=>{
 const time='2026-10-09T00:00:00Z';const entity={id:'a',type:'customer' as const,tenantId:'company',revision:1,createdAt:time,updatedAt:time,data:{name:'Customer',email:'a@example.test',status:'paid',deposit:500}};
 expect(snapshotCustomers({...snapshot,entities:[entity,{...entity,id:'foreign',tenantId:'other'}]})).toEqual([{name:'Customer',email:'a@example.test',phone:'',address:''}]);
});

vi.mock('next/navigation',()=>({useRouter:()=>({push:()=>{},refresh:()=>{}})}));
import Invitation from '../apps/web/src/components/invitation';
test('cloud invitation uses current verified session without password while local fixture retains credential form',()=>{
 const token='syntheticinvitationtoken123456789';const cloud=renderToStaticMarkup(createElement(Invitation,{token,local:false}));expect(cloud).not.toContain('type="password"');expect(cloud).toContain('current signed-in, verified email');
 const local=renderToStaticMarkup(createElement(Invitation,{token,local:true}));expect(local).toContain('type="password"');expect(local).toContain('type="email"');
});
