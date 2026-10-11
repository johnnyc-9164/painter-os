# Cloudflare Artifacts evaluation for agent drafts — 2026-10-11

Tracking: [issue #91](https://github.com/johnnyc-9164/painter-os/issues/91) (Linear STL-32). Builds on the earlier source assessment [CLOUDFLARE_ARTIFACTS_2026_10_09.md](CLOUDFLARE_ARTIFACTS_2026_10_09.md); this record re-verifies the load-bearing facts and adds the fit, overlap and recommendation.

**Exploratory evaluation only. This is not installation, account, billing, deployment or adoption approval.** Docs only: no Cloudflare account, token, namespace, repository, Worker, SDK install or provider call was made or created.

## Source labels

- **Verified 2026-10-11**: fetched for this record from developers.cloudflare.com (overview, changelog, authentication, limits, pricing).
- **Carried, not re-fetched**: stated in the 2026-10-09 record with a source URL (Workers binding, Git protocol, namespaces, how-it-works, ArtifactFS, isomorphic-git, local dev). Treat as unverified until re-read.
- **Painter inference**: our judgement, not a Cloudflare claim.

## What the product is (verified)

- Overview: "Versioned storage that speaks Git." Stores and versions files, code and projects behind a Git-compatible interface; repositories can be created programmatically or imported; reachable via Workers, the REST API or standard Git clients. Built for a repository per project, user, session or task, including forking from a shared baseline, exploring in parallel and comparing/merging. https://developers.cloudflare.com/artifacts/
- Status: open beta since 2026-10-01 on the Workers Paid plan; billing begins 2026-10-14. Earlier private beta 2026-04-16. Not GA. https://developers.cloudflare.com/artifacts/platform/changelog/
- Three API surfaces: Workers binding (create/fork repos, inspect files and commits, read files by path, issue repo-scoped tokens), REST API, Git protocol. Also event subscriptions (created, imported, forked, deleted, pushed, cloned, fetched), US/EU jurisdiction fixed at namespace creation, dashboard and Wrangler management, usage metrics (changelog).
- An optional Workers Builds integration can deploy a repo to Workers on push. Painter does not need or want this (see below).
- Auth (https://developers.cloudflare.com/artifacts/guides/authentication/): the binding is authorized by Wrangler config with no runtime token; REST uses a Cloudflare API token with Artifacts Read/Edit; Git uses repo-scoped tokens with `read` (clone/fetch/pull) or `write` (also push). The page documents scope only at repo level; no branch or path scope appears there.
- Pricing: Workers Paid only; first 10,000 operations/month then $0.15 per 1,000; first 1 GB-mo then $0.50 per GB-mo; repos persist until explicitly deleted. https://developers.cloudflare.com/artifacts/platform/pricing/
- Limits: 2,000 control-plane requests/10 s per namespace; 2,000 Git requests/10 s per artifact; 1 GB per repo; 32 MB per file; 1 TB per account; unlimited repos and namespaces; names start with a letter or digit, then letters, digits, `.`, `_`, `-`. https://developers.cloudflare.com/artifacts/platform/limits/
- Carried, unverified now: Durable Objects foundation (the issue states it; the overview fetched did not), synchronous replication, token create/list/revoke methods and TTL, ArtifactFS (Go/FUSE blobless checkout for sandbox hosts, not Workers), isomorphic-git in-memory fs example, local `remote=true` dev.

## Fit versus the current GitHub-branch agent-draft flow

Current flow (repo evidence): agents work in isolated git worktrees on feature branches and open PRs (draft by default per docs/development/AGENT_SETUP.md); a distinct reviewer attaches exact-head evidence; `factory/*` PRs pass the base-owned contract guard (`.github/factory/`, `factory-path-guard.yml`); humans merge. GitHub is the authority for engineering code, review and release.

| Aspect | GitHub branch/PR | Artifacts (candidate) |
| --- | --- | --- |
| Best for | Engineering code and docs for this repo | Many small per-tenant/task draft file trees created by the product at runtime (research reports, company-site change sets) |
| Per-task isolation | Branch/worktree in a shared repo | Repo or fork per task (platform designed for it) |
| Review UI | PR diff, checks, CODEOWNERS | None provided; Painter would build diff/approve UI |
| Approval/provenance | PR review, exact head SHA | Commit/tree hash only; approval must live in Convex |
| Status | In use | Open beta, not adopted |

Painter inference: Artifacts does not improve the engineering agent flow and should not replace it. Its only credible role is the product-side task draft store described in the issue, and no runtime draft flow exists yet to migrate.

## Overlap and compatibility (AGENTS.md)

- **One authoritative writer per aggregate**: Artifacts would own only the versioned draft file tree. Convex keeps identity, membership, approvals, CMS/business writes and provenance; Pi keeps transcript, run and effect receipts. A commit is never a published CMS record, estimate, contract, deposit or invoice. No automatic mirroring.
- **CMS authority**: publishing a draft must pass the existing authenticated dashboard CMS/typed Convex commands with the exact approved revision. Marketing never reads Artifacts, drafts or tokens; no public draft endpoint and no second CMS/store.
- **Better Auth and host membership** supply trusted tenant/task/actor scope; browser roles, model output, paths or tokens never establish authority.
- **GitHub engineering authority** is unchanged; no auto-promotion to main or deploy. The Workers Builds integration is out of scope and must stay unconnected.
- **Customer files**: audit the existing verified file metadata/upload authority before any link between artifacts and customer files.
- **New service**: adopting a paid provider needs a concrete overlap assessment (this section) and separate owner authorization; this exploratory recommendation is not that approval.
- **Modularity**: a single typed draft-store port with a local Git fixture implementation and a Cloudflare implementation behind it, independently testable and removable without touching Convex, Pi or CMS contracts. Rollback: stop minting tokens, leave repos read-only or export, delete explicitly (repos are not auto-deleted).

## Security, tenant and credential concerns

1. **Repo-level tokens only** (verified). Branches are not a tenant boundary; use one repo or fork per tenant+task, never branches of a shared sensitive repo. Branch protection and force-push prevention were not established; expected-parent, no-force and exact-hash approval would be enforced in our trusted adapter, which is not storage-native authorization.
2. **Two credential layers**: the Cloudflare API token (account control plane, broad) versus repo tokens (Git). Neither may reach model arguments, browser, logs, transcripts, URLs or file history. Prefer an Authorization header over credentials embedded in remote URLs (the changelog example embeds a token in the clone URL; avoid that form).
3. **The binding has no runtime token**, so whoever can run the Worker code can reach the namespace. Namespace and repo mapping must be resolved server-side from trusted run/membership; a namespace name alone is not authorization.
4. **Token lifecycle** (carried): explicit read/write, short TTL, revoke on cancel, member removal or connection revoke. Revocation cannot recall fetched content or an accepted in-flight push; keep a receipt and reconcile the remote ref after timeouts instead of resending or claiming rollback.
5. **Content**: no secrets in file history; file content is untrusted and cannot grant tools or permissions; restrict to UTF-8 Markdown, deny traversal, symlinks and executables; apply caps far below the 1 GB/32 MB platform limits.
6. **Residency and retention**: jurisdiction (US/EU) is immutable per namespace and repos persist until deleted, so a retention and customer-deletion policy is needed before any customer content is stored.
7. **Maturity and cost**: open beta, billing starts 2026-10-14, Paid plan only; semantics and limits may change. Cost per draft is small but non-zero and unbudgeted.
8. **ArtifactFS and Pi**: no arbitrary shell or filesystem exposure; typed tools (read at commit, propose commit with expected parent, bounded diff) call the adapter. ArtifactFS needs FUSE and is not for Workers/Durable Objects.

## Recommendation (exploratory, not installation approval)

**Defer.** The product matches the "task-scoped versioned draft repo" idea, but it is open beta with billing just starting; no Painter runtime draft flow needs it yet; branch/path-scoped tokens and branch protection are not established; the review UI and Convex approval binding must be built regardless; and a draft-store port with a plain local Git fixture captures most of the contract value with no provider dependency. Not rejected: the fit is plausible and repo-per-task/fork-per-session tenancy is sound.

Revisit when (a) a product feature needs per-task draft storage, (b) the provider-neutral draft-store contract and fixture exist, and (c) the owner separately authorizes an account, budget, namespace and jurisdiction for a scratch acceptance.

## Follow-up issues (proposed; not created here)

1. Contract and local-fixture adapter for a provider-neutral task draft store: typed tenant/task/repo binding, exact baseline and commit approval, path/size caps, non-fast-forward denial, crash/dedup tests. Distinct owner and reviewer, worktree reservations, no Cloudflare dependency.
2. Audit existing verified file metadata/upload authority before any artifact-to-customer-file linking.
3. Separate activation issue (owner authorization required): Paid-plan entitlement and budget, namespace/jurisdiction, re-read carried API pages, generated bindings and local-dev evidence, scratch remote token/revocation acceptance, retention/deletion policy. No Workers Builds hook, no production repo import.

Broad platform readiness remains open; issue #91 criteria beyond this research stay with those follow-ups.
