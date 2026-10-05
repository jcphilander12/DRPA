# DRPA contracts, FMT budgeting and commissioner assurance

Implementation handover · 1 October 2026

The private example now connects contract/HJIP mapping, site reporting, service budgets and commissioner assurance. It extends the earlier dashboard and bid studio with a working review path. Operational and financial figures are fictional; live accounts, current signed requirements and external commissioner identities need onboarding.

FMT means **Financial Modelling Template**, following your clarification.

## Implemented scope

| Area | Working capability | Boundary |
| --- | --- | --- |
| Contracts and HJIPs | Source register, readable extraction, clause proposals, reviewed KPI mappings | Current signed contracts and official HJIP returns are not loaded. EX-HJIP codes are illustrations. |
| Site views | Result, contract target, owner, source version and frequency | Mapping must match the real population, timing and formula. |
| KPI expansion | Reference catalogue, custom definitions and additional typed fields | Complex statistics require validated upstream calculation. |
| FMT budgets | Service lines, baseline references, monthly profiles, monthly and April-start YTD variance | Real workbook amounts and inferred allocations are absent. |
| Accounts | Account/tracking mappings, pending balances, approval replacement, reconciliation gaps | Reconcile to the accounting source before reliance. |
| Xero | Read-only OAuth and P&L adapter, encrypted refresh tokens | Credentials, consent and live tests are outstanding. |
| Commissioner | Frozen selected indicators, reviewed evidence/actions, publication and export | Owner role preview; independent external sign-in is not implemented. |
| Questions and bids | Cited rule examples, permitted obligation/FMT model context, draft editing/versioning | Live AI and semantic document retrieval remain unconnected. |

## Sources used

The earlier `DRPA_Secure_KPI_and_Bid_Evidence_Tracker.xlsx`, sheet `KPI Dictionary`, supplied 158 reference definitions. Codes, descriptions, calculations, numerator/denominator wording, suggested targets, ownership, source and evidence guidance are preserved. References do not automatically activate or establish signed thresholds.

The Winchester 2026–27 FMT informed Staff Pay, Non-Pay Clinical, Staff Related Non-Pay, Facilities, Other Overheads, Escort & Bedwatch and revenue groups. It also contains service/provider/role/grade, WTE and multi-year structures. Those detailed calculations need a reviewed workbook mapping and approved monthly profiles before automatic import. Its actual financial values were not embedded in source or demonstration records.

## Contract, HJIP and bid files

1. Register the agreement, commissioner, service, site, source reference, version and effective dates. Use a distinct contract version when the signed schedule changes.
2. Select Contract, HJIP or Bid commitment as the source purpose. Upload PDF, DOCX, XLSX, TXT or CSV, or paste a focused reviewed extract. The original remains scoped internal material.
3. Review extracted text. Spreadsheet output preserves sheet/cell references but does not recalculate formulas. Scanned PDFs need OCR or reviewed transcription.
4. Run clause proposal extraction. The current engine uses text rules and can miss tables, cross-references and footnotes. Every proposal remains a draft.
5. Map to a governed KPI. Confirm code, clause, exact excerpt/version, population, exclusions, numerator, denominator, target, amber threshold, reporting timetable, owner and attribution.
6. Approve after source review. Approved site-month observations populate the obligation view using the contract target. Pending data and draft mappings do not become achieved results.

Reconcile any interim Manston per-shift interpretation to the signed schedule and commissioner clarification. Do not infer an enduring fixed per-role or session commitment. A bid promise is not proof of historical achievement and requires commercial/clinical approval before it becomes a delivery commitment.

Uploads are limited to 5 MB; extracts to 100,000 characters; PDFs to 120 pages; spreadsheet sheets to 5,000 rows, with Office decompression limits. Larger sources need a production queue with classification, OCR, malware scanning, retry status and review. Stored files are not automatically reusable bid evidence.

## Expanding KPIs and data points

The board preview can search the 158-definition catalogue, review a reference and activate a unique definition, or create its own. Definitions capture owner, version, source, unit, site scope, formula and thresholds. Reference percentage targets convert from fractions to displayed percentages: 0.98 becomes 98%.

Calculation modes are sum/direct count, percentage ratio, rate per 1,000, weighted mean/unit cost and reviewed site-period value. Ratios use combined counts. A median, annualised ratio or special statistic can be supplied as a validated source result; it does not roll up across sites. Implement the event-level calculation separately before claiming the engine computes that statistic.

Additional text, number, date and choice fields have a controlled key, label, optional choices, required flag and measure scope. They appear on input forms and CSV templates, persist through approval and remain inspectable in source detail. Adding a field does not automatically make it a reporting dimension or change a formula.

Changed meaning requires a new definition ID. Published snapshots retain original results. Production should add effective dates, retirement, calculation implementation versions, corrections and formal definition approval.

## FMT and accounts

Compare the **approved monthly FMT profile with approved accrual account balances mapped to the same service and cost line**.

Finance records each line against the approved FMT version and cell/row reference, then enters its monthly profile. Do not infer equal monthly allocations from annual costs: mobilisation, staffing changes and income recognition can vary. Keep the bid model baseline and revised operational forecast separate where needed.

Map account code plus tracking option to one service line. Reliable service tracking in Xero is essential. Untracked costs remain unallocated or need a reviewed allocation rule. Mapping one balance to several services without an allocation basis would double count it.

CSV columns are `accountCode`, `accountName`, `tracking`, `period`, `amount`, `reference`. Each row is one net accrual monthly balance. New balances are staged. The previous approved balance stays in use until review; approval replaces it. A newer staged import supersedes an older pending replacement. Concurrent approvals check the stored version.

