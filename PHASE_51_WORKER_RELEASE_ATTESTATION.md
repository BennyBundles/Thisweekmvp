# This Week — Phase 51 Release Worker Attestation

**Date:** 2026-11-02
**Scope:** Existing canonical draft PR #29 (no additional overlapping PR)
**Safety boundary:** Read-only hosted release verification; no main merge or production release.

## Concrete defect found during independent review

The Phase 50 `verify-deployed-release.mjs` checked the served shell, manifest, and icon against SHA-256 digests **declared within the served service worker**, but failed to attest the service worker bytes themselves against the checked-out and staged release artifact.

A malicious or unexpectedly modified `public-preview/sw.js` response could retain the correct `const EXPECTED_ASSET_SHA256=Object.freeze(...)` map and `CACHE_NAME=CACHE_PREFIX+'b...'` marker while appending other executable service-worker code. The previous verifier would accept that worker as long as shell, manifest and icon digests remained correct. This is a self-attestation gap; the worker cannot prove its own authenticity.

**Important distinction:** The trusted GitHub Actions checkout and its local staged `_site/public-preview/sw.js` provide an independent reference for release-integrity checking, unlike the worker's own embedded digest map. This does not create a public-key signature or defend against an attacker who controls the GitHub Actions checkout itself.

## Implemented in canonical PR #29

1. `verifyPublishedOfflineAssets` now requires a trusted, independent SHA-256 and compares the full served worker content to it *before* trusting its embedded asset map.
2. `verifyOnce` rejects missing or malformed expected worker digests before any network requests.
3. `auditDeployment` passes the same expected staged digest through bounded retries; a mismatch never becomes a success merely because the served worker declares valid asset hashes.
4. The production CLI reads the actual `_site/public-preview/sw.js` generated and stamp-verified in the *same Pages deployment job*, derives its SHA-256, and compares the remote-served worker to that local artifact.
5. Added five tests: malicious appended executable code, appended digest-map camouflage, fail-closed missing checksum, malformed checksum and matching genuine staged worker. Existing altered-worker tests now explicitly assert the stronger failure mode.
6. The release smoke checker enforces the trusted local-worker read, digest generation, and fail-closed source checks to detect future accidental removal of the attestation.

## Verified / unverified

**Source changes committed for review.** The prior CI run on Phase 50 does *not* cover the new commits; acceptance requires a fresh exact-head GitHub Actions `validate=success`, `deploy=skipped` receipt. Any superseding commit invalidates earlier exact-head CI conclusions.

No physical iPhone Safari run, live hosted candidate deployment, independent CDN fetch or cryptographic origin signature is claimed.

## Threats not solved

- The post-deployment verifier compares remote worker text interpreted as UTF-8 with the staged UTF-8 worker. Content can be constrained to UTF-8 by MIME and source policy; true raw HTTP-byte attestation could be added as a later bounded improvement, with fixtures updated accordingly.
- An attacker able to change both the repository checkout and the production artifact could recreate the expected local hash. Protect GitHub repo permissions, CI workflows, branch rules and trusted action versions separately.
- An integrity failure *after* publication correctly fails the audit, but does not automatically roll back the deployed Pages artifact. Production deployment still requires independent authorization, incident recovery and physical-device acceptance.
- The verifier does not attest every unrelated route's bytes; it checks their expected markers, production CSP and current release manifest. Those remain separate review areas.

## Release HOLD

No changes to `main`, no merge, no Pages/Vercel deployment, no Supabase or banking writes, and no paid services. This is an incremental hardening of the *single* canonical consolidated PR, not an invitation to restart duplicate release stacks.
