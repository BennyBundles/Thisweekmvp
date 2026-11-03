# This Week — Phase 37 Verified Local Restore

**Date:** November 2, 2026  
**Target:** iPhone Safari, GitHub Pages, browser-local weekly Plan  
**Dependency:** Draft PR #12 (release integrity), then PR #13 (storage and backup durability), then PR #14.  
**Production:** Unchanged. No real-money provider access enabled.  
**Cost:** No new paid dependencies; Node 22 built-in regression tests.

## The researched problem

This Week allows manual JSON exports of browser-local data but previously had **no supported import/recovery operation**. A user who exported a backup from one device could not simply recover it after data loss.

WebKit's Tracking Prevention documentation describes conditions under which script-writable storage can be deleted after periods without website interaction; localStorage can also fail due to quota or privacy settings. A downloadable backup is useful only if its contents can be validated and recovered without replacing existing user data or exposing session credentials.

References:
- https://webkit.org/tracking-prevention/
- https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- https://developer.mozilla.org/en-US/docs/Web/API/File_API
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API

## Delivered in source

In `index.html`, new recovery primitives:
- `validatedRawLocalBackup` validates the precise `thisweek.local-data-export` v1 envelope and supported core v1–3 Plan schemas.
- Only explicit, safe local app keys are accepted. `sessionStorage`, Auth, credentials, and unknown keys cannot be restored.
- The user ID in the envelope must match the financial Plan; financial amounts must be safe integers in cents; weekly dates, category/bill ledgers, and transaction structure are validated.
- Prototype-poisoned and secret-bearing JSON data is rejected, including optional settings.
- `inspectRawBackupRestoreTarget` fails closed when any existing This Week browser data or recovery quarantine exists. No merge or overwrite mode exists.
- `restoreVerifiedRawLocalBackup` writes a verified raw backup to an empty workspace, core Plan last. Every write is read back. If any write fails, it removes the newly added keys; if rollback cannot be verified, it quarantines further Plan writes and issues a warning.
- The Privacy & Local Data page now offers an explicit JSON file picker, verification summary, typed `RESTORE` confirmation, a native confirmation prompt and a reload only after verified success.

This is **not** an automatic cloud backup, portable normalized JSON importer, transaction reconciliation, or live banking integration. The normalized `thisweek.portable` schema remains export-only for the moment.

## Strict guardrails

1. Import file limit: 4 MiB; only nonempty .json files can be previewed.
2. All validation is local. No upload, fetch, third-party service or cross-origin request is required.
3. Existing data is never silently replaced. The user must deliberately prepare a new empty workspace and export anything present before deleting.
4. A restore failure may be rolled back, but browser storage is not a transactional database and interruption or another tab may prevent perfect rollback guarantees. Never claim durable atomicity.
5. Raw backups contain sensitive amounts and transaction details; do not attach them to GitHub issues or put them in a public repository.
6. An installed Home Screen web app and Safari tab can have distinct storage behavior. Verify the specific target before relying on recovery.
7. The release remains blocked behind a draft PR; no tester should enter production banking credentials or real money.

## Automated verification

`node --test phase37-verified-restore.test.mjs` exercises extracted production restore functions, not a separate implementation. Cases cover:
- valid schema, week/transaction summaries and a full export→restore synthetic round trip;
- exact storage values, reject unknown keys, reject Auth tokens and session data, and refuse portable snapshots;
- reject forward-schema states, corrupt JSON, mismatch between Plan/user ID, invalid amounts and dates, poisoned object properties and credential-shaped values;
- refuse any populated existing workspace or quarantine;
- successful rollback after quota failures, write-after-throw behavior, and fail-closed quarantine if rollback itself fails;
- offline-only operation and accessible, explicit confirmation UI wiring.

Existing Phase 35, Phase 36 and legacy app smoke tests remain mandatory; the Pages deploy job is skipped for pull requests. This does not replace real iPhone Safari end-to-end acceptance.

## Manual iPhone acceptance checklist

Use a *synthetic Plan*, not any real bank or personal financial data.

1. On an isolated fresh browser profile, enter a fictional weekly Plan and synthetic spending.
2. Open Privacy & Local Data → Export raw local data. Save the JSON securely in Files.
3. Inspect the file: it should include local financial data but no authentication session values.
4. Preview the backup using the new Restore section. Check the counts, schema and rejection reasons; there should be no changes yet.
5. Export and deliberately clear the synthetic workspace after confirming that the backup is safely saved.
6. Choose the JSON again, type RESTORE, confirm, and check that the recovered Plan and transaction totals match after reload.
7. Verify wrong-format, corrupt JSON, unknown key, nonempty workspace and oversized-file rejections.
8. Test file picker, download/share sheet, safe-area input, VoiceOver, reduced motion, Safari tab reload and Home Screen app independently.
9. Document iOS/Safari version, actual vs expected results, any screenshots and observed storage behavior.

## Release ordering and remaining blockers

- Merge/review **#12 → #13 → #14**, in that order, only after independent approval. These are currently drafts and no production deploy from this pass is claimed.
- Post-merge verify exact GitHub Pages release identity and interactive iPhone acceptance.
- Supabase Stage 34 production money still requires the real current candidate, provider evidence, rollback/incident drills, approval evidence, legal/risk policies and verified notifications. No fabricated completion.

## Future R&D

A future iteration may add a portable-schema mapper with formally proven migrations, a preview-only diff, and a browser backup integrity checksum. Never automatically import normalized data into a live current Plan or treat browser storage as a durable bank ledger.
