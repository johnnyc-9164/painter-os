/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as businessRecords from "../businessRecords.js";
import type * as businessStore from "../businessStore.js";
import type * as businessValidators from "../businessValidators.js";
import type * as domainRuntime from "../domainRuntime.js";
import type * as domainTables from "../domainTables.js";
import type * as domainValidators from "../domainValidators.js";
import type * as entities from "../entities.js";
import type * as meta from "../meta.js";
import type * as metaValidators from "../metaValidators.js";
import type * as operationValidators from "../operationValidators.js";
import type * as operations from "../operations.js";
import type * as projectionStore from "../projectionStore.js";
import type * as projectionValidators from "../projectionValidators.js";
import type * as projections from "../projections.js";
import type * as records_co_automation_rule from "../records/co_automation_rule.js";
import type * as records_co_bid from "../records/co_bid.js";
import type * as records_co_campaign from "../records/co_campaign.js";
import type * as records_co_change_order from "../records/co_change_order.js";
import type * as records_co_client from "../records/co_client.js";
import type * as records_co_contact from "../records/co_contact.js";
import type * as records_co_contract from "../records/co_contract.js";
import type * as records_co_daily_report from "../records/co_daily_report.js";
import type * as records_co_document from "../records/co_document.js";
import type * as records_co_invoice from "../records/co_invoice.js";
import type * as records_co_job from "../records/co_job.js";
import type * as records_co_lead from "../records/co_lead.js";
import type * as records_co_outreach from "../records/co_outreach.js";
import type * as records_co_payment from "../records/co_payment.js";
import type * as records_co_pricing_rule from "../records/co_pricing_rule.js";
import type * as records_co_proposal from "../records/co_proposal.js";
import type * as records_co_scope from "../records/co_scope.js";
import type * as records_co_site_visit from "../records/co_site_visit.js";
import type * as records_co_subcontractor from "../records/co_subcontractor.js";
import type * as records_co_trade_spec from "../records/co_trade_spec.js";
import type * as validators from "../validators.js";
import type * as workflowInputs from "../workflowInputs.js";
import type * as workflows from "../workflows.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import { anyApi, componentsGeneric } from "convex/server";

const fullApi: ApiFromModules<{
  businessRecords: typeof businessRecords;
  businessStore: typeof businessStore;
  businessValidators: typeof businessValidators;
  domainRuntime: typeof domainRuntime;
  domainTables: typeof domainTables;
  domainValidators: typeof domainValidators;
  entities: typeof entities;
  meta: typeof meta;
  metaValidators: typeof metaValidators;
  operationValidators: typeof operationValidators;
  operations: typeof operations;
  projectionStore: typeof projectionStore;
  projectionValidators: typeof projectionValidators;
  projections: typeof projections;
  "records/co_automation_rule": typeof records_co_automation_rule;
  "records/co_bid": typeof records_co_bid;
  "records/co_campaign": typeof records_co_campaign;
  "records/co_change_order": typeof records_co_change_order;
  "records/co_client": typeof records_co_client;
  "records/co_contact": typeof records_co_contact;
  "records/co_contract": typeof records_co_contract;
  "records/co_daily_report": typeof records_co_daily_report;
  "records/co_document": typeof records_co_document;
  "records/co_invoice": typeof records_co_invoice;
  "records/co_job": typeof records_co_job;
  "records/co_lead": typeof records_co_lead;
  "records/co_outreach": typeof records_co_outreach;
  "records/co_payment": typeof records_co_payment;
  "records/co_pricing_rule": typeof records_co_pricing_rule;
  "records/co_proposal": typeof records_co_proposal;
  "records/co_scope": typeof records_co_scope;
  "records/co_site_visit": typeof records_co_site_visit;
  "records/co_subcontractor": typeof records_co_subcontractor;
  "records/co_trade_spec": typeof records_co_trade_spec;
  validators: typeof validators;
  workflowInputs: typeof workflowInputs;
  workflows: typeof workflows;
}> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
> = anyApi as any;

export const components = componentsGeneric() as unknown as {};
