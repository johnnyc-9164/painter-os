import {api} from '@painter-os-bts/backend/convex/runtime';
import {getConvexBridge} from '@painter-os-bts/cloud-session/server';
import type {Snapshot} from '@painter-os-bts/domain/contracts';
import {decodeAppointmentData,decodeAppointmentResult,appointmentWriteSchema,type AppointmentWrite} from './appointment-http';

async function session(workspaceId:string,expectedActorId:string){
 const bridge=getConvexBridge();const user=await bridge.fetchAuthQuery(api.auth.getCurrentUser,{});
 if(!user||String(user._id)!==expectedActorId)throw new Error('UNAUTHENTICATED');
 const memberships=await bridge.fetchAuthQuery(api.painter.workspaces,{});
 if(!Array.isArray(memberships))throw new Error('FORBIDDEN');
 const member=memberships.find(value=>value.workspace&&String(value.workspace._id)===workspaceId);
 if(!member||!['owner','office_admin','estimator'].includes(member.role))throw new Error('FORBIDDEN');
 return {bridge,actorId:String(user._id),role:member.role as 'owner'|'office_admin'|'estimator'};
}
/** Session and current role select projections; every backend endpoint independently checks membership. */
export async function appointmentRead(workspaceId:string,expectedActorId:string,cursors:Partial<Record<'slots'|'appointments'|'sources',string>>={}){
 const {bridge,actorId,role}=await session(workspaceId,expectedActorId);
 const options=(cursor?:string)=>({workspaceId,paginationOpts:{numItems:25,cursor:cursor??null}});
 const [slots,appointments]=await Promise.all([bridge.fetchAuthQuery(api.estimateAppointmentSlots.list,options(cursors.slots)),bridge.fetchAuthQuery(api.estimateAppointments.list,options(cursors.appointments))]);
 if(role==='estimator')return decodeAppointmentData({workspaceId,actorId,role,slots,appointments,sources:null,resources:[]});
 const [resources,sources,snapshot]=await Promise.all([bridge.fetchAuthQuery(api.estimateAppointmentSlots.resources,{workspaceId}),bridge.fetchAuthQuery(api.estimateAppointments.sources,options(cursors.sources)),bridge.fetchAuthQuery(api.painter.snapshot,{workspaceId})]);
 const records=(snapshot as Snapshot).entities;
 if(!Array.isArray(records)||(snapshot as Snapshot).actor.id!==actorId||(snapshot as Snapshot).actor.tenantId!==workspaceId)throw new Error('UNAUTHENTICATED');
 const name=(id:string)=>String(records.find(item=>item.tenantId===workspaceId&&item.id===id)?.data.name??'Current CRM record').slice(0,200);
 return decodeAppointmentData({workspaceId,actorId,role,slots,appointments,resources,sources:{...sources,items:sources.items.map((item:{leadId:string;customerId:string})=>({...item,leadName:name(item.leadId),customerName:name(item.customerId)}))}});
}
export async function appointmentWrite(workspaceId:string,input:AppointmentWrite,expectedActorId:string){
 const {bridge,role}=await session(workspaceId,expectedActorId);if(role==='estimator')throw new Error('FORBIDDEN');
 const {action,...args}=appointmentWriteSchema.parse(input);
 const result=action==='saveSlot'?await bridge.fetchAuthAction(api.estimateAppointmentSlots.save,{workspaceId,...args}):await bridge.fetchAuthMutation(action==='closeSlot'?api.estimateAppointmentSlots.close:api.estimateAppointments[action],{workspaceId,...args});
 return decodeAppointmentResult(result);
}
