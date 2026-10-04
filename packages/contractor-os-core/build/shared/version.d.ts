/** Package/runtime compatibility constants. Keep these synchronized with package.json and migration docs. */
export declare const CONTRACTOR_OS_COMPONENT: "contractorOs";
export declare const CONTRACTOR_OS_VERSION: "0.6.0";
/** Schema remains data-compatible with v0.4.0; v0.6 adds isolated optional trade components; core storage is unchanged. */
export declare const CONTRACTOR_OS_SCHEMA_VERSION: "0.4.0";
export declare const CONTRACTOR_OS_CAPABILITIES: readonly ["typed_records", "transactional_business_commands", "immutable_domain_events", "tenant_scoped_reads", "idempotent_requests", "optimistic_revisions", "derived_projections", "component_compatible_pagination"];
