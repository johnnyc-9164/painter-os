/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    entities: {
      get: FunctionReference<
        "query",
        "internal",
        {
          blueprint:
            | "co_automation_rule"
            | "co_bid"
            | "co_campaign"
            | "co_change_order"
            | "co_client"
            | "co_contact"
            | "co_contract"
            | "co_daily_report"
            | "co_document"
            | "co_invoice"
            | "co_job"
            | "co_lead"
            | "co_outreach"
            | "co_payment"
            | "co_pricing_rule"
            | "co_proposal"
            | "co_scope"
            | "co_site_visit"
            | "co_subcontractor"
            | "co_trade_spec";
          identifier: string;
          tenantId: string;
        },
        {
          blueprint:
            | "co_automation_rule"
            | "co_bid"
            | "co_campaign"
            | "co_change_order"
            | "co_client"
            | "co_contact"
            | "co_contract"
            | "co_daily_report"
            | "co_document"
            | "co_invoice"
            | "co_job"
            | "co_lead"
            | "co_outreach"
            | "co_payment"
            | "co_pricing_rule"
            | "co_proposal"
            | "co_scope"
            | "co_site_visit"
            | "co_subcontractor"
            | "co_trade_spec";
          id: string;
          identifier: string;
          importedAt: number;
          snapshotJson: string;
          title: string | null;
        } | null,
        Name
      >;
      history: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          tenantId: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            actorId: string;
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            id: string;
            identifier: string;
            occurredAt: number;
            requestKey: string;
            snapshotJson: string;
            source: string;
            type: "port.entity.imported";
          }>;
        },
        Name
      >;
      importBatch: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          recordsJson: string;
          requestKey: string;
          source: string;
          tenantId: string;
        },
        {
          created: number;
          duplicates: number;
          receiptId: string;
          replayed: boolean;
          unchanged: number;
        },
        Name
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          blueprint:
            | "co_automation_rule"
            | "co_bid"
            | "co_campaign"
            | "co_change_order"
            | "co_client"
            | "co_contact"
            | "co_contract"
            | "co_daily_report"
            | "co_document"
            | "co_invoice"
            | "co_job"
            | "co_lead"
            | "co_outreach"
            | "co_payment"
            | "co_pricing_rule"
            | "co_proposal"
            | "co_scope"
            | "co_site_visit"
            | "co_subcontractor"
            | "co_trade_spec";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          tenantId: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            id: string;
            identifier: string;
            importedAt: number;
            snapshotJson: string;
            title: string | null;
          }>;
        },
        Name
      >;
      relations: FunctionReference<
        "query",
        "internal",
        {
          blueprint:
            | "co_automation_rule"
            | "co_bid"
            | "co_campaign"
            | "co_change_order"
            | "co_client"
            | "co_contact"
            | "co_contract"
            | "co_daily_report"
            | "co_document"
            | "co_invoice"
            | "co_job"
            | "co_lead"
            | "co_outreach"
            | "co_payment"
            | "co_pricing_rule"
            | "co_proposal"
            | "co_scope"
            | "co_site_visit"
            | "co_subcontractor"
            | "co_trade_spec";
          identifier: string;
          tenantId: string;
        },
        Array<{
          position: number;
          relation: string;
          status: "missing" | "ambiguous" | "resolved";
          target: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            title: string | null;
          } | null;
          targetBlueprint: string | null;
          targetIdentifier: string;
        }>,
        Name
      >;
    };
    meta: {
      info: FunctionReference<
        "query",
        "internal",
        {},
        {
          authBoundary: "host_app";
          capabilities: Array<string>;
          hostCallbacks: "not_configured";
          httpRoutes: "not_mounted_by_component";
          idBoundary: "opaque_strings_outside_component";
          mode: "development" | "test" | "production" | null;
          name: "contractorOs";
          pagination: "convex_helpers_paginator";
          schemaVersion: string;
          version: string;
        },
        Name
      >;
    };
    operations: {
      history: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          tenantId: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            actorId: string;
            afterJson: string;
            beforeJson: string | null;
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            command: string | null;
            evidenceJson: string | null;
            id: string;
            identifier: string;
            occurredAt: number;
            policyVersion: string | null;
            requestKey: string;
            type: "record.created" | "record.updated";
          }>;
        },
        Name
      >;
      invoiceBalance: FunctionReference<
        "query",
        "internal",
        { identifier: string; tenantId: string },
        null | {
          amount: number;
          amountPaid: number;
          balanceDue: number;
          currency: "USD";
          identifier: string;
          revision: number;
          status: string;
        },
        Name
      >;
      jobFinancials: FunctionReference<
        "query",
        "internal",
        { identifier: string; tenantId: string },
        null | {
          billedReceivable: number;
          billedToDate: number;
          collectedToDate: number;
          contractAmount: number;
          currency: "USD";
          identifier: string;
          outstandingBalance: number;
          remainingContractBalance: number;
          revision: number;
          unbilledContractAmount: number;
        },
        Name
      >;
      listJobs: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          tenantId: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            id: string;
            identifier: string;
            revision: number;
            state: string;
            title: string | null;
            updatedAt: number;
          }>;
        },
        Name
      >;
      listLeads: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          tenantId: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            id: string;
            identifier: string;
            revision: number;
            state: string;
            title: string | null;
            updatedAt: number;
          }>;
        },
        Name
      >;
    };
    projections: {
      get: FunctionReference<
        "query",
        "internal",
        {
          asOf?: number;
          blueprint:
            | "co_automation_rule"
            | "co_bid"
            | "co_campaign"
            | "co_change_order"
            | "co_client"
            | "co_contact"
            | "co_contract"
            | "co_daily_report"
            | "co_document"
            | "co_invoice"
            | "co_job"
            | "co_lead"
            | "co_outreach"
            | "co_payment"
            | "co_pricing_rule"
            | "co_proposal"
            | "co_scope"
            | "co_site_visit"
            | "co_subcontractor"
            | "co_trade_spec";
          identifier: string;
          tenantId: string;
        },
        null | {
          aggregates: Record<
            string,
            {
              issue: string | null;
              path: string;
              semantics: "component_explicit_paths_v1";
              status: "computed" | "incomplete";
              target:
                | "co_automation_rule"
                | "co_bid"
                | "co_campaign"
                | "co_change_order"
                | "co_client"
                | "co_contact"
                | "co_contract"
                | "co_daily_report"
                | "co_document"
                | "co_invoice"
                | "co_job"
                | "co_lead"
                | "co_outreach"
                | "co_payment"
                | "co_pricing_rule"
                | "co_proposal"
                | "co_scope"
                | "co_site_visit"
                | "co_subcontractor"
                | "co_trade_spec";
              value: number | null;
            }
          >;
          blueprint:
            | "co_automation_rule"
            | "co_bid"
            | "co_campaign"
            | "co_change_order"
            | "co_client"
            | "co_contact"
            | "co_contract"
            | "co_daily_report"
            | "co_document"
            | "co_invoice"
            | "co_job"
            | "co_lead"
            | "co_outreach"
            | "co_payment"
            | "co_pricing_rule"
            | "co_proposal"
            | "co_scope"
            | "co_site_visit"
            | "co_subcontractor"
            | "co_trade_spec";
          calculations: Record<
            string,
            {
              issue: string | null;
              status: "computed" | "invalid_input" | "definition_missing";
              value: string | number | boolean | null;
            }
          >;
          evaluatedAt: number;
          identifier: string;
          mirrors: Record<
            string,
            {
              path: string;
              status: "computed" | "unavailable";
              value: string | number | boolean | null;
            }
          >;
          revision: number;
          scorecards: Array<{
            authorizesAction: false;
            identifier: string;
            levels: Array<{
              ruleCount: number;
              status: "passed" | "failed" | "unknown" | "untested";
              title: string;
            }>;
            percentPassed: number | null;
            rules: Array<{
              identifier: string;
              issue: string | null;
              level: string;
              result: "Passed" | "Not passed" | "Unknown";
              title: string;
            }>;
            rulesPassed: number;
            rulesTested: number;
            source: "prior_export_snapshot" | "declaration_only";
            status: "evaluated" | "definition_missing" | "unsupported_query";
          }>;
          title: string | null;
          warnings: Array<string>;
        },
        Name
      >;
    };
    records: {
      co_automation_rule: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              body?: string;
              channel?:
                | "email"
                | "sms"
                | "phone_task"
                | "notification"
                | "webhook"
                | "other";
              conditions?: string;
              delay_days?: number;
              notes?: string;
              status?: "draft" | "active" | "paused" | "archived";
              subject?: string;
              trigger?:
                | "new_lead"
                | "follow_up_due"
                | "proposal_sent"
                | "bid_submitted"
                | "invoice_overdue"
                | "job_won"
                | "outreach_no_response"
                | "campaign_enrolled"
                | "contract_signed"
                | "payment_received"
                | "other";
            };
            relations?: { campaign?: string | null };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              body?: string;
              channel?:
                | "email"
                | "sms"
                | "phone_task"
                | "notification"
                | "webhook"
                | "other";
              conditions?: string;
              delay_days?: number;
              notes?: string;
              status?: "draft" | "active" | "paused" | "archived";
              subject?: string;
              trigger?:
                | "new_lead"
                | "follow_up_due"
                | "proposal_sent"
                | "bid_submitted"
                | "invoice_overdue"
                | "job_won"
                | "outreach_no_response"
                | "campaign_enrolled"
                | "contract_signed"
                | "payment_received"
                | "other";
            };
            relations: { campaign?: string | null };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                body?: string;
                channel?:
                  | "email"
                  | "sms"
                  | "phone_task"
                  | "notification"
                  | "webhook"
                  | "other";
                conditions?: string;
                delay_days?: number;
                notes?: string;
                status?: "draft" | "active" | "paused" | "archived";
                subject?: string;
                trigger?:
                  | "new_lead"
                  | "follow_up_due"
                  | "proposal_sent"
                  | "bid_submitted"
                  | "invoice_overdue"
                  | "job_won"
                  | "outreach_no_response"
                  | "campaign_enrolled"
                  | "contract_signed"
                  | "payment_received"
                  | "other";
              };
              relations: { campaign?: string | null };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              body?: string;
              channel?:
                | "email"
                | "sms"
                | "phone_task"
                | "notification"
                | "webhook"
                | "other";
              conditions?: string;
              delay_days?: number;
              notes?: string;
              status?: "draft" | "active" | "paused" | "archived";
              subject?: string;
              trigger?:
                | "new_lead"
                | "follow_up_due"
                | "proposal_sent"
                | "bid_submitted"
                | "invoice_overdue"
                | "job_won"
                | "outreach_no_response"
                | "campaign_enrolled"
                | "contract_signed"
                | "payment_received"
                | "other";
            };
            relations?: { campaign?: string | null };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_bid: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              amount?: number;
              bid_number?: string;
              bid_type?: "open" | "invited" | "negotiated" | "sole_source";
              bond_amount?: number;
              bond_required?: boolean;
              capability_statement_attached?: boolean;
              insurance_verified?: boolean;
              notes?: string;
              prevailing_wage?: boolean;
              status?:
                | "preparing"
                | "submitted"
                | "under_review"
                | "awarded"
                | "not_awarded"
                | "withdrawn";
              submission_deadline?: string;
              submitted_at?: string;
            };
            relations?: {
              client?: string | null;
              lead?: string | null;
              proposal?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              amount?: number;
              bid_number?: string;
              bid_type?: "open" | "invited" | "negotiated" | "sole_source";
              bond_amount?: number;
              bond_required?: boolean;
              capability_statement_attached?: boolean;
              insurance_verified?: boolean;
              notes?: string;
              prevailing_wage?: boolean;
              status?:
                | "preparing"
                | "submitted"
                | "under_review"
                | "awarded"
                | "not_awarded"
                | "withdrawn";
              submission_deadline?: string;
              submitted_at?: string;
            };
            relations: {
              client?: string | null;
              lead?: string | null;
              proposal?: string | null;
            };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                amount?: number;
                bid_number?: string;
                bid_type?: "open" | "invited" | "negotiated" | "sole_source";
                bond_amount?: number;
                bond_required?: boolean;
                capability_statement_attached?: boolean;
                insurance_verified?: boolean;
                notes?: string;
                prevailing_wage?: boolean;
                status?:
                  | "preparing"
                  | "submitted"
                  | "under_review"
                  | "awarded"
                  | "not_awarded"
                  | "withdrawn";
                submission_deadline?: string;
                submitted_at?: string;
              };
              relations: {
                client?: string | null;
                lead?: string | null;
                proposal?: string | null;
              };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              amount?: number;
              bid_number?: string;
              bid_type?: "open" | "invited" | "negotiated" | "sole_source";
              bond_amount?: number;
              bond_required?: boolean;
              capability_statement_attached?: boolean;
              insurance_verified?: boolean;
              notes?: string;
              prevailing_wage?: boolean;
              status?:
                | "preparing"
                | "submitted"
                | "under_review"
                | "awarded"
                | "not_awarded"
                | "withdrawn";
              submission_deadline?: string;
              submitted_at?: string;
            };
            relations?: {
              client?: string | null;
              lead?: string | null;
              proposal?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_campaign: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              automation_rules?: string;
              campaign_type?:
                | "cold_email"
                | "direct_mail"
                | "door_to_door"
                | "referral"
                | "digital_ads"
                | "bid_board"
                | "other";
              email_template?: string;
              end_date?: string;
              goal?: string;
              notes?: string;
              start_date?: string;
              status?: "draft" | "active" | "paused" | "completed" | "archived";
              target_market?:
                | "commercial"
                | "residential"
                | "municipal"
                | "subcontract"
                | "all";
            };
            relations?: {};
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              automation_rules?: string;
              campaign_type?:
                | "cold_email"
                | "direct_mail"
                | "door_to_door"
                | "referral"
                | "digital_ads"
                | "bid_board"
                | "other";
              email_template?: string;
              end_date?: string;
              goal?: string;
              notes?: string;
              start_date?: string;
              status?: "draft" | "active" | "paused" | "completed" | "archived";
              target_market?:
                | "commercial"
                | "residential"
                | "municipal"
                | "subcontract"
                | "all";
            };
            relations: {};
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                automation_rules?: string;
                campaign_type?:
                  | "cold_email"
                  | "direct_mail"
                  | "door_to_door"
                  | "referral"
                  | "digital_ads"
                  | "bid_board"
                  | "other";
                email_template?: string;
                end_date?: string;
                goal?: string;
                notes?: string;
                start_date?: string;
                status?:
                  "draft" | "active" | "paused" | "completed" | "archived";
                target_market?:
                  | "commercial"
                  | "residential"
                  | "municipal"
                  | "subcontract"
                  | "all";
              };
              relations: {};
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              automation_rules?: string;
              campaign_type?:
                | "cold_email"
                | "direct_mail"
                | "door_to_door"
                | "referral"
                | "digital_ads"
                | "bid_board"
                | "other";
              email_template?: string;
              end_date?: string;
              goal?: string;
              notes?: string;
              start_date?: string;
              status?: "draft" | "active" | "paused" | "completed" | "archived";
              target_market?:
                | "commercial"
                | "residential"
                | "municipal"
                | "subcontract"
                | "all";
            };
            relations?: {};
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_change_order: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              amount?: number;
              approved_at?: string;
              co_number?: string;
              days_impact?: number;
              description?: string;
              labor_change?: number;
              materials_change?: number;
              reason?: string;
              status?:
                "draft" | "submitted" | "approved" | "rejected" | "executed";
              submitted_at?: string;
            };
            relations?: { contract?: string | null; job?: string | null };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              amount?: number;
              approved_at?: string;
              co_number?: string;
              days_impact?: number;
              description?: string;
              labor_change?: number;
              materials_change?: number;
              reason?: string;
              status?:
                "draft" | "submitted" | "approved" | "rejected" | "executed";
              submitted_at?: string;
            };
            relations: { contract?: string | null; job?: string | null };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                amount?: number;
                approved_at?: string;
                co_number?: string;
                days_impact?: number;
                description?: string;
                labor_change?: number;
                materials_change?: number;
                reason?: string;
                status?:
                  "draft" | "submitted" | "approved" | "rejected" | "executed";
                submitted_at?: string;
              };
              relations: { contract?: string | null; job?: string | null };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              amount?: number;
              approved_at?: string;
              co_number?: string;
              days_impact?: number;
              description?: string;
              labor_change?: number;
              materials_change?: number;
              reason?: string;
              status?:
                "draft" | "submitted" | "approved" | "rejected" | "executed";
              submitted_at?: string;
            };
            relations?: { contract?: string | null; job?: string | null };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_client: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              address?: string;
              city?: string;
              client_type?:
                | "commercial"
                | "residential"
                | "municipal"
                | "general_contractor"
                | "subcontractor_vendor";
              email?: string;
              industry?: string;
              notes?: string;
              phone?: string;
              source?:
                | "referral"
                | "cold_outreach"
                | "bid_board"
                | "website"
                | "repeat_client"
                | "other";
              state?: string;
              status?:
                "prospect" | "active" | "on_hold" | "inactive" | "archived";
              tags?: Array<any>;
              website?: string;
              zip?: string;
            };
            relations?: {};
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              address?: string;
              city?: string;
              client_type?:
                | "commercial"
                | "residential"
                | "municipal"
                | "general_contractor"
                | "subcontractor_vendor";
              email?: string;
              industry?: string;
              notes?: string;
              phone?: string;
              source?:
                | "referral"
                | "cold_outreach"
                | "bid_board"
                | "website"
                | "repeat_client"
                | "other";
              state?: string;
              status?:
                "prospect" | "active" | "on_hold" | "inactive" | "archived";
              tags?: Array<any>;
              website?: string;
              zip?: string;
            };
            relations: {};
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                address?: string;
                city?: string;
                client_type?:
                  | "commercial"
                  | "residential"
                  | "municipal"
                  | "general_contractor"
                  | "subcontractor_vendor";
                email?: string;
                industry?: string;
                notes?: string;
                phone?: string;
                source?:
                  | "referral"
                  | "cold_outreach"
                  | "bid_board"
                  | "website"
                  | "repeat_client"
                  | "other";
                state?: string;
                status?:
                  "prospect" | "active" | "on_hold" | "inactive" | "archived";
                tags?: Array<any>;
                website?: string;
                zip?: string;
              };
              relations: {};
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              address?: string;
              city?: string;
              client_type?:
                | "commercial"
                | "residential"
                | "municipal"
                | "general_contractor"
                | "subcontractor_vendor";
              email?: string;
              industry?: string;
              notes?: string;
              phone?: string;
              source?:
                | "referral"
                | "cold_outreach"
                | "bid_board"
                | "website"
                | "repeat_client"
                | "other";
              state?: string;
              status?:
                "prospect" | "active" | "on_hold" | "inactive" | "archived";
              tags?: Array<any>;
              website?: string;
              zip?: string;
            };
            relations?: {};
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_contact: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              email?: string;
              first_name?: string;
              job_title?: string;
              last_name?: string;
              notes?: string;
              phone?: string;
              role?:
                | "decision_maker"
                | "influencer"
                | "gatekeeper"
                | "procurement"
                | "end_user"
                | "other";
            };
            relations?: { client?: string | null };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              email?: string;
              first_name?: string;
              job_title?: string;
              last_name?: string;
              notes?: string;
              phone?: string;
              role?:
                | "decision_maker"
                | "influencer"
                | "gatekeeper"
                | "procurement"
                | "end_user"
                | "other";
            };
            relations: { client?: string | null };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                email?: string;
                first_name?: string;
                job_title?: string;
                last_name?: string;
                notes?: string;
                phone?: string;
                role?:
                  | "decision_maker"
                  | "influencer"
                  | "gatekeeper"
                  | "procurement"
                  | "end_user"
                  | "other";
              };
              relations: { client?: string | null };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              email?: string;
              first_name?: string;
              job_title?: string;
              last_name?: string;
              notes?: string;
              phone?: string;
              role?:
                | "decision_maker"
                | "influencer"
                | "gatekeeper"
                | "procurement"
                | "end_user"
                | "other";
            };
            relations?: { client?: string | null };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_contract: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              amount?: number;
              contract_doc_url?: string;
              contract_number?: string;
              contract_type?:
                | "lump_sum"
                | "time_and_materials"
                | "unit_price"
                | "cost_plus"
                | "gmp";
              docusign_envelope_id?: string;
              end_date?: string;
              notes?: string;
              retainage_percent?: number;
              signed_at?: string;
              start_date?: string;
              status?:
                | "draft"
                | "sent_for_signature"
                | "partially_signed"
                | "fully_executed"
                | "voided"
                | "expired";
            };
            relations?: {
              bid?: string | null;
              client?: string | null;
              contact?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              amount?: number;
              contract_doc_url?: string;
              contract_number?: string;
              contract_type?:
                | "lump_sum"
                | "time_and_materials"
                | "unit_price"
                | "cost_plus"
                | "gmp";
              docusign_envelope_id?: string;
              end_date?: string;
              notes?: string;
              retainage_percent?: number;
              signed_at?: string;
              start_date?: string;
              status?:
                | "draft"
                | "sent_for_signature"
                | "partially_signed"
                | "fully_executed"
                | "voided"
                | "expired";
            };
            relations: {
              bid?: string | null;
              client?: string | null;
              contact?: string | null;
            };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                amount?: number;
                contract_doc_url?: string;
                contract_number?: string;
                contract_type?:
                  | "lump_sum"
                  | "time_and_materials"
                  | "unit_price"
                  | "cost_plus"
                  | "gmp";
                docusign_envelope_id?: string;
                end_date?: string;
                notes?: string;
                retainage_percent?: number;
                signed_at?: string;
                start_date?: string;
                status?:
                  | "draft"
                  | "sent_for_signature"
                  | "partially_signed"
                  | "fully_executed"
                  | "voided"
                  | "expired";
              };
              relations: {
                bid?: string | null;
                client?: string | null;
                contact?: string | null;
              };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              amount?: number;
              contract_doc_url?: string;
              contract_number?: string;
              contract_type?:
                | "lump_sum"
                | "time_and_materials"
                | "unit_price"
                | "cost_plus"
                | "gmp";
              docusign_envelope_id?: string;
              end_date?: string;
              notes?: string;
              retainage_percent?: number;
              signed_at?: string;
              start_date?: string;
              status?:
                | "draft"
                | "sent_for_signature"
                | "partially_signed"
                | "fully_executed"
                | "voided"
                | "expired";
            };
            relations?: {
              bid?: string | null;
              client?: string | null;
              contact?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_daily_report: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              crew_size?: number;
              delays?: string;
              equipment_used?: string;
              materials_received?: string;
              notes?: string;
              report_date?: string;
              safety_observations?: string;
              status?: "draft" | "submitted" | "approved";
              temperature?: number;
              weather?:
                "clear" | "cloudy" | "rain" | "snow" | "wind" | "hot" | "other";
              work_performed?: string;
            };
            relations?: { job?: string | null };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              crew_size?: number;
              delays?: string;
              equipment_used?: string;
              materials_received?: string;
              notes?: string;
              report_date?: string;
              safety_observations?: string;
              status?: "draft" | "submitted" | "approved";
              temperature?: number;
              weather?:
                "clear" | "cloudy" | "rain" | "snow" | "wind" | "hot" | "other";
              work_performed?: string;
            };
            relations: { job?: string | null };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                crew_size?: number;
                delays?: string;
                equipment_used?: string;
                materials_received?: string;
                notes?: string;
                report_date?: string;
                safety_observations?: string;
                status?: "draft" | "submitted" | "approved";
                temperature?: number;
                weather?:
                  | "clear"
                  | "cloudy"
                  | "rain"
                  | "snow"
                  | "wind"
                  | "hot"
                  | "other";
                work_performed?: string;
              };
              relations: { job?: string | null };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              crew_size?: number;
              delays?: string;
              equipment_used?: string;
              materials_received?: string;
              notes?: string;
              report_date?: string;
              safety_observations?: string;
              status?: "draft" | "submitted" | "approved";
              temperature?: number;
              weather?:
                "clear" | "cloudy" | "rain" | "snow" | "wind" | "hot" | "other";
              work_performed?: string;
            };
            relations?: { job?: string | null };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_document: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              content?: string;
              doc_type?:
                | "capability_statement"
                | "bid_package"
                | "website_copy"
                | "design_spec"
                | "agent_rules"
                | "governance"
                | "email_template"
                | "marketing_collateral"
                | "proof"
                | "proposal_template"
                | "contract_template"
                | "sow_template"
                | "safety_plan"
                | "other";
              file_url?: string;
              notes?: string;
              status?:
                "draft" | "in_review" | "approved" | "published" | "archived";
              tags?: Array<any>;
              version?: string;
            };
            relations?: {
              campaign?: string | null;
              contract?: string | null;
              job?: string | null;
              lead?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              content?: string;
              doc_type?:
                | "capability_statement"
                | "bid_package"
                | "website_copy"
                | "design_spec"
                | "agent_rules"
                | "governance"
                | "email_template"
                | "marketing_collateral"
                | "proof"
                | "proposal_template"
                | "contract_template"
                | "sow_template"
                | "safety_plan"
                | "other";
              file_url?: string;
              notes?: string;
              status?:
                "draft" | "in_review" | "approved" | "published" | "archived";
              tags?: Array<any>;
              version?: string;
            };
            relations: {
              campaign?: string | null;
              contract?: string | null;
              job?: string | null;
              lead?: string | null;
            };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                content?: string;
                doc_type?:
                  | "capability_statement"
                  | "bid_package"
                  | "website_copy"
                  | "design_spec"
                  | "agent_rules"
                  | "governance"
                  | "email_template"
                  | "marketing_collateral"
                  | "proof"
                  | "proposal_template"
                  | "contract_template"
                  | "sow_template"
                  | "safety_plan"
                  | "other";
                file_url?: string;
                notes?: string;
                status?:
                  "draft" | "in_review" | "approved" | "published" | "archived";
                tags?: Array<any>;
                version?: string;
              };
              relations: {
                campaign?: string | null;
                contract?: string | null;
                job?: string | null;
                lead?: string | null;
              };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              content?: string;
              doc_type?:
                | "capability_statement"
                | "bid_package"
                | "website_copy"
                | "design_spec"
                | "agent_rules"
                | "governance"
                | "email_template"
                | "marketing_collateral"
                | "proof"
                | "proposal_template"
                | "contract_template"
                | "sow_template"
                | "safety_plan"
                | "other";
              file_url?: string;
              notes?: string;
              status?:
                "draft" | "in_review" | "approved" | "published" | "archived";
              tags?: Array<any>;
              version?: string;
            };
            relations?: {
              campaign?: string | null;
              contract?: string | null;
              job?: string | null;
              lead?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_invoice: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              amount?: number;
              amount_paid?: number;
              due_date?: string;
              invoice_number?: string;
              invoice_type?:
                "progress" | "final" | "retainage" | "change_order" | "deposit";
              issued_date?: string;
              notes?: string;
              paid_date?: string;
              quickbooks_id?: string;
              status?:
                | "draft"
                | "sent"
                | "viewed"
                | "partial_payment"
                | "paid"
                | "overdue"
                | "voided";
            };
            relations?: {
              client?: string | null;
              contract?: string | null;
              job?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              amount?: number;
              amount_paid?: number;
              due_date?: string;
              invoice_number?: string;
              invoice_type?:
                "progress" | "final" | "retainage" | "change_order" | "deposit";
              issued_date?: string;
              notes?: string;
              paid_date?: string;
              quickbooks_id?: string;
              status?:
                | "draft"
                | "sent"
                | "viewed"
                | "partial_payment"
                | "paid"
                | "overdue"
                | "voided";
            };
            relations: {
              client?: string | null;
              contract?: string | null;
              job?: string | null;
            };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                amount?: number;
                amount_paid?: number;
                due_date?: string;
                invoice_number?: string;
                invoice_type?:
                  | "progress"
                  | "final"
                  | "retainage"
                  | "change_order"
                  | "deposit";
                issued_date?: string;
                notes?: string;
                paid_date?: string;
                quickbooks_id?: string;
                status?:
                  | "draft"
                  | "sent"
                  | "viewed"
                  | "partial_payment"
                  | "paid"
                  | "overdue"
                  | "voided";
              };
              relations: {
                client?: string | null;
                contract?: string | null;
                job?: string | null;
              };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              amount?: number;
              amount_paid?: number;
              due_date?: string;
              invoice_number?: string;
              invoice_type?:
                "progress" | "final" | "retainage" | "change_order" | "deposit";
              issued_date?: string;
              notes?: string;
              paid_date?: string;
              quickbooks_id?: string;
              status?:
                | "draft"
                | "sent"
                | "viewed"
                | "partial_payment"
                | "paid"
                | "overdue"
                | "voided";
            };
            relations?: {
              client?: string | null;
              contract?: string | null;
              job?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_job: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              actual_end_date?: string;
              address?: string;
              billed_to_date?: number;
              city?: string;
              collected_to_date?: number;
              contract_amount?: number;
              job_number?: string;
              job_type?:
                | "commercial"
                | "residential"
                | "municipal"
                | "subcontract"
                | "general";
              notes?: string;
              percent_complete?: number;
              project_manager?: string;
              projected_end_date?: string;
              safety_plan_url?: string;
              start_date?: string;
              state?: string;
              status?:
                | "pre_construction"
                | "mobilizing"
                | "active"
                | "on_hold"
                | "punch_list"
                | "complete"
                | "closed"
                | "cancelled";
              superintendent?: string;
            };
            relations?: {
              bid?: string | null;
              client?: string | null;
              contact?: string | null;
              contract?: string | null;
              subcontractors?: Array<string>;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              actual_end_date?: string;
              address?: string;
              billed_to_date?: number;
              city?: string;
              collected_to_date?: number;
              contract_amount?: number;
              job_number?: string;
              job_type?:
                | "commercial"
                | "residential"
                | "municipal"
                | "subcontract"
                | "general";
              notes?: string;
              percent_complete?: number;
              project_manager?: string;
              projected_end_date?: string;
              safety_plan_url?: string;
              start_date?: string;
              state?: string;
              status?:
                | "pre_construction"
                | "mobilizing"
                | "active"
                | "on_hold"
                | "punch_list"
                | "complete"
                | "closed"
                | "cancelled";
              superintendent?: string;
            };
            relations: {
              bid?: string | null;
              client?: string | null;
              contact?: string | null;
              contract?: string | null;
              subcontractors?: Array<string>;
            };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                actual_end_date?: string;
                address?: string;
                billed_to_date?: number;
                city?: string;
                collected_to_date?: number;
                contract_amount?: number;
                job_number?: string;
                job_type?:
                  | "commercial"
                  | "residential"
                  | "municipal"
                  | "subcontract"
                  | "general";
                notes?: string;
                percent_complete?: number;
                project_manager?: string;
                projected_end_date?: string;
                safety_plan_url?: string;
                start_date?: string;
                state?: string;
                status?:
                  | "pre_construction"
                  | "mobilizing"
                  | "active"
                  | "on_hold"
                  | "punch_list"
                  | "complete"
                  | "closed"
                  | "cancelled";
                superintendent?: string;
              };
              relations: {
                bid?: string | null;
                client?: string | null;
                contact?: string | null;
                contract?: string | null;
                subcontractors?: Array<string>;
              };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              actual_end_date?: string;
              address?: string;
              billed_to_date?: number;
              city?: string;
              collected_to_date?: number;
              contract_amount?: number;
              job_number?: string;
              job_type?:
                | "commercial"
                | "residential"
                | "municipal"
                | "subcontract"
                | "general";
              notes?: string;
              percent_complete?: number;
              project_manager?: string;
              projected_end_date?: string;
              safety_plan_url?: string;
              start_date?: string;
              state?: string;
              status?:
                | "pre_construction"
                | "mobilizing"
                | "active"
                | "on_hold"
                | "punch_list"
                | "complete"
                | "closed"
                | "cancelled";
              superintendent?: string;
            };
            relations?: {
              bid?: string | null;
              client?: string | null;
              contact?: string | null;
              contract?: string | null;
              subcontractors?: Array<string>;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_lead: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              contract_type?:
                | "commercial"
                | "residential"
                | "municipal"
                | "subcontract"
                | "general";
              description?: string;
              estimated_value?: number;
              expected_close_date?: string;
              followup_notes?: string;
              lost_reason?:
                | "price"
                | "competitor"
                | "no_response"
                | "budget"
                | "timing"
                | "scope_mismatch"
                | "other";
              next_followup_date?: string;
              notes?: string;
              priority?: "low" | "medium" | "high" | "urgent";
              source?:
                | "cold_outreach"
                | "referral"
                | "repeat_client"
                | "website"
                | "bid_board"
                | "walk_in"
                | "other";
              stage?:
                | "new"
                | "qualifying"
                | "site_visit_scheduled"
                | "scope_in_progress"
                | "proposal_sent"
                | "bid_submitted"
                | "awarded"
                | "won"
                | "lost"
                | "on_hold";
            };
            relations?: {
              campaign?: string | null;
              client?: string | null;
              contact?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              contract_type?:
                | "commercial"
                | "residential"
                | "municipal"
                | "subcontract"
                | "general";
              description?: string;
              estimated_value?: number;
              expected_close_date?: string;
              followup_notes?: string;
              lost_reason?:
                | "price"
                | "competitor"
                | "no_response"
                | "budget"
                | "timing"
                | "scope_mismatch"
                | "other";
              next_followup_date?: string;
              notes?: string;
              priority?: "low" | "medium" | "high" | "urgent";
              source?:
                | "cold_outreach"
                | "referral"
                | "repeat_client"
                | "website"
                | "bid_board"
                | "walk_in"
                | "other";
              stage?:
                | "new"
                | "qualifying"
                | "site_visit_scheduled"
                | "scope_in_progress"
                | "proposal_sent"
                | "bid_submitted"
                | "awarded"
                | "won"
                | "lost"
                | "on_hold";
            };
            relations: {
              campaign?: string | null;
              client?: string | null;
              contact?: string | null;
            };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                contract_type?:
                  | "commercial"
                  | "residential"
                  | "municipal"
                  | "subcontract"
                  | "general";
                description?: string;
                estimated_value?: number;
                expected_close_date?: string;
                followup_notes?: string;
                lost_reason?:
                  | "price"
                  | "competitor"
                  | "no_response"
                  | "budget"
                  | "timing"
                  | "scope_mismatch"
                  | "other";
                next_followup_date?: string;
                notes?: string;
                priority?: "low" | "medium" | "high" | "urgent";
                source?:
                  | "cold_outreach"
                  | "referral"
                  | "repeat_client"
                  | "website"
                  | "bid_board"
                  | "walk_in"
                  | "other";
                stage?:
                  | "new"
                  | "qualifying"
                  | "site_visit_scheduled"
                  | "scope_in_progress"
                  | "proposal_sent"
                  | "bid_submitted"
                  | "awarded"
                  | "won"
                  | "lost"
                  | "on_hold";
              };
              relations: {
                campaign?: string | null;
                client?: string | null;
                contact?: string | null;
              };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              contract_type?:
                | "commercial"
                | "residential"
                | "municipal"
                | "subcontract"
                | "general";
              description?: string;
              estimated_value?: number;
              expected_close_date?: string;
              followup_notes?: string;
              lost_reason?:
                | "price"
                | "competitor"
                | "no_response"
                | "budget"
                | "timing"
                | "scope_mismatch"
                | "other";
              next_followup_date?: string;
              notes?: string;
              priority?: "low" | "medium" | "high" | "urgent";
              source?:
                | "cold_outreach"
                | "referral"
                | "repeat_client"
                | "website"
                | "bid_board"
                | "walk_in"
                | "other";
              stage?:
                | "new"
                | "qualifying"
                | "site_visit_scheduled"
                | "scope_in_progress"
                | "proposal_sent"
                | "bid_submitted"
                | "awarded"
                | "won"
                | "lost"
                | "on_hold";
            };
            relations?: {
              campaign?: string | null;
              client?: string | null;
              contact?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_outreach: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              body?: string;
              channel?:
                | "email"
                | "phone"
                | "door_knock"
                | "linkedin"
                | "referral"
                | "direct_mail"
                | "other";
              follow_up_date?: string;
              response_notes?: string;
              sent_at?: string;
              sequence_step?: number;
              status?:
                | "pending"
                | "sent"
                | "delivered"
                | "opened"
                | "replied"
                | "no_response"
                | "opted_out"
                | "converted";
              subject?: string;
            };
            relations?: {
              campaign?: string | null;
              client?: string | null;
              contact?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              body?: string;
              channel?:
                | "email"
                | "phone"
                | "door_knock"
                | "linkedin"
                | "referral"
                | "direct_mail"
                | "other";
              follow_up_date?: string;
              response_notes?: string;
              sent_at?: string;
              sequence_step?: number;
              status?:
                | "pending"
                | "sent"
                | "delivered"
                | "opened"
                | "replied"
                | "no_response"
                | "opted_out"
                | "converted";
              subject?: string;
            };
            relations: {
              campaign?: string | null;
              client?: string | null;
              contact?: string | null;
            };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                body?: string;
                channel?:
                  | "email"
                  | "phone"
                  | "door_knock"
                  | "linkedin"
                  | "referral"
                  | "direct_mail"
                  | "other";
                follow_up_date?: string;
                response_notes?: string;
                sent_at?: string;
                sequence_step?: number;
                status?:
                  | "pending"
                  | "sent"
                  | "delivered"
                  | "opened"
                  | "replied"
                  | "no_response"
                  | "opted_out"
                  | "converted";
                subject?: string;
              };
              relations: {
                campaign?: string | null;
                client?: string | null;
                contact?: string | null;
              };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              body?: string;
              channel?:
                | "email"
                | "phone"
                | "door_knock"
                | "linkedin"
                | "referral"
                | "direct_mail"
                | "other";
              follow_up_date?: string;
              response_notes?: string;
              sent_at?: string;
              sequence_step?: number;
              status?:
                | "pending"
                | "sent"
                | "delivered"
                | "opened"
                | "replied"
                | "no_response"
                | "opted_out"
                | "converted";
              subject?: string;
            };
            relations?: {
              campaign?: string | null;
              client?: string | null;
              contact?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_payment: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              amount?: number;
              notes?: string;
              payment_date?: string;
              payment_method?:
                "check" | "ach" | "wire" | "credit_card" | "cash" | "other";
              quickbooks_id?: string;
              reference_number?: string;
            };
            relations?: { client?: string | null; invoice?: string | null };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              amount?: number;
              notes?: string;
              payment_date?: string;
              payment_method?:
                "check" | "ach" | "wire" | "credit_card" | "cash" | "other";
              quickbooks_id?: string;
              reference_number?: string;
            };
            relations: { client?: string | null; invoice?: string | null };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                amount?: number;
                notes?: string;
                payment_date?: string;
                payment_method?:
                  "check" | "ach" | "wire" | "credit_card" | "cash" | "other";
                quickbooks_id?: string;
                reference_number?: string;
              };
              relations: { client?: string | null; invoice?: string | null };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              amount?: number;
              notes?: string;
              payment_date?: string;
              payment_method?:
                "check" | "ach" | "wire" | "credit_card" | "cash" | "other";
              quickbooks_id?: string;
              reference_number?: string;
            };
            relations?: { client?: string | null; invoice?: string | null };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_pricing_rule: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              base_rate?: number;
              description?: string;
              is_active?: boolean;
              labor_rate_per_hour?: number;
              material_markup_percent?: number;
              min_job_size?: number;
              overhead_percent?: number;
              pricing_type?:
                | "per_sqft"
                | "per_linear_ft"
                | "per_unit"
                | "per_square"
                | "per_ton"
                | "lump_sum"
                | "hourly"
                | "per_door"
                | "per_zone";
              profit_margin_percent?: number;
              rule_name?: string;
              trade?:
                | "painting"
                | "plumbing"
                | "roofing"
                | "garage_door"
                | "electrical"
                | "hvac"
                | "concrete"
                | "landscaping"
                | "drywall_framing";
            };
            relations?: {};
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              base_rate?: number;
              description?: string;
              is_active?: boolean;
              labor_rate_per_hour?: number;
              material_markup_percent?: number;
              min_job_size?: number;
              overhead_percent?: number;
              pricing_type?:
                | "per_sqft"
                | "per_linear_ft"
                | "per_unit"
                | "per_square"
                | "per_ton"
                | "lump_sum"
                | "hourly"
                | "per_door"
                | "per_zone";
              profit_margin_percent?: number;
              rule_name?: string;
              trade?:
                | "painting"
                | "plumbing"
                | "roofing"
                | "garage_door"
                | "electrical"
                | "hvac"
                | "concrete"
                | "landscaping"
                | "drywall_framing";
            };
            relations: {};
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                base_rate?: number;
                description?: string;
                is_active?: boolean;
                labor_rate_per_hour?: number;
                material_markup_percent?: number;
                min_job_size?: number;
                overhead_percent?: number;
                pricing_type?:
                  | "per_sqft"
                  | "per_linear_ft"
                  | "per_unit"
                  | "per_square"
                  | "per_ton"
                  | "lump_sum"
                  | "hourly"
                  | "per_door"
                  | "per_zone";
                profit_margin_percent?: number;
                rule_name?: string;
                trade?:
                  | "painting"
                  | "plumbing"
                  | "roofing"
                  | "garage_door"
                  | "electrical"
                  | "hvac"
                  | "concrete"
                  | "landscaping"
                  | "drywall_framing";
              };
              relations: {};
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              base_rate?: number;
              description?: string;
              is_active?: boolean;
              labor_rate_per_hour?: number;
              material_markup_percent?: number;
              min_job_size?: number;
              overhead_percent?: number;
              pricing_type?:
                | "per_sqft"
                | "per_linear_ft"
                | "per_unit"
                | "per_square"
                | "per_ton"
                | "lump_sum"
                | "hourly"
                | "per_door"
                | "per_zone";
              profit_margin_percent?: number;
              rule_name?: string;
              trade?:
                | "painting"
                | "plumbing"
                | "roofing"
                | "garage_door"
                | "electrical"
                | "hvac"
                | "concrete"
                | "landscaping"
                | "drywall_framing";
            };
            relations?: {};
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_proposal: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              amount?: number;
              currency?: string;
              expires_at?: string;
              notes?: string;
              proposal_doc_url?: string;
              sent_at?: string;
              status?:
                | "draft"
                | "in_review"
                | "sent"
                | "viewed"
                | "accepted"
                | "rejected"
                | "expired"
                | "revised";
              terms?: string;
              version?: string;
            };
            relations?: {
              client?: string | null;
              contact?: string | null;
              lead?: string | null;
              scope?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              amount?: number;
              currency?: string;
              expires_at?: string;
              notes?: string;
              proposal_doc_url?: string;
              sent_at?: string;
              status?:
                | "draft"
                | "in_review"
                | "sent"
                | "viewed"
                | "accepted"
                | "rejected"
                | "expired"
                | "revised";
              terms?: string;
              version?: string;
            };
            relations: {
              client?: string | null;
              contact?: string | null;
              lead?: string | null;
              scope?: string | null;
            };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                amount?: number;
                currency?: string;
                expires_at?: string;
                notes?: string;
                proposal_doc_url?: string;
                sent_at?: string;
                status?:
                  | "draft"
                  | "in_review"
                  | "sent"
                  | "viewed"
                  | "accepted"
                  | "rejected"
                  | "expired"
                  | "revised";
                terms?: string;
                version?: string;
              };
              relations: {
                client?: string | null;
                contact?: string | null;
                lead?: string | null;
                scope?: string | null;
              };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              amount?: number;
              currency?: string;
              expires_at?: string;
              notes?: string;
              proposal_doc_url?: string;
              sent_at?: string;
              status?:
                | "draft"
                | "in_review"
                | "sent"
                | "viewed"
                | "accepted"
                | "rejected"
                | "expired"
                | "revised";
              terms?: string;
              version?: string;
            };
            relations?: {
              client?: string | null;
              contact?: string | null;
              lead?: string | null;
              scope?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_scope: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              assumptions?: string;
              description?: string;
              estimated_hours?: number;
              estimated_labor_cost?: number;
              estimated_materials_cost?: number;
              exclusions?: string;
              measurement_unit?:
                | "sq_ft"
                | "linear_ft"
                | "units"
                | "squares"
                | "tons"
                | "cubic_yards";
              measurement_value?: number;
              status?:
                "draft" | "in_review" | "approved" | "rejected" | "superseded";
              trade_type?:
                | "general"
                | "electrical"
                | "plumbing"
                | "hvac"
                | "structural"
                | "civil"
                | "concrete"
                | "roofing"
                | "landscaping"
                | "painting"
                | "garage_door"
                | "drywall_framing"
                | "other";
              version?: string;
            };
            relations?: {
              lead?: string | null;
              proposal?: string | null;
              trade_spec?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              assumptions?: string;
              description?: string;
              estimated_hours?: number;
              estimated_labor_cost?: number;
              estimated_materials_cost?: number;
              exclusions?: string;
              measurement_unit?:
                | "sq_ft"
                | "linear_ft"
                | "units"
                | "squares"
                | "tons"
                | "cubic_yards";
              measurement_value?: number;
              status?:
                "draft" | "in_review" | "approved" | "rejected" | "superseded";
              trade_type?:
                | "general"
                | "electrical"
                | "plumbing"
                | "hvac"
                | "structural"
                | "civil"
                | "concrete"
                | "roofing"
                | "landscaping"
                | "painting"
                | "garage_door"
                | "drywall_framing"
                | "other";
              version?: string;
            };
            relations: {
              lead?: string | null;
              proposal?: string | null;
              trade_spec?: string | null;
            };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                assumptions?: string;
                description?: string;
                estimated_hours?: number;
                estimated_labor_cost?: number;
                estimated_materials_cost?: number;
                exclusions?: string;
                measurement_unit?:
                  | "sq_ft"
                  | "linear_ft"
                  | "units"
                  | "squares"
                  | "tons"
                  | "cubic_yards";
                measurement_value?: number;
                status?:
                  | "draft"
                  | "in_review"
                  | "approved"
                  | "rejected"
                  | "superseded";
                trade_type?:
                  | "general"
                  | "electrical"
                  | "plumbing"
                  | "hvac"
                  | "structural"
                  | "civil"
                  | "concrete"
                  | "roofing"
                  | "landscaping"
                  | "painting"
                  | "garage_door"
                  | "drywall_framing"
                  | "other";
                version?: string;
              };
              relations: {
                lead?: string | null;
                proposal?: string | null;
                trade_spec?: string | null;
              };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              assumptions?: string;
              description?: string;
              estimated_hours?: number;
              estimated_labor_cost?: number;
              estimated_materials_cost?: number;
              exclusions?: string;
              measurement_unit?:
                | "sq_ft"
                | "linear_ft"
                | "units"
                | "squares"
                | "tons"
                | "cubic_yards";
              measurement_value?: number;
              status?:
                "draft" | "in_review" | "approved" | "rejected" | "superseded";
              trade_type?:
                | "general"
                | "electrical"
                | "plumbing"
                | "hvac"
                | "structural"
                | "civil"
                | "concrete"
                | "roofing"
                | "landscaping"
                | "painting"
                | "garage_door"
                | "drywall_framing"
                | "other";
              version?: string;
            };
            relations?: {
              lead?: string | null;
              proposal?: string | null;
              trade_spec?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_site_visit: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              address?: string;
              findings?: string;
              notes?: string;
              photos_url?: string;
              rough_estimate?: number;
              status?:
                | "scheduled"
                | "completed"
                | "cancelled"
                | "rescheduled"
                | "no_show";
              visit_date?: string;
            };
            relations?: {
              client?: string | null;
              contact?: string | null;
              lead?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              address?: string;
              findings?: string;
              notes?: string;
              photos_url?: string;
              rough_estimate?: number;
              status?:
                | "scheduled"
                | "completed"
                | "cancelled"
                | "rescheduled"
                | "no_show";
              visit_date?: string;
            };
            relations: {
              client?: string | null;
              contact?: string | null;
              lead?: string | null;
            };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                address?: string;
                findings?: string;
                notes?: string;
                photos_url?: string;
                rough_estimate?: number;
                status?:
                  | "scheduled"
                  | "completed"
                  | "cancelled"
                  | "rescheduled"
                  | "no_show";
                visit_date?: string;
              };
              relations: {
                client?: string | null;
                contact?: string | null;
                lead?: string | null;
              };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              address?: string;
              findings?: string;
              notes?: string;
              photos_url?: string;
              rough_estimate?: number;
              status?:
                | "scheduled"
                | "completed"
                | "cancelled"
                | "rescheduled"
                | "no_show";
              visit_date?: string;
            };
            relations?: {
              client?: string | null;
              contact?: string | null;
              lead?: string | null;
            };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_subcontractor: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              additional_license_type?: string;
              bond_amount?: number;
              certifications?: Array<any>;
              contact_name?: string;
              email?: string;
              insurance_expiry?: string;
              lead_safe_certified?: boolean;
              license_expiry?: string;
              license_number?: string;
              notes?: string;
              phone?: string;
              status?:
                | "prospect"
                | "prequalified"
                | "active"
                | "on_hold"
                | "blacklisted";
              trade?:
                | "electrical"
                | "plumbing"
                | "hvac"
                | "concrete"
                | "framing"
                | "roofing"
                | "landscaping"
                | "painting"
                | "drywall"
                | "flooring"
                | "fire_suppression"
                | "garage_door"
                | "other";
              w9_on_file?: boolean;
            };
            relations?: { client?: string | null; jobs?: Array<string> };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              additional_license_type?: string;
              bond_amount?: number;
              certifications?: Array<any>;
              contact_name?: string;
              email?: string;
              insurance_expiry?: string;
              lead_safe_certified?: boolean;
              license_expiry?: string;
              license_number?: string;
              notes?: string;
              phone?: string;
              status?:
                | "prospect"
                | "prequalified"
                | "active"
                | "on_hold"
                | "blacklisted";
              trade?:
                | "electrical"
                | "plumbing"
                | "hvac"
                | "concrete"
                | "framing"
                | "roofing"
                | "landscaping"
                | "painting"
                | "drywall"
                | "flooring"
                | "fire_suppression"
                | "garage_door"
                | "other";
              w9_on_file?: boolean;
            };
            relations: { client?: string | null; jobs?: Array<string> };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                additional_license_type?: string;
                bond_amount?: number;
                certifications?: Array<any>;
                contact_name?: string;
                email?: string;
                insurance_expiry?: string;
                lead_safe_certified?: boolean;
                license_expiry?: string;
                license_number?: string;
                notes?: string;
                phone?: string;
                status?:
                  | "prospect"
                  | "prequalified"
                  | "active"
                  | "on_hold"
                  | "blacklisted";
                trade?:
                  | "electrical"
                  | "plumbing"
                  | "hvac"
                  | "concrete"
                  | "framing"
                  | "roofing"
                  | "landscaping"
                  | "painting"
                  | "drywall"
                  | "flooring"
                  | "fire_suppression"
                  | "garage_door"
                  | "other";
                w9_on_file?: boolean;
              };
              relations: { client?: string | null; jobs?: Array<string> };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              additional_license_type?: string;
              bond_amount?: number;
              certifications?: Array<any>;
              contact_name?: string;
              email?: string;
              insurance_expiry?: string;
              lead_safe_certified?: boolean;
              license_expiry?: string;
              license_number?: string;
              notes?: string;
              phone?: string;
              status?:
                | "prospect"
                | "prequalified"
                | "active"
                | "on_hold"
                | "blacklisted";
              trade?:
                | "electrical"
                | "plumbing"
                | "hvac"
                | "concrete"
                | "framing"
                | "roofing"
                | "landscaping"
                | "painting"
                | "drywall"
                | "flooring"
                | "fire_suppression"
                | "garage_door"
                | "other";
              w9_on_file?: boolean;
            };
            relations?: { client?: string | null; jobs?: Array<string> };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
      co_trade_spec: {
        create: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            identifier: string;
            properties: {
              ceiling_height_ft?: number;
              circuit_count?: number;
              color_count?: number;
              concrete_finish?:
                "broom" | "smooth" | "exposed_aggregate" | "stamped" | "epoxy";
              concrete_type?:
                | "slab"
                | "driveway"
                | "sidewalk"
                | "foundation"
                | "decorative"
                | "stamped";
              decking_replacement?: boolean;
              door_count?: number;
              door_material?:
                "steel" | "wood" | "aluminum" | "fiberglass" | "vinyl";
              door_type?:
                | "single"
                | "double"
                | "roll_up"
                | "sectional"
                | "carriage_style";
              drain_cleaning?: boolean;
              drywall_type?:
                "standard" | "moisture_resistant" | "fire_rated" | "soundproof";
              ductwork_included?: boolean;
              electrical_service_type?:
                "residential" | "commercial" | "industrial";
              finishing_level?:
                "level_1" | "level_2" | "level_3" | "level_4" | "level_5";
              fixture_count?: number;
              framing_type?: "wood" | "metal" | "none";
              gutter_work?: boolean;
              hvac_system_type?:
                | "central_air"
                | "mini_split"
                | "heat_pump"
                | "furnace"
                | "boiler"
                | "ductwork"
                | "other";
              irrigation_zones?: number;
              landscape_service_type?:
                | "lawn_care"
                | "hardscaping"
                | "planting"
                | "irrigation"
                | "drainage"
                | "tree_work"
                | "cleanup";
              layers_to_remove?: number;
              lead_hazard_present?: boolean;
              masking_complexity?: "simple" | "moderate" | "complex";
              materials_spec?: string;
              measurement_unit?:
                | "sq_ft"
                | "linear_ft"
                | "units"
                | "squares"
                | "tons"
                | "cubic_yards"
                | "lf";
              measurement_value?: number;
              number_of_coats?: number;
              opener_included?: boolean;
              paint_finish?:
                | "flat"
                | "eggshell"
                | "satin"
                | "semi_gloss"
                | "gloss"
                | "cabinet_enamel";
              paint_grade?: "economy" | "standard" | "premium" | "luxury";
              paint_surface_type?:
                | "interior_walls"
                | "exterior_walls"
                | "trim"
                | "ceilings"
                | "cabinets"
                | "deck"
                | "fence"
                | "concrete_floor"
                | "garage_floor"
                | "other";
              panel_amps?: number;
              panel_upgrade?: boolean;
              permit_number?: string;
              permit_required?: boolean;
              pipe_diameter?: string;
              pipe_material?:
                | "copper"
                | "pvc"
                | "cpvc"
                | "pex"
                | "cast_iron"
                | "abs"
                | "galvanized"
                | "other";
              prep_work?:
                "minimal" | "moderate" | "extensive" | "repair_needed";
              pressure_wash_required?: boolean;
              primer_required?: boolean;
              reinforcement?: "none" | "rebar" | "wire_mesh" | "fiber";
              roof_pitch?: "flat" | "low" | "medium" | "steep";
              roof_type?:
                | "asphalt_shingle"
                | "metal"
                | "tile"
                | "flat_tpo"
                | "flat_epdm"
                | "slate"
                | "cedar_shake"
                | "other";
              skylight_count?: number;
              sod_or_seed?: "sod" | "seed" | "hydroseed" | "na";
              special_requirements?: string;
              spring_type?: "torsion" | "extension";
              surface_condition?:
                "new" | "good" | "fair" | "poor" | "needs_repair";
              thickness_inches?: number;
              tonnage?: number;
              trade?:
                | "painting"
                | "plumbing"
                | "roofing"
                | "garage_door"
                | "electrical"
                | "hvac"
                | "concrete"
                | "landscaping"
                | "drywall_framing";
              water_heater_involved?: boolean;
            };
            relations?: { pricing_rule?: string | null; scope?: string | null };
            requestKey: string;
            tenantId: string;
            title?: string | null;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
        get: FunctionReference<
          "query",
          "internal",
          { identifier: string; tenantId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            identifier: string;
            lastEventId: string;
            properties: {
              ceiling_height_ft?: number;
              circuit_count?: number;
              color_count?: number;
              concrete_finish?:
                "broom" | "smooth" | "exposed_aggregate" | "stamped" | "epoxy";
              concrete_type?:
                | "slab"
                | "driveway"
                | "sidewalk"
                | "foundation"
                | "decorative"
                | "stamped";
              decking_replacement?: boolean;
              door_count?: number;
              door_material?:
                "steel" | "wood" | "aluminum" | "fiberglass" | "vinyl";
              door_type?:
                | "single"
                | "double"
                | "roll_up"
                | "sectional"
                | "carriage_style";
              drain_cleaning?: boolean;
              drywall_type?:
                "standard" | "moisture_resistant" | "fire_rated" | "soundproof";
              ductwork_included?: boolean;
              electrical_service_type?:
                "residential" | "commercial" | "industrial";
              finishing_level?:
                "level_1" | "level_2" | "level_3" | "level_4" | "level_5";
              fixture_count?: number;
              framing_type?: "wood" | "metal" | "none";
              gutter_work?: boolean;
              hvac_system_type?:
                | "central_air"
                | "mini_split"
                | "heat_pump"
                | "furnace"
                | "boiler"
                | "ductwork"
                | "other";
              irrigation_zones?: number;
              landscape_service_type?:
                | "lawn_care"
                | "hardscaping"
                | "planting"
                | "irrigation"
                | "drainage"
                | "tree_work"
                | "cleanup";
              layers_to_remove?: number;
              lead_hazard_present?: boolean;
              masking_complexity?: "simple" | "moderate" | "complex";
              materials_spec?: string;
              measurement_unit?:
                | "sq_ft"
                | "linear_ft"
                | "units"
                | "squares"
                | "tons"
                | "cubic_yards"
                | "lf";
              measurement_value?: number;
              number_of_coats?: number;
              opener_included?: boolean;
              paint_finish?:
                | "flat"
                | "eggshell"
                | "satin"
                | "semi_gloss"
                | "gloss"
                | "cabinet_enamel";
              paint_grade?: "economy" | "standard" | "premium" | "luxury";
              paint_surface_type?:
                | "interior_walls"
                | "exterior_walls"
                | "trim"
                | "ceilings"
                | "cabinets"
                | "deck"
                | "fence"
                | "concrete_floor"
                | "garage_floor"
                | "other";
              panel_amps?: number;
              panel_upgrade?: boolean;
              permit_number?: string;
              permit_required?: boolean;
              pipe_diameter?: string;
              pipe_material?:
                | "copper"
                | "pvc"
                | "cpvc"
                | "pex"
                | "cast_iron"
                | "abs"
                | "galvanized"
                | "other";
              prep_work?:
                "minimal" | "moderate" | "extensive" | "repair_needed";
              pressure_wash_required?: boolean;
              primer_required?: boolean;
              reinforcement?: "none" | "rebar" | "wire_mesh" | "fiber";
              roof_pitch?: "flat" | "low" | "medium" | "steep";
              roof_type?:
                | "asphalt_shingle"
                | "metal"
                | "tile"
                | "flat_tpo"
                | "flat_epdm"
                | "slate"
                | "cedar_shake"
                | "other";
              skylight_count?: number;
              sod_or_seed?: "sod" | "seed" | "hydroseed" | "na";
              special_requirements?: string;
              spring_type?: "torsion" | "extension";
              surface_condition?:
                "new" | "good" | "fair" | "poor" | "needs_repair";
              thickness_inches?: number;
              tonnage?: number;
              trade?:
                | "painting"
                | "plumbing"
                | "roofing"
                | "garage_door"
                | "electrical"
                | "hvac"
                | "concrete"
                | "landscaping"
                | "drywall_framing";
              water_heater_involved?: boolean;
            };
            relations: { pricing_rule?: string | null; scope?: string | null };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          } | null,
          Name
        >;
        list: FunctionReference<
          "query",
          "internal",
          {
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            tenantId: string;
          },
          {
            continueCursor: string;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              identifier: string;
              lastEventId: string;
              properties: {
                ceiling_height_ft?: number;
                circuit_count?: number;
                color_count?: number;
                concrete_finish?:
                  | "broom"
                  | "smooth"
                  | "exposed_aggregate"
                  | "stamped"
                  | "epoxy";
                concrete_type?:
                  | "slab"
                  | "driveway"
                  | "sidewalk"
                  | "foundation"
                  | "decorative"
                  | "stamped";
                decking_replacement?: boolean;
                door_count?: number;
                door_material?:
                  "steel" | "wood" | "aluminum" | "fiberglass" | "vinyl";
                door_type?:
                  | "single"
                  | "double"
                  | "roll_up"
                  | "sectional"
                  | "carriage_style";
                drain_cleaning?: boolean;
                drywall_type?:
                  | "standard"
                  | "moisture_resistant"
                  | "fire_rated"
                  | "soundproof";
                ductwork_included?: boolean;
                electrical_service_type?:
                  "residential" | "commercial" | "industrial";
                finishing_level?:
                  "level_1" | "level_2" | "level_3" | "level_4" | "level_5";
                fixture_count?: number;
                framing_type?: "wood" | "metal" | "none";
                gutter_work?: boolean;
                hvac_system_type?:
                  | "central_air"
                  | "mini_split"
                  | "heat_pump"
                  | "furnace"
                  | "boiler"
                  | "ductwork"
                  | "other";
                irrigation_zones?: number;
                landscape_service_type?:
                  | "lawn_care"
                  | "hardscaping"
                  | "planting"
                  | "irrigation"
                  | "drainage"
                  | "tree_work"
                  | "cleanup";
                layers_to_remove?: number;
                lead_hazard_present?: boolean;
                masking_complexity?: "simple" | "moderate" | "complex";
                materials_spec?: string;
                measurement_unit?:
                  | "sq_ft"
                  | "linear_ft"
                  | "units"
                  | "squares"
                  | "tons"
                  | "cubic_yards"
                  | "lf";
                measurement_value?: number;
                number_of_coats?: number;
                opener_included?: boolean;
                paint_finish?:
                  | "flat"
                  | "eggshell"
                  | "satin"
                  | "semi_gloss"
                  | "gloss"
                  | "cabinet_enamel";
                paint_grade?: "economy" | "standard" | "premium" | "luxury";
                paint_surface_type?:
                  | "interior_walls"
                  | "exterior_walls"
                  | "trim"
                  | "ceilings"
                  | "cabinets"
                  | "deck"
                  | "fence"
                  | "concrete_floor"
                  | "garage_floor"
                  | "other";
                panel_amps?: number;
                panel_upgrade?: boolean;
                permit_number?: string;
                permit_required?: boolean;
                pipe_diameter?: string;
                pipe_material?:
                  | "copper"
                  | "pvc"
                  | "cpvc"
                  | "pex"
                  | "cast_iron"
                  | "abs"
                  | "galvanized"
                  | "other";
                prep_work?:
                  "minimal" | "moderate" | "extensive" | "repair_needed";
                pressure_wash_required?: boolean;
                primer_required?: boolean;
                reinforcement?: "none" | "rebar" | "wire_mesh" | "fiber";
                roof_pitch?: "flat" | "low" | "medium" | "steep";
                roof_type?:
                  | "asphalt_shingle"
                  | "metal"
                  | "tile"
                  | "flat_tpo"
                  | "flat_epdm"
                  | "slate"
                  | "cedar_shake"
                  | "other";
                skylight_count?: number;
                sod_or_seed?: "sod" | "seed" | "hydroseed" | "na";
                special_requirements?: string;
                spring_type?: "torsion" | "extension";
                surface_condition?:
                  "new" | "good" | "fair" | "poor" | "needs_repair";
                thickness_inches?: number;
                tonnage?: number;
                trade?:
                  | "painting"
                  | "plumbing"
                  | "roofing"
                  | "garage_door"
                  | "electrical"
                  | "hvac"
                  | "concrete"
                  | "landscaping"
                  | "drywall_framing";
                water_heater_involved?: boolean;
              };
              relations: {
                pricing_rule?: string | null;
                scope?: string | null;
              };
              revision: number;
              tenantId: string;
              title: string | null;
              updatedAt: number;
            }>;
          },
          Name
        >;
        update: FunctionReference<
          "mutation",
          "internal",
          {
            actorId: string;
            expectedRevision: number;
            identifier: string;
            properties?: {
              ceiling_height_ft?: number;
              circuit_count?: number;
              color_count?: number;
              concrete_finish?:
                "broom" | "smooth" | "exposed_aggregate" | "stamped" | "epoxy";
              concrete_type?:
                | "slab"
                | "driveway"
                | "sidewalk"
                | "foundation"
                | "decorative"
                | "stamped";
              decking_replacement?: boolean;
              door_count?: number;
              door_material?:
                "steel" | "wood" | "aluminum" | "fiberglass" | "vinyl";
              door_type?:
                | "single"
                | "double"
                | "roll_up"
                | "sectional"
                | "carriage_style";
              drain_cleaning?: boolean;
              drywall_type?:
                "standard" | "moisture_resistant" | "fire_rated" | "soundproof";
              ductwork_included?: boolean;
              electrical_service_type?:
                "residential" | "commercial" | "industrial";
              finishing_level?:
                "level_1" | "level_2" | "level_3" | "level_4" | "level_5";
              fixture_count?: number;
              framing_type?: "wood" | "metal" | "none";
              gutter_work?: boolean;
              hvac_system_type?:
                | "central_air"
                | "mini_split"
                | "heat_pump"
                | "furnace"
                | "boiler"
                | "ductwork"
                | "other";
              irrigation_zones?: number;
              landscape_service_type?:
                | "lawn_care"
                | "hardscaping"
                | "planting"
                | "irrigation"
                | "drainage"
                | "tree_work"
                | "cleanup";
              layers_to_remove?: number;
              lead_hazard_present?: boolean;
              masking_complexity?: "simple" | "moderate" | "complex";
              materials_spec?: string;
              measurement_unit?:
                | "sq_ft"
                | "linear_ft"
                | "units"
                | "squares"
                | "tons"
                | "cubic_yards"
                | "lf";
              measurement_value?: number;
              number_of_coats?: number;
              opener_included?: boolean;
              paint_finish?:
                | "flat"
                | "eggshell"
                | "satin"
                | "semi_gloss"
                | "gloss"
                | "cabinet_enamel";
              paint_grade?: "economy" | "standard" | "premium" | "luxury";
              paint_surface_type?:
                | "interior_walls"
                | "exterior_walls"
                | "trim"
                | "ceilings"
                | "cabinets"
                | "deck"
                | "fence"
                | "concrete_floor"
                | "garage_floor"
                | "other";
              panel_amps?: number;
              panel_upgrade?: boolean;
              permit_number?: string;
              permit_required?: boolean;
              pipe_diameter?: string;
              pipe_material?:
                | "copper"
                | "pvc"
                | "cpvc"
                | "pex"
                | "cast_iron"
                | "abs"
                | "galvanized"
                | "other";
              prep_work?:
                "minimal" | "moderate" | "extensive" | "repair_needed";
              pressure_wash_required?: boolean;
              primer_required?: boolean;
              reinforcement?: "none" | "rebar" | "wire_mesh" | "fiber";
              roof_pitch?: "flat" | "low" | "medium" | "steep";
              roof_type?:
                | "asphalt_shingle"
                | "metal"
                | "tile"
                | "flat_tpo"
                | "flat_epdm"
                | "slate"
                | "cedar_shake"
                | "other";
              skylight_count?: number;
              sod_or_seed?: "sod" | "seed" | "hydroseed" | "na";
              special_requirements?: string;
              spring_type?: "torsion" | "extension";
              surface_condition?:
                "new" | "good" | "fair" | "poor" | "needs_repair";
              thickness_inches?: number;
              tonnage?: number;
              trade?:
                | "painting"
                | "plumbing"
                | "roofing"
                | "garage_door"
                | "electrical"
                | "hvac"
                | "concrete"
                | "landscaping"
                | "drywall_framing";
              water_heater_involved?: boolean;
            };
            relations?: { pricing_rule?: string | null; scope?: string | null };
            requestKey: string;
            tenantId: string;
            title?: string | null;
            unsetProperties?: Array<string>;
            unsetRelations?: Array<string>;
          },
          { eventId: string; id: string; replayed: boolean; revision: number },
          Name
        >;
      };
    };
    workflows: {
      assign_subcontractor: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          evidence?: {
            kind: string;
            note?: string;
            occurredAt: string;
            reference: string;
          };
          expected?: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            revision: number;
          }>;
          input: { job: string; subcontractor: string };
          mayAttest: boolean;
          requestKey: string;
          tenantId: string;
        },
        {
          effects: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          }>;
          policyVersion: string;
          primary: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          };
          replayed: boolean;
          requestKey: string;
        },
        Name
      >;
      co_advance_lead: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          evidence?: {
            kind: string;
            note?: string;
            occurredAt: string;
            reference: string;
          };
          expected?: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            revision: number;
          }>;
          input: {
            followup_notes?: string;
            lead: string;
            new_stage:
              | "qualifying"
              | "site_visit_scheduled"
              | "scope_in_progress"
              | "proposal_sent"
              | "bid_submitted"
              | "awarded"
              | "won"
              | "lost"
              | "on_hold";
            next_followup_date?: string;
          };
          mayAttest: boolean;
          requestKey: string;
          tenantId: string;
        },
        {
          effects: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          }>;
          policyVersion: string;
          primary: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          };
          replayed: boolean;
          requestKey: string;
        },
        Name
      >;
      co_convert_bid_to_contract: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          evidence?: {
            kind: string;
            note?: string;
            occurredAt: string;
            reference: string;
          };
          expected?: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            revision: number;
          }>;
          input: {
            bid: string;
            client: string;
            contact?: string;
            contract_number?: string;
            contract_type:
              | "lump_sum"
              | "time_and_materials"
              | "unit_price"
              | "cost_plus"
              | "gmp";
            end_date?: string;
            retainage_percent?: number;
            start_date?: string;
          };
          mayAttest: boolean;
          requestKey: string;
          tenantId: string;
        },
        {
          effects: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          }>;
          policyVersion: string;
          primary: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          };
          replayed: boolean;
          requestKey: string;
        },
        Name
      >;
      co_create_invoice: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          evidence?: {
            kind: string;
            note?: string;
            occurredAt: string;
            reference: string;
          };
          expected?: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            revision: number;
          }>;
          input: {
            amount: number;
            client: string;
            contract?: string;
            due_date: string;
            invoice_number: string;
            invoice_type:
              "progress" | "final" | "retainage" | "change_order" | "deposit";
            job: string;
          };
          mayAttest: boolean;
          requestKey: string;
          tenantId: string;
        },
        {
          effects: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          }>;
          policyVersion: string;
          primary: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          };
          replayed: boolean;
          requestKey: string;
        },
        Name
      >;
      co_create_job: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          evidence?: {
            kind: string;
            note?: string;
            occurredAt: string;
            reference: string;
          };
          expected?: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            revision: number;
          }>;
          input: {
            address?: string;
            city?: string;
            client: string;
            contract: string;
            job_number: string;
            job_type:
              | "commercial"
              | "residential"
              | "municipal"
              | "subcontract"
              | "general";
            project_manager?: string;
            start_date?: string;
            state?: string;
          };
          mayAttest: boolean;
          requestKey: string;
          tenantId: string;
        },
        {
          effects: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          }>;
          policyVersion: string;
          primary: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          };
          replayed: boolean;
          requestKey: string;
        },
        Name
      >;
      co_create_lead: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          evidence?: {
            kind: string;
            note?: string;
            occurredAt: string;
            reference: string;
          };
          expected?: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            revision: number;
          }>;
          input: {
            client: string;
            contact?: string;
            description?: string;
            estimated_value?: number;
            priority?: "low" | "medium" | "high" | "urgent";
            source?:
              | "cold_outreach"
              | "referral"
              | "repeat_client"
              | "website"
              | "bid_board"
              | "walk_in"
              | "other";
            stage?:
              | "new"
              | "qualifying"
              | "site_visit_scheduled"
              | "scope_in_progress"
              | "proposal_sent"
              | "bid_submitted"
              | "awarded"
              | "won"
              | "lost"
              | "on_hold";
            title: string;
          };
          mayAttest: boolean;
          requestKey: string;
          tenantId: string;
        },
        {
          effects: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          }>;
          policyVersion: string;
          primary: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          };
          replayed: boolean;
          requestKey: string;
        },
        Name
      >;
      co_create_proposal: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          evidence?: {
            kind: string;
            note?: string;
            occurredAt: string;
            reference: string;
          };
          expected?: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            revision: number;
          }>;
          input: {
            amount: number;
            client: string;
            expires_at?: string;
            lead: string;
            notes?: string;
            scope: string;
            version?: string;
          };
          mayAttest: boolean;
          requestKey: string;
          tenantId: string;
        },
        {
          effects: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          }>;
          policyVersion: string;
          primary: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          };
          replayed: boolean;
          requestKey: string;
        },
        Name
      >;
      co_create_scope: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          evidence?: {
            kind: string;
            note?: string;
            occurredAt: string;
            reference: string;
          };
          expected?: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            revision: number;
          }>;
          input: {
            description?: string;
            estimated_hours?: number;
            estimated_labor_cost?: number;
            estimated_materials_cost?: number;
            lead: string;
            trade_type?:
              | "general"
              | "electrical"
              | "plumbing"
              | "hvac"
              | "structural"
              | "civil"
              | "concrete"
              | "roofing"
              | "landscaping"
              | "painting"
              | "other";
            version?: string;
          };
          mayAttest: boolean;
          requestKey: string;
          tenantId: string;
        },
        {
          effects: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          }>;
          policyVersion: string;
          primary: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          };
          replayed: boolean;
          requestKey: string;
        },
        Name
      >;
      co_mark_contract_signed: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          evidence?: {
            kind: string;
            note?: string;
            occurredAt: string;
            reference: string;
          };
          expected?: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            revision: number;
          }>;
          input: {
            contract: string;
            contract_doc_url?: string;
            docusign_envelope_id?: string;
          };
          mayAttest: boolean;
          requestKey: string;
          tenantId: string;
        },
        {
          effects: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          }>;
          policyVersion: string;
          primary: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          };
          replayed: boolean;
          requestKey: string;
        },
        Name
      >;
      co_record_payment: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          evidence?: {
            kind: string;
            note?: string;
            occurredAt: string;
            reference: string;
          };
          expected?: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            revision: number;
          }>;
          input: {
            amount: number;
            client: string;
            invoice: string;
            payment_date: string;
            payment_method:
              "check" | "ach" | "wire" | "credit_card" | "cash" | "other";
            reference_number?: string;
          };
          mayAttest: boolean;
          requestKey: string;
          tenantId: string;
        },
        {
          effects: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          }>;
          policyVersion: string;
          primary: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          };
          replayed: boolean;
          requestKey: string;
        },
        Name
      >;
      co_schedule_site_visit: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          evidence?: {
            kind: string;
            note?: string;
            occurredAt: string;
            reference: string;
          };
          expected?: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            revision: number;
          }>;
          input: {
            address?: string;
            lead: string;
            notes?: string;
            visit_date: string;
          };
          mayAttest: boolean;
          requestKey: string;
          tenantId: string;
        },
        {
          effects: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          }>;
          policyVersion: string;
          primary: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          };
          replayed: boolean;
          requestKey: string;
        },
        Name
      >;
      co_submit_bid: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          evidence?: {
            kind: string;
            note?: string;
            occurredAt: string;
            reference: string;
          };
          expected?: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            revision: number;
          }>;
          input: {
            amount: number;
            bid_number?: string;
            bid_type: "open" | "invited" | "negotiated" | "sole_source";
            bond_required?: boolean;
            client: string;
            lead: string;
            proposal: string;
            submission_deadline?: string;
          };
          mayAttest: boolean;
          requestKey: string;
          tenantId: string;
        },
        {
          effects: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          }>;
          policyVersion: string;
          primary: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          };
          replayed: boolean;
          requestKey: string;
        },
        Name
      >;
      execute: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          command:
            | {
                input: {
                  client: string;
                  contact?: string;
                  description?: string;
                  estimated_value?: number;
                  priority?: "low" | "medium" | "high" | "urgent";
                  source?:
                    | "cold_outreach"
                    | "referral"
                    | "repeat_client"
                    | "website"
                    | "bid_board"
                    | "walk_in"
                    | "other";
                  stage?:
                    | "new"
                    | "qualifying"
                    | "site_visit_scheduled"
                    | "scope_in_progress"
                    | "proposal_sent"
                    | "bid_submitted"
                    | "awarded"
                    | "won"
                    | "lost"
                    | "on_hold";
                  title: string;
                };
                kind: "co_create_lead";
              }
            | {
                input: {
                  address?: string;
                  lead: string;
                  notes?: string;
                  visit_date: string;
                };
                kind: "co_schedule_site_visit";
              }
            | {
                input: {
                  followup_notes?: string;
                  lead: string;
                  new_stage:
                    | "qualifying"
                    | "site_visit_scheduled"
                    | "scope_in_progress"
                    | "proposal_sent"
                    | "bid_submitted"
                    | "awarded"
                    | "won"
                    | "lost"
                    | "on_hold";
                  next_followup_date?: string;
                };
                kind: "co_advance_lead";
              }
            | {
                input: {
                  description?: string;
                  estimated_hours?: number;
                  estimated_labor_cost?: number;
                  estimated_materials_cost?: number;
                  lead: string;
                  trade_type?:
                    | "general"
                    | "electrical"
                    | "plumbing"
                    | "hvac"
                    | "structural"
                    | "civil"
                    | "concrete"
                    | "roofing"
                    | "landscaping"
                    | "painting"
                    | "other";
                  version?: string;
                };
                kind: "co_create_scope";
              }
            | {
                input: {
                  amount: number;
                  client: string;
                  expires_at?: string;
                  lead: string;
                  notes?: string;
                  scope: string;
                  version?: string;
                };
                kind: "co_create_proposal";
              }
            | {
                input: {
                  amount: number;
                  bid_number?: string;
                  bid_type: "open" | "invited" | "negotiated" | "sole_source";
                  bond_required?: boolean;
                  client: string;
                  lead: string;
                  proposal: string;
                  submission_deadline?: string;
                };
                kind: "co_submit_bid";
              }
            | {
                input: {
                  amount: number;
                  client: string;
                  invoice: string;
                  payment_date: string;
                  payment_method:
                    "check" | "ach" | "wire" | "credit_card" | "cash" | "other";
                  reference_number?: string;
                };
                kind: "co_record_payment";
              }
            | {
                input: {
                  address?: string;
                  city?: string;
                  client: string;
                  contract: string;
                  job_number: string;
                  job_type:
                    | "commercial"
                    | "residential"
                    | "municipal"
                    | "subcontract"
                    | "general";
                  project_manager?: string;
                  start_date?: string;
                  state?: string;
                };
                kind: "co_create_job";
              }
            | {
                input: {
                  bid: string;
                  client: string;
                  contact?: string;
                  contract_number?: string;
                  contract_type:
                    | "lump_sum"
                    | "time_and_materials"
                    | "unit_price"
                    | "cost_plus"
                    | "gmp";
                  end_date?: string;
                  retainage_percent?: number;
                  start_date?: string;
                };
                kind: "co_convert_bid_to_contract";
              }
            | {
                input: {
                  contract: string;
                  contract_doc_url?: string;
                  docusign_envelope_id?: string;
                };
                kind: "co_mark_contract_signed";
              }
            | {
                input: {
                  amount: number;
                  client: string;
                  contract?: string;
                  due_date: string;
                  invoice_number: string;
                  invoice_type:
                    | "progress"
                    | "final"
                    | "retainage"
                    | "change_order"
                    | "deposit";
                  job: string;
                };
                kind: "co_create_invoice";
              }
            | {
                input: {
                  blueprint:
                    | "co_automation_rule"
                    | "co_bid"
                    | "co_campaign"
                    | "co_change_order"
                    | "co_client"
                    | "co_contact"
                    | "co_contract"
                    | "co_daily_report"
                    | "co_document"
                    | "co_invoice"
                    | "co_job"
                    | "co_lead"
                    | "co_outreach"
                    | "co_payment"
                    | "co_pricing_rule"
                    | "co_proposal"
                    | "co_scope"
                    | "co_site_visit"
                    | "co_subcontractor"
                    | "co_trade_spec";
                  identifier: string;
                  to: string;
                };
                kind: "transition";
              }
            | {
                input: { job: string; subcontractor: string };
                kind: "assign_subcontractor";
              }
            | {
                input: {
                  crew_size: number;
                  job: string;
                  notes?: string;
                  report_date: string;
                  work_performed: string;
                };
                kind: "submit_daily_report";
              };
          evidence?: {
            kind: string;
            note?: string;
            occurredAt: string;
            reference: string;
          };
          expected?: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            revision: number;
          }>;
          mayAttest: boolean;
          requestKey: string;
          tenantId: string;
        },
        {
          effects: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          }>;
          policyVersion: string;
          primary: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          };
          replayed: boolean;
          requestKey: string;
        },
        Name
      >;
      submit_daily_report: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          evidence?: {
            kind: string;
            note?: string;
            occurredAt: string;
            reference: string;
          };
          expected?: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            revision: number;
          }>;
          input: {
            crew_size: number;
            job: string;
            notes?: string;
            report_date: string;
            work_performed: string;
          };
          mayAttest: boolean;
          requestKey: string;
          tenantId: string;
        },
        {
          effects: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          }>;
          policyVersion: string;
          primary: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          };
          replayed: boolean;
          requestKey: string;
        },
        Name
      >;
      transition: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          evidence?: {
            kind: string;
            note?: string;
            occurredAt: string;
            reference: string;
          };
          expected?: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            revision: number;
          }>;
          input: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            identifier: string;
            to: string;
          };
          mayAttest: boolean;
          requestKey: string;
          tenantId: string;
        },
        {
          effects: Array<{
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          }>;
          policyVersion: string;
          primary: {
            blueprint:
              | "co_automation_rule"
              | "co_bid"
              | "co_campaign"
              | "co_change_order"
              | "co_client"
              | "co_contact"
              | "co_contract"
              | "co_daily_report"
              | "co_document"
              | "co_invoice"
              | "co_job"
              | "co_lead"
              | "co_outreach"
              | "co_payment"
              | "co_pricing_rule"
              | "co_proposal"
              | "co_scope"
              | "co_site_visit"
              | "co_subcontractor"
              | "co_trade_spec";
            eventId: string;
            id: string;
            identifier: string;
            operation: "created" | "updated";
            revision: number;
          };
          replayed: boolean;
          requestKey: string;
        },
        Name
      >;
    };
  };
