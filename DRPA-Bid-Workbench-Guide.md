# DRPA Bid Workbench — user and testing guide

Private workbench: https://drpa-bid-workbench.sa33dc.chatgpt.site

The workbench brings ITT documents, questions, reusable experience, drafting, comments, staffing, TUPE, financial-model completion and post-bid learning into one workflow. The live Site remains restricted to your account. No colleague has been invited automatically.

## People and permissions

In **Users and assignments**, add the person's exact sign-in email, name and role, then assign individual questions or sections for each bid. Real colleagues also need access in the private Site sharing settings. Registering their email in the app does not change that outer access gate.

| Role | Access |
| --- | --- |
| Master user | All bids; users and assignments; evidence feeds; deletion and archiving; final approval; private post-bid review. |
| Bid writer | Edit assigned questions/sections, submit drafts, accept/reject comments and record incorporation. |
| Bid checker | Read assigned work, add comments or quoted suggestions and check the current version. |

Checkers cannot edit drafts. Writers cannot delete bids/questions/documents or make final completion decisions. Finance/workforce originals require a model/FMT assignment. Response writers receive the approved aggregate financial facts. Reusable evidence marked master-only is hidden from other users. Inactive accounts lose application access.

## Start and manage a bid

1. Create the bid using the plus beside **Active bid**.
2. In **ITT documents**, upload its invitation, specifications, question schedule and clarifications. Review text against originals before verifying it. Word, text-enabled PDF, Excel and text formats are supported; scanned text needs a checked text extract or OCR elsewhere.
3. Extract question candidates, edit references/wording/count limits, select the required questions and import. Existing answers are retained and duplicate references blocked. Compare with the submission portal so complex tables or attachments are not missed.
4. Use **Submission deadline** in ITT or Overview. Choose a detected candidate, confirm the latest submission date/time in London and record its source page or clarification. Dates are suggestions until confirmed. You can amend them when the tender changes. Overview displays days left and identifies the actual cutoff passing; it updates each minute.
5. Open **Bid briefing and data** for detected scope, term/budget excerpts and suggested inputs that would strengthen the bid. Assign gap owners and dates, then record supporting information before confirming them. This briefing uses local extraction rules and requires original-document verification.

Master deletion controls require typing the exact question reference, document name or bid name. Deleting a question also removes its assignments/comments/checks. Deleting the ITT supporting a deadline makes that date unconfirmed. Deleting a bid removes its unreferenced originals and bid-specific review records. Reusable files or files retained by another archive are preserved. Export a backup first when a copy is required.

## Import and view staffing

In **Service model and TUPE → Staffing**, use **Import staffing XLSX**. Select the establishment worksheet, header row and columns. Review the proposed mappings, capacity basis (WTE or required weekly coverage), salary basis (annual per FTE, total annual role cost or hourly pay), percentage units, full-time hours and paid/productive weeks. Deselect subtotal and notes rows before confirming the import.

Selected roles are appended to the establishment. Missing pay, allowances, employer NI/threshold, pension, other cost and escalation inputs remain blank and are flagged; they are not silently treated as zero. Enter explicit zero where checked. Formula values imported from Excel are saved values and must be checked against the source workbook. Original staffing uploads are restricted to assigned model/FMT users.

**Whole staffing view** groups roles by service and shows the complete establishment, WTE, transferred WTE, recruitment and annual costs on one page. Select a role to open and change its individual profile. Export the overview as CSV.

Describe service pathways and assumptions, and enter recurring, mobilisation and capital/non-pay costs. Confirm overhead and margin versus markup. These are your planning assumptions; the tool is not a payroll engine.

For **TUPE**, map included anonymised records to planned roles. Transferred WTE offsets recruitment rather than adding to the establishment twice. Confirm pay basis, hours, pension units and liability terms. Excess, unmatched, duplicate and unverified records block model sign-off. Keep individual names/contacts out of reusable evidence.

## Complete the financial model / FMT

Choose one of the workflows in **Financial model / FMT**:

- **Map the service model into an FMT:** upload the current commissioner workbook, map outputs to the correct input cells/year, verify targets, validate and export. Suggested template rows need checking against the actual service and grade. Formula, locked, merged, text and duplicate input targets are blocked. Complete model approval, reopen the exported XLSX in Excel, recalculate and reconcile its summaries before final FMT sign-off.
- **Upload an externally completed FMT:** upload the workbook after saving recalculated values in Excel. Add and verify the aggregate staffing/financial summary cells that should control bid answers. Validate and export an exact copy. The server reads actual uploaded values and blocks blank/error/invalid cells. Internal service-model approval is not a prerequisite in this mode. Current-version checking and master recalculation/summary-review confirmation still apply.

The app does not calculate Excel formulas. The master records the financial-summary review and marks the FMT complete after the current check. Approved workbook facts then enter the answer prompts. Changing the model, workbook or mappings clears affected approval/facts. The service-model progress item remains separate when an external FMT is used.

## Reusable evidence and company intelligence

Only the master adds reusable documents, selected chat extracts and company feeds. In **Reusable evidence**, upload or paste relevant material, check its source/date and approve only suitable facts. Earlier bid promises and chat suggestions require delivery verification before they support claims of experience. The tool cannot automatically read all your other ChatGPT chats.

The private DRPA Intelligence bridge is configured. Open **Choose published company data**, or https://drpa-intelligence-engine.sa33dc.chatgpt.site/bid-evidence. As master, choose metric definitions, sites and reporting month range, record the aggregate-data/definition review and publish the scope. Then return to Bid Workbench and **Synchronise feed**.

