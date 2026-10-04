import {NextRequest} from 'next/server';
import {localEnabled,uploadLocal} from '@/lib/local-runtime';
import {getConvexBridge} from '@/lib/auth-server';
import {api} from '@painter-os-bts/backend/convex/runtime';
import {actor,requireOrigin,error,reply} from '@/lib/http';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{requireOrigin(request);if(Number(request.headers.get('content-length')||0)>21*1024*1024)throw new Error('FILE_SIZE_LIMIT_20_MB');const form=await request.formData(),file=form.get('file');if(!(file instanceof File))throw new Error('FILE_REQUIRED');if(file.size>20*1024*1024)throw new Error('FILE_SIZE_LIMIT_20_MB');const jobId=String(form.get('jobId')||'');if(localEnabled())return reply(uploadLocal(actor(request),file.name,Buffer.from(await file.arrayBuffer()),jobId||undefined));if(!jobId)throw new Error('PROJECT_REQUIRED_FOR_CLOUD_UPLOAD');const bridge=getConvexBridge();const start=await bridge.fetchAuthMutation(api.painter.beginFileUpload,{jobId,name:file.name});const upload=await fetch(start.uploadUrl,{method:'POST',headers:{'Content-Type':file.type},body:file});if(!upload.ok)throw new Error('UPLOAD_FAILED');const {storageId}=await upload.json();await bridge.fetchAuthMutation(api.painter.completeFileUpload,{fileId:start.fileId,storageId});return reply({id:start.fileId});}catch(e){return error(e);}}
