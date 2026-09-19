# This Week — Security, Privacy & Trust Model

**Current architecture:** Static browser-local application  
**Current hosting:** GitHub Pages  
**Current server foundation:** Phase 19 provider plane + Phase 20 money plane provisioned in Supabase; browser execution disabled  
**Current live bank/provider connection:** None  
**Current live money movement:** None  
**Security baseline:** Phase 14 browser hardening + Phase 19 provider isolation + Phase 20 fail-closed money layer

This document describes the security and privacy boundary of the current This Week build. It is intentionally specific about what the app does and does not protect.

## 1. Where financial data lives

The active product stores its financial planning state in browser storage on the current device/browser profile.

Primary persistent keys use the `thisweek.*` namespace, including:

- core weekly plan/state;
- imported transaction metadata;
- savings goals;
- presentation/accessibility preferences;
- Lifestyle soft-cap preferences;
- recommendation presentation state.

Scenario assumptions use session storage and normally disappear when the browser session ends.

The app does not currently synchronize this state to a This Week server.

## 2. What the host receives

GitHub Pages and ordinary internet infrastructure still receive normal requests needed to deliver the static site.

The current application JavaScript does not upload financial records to an application backend.

The app should therefore not be described as having zero network exposure. Static page delivery still exists.

## 3. No app-level encryption at rest

This Week does not encrypt browser localStorage itself.

Anyone who can access:

- the unlocked device;
- the browser profile;
- browser developer tools;
- a compromised browser extension;
- compromised local browser data

may be able to read stored This Week data.

The current local-storage design is a convenience and zero-infrastructure architecture, not an encrypted financial vault.

## 4. Data minimization

The current planner does not require:

- legal name;
- email address;
- phone number;
- Social Security number;
- bank username/password;
- provider access token.

A randomly generated local app user ID is used for relationships inside the browser data model. It is not an authentication credential.

## 5. Provider credentials

Provider:

- access tokens;
- refresh tokens;
- API keys;
- client secrets;
- passwords

must not be stored in the current browser-local model.

The Phase 13 provider contract explicitly requires future provider secrets to be stored server-side.

## 6. Imported transaction files

Supported local import file types:

- CSV
- TSV
- plain text

Current safety limits:

- 5 MB maximum file size;
- 10,000 data rows;
- 64 columns;
- bounded cell/description length;
- supported text-file extension/MIME validation;
- integer-cent amount range checks;
- valid transaction-date requirement.

Imported text is normalized and treated as data.

The app does not intentionally execute imported:

- HTML;
- JavaScript;
- event-handler attributes;
- script URLs.

Displayed imported strings are HTML-escaped.

Control characters and Unicode bidirectional override/isolate characters are removed from imported text.

## 7. Import trust boundary

Imported records are not automatically treated as weekly spending.

The transition remains:

`file import -> preview -> confirm import -> review -> reconcile -> weekly transaction`

Pending records and inflows remain reference data unless product rules explicitly say otherwise.

This protects the Plan from silent mutation by imported activity.

## 8. Financial source labels

The product distinguishes:

### Plan-derived

Examples:

- Available Now;
- weekly category room;
- required-by-today bill protection;
- planned savings.

These are calculations from the This Week planning model.

They are not bank balances.

### Imported

Transaction records parsed from a local export file.

They remain separate until explicitly reconciled.

### Reconciled

An imported posted outflow explicitly applied to a This Week category.

It affects the weekly plan while retaining import provenance.

### External balance

No live account balance is currently connected.

Available Now must not be presented as an external bank balance.

## 9. Content Security Policy

The current static page uses a Content Security Policy that restricts application network and embedding behavior.

Current important directives include:

- `connect-src 'none'`
- `object-src 'none'`
- `frame-src 'none'`
- `child-src 'none'`
- `worker-src 'none'`
- `base-uri 'none'`
- `form-action 'none'`
- `script-src-attr 'none'`

Inline JavaScript is allowed only through explicit SHA-256 hashes of the two application script blocks.

The regression checker verifies those hashes against the current script contents.

Inline CSS remains necessary for the current monolithic static build.

The CSP is an additional defense boundary. It is not a complete substitute for secure coding or future server security.

## 10. No dynamic-code execution

The production source is checked to prevent:

