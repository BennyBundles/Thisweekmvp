# This Week — Backend Readiness Contract

**Contract version:** 1  
**Phase:** 13  
**Current production client runtime:** Browser-local Plan; browser network activation disabled  
**Phase 19:** Provider backend provisioned in shared Supabase project; institution activation disabled  
**Phase 20:** Money backend foundation provisioned; money execution disabled

This contract defines the boundary between the existing browser-local product and a future server implementation. It does not enable cloud sync today.

## Current truth

The browser remains the active source of truth.

The future backend must preserve these product semantics:

- Available Now remains a planning signal, not a bank balance.
- Imported or provider activity does not silently mutate the plan.
- Pending and posted activity stay distinct.
- Reconciliation remains explicit.
- Financial mutations require user intent.
- Provider secrets never belong in the client-side data model.

## Portable snapshot

Future backend ingestion can use the portable envelope:

`thisweek.portable`

Current portable schema:

`v1`

Current core schema:

`v3`

Current normalized model:

`2026-09`

Amounts use:

- currency: USD
- unit: integer cents

## Snapshot contract

A future snapshot upload should require:

- authenticated user context;
- client-generated idempotency key;
- stable record IDs;
- portable schema validation;
- normalized relationship validation;
- server-side authorization;
- server-side size limits;
- server-side validation before persistence.

The browser does not currently upload snapshots.

## Change-tracking contract

The current client is:

`snapshot_only`

Before incremental multi-device sync is enabled, the server/client model must add:

- server revision;
- per-record updatedAt or version;
- delete tombstones;
- conflict detection;
- explicit conflict resolution;
- idempotent mutation identifiers.

These are deliberately absent today rather than being simulated incorrectly.

## Conflict rule

The required product rule is:

**Never silently merge conflicting financial mutations.**

Examples that must require deterministic handling:

- the same transaction recategorized on two devices;
- a bill contribution edited on multiple devices;
- a savings-goal amount changed concurrently;
- a category deleted on one device but used by a transaction on another.

Future conflict resolution may use server revision, record version, or another explicit strategy, but it must remain inspectable and deterministic.

## Authentication boundary

Future sync requires an authenticated, user-scoped server session.

The normalized browser export contains a local user ID for relationships. That ID is not an authentication credential.

A future server must map authenticated account identity to authorized data ownership.

## Provider credential boundary

Provider:

- access tokens;
- refresh tokens;
- client secrets;
- provider credentials;

must be stored server-side only.

They must not appear in:

- localStorage;
- portable exports;
- Connected Data records;
- normalized account records;
- downloadable schema manifests.

## Provider adapter interface

Required methods:

- `listAccounts`
- `fetchTransactions`

Optional methods:

- `connect`
- `refresh`
- `disconnect`

Normalized capabilities:

- transactions
- pendingTransactions
- balances
- refresh
- disconnect

Provider data remains supplemental to This Week planning semantics.

## Import and reconciliation mapping

The normalized model preserves:

1. import source;
2. import batch;
3. import record;
4. reconciliation;
5. weekly transaction.

This separation must remain intact on a future backend.

A provider or file row should not become a core weekly transaction until reconciliation is explicit.

## Historical identity

Removed categories and bills may still be referenced by historical weeks.

The normalized model therefore preserves inactive historical references rather than breaking foreign keys.

Future backend migrations should retain equivalent referential integrity.

## Portable restore boundary

The current app can:

- serialize;
- download;
- deserialize;
- validate;

portable data.

It intentionally does **not** apply a portable snapshot back into live state.

Restore/import of a full application snapshot must remain a separate future capability with:

- confirmation;
- preflight validation;
- conflict handling;
- backup/rollback;
- schema migration;
- clear overwrite/merge semantics.

## Machine-readable manifest

The repository includes:

`DATA_MODEL_MANIFEST.json`

The live app can also export a schema-only manifest from:

**Details → System & Settings → Data Model & Export**

The schema manifest contains no financial transaction data.

## Readiness suite

The Phase 13 in-app readiness suite checks:

- V1 → current migration;
- missing-array repair;
- financial-value preservation;
- V2 → V3 metadata migration;
- future-schema non-downgrade;
- normalized relationship integrity;
- USD/integer-cent contract;
- portable serialization round trip;
- provider secret boundary;
- explicit conflict boundary.

The suite is read-only and does not replace the current plan with fixture data.

## Future server implementation order

Recommended order:

1. authenticated user/account model;
2. server persistence for normalized entities;
3. snapshot API with idempotency;
4. server-side schema validation;
5. encrypted provider-token storage;
6. incremental revision/change model;
7. tombstones;
8. conflict-resolution UX;
9. multi-device sync;
10. live financial-provider adapter.

This sequence avoids coupling provider integration to unfinished synchronization or identity infrastructure.


## Phase 19 provider-plane staging

Phase 19 implements the source architecture for a dedicated financial-provider data plane without cloud-migrating the browser-local weekly Plan.

### Current activation state

The production browser remains deny-by-default:

- live provider enabled: false;
- backend origin: provisioned but not browser-allowlisted;
- provider credentials: absent from client;
- `connect-src 'none'`;
- no browser `fetch()` provider path.

This means the current release is **provider-ready source**, not an active institution connection.

### Shared-project isolation

The user selected the existing BennyBundles’s Project after the Supabase free organization reached its active-project limit. This Week resources are isolated by `tw_provider_*` / `tw_money_*` namespaces, RLS, revoked browser grants, server-only secret boundaries, and dedicated JWT-protected Edge Functions.

### Server provider entities

The staged service schema defines:

- `tw_provider_consents`;
- `tw_provider_link_sessions`;
- `tw_provider_connections`;
- `tw_provider_accounts`;
- `tw_provider_transactions`;
- `tw_provider_sync_runs`;
- `tw_provider_conflicts`.

These entities are separate from the existing portable financial model.

### Browser Plan isolation

The Phase 19 provider plane does not become the source of truth for:

- Available Now;
- bills;
- category allocations;
- planned savings;
- weekly Plan structure.

External activity is supplemental and must cross the explicit reconciliation boundary before it becomes a weekly transaction.

### Authentication

Live provider activation requires a recoverable authenticated user identity.

The local browser user ID is not authentication.

The provider gateway must validate the authenticated user for every request and scope server reads/writes to that user.

### Direct table access

Provider tables are intended to be service-layer-only.

The staged schema:

- enables RLS;
- revokes direct table privileges from `anon`, `authenticated`, and `public`;
- requires browser requests to pass through the authenticated provider gateway.

### Provider token storage

Provider application secrets remain Edge Function/server environment secrets.

End-user provider access tokens are designed to be stored using Supabase Vault.

Public provider rows carry only the Vault secret UUID.

The browser never receives or exports the provider access token.

### Initial provider adapter

The staged adapter uses Plaid Hosted Link.

Server flow:

1. verify authenticated user;
2. record versioned provider consent;
3. create Hosted Link token;
4. store the temporary link token in Vault;
5. redirect user through Hosted Link;
6. retrieve successful Link result server-side;
7. exchange public token server-side;
8. store access token in Vault;
9. fetch accounts;
10. synchronize transactions;
11. expose normalized external reference data to the authenticated user.

### Sync semantics

Provider transactions are normalized with:

- stable provider transaction ID;
- provider account ID;
- pending/posted/removed state;
- outflow/inflow direction;
- integer-cent amount;
- transaction date;
- optional authorized timestamp;
- description / merchant metadata;
- provenance hash.

Removed provider activity remains represented as removed server data rather than being silently transformed into Plan activity.

### Reconciliation semantics

Required transition:

`provider -> sync -> review -> reconcile -> weekly transaction`

A provider row does not become a weekly transaction at sync time.

Pending rows remain reference-only.

Inflows remain reference context and never silently increase Available Now.

### External balance semantics

Provider account balances remain external values.

They never replace or redefine Available Now.

### Disconnect

Disconnect must:

- revoke/remove the provider Item where supported;
- delete the Vault access-token secret;
- mark the connection disconnected;
- clear the token reference;
- stop future sync.

### Conflict model

The existing conflict rule remains authoritative:

**Never silently merge conflicting financial mutations.**

