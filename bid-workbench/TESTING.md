# Designer and owner acceptance tests

Run `pnpm typecheck`, `pnpm build` and `pnpm test:smoke` first. Then use `pnpm demo` locally. The sample accounts and figures are synthetic and the paid AI connection is absent.

## Three-user review

1. Open the sample bid as Test Master. Check overview totals, document preview, briefing and question limits. In Users and assignments remove the writer/checker's Q02 assignments.
2. Switch to Test Writer. Q01 remains editable; Q02 is absent. The writer cannot manage people or mark an answer complete. Return to Test Master to restore Q02 assignments.
3. As writer, draft Q01 and send for review. As checker, add a specific comment and an exact quoted replacement. The checker cannot edit the draft or decide the comment.
4. As writer, accept the wording change and confirm it appears in the answer. Add a second comment, reject with a reason, and inspect the decision history. For a general accepted comment, enter its incorporation/verification note.
5. Add an exact suggestion, edit the answer, then try to apply that earlier suggestion. It should require a new current-version suggestion.
6. Complete the model/FMT tests below. Have the checker sign Q01, then the master mark it complete. Change a material answer or evidence input and confirm it returns to draft and needs a new check.
7. Open two windows, make competing edits and save. The older revision should show a conflict and retain its text for export/recovery.
8. Deactivate a test member, reload as that member and verify access is denied. Reset the demo to restore all sample accounts.

## ITT and historic evidence

1. Upload a text-enabled Word/PDF with known questions and limits. Compare the extract with the original, including tables and page references.
2. Edit a detected candidate and import only chosen questions. Reimport the same candidates and confirm existing answers are retained and duplicates blocked. Test a document containing no recognisable questions.
3. Verify the documents. Compare detected deadline, term and budget with the original; record data gap owners, dates and evidence. A high-priority data gap cannot be confirmed without a supporting input record.
4. Upload a historic case study or chat export, review it and approve selected evidence. Ensure unsupported claims do not enter the response prompt.
5. Check unreadable/scanned/oversized and unsupported documents give a clear result without deleting existing work.

## Model, TUPE and FMT

1. The synthetic model has 2 planned nurse WTE, 1 transferred WTE and 1 recruitment WTE. Verify Year 1 staffing £96,750, non-pay £4,000, overhead £10,075, markup contribution £22,165 and price £132,990. With 20% selling-price margin the price is £138,531.25. These are fixture rates, not actual payroll assumptions.
2. Clear an essential cost. Totals must show missing input and sign-off must be blocked. Confirm explicit zeros work. Test unmatched, duplicate, excessive and unverified TUPE records. Check they block approval.
3. Test a small anonymised liability XLSX. Confirm the selected sheet/header, role, hours, pay basis, full-time hours and pension units. Only selected fields enter the model; match each alias to a planned staffing row, then verify terms.
4. Use the sample FMT mapping and validate. Try F1 (formula), G1 (locked) and A4 (merged): these targets must be rejected. Restore the valid map.
5. As writer, send the model for review. As checker, check it. As master, approve it. Validate and export the FMT, then open it in Excel and recalculate. Its F1 summary should be £132,990 and G1 should remain 123.
6. Check the FMT as checker. As master, confirm the recalculation and enter a reconciliation note before approval. Check the resulting confirmed bid facts and workbook link. Changing the staffing model or mapping must clear approval, validation and prior confirmed facts.
7. Repeat on a COPY of the actual current commissioner template. Verify every row/service/grade and year against the original, and independently reconcile all commissioner summary/formula sheets. Do not rely on cached values or suggested row positions.
8. Remove finance assignments and verify a response-only user cannot download workforce originals or see individual payroll detail. They may see approved aggregate bid-writing facts.

## Production access and persistence

