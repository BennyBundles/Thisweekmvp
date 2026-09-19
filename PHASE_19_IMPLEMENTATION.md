# Phase 19 — Secure Financial Provider Gateway

**Status:** Secure provider architecture staged; live provider activation intentionally disabled  
**Pre-Phase-19 production commit:** `e2c71206ae78b711db6e8baa90390481e3850d24`  
**Rollback branch:** `rollback/phase19-pre-provider-2026-09-18`

## What Phase 19 implements

Phase 19 introduces the infrastructure and product boundaries required for live financial-provider data without pretending that a static GitHub Pages application can safely hold provider credentials.

The implementation is split into two planes:

### Existing planning plane

Remains browser-local:

- Available Now;
- Bills / Bill Protection;
- Essentials;
- Lifestyle;
- planned savings;
- weekly plan transactions;
- Scenario;
- Weekly Memory.

### New provider plane

Designed for a dedicated authenticated backend:

- provider consent;
- provider connections;
- external accounts;
- external balances;
- provider transactions;
- sync cursors and runs;
- provider reconnect/error state;
- encrypted provider token references;
- conflict records.

The provider plane supplements the planning plane.

It does not silently rewrite it.

## Current production state

The GitHub Pages client deliberately remains in:

`LIVE_PROVIDER_CONFIG.state = 'staged'`

and:

`LIVE_PROVIDER_CONFIG.enabled = false`

The current production browser also retains:

`connect-src 'none'`

and contains no application `fetch()` path.

Therefore:

**No live financial institution is connected by this release.**

This is a security property, not an unfinished UI bug.

## Why activation is gated

A safe live connection requires resources that did not exist in the prior static architecture:

1. a dedicated backend project;
2. recoverable authenticated user identity;
3. provider credentials;
4. encrypted provider-token storage;
5. provider consent;
6. server-side transaction synchronization;
7. exact client network allowlisting;
8. reconnect/disconnect/error handling;
9. explicit reconciliation;
10. secure server-side deletion.

Phase 19 creates the source package for these layers while keeping production deny-by-default until the infrastructure is explicitly provisioned.

## Dedicated-backend rule

The connected Supabase workspace contains a generic shared project used by unrelated systems.

It is **not** used for This Week financial-provider data.

The Phase 19 provider backend must be deployed to a dedicated This Week project.

This reduces accidental cross-application access and makes security, deletion, provider secrets, logs, and project-level configuration independently auditable.

## Backend schema

Source:

`supabase/phase19/provider_schema.sql`

Tables:

- `tw_provider_consents`
- `tw_provider_link_sessions`
- `tw_provider_connections`
- `tw_provider_accounts`
- `tw_provider_transactions`
- `tw_provider_sync_runs`
- `tw_provider_conflicts`

All tables enable RLS.

Direct table access for:

- `anon`;
- `authenticated`;
- `public`

is revoked.

Browser access is designed to go through the authenticated service layer rather than directly querying provider tables.

## Server gateway

Source:

`supabase/functions/thisweek-provider-gateway/index.ts`

Runtime config:

`supabase/functions/thisweek-provider-gateway/deno.json`

The gateway:

- validates the authenticated Supabase user;
- scopes every provider query to that user;
- enforces an origin allowlist;
- requires consent before starting a provider connection;
- stores provider access credentials only server-side;
- normalizes provider activity into integer cents;
- separates pending and posted records;
- retains removed provider records as removed;
- exposes external accounts separately from the Plan;
- supports explicit disconnect;
- never writes directly to the browser weekly Plan.

Deployment must use JWT verification.

## Secret storage

Provider credentials such as the Plaid application secret belong in the Edge Function/server secret environment.

End-user provider access tokens are stored using Supabase Vault.

Public provider tables contain only a Vault secret UUID.

Provider secrets are forbidden from:

- GitHub Pages source;
- localStorage;
- portable exports;
- Connected Data browser records;
- query parameters;
- client analytics.

On disconnect:

1. the provider Item is removed;
2. its Vault secret is deleted;
3. the connection is marked disconnected;
4. the Vault reference becomes null.

