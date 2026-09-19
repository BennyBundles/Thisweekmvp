# Phase 34 — Release Evidence & Sandbox Certification

**Date:** 2026-09-19  
**Production money:** locked / fail-closed  
**Rollback branch:** `rollback/phase34-pre-certification-2026-09-19`  
**Pre-Phase-34 deployed head:** `ff3c8cd98d6e03f16cc1aa223e75ab553a2cc3d6`

## Objective

Phase 34 converts implemented controls into verifiable release evidence. It does not add a new consumer money feature and does not activate any provider production execution.

## Server evidence model

The Phase 34 migration adds:

- immutable Sandbox certification runs and append-only requirement receipts;
- immutable synthetic-incident and rollback drill runs/events;
- release-gate evidence requirements and append-only manual evidence receipts;
- derived evidence checks tied to actual server state;
- a generated release-candidate readiness report;
- evidence enforcement inside the existing Phase 31 gate setter.

Direct browser table access is revoked. Explicit RLS policies are scoped only to `service_role`; `anon` and `authenticated` receive no table policy or grant. The release console reaches the data only through an authenticated Edge Function using service-role RPC/table access.

## Sandbox certification checklist

The required checklist covers provider preflight, webhook registration, Plaid link, Unit onboarding/account/funding/card flows, Pinwheel direct deposit, Method bill payment, ACH returns, card dispute/refund handling, a synthetic incident drill, and rollback validation.

A checklist item is not passed because code exists. A pass requires an append-only evidence receipt. Drill requirements additionally require a matching terminal drill receipt with a passing outcome.

## Release-gate evidence

Each Phase 31 gate now declares the supporting evidence it requires. Evidence can be:

- **manual** — an admin records a bounded reference to real approval/test/configuration evidence; or
- **derived** — the database evaluates current server state, such as staff coverage, notification channel health, active production risk policy, active legal/retention state, or a completed certification/drill.

`tw_release_set_gate(..., verified=true, ...)` now fails with `release_gate_supporting_evidence_missing` when required evidence is absent. This strengthens the Phase 31 interlock; it does not replace it.

## Staff release gateway

`thisweek-release-gateway` requires:

- recoverable Supabase Auth;
- an active non-revoked server session;
- AAL2 MFA;
- server-managed `app_metadata.thisweek_role`.

Permissions:

- support_ops: status/readiness only;
- risk_ops/admin: start certification, record certification receipts, run drills;
- admin only: record manual gate evidence and verify/unverify release gates.

Mutation metadata is server-generated and bounded. The browser has no field for provider credentials, access tokens, signing secrets, full bank/card credentials, or internal fraud logic.

## Staff console

`/ops/release/` provides:

- current live-money lock state and blocking gates;
- evidence requirements per gate;
- Sandbox certification runs and receipts;
- synthetic incident and rollback drills;
- manual gate evidence entry for admins;
- gate verification only after server-side evidence validation.

The console shares the existing tab-scoped `thisweek.auth.session.v1` session and does not move Auth tokens into localStorage.

## Release posture

At implementation time all required Phase 31 manual gates remain false and `liveMoneyReady=false`. Phase 34 must not auto-create passing receipts or auto-verify any gate.

Hosted Supabase Auth production settings, provider credentials/approvals, named staff, external notification destination, legal/retention approvals, production risk limits, and commercial approvals remain real-world release work.


## Release-candidate binding

Phase 34 continuation adds an append-only active-candidate selection stream. A risk/admin staff member must explicitly select the full 40-character commit SHA and a bounded source reference before starting certification or drills.

The latest selection is the active candidate. Starting or finishing a drill, starting a certification run, or adding a certification receipt for a different SHA fails with `release_candidate_mismatch`.

Candidate-bound derived evidence now requires the active SHA:

- Sandbox certification pass;
- rollback drill pass;
- synthetic incident drill pass.

A pass from an older commit therefore cannot satisfy a newer release candidate. The staff console pre-fills the currently deployed Pages commit and workflow run from `release.json`, but selection remains an explicit authenticated AAL2 staff action.

No candidate is auto-selected by deployment, and selecting a candidate does not verify a production release gate.

When the active candidate SHA changes, any previously verified candidate-bound gates are automatically reset to unverified with immutable `tw_release_gate_events` receipts. The currently candidate-bound gates are:

- `provider_sandbox_e2e_passed`;
- `incident_escalation_runbook_approved`.

This prevents a historical certification/drill assertion from remaining verified after the release candidate changes.


## Controlled staff bootstrap

Phase 34 continuation adds a supported server-side path for assigning `app_metadata.thisweek_role` without writing directly to the managed `auth.users` table.

Components:

- `tw_ops_staff_role_events` — append-only staff-role change audit ledger;
- `tw_staff_role_summary()` — service-role-only role coverage summary;
- `tw_staff_user_role(uuid)` — service-role-only authoritative role lookup;
- `thisweek-staff-gateway` — JWT-protected staff provisioning Edge Function;
- `/ops/bootstrap/` — restricted staff bootstrap/provisioning surface.

First-admin bootstrap fails closed unless all of the following are true:

- a real Supabase Auth user exists;
- that user's email is confirmed;
- the user's current Auth session still exists;
- MFA assurance is AAL2;
- no existing This Week staff role exists;
- the user's email exactly matches server secret `THISWEEK_BOOTSTRAP_ADMIN_EMAIL`.

The allowlisted email is never returned to the browser. The browser contains no service-role credential.

After an admin exists, role changes require a current AAL2 `admin`. New staff targets must be real confirmed Auth users. The last admin cannot be revoked or downgraded.

Role changes use Supabase's supported server-side `auth.admin.updateUserById` API and preserve unrelated app metadata. Every successful change writes an immutable role-event receipt. Staff users should refresh/re-authenticate after role changes.

At implementation time there are zero Supabase Auth users, so bootstrap remains intentionally unexecuted and no staff coverage is claimed.
