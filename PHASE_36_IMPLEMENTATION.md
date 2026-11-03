# This Week — Phase 36: Browser-local Financial Data Durability

**Date:** 2026-11-02  
**Target:** iPhone Safari and zero-budget GitHub Pages static planner  
**Branch:** `review/thisweek-phase36-data-durability-20261102`  
**Dependencies:** review and merge Phase 35 exact-release CI (`#12`) before Phase 36.  
**Production money:** remains fail-closed; no provider operations are changed.  
**Core schema:** remains v3; portable schema remains v1.

## Evidence and risk

The current customer Plan, transaction history and preferences are kept in browser localStorage. WebKit Tracking Prevention can remove script-writeable storage after long periods of no interaction; other browsers may evict data under storage pressure, and users can clear website data. No automatic cloud sync or durable remote backup exists.

Primary references:
- https://webkit.org/tracking-prevention/ 
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria

Before this pass, `safeLocalStorageSet` could fail under quota/permissions, but subsequent successful reads incorrectly reset `runtimeStorageHealth.available=true`. `writeState` kept an in-memory copy and continued without immediately alerting the user that a reload could lose changes. An unreadable stored JSON Plan could also be replaced by a new Plan and silently destroy the original raw data.

## Implemented protections

1. Track readable and writable storage conditions separately; successful reads never clear prior write failure.
2. Show a high-visibility, screen-reader-announced warning after an unsuccessful core Plan write or serialization failure. The warning directs users to `#privacy` to export a copy; the app never claims that unsaved data is durable.
3. Automatically remove the failed-write warning after an actual successful core Plan persistence retry.
4. Quarantine malformed stored Plan JSON or future-schema Plan data. While quarantined, `writeState` blocks replacement of the original stored value, preserves the raw data for backup, and displays a recovery warning.
5. Release quarantine only after explicit data deletion that succeeds. The existing verified deletion operation checks its result before releasing quarantine.
6. Fix privacy language: browser storage is *not* a permanent backup.
7. Prevent all sessionStorage values and auth/token/secret/credential-named localStorage keys from entering the downloadable raw backup. Session-scoped bearer tokens must never be copied into exported JSON.

## Source-linked regression tests

- `node --test phase36-data-durability.test.mjs` — **13 tests** for storage success, quota/read failure, volatile fallback, retries, alert deduplication, serialization rejection, malformed Plan quarantine, forward-schema protection and deliberate reset.
- `node --test phase36-backup-security.test.mjs` — **4 tests** for preserving ordinary Plan data while excluding short-lived authentication sessions/credential keys.
- Both test scripts execute a precisely extracted subsection of the **actual production inline JavaScript** using Node's built-in VM; there are no paid dependencies.
- Existing Phase 0 static tests, release smoke, account, provider/money, operations, release-console, and public-preview checks remain required.
- All checks run in the pull request's validation job, not a production deployment.

## What remains unverified

- Real Safari on iPhone 390px viewport (no physical device session was available to this engineering run).
- Download/share-sheet behavior on iPhone including permission cancellation.
- Actual device quota-full conditions and WebKit storage eviction over time.
- Successfully restoring a raw export into the planner; raw backup is emergency evidence, not an automatic import mechanism.
- Live backend/provider release certifications and all 11 required real-money gates.

## Manual iPhone QA (fictional dollars only)

1. Open `https://bennybundles.github.io/Thisweekmvp/public-preview/?mode=demo` in Safari; use the **isolated public preview** so tests do not touch any actual local budget.
2. Confirm no overflow or hidden controls at 390px, and that saving a fictional Plan and a test purchase updates the correct category.
3. Refresh; confirm the persisted test Plan and transaction are unchanged, and that New Week and Browser Back work.
4. Open Privacy & Local Data and export local data; verify the iOS download, export date and fields, and confirm no authentication session tokens are included.
5. Open Device QA and note touch-target, text-size, keyboard and safe-area findings.
6. Test Home Screen installation independently: Safari tab state and Home Screen app state may be isolated; do not assume a Plan transfers between the two.
7. Record screenshots, Safari/iOS version, expected vs actual, and export tests with **synthetic data only**.

## Security/non-goals

- No real banking money transfer, provider onboarding, external webhook, Auth enrollment, production token, migration or Supabase table change.
- Browser-local financial exports are sensitive even when auth tokens are omitted. Do not commit or publish a user's export to GitHub.
- Quarantine is deliberately fail-closed. If recovery is impossible, user must manually decide whether to delete the damaged data, after making a backup.
- Do **not** promise browser storage can never be evicted or that the app automatically saves to a cloud service.
