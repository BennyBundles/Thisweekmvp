# Phase 20 — Money Layer Foundation

**Status:** Backend foundation deployed; provider execution locked.

## What changed

Phase 20 introduces a separate real-money data plane under the existing This Week planning experience.

The production UI now exposes a Money group under Details with:

- Money Center
- Direct Deposit
- Bill Pay
- Category Cards

Home remains unchanged.

## Accounting model

The server uses an append-only double-entry ledger.

Money can move between server ledger accounts only through balanced postings.

A move from unallocated cash to Bills is represented as:

- unallocated cash: negative amount;
- Bills envelope: positive amount.

A future card authorization moves funds:

- selected envelope: negative;
- card hold: positive.

Settlement/reversal/refund then post their own journal events.

This makes holds and reversals observable instead of mutating historical balances.

## Planning boundary

`Available Now` remains plan-derived.

Future actual custody balance will use a separate product concept such as `This Week Cash`.

No external balance may silently replace Available Now.

Bill Protection does not mean a bill is paid.

A bill becomes paid only after the selected payment rail reaches its paid/settled state.

## Auth boundary

`thisweek-money-gateway` requires a valid Supabase user JWT.

Anonymous Supabase users are rejected.

Provider execution in production is intended to require AAL2/MFA.

The browser client has not yet been network-enabled, so there is no active money session in the current static release.

## Provider execution locks

Default:

- execution mode = disabled
- live money = false

Sandbox provider calls require server credentials plus `THISWEEK_MONEY_EXECUTION_MODE=sandbox`.

Production provider calls additionally require `THISWEEK_LIVE_MONEY_ENABLED=true`.

## Current provider paths

### Direct deposit

Unit account → server fetches routing/account → Pinwheel link token → Deposit Switch.

### Virtual cards

Approved Unit customer/account → Unit individual virtual debit card → This Week stores only provider card id, last four and policy metadata.

Single-use / merchant-locked behavior remains blocked until the realtime authorization controller exists.

### Bill pay

Verified Method source account + supported Method destination liability → explicit This Week bill-payment authorization → idempotent Method payment.

Payment state is kept separate from the Plan.

## Next slice

1. Recoverable Auth UI and MFA enrollment/challenge.
2. Plaid Auth processor-token bridge for Unit funding accounts.
3. Unit hosted/application onboarding and account registration.
4. Provider webhook receiver with signature verification.
5. Realtime card authorization controller and envelope holds.
6. Method/Pinwheel discovery and switch-session UI.
7. Sandbox end-to-end regression suite.
