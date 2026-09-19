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

Direct browser table access is revoked. The release console reaches the data only through an authenticated Edge Function using service-role RPC/table access.

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
