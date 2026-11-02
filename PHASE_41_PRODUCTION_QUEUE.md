# This Week — Phase 41: Production Queue Preservation & Stale-Release Guard

Date: 2026-11-02
Branch: `fix/thisweek-phase41-production-queue-20261102`
Release mode: review-only, no production changes authorized.

## Verified root cause

In the Phase 40 candidate, PRs were separated from production by concurrency group, but all `main` workflow runs still shared `pages-production` at workflow scope with `cancel-in-progress: false`. That protects the currently running job but **does not preserve every pending main run**: the default GitHub Actions concurrency queue supports only one pending run and a newly queued run replaces an older pending run.

The risk worsens during stacked PR validation or rapid main commits. Review branch dispatches should not compete with production work, and actual Pages publishes should be serialized independently of read-only validation.

Primary sources:
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency
- https://github.blog/changelog/2026-05-07-github-actions-concurrency-groups-now-allow-larger-queues/
- https://docs.github.com/en/actions/reference/limits

## Changes

1. **Workflow-level validation:** PR checks are grouped by PR number with `cancel-in-progress` enabled only for PRs. Every non-PR run has a separate `pages-run-{run_id}` group so pending production jobs are never implicitly replaced by validation-only work.
2. **Job-level production serialization:** the Pages `deploy` job has a dedicated `thisweek-pages-production-deploy` concurrency group, `cancel-in-progress: false` and `queue: max` (GitHub currently permits up to 100 pending runs). Queueing the deploy job, not the entire validation workflow, avoids bottlenecking read-only CI and separates PR cancellation semantics from production queue preservation.
3. **Latest-main attestation before publication:** immediately before the Pages deployment action, `git ls-remote --exit-code origin refs/heads/main` compares the current main SHA with the exact `github.sha` this workflow checked out. An outdated, missing, or unreadable ref **fails closed** without executing `actions/deploy-pages`. A queued historical run is not allowed to republish an older commit over a newer release.
4. **Tests:** eight source-bound Node 22 regression tests cover separate concurrency policies, least privilege, dispatch gating, and the SHA guard's position. The existing smoke checker also requires all new release-safety invariants, and GitHub Actions executes the added test.

## Boundaries / residual risk

- Job-level FIFO is ordered by the time a run reaches the queue; validation completion order may differ from commit order. The SHA guard rejects stale runs rather than assuming arrival order proves release freshness.
- The `git ls-remote` check is point-in-time and is not an atomic compare-and-swap with `deploy-pages`; if main advances between the check and the deployment API call, a short race still exists. For a stronger guarantee, a post-deploy latest-main verification and controlled reconciliation can detect stale publication but cannot make GitHub Pages publishing atomic.
- On a stale run, the deploy job intentionally fails with an explicit refusal. It must not be mislabeled a mysterious CI failure or retried against an outdated commit.
- Vercel deployment limits are independent of GitHub Actions. On 2026-11-02 both Vercel project checks on Phase 40 showed a build-rate-limit failure; more commits or duplicate linked Vercel projects can consume hobby-tier quota. This change does not raise quotas, unbind projects, or spend money.
- No production Pages deployment, production `main` modification, Supabase mutation, bank integration, credential read, or live-money activation is part of this review branch.

## Release gates

- [ ] GitHub PR validate successful at the precise head, including `phase41-pages-queue.test.mjs`.
- [ ] GitHub Pages deploy job skipped for pull request and non-main dispatch.
- [ ] Review and reconcile Phase 35–40 predecessor branches and overlapping diffs, in dependency order; no shortcut merges.
- [ ] Re-verify exact source SHA and required hosted assets after eventual separately authorized release.
- [ ] Physical iPhone Safari acceptance for local-data backup/restore with synthetic data; not covered by automated CI.

No claim is made that full production release or physical-device QA is complete.
