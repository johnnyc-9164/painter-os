export declare const SCORECARD_SNAPSHOT: {
    readonly scorecards: readonly [{
        readonly identifier: "bid_readiness";
        readonly title: "Bid Readiness";
        readonly properties: {
            readonly blueprint: "co_bid";
            readonly levels: readonly [{
                readonly color: "paleBlue";
                readonly title: "Basic";
            }, {
                readonly color: "bronze";
                readonly title: "Bronze";
            }, {
                readonly color: "silver";
                readonly title: "Silver";
            }, {
                readonly color: "gold";
                readonly title: "Gold";
            }];
            readonly filter: null;
            readonly of_rules_passed: 0;
            readonly rules_tested: 2;
            readonly rules_passed: 0;
        };
    }, {
        readonly identifier: "job_health";
        readonly title: "Job Health";
        readonly properties: {
            readonly blueprint: "co_job";
            readonly levels: readonly [{
                readonly color: "paleBlue";
                readonly title: "Basic";
            }, {
                readonly color: "bronze";
                readonly title: "Bronze";
            }, {
                readonly color: "silver";
                readonly title: "Silver";
            }, {
                readonly color: "gold";
                readonly title: "Gold";
            }];
            readonly filter: null;
            readonly of_rules_passed: null;
            readonly rules_tested: 0;
            readonly rules_passed: 0;
        };
    }, {
        readonly identifier: "client_health";
        readonly title: "Client Health";
        readonly properties: {
            readonly blueprint: "co_client";
            readonly levels: readonly [{
                readonly color: "paleBlue";
                readonly title: "Basic";
            }, {
                readonly color: "bronze";
                readonly title: "Bronze";
            }, {
                readonly color: "silver";
                readonly title: "Silver";
            }, {
                readonly color: "gold";
                readonly title: "Gold";
            }];
            readonly filter: null;
            readonly of_rules_passed: 0;
            readonly rules_tested: 3;
            readonly rules_passed: 0;
        };
    }, {
        readonly identifier: "sub_compliance";
        readonly title: "Sub Compliance";
        readonly properties: {
            readonly blueprint: "co_subcontractor";
            readonly levels: readonly [{
                readonly color: "paleBlue";
                readonly title: "Basic";
            }, {
                readonly color: "bronze";
                readonly title: "Bronze";
            }, {
                readonly color: "silver";
                readonly title: "Silver";
            }, {
                readonly color: "gold";
                readonly title: "Gold";
            }];
            readonly filter: null;
            readonly of_rules_passed: null;
            readonly rules_tested: 0;
            readonly rules_passed: 0;
        };
    }, {
        readonly identifier: "invoice_health";
        readonly title: "Invoice Health";
        readonly properties: {
            readonly blueprint: "co_invoice";
            readonly levels: readonly [{
                readonly color: "paleBlue";
                readonly title: "Basic";
            }, {
                readonly color: "bronze";
                readonly title: "Bronze";
            }, {
                readonly color: "silver";
                readonly title: "Silver";
            }, {
                readonly color: "gold";
                readonly title: "Gold";
            }];
            readonly filter: null;
            readonly of_rules_passed: 0;
            readonly rules_tested: 3;
            readonly rules_passed: 0;
        };
    }, {
        readonly identifier: "proposal_readiness";
        readonly title: "Proposal Readiness";
        readonly properties: {
            readonly blueprint: "co_proposal";
            readonly levels: readonly [{
                readonly color: "paleBlue";
                readonly title: "Basic";
            }, {
                readonly color: "bronze";
                readonly title: "Bronze";
            }, {
                readonly color: "silver";
                readonly title: "Silver";
            }, {
                readonly color: "gold";
                readonly title: "Gold";
            }];
            readonly filter: null;
            readonly of_rules_passed: 33.33;
            readonly rules_tested: 3;
            readonly rules_passed: 1;
        };
    }, {
        readonly identifier: "contract_completeness";
        readonly title: "Contract Completeness";
        readonly properties: {
            readonly blueprint: "co_contract";
            readonly levels: readonly [{
                readonly color: "paleBlue";
                readonly title: "Basic";
            }, {
                readonly color: "bronze";
                readonly title: "Bronze";
            }, {
                readonly color: "silver";
                readonly title: "Silver";
            }, {
                readonly color: "gold";
                readonly title: "Gold";
            }];
            readonly filter: null;
            readonly of_rules_passed: null;
            readonly rules_tested: 0;
            readonly rules_passed: 0;
        };
    }, {
        readonly identifier: "lead_quality";
        readonly title: "Lead Quality";
        readonly properties: {
            readonly blueprint: "co_lead";
            readonly levels: readonly [{
                readonly color: "paleBlue";
                readonly title: "Basic";
            }, {
                readonly color: "bronze";
                readonly title: "Bronze";
            }, {
                readonly color: "silver";
                readonly title: "Silver";
            }, {
                readonly color: "gold";
                readonly title: "Gold";
            }];
            readonly filter: null;
            readonly of_rules_passed: 33.33;
            readonly rules_tested: 3;
            readonly rules_passed: 1;
        };
    }];
    readonly rules: readonly [{
        readonly identifier: "bid_readiness_compliance_verified";
        readonly title: "Insurance Verified & Capability Statement Attached";
        readonly properties: {
            readonly level: "Silver";
            readonly rule_description: "Both insurance_verified and capability_statement_attached must be true before submitting.";
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly value: true;
                    readonly operator: "=";
                    readonly property: "insurance_verified";
                }, {
                    readonly value: true;
                    readonly operator: "=";
                    readonly property: "capability_statement_attached";
                }];
            };
            readonly of_entities_passed: 0;
            readonly entities_tested: 1;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "bid_readiness";
                readonly title: "Bid Readiness";
            };
        };
    }, {
        readonly identifier: "bid_readiness_bid_submitted";
        readonly title: "Bid Has Been Submitted";
        readonly properties: {
            readonly level: "Gold";
            readonly rule_description: "The bid was formally submitted (submitted_at is set and status is submitted, under_review, or awarded).";
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly operator: "isNotEmpty";
                    readonly property: "submitted_at";
                }, {
                    readonly value: readonly ["submitted", "under_review", "awarded"];
                    readonly operator: "in";
                    readonly property: "status";
                }];
            };
            readonly of_entities_passed: 0;
            readonly entities_tested: 1;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "bid_readiness";
                readonly title: "Bid Readiness";
            };
        };
    }, {
        readonly identifier: "job_health_billing_active";
        readonly title: "Billing Is Active";
        readonly properties: {
            readonly level: "Gold";
            readonly rule_description: "At least some billing has occurred — billed_to_date is greater than 0.";
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly value: 0;
                    readonly operator: ">";
                    readonly property: "billed_to_date";
                }, {
                    readonly value: 0;
                    readonly operator: ">";
                    readonly property: "contract_amount";
                }];
            };
            readonly of_entities_passed: null;
            readonly entities_tested: 0;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "job_health";
                readonly title: "Job Health";
            };
        };
    }, {
        readonly identifier: "job_health_work_in_progress";
        readonly title: "Work Is In Progress";
        readonly properties: {
            readonly level: "Silver";
            readonly rule_description: "Job percent_complete is greater than 0 and status is active or further.";
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly value: 0;
                    readonly operator: ">";
                    readonly property: "percent_complete";
                }, {
                    readonly value: readonly ["mobilizing", "active", "punch_list", "complete", "closed"];
                    readonly operator: "in";
                    readonly property: "status";
                }];
            };
            readonly of_entities_passed: null;
            readonly entities_tested: 0;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "job_health";
                readonly title: "Job Health";
            };
        };
    }, {
        readonly identifier: "client_health_ch_gold";
        readonly title: "Active Account";
        readonly properties: {
            readonly level: "Gold";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly value: "active";
                    readonly operator: "=";
                    readonly property: "status";
                }];
            };
            readonly of_entities_passed: 0;
            readonly entities_tested: 1;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "client_health";
                readonly title: "Client Health";
            };
        };
    }, {
        readonly identifier: "lead_quality_lq_bronze";
        readonly title: "Has Value & Priority";
        readonly properties: {
            readonly level: "Bronze";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly operator: "isNotEmpty";
                    readonly property: "estimated_value";
                }, {
                    readonly operator: "isNotEmpty";
                    readonly property: "priority";
                }];
            };
            readonly of_entities_passed: 100;
            readonly entities_tested: 1;
            readonly entities_passed: 1;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "lead_quality";
                readonly title: "Lead Quality";
            };
        };
    }, {
        readonly identifier: "sub_compliance_subc_gold";
        readonly title: "Active / Prequalified";
        readonly properties: {
            readonly level: "Gold";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "or";
                readonly conditions: readonly [{
                    readonly value: "active";
                    readonly operator: "=";
                    readonly property: "status";
                }, {
                    readonly value: "prequalified";
                    readonly operator: "=";
                    readonly property: "status";
                }];
            };
            readonly of_entities_passed: null;
            readonly entities_tested: 0;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "sub_compliance";
                readonly title: "Sub Compliance";
            };
        };
    }, {
        readonly identifier: "proposal_readiness_propready_bronze";
        readonly title: "Has Amount & Status";
        readonly properties: {
            readonly level: "Bronze";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly operator: "isNotEmpty";
                    readonly property: "amount";
                }, {
                    readonly operator: "isNotEmpty";
                    readonly property: "status";
                }];
            };
            readonly of_entities_passed: 100;
            readonly entities_tested: 1;
            readonly entities_passed: 1;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "proposal_readiness";
                readonly title: "Proposal Readiness";
            };
        };
    }, {
        readonly identifier: "invoice_health_ih_bronze";
        readonly title: "Complete Invoice";
        readonly properties: {
            readonly level: "Bronze";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly operator: "isNotEmpty";
                    readonly property: "amount";
                }, {
                    readonly operator: "isNotEmpty";
                    readonly property: "invoice_number";
                }, {
                    readonly operator: "isNotEmpty";
                    readonly property: "due_date";
                }];
            };
            readonly of_entities_passed: 0;
            readonly entities_tested: 1;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "invoice_health";
                readonly title: "Invoice Health";
            };
        };
    }, {
        readonly identifier: "invoice_health_ih_gold";
        readonly title: "QB Synced";
        readonly properties: {
            readonly level: "Gold";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly operator: "isNotEmpty";
                    readonly property: "quickbooks_id";
                }];
            };
            readonly of_entities_passed: 0;
            readonly entities_tested: 1;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "invoice_health";
                readonly title: "Invoice Health";
            };
        };
    }, {
        readonly identifier: "proposal_readiness_propready_silver";
        readonly title: "Has Been Sent";
        readonly properties: {
            readonly level: "Silver";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly operator: "isNotEmpty";
                    readonly property: "sent_at";
                }];
            };
            readonly of_entities_passed: 0;
            readonly entities_tested: 1;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "proposal_readiness";
                readonly title: "Proposal Readiness";
            };
        };
    }, {
        readonly identifier: "client_health_ch_bronze";
        readonly title: "Has Contact Info";
        readonly properties: {
            readonly level: "Bronze";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly operator: "isNotEmpty";
                    readonly property: "email";
                }, {
                    readonly operator: "isNotEmpty";
                    readonly property: "phone";
                }];
            };
            readonly of_entities_passed: 0;
            readonly entities_tested: 1;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "client_health";
                readonly title: "Client Health";
            };
        };
    }, {
        readonly identifier: "lead_quality_lq_gold";
        readonly title: "Sales-Ready";
        readonly properties: {
            readonly level: "Gold";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly operator: "isNotEmpty";
                    readonly property: "expected_close_date";
                }, {
                    readonly operator: "isNotEmpty";
                    readonly property: "description";
                }];
            };
            readonly of_entities_passed: 0;
            readonly entities_tested: 1;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "lead_quality";
                readonly title: "Lead Quality";
            };
        };
    }, {
        readonly identifier: "contract_completeness_cc_silver";
        readonly title: "Fully Executed";
        readonly properties: {
            readonly level: "Silver";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly operator: "isNotEmpty";
                    readonly property: "signed_at";
                }, {
                    readonly operator: "isNotEmpty";
                    readonly property: "contract_type";
                }];
            };
            readonly of_entities_passed: null;
            readonly entities_tested: 0;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "contract_completeness";
                readonly title: "Contract Completeness";
            };
        };
    }, {
        readonly identifier: "contract_completeness_cc_bronze";
        readonly title: "Has Amount & Number";
        readonly properties: {
            readonly level: "Bronze";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly operator: "isNotEmpty";
                    readonly property: "amount";
                }, {
                    readonly operator: "isNotEmpty";
                    readonly property: "contract_number";
                }];
            };
            readonly of_entities_passed: null;
            readonly entities_tested: 0;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "contract_completeness";
                readonly title: "Contract Completeness";
            };
        };
    }, {
        readonly identifier: "invoice_health_ih_silver";
        readonly title: "Issued";
        readonly properties: {
            readonly level: "Silver";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly operator: "isNotEmpty";
                    readonly property: "issued_date";
                }];
            };
            readonly of_entities_passed: 0;
            readonly entities_tested: 1;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "invoice_health";
                readonly title: "Invoice Health";
            };
        };
    }, {
        readonly identifier: "lead_quality_lq_silver";
        readonly title: "Qualified Lead";
        readonly properties: {
            readonly level: "Silver";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly value: "new";
                    readonly operator: "!=";
                    readonly property: "stage";
                }, {
                    readonly operator: "isNotEmpty";
                    readonly property: "source";
                }];
            };
            readonly of_entities_passed: 0;
            readonly entities_tested: 1;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "lead_quality";
                readonly title: "Lead Quality";
            };
        };
    }, {
        readonly identifier: "client_health_ch_silver";
        readonly title: "Classified Client";
        readonly properties: {
            readonly level: "Silver";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly operator: "isNotEmpty";
                    readonly property: "client_type";
                }, {
                    readonly operator: "isNotEmpty";
                    readonly property: "address";
                }];
            };
            readonly of_entities_passed: 0;
            readonly entities_tested: 1;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "client_health";
                readonly title: "Client Health";
            };
        };
    }, {
        readonly identifier: "proposal_readiness_propready_gold";
        readonly title: "Doc Attached";
        readonly properties: {
            readonly level: "Gold";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly operator: "isNotEmpty";
                    readonly property: "proposal_doc_url";
                }];
            };
            readonly of_entities_passed: 0;
            readonly entities_tested: 1;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "proposal_readiness";
                readonly title: "Proposal Readiness";
            };
        };
    }, {
        readonly identifier: "contract_completeness_cc_gold";
        readonly title: "Docs & Dates Set";
        readonly properties: {
            readonly level: "Gold";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly operator: "isNotEmpty";
                    readonly property: "contract_doc_url";
                }, {
                    readonly operator: "isNotEmpty";
                    readonly property: "start_date";
                }];
            };
            readonly of_entities_passed: null;
            readonly entities_tested: 0;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "contract_completeness";
                readonly title: "Contract Completeness";
            };
        };
    }, {
        readonly identifier: "sub_compliance_subc_bronze";
        readonly title: "Has License & Insurance";
        readonly properties: {
            readonly level: "Bronze";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly operator: "isNotEmpty";
                    readonly property: "license_number";
                }, {
                    readonly operator: "isNotEmpty";
                    readonly property: "insurance_expiry";
                }, {
                    readonly operator: "isNotEmpty";
                    readonly property: "license_expiry";
                }];
            };
            readonly of_entities_passed: null;
            readonly entities_tested: 0;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "sub_compliance";
                readonly title: "Sub Compliance";
            };
        };
    }, {
        readonly identifier: "sub_compliance_subc_silver";
        readonly title: "W-9 On File";
        readonly properties: {
            readonly level: "Silver";
            readonly rule_description: null;
            readonly query: {
                readonly combinator: "and";
                readonly conditions: readonly [{
                    readonly value: true;
                    readonly operator: "=";
                    readonly property: "w9_on_file";
                }];
            };
            readonly of_entities_passed: null;
            readonly entities_tested: 0;
            readonly entities_passed: 0;
        };
        readonly relations: {
            readonly scorecard: {
                readonly identifier: "sub_compliance";
                readonly title: "Sub Compliance";
            };
        };
    }];
};
