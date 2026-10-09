import {decodeInquiryResult,validatePublicInquiry,type InquiryResult,type InquiryStatus,type PublicContactSubmission} from '@painter-os-bts/public-content/public-lead';
export interface InquiryIntent {submission:PublicContactSubmission;phase:'ready'|'unknown'|'checked'|'complete'|'denied';result?:InquiryResult}
export function createInquiryIntent(value:unknown):InquiryIntent{return {submission:validatePublicInquiry(value),phase:'ready'};}
export function reconcileInquiry(intent:InquiryIntent,value:unknown,status=false):InquiryIntent {
  try{
    if(status){const result:InquiryStatus=decodeInquiryResult(value,true);return result.state==='unavailable'?{...intent,phase:'checked'}:{...intent,phase:'complete',result};}
    const result=decodeInquiryResult(value);return {...intent,phase:result.state==='denied'?'denied':'complete',result};
  }catch{return {...intent,phase:'unknown'};}
}
export async function exchangeInquiry(workspace:string,body:unknown):Promise<unknown>{
  const response=await fetch(`/api/inquiry/${encodeURIComponent(workspace)}`,{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify(body),signal:AbortSignal.timeout(15_000)});
  if(!response.ok)throw new Error('INQUIRY_UNAVAILABLE');return response.json();
}
