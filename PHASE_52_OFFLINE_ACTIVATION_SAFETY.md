# Phase 52 — Preserve last-good offline cache during activation
Date: November 2, 2026

## Actual source risk
On an already verified static PWA, the existing `activate` handler deleted every previous-version offline cache immediately, without checking that its newly installed current cache still contained a valid shell, manifest and icon. This could lose the last usable offline copy if CacheStorage was evicted, cleared, or corrupted between `install` and `activate`.

## Bounded repair
Before deleting any previous-version caches, open the current cache and revalidate each of the three entries with the existing `validShell()` or `validAsset()` routines. Published service workers also enforce exact SHA-256 asset identity; the in-repository null marker is only for isolated unit tests. On any missing/corrupt current asset, throw before old-cache cleanup and before `clients.claim()`. Preserve unrelated origin caches unchanged. No network call, no financial data, no paid services.

## Test evidence
Add four source-bound Node tests for a missing icon, corrupted shell, incorrect manifest, and a check that the verification guard precedes legacy-cache deletion and client claiming. The existing green activation test proves valid updates still clean old caches. All tests must pass on the final exact GitHub SHA.

## Limitations
Failing activation is not proof a browser will roll back to the previous service worker; the active-registration lifecycle is browser-dependent. This fix prevents deliberate destruction of older CacheStorage generations on an observed integrity failure. Browser quota eviction can still remove all origin data. Physical iPhone Safari tests remain required.

References: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers and https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/activate_event.
