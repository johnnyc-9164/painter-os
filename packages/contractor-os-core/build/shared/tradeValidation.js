import { TRADE_FIELDS } from './tradeManifest.js';
import { validateProperties } from './domain.js';
import { boundedString, object } from './port.js';
export function validateTrade(trade, input) {
    const value = validateProperties('co_trade_spec', input);
    for (const name of Object.keys(value))
        if (!TRADE_FIELDS[trade].includes(name))
            throw new Error(`WRONG_TRADE_FIELD: ${name}`);
    if (value.trade !== undefined && value.trade !== trade)
        throw new Error('TRADE_MISMATCH');
    return value;
}
export function patchTrade(trade, previous, changes, unset = []) {
    const result = { ...validateTrade(trade, previous), ...validateTrade(trade, changes) };
    if (unset.length > 52 || new Set(unset).size !== unset.length)
        throw new Error('INVALID_UNSET');
    for (const key of unset) {
        if (!TRADE_FIELDS[trade].includes(key))
            throw new Error('WRONG_TRADE_FIELD');
        if (Object.hasOwn(changes, key))
            throw new Error('AMBIGUOUS_PATCH');
        delete result[key];
    }
    return validateTrade(trade, result);
}
export function validateCoreReferences(input) {
    if (!object(input))
        throw new Error('INVALID_CORE_REFERENCES');
    for (const [key, value] of Object.entries(input)) {
        if (key !== 'scope' && key !== 'pricing_rule')
            throw new Error('UNKNOWN_CORE_REFERENCE');
        if (value !== null)
            boundedString(value, 'INVALID_CORE_REFERENCE');
    }
    return { ...input };
}
