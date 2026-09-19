# Backend and environment

This Week uses shared Supabase project `xjtvawmppzwzrooairyx`. Never reset it or operate on unrelated resources.

## Deployed function inventory

All ACTIVE, inspected 2026-09-19. Source in `supabase/functions/<slug>/`.

| Function | Version | Platform JWT | Application boundary |
|---|---:|---|---|
| thisweek-provider-gateway | 5 | true | Verified recoverable user and active session; Plaid; production interlock |
| thisweek-money-gateway | 11 | true | Recoverable active session, production MFA/risk/interlock |
| thisweek-money-webhook | 6 | false | Provider signatures on raw body; production interlock |
| thisweek-unit-card-authorization | 3 | false | Unit signature; risk + atomic hold; fail-closed interlock |
| thisweek-account-gateway | 1 | true | Active identity; retention-aware closure |
| thisweek-ops-gateway | 5 | true | AAL2, active session, server staff role, audited actions |
| thisweek-support-gateway | 2 | true | Active recoverable user; bounded support operations |
| thisweek-ops-notifier | 1 | false | Single-use expiring database nonce; server-only dispatch |

Provider webhook rules in deployed code: Unit HMAC-SHA1/base64 over raw bytes; Pinwheel v2 HMAC-SHA256 over version/timestamp/raw bytes; Method token plus HMAC-SHA256 and five-minute timestamp freshness. Review the exact function for each provider; do not generalize Method's freshness check to all providers.

Deployed bundle SHA-256 identifiers:

- `thisweek-provider-gateway`: `aba609c0933cb9c713e89bd8ee8b758be1ca3be40ccdbd8f03fbdcd16769b7a4`
- `thisweek-money-gateway`: `e0c3f0fae2838c3f0181fd719c78bd25a5dddac7cad30b5f6c01302177eeae90`
- `thisweek-money-webhook`: `159d30b11b2d5c34d7d127c0c1b06715bea4156602f37ee83d93d054322df336`
- `thisweek-unit-card-authorization`: `3ec1969770f055861c0f51936f07bad1995db5d795d8f40e48e478246249ec99`
- `thisweek-account-gateway`: `623046194edf1464fb272fa676b05f74b953c4545cbe8ed7c426e94dd0d01295`
- `thisweek-ops-gateway`: `ea22487be132f853e0bb9c59bc50331c21a4f3bc179d8b424ffe07d903091d5d`
- `thisweek-support-gateway`: `c84a3e65ceb20de2beb1233d8731d6770e59ef572f42929db5f8272ca1f323f3`
- `thisweek-ops-notifier`: `fb4405383ca318c8c83ae8f96ae8c9d052f633a8759a420611c64e3a47136aae`

## Tables (all 48 public tables have RLS)

Every name below has prefix `tw_`.

| Group | Table suffixes |
|---|---|
| Account | account_closure_requests |
| Provider (7) | provider_accounts, provider_conflicts, provider_connections, provider_consents, provider_link_sessions, provider_sync_runs, provider_transactions |
| Money (20) | money_authorizations, money_bill_payments, money_bill_switches, money_billers, money_card_authorizations, money_customers, money_deposit_accounts, money_direct_deposit_switches, money_envelopes, money_funding_accounts, money_journals, money_ledger_accounts, money_ledger_entries, money_payroll_deposits, money_provider_events, money_reward_enrollments, money_reward_offers, money_transfer_events, money_transfers, money_virtual_cards |
| Risk (4) | risk_events, risk_policies, risk_reviews, risk_user_controls |
| Ops (12) | ops_alerts, ops_case_events, ops_cases, ops_dispatch_nonces, ops_health_snapshots, ops_incident_events, ops_incidents, ops_monitor_runs, ops_notification_channel_status, ops_notification_outbox, ops_sla_policies, ops_staff_actions |
| Support (2) | support_messages, support_requests |
| Release (2) | release_gate_events, release_gates |

DDL/RPC references: phase19 provider; phase20 ledger/money; phase21 cards; phase22 sandbox chain; phase23 account/security; phase24 risk controls; phase25 velocity policy; phase26 returns/disputes; phase27 staff; phase28 support/incidents; phase29 monitoring; phase30 notifier; phase31 activation interlock. Folder numbering and product phase titles are not a migration runner.

Key invariants live in `tw_money_post_journal`, `tw_money_move_balance`, `tw_auth_session_active`, `tw_risk_evaluate_action`, `tw_money_risk_reserve_card_authorization`, `tw_release_status`, `tw_release_money_enabled` and audited staff RPCs. Internal helpers use `tw_internal`; provider tokens use Vault-backed server bridges. Do not expose either to browser callers.

