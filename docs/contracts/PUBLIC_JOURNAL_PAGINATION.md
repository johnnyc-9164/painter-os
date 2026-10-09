# Public journal pagination

Issue [#107](https://github.com/johnnyc-9164/painter-os/issues/107) replaces unbounded public article collection with an indexed read contract. Authenticated company CMS commands remain the sole authoring/publishing authority; there is no second content store.

## Compatibility and public projection

`painter:articles` keeps its existing workspace/optional-slug arguments and full-article array DTO. Detail reads use an indexed tenant/type/published/public/slug lookup, return zero or one article, and fail closed on duplicate public slugs. Lists return the complete result only up to 20 articles; larger lists return `PUBLIC_ARTICLES_PAGINATION_REQUIRED` rather than silently dropping articles. Existing clients requiring larger lists must adopt the page contract.

`painter:articlesPage` takes a workspace string, nullable continuation cursor, and integer limit from 1 to 20 (default 10). It returns `{ page, isDone, continueCursor }`. Summary rows contain only ID, title, slug, published timestamp and the first 300 content characters as `excerpt`; complete content and private source fields are omitted. Completion uses `isDone`, never the row count. A complete page has a null continuation; an incomplete page carries the next cursor, including when read limits produce a short page.

The cursor envelope records the selected workspace and Convex cursor. It is untrusted navigation input, not a permission or tamper-proof capability. Every request independently checks workspace existence and the indexed tenant/public/published constraints. Invalid cursor envelopes and cross-workspace envelopes are rejected. Anonymous reading does not establish membership or grant any write permission.

Invalid, wrong-table or deleted workspaces keep `PUBLIC_WORKSPACE_NOT_FOUND`. Existing empty workspaces return an empty completed page. Drafts, private articles, unrelated entity types and other workspaces never enter the public query. Malformed projected content fails closed. Existing detail URLs and company intake links remain intact; company, marketing and compatibility web journal lists show explicit next-page navigation.

## Limits and evidence scope

The paginated query sets `maximumRowsRead: 20` and `maximumBytesRead: 1048576`. These constrain reading complete stored documents, not merely summary DTOs. Convex checks the byte threshold after a document, so one native-size-limited document may cross the threshold; it is not an absolute 1 MiB hard cap. Indexed status/public constraints avoid scanning private/draft rows to find public articles. Sequential server-rendered navigation consumes `continueCursor`; this is not a reactive interval-pagination client using `endCursor` or split hints.

Legacy reads take at most 21 indexed rows, using the extra row solely to detect overflow. Detail reads take at most two rows to detect duplicate slugs. Neither uses unbounded collection. Native database quotas still apply to unusually large legacy documents; no source claim promises arbitrary legacy payloads fit.

Focused tests exercise actual Convex queries and byte-limited pagination with 20 published 100,000-character bodies among 1,000 drafts, enumerate all published records without duplicate/gap, reject crossed cursors and invalid limits, preserve full detail content, and verify explicit legacy overflow. Transport tests reject malformed page contracts and strip private/full-body fields. Built company-site HTTP fixtures verify three-page navigation and unchanged detail/404/public escaping behavior. Local fixture evidence does not prove deployed indexes or live provider operation.

No provider, domain/cookie, identity, authoring, billing or deployment configuration changes are part of this contract. Rollback reverts the query/DTO/transport and consumer pagination together; no data migration is required. Reuse [Painter PR evidence](../skills/painter-pr-evidence/SKILL.md) for exact-head independent review and distinguish local, CI and deployed checks.
