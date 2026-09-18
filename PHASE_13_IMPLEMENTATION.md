# Phase 13 — Data Model Cleanup & Future Backend Readiness

**Status:** Implemented in production source  
**Core migration commit:** `7751f6f3cb6e4a74a425c2f0849782ccfa4f903f`  
**Normalized model commit:** `13d6c30812f486d85accf7ae0aa4103a93095dba`  
**Refinement commit:** `3566ee0088522b997a16e5a9031ea41bded7e80a`

## Objective

Prepare This Week for eventual multi-device/server-backed operation without introducing backend cost now.

The product remains browser-local. Phase 13 adds a normalized entity model, versioned migrations, provider-neutral interfaces, provenance, and portable serialization around that local system.

## Implemented

### Versioned core state

The local model now carries:

- `CORE_SCHEMA_VERSION = 3`
- model version `2026-09`
- explicit USD currency
- integer-cent amount unit
- browser-local persistence marker

The existing storage key remains unchanged for compatibility.

### Migrations

Added:

- V1 -> V2 migration
- V2 -> V3 migration
- schema-version inference
- current-schema migration dispatcher
- structural normalization after migration

Older browser states that lack arrays such as adjustments, transactions, weeks, bill allocations, or category balances are repaired before use.

### Normalized entities

The portable model separates:

- users
- pay profiles
- week rules
- weeks
- categories
- week-category balances
- bills
- bill contribution snapshots
- transactions
- adjustments
- savings policies
- savings goals
- connected-account interfaces
- import sources
- import batches
- import records
- reconciliations
- preferences
- connected-data audit history

### Explicit relationships

`NORMALIZED_ENTITY_MANIFEST` defines primary-key and foreign-key relationships for the future server model.

This creates a direct mapping path to relational tables or another structured persistence layer.

### Provider-agnostic connected account contract

Added interface version 1 with normalized:

- account identity
- provider identity
- account status
- capability flags
- provenance

Required future adapter methods:

- listAccounts
- fetchTransactions

Optional methods:

- connect
- refresh
- disconnect

The browser model explicitly states that provider credentials/tokens must not be stored client-side.

### Import provenance

Local-file imports remain traceable through separate:

- sources
- batches
- records
- reconciliations

Reconciliation remains an explicit transition rather than silently merging imported records into the planning model.

### Bill contribution semantics

Existing weekly bill contribution totals are exported as:

`weekly_aggregate_snapshot`

They are not mislabeled as event-level bank payments.

### Portable export

Added:

- normalized model builder
- portable envelope builder
- envelope validator
- JSON serializer
- JSON deserializer/validator
- downloadable JSON export

The deserializer validates only. It does not overwrite live state.

### New Data Model & Export route

Available from:

**Details -> System & Settings -> Data Model & Export**

The screen displays:

- core schema version
- portable schema version
- normalized model version
- export validation state
- normalized entity counts
- provider interface contract
- import provenance status
- portable JSON export

The screen is read-only except for creating a local download.

## What Phase 13 intentionally does not do

Phase 13 does not add:

- a backend
- user authentication
- cloud sync
- provider credentials
- bank tokens
- conflict resolution
- live account balances
- automatic remote uploads
- portable-state restore into the live app

These remain future infrastructure/security work.

## Completion result

The current browser-local system can now be represented as a versioned normalized envelope whose entity boundaries and relationships are suitable for future server persistence.

That means a later backend can focus on storage, authentication, synchronization, and security rather than requiring the financial product model to be redesigned.


## Continued Phase 13 hardening

### Referential-integrity validation

The normalized model now validates before portable export.

The integrity pass checks:

- collection presence;
- duplicate primary keys;
- manifest-defined foreign-key relationships;
- integer-cent amount fields;
- recognized import direction/status values;
- reconciliation state.

Portable-envelope validation now includes normalized-model integrity instead of checking only top-level collection presence.

### Historical identity preservation

Backend readiness exposed an important edge case: a category or bill can be removed from the current Plan while older weeks and transactions still reference its ID.

Phase 13 now preserves those relationships in the normalized model.

If a historical category is no longer present in current configuration, the portable model creates an inactive:

`Archived category`

reference with:

`provenance: "historical_reference"`

Likewise, historical bill allocations whose bill no longer exists in active configuration receive an inactive:

`Archived bill`

reference.

These records exist to preserve relationship integrity. They do not invent historical financial amounts or reactivate deleted plan items.

### Export integrity summary

Each portable envelope now includes an integrity summary with:

- valid / invalid state;
- error count;
- warning count;
- bounded error details;
- bounded warning details.

Warnings can include preserved archived references.

Errors prevent normal serialization from being treated as a valid portable export.

### Serialization round-trip test

The Data Model & Export screen now contains a non-destructive:

**Run test**

control.

The test:

1. builds the normalized model;
2. serializes it to JSON;
3. parses it through the portable deserializer;
4. validates the parsed envelope again;
5. reports success/failure.

The test never applies the parsed data back into live state.

### Final Phase 13 app refinement

Final Phase 13 source commit:

`a514771f3a5ea2c606cf8a8116c6e6f904613c36`

This refinement completes the practical backend-readiness requirement by ensuring the exported model is not only normalized, but also internally self-consistent before it is considered portable.
