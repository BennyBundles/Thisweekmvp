# Changelog

Production changes for **This Week** are recorded here.

## Phase 28 — Customer Support & Incident Monitoring — 2026-09-19

- Added authenticated customer Support & Disputes Center at `/support/`.
- Added service-layer-only support requests/messages and append-only support conversation history.
- Support intake creates reviewable Ops cases and never directly mutates money.
- Added sensitive-input rejection for secret/token patterns, SSNs, and full-length account/card-number strings.
- Added staff support assignment, customer-visible reply, and support lifecycle controls to Ops Console.
- Added staff-only incidents and append-only incident timeline.
- Added internal beta SLA policy and health computation across alerts, support, reviews, stale cases, provider failures, and incidents.
- Marked internal SLA targets as `public_commitment=false`.
- Fixed Pages deployment so `/ops/` is now validated/staged/verified; added the same release treatment for `/support/`.
- Production money remains disabled and production risk remains fail-closed.

### Rollback
- Pre-Phase-28 commit: `99d75d268ddaf9111998b4ca84765fc2c2d46254`
- Rollback branch: `rollback/phase28-pre-support-incident-2026-09-19`

## Phase 27 — Staff Operations, Manual Review & RBAC — 2026-09-19

- Added server-managed staff roles: `support_ops`, `risk_ops`, and `admin`.
- Staff authorization uses `auth.app_metadata.thisweek_role`, active-session verification, and mandatory AAL2.
- Added append-only staff action audit and operational alerts.
- Added staff case assignment/resolution, alert acknowledgment, manual risk review decisions, and guarded user controls.
- Added Ops Console source at `/ops/`; Phase 28 corrected the Pages artifact so this surface is now actually deployed.
- No browser role-assignment or escalation control exists.
- Production money remains disabled.


## Phase 26 — Returns, Negative Balances & Dispute Operations — 2026-09-19

### Operational lifecycle
- Added server-only `tw_ops_cases` and append-only `tw_ops_case_events`.
- Added idempotent operational case tracking for ACH returns, payment returns/reversals, negative balances, card refunds/reversals, card disputes and provider failures.
- Direct browser table access is revoked; operations data is exposed only through authenticated safe summaries.

### ACH returns and negative balances
- Signed Unit `payment.returned` events now mark the matching transfer returned and reverse a previously posted This Week ACH cash credit with a compensating journal.
- No reversal journal is posted if This Week cannot prove that the original cash credit existed.
- Negative cloud cash opens a critical case and restricts guarded money actions.
- Negative-balance controls never downgrade frozen/closed states or overwrite unrelated restrictions.
- Balance-related restrictions clear only when the matching balance source recovers.

### Card refunds and disputes
- Signed Unit dispute events now create/update durable operational cases.
- Credit card-reversal/dispute transactions can post money back to the bound This Week envelope.
- Unmappable provider credits become `action_required` cases instead of being guessed into an envelope.
- Card settlements now persist the provider transaction relationship ID when supplied, improving dispute correlation.
- Added Unit Sandbox dispute creation and lifecycle simulation controls.

### Method adverse payments
- Returned/reversed/failed Method bill payments now create operational cases alongside their provider payment state.

### Money Lab
- Added operational status, cloud cash balance, open case count, eligible settled Unit card transactions, dispute case selection and Sandbox dispute progression controls.

### Provider state
- Money gateway: **v10**
- Signed money webhook: **v5**
- Production money execution remains disabled.

### Rollback
- Pre-Phase-26 commit: `7d3f509cf2abcc88b698d2f03da5eae86d2f5800`
- Rollback branch: `rollback/phase26-pre-return-dispute-operations-2026-09-19`


## Phase 25 — Risk & Velocity Controls — 2026-09-19

- Added server-only application risk policies, user controls, risk-event audit trail, and review queue.
- Added idempotent per-user serialized velocity evaluation for amount/count thresholds.
- Added conservative active Sandbox policy for ACH pulls, bill payments, virtual-card issue, card authorization, direct-deposit switches, and provider funding links.
- Added an inactive production template; production has no active policy and fails closed with `risk_policy_unavailable`.
- Added risk gating before Plaid→Unit link, external ACH pull, virtual-card issue, Pinwheel direct-deposit switch, and Method payment submission.
- Closed the two-step Method authorize/submit bypass by placing the risk check in the shared provider-submit function.
- Realtime Unit card authorization now evaluates risk before posting an envelope hold.
- Added Money Lab risk-status surface and deterministic direct-deposit idempotency key.
- Provider/program/bank limits remain authoritative and may be stricter than This Week application limits.

