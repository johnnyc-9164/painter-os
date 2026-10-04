export declare const DOMAIN_MANIFEST: {
    readonly co_client: {
        readonly source_start_line: 9;
        readonly properties: {
            readonly client_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 12;
                readonly enum: readonly ["commercial", "residential", "municipal", "general_contractor", "subcontractor_vendor"];
            };
            readonly status: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 13;
                readonly enum: readonly ["prospect", "active", "on_hold", "inactive", "archived"];
            };
            readonly email: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 14;
                readonly format: "email";
            };
            readonly phone: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 15;
            };
            readonly address: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 16;
            };
            readonly city: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 17;
            };
            readonly state: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 18;
            };
            readonly zip: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 19;
            };
            readonly website: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 20;
                readonly format: "url";
            };
            readonly industry: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 21;
            };
            readonly source: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 22;
                readonly enum: readonly ["referral", "cold_outreach", "bid_board", "website", "repeat_client", "other"];
            };
            readonly notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 23;
                readonly format: "markdown";
            };
            readonly tags: {
                readonly type: "array";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 24;
                readonly items: "unspecified_json";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly [];
        readonly aggregations: readonly ["active_jobs", "total_contracts", "total_jobs", "total_leads", "total_payments_received"];
        readonly scorecards: readonly ["client_health"];
        readonly relations: {};
        readonly mirror_paths: {};
        readonly calculation_definitions: {};
        readonly aggregation_definitions: {
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
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_contact: {
        readonly source_start_line: 31;
        readonly properties: {
            readonly first_name: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 34;
            };
            readonly last_name: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 35;
            };
            readonly email: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 36;
                readonly format: "email";
            };
            readonly phone: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 37;
            };
            readonly job_title: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 38;
            };
            readonly role: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 39;
                readonly enum: readonly ["decision_maker", "influencer", "gatekeeper", "procurement", "end_user", "other"];
            };
            readonly notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 40;
                readonly format: "markdown";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly ["full_name"];
        readonly aggregations: readonly [];
        readonly scorecards: readonly [];
        readonly relations: {
            readonly client: {
                readonly target: "co_client";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly client_name: "client.$title";
            readonly client_status: "client.status";
            readonly client_type: "client.client_type";
        };
        readonly calculation_definitions: {
            readonly full_name: ".properties.first_name + \" \" + .properties.last_name";
        };
        readonly aggregation_definitions: {};
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_lead: {
        readonly source_start_line: 48;
        readonly properties: {
            readonly stage: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 51;
                readonly enum: readonly ["new", "qualifying", "site_visit_scheduled", "scope_in_progress", "proposal_sent", "bid_submitted", "awarded", "won", "lost", "on_hold"];
            };
            readonly priority: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 52;
                readonly enum: readonly ["low", "medium", "high", "urgent"];
            };
            readonly estimated_value: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 53;
            };
            readonly contract_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 54;
                readonly enum: readonly ["commercial", "residential", "municipal", "subcontract", "general"];
            };
            readonly source: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 55;
                readonly enum: readonly ["cold_outreach", "referral", "repeat_client", "website", "bid_board", "walk_in", "other"];
            };
            readonly expected_close_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 56;
                readonly format: "date-time";
            };
            readonly next_followup_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 57;
                readonly format: "date-time";
            };
            readonly description: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 58;
                readonly format: "markdown";
            };
            readonly notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 59;
                readonly format: "markdown";
            };
            readonly followup_notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 60;
                readonly format: "markdown";
            };
            readonly lost_reason: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 61;
                readonly enum: readonly ["price", "competitor", "no_response", "budget", "timing", "scope_mismatch", "other"];
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly [];
        readonly aggregations: readonly ["total_proposals", "total_site_visits"];
        readonly scorecards: readonly ["lead_quality"];
        readonly relations: {
            readonly client: {
                readonly target: "co_client";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly contact: {
                readonly target: "co_contact";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly campaign: {
                readonly target: "co_campaign";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly campaign_name: "campaign.$title";
            readonly client_name: "client.$title";
            readonly client_status: "client.status";
            readonly client_type: "client.client_type";
            readonly contact_email: "contact.email";
            readonly contact_first_name: "contact.first_name";
            readonly contact_last_name: "contact.last_name";
        };
        readonly calculation_definitions: {};
        readonly aggregation_definitions: {
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
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_site_visit: {
        readonly source_start_line: 69;
        readonly properties: {
            readonly status: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 72;
                readonly enum: readonly ["scheduled", "completed", "cancelled", "rescheduled", "no_show"];
            };
            readonly visit_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 73;
                readonly format: "date-time";
            };
            readonly address: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 74;
            };
            readonly rough_estimate: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 75;
            };
            readonly findings: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 76;
                readonly format: "markdown";
            };
            readonly notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 77;
                readonly format: "markdown";
            };
            readonly photos_url: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 78;
                readonly format: "url";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly [];
        readonly aggregations: readonly [];
        readonly scorecards: readonly [];
        readonly relations: {
            readonly contact: {
                readonly target: "co_contact";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly client: {
                readonly target: "co_client";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly lead: {
                readonly target: "co_lead";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly client_name: "client.$title";
            readonly contact_email: "contact.email";
            readonly lead_estimated_value: "lead.estimated_value";
            readonly lead_stage: "lead.stage";
        };
        readonly calculation_definitions: {};
        readonly aggregation_definitions: {};
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_scope: {
        readonly source_start_line: 84;
        readonly properties: {
            readonly trade_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 87;
                readonly enum: readonly ["general", "electrical", "plumbing", "hvac", "structural", "civil", "concrete", "roofing", "landscaping", "painting", "garage_door", "drywall_framing", "other"];
            };
            readonly status: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 88;
                readonly enum: readonly ["draft", "in_review", "approved", "rejected", "superseded"];
            };
            readonly description: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 89;
                readonly format: "markdown";
            };
            readonly assumptions: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 90;
                readonly format: "markdown";
            };
            readonly exclusions: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 91;
                readonly format: "markdown";
            };
            readonly estimated_hours: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 92;
            };
            readonly estimated_labor_cost: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 93;
            };
            readonly estimated_materials_cost: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 94;
            };
            readonly measurement_unit: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 95;
                readonly enum: readonly ["sq_ft", "linear_ft", "units", "squares", "tons", "cubic_yards"];
            };
            readonly measurement_value: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 96;
            };
            readonly version: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 97;
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly ["total_estimated_cost"];
        readonly aggregations: readonly [];
        readonly scorecards: readonly [];
        readonly relations: {
            readonly trade_spec: {
                readonly target: "co_trade_spec";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly lead: {
                readonly target: "co_lead";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly proposal: {
                readonly target: "co_proposal";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly client_name: "lead.client.$title";
            readonly lead_estimated_value: "lead.estimated_value";
            readonly lead_stage: "lead.stage";
        };
        readonly calculation_definitions: {
            readonly total_estimated_cost: "(.properties.estimated_labor_cost // 0) + (.properties.estimated_materials_cost // 0)";
        };
        readonly aggregation_definitions: {};
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_trade_spec: {
        readonly source_start_line: 104;
        readonly properties: {
            readonly trade: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 109;
                readonly enum: readonly ["painting", "plumbing", "roofing", "garage_door", "electrical", "hvac", "concrete", "landscaping", "drywall_framing"];
            };
            readonly measurement_value: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 110;
            };
            readonly measurement_unit: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 111;
                readonly enum: readonly ["sq_ft", "linear_ft", "units", "squares", "tons", "cubic_yards", "lf"];
            };
            readonly permit_required: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 112;
            };
            readonly permit_number: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 113;
            };
            readonly materials_spec: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 114;
                readonly format: "markdown";
            };
            readonly special_requirements: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 115;
                readonly format: "markdown";
            };
            readonly surface_condition: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["new", "good", "fair", "poor", "needs_repair"];
            };
            readonly paint_surface_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["interior_walls", "exterior_walls", "trim", "ceilings", "cabinets", "deck", "fence", "concrete_floor", "garage_floor", "other"];
            };
            readonly paint_finish: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["flat", "eggshell", "satin", "semi_gloss", "gloss", "cabinet_enamel"];
            };
            readonly paint_grade: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["economy", "standard", "premium", "luxury"];
            };
            readonly number_of_coats: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly color_count: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly primer_required: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly pressure_wash_required: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly prep_work: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["minimal", "moderate", "extensive", "repair_needed"];
            };
            readonly masking_complexity: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["simple", "moderate", "complex"];
            };
            readonly lead_hazard_present: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly ceiling_height_ft: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly roof_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["asphalt_shingle", "metal", "tile", "flat_tpo", "flat_epdm", "slate", "cedar_shake", "other"];
            };
            readonly roof_pitch: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["flat", "low", "medium", "steep"];
            };
            readonly layers_to_remove: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly decking_replacement: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly gutter_work: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly skylight_count: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly hvac_system_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["central_air", "mini_split", "heat_pump", "furnace", "boiler", "ductwork", "other"];
            };
            readonly tonnage: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly ductwork_included: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly electrical_service_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["residential", "commercial", "industrial"];
            };
            readonly circuit_count: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly panel_amps: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly panel_upgrade: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly fixture_count: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly pipe_material: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["copper", "pvc", "cpvc", "pex", "cast_iron", "abs", "galvanized", "other"];
            };
            readonly pipe_diameter: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly drain_cleaning: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly water_heater_involved: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly concrete_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["slab", "driveway", "sidewalk", "foundation", "decorative", "stamped"];
            };
            readonly concrete_finish: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["broom", "smooth", "exposed_aggregate", "stamped", "epoxy"];
            };
            readonly reinforcement: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["none", "rebar", "wire_mesh", "fiber"];
            };
            readonly thickness_inches: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly drywall_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["standard", "moisture_resistant", "fire_rated", "soundproof"];
            };
            readonly framing_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["wood", "metal", "none"];
            };
            readonly finishing_level: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["level_1", "level_2", "level_3", "level_4", "level_5"];
            };
            readonly door_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["single", "double", "roll_up", "sectional", "carriage_style"];
            };
            readonly door_material: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["steel", "wood", "aluminum", "fiberglass", "vinyl"];
            };
            readonly door_count: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly spring_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["torsion", "extension"];
            };
            readonly opener_included: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly landscape_service_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["lawn_care", "hardscaping", "planting", "irrigation", "drainage", "tree_work", "cleanup"];
            };
            readonly irrigation_zones: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly sod_or_seed: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source: "user_schema_transcription_2026_09_22";
                readonly enum: readonly ["sod", "seed", "hydroseed", "na"];
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly ["estimated_gallons", "estimated_squares"];
        readonly aggregations: readonly [];
        readonly scorecards: readonly ["painting_scope_quality", "drywall_scope_quality", "hvac_scope_quality", "electrical_scope_quality", "roofing_scope_quality", "garage_door_scope_quality", "plumbing_scope_quality", "concrete_scope_quality", "landscaping_scope_quality"];
        readonly relations: {
            readonly scope: {
                readonly target: "co_scope";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly pricing_rule: {
                readonly target: "co_pricing_rule";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly scope_client: "scope.lead.client.$title";
            readonly scope_lead: "scope.lead.$title";
            readonly scope_trade_type: "scope.trade_type";
        };
        readonly calculation_definitions: {
            readonly estimated_gallons: "if .properties.trade == \"painting\" then ((.properties.measurement_value // 0) / 350 * (.properties.number_of_coats // 1) | ceil) else null end";
            readonly estimated_squares: "if .properties.trade == \"roofing\" then ((.properties.measurement_value // 0) / 100 | ceil) else null end";
        };
        readonly aggregation_definitions: {};
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_pricing_rule: {
        readonly source_start_line: 132;
        readonly properties: {
            readonly rule_name: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 135;
            };
            readonly trade: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 136;
                readonly enum_ref: "co_trade_spec.trade";
                readonly enum: readonly ["painting", "plumbing", "roofing", "garage_door", "electrical", "hvac", "concrete", "landscaping", "drywall_framing"];
            };
            readonly pricing_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 137;
                readonly enum: readonly ["per_sqft", "per_linear_ft", "per_unit", "per_square", "per_ton", "lump_sum", "hourly", "per_door", "per_zone"];
            };
            readonly base_rate: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 138;
            };
            readonly labor_rate_per_hour: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 139;
            };
            readonly material_markup_percent: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 140;
            };
            readonly overhead_percent: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 141;
            };
            readonly profit_margin_percent: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 142;
            };
            readonly min_job_size: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 143;
            };
            readonly is_active: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 144;
            };
            readonly description: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 145;
                readonly format: "markdown";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly ["effective_rate", "material_multiplier"];
        readonly aggregations: readonly [];
        readonly scorecards: readonly [];
        readonly relations: {};
        readonly mirror_paths: {};
        readonly calculation_definitions: {
            readonly effective_rate: "(.properties.base_rate // 0) * (1 + ((.properties.overhead_percent // 0) / 100)) * (1 + ((.properties.profit_margin_percent // 0) / 100))";
            readonly material_multiplier: "1 + ((.properties.material_markup_percent // 0) / 100)";
        };
        readonly aggregation_definitions: {};
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_proposal: {
        readonly source_start_line: 151;
        readonly properties: {
            readonly status: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 154;
                readonly enum: readonly ["draft", "in_review", "sent", "viewed", "accepted", "rejected", "expired", "revised"];
            };
            readonly amount: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 155;
            };
            readonly currency: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 156;
            };
            readonly version: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 157;
            };
            readonly sent_at: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 158;
                readonly format: "date-time";
            };
            readonly expires_at: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 159;
                readonly format: "date-time";
            };
            readonly notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 160;
                readonly format: "markdown";
            };
            readonly terms: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 161;
                readonly format: "markdown";
            };
            readonly proposal_doc_url: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 162;
                readonly format: "url";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly [];
        readonly aggregations: readonly ["total_bids"];
        readonly scorecards: readonly ["proposal_readiness"];
        readonly relations: {
            readonly client: {
                readonly target: "co_client";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly lead: {
                readonly target: "co_lead";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly contact: {
                readonly target: "co_contact";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly scope: {
                readonly target: "co_scope";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly client_name: "client.$title";
            readonly contact_email: "contact.email";
            readonly lead_priority: "lead.priority";
            readonly lead_stage: "lead.stage";
            readonly scope_estimated_hours: "scope.estimated_hours";
            readonly scope_trade_type: "scope.trade_type";
        };
        readonly calculation_definitions: {};
        readonly aggregation_definitions: {
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
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_bid: {
        readonly source_start_line: 170;
        readonly properties: {
            readonly status: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 173;
                readonly enum: readonly ["preparing", "submitted", "under_review", "awarded", "not_awarded", "withdrawn"];
            };
            readonly bid_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 174;
                readonly enum: readonly ["open", "invited", "negotiated", "sole_source"];
            };
            readonly amount: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 175;
            };
            readonly bid_number: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 176;
            };
            readonly submission_deadline: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 177;
                readonly format: "date-time";
            };
            readonly submitted_at: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 178;
                readonly format: "date-time";
            };
            readonly bond_required: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 179;
            };
            readonly bond_amount: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 180;
            };
            readonly prevailing_wage: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 181;
            };
            readonly insurance_verified: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 182;
            };
            readonly capability_statement_attached: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 183;
            };
            readonly notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 184;
                readonly format: "markdown";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly ["days_until_deadline"];
        readonly aggregations: readonly [];
        readonly scorecards: readonly ["bid_readiness"];
        readonly relations: {
            readonly proposal: {
                readonly target: "co_proposal";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly client: {
                readonly target: "co_client";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly lead: {
                readonly target: "co_lead";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly client_name: "client.$title";
            readonly lead_estimated_value: "lead.estimated_value";
            readonly lead_stage: "lead.stage";
            readonly proposal_amount: "proposal.amount";
            readonly proposal_status: "proposal.status";
        };
        readonly calculation_definitions: {
            readonly days_until_deadline: "if .properties.submission_deadline then (((.properties.submission_deadline | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - now) / 86400 | floor) else null end";
        };
        readonly aggregation_definitions: {};
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_contract: {
        readonly source_start_line: 192;
        readonly properties: {
            readonly status: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 195;
                readonly enum: readonly ["draft", "sent_for_signature", "partially_signed", "fully_executed", "voided", "expired"];
            };
            readonly contract_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 196;
                readonly enum: readonly ["lump_sum", "time_and_materials", "unit_price", "cost_plus", "gmp"];
            };
            readonly amount: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 197;
            };
            readonly contract_number: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 198;
            };
            readonly start_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 199;
                readonly format: "date-time";
            };
            readonly end_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 200;
                readonly format: "date-time";
            };
            readonly signed_at: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 201;
                readonly format: "date-time";
            };
            readonly retainage_percent: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 202;
            };
            readonly docusign_envelope_id: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 203;
            };
            readonly contract_doc_url: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 204;
                readonly format: "url";
            };
            readonly notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 205;
                readonly format: "markdown";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly ["contract_duration_days", "retainage_amount"];
        readonly aggregations: readonly ["change_order_count", "invoice_count", "total_invoiced_agg"];
        readonly scorecards: readonly ["contract_completeness"];
        readonly relations: {
            readonly contact: {
                readonly target: "co_contact";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly client: {
                readonly target: "co_client";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly bid: {
                readonly target: "co_bid";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly bid_amount: "bid.amount";
            readonly bid_type: "bid.bid_type";
            readonly client_name: "client.$title";
            readonly contact_email: "contact.email";
            readonly proposal_amount: "bid.proposal.amount";
        };
        readonly calculation_definitions: {
            readonly contract_duration_days: "if (.properties.start_date and .properties.end_date) then ((.properties.end_date | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - (.properties.start_date | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime)) / 86400 | floor else null end";
            readonly retainage_amount: "(.properties.amount // 0) * ((.properties.retainage_percent // 0) / 100)";
        };
        readonly aggregation_definitions: {
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
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_job: {
        readonly source_start_line: 214;
        readonly properties: {
            readonly status: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 217;
                readonly enum: readonly ["pre_construction", "mobilizing", "active", "on_hold", "punch_list", "complete", "closed", "cancelled"];
            };
            readonly job_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 218;
                readonly enum: readonly ["commercial", "residential", "municipal", "subcontract", "general"];
            };
            readonly job_number: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 219;
            };
            readonly address: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 220;
            };
            readonly city: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 221;
            };
            readonly state: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 222;
            };
            readonly start_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 223;
                readonly format: "date-time";
            };
            readonly projected_end_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 224;
                readonly format: "date-time";
            };
            readonly actual_end_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 225;
                readonly format: "date-time";
            };
            readonly percent_complete: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 226;
            };
            readonly contract_amount: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 227;
            };
            readonly billed_to_date: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 228;
            };
            readonly collected_to_date: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 229;
            };
            readonly project_manager: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 230;
            };
            readonly superintendent: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 231;
            };
            readonly safety_plan_url: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 232;
                readonly format: "url";
            };
            readonly notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 233;
                readonly format: "markdown";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly ["billing_variance", "outstanding_balance"];
        readonly aggregations: readonly ["total_invoiced", "total_invoices", "daily_reports_count", "total_change_orders", "total_co_amount"];
        readonly scorecards: readonly ["job_health"];
        readonly relations: {
            readonly contact: {
                readonly target: "co_contact";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly contract: {
                readonly target: "co_contract";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly bid: {
                readonly target: "co_bid";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly client: {
                readonly target: "co_client";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly subcontractors: {
                readonly target: "co_subcontractor";
                readonly cardinality: "many";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly bid_amount: "bid.amount";
            readonly client_name: "client.$title";
            readonly contract_signed_at: "contract.signed_at";
            readonly contract_status: "contract.status";
            readonly contract_type: "contract.contract_type";
        };
        readonly calculation_definitions: {
            readonly billing_variance: "(.properties.billed_to_date // 0) - ((.properties.contract_amount // 0) * ((.properties.percent_complete // 0) / 100))";
            readonly outstanding_balance: "(.properties.contract_amount // 0) - (.properties.collected_to_date // 0)";
        };
        readonly aggregation_definitions: {
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
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_subcontractor: {
        readonly source_start_line: 242;
        readonly properties: {
            readonly trade: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 245;
                readonly enum: readonly ["electrical", "plumbing", "hvac", "concrete", "framing", "roofing", "landscaping", "painting", "drywall", "flooring", "fire_suppression", "garage_door", "other"];
            };
            readonly status: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 246;
                readonly enum: readonly ["prospect", "prequalified", "active", "on_hold", "blacklisted"];
            };
            readonly contact_name: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 247;
            };
            readonly email: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 248;
                readonly format: "email";
            };
            readonly phone: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 249;
            };
            readonly license_number: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 250;
            };
            readonly license_expiry: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 251;
                readonly format: "date-time";
            };
            readonly insurance_expiry: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 252;
                readonly format: "date-time";
            };
            readonly w9_on_file: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 253;
            };
            readonly lead_safe_certified: {
                readonly type: "boolean";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 254;
            };
            readonly bond_amount: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 255;
            };
            readonly certifications: {
                readonly type: "array";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 256;
                readonly items: "unspecified_json";
            };
            readonly additional_license_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 257;
            };
            readonly notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 258;
                readonly format: "markdown";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly ["compliance_status", "insurance_days_remaining", "license_days_remaining"];
        readonly aggregations: readonly ["total_jobs"];
        readonly scorecards: readonly ["sub_compliance", "painter_sub_compliance"];
        readonly relations: {
            readonly client: {
                readonly target: "co_client";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly jobs: {
                readonly target: "co_job";
                readonly cardinality: "many";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {};
        readonly calculation_definitions: {
            readonly compliance_status: "if (.properties.insurance_expiry == null or .properties.license_expiry == null) then \"unknown\" elif ((.properties.insurance_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) < now) then \"expired\" elif ((.properties.license_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) < now) then \"expired\" elif ((.properties.insurance_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - now) < 2592000 then \"expiring_soon\" elif ((.properties.license_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - now) < 2592000 then \"expiring_soon\" else \"compliant\" end";
            readonly insurance_days_remaining: "if .properties.insurance_expiry then (((.properties.insurance_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - now) / 86400 | floor) else null end";
            readonly license_days_remaining: "if .properties.license_expiry then (((.properties.license_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - now) / 86400 | floor) else null end";
        };
        readonly aggregation_definitions: {
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
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_change_order: {
        readonly source_start_line: 267;
        readonly properties: {
            readonly status: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 270;
                readonly enum: readonly ["draft", "submitted", "approved", "rejected", "executed"];
            };
            readonly co_number: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 271;
            };
            readonly amount: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 272;
            };
            readonly labor_change: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 273;
            };
            readonly materials_change: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 274;
            };
            readonly days_impact: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 275;
            };
            readonly submitted_at: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 276;
                readonly format: "date-time";
            };
            readonly approved_at: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 277;
                readonly format: "date-time";
            };
            readonly reason: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 278;
                readonly format: "markdown";
            };
            readonly description: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 279;
                readonly format: "markdown";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly ["total_change"];
        readonly aggregations: readonly [];
        readonly scorecards: readonly [];
        readonly relations: {
            readonly job: {
                readonly target: "co_job";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly contract: {
                readonly target: "co_contract";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly client_name: "job.client.$title";
            readonly job_number: "job.job_number";
            readonly contract_number: "contract.contract_number";
        };
        readonly calculation_definitions: {
            readonly total_change: "(.properties.labor_change // 0) + (.properties.materials_change // 0)";
        };
        readonly aggregation_definitions: {};
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_invoice: {
        readonly source_start_line: 286;
        readonly properties: {
            readonly status: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 289;
                readonly enum: readonly ["draft", "sent", "viewed", "partial_payment", "paid", "overdue", "voided"];
            };
            readonly invoice_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 290;
                readonly enum: readonly ["progress", "final", "retainage", "change_order", "deposit"];
            };
            readonly invoice_number: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 291;
            };
            readonly amount: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 292;
            };
            readonly amount_paid: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 293;
            };
            readonly issued_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 294;
                readonly format: "date-time";
            };
            readonly due_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 295;
                readonly format: "date-time";
            };
            readonly paid_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 296;
                readonly format: "date-time";
            };
            readonly quickbooks_id: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 297;
            };
            readonly notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 298;
                readonly format: "markdown";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly ["balance_due"];
        readonly aggregations: readonly [];
        readonly scorecards: readonly ["invoice_health"];
        readonly relations: {
            readonly client: {
                readonly target: "co_client";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly contract: {
                readonly target: "co_contract";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly job: {
                readonly target: "co_job";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly client_name: "client.$title";
            readonly contract_amount: "contract.amount";
            readonly contract_number: "contract.contract_number";
            readonly job_number: "job.job_number";
            readonly job_status: "job.status";
        };
        readonly calculation_definitions: {
            readonly balance_due: ".properties.amount - (.properties.amount_paid // 0)";
        };
        readonly aggregation_definitions: {};
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_payment: {
        readonly source_start_line: 306;
        readonly properties: {
            readonly amount: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 309;
            };
            readonly payment_method: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 310;
                readonly enum: readonly ["check", "ach", "wire", "credit_card", "cash", "other"];
            };
            readonly payment_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 311;
                readonly format: "date-time";
            };
            readonly reference_number: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 312;
            };
            readonly quickbooks_id: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 313;
            };
            readonly notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 314;
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly [];
        readonly aggregations: readonly [];
        readonly scorecards: readonly [];
        readonly relations: {
            readonly invoice: {
                readonly target: "co_invoice";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly client: {
                readonly target: "co_client";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly client_name: "client.$title";
            readonly invoice_amount: "invoice.amount";
            readonly invoice_number: "invoice.invoice_number";
            readonly invoice_status: "invoice.status";
        };
        readonly calculation_definitions: {};
        readonly aggregation_definitions: {};
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_daily_report: {
        readonly source_start_line: 320;
        readonly properties: {
            readonly status: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 323;
                readonly enum: readonly ["draft", "submitted", "approved"];
            };
            readonly report_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 324;
                readonly format: "date-time";
            };
            readonly weather: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 325;
                readonly enum: readonly ["clear", "cloudy", "rain", "snow", "wind", "hot", "other"];
            };
            readonly temperature: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 326;
            };
            readonly crew_size: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 327;
            };
            readonly work_performed: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 328;
                readonly format: "markdown";
            };
            readonly materials_received: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 329;
                readonly format: "markdown";
            };
            readonly equipment_used: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 330;
            };
            readonly delays: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 331;
                readonly format: "markdown";
            };
            readonly safety_observations: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 332;
                readonly format: "markdown";
            };
            readonly notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 333;
                readonly format: "markdown";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly [];
        readonly aggregations: readonly [];
        readonly scorecards: readonly [];
        readonly relations: {
            readonly job: {
                readonly target: "co_job";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly client_name: "job.client.$title";
            readonly job_number: "job.job_number";
            readonly job_status: "job.status";
        };
        readonly calculation_definitions: {};
        readonly aggregation_definitions: {};
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_campaign: {
        readonly source_start_line: 339;
        readonly properties: {
            readonly status: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 342;
                readonly enum: readonly ["draft", "active", "paused", "completed", "archived"];
            };
            readonly campaign_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 343;
                readonly enum: readonly ["cold_email", "direct_mail", "door_to_door", "referral", "digital_ads", "bid_board", "other"];
            };
            readonly target_market: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 344;
                readonly enum: readonly ["commercial", "residential", "municipal", "subcontract", "all"];
            };
            readonly start_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 345;
                readonly format: "date-time";
            };
            readonly end_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 345;
                readonly format: "date-time";
            };
            readonly goal: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 346;
            };
            readonly email_template: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 347;
                readonly format: "markdown";
            };
            readonly automation_rules: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 348;
                readonly format: "markdown";
            };
            readonly notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 349;
                readonly format: "markdown";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly [];
        readonly aggregations: readonly ["total_leads_generated", "total_outreach_sent"];
        readonly scorecards: readonly [];
        readonly relations: {};
        readonly mirror_paths: {};
        readonly calculation_definitions: {};
        readonly aggregation_definitions: {
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
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_outreach: {
        readonly source_start_line: 355;
        readonly properties: {
            readonly status: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 358;
                readonly enum: readonly ["pending", "sent", "delivered", "opened", "replied", "no_response", "opted_out", "converted"];
            };
            readonly channel: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 359;
                readonly enum: readonly ["email", "phone", "door_knock", "linkedin", "referral", "direct_mail", "other"];
            };
            readonly subject: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 360;
            };
            readonly body: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 361;
                readonly format: "markdown";
            };
            readonly sequence_step: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 362;
            };
            readonly sent_at: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 363;
                readonly format: "date-time";
            };
            readonly follow_up_date: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 363;
                readonly format: "date-time";
            };
            readonly response_notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 364;
                readonly format: "markdown";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly [];
        readonly aggregations: readonly [];
        readonly scorecards: readonly [];
        readonly relations: {
            readonly campaign: {
                readonly target: "co_campaign";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly contact: {
                readonly target: "co_contact";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly client: {
                readonly target: "co_client";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly campaign_name: "campaign.$title";
            readonly client_name: "client.$title";
            readonly contact_email: "contact.email";
            readonly contact_first_name: "contact.first_name";
            readonly contact_last_name: "contact.last_name";
        };
        readonly calculation_definitions: {};
        readonly aggregation_definitions: {};
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_automation_rule: {
        readonly source_start_line: 370;
        readonly properties: {
            readonly trigger: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 373;
                readonly enum: readonly ["new_lead", "follow_up_due", "proposal_sent", "bid_submitted", "invoice_overdue", "job_won", "outreach_no_response", "campaign_enrolled", "contract_signed", "payment_received", "other"];
            };
            readonly status: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 374;
                readonly enum: readonly ["draft", "active", "paused", "archived"];
            };
            readonly channel: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 375;
                readonly enum: readonly ["email", "sms", "phone_task", "notification", "webhook", "other"];
            };
            readonly subject: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 376;
            };
            readonly body: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 377;
                readonly format: "markdown";
            };
            readonly delay_days: {
                readonly type: "number";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 378;
            };
            readonly conditions: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 379;
                readonly format: "markdown";
            };
            readonly notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 380;
                readonly format: "markdown";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly [];
        readonly aggregations: readonly [];
        readonly scorecards: readonly [];
        readonly relations: {
            readonly campaign: {
                readonly target: "co_campaign";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly campaign_name: "campaign.$title";
            readonly campaign_status: "campaign.status";
            readonly campaign_type: "campaign.campaign_type";
        };
        readonly calculation_definitions: {};
        readonly aggregation_definitions: {};
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
    readonly co_document: {
        readonly source_start_line: 386;
        readonly properties: {
            readonly doc_type: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 389;
                readonly enum: readonly ["capability_statement", "bid_package", "website_copy", "design_spec", "agent_rules", "governance", "email_template", "marketing_collateral", "proof", "proposal_template", "contract_template", "sow_template", "safety_plan", "other"];
            };
            readonly status: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 390;
                readonly enum: readonly ["draft", "in_review", "approved", "published", "archived"];
            };
            readonly version: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 391;
            };
            readonly content: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 392;
                readonly format: "markdown";
            };
            readonly file_url: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 393;
                readonly format: "url";
            };
            readonly tags: {
                readonly type: "array";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 394;
                readonly items: "unspecified_json";
            };
            readonly notes: {
                readonly type: "string";
                readonly required: null;
                readonly nullable: null;
                readonly source_line: 395;
                readonly format: "markdown";
            };
        };
        readonly unresolved_properties: readonly [];
        readonly calculations: readonly [];
        readonly aggregations: readonly [];
        readonly scorecards: readonly [];
        readonly relations: {
            readonly campaign: {
                readonly target: "co_campaign";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly lead: {
                readonly target: "co_lead";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly job: {
                readonly target: "co_job";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
            readonly contract: {
                readonly target: "co_contract";
                readonly cardinality: "one";
                readonly required: false;
                readonly provenance: "explicit_target_or_co_prefix_expansion_of_named_relation";
                readonly source: "user_schema_transcription_2026_09_22";
            };
        };
        readonly mirror_paths: {
            readonly campaign_name: "campaign.$title";
            readonly contract_number: "contract.contract_number";
            readonly job_number: "job.job_number";
            readonly job_status: "job.status";
        };
        readonly calculation_definitions: {};
        readonly aggregation_definitions: {};
        readonly source_update: "user_schema_transcription_2026_09_22";
    };
};
