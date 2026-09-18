# This Week — Backend Readiness Contract

**Contract version:** 1  
**Phase:** 13  
**Current runtime:** Browser-local / zero-backend

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