Test the deployed environment with real separately signed-in approved accounts. Confirm both the outer private account gate and app membership/assignment checks. On an independent host, test absent, expired, wrong-audience/issuer and invalid-signature Access tokens; client-provided identity headers must not grant access. Refresh and restart to confirm persistence. Test backup, Word exports, costed XLSX, review ZIP and separate original-file downloads. Check role labels, keyboard navigation, tab ordering, error dialogs, narrow screens and browser download behaviour.

Browser layout/interaction QA and a paid AI generation call were not completed in the authoring environment. Activate the secure server key separately, then test one real question for source-supported claims, JSON import, draft/refine/shorten/review behaviour, counts, billing/quota and provider retention settings. Owner acceptance of the actual bid and cost assumptions remains part of this test stage.

## New master controls and archives

1. Confirm only the master sees deletion, archive and private-review controls. Try the direct APIs as writer/checker too; they must refuse access. Type the wrong question/document/bid confirmation and verify no deletion occurs.
2. Delete an assigned question, then check that its assignments/comments/checks are removed and the next available answer opens. Delete the supporting ITT and confirm its linked deadline becomes unconfirmed.
3. Extract dates from ITT, compare with the latest clarification, enter London time and source page, and confirm the overview countdown. Test today, passed cutoff, winter/summer dates and an invalid DST time.
4. Search/filter Studio questions, navigate next/previous at both ends and test an empty match set. Check read-only navigation as checker.
5. Archive the last active bid. The master must still be able to create a bid, open archives and read private feedback. Writers must lose archived assignments/file access. Export/open the archive, restore it and confirm approvals/facts are cleared and new assignments required.
6. Upload a completed file linked to the bid and retain it as global master-only reusable evidence. Delete its originating bid/archive and confirm the retained reusable original remains downloadable by the master. Other unreferenced originals should be removed.
7. Open private post-bid analysis. Verify activity, elapsed review waits and manual delay/context fields. Save constructive feedback/actions and export. Writer/checker workspace, history, backup and APIs must not reveal it. Test a conflicting save by another master; preserve/export local edits.

## Staffing import and completed FMT

1. Import a simple role schedule; inspect proposed sheet/header and explicitly map role, WTE/coverage, salary and employer-cost columns. Deselect subtotal/notes rows. Confirm annual FTE versus total role salary versus hourly pay, and percent versus fraction units.
2. Leave NI/pension/allowance/escalation columns absent. The selected roles should populate with missing prompts and unavailable totals. Zero must remain explicit zero. Test mixed headings/multiple headers by choosing columns manually.
3. Open Whole staffing view, compare grouped roles and WTE/TUPE/recruitment/cost columns, then open a role and edit it. Confirm totals/progress and prior approvals update. Export the CSV.
4. Select externally completed FMT mode. Upload a recalculated copy, add actual summary-cell facts, validate and export. The exported bytes should match the uploaded completed workbook. Blank/error cells are blocked; an actual saved formula value is permitted.
5. Check and approve that FMT without requiring the internal model approval. Confirm the selected actual cell values appear in bid facts. Change a fact mapping or upload and ensure old validation/approval clears. Keep the model progress item independent.

## Intelligence publication and reuse

1. As master, open Intelligence → Evidence library → publish evidence (or `/bid-evidence`). Select definitions, sites and month range, record the review and publish. Test a non-master account and stale configuration revision.
2. Verify sample-only scope yields no records. Submit and independently approve a known aggregate company fixture in Intelligence. Only reviewed records in the published scope should synchronise; pending, other-tenant, restricted finance and individual notes must be absent.
3. In Bid Workbench, synchronise and verify period, counts, calculated value, source and versions. A new extract must be private/unverified. Approve its use and explicitly make it available to assigned members if desired.
4. Re-sync unchanged data: no duplicate or timestamp churn. Change/withdraw a source record or unpublish scope: old approval must clear. Recheck after source changes. Archived snapshots must retain their former evidence.
5. Disconnect/wrong credential, redirect, malformed payload and oversized response must give an error without altering saved evidence. The feed scope is bounded at 40 records; narrow scope rather than silently omit records.
