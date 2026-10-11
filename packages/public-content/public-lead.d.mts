import type {PublicContactSubmission, PublicSubmissionProof} from '@painter-os-bts/backend/public-lead-contract';
export type {PublicContactSubmission, PublicSubmissionProof};
export interface ContactPolicy {companyName:string;contactPolicyRevision:number;guidanceRevision:number;consentText:string;retentionDays:30;retentionDisclosure:string}
export type ContactPolicyResult = {state:'ready';policy:ContactPolicy}|{state:'unavailable'};
export type InquiryDenial = {state:'denied';reason:'unavailable'|'policy_changed'|'request_conflict'|'receipt_expired'|'global_limit'|'tenant_limit';retryAfterMs?:number};
export type InquiryResult = PublicSubmissionProof|InquiryDenial;
export type InquiryStatus = PublicSubmissionProof|{state:'unavailable'};
export function validatePublicInquiry(value:unknown):PublicContactSubmission;
export function validateInquiryKey(value:unknown):string;
export function decodeInquiryResult(value:unknown,status?:false):InquiryResult;
export function decodeInquiryResult(value:unknown,status:true):InquiryStatus;
export function decodeContactPolicy(value:unknown):ContactPolicyResult;
export function readContactPolicy(url:string|undefined,workspaceId:string):Promise<ContactPolicyResult>;
export function submitPublicInquiry(url:string|undefined,workspaceId:string,submission:unknown):Promise<InquiryResult>;
export function readInquiryStatus(url:string|undefined,workspaceId:string,requestKey:unknown):Promise<InquiryStatus>;
