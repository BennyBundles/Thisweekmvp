# Phase 43 — Fail-Closed Offline PWA Installation

Date: 2026-11-02
Scope: This Week standalone demo PWA, no live-money or provider writes
Base: Phase 42 preview cache-integrity draft; stacked review only

## Research and root cause
The Phase 42 worker narrowed caching to known routes and rejected redirected/error navigations at runtime. Its install procedure fetched a successful HTTP 200 asset with HTML Content-Type, but could still accept an identity-less login/maintenance HTML document as the initial offline shell. The runtime path also trusted same-origin status codes without checking the preview application's identifying content. CacheStorage may contain older versions and response URL metadata from outside the intended preview route.

Service Worker install semantics: `event.waitUntil` must reject on incomplete precaching so an invalid worker does not activate. Cache.addAll is not sufficient to prove content identity, MIME or correct destination. References:
- https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
- https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil
- https://developer.mozilla.org/en-US/docs/Web/API/Cache/addAll

## Implemented
- Cache generation v3 isolates the verified cache from v1/v2.
- Shell installation and runtime update require exact preview identity markers, restricted network CSP marker, `text/html`, HTTP 200, non-redirect, exact same-origin URL and route; shell body capped to 2,000,000 characters.
- Icon and manifest require expected content type and minimal content shape; malformed or redirected resources abort installation.
- Verify all three assets before writing. If any cache write or `skipWaiting` fails, delete the partial v3 cache and rethrow, preserving older active worker.
- Offline fallback uses only the current cache, independently revalidates shell identity, and deletes bad entries. It never silently recovers from an old poisoned v2 cache.
- Cache writes after successful network navigation remain attached to fetch `waitUntil`, but quota errors do not block successful online navigation.
- Updated source-bound VM tests include login HTML, malformed manifest, quota rollback, wrong MIME, cross-origin cache entries, stale cache isolation, missing shell markers and expected URL behavior.

## Limits and release gates
- This is an identity/content check, not cryptographic authenticity. An attacker controlling the served origin could forge the markers. Real signature verification and formal release provenance remain separate tasks.
- Reading a cloned large HTML response increases transient memory and CPU use on older iPhones; benchmark physical Safari and consider streaming bounds in the next iteration.
- Exact manifest/icon MIME restrictions may require CDN configuration review. A mismatch fails safe by disabling a new worker installation, not by caching an uncertain response.
- Preview build counters, Vercel Hobby deploy limits, SHA-to-publish race, and previously drafted Phase 35–42 changes are out of scope.
- Required: exact-head GitHub PR CI pass, Pages deploy skipped, independent review of stacked dependencies, physical iPhone Safari online-to-offline and reboot tests using *synthetic* local Plan data.
- No main merge, production publish, provider/banking activation, user data export, or payment spend authorized.
