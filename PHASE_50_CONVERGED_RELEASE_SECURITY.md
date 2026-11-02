# Phase 50 — Consolidated security and UTF-8 release-candidate audit
**Evidence date:** 2026-11-02

## Integration intent
GitHub PR #22 and PR #29 candidates were BOTH independently green but diverged. PR #29 improved Safari raw financial backup restore byte accounting with bounded reusable TextEncoder scratch. PR #22 strengthened the actual deployed GitHub Pages release verifier to require content-addressed worker SHA-256 digests for served preview HTML, webmanifest and SVG icon. Merging PR #29 alone would omit this live release audit.

## Applied convergence
Preserve PR #29 bounded UTF-8 restore implementation and regressions. Import PR #22 tested verify-deployed-release.mjs and verify-deployed-release.test.mjs byte-for-byte into the consolidated draft branch. This combines the two independently green lines without mutating production.

## Security invariants
- Actual hosted shell, manifest and icon SHA-256 must match published worker digests.
- Reject missing worker, wrong MIME, stale CDN shell, changed manifest, modified icon, manual version marker or forged digest.
- Preserve Pages main-only deployment, stale SHA guard, release manifest, CSP hashes and production queue.
- Preserve correct UTF-8 bounded restoration with 16 KiB reusable encoder buffer and byte-safe fallback.
- No automatic production publish, money/provider activation, or paid services.

## Independent validation
- PR #22 SHA 74a8f26699af31d1b30202340f0fdfab9cb8b765: GitHub Actions 41477132322, validate SUCCESS, deploy SKIPPED.
- PR #29 SHA d8c93fc31785325647ed8408015b385b89fe82bb: GitHub Actions 41477585513, validate SUCCESS, deploy SKIPPED.
- **Parent successes do not validate the combined commit.** Run new GitHub CI on exact head; then physical iPhone Safari and independently retrieved hosted artifact tests.
- Vercel Hobby preview automation remains disabled following quota exhaustion. Only controlled preview validation on a single intended project should be considered after quota replenishment.
