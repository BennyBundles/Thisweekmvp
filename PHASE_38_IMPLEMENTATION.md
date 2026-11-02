# This Week — Phase 38: Fail-Closed Financial Backup Export Hardening

**Date:** 2026-11-02  
**Repository:** BennyBundles/Thisweekmvp  
**Branch:** `review/thisweek-phase38-secure-backup-evidence-20261102`  
**Deployment:** Review-only. Production `main` unchanged. No banking or money-movement path touched.

## Background and verified evidence

The Phase 36 export function originally selected all browser-local keys beginning with `thisweek.` unless their *key name* contained `auth`, `session`, `token`, `secret`, or `credential`. While sessionStorage was excluded, this prefix-based export could accidentally include a future arbitrary key such as `thisweek.cacheMetadata.v2` or an unexpected credential nested inside a supported JSON value. A broken localStorage read could also yield an incomplete backup without a clear failure.

Independent public documentation describes browser Web Storage as origin-scoped and best-effort. Users can lose stored data under browser eviction, device cleanup, storage pressure, or private-mode lifecycle:
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- https://webkit.org/tracking-prevention/

## Implemented changes

1. **Explicit 12-key export allowlist:** only the known This Week local Plan state, local user ID, UI/power preferences, savings goals, connected-data context, recommendation and scenario state, local analytics, soft caps, and two short-lived local hints can appear in a raw export. Arbitrary future keys are excluded even if they do not contain an obviously sensitive word.
2. **Export/restore symmetry:** the Phase 37 restore validator references that identical allowlist, preventing permission drift between the two operations.
3. **Nested credential screening:** before exporting supported JSON values, the production `scanObjectForSensitiveFieldNames` routine checks credential-shaped properties; flagged values abort file creation rather than placing possible secrets in a downloadable backup.
4. **Storage-read fail-closed:** if storage enumeration fails or any selected local item cannot be read as a string, no backup file is created. The application must not call that a successful export.
5. **Damaged Plan salvage:** damaged raw core Plan strings remain exportable for *manual examination* and are explicitly labeled `dataHealth: core_plan_missing_or_unreadable`. Such an export is **not** proof that automatic Phase 37 restore will succeed. A well-formed minimal Plan receives `dataHealth: core_plan_parsed`, not a completeness or banking certification claim.
6. **Disclosure wording:** the Privacy page now explains the exact-key backup scope, credential/session exclusion and salvage-only status of damaged data.
7. **Adversarial regression tests:** `phase38-secure-export.test.mjs` executes the actual source definitions in an isolated Node VM and tests arbitrary keys, nested secrets, failed reads, salvage labeling, missing Plan, and no session/network access.
8. **CI integration:** existing Phase 35–37 regression suites and all production static/smoke checks remain; PR validation gains one additional test step. Pages deployment remains disabled for PRs.

## Scope and limitations

- This is a *backup export* integrity and disclosure pass, not end-to-end iPhone acceptance. No user data was read, transmitted or stored in the repository.
- The nested field detector is heuristic; it cannot prove a free-text user note lacks a secret. Users must treat downloaded files as sensitive.
- Browser localStorage is not a transactional database. A concurrent change or browser crash can still cause data to be lost between successive reads/writes.
- The `core_plan_parsed` label only means the minimal state shape parsed. Phase 37 restore revalidates the full state.
- A damaged Plan salvage export may contain malformed JSON under `thisweek.state.v2`, and restore correctly rejects it until manual repair.
- Phase 35, 36, 37 and 38 remain **draft, review-only** changes. Merge sequencing is #12 → #13 → #14 → #18, subject to independent review and CI.

## Acceptance criteria

1. Legacy Phase 35–37 tests and all pre-existing production validation stages pass.
2. New source-bound export security tests pass.
3. No GitHub Pages deployment occurs on pull-request events.
4. Production money gate remains closed regardless of test result.
5. On actual iPhone Safari, use *synthetic Plan data* to exercise export and restore and inspect backup in Files (including VoiceOver and 390 px viewport).

## Future pass

Add a verifiable checksum to the raw backup with the native Web Crypto API (SHA-256) and a detached manifest. A checksum detects accidental corruption but is **not** proof of authenticity against an attacker who can replace the file and checksum together. It requires careful compatibility and migration tests before enabling in live browser flows.

Reference: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
