export type Role = 'owner'|'office_admin'|'estimator'|'project_manager'|'salesperson'|'crew_lead'|'crew_member'|'accountant'|'customer';
export type EntityType = 'customer'|'lead'|'estimate'|'job'|'schedule'|'field'|'invoice'|'payment'|'expense'|'review'|'referral'|'bid'|'knowledge'|'automation'|'task'|'file'|'integration'|'article';
export interface Entity { id:string; type:EntityType; tenantId:string; revision:number; createdAt:string; updatedAt:string; data:Record<string, unknown>; }
export interface Actor { id:string; tenantId:string; name:string; email:string; role:Role; }
export interface AuditEvent { id:string; type:string; entityId:string; actorId:string; occurredAt:string; payload:Record<string,unknown>; }
export interface Snapshot { members?:{id:string;name:string;email:string;role:Role}[]; actor:Actor; workspace:{id:string;name:string}; entities:Entity[]; events:AuditEvent[]; runtime:{storage:string; integrations:string; demo:boolean}; }
export interface Command { action:string; entityId?:string; expectedRevision?:number; requestKey:string; input:Record<string,unknown>; }
export interface CommandResult { entity?:Entity; entities?:Entity[]; replayed?:boolean; portalUrl?:string; message?:string; }
export const entityTypes:EntityType[]=['customer','lead','estimate','job','schedule','field','invoice','payment','expense','review','referral','bid','knowledge','automation','task','file','integration','article'];
export const actionContract = {
 customer:['customer.create','customer.update'], lead:['lead.create','lead.update','lead.qualify','lead.lose'],
 estimate:['estimate.create','estimate.update','estimate.send','estimate.requestChanges','estimate.approve','estimate.reject','estimate.portal'],
 job:['job.create','job.start','job.block','job.resume','job.complete','job.cancel'], schedule:['schedule.create','schedule.reschedule','schedule.cancel'],
 field:['field.start','field.log','field.check','field.photo','field.material','field.submit'],
 invoice:['invoice.create','invoice.issue','invoice.void'], payment:['payment.record'], expense:['expense.create'],
 review:['review.create','review.sent','review.complete'], referral:['referral.create'], bid:['bid.create','bid.update'],
 knowledge:['knowledge.create','knowledge.update'], automation:['automation.create','automation.update','automation.run'],
 task:['task.create','task.complete'], integration:['integration.configure'], article:['article.create','article.update','article.publish'],
 member:['member.invite','member.role'], workspace:['workspace.update']
} as const;
