import { DERIVED_MANIFEST } from './derivedManifest.js';
import { object } from './port.js';
const formulas = DERIVED_MANIFEST.calculations;
const DAY = 86_400_000;
/** Explicit time makes historical snapshots and tests repeatable. No hidden wall clock. */
export function validateAsOf(nowMs) {
    if (!Number.isFinite(nowMs) || Math.abs(nowMs) > 8_640_000_000_000_000) {
        throw new Error('INVALID_AS_OF');
    }
}
/** Match the exact strptime format in the source; wider ISO offsets are NOT silently rewritten. */
function sourceDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) {
        throw new Error('SOURCE_DATE_REQUIRES_UTC_SECONDS');
    }
    const time = Date.parse(value);
    if (!Number.isFinite(time) || new Date(time).toISOString().replace('.000Z', 'Z') !== value) {
        throw new Error('INVALID_SOURCE_DATE');
    }
    return time;
}
/**
 * Whitelisted translations of the 16 supplied contractor JQ formulas.
 * The strings in the manifest are provenance, never executed with eval/new Function.
 * Financial results here are source/display calculations, not billing mutations.
 */
export function evaluateCalculation(blueprint, name, input, nowMs) {
    validateAsOf(nowMs);
    if (!Object.hasOwn(formulas, blueprint) || !Object.hasOwn(formulas[blueprint], name)) {
        return { status: 'definition_missing', value: null, issue: 'UNKNOWN_CALCULATION' };
    }
    try {
        if (!object(input))
            throw new Error('INVALID_PROPERTIES');
        const p = input;
        const num = (key, fallback) => {
            const value = p[key];
            if (value === undefined || value === null) {
                if (fallback !== undefined)
                    return fallback;
                throw new Error(`MISSING_CALCULATION_INPUT:${key}`);
            }
            if (typeof value !== 'number' || !Number.isFinite(value))
                throw new Error(`INVALID_NUMBER:${key}`);
            return value;
        };
        const text = (key) => {
            if (p[key] === undefined || p[key] === null)
                return ''; // JQ null + string identity
            if (typeof p[key] !== 'string')
                throw new Error(`INVALID_STRING:${key}`);
            return p[key];
        };
        const has = (key) => p[key] !== undefined && p[key] !== null;
        let value;
        switch (`${blueprint}.${name}`) {
            case 'co_change_order.total_change':
                value = num('labor_change', 0) + num('materials_change', 0);
                break;
            case 'co_scope.total_estimated_cost':
                value = num('estimated_labor_cost', 0) + num('estimated_materials_cost', 0);
                break;
            case 'co_contract.contract_duration_days':
                value = has('start_date') && has('end_date')
                    ? Math.floor((sourceDate(p.end_date) - sourceDate(p.start_date)) / DAY) : null;
                break;
            case 'co_contract.retainage_amount':
                value = num('amount', 0) * (num('retainage_percent', 0) / 100);
                break;
            case 'co_job.billing_variance':
                value = num('billed_to_date', 0) - num('contract_amount', 0) * (num('percent_complete', 0) / 100);
                break;
            case 'co_job.outstanding_balance':
                value = num('contract_amount', 0) - num('collected_to_date', 0);
                break;
            case 'co_trade_spec.estimated_gallons':
                value = p.trade === 'painting' ? Math.ceil(num('measurement_value', 0) / 350 * num('number_of_coats', 1)) : null;
                break;
            case 'co_trade_spec.estimated_squares':
                value = p.trade === 'roofing' ? Math.ceil(num('measurement_value', 0) / 100) : null;
                break;
            case 'co_pricing_rule.effective_rate':
                value = num('base_rate', 0) * (1 + num('overhead_percent', 0) / 100) * (1 + num('profit_margin_percent', 0) / 100);
                break;
            case 'co_pricing_rule.material_multiplier':
                value = 1 + num('material_markup_percent', 0) / 100;
                break;
            case 'co_contact.full_name':
                value = `${text('first_name')} ${text('last_name')}`;
                break;
            case 'co_subcontractor.compliance_status': {
                // Source checks missing values BEFORE expiry: do not silently strengthen its policy.
                if (!has('insurance_expiry') || !has('license_expiry')) {
                    value = 'unknown';
                    break;
                }
                const insurance = sourceDate(p.insurance_expiry), license = sourceDate(p.license_expiry);
                value = insurance < nowMs || license < nowMs ? 'expired'
                    : insurance - nowMs < 30 * DAY || license - nowMs < 30 * DAY ? 'expiring_soon' : 'compliant';
                break;
            }
            case 'co_subcontractor.insurance_days_remaining':
                value = has('insurance_expiry') ? Math.floor((sourceDate(p.insurance_expiry) - nowMs) / DAY) : null;
                break;
            case 'co_subcontractor.license_days_remaining':
                value = has('license_expiry') ? Math.floor((sourceDate(p.license_expiry) - nowMs) / DAY) : null;
                break;
            case 'co_invoice.balance_due':
                value = num('amount') - num('amount_paid', 0);
                break;
            case 'co_bid.days_until_deadline':
                value = has('submission_deadline') ? Math.floor((sourceDate(p.submission_deadline) - nowMs) / DAY) : null;
                break;
            default: return { status: 'definition_missing', value: null, issue: 'TRANSLATION_MISSING' };
        }
        if (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER)) {
            throw new Error('DERIVED_NUMBER_OUT_OF_RANGE');
        }
        return { status: 'computed', value: Object.is(value, -0) ? 0 : value, issue: null };
    }
    catch (error) {
        return { status: 'invalid_input', value: null, issue: error instanceof Error ? error.message : 'INVALID_CALCULATION_INPUT' };
    }
}