- `eval()`;
- `new Function()` in the application runtime;
- inline `onclick` attributes;
- inline `onsubmit` attributes.

The static regression checker itself may compile source text in Node for syntax validation; that does not become part of the production browser runtime.

## 11. Network-exfiltration guard

The current browser-only architecture intentionally contains no application:

- `fetch()`;
- `XMLHttpRequest`;
- `WebSocket`;
- `sendBeacon`.

The static regression checker rejects these patterns in the current application source.

A future backend phase must deliberately revisit this boundary rather than silently adding network transmission.

## 12. Export behavior

Financial exports are created locally on user request.

Current export types include:

- normalized portable financial data;
- raw local This Week browser-state export;
- schema-only manifest;
- portable JSON Schema.

Financial-data exports require an explicit acknowledgement that the resulting file can contain sensitive financial information.

After download, the file is outside This Week's control.

The user is responsible for storing or deleting exported copies.

## 13. Delete-local-data behavior

The Privacy & Local Data screen can remove all browser storage keys beginning with:

`thisweek.`

Deletion requires:

1. opening the delete flow;
2. typing `DELETE`;
3. an explicit final confirmation.

After the removal attempt, the app verifies whether any `thisweek.*` keys remain before reporting success/reloading.

This deletion does not remove:

- previously downloaded exports;
- browser/device backups;
- hosting/server access logs;
- copies manually saved elsewhere.

## 14. High-impact financial mutations

High-impact state changes use explicit confirmation where appropriate, including:

- editing an existing Plan;
- starting a new week;
- undoing import reconciliation;
- undoing imported batches;
- clearing import metadata;
- deleting local app data.

Routine deliberate actions such as submitting a new spending entry remain explicit user actions without adding an unnecessary second confirmation to every entry.

## 15. Local trust self-audit

The Privacy & Local Data route can run read-only trust checks covering:

- browser-local storage scope;
- provider-secret-shaped fields;
- external runtime dependencies;
- CSP network-exfiltration boundary;
- import limits;
- imported control-character sanitization;
- imported text escaping;
- provider secret boundary;
- portable restore boundary;
- high-impact confirmation path;
- verified local deletion path;
- sensitive-export acknowledgement.

The audit does not upload data.

## 16. Portable restore remains disabled

The app can:

- serialize;
- export;
- parse;
- validate

portable data.

It does not currently apply a portable export back into live state.

A future restore capability requires:

- backup/rollback;
- schema migration;
- conflict handling;
- overwrite/merge semantics;
- explicit confirmation.

## 17. Threats this architecture does not solve

The current static browser-local build does not protect against every threat.

Examples outside its security boundary include:

- a compromised operating system;
- a compromised browser;
- malicious browser extensions;
- physical access to an unlocked device;
- screenshots or screen recording;
- malware reading browser storage;
- stolen downloaded exports;
- compromised hosting infrastructure;
- future backend vulnerabilities that do not yet exist in this build.

These risks should not be hidden by describing localStorage as secure storage.

## 18. Future backend requirements

Before live multi-device sync or financial-provider integration, This Week still requires:

- authentication;
- authorization;
- secure session management;
- server-side validation;
- encrypted provider-token storage;
- provider consent;
- audit/event logging appropriate to the backend;
- rate limiting;
- abuse controls;
- conflict detection;
- secure deletion semantics;
- privacy policy review;
- incident-response planning.

These are intentionally deferred instead of being simulated in the current client.

## 19. Reporting a security issue

Until a dedicated security-reporting process exists, security issues should be handled through the repository owner rather than exposing sensitive financial examples in a public issue.

Do not include:

- bank exports;
- account numbers;
- credentials;
- access tokens;
- private financial data

in a public bug report.


## 19. Phase 19 staged provider gateway

Phase 19 adds a repository source package for a future authenticated financial-provider backend.

The current GitHub Pages production client still has:

- no active provider session;
- no live institution connection;
- a known Supabase backend origin, but no browser transport to it;
- no browser provider API key;
- no browser provider secret;
- `connect-src 'none'`;
- no application `fetch()` path.

Therefore the existence of Phase 19 server source does **not** mean the current production app uploads financial data.

### Shared-project isolation

The user selected the existing **BennyBundles’s Project** because the free Supabase organization had reached its active-project limit. This Week therefore uses namespaced provider/money tables, revoked browser grants, RLS, server-only secrets, and JWT-protected Edge Functions inside that shared project.