Only approved DRPA aggregate records with source references and usable source counts are included. Sample/fictional data, pending submissions, other tenants, restricted finance metrics and individual notes/details are excluded. No sample figures are activated as bid evidence. Until a reviewed scope with real company records is published, the feed can be empty.

New or changed extracts start master-only and unverified. Each carries site, reporting period, counts, source, observation/definition versions and retrieval time. Verify before approval. **Available to assigned team members** separately controls whether colleagues can use/read it. Unchanged re-syncs do not duplicate records; changed or withdrawn records lose approval. Refresh is on demand. Narrow published scope to 40 records or fewer; the complete feed must fit the current evidence capacity.

Use **Completed bid files** to attach final response packs/workbooks to their originating active or archived bid and retain them for future reuse. Files start master-only. ZIP archives are catalogue entries; import a checked individual document/extract to establish evidence.

## Draft, review and finish answers

1. In **Response studio**, enter exact wording/criteria, word or character limit and counting choices, style, delivery input and approved experience.
2. Search and filter questions by status or absence of a draft. **Previous/Next** move through the filtered questions; the chooser opens a specific question.
3. Write the first draft or use **ChatGPT companion**: copy the prepared prompt into ChatGPT and bring the structured result or answer back. Confirmed finance facts, DRPA rules and approved sources travel with it.
4. Send for review. Assigned checkers add comments and exact quoted replacement suggestions. Writers/master accept or reject with a decision record. An exact replacement is applied only if the reviewed text/evidence still matches; other accepted comments need an incorporation/verification note.
5. Tighten the response and resolve gaps/count issues. Every assigned checker checks the current version; with none assigned, the master records the check. The master marks the answer complete after financial-model approval and resolution of blocking checks/comments.
6. Editing material answer/evidence/model inputs reopens affected work. Export Word and check the actual portal's final count.

Direct AI drafting still needs secure server API activation. No paid API key is configured. ChatGPT companion is available now; API usage is separate from your ChatGPT subscription.

## Progress, submission and archives

Overview gives each approved answer plus four sections equal weight: verified ITT with confirmed deadline, confirmed required data, approved service model and approved FMT. Open/unincorporated section comments prevent completion. The bar measures workflow completion, not time spent or scoring.

Master **Record submission** stores the actual portal confirmation time in London and a reference/note once answers/FMT are complete. It does not submit to Atamis or another portal.

Master **Archive bid** retains a fixed snapshot, documents and review metadata outside the active list, with a reason/outcome. Use **Archived bids** to search, open and export it. Archives and their originals are master-only. **Restore for review** returns it to the active list, clears approvals/confirmed facts and removes previous assignments; reassign and check the work. Archiving the last active bid still leaves creation, archives, evidence and private analysis available.

## Private post-bid analysis

Only masters can open or save **Private post-bid analysis**, for active or archived bids. It is excluded from team workspace data and ordinary answer packs.

The view supports outcome and commissioner feedback, recorded contribution/activity counts, first drafts and review handovers, elapsed review waits, comment decisions, reopenings and confirmed deadline/submission timing. Add context for delays, what went well, how work could be quicker, use of the system and constructive support for individual contributors. Agree actions with owners, dates and completion status. Export this review separately when appropriate.

Saved events are not hours worked or a measure of writing quality. Earlier/offline work may be unrecorded; investigate context before attributing delays. Feedback remains private and is not emailed automatically. Separate revision checks protect competing master edits.

## Designer handover and tests

The combined developer pack includes Bid Workbench and the Intelligence feed source, locked dependencies, migrations, compiled applications, deployment examples and acceptance checklists. It contains no runtime secrets, databases or repository credential. Selected DRPA historical extracts are confidential.

This is a server application. Uploading HTML alone cannot provide private accounts, database persistence, file uploads or permissions. Your designer can install Node 22.13+ and run `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm build`, `pnpm test:smoke`, then `pnpm demo` in the Bid Workbench source. Open http://127.0.0.1:4180/demo-login on their own computer for synthetic Master/Writer/Checker accounts. Do not deploy that sample login as production identity.

Independent hosting needs verified accounts, a database and private object storage. The supplied Bid Workbench adapter verifies Cloudflare Access JWTs; the Intelligence prototype needs an equivalent trusted identity boundary if moved to another host. Reconfigure read-only feed secrets privately. Real members need both the outer access gate and their assignments.

TypeScript/build, Worker/database/file permission and lifecycle tests, workbook/fact checks and private feed tests passed. Browser layout/interaction QA, real colleague sign-in and actual Excel/portal acceptance remain in `TESTING.md`. Paid AI calls have not been tested.

## Persistence and capacity

Clean views refresh about every 20 seconds. Competing saves are blocked, leaving unsaved text available for export/recovery. The app supports shared review and assignments rather than simultaneous keystroke editing.

Backups/export packs retain answers/extracts and review metadata; originals and private post-bid analysis require their separate exports. A workspace JSON alone does not recreate originals, users or comment tables. Backup restoration downloads current active data first, requires RESTORE confirmation and resets verification/approval; archived bids stay available.

Current limits: 20 active bids, 80 questions per bid, 60 document/evidence extracts, 12 answer versions, 150 establishment roles, 250 TUPE rows and 15 MB per original. Extracts are limited to 120,000 characters and shared active JSON to 1.7 MB. Larger portfolios need indexed document/answer storage. Archive completed bids and keep extracts focused. The initial historical bid is context, not a complete current ITT or approved submission.
