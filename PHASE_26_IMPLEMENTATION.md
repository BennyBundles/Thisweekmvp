# Phase 26 — Returns, Negative Balances & Dispute Operations

**Status:** Backend lifecycle handling deployed; Sandbox operations controls wired; production money remains disabled.

## Purpose

Real-money release cannot assume that a transfer, card purchase or bill payment only moves forward.

Phase 26 makes adverse and reversing states first-class:

- ACH return;
- returned/reversed bill payment;
- negative money balance;
- card reversal/refund;
- card dispute;
- provider failure requiring operations review.

## Unit ACH returns

Unit's current ACH model emits `payment.returned` when an originated payment is returned and creates an offsetting returned ACH transaction.

The signed Unit webhook now:

1. marks the matching This Week transfer `returned`;
2. verifies that a corresponding Unit ACH cash credit was actually posted;
3. if so, posts an idempotent compensating journal;
4. opens an ACH-return operational case;
5. evaluates the resulting cash position;
6. if cloud cash becomes negative, opens a critical negative-balance case and applies a restricted risk control.

A return never rewrites the original credit journal.

If no original This Week cash credit exists, the transfer/case is updated but no speculative reversal journal is posted.

## Negative-balance controls

Negative-balance restrictions are narrowly scoped.

They do not downgrade or overwrite:

- `frozen`;
- `closed`;
- an unrelated manual/fraud `restricted` reason.

A cash-ledger restriction can clear only when the cash ledger recovers.

A Unit provider-balance restriction can clear only after a later signed Unit transaction event reports a non-negative provider balance.

The stronger control always wins.

## Card reversals, refunds and disputes

The signed Unit webhook now understands:

- `dispute.created`;
- `dispute.statusChanged`;
- credit `cardReversalTransaction`;
- credit `disputeTransaction`.

Dispute cases track Unit lifecycle states such as:

- InvestigationStarted;
- ProvisionallyCredited;
- Denied;
- ResolvedLost;
- ResolvedWon.

When a signed credit transaction can be mapped to a This Week virtual card, the amount is posted back to that card's bound envelope using a new compensating journal.

If a provider credit cannot be mapped safely, This Week opens an `action_required` case and does **not** guess where to credit the money.

## Method returned payments

Method payment updates already map returned/reversed/failed states.

Phase 26 additionally creates a server operational case for those adverse states, preserving:

- provider payment ID;
- This Week bill-payment reference;
- amount;
- failure/return reason;
- current provider status.

No browser Plan mutation is performed.

## Operational case model

New server-only tables:

- `tw_ops_cases`
- `tw_ops_case_events`

Case events are append-only.

Both tables have RLS and direct browser access revoked.

The browser can only see its own safe operational summary through the authenticated money gateway.

## Money gateway

New authenticated actions:

- `ops_status`
- `unit_sandbox_create_dispute`
- `unit_sandbox_dispute_action`

`ops_status` exposes safe case summaries, user restriction state, cloud cash balance, recent case events, and settled Unit card transactions eligible for Sandbox dispute testing.

Sandbox dispute controls use Unit's current Sandbox endpoints:

- create dispute;
- provisional credit;
- resolve won;
- resolve lost;
- deny.

No production dispute action is enabled by these Sandbox controls.

## Money Lab

Money Sandbox Lab now shows:

- open operational case count;
- cloud cash ledger balance;
- current user restriction;
- eligible settled card transactions;
- open Unit dispute cases;
- Sandbox dispute progression controls.

## Provider semantics

This Week follows the provider event as financial truth.

For Unit, transactions are final records; reversal/refund behavior is represented by a new opposite transaction, which matches This Week's append-only ledger doctrine.

## Production boundary

Unchanged:

- main planner `connect-src 'none'`;
- provider execution defaults disabled;
- production risk policy remains inactive/fail-closed;
- no live provider credentials are committed;
- no public money movement is claimed.

## Remaining public-money operations gates

- run real provider Sandbox returns/disputes end-to-end;
- approved production risk/negative-balance policy;
- staff/admin manual-review tooling with role-based authorization;
- customer dispute initiation/support workflow;
- formal ACH return monitoring and threshold reporting;
- provider/sponsor-bank dispute and return procedures;
- production incident alerts and escalation runbooks;
- provider/program approval and explicit cost approval.
