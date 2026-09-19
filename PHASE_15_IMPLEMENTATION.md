# Phase 15 — Deployment & Release Discipline

**Status:** Implemented in repository release infrastructure  
**Production branch:** `main`  
**Pre-Phase-15 rollback commit:** `351a052ba214d4813b296b4cd3dc7965e695b6e1`  
**Rollback branch:** `rollback/phase15-pre-release-2026-09-18`

## Objective

Make production releases repeatable, identifiable, smoke-gated, and reversible.

## Implemented

### main = production

The Pages workflow deploys only pushes to `main` or explicit manual workflow runs.

### Pre-deploy gates

The workflow must run:

- `node phase0-static-check.mjs`
- `node release-smoke-check.mjs`

A failed check blocks artifact upload and deployment.

### Dedicated production artifact

The deployment job now stages a clean `_site` directory instead of uploading the repository root.

Only intended production assets and release metadata are published.

### Release manifest

Every deployment generates `release.json` containing:

- release name
- production commit SHA
- rollback SHA
- workflow run ID
- state schema
- portable schema
- deployment timestamp

### Post-deploy verification

After GitHub Pages reports deployment completion, the workflow fetches:

- the cache-busted production HTML
- the deployed `release.json`

and verifies expected application and commit markers.

### CHANGELOG

A repository-level `CHANGELOG.md` now records production milestones, migration state, trust changes, and rollback references.

### Rollback preservation

The production head immediately before Phase 15 was preserved at:

`351a052ba214d4813b296b4cd3dc7965e695b6e1`

Branch:

`rollback/phase15-pre-release-2026-09-18`

### Migration record

Phase 15 does not change financial-state shape.

- Core schema stays v3.
- Portable schema stays v1.
- Phase 13 migrations remain authoritative.

## Stable tags

The release policy requires stable Git tags when the available repository tooling can create them. The current connected GitHub write surface does not expose tag creation, so this release uses an exact commit plus preserved rollback branch and does not falsely claim an immutable tag exists.

## Completion criteria

Every release now has a defined path to:

- known commit
- automated smoke result
- rollback point
- release notes
- migration note
- cache-busted verification URL

Physical iPhone Safari QA remains a human release gate where source inspection cannot prove hardware/browser behavior.


## Continued release hardening

Phase 15 was extended after the first validated release to remove one recurring deployment failure mode: stale CSP hashes after editing `index.html`.

### Deterministic CSP staging

New utility:

`prepare-site.mjs`

The production workflow now generates the exact deployed HTML from source before validation and before deployment.

The script:

- reads the current inline application scripts;
- calculates SHA-256 CSP tokens;
- rewrites the production CSP `script-src`;
- rejects `unsafe-inline`;
- verifies the staged CSP includes the generated hashes.

This means a later phase can change application JavaScript without requiring a separate manual CSP-refresh commit before Pages can deploy.

### Validation matches production construction

The validation job now runs:

`node prepare-site.mjs index.html index.production.html`

and validates that prepared HTML with the normal Phase 0 checker and release smoke test.

The deployment job independently runs:

`node prepare-site.mjs index.html _site/index.html`

so validation and deployment share the same construction path.

### Stale deployment cancellation

The production workflow now uses:

`cancel-in-progress: true`

for one Pages production concurrency group.

A newer `main` push can therefore cancel an older in-progress release rather than allowing a stale queued commit to publish after a newer one.

### Stable milestone

Validated Phase 15 milestone:

`8caca1c864c0608ce808210605a0b03eb1779655`

Stable branch:

`stable/v0.15.0-phase15`

Successful GitHub Actions run:

`35410845516`

The connected repository write surface did not expose Git tag creation, so no immutable Git tag is claimed. The exact commit plus dedicated stable branch and release record preserve the milestone without inventing unsupported metadata.

### Durable release record

Added:

`RELEASES/v0.15.0-phase15.md`

The release record contains:

- validated commit;
- workflow run;
- automated smoke result;
- cache-busted production URL;
- rollback commit;
- rollback branch;
- schema/migration state;
- stable milestone reference.

### Release configuration

`release.config.json` now also records:

- `stableBranch`
- `releaseRecord`

The release smoke test verifies that the release-record path exists and the stable milestone follows the `stable/` naming convention.

### Phase 15 completion status

The source-level completion criteria are now covered:

- known release commit — recorded;
- automated smoke result — recorded;
- rollback point — preserved;
- release notes — recorded;
- migration note — recorded;
- stable milestone — preserved;
- cache-busted post-deploy verification — automated;
- deterministic production artifact construction — automated.

Physical iPhone Safari testing remains a hands-on release gate and is intentionally not represented as an automated guarantee.