### Authentication

A random browser-local This Week user ID remains a relationship identifier, not authentication.

Live-provider activation requires a recoverable authenticated user-scoped server session.

### Provider secret boundary

Application/provider client credentials must remain server-side.

End-user provider access tokens must remain server-side and are designed to be stored via Supabase Vault.

Provider tokens must never be written to:

- localStorage;
- sessionStorage;
- portable financial exports;
- raw client provider records;
- URL query parameters;
- local analytics.

### Provider data plane

The staged backend separates:

- provider consent;
- connection metadata;
- external accounts;
- external balances;
- provider transactions;
- sync cursors;
- sync-run state;
- conflicts;
- provider-token Vault references.

The local weekly Plan is not cloud-migrated by Phase 19.

### External balances

External provider balances are contextual values.

They must remain explicitly labeled as external and must never be substituted for or merged into Available Now.

### Provider reconciliation

Provider activity must follow:

`provider -> server sync -> review -> reconcile -> weekly transaction`

Pending provider activity stays reference-only.

Posted outflows do not affect the Plan until explicit reconciliation.

Inflows do not silently increase Available Now.

### Disconnect and deletion

When a live provider connection is eventually active, deleting local browser data alone will **not** be sufficient to delete server-side provider data or revoke an institution connection.

Provider disconnect must separately:

1. remove/revoke the provider Item when supported;
2. delete the encrypted provider access token;
3. mark the server connection disconnected;
4. clear provider sync credentials/cursors as appropriate.

The server provider/money schemas exist, but there is no live institution connection, provider token for an end user, or live money execution because activation remains disabled.

### Activation security gate

Before changing the client CSP or enabling browser networking, the provisioned backend must pass:

- authentication and cross-user isolation tests;
- RLS / direct-grant review;
- provider consent checks;
- provider Sandbox connect/sync/disconnect tests;
- encrypted token-storage verification;
- provider-token deletion verification;
- pending vs posted verification;
- idempotent provider transaction sync;
- origin/CORS verification;
- exact CSP allowlist review;
- security-advisor review.

The browser network boundary should only then change from `connect-src 'none'` to the exact dedicated backend origin.

## 20. Phase 19 backend source locations

- `supabase/phase19/provider_schema.sql`
- `supabase/phase19/README.md`
- `supabase/functions/thisweek-provider-gateway/index.ts`
- `supabase/functions/thisweek-provider-gateway/deno.json`
- `PHASE_19_IMPLEMENTATION.md`

These files are activation infrastructure, not proof of an active bank connection.


## 21. Shared-project Phase 19 deployment

The user explicitly selected **BennyBundles’s Project** for Phase 19 after the free Supabase organization reached its active-project limit.

Project ref: `xjtvawmppzwzrooairyx`.

This Week is isolated inside the shared project through:

- dedicated `tw_provider_*` tables;
- RLS on all provider tables;
- revoked direct `public`, `anon`, and `authenticated` table privileges;
- service-role-only `tw_vault_*` RPC functions;
- JWT-protected `thisweek-provider-gateway`.

The shared project does not change the browser trust rule: the weekly Plan remains browser-local.

The backend origin is now known, but production CSP still uses `connect-src 'none'` and live provider activation remains disabled.

Provider secrets are not present in the browser or GitHub Pages source.

No financial institution is connected until recoverable Auth, provider credentials, provider Sandbox verification, and an explicit CSP allowlist are completed.


## 22. Phase 20 money-layer foundation

Phase 20 adds a server-side money data plane while keeping the weekly Plan browser-local.

### Authority separation

The current product has two deliberately separate concepts:

- **Available Now** — plan-derived weekly decision signal;
- **This Week Cash** — reserved product concept for future provider-backed actual funds.

The money ledger must never silently redefine Available Now.

Bill Protection must never be presented as proof a bill was paid.

### Server accounting

The Phase 20 backend includes 20 `tw_money_*` tables for:

- banking customer/account references;
- money envelopes;
- double-entry ledger accounts, journals and entries;
- user payment/transfer authorizations;
- external funding accounts;
- transfers and transfer lifecycle events;
- direct-deposit switches and posted payroll deposits;
- reward offers/enrollments;
- billers, payments and payment-method switches;
- virtual cards and card authorizations;
- provider event ingestion.

