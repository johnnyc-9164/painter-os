Let me first get all blueprint identifiers, then fetch their full schemas!Now let me fetch the full schema for all blueprints simultaneously!Here's the full schema for all **32 blueprints** in your organization, organized by domain:

---

## 🏗️ Contractor / Business Blueprints (`co_*`)

---

### 📋 `co_client` — Contractor Client
| Field | Type | Notes |
|---|---|---|
| `client_type` | `string` (enum) | `commercial`, `residential`, `municipal`, `general_contractor`, `subcontractor_vendor` |
| `status` | `string` (enum) | `prospect`, `active`, `on_hold`, `inactive`, `archived` |
| `email` | `string` (email) | |
| `phone` | `string` | |
| `address` | `string` | |
| `city` | `string` | |
| `state` | `string` | |
| `zip` | `string` | |
| `website` | `string` (url) | |
| `industry` | `string` | |
| `source` | `string` (enum) | `referral`, `cold_outreach`, `bid_board`, `website`, `repeat_client`, `other` |
| `notes` | `string` (markdown) | |
| `tags` | `array` | |

**Aggregations:** `active_jobs`, `total_contracts`, `total_jobs`, `total_leads`, `total_payments_received`
**Scorecards:** `client_health` (Basic → Gold)

---

### 👤 `co_contact` — Contractor Contact
| Field | Type | Notes |
|---|---|---|
| `first_name` | `string` | |
| `last_name` | `string` | |
| `email` | `string` (email) | |
| `phone` | `string` | |
| `job_title` | `string` | |
| `role` | `string` (enum) | `decision_maker`, `influencer`, `gatekeeper`, `procurement`, `end_user`, `other` |
| `notes` | `string` (markdown) | |

**Calc:** `full_name` = first + last name
**Relations:** `client` → `co_client`
**Mirror:** `client_name`, `client_status`, `client_type`

---

### ⚡ `co_lead` — Lead / Opportunity
| Field | Type | Notes |
|---|---|---|
| `stage` | `string` (enum) | `new`, `qualifying`, `site_visit_scheduled`, `scope_in_progress`, `proposal_sent`, `bid_submitted`, `awarded`, `won`, `lost`, `on_hold` |
| `priority` | `string` (enum) | `low`, `medium`, `high`, `urgent` |
| `estimated_value` | `number` | $ |
| `contract_type` | `string` (enum) | `commercial`, `residential`, `municipal`, `subcontract`, `general` |
| `source` | `string` (enum) | `cold_outreach`, `referral`, `repeat_client`, `website`, `bid_board`, `walk_in`, `other` |
| `expected_close_date` | `string` (date-time) | |
| `next_followup_date` | `string` (date-time) | |
| `description` | `string` (markdown) | |
| `notes` | `string` (markdown) | |
| `followup_notes` | `string` (markdown) | |
| `lost_reason` | `string` (enum) | `price`, `competitor`, `no_response`, `budget`, `timing`, `scope_mismatch`, `other` |

**Relations:** `client` → `co_client`, `contact` → `co_contact`, `campaign` → `co_campaign`
**Aggregations:** `total_proposals`, `total_site_visits`
**Scorecards:** `lead_quality` (Basic → Gold)

---

### 📍 `co_site_visit` — Site Visit / Estimate
| Field | Type | Notes |
|---|---|---|
| `status` | `string` (enum) | `scheduled`, `completed`, `cancelled`, `rescheduled`, `no_show` |
| `visit_date` | `string` (date-time) | |
| `address` | `string` | |
| `rough_estimate` | `number` | $ |
| `findings` | `string` (markdown) | |
| `notes` | `string` (markdown) | |
| `photos_url` | `string` (url) | |

**Relations:** `contact`, `client`, `lead`

---

### 📄 `co_scope` — Scope of Work
| Field | Type | Notes |
|---|---|---|
| `trade_type` | `string` (enum) | `general`, `electrical`, `plumbing`, `hvac`, `structural`, `civil`, `concrete`, `roofing`, `landscaping`, `painting`, `garage_door`, `drywall_framing`, `other` |
| `status` | `string` (enum) | `draft`, `in_review`, `approved`, `rejected`, `superseded` |
| `description` | `string` (markdown) | |
| `assumptions` | `string` (markdown) | |
| `exclusions` | `string` (markdown) | |
| `estimated_hours` | `number` | |
| `estimated_labor_cost` | `number` | $ |
| `estimated_materials_cost` | `number` | $ |
| `measurement_unit` | `string` (enum) | `sq_ft`, `linear_ft`, `units`, `squares`, `tons`, `cubic_yards` |
| `measurement_value` | `number` | |
| `version` | `string` | |