Phase 19 adds a server conflict entity so future provider/backend conflicts remain inspectable.

### Activation sequence

The next activation step is infrastructure provisioning, not another client-only feature:

1. use the provisioned shared backend with This Week isolation controls;
2. configure recoverable Auth;
3. retain the applied provider schema;
4. retain the JWT-protected gateway;
5. configure server-only provider credentials;
6. verify Sandbox consent/connect/sync/disconnect;
7. run security/RLS/advisor checks;
8. set the exact production backend origin;
9. update CSP from deny-all to that exact origin;
10. enable the client provider configuration.

The client must not be activated before those gates pass.


## Phase 19 deployed shared backend

The provider plane is now provisioned in **BennyBundles’s Project** (`xjtvawmppzwzrooairyx`) rather than a separate project.

Isolation controls:

- `tw_provider_*` table namespace;
- RLS enabled;
- direct browser-role table grants revoked;
- `tw_vault_*` functions executable only by `service_role`;
- JWT-verified Edge Function `thisweek-provider-gateway`.

Backend readiness has therefore advanced from `staged_not_active` to `backend_provisioned`.

Live-provider readiness is still incomplete because recoverable Auth and provider credentials are not yet configured and client network access remains denied by CSP.

The Plan remains browser-local and provider data remains supplemental/reference data until explicit reconciliation.


## Phase 20 money-layer readiness

Phase 20 adds actual accounting and money-movement domain models without activating live money.

### Current state

- 20 `tw_money_*` server tables are deployed.
- RLS is enabled on all 20.
- direct browser-role table access is revoked.
- `thisweek-money-gateway` is deployed with JWT verification.
- provider execution mode is disabled.
- the production browser remains `connect-src 'none'`.
- the sandbox direct-deposit reward template is inactive.
- no real transfer, bill payment, deposit account or card is active.

### Source-of-truth split

The weekly Plan remains authoritative for planning.

The server money ledger becomes authoritative only for actual custody/accounting events once providers are activated.

Planning and money states must never be silently conflated.

### Ledger contract

Server money postings:

- use integer cents;
- are balanced double-entry journals;
- are idempotent;
- are append-only;
- use compensating entries for reversals/corrections;
- reject allocation moves with insufficient source balance.

### Gateway contract

The authenticated money gateway may eventually execute:

- account/bootstrap and ledger summaries;
- sandbox cash credits;
- money-envelope allocations;
- direct-deposit switch creation;
- virtual-card issuance;
- bill-payment authorization/submission.

Anonymous auth is rejected.

Production provider actions require stronger authentication/MFA and explicit production execution flags.

### Remaining gates

1. recoverable Auth;
2. MFA UX / AAL2 enforcement;
3. provider sandbox credentials;
4. Unit onboarding/account flow;
5. Plaid funding-account bridge;
6. verified provider webhooks;
7. card authorization + hold/settlement controller;
8. Method/Pinwheel discovery/link UX;
9. end-to-end sandbox tests;
10. exact CSP/CORS allowlist;
11. production provider/program approvals and cost approval.


## Phase 22 provider Sandbox chain

The provider integration layer is now code-complete for an end-to-end Sandbox/dev exercise.

Implemented server actions include:

- Unit Sandbox application and status refresh;
- Unit checking deposit-account creation;
- direct Unit Sandbox incoming ACH credit;
- Plaid Auth Hosted Link;
- Plaid-to-Unit processor-token exchange;
- Unit counterparty creation from the processor token;
- authorized external ACH Debit funding into Unit;
- Unit virtual-card creation;
- Unit purchase-authorization simulation;
- Pinwheel Deposit Switch Link-token creation and Web SDK launch;
- Method dev Entity/Connect liability discovery;
- Method dev ACH source creation and micro-deposit verification;
- Method dev Payment submission.

Provider event handlers close the Unit application/account/payment/card loop.

### Current execution state

The code is deployed, but provider calls remain gated by:

`THISWEEK_MONEY_EXECUTION_MODE=sandbox`

and the relevant provider server credentials.

Production still additionally requires `THISWEEK_LIVE_MONEY_ENABLED=true`.

The current repository/client contains no provider secret.

The current production planner network policy remains deny-all.
