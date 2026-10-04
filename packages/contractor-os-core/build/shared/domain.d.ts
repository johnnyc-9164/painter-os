import { type Scalar } from './calculations.js';
import { DOMAIN_MANIFEST } from './domainManifest.js';
import { type Json } from './port.js';
import type { Blueprint } from './model.js';
import type { DomainProperties } from './domainTypes.js';
export { DOMAIN_MANIFEST };
export type { DomainProperties, DomainRelations } from './domainTypes.js';
interface Field {
    type: string;
    enum?: readonly string[];
    format?: string;
}
interface Definition {
    properties: Record<string, Field>;
    unresolved_properties: readonly {
        name: string;
    }[];
    relations: Record<string, {
        target: Blueprint;
        cardinality: string;
    }>;
    calculations: readonly string[];
}
export declare function definition(blueprint: Blueprint): Definition;
export declare function validateProperties<B extends Blueprint>(blueprint: B, input: unknown): DomainProperties[B];
export type RelationInput = Record<string, string | string[] | null>;
export declare function validateRelations(blueprint: Blueprint, input: unknown): RelationInput;
export declare function applyPropertyPatch<B extends Blueprint>(blueprint: B, previous: unknown, changes: unknown, unset?: readonly string[]): DomainProperties[B];
export declare function computeKnown(blueprint: Blueprint, name: string, properties: unknown, nowMs?: number): {
    status: 'computed';
    value: Scalar;
} | {
    status: 'definition_missing';
} | {
    status: 'invalid_input';
    value: null;
    issue: string | null;
};
/** Lossless source retained; this is a conversion report, not a silent data import. */
export declare function projectSnapshot(input: unknown): {
    blueprint: "co_automation_rule" | "co_bid" | "co_campaign" | "co_change_order" | "co_client" | "co_contact" | "co_contract" | "co_daily_report" | "co_document" | "co_invoice" | "co_job" | "co_lead" | "co_outreach" | "co_payment" | "co_pricing_rule" | "co_proposal" | "co_scope" | "co_site_visit" | "co_subcontractor" | "co_trade_spec";
    identifier: string;
    title: string | null;
    properties: {
        client_type?: "commercial" | "residential" | "municipal" | "general_contractor" | "subcontractor_vendor";
        status?: "prospect" | "active" | "on_hold" | "inactive" | "archived";
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        zip?: string;
        website?: string;
        industry?: string;
        source?: "referral" | "cold_outreach" | "bid_board" | "website" | "repeat_client" | "other";
        notes?: string;
        tags?: Json[];
    } | {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        job_title?: string;
        role?: "decision_maker" | "influencer" | "gatekeeper" | "procurement" | "end_user" | "other";
        notes?: string;
    } | {
        stage?: "new" | "qualifying" | "site_visit_scheduled" | "scope_in_progress" | "proposal_sent" | "bid_submitted" | "awarded" | "won" | "lost" | "on_hold";
        priority?: "low" | "medium" | "high" | "urgent";
        estimated_value?: number;
        contract_type?: "commercial" | "residential" | "municipal" | "subcontract" | "general";
        source?: "cold_outreach" | "referral" | "repeat_client" | "website" | "bid_board" | "walk_in" | "other";
        expected_close_date?: string;
        next_followup_date?: string;
        description?: string;
        notes?: string;
        followup_notes?: string;
        lost_reason?: "price" | "competitor" | "no_response" | "budget" | "timing" | "scope_mismatch" | "other";
    } | {
        status?: "scheduled" | "completed" | "cancelled" | "rescheduled" | "no_show";
        visit_date?: string;
        address?: string;
        rough_estimate?: number;
        findings?: string;
        notes?: string;
        photos_url?: string;
    } | {
        trade_type?: "general" | "electrical" | "plumbing" | "hvac" | "structural" | "civil" | "concrete" | "roofing" | "landscaping" | "painting" | "garage_door" | "drywall_framing" | "other";
        status?: "draft" | "in_review" | "approved" | "rejected" | "superseded";
        description?: string;
        assumptions?: string;
        exclusions?: string;
        estimated_hours?: number;
        estimated_labor_cost?: number;
        estimated_materials_cost?: number;
        measurement_unit?: "sq_ft" | "linear_ft" | "units" | "squares" | "tons" | "cubic_yards";
        measurement_value?: number;
        version?: string;
    } | {
        trade?: "painting" | "plumbing" | "roofing" | "garage_door" | "electrical" | "hvac" | "concrete" | "landscaping" | "drywall_framing";
        measurement_value?: number;
        measurement_unit?: "sq_ft" | "linear_ft" | "units" | "squares" | "tons" | "cubic_yards" | "lf";
        permit_required?: boolean;
        permit_number?: string;
        materials_spec?: string;
        special_requirements?: string;
        surface_condition?: "new" | "good" | "fair" | "poor" | "needs_repair";
        paint_surface_type?: "interior_walls" | "exterior_walls" | "trim" | "ceilings" | "cabinets" | "deck" | "fence" | "concrete_floor" | "garage_floor" | "other";
        paint_finish?: "flat" | "eggshell" | "satin" | "semi_gloss" | "gloss" | "cabinet_enamel";
        paint_grade?: "economy" | "standard" | "premium" | "luxury";
        number_of_coats?: number;
        color_count?: number;
        primer_required?: boolean;
        pressure_wash_required?: boolean;
        prep_work?: "minimal" | "moderate" | "extensive" | "repair_needed";
        masking_complexity?: "simple" | "moderate" | "complex";
        lead_hazard_present?: boolean;
        ceiling_height_ft?: number;
        roof_type?: "asphalt_shingle" | "metal" | "tile" | "flat_tpo" | "flat_epdm" | "slate" | "cedar_shake" | "other";
        roof_pitch?: "flat" | "low" | "medium" | "steep";
        layers_to_remove?: number;
        decking_replacement?: boolean;
        gutter_work?: boolean;
        skylight_count?: number;
        hvac_system_type?: "central_air" | "mini_split" | "heat_pump" | "furnace" | "boiler" | "ductwork" | "other";
        tonnage?: number;
        ductwork_included?: boolean;
        electrical_service_type?: "residential" | "commercial" | "industrial";
        circuit_count?: number;
        panel_amps?: number;
        panel_upgrade?: boolean;
        fixture_count?: number;
        pipe_material?: "copper" | "pvc" | "cpvc" | "pex" | "cast_iron" | "abs" | "galvanized" | "other";
        pipe_diameter?: string;
        drain_cleaning?: boolean;
        water_heater_involved?: boolean;
        concrete_type?: "slab" | "driveway" | "sidewalk" | "foundation" | "decorative" | "stamped";
        concrete_finish?: "broom" | "smooth" | "exposed_aggregate" | "stamped" | "epoxy";
        reinforcement?: "none" | "rebar" | "wire_mesh" | "fiber";
        thickness_inches?: number;
        drywall_type?: "standard" | "moisture_resistant" | "fire_rated" | "soundproof";
        framing_type?: "wood" | "metal" | "none";
        finishing_level?: "level_1" | "level_2" | "level_3" | "level_4" | "level_5";
        door_type?: "single" | "double" | "roll_up" | "sectional" | "carriage_style";
        door_material?: "steel" | "wood" | "aluminum" | "fiberglass" | "vinyl";
        door_count?: number;
        spring_type?: "torsion" | "extension";
        opener_included?: boolean;
        landscape_service_type?: "lawn_care" | "hardscaping" | "planting" | "irrigation" | "drainage" | "tree_work" | "cleanup";
        irrigation_zones?: number;
        sod_or_seed?: "sod" | "seed" | "hydroseed" | "na";
    } | {
        rule_name?: string;
        trade?: "painting" | "plumbing" | "roofing" | "garage_door" | "electrical" | "hvac" | "concrete" | "landscaping" | "drywall_framing";
        pricing_type?: "per_sqft" | "per_linear_ft" | "per_unit" | "per_square" | "per_ton" | "lump_sum" | "hourly" | "per_door" | "per_zone";
        base_rate?: number;
        labor_rate_per_hour?: number;
        material_markup_percent?: number;
        overhead_percent?: number;
        profit_margin_percent?: number;
        min_job_size?: number;
        is_active?: boolean;
        description?: string;
    } | {
        status?: "draft" | "in_review" | "sent" | "viewed" | "accepted" | "rejected" | "expired" | "revised";
        amount?: number;
        currency?: string;
        version?: string;
        sent_at?: string;
        expires_at?: string;
        notes?: string;
        terms?: string;
        proposal_doc_url?: string;
    } | {
        status?: "preparing" | "submitted" | "under_review" | "awarded" | "not_awarded" | "withdrawn";
        bid_type?: "open" | "invited" | "negotiated" | "sole_source";
        amount?: number;
        bid_number?: string;
        submission_deadline?: string;
        submitted_at?: string;
        bond_required?: boolean;
        bond_amount?: number;
        prevailing_wage?: boolean;
        insurance_verified?: boolean;
        capability_statement_attached?: boolean;
        notes?: string;
    } | {
        status?: "draft" | "sent_for_signature" | "partially_signed" | "fully_executed" | "voided" | "expired";
        contract_type?: "lump_sum" | "time_and_materials" | "unit_price" | "cost_plus" | "gmp";
        amount?: number;
        contract_number?: string;
        start_date?: string;
        end_date?: string;
        signed_at?: string;
        retainage_percent?: number;
        docusign_envelope_id?: string;
        contract_doc_url?: string;
        notes?: string;
    } | {
        status?: "pre_construction" | "mobilizing" | "active" | "on_hold" | "punch_list" | "complete" | "closed" | "cancelled";
        job_type?: "commercial" | "residential" | "municipal" | "subcontract" | "general";
        job_number?: string;
        address?: string;
        city?: string;
        state?: string;
        start_date?: string;
        projected_end_date?: string;
        actual_end_date?: string;
        percent_complete?: number;
        contract_amount?: number;
        billed_to_date?: number;
        collected_to_date?: number;
        project_manager?: string;
        superintendent?: string;
        safety_plan_url?: string;
        notes?: string;
    } | {
        trade?: "electrical" | "plumbing" | "hvac" | "concrete" | "framing" | "roofing" | "landscaping" | "painting" | "drywall" | "flooring" | "fire_suppression" | "garage_door" | "other";
        status?: "prospect" | "prequalified" | "active" | "on_hold" | "blacklisted";
        contact_name?: string;
        email?: string;
        phone?: string;
        license_number?: string;
        license_expiry?: string;
        insurance_expiry?: string;
        w9_on_file?: boolean;
        lead_safe_certified?: boolean;
        bond_amount?: number;
        certifications?: Json[];
        additional_license_type?: string;
        notes?: string;
    } | {
        status?: "draft" | "submitted" | "approved" | "rejected" | "executed";
        co_number?: string;
        amount?: number;
        labor_change?: number;
        materials_change?: number;
        days_impact?: number;
        submitted_at?: string;
        approved_at?: string;
        reason?: string;
        description?: string;
    } | {
        status?: "draft" | "sent" | "viewed" | "partial_payment" | "paid" | "overdue" | "voided";
        invoice_type?: "progress" | "final" | "retainage" | "change_order" | "deposit";
        invoice_number?: string;
        amount?: number;
        amount_paid?: number;
        issued_date?: string;
        due_date?: string;
        paid_date?: string;
        quickbooks_id?: string;
        notes?: string;
    } | {
        amount?: number;
        payment_method?: "check" | "ach" | "wire" | "credit_card" | "cash" | "other";
        payment_date?: string;
        reference_number?: string;
        quickbooks_id?: string;
        notes?: string;
    } | {
        status?: "draft" | "submitted" | "approved";
        report_date?: string;
        weather?: "clear" | "cloudy" | "rain" | "snow" | "wind" | "hot" | "other";
        temperature?: number;
        crew_size?: number;
        work_performed?: string;
        materials_received?: string;
        equipment_used?: string;
        delays?: string;
        safety_observations?: string;
        notes?: string;
    } | {
        status?: "draft" | "active" | "paused" | "completed" | "archived";
        campaign_type?: "cold_email" | "direct_mail" | "door_to_door" | "referral" | "digital_ads" | "bid_board" | "other";
        target_market?: "commercial" | "residential" | "municipal" | "subcontract" | "all";
        start_date?: string;
        end_date?: string;
        goal?: string;
        email_template?: string;
        automation_rules?: string;
        notes?: string;
    } | {
        status?: "pending" | "sent" | "delivered" | "opened" | "replied" | "no_response" | "opted_out" | "converted";
        channel?: "email" | "phone" | "door_knock" | "linkedin" | "referral" | "direct_mail" | "other";
        subject?: string;
        body?: string;
        sequence_step?: number;
        sent_at?: string;
        follow_up_date?: string;
        response_notes?: string;
    } | {
        trigger?: "new_lead" | "follow_up_due" | "proposal_sent" | "bid_submitted" | "invoice_overdue" | "job_won" | "outreach_no_response" | "campaign_enrolled" | "contract_signed" | "payment_received" | "other";
        status?: "draft" | "active" | "paused" | "archived";
        channel?: "email" | "sms" | "phone_task" | "notification" | "webhook" | "other";
        subject?: string;
        body?: string;
        delay_days?: number;
        conditions?: string;
        notes?: string;
    } | {
        doc_type?: "capability_statement" | "bid_package" | "website_copy" | "design_spec" | "agent_rules" | "governance" | "email_template" | "marketing_collateral" | "proof" | "proposal_template" | "contract_template" | "sow_template" | "safety_plan" | "other";
        status?: "draft" | "in_review" | "approved" | "published" | "archived";
        version?: string;
        content?: string;
        file_url?: string;
        tags?: Json[];
        notes?: string;
    };
    omittedNulls: string[];
    deferredProperties: Record<string, Json>;
    sourceRelations: Record<string, Json>;
    sourceSnapshotJson: string;
};