All 20 tables have RLS enabled.

Direct `public`, `anon`, and normal `authenticated` table access is revoked.

The JWT-protected `thisweek-money-gateway` uses service-role access after verifying the authenticated user.

Anonymous Supabase users are rejected.

### Append-only ledger

`tw_money_journals` and `tw_money_ledger_entries` are append-only.

A posted financial event is not corrected by rewriting history.

A correction posts a compensating journal.

All journal entries use integer cents and must sum to zero.

The money-move RPC locks the selected ledger accounts and rejects a move when the source balance is insufficient.

### Provider execution lock

Money-provider execution defaults to disabled.

Sandbox calls require:

`THISWEEK_MONEY_EXECUTION_MODE=sandbox`

Production calls additionally require:

`THISWEEK_LIVE_MONEY_ENABLED=true`

The current client has neither condition enabled.

The static production client still uses `connect-src 'none'`.

### Provider roles

Initial provider architecture:

- Plaid — external bank linking / transaction plane;
- Unit — future deposit account and virtual debit card program;
- Pinwheel — future direct-deposit and bill-switch flows;
- Method — future supported-liability bill payments.

Provider credentials remain server-only.

No PAN, CVV, full bank account number, provider API key, or provider access token belongs in localStorage, sessionStorage, portable exports, analytics, or public repository configuration.

### Reward safety

The server contains an inactive sandbox reward template named:

`TW_DD_SWITCH_25_SANDBOX`

It is not a public promotion.

It cannot be advertised or paid until offer funding, legal terms, qualification rules, abuse controls, provider/program approval, and release checks are complete.

### Activation requirements

Before real money is enabled:

1. recoverable Auth and account recovery;
2. MFA/AAL2 for sensitive actions;
3. provider Sandbox credentials;
4. KYC/CIP onboarding flow where required by provider/program;
5. signed/verified provider webhooks;
6. idempotent event processing and reconciliation;
7. realtime card-authorization controller;
8. transfer/ACH return handling;
9. disputes/refunds/reversals support;
10. rate limits and abuse/fraud controls;
11. exact CORS/CSP network allowlist;
12. provider/program approval and any required commercial agreement;
13. security and release review.

No live money currently moves.


## 23. Phase 21 signed provider events and card authorization

Phase 21 adds two externally callable Edge Functions:

- `thisweek-money-webhook`
- `thisweek-unit-card-authorization`

These functions intentionally do not use Supabase platform JWT verification because external providers do not send Supabase user JWTs. They authenticate providers using provider-specific request signatures before parsing or acting on a request.

### Signature rules

Unit requests require `X-Unit-Signature` and HMAC-SHA1/Base64 verification over the raw body.

Pinwheel requests require the v2 `x-pinwheel-signature` format over `v2:{timestamp}:{raw_body}` using HMAC-SHA256.

Method requests require the configured webhook auth token plus HMAC-SHA256 over `{timestamp}:{raw_body}`; the implementation also rejects timestamps outside a five-minute window.

Unsigned or invalid webhook requests are rejected.

Full webhook payloads are not persisted. The provider-event inbox stores a SHA-256 payload hash and a bounded safe summary.

### Realtime card authorization

The Unit authorization endpoint remains fail-closed unless the server money execution mode is explicitly enabled.

Once enabled, it can:

- enforce card active state;
- enforce optional MCC controls;
- enforce optional merchant lock;
- enforce per-card amount limits;
- check the selected money-envelope ledger balance;
- support partial approval when the provider indicates it is allowed;
- post an atomic envelope-to-card-hold journal before approval;
- decline when the envelope cannot cover the request.

Authorization, reversal, and settlement are separate accounting events.

The corresponding database RPCs are executable only by `service_role`.

### Money Sandbox Lab

`/money-lab/` is an isolated integration test surface.

Its CSP permits network access only to the exact Supabase project origin.

It uses only the browser-safe Supabase publishable key.

It supports recoverable email/password Auth, TOTP MFA, tab-scoped session storage, and authenticated calls to `thisweek-money-gateway`.

The main planner keeps `connect-src 'none'` and does not adopt these network permissions.

No live provider credentials or live-money flag are enabled by this phase.


## 24. Phase 22 provider Sandbox chain