### Activation state
- Sandbox policy: active.
- Production policy: intentionally inactive.
- Live money: still disabled.
- Reward offer: still inactive.
- Production planner: still `connect-src 'none'`.

### Rollback
- Pre-Phase-25 risk baseline: `0f1fb9df2cbcfbba40bd0232035d6ffa121d42a0`
- Risk rollback branch: `rollback/phase24-pre-risk-controls-2026-09-19`


## Phase 24 — Auth Production Hardening — 2026-09-19

### Canonical Auth redirects
- Added an explicit public Auth release config at `account/release-config.js`.
- Signup confirmation now targets the canonical Account Center URL instead of deriving a redirect from the current browser location.
- Password recovery now targets the exact canonical `/account/?mode=recovery` URL.
- Public Auth readiness defaults to **false** until hosted Supabase settings are manually verified.

### CAPTCHA and abuse protection
- Added optional Cloudflare Turnstile support to the isolated Account Center.
- Added Supabase-compatible `gotrue_meta_security.captcha_token` payloads for password sign-in, signup and recovery.
- Added 60-second client cooldowns for signup/recovery and a 2-second sign-in cooldown as UX abuse backpressure.
- Client cooldowns remain supplemental to Supabase server-side Auth rate limits.
- The Turnstile secret is explicitly prohibited from repository/browser configuration.

### Release readiness
- Added visible hosted Auth release gates for Site URL, redirect allowlist, email confirmation, CAPTCHA and production mail.
- Added `AUTH_PRODUCTION_SETUP.md` with exact operator configuration steps.
- Account Center deployment now includes and verifies `release-config.js`.
- Account checker rejects inconsistent `publicAuthReady` claims, mismatched canonical URLs, CAPTCHA marked verified without a site key, localStorage token persistence and secret-shaped public config.
- Main planner remains `connect-src 'none'`.

### Rollback
- Pre-Phase-24 commit: `0f1fb9df2cbcfbba40bd0232035d6ffa121d42a0`
- Rollback branch: `rollback/phase24-pre-auth-production-hardening-2026-09-19`


## Phase 23 — Account & Session Security — 2026-09-19

- Added production-facing **Account & Security** Center under Details.
- Added email/password signup/signin, password recovery/update, TOTP MFA management and global sign-out.
- Added shared tab-scoped `thisweek.auth.session.v1` identity session for Account Center and Money Lab.
- Added service-role-only `tw_auth_session_active` boolean RPC.
- Money and Provider gateways now reject revoked/deleted sessions even when an issued JWT has not expired yet.
- Deployed JWT-protected `thisweek-account-gateway`.
- Added typed cloud-account deletion with matching-email verification.
- Hard deletion is allowed only when no retention-sensitive financial history exists.
- Financial-history accounts create a review-required closure request instead of deleting ledger history.
- Provider Vault secrets are deleted before eligible Auth hard deletion.
- Planner remains network-denied; Account Center has its own exact Supabase CSP allowlist.
- Added deterministic Account Center validation, staging and post-deploy verification.

### Rollback
- Pre-Phase-23 commit: `cea6de24f3636376534ebb51a56f56e01eee7d5c`
- Rollback branch: `rollback/phase23-pre-account-security-2026-09-19`


## Phase 22 — Provider Sandbox Chain — 2026-09-19

