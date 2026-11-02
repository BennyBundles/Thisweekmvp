# This Week — Phase 46 Content-Addressed PWA Cache Generation

**Date:** 2026-11-02  
**Branch:** `fix/thisweek-phase46-content-addressed-offline-20261102`  
**Scope:** review-only, $0 budget, no production publish.

## Source-bound defect

Phase 45 fixed destructive same-generation cache writes, but its checked-in `public-preview-sw.js` still identifies the offline snapshot with a manually managed `v4` literal. When the shell, manifest or icon changes without manually bumping that literal, the browser may install changed worker code while continuing to serve valid-but-old offline application HTML. If only the shell changes and the worker script bytes remain unchanged, the browser may not install an updated service worker at all. Cache identity must follow application artifact content, not developer discipline.

Relevant external references:
- https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
- https://developer.chrome.com/docs/workbox/service-worker-lifecycle
- https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil

## Implemented

1. Add `stamp-preview-service-worker.mjs`, a deterministic dependency-free Node 22 CLI. It hashes, in labeled length-delimited order, the exact **staged** standalone shell HTML, webmanifest, icon and service-worker source using SHA-256. The generated worker replaces the unique template v4 cache literal with `this-week-public-preview-b<sha256>`. Different actual shell/manifest/icon/worker bytes produce different cache names.
2. Add fail-closed `--verify` mode. It recomputes and byte-compares the expected worker against the staged artifact. Missing/empty inputs, an absent/duplicated marker, or any post-build mismatch returns a nonzero exit code.
3. Wire the same stamp + verify procedure into the Vercel preview builder `stage-preview.mjs` **before** its asset hash manifest and route checks.
4. Wire the identical procedure into the GitHub Pages `deploy` staging job **before** release artifact upload.
5. Add 9 isolated Node tests for determinism, independent input modifications, tampering, malformed input and executable output. Update preview staging fixture tests (2 additional) and cross-stack integration/release smoke assertions.
6. No browser or service-worker runtime fetches were added; the byte identity is generated entirely during build.

## Security and reliability scope

- SHA-256 in this application is a deterministic identity, **not an authenticated digital signature**; an attacker controlling the origin can replace both files and hashes.
- It does not yet prove the live HTTP response body fetched during worker installation exactly matches the stamped asset. A CDN or release propagation race could serve a different shell while preserving valid superficial identity markers. A subsequent pass should add source-manifest SHA-256 checks to service-worker downloads using the Web Crypto API, with performance and MIME tolerance tested on iPhone Safari.
- Because cache keys include content, the browser can keep old generations during a failed update and clean them on successful activation, subject to storage availability.
- Committed raw `public-preview-sw.js` retains v4 as a build template, preserving direct source-bound tests. Only staged `_site/public-preview/sw.js` receives the generated cache name.
- GitHub Pages and Vercel may have separate URL bases; cache names are based on bytes, while the Service Worker scope still determines the browser-origin boundary.
- Manual `main` publishing and live banking remain unauthorized. All predecessor draft PRs must be reconciled before a release.

## Acceptance gates

1. GitHub PR CI executes all dependency-free tests and validates Vercel staging, integrated release and financial security gates, release smoke, and Pages build source safety.
2. `deploy` is **skipped** for pull requests. Production `main` unchanged.
3. Real physical iPhone Safari: install an offline preview, change staged HTML, verify a new worker/cache appears and old offline data survives while the update is pending; test failed installs and airplane-mode reopening with fictional financial Plan data.
4. Compare generated workers in independent Vercel/GitHub Pages build processes with identical input bytes; record identity and consistency. Do not claim a deployed Vercel preview given Hobby quota failures.
5. Use `--verify` on the exact staged artifact before any separately authorized production release.

## Two next experiments with go/no-go

- **Integrity experiment:** Simulate 50 deployment transitions with shell-only, icon-only and manifest-only modifications. Target 50/50 distinct cache fingerprints where any artifact changes, zero false positives on repeated identical builds, and zero stale cache overwrites during failed install scenarios.
- **iPhone user-experience experiment:** On physical iOS Safari at 390 CSS px, run 10 online-to-offline-to-update cycles against a test-only origin, with fictional Plan data. Target 10/10 offline launches from previously verified cache, 10/10 local data retention, and zero silent stale-shell claims; otherwise HOLD.

**No production release, user data export, Supabase update, or payment is authorized by this research branch.**

## Consolidation
Integrated into the existing draft PR #22 alongside the independent Phase 45 in-memory Plan rescue. The original PR #25 remains review history, not a second release target.
