# Phase 53 — Live-byte parity and fail-closed PWA navigation

Date: 2026-11-02 (US Eastern)
Repository: BennyBundles/Thisweekmvp
Scope: Canonical consolidated draft PR #29 only; **no merge or production deployment**.

## Source-grounded threats and actual remediation

1. **HTTP 200 with wrong asset generation:** A network-first navigation previously withheld an invalid response from CacheStorage but nevertheless returned it to the user. Corrected the demo-only worker to serve only the release-verified current cache shell when the network returns a recognizable but SHA-256-mismatching shell. With no valid cache, return `Response.error()` rather than a misleading 200. Equivalently, a first-load manifest/icon with incorrect MIME or bytes now receives `Response.error()`; invalid bytes are never returned to the controlled page.
2. **URL-variant CDN split:** The release verifier previously requested only cache-busted paths. The installing service worker fetches unversioned `/public-preview/`, `manifest.webmanifest`, `icon.svg`, and `sw.js`. The auditor now checks both unversioned and versioned paths, including MIME and byte hashes, and matches both worker bodies to a trusted, locally staged worker SHA-256. Verified scope increases from 21 to **25 HTTP reads** (including release.json), with three offline asset digests enforced in each of two URL variants. The worker script itself is attested independently against the staged build.
3. **Decoded text is not downloaded bytes:** `Response.text()` can decode invalid UTF-8 with replacements, obscuring actual byte sequences. Auditor now reads `Response.arrayBuffer()` exactly once, enforces a bounded byte count and fatal UTF-8 decoding for inspection, and feeds the original bytes into SHA-256 verification. The cache digest is of decoded HTTP entity bytes after Content-Encoding processing, not compressed wire bytes; this matches the worker's `Response.arrayBuffer()` semantics.

## Regression coverage

- Previous PWA lifecycle tests updated for strict reject-or-fallback behavior instead of displaying online login/maintenance pages.
- Stamped-worker simulation now demands a known-good offline shell when CDN HTML bytes drift, rejects invalid first-load shell and manifest, and checks no cache corruption.
- Release auditor tests now cover unversioned shell drift (while versioned succeeds), an unversioned worker mutation, malformed UTF-8 bytes, and bad MIME on a single URL variant; earlier worker trust, CSP, redirect, HTTP, route and migration checks retained.
- GitHub PR validation remains the evidence gate. Record a green test count **only after** validating the exact final commit SHA in Actions.

## Security and availability boundaries

- The worker checks bytes, not publisher authenticity: SHA-256 is not a digital signature. Authenticity additionally depends on HTTPS, trusted GitHub Actions staging, permissions and deployment origin.
- A browser may retain a prior active service worker or clear CacheStorage under storage pressure; offline availability is not guaranteed. The worker has an intentionally closed first-install failure mode.
- Two CDN requests passing one audit do not prove globally atomic publication or all-edge consistency; require physical Safari testing and postmerge repeated live checks.
- A successful deployment audit does not undo assets already published before a postdeployment check fails.
- No personal finances, Supabase writes, real-money provider switches, Vercel production promotion or new permissions are part of this pass. All 11 live-money gates and genuine sandbox receipts remain independent.

## Next independent acceptance

1. Run a 30-case mixed-version matrix with three assets × two URL forms × five drift modes; require all 30 rejections and zero corruption.
2. Run 10 physical iPhone Safari standalone online→offline→update cycles with fictional records, including first-ever install race, version-only CDN drift, Home Screen isolation and storage eviction.
3. Obtain independent cumulative security review of canonical PR #29; keep draft and production locked until reviewed.
4. After approved main merge only, inspect release.json exact commit, worker's trusted staged digest, 25 live HTTP paths and stable repeated CDN observations.

Sources:
- https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
- https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/respondWith
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching
- https://developer.mozilla.org/en-US/docs/Web/API/Response/arrayBuffer
