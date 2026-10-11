import {readInquiryStatus,submitPublicInquiry} from '@painter-os-bts/public-content/public-lead';
import {parseInquiryRequest} from '../../../../lib/inquiry-proxy';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function POST(request:Request,{params}:{params:Promise<{workspace:string}>}) {
  const {workspace}=await params;
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(workspace))return Response.json({error:'INVALID_REQUEST'},{status:400,headers});
  let action;try{action=await parseInquiryRequest(request);}catch{return Response.json({error:'INVALID_REQUEST'},{status:400,headers});}
  try{
    const url=process.env.NEXT_PUBLIC_CONVEX_URL;
    const result=action.action==='submit'?await submitPublicInquiry(url,workspace,action.submission):await readInquiryStatus(url,workspace,action.requestKey);
    return Response.json(result,{headers});
  }catch{return Response.json({error:'INQUIRY_UNAVAILABLE'},{status:503,headers});}
}
