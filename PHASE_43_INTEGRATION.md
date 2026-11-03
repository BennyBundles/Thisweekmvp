# Phase 43 — Integrated, review-only release candidate

**Date:** 2026-11-02. **Production remains unchanged.** This is a synthetic, draft consolidated review branch; the production branch is still main at `ab4336e55faf04235d57a5a389c5f816a477c61e`.

## Consolidation approach
- Base commit: Phase 42 PR #21, `24cd4f4b1262d714051f7f4c1a45a135b9512375`. This is descended from Phase 41 PR #20, which is descended from the earlier Phase 40 candidate, incorporating Phase 35–38 baseline as a stacked patch. It also contains the PWA offline-cache integrity improvement.
- Previously divergent Phase 40 PR #19 head `6c015f0da6f01b798741026537ec41e7bf6d6446` added **two separate files**: `stage-preview.mjs` and `test-stage-preview.mjs`. Its latest source was integrated verbatim here, without overwriting Phase 41 production-queue policy or Phase 42 PWA cache controls.
- Phase 38 PR #18 newest head `3fd92bcd6b161e4eac3606f33b30996ec83560d5` had an earlier variant of CI concurrency checks. That variant **was not copied** because Phase 41's revised job-level FIFO queue and SHA guard supersede it.
- One additional `phase43-integration.test.mjs` verifies coexistence of the entire dependency stack and is executed by `.github/workflows/pages.yml`.

## Intended user benefit
Avoid manually merging draft PRs #12–#21 in an arbitrary order, which could drop newer fixes or reintroduce old CI failures. A single candidate is independently testable and reviewable before any change to production.

## Fail-closed safeguards
- PR job validates only. GitHub Pages publishing remains main-only, with exact SHA checks and restricted Pages permissions.
- Vercel preview artifacts never include a production `release.json` and cannot be produced in `VERCEL_ENV=production`.
- Static preview builder invokes its complete route validator suite rather than validating file existence alone. No provider calls, purchases, or Supabase migrations.
- Static preview service worker caches only known shell/assets; credentials and money-related requests are excluded.
- Local Plan exports and restores retain Phase 36–38 safety checks.

## Verification required
1. Node 22 GitHub Actions validation on **the exact final Phase 43 commit SHA**, with all new and existing tests. Deploy should be **SKIPPED** on the PR.
2. Independent review of the cumulative diff versus main, especially security, billing, Auth and PWA cached routes.
3. Review and approve only an intentionally selected final candidate for merge. Keep older drafts open for history; do **not** accidentally merge duplicate stacks.
4. After merge, verify the exact published release SHA on Pages. Test iPhone Safari with synthetic budgets only.
5. Vercel quota was previously reported exhausted on a connected Hobby team. Do not spam deployments or enable multiple linked projects as a substitute for source CI.

This review candidate does not prove real-device QA, provider sandbox approvals, payment readiness or cloud backup.
