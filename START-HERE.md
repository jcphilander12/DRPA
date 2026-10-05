# DRPA Bid Workbench — designer and testing pack

Updated 2 October 2026. Both applications have been published successfully.

Bid Workbench: https://drpa-bid-workbench.sa33dc.chatgpt.site
Intelligence master feed configuration: https://drpa-intelligence-engine.sa33dc.chatgpt.site/bid-evidence

The live Workbench remains owner-only at the outer access gate. Intelligence retains its existing invited-viewer audience; this update does not alter sharing. Its feed settings are restricted to the configured master. Private post-bid review is restricted to Workbench master accounts.

## Start

Read DRPA-Bid-Workbench-Guide.md. For the designer, start in bid-workbench/README.md and TESTING.md. Install the package manager version declared in that package with Node 22.13+, then use:

    pnpm install --frozen-lockfile
    pnpm typecheck
    pnpm build
    pnpm test:smoke
    pnpm demo

The demo is for a designer's own computer; open http://127.0.0.1:4180/demo-login for synthetic master/writer/checker accounts. Do not deploy the demo login.

The intelligence directory includes the already-published source-side feed implementation and BID-FEED-HANDOVER.md. To test it after installing/building, use pnpm exec tsc --noEmit, node scripts/verify-domain.mjs and node scripts/bid-feed-smoke.mjs. Its wider role/tenant selectors remain a prototype; an independent public deployment requires verified server membership throughout, beyond this bid feed's master guard.

## What is included

Full tracked source and locked dependencies, compiled dist output, immutable database migrations, deployment template, synthetic tests and user/developer instructions. Existing project identities are removed from the downloadable hosting config so it cannot accidentally publish over the owner's Sites. Use the owner's approved Sites source workflow to update the originals, or configure new server/database/private object storage and verified authentication for an independent host. HTML-only upload cannot provide this application's private collaborative functions.

This pack contains selected confidential DRPA historic extracts. It excludes production service/API credentials, repository tokens, live databases, original uploaded files, private review content, local demo data, dependency directories and Git internals. Provision secrets privately. No paid AI key is active; ChatGPT companion is available. The Intelligence feed begins unpublished and excludes fictional/sample records.

## Verification and acceptance

TypeScript and production builds passed for both applications. Full Workbench smoke checks passed: assigned permissions/comments, stale saves, model/TUPE arithmetic, workbook guards/formula preservation, lifecycle controls and linked-pathway approval invalidation, archive retention/privacy, external-FMT byte-copy/actual facts, private post-bid access/CAS, and mocked authenticated feed sync/withdrawal. Intelligence passed 39 existing domain checks and its feed authentication/publication/provenance/exclusion integration tests. Native deployment status reports success for both Sites.

Browser layout/interaction tests, real separate colleague sign-ins, actual commissioner workbook/Excel recalculation, source-company-data publication and paid AI calls remain owner/designer acceptance tasks. Follow TESTING.md before using a live tender. Audit activity is not time tracking or a writing-quality score.

