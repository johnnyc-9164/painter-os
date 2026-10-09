import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import * as contract from '@painter-os-bts/backend/public-lead-contract';
const validateSubmission = contract.validatePublicContactSubmission ?? contract.default?.validatePublicContactSubmission;
const reasons = ['unavailable','policy_changed','request_conflict','receipt_expired','global_limit','tenant_limit'];
const states = ['received','deletion_pending','deleted','converted_preserved'];
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const exact = (value, keys) => record(value) && Object.keys(value).every(key => keys.includes(key));
export function validatePublicInquiry(value) { try { return validateSubmission(value); } catch { throw new Error('INVALID_INQUIRY'); } }
export function validateInquiryKey(value) { if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{32,80}$/.test(value)) throw new Error('INVALID_INQUIRY'); return value; }
export function decodeInquiryResult(value, status = false) {
  if (exact(value,['state','reference']) && states.includes(value.state) && typeof value.reference === 'string' && /^[a-f0-9]{64}$/.test(value.reference)) return {state:value.state,reference:value.reference};
  if (status && exact(value,['state']) && value.state === 'unavailable') return {state:'unavailable'};
  if (!status && exact(value,['state','reason','retryAfterMs']) && value.state === 'denied' && reasons.includes(value.reason) && (value.retryAfterMs === undefined || (Number.isSafeInteger(value.retryAfterMs) && value.retryAfterMs >= 0))) return {state:'denied',reason:value.reason,...(value.retryAfterMs === undefined ? {} : {retryAfterMs:value.retryAfterMs})};
  throw new Error('INVALID_INQUIRY_RESPONSE');
}
export function decodeContactPolicy(value) {
  if (exact(value,['state']) && value.state === 'unavailable') return {state:'unavailable'};
  const p = value?.policy;
  if (!exact(value,['state','policy']) || value.state !== 'ready' || !exact(p,['companyName','contactPolicyRevision','guidanceRevision','consentText','retentionDays','retentionDisclosure']) || !['companyName','consentText','retentionDisclosure'].every(key => typeof p[key] === 'string' && p[key].trim() && p[key].length <= 2000) || !['contactPolicyRevision','guidanceRevision'].every(key => Number.isSafeInteger(p[key]) && p[key] > 0) || p.retentionDays !== 30) throw new Error('INVALID_INQUIRY_RESPONSE');
  return {state:'ready',policy:{...p}};
}
const policyRef = makeFunctionReference('contactIntakeConfig:publicPolicy');
const submitRef = makeFunctionReference('publicLead:submit');
const statusRef = makeFunctionReference('publicLead:status');
function client(url) { if (!url) throw new Error('PUBLIC_CONTENT_NOT_CONFIGURED'); return new ConvexHttpClient(url,{logger:false,fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(10_000)})}); }
/** Fixed anonymous public capabilities only. No session, arbitrary function or private snapshot. */
export async function readContactPolicy(url, workspaceId) { return decodeContactPolicy(await client(url).query(policyRef,{workspaceId})); }
export async function submitPublicInquiry(url, workspaceId, submission) { return decodeInquiryResult(await client(url).mutation(submitRef,{workspaceId,submission:validatePublicInquiry(submission)})); }
export async function readInquiryStatus(url, workspaceId, requestKey) { return decodeInquiryResult(await client(url).query(statusRef,{workspaceId,requestKey:validateInquiryKey(requestKey)}),true); }
