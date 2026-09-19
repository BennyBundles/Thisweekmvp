# Active phases, rollout gates and next work

## Current phase map

| Phases | Implemented surface | Remaining evidence |
|---|---|---|
| 0–16 | Planner baseline, data model, trust/release foundation | Preserve current semantics; historic plans are not launch evidence |
| 17–18 | Polish, brand system, power-user controls | Ongoing browser/device regression |
| 19 | Plaid provider plane | Credential/registration and real integration validation |
| 20–22 | Ledger, money adapters, signed events/cards, sandbox chain/preflight | Real sandbox end-to-end and adverse-event evidence |
| 23–24 | Account/session security, Auth readiness assertions | Hosted Auth/SMTP/CAPTCHA round trips |
| 25–26 | Risk/velocity, returns, negative balances/disputes | Concurrency and provider adverse lifecycle tests |
| 27–28 | Staff, support, incidents/SLA dashboard | Named least-privilege staff and operational exercises |
| 29–30 | Monitoring + external notification dispatcher | Destination approval/configuration and real delivery test |
| 31 | Independent production activation interlock | All gates still closed |

Implemented/deployed does not mean approved for public money. Planner release and financial-product launch are separate decisions.

## Recommended Phase 32: reproducible baseline and controlled sandbox acceptance

This is a proposed work queue, not authorization to activate features.

1. **Reconcile deployment/migration evidence.** Build a scoped schema/RPC/policy/trigger inventory, explain missing Phase 20–31 migration history, prove clean reconstruction in an isolated Supabase project, and retain a repeatable deployment manifest. Acceptance: no unexplained live/source differences; no production mutations.
2. **Improve release identity metadata.** Replace stale Phase 15 labels/rollback notes in a reviewed change after preserving a current rollback point. Acceptance: exact SHA/run still governs; generated manifest and human phase labels agree; all release checks pass.
3. **Verify hosted Auth in a controlled environment.** Follow AUTH_PRODUCTION_SETUP.md for exact redirects, email confirmation/recovery, SMTP, Turnstile and notifications; test revoked sessions, anonymous rejection and MFA. Acceptance: recorded real round trips and negative cases; assertions stay false until proven.
4. **Prepare approved sandbox credentials and fixtures.** Operator supplies secrets through secure configuration. Record provider/environment only, never values. Sandbox-mode change requires an explicit controlled-test decision; this handoff does not enable it.
5. **Run the full sandbox chain.** Bank link → Unit account → ACH funding → envelope ledger → virtual card → authorization/hold → settlement/reversal → Pinwheel switch/payroll event → Method payment/webhook reconciliation. Verify duplicate and out-of-order events, forged signatures, insufficient funds, returns, unmapped credits, negative balances, parallel velocity limits, review/deny and revoked sessions. Acceptance: balanced journals, idempotent outcomes and no planner mutation, with reproducible redacted evidence.
6. **Exercise operations.** Authorized admin provisions named staff; verify least privilege/AAL2 and support/case/audit paths. Select an approved notification destination, then explicitly authorize a synthetic delivery exercise. Acceptance: monitoring → outbox → actual receipt → triage demonstrated; replayed nonce rejected; retry/lease recovery tested.
7. **Close external launch prerequisites.** Provider/sponsor approvals, production webhook registration, approved risk limits, costs, legal/privacy/disclosures, retention, customer support commitments and escalation procedures. These require accountable external decisions, not code-only checkboxes.

## Production rollout gates

All eleven database manual gates currently false:
- hosted_auth_production_ready
- provider_sandbox_e2e_passed
- production_provider_approvals
- production_webhooks_verified
- production_risk_policy_approved
- named_staff_provisioned
- external_notification_delivery_verified
- incident_escalation_runbook_approved
- retention_access_policy_approved
- legal_terms_privacy_approved
- cost_approval

Independent derived gates: active production risk policy, configured healthy notification channel, admin coverage, risk coverage and support coverage. All currently false. Current implementation lets an admin satisfy multiple coverage categories; named least-privilege staffing still needs operational review.

Only an authorized admin action with an evidence reference may change manual gates through the service layer, creating immutable gate and staff audit events. Do not edit table rows to bypass that trail. Even satisfied gates do not independently authorize live-money activation: explicit launch approval and verified production configuration remain necessary.

## Known limitations

- No verified live-money readiness or completed provider sandbox chain.
- Secret/hosted configuration was not inspected; do not interpret missing evidence as proof a credential is absent.
- Migration history is incomplete relative to later deployed schema; phase SQL must not be blindly replayed.
- Static checks are extensive but do not replace browser, provider, security, concurrent ledger or operational acceptance tests.
- Branch protection was reported disabled.
- External delivery is unconfigured; active cron is not proof somebody receives an alert.
- Public Auth assertions remain false; client cooldowns are not server abuse protection.
- Money Lab is a controlled testing surface, not a finished consumer banking flow.
- Historical documentation includes superseded “not yet wired” statements. Current code and VERIFIED_BASELINE.md resolve those conflicts.
- Reward offer remains inactive and internal SLA targets are not public promises.
- Shared Supabase project requires strict change isolation.
