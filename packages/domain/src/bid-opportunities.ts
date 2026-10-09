/** Untrusted discovery evidence only. No business writer, pricing, customer creation or tool dispatch. */
export interface BidOpportunityIdentity {
  issuerNamespace: string;
  solicitationId: string;
  lot?: string;
  round?: string;
}
export interface BidFieldProvenance {
  sourceUrl: string;
  observedAt: string;
  contentHash: string;
  sourceRole: 'official' | 'mirror';
  extractionVersion: string;
  quote?: string;
  locator?: string;
}
export interface BidEvidenceText { value: string; provenance: BidFieldProvenance }
export interface BidDeadlineEvidence {
  rawText: string;
  localDateTime?: string;
  timeZone?: string;
  offset?: string;
  provenance: BidFieldProvenance;
}
export interface BidEvidenceRevision {
  revisionId: string;
  kind: 'notice' | 'addendum' | 'cancellation' | 'expiry';
  provenance: BidFieldProvenance;
  fields: { title?: BidEvidenceText; scope?: BidEvidenceText; location?: BidEvidenceText; deadline?: BidDeadlineEvidence };
}
export interface BidOpportunityObservation { identity: BidOpportunityIdentity; evidence: BidEvidenceRevision }
export type BidDeadlineReview =
  | { state: 'normalized'; utc: string; evidence: readonly BidDeadlineEvidence[] }
  | { state: 'needs_review'; reasons: readonly string[]; evidence: readonly BidDeadlineEvidence[] };
export interface BidOpportunityIntakeDecision {
  classification: 'new_opportunity' | 'evidence_revision' | 'source_replay' | 'extraction_conflict';
  opportunityKey: string;
  observation: BidOpportunityObservation;
  advisoryMatches: readonly string[];
  reviewReasons: readonly string[];
  requiresOperatorReview: true;
}

