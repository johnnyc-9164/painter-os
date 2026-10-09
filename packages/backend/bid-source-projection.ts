import { BID_SOURCE_LIMITS, type BidSourcePolicy, type BidSourceProjection, type BidCrawlProjection, type BidSourceFailure } from './bid-source-contract';
const encoder=new TextEncoder();
const decoder=new TextDecoder('utf-8',{fatal:true});
function object(value:unknown):Record<string,unknown>{return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};}
function count(value:unknown):value is number{return typeof value==='number'&&Number.isSafeInteger(value)&&value>=0;}

/** Exact HTTPS origin allowlist only. This does not attest DNS resolution or hidden redirects. */
export function bidSourceUrl(value:unknown,policy:BidSourcePolicy):string|null{
  if(typeof value!=='string'||value.length>2048)return null;
  try{
    const url=new URL(value);
    const host=url.hostname.toLowerCase();
    if(url.protocol!=='https:'||url.username||url.password||url.hash||url.port
      ||!host.includes('.')||/^\d+(?:\.\d+){3}$/.test(host)||host.includes(':')
      ||host.endsWith('.local')||host.endsWith('.internal')||host.endsWith('.localhost')
      ||!policy.allowedOrigins.includes(url.origin))return null;
    for(const key of url.searchParams.keys())if(!policy.allowedQueryKeys.includes(key))return null;
    return url.href;
  }catch{return null;}
}
function excerpt(value:string,maxBytes:number):{text:string;truncated:boolean}{
  // Bound encoding allocation before conversion even if the untrusted string is huge.
  const prefix=value.slice(0,maxBytes);
  const encoded=encoder.encode(prefix);let size=Math.min(maxBytes,encoded.length);
  while(size>0){try{return {text:decoder.decode(encoded.slice(0,size)),truncated:value.length>prefix.length||size<encoded.length};}catch{size--;}}
  return {text:'',truncated:value.length>0};
}
export function bidSourceFailure(value:unknown):BidSourceFailure{
  const raw=object(value);const data=object(raw.data);const status=data.status??raw.status;
  if(status===402)return 'credits_exhausted';if(status===429)return 'rate_limited';
  return 'start_unknown'; // Ambiguous provider/network starts must not be blindly retried.
}
export async function projectBidSource(raw:unknown,requestedUrl:string,fetchedAtMs:number,policy:BidSourcePolicy):Promise<BidSourceProjection>{
  const requested=bidSourceUrl(requestedUrl,policy);if(!requested)return {state:'source_rejected'};
  if(!count(fetchedAtMs))return {state:'malformed'};
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return {state:'malformed'};
  const data=object(raw);const metadata=object(data.metadata);
  if((data.truncated!==undefined&&typeof data.truncated!=='boolean')||(data.unstored!==undefined&&typeof data.unstored!=='boolean'))return {state:'malformed'};
  const reported=data.url??metadata.sourceURL??metadata.url;
  const sourceUrl=reported===undefined?requested:bidSourceUrl(reported,policy);
  if(!sourceUrl)return {state:'source_rejected'};
  const contentValue=data.markdown??data.summary;
  if(contentValue!==undefined&&typeof contentValue!=='string')return {state:'malformed'};
  const retained=excerpt(typeof contentValue==='string'?contentValue:'',BID_SOURCE_LIMITS.contentBytes);
  const digest=await crypto.subtle.digest('SHA-256',encoder.encode(retained.text));
  const hash=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  const quotes=retained.text.split(/\r?\n/).filter(line=>line.trim()).slice(0,BID_SOURCE_LIMITS.quotes).map(line=>excerpt(line,BID_SOURCE_LIMITS.quoteBytes).text);
  return {state:retained.text.trim()?'source_ready_unverified':'content_missing',document:{sourceUrl,fetchedAtMs,hash:`sha256:${hash}`,hashScope:'retained_excerpt',quotes,content:retained.text,
    truncated:retained.truncated||data.truncated===true||typeof data.warning==='string',unstored:data.unstored===true,
    sourceUrlEvidence:reported===undefined?'requested_only':'provider_reported',verification:'unverified',authorizesBusinessWrite:false,networkPolicy:'allowlist_only_dns_redirects_unverified'}};
}
export async function projectBidCrawl(raw:unknown,pages:readonly unknown[],requestedUrl:string,fetchedAtMs:number,policy:BidSourcePolicy):Promise<BidCrawlProjection|{state:BidSourceFailure}>{
  const data=object(raw);
  if(!['scraping','completed','failed','cancelled'].includes(String(data.status)))return {state:'malformed'};
  if(!bidSourceUrl(requestedUrl,policy))return {state:'source_rejected'};
  if(!count(fetchedAtMs)||!Array.isArray(pages))return {state:'malformed'};
  const documents=[];let rejectedPages=0;
  for(const page of pages.slice(0,BID_SOURCE_LIMITS.pages)){
    const projected=await projectBidSource(page,requestedUrl,fetchedAtMs,policy);
    if('document' in projected)documents.push(projected.document);else rejectedPages++;
  }
  const unstoredPages=count(data.unstored)?data.unstored:null;
  const totalsKnown=count(data.total)&&count(data.completed)&&count(data.pageCount);
  const truncated=pages.length>BID_SOURCE_LIMITS.pages||documents.some(d=>d.truncated);
  const complete=data.status==='completed'&&unstoredPages===0&&rejectedPages===0&&!truncated
    &&totalsKnown&&data.total===data.completed&&data.pageCount===data.completed&&documents.length===data.pageCount
    &&documents.every(d=>d.content.trim()&&!d.unstored&&d.sourceUrlEvidence==='provider_reported');
  return {status:data.status as BidCrawlProjection['status'],documents,rejectedPages,unstoredPages,truncated,completeness:complete?'complete_reported_unverified':'partial',verification:'unverified',authorizesBusinessWrite:false};
}
