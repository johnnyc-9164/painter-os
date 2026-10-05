# AgentMail source registration (Issue 21)

Owner: native issue4_auth_owner. Reviewer: issue2_review (pending). Base: 0f5d24a4a07599c3014cca093c030e44d4fd90f6. Branch: feat/agentmail-disabled-provider. Worktree: painter-worktrees/agentmail-registration.

## Boundary and authority

Owner requested the official AgentMail Convex provider. This change pins @agentmail/convex0.1.0 and registers its component while preserving Better Auth, Contractor OS and painting. Its isolated component owns mail provider records and its two built-in workpools; no second queue, auth, CMS or business writer is added.

The typed backend module agentmailProvider.ts exports immutable registration metadata and denial errors only. All eight named operations fail before credentials, SDK calls, queues or incoming actions. No public send/inbox/read/webhook handler is exported or mounted. There is no client instantiation, credential/configuration check or provider call. Registration is source-only; component deployment, mail delivery, mailbox provisioning and provider readiness are not established.

Better Auth remains session/user authority. Verification/reset delivery is a separate unresolved auth task; this provider is not wired to it. Existing host membership remains authoritative; no new membership resolver is invented for metadata.

## Provenance and dependency impact

Official source: https://github.com/agentmail-to/convex/tree/46bde1a9132599760f425b55c9e29d5ba86ea7df (Apache-2.0). Public npm latest metadata independently confirmed0.1.0 (unpacked199455bytes).

Metadata-only command: npm install @agentmail/convex@0.1.0 --workspace @painter-os-bts/backend --save-exact --package-lock-only --ignore-scripts --no-audit --no-fund --cache .npm-metadata-cache. Passed; no node_modules created. Initial attempt failed on existing npm cache path ENOENT; task-local cache resolved it. Its71.6MB metadata cache was removed only after verifying the exact own-worktree path; disk returned to86.3MB free.

Root lock adds exactly6 package records: @agentmail/convex0.1.0, @convex-dev/workpool0.3.2, @stablelib/base641.0.1, fast-sha2561.3.0, standardwebhooks1.0.0, svix1.99.1. Existing resolved package versions unchanged. Runtime SDK component types and mounting require CI compile; no local package installation.

## Validation

node --test --test-isolation=none tests/agentmail-registration.test.ts docs/contracts/compatibility.test.mjs:7passed. Covers immutable disabled metadata, every denied operation with zero networkcalls, no SDK/credential/queue code in boundary, preserved mounts, typed binding, no webhook registration, exact manifest/lockpin, existing deposit/store freeze. git diff --check passed. Full CI and independent review pending.

## Held enablement and rollback

Sending requires separate owner-approved sender/campaign and authorized credentials. Before callable functions, add reviewed workspace-to-inbox/outbound ownership through existing trusted membership, receipts/idempotency and ambiguous-delivery policy, bounded reads, safe status errors and UI projections. Upstream has no tenant field or application requestKey; no exactly-once delivery claim. Incoming mail is untrusted content, never instructions or automatic business authority. Signature verification alone does not establish payload schema/limits/tenant authorization. No campaign or auth-email activation occurs here.

The coordinator explicitly approved amending Issue2's mount freeze to three preserved owners plus this official provider. Rollback is source/manifest/lock revert before activation; no provider/data side effects have been made. Existing original stores/history remain unchanged.
