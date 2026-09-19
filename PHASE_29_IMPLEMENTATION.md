# Phase 29 — Automated Health, Reconciliation & Notification Outbox

**Status:** Database monitor active every five minutes; Ops Console wired; external paging channel still intentionally unconfigured.

## Purpose

Phase 29 removes reliance on a staff member manually opening the Ops Console to notice a financial or operational problem.

The database now performs a recurring internal health and reconciliation check and writes durable operational alerts when a condition becomes unhealthy.

## Scheduled monitor

Supabase Cron / pg_cron job:

`thisweek-phase29-health-monitor`

Schedule:

`*/5 * * * *`

Execution:

`select public.tw_ops_monitor_tick();`

This is a database-only monitor. It does not need browser traffic or an Edge Function secret.

## Monitored conditions

Every run checks:

- double-entry journal imbalance;
- failed provider events in the last 15 minutes;
- provider events stuck in received/processing state;
- transfers still authorized/submitted/pending after 24 hours;
- bill payments still authorized/scheduled/submitted/processing after 24 hours;
- overdue critical/high Ops alerts;
- unanswered support beyond the active internal response target;
- overdue manual risk reviews;
- stale operational cases;
- active major/critical incidents.

## Health snapshots

New service-layer-only table:

`tw_ops_health_snapshots`

Each run records:

- health state: healthy / degraded / critical;
- active internal SLA policy version;
- bounded count summary;
- deterministic fingerprint;
- timestamp.

## Monitor run history

New table:

`tw_ops_monitor_runs`

It records successful/failed monitor execution and the produced snapshot.

This provides a monitor heartbeat independent of the current health state.

The Ops Gateway marks the scheduler heartbeat stale when the last snapshot is more than 12 minutes old.

## Alert behavior

Monitor alerts use existing `tw_ops_alerts` records.

New alert types:

- `health_monitor`
- `reconciliation`

The monitor uses stable alert keys and resolves them when the condition clears.

It does not create a new alert on every five-minute run.

## Notification outbox

New service-layer-only table:

`tw_ops_notification_outbox`

High/critical monitor alert transitions create a durable notification entry.

Current channel state:

`external_pending`

This is deliberate. No external Pager/Slack/email destination has been approved or configured yet.

The outbox prevents a critical event from disappearing merely because the external notification integration is not configured.

Staff with `risk_ops` or `admin` may suppress a pending/failed notification with a required reason. Suppression is written to the append-only staff audit trail.

## Ops Console

The console now shows:

- scheduled monitor health;
- scheduler heartbeat freshness;
- ledger mismatch count;
- stuck provider events;
- stale transfers;
- stale bill payments;
- provider failure count;
- pending notification outbox;
- external paging configuration status.

`risk_ops` and `admin` can run the monitor manually.

The existing live health calculation remains visible as a separate immediate view.

## Security

All Phase 29 tables use RLS.

Direct access from:

- public;
- anon;
- authenticated

is revoked.

The monitor RPC is service-role only.

The browser never invokes `tw_ops_monitor_tick` directly; it goes through the AAL2 staff Ops Gateway.

## Initial verification

The first manual monitor run returned:

- health: healthy;
- unbalanced journals: 0;
- stuck provider events: 0;
- stale transfers: 0;
- stale bill payments: 0;
- provider failures: 0;
- active major/critical incidents: 0.

The pg_cron job is active.

## Remaining operations gates

- configure an approved external paging/notification destination;
- build/approve the dispatcher for the notification outbox;
- provision named least-privilege staff accounts;
- validate real Sandbox adverse events through monitoring → notification → triage;
- approve customer-facing support response targets;
- approve retention/access-log policy;
- complete provider/sponsor-bank escalation procedures.

Production money remains disabled.
