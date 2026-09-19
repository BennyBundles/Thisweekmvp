# Release and testing runbook

## Safe local checks

Use Node 22 (the CI version). On Windows, clone with `git -c core.autocrlf=false clone https://github.com/BennyBundles/Thisweekmvp.git` or otherwise ensure the disposable validation HTML uses LF line endings. The preview builder matches an LF-specific insertion marker; CRLF causes `Preview boot insertion point not found`. Do not silently normalize the tracked source during a documentation task. No npm install is required. Run in a disposable copy because the first two checks read `index.html` relative to their scripts/current directory. Never leave generated staged HTML as an accidental source edit.

From the repository root, the validation sequence is:

```text
node prepare-site.mjs index.html index.production.html
# In the disposable copy only: replace index.html with index.production.html.
node phase0-static-check.mjs
node release-smoke-check.mjs
node prepare-public-preview.mjs index.html public-preview.validation-source.html
node prepare-site.mjs public-preview.validation-source.html public-preview.validation.html
node public-preview-check.mjs public-preview.validation.html
node money-lab-check.mjs money-lab/index.html money-lab/app.js
node account-check.mjs account/index.html account/app.js account/release-config.js
node ops-check.mjs ops/index.html ops/app.js
node support-check.mjs support/index.html support/app.js
git diff --check
```

These are static/deterministic regressions, not a live provider integration suite. Do not claim Auth email delivery, browser usability, concurrency correctness or sandbox settlement from them.

For UI changes, additionally exercise mobile/desktop navigation, keyboard focus, reduced motion, local persistence and preview isolation in a browser. For backend changes, add isolated positive/negative authorization, idempotency/replay, concurrency, risk and ledger tests before any rollout.

## Current Pages process

`main` push or workflow_dispatch triggers `.github/workflows/pages.yml`. Concurrency group `pages-production` cancels older runs.

1. Check out exact commit and use Node 22.
2. Stage production HTML, recalculating hashes for exactly two inline application scripts while retaining restrictive CSP.
3. Run every validation above.
4. Independently stage curated `_site` with planner, preview, Lab, Account, Ops and Support assets and `release.json`.
5. Upload/deploy Pages artifact through github-pages environment.
6. Wait for **Verify deployed release** success for that exact run/commit.
7. Fetch cache-busted `release.json`; require full commit equality and matching workflowRunId. Check the public routes/assets listed by the workflow. If identity differs, report deployment pending/mismatched, not complete.

Documentation is not included in the curated Pages artifact. A documentation PR does not need a production deployment to be a completed handoff. This workflow runs on main, not pull_request: absence of PR checks is not a passed CI run.

## Backend release is separate

Pages does not apply SQL or deploy Supabase functions. Before any authorized backend release:
- Confirm project ref and limit changes to intended This Week resources.
- Record existing function version, JWT setting, retrieved source and bundle hash; capture scoped schema definitions/ACLs.
- Reconcile migration history first; test changes in isolation and preserve forward/backward compatibility.
- Review each function's runtime/import config and authentication boundary.
- Deploy only the intended function/schema change through approved tooling.
- Re-read deployed function/version/JWT setting and compare actual source; verify schema/grants and negative security cases.
- Keep live execution flags, risk activation and release gates unchanged unless separately and explicitly approved after rollout evidence.
- Record frontend SHA/run and backend versions independently.

Do not guess CLI commands: inspect installed Supabase CLI help/version or use the connected management tools. Current source has no standard supabase/config.toml or complete timestamped migrations directory.

## Rollback

For this documentation change, revert only its documentation commit if needed. For future runtime regressions, prefer a forward corrective commit using the verified baseline while preserving newer safety controls. No force push or blanket reset.

Frontend rollback: review exact source diff and compatibility, run full checks, merge corrective commit, verify its Pages run and live manifest. Do not claim the old SHA is deployed when the corrective commit has a new SHA.

Backend rollback: Pages reversal does not change database or functions. Keep live money blocked, assess current schema compatibility, and redeploy only an explicitly reviewed compatible function. Never remove the Phase 31 interlock to recover an old function. Database financial/audit history is append-only; use compensating transactions/forward migrations, not deletes or replaying old SQL.

Historical refs are listed in VERIFIED_BASELINE.md. Refresh remote refs before use. A branch name can move; pin its full SHA.