## Initial provider adapter

The staged adapter targets Plaid.

The gateway source uses:

- `/link/token/create`
- `/link/token/get`
- `/item/public_token/exchange`
- `/accounts/get`
- `/transactions/sync`
- `/item/remove`

The connection UX is designed around Plaid Hosted Link.

Hosted Link lets the static client launch a provider-hosted connection experience without adding Plaid JavaScript to the production page.

The gateway retrieves the successful public token server-side from Link-session results before exchanging it for a long-lived access token.

Provider approval and/or production usage may have cost; this release does not assume paid provider access is available.

## Reconciliation contract

The required flow is:

**Provider → Server Sync → Review → Reconcile → Weekly Transaction**

### Pending activity

Pending activity remains reference-only.

### Posted outflow

A posted provider outflow may be mapped into the Connected Data review model.

It does not affect the weekly Plan until explicit reconciliation.

### Inflow

Provider inflows remain reference context.

They never silently increase Available Now.

### External balance

External account balances are separately labeled external values.

They never replace or redefine Available Now.

## Browser mapping

Phase 19 adds:

`providerTransactionToConnectedRecord()`

This produces the same review semantics already used by file imports:

- pending;
- unmatched posted outflow;
- reference inflow;
- unreconciled by default.

The mapper is staged but not invoked by a network path in current production.

## Consent

The backend schema includes versioned provider consent.

The staged gateway requires a current unrevoked consent record before creating a Hosted Link session.

Consent and provider connection are separate operations.

## Authentication

The random local This Week user ID remains a browser relationship identifier.

It is **not** an authentication credential.

Live provider activation requires a recoverable authenticated user account/session.

Anonymous-only authentication is not treated as sufficient for durable financial-provider access because losing the browser session would make the account unrecoverable.

## Conflict discipline

The product rule remains:

**Never silently merge conflicting financial mutations.**

The provider schema includes `tw_provider_conflicts` for inspectable conflict records.

Phase 19 does not introduce cloud Plan synchronization, so provider sync cannot silently overwrite the local Plan.

## Connected Data Center

Production now displays a Phase 19 readiness section showing four required gates:

1. dedicated backend;
2. recoverable authentication;
3. provider credentials;
4. exact network allowlist.

The connect button remains disabled until those gates are deliberately activated.

CSV/TSV local import remains fully functional.

## Privacy changes

Privacy & Local Data now distinguishes between:

- the active browser-local Plan;
- the staged provider backend source package;
- a future activated provider connection.

The presence of backend source in the repository is not described as an active financial upload.

## CSP / network boundary

This release deliberately keeps:

`connect-src 'none'`

The static checker continues to reject browser:

- `fetch(`
- `XMLHttpRequest`
- `WebSocket`
- `sendBeacon`

A later activation commit must explicitly change these rules to allow only the dedicated backend origin.

That change must occur only after the backend has passed authentication, RLS, consent, token-storage, and provider-Sandbox verification.

## Supabase activation package

See:

`supabase/phase19/README.md`

It documents:

- dedicated-project requirement;
- server environment variables;
- schema order;
- JWT requirement;
- provider Sandbox testing;
- security checks;
- activation sequence.

## Financial schema

No browser financial-state migration is introduced.

- Core schema remains **v3**.
- Portable schema remains **v1**.
- Normalized model remains **2026-09**.

The new provider backend schema is a separate service-layer data plane.

## Phase 16 analytics isolation

No provider behavior was added to local analytics.

Phase 19 does not record:

- institution names in analytics;
- external balances in analytics;
- provider transaction values in analytics;
- provider tokens;
- connection event timestamps;
- Link event history;
- provider clickstream.

## Activation blocker

The source package can be completed and deployed to GitHub Pages without enabling unsafe networking.

Actual live provider activation still requires:

- authorization to create a dedicated Supabase project;
- cost confirmation required by the connected Supabase management flow;
- provider credentials / provider account approval;
- backend security verification.

Until then, production remains intentionally staged and safe.