**Calc:** `total_estimated_cost`
**Relations:** `trade_spec` → `co_trade_spec`, `lead`, `proposal`

---

### 🎨 `co_trade_spec` — Trade Specification
**50+ fields** covering all trade types. Key fields:

| Field | Type | Notes |
|---|---|---|
| `trade` | `string` (enum) | `painting`, `plumbing`, `roofing`, `garage_door`, `electrical`, `hvac`, `concrete`, `landscaping`, `drywall_framing` |
| `measurement_value` | `number` | |
| `measurement_unit` | `string` (enum) | `sq_ft`, `linear_ft`, `units`, `squares`, `tons`, `cubic_yards`, `lf` |
| `permit_required` | `boolean` | |
| `permit_number` | `string` | |
| `materials_spec` | `string` (markdown) | |
| `special_requirements` | `string` (markdown) | |
| **Painting:** `paint_finish`, `paint_grade`, `paint_surface_type`, `number_of_coats`, `color_count`, `primer_required`, `pressure_wash_required`, `prep_work`, `masking_complexity`, `lead_hazard_present` | enums/bool | |
| **Roofing:** `roof_type`, `roof_pitch`, `layers_to_remove`, `decking_replacement`, `gutter_work`, `skylight_count` | enum/bool/num | |
| **HVAC:** `hvac_system_type`, `tonnage`, `ductwork_included` | | |
| **Electrical:** `electrical_service_type`, `circuit_count`, `panel_amps`, `panel_upgrade`, `fixture_count` | | |
| **Plumbing:** `pipe_material`, `pipe_diameter`, `fixture_count`, `drain_cleaning`, `water_heater_involved` | | |
| **Concrete:** `concrete_type`, `concrete_finish`, `reinforcement`, `thickness_inches` | | |
| **Drywall:** `drywall_type`, `framing_type`, `finishing_level`, `ceiling_height_ft` | | |
| **Garage Door:** `door_type`, `door_material`, `door_count`, `spring_type`, `opener_included` | | |
| **Landscaping:** `landscape_service_type`, `irrigation_zones`, `sod_or_seed` | | |

**Calcs:** `estimated_gallons` (painting), `estimated_squares` (roofing)
**Relations:** `scope` → `co_scope`, `pricing_rule` → `co_pricing_rule`
**Scorecards:** 9 trade-specific quality scorecards (Basic → Gold)

---

### 💰 `co_pricing_rule` — Pricing Rule
| Field | Type | Notes |
|---|---|---|
| `rule_name` | `string` | |
| `trade` | `string` (enum) | same 9 trades |
| `pricing_type` | `string` (enum) | `per_sqft`, `per_linear_ft`, `per_unit`, `per_square`, `per_ton`, `lump_sum`, `hourly`, `per_door`, `per_zone` |
| `base_rate` | `number` | $ |
| `labor_rate_per_hour` | `number` | $ |
| `material_markup_percent` | `number` | % |
| `overhead_percent` | `number` | % |
| `profit_margin_percent` | `number` | % |
| `min_job_size` | `number` | |
| `is_active` | `boolean` | |
| `description` | `string` (markdown) | |

**Calcs:** `effective_rate`, `material_multiplier`

---

### 📃 `co_proposal` — Proposal
| Field | Type | Notes |
|---|---|---|
| `status` | `string` (enum) | `draft`, `in_review`, `sent`, `viewed`, `accepted`, `rejected`, `expired`, `revised` |
| `amount` | `number` | $ |
| `currency` | `string` | |
| `version` | `string` | |
| `sent_at` | `string` (date-time) | |
| `expires_at` | `string` (date-time) | |
| `notes` | `string` (markdown) | |
| `terms` | `string` (markdown) | |
| `proposal_doc_url` | `string` (url) | |

**Relations:** `client`, `lead`, `contact`, `scope`
**Aggregations:** `total_bids`
**Scorecards:** `proposal_readiness` (Basic → Gold)

---

### 🔨 `co_bid` — Bid
| Field | Type | Notes |
|---|---|---|
| `status` | `string` (enum) | `preparing`, `submitted`, `under_review`, `awarded`, `not_awarded`, `withdrawn` |
| `bid_type` | `string` (enum) | `open`, `invited`, `negotiated`, `sole_source` |
| `amount` | `number` | $ |
| `bid_number` | `string` | |
| `submission_deadline` | `string` (date-time) | |
| `submitted_at` | `string` (date-time) | |
| `bond_required` | `boolean` | |
| `bond_amount` | `number` | $ |
| `prevailing_wage` | `boolean` | |
| `insurance_verified` | `boolean` | |
| `capability_statement_attached` | `boolean` | |
| `notes` | `string` (markdown) | |

