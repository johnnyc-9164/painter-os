export declare const DERIVED_MANIFEST: {
    readonly version: "0.4.0";
    readonly source: "user_schema_transcription_2026_09_22";
    readonly mirrors: {
        readonly co_change_order: {
            readonly client_name: "job.client.$title";
            readonly job_number: "job.job_number";
            readonly contract_number: "contract.contract_number";
        };
        readonly co_proposal: {
            readonly client_name: "client.$title";
            readonly contact_email: "contact.email";
            readonly lead_priority: "lead.priority";
            readonly lead_stage: "lead.stage";
            readonly scope_estimated_hours: "scope.estimated_hours";
            readonly scope_trade_type: "scope.trade_type";
        };
        readonly co_scope: {
            readonly client_name: "lead.client.$title";
            readonly lead_estimated_value: "lead.estimated_value";
            readonly lead_stage: "lead.stage";
        };
        readonly co_contract: {
            readonly bid_amount: "bid.amount";
            readonly bid_type: "bid.bid_type";
            readonly client_name: "client.$title";
            readonly contact_email: "contact.email";
            readonly proposal_amount: "bid.proposal.amount";
        };
        readonly co_site_visit: {
            readonly client_name: "client.$title";
            readonly contact_email: "contact.email";
            readonly lead_estimated_value: "lead.estimated_value";
            readonly lead_stage: "lead.stage";
        };
        readonly co_job: {
            readonly bid_amount: "bid.amount";
            readonly client_name: "client.$title";
            readonly contract_signed_at: "contract.signed_at";
            readonly contract_status: "contract.status";
            readonly contract_type: "contract.contract_type";
        };
        readonly co_trade_spec: {
            readonly scope_client: "scope.lead.client.$title";
            readonly scope_lead: "scope.lead.$title";
            readonly scope_trade_type: "scope.trade_type";
        };
        readonly co_document: {
            readonly campaign_name: "campaign.$title";
            readonly contract_number: "contract.contract_number";
            readonly job_number: "job.job_number";
            readonly job_status: "job.status";
        };
        readonly co_payment: {
            readonly client_name: "client.$title";
            readonly invoice_amount: "invoice.amount";
            readonly invoice_number: "invoice.invoice_number";
            readonly invoice_status: "invoice.status";
        };
        readonly co_outreach: {
            readonly campaign_name: "campaign.$title";
            readonly client_name: "client.$title";
            readonly contact_email: "contact.email";
            readonly contact_first_name: "contact.first_name";
            readonly contact_last_name: "contact.last_name";
        };
        readonly co_automation_rule: {
            readonly campaign_name: "campaign.$title";
            readonly campaign_status: "campaign.status";
            readonly campaign_type: "campaign.campaign_type";
        };
        readonly co_lead: {
            readonly campaign_name: "campaign.$title";
            readonly client_name: "client.$title";
            readonly client_status: "client.status";
            readonly client_type: "client.client_type";
            readonly contact_email: "contact.email";
            readonly contact_first_name: "contact.first_name";
            readonly contact_last_name: "contact.last_name";
        };
        readonly co_contact: {
            readonly client_name: "client.$title";
            readonly client_status: "client.status";
            readonly client_type: "client.client_type";
        };
        readonly co_invoice: {
            readonly client_name: "client.$title";
            readonly contract_amount: "contract.amount";
            readonly contract_number: "contract.contract_number";
            readonly job_number: "job.job_number";
            readonly job_status: "job.status";
        };
        readonly co_bid: {
            readonly client_name: "client.$title";
            readonly lead_estimated_value: "lead.estimated_value";
            readonly lead_stage: "lead.stage";
            readonly proposal_amount: "proposal.amount";
            readonly proposal_status: "proposal.status";
        };
        readonly co_daily_report: {
            readonly client_name: "job.client.$title";
            readonly job_number: "job.job_number";
            readonly job_status: "job.status";
        };
    };
    readonly calculations: {
        readonly co_change_order: {
            readonly total_change: "(.properties.labor_change // 0) + (.properties.materials_change // 0)";
        };
        readonly co_scope: {
            readonly total_estimated_cost: "(.properties.estimated_labor_cost // 0) + (.properties.estimated_materials_cost // 0)";
        };
        readonly co_contract: {
            readonly contract_duration_days: "if (.properties.start_date and .properties.end_date) then ((.properties.end_date | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - (.properties.start_date | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime)) / 86400 | floor else null end";
            readonly retainage_amount: "(.properties.amount // 0) * ((.properties.retainage_percent // 0) / 100)";
        };
        readonly co_job: {
            readonly billing_variance: "(.properties.billed_to_date // 0) - ((.properties.contract_amount // 0) * ((.properties.percent_complete // 0) / 100))";
            readonly outstanding_balance: "(.properties.contract_amount // 0) - (.properties.collected_to_date // 0)";
        };
        readonly co_trade_spec: {
            readonly estimated_gallons: "if .properties.trade == \"painting\" then ((.properties.measurement_value // 0) / 350 * (.properties.number_of_coats // 1) | ceil) else null end";
            readonly estimated_squares: "if .properties.trade == \"roofing\" then ((.properties.measurement_value // 0) / 100 | ceil) else null end";
        };
        readonly co_pricing_rule: {
            readonly effective_rate: "(.properties.base_rate // 0) * (1 + ((.properties.overhead_percent // 0) / 100)) * (1 + ((.properties.profit_margin_percent // 0) / 100))";
            readonly material_multiplier: "1 + ((.properties.material_markup_percent // 0) / 100)";
        };
        readonly co_contact: {
            readonly full_name: ".properties.first_name + \" \" + .properties.last_name";
        };
        readonly co_subcontractor: {
            readonly compliance_status: "if (.properties.insurance_expiry == null or .properties.license_expiry == null) then \"unknown\" elif ((.properties.insurance_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) < now) then \"expired\" elif ((.properties.license_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) < now) then \"expired\" elif ((.properties.insurance_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - now) < 2592000 then \"expiring_soon\" elif ((.properties.license_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - now) < 2592000 then \"expiring_soon\" else \"compliant\" end";
            readonly insurance_days_remaining: "if .properties.insurance_expiry then (((.properties.insurance_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - now) / 86400 | floor) else null end";
            readonly license_days_remaining: "if .properties.license_expiry then (((.properties.license_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - now) / 86400 | floor) else null end";
        };
        readonly co_invoice: {
            readonly balance_due: ".properties.amount - (.properties.amount_paid // 0)";
        };
        readonly co_bid: {
            readonly days_until_deadline: "if .properties.submission_deadline then (((.properties.submission_deadline | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - now) / 86400 | floor) else null end";
        };
    };
    readonly aggregates: {
        readonly co_proposal: {
            readonly total_bids: {
                readonly target: "co_bid";
                readonly func: "count";
                readonly property: null;
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "proposal";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
        };
        readonly co_contract: {
            readonly change_order_count: {
                readonly target: "co_change_order";
                readonly func: "count";
                readonly property: null;
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "contract";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
            readonly invoice_count: {
                readonly target: "co_invoice";
                readonly func: "count";
                readonly property: null;
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "contract";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
            readonly total_invoiced_agg: {
                readonly target: "co_invoice";
                readonly func: "sum";
                readonly property: "amount";
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "contract";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
        };
        readonly co_job: {
            readonly total_invoiced: {
                readonly target: "co_invoice";
                readonly func: "sum";
                readonly property: "amount";
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "job";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
            readonly total_invoices: {
                readonly target: "co_invoice";
                readonly func: "count";
                readonly property: null;
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "job";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
            readonly daily_reports_count: {
                readonly target: "co_daily_report";
                readonly func: "count";
                readonly property: null;
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "job";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
            readonly total_change_orders: {
                readonly target: "co_change_order";
                readonly func: "count";
                readonly property: null;
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "job";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
            readonly total_co_amount: {
                readonly target: "co_change_order";
                readonly func: "sum";
                readonly property: "amount";
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "job";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
        };
        readonly co_client: {
            readonly active_jobs: {
                readonly target: "co_job";
                readonly func: "count";
                readonly property: null;
                readonly filter: {
                    readonly property: "status";
                    readonly equals: "active";
                };
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "client";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
            readonly total_contracts: {
                readonly target: "co_contract";
                readonly func: "count";
                readonly property: null;
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "client";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
            readonly total_jobs: {
                readonly target: "co_job";
                readonly func: "count";
                readonly property: null;
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "client";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
            readonly total_leads: {
                readonly target: "co_lead";
                readonly func: "count";
                readonly property: null;
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "client";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
            readonly total_payments_received: {
                readonly target: "co_payment";
                readonly func: "sum";
                readonly property: "amount";
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "client";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
        };
        readonly co_campaign: {
            readonly total_leads_generated: {
                readonly target: "co_lead";
                readonly func: "count";
                readonly property: null;
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "campaign";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
            readonly total_outreach_sent: {
                readonly target: "co_outreach";
                readonly func: "count";
                readonly property: null;
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "campaign";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
        };
        readonly co_lead: {
            readonly total_proposals: {
                readonly target: "co_proposal";
                readonly func: "count";
                readonly property: null;
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "lead";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
            readonly total_site_visits: {
                readonly target: "co_site_visit";
                readonly func: "count";
                readonly property: null;
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "incoming_single";
                    readonly relation: "lead";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
        };
        readonly co_subcontractor: {
            readonly total_jobs: {
                readonly target: "co_job";
                readonly func: "count";
                readonly property: null;
                readonly filter: null;
                readonly sourcePathFilter: null;
                readonly pathPolicy: {
                    readonly kind: "outgoing_many";
                    readonly relation: "jobs";
                };
                readonly semantics: "component_explicit_paths_v1";
            };
        };
    };
    readonly scorecards: {
        readonly co_client: readonly ["client_health"];
        readonly co_lead: readonly ["lead_quality"];
        readonly co_trade_spec: readonly ["painting_scope_quality", "drywall_scope_quality", "hvac_scope_quality", "electrical_scope_quality", "roofing_scope_quality", "garage_door_scope_quality", "plumbing_scope_quality", "concrete_scope_quality", "landscaping_scope_quality"];
        readonly co_proposal: readonly ["proposal_readiness"];
        readonly co_bid: readonly ["bid_readiness"];
        readonly co_contract: readonly ["contract_completeness"];
        readonly co_job: readonly ["job_health"];
        readonly co_subcontractor: readonly ["sub_compliance", "painter_sub_compliance"];
        readonly co_invoice: readonly ["invoice_health"];
    };
    readonly remaining_source_gaps: readonly ["Contractor required property lists and defaults not explicitly shown", "Array element schemas for tags and certifications", "Ten named contractor scorecards have no supplied predicates in either source", "Port aggregation pathFilters are absent; component uses documented explicit paths, not Port all-path parity", "Some _team formulas are prose summaries and reference properties absent from its supplied property table", "Full workflow node configuration and executable automation conditions not supplied by this schema message", "Some enum-color maps and display metadata are not enumerated; not part of operational validators"];
};
