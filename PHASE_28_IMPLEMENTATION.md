# Phase 28 — Customer Support, Incident Monitoring & Internal SLA Health

**Status:** Customer support and staff incident surfaces deployed; production money remains disabled.

## Purpose

Phase 28 closes two public-release operations gaps:

1. customers need a safe way to report account and money issues without directly mutating financial state;
2. staff need one view of support backlog, operational incidents, provider failures, alerts, risk reviews and stale cases.

## Customer Support Center

Path:

`/support/`

The Support Center uses the shared recoverable identity session:

`thisweek.auth.session.v1`

It calls only:

`thisweek-support-gateway`

Supported request types:

- general support;
- account access;
- ACH / transfer;
- bill payment;
- card purchase;
- direct deposit;
- card dispute.

A customer support request never directly triggers:

- a refund;
- a transfer;
- a card authorization;
- a bill payment;
- a provider dispute payout;
- a risk-control change.

Instead, it creates an audited support record and an Ops case.

High priority is server-limited to account-access and card-dispute requests.

## Sensitive-data boundary

Support intake rejects obvious:

- provider/API token patterns;
- password / secret patterns;
- CVV/CVC patterns;
- SSN format;
- 12–19 digit full account/card-number strings.

The UI instructs customers to use last four digits and in-app references instead.

No provider secret belongs in support messages.

## Support data model

New service-layer-only tables:

- `tw_support_requests`
- `tw_support_messages`

Messages are append-only.

Direct `public`, `anon`, and normal `authenticated` table access is revoked.

Service-role-only RPCs:

- `tw_support_create_request`
- `tw_support_add_user_message`
- `tw_support_staff_reply`
- `tw_support_staff_assign`

## Staff support workflow

The Phase 27 Ops Console now includes:

- support queue;
- assignment to current staff user;
- customer-visible reply;
- triaged / waiting-on-user / resolved / closed lifecycle;
- audit records for assignment and reply.

Support updates also synchronize the associated operational case lifecycle.

## Incident model

New staff-only tables:

- `tw_ops_incidents`
- `tw_ops_incident_events`

Incident events are append-only.

Supported components:

- auth;
- provider gateway;
- money gateway;
- provider webhooks;
- risk engine;
- operations;
- support;
- release.

States:

- investigating;
- identified;
- monitoring;
- resolved.

Severities:

- minor;
- major;
- critical.

The Ops Console can open and update incidents. Every mutation is recorded in the staff audit trail.

## Internal SLA / health model

New staff-only table:

`tw_ops_sla_policies`

Active beta policy:

`2026-09-beta-v1`

Internal targets:

- critical alert acknowledgment: 15 minutes;
- high alert acknowledgment: 60 minutes;
- support first response: 240 minutes;
- manual risk review: 240 minutes;
- operational case update: 1440 minutes.

These targets are explicitly:

`public_commitment=false`

They are internal beta operating targets, not customer-facing service guarantees.

The Ops Gateway computes:

- overdue critical alerts;
- overdue high alerts;
- unanswered support;
- overdue risk reviews;
- stale cases;
- provider-event failures in the last 15 minutes;
- active major/critical incidents.

Health is:

- healthy;
- degraded;
- critical.

## Release deployment

Phase 28 also fixes a Phase 27 release gap.

The Pages pipeline now validates, stages and post-deploy verifies:

- `/ops/`
- `/support/`

Previously the Ops Console existed in source but was not included in the GitHub Pages artifact.

## Production boundary

Unchanged:

- main planner remains `connect-src 'none'`;
- production money execution remains disabled;
- production risk policy remains inactive/fail-closed;
- support cannot bypass money controls;
- incident tooling cannot activate provider execution;
- no provider secret is added to browser code.

## Remaining public-release operations gates

- provision named least-privilege staff accounts;
- validate support/incident workflows with real Sandbox adverse events;
- configure external paging/notification channel for critical incidents;
- approve formal customer support response targets and escalation procedures;
- approve retention/access-log policy;
- complete provider/sponsor-bank escalation procedures;
- configure provider Sandbox credentials and execute end-to-end tests;
- complete production provider/program approval and explicit cost approval.


## Post-Phase-33 regression audit — 2026-09-19

Phase 28 was revalidated against the later Phase 33 production baseline to make sure subsequent privacy/legal/operations work did not regress customer support or incident controls.

Live verification results:

- `tw_support_requests`, `tw_support_messages`, `tw_ops_incidents`, `tw_ops_incident_events`, and `tw_ops_sla_policies` all exist.
- all five Phase 28 tables have RLS enabled;
- direct `anon` and normal `authenticated` execution of `tw_support_create_request` is denied;
- `service_role` retains the intended RPC execution path;
- one active internal SLA policy remains present;
- `thisweek-support-gateway` is ACTIVE at v2;
- `thisweek-ops-gateway` is ACTIVE at v6 after later operations phases;
- no Phase 28-specific Supabase security-advisor findings were returned;
- no Phase 28-specific Supabase performance-advisor findings were returned;
- there were no active incidents or open support requests at the time of audit.

The earlier Phase 28 manifest reference to Ops Gateway v2 was historical and has been corrected to the current live v6.

The public-money activation boundary is unchanged.
