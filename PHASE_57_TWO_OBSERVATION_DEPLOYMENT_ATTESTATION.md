# Phase 57 — Two-Observation Deployment Attestation

**Date:** 2026-11-02 (US Eastern)  
**Project:** This Week; consolidated Draft PR #29  
**Budget:** $0 incremental  
**Release:** HOLD; no merge, provider activation, or deployment

## Evidence-backed problem

Even after Phase 56 attested every approved route against exact staged SHA-256 bytes, one successful set of network responses could be a transiently consistent view during a partially propagated CDN update. The app's production deploy path previously accepted the first complete success during a bounded retry window. A later regression on the same public URL variants would not be detected by that single observational pass.

MDN's Request.cache documentation states that `no-store` bypasses the **browser HTTP cache**. It does not establish that a remote CDN edge is up to date. Therefore two observations are useful additional evidence, but cannot establish globally atomic rollout or worldwide convergence.

Sources:
- https://developer.mozilla.org/en-US/docs/Web/API/Request/cache
- https://fetch.spec.whatwg.org/
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Implemented code

1. Added `auditStableDeployment()` in `verify-deployed-release.mjs`. It validates trusted inputs **before network access**, then performs the existing bounded first-pass `auditDeployment()` (retaining propagation retries), records the first observation timestamp, applies a separate bounded delay, and performs a second **complete, no-retry** `verifyOnce()` over all 25 network responses.
2. A stale or changed file in the second pass is rejected with an explicit `Stable release second observation failed` error; the function does not accept or retry away second-pass regressions.
3. Both observations must agree on exact commit, release, workflow run identity, origin, number of checked assets, all-route SHA-256 coverage, PWA digest count, and the number of URL variants.
4. The receipt includes `observationCount:2`, configured `stabilityDelayMs`, two verification timestamps, the trusted route-set SHA-256 fingerprint, and independently staged worker SHA-256.
5. The existing postdeployment CLI now requires these two observations by default: up to 12 attempts with 5000ms between failed first-pass attempts, then 3000ms between successful first and second observations. Every full successful snapshot still covers all 20 public static routes, release.json, and direct/versioned PWA URL parity, totaling 25 HTTP responses.
6. No extra GitHub Pages publishing action, Supabase mutation, Vercel deployment, personal state transfer, or paid service was introduced.

## Verified test evidence

- Exact validated implementation SHA: `672f475f9764ba60099b4287afa480d0e101d0bd`.
- GitHub Actions run: https://github.com/BennyBundles/Thisweekmvp/actions/runs/41488967645
- `validate`: SUCCESS, **291/291 automated tests across 15 suites, zero failures**.
- `deploy`: SKIPPED.
- Six additional tests cover: two full matching snapshots and 50 HTTP requests, second-only stale non-PWA JavaScript, second-only direct PWA icon drift, first-pass propagation retry followed by two stable snapshots, invalid/untrusted preflight, and failure of the initial pass without a fake second-pass success.
- This document is a subsequent documentation-only commit. Use the Actions run on the exact implementation SHA as the test proof unless a new exact-head run also completes.

## Security bounds / limitations

- The receipt does **not** prove a cryptographic signature, even though it records digests. It is grounded in the protected local staging artifact and HTTPS responses at the network vantage of the GitHub Actions job.
- A configured delay of 3000ms separates observations in production. This is not proof that every geographically distributed CDN node has updated, and the validator cannot see arbitrary client networks.
- The postdeployment audit runs **after** upload/publish. A fail-closed error blocks declaring the release verified, but cannot automatically undo already published bytes.
- No physical iPhone Safari testing occurred. Service-worker upgrade/activation, offline cache survival, multi-tab local Plan behavior and Unicode data rescue require actual-device acceptance.
- The eleven live-money certification gates and genuine sandbox receipts remain separate and unfulfilled. The demo/preview must not be represented as approved for real-money operations.

## Independent review questions

- Does the release verification response explicitly distinguish a successful *observational* attestation from guaranteed global CDN convergence?
- Does the second failed observation produce a failure and never get an implicit retry?
- Is the independently staged route manifest built from the same protected artifact uploaded to GitHub Pages, rather than from CDN-served JSON?
- Can first-pass retries extend too long for the provider's deployment verification timeout? A follow-up should test worst-case per-route delays and define an overall wall-clock budget; do not silently weaken digest coverage to meet a deadline.
- Could a malicious or misconfigured proxy serve a consistent wrong version to both queries? This remains a separate threat addressed only in part by the trusted local digest comparison and authenticated HTTPS transport.

## Priority next pass

**Phase 58:** bound the entire 50-request stable audit by one absolute wall-clock deadline, with a cancellation signal covering all in-flight request bodies and the observation gap; test hanging streams, slow origins and cancellation. Preserve the release HOLD and do not claim physical Safari acceptance until the actual device tests are performed.
