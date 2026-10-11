import {validateInquiryKey,validatePublicInquiry} from '@painter-os-bts/public-content/public-lead';
const MAX_BYTES = 16_384;
export type InquiryAction = {action:'submit';submission:ReturnType<typeof validatePublicInquiry>}|{action:'status';requestKey:string};
export async function parseInquiryRequest(request:Request):Promise<InquiryAction> {
  const origin=request.headers.get('origin');
  let parsed:URL;try{parsed=new URL(origin ?? '');}catch{throw new Error('INVALID_REQUEST');}
  // Next's internal Request URL may use localhost; Host is the actual HTTP authority.
  // Browser JavaScript cannot override Host. Never use forwarded headers or reflect Origin.
  if(origin!==parsed.origin || !['http:','https:'].includes(parsed.protocol) || parsed.protocol!==new URL(request.url).protocol || parsed.host!==request.headers.get('host') || request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json')throw new Error('INVALID_REQUEST');
  if (!request.body) throw new Error('INVALID_REQUEST');
  const reader = request.body.getReader(); let bytes = 0; const chunks:Uint8Array[]=[];
  let expired=false;
  const deadline = setTimeout(() => {expired=true;void reader.cancel();},5000);
  try {
    while (true) { const {done,value}=await reader.read(); if(done)break; bytes+=value.byteLength; if(bytes>MAX_BYTES)throw new Error('INVALID_REQUEST');chunks.push(value); }
  } finally {clearTimeout(deadline);await reader.cancel().catch(()=>undefined);}
  if(expired)throw new Error('INVALID_REQUEST');
  const joined=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.byteLength;}
  let body:Record<string,unknown>;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(joined));}catch{throw new Error('INVALID_REQUEST');}
  if(!body || typeof body!=='object' || Array.isArray(body))throw new Error('INVALID_REQUEST');
  if(body.action==='submit' && Object.keys(body).every(key=>['action','submission'].includes(key)))return {action:'submit',submission:validatePublicInquiry(body.submission)};
  if(body.action==='status' && Object.keys(body).every(key=>['action','requestKey'].includes(key)))return {action:'status',requestKey:validateInquiryKey(body.requestKey)};
  throw new Error('INVALID_REQUEST');
}
