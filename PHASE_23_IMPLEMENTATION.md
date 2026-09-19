# Phase 23 — Account & Session Security

**Status:** Production identity surface deployed; provider/money execution remains locked.

## Account Center

A new production-facing route is staged at:

`/account/`

It is linked from Details → System & settings → Account & Security.

The Account Center uses only the browser-safe Supabase publishable key and an exact Supabase connect-src allowlist.

Capabilities:

- email/password sign-up and sign-in;
- email-confirmation redirect support;
- password recovery email request;
- password recovery callback handling;
- password update;
- TOTP enrollment/challenge/verification;
- MFA factor removal;
- current AAL display;
- global sign-out;
- server-verified cloud-account status;
- typed cloud-account deletion/closure request.

Auth tokens are stored only in `sessionStorage`.

The Account Center and Money Sandbox Lab share the key:

`thisweek.auth.session.v1`

The old Money Lab key is migrated in-tab and removed.

## Active-session verification

Supabase documents that deleting a user does not retroactively invalidate an already-issued JWT until its expiry.

Phase 23 adds the service-role-only RPC:

`tw_auth_session_active(user_id, session_id)`

It returns only a boolean and does not expose Auth session rows.

The authenticated Money Gateway and Provider Gateway now:

1. verify the JWT with Supabase Auth;
2. reject anonymous users;
3. read the verified JWT's `session_id`;
4. require that user/session pair to still exist;
5. reject the request as `session_revoked` otherwise.

This closes the deletion/revocation window for sensitive This Week server actions.

## Account Gateway

Deployed function:

`thisweek-account-gateway`

JWT verification: enabled.

Actions:

### status

Returns:

- signed-in email;
- email-confirmation state;
- active session id;
- current/next AAL;
- hard-delete eligibility;
- counts of retention-sensitive financial history.

### delete_account

Requires:

- exact typed confirmation `DELETE`;
- confirmation email matching the authenticated account;
- AAL2 when the account has an enrolled second factor.

Before hard deletion, the gateway checks for retained financial history.

If no retention-sensitive money history exists:

- provider Vault secrets are deleted;
- the Supabase Auth user is hard-deleted;
- refresh sessions are removed by Supabase;
- the closure request is marked `hard_deleted`.

If financial history exists:

- no accounting history is destroyed;
- no Auth hard-delete is attempted;
- a `review_required` closure request is stored.

## Local Plan boundary

Cloud-account deletion does not silently remove the browser-local weekly Plan.

The Account Center links users to Privacy & Local Data for local-plan deletion.

This preserves the distinction between:

- local planning state;
- cloud identity;
- provider/money records.

## Remaining release gates

- configure Auth Site URL + exact allowed redirect URLs for the production Account Center;
- production email delivery/custom SMTP review;
- CAPTCHA/abuse controls for sign-up/recovery;
- provider Sandbox credentials + end-to-end testing;
- customer-facing legal/privacy/terms package;
- fraud/risk/operations controls before live money.