function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error('INVALID_BID_EVIDENCE_OBJECT');
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some(key => !keys.includes(key))) throw new Error('UNSUPPORTED_BID_EVIDENCE_FIELD');
  return row;
}
function text(value: unknown, max = 200): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new Error('INVALID_BID_EVIDENCE_TEXT');
  return value;
}
function optionalText(row: Record<string, unknown>, key: string, max = 200) {
  return row[key] === undefined ? undefined : text(row[key], max);
}
function localTime(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
  if (!match) throw new Error('INVALID_BID_EVIDENCE_DATE');
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(part => Number(part ?? 0));
  const millisecond = Number((match[7] ?? '').padEnd(3, '0'));
  if (year! < 1900 || month! < 1 || month! > 12 || day! < 1 || day! > 31 || hour! > 23 || minute! > 59 || second! > 59) throw new Error('INVALID_BID_EVIDENCE_DATE');
  const time = Date.UTC(year!, month! - 1, day!, hour!, minute!, second!, millisecond);
  if (new Date(time).toISOString().slice(0, 10) !== value.slice(0, 10)) throw new Error('INVALID_BID_EVIDENCE_DATE');
  return time;
}
function offsetMinutes(value: string): number {
  if (value === 'Z') return 0;
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(value);
  if (!match || Number(match[2]) > 14 || Number(match[3]) > 59 || (Number(match[2]) === 14 && Number(match[3]) !== 0)) throw new Error('INVALID_BID_EVIDENCE_OFFSET');
  return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]));
}
function observedTime(value: unknown): string {
  const input = text(value, 40);
  const match = /^(.*)(Z|[+-]\d{2}:\d{2})$/.exec(input);
  if (!match) throw new Error('INVALID_BID_EVIDENCE_DATE');
  localTime(match[1]!);
  offsetMinutes(match[2]!);
  if (match[2] === '-00:00') throw new Error('INVALID_BID_EVIDENCE_DATE');
  return input;
}
function provenance(value: unknown): BidFieldProvenance {
  const row = object(value, ['sourceUrl', 'observedAt', 'contentHash', 'sourceRole', 'extractionVersion', 'quote', 'locator']);
  const sourceUrl = text(row.sourceUrl, 2048);
  let url: URL;
  try { url = new URL(sourceUrl); } catch { throw new Error('INVALID_BID_EVIDENCE_URL'); }
  if (!/^https?:\/\//i.test(sourceUrl) || /\s/.test(sourceUrl) || /%(?![a-f0-9]{2})/i.test(sourceUrl)
    || !['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error('INVALID_BID_EVIDENCE_URL');
  const contentHash = text(row.contentHash, 71);
  if (!/^sha256:[a-f0-9]{64}$/.test(contentHash)) throw new Error('INVALID_BID_EVIDENCE_HASH');
  if (row.sourceRole !== 'official' && row.sourceRole !== 'mirror') throw new Error('INVALID_BID_EVIDENCE_SOURCE_ROLE');
  const quote = optionalText(row, 'quote', 10000);
  const locator = optionalText(row, 'locator', 2000);
  if (!quote && !locator) throw new Error('BID_EVIDENCE_LOCATOR_REQUIRED');
  return { sourceUrl, observedAt: observedTime(row.observedAt), contentHash, sourceRole: row.sourceRole,
    extractionVersion: text(row.extractionVersion, 100), ...(quote === undefined ? {} : { quote }), ...(locator === undefined ? {} : { locator }) };
}
function evidenceText(value: unknown): BidEvidenceText {
  const row = object(value, ['value', 'provenance']);
  return { value: text(row.value, 10000), provenance: provenance(row.provenance) };
}
function deadline(value: unknown): BidDeadlineEvidence {
  const row = object(value, ['rawText', 'localDateTime', 'timeZone', 'offset', 'provenance']);
  const localDateTime = optionalText(row, 'localDateTime', 40);
  const timeZone = optionalText(row, 'timeZone', 100);
  const offset = optionalText(row, 'offset', 6);
  if (localDateTime !== undefined) localTime(localDateTime);
  if (offset !== undefined) offsetMinutes(offset);
  return { rawText: text(row.rawText, 2000), ...(localDateTime === undefined ? {} : { localDateTime }),
    ...(timeZone === undefined ? {} : { timeZone }), ...(offset === undefined ? {} : { offset }), provenance: provenance(row.provenance) };
}

export function decodeBidOpportunityObservation(value: unknown): BidOpportunityObservation {
  const row = object(value, ['identity', 'evidence']);
  const id = object(row.identity, ['issuerNamespace', 'solicitationId', 'lot', 'round']);
  const issuerNamespace = text(id.issuerNamespace, 100);
  if (!/^[a-z][a-z0-9._:-]*$/.test(issuerNamespace)) throw new Error('INVALID_BID_ISSUER_NAMESPACE');
  const identity = { issuerNamespace, solicitationId: text(id.solicitationId),
    ...(id.lot === undefined ? {} : { lot: text(id.lot) }), ...(id.round === undefined ? {} : { round: text(id.round) }) };
  const revision = object(row.evidence, ['revisionId', 'kind', 'provenance', 'fields']);
  if (typeof revision.kind !== 'string' || !['notice', 'addendum', 'cancellation', 'expiry'].includes(revision.kind)) throw new Error('INVALID_BID_EVIDENCE_KIND');
  const rawFields = object(revision.fields, ['title', 'scope', 'location', 'deadline']);
  const fields: BidEvidenceRevision['fields'] = {};
  for (const name of ['title', 'scope', 'location'] as const) if (rawFields[name] !== undefined) fields[name] = evidenceText(rawFields[name]);
  if (rawFields.deadline !== undefined) fields.deadline = deadline(rawFields.deadline);
  return { identity, evidence: { revisionId: text(revision.revisionId), kind: revision.kind as BidEvidenceRevision['kind'],
    provenance: provenance(revision.provenance), fields } };
}

/** Delimiter-safe exact identity. Case/spacing/lot/round aliases are never merged automatically. */
export function bidOpportunityKey(identity: BidOpportunityIdentity): string {
  return JSON.stringify([identity.issuerNamespace, identity.solicitationId, identity.lot ?? null, identity.round ?? null]);
}
function provenanceFingerprint(source: BidFieldProvenance) {
  // A later observation of identical content is a replay, not a fabricated addendum.
  const { observedAt: _observedAt, ...fingerprint } = source;
  return fingerprint;
}
function sourceReplayKey(observation: BidOpportunityObservation) {
  const source = observation.evidence.provenance;
  return JSON.stringify([bidOpportunityKey(observation.identity), source.sourceUrl, source.contentHash, source.extractionVersion]);
}
function extractionFingerprint(evidence: BidEvidenceRevision) {
  const fields: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(evidence.fields)) fields[key] = { ...field, provenance: provenanceFingerprint(field.provenance) };
  return JSON.stringify([evidence.revisionId, evidence.kind, provenanceFingerprint(evidence.provenance), fields]);
}
function alias(identity: BidOpportunityIdentity) {
  return JSON.stringify([identity.issuerNamespace, identity.solicitationId.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') || identity.solicitationId,
    identity.lot?.toLowerCase().trim() ?? null, identity.round?.toLowerCase().trim() ?? null]);
}

/** Pure intake decision. Existing evidence remains immutable; staging/conversion needs a trusted writer. */
export function classifyBidOpportunity(existing: readonly unknown[], candidate: unknown): BidOpportunityIntakeDecision {
  if (!Array.isArray(existing) || existing.length > 250) throw new Error('BID_EVIDENCE_BATCH_LIMIT');
  const observation = decodeBidOpportunityObservation(candidate);
  const history = existing.map(decodeBidOpportunityObservation);
  const opportunityKey = bidOpportunityKey(observation.identity);
  const sameOpportunity = history.filter(previous => bidOpportunityKey(previous.identity) === opportunityKey);
  const sameSource = sameOpportunity.filter(previous => sourceReplayKey(previous) === sourceReplayKey(observation));
  const conflict = sameSource.some(previous => extractionFingerprint(previous.evidence) !== extractionFingerprint(observation.evidence));
  const classification = conflict ? 'extraction_conflict' : sameSource.length ? 'source_replay' : sameOpportunity.length ? 'evidence_revision' : 'new_opportunity';
  const advisoryMatches = [...new Set(history.filter(previous => bidOpportunityKey(previous.identity) !== opportunityKey
    && alias(previous.identity) === alias(observation.identity)).map(previous => bidOpportunityKey(previous.identity)))];
  const reviewReasons: string[] = [];
  if (conflict) reviewReasons.push('conflicting_extraction_for_same_source');
  if (observation.evidence.kind !== 'notice') reviewReasons.push(`${observation.evidence.kind}_requires_review`);
  if (advisoryMatches.length) reviewReasons.push('ambiguous_identity_match');
  return { classification, opportunityKey, observation, advisoryMatches, reviewReasons, requiresOperatorReview: true };
}

function zoneFormatter(timeZone: string) {
  // Abbreviations such as CST are ambiguous even when Intl accepts a fixed-zone alias.
  if (timeZone !== 'UTC' && !/^[A-Za-z_+-]+\/[A-Za-z0-9_+.-]+(?:\/[A-Za-z0-9_+.-]+)?$/.test(timeZone)) return;
  try { return new Intl.DateTimeFormat('en-CA', { timeZone, calendar: 'gregory', numberingSystem: 'latn', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch { return; }
}
function projectedTime(formatter: Intl.DateTimeFormat, instant: number) {
  const parts = Object.fromEntries(formatter.formatToParts(instant).map(part => [part.type, part.value]));
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second))
    + ((instant % 1000) + 1000) % 1000;
}
function normalizeDeadline(input: BidDeadlineEvidence): { utc?: string; reason?: string } {
  if (!input.localDateTime) return { reason: 'missing_structured_datetime' };
  const local = localTime(input.localDateTime);
  const formatter = input.timeZone ? zoneFormatter(input.timeZone) : undefined;
  if (input.timeZone && !formatter) return { reason: 'unresolved_timezone' };
  if (input.offset === '-00:00') return { reason: 'unknown_offset' };
  if (input.offset !== undefined) {
    const instant = local - offsetMinutes(input.offset) * 60000;
    if (formatter && projectedTime(formatter, instant) !== local) return { reason: 'conflicting_zone_offset' };
    return { utc: new Date(instant).toISOString() };
  }
  if (!formatter) return { reason: 'missing_timezone' };
  const offsets = new Set<number>();
  const sampleBase = local - ((local % 1000) + 1000) % 1000;
  for (let hour = -36; hour <= 36; hour += 6) {
    const sample = sampleBase + hour * 3600000;
    offsets.add(projectedTime(formatter, sample) - sample);
  }
  const candidates = [...offsets].map(offset => local - offset).filter(instant => projectedTime(formatter, instant) === local);
  if (candidates.length === 0) return { reason: 'nonexistent_local_time' };
  if (candidates.length !== 1) return { reason: 'ambiguous_local_time' };
  return { utc: new Date(candidates[0]!).toISOString() };
}

/** Preserve every raw deadline/provenance. Never infer midnight, zone, or which addendum supersedes evidence. */
export function reviewBidDeadlines(values: readonly unknown[]): BidDeadlineReview {
  if (!Array.isArray(values) || values.length > 250) throw new Error('BID_EVIDENCE_BATCH_LIMIT');
  const evidence = values.map(deadline);
  const normalized = evidence.map(normalizeDeadline);
  const reasons = [...new Set(normalized.flatMap(result => result.reason ? [result.reason] : []))];
  if (!evidence.length) reasons.push('missing_deadline_evidence');
  const instants = [...new Set(normalized.flatMap(result => result.utc ? [result.utc] : []))];
  if (instants.length > 1) reasons.push('conflicting_deadlines');
  if (reasons.length) return { state: 'needs_review', reasons, evidence };
  return { state: 'normalized', utc: instants[0]!, evidence };
}
