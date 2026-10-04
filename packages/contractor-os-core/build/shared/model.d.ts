export declare const BLUEPRINTS: readonly ["co_automation_rule", "co_bid", "co_campaign", "co_change_order", "co_client", "co_contact", "co_contract", "co_daily_report", "co_document", "co_invoice", "co_job", "co_lead", "co_outreach", "co_payment", "co_pricing_rule", "co_proposal", "co_scope", "co_site_visit", "co_subcontractor", "co_trade_spec"];
export type Blueprint = typeof BLUEPRINTS[number];
export declare const RELATION_TARGETS: Record<string, Record<string, string>>;
export declare const WORKFLOW_CONTRACTS: Record<string, InputSchema>;
export interface InputProperty {
    type: string;
    title?: string;
    enum?: readonly (string | number | boolean)[];
    default?: unknown;
    format?: string;
    blueprint?: string;
    [key: string]: unknown;
}
export interface InputSchema {
    required?: readonly string[];
    properties: Record<string, InputProperty>;
    [key: string]: unknown;
}
