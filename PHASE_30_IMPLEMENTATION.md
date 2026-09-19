# Phase 30 — External Notification Dispatcher Infrastructure

**Status:** Dispatcher active every minute; delivery channel remains unconfigured and fail-closed.

## Purpose

Phase 29 created a durable notification outbox but did not attempt to deliver externally.

Phase 30 adds the delivery engine without embedding a Pager/Slack/email destination in public source.

## Edge Function

Deployed function:

`thisweek-ops-notifier`

Platform JWT verification is disabled intentionally because the caller is PostgreSQL Cron, not a Supabase user session.

The function is not unauthenticated in practice.

Each invocation requires a one-time nonce issued by a server-only database RPC.

## One-time cron authentication

Cron calls:

`tw_ops_issue_dispatch_nonce()`

The nonce:

- is a random UUID;
- expires after five minutes;
- can be consumed only once;
- is stored in a service-layer-only table;
- is deleted after expiry/consumption age during later issuance.

The notifier must atomically consume the nonce through:

`tw_ops_consume_dispatch_nonce(...)`

Invalid, expired, or replayed nonces are rejected.

## Duplicate-safe delivery

Outbox state now supports:

- pending;
- sending;
- sent;
- failed;
- suppressed.

`tw_ops_claim_notifications(...)` uses row locking with `SKIP LOCKED`.

A claimed notification moves to `sending` with a five-minute lease.

Expired sending leases recover to failed/retryable state.

This prevents overlapping cron invocations from intentionally claiming the same row at the same time.

## Retry behavior

Failed delivery records:

- attempt count;
- bounded error code;
- next-attempt time.

The notifier uses exponential retry backoff bounded to one hour.

Successful delivery moves the row to `sent` and records `sent_at`.

## Destination configuration

The Edge Function reads server-only environment variables:

- `THISWEEK_OPS_NOTIFICATION_WEBHOOK_URL`
- optional `THISWEEK_OPS_NOTIFICATION_WEBHOOK_BEARER`

The URL must be HTTPS.

These values are not present in browser code or repository configuration.

The connected Supabase management surface available in this development environment does not expose Edge Function secret configuration, so no destination is fabricated.

## Fail-closed behavior

When no webhook URL is configured:

- cron still reaches the notifier;
- the nonce is authenticated and consumed;
- notification rows remain pending;
- nothing is marked sent;
- channel status becomes `unconfigured`;
- error code becomes `notification_webhook_not_configured`.

This behavior was manually verified after deployment.

## Cron

Job:

`thisweek-phase30-notification-dispatcher`

Schedule:

`* * * * *`

The job invokes the notifier with `pg_net`.

Both `pg_cron` and `pg_net` are installed in the current Supabase project.

## Notification payload

External delivery uses a bounded payload:

- schema version;
- notification ID;
- event type;
- severity;
- subject;
- safe body;
- optional alert/incident references;
- created timestamp.

It does not include provider secrets, access tokens, full bank numbers, PAN/CVV, passwords, or raw webhook payloads.

## Ops visibility

The Ops Gateway reads:

`tw_ops_notification_channel_status`

and surfaces the real channel state instead of a hardcoded value.

## Remaining release gate

An approved external incident destination must still be selected and configured.

After configuration, the dispatcher must be tested end-to-end with a synthetic high/critical monitor event before public-money activation.

Production money remains disabled.
