# Phase 19 — Secure Financial Provider Gateway

**Status:** Backend provisioned in existing shared Supabase project; live financial institution activation remains off.

## Provisioned backend

Phase 19 now has real server resources inside **BennyBundles’s Project**:

- Project ref: `xjtvawmppzwzrooairyx`
- Supabase origin: `https://xjtvawmppzwzrooairyx.supabase.co`
- Provider tables: 7
- Vault bridge RPCs: 3
- Edge Function: `thisweek-provider-gateway`
- JWT verification: enabled

The user selected the existing project after Supabase blocked creation of a third free project because the organization had reached its two-active-project limit.

## Shared-project isolation

This Week uses only `tw_provider_*` tables and `tw_vault_*` RPCs.

The provider tables have RLS enabled and direct access revoked from `public`, `anon`, and normal `authenticated` roles.

Vault bridge execution is service-role-only.

The gateway is the intended browser-facing service boundary after Auth is enabled.

## Planning plane

The weekly Plan remains browser-local and authoritative for:

- Available Now
- Bill Protection
- Essentials
- Lifestyle
- planned savings
- weekly transactions
- Scenario
- Weekly Memory

Provider data is supplemental.

## Provider plane

The server stores:

- versioned provider consent;
- Hosted Link sessions;
- provider connections;
- external account metadata/balances;
- provider transactions;
- sync cursors/runs;
- provider conflicts;
- encrypted provider-token references.

## Reconciliation rule

**Provider → Server Sync → Review → Reconcile → Weekly Transaction**

Provider sync never silently creates a weekly transaction.

Pending stays reference-only.

Inflows never silently increase Available Now.

External balances never replace Available Now.

## Security verification

Post-deployment checks confirmed:

- 7 provider tables exist;
- 3 Vault bridge functions exist;
- `anon` cannot execute Vault create;
- normal `authenticated` cannot execute Vault create;
- `service_role` can execute Vault create;
- browser roles cannot SELECT `tw_provider_connections`;
- RLS is enabled on provider connections;
- the Edge Function is ACTIVE;
- `verify_jwt=true`;
- no This Week-specific security or performance advisor finding was returned.

## Current browser state

Production still has:

`LIVE_PROVIDER_CONFIG.enabled = false`

`connect-src 'none'`

No live financial institution is connected.

The client now knows the provisioned backend origin/project ref, but does not use it until Auth/provider activation gates pass.

## Remaining activation work

- recoverable Supabase Auth;
- Plaid credentials/provider approval;
- provider Sandbox testing;
- client Auth/session transport;
- exact CSP allowlist;
- live connection UI enablement.

No browser financial-state migration is required.

Core schema remains v3.

Portable schema remains v1.
