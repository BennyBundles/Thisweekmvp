# Phase 19 Provider Backend — Activation Package

This directory contains the **staged** server-side financial-provider plane for This Week.

It is intentionally **not deployed to the existing shared Supabase project** and it is intentionally **not active in the GitHub Pages client**.

## Why it is isolated

This Week's financial-provider layer handles:

- provider consent;
- provider connection metadata;
- external account metadata and balances;
- provider transaction reference data;
- sync cursors and sync-run history;
- encrypted provider token references;
- reconnect/error state;
- conflict records.

That data must not be mixed into a shared project containing unrelated applications and services.

Use a **dedicated Supabase project** for This Week before activation.

## What remains browser-local

Phase 19 does **not** cloud-migrate the weekly Plan.

The following continue to use the existing browser-local model:

- Available Now;
- Bills / Bill Protection;
- Essentials;
- Lifestyle;
- savings planning;
- weekly transactions created directly in This Week;
- Scenario;
- Weekly Memory;
- presentation preferences;
- optional local analytics.

Provider activity supplements those systems.

It does not replace them.

## Required activation order

1. Create a dedicated Supabase project for This Week.
2. Review the project Security Advisor before storing financial-provider data.
3. Apply `provider_schema.sql`.
4. Confirm all `tw_provider_*` tables have RLS enabled.
5. Confirm `anon` and `authenticated` do not have direct table grants.
6. Confirm the Vault extension is available.
7. Deploy `thisweek-provider-gateway` with JWT verification enabled.
8. Configure recoverable Supabase Auth for the client.
9. Add provider credentials to Edge Function/server secrets only.
10. Verify consent → connect → sync → review using provider Sandbox.
11. Run security/advisor checks again.
12. Only then change the browser `LIVE_PROVIDER_CONFIG`, CSP `connect-src`, and regression rules to activate network access.

Do not skip from step 3 directly to client activation.

## Edge Function

Source:

`../functions/thisweek-provider-gateway/index.ts`

Runtime configuration:

`../functions/thisweek-provider-gateway/deno.json`

The deployment must require a valid authenticated user JWT.

## Required server environment

Supabase/platform values:

- `SUPABASE_URL`
- publishable/anon key supplied by the Supabase function environment
- a server secret/service-role key supplied by the function environment
- `SUPABASE_DB_URL` — server-side Postgres connection string used only for Vault operations

Provider values:

- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `PLAID_BASE_URL` — start with Sandbox
- optional `PLAID_OAUTH_REDIRECT_URI`
- optional `PLAID_WEBHOOK_URL`

This Week values:

- `THISWEEK_APP_URL=https://bennybundles.github.io/Thisweekmvp/`
- `THISWEEK_ALLOWED_ORIGINS=https://bennybundles.github.io`

Do **not** put the server secret key, database URL, Plaid secret, provider access token, or refresh credential in:

- `index.html`;
- GitHub Pages;
- localStorage;
- portable exports;
- public repository config;
- query strings;
- client logs.

## Token storage

Temporary Hosted Link tokens and long-lived provider access tokens are stored through Supabase Vault.

The public provider tables keep only the Vault secret UUID.

After disconnect:

- the provider Item is removed;
- the Vault secret is deleted;
- the connection is marked `disconnected`;
- its Vault reference becomes null.

## Browser contract

The current production browser has:

- `LIVE_PROVIDER_CONFIG.enabled === false`;
- an empty backend origin;
- no publishable backend key;
- CSP `connect-src 'none'`;
- no application `fetch()` path.

That is deliberate.

A repo containing backend source is not the same thing as a live connection.

## Provider flow

The product flow remains:

**Consent → Provider → Server Sync → Review → Reconcile → Weekly Transaction**

A provider row is not a weekly transaction merely because it exists server-side.

### Pending

Pending provider transactions remain reference data.

### Posted outflow

A posted outflow can enter the browser review queue.

It affects the weekly plan only after explicit reconciliation.

### Inflow

Inflows remain reference/context unless a separate product feature explicitly handles income.

They never silently increase Available Now.

### External balance

External account balances remain separately labeled provider values.

They never replace Available Now.

## Conflict rule

**Never silently merge conflicting financial mutations.**

`tw_provider_conflicts` exists to make provider/backend conflicts inspectable.

Phase 19 provider sync itself does not cloud-sync or merge the browser Plan.

## Provider adapter

The initial adapter source targets Plaid and uses Hosted Link so the static GitHub Pages client does not need an external Plaid JavaScript dependency.

The gateway uses:

- `/link/token/create`;
- `/link/token/get`;
- `/item/public_token/exchange`;
- `/accounts/get`;
- `/transactions/sync`;
- `/item/remove`.

Production provider activation may require provider approval and/or paid usage. It is not assumed to be zero-cost.

## Verification before activation

Minimum required verification:

- successful authenticated status call;
- consent cannot be bypassed;
- another user cannot read the first user's provider data;
- link token is never returned to browser storage;
- provider access token is present only in Vault;
- transaction amounts normalize to integer cents;
- positive provider transaction amounts are treated as outflows for this adapter;
- pending and posted remain distinct;
- duplicate provider transaction IDs are idempotent;
- removed provider transactions are retained as removed/auditable rather than silently mutated into weekly data;
- disconnect deletes the Vault secret;
- provider connection errors do not modify the Plan;
- external balances do not affect Available Now;
- reconciliation remains explicit;
- CSP allows only the dedicated backend origin after activation.
