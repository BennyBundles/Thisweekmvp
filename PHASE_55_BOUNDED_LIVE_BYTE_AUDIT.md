# Phase 55 — Bounded Live-Byte Release Verification & 30-Case CDN Drift Matrix

Date: November 2, 2026 (US Eastern)  
Repository: BennyBundles/Thisweekmvp  
Scope: consolidated draft PR #29 only; no main merge, no provider activation, no deployment.

## Research problem

The Phase 53 auditor already requested both cache-busted and directly-installable preview asset URLs and verified exact SHA-256 bytes against an independently staged service worker. However, it called `response.arrayBuffer()` **before** enforcing the maximum two-million-byte asset size. A dishonest Content-Length header or chunked/streaming body could therefore force the verifier to allocate an arbitrary full response before refusing the asset.

MDN confirms that the Fetch Response body is a ReadableStream accessible via `getReader()`, and that the reader can be canceled when consumption must stop. The Web Crypto `SubtleCrypto.digest` API has no streaming input support; this Node-side hardening deliberately does **not** claim to eliminate the separate bounded-data allocation requirement of the browser service worker.

References:
- https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams
- https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/getReader
- https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
- https://nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options

## Implemented

- Exported `readBoundedResponseBytes(response, maxBytes)` from `verify-deployed-release.mjs`. It requires a readable byte stream, consumes one chunk at a time and rejects **before storing** any chunk that exceeds the remaining byte budget; on rejection, cancellation is attempted without blocking indefinitely.
- The postdeployment auditor now uses that bounded reader instead of `response.arrayBuffer()` for all 25 checked HTTP responses. Fatal UTF-8 decode, strict MIME, required identity markers, original-byte SHA-256 and independently trusted worker identity checks remain intact.
- Updated release-verifier test transport to model genuine `ReadableStream` responses, instead of an `arrayBuffer`-only fake.
- Added bounded reader tests covering: first-chunk overflow, multiple-chunk overflow, valid split UTF-8 byte reconstruction with matching SHA-256, missing streaming support, non-byte chunks, and empty input.
- Added a 30-scenario adversarial CDN matrix: **3 offline assets × 2 URL forms × 5 mismatch modes**, specifically altered bytes, wrong MIME, HTTP 404, wrong-origin redirect and malformed UTF-8. Each simulated release must be rejected; each test checks that it actually targeted the intended URL variant and resource.
- Retained prior release, PWA, CSP, backup, financial Plan, synthetic Vercel vs Pages artifact parity and other CI checks.

## Exact observed CI evidence

The code/test revision `f5487ad916d95eba71adc157decaa500e3d6df8c` passed GitHub Actions run 41485189553:
- 14 Node test suites, **267/267 tests passed**, zero failures.
- GitHub Pages deploy job **SKIPPED**, as required for a pull request.
- Source is still on a draft candidate, not production.
- This report is a subsequent documentation-only commit; it must not be mistaken for the exact CI-tested SHA above until its own run is examined.

## Remaining boundaries

- An underlying stream can still provide a single large already-allocated chunk. This change bounds the **total retained and concatenated response bytes**, but does not control the producer's individual allocation or HTTP transport buffers.
- Reader cancellation is best-effort, not a guarantee that the server or browser stops instantly; the GitHub Actions auditor uses a fetch AbortSignal timeout in addition to size checks.
- SHA-256 is content identity, not a signature or an authentication of the hosting origin.
- 30 passing synthetic adversarial tests are **not** physical Safari acceptance, CDN-wide consistency or proof against every possible mixed-generation race.
- 25 route probes are per one audit attempt, not a guarantee that all GitHub Pages CDN locations have converged.
- No Supabase schema/data writes, real-money operations, Vercel production deployment, authentication changes or release approvals occurred.

## Priority next studies

1. Ensure production static **all-route** live byte equality: today, several non-PWA routes are checked by identity markers/CSP but not by trusted expected build digest; design a staged manifest anchored in the trusted local release artifact to compare all 20 public static route bytes against live deployed bytes.
2. Investigate browser worker streaming/body caps without introducing a custom unverified SHA-256 implementation; respect Web Crypto's no-streaming-digest constraint and preserve iOS compatibility.
3. Execute ten physical iPhone Safari online → offline → update → local Plan restoration cycles with only fictional data.
4. Maintain approval gate: independent cumulative PR diff review, stable green exact SHA, main merge only after authorization, then exact postdeployment verification; keep the 11 live-money certification gates separate.
