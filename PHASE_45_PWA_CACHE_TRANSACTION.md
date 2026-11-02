# This Week Phase 45 — Preserve Active PWA Cache During Worker Replacement

**Date:** November 2, 2026. **Scope:** preview-only service worker. **Status:** Draft CI candidate; no production publish.

## Root cause and independent research

Phase 43 changed the PWA cache name to `this-week-public-preview-v3` and guarded initial cache writes, but every subsequent worker script update using the same `v3` cache namespace could still overwrite the **active** worker's cached shell during installation. Worse, its install catch unconditionally called `caches.delete(CACHE_NAME)`, so a new worker failing to download an asset or encountering an iOS CacheStorage quota error could delete the active, previously valid offline cache. The failed new worker would not activate, but the existing active worker would lose offline access.

This is specific to same-version worker updates and is not covered by basic 404/redirect poisoning tests. The Service Worker lifecycle permits an old active worker to keep controlling clients while a replacement installs, and versioned caches are needed to prevent shared-cache corruption.

Sources:
- https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
- https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil
- https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage/match

## Implementation

1. Bump the cache generation from `v3` to `v4` to isolate this corrected update policy from the previous worker.
2. Before changing CacheStorage, check whether the exact target cache already exists.
3. Always fetch and validate all three expected shell/icon/manifest assets from the network, rejecting errors, 200 login pages and wrong content.
4. If a current-version cache already exists, independently revalidate its three entries **without writing or deleting them**; successful same-version updates retain the known-good offline snapshot until a later successful network fetch refreshes it.
5. If no current-version cache existed, install the validated assets into the new cache. On failure, delete **only this installation's newly created cache**. Never destroy an already-existing current-version cache during an unsuccessful update.
6. On activation, clean obsolete generations after the new worker has completed successful installation. Restrict all caching to the demo PWA scope.
7. Add five adversarial, source-bound CacheStorage/Service Worker simulation tests (29 total) and strengthen the Phase 43 integrated regression gate.

## Residual risks and next gate

- The `caches.keys()` existence check is not an atomic inter-worker lock. Simultaneous installs could still race; browser scheduling ordinarily serializes updates per registration, but this is not a transaction guarantee.
- For same-generation updates, retaining an active verified cache can temporarily keep older offline HTML until the next successful network navigation. An optimal future build should embed a unique deployment identity into each worker/cache namespace; source revision and asset release identity are not yet cryptographically pinned.
- Simulated tests cannot establish actual iPhone Safari behavior, quota limits or persistent storage. Physical-device offline/update tests remain required.
- Do not merge independently of the Phase 35–44 review stack. Production `main` remains unchanged, production Pages deployment is not approved, and no live-money or bank/provider functions are enabled.

## Acceptance

- Exact-head CI: all existing and new source-bound tests pass, `deploy` skipped for the PR.
- Vercel builds are not a prerequisite; Hobby limits remain an independent concern and $0 incremental spend is required.
- On iPhone Safari using fictional Plan data: install v4, toggle connectivity, trigger same-version update failures, verify previous known-good shell and local data are still available, and verify cleanup only after success.


## Integration (Phase 46)
Adopted into the existing consolidated draft PR #22 at its post-Phase-45 volatile Plan rescue head; source service worker and its tests are preserved byte-for-byte from the independently validated #24 branch. Cross-stack integration test updated for the new v4 cache namespace. This integration supersedes merging #24 separately.