**Calc:** `days_until_deadline`
**Relations:** `proposal`, `client`, `lead`
**Scorecards:** `bid_readiness` (Basic → Gold)

---

### 📜 `co_contract` — Contract
| Field | Type | Notes |
|---|---|---|
| `status` | `string` (enum) | `draft`, `sent_for_signature`, `partially_signed`, `fully_executed`, `voided`, `expired` |
| `contract_type` | `string` (enum) | `lump_sum`, `time_and_materials`, `unit_price`, `cost_plus`, `gmp` |
| `amount` | `number` | $ |
| `contract_number` | `string` | |
| `start_date` | `string` (date-time) | |
| `end_date` | `string` (date-time) | |
| `signed_at` | `string` (date-time) | |
| `retainage_percent` | `number` | % |
| `docusign_envelope_id` | `string` | |
| `contract_doc_url` | `string` (url) | |
| `notes` | `string` (markdown) | |

**Calcs:** `contract_duration_days`, `retainage_amount`
**Aggregations:** `change_order_count`, `invoice_count`, `total_invoiced_agg`
**Relations:** `contact`, `client`, `bid`
**Scorecards:** `contract_completeness` (Basic → Gold)

---

### 🏗️ `co_job` — Job / Project
| Field | Type | Notes |
|---|---|---|
| `status` | `string` (enum) | `pre_construction`, `mobilizing`, `active`, `on_hold`, `punch_list`, `complete`, `closed`, `cancelled` |
| `job_type` | `string` (enum) | `commercial`, `residential`, `municipal`, `subcontract`, `general` |
| `job_number` | `string` | |
| `address` | `string` | |
| `city` | `string` | |
| `state` | `string` | |
| `start_date` | `string` (date-time) | |
| `projected_end_date` | `string` (date-time) | |
| `actual_end_date` | `string` (date-time) | |
| `percent_complete` | `number` | % |
| `contract_amount` | `number` | $ |
| `billed_to_date` | `number` | $ |
| `collected_to_date` | `number` | $ |
| `project_manager` | `string` | |
| `superintendent` | `string` | |
| `safety_plan_url` | `string` (url) | |
| `notes` | `string` (markdown) | |

**Calcs:** `billing_variance`, `outstanding_balance`
**Aggregations:** `total_invoiced`, `total_invoices`, `daily_reports_count`, `total_change_orders`, `total_co_amount`
**Relations:** `contact`, `contract`, `bid`, `client`, `subcontractors` (many)
**Scorecards:** `job_health` (Basic → Gold)

---

### 🔧 `co_subcontractor` — Subcontractor
| Field | Type | Notes |
|---|---|---|
| `trade` | `string` (enum) | `electrical`, `plumbing`, `hvac`, `concrete`, `framing`, `roofing`, `landscaping`, `painting`, `drywall`, `flooring`, `fire_suppression`, `garage_door`, `other` |
| `status` | `string` (enum) | `prospect`, `prequalified`, `active`, `on_hold`, `blacklisted` |
| `contact_name` | `string` | |
| `email` | `string` (email) | |
| `phone` | `string` | |
| `license_number` | `string` | |
| `license_expiry` | `string` (date-time) | |
| `insurance_expiry` | `string` (date-time) | |
| `w9_on_file` | `boolean` | |
| `lead_safe_certified` | `boolean` | |
| `bond_amount` | `number` | $ |
| `certifications` | `array` | |
| `additional_license_type` | `string` | |
| `notes` | `string` (markdown) | |

**Calcs:** `compliance_status`, `insurance_days_remaining`, `license_days_remaining`
**Aggregations:** `total_jobs`
**Relations:** `client`, `jobs` (many → `co_job`)
**Scorecards:** `sub_compliance`, `painter_sub_compliance` (Basic → Gold)

---

### 🔄 `co_change_order` — Change Order
| Field | Type | Notes |
|---|---|---|
| `status` | `string` (enum) | `draft`, `submitted`, `approved`, `rejected`, `executed` |
| `co_number` | `string` | |
| `amount` | `number` | $ |
| `labor_change` | `number` | $ |
| `materials_change` | `number` | $ |
| `days_impact` | `number` | |
| `submitted_at` | `string` (date-time) | |
| `approved_at` | `string` (date-time) | |
| `reason` | `string` (markdown) | |
| `description` | `string` (markdown) | |

**Calc:** `total_change`
**Relations:** `job`, `contract`

---

