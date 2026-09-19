# Phase 20 Money Layer

## Purpose

Phase 20 begins the real-money implementation without redefining the existing weekly planning model.

The active weekly Plan remains browser-local and plan-derived. The new server money plane is intended to become the source of truth only for actual custody, transfers, holds, settlements, bill payments, payroll deposits, rewards and card activity.

## Deployed backend

Supabase project: `xjtvawmppzwzrooairyx` — BennyBundles’s Project.

Edge Function:

`thisweek-money-gateway`

JWT verification: enabled.

Money provider execution is locked by default.

Required execution flag:

`THISWEEK_MONEY_EXECUTION_MODE=sandbox`

Production additionally requires:

`THISWEEK_LIVE_MONEY_ENABLED=true`

No production provider execution should be enabled until approvals, compliance controls, webhooks, reconciliation, support and release checks are complete.

## Money tables

20 server tables are installed under the `tw_money_*` namespace.

The main groups are:

- customer/account identity;
- deposit accounts;
- envelopes;
- ledger accounts;
- immutable journals + entries;
- user authorizations;
- external funding accounts;
- transfers + transfer events;
- direct-deposit switches;
- payroll deposits;
- reward offers + enrollments;
- billers + bill payments + bill switches;
- virtual cards + card authorizations;
- provider event inbox.

All 20 tables have RLS enabled.

Direct `public`, `anon` and normal `authenticated` table access is revoked.

Server `service_role` is the only application role with direct table access.

## Ledger invariant

`tw_money_post_journal` only accepts balanced signed integer-cent entries.

`tw_money_journals` and `tw_money_ledger_entries` are append-only.

Corrections must use a compensating journal.

`tw_money_move_balance` locks accounts and rejects a move when the source ledger balance is insufficient.

Both RPCs are executable by `service_role` only.

## Provider adapters in gateway

The initial gateway supports current sandbox-oriented adapters for:

- Unit deposit accounts and individual virtual debit cards;
- Pinwheel Deposit Switch using API version `2025-07-08`;
- Method payments using API version `2025-12-01`;
- Plaid remains the existing bank-link / transaction plane in `thisweek-provider-gateway`.

Provider secrets are read only from server environment variables.

No provider secret, access token, PAN, CVV or full external bank account number belongs in browser storage or portable exports.

## Direct deposit reward

The database contains one test offer:

`TW_DD_SWITCH_25_SANDBOX`

It is deliberately `active=false`.

It must not be shown as an available customer promotion until funding, legal terms, qualification logic, abuse controls and provider/program approval are complete.

## Current activation state

Backend foundation: deployed.

Money execution: disabled.

Browser network: still denied by production CSP.

Recoverable Auth/MFA UX: not yet wired into the static client.

Unit/Pinwheel/Method/Plaid credentials: not supplied through this repository.

Provider webhooks: next implementation slice.

Realtime card authorization controller: next implementation slice.

No live money is currently moved.
