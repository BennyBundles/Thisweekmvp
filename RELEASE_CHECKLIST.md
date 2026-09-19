# Release Smoke-Test Checklist

Run before every production deployment to GitHub Pages.

## Automated gate

- [ ] `node phase0-static-check.mjs` passes.
- [ ] `node release-smoke-check.mjs` passes.
- [ ] `prepare-site.mjs` regenerates CSP SHA-256 hashes for the exact production HTML.
- [ ] The validation job checks the staged production HTML, not an unprepared source copy.
- [ ] Both JavaScript blocks compile.
- [ ] Required Home, Details, Connected Data, Privacy, QA, Performance, and Data Model routes exist.
- [ ] Browser zoom is not disabled.
- [ ] No unexpected external runtime JS/CSS dependency is introduced.
- [ ] Current release exists in `CHANGELOG.md`.
- [ ] `release.config.json` contains a full rollback commit.

## Mobile production smoke test

- [ ] Home renders on 390px iPhone Safari without horizontal overflow.
- [ ] Home category Peek opens and only one category expands at a time.
- [ ] A bottom sheet opens, closes, and restores focus.
- [ ] Add Spending accepts an entry and updates the correct category.
- [ ] Bill contribution updates bill protection correctly.
- [ ] Scenario Sandbox changes only its preview.
- [ ] Connected Data import reaches Preview before persistence.
- [ ] Privacy & Local Data page opens.
- [ ] Reduced Motion keeps all controls usable.
- [ ] Browser Back returns predictably.
- [ ] Refresh preserves local plan when localStorage is available.

## Data and trust checks

- [ ] Phase 13 backend-readiness suite passes.
- [ ] Phase 14 trust checks pass or every warning is understood.
- [ ] Portable data export validates.
- [ ] Imported transaction never changes the plan before explicit reconciliation.
- [ ] No provider token or credential exists in browser-local data.

## Release record

- [ ] Known commit SHA recorded.
- [ ] Smoke-test result recorded.
- [ ] Rollback point recorded.
- [ ] Release notes recorded in CHANGELOG.
- [ ] Major state migration notes recorded.
- [ ] Cache-busted production URL prepared.
- [ ] Stable milestone branch or immutable tag recorded.
- [ ] Release record exists under `RELEASES/`.
- [ ] Post-deploy workflow verification completed successfully.

### Rollback point

The production rollback reference must be a full commit SHA and a preserved rollback branch before release changes are deployed.


## Deployment-order safety

- [ ] Production workflow uses one concurrency group.
- [ ] Stale production run cancellation is enabled.
- [ ] A newer commit cannot be followed by an older queued Pages deployment.

## Stable milestone

- [ ] Stable milestone branch/tag points at the exact validated release commit.
- [ ] Stable milestone is not moved after release; create a new milestone for a later release.
