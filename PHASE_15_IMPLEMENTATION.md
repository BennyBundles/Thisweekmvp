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
