# This Week — Phase 47: Exact Downloaded Asset Integrity

**Date:** November 2, 2026  
**Mode:** Review-only, stacked on unmerged Phase 46 / PR #25  
**Scope:** Standalone public-preview service worker, deterministic staging scripts and CI.

## Source-bound defect

Phase 46 binds the cache name to SHA-256 of build-time shell, manifest, icon and worker source. However, the service worker only checked MIME, same-origin URLs and easily forged textual markers on fetched responses. A CDN propagation window or edge error could return a valid-looking *different* 200 HTML shell, valid JSON manifest or SVG with altered bytes; such a response might replace the offline cache or be installed despite carrying the correct build-identified worker.

## Research evidence

- Web Crypto `SubtleCrypto.digest('SHA-256', ArrayBuffer)` works in secure-context Web Workers, including service workers: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
- Cache API stores response clones and does not itself attest their contents: https://developer.mozilla.org/en-US/docs/Web/API/Cache/put
- Service worker installation `waitUntil` must reject failed precache/update attempts: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers

MDN notes that `digest()` is not streaming: reading a large shell and digesting it increases peak memory. This pass caps the shell digest input to 4,000,000 bytes, manifest to 16,384 and icon to 131,072, along with existing content checks.

## Implementation

1. Add the **exact** `const EXPECTED_ASSET_SHA256=null;` sentinel to the checked-in authoring template.
2. The existing deterministic build stamper now embeds SHA-256 of the precise staged shell, manifest and icon bytes alongside the existing cache generation. It rejects duplicate/missing sentinels, and `--verify` compares all generated output bytes.
3. The generated worker requires Web Crypto, computes SHA-256 of **cloned fetched response bytes** and rejects a mismatch. The same check applies to initial installation, online refresh, cached offline fallback and cache-first static assets. Raw source-bound unit tests run against the unbound authoring template; **build staging always binds the digests**.
4. A network response with different bytes is allowed to render online, but **is not written** to the trusted offline cache. A mismatched cached shell is rejected and removed. Failed installs do not activate and preserve older cache generations.
5. Extend the offline stamp suite to 12 source-bound cases, preview fixture tests to 10, and add 9 runtime Web Crypto tests with real SHA-256. Enforce all checks in GitHub Actions, integrated release contracts and smoke tests.

## Security and limitations

- SHA-256 is a **content identity check**, not a digital signature. An attacker controlling both worker script and staged assets can change all hashes. A trusted signed release manifest would be required for origin-compromise resistance.
- A release can serve current HTML online during propagation before a new worker controls the page. The offline cache remains protected, but live HTML is not independently blocked from rendering.
- Runtime checks read cloned responses; memory and latency need direct iPhone Safari evaluation. Missing Web Crypto fails closed for the new worker, potentially leaving the previous version active.
- Strong MIME restrictions may expose CDN content-type settings. Verify actual preview headers after deployment.
- HTTP cache, service worker cache, origin storage and financial user data are separate; this pass never reads user financial records or activates provider networking.
- Prior stacked PRs remain under independent review. No merge or production publication is authorized.

## Experiments and acceptance

1. **CDN skew adversarial simulation:** repeatedly serve 200 responses that preserve visible markers but mutate a single byte, whitespace or SVG attribute. **Go/no-go:** 100% of altered downloads rejected from offline cache; 100% matching downloads cached; no corrupted fallback.
2. **Memory and latency QA:** on physical iPhone Safari 390 CSS px, use fictional Plan state and 10 update/offline cycles. Record install and startup times, peak resources where instrumentable, successful offline launches and errors. **Go/no-go:** all 10 exact-content installations accepted, all altered-content installs rejected, no silent loss of fictional Plan data; report real measured timing before accepting performance.

The suite provides source-bound and simulated execution evidence, not a physical iPhone or hosted CDN audit.
