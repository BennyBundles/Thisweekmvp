# Phase 54 — No-quota static deployment artifact parity

Date: November 2, 2026
Project: This Week, consolidated draft PR #29; zero incremental spend.

## Independently verified problem class
GitHub Pages and Vercel have separately implemented static artifact staging steps. Both can pass their own internal route tests yet output different bytes or route sets. A green build on one provider does not prove parity with the other. Previous provider build failures and Vercel Hobby deployment quota exhaustion make an offline, no-deploy qualification gate useful.

## Implemented
- Source-bound Node test runs the actual `stage-preview.mjs` with a synthetic 40-character SHA, then extracts and runs the actual `Stage production site` shell block from `.github/workflows/pages.yml` locally in the CI checkout. No GitHub Pages publish and no Vercel deployment calls.
- Enforces the same 20 explicitly approved public static route files, comparing raw file **bytes** for every route, including the content-addressed service worker, CSP-hashed HTML, webmanifest and icon.
- Verifies that the Vercel preview receipt contains exact SHA-256 digests of all files. Verifies synthetic production release receipt references the test SHA and workflow run ID.
- Prevents production `release.json` being present in preview and `preview-build.json` leaking into production; rejects unapproved route assets and symlinks.
- Restages the preview after the test so no synthetic release manifest remains in PR validation. Adds pure negative tests for stale worker, missing assets and extra files.
- Plugs the new test into GitHub CI and the integrated Phase 43 release-contract assertion.

## Boundaries
This is byte parity between **locally staged** artifacts, not evidence that either CDN serves those exact bytes. It cannot establish HTTP MIME, redirects, caching, propagation, auth, or iPhone Safari behavior; those still require actual live preview and device testing. A provider may transform bytes or enforce separate routing behavior after upload. Production main remains locked.

Sources: https://vercel.com/docs/project-configuration/vercel-json ; https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

## Quota finding
Vercel documentation states that canceled builds from ignored build steps **still count against deployment quotas**. Therefore the current `ignoreCommand` is not a substitute for disabling unnecessary automatic deployments at the provider level. Keep preview builds disabled until a single exact-commit verification is approved.
Source: https://vercel.com/docs/project-configuration/project-settings
