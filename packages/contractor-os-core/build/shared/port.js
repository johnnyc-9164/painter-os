import { BLUEPRINTS, RELATION_TARGETS, WORKFLOW_CONTRACTS } from './model.js';
export const LIMITS = Object.freeze({ batchBytes: 250_000, recordBytes: 100_000, batchRecords: 25, linksPerRecord: 100, pageSize: 100, depth: 20 });
function fail(code, detail = '') {
    throw new Error(detail ? `${code}: ${detail}` : code);
}
export function object(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value) &&
        (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
export function boundedString(value, code, max = 512) {
    if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value))
        fail(code);
}
function assertJson(value, depth = 0) {
    if (depth > LIMITS.depth)
        fail('JSON_DEPTH');
    if (value === null || typeof value === 'string' || typeof value === 'boolean')
        return;
    if (typeof value === 'number') {
        if (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value)))
            fail('INVALID_JSON', 'number outside supported JSON precision');
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value)
            assertJson(item, depth + 1);
        return;
    }
    if (object(value)) {
        for (const item of Object.values(value))
            assertJson(item, depth + 1);
        return;
    }
    fail('INVALID_JSON', 'unsupported value');
}
function encode(value) {
    if (Array.isArray(value))
        return `[${value.map(encode).join(',')}]`;
    if (value !== null && typeof value === 'object') {
        return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${encode(value[k])}`).join(',')}}`;
    }
    return JSON.stringify(value);
}
export function canonicalJson(value) { assertJson(value); return encode(value); }
function bytes(text) { return new TextEncoder().encode(text).byteLength; }
function reference(value) {
    if (!object(value))
        fail('INVALID_RELATION');
    boundedString(value.identifier, 'INVALID_RELATION');
    if (value.blueprint !== undefined && value.blueprint !== null)
        boundedString(value.blueprint, 'INVALID_RELATION');
}
export function parseEntity(value) {
    if (!object(value))
        fail('INVALID_ENTITY');
    assertJson(value);
    boundedString(value.identifier, 'INVALID_IDENTIFIER');
    if (typeof value.blueprint !== 'string' || !BLUEPRINTS.includes(value.blueprint))
        fail('UNSUPPORTED_BLUEPRINT');
    if (!object(value.properties))
        fail('INVALID_PROPERTIES');
    if (value.title !== undefined && value.title !== null && typeof value.title !== 'string')
        fail('INVALID_TITLE');
    if (value.relations !== undefined) {
        if (!object(value.relations))
            fail('INVALID_RELATION');
        let count = 0;
        for (const [name, refs] of Object.entries(value.relations)) {
            boundedString(name, 'INVALID_RELATION', 128);
            for (const ref of refs === null ? [] : Array.isArray(refs) ? refs : [refs]) {
                reference(ref);
                count++;
            }
        }
        if (count > LIMITS.linksPerRecord)
            fail('RELATION_LIMIT');
    }
    const snapshotJson = canonicalJson(value);
    if (bytes(snapshotJson) > LIMITS.recordBytes)
        fail('RECORD_LIMIT');
    return { blueprint: value.blueprint, identifier: value.identifier, title: typeof value.title === 'string' ? value.title : null, snapshotJson };
}
export function entityKey(blueprint, identifier) { return JSON.stringify([blueprint, identifier]); }
export function parseBatch(text) {
    if (typeof text !== 'string' || bytes(text) > LIMITS.batchBytes)
        fail('BATCH_LIMIT');
    let input;
    try {
        input = JSON.parse(text);
    }
    catch {
        fail('INVALID_JSON', 'batch must be JSON');
    }
    if (!Array.isArray(input))
        fail('INVALID_BATCH', 'expected an array');
    if (input.length > LIMITS.batchRecords)
        fail('BATCH_LIMIT');
    const records = new Map();
    let duplicates = 0;
    for (const item of input) {
        const r = parseEntity(item);
        const key = entityKey(r.blueprint, r.identifier);
        const prior = records.get(key);
        if (prior) {
            if (prior.snapshotJson !== r.snapshotJson)
                fail('IDENTITY_CONFLICT', `${r.blueprint}/${r.identifier}`);
            duplicates++;
        }
        else
            records.set(key, r);
    }
    return { records: [...records.values()], duplicates };
}
/** Existing rows MUST be fetched inside the same trusted tenant by the adapter. */
export function planImports(records, existing) {
    const byKey = new Map(existing.map(r => [entityKey(r.blueprint, r.identifier), r]));
    const create = [];
    let unchanged = 0;
    for (const r of records) {
        const previous = byKey.get(entityKey(r.blueprint, r.identifier));
        if (!previous)
            create.push(r);
        else if (previous.snapshotJson === r.snapshotJson)
            unchanged++;
        else
            fail('IDENTITY_CONFLICT', `${r.blueprint}/${r.identifier}`);
    }
    return { create, unchanged };
}
export function linksOf(entity) {
    const raw = JSON.parse(entity.snapshotJson);
    const links = [];
    if (!object(raw.relations))
        return links;
    for (const [relation, refs] of Object.entries(raw.relations)) {
        const values = refs === null ? [] : Array.isArray(refs) ? refs : [refs];
        values.forEach((ref, position) => {
            reference(ref);
            const target = typeof ref.blueprint === 'string' ? ref.blueprint : RELATION_TARGETS[entity.blueprint]?.[relation] ?? null;
            links.push({ relation, position, targetIdentifier: ref.identifier, targetBlueprint: target });
        });
    }
    return links;
}
export function resolveCandidates(tenantId, targetBlueprint, targetIdentifier, candidates) {
    const scoped = candidates.filter(r => r.tenantId === tenantId && r.identifier === targetIdentifier && (!targetBlueprint || r.blueprint === targetBlueprint));
    if (scoped.length === 0)
        return { status: 'missing', target: null };
    if (scoped.length !== 1)
        return { status: 'ambiguous', target: null };
    return { status: 'resolved', target: scoped[0] };
}
function dateTime(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value);
    if (!m || !Number.isFinite(Date.parse(value)))
        return false;
    const [year, month, day, hour, minute, second] = m.slice(1, 7).map(Number);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1] && hour <= 23 && minute <= 59 && second <= 59 && Number(m[7] ?? 0) <= 23 && Number(m[8] ?? 0) <= 59;
}
/** Shape validation only: no workflow execution, business approval or transition enforcement. */
export function validateWorkflowInput(name, input) {
    if (!Object.hasOwn(WORKFLOW_CONTRACTS, name))
        fail('UNKNOWN_WORKFLOW');
    const schema = WORKFLOW_CONTRACTS[name];
    if (!object(input))
        fail('INVALID_INPUT');
    assertJson(input);
    for (const key of Object.keys(input))
        if (!Object.hasOwn(schema.properties, key))
            fail('UNKNOWN_INPUT', key);
    const output = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
        const value = Object.hasOwn(input, key) ? input[key] : prop.default;
        if (value === undefined) {
            if (schema.required?.includes(key))
                fail('REQUIRED_INPUT', key);
            continue;
        }
        assertJson(value);
        if (!['string', 'number', 'boolean'].includes(prop.type))
            fail('UNSUPPORTED_INPUT_SCHEMA', key);
        if (typeof value !== prop.type)
            fail('INVALID_INPUT', key);
        if (prop.enum && !prop.enum.some(v => v === value))
            fail('INVALID_ENUM', key);
        if (prop.format === 'date-time' && !dateTime(value))
            fail('INVALID_DATETIME', key);
        if (prop.format === 'entity')
            boundedString(value, 'INVALID_INPUT');
        output[key] = value;
    }
    return output;
}
/** identity must come from the host's verified ctx.auth, not from request arguments. */
export function requireScope(identity, permission, membership) {
    if (!identity)
        fail('UNAUTHENTICATED');
    boundedString(identity.tokenIdentifier, 'UNAUTHENTICATED', 2048);
    if (!membership || !membership.permissions.includes(permission))
        fail('FORBIDDEN');
    boundedString(membership.tenantId, 'INVALID_TENANT', 256);
    return { tenantId: membership.tenantId, actorId: identity.tokenIdentifier };
}
