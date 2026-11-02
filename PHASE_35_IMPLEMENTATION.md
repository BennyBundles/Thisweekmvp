# This Week — Phase 35: Release Integrity and Safe Pull-Request Validation

**Date:** 2026-11-02  
**Scope:** GitHub Pages release verification and CI only.  
**Production money:** unchanged, locked behind existing Phase 31/34 approvals.  
**State schemas:** no migration; weekly Plan remains browser-local.  
**Budget:** no new paid services or packages.

## Why

The prior Pages verification used substring checks (including a grep for the expected SHA anywhere in `release.json`). A wrong commit could therefore be accepted if its old manifest mentioned the expected SHA in an unrelated field. A response body could also pass a substring check when served under the wrong route, origin, or HTTP status.

Phase 35 adds a fail-closed validator that parses the manifest, validates the **exact commit field**, release metadata, rollback identity, schema versions, workflow run ID, and nonempty deployed timestamp. It then checks the production CSP and the actual hosted HTML/JS route markers, HTTP statuses and final URLs, rejecting cross-origin redirects. All requests are read-only.

## Work delivered

- `verify-deployed-release.mjs`: dependency-free Node 22 script. Inputs: deployed Pages URL and full expected commit SHA. Verifies 17 assets plus `release.json`; retry bounded to 12.
- `verify-deployed-release.test.mjs`: 16 offline mock-transport tests covering valid deployments and bad commit, stale short SHA, schema/rollback drift, 404, missing route, malformed/mistyped manifest, redirect, weakened CSP and bounded retries.
- `.github/workflows/pages.yml`:
  - Validation now runs for PRs targeting main, **without deploying PR code**.
  - Permissions at workflow level reduced to `contents: read`; deploy privileges granted only to the push/dispatch deploy job.
  - New verifier unit tests included in validation.
  - The new exact artifact verification executes after Pages deployment and before the existing success summary/route check.

## Local reproducibility

```sh
node --test verify-deployed-release.test.mjs
node verify-deployed-release.mjs https://bennybundles.github.io/Thisweekmvp/ <the-exact-deployed-40-character-sha>
```

A production smoke test still requires an actual Pages deployment; unit tests use mocked responses and are **not evidence of successful live-provider certification**. A successful deploy workflow is **not** financial release approval.

## Non-goals and safety guarantees

No Supabase data mutation, provider invocation, card funding, direct-deposit switch, production-money enablement, new financial state migration, or customer-data processing occurs in this phase. The live-money release gates remain independently authoritative. The staff certification process must select the actual candidate SHA through AAL2-authorized actions and gather genuine provider test receipts, rollback drills and approvals.

## Acceptance

- Offline unit tests: all pass.
- PR validation: all existing static/feature checks plus new validator tests pass without Pages deploy.
- After merge into main: Pages deployment succeeds; deployed `release.json.commit` equals `GITHUB_SHA` exactly; 17 assets plus manifest pass integrity/route checks.
- Candidate selection and all required Sandbox receipts are separately completed through the authorized Phase 34 staff console before live-money eligibility is considered.
