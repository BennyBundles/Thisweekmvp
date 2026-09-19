# Phase 33 — Cloud Data Export & Privacy Inventory

**Status:** Self-service cloud inventory/export deployed; production money remains locked.

## Purpose

Phase 33 gives an authenticated user a practical way to inspect and download the customer-owned cloud data This Week stores about that account.

This is a product privacy/export capability. It is **not represented as a guarantee that the file alone satisfies every legal data-access request in every jurisdiction**.

Additional access/deletion questions can still require support, legal, fraud, or retention review.

## Export architecture

The Account Gateway exposes:

- `privacy_inventory`
- `privacy_export_start`
- `privacy_export_page`
- `privacy_export_complete`

The export is paginated with a maximum page size of 500 records.

The browser assembles the final JSON file locally.

The server does not create or persist a second full copy of the export.

## Export audit

New append-only table:

`tw_privacy_export_events`

It records:

- export ID;
- authenticated user;
- started/completed event;
- format;
- dataset count;
- completed record count;
- bounded safe metadata;
- timestamp.

It never stores the downloaded payload.

Direct browser table access is revoked.

## Self-service datasets

The export manifest currently covers safe customer-owned views of:

- provider connections;
- masked provider accounts;
- provider transactions;
- money onboarding status;
- masked deposit accounts;
- money envelopes;
- ledger accounts;
- journals;
- ledger entries;
- user authorizations;
- masked funding accounts;
- transfers and transfer events;
- direct-deposit switches;
- payroll deposits;
- reward enrollments;
- billers;
- masked virtual cards;
- card authorizations;
- bill payments and bill switches;
- legal acceptance receipts;
- customer support requests/messages;
- staff access events where the customer is the subject;
- account closure requests;
- prior self-service export history.

The export also contains an identity summary, current disclosure status, retention-policy readiness, and account-closure eligibility.

## Explicit exclusions

The self-service export intentionally does not include:

- provider credentials or Vault secrets;
- full bank account credentials;
- full card credentials;
- raw provider webhook payloads;
- internal fraud-detection logic and risk-model details;
- internal staff notes that were not already customer-visible.

These exclusions prevent the privacy feature from becoming a secrets-exfiltration or fraud-control disclosure path.

They do not assert that an excluded record can never be subject to an authorized legal/privacy request through another process.

## Browser-local Plan boundary

The weekly Plan remains browser-local.

Therefore the cloud export explicitly tells the user that Plan data is not included.

The Account Center links back to the existing planner **Data Model & Export** surface for local Plan export.

## Retention-safe deletion

Phase 33 does not weaken Phase 23 account closure behavior.

When retention-sensitive financial history exists:

- self-service hard deletion remains blocked;
- account closure is routed to retention review.

The privacy inventory displays that state before export/deletion.

## Account Center

The Account Center now exposes:

- Refresh cloud inventory
- Download cloud export
- Export local Plan data

The downloaded artifact uses:

`thisweek.cloud-export.v1`

and includes both an inventory manifest and the assembled datasets.

## Security

- Account Gateway still requires recoverable Auth.
- Active session validation remains required.
- Direct table access remains revoked.
- Export dataset names come from a server allowlist, not arbitrary client table names.
- Selected columns deliberately omit server/provider credentials and full financial credentials.
- Export history is append-only.
- No cloud export is stored in localStorage.
