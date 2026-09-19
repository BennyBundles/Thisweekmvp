# Phase 32 — Legal Consent, Retention & Sensitive-Access Audit

**Status:** Enforcement infrastructure deployed; production documents and production retention policy remain inactive/unapproved.

## Purpose

Phase 32 makes the existing Phase 31 legal release gates technically enforceable instead of relying on manual assertions alone.

Production live-money readiness now additionally requires:

- an active, approved production disclosure set;
- an active, approved production retention policy;
- active sensitive staff-access audit coverage.

Each individual customer must also have accepted the exact currently active required production disclosure versions before production money actions can execute.

## Legal document registry

New service-layer-only table:

`tw_legal_documents`

Versioned document types include:

- Terms;
- Privacy;
- E-Sign consent;
- ACH authorization;
- card disclosure;
- optional reward terms.

Production template rows are present but remain:

- `active=false`;
- `approved_for_use=false`.

No code change may truthfully turn draft/template legal text into approved production language without an authorized admin action backed by an evidence reference.

## Immutable acceptance receipts

New table:

`tw_legal_acceptances`

Receipts bind:

- authenticated user;
- exact legal document row/version;
- active Supabase session ID;
- acceptance timestamp;
- fixed `accept_v1` affirmation.

Acceptance rows are append-only.

A newer active document version therefore requires a new receipt.

## Customer Account Center

Account Center now renders the current disclosure set returned by the authenticated Account Gateway.

Users can:

- open the referenced document;
- see version and content hash prefix;
- see required/optional status;
- explicitly accept the current version.

Production currently shows no approved active document set, so production readiness remains blocked.

A separate `?legal=sandbox` test mode exposes the Sandbox disclosure fixtures.

## Production per-user enforcement

Production Money Gateway mutations now require:

`tw_user_production_legal_ready(user_id)=true`

Read-only status/summary views remain available.

Production Provider Gateway requires current legal acceptance for:

- provider consent;
- new connection initiation;
- connection finalization;
- provider sync.

Read-only account/transaction views and disconnect remain available.

Production Unit card authorization additionally resolves the card owner and declines fail-closed when that owner is not current on required production disclosures.

Signed provider webhook processing is not blocked by customer legal status because financial events that have already occurred must still be reconciled.

## Retention policy registry

New table:

`tw_retention_policies`

Required production data classes:

- financial ledger;
- provider events;
- support records;
- staff access;
- Auth/security;
- legal acceptance;
- Ops records.

The Sandbox policy is active only for test visibility and uses `review_required`; it does not perform destructive deletion.

Production template policies remain inactive/unapproved pending legal/compliance review.

Phase 32 intentionally does not implement destructive production deletion based on unapproved retention periods.

## Sensitive staff-access audit

New append-only table:

`tw_sensitive_access_events`

Ops status/dashboard reads now write a separate access event containing:

- staff user;
- server-managed role;
- session ID;
- action;
- resource;
- data classes accessed;
- timestamp.

This is separate from the existing staff mutation audit.

## Ops controls

Admin-only operations can activate/revoke:

- legal document versions;
- retention policies.

Both require an evidence reference and also write to the existing append-only staff action audit.

The Ops Console displays:

- production disclosure rows;
- production retention rows;
- current retention readiness;
- recent sensitive staff access.

## Stronger Phase 31 interlock

`tw_release_status()` now includes derived conditions:

- `productionLegalSetActive`;
- `productionRetentionPolicyActive`;
- `sensitiveAccessAuditActive`.

`liveMoneyReady` requires all three in addition to the Phase 31 conditions.

Therefore manually verifying the legal release-gate checkboxes is not sufficient.

## Sandbox fixture

`/legal/sandbox/`

is explicitly:

- noindex/nofollow;
- Sandbox-only;
- not production legal text;
- not a real ACH authorization;
- not a cardholder agreement.

It exists solely to exercise versioned acceptance.

## Production boundary

Still unchanged:

- production legal templates inactive/unapproved;
- production retention template inactive/unapproved;
- main planner `connect-src 'none'`;
- live-money environment flags insufficient by themselves;
- production risk policy still independently required;
- provider/program approvals still independently required;
- no legal approval is fabricated by repository code.
