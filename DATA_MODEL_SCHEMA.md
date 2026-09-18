# This Week — Normalized Data Model

**Model version:** `2026-09`  
**Core browser schema:** `v3`  
**Portable export schema:** `v1`

This document describes the normalized data model introduced in Phase 13. The live application still operates entirely in the browser, but the normalized model is designed so a future backend can ingest the same entities without redefining the product.

## Core principles

- Money amounts are integer cents.
- Currency is explicitly `USD`.
- Browser-local state remains the active source of truth today.
- Imported activity stays separate from reconciled weekly transactions until the user explicitly applies it.
- Connected-provider data supplements the planning model; it does not redefine Available Now.
- Provider tokens and credentials are not part of the browser-local model.
- Weekly bill contribution records are currently aggregate snapshots, not event-level bank-payment records.

## Schema versions

### Core schema v3

The active local state includes:

- `schemaVersion: 3`
- `modelMeta.model: "2026-09"`
- `modelMeta.currency: "USD"`
- `modelMeta.amountUnit: "cent"`
- `modelMeta.persistence: "browser-local"`

The existing storage key remains `thisweek.state.v2` for compatibility.

### Portable export schema v1

Exports use:

- `exportSchema: "thisweek.portable"`
- `exportSchemaVersion: 1`
- `coreSchemaVersion: 3`
- `modelVersion: "2026-09"`

The export is a read-only snapshot. Importing/restoring that snapshot into live state is intentionally not enabled yet.

## Normalized collections

### users

Primary key: `id`

Fields include:

- id
- createdAt
- timezone

### payProfiles

Primary key: `id`

Foreign key:

- `userId -> users.id`

Fields include:

- netPayCents
- frequency
- anchorAt

### weekRules

Primary key: `id`

Foreign key:

- `userId -> users.id`

Fields include:

- anchorDow
- anchorMinutes
- timezone

### weeks

Primary key: `id`

Foreign key:

- `userId -> users.id`

Fields include:

- startAt
- endAt
- status
- closed
- savingsPlannedCents

### categories

Primary key: `id`

Foreign key:

- `userId -> users.id`

Category types:

- essential
- lifestyle

Fields include:

- name
- active
- weeklyLimitCents
- offsetCents

### weekCategoryBalances

Primary key: `id`

Foreign keys:

- `weekId -> weeks.id`
- `categoryId -> categories.id`

Fields include:

- allocatedCents
- spentCents
- remainingCents
- categoryType

### bills

Primary key: `id`

Foreign key:

- `userId -> users.id`

Fields include:

- name
- active
- amountCents
- frequency
- dueDate

### billContributions

Primary key: `id`

Foreign keys:

- `weekId -> weeks.id`
- `billId -> bills.id`

Fields include:

- contributedCents
- weeklyRequiredCents
- requiredByTodayCents
- status
- recordType

Current `recordType` is `weekly_aggregate_snapshot`. This explicitly distinguishes the planning aggregate from a future event-level funding or payment ledger.

### transactions

Primary key: `id`

Foreign keys:

- `userId -> users.id`
- `weekId -> weeks.id`
- `categoryId -> categories.id`

Fields include:

- amountCents
- note
- source
- importSource
- externalId
- createdAt

### adjustments

Primary key: `id`

Fields include:

- weekId
- targetType
- targetId
- adjustedValueCents
- createdAt

### savingsPolicies

Primary key: `id`

Foreign key:

- `userId -> users.id`

Fields include:

- active
- weeklyAmountCents

### savingsGoals

Primary key: `id`

Foreign key:

- `userId -> users.id`

Fields include:

- name
- type
- active
- priority
- targetCents
- currentCents

### connectedAccounts

Primary key: `id`

Provider-neutral fields include:

- provider
- providerAccountId
- displayName
- status
- capabilities
- provenance

Current local-file import sources are represented as `reference_only` adapter-compatible sources. They do not imply a live bank connection.

### importSources

Primary key: `id`

