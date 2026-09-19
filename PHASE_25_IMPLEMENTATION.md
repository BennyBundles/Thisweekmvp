# Phase 25 — Risk & Velocity Controls

**Status:** Sandbox policy active; production risk execution fail-closed.

## Purpose

Phase 25 adds This Week application-level fraud/velocity controls before provider execution. These limits are development and product guardrails only; provider, sponsor-bank, ACH-network, card-network, and program limits remain authoritative and may be stricter.

## Deployed model

Server-only resources:

- `tw_risk_policies`
- `tw_risk_user_controls`
- `tw_risk_events`
- `tw_risk_reviews`
- `tw_risk_evaluate_action(...)`
- `tw_money_risk_reserve_card_authorization(...)`

All risk tables have RLS enabled. Direct `public`, `anon`, and normal `authenticated` access is revoked. Risk RPCs are service-role only.

## Decision model

Every guarded action produces an idempotent decision:

- `allow`
- `review`
- `deny`

The evaluation is serialized per user with a database advisory lock so parallel requests cannot independently pass the same daily limit.

The engine supports:

- hard per-transaction amount limit;
- hard daily aggregate amount;
- hard daily action count;
- review threshold;
- user-level `restricted`, `frozen`, or `closed` state;
- deny when no active policy exists.

## Active Sandbox policy

Policy version:

`2026-09-sandbox-v1`

Current development limits:

- external ACH pull: $1,000 hard/transaction, $2,000/day, 5/day; review at $500;
- bill payment: $500 hard/transaction, $1,000/day, 10/day; review at $250;
- virtual-card issuance: 5/day; review when requested card limit is at least $1,000;
- card authorization: $500 hard/authorization, $1,500/day, 50/day;
- direct-deposit switch: 3/day;
- provider funding link: 5/day.

These are Sandbox test controls, not proposed production customer limits.

## Production fail-closed rule

The production template exists but is `active=false`.

There is no active production policy.

Therefore a production risk evaluation denies with `risk_policy_unavailable`.

Enabling provider credentials or browser transport is not sufficient to activate production money.

## Provider ordering

The authenticated money gateway evaluates risk before external execution for:

- Plaid → Unit funding link;
- external ACH pull;
- Unit virtual-card issuance;
- Pinwheel direct-deposit switch;
- Method bill-payment submission.

The shared Method submit function is guarded, so the two-step authorize/submit API cannot bypass policy evaluation.

## Realtime cards

The Unit programmatic authorization endpoint now calls:

`tw_money_risk_reserve_card_authorization`

The wrapper evaluates the risk policy before the envelope hold.

If risk returns review/deny, no envelope hold is posted and the Unit request is declined.

If risk allows, the existing envelope/card-limit/MCC/merchant rules run and may still decline independently.

## User controls

`tw_risk_user_controls` can place a cloud user into:

- normal
- restricted
- frozen
- closed

Any active non-normal state denies guarded money actions.

This is server-only infrastructure for later fraud/support operations tooling.

## Sandbox visibility

Money Sandbox Lab exposes `risk_status`, displaying:

- current environment;
- active policy version;
- user control state;
- recent risk decisions;
- whether a production policy is active.

The direct-deposit Sandbox action now sends a client idempotency key so its velocity accounting is deterministic.

## Remaining public-money gates

- provider Sandbox credentials and end-to-end execution;
- Unit programmatic authorization enablement by the program;
- approved production limits based on actual program/provider agreements;
- operational manual-review tooling;
- ACH return/negative-balance response rules;
- card disputes/refunds operations;
- fraud monitoring/alerts and escalation runbooks;
- production provider approvals and explicit cost approval.
