export const BID_SOURCE_LIMITS = {pages:5,contentBytes:16384,quoteBytes:240,quotes:8,timeoutMs:15000} as const;
export interface BidSourcePolicy { allowedOrigins: readonly string[]; allowedQueryKeys: readonly string[]; }
export interface BidSourceDocument {
  sourceUrl:string; fetchedAtMs:number; hash:string; hashScope:'retained_excerpt';
  quotes:string[]; content:string; truncated:boolean; unstored:boolean;
  sourceUrlEvidence:'provider_reported'|'requested_only';
  verification:'unverified'; authorizesBusinessWrite:false;
  networkPolicy:'allowlist_only_dns_redirects_unverified';
}
export type BidSourceFailure='source_rejected'|'malformed'|'credits_exhausted'|'rate_limited'|'start_unknown';
export type BidSourceProjection={state:'source_ready_unverified'|'content_missing';document:BidSourceDocument}|{state:BidSourceFailure};
export interface BidCrawlProjection {
  status:'scraping'|'completed'|'failed'|'cancelled';
  documents:BidSourceDocument[]; rejectedPages:number; unstoredPages:number|null;
  truncated:boolean; completeness:'partial'|'complete_reported_unverified';
  verification:'unverified'; authorizesBusinessWrite:false;
}

/** Intentionally unavailable until an audited provider account/budget/network/webhook activation. */
export const BID_SOURCE_PROVIDER_PERMISSION = { enabled:false, reason:'provider_not_authorized' } as const;
