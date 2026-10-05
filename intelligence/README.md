# DRPA Intelligence — working example

Owner-private prototype for company KPIs, contract/HJIP assurance, FMT budgeting, evidence and bids. See [the extension handover](docs/CONTRACTS_FMT_ASSURANCE.md) for workflows and production requirements.

## Current status

Performance records, contract obligations, HJIP-style indicators, account balances and budgets are fictional. The earlier DRPA 158-KPI Dictionary is a reference catalogue; definitions require review before activation. Only the structure of the Winchester Financial Modelling Template was used. Its financial amounts were not imported.

Organisation and role selectors preview access for the signed-in owner. They are not production employee, provider or commissioner membership. The current Site remains owner-private.

Working flows: reviewed department/CSV inputs; optimistic approval and audit; configurable KPIs and data fields; readable PDF/DOCX/XLSX/TXT/CSV intake; draft clause proposals; site obligation mapping; frozen and published commissioner packs; explicit FMT monthly profiles; account/tracking mapping; staged balance replacement; reconciliation gaps; cited example answers; editable bid drafts and saved versions.

The read-only Xero adapter is implemented but unconfigured and untested live. Live AI is unconnected. Raw files and pending extracts are excluded from answers. The optional model context includes approved scoped obligations, with FMT data only for finance-authorised previews. Semantic document retrieval and AI extraction remain production work.

## Code map

- `app/workspace.tsx`: dashboard, inputs, questions, bids and previews.
- `app/assurance-workspace.tsx`: contracts, sources, packs, KPI designer and finance.
- `app/api/platform/route.ts`: observations, review, answers and bids.
- `app/api/contracts/route.ts`: obligations, fields, packs, FMT and account imports.
- `app/api/documents/route.ts`: scoped object storage and downloads.
- `app/api/xero/`: read-only OAuth, metadata and monthly balance staging.
- `lib/metrics.ts`, `lib/contracts.ts`: calculation and validation rules.
- `lib/kpi-reference.json`: 158 definitions from the earlier DRPA register.
- `lib/governed-sources.ts`, `lib/assistant.ts`: permitted source context, examples and optional model adapter.
- `lib/file-text.ts`: client-side readable text extraction.
- `lib/records.ts`, `lib/store.ts`: tenant persistence, fixtures and audit.
- `lib/xero.ts`: encrypted tokens, refresh and read-only account/report requests.
- `db/schema.ts`, `drizzle/`: generated migrations; apply in order.
- `.env.example`: empty server secret names and read-only scopes.

## Calculation rules

Ratios and unit costs aggregate underlying counts. A scalar calculated at source, such as a median, uses `method: value`; cross-site aggregation is withheld. The 158-reference library is not an arbitrary formula engine.

FMT actuals are net monthly accrual account balances, not cash movements. One balance is approved per tenant/account/tracking/month. Imports stay pending until review, then replace the existing balance. Zeroes are valid; missing mapped accounts or expected months make a line incomplete. YTD uses an April start. Favourable variance is budget minus actual for costs and actual minus budget for revenue. Unmapped amounts remain outside service contribution.

Monthly budget profiles must be explicit and reviewed. Annual bid prices are not divided by twelve automatically. Ledger imports do not rewrite the separate executive revenue/margin/unit-cost KPIs; implement their approved reconciliation bridge before production.

## Optional connections

Configure server secrets through the hosting secret manager:

```text
OPENAI_API_KEY
AI_MODEL
XERO_CLIENT_ID
XERO_CLIENT_SECRET
XERO_REDIRECT_URI
XERO_TOKEN_ENCRYPTION_KEY
```

Xero's registered redirect must match exactly and end in `/api/xero/callback`. Its token encryption key is a base64-encoded random 32-byte key. Default scopes: `offline_access accounting.reports.profitandloss.read accounting.settings.read`. A tenant is bound to one organisation and tracking category on first sync; consolidation requires an extension. Each provider authorises its own accounts separately. Test refresh, revocation, tracking coverage, signs, zero balances and totals before relying on live data.

The optional model adapter uses structured output, recognised source IDs, a timeout and a basic hourly limit. It is not an evaluated document retrieval system. Provider governance, cost controls, semantic claim checking and injection evaluations remain required.

## Development and deployment

React/TypeScript, Vinext, Cloudflare-compatible APIs, D1 and R2. Use the execution-profile helpers and supervised preview in the managed environment. Elsewhere, configure the profile and bindings and install the locked dependencies. Run `pnpm exec tsc --noEmit`, `node scripts/verify-domain.mjs` and the supplied Site build helper.

Apply generated migrations to local preview storage before testing. Hosting applies production migrations during deployment. Synthetic fixtures initialise on first access; local QA data is not packaged.

The same-origin worker `public/vendor/pdf.worker-6.3.289.min.mjs` is copied unmodified from the locked `pdfjs-dist` dependency with its licence. Copy its matching worker when upgrading the dependency. Serving it as an asset avoids page development transforms running inside the PDF worker.

The `.openai/hosting.json` identifies this private prototype. Create separate infrastructure for a production app. For other hosting, replace D1/R2 and platform identity behind interfaces while preserving permission checks.

## Verification and production completion

TypeScript, 39 deterministic calculation/access checks and browser checks cover the extension; the handover records the exercised flows. No live Xero or model account was connected. Production completion includes verified memberships and commissioner assignments, signed definitions, finance reconciliation, reviewed evidence reuse, scalable parsing/OCR, monitoring, backup/restore, support, customer provisioning and commercial entitlements.
