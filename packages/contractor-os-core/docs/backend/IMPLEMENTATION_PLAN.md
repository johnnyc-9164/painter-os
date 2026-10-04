# Backend implementation plan

1. Write failing command-core tests for source workflows, lifecycle boundaries,
   cross-tenant/client references, revisions, replay, financial arithmetic and rollback.
2. Implement the transaction-port command core and initial-only maintenance policy.
3. Add indexed Convex adapter, registered typed mutations, authenticated host wrappers,
   read endpoints, and SDK-harness tests. Preserve source identifiers and provenance.
4. Run all locally available tests, generated-file drift and syntax checks; attempt
   dependency install and actual SDK/runtime checks; record each result independently.
5. Package source without customer records, credentials, or environment files. Append
   build evidence to Founder OS history. Leave state and ontology unchanged.
