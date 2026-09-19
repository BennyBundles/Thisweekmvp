# Phase 19 Provider Backend

## Current deployment

Phase 19 is provisioned inside the existing Supabase project:

- Project: **BennyBundles’s Project**
- Project ref: `xjtvawmppzwzrooairyx`
- API origin: `https://xjtvawmppzwzrooairyx.supabase.co`
- Edge Function: `thisweek-provider-gateway`
- Function JWT verification: enabled

The free Supabase organization was already at its active-project limit, so the user explicitly selected the existing BennyBundles project instead of a separate third project.

## Isolation inside the shared project

This Week is isolated with dedicated namespaced resources:

- `tw_provider_consents`
- `tw_provider_link_sessions`
- `tw_provider_connections`
- `tw_provider_accounts`
- `tw_provider_transactions`
- `tw_provider_sync_runs`
- `tw_provider_conflicts`
- `tw_vault_create`
- `tw_vault_read`
- `tw_vault_delete`
- Edge Function `thisweek-provider-gateway`

All provider tables have RLS enabled.

Direct table access is revoked from:

- `public`
- `anon`
- `authenticated`

The Vault bridge RPCs are not executable by `anon` or normal `authenticated` users. They are executable only by `service_role`.

Supabase verification after deployment confirmed:

- 7 provider tables;
- 3 Vault bridge functions;
- provider-table direct browser SELECT denied;
- RLS enabled;
- service-role-only Vault bridge access;
- no new This Week-specific security/performance advisor findings.

## What remains browser-local

Phase 19 does **not** cloud-migrate the weekly Plan.

These remain browser-local:

- Available Now;
- Bills / Bill Protection;
- Essentials;
- Lifestyle;
- savings planning;
- weekly Plan transactions;
- Scenario;
- Weekly Memory;
- presentation/accessibility preferences;
- optional local analytics.

The provider plane supplements the Plan. It does not replace it.

## Current activation state

The backend is provisioned, but live financial-institution access is still off.

Production deliberately retains:

- `LIVE_PROVIDER_CONFIG.enabled === false`;
- recoverable provider Auth not yet active;
- Plaid credentials not yet configured;
- CSP `connect-src 'none'`;
- no browser provider `fetch()` path.

Therefore no bank or financial institution is currently connected.

## Provider flow

The required flow remains:

**Consent → Provider → Server Sync → Review → Reconcile → Weekly Transaction**

Pending activity remains reference-only.

Posted provider outflows do not affect the weekly Plan until explicit reconciliation.

Inflows never silently increase Available Now.

External balances remain separately labeled and never replace Available Now.

## Vault design

Plaid/provider application credentials belong in server function secrets only.

End-user provider access tokens are stored through Supabase Vault.

The public provider tables store only the Vault secret UUID.

The service-role-only RPC bridge provides:

- `tw_vault_create`
- `tw_vault_read`
- `tw_vault_delete`

The Edge Function uses those RPCs rather than requiring a raw Postgres connection string.

## Edge Function

Source:

`supabase/functions/thisweek-provider-gateway/index.ts`

Runtime:

`supabase/functions/thisweek-provider-gateway/deno.json`

Deployed function:

`thisweek-provider-gateway`

It validates a Supabase JWT before provider actions.

## Remaining activation gates

1. Configure recoverable Supabase Auth for This Week.
2. Configure Plaid/provider credentials as server secrets.
3. Verify consent/connect/sync/disconnect in provider Sandbox.
4. Verify cross-user isolation.
5. Verify provider token creation/deletion in Vault.
6. Verify pending/posted transaction behavior.
7. Add only the Supabase backend origin to CSP `connect-src`.
8. Add the client Auth/gateway transport.
9. Change `LIVE_PROVIDER_CONFIG.enabled` only after those checks pass.

Provider production usage may carry external cost. This Week does not assume paid provider usage under the current zero-operating-budget constraint.
