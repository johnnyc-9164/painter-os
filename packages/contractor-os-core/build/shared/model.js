// Blueprint identities and relation targets from the supplied summary. Workflow inputs from the prior export.
export const BLUEPRINTS = [
    "co_automation_rule",
    "co_bid",
    "co_campaign",
    "co_change_order",
    "co_client",
    "co_contact",
    "co_contract",
    "co_daily_report",
    "co_document",
    "co_invoice",
    "co_job",
    "co_lead",
    "co_outreach",
    "co_payment",
    "co_pricing_rule",
    "co_proposal",
    "co_scope",
    "co_site_visit",
    "co_subcontractor",
    "co_trade_spec"
];
export const RELATION_TARGETS = {
    "co_client": {},
    "co_contact": {
        "client": "co_client"
    },
    "co_lead": {
        "client": "co_client",
        "contact": "co_contact",
        "campaign": "co_campaign"
    },
    "co_site_visit": {
        "contact": "co_contact",
        "client": "co_client",
        "lead": "co_lead"
    },
    "co_scope": {
        "trade_spec": "co_trade_spec",
        "lead": "co_lead",
        "proposal": "co_proposal"
    },
    "co_trade_spec": {
        "scope": "co_scope",
        "pricing_rule": "co_pricing_rule"
    },
    "co_pricing_rule": {},
    "co_proposal": {
        "client": "co_client",
        "lead": "co_lead",
        "contact": "co_contact",
        "scope": "co_scope"
    },
    "co_bid": {
        "proposal": "co_proposal",
        "client": "co_client",
        "lead": "co_lead"
    },
    "co_contract": {
        "contact": "co_contact",
        "client": "co_client",
        "bid": "co_bid"
    },
    "co_job": {
        "contact": "co_contact",
        "contract": "co_contract",
        "bid": "co_bid",
        "client": "co_client",
        "subcontractors": "co_subcontractor"
    },
    "co_subcontractor": {
        "client": "co_client",
        "jobs": "co_job"
    },
    "co_change_order": {
        "job": "co_job",
        "contract": "co_contract"
    },
    "co_invoice": {
        "client": "co_client",
        "contract": "co_contract",
        "job": "co_job"
    },
    "co_payment": {
        "invoice": "co_invoice",
        "client": "co_client"
    },
    "co_daily_report": {
        "job": "co_job"
    },
    "co_campaign": {},
    "co_outreach": {
        "campaign": "co_campaign",
        "contact": "co_contact",
        "client": "co_client"
    },
    "co_automation_rule": {
        "campaign": "co_campaign"
    },
    "co_document": {
        "campaign": "co_campaign",
        "lead": "co_lead",
        "job": "co_job",
        "contract": "co_contract"
    }
};
export const WORKFLOW_CONTRACTS = {
    "co_create_lead": {
        "order": [
            "title",
            "client",
            "contact",
            "stage",
            "priority",
            "estimated_value",
            "source",
            "description"
        ],
        "required": [
            "title",
            "client"
        ],
        "properties": {
            "stage": {
                "enum": [
                    "new",
                    "qualifying",
                    "site_visit_scheduled",
                    "scope_in_progress",
                    "proposal_sent",
                    "bid_submitted",
                    "awarded",
                    "won",
                    "lost",
                    "on_hold"
                ],
                "type": "string",
                "title": "Stage",
                "default": "new"
            },
            "title": {
                "type": "string",
                "title": "Lead Title"
            },
            "client": {
                "type": "string",
                "title": "Client",
                "format": "entity",
                "blueprint": "co_client"
            },
            "source": {
                "enum": [
                    "cold_outreach",
                    "referral",
                    "repeat_client",
                    "website",
                    "bid_board",
                    "walk_in",
                    "other"
                ],
                "type": "string",
                "title": "Source"
            },
            "contact": {
                "type": "string",
                "title": "Contact",
                "format": "entity",
                "blueprint": "co_contact"
            },
            "priority": {
                "enum": [
                    "low",
                    "medium",
                    "high",
                    "urgent"
                ],
                "type": "string",
                "title": "Priority",
                "default": "medium"
            },
            "description": {
                "type": "string",
                "title": "Description"
            },
            "estimated_value": {
                "type": "number",
                "title": "Estimated Value ($)"
            }
        }
    },
    "co_schedule_site_visit": {
        "order": [
            "lead",
            "visit_date",
            "address",
            "notes"
        ],
        "required": [
            "lead",
            "visit_date"
        ],
        "properties": {
            "lead": {
                "type": "string",
                "title": "Lead",
                "format": "entity",
                "blueprint": "co_lead"
            },
            "notes": {
                "type": "string",
                "title": "Notes"
            },
            "address": {
                "type": "string",
                "title": "Site Address"
            },
            "visit_date": {
                "type": "string",
                "title": "Visit Date",
                "format": "date-time"
            }
        }
    },
    "co_advance_lead": {
        "order": [
            "lead",
            "new_stage",
            "followup_notes",
            "next_followup_date"
        ],
        "required": [
            "lead",
            "new_stage"
        ],
        "properties": {
            "lead": {
                "type": "string",
                "title": "Lead",
                "format": "entity",
                "blueprint": "co_lead"
            },
            "new_stage": {
                "enum": [
                    "qualifying",
                    "site_visit_scheduled",
                    "scope_in_progress",
                    "proposal_sent",
                    "bid_submitted",
                    "awarded",
                    "won",
                    "lost",
                    "on_hold"
                ],
                "type": "string",
                "title": "New Stage"
            },
            "followup_notes": {
                "type": "string",
                "title": "Notes"
            },
            "next_followup_date": {
                "type": "string",
                "title": "Next Follow-up Date",
                "format": "date-time"
            }
        }
    },
    "co_create_scope": {
        "order": [
            "lead",
            "trade_type",
            "estimated_hours",
            "estimated_labor_cost",
            "estimated_materials_cost",
            "description",
            "version"
        ],
        "required": [
            "lead"
        ],
        "properties": {
            "lead": {
                "type": "string",
                "title": "Lead",
                "format": "entity",
                "blueprint": "co_lead"
            },
            "version": {
                "type": "string",
                "title": "Version",
                "default": "1"
            },
            "trade_type": {
                "enum": [
                    "general",
                    "electrical",
                    "plumbing",
                    "hvac",
                    "structural",
                    "civil",
                    "concrete",
                    "roofing",
                    "landscaping",
                    "painting",
                    "other"
                ],
                "type": "string",
                "title": "Trade Type"
            },
            "description": {
                "type": "string",
                "title": "Scope Description"
            },
            "estimated_hours": {
                "type": "number",
                "title": "Estimated Hours"
            },
            "estimated_labor_cost": {
                "type": "number",
                "title": "Est. Labor Cost ($)"
            },
            "estimated_materials_cost": {
                "type": "number",
                "title": "Est. Materials Cost ($)"
            }
        }
    },
    "co_create_proposal": {
        "order": [
            "scope",
            "lead",
            "client",
            "amount",
            "expires_at",
            "notes",
            "version"
        ],
        "required": [
            "scope",
            "lead",
            "client",
            "amount"
        ],
        "properties": {
            "lead": {
                "type": "string",
                "title": "Lead",
                "format": "entity",
                "blueprint": "co_lead"
            },
            "notes": {
                "type": "string",
                "title": "Notes"
            },
            "scope": {
                "type": "string",
                "title": "Scope of Work",
                "format": "entity",
                "blueprint": "co_scope"
            },
            "amount": {
                "type": "number",
                "title": "Proposal Amount ($)"
            },
            "client": {
                "type": "string",
                "title": "Client",
                "format": "entity",
                "blueprint": "co_client"
            },
            "version": {
                "type": "string",
                "title": "Version",
                "default": "1"
            },
            "expires_at": {
                "type": "string",
                "title": "Expires At",
                "format": "date-time"
            }
        }
    },
    "co_submit_bid": {
        "order": [
            "proposal",
            "lead",
            "client",
            "bid_type",
            "amount",
            "bid_number",
            "submission_deadline",
            "bond_required"
        ],
        "required": [
            "proposal",
            "lead",
            "client",
            "bid_type",
            "amount"
        ],
        "properties": {
            "lead": {
                "type": "string",
                "title": "Lead",
                "format": "entity",
                "blueprint": "co_lead"
            },
            "amount": {
                "type": "number",
                "title": "Bid Amount ($)"
            },
            "client": {
                "type": "string",
                "title": "Client",
                "format": "entity",
                "blueprint": "co_client"
            },
            "bid_type": {
                "enum": [
                    "open",
                    "invited",
                    "negotiated",
                    "sole_source"
                ],
                "type": "string",
                "title": "Bid Type"
            },
            "proposal": {
                "type": "string",
                "title": "Proposal",
                "format": "entity",
                "blueprint": "co_proposal"
            },
            "bid_number": {
                "type": "string",
                "title": "Bid Number"
            },
            "bond_required": {
                "type": "boolean",
                "title": "Bond Required?",
                "default": false
            },
            "submission_deadline": {
                "type": "string",
                "title": "Submission Deadline",
                "format": "date-time"
            }
        }
    },
    "co_record_payment": {
        "order": [
            "invoice",
            "client",
            "amount",
            "payment_date",
            "payment_method",
            "reference_number"
        ],
        "required": [
            "invoice",
            "client",
            "amount",
            "payment_date",
            "payment_method"
        ],
        "properties": {
            "amount": {
                "type": "number",
                "title": "Amount ($)"
            },
            "client": {
                "type": "string",
                "title": "Client",
                "format": "entity",
                "blueprint": "co_client"
            },
            "invoice": {
                "type": "string",
                "title": "Invoice",
                "format": "entity",
                "blueprint": "co_invoice"
            },
            "payment_date": {
                "type": "string",
                "title": "Payment Date",
                "format": "date-time"
            },
            "payment_method": {
                "enum": [
                    "check",
                    "ach",
                    "wire",
                    "credit_card",
                    "cash",
                    "other"
                ],
                "type": "string",
                "title": "Payment Method"
            },
            "reference_number": {
                "type": "string",
                "title": "Reference / Check Number"
            }
        }
    },
    "co_create_job": {
        "order": [
            "contract",
            "client",
            "job_number",
            "job_type",
            "address",
            "city",
            "state",
            "project_manager",
            "start_date"
        ],
        "required": [
            "contract",
            "client",
            "job_number",
            "job_type"
        ],
        "properties": {
            "city": {
                "type": "string",
                "title": "City"
            },
            "state": {
                "type": "string",
                "title": "State"
            },
            "client": {
                "type": "string",
                "title": "Client",
                "format": "entity",
                "blueprint": "co_client"
            },
            "address": {
                "type": "string",
                "title": "Job Address"
            },
            "contract": {
                "type": "string",
                "title": "Contract",
                "format": "entity",
                "blueprint": "co_contract"
            },
            "job_type": {
                "enum": [
                    "commercial",
                    "residential",
                    "municipal",
                    "subcontract",
                    "general"
                ],
                "type": "string",
                "title": "Job Type"
            },
            "job_number": {
                "type": "string",
                "title": "Job Number"
            },
            "start_date": {
                "type": "string",
                "title": "Start Date",
                "format": "date-time"
            },
            "project_manager": {
                "type": "string",
                "title": "Project Manager"
            }
        }
    },
    "co_convert_bid_to_contract": {
        "order": [
            "bid",
            "client",
            "contact",
            "contract_type",
            "contract_number",
            "retainage_percent",
            "start_date",
            "end_date"
        ],
        "required": [
            "bid",
            "client",
            "contract_type"
        ],
        "properties": {
            "bid": {
                "type": "string",
                "title": "Winning Bid",
                "format": "entity",
                "blueprint": "co_bid"
            },
            "client": {
                "type": "string",
                "title": "Client",
                "format": "entity",
                "blueprint": "co_client"
            },
            "contact": {
                "type": "string",
                "title": "Contact",
                "format": "entity",
                "blueprint": "co_contact"
            },
            "end_date": {
                "type": "string",
                "title": "End Date",
                "format": "date-time"
            },
            "start_date": {
                "type": "string",
                "title": "Start Date",
                "format": "date-time"
            },
            "contract_type": {
                "enum": [
                    "lump_sum",
                    "time_and_materials",
                    "unit_price",
                    "cost_plus",
                    "gmp"
                ],
                "type": "string",
                "title": "Contract Type"
            },
            "contract_number": {
                "type": "string",
                "title": "Contract Number"
            },
            "retainage_percent": {
                "type": "number",
                "title": "Retainage %",
                "default": 10
            }
        }
    },
    "co_mark_contract_signed": {
        "order": [
            "contract",
            "contract_doc_url",
            "docusign_envelope_id"
        ],
        "required": [
            "contract"
        ],
        "properties": {
            "contract": {
                "type": "string",
                "title": "Contract",
                "format": "entity",
                "blueprint": "co_contract"
            },
            "contract_doc_url": {
                "type": "string",
                "title": "Contract Doc URL",
                "format": "url"
            },
            "docusign_envelope_id": {
                "type": "string",
                "title": "DocuSign Envelope ID"
            }
        }
    },
    "co_create_invoice": {
        "order": [
            "job",
            "client",
            "contract",
            "invoice_number",
            "invoice_type",
            "amount",
            "due_date"
        ],
        "required": [
            "job",
            "client",
            "invoice_number",
            "invoice_type",
            "amount",
            "due_date"
        ],
        "properties": {
            "job": {
                "type": "string",
                "title": "Job",
                "format": "entity",
                "blueprint": "co_job"
            },
            "amount": {
                "type": "number",
                "title": "Amount ($)"
            },
            "client": {
                "type": "string",
                "title": "Client",
                "format": "entity",
                "blueprint": "co_client"
            },
            "contract": {
                "type": "string",
                "title": "Contract",
                "format": "entity",
                "blueprint": "co_contract"
            },
            "due_date": {
                "type": "string",
                "title": "Due Date",
                "format": "date-time"
            },
            "invoice_type": {
                "enum": [
                    "progress",
                    "final",
                    "retainage",
                    "change_order",
                    "deposit"
                ],
                "type": "string",
                "title": "Invoice Type"
            },
            "invoice_number": {
                "type": "string",
                "title": "Invoice Number"
            }
        }
    }
};
