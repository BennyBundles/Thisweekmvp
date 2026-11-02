# Phase 38 — Vercel static artifact integrity and shared-repository isolation

Date: 2026-11-02
Status: Implemented in draft PR #16; verified preview build; no production GitHub Pages release.

## Root-cause evidence

After correcting the Vercel Next.js preset to Other, Vercel defaulted to the repository root (there is no public/ directory). The repository root has static HTML alongside tests, release records and backend SQL.

GitHub source-byte SHA-256 inspection found stale script-src hashes in index.html. On main, the second of two inline scripts mismatched its CSP SHA-256. On the Phase 37 branch, both inline scripts mismatched. The Pages deployment stages source with prepare-site.mjs, refreshing the hashes; the previous Vercel preview did not. READY was not proof of browser executable scripts.

## Fix

build-vercel-static.mjs produces exactly 22 approved files inside _site/, using the existing Pages public routes:
- Recomputes CSP script digests for main HTML and public-preview HTML.
- Validates both generated HTML files against their exact inline SHA-256 script bytes.
- Copies only the explicit approved Money Lab, Account, Ops, Support, legal sandbox, preview and PWA files.
- Reuses existing app/route checkers; refuses missing or unexpected files, repository source files, SQL and environment files.
- Writes preview-build.json containing the commit/reference and explicit productionReleaseAttested=false.
- Runs the exact static artifact build during GitHub PR CI without authorizing Pages deployment.

## Cross-project discovery

The same source repository also deploys to another project: benny-bundles-agency-v47-hosted-proof. A root vercel.json would unintentionally override both projects. An initial review-branch deployment demonstrated this. The root vercel.json was therefore removed.

Instead, ONLY the This Week Vercel project brief2delivery-app-v041 now has these project-scoped settings:
- Framework: Other
- Build Command: node build-vercel-static.mjs
- Output Directory: _site
- Node 24.x unchanged.

A pair of deployments from the same source commit, ca5784eefbf61394407bc43837b21afee098cd04, verified the isolation:
- This Week preview: dpl_EW2AwAoCpdgEsJ6oeYwU4NLG48uC READY, and logs show VERCEL_STATIC_ARTIFACT_PASS with exactly 22 files and valid hashes.
- Agency hosted-proof preview: dpl_4qqbZmvpBrzQRSQKVJAJiPTFgpT2 READY, and logs show the original simple build without the This Week static builder.

## CI evidence

GitHub Actions 41455939975 was successful for the candidate source after the project-scoped fix; PR deploy job was skipped as intended. Separate CI hardening PR #15 passed run 41455634404 after upgrading the setup-node action to Node 24-native v7 while retaining Node 22 as the project test runtime.

## Remaining gates

Not yet verified: physical iPhone Safari UI/storage fault testing, actual HTTP response content from public Vercel URL, post-merge GitHub Pages release checks, real-money provider activation (out of scope). A build READY result cannot certify these.

Dependency order: draft PR #12 -> PR #13 -> PR #14 -> PR #15 -> PR #16. Rebase/retest each after earlier merges. No direct merge of stacked PRs. No bank, Supabase production, provider or public Pages changes authorized.

Operational limitation: The build settings live on the This Week Vercel project, rather than in a root versioned file, specifically to avoid changing the agency project. Until this branch is merged, building a revision without build-vercel-static.mjs may fail closed. Do not revert to serving the repository root merely to avoid that failure. Document and validate any future project-level settings change before modifying the deployment contract.
