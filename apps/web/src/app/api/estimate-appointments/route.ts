import {NextRequest} from 'next/server';
import {localEnabled} from '../../../lib/local-runtime';
import {requireOrigin,reply} from '../../../lib/http';
import {ConvexError} from 'convex/values';
import {decodeEstimateAppointmentRefusal} from '@painter-os-bts/domain/estimate-appointments';
import {appointmentRead,appointmentWrite} from '../../../lib/appointment-server';
import {appointmentWriteSchema} from '../../../lib/appointment-http';
export const runtime='nodejs';
function text(value:unknown,max=200){if(typeof value!=='string'||!value.length||value.length>max||/[\u0000-\u001f]/.test(value))throw new Error('INVALID_APPOINTMENT_REQUEST');return value;}
function actor(request:Request){try{return text(request.headers.get('x-painter-appointment-actor'));}catch{throw new Error('UNAUTHENTICATED');}}
function failure(reason:unknown){
 if(reason instanceof ConvexError){const refusal=decodeEstimateAppointmentRefusal(reason.data);if(!refusal)return reply({error:'INTERNAL_ERROR'},500);const {code}=refusal;const status=code==='UNAUTHENTICATED'?401:['APPOINTMENT_OFFICE_REQUIRED','WORKSPACE_MEMBERSHIP_REQUIRED'].includes(code)?403:['APPOINTMENT_NOT_FOUND','APPOINTMENT_SLOT_NOT_FOUND','WORKSPACE_NOT_FOUND'].includes(code)?404:['APPOINTMENT_SOURCE_CHANGED','APPOINTMENT_SLOT_CHANGED','APPOINTMENT_RESOURCE_CONFLICT','APPOINTMENT_IDEMPOTENCY_CONFLICT','APPOINTMENT_REVISION_CONFLICT','APPOINTMENT_DUPLICATE_ID','APPOINTMENT_DUPLICATE_PROPOSAL','APPOINTMENT_DUPLICATE_RECEIPT'].includes(code)?409:400;return reply({error:code},status);}
 const local:Record<string,number>={UNAUTHENTICATED:401,FORBIDDEN:403,INVALID_ORIGIN:403,INVALID_APPOINTMENT_REQUEST:400,PAYLOAD_TOO_LARGE:400,AUTH_BACKEND_NOT_CONFIGURED:503,DEPLOYMENT_NOT_CONFIGURED:503};const code=reason instanceof Error?reason.message:'';return Object.hasOwn(local,code)?reply({error:code},local[code]):reply({error:'INTERNAL_ERROR'},500);
}
export async function GET(request:NextRequest){try{
 if(localEnabled())return reply({error:'APPOINTMENT_UNAVAILABLE_IN_LOCAL_MODE'},503);
 const query=request.nextUrl.searchParams;const allowed=['workspaceId','slots','appointments','sources'];if([...query.keys()].some(key=>!allowed.includes(key)||query.getAll(key).length!==1))throw new Error('INVALID_APPOINTMENT_REQUEST');
 const cursors:Partial<Record<'slots'|'appointments'|'sources',string>>={};for(const key of ['slots','appointments','sources'] as const)if(query.has(key))cursors[key]=text(query.get(key),8192);
 return reply(await appointmentRead(text(query.get('workspaceId')),actor(request),cursors));
 }catch(reason){return failure(reason);}}
export async function POST(request:NextRequest){try{
 requireOrigin(request);if(localEnabled())return reply({error:'APPOINTMENT_UNAVAILABLE_IN_LOCAL_MODE'},503);
 const expectedActor=actor(request);const reader=request.body?.getReader();if(!reader)throw new Error('INVALID_APPOINTMENT_REQUEST');let size=0;const chunks:Uint8Array[]=[];
 try{while(true){const item=await reader.read();if(item.done)break;size+=item.value.byteLength;if(size>16*1024){await reader.cancel();throw new Error('PAYLOAD_TOO_LARGE');}chunks.push(item.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let position=0;for(const chunk of chunks){bytes.set(chunk,position);position+=chunk.byteLength;}
 let value:unknown;try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new Error('INVALID_APPOINTMENT_REQUEST');}
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('INVALID_APPOINTMENT_REQUEST');const {workspaceId,...command}=value as Record<string,unknown>;const parsed=appointmentWriteSchema.safeParse(command);if(!parsed.success)throw new Error('INVALID_APPOINTMENT_REQUEST');
 return reply(await appointmentWrite(text(workspaceId),parsed.data,expectedActor));
 }catch(reason){return failure(reason);}}
