# This Week — Staff Operations Access Setup

The public Ops Console is deliberately unusable by ordinary users.

## Roles

Allowed values for Supabase Auth application metadata:

- `support_ops`
- `risk_ops`
- `admin`

The metadata key is:

`thisweek_role`

It must be stored under **app metadata**, not user metadata.

## Why app metadata

Supabase user metadata is user-editable and must not be used for authorization.

Staff roles must be set only through a trusted Supabase admin/server process.

The Ops Console contains no role-assignment action.

## Required staff security

Before a staff account can use `/ops/`:

1. create/verify a recoverable staff Auth account;
2. enroll a verified TOTP factor in Account & Security;
3. assign the least-privilege `app_metadata.thisweek_role` value using a trusted administrator process;
4. sign out and obtain a fresh session;
5. open `/ops/`;
6. complete TOTP to reach AAL2.

The Ops Gateway separately checks that the JWT session ID still exists.

## Least privilege

Use `support_ops` for support staff who only need operational cases/alerts.

Use `risk_ops` only for people authorized to approve risk reviews or freeze/restrict money actions.

Reserve `admin` for exceptional administrative access.

## Current limitation

The connected Supabase management interface available during this build does not expose an Auth-admin metadata assignment action, so no privileged role has been silently granted.

This is intentional.

A trusted administrator must perform the staff-role assignment before the console can return operational data.


## Controlled bootstrap path

The supported staff-provisioning surface is:

`/ops/bootstrap/`

First create a real account through Account & Security, confirm email, and enroll/verify TOTP to AAL2.

The initial admin also requires the server-side Edge Function secret:

`THISWEEK_BOOTSTRAP_ADMIN_EMAIL`

set to the intended initial administrator's exact email address. The value is never returned to the browser.

The first-admin action is available only while no This Week staff role exists. After bootstrap, only an AAL2 `admin` may assign or revoke `support_ops`, `risk_ops`, and `admin` roles. The last admin is protected from removal.

All role changes use server-side Supabase Auth Admin APIs and create append-only `tw_ops_staff_role_events` receipts. Staff should refresh/re-authenticate after a role change.

At the current Phase 34 checkpoint there are zero Auth users, so no staff role has been assigned.