### End-to-end provider orchestration
- Upgraded Plaid Hosted Link to request Auth + Transactions and reject anonymous Supabase users.
- Added server-side Plaid processor-token creation for Unit without persisting the processor token.
- Added Unit Sandbox application, KYC/application refresh, checking-account creation, Sandbox ACH funding and external ACH Debit funding.
- Added Unit counterparty creation from Plaid processor tokens with only provider refs/masked account metadata persisted.
- Added Unit Sandbox purchase-authorization simulation into the Phase 21 envelope authorization controller.
- Extended signed Unit webhooks to update applications/customers/accounts/transfers and post idempotent settled ACH credits to the cash ledger.
- Added Pinwheel Web SDK v4 launch in the isolated Money Lab using a short-lived in-memory Link token.
- Added Method dev Entity creation, Connect liability discovery, ACH source creation, simulated micro-deposit verification and Method Payment submission.
- Expanded Money Lab into a guided 0–14 provider Sandbox chain.
- Added Phase 22 release checks for Plaid Auth, Unit processor-token flow, Method dev setup/payment, Pinwheel SDK, credential gating and continued production network denial.
- Added credential-gated, list-before-create provider webhook registration for Unit general events, Unit authorization requests, Pinwheel direct-deposit events, and Method payment updates.
- Money Sandbox Lab now includes step **15 · Register provider webhooks**; signing secrets remain server-only and are never returned to the browser.
- Added credential-preflight diagnostics for Plaid, Unit, Pinwheel and Method with explicit `missing_credentials`, `execution_locked`, `credential_valid`, and `credential_rejected` states.
- Provider preflight is read-only and never bypasses `THISWEEK_MONEY_EXECUTION_MODE`; external credential checks run only in Sandbox execution mode.
- Money Lab provider controls now disable themselves based on authenticated gateway readiness instead of enabling every provider action after sign-in.

### Activation state
- Provider orchestration code: deployed.
- Money execution: still disabled by default.
- Provider credentials: not stored in the repository/client and cannot be invented by the implementation.
- Production planner: still `connect-src 'none'`.
- No claim of live money movement.

### Rollback
- Pre-Phase-22 commit: `49898501c6587805380b20a8f135fb22629f064c`
- Rollback branch: `rollback/phase22-pre-provider-sandbox-chain-2026-09-19`


## Phase 21 — Signed Events & Realtime Authorization — 2026-09-19

### Provider event security
- Deployed `thisweek-money-webhook` as an external-provider endpoint with provider signature verification rather than Supabase user JWT authentication.
- Added raw-body Unit HMAC-SHA1 verification, Pinwheel v2 HMAC-SHA256 verification, and Method auth-token + HMAC-SHA256 verification with timestamp freshness.
- Added payload hashing and bounded safe event summaries instead of persisting full webhook payloads.
- Added idempotent provider-event storage and initial Unit, Pinwheel Direct Deposit Switch, and Method payment-state handlers.

### Category-card authorization
- Deployed `thisweek-unit-card-authorization` as the fail-closed programmatic authorization endpoint.
- Added service-role-only atomic card authorization, reversal, and settlement RPCs.
- Category-card authorization can enforce envelope balance, optional MCC controls, merchant lock, amount caps and provider-permitted partial approval.
- Approved requests reserve money from the bound envelope into a card hold before the approval response is returned.
- Reversals release the hold; settlement consumes the hold and records settlement differences without rewriting authorization history.
- Provider execution remains disabled, so this controller does not currently approve real spending.

### Recoverable Auth sandbox
- Added the isolated `/money-lab/` integration surface.
- Added real Supabase email/password Auth, TOTP enrollment/challenge/verification, AAL display, authenticated money-gateway calls, profile bootstrap and ledger summary.
- Money Lab tokens use tab-scoped `sessionStorage`.
- Money Lab CSP allows only the exact Supabase origin; the production planner remains `connect-src 'none'`.
- Added deterministic Money Lab validation and deployment verification.

### Rollback
- Pre-Phase-21 commit: `d2fe86acb23a776529ea3a15b2886bae5ef6248e`
- Rollback branch: `rollback/phase21-pre-webhooks-2026-09-19`


## Phase 20 — Money Layer Foundation — 2026-09-19

### Real-money architecture
- Added 20 isolated `tw_money_*` server tables for money customers/accounts, envelopes, double-entry ledger history, transfers, payroll/direct deposit, rewards, bill payments, virtual cards, authorizations, and provider-event processing.
- Enabled RLS on every money table and revoked direct `public`, `anon`, and normal `authenticated` access.
- Added service-role-only balanced journal and atomic money-move RPCs.
- Made posted ledger journals/entries append-only; corrections require compensating entries.
- Added an inactive `TW_DD_SWITCH_25_SANDBOX` reward template. It is not a customer promotion.
- Deployed JWT-protected `thisweek-money-gateway` with provider execution disabled by default.
- Added server adapters for Unit Sandbox, Pinwheel Deposit Switch, and Method payments while retaining Plaid as the existing external-bank connection plane.
- Gateway rejects anonymous Supabase users and requires an explicit execution mode before provider calls can occur.
- Added production UI routes under Details → Money for Money Center, Direct Deposit, Bill Pay, and Category Cards without adding Home clutter.
- Preserved **Available Now** as a plan-derived signal and separated future actual custody under a distinct money plane.
- Preserved **Bill Protection ≠ bill paid** semantics.
- Production still uses `connect-src 'none'`; there is no browser money API transport and no live money movement.

