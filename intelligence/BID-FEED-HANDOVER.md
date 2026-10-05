# DRPA Intelligence: governed bid evidence feed

Private source Site: https://drpa-intelligence-engine.sa33dc.chatgpt.site
Master configuration: /bid-evidence
Service endpoint: /api/bid-evidence

The existing owner-private Intelligence application remains a prototype for its wider department/customer role previews. This update adds an actual server master guard and a separate read-only secret for the bid feed. It does not turn preview selectors into production multi-tenant permissions or activate Xero/paid AI.

## Configure

Set `BID_FEED_MASTER_EMAIL` to the exact master sign-in email. Store `BID_FEED_KEY` as a long cryptographically random server secret. The private Bid Workbench uses the same key and this Site's approved service-access credential. These are already configured on the existing private Sites; the source pack intentionally excludes their values.

The master selects allowed non-restricted definitions, sites and reporting month range in `/bid-evidence`, records definition/aggregate-data review and enables publication. Default is unpublished. The published scope is limited to 40 eligible records so there is no hidden pagination/truncation. Use narrow period/site/metric scopes for focused bid evidence. Read-only service calls require Authorization: Bearer key; outer owner-private Site access is separately supplied by its trusted dispatcher credential. Admin calls require the configured signed-in master; the service key never grants configuration or other application access.

`platform_records` stores the versioned `bid_feed_configuration` under the DRPA tenant. The configuration ID is fixed. Existing immutable migrations provide the table; no new table is needed here. Configuration saves check their version and origin.

## Included records

Only observations belonging to DRPA, with approved status, published metric/site/month scope, source references and finite usable counts are sent. A denominator must be positive for ratio/rate/mean. The numeric result is calculated from the selected site-month row. Synthetic/demo/sample records are excluded by seed actor/source/note markers, rather than ID alone: a reviewed real replacement of an existing sample grain can be included after its source, note and actor have genuinely changed. Restricted/Finance definitions, other tenants, pending submissions and missing denominators are excluded.

Records carry source ID, site, period, numerator/denominator and labels, method, unit, value, source reference, observation/definition versions and last update. Individual/free-text observation notes, details and actor names are not exported. Master definition/scope attestation is not sent as bid evidence.

The Bid Workbench begins new/changed records master-only and unverified, and requires local master approval plus optional team visibility. Withdrawn or unpublished records lose drafting approval. Its archive snapshots remain fixed. The bridge is refreshed on demand, not scheduled.

## Checks and portability

After install/build: `node scripts/verify-domain.mjs`, `node scripts/bid-feed-smoke.mjs`, and `pnpm exec tsc --noEmit`. Tests use a synthetic isolated database. The feed test covers service/admin credentials, configuration revision conflicts, private master page rendering, source provenance and exclusions. Actual live-company records must be entered/reviewed before owner acceptance. Browser interaction/layout testing remains to be completed.

The private Sites dispatcher can supply a trusted email without a user ID; the auth helper hashes that email into a stable internal ID. Never trust client-provided email headers on an ordinary public host. Before moving this wider prototype, add a verified identity adapter and server-held role/tenant/site memberships throughout it. Preserve the master-only feed guard and private hosting. No production secret belongs in a browser, exported zip or source control.