Positive variance is favourable: budget minus actual for costs, actual minus budget for revenue. Explicit zero is valid. Missing budgets or mapped balances are withheld. April-start YTD requires every expected month and mapped account. Unmapped amounts are disclosed separately and excluded from service contribution. Contribution is not statutory profit and excludes unresolved allocations.

The adapter reads Xero connections, Accounts, TrackingCategories and an accrual monthly Profit and Loss report. It excludes subtotal rows and joins account IDs to codes. The user selects organisation, category, service option and month. First sync binds the platform tenant to one accounting organisation and tracking category. Consolidation requires a separate grain and reconciliation design. Sync is manual in this example.

Configure server secrets `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REDIRECT_URI`, `XERO_TOKEN_ENCRYPTION_KEY`. The registered redirect ends in `/api/xero/callback`. The encryption key is a base64-encoded random 32-byte key. Default scopes are `offline_access accounting.reports.profitandloss.read accounting.settings.read`; `XERO_SCOPES` is an optional configuration override.

OAuth uses state, PKCE, expiring records, an HttpOnly secure cookie, AES-GCM token storage and version-checked refresh. Connections belong to tenant and owner. The adapter does not write to Xero. Before reliance, test consent, refresh, revocation, rate limits, signs/credits, explicit zeroes, tracking coverage and totals in an authorised test organisation. Production should enforce the read-only scope allowlist, scheduled connector jobs, retained reconciliation snapshots and operational monitoring.

Balances feed FMT views and permitted question context. They do not overwrite separate executive revenue, margin, receivables or cost-per-hour observations. Define an approved reconciliation bridge; receivables and delivered hours require additional sources.

## Commissioner assurance

1. Site or clinical staff choose approved indicators for a reporting month and write the reviewed summary and limitations.
2. The engine freezes results, targets, definition versions, evidence commentary, exceptions, attribution and action details into a draft pack.
3. A director or clinical reviewer attests to contents and sharing scope. Action-level exceptions and missing results need an action, owner and due date.
4. The commissioner preview sees published packs for its assigned site, can search packs/filter status and export a printable HTML review pack.
5. A correction needs a new version; published results do not change with the current dashboard.

New packs record included and total approved obligations. Excluded indicators do not count as achieved. Original contracts, bid files, raw accounts and internal extracts are excluded from commissioner responses; reviewed aggregate evidence commentary is selected for sharing.

This owner-private Site does not invite a real commissioner. Production needs verified identity, commissioner-to-contract/site assignments, disclosure rules, access expiry/revocation and agreed definitions, deadlines and assurance expectations. Commissioners can filter the selected published indicators. Saved personal reporting preferences and an indicator-request workflow are future extensions.

## Questions and bids

A finance preview can ask “What is the FMT budget variance this month?” and receive reviewed source summaries. Clinical/bid previews do not receive finance context. Approved scoped obligations are also available to the optional model adapter. Raw uploads and pending extracts remain excluded.

The bid studio produces illustrative drafts from sample-approved evidence, supports editing, word limits and saved versions. Live model drafting is unconnected. Production retrieval should map each section to the specification, scoring criteria, approved claims and permitted reuse. Requirements and future commitments must be distinguished from historical evidence. Operational, clinical and finance owners review their facts and commitments before director sign-off.

A complete bid engine also needs claim-to-source links, freshness, reuse permissions, collaboration and buyer-format export. Text extraction and recognised citation IDs do not establish semantic correctness.

## Selling selected modules

Keep shared application services with separate organisation data and server-enforced entitlements.

| Package | Customer receives | DRPA information excluded |
| --- | --- | --- |
| KPI/performance | Their definitions, inputs, dashboards and approvals | DRPA results and strategy |
| Contract/HJIP assurance | Their sources, mappings, actions and commissioner packs | DRPA contracts and relationships |
| Evidence/bid studio | Their approved evidence and drafting workflow | DRPA proprietary bid library and promises |
| FMT/Xero | Their models, mapping and authorised accounts | DRPA costs, pricing and assumptions |

The customer demonstration uses separate tenant records and a restricted catalogue; finance is unlicensed there. Production must derive tenant and entitlement from membership, rather than owner preview selectors. Apply checks to every API, download, search, model context, export and background job.

Add customer provisioning, branding, subscriptions, metering, support access, offboarding and data export/deletion rules after internal validation. Configurable templates should not transfer DRPA documents or intellectual property by default. Cross-provider benchmarking needs separately designed consent and anonymisation.

## Acceptance sequence

Pilot one service with its current signed contract/HJIP guide, approved definitions, FMT/monthly profile, account/tracking map and evidence-sharing requirements. Confirm owners and attribution. Then implement real staff and commissioner membership, reconcile against independently prepared returns and accounts, test authorised Xero, and implement required file/evidence processing and evaluated model workflows. Follow with monitoring, restoration tests and access lifecycle checks before commercial provisioning.

Verification covers TypeScript, 39 deterministic calculation/access checks (`node scripts/verify-domain.mjs`) and browser workflows for clause proposals, reference activation, extra fields, approval, pack publication and finance replacement. PDF, DOCX, XLSX and TXT source intake was exercised with fictional fixtures, and an FMT question returned cited approved balances. The synthetic staff replacement was verified as one approved ledger record, with unallocated amounts separate. Live Xero, model responses, production identity isolation, OCR, security and recovery testing remain outstanding.

References: [Xero scopes](https://developer.xero.com/documentation/guides/oauth2/scopes), [Xero reports](https://developer.xero.com/documentation/api/accounting/reports), [official Xero guidance](https://github.com/XeroAPI/xero-prompt-library/blob/main/python/SKILL.md), [PDF.js](https://mozilla.github.io/pdf.js/examples/index.html).