### Activation status
- Backend foundation: deployed.
- Provider execution: disabled.
- Live money flag: false.
- Recoverable Auth/MFA: not yet connected to the production browser client.
- Provider credentials: not present in the repository/client.
- Webhook and realtime card-authorization controllers: not yet activated.
- No real deposit account, bill payment, transfer, payroll switch, customer reward, or virtual card is live.

### State migrations
- No browser financial-state migration.
- Core planning schema remains **v3**.
- Portable data schema remains **v1**.
- Phase 20 is a separate server money plane.

### Rollback
- Pre-Phase-20 commit: `daf7785e299fc7ec2865056e356d0263c037531f`
- Rollback branch: `rollback/phase20-pre-money-layer-2026-09-19`


## Phase 19 — Secure Provider Gateway (staged) — 2026-09-18

### Shared Supabase provisioning
- Provisioned the Phase 19 provider plane inside **BennyBundles’s Project** after the free organization reached its two-active-project limit.
- Created 7 `tw_provider_*` provider tables with RLS and revoked direct browser-role access.
- Added service-role-only `tw_vault_create`, `tw_vault_read`, and `tw_vault_delete` Vault bridges.
- Deployed `thisweek-provider-gateway` with JWT verification enabled.
- Verified browser roles cannot directly read provider connection data and cannot execute Vault create; service-role access succeeds.
- Updated the client with the real Supabase project ref/origin while keeping live provider activation disabled and CSP `connect-src 'none'`.


### Provider architecture
- Added a dedicated provider-backend schema package for consent, connection metadata, external accounts/balances, provider transactions, sync runs, and conflict records.
- Added a JWT-authenticated Supabase Edge Function source package for a Plaid Hosted Link adapter, server-side account/transaction synchronization, Vault token references, and explicit disconnect.
- Added an activation guide; Phase 19 was subsequently provisioned in the user-approved shared Supabase project with This Week-specific isolation controls.
- Added a Phase 19 readiness plane to Connected Data with a deliberately disabled institution-connect action.
- Added provider-record normalization into the existing review semantics: pending stays reference-only, posted outflows require explicit reconciliation, and inflows never silently increase Available Now.
- Added explicit external-balance labeling: provider balances never replace or redefine Available Now.
- Extended Privacy & Local Data, the backend-readiness contract, the data-model manifest, the static regression gate, and release smoke tests for Phase 19.
- Production retains `connect-src 'none'`, no browser `fetch()` provider path, a known-but-not-allowlisted backend origin, and `LIVE_PROVIDER_CONFIG.enabled = false`.

### Activation status
- **No live financial institution is connected by this release.**
- Activation requires recoverable authentication, provider credentials/approval, Sandbox verification, security/RLS review, and an exact CSP backend allowlist.
- Provider production usage may have external cost; Phase 19 does not assume paid access under the current zero-operating-budget constraint.

### State migrations
- No browser financial-state migration.
- Core financial schema remains **v3**.
- Portable data schema remains **v1**.
- The Phase 19 provider schema is a separate server-side data plane and does not become the authority for the browser-local weekly Plan.

### Rollback
- Pre-Phase-19 commit: `e2c71206ae78b711db6e8baa90390481e3850d24`
- Rollback branch: `rollback/phase19-pre-provider-2026-09-18`

## Phase 18 — Power-user Efficiency — 2026-09-18

### Optional efficiency layer
- Added browser-local `thisweek.powerPrefs.v1` preferences; behavioral power features remain off by default.
- Added optional first-tap direct-open behavior for the four Home category worlds without adding Home widgets.
- Added optional Add Spending amount-prefill chips; shortcuts never submit a transaction automatically.
- Added optional pinned and recent deep-tool shortcuts inside Details.
- Added optional desktop keyboard chords and slash-to-search on Details.
- Added optional rapid switching among Bills, Essentials, Lifestyle, and Savings Studios.
- Added user-controlled ordering of the four existing Details groups.
- Added cross-tab power-preference cache invalidation and Privacy & Local Data inventory disclosure.
- Preserved Phase 16 analytics boundaries; no shortcut telemetry, dwell time, route-sequence tracking, or remote analytics were added.

