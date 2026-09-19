# Release Smoke-Test Checklist

Run before every production deployment to GitHub Pages.

## Automated gate

- [ ] `node phase0-static-check.mjs` passes.
- [ ] `node release-smoke-check.mjs` passes.
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

### Rollback point

The production rollback reference must be a full commit SHA and a preserved rollback branch before release changes are deployed.