Phase 22 wires the real provider Sandbox/dev contracts into one credential-gated flow.

The chain is:

`Supabase Auth -> Plaid Auth/Hosted Link -> Unit application/customer/account -> Plaid processor token -> Unit ACH counterparty -> authorized ACH funding -> Unit virtual card -> signed realtime authorization -> Pinwheel Deposit Switch -> Method dev liability payment`.

### Credential rule

Provider credentials remain server-only and are not available through the connected Supabase management tool used for this implementation.

No credential is invented, copied to the repository, exposed to GitHub Pages, or put into browser storage.

Provider actions fail closed when their server credential is absent.

### Plaid / Unit

Plaid Hosted Link now requests `auth` plus transactions.

The Plaid access token remains in Supabase Vault.

A Unit processor token is generated server-to-server and immediately exchanged into a Unit counterparty; This Week does not persist the processor token.

External ACH funding requires an explicit authorization record before an ACH Debit is originated.

Only masked funding-account data and provider references are stored.

### Unit Sandbox identity

The isolated Sandbox flow can create a synthetic Unit application using test identity data derived from the authenticated user ID.

Raw synthetic SSN, full routing number and full account number are not persisted in This Week.

The production customer onboarding path must not reuse synthetic Sandbox identity generation.

### Method dev

The Method path creates a development Entity, discovers supported liabilities using Connect, creates a development ACH source, verifies it with Method's simulated micro-deposit flow, then submits a Method Payment after explicit This Week authorization.

Full ACH account numbers used during the dev call are not persisted; only masked values and provider IDs are stored.

### Browser boundaries

The normal planner remains `connect-src 'none'`.

The isolated Money Lab may call only the exact Supabase project API. It additionally permits the official Pinwheel Web SDK script/frame origins solely to launch the user-facing Link modal.

No live-money execution flag is enabled by this phase.


## 24. Phase 23 account and session security

The production identity surface is now `/account/`.

It uses the browser-safe Supabase publishable key and restricts browser network access to the exact Supabase project origin.

Auth tokens are kept in `sessionStorage`, not localStorage.

Supported user-security operations include password recovery/update, TOTP MFA, global sign-out, account status and typed cloud-account deletion.

### Revoked-session protection

Sensitive authenticated gateways now validate both the JWT and the JWT's `session_id` against a service-only boolean RPC.

This prevents a revoked/deleted session from continuing to use a still-unexpired JWT against This Week money/provider gateways.

The RPC exposes no Auth session rows and is not executable by browser roles.

### Account deletion

Cloud hard deletion requires typed `DELETE`, matching account email and AAL2 when MFA is enrolled.

If retention-sensitive financial history exists, the request becomes `review_required` and accounting records are preserved.

If hard deletion is eligible, provider Vault secrets are destroyed before the Supabase Auth user is deleted.

Cloud identity deletion remains separate from browser-local Plan deletion.


## 24. Auth production hardening

The Account Center has a separate public release assertion file at `account/release-config.js`.

This file may contain only public configuration and manually verified release-state booleans.

It must never contain:

- Supabase service-role/secret keys;
- CAPTCHA secret keys;
- SMTP passwords;
- provider API secrets;
- refresh/access tokens.

### Canonical redirects

Account confirmation and recovery use fixed production URLs rather than reflecting the current page URL.

This prevents a modified hosting path or query string from becoming an unintended Auth redirect.

### CAPTCHA boundary

The Account Center supports Cloudflare Turnstile when a public site key is configured.

The Turnstile secret remains server-side in hosted Supabase Auth configuration.

CAPTCHA tokens are sent only to Supabase Auth using the current `gotrue_meta_security.captcha_token` field.

The main planner does not load CAPTCHA resources.

### Public readiness

The public Auth surface is deliberately fail-closed.

The release config cannot truthfully set `publicAuthReady=true` until:

- Site URL is verified;
- exact redirect allowlist is verified;
- email confirmation is verified;
- CAPTCHA site key and hosted protection are verified;
- custom SMTP is verified.

The Account Center checker rejects an inconsistent ready state.

### Rate limits

The client adds signup/recovery cooldowns matching the default 60-second Supabase request window as a usability and abuse-backpressure layer.

These client controls are not security authority and do not replace hosted Auth rate limits or CAPTCHA.
