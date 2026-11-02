# This Week — Phase 56: Trusted Full-Route Live Byte Attestation

**Date:** 2026-11-02 (US Eastern)  
**Repository:** BennyBundles/Thisweekmvp  
**Scope:** Consolidated Draft PR #29, review-only development, $0 incremental expense.  
**Verified exact source SHA:** `3d5def5c0c1f533e0a8b4bed8237101f63ff4a13`  
**Exact GitHub Actions run:** [41487657214](https://github.com/BennyBundles/Thisweekmvp/actions/runs/41487657214)

## Threat model and concrete finding

The previous release auditor validated all 25 HTTP probe responses using identity text, certain MIME restrictions, CSP hashes, and the PWA worker's exact SHA-256 asset map. However, most **non-PWA pages and JavaScript** were not bound to trusted local build hashes. An outdated or modified but marker-preserving `/money-lab/app.js` or Support page could pass the existing audit.

The solution binds *every approved production route* to the exact bytes of the independently staged Pages deploy artifact before any URL is fetched. No manifest served by the CDN is used as its own trust anchor.

## Implemented production-path changes

- Added a fixed `STAGED_ROUTE_FILES` map for **20 approved static asset routes plus `release.json`**, including all Money Lab, Account, Operations, Staff, Support, Legal, root shell, and four standalone-preview files.
- Added `loadStagedRouteDigests()` using `lstat` (rejects symlinks/non-files) and SHA-256 of raw staged file bytes. Requires every file to be nonempty and at most 2,000,000 bytes; requires exactly the approved routes.
- Added `requireTrustedRouteDigests()` validation that rejects incomplete, additional, missing, or malformed digest entries before the release verifier fetches any URL.
- Modified `verifyOnce()` to validate every read-only HTTP response against its own independently staged hash, including both cache-busted and unversioned offline URL variants. Existing fatal UTF-8 parsing, redirects/MIME, CSP, worker attestation and release.json semantic checks remain enforced.
- Wired the independent staged SHA-256 map into the *actual* GitHub Pages postdeploy CLI from local `_site`. The trusted worker digest must also agree with the corresponding all-route digest.
- The auditor still performs **25 HTTP requests per attempt** but now checks **21 unique trusted route SHA-256 identities**. It additionally enforces three PWA dependency digests within the trusted worker for each of the two asset URL variants.

## Regression and integration tests

- Added deterministic tests proving a wrong but recognizable Money Lab JavaScript file, Support HTML and release.json are rejected on original byte mismatch, even when their expected markers and commit identity remain.
- Added tests for missing/extra/malformed expected-digest entries, requiring fail-closed before any network request.
- Added staged-file fixture tests for 21 real files and symlink refusal.
- Extended actual Vercel-preview-versus-Pages-local-staging test to calculate the full trusted digest map from the **same complete locally staged Pages artifact** and compare every route hash with the actual file bytes, including `release.json`.
- Independently repaired a regression in preview-build rollback cleanup: a completed successful build now removes the old rollback directory; a failed rollback still retains the sole old artifact rather than silently destroying it.

## Immutable GitHub verification receipt

At SHA `3d5def5c0c1f533e0a8b4bed8237101f63ff4a13`, GitHub Actions run `41487657214` completed:
- `validate`: **SUCCESS**.
- **15 Node test suites; 285/285 tests passed; 0 failures**.
- `deploy`: **SKIPPED**, as required on a pull request.
- This is the tested code revision. This documentation-only commit is a later immutable revision and must not be misrepresented as tested until its own Actions run passes.

## Limits and deferred acceptance

1. The trusted hashes authenticate a comparison to **the local protected staging artifact**. They are not a digital signature, and a compromised build workflow can still stage malicious bytes.
2. A successful audit observes 25 successful HTTP probes at one place/time, not an atomic publication guarantee for every CDN edge. Post-deployment failure may be discovered **after** publishing and does not automatically roll back the site.
3. Node tests and staging parity cannot prove iOS Safari Home Screen lifecycle, cache eviction, local Plan preservation, share/download functions, or actual device memory/latency.
4. The preview PWA remains demo-only with isolated synthetic state; it is not evidence of financial provider readiness, real-money account correctness or atomic multi-tab ledger transactions.
5. Do not merge Draft PR #29 without independent cumulative diff review and physical Safari acceptance. Production main remains unchanged; financial provider certification (11 gates, genuine sandbox receipts) is separate.

## Next bounded R&D pass

- Design a two-snapshot release verification algorithm that repeats direct and cache-busted asset checks after a propagation interval and retains release evidence with exact commit and artifact hashes, without claiming global CDN convergence.
- Audit production CSP timing and service-worker registration against actual iPhone Safari.
- Run ten physical iOS online → offline → upgrade → restore cycles using fictional data only, exercising UTF-8 boundaries, first-install CDN races and Storage eviction.

## Technical sources

- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pages publishing artifact](https://github.com/actions/upload-pages-artifact/blob/main/README.md)
- [MDN Response.body](https://developer.mozilla.org/en-US/docs/Web/API/Response/body)
- [MDN Readable Streams](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams)
