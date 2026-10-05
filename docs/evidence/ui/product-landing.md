# Product landing reference implementation — PR32

## Scope and integration

This increment follows structural head `a7376cd2e47ae05d08e0fbe5b23773d584827380` and integrates main `21f60d171f806d567ae17a7c995a47049b852071`. The six auth preparation files are imported by their exact existing main blob SHAs; no auth callbacks, provider sending, grants or runtime gates change. Existing marketing package/lock declarations, CI hooks, HTTP runner, contractor routes, shared UI and backend authority remain intact.

Owned changes: marketing product CSS/components/content/imagery and design contract, two generated local WebPs, this receipt, and focused source/HTTP acceptance tests. The supplied image was inspected before implementation. The composition follows its dominant geometry: painter/blue-brush hero behind left-aligned headline and overlapping dashboard, open eight-feature grid, house/van story panel and navy closing CTA. Copy describes actual capabilities rather than invented endorsements, customer logos, free trials, AI functionality, payment collection or user counts.

The dashboard is a server-rendered HTML illustration with explicitly labeled example data. It is not a screenshot of the app, live business data, or an interactive demo. The generated house and van do not represent a real customer. The story note is product copy, not a testimonial. Navigation reuses shared `buttonVariants` on native anchors; an independent review caught and prompted repair of the inherited button-role wrapper.

## Asset provenance

Generated with the built-in image-generation tool on 2026-10-05; inspected actual pixels and materialized the bytes locally before registry activation. Converted losslessly in geometry to WebP using installed sharp, quality86. No third-party stock image URLs, remote font requests, image CDN dependencies or new packages.

- `house-van.webp`: 1536×1024 WebP, 428,980 bytes, SHA-256 `d54c8430f09cf28abbab2e0077abd71264d067eb487adb961ffafbc5cd6189ee`.
- `painter-hero-v2.webp`: 1536×1024 WebP, 157,704 bytes, SHA-256 `583f62a672c8d0b7add186a3afc57b99bc56218b189b382bfb23476d7f71d019`.

Hero prompt: a wide editorial photo of an adult professional painter from behind, navy cap and gray work shirt, at the far right using a roller on a rich medium-blue wall; broad diagonal textured brush edge fading to pale cool-white negative space on the left; daylight; no text, logos, UI or watermark.

Hero refinement: retain the background and clothing, raise the cap near the upper-right edge and use a naturally bent roller arm at head height so the full head sits above the dashboard overlay. The versioned filename prevents reuse of the initial image optimizer cache.

Story prompt: a freshly painted pale-gray two-story suburban house with white trim, navy-gray roof, trees/lawn and warm daylight, with an unbranded white painter work van in the left driveway foreground; no people, text, logos, UI or testimonial overlay.

## Local verification

Native isolated task copy, Node24.19.0, task-local npm11.16.0 and the baseline's actual locked dependencies. No dependency resolution or installation. Application commands use an explicit secret-free environment and disabled telemetry. Original baseline source is untouched.

- Full workspace typecheck: PASS.
- Full lint: PASS with zero warnings after explicit alt props.
- `node --import tsx --test tests/*.test.ts`: 51 PASS. Supported import loader avoids the native tsx CLI IPC restriction.
- Marketing-boundary tests: 6 PASS. Deployment-helper tests: 6 PASS.
- Actual Convex/Better Auth package tests after main integration: 34 PASS in 8 files.
- Production marketing build: PASS.
- Actual production marketing HTTP: PASS for eight feature headings, navigation anchors and native roles, both materialized WebP signatures/size limits, real Next image optimization, no session cookie, security header and six absent admin/portal/API routes.
- Configured-origin gate: separate production build with the synthetic nonsecret `https://workspace.example.test` origin, then actual HTTP acceptance with the same expected origin: PASS. This proves build-time rendering only; it never contacts the example destination. Rebuilt without the origin and repeated HTTP acceptance: PASS.
- Marketing premium static audit: zero findings. It is static evidence, not browser or accessibility compliance.
- Root admin build compiled but was killed with exit137 during TypeScript; a bounded same-source512MiB warm-cache retry also exited137. Standalone whole-workspace typecheck passed. This environment result is retained, not relabeled as a pass. Fresh exact-head GitHub CI must run both app builds and admin HTTP acceptance.
- Every unchanged source file compared against the complete original PR32 Git tree; no missing files. Imported main files match their connector blob SHAs. Next-generated next-env/tsconfig edits are restored before publication.

## Visual and release holds

The actual loopback build serves valid HTML/assets, but supported dot cloud-browser navigation to it returned `net::ERR_BLOCKED_BY_CLIENT`. That route was stopped, without bypass or proxy. Native Chromium cannot operate with its required sandbox in this environment; security was not disabled. No browser screenshot, exact pixel-match, responsive/keyboard/zoom/overflow pass or deployed visual acceptance is claimed.

Required remaining review: render the exact head at desktop1440, reference-width1024, tablet820 and mobile390/320, inspect all page sections, check CTA focus/anchor destinations and disclosure behavior, image loading, no horizontal overflow and 200%zoom. Inspect the actual approved reference alongside those screenshots. The visual hold remains even if CI passes.

Vercel was already build-rate-limited before this work. No deployment retry, upgrade, promotion, provider setting or production URL change was requested. This remains a draft PR and the owner does not self-approve or merge. Refs#18 stays open.

## Compatibility and extraction

Rollback is a revert of the owned marketing increment; no database/provider rollback. Contractor journal selectors and source remain unchanged. Existing `docs/skills/painter-pr-evidence/SKILL.md` was reused for exact-head verification, bounded repairs and explicit blocked gates. No new reusable procedure was extracted: this is a reference-specific composition, with browser verification incomplete. Prior structural/loader-repair history remains in PR32 and the a7376cd receipt.
