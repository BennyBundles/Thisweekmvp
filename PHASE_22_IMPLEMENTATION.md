# Phase 22 — Provider Sandbox Chain

**Status:** Orchestration deployed; provider execution remains credential-gated and disabled by default.

## Goal

Phase 22 connects the previously separate Sandbox building blocks into one ordered path:

**recoverable Auth → Plaid Auth → Unit customer/account → external funding → category card → Unit authorization/hold → Pinwheel direct-deposit switch → Method dev bill payment**

The production planner remains browser-local and network-denied.

## Plaid

The provider gateway now requests both:

- `auth`
- `transactions`

Plaid Auth is required for the Unit processor-token flow.

The flow is:

1. explicit provider consent;
2. create Hosted Link session;
3. user completes Plaid Hosted Link;
4. finalize server-side;
5. access token stays in Supabase Vault;
6. provider accounts are stored as masked reference data;
7. money gateway reads the access token server-side;
8. `/processor/token/create` creates a short-lived processor token with `processor: "unit"`;
9. the token is sent directly server-to-server to Unit;
10. the processor token is not persisted by This Week.

Anonymous Supabase users are now rejected by the provider gateway.

## Unit Sandbox

The money gateway now supports:

- `unit_sandbox_application`
- `unit_application_status`
- `unit_create_deposit_account`
- `unit_sandbox_fund`
- `plaid_unit_funding_link`
- `unit_fund_from_external`
- `create_virtual_card`
- `unit_sandbox_authorization`

The Sandbox application uses synthetic test identity data derived from the authenticated user ID and does not persist raw SSN, full routing number, or full account number in This Week.

Only Unit application/customer/account identifiers and masked last-four values are persisted.

The Plaid→Unit funding link creates a Unit ACH counterparty from the Plaid processor token.

A real ACH pull request records explicit user authorization before the provider payment is submitted.

## Unit event loop

The signed Unit webhook now also processes:

- application events → onboarding/KYC state;
- customer creation → Unit customer reference;
- deposit-account creation → masked account state;
- payment events → transfer state;
- non-card ACH credit transaction events → idempotent cash ledger credit.

Card authorization/reversal/settlement behavior from Phase 21 remains in force.

Actual provider webhooks must still be registered with the Unit Sandbox program before event-driven state can complete.

## Pinwheel Deposit Switch

The existing server-side Direct Deposit flow now has a client launch surface in Money Sandbox Lab.

The gateway retrieves the Unit routing/account details server-side, creates a short-lived Pinwheel Link token, and the Lab launches the current Pinwheel Web SDK.

The Link token is kept in memory only and is never persisted to browser storage or logs.

The signed Pinwheel webhook updates direct-deposit switch state.

## Method dev bill pay

Phase 22 adds a complete development path:

1. create a synthetic Method individual Entity;
2. call Method Connect to discover supported liability accounts;
3. persist supported liability references as This Week billers;
4. create a development checking ACH source account;
5. create a micro-deposit verification session;
6. retrieve simulated micro-deposit amounts from Method dev;
7. verify the ACH source account;
8. persist only the Method account reference and masked details;
9. store explicit bill-payment authorization;
10. submit a Method Payment from the verified source to the selected liability.

Method team capabilities remain provider-controlled. If Connect or Payment is not enabled for the Method team, the gateway fails closed with the provider error.

## Money Sandbox Lab

The Lab now provides ordered controls for:

0. refresh chain;
1. Unit Sandbox applicant;
2. refresh Unit KYC/application;
3. create Unit cash account;
4. direct Unit Sandbox ACH credit;
5. Plaid consent + Hosted Link;
6. Plaid finalize;
7. load linked accounts;
8. Plaid → Unit processor funding link;
9. authorized external ACH pull to Unit;
10. category card issuance;
11. Unit purchase authorization simulation;
12. Pinwheel Deposit Switch;
13. Method dev setup;
14. Method dev bill payment;
15. idempotent provider webhook registration.

The webhook-registration action lists/reuses existing registrations before creating missing ones:

- Unit `NotAuthorizationRequest` → `thisweek-money-webhook`;
- Unit `OnlyAuthorizationRequest` → `thisweek-unit-card-authorization`;
- Pinwheel direct-deposit switch/allocation events → `thisweek-money-webhook`;
- Method `payment.update` → `thisweek-money-webhook`.

Unit's webhook token and Method's webhook auth/HMAC secrets are read from server environment only and are never returned to the Lab.

The Lab loads Pinwheel Web SDK v4 from the official Pinwheel CDN. Its CSP still restricts application API traffic to the exact Supabase project origin; only Pinwheel script/frame origins are additionally allowed for the Link modal.

## Execution gates

Code deployment does not activate provider execution.

The money gateway still defaults:

`THISWEEK_MONEY_EXECUTION_MODE=disabled`

Provider calls require server-side credentials:

- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `UNIT_API_TOKEN`
- `PINWHEEL_API_SECRET`
- `METHOD_API_KEY`

Signed webhook processing additionally requires provider webhook secrets/tokens.

The connected Supabase tool available in this environment does not expose secret-management actions, so Phase 22 does not invent or commit credentials.

## Production boundary

Still unchanged:

- main planner `connect-src 'none'`;
- `LIVE_MONEY_CONFIG.enabled=false`;
- money execution mode represented in the client as disabled;
- no active customer reward;
- no claim that live money is moving;
- no provider secret in GitHub Pages, localStorage, sessionStorage, or repository configuration.