### 🧾 `co_invoice` — Invoice
| Field | Type | Notes |
|---|---|---|
| `status` | `string` (enum) | `draft`, `sent`, `viewed`, `partial_payment`, `paid`, `overdue`, `voided` |
| `invoice_type` | `string` (enum) | `progress`, `final`, `retainage`, `change_order`, `deposit` |
| `invoice_number` | `string` | |
| `amount` | `number` | $ |
| `amount_paid` | `number` | $ |
| `issued_date` | `string` (date-time) | |
| `due_date` | `string` (date-time) | |
| `paid_date` | `string` (date-time) | |
| `quickbooks_id` | `string` | |
| `notes` | `string` (markdown) | |

**Calc:** `balance_due`
**Relations:** `client`, `contract`, `job`
**Scorecards:** `invoice_health` (Basic → Gold)

---

### 💳 `co_payment` — Payment
| Field | Type | Notes |
|---|---|---|
| `amount` | `number` | $ |
| `payment_method` | `string` (enum) | `check`, `ach`, `wire`, `credit_card`, `cash`, `other` |
| `payment_date` | `string` (date-time) | |
| `reference_number` | `string` | |
| `quickbooks_id` | `string` | |
| `notes` | `string` | |

**Relations:** `invoice`, `client`

---

### 📅 `co_daily_report` — Daily Report
| Field | Type | Notes |
|---|---|---|
| `status` | `string` (enum) | `draft`, `submitted`, `approved` |
| `report_date` | `string` (date-time) | |
| `weather` | `string` (enum) | `clear`, `cloudy`, `rain`, `snow`, `wind`, `hot`, `other` |
| `temperature` | `number` | °F |
| `crew_size` | `number` | |
| `work_performed` | `string` (markdown) | |
| `materials_received` | `string` (markdown) | |
| `equipment_used` | `string` | |
| `delays` | `string` (markdown) | |
| `safety_observations` | `string` (markdown) | |
| `notes` | `string` (markdown) | |

**Relations:** `job` → `co_job`

---

### 📢 `co_campaign` — Outreach Campaign
| Field | Type | Notes |
|---|---|---|
| `status` | `string` (enum) | `draft`, `active`, `paused`, `completed`, `archived` |
| `campaign_type` | `string` (enum) | `cold_email`, `direct_mail`, `door_to_door`, `referral`, `digital_ads`, `bid_board`, `other` |
| `target_market` | `string` (enum) | `commercial`, `residential`, `municipal`, `subcontract`, `all` |
| `start_date` / `end_date` | `string` (date-time) | |
| `goal` | `string` | |
| `email_template` | `string` (markdown) | |
| `automation_rules` | `string` (markdown) | |
| `notes` | `string` (markdown) | |

**Aggregations:** `total_leads_generated`, `total_outreach_sent`

---

### 📬 `co_outreach` — Cold Outreach
| Field | Type | Notes |
|---|---|---|
| `status` | `string` (enum) | `pending`, `sent`, `delivered`, `opened`, `replied`, `no_response`, `opted_out`, `converted` |
| `channel` | `string` (enum) | `email`, `phone`, `door_knock`, `linkedin`, `referral`, `direct_mail`, `other` |
| `subject` | `string` | |
| `body` | `string` (markdown) | |
| `sequence_step` | `number` | |
| `sent_at` / `follow_up_date` | `string` (date-time) | |
| `response_notes` | `string` (markdown) | |

**Relations:** `campaign`, `contact`, `client`

---

### 🤖 `co_automation_rule` — Automation Rule
| Field | Type | Notes |
|---|---|---|
| `trigger` | `string` (enum) | `new_lead`, `follow_up_due`, `proposal_sent`, `bid_submitted`, `invoice_overdue`, `job_won`, `outreach_no_response`, `campaign_enrolled`, `contract_signed`, `payment_received`, `other` |
| `status` | `string` (enum) | `draft`, `active`, `paused`, `archived` |
| `channel` | `string` (enum) | `email`, `sms`, `phone_task`, `notification`, `webhook`, `other` |
| `subject` | `string` | |
| `body` | `string` (markdown) | |
| `delay_days` | `number` | |
| `conditions` | `string` (markdown) | |
| `notes` | `string` (markdown) | |

**Relations:** `campaign`

---

### 📁 `co_document` — Contractor Document
| Field | Type | Notes |
|---|---|---|
| `doc_type` | `string` (enum) | `capability_statement`, `bid_package`, `website_copy`, `design_spec`, `agent_rules`, `governance`, `email_template`, `marketing_collateral`, `proof`, `proposal_template`, `contract_template`, `sow_template`, `safety_plan`, `other` |
| `status` | `string` (enum) | `draft`, `in_review`, `approved`, `published`, `archived` |
| `version` | `string` | |
| `content` | `string` (markdown) | |
| `file_url` | `string` (url) | |
| `tags` | `array` | |
| `notes` | `string` (markdown) | |

**Relations:** `campaign`, `lead`, `job`, `contract`

---

