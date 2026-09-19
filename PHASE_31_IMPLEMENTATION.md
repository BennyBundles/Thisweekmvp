# Phase 31 — Production Activation Interlock

**Status:** Server interlock deployed and currently locked. Production money cannot be activated by environment flags alone.

## Purpose

The financial stack now has enough moving parts that an operator mistake must not be able to activate live money simply by setting:

`THISWEEK_MONEY_EXECUTION_MODE=production`

and:

`THISWEEK_LIVE_MONEY_ENABLED=true`

Phase 31 adds an independent database release interlock.

## Manual release gates

Server-only table:

`tw_release_gates`

Required gates begin false:

- hosted Auth production configuration verified;
- provider Sandbox chain passed end-to-end;
- production provider/banking program approvals complete;
- production provider webhook registrations verified;
- production risk limits reviewed and approved;
- named least-privilege staff coverage provisioned;
- external critical notification delivery tested;
- incident/provider escalation runbook approved;
- retention/access-log policy approved;
- customer terms/privacy/disclosures/authorizations approved;
- provider/program production costs explicitly approved.

A manual gate can be changed only through the service-role RPC and only for a Supabase Auth user whose server-managed app role is `admin`.

Every gate transition is appended to:

`tw_release_gate_events`

The event table is immutable.

## Derived gates

Manual assertions are not sufficient.

`tw_release_money_enabled()` also requires:

1. an active `production` risk policy;
2. configured + healthy external notification channel;
3. at least one server-managed admin staff account;
4. risk staff coverage;
5. support staff coverage.

Therefore incorrectly checking every manual box still cannot enable live money while those derived conditions are absent.

## Financial execution enforcement

The money gateway checks the interlock before every production provider request:

- Plaid;
- Unit;
- Pinwheel;
- Method.

The provider gateway checks it before production Plaid requests.

The signed provider webhook receiver checks it before applying production financial events.

The Unit programmatic card-authorization endpoint checks it before a production approval and declines fail-closed when the gate is not ready.

Sandbox behavior is unchanged.

## Ops Console

The staff dashboard now shows:

- overall live-money readiness;
- manual-gate completeness;
- active production risk-policy state;
- external notification health;
- admin/risk/support staff coverage;
- each required manual gate and its evidence.

Only `admin` receives Verify / Revoke controls.

Every manual change requires an evidence or approval reference and is additionally recorded in the staff audit table.

## Current state

Initial release status is deliberately locked:

- manual gates ready: false;
- production risk policy active: false;
- notification channel healthy: false;
- admin staff coverage: false;
- risk staff coverage: false;
- support staff coverage: false;
- live money ready: false.

No gate was auto-verified during implementation.

## Security boundary

Release tables use RLS and direct browser access is revoked.

Release RPCs are service-role only.

The public planner cannot alter release gates.

Production money remains disabled.
