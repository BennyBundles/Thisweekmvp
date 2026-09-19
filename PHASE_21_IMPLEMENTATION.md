# Phase 21 — Signed Provider Events, Realtime Card Authorization & Auth Lab

**Status:** Deployed backend controllers; money execution still locked.

## Signed provider webhook receiver

Deployed Edge Function:

`thisweek-money-webhook`

Supabase `verify_jwt=false` is intentional because external providers do not send Supabase user JWTs.

The function authenticates the provider itself before parsing JSON:

- Unit: `X-Unit-Signature`, HMAC-SHA1, Base64 over the raw request body.
- Pinwheel: `x-pinwheel-signature` v2, HMAC-SHA256 over `v2:{timestamp}:{raw_body}`.
- Method: Base64 auth token plus HMAC-SHA256 over `{timestamp}:{raw_body}`, with a 5-minute timestamp freshness check.

Unsigned or invalid requests are rejected.

The database stores only payload hashes and safe event summaries, not full provider webhook payloads.

## Unit card authorization controller

Deployed Edge Function:

`thisweek-unit-card-authorization`

It also uses `verify_jwt=false` because Unit calls it directly.

It requires a valid Unit HMAC signature before any decision.

Provider execution must additionally be explicitly enabled:

- Sandbox: `THISWEEK_MONEY_EXECUTION_MODE=sandbox`
- Production: `THISWEEK_MONEY_EXECUTION_MODE=production` and `THISWEEK_LIVE_MONEY_ENABLED=true`

With execution disabled, it declines rather than approving spending.

## Envelope authorization rules

The service-role-only `tw_money_reserve_card_authorization` RPC:

1. finds the Unit card;
2. verifies the card is active;
3. enforces optional MCC controls;
4. enforces optional merchant lock;
5. reads the bound envelope ledger balance;
6. applies the configured card amount cap;
7. supports partial approval only when Unit reports that partial approval is allowed;
8. posts an atomic envelope → card-hold journal before returning approval;
9. writes a durable authorization record;
10. returns the prior decision on duplicate provider authorization IDs.

Browser roles cannot execute the RPC.

## Reversal and settlement

`tw_money_release_card_authorization` moves an approved hold back to the original envelope.

`tw_money_settle_card_authorization` converts the hold into a settled money event.

Settlement is allowed to differ from the authorized amount because card-network clearing can differ from the original hold.

If settlement is smaller, the unused hold returns to the envelope.

If settlement is larger, the excess is recorded against the envelope as a separate accounting fact rather than rewriting the authorization.

## Provider event processing

Unit event handling currently supports:

- final authorization decline/reversal → release an existing hold;
- purchase `transaction.created` with an authorization-request relationship → settle the hold;
- authorization decision-source metadata updates.

Pinwheel currently supports:

- `direct_deposit_switch.added` → update the matching switch to confirmed / failed / in progress.

Method currently supports:

- signed payment webhook reception;
- payment-state update when an expanded provider status is present.

Every provider event is idempotently keyed by `provider + provider_event_id`.

## Money Sandbox Lab

Source:

- `money-lab/index.html`
- `money-lab/app.js`

The Lab is deliberately separate from the production planner.

Its CSP allows connections only to:

`https://xjtvawmppzwzrooairyx.supabase.co`

It uses the project's browser-safe publishable key.

Capabilities:

- real Supabase email/password sign-up;
- real sign-in/sign-out;
- tab-scoped session restoration;
- TOTP enrollment;
- TOTP challenge + verification;
- AAL display from the JWT;
- authenticated `thisweek-money-gateway` status;
- money profile bootstrap;
- ledger summary;
- sandbox credit/allocation controls when the server execution mode is Sandbox.

The Lab never stores passwords.

Session tokens use `sessionStorage`, not `localStorage`.

## Production boundary

The main This Week planner still has:

- `connect-src 'none'`;
- no browser money fetch path;
- no live institution connection;
- no live money movement;
- no active reward offer.

The Lab is an isolated integration/test surface, not the production banking UI.
