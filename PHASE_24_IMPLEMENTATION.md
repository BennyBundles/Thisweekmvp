# Phase 24 — Auth Production Hardening

**Status:** Client/release hardening deployed; hosted Auth operator gates remain explicitly unverified.

## Purpose

Phase 24 converts the Account Center from a beta-capable identity surface into a production-gated identity surface without falsely claiming that hosted Supabase Auth settings have already been configured.

The Account Center remains usable for controlled testing, but public Auth readiness is computed from explicit release assertions.

## Canonical redirects

The public Account Center now uses fixed canonical redirect targets rather than deriving them from the current browser URL.

Confirmation:

`https://bennybundles.github.io/Thisweekmvp/account/`

Recovery:

`https://bennybundles.github.io/Thisweekmvp/account/?mode=recovery`

These values are declared in:

`account/release-config.js`

The hosted Supabase Auth Site URL / redirect allowlist still must be configured to accept these URLs.

## Auth release assertions

The public config records operator-verified release assertions for:

- Site URL;
- redirect allowlist;
- email confirmation requirement;
- CAPTCHA protection;
- production SMTP;
- security notification setup.

The config defaults to **not public-ready**.

`publicAuthReady` is allowed to become true only when the hosted gates and CAPTCHA gate are all explicitly verified.

The deterministic Account Center checker rejects inconsistent readiness declarations.

## CAPTCHA

The Account Center now supports Cloudflare Turnstile when a public Turnstile site key is configured and Supabase CAPTCHA protection has been verified.

The Turnstile site key is intentionally public.

The Turnstile secret key belongs only in the hosted Supabase Auth CAPTCHA configuration and must never be stored in GitHub Pages or repository source.

The browser sends the CAPTCHA result using Supabase Auth's current `gotrue_meta_security.captcha_token` request field for:

- password sign-in;
- signup;
- password recovery.

When CAPTCHA is not configured, the controlled beta Auth flows continue to function, but the public Auth release gate stays blocked.

## Abuse throttling

The Account Center adds tab-scoped client cooldowns:

- signup: 60 seconds;
- password recovery: 60 seconds;
- password sign-in: 2 seconds.

These are UX/abuse backpressure only. They do not replace Supabase's server-side Auth rate limits.

Cooldown state is kept in `sessionStorage`.

## CSP boundary

The Account Center remains isolated from the browser-local planner.

Its network/script/frame policy permits:

- the exact This Week Supabase project origin;
- Cloudflare Turnstile challenge resources.

The main planner continues to use `connect-src 'none'`.

## Deployment gate

The release workflow now deploys and verifies:

- `account/index.html`;
- `account/app.js`;
- `account/release-config.js`.

The Account Center checker executes the release config in an isolated VM and rejects:

- a missing config;
- mismatched canonical URLs;
- `publicAuthReady=true` while required gates are false;
- CAPTCHA marked verified without a public site key;
- server-secret-shaped values in public config;
- localStorage token persistence.

## Still manual / external

The following cannot be truthfully marked complete from repository code alone:

1. hosted Supabase Site URL configuration;
2. hosted redirect allowlist configuration;
3. email-confirmation configuration review;
4. Turnstile widget/site key creation;
5. Supabase CAPTCHA secret configuration;
6. custom SMTP/deliverability setup;
7. security-notification configuration review.

Until those are verified, `publicAuthReady` remains false.
