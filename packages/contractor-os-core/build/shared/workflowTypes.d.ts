export interface WorkflowInputs {
    co_create_lead: {
        stage?: "new" | "qualifying" | "site_visit_scheduled" | "scope_in_progress" | "proposal_sent" | "bid_submitted" | "awarded" | "won" | "lost" | "on_hold";
        title: string;
        client: string;
        source?: "cold_outreach" | "referral" | "repeat_client" | "website" | "bid_board" | "walk_in" | "other";
        contact?: string;
        priority?: "low" | "medium" | "high" | "urgent";
        description?: string;
        estimated_value?: number;
    };
    co_schedule_site_visit: {
        lead: string;
        notes?: string;
        address?: string;
        visit_date: string;
    };
    co_advance_lead: {
        lead: string;
        new_stage: "qualifying" | "site_visit_scheduled" | "scope_in_progress" | "proposal_sent" | "bid_submitted" | "awarded" | "won" | "lost" | "on_hold";
        followup_notes?: string;
        next_followup_date?: string;
    };
    co_create_scope: {
        lead: string;
        version?: string;
        trade_type?: "general" | "electrical" | "plumbing" | "hvac" | "structural" | "civil" | "concrete" | "roofing" | "landscaping" | "painting" | "other";
        description?: string;
        estimated_hours?: number;
        estimated_labor_cost?: number;
        estimated_materials_cost?: number;
    };
    co_create_proposal: {
        lead: string;
        notes?: string;
        scope: string;
        amount: number;
        client: string;
        version?: string;
        expires_at?: string;
    };
    co_submit_bid: {
        lead: string;
        amount: number;
        client: string;
        bid_type: "open" | "invited" | "negotiated" | "sole_source";
        proposal: string;
        bid_number?: string;
        bond_required?: boolean;
        submission_deadline?: string;
    };
    co_record_payment: {
        amount: number;
        client: string;
        invoice: string;
        payment_date: string;
        payment_method: "check" | "ach" | "wire" | "credit_card" | "cash" | "other";
        reference_number?: string;
    };
    co_create_job: {
        city?: string;
        state?: string;
        client: string;
        address?: string;
        contract: string;
        job_type: "commercial" | "residential" | "municipal" | "subcontract" | "general";
        job_number: string;
        start_date?: string;
        project_manager?: string;
    };
    co_convert_bid_to_contract: {
        bid: string;
        client: string;
        contact?: string;
        end_date?: string;
        start_date?: string;
        contract_type: "lump_sum" | "time_and_materials" | "unit_price" | "cost_plus" | "gmp";
        contract_number?: string;
        retainage_percent?: number;
    };
    co_mark_contract_signed: {
        contract: string;
        contract_doc_url?: string;
        docusign_envelope_id?: string;
    };
    co_create_invoice: {
        job: string;
        amount: number;
        client: string;
        contract?: string;
        due_date: string;
        invoice_type: "progress" | "final" | "retainage" | "change_order" | "deposit";
        invoice_number: string;
    };
}