### State migrations
- No financial-state migration.
- Core financial schema remains **v3**.
- Portable data schema remains **v1**.
- Power-user preferences are isolated from the normalized financial model.

### Rollback
- Pre-Phase-18 commit: `848412e18435b4248fa2a0f38f5e2427c5704995`
- Rollback branch: `rollback/phase18-pre-power-2026-09-18`

## Phase 17 — Product Polish & Brand System — 2026-09-18

### Presentation system
- Added canonical surface, border, elevation, radius, typography, status, category, icon, and motion tokens.
- Preserved distinct Bills, Essentials, Lifestyle, and Savings identities while routing them through one brand system.
- Added restrained route-specific accents without changing conventional navigation or Home information architecture.
- Standardized glass surfaces, nested-card hierarchy, controls, focus treatment, and mobile target sizing.
- Added a shared empty/loading/error/success/info state system with delayed accessible route loading and `aria-busy`.
- Toast confirmations now distinguish neutral, successful, and error feedback instead of using a success check for every message.
- Preserved Reduced Motion, Lite performance mode, iPhone compression, accessibility, browser-local privacy, and Phase 14 network restrictions.

### State migrations
- No financial-state migration.
- Core financial schema remains **v3**.
- Portable data schema remains **v1**.

### Rollback
- Pre-Phase-17 commit: `c848cb44c5a72abdfdd4843208f4eb587936005c`
- Rollback branch: `rollback/phase17-pre-polish-2026-09-18`

## v0.15.0-phase15 — 2026-09-18

### Release discipline
- Production remains tied to the `main` branch.
- Added mandatory static and release smoke-test gates before Pages deployment.
- Added a dedicated production `_site` artifact instead of publishing the entire repository.
- Added generated `release.json` deployment metadata with exact commit, workflow run, schemas, and rollback point.
- Added post-deployment verification of both the page and release manifest.
- Added a repeatable release checklist and production release policy.
- Deterministic production staging now regenerates CSP SHA-256 hashes from the exact inline scripts before validation and deployment.
- Production workflow now cancels stale in-progress releases when a newer `main` commit arrives.
- Added a durable release record under `RELEASES/v0.15.0-phase15.md`.
- Preserved the validated milestone at `stable/v0.15.0-phase15` because the connected write surface does not expose Git tag creation.
- Preserved pre-Phase-15 production head at `351a052ba214d4813b296b4cd3dc7965e695b6e1` on branch `rollback/phase15-pre-release-2026-09-18`.

### State migrations
- No new financial-state migration.
- Core financial schema remains **v3**.
- Portable data schema remains **v1**.
- Phase 13 versioned migration and normalized-model contracts remain in force.

### Trust and data
- Phase 14 browser-local privacy/import hardening remains part of the production baseline.
- No backend, cloud sync, or live financial-provider connection is enabled by this release.

### Verification
- Automated release smoke tests are now required by the deployment workflow.
- Production verification uses a cache-busted URL plus the deployed `release.json`.
- Validated Phase 15 release commit: `8caca1c864c0608ce808210605a0b03eb1779655`.
- Successful release workflow run: `35410845516`.
- Cache-busted milestone URL: `https://bennybundles.github.io/Thisweekmvp/?v=8caca1c8`.

### Rollback
- Rollback commit: `351a052ba214d4813b296b4cd3dc7965e695b6e1`
- Rollback branch: `rollback/phase15-pre-release-2026-09-18`

## v0.14.x — Phase 14 baseline

- Security, privacy, and trust hardening.
- Browser-local data controls and import sanitization.
- Explicit high-impact confirmations and trust self-audit.

## v0.13.x — Phase 13 baseline

- Versioned core-state migrations.
- Normalized portable data model.
- Provider-neutral and future-backend contracts.
- JSON Schema, deterministic snapshot identity, and backend-readiness tests.

## v0.12.x — Phase 12 baseline

- Runtime caches, lazy Home detail construction, storage resilience, and adaptive performance tier.

## v0.11.x — Phase 11 baseline

- Dedicated iPhone viewport hardening and Device QA.

## v0.10.x — Phase 10 baseline

- Personalization and accessibility controls.