The SQL files are historical applied scripts, not a proven clean rebuild chain. Do not run all files against production. Before future schema work, capture scoped live definitions, grants, policies, triggers, constraints and RPC ACLs, compare against source, and establish a tested migration baseline in an isolated project.

## Scheduled services

- `thisweek-phase29-health-monitor`: `*/5 * * * *`, database health/reconciliation via `tw_ops_monitor_tick()`.
- `thisweek-phase30-notification-dispatcher`: `* * * * *`, pg_net calls notifier with a single-use nonce.
- Nonces expire after five minutes. Claims use SKIP LOCKED with five-minute sending leases and retry backoff bounded to one hour.
- Notification channel is unconfigured. Do not invoke dispatch or configure a destination as a documentation check: it can send messages.
- Internal SLA policy described in Phase 28 is a beta target, not a public customer guarantee.

## Environment and secrets inventory

Names are from checked-in/deployed source. Presence and current values were not inspected. Use Supabase's approved secret-management surface; never paste secret values into git, chat, logs or public configs.

| Names | Location / purpose / safe baseline |
|---|---|
| SUPABASE_URL | Server project URL |
| SUPABASE_ANON_KEY, SUPABASE_PUBLISHABLE_KEY | Browser-safe Auth/API keys where supported; not authorization substitutes |
| SUPABASE_SERVICE_ROLE_KEY | Server only, privileged database access; never browser |
| SUPABASE_PUBLISHABLE_KEYS, SUPABASE_SECRET_KEYS | Provider gateway JSON key-set alternatives; secret set server only |
| THISWEEK_ALLOWED_ORIGINS | Server comma-separated exact origins; default https://bennybundles.github.io |
| THISWEEK_APP_URL | Provider gateway defaults to production planner URL |
| THISWEEK_MONEY_EXECUTION_MODE | Money functions default disabled; sandbox requires explicit controlled setup; do not set production |
| THISWEEK_PROVIDER_EXECUTION_MODE | Provider gateway falls back to money mode, then sandbox; do not assume it defaults disabled |
| THISWEEK_LIVE_MONEY_ENABLED | Literal true is required by live path; leave unset/false; flags never suffice without database gates |
| PLAID_CLIENT_ID, PLAID_SECRET | Server provider credentials |
| PLAID_BASE_URL | Default https://sandbox.plaid.com |
| PLAID_OAUTH_REDIRECT_URI, PLAID_WEBHOOK_URL | Operator-verified registrations; no fabricated values |
| UNIT_API_TOKEN | Server Unit credential |
| UNIT_BASE_URL | Default https://api.s.unit.sh |
| UNIT_WEBHOOK_SECRET | Raw-body Unit verification; server only |
| UNIT_CARD_AUTH_WEBHOOK_SECRET | Card endpoint secret, falls back to UNIT_WEBHOOK_SECRET |
| PINWHEEL_API_SECRET | Server API and webhook verification |
| PINWHEEL_BASE_URL | Default https://api.getpinwheel.com; verify credential environment separately |
| METHOD_API_KEY | Server Method credential |
| METHOD_BASE_URL, METHOD_VERSION | Defaults https://dev.methodfi.com and 2025-12-01 |
| METHOD_WEBHOOK_AUTH_TOKEN, METHOD_WEBHOOK_HMAC_SECRET | Server webhook verification |
| THISWEEK_OPS_NOTIFICATION_WEBHOOK_URL | Approved HTTPS external destination; currently channel unconfigured |
| THISWEEK_OPS_NOTIFICATION_WEBHOOK_BEARER | Optional server-only destination credential |
| RELEASE_SHA, RELEASE_RUN_ID | GitHub workflow staging metadata, not credentials |

Hosted configuration outside Edge env: exact Auth Site URL/redirect allowlist, confirmed-email policy, custom SMTP credentials/sender, Turnstile secret, security notifications. Only Turnstile public site key goes in `account/release-config.js`; all readiness assertions currently false. See ../../AUTH_PRODUCTION_SETUP.md.

GitHub Pages uses workflow permissions contents:read, pages:write, id-token:write. Current workflow has no provider-secret injection or Supabase deployment step. Local static checks require no provider secrets.

## Read-only re-verification queries

Run through authorized management SQL; never grant browser access to make these queries work.

```sql
select public.tw_release_status();
select environment, active from public.tw_risk_policies;
select offer_code, active from public.tw_money_reward_offers;
select channel_key, configured, state from public.tw_ops_notification_channel_status;
select jobname, schedule, active from cron.job where jobname like 'thisweek-%';
select c.relname, c.relrowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' and c.relname like 'tw\_%'
order by c.relname;
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema='public' and table_name like 'tw\_%'
and grantee in ('PUBLIC','anon','authenticated');
```
