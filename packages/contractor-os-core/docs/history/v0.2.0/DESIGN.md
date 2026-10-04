# Version 0.2.0 design and source boundary

Scope: `project_contractor_os_extraction` under `product_line_painting_contractor_os`.
This is a new local artifact derived from the supplied package and schema summary;
no source repository, live company system, or canonical portfolio ontology was edited.

The lossless catalog stays intact. Twenty separate domain tables hold only individually
specified properties. A deterministic manifest generates validators, TypeScript
property interfaces, relation ID validators, indexes, four operations per blueprint,
and a server-side client. Missing raw flags remain marked unknown.

All commands carry tenant and actor values derived by a parent-side membership resolver.
Component functions are trusted-server APIs. Creates and updates validate source fields,
ID targets and tenant membership, append immutable record events, then update materialized
rows and add idempotency receipts. Updates require a revision; deletion is omitted.

This release records data. It deliberately does not implement commercial actions,
contractor workflow approvals, rate calculations, agent execution or platform objects.
The previous workflow input validators remain input validators, not workflow executors.

Testing separates pure TypeScript logic and explicit adapter doubles from the real
Convex SDK/runtime. Missing dependencies/codegen are not replaced with fake generated
files. Eight genuine convex-test cases are supplied but remain unexecuted.
