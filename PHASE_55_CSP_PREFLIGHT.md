# Phase 55 — CSP Policy Completeness and Pre-Publication Enforcement

**Date:** November 2, 2026
**Project:** This Week
**Review target:** Existing canonical draft PR #29 (do not create another release branch)
**Budget:** $0 incremental
**Production main:** Unchanged; no publication authorized.

## Independent research and threat model

Phase 51 independently attested the deployed service worker. Phase 53 repaired duplicate Content Security Policy directives in the post-deployment verifier. But the verifier still inspected only `script-src`, `connect-src`, and `object-src`, and ran on hosted files **after** a Pages publish. It did not prevent the application from widening other CSP directives such as `base-uri`, `form-action`, `frame-src`, `worker-src`, `img-src`, or `media-src`. It also did not reject an otherwise-correct meta policy placed after executable content, where it cannot protect previously parsed resources.

The W3C CSP3 policy-delivery specification states that meta policies apply only from the point the HTML parser sees the element and do not affect resources loaded before it:
https://www.w3.org/TR/2026/WD-CSP3-20261027/#meta-element

MDN distinguishes `frame-src` (which subframes may be loaded) from `frame-ancestors` (which origins can embed the page). The latter **cannot** be established by an HTML meta CSP, and requires a response header which GitHub Pages may not let this project customize:
https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors

## Implemented in the consolidated draft

1. Parse the full meta CSP directive set case-insensitively and reject duplicates, carrying forward Phase 53's protections.
2. Require every explicitly reviewed production CSP directive and exact token set. In addition to the earlier script/connect/object checks, the gate validates `default-src`, `script-src-attr`, `style-src`, `img-src`, `font-src`, `media-src`, `base-uri`, `form-action`, `frame-src`, `child-src`, `worker-src`, `manifest-src`, and the flag `upgrade-insecure-requests`.
3. Require the CSP meta tag to precede executable/resource tags; a policy appearing after a script is rejected rather than accepted based on its text alone.
4. Add ten adversarial release verifier tests and five executable staging CLI tests. The CLI tests use the actual local HTML staging script and mutate its staged output, rather than checking only hand-written CSP fixtures.
5. Add `verify-production-csp.mjs`, which imports the same verified policy predicate as the live post-deploy auditor, and fails closed on missing/empty/oversized HTML.
6. Execute the CSP preflight after actual HTML generation in **both** the Vercel preview builder and the GitHub Pages workflow's validation and production staging phases, before any artifact upload. Make it a mandatory step in the release smoke contract; isolated preview-builder fixtures explicitly assert the preflight is invoked and its failure blocks the build.

## Boundaries and caveats

- The policy explicitly permits `style-src 'unsafe-inline'` for this application's existing inline CSS. Removing that would require a separate HTML/CSS migration and measured Safari compatibility.
- An additional HTTP CSP response header can only further restrict browser permissions. Header content and platform transformations still require a live-origin audit; the HTML-only preflight does not independently inspect headers.
- A meta CSP cannot set `frame-ancestors`, so these checks do not prove clickjacking resistance against embedding the whole page. Likewise, the parent document's meta CSP does not automatically govern the service worker's own script; a worker response header would need separate configuration.
- This is release policy consistency with an explicitly reviewed baseline, not a cryptographic guarantee against a malicious repository owner or compromised CI.
- The preflight protects both intended staging pipelines only. Additional unreviewed third-party publishing routes, host rewrites, post-upload CDN behavior and physical iPhone Safari storage/update behavior remain outside this test.
- Concurrent edits to PR #29 require exact-head CI after the final commit. A successful earlier run cannot certify a later SHA.

## Release gates

- GitHub Actions full validate job **SUCCESS** on the exact current consolidated head; Pages deploy job **SKIPPED** for PR.
- All CSP unit and staged HTML tests pass, along with the multi-tab Plan durability, UTF-8 backup/restore, PWA integrity, parity and release smoke suites.
- Verify one actual approved hosted preview's full CSP, MIME and route responses when Vercel Hobby free allowance permits.
- Physical iPhone Safari 390px test of offline installation/update and synthetic Plan storage, localStorage denial, Unicode 4 MB backup and manual rescue.
- Require independent review and explicit release authorization before merging draft #29 to production main. No bank/Supabase/provider activation or paid service.
