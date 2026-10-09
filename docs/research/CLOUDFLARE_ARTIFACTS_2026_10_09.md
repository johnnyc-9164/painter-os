# Cloudflare Artifacts assessment for Painter OS — 2026-10-09

Tracking: [issue #91](https://github.com/johnnyc-9164/painter-os/issues/91). Implementation and provider acceptance criteria remain open.

Research only. No Cloudflare resources, accounts, imports, builds, repositories, tokens or deployments created; no SDK installed.

## Correction and recommendation for issue 91

Cloudflare Artifacts is the actual Git-compatible, versioned-filetree product. It is not a generic name for R2 objects or generated attachments. Correct issue 91 around tenant-bound agent draft repositories: a Pi run creates/revises a small Markdown draft filetree; the user sees exact commit diff, approves a specific revision, and can compare/restore earlier drafts.

Use one tenant-bound task repository/fork, trusted baseline commit and explicit short-lived read/write capabilities. Start with text-only drafts, regular Git protocol or pinned isomorphic-git adapter. Do not install ArtifactFS in the Worker/DO. Keep provider activation separate.

Ownership: Artifacts owns versioned draft filetrees/commits only. Pi Durable retains transcript, inbox, agent tasks and recovery. Convex retains users, memberships, approvals, CMS/business writes and existing business-file authority. Approved draft import/publishing crosses the existing typed Convex command boundary; an Artifacts commit is not a published CMS record, accepted estimate, contract signature, deposit receipt, or invoice. GitHub remains engineering PR/review/release authority. No Artifacts-to-Workers auto-build connection needed.

## Official capabilities and scope

- Root overview calls it versioned storage that speaks Git, creates repos programmatically, imports/forks repos and serves Workers binding/REST/standard Git clients. Per-project/user/session/task repo pattern supported.
https://developers.cloudflare.com/artifacts/
- Open beta launched October 1, 2026; Workers Paid plan only. Latest changelog supersedes older private-beta request-form text. Billing begins October 14, 2026. Do not claim GA or an account's entitlement merely from public docs.
https://developers.cloudflare.com/artifacts/platform/changelog/
- Pricing: first 10,000 operations/month then $0.15 per additional 1,000; first 1 GB/month then $0.50/GB-mo. Repos persist until explicitly deleted. Cloudflare Worker/DO/model/Zapier costs separate.
https://developers.cloudflare.com/artifacts/platform/pricing/
- Limits: control-plane 2,000 requests/10s per namespace; Git 2,000/10s per repo; repo max1GB; blob/file max32MB; account1TB (raise request); repo/namespace count unlimited subject operational constraints. Add smaller application caps initially.
https://developers.cloudflare.com/artifacts/platform/limits/
- Namespace provides naming/routing/environment/shard grouping; namespace selection is not proof of Painter membership authorization. Jurisdiction chosen at creation, immutable; US/EU options documented.
https://developers.cloudflare.com/artifacts/concepts/namespaces/
- Repo has isolated Git state/history/refs/remote/tokens, replicated synchronously across data centers and backed up asynchronously. Fork has independent tokens/lifecycle. Your Worker/API decides authorization and token minting.
https://developers.cloudflare.com/artifacts/concepts/how-artifacts-works/

## Authentication and tenant enforcement

Workers binding authorizes via configured namespace binding, no runtime token on binding calls. REST uses Cloudflare API token with Artifacts Read/Edit; Git uses repo-scoped Artifacts read/write tokens. These are different authority layers; neither Cloudflare account token nor arbitrary binding method belongs in model/browser tool arguments.
https://developers.cloudflare.com/artifacts/guides/authentication/

Binding get returns disposable capability; use using. createToken defaults WRITE, so always specify read/write explicitly and short TTL; createToken returns plaintext/expiresAt whereas create/import return initial token string. listTokens and revokeToken exist. Git token expiry suffix is metadata; tokens are secrets. Prefer Bearer http.extraHeader over embedding credentials in remotes.
https://developers.cloudflare.com/artifacts/api/workers-binding/
https://developers.cloudflare.com/artifacts/api/git-protocol/

Docs expose read/write REPO scope, not branch/path scope. Branches are version organization, not tenant/task ACL boundaries. For isolated independent agents, fork/separate task repo instead of giving each agent a write token to different branches of a shared sensitive repo. Server resolves namespace/repo/task mapping from trusted run/workspace membership; deny arbitrary repo name/path/ref selection without mapping. Never expose namespace create/list/delete/token endpoints directly.

Branch protection/force-push prevention is not established in reviewed docs. Keep write tokens internal and constrain push refs in trusted adapter; use expected-parent checks/no force push, serialized writer per repo, and approved exact commit hash. A leaked repo-write token may permit other refs, so do not claim application branch rules are storage-native authorization.

On cancel/member removal/connection revocation, stop future access and revoke outstanding tokens. Already fetched local content or in-flight accepted push cannot be undone by token revocation. Preserve receipt and reconcile remote ref if push timeout occurs; do not falsely report rollback. Logs/transcripts/UI projections must redact token and remote credentials.

## File operations, Pi and ArtifactFS

Latest binding provides repo.readFile(ref/path), readCommit/readTree/readBlob/log, metadata, forking/token methods. isomorphic-git example says binding cannot read files, but that older statement is stale against October1 binding reference. Writes still use Git operations. Pin generated Wrangler binding types and prove installation compatibility.
https://developers.cloudflare.com/artifacts/api/workers-binding/
https://developers.cloudflare.com/artifacts/examples/isomorphic-git/

Workers lack native git executable/local OS filesystem; isomorphic-git provides JS init/commit/push over an in-memory fs. That filesystem alone is not durable: successful pushed commit/ref is Artifacts authority. After restart reopen exact committed tree; unpushed draft state requires deliberate persistence or can be lost. Pi checkpoints should reference repository identity+commit hash, never pretend transient JS fs survived.

ArtifactFS is a Go/FUSE-mounted blobless Git checkout with demand-hydrated contents. It is for sandbox/container/VM hosts with FUSE, not a Worker/DO filesystem facility. Official recommendation for small repos is regular git clone.
https://developers.cloudflare.com/artifacts/guides/artifact-fs/

No reviewed source provides a prebuilt PiHarness/Artifacts integration. Typed Pi tools must call a trusted adapter rather than add generic shell/Git authority. Tools include read draft at exact commit, propose draft commit with expected parent, inspect bounded diff/history. Files/retrieved content are untrusted and cannot grant tools, credentials or deploy permissions.

## Local evidence and SDK/testing caveat

Workers binding docs allow remote=true for remote Artifacts in local dev; get-started documents wrangler dev/types. This does not establish exact local emulator persistence/auth semantics in the currently installed Wrangler. Must inspect pinned SDK/source and actually test generated binding, local fixture behavior and restart. A stub alone is adapter-contract proof; real local Git fixture exercises filetree/commit/diff semantics but does not prove Cloudflare token enforcement, replication or billing. Authorized remote scratch acceptance is a separate eventual gate.
https://developers.cloudflare.com/artifacts/get-started/workers/
https://developers.cloudflare.com/artifacts/api/workers-binding/

## Corrected bounded implementation issue acceptance

1. Product wording names Cloudflare Artifacts; no R2 substitute. Record open-beta/Paid-only/billing and storage ownership, no engineering release authority.
2. Typed tenant/task/repo binding with exact baseline, revision/hash and allowed relative UTF-8 Markdown paths; small per-file/repo caps, no secrets/build scripts/symlinks/executable payloads. Traverse ../, encoded slash and ambiguous normalized paths denied.
3. Actual Git fixture: baseline -> agent draft -> immutable commit -> bounded diff -> user approval of exact hash -> next draft invalidates old approval -> rollback as new reviewed commit preserving history. Non-fast-forward concurrent edits deny/reconcile rather than force push.
4. Crash tests: draft before push not falsely durable; timeout after accepted push reconciles remote hash; restart reloads authoritative tree; duplicate operation returns original commit; changed payload with same key conflicts; unknown outcome prevents unreviewed resend.
5. Policy: cross-tenant repository/ref denial, no branch-as-ACL claim, scoped read/write TTL/revoke adapter, demoted/member-disabled/canceled run denies dispatch, secrets redacted. Provider tests accurately distinguished from fixture tests.
6. Pi tool integration references commit metadata only; transcript remains Pi; publishing/import calls existing Convex authority with exact approved content/revision. No direct alternate business writer.
7. UI displays real proposed/saved/reviewed/stale/conflict/uncertain states and exact file diff/history; restoring draft does not automatically undo published business records.
8. Separate activation issue: actual owner account/Paid plan entitlement and budget, namespace/jurisdiction, generated bindings/local SDK evidence, isolated remote scratch Git/token/revocation acceptance, retention/delete policy, exact-head independent review, no connected auto-build or production repo import by default.

No newly verified implementation procedure to extract from this research; use existing exact-head Painter PR evidence skill for later independent review.
