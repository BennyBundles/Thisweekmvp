# Phase 27 — Staff Operations, Manual Review & RBAC

**Status:** Staff-only backend and console deployed; no staff role is granted by browser code.

## Purpose

Public-money operations require a human review path for risk reviews, returns, negative balances, disputes, provider failures and exceptional customer cases.

Phase 27 adds that path without giving normal users administrative capabilities.

## Authorization model

The Ops Gateway authorizes only these server-managed Supabase Auth application roles:

- `support_ops`
- `risk_ops`
- `admin`

The role is read from:

`user.app_metadata.thisweek_role`

It is never read from `user_metadata`.

Normal users receive `403 staff_role_required`.

Every staff request also requires:

- a valid recoverable Supabase user;
- the JWT's `session_id` to still exist through `tw_auth_session_active`;
- AAL2 MFA.

There is no role-assignment endpoint in the Ops Gateway and no role-escalation control in the browser console.

## Role capabilities

### support_ops

May:

- read operational dashboard;
- acknowledge alerts;
- assign an operational case to self;
- update/resolve operational cases.

May not:

- approve or deny risk reviews;
- freeze/restrict/clear a user control.

### risk_ops / admin

May perform all support actions plus:

- approve / deny / cancel pending risk reviews;
- set user state to normal / restricted / frozen / closed.

## Manual risk reviews

A risk event that originally returned `review` remains unchanged as evidence.

Its `tw_risk_reviews` record carries the human decision.

When the original idempotent financial action retries:

- pending review → still `review`;
- approved review → returns `allow / manual_review_approved`;
- denied review → returns `deny / manual_review_denied`;
- cancelled review → returns `deny / manual_review_cancelled`.

The original risk-event row is not rewritten.

## Staff audit

New table:

`tw_ops_staff_actions`

It is append-only.

Every mutating staff RPC writes:

- staff user ID;
- server-managed staff role;
- action;
- target type;
- target reference;
- reason code;
- bounded safe detail;
- timestamp.

Direct browser access is revoked.

## Alerts

New table:

`tw_ops_alerts`

Alert sources include:

- critical operational case;
- high operational case;
- negative balance;
- provider failure;
- pending manual risk review.

Case/review lifecycle triggers create or resolve the corresponding alert.

Acknowledgment is a separate audited action and does not itself resolve the underlying case/review.

## Ops Gateway

Edge Function:

`thisweek-ops-gateway`

Supabase JWT verification: enabled.

Supported actions:

- `status`
- `dashboard`
- `assign_case`
- `resolve_case`
- `ack_alert`
- `resolve_risk_review`
- `set_user_control`

The service-role key remains server-only.

## Ops Console

Path:

`/ops/`

The console supports:

- staff password sign-in;
- existing TOTP challenge to AAL2;
- alert list/acknowledgment;
- manual risk review approval/denial;
- case assignment and lifecycle update;
- risk user control changes;
- recent staff audit history.

It uses the same tab-scoped `thisweek.auth.session.v1` identity session as Account Center.

## Staff provisioning

Staff role assignment is intentionally not automated from the web application.

An authorized server/admin process must set:

`app_metadata.thisweek_role`

After the metadata change, the staff member must obtain a refreshed/new session before the new role is relied upon.

## Production boundary

Phase 27 does not activate production money.

The production risk policy remains inactive/fail-closed.

No provider credentials are added.

The main planner remains `connect-src 'none'`.

## Remaining staff-operations gates

- provision named staff users through a trusted admin procedure;
- require least-privilege role assignment/review;
- validate real alert/case workflows with Sandbox adverse events;
- production incident notifications/paging;
- formal support runbooks and response SLAs;
- retention/access-log policy approval;
- provider/sponsor-bank escalation procedures.