Fields include:

- name
- kind
- firstImportedAt

### imports

Primary key: `id`

Fields include:

- sourceName
- importedAt
- totalRows
- newCount
- duplicateCount
- recordIds
- externalIds

### importRecords

Primary key: `id`

Foreign key:

- `batchId -> imports.id`

Fields include:

- externalId
- fingerprint
- sourceName
- transactionAt
- description
- amountCents
- direction
- postingStatus
- reviewState
- importedAt

### reconciliations

Primary key: `id`

Foreign keys:

- `importRecordId -> importRecords.id`
- `categoryId -> categories.id`

Fields include:

- externalId
- categoryId
- categoryType
- categoryName
- reconciledAt
- status

### preferences

Primary key: `id`

Foreign key:

- `userId -> users.id`

The normalized preference record currently groups:

- presentation preferences
- Lifestyle soft caps
- recommendation presentation/suppression controls

These do not contain core transaction or bank-balance data.

## Provider adapter contract

Interface version: `1`

Required adapter methods:

- `listAccounts`
- `fetchTransactions`

Optional adapter methods:

- `connect`
- `refresh`
- `disconnect`

Normalized capability flags:

- transactions
- pendingTransactions
- balances
- refresh
- disconnect

A future provider integration may implement these capabilities without changing the financial-planning model.

### Credential boundary

Provider credentials, access tokens, refresh tokens, and secrets must not be stored in this browser-local model.

A future live-provider implementation requires a backend/security layer before any credential-bearing connection is enabled.

## Import provenance

The model preserves four separate concepts:

1. Import source
2. Import batch
3. Imported record
4. Reconciliation

This prevents a file row from becoming a weekly transaction silently.

The transition remains explicit:

`Imported record -> user review -> reconciliation -> weekly transaction`

## Migration functions

Phase 13 adds:

- `inferCoreSchemaVersion()`
- `migrateCoreStateV1ToV2()`
- `migrateCoreStateV2ToV3()`
- `migrateCoreState()`
- `normalizeRuntimeState()`

The migration pipeline is additive and defensive. It repairs missing structural arrays without inventing transaction amounts or financial events.

## Portable serialization

The runtime exposes:

- `buildNormalizedDataModel()`
- `buildPortableDataEnvelope()`
- `validatePortableDataEnvelope()`
- `serializePortableData()`
- `deserializePortableData()`
- `downloadPortableDataExport()`

`deserializePortableData()` validates a portable snapshot but does not apply it to live state.

That deliberate separation prevents an export/import feature from becoming an uncontrolled state mutation path.

## Future server mapping

The normalized entity manifest defines primary keys and relationships so a future backend can map collections into database tables or documents.

A future server migration still requires:

- authentication
- authorization
- conflict resolution
- sync timestamps/versioning
- secure provider-token storage
- API contracts
- privacy/security review
- server-side validation

Those concerns are not simulated in the current browser-only implementation.


## Integrity validation

The portable model is checked by `validateNormalizedDataModel()`.

Current validation covers:

- required normalized collections;
- unique primary keys within each collection;
- manifest-defined foreign-key references;
- integer values for fields ending in `Cents`;
- basic imported-record state consistency;
- reconciliation state consistency.

The portable envelope validator incorporates this integrity result.

## Historical references

Current Plan configuration is not assumed to contain every identity referenced by historical data.

When older weeks or transactions refer to a category that has since been removed from current Plan configuration, export preserves the ID as an inactive `Archived category` with `historical_reference` provenance.

The same approach applies to historical bill allocations through `Archived bill` references.

This allows historical foreign keys to remain valid without reactivating deleted configuration items or fabricating historical amounts.

## Round-trip validation

`serializePortableData()` produces the JSON representation.

`deserializePortableData()` parses and validates that representation without applying it.

The in-app round-trip test confirms:

`normalized model -> portable JSON -> parsed envelope -> validation`

This is a serialization compatibility test, not a restore/sync operation.
