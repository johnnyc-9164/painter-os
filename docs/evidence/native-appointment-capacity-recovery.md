# Native appointment history capacity recovery (#151)

Native appointment and slot operations no longer load company lifetime entity or receipt collections. Exact-key indexed receipt lookup retains permanent actor/intent idempotency, reads the current target for replay, and supplies only that immutable receipt to the unchanged bounded pure policy. All existing receipts remain stored; none are pruned, regenerated or given a new nonce. Persistence still uses the sole `persistPainterState` writer with a target-only native delta and one newly admitted receipt.

Cancellation and slot closure read only their target and exact receipt. They remain available after hundreds of historic receipts and cancelled appointments, and even when an active resource conflict window exceeds its admission bound. New scheduling reads a complete indexed **reserved** padded time window and complete indexed proposed/reserved lead-slot matches. Cancelled history is excluded by the index rather than filtered after a truncated page. Cap+1 active reads deny without writing; the pure selected-state bound remains 256. Dense active-window admission can therefore still refuse, while cancellation has no lifetime capacity cliff.

Exact slot-save reconciliation now runs after current office authentication and before prospective resource, clock or Node timezone admission. It binds the original receipt snapshot’s trusted normalized instant to the exact actor/role/intent fingerprint and verifies the current slot proof. Lost-response replay after resource disable or clock advance returns the current closed/modified target; divergent intent rejects. Neither browser input nor a later prospective refusal is treated as evidence that an earlier write was absent.

The same exact-key read, target revision, active resource/source readsets and sole persistence occur within one mutation. Real deployed Convex OCC and index activation remain unclaimed. Local convex-test concurrent same-key cancellation is serialized application evidence, not deployed concurrency proof. No external calendar, notification, provider, account or deployment work occurred.

Meaningful fixtures seed over 600 permanent receipts and 256 cancelled records, prove cancellation/current replay and new slot/approval success, retain every receipt, reject divergent same-key intent, reject cap+1 active conflicts and preserve cancellation at that dense boundary. Existing actual-authority, normalization, source conversion/privacy, revisions, rescheduling and overlap fixtures remain required. Exact commands and independent review are recorded on the PR.

This resolves the source lifetime cancellation-capacity hold described in the earlier #141 evidence once merged; it does not claim whole-platform retention scalability or deployed release acceptance.

The generic authenticated `loadPainterState` snapshot/ordinary-command full-history read debt is separately tracked in #159; this slice does not claim that path is bounded.
