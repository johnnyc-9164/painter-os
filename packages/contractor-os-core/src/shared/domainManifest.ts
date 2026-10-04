// Generated from the checked-in source manifest.
export const DOMAIN_MANIFEST = {
  "co_client": {
    "source_start_line": 9,
    "properties": {
      "client_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 12,
        "enum": [
          "commercial",
          "residential",
          "municipal",
          "general_contractor",
          "subcontractor_vendor"
        ]
      },
      "status": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 13,
        "enum": [
          "prospect",
          "active",
          "on_hold",
          "inactive",
          "archived"
        ]
      },
      "email": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 14,
        "format": "email"
      },
      "phone": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 15
      },
      "address": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 16
      },
      "city": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 17
      },
      "state": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 18
      },
      "zip": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 19
      },
      "website": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 20,
        "format": "url"
      },
      "industry": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 21
      },
      "source": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 22,
        "enum": [
          "referral",
          "cold_outreach",
          "bid_board",
          "website",
          "repeat_client",
          "other"
        ]
      },
      "notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 23,
        "format": "markdown"
      },
      "tags": {
        "type": "array",
        "required": null,
        "nullable": null,
        "source_line": 24,
        "items": "unspecified_json"
      }
    },
    "unresolved_properties": [],
    "calculations": [],
    "aggregations": [
      "active_jobs",
      "total_contracts",
      "total_jobs",
      "total_leads",
      "total_payments_received"
    ],
    "scorecards": [
      "client_health"
    ],
    "relations": {},
    "mirror_paths": {},
    "calculation_definitions": {},
    "aggregation_definitions": {
      "active_jobs": {
        "target": "co_job",
        "func": "count",
        "property": null,
        "filter": {
          "property": "status",
          "equals": "active"
        },
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "client"
        },
        "semantics": "component_explicit_paths_v1"
      },
      "total_contracts": {
        "target": "co_contract",
        "func": "count",
        "property": null,
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "client"
        },
        "semantics": "component_explicit_paths_v1"
      },
      "total_jobs": {
        "target": "co_job",
        "func": "count",
        "property": null,
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "client"
        },
        "semantics": "component_explicit_paths_v1"
      },
      "total_leads": {
        "target": "co_lead",
        "func": "count",
        "property": null,
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "client"
        },
        "semantics": "component_explicit_paths_v1"
      },
      "total_payments_received": {
        "target": "co_payment",
        "func": "sum",
        "property": "amount",
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "client"
        },
        "semantics": "component_explicit_paths_v1"
      }
    },
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_contact": {
    "source_start_line": 31,
    "properties": {
      "first_name": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 34
      },
      "last_name": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 35
      },
      "email": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 36,
        "format": "email"
      },
      "phone": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 37
      },
      "job_title": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 38
      },
      "role": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 39,
        "enum": [
          "decision_maker",
          "influencer",
          "gatekeeper",
          "procurement",
          "end_user",
          "other"
        ]
      },
      "notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 40,
        "format": "markdown"
      }
    },
    "unresolved_properties": [],
    "calculations": [
      "full_name"
    ],
    "aggregations": [],
    "scorecards": [],
    "relations": {
      "client": {
        "target": "co_client",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "client_name": "client.$title",
      "client_status": "client.status",
      "client_type": "client.client_type"
    },
    "calculation_definitions": {
      "full_name": ".properties.first_name + \" \" + .properties.last_name"
    },
    "aggregation_definitions": {},
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_lead": {
    "source_start_line": 48,
    "properties": {
      "stage": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 51,
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
        ]
      },
      "priority": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 52,
        "enum": [
          "low",
          "medium",
          "high",
          "urgent"
        ]
      },
      "estimated_value": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 53
      },
      "contract_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 54,
        "enum": [
          "commercial",
          "residential",
          "municipal",
          "subcontract",
          "general"
        ]
      },
      "source": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 55,
        "enum": [
          "cold_outreach",
          "referral",
          "repeat_client",
          "website",
          "bid_board",
          "walk_in",
          "other"
        ]
      },
      "expected_close_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 56,
        "format": "date-time"
      },
      "next_followup_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 57,
        "format": "date-time"
      },
      "description": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 58,
        "format": "markdown"
      },
      "notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 59,
        "format": "markdown"
      },
      "followup_notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 60,
        "format": "markdown"
      },
      "lost_reason": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 61,
        "enum": [
          "price",
          "competitor",
          "no_response",
          "budget",
          "timing",
          "scope_mismatch",
          "other"
        ]
      }
    },
    "unresolved_properties": [],
    "calculations": [],
    "aggregations": [
      "total_proposals",
      "total_site_visits"
    ],
    "scorecards": [
      "lead_quality"
    ],
    "relations": {
      "client": {
        "target": "co_client",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "contact": {
        "target": "co_contact",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "campaign": {
        "target": "co_campaign",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "campaign_name": "campaign.$title",
      "client_name": "client.$title",
      "client_status": "client.status",
      "client_type": "client.client_type",
      "contact_email": "contact.email",
      "contact_first_name": "contact.first_name",
      "contact_last_name": "contact.last_name"
    },
    "calculation_definitions": {},
    "aggregation_definitions": {
      "total_proposals": {
        "target": "co_proposal",
        "func": "count",
        "property": null,
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "lead"
        },
        "semantics": "component_explicit_paths_v1"
      },
      "total_site_visits": {
        "target": "co_site_visit",
        "func": "count",
        "property": null,
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "lead"
        },
        "semantics": "component_explicit_paths_v1"
      }
    },
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_site_visit": {
    "source_start_line": 69,
    "properties": {
      "status": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 72,
        "enum": [
          "scheduled",
          "completed",
          "cancelled",
          "rescheduled",
          "no_show"
        ]
      },
      "visit_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 73,
        "format": "date-time"
      },
      "address": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 74
      },
      "rough_estimate": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 75
      },
      "findings": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 76,
        "format": "markdown"
      },
      "notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 77,
        "format": "markdown"
      },
      "photos_url": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 78,
        "format": "url"
      }
    },
    "unresolved_properties": [],
    "calculations": [],
    "aggregations": [],
    "scorecards": [],
    "relations": {
      "contact": {
        "target": "co_contact",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "client": {
        "target": "co_client",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "lead": {
        "target": "co_lead",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "client_name": "client.$title",
      "contact_email": "contact.email",
      "lead_estimated_value": "lead.estimated_value",
      "lead_stage": "lead.stage"
    },
    "calculation_definitions": {},
    "aggregation_definitions": {},
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_scope": {
    "source_start_line": 84,
    "properties": {
      "trade_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 87,
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
          "garage_door",
          "drywall_framing",
          "other"
        ]
      },
      "status": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 88,
        "enum": [
          "draft",
          "in_review",
          "approved",
          "rejected",
          "superseded"
        ]
      },
      "description": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 89,
        "format": "markdown"
      },
      "assumptions": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 90,
        "format": "markdown"
      },
      "exclusions": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 91,
        "format": "markdown"
      },
      "estimated_hours": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 92
      },
      "estimated_labor_cost": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 93
      },
      "estimated_materials_cost": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 94
      },
      "measurement_unit": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 95,
        "enum": [
          "sq_ft",
          "linear_ft",
          "units",
          "squares",
          "tons",
          "cubic_yards"
        ]
      },
      "measurement_value": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 96
      },
      "version": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 97
      }
    },
    "unresolved_properties": [],
    "calculations": [
      "total_estimated_cost"
    ],
    "aggregations": [],
    "scorecards": [],
    "relations": {
      "trade_spec": {
        "target": "co_trade_spec",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "lead": {
        "target": "co_lead",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "proposal": {
        "target": "co_proposal",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "client_name": "lead.client.$title",
      "lead_estimated_value": "lead.estimated_value",
      "lead_stage": "lead.stage"
    },
    "calculation_definitions": {
      "total_estimated_cost": "(.properties.estimated_labor_cost // 0) + (.properties.estimated_materials_cost // 0)"
    },
    "aggregation_definitions": {},
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_trade_spec": {
    "source_start_line": 104,
    "properties": {
      "trade": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 109,
        "enum": [
          "painting",
          "plumbing",
          "roofing",
          "garage_door",
          "electrical",
          "hvac",
          "concrete",
          "landscaping",
          "drywall_framing"
        ]
      },
      "measurement_value": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 110
      },
      "measurement_unit": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 111,
        "enum": [
          "sq_ft",
          "linear_ft",
          "units",
          "squares",
          "tons",
          "cubic_yards",
          "lf"
        ]
      },
      "permit_required": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source_line": 112
      },
      "permit_number": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 113
      },
      "materials_spec": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 114,
        "format": "markdown"
      },
      "special_requirements": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 115,
        "format": "markdown"
      },
      "surface_condition": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "new",
          "good",
          "fair",
          "poor",
          "needs_repair"
        ]
      },
      "paint_surface_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "interior_walls",
          "exterior_walls",
          "trim",
          "ceilings",
          "cabinets",
          "deck",
          "fence",
          "concrete_floor",
          "garage_floor",
          "other"
        ]
      },
      "paint_finish": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "flat",
          "eggshell",
          "satin",
          "semi_gloss",
          "gloss",
          "cabinet_enamel"
        ]
      },
      "paint_grade": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "economy",
          "standard",
          "premium",
          "luxury"
        ]
      },
      "number_of_coats": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "color_count": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "primer_required": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "pressure_wash_required": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "prep_work": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "minimal",
          "moderate",
          "extensive",
          "repair_needed"
        ]
      },
      "masking_complexity": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "simple",
          "moderate",
          "complex"
        ]
      },
      "lead_hazard_present": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "ceiling_height_ft": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "roof_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "asphalt_shingle",
          "metal",
          "tile",
          "flat_tpo",
          "flat_epdm",
          "slate",
          "cedar_shake",
          "other"
        ]
      },
      "roof_pitch": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "flat",
          "low",
          "medium",
          "steep"
        ]
      },
      "layers_to_remove": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "decking_replacement": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "gutter_work": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "skylight_count": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "hvac_system_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "central_air",
          "mini_split",
          "heat_pump",
          "furnace",
          "boiler",
          "ductwork",
          "other"
        ]
      },
      "tonnage": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "ductwork_included": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "electrical_service_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "residential",
          "commercial",
          "industrial"
        ]
      },
      "circuit_count": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "panel_amps": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "panel_upgrade": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "fixture_count": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "pipe_material": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "copper",
          "pvc",
          "cpvc",
          "pex",
          "cast_iron",
          "abs",
          "galvanized",
          "other"
        ]
      },
      "pipe_diameter": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "drain_cleaning": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "water_heater_involved": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "concrete_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "slab",
          "driveway",
          "sidewalk",
          "foundation",
          "decorative",
          "stamped"
        ]
      },
      "concrete_finish": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "broom",
          "smooth",
          "exposed_aggregate",
          "stamped",
          "epoxy"
        ]
      },
      "reinforcement": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "none",
          "rebar",
          "wire_mesh",
          "fiber"
        ]
      },
      "thickness_inches": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "drywall_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "standard",
          "moisture_resistant",
          "fire_rated",
          "soundproof"
        ]
      },
      "framing_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "wood",
          "metal",
          "none"
        ]
      },
      "finishing_level": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "level_1",
          "level_2",
          "level_3",
          "level_4",
          "level_5"
        ]
      },
      "door_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "single",
          "double",
          "roll_up",
          "sectional",
          "carriage_style"
        ]
      },
      "door_material": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "steel",
          "wood",
          "aluminum",
          "fiberglass",
          "vinyl"
        ]
      },
      "door_count": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "spring_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "torsion",
          "extension"
        ]
      },
      "opener_included": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "landscape_service_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "lawn_care",
          "hardscaping",
          "planting",
          "irrigation",
          "drainage",
          "tree_work",
          "cleanup"
        ]
      },
      "irrigation_zones": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22"
      },
      "sod_or_seed": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source": "user_schema_transcription_2026_09_22",
        "enum": [
          "sod",
          "seed",
          "hydroseed",
          "na"
        ]
      }
    },
    "unresolved_properties": [],
    "calculations": [
      "estimated_gallons",
      "estimated_squares"
    ],
    "aggregations": [],
    "scorecards": [
      "painting_scope_quality",
      "drywall_scope_quality",
      "hvac_scope_quality",
      "electrical_scope_quality",
      "roofing_scope_quality",
      "garage_door_scope_quality",
      "plumbing_scope_quality",
      "concrete_scope_quality",
      "landscaping_scope_quality"
    ],
    "relations": {
      "scope": {
        "target": "co_scope",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "pricing_rule": {
        "target": "co_pricing_rule",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "scope_client": "scope.lead.client.$title",
      "scope_lead": "scope.lead.$title",
      "scope_trade_type": "scope.trade_type"
    },
    "calculation_definitions": {
      "estimated_gallons": "if .properties.trade == \"painting\" then ((.properties.measurement_value // 0) / 350 * (.properties.number_of_coats // 1) | ceil) else null end",
      "estimated_squares": "if .properties.trade == \"roofing\" then ((.properties.measurement_value // 0) / 100 | ceil) else null end"
    },
    "aggregation_definitions": {},
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_pricing_rule": {
    "source_start_line": 132,
    "properties": {
      "rule_name": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 135
      },
      "trade": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 136,
        "enum_ref": "co_trade_spec.trade",
        "enum": [
          "painting",
          "plumbing",
          "roofing",
          "garage_door",
          "electrical",
          "hvac",
          "concrete",
          "landscaping",
          "drywall_framing"
        ]
      },
      "pricing_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 137,
        "enum": [
          "per_sqft",
          "per_linear_ft",
          "per_unit",
          "per_square",
          "per_ton",
          "lump_sum",
          "hourly",
          "per_door",
          "per_zone"
        ]
      },
      "base_rate": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 138
      },
      "labor_rate_per_hour": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 139
      },
      "material_markup_percent": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 140
      },
      "overhead_percent": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 141
      },
      "profit_margin_percent": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 142
      },
      "min_job_size": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 143
      },
      "is_active": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source_line": 144
      },
      "description": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 145,
        "format": "markdown"
      }
    },
    "unresolved_properties": [],
    "calculations": [
      "effective_rate",
      "material_multiplier"
    ],
    "aggregations": [],
    "scorecards": [],
    "relations": {},
    "mirror_paths": {},
    "calculation_definitions": {
      "effective_rate": "(.properties.base_rate // 0) * (1 + ((.properties.overhead_percent // 0) / 100)) * (1 + ((.properties.profit_margin_percent // 0) / 100))",
      "material_multiplier": "1 + ((.properties.material_markup_percent // 0) / 100)"
    },
    "aggregation_definitions": {},
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_proposal": {
    "source_start_line": 151,
    "properties": {
      "status": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 154,
        "enum": [
          "draft",
          "in_review",
          "sent",
          "viewed",
          "accepted",
          "rejected",
          "expired",
          "revised"
        ]
      },
      "amount": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 155
      },
      "currency": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 156
      },
      "version": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 157
      },
      "sent_at": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 158,
        "format": "date-time"
      },
      "expires_at": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 159,
        "format": "date-time"
      },
      "notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 160,
        "format": "markdown"
      },
      "terms": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 161,
        "format": "markdown"
      },
      "proposal_doc_url": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 162,
        "format": "url"
      }
    },
    "unresolved_properties": [],
    "calculations": [],
    "aggregations": [
      "total_bids"
    ],
    "scorecards": [
      "proposal_readiness"
    ],
    "relations": {
      "client": {
        "target": "co_client",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "lead": {
        "target": "co_lead",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "contact": {
        "target": "co_contact",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "scope": {
        "target": "co_scope",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "client_name": "client.$title",
      "contact_email": "contact.email",
      "lead_priority": "lead.priority",
      "lead_stage": "lead.stage",
      "scope_estimated_hours": "scope.estimated_hours",
      "scope_trade_type": "scope.trade_type"
    },
    "calculation_definitions": {},
    "aggregation_definitions": {
      "total_bids": {
        "target": "co_bid",
        "func": "count",
        "property": null,
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "proposal"
        },
        "semantics": "component_explicit_paths_v1"
      }
    },
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_bid": {
    "source_start_line": 170,
    "properties": {
      "status": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 173,
        "enum": [
          "preparing",
          "submitted",
          "under_review",
          "awarded",
          "not_awarded",
          "withdrawn"
        ]
      },
      "bid_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 174,
        "enum": [
          "open",
          "invited",
          "negotiated",
          "sole_source"
        ]
      },
      "amount": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 175
      },
      "bid_number": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 176
      },
      "submission_deadline": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 177,
        "format": "date-time"
      },
      "submitted_at": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 178,
        "format": "date-time"
      },
      "bond_required": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source_line": 179
      },
      "bond_amount": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 180
      },
      "prevailing_wage": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source_line": 181
      },
      "insurance_verified": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source_line": 182
      },
      "capability_statement_attached": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source_line": 183
      },
      "notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 184,
        "format": "markdown"
      }
    },
    "unresolved_properties": [],
    "calculations": [
      "days_until_deadline"
    ],
    "aggregations": [],
    "scorecards": [
      "bid_readiness"
    ],
    "relations": {
      "proposal": {
        "target": "co_proposal",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "client": {
        "target": "co_client",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "lead": {
        "target": "co_lead",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "client_name": "client.$title",
      "lead_estimated_value": "lead.estimated_value",
      "lead_stage": "lead.stage",
      "proposal_amount": "proposal.amount",
      "proposal_status": "proposal.status"
    },
    "calculation_definitions": {
      "days_until_deadline": "if .properties.submission_deadline then (((.properties.submission_deadline | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - now) / 86400 | floor) else null end"
    },
    "aggregation_definitions": {},
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_contract": {
    "source_start_line": 192,
    "properties": {
      "status": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 195,
        "enum": [
          "draft",
          "sent_for_signature",
          "partially_signed",
          "fully_executed",
          "voided",
          "expired"
        ]
      },
      "contract_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 196,
        "enum": [
          "lump_sum",
          "time_and_materials",
          "unit_price",
          "cost_plus",
          "gmp"
        ]
      },
      "amount": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 197
      },
      "contract_number": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 198
      },
      "start_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 199,
        "format": "date-time"
      },
      "end_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 200,
        "format": "date-time"
      },
      "signed_at": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 201,
        "format": "date-time"
      },
      "retainage_percent": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 202
      },
      "docusign_envelope_id": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 203
      },
      "contract_doc_url": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 204,
        "format": "url"
      },
      "notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 205,
        "format": "markdown"
      }
    },
    "unresolved_properties": [],
    "calculations": [
      "contract_duration_days",
      "retainage_amount"
    ],
    "aggregations": [
      "change_order_count",
      "invoice_count",
      "total_invoiced_agg"
    ],
    "scorecards": [
      "contract_completeness"
    ],
    "relations": {
      "contact": {
        "target": "co_contact",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "client": {
        "target": "co_client",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "bid": {
        "target": "co_bid",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "bid_amount": "bid.amount",
      "bid_type": "bid.bid_type",
      "client_name": "client.$title",
      "contact_email": "contact.email",
      "proposal_amount": "bid.proposal.amount"
    },
    "calculation_definitions": {
      "contract_duration_days": "if (.properties.start_date and .properties.end_date) then ((.properties.end_date | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - (.properties.start_date | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime)) / 86400 | floor else null end",
      "retainage_amount": "(.properties.amount // 0) * ((.properties.retainage_percent // 0) / 100)"
    },
    "aggregation_definitions": {
      "change_order_count": {
        "target": "co_change_order",
        "func": "count",
        "property": null,
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "contract"
        },
        "semantics": "component_explicit_paths_v1"
      },
      "invoice_count": {
        "target": "co_invoice",
        "func": "count",
        "property": null,
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "contract"
        },
        "semantics": "component_explicit_paths_v1"
      },
      "total_invoiced_agg": {
        "target": "co_invoice",
        "func": "sum",
        "property": "amount",
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "contract"
        },
        "semantics": "component_explicit_paths_v1"
      }
    },
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_job": {
    "source_start_line": 214,
    "properties": {
      "status": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 217,
        "enum": [
          "pre_construction",
          "mobilizing",
          "active",
          "on_hold",
          "punch_list",
          "complete",
          "closed",
          "cancelled"
        ]
      },
      "job_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 218,
        "enum": [
          "commercial",
          "residential",
          "municipal",
          "subcontract",
          "general"
        ]
      },
      "job_number": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 219
      },
      "address": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 220
      },
      "city": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 221
      },
      "state": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 222
      },
      "start_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 223,
        "format": "date-time"
      },
      "projected_end_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 224,
        "format": "date-time"
      },
      "actual_end_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 225,
        "format": "date-time"
      },
      "percent_complete": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 226
      },
      "contract_amount": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 227
      },
      "billed_to_date": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 228
      },
      "collected_to_date": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 229
      },
      "project_manager": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 230
      },
      "superintendent": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 231
      },
      "safety_plan_url": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 232,
        "format": "url"
      },
      "notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 233,
        "format": "markdown"
      }
    },
    "unresolved_properties": [],
    "calculations": [
      "billing_variance",
      "outstanding_balance"
    ],
    "aggregations": [
      "total_invoiced",
      "total_invoices",
      "daily_reports_count",
      "total_change_orders",
      "total_co_amount"
    ],
    "scorecards": [
      "job_health"
    ],
    "relations": {
      "contact": {
        "target": "co_contact",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "contract": {
        "target": "co_contract",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "bid": {
        "target": "co_bid",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "client": {
        "target": "co_client",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "subcontractors": {
        "target": "co_subcontractor",
        "cardinality": "many",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "bid_amount": "bid.amount",
      "client_name": "client.$title",
      "contract_signed_at": "contract.signed_at",
      "contract_status": "contract.status",
      "contract_type": "contract.contract_type"
    },
    "calculation_definitions": {
      "billing_variance": "(.properties.billed_to_date // 0) - ((.properties.contract_amount // 0) * ((.properties.percent_complete // 0) / 100))",
      "outstanding_balance": "(.properties.contract_amount // 0) - (.properties.collected_to_date // 0)"
    },
    "aggregation_definitions": {
      "total_invoiced": {
        "target": "co_invoice",
        "func": "sum",
        "property": "amount",
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "job"
        },
        "semantics": "component_explicit_paths_v1"
      },
      "total_invoices": {
        "target": "co_invoice",
        "func": "count",
        "property": null,
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "job"
        },
        "semantics": "component_explicit_paths_v1"
      },
      "daily_reports_count": {
        "target": "co_daily_report",
        "func": "count",
        "property": null,
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "job"
        },
        "semantics": "component_explicit_paths_v1"
      },
      "total_change_orders": {
        "target": "co_change_order",
        "func": "count",
        "property": null,
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "job"
        },
        "semantics": "component_explicit_paths_v1"
      },
      "total_co_amount": {
        "target": "co_change_order",
        "func": "sum",
        "property": "amount",
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "job"
        },
        "semantics": "component_explicit_paths_v1"
      }
    },
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_subcontractor": {
    "source_start_line": 242,
    "properties": {
      "trade": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 245,
        "enum": [
          "electrical",
          "plumbing",
          "hvac",
          "concrete",
          "framing",
          "roofing",
          "landscaping",
          "painting",
          "drywall",
          "flooring",
          "fire_suppression",
          "garage_door",
          "other"
        ]
      },
      "status": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 246,
        "enum": [
          "prospect",
          "prequalified",
          "active",
          "on_hold",
          "blacklisted"
        ]
      },
      "contact_name": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 247
      },
      "email": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 248,
        "format": "email"
      },
      "phone": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 249
      },
      "license_number": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 250
      },
      "license_expiry": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 251,
        "format": "date-time"
      },
      "insurance_expiry": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 252,
        "format": "date-time"
      },
      "w9_on_file": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source_line": 253
      },
      "lead_safe_certified": {
        "type": "boolean",
        "required": null,
        "nullable": null,
        "source_line": 254
      },
      "bond_amount": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 255
      },
      "certifications": {
        "type": "array",
        "required": null,
        "nullable": null,
        "source_line": 256,
        "items": "unspecified_json"
      },
      "additional_license_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 257
      },
      "notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 258,
        "format": "markdown"
      }
    },
    "unresolved_properties": [],
    "calculations": [
      "compliance_status",
      "insurance_days_remaining",
      "license_days_remaining"
    ],
    "aggregations": [
      "total_jobs"
    ],
    "scorecards": [
      "sub_compliance",
      "painter_sub_compliance"
    ],
    "relations": {
      "client": {
        "target": "co_client",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "jobs": {
        "target": "co_job",
        "cardinality": "many",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {},
    "calculation_definitions": {
      "compliance_status": "if (.properties.insurance_expiry == null or .properties.license_expiry == null) then \"unknown\" elif ((.properties.insurance_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) < now) then \"expired\" elif ((.properties.license_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) < now) then \"expired\" elif ((.properties.insurance_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - now) < 2592000 then \"expiring_soon\" elif ((.properties.license_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - now) < 2592000 then \"expiring_soon\" else \"compliant\" end",
      "insurance_days_remaining": "if .properties.insurance_expiry then (((.properties.insurance_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - now) / 86400 | floor) else null end",
      "license_days_remaining": "if .properties.license_expiry then (((.properties.license_expiry | strptime(\"%Y-%m-%dT%H:%M:%SZ\") | mktime) - now) / 86400 | floor) else null end"
    },
    "aggregation_definitions": {
      "total_jobs": {
        "target": "co_job",
        "func": "count",
        "property": null,
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "outgoing_many",
          "relation": "jobs"
        },
        "semantics": "component_explicit_paths_v1"
      }
    },
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_change_order": {
    "source_start_line": 267,
    "properties": {
      "status": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 270,
        "enum": [
          "draft",
          "submitted",
          "approved",
          "rejected",
          "executed"
        ]
      },
      "co_number": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 271
      },
      "amount": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 272
      },
      "labor_change": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 273
      },
      "materials_change": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 274
      },
      "days_impact": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 275
      },
      "submitted_at": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 276,
        "format": "date-time"
      },
      "approved_at": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 277,
        "format": "date-time"
      },
      "reason": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 278,
        "format": "markdown"
      },
      "description": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 279,
        "format": "markdown"
      }
    },
    "unresolved_properties": [],
    "calculations": [
      "total_change"
    ],
    "aggregations": [],
    "scorecards": [],
    "relations": {
      "job": {
        "target": "co_job",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "contract": {
        "target": "co_contract",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "client_name": "job.client.$title",
      "job_number": "job.job_number",
      "contract_number": "contract.contract_number"
    },
    "calculation_definitions": {
      "total_change": "(.properties.labor_change // 0) + (.properties.materials_change // 0)"
    },
    "aggregation_definitions": {},
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_invoice": {
    "source_start_line": 286,
    "properties": {
      "status": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 289,
        "enum": [
          "draft",
          "sent",
          "viewed",
          "partial_payment",
          "paid",
          "overdue",
          "voided"
        ]
      },
      "invoice_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 290,
        "enum": [
          "progress",
          "final",
          "retainage",
          "change_order",
          "deposit"
        ]
      },
      "invoice_number": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 291
      },
      "amount": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 292
      },
      "amount_paid": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 293
      },
      "issued_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 294,
        "format": "date-time"
      },
      "due_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 295,
        "format": "date-time"
      },
      "paid_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 296,
        "format": "date-time"
      },
      "quickbooks_id": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 297
      },
      "notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 298,
        "format": "markdown"
      }
    },
    "unresolved_properties": [],
    "calculations": [
      "balance_due"
    ],
    "aggregations": [],
    "scorecards": [
      "invoice_health"
    ],
    "relations": {
      "client": {
        "target": "co_client",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "contract": {
        "target": "co_contract",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "job": {
        "target": "co_job",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "client_name": "client.$title",
      "contract_amount": "contract.amount",
      "contract_number": "contract.contract_number",
      "job_number": "job.job_number",
      "job_status": "job.status"
    },
    "calculation_definitions": {
      "balance_due": ".properties.amount - (.properties.amount_paid // 0)"
    },
    "aggregation_definitions": {},
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_payment": {
    "source_start_line": 306,
    "properties": {
      "amount": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 309
      },
      "payment_method": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 310,
        "enum": [
          "check",
          "ach",
          "wire",
          "credit_card",
          "cash",
          "other"
        ]
      },
      "payment_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 311,
        "format": "date-time"
      },
      "reference_number": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 312
      },
      "quickbooks_id": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 313
      },
      "notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 314
      }
    },
    "unresolved_properties": [],
    "calculations": [],
    "aggregations": [],
    "scorecards": [],
    "relations": {
      "invoice": {
        "target": "co_invoice",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "client": {
        "target": "co_client",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "client_name": "client.$title",
      "invoice_amount": "invoice.amount",
      "invoice_number": "invoice.invoice_number",
      "invoice_status": "invoice.status"
    },
    "calculation_definitions": {},
    "aggregation_definitions": {},
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_daily_report": {
    "source_start_line": 320,
    "properties": {
      "status": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 323,
        "enum": [
          "draft",
          "submitted",
          "approved"
        ]
      },
      "report_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 324,
        "format": "date-time"
      },
      "weather": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 325,
        "enum": [
          "clear",
          "cloudy",
          "rain",
          "snow",
          "wind",
          "hot",
          "other"
        ]
      },
      "temperature": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 326
      },
      "crew_size": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 327
      },
      "work_performed": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 328,
        "format": "markdown"
      },
      "materials_received": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 329,
        "format": "markdown"
      },
      "equipment_used": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 330
      },
      "delays": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 331,
        "format": "markdown"
      },
      "safety_observations": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 332,
        "format": "markdown"
      },
      "notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 333,
        "format": "markdown"
      }
    },
    "unresolved_properties": [],
    "calculations": [],
    "aggregations": [],
    "scorecards": [],
    "relations": {
      "job": {
        "target": "co_job",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "client_name": "job.client.$title",
      "job_number": "job.job_number",
      "job_status": "job.status"
    },
    "calculation_definitions": {},
    "aggregation_definitions": {},
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_campaign": {
    "source_start_line": 339,
    "properties": {
      "status": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 342,
        "enum": [
          "draft",
          "active",
          "paused",
          "completed",
          "archived"
        ]
      },
      "campaign_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 343,
        "enum": [
          "cold_email",
          "direct_mail",
          "door_to_door",
          "referral",
          "digital_ads",
          "bid_board",
          "other"
        ]
      },
      "target_market": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 344,
        "enum": [
          "commercial",
          "residential",
          "municipal",
          "subcontract",
          "all"
        ]
      },
      "start_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 345,
        "format": "date-time"
      },
      "end_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 345,
        "format": "date-time"
      },
      "goal": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 346
      },
      "email_template": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 347,
        "format": "markdown"
      },
      "automation_rules": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 348,
        "format": "markdown"
      },
      "notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 349,
        "format": "markdown"
      }
    },
    "unresolved_properties": [],
    "calculations": [],
    "aggregations": [
      "total_leads_generated",
      "total_outreach_sent"
    ],
    "scorecards": [],
    "relations": {},
    "mirror_paths": {},
    "calculation_definitions": {},
    "aggregation_definitions": {
      "total_leads_generated": {
        "target": "co_lead",
        "func": "count",
        "property": null,
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "campaign"
        },
        "semantics": "component_explicit_paths_v1"
      },
      "total_outreach_sent": {
        "target": "co_outreach",
        "func": "count",
        "property": null,
        "filter": null,
        "sourcePathFilter": null,
        "pathPolicy": {
          "kind": "incoming_single",
          "relation": "campaign"
        },
        "semantics": "component_explicit_paths_v1"
      }
    },
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_outreach": {
    "source_start_line": 355,
    "properties": {
      "status": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 358,
        "enum": [
          "pending",
          "sent",
          "delivered",
          "opened",
          "replied",
          "no_response",
          "opted_out",
          "converted"
        ]
      },
      "channel": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 359,
        "enum": [
          "email",
          "phone",
          "door_knock",
          "linkedin",
          "referral",
          "direct_mail",
          "other"
        ]
      },
      "subject": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 360
      },
      "body": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 361,
        "format": "markdown"
      },
      "sequence_step": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 362
      },
      "sent_at": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 363,
        "format": "date-time"
      },
      "follow_up_date": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 363,
        "format": "date-time"
      },
      "response_notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 364,
        "format": "markdown"
      }
    },
    "unresolved_properties": [],
    "calculations": [],
    "aggregations": [],
    "scorecards": [],
    "relations": {
      "campaign": {
        "target": "co_campaign",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "contact": {
        "target": "co_contact",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "client": {
        "target": "co_client",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "campaign_name": "campaign.$title",
      "client_name": "client.$title",
      "contact_email": "contact.email",
      "contact_first_name": "contact.first_name",
      "contact_last_name": "contact.last_name"
    },
    "calculation_definitions": {},
    "aggregation_definitions": {},
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_automation_rule": {
    "source_start_line": 370,
    "properties": {
      "trigger": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 373,
        "enum": [
          "new_lead",
          "follow_up_due",
          "proposal_sent",
          "bid_submitted",
          "invoice_overdue",
          "job_won",
          "outreach_no_response",
          "campaign_enrolled",
          "contract_signed",
          "payment_received",
          "other"
        ]
      },
      "status": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 374,
        "enum": [
          "draft",
          "active",
          "paused",
          "archived"
        ]
      },
      "channel": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 375,
        "enum": [
          "email",
          "sms",
          "phone_task",
          "notification",
          "webhook",
          "other"
        ]
      },
      "subject": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 376
      },
      "body": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 377,
        "format": "markdown"
      },
      "delay_days": {
        "type": "number",
        "required": null,
        "nullable": null,
        "source_line": 378
      },
      "conditions": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 379,
        "format": "markdown"
      },
      "notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 380,
        "format": "markdown"
      }
    },
    "unresolved_properties": [],
    "calculations": [],
    "aggregations": [],
    "scorecards": [],
    "relations": {
      "campaign": {
        "target": "co_campaign",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "campaign_name": "campaign.$title",
      "campaign_status": "campaign.status",
      "campaign_type": "campaign.campaign_type"
    },
    "calculation_definitions": {},
    "aggregation_definitions": {},
    "source_update": "user_schema_transcription_2026_09_22"
  },
  "co_document": {
    "source_start_line": 386,
    "properties": {
      "doc_type": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 389,
        "enum": [
          "capability_statement",
          "bid_package",
          "website_copy",
          "design_spec",
          "agent_rules",
          "governance",
          "email_template",
          "marketing_collateral",
          "proof",
          "proposal_template",
          "contract_template",
          "sow_template",
          "safety_plan",
          "other"
        ]
      },
      "status": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 390,
        "enum": [
          "draft",
          "in_review",
          "approved",
          "published",
          "archived"
        ]
      },
      "version": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 391
      },
      "content": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 392,
        "format": "markdown"
      },
      "file_url": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 393,
        "format": "url"
      },
      "tags": {
        "type": "array",
        "required": null,
        "nullable": null,
        "source_line": 394,
        "items": "unspecified_json"
      },
      "notes": {
        "type": "string",
        "required": null,
        "nullable": null,
        "source_line": 395,
        "format": "markdown"
      }
    },
    "unresolved_properties": [],
    "calculations": [],
    "aggregations": [],
    "scorecards": [],
    "relations": {
      "campaign": {
        "target": "co_campaign",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "lead": {
        "target": "co_lead",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "job": {
        "target": "co_job",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      },
      "contract": {
        "target": "co_contract",
        "cardinality": "one",
        "required": false,
        "provenance": "explicit_target_or_co_prefix_expansion_of_named_relation",
        "source": "user_schema_transcription_2026_09_22"
      }
    },
    "mirror_paths": {
      "campaign_name": "campaign.$title",
      "contract_number": "contract.contract_number",
      "job_number": "job.job_number",
      "job_status": "job.status"
    },
    "calculation_definitions": {},
    "aggregation_definitions": {},
    "source_update": "user_schema_transcription_2026_09_22"
  }
} as const;
