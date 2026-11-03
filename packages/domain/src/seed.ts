import { applyCommand, emptyState, type State } from './engine';
import type { Actor, CommandResult } from './contracts';
/** Synthetic demo business data, never credentials or real customer information. */
export function seedState(tenantId:string,actorId='demo-owner'):State {
 const state=emptyState();const actor:Actor={id:actorId,tenantId,name:'Demo owner',email:'demo-owner@example.invalid',role:'owner'};let n=0;
 const run=(action:string,input:Record<string,unknown>,entityId?:string,customerDecision=false):CommandResult=>applyCommand(state,customerDecision?{...actor,id:'demo-customer',role:'customer',email:'morgan@example.invalid'}:actor,{action,input,requestKey:`demo-seed-${++n}`,...(entityId?{entityId}:{})},{now:'2026-05-01T12:00:00.000Z',id:()=>`${tenantId}:demo:${++n}`});
 const customer=run('customer.create',{name:'DEMO · Morgan Reed',email:'morgan@example.invalid',phone:'555-0101',address:'124 Demo Maple Lane'}).entity!;
 const lead=run('lead.create',{name:'DEMO · Jordan Ellis',email:'jordan@example.invalid',phone:'555-0102',address:'88 Demo Cedar Way',source:'Referral',notes:'Synthetic demo: exterior refresh, trim and porch.'}).entity!;
 run('lead.qualify',{},lead.id);
 const estimate=run('estimate.create',{customerId:customer.id,title:'DEMO · Maple Lane interior repaint',lineItems:[{description:'Walls — prep and two finish coats',quantity:1800,unitPrice:2.75},{description:'Trim and doors',quantity:1,unitPrice:850}],taxRate:7.5,depositPercent:25,paintingScope:{area:1800,coats:2,wastePercent:10,sqftPerGallon:350}}).entity!;
 run('estimate.send',{},estimate.id);run('estimate.approve',{},estimate.id,true);
 const job=run('job.create',{estimateId:estimate.id}).entity!;
 run('job.overrideDeposit',{reason:'Synthetic demo scheduling approval; no payment received.'},job.id);
 run('schedule.create',{jobId:job.id,crew:'Demo crew A',startAt:'2026-06-15T08:00:00Z',endAt:'2026-06-17T17:00:00Z'});
 const invoice=run('invoice.create',{jobId:job.id,title:'DEMO · Mobilization deposit',kind:'deposit'}).entity!;run('invoice.issue',{},invoice.id);
 run('knowledge.create',{title:'DEMO · Interior prep standard',content:'Protect floors, mask fixtures, repair defects, sand, prime repairs, and verify customer-selected colors before coating.'});
 run('knowledge.create',{title:'DEMO · Customer walkthrough',content:'Inspect coverage in daylight, remove masking, clean the site, and record punch-list resolution before final completion.'});
 run('task.create',{title:'DEMO · Confirm colors with Morgan',jobId:job.id,notes:'Demo follow-up; no message has been sent.'});
 run('bid.create',{title:'DEMO · Cedar Way exterior',customerId:lead.data.customerId??state.entities.find(e=>e.type==='lead'&&e.id===lead.id)!.data.customerId,value:9200,deadline:'2026-06-10T17:00:00Z',status:'draft',notes:'Synthetic opportunity.'});
 return state;
}
