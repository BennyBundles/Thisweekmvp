# Verified baseline — 2026-09-19

## Exact frontend release

- Repository: https://github.com/BennyBundles/Thisweekmvp
- Main and clean cloned source: `cb7c76f1a68f4b69fa32dc5de104cf5252d665d6` (“Smoke test Phase 31 production interlock”).
- Source tree: `eb806786098c78fc8824e81344d6d9ed500df2a8`.
- [Pages run 35454435207](https://github.com/BennyBundles/Thisweekmvp/actions/runs/35454435207), attempt 1, completed success.
- Validation job `105927111534`: static regression, release smoke, public preview, Money Lab, Account, Operations and Support all success.
- Deployment job `105927133491`: deployment and exact **Verify deployed release** step both success.
- Direct HTTPS read of [release.json](https://bennybundles.github.io/Thisweekmvp/release.json?v=cb7c76f1) independently returned the full SHA above, workflowRunId `35454435207`, deployedAt `2026-09-19T16:16:58.338Z`.
- Prior runs `35454424442` and `35454407244` were cancelled; neither is the verified release.
- GitHub branch response reported `protected=false`. Do not assume server-enforced branch checks exist.
- GitHub reported the baseline commit unsigned. “Verified” here means source/deployment identity and checks, not a cryptographic commit signature.

The manifest still labels the release `v0.15.0-phase15` and retains Phase 15 migration/rollback metadata. These are stale labels, not evidence that only Phase 15 is deployed. Full SHA and run ID identify the actual build. This handoff intentionally does not change runtime release metadata.

## Live Supabase observations

Project `xjtvawmppzwzrooairyx`, “BennyBundles's Project”, us-east-2, ACTIVE_HEALTHY, PostgreSQL 17.6.1.147.

Read-only management inventory and SQL confirmed:
- 48 `public.tw_*` base tables; **48/48 RLS enabled**.
- No direct table grants to PUBLIC, anon or authenticated were returned for those tables.
- All 11 required manual release gates false; `liveMoneyReady=false`.
- Production risk policy inactive; sandbox policy active.
- Admin, risk and support staff coverage all false.
- External notification channel `configured=false`, state `unconfigured`.
- `TW_DD_SWITCH_25_SANDBOX` reward offer `active=false`.
- Health monitor cron active every five minutes; notification dispatcher cron active every minute.
- Eight This Week Edge Functions ACTIVE. See backend inventory.
- Retrieved deployed `index.ts` and `deno.json` for all eight functions and compared with this baseline: **16/16 exact text matches after CRLF→LF normalization**. Bundle hashes are separately recorded; they are not raw source hashes.
- Migration history contains `20260919033441 thisweek_phase19_provider_plane` and `20260919033457 thisweek_phase19_vault_service_bridge`. No later This Week phase migrations appeared in the returned migration history. Later live tables/functions exist, but migration-history completeness and complete SQL-definition parity are **not established**.

## Explicit limits of verification

No secret values were read. Provider credential availability, execution-mode environment values, hosted Auth settings, SMTP, CAPTCHA, provider registrations/approvals, real sandbox end-to-end behavior, and production provider connectivity were not independently verified. A locked database interlock is verified; do not turn that into a claim about unknown secret values.

RLS presence and table-grant inspection are not a complete policy/RPC/trigger security audit. No fresh project-wide advisor or penetration-test claim is made. Cron configuration is verified; sustained monitor health and external delivery are separate evidence requirements. No interactive browser, real user signup/recovery, or money-moving test was performed during this documentation task.

## URLs

Base: https://bennybundles.github.io/Thisweekmvp/
- Planner: https://bennybundles.github.io/Thisweekmvp/?v=cb7c76f1
- Launcher: https://bennybundles.github.io/Thisweekmvp/preview.html?v=cb7c76f1
- Demo: https://bennybundles.github.io/Thisweekmvp/public-preview/?mode=demo&v=cb7c76f1
- Lab: https://bennybundles.github.io/Thisweekmvp/money-lab/?v=cb7c76f1
- Account: https://bennybundles.github.io/Thisweekmvp/account/?v=cb7c76f1
- Ops: https://bennybundles.github.io/Thisweekmvp/ops/?v=cb7c76f1
- Support: https://bennybundles.github.io/Thisweekmvp/support/?v=cb7c76f1
- Supabase dashboard: https://supabase.com/dashboard/project/xjtvawmppzwzrooairyx
- API origin: https://xjtvawmppzwzrooairyx.supabase.co
- Function URLs: API origin + `/functions/v1/<exact-function-slug>`.

## Rollback references

Verified local remote-tracking refs from the clone:
- Current pre-handoff baseline: `cb7c76f1a68f4b69fa32dc5de104cf5252d665d6`.
- `rollback/phase31-pre-production-interlock-2026-09-19`: `715f8cd0d754ad260a2589a948728314d17349d3`.
- `stable/v0.15.0-phase15`: `8caca1c864c0608ce808210605a0b03eb1779655`.
- Legacy release.config rollback SHA: `351a052ba214d4813b296b4cd3dc7965e695b6e1`.

Old refs are historical recovery points, **not recommendations to remove newer safety controls**. A Pages rollback does not roll back Supabase. Do not deploy pre-interlock backend code or reverse database history. Prefer a forward corrective commit preserving all security gates.

## Handoff local validation

Local Node 24.21.0 on Windows passed static regression, release smoke, preview build/check, Money Lab, Account, Ops and Support checks using staged HTML with LF line endings. Initial CRLF validation failed the preview insertion marker; converting only the disposable validation HTML to LF resolved it. Production CI independently passed on Node 22/Linux as recorded above. No application source was changed. Documentation links and diff whitespace were checked separately.
