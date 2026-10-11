# Native appointment refusal transport (#154)

Production client error messages are not the authority for retry decisions. Native appointment host boundaries emit `ConvexError.data` with exactly `{kind:"estimate_appointment_refusal",version:1,code}`; the canonical domain decoder accepts only the declared closed code catalog and those three fields. No input, contact data or stack is carried in the DTO.

Explicit host refusal sites emit structured errors directly. Pure policy failures use a dedicated branded error translated by the boundary. Current membership's three explicit authentication/workspace refusals are translated only around that authority seam. Unbranded errors, even when their message resembles a known code, remain unchanged and opaque; malformed/unknown structured data decodes to null. This allows callers to retain their exact nonce on unknown outcomes rather than infer rejection from an ordinary message.

Local registered BetterAuth/Convex fixtures cover the actual public mutation and Node normalization action. The installed official Convex registration serializer and actual ConvexHttpClient reconstruct query/mutation/action error data with an opaque production message. These are local transport fixtures, not a deployed production error response or cloud runtime acceptance. The original lifetime receipt/cancellation capacity hold remains #151; no scheduling semantics, providers, schemas, deployments or notifications changed.

Focused validation: 22 tests (19 host fixtures and 3 transport/privacy/unknown tests). Broader completed checks and independent exact-head review are recorded on the PR.
