// Historical exported scorecard definitions and predicates, not current Port execution results.
export const SCORECARD_SNAPSHOT = {
    "scorecards": [
        {
            "identifier": "bid_readiness",
            "title": "Bid Readiness",
            "properties": {
                "blueprint": "co_bid",
                "levels": [
                    {
                        "color": "paleBlue",
                        "title": "Basic"
                    },
                    {
                        "color": "bronze",
                        "title": "Bronze"
                    },
                    {
                        "color": "silver",
                        "title": "Silver"
                    },
                    {
                        "color": "gold",
                        "title": "Gold"
                    }
                ],
                "filter": null,
                "of_rules_passed": 0,
                "rules_tested": 2,
                "rules_passed": 0
            }
        },
        {
            "identifier": "job_health",
            "title": "Job Health",
            "properties": {
                "blueprint": "co_job",
                "levels": [
                    {
                        "color": "paleBlue",
                        "title": "Basic"
                    },
                    {
                        "color": "bronze",
                        "title": "Bronze"
                    },
                    {
                        "color": "silver",
                        "title": "Silver"
                    },
                    {
                        "color": "gold",
                        "title": "Gold"
                    }
                ],
                "filter": null,
                "of_rules_passed": null,
                "rules_tested": 0,
                "rules_passed": 0
            }
        },
        {
            "identifier": "client_health",
            "title": "Client Health",
            "properties": {
                "blueprint": "co_client",
                "levels": [
                    {
                        "color": "paleBlue",
                        "title": "Basic"
                    },
                    {
                        "color": "bronze",
                        "title": "Bronze"
                    },
                    {
                        "color": "silver",
                        "title": "Silver"
                    },
                    {
                        "color": "gold",
                        "title": "Gold"
                    }
                ],
                "filter": null,
                "of_rules_passed": 0,
                "rules_tested": 3,
                "rules_passed": 0
            }
        },
        {
            "identifier": "sub_compliance",
            "title": "Sub Compliance",
            "properties": {
                "blueprint": "co_subcontractor",
                "levels": [
                    {
                        "color": "paleBlue",
                        "title": "Basic"
                    },
                    {
                        "color": "bronze",
                        "title": "Bronze"
                    },
                    {
                        "color": "silver",
                        "title": "Silver"
                    },
                    {
                        "color": "gold",
                        "title": "Gold"
                    }
                ],
                "filter": null,
                "of_rules_passed": null,
                "rules_tested": 0,
                "rules_passed": 0
            }
        },
        {
            "identifier": "invoice_health",
            "title": "Invoice Health",
            "properties": {
                "blueprint": "co_invoice",
                "levels": [
                    {
                        "color": "paleBlue",
                        "title": "Basic"
                    },
                    {
                        "color": "bronze",
                        "title": "Bronze"
                    },
                    {
                        "color": "silver",
                        "title": "Silver"
                    },
                    {
                        "color": "gold",
                        "title": "Gold"
                    }
                ],
                "filter": null,
                "of_rules_passed": 0,
                "rules_tested": 3,
                "rules_passed": 0
            }
        },
        {
            "identifier": "proposal_readiness",
            "title": "Proposal Readiness",
            "properties": {
                "blueprint": "co_proposal",
                "levels": [
                    {
                        "color": "paleBlue",
                        "title": "Basic"
                    },
                    {
                        "color": "bronze",
                        "title": "Bronze"
                    },
                    {
                        "color": "silver",
                        "title": "Silver"
                    },
                    {
                        "color": "gold",
                        "title": "Gold"
                    }
                ],
                "filter": null,
                "of_rules_passed": 33.33,
                "rules_tested": 3,
                "rules_passed": 1
            }
        },
        {
            "identifier": "contract_completeness",
            "title": "Contract Completeness",
            "properties": {
                "blueprint": "co_contract",
                "levels": [
                    {
                        "color": "paleBlue",
                        "title": "Basic"
                    },
                    {
                        "color": "bronze",
                        "title": "Bronze"
                    },
                    {
                        "color": "silver",
                        "title": "Silver"
                    },
                    {
                        "color": "gold",
                        "title": "Gold"
                    }
                ],
                "filter": null,
                "of_rules_passed": null,
                "rules_tested": 0,
                "rules_passed": 0
            }
        },
        {
            "identifier": "lead_quality",
            "title": "Lead Quality",
            "properties": {
                "blueprint": "co_lead",
                "levels": [
                    {
                        "color": "paleBlue",
                        "title": "Basic"
                    },
                    {
                        "color": "bronze",
                        "title": "Bronze"
                    },
                    {
                        "color": "silver",
                        "title": "Silver"
                    },
                    {
                        "color": "gold",
                        "title": "Gold"
                    }
                ],
                "filter": null,
                "of_rules_passed": 33.33,
                "rules_tested": 3,
                "rules_passed": 1
            }
        }
    ],
    "rules": [
        {
            "identifier": "bid_readiness_compliance_verified",
            "title": "Insurance Verified & Capability Statement Attached",
            "properties": {
                "level": "Silver",
                "rule_description": "Both insurance_verified and capability_statement_attached must be true before submitting.",
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "value": true,
                            "operator": "=",
                            "property": "insurance_verified"
                        },
                        {
                            "value": true,
                            "operator": "=",
                            "property": "capability_statement_attached"
                        }
                    ]
                },
                "of_entities_passed": 0,
                "entities_tested": 1,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "bid_readiness",
                    "title": "Bid Readiness"
                }
            }
        },
        {
            "identifier": "bid_readiness_bid_submitted",
            "title": "Bid Has Been Submitted",
            "properties": {
                "level": "Gold",
                "rule_description": "The bid was formally submitted (submitted_at is set and status is submitted, under_review, or awarded).",
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "operator": "isNotEmpty",
                            "property": "submitted_at"
                        },
                        {
                            "value": [
                                "submitted",
                                "under_review",
                                "awarded"
                            ],
                            "operator": "in",
                            "property": "status"
                        }
                    ]
                },
                "of_entities_passed": 0,
                "entities_tested": 1,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "bid_readiness",
                    "title": "Bid Readiness"
                }
            }
        },
        {
            "identifier": "job_health_billing_active",
            "title": "Billing Is Active",
            "properties": {
                "level": "Gold",
                "rule_description": "At least some billing has occurred \u2014 billed_to_date is greater than 0.",
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "value": 0,
                            "operator": ">",
                            "property": "billed_to_date"
                        },
                        {
                            "value": 0,
                            "operator": ">",
                            "property": "contract_amount"
                        }
                    ]
                },
                "of_entities_passed": null,
                "entities_tested": 0,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "job_health",
                    "title": "Job Health"
                }
            }
        },
        {
            "identifier": "job_health_work_in_progress",
            "title": "Work Is In Progress",
            "properties": {
                "level": "Silver",
                "rule_description": "Job percent_complete is greater than 0 and status is active or further.",
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "value": 0,
                            "operator": ">",
                            "property": "percent_complete"
                        },
                        {
                            "value": [
                                "mobilizing",
                                "active",
                                "punch_list",
                                "complete",
                                "closed"
                            ],
                            "operator": "in",
                            "property": "status"
                        }
                    ]
                },
                "of_entities_passed": null,
                "entities_tested": 0,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "job_health",
                    "title": "Job Health"
                }
            }
        },
        {
            "identifier": "client_health_ch_gold",
            "title": "Active Account",
            "properties": {
                "level": "Gold",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "value": "active",
                            "operator": "=",
                            "property": "status"
                        }
                    ]
                },
                "of_entities_passed": 0,
                "entities_tested": 1,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "client_health",
                    "title": "Client Health"
                }
            }
        },
        {
            "identifier": "lead_quality_lq_bronze",
            "title": "Has Value & Priority",
            "properties": {
                "level": "Bronze",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "operator": "isNotEmpty",
                            "property": "estimated_value"
                        },
                        {
                            "operator": "isNotEmpty",
                            "property": "priority"
                        }
                    ]
                },
                "of_entities_passed": 100,
                "entities_tested": 1,
                "entities_passed": 1
            },
            "relations": {
                "scorecard": {
                    "identifier": "lead_quality",
                    "title": "Lead Quality"
                }
            }
        },
        {
            "identifier": "sub_compliance_subc_gold",
            "title": "Active / Prequalified",
            "properties": {
                "level": "Gold",
                "rule_description": null,
                "query": {
                    "combinator": "or",
                    "conditions": [
                        {
                            "value": "active",
                            "operator": "=",
                            "property": "status"
                        },
                        {
                            "value": "prequalified",
                            "operator": "=",
                            "property": "status"
                        }
                    ]
                },
                "of_entities_passed": null,
                "entities_tested": 0,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "sub_compliance",
                    "title": "Sub Compliance"
                }
            }
        },
        {
            "identifier": "proposal_readiness_propready_bronze",
            "title": "Has Amount & Status",
            "properties": {
                "level": "Bronze",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "operator": "isNotEmpty",
                            "property": "amount"
                        },
                        {
                            "operator": "isNotEmpty",
                            "property": "status"
                        }
                    ]
                },
                "of_entities_passed": 100,
                "entities_tested": 1,
                "entities_passed": 1
            },
            "relations": {
                "scorecard": {
                    "identifier": "proposal_readiness",
                    "title": "Proposal Readiness"
                }
            }
        },
        {
            "identifier": "invoice_health_ih_bronze",
            "title": "Complete Invoice",
            "properties": {
                "level": "Bronze",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "operator": "isNotEmpty",
                            "property": "amount"
                        },
                        {
                            "operator": "isNotEmpty",
                            "property": "invoice_number"
                        },
                        {
                            "operator": "isNotEmpty",
                            "property": "due_date"
                        }
                    ]
                },
                "of_entities_passed": 0,
                "entities_tested": 1,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "invoice_health",
                    "title": "Invoice Health"
                }
            }
        },
        {
            "identifier": "invoice_health_ih_gold",
            "title": "QB Synced",
            "properties": {
                "level": "Gold",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "operator": "isNotEmpty",
                            "property": "quickbooks_id"
                        }
                    ]
                },
                "of_entities_passed": 0,
                "entities_tested": 1,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "invoice_health",
                    "title": "Invoice Health"
                }
            }
        },
        {
            "identifier": "proposal_readiness_propready_silver",
            "title": "Has Been Sent",
            "properties": {
                "level": "Silver",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "operator": "isNotEmpty",
                            "property": "sent_at"
                        }
                    ]
                },
                "of_entities_passed": 0,
                "entities_tested": 1,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "proposal_readiness",
                    "title": "Proposal Readiness"
                }
            }
        },
        {
            "identifier": "client_health_ch_bronze",
            "title": "Has Contact Info",
            "properties": {
                "level": "Bronze",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "operator": "isNotEmpty",
                            "property": "email"
                        },
                        {
                            "operator": "isNotEmpty",
                            "property": "phone"
                        }
                    ]
                },
                "of_entities_passed": 0,
                "entities_tested": 1,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "client_health",
                    "title": "Client Health"
                }
            }
        },
        {
            "identifier": "lead_quality_lq_gold",
            "title": "Sales-Ready",
            "properties": {
                "level": "Gold",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "operator": "isNotEmpty",
                            "property": "expected_close_date"
                        },
                        {
                            "operator": "isNotEmpty",
                            "property": "description"
                        }
                    ]
                },
                "of_entities_passed": 0,
                "entities_tested": 1,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "lead_quality",
                    "title": "Lead Quality"
                }
            }
        },
        {
            "identifier": "contract_completeness_cc_silver",
            "title": "Fully Executed",
            "properties": {
                "level": "Silver",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "operator": "isNotEmpty",
                            "property": "signed_at"
                        },
                        {
                            "operator": "isNotEmpty",
                            "property": "contract_type"
                        }
                    ]
                },
                "of_entities_passed": null,
                "entities_tested": 0,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "contract_completeness",
                    "title": "Contract Completeness"
                }
            }
        },
        {
            "identifier": "contract_completeness_cc_bronze",
            "title": "Has Amount & Number",
            "properties": {
                "level": "Bronze",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "operator": "isNotEmpty",
                            "property": "amount"
                        },
                        {
                            "operator": "isNotEmpty",
                            "property": "contract_number"
                        }
                    ]
                },
                "of_entities_passed": null,
                "entities_tested": 0,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "contract_completeness",
                    "title": "Contract Completeness"
                }
            }
        },
        {
            "identifier": "invoice_health_ih_silver",
            "title": "Issued",
            "properties": {
                "level": "Silver",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "operator": "isNotEmpty",
                            "property": "issued_date"
                        }
                    ]
                },
                "of_entities_passed": 0,
                "entities_tested": 1,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "invoice_health",
                    "title": "Invoice Health"
                }
            }
        },
        {
            "identifier": "lead_quality_lq_silver",
            "title": "Qualified Lead",
            "properties": {
                "level": "Silver",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "value": "new",
                            "operator": "!=",
                            "property": "stage"
                        },
                        {
                            "operator": "isNotEmpty",
                            "property": "source"
                        }
                    ]
                },
                "of_entities_passed": 0,
                "entities_tested": 1,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "lead_quality",
                    "title": "Lead Quality"
                }
            }
        },
        {
            "identifier": "client_health_ch_silver",
            "title": "Classified Client",
            "properties": {
                "level": "Silver",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "operator": "isNotEmpty",
                            "property": "client_type"
                        },
                        {
                            "operator": "isNotEmpty",
                            "property": "address"
                        }
                    ]
                },
                "of_entities_passed": 0,
                "entities_tested": 1,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "client_health",
                    "title": "Client Health"
                }
            }
        },
        {
            "identifier": "proposal_readiness_propready_gold",
            "title": "Doc Attached",
            "properties": {
                "level": "Gold",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "operator": "isNotEmpty",
                            "property": "proposal_doc_url"
                        }
                    ]
                },
                "of_entities_passed": 0,
                "entities_tested": 1,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "proposal_readiness",
                    "title": "Proposal Readiness"
                }
            }
        },
        {
            "identifier": "contract_completeness_cc_gold",
            "title": "Docs & Dates Set",
            "properties": {
                "level": "Gold",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "operator": "isNotEmpty",
                            "property": "contract_doc_url"
                        },
                        {
                            "operator": "isNotEmpty",
                            "property": "start_date"
                        }
                    ]
                },
                "of_entities_passed": null,
                "entities_tested": 0,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "contract_completeness",
                    "title": "Contract Completeness"
                }
            }
        },
        {
            "identifier": "sub_compliance_subc_bronze",
            "title": "Has License & Insurance",
            "properties": {
                "level": "Bronze",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "operator": "isNotEmpty",
                            "property": "license_number"
                        },
                        {
                            "operator": "isNotEmpty",
                            "property": "insurance_expiry"
                        },
                        {
                            "operator": "isNotEmpty",
                            "property": "license_expiry"
                        }
                    ]
                },
                "of_entities_passed": null,
                "entities_tested": 0,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "sub_compliance",
                    "title": "Sub Compliance"
                }
            }
        },
        {
            "identifier": "sub_compliance_subc_silver",
            "title": "W-9 On File",
            "properties": {
                "level": "Silver",
                "rule_description": null,
                "query": {
                    "combinator": "and",
                    "conditions": [
                        {
                            "value": true,
                            "operator": "=",
                            "property": "w9_on_file"
                        }
                    ]
                },
                "of_entities_passed": null,
                "entities_tested": 0,
                "entities_passed": 0
            },
            "relations": {
                "scorecard": {
                    "identifier": "sub_compliance",
                    "title": "Sub Compliance"
                }
            }
        }
    ]
};
