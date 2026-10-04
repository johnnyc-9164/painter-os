# Issue 3 crew normalization evidence

Owner: native crew implementation worker in isolated `repair/issue-3-crew-key` worktree `painter-worktrees/issue-3-crew`. Only origin johnnyc-9164/painter-os (repository ID 1404513225). Parent coordinates independent review and merge.

Scope: normalize both existing and candidate crew labels by trim, whitespace collapse and lowercase for conflict comparison only. Stored labels, half-open intervals, self exclusion, cancellation and tenant scoping remain intact. No stable person/team identity or migration is claimed. Issue 3 component integration/events/bounded reads remain outstanding.

RED on base e683b000b8a069397f0099f8a354b01514b46d66: new crew suite 2 failed/2 passed, with missing CREW_SCHEDULE_CONFLICT for aliases on create/reschedule. GREEN after minimal comparison repair: 4/4 new tests and 16/16 existing domain tests passed.

Commands: global `tsc --ignoreConfig tests/crew-normalization.test.ts tests/domain.test.ts --outDir .crew-test --module commonjs --target es2022 --esModuleInterop --skipLibCheck --noEmitOnError false`, then `node .crew-test/tests/crew-normalization.test.js` and `node .crew-test/tests/domain.test.js`. Test transpilation reports missing node:test/node:assert type declarations because install is unavailable, but emitted JavaScript executed actual assertions. Strict domain check passed: `tsc --ignoreConfig packages/domain/src/engine.ts --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck`.

Full npm checks are not claimed locally: npm ci --ignore-scripts was interrupted when C: had zero free bytes. Own partial node_modules cleanup recovered space; no secrets or unrelated directories read/removed. CI is required for full locked-dependency validation. Exact tested commit is recorded in the PR; evidence file itself does not self-reference its commit.

Risks: distinct teams sharing normalized display names will conflict, intentionally matching the approved compatibility contract. This is label identity only and does not detect shared members. Rollback: revert this scoped change; no persisted data rewrite.
