# Phase 0 — Baseline Audit

**Date:** 2026-09-18  
**Repository:** `BennyBundles/Thisweekmvp`  
**Production branch:** `main`  
**Rollback branch created:** `baseline-phase-0-2026-09-18`  
**Rollback branch starting commit:** `0e13f46e293f45daa9d126441fed9ab1ee9ce50d`  
**Current app code commit:** `7277a1f7d5e26ee9224eead5662afdc769748f5f`  
**Current `index.html` blob SHA:** `46b99ab351cd779c98d09924f1f8da753180ca77`

The commits after `7277a1f...` add planning/specification documents and do not alter the production application code.

## Phase 0 objective

Freeze a recoverable baseline, inventory the current product, verify static integrity, document known risks, and establish a repeatable regression checklist before Phase 1 changes the Home information hierarchy.

## Source-level verification completed

- Repository access verified with admin/push permission.
- Production branch verified as `main`.
- GitHub Pages workflow exists and deploys on pushes to `main`.
- `.nojekyll` exists.
- `index.html` currently contains two JavaScript blocks.
- Both JavaScript blocks compile successfully with `new Function()`.
- Current app source size: ~276 KB.
- Adaptive constellation system is present.
- Scene-to-page choreography is present.
- Connected CSV import/reconciliation layer is present.
- Direct live bank-provider synchronization is **not** active.
- Browser/localStorage persistence is the current runtime data architecture.

## Current application routes

Home is the implicit default route. Explicit source-verified routes:

1. `#log` — Add Spending
2. `#details` — Details / system hub
3. `#insights` — Advanced Insights
4. `#bills` — Bill Protection Studio
5. `#essentials` — Essentials Runway
6. `#lifestyle` — Lifestyle Flex Studio
7. `#savings` — Savings Goal Studio
8. `#precheck` — Can I Spend This?
9. `#history` — Weekly Memory
10. `#scenario` — Scenario Sandbox
11. `#connections` — Connected Data Center
12. `#preferences` — Presentation Settings
13. `#future` — System Architecture guide
14. `#reset` — New Week
15. `#setup` — Plan / setup

## Current local API operations

- `POST /setup`
- `GET/POST /week/current`
- `POST /bill/contribute`
- `POST /transaction/import`
- `POST /transaction`
- `POST /adjustment`
- `POST /week/reset`

## Current browser-storage surfaces

- `thisweek.userId`
- `thisweek.state.v2`
- `thisweek.uiPrefs.v1`
- `thisweek.savingsGoals.v1`
- `thisweek.connectedData.v1`

These keys are part of the baseline and must be considered before any migration, reset, or storage refactor.

## Deployment configuration

The GitHub Pages workflow:

- triggers on pushes to `main`
- uses `actions/checkout@v6`
- uses `actions/configure-pages@v5`
- uses `actions/upload-pages-artifact@v4`
- uses `actions/deploy-pages@v4`
- uploads the repository root
- has Pages and ID-token write permissions

## Known limitations / risks at baseline

### 1. Home still exceeds the intended compact target
The production Home currently contains substantial ambient motion, adaptive mini-constellations, source information, category strips, scene focus content, attention content, and a next-step section. Phase 1 is intended to simplify the resting state without deleting capability.

### 2. No automated browser regression suite
Source syntax is verified, but there is not yet a CI-driven interaction test suite for route navigation, forms, localStorage migrations, or mobile layout.

### 3. Runtime Safari behavior still needs real-device verification
Static source validation cannot prove:
- dynamic Safari toolbar behavior
- safe-area clearance
- keyboard resizing
- tap-target ergonomics
- animation smoothness
- bottom-sheet behavior
- scroll/viewport interactions

These remain required manual checks during Phase 0/Phase 1.

### 4. Public Pages state was not independently fetched from the current tool environment
The public GitHub Pages URL could not be retrieved by the available external web checker in this audit environment. The repository source and deployment configuration were verified, but actual rendered deployment should still be confirmed in a normal browser after each production push.

### 5. Data is device/browser-local
The app has no account authentication or multi-device data synchronization. Clearing browser storage can remove local app state.

### 6. Connected Data is import/reconciliation, not live banking
CSV import is implemented. A provider-backed direct institution connection is intentionally not active.

### 7. Savings goals are a separate planning surface
Savings goal progress is stored separately from the core weekly state and should not be interpreted as a verified bank-account balance.

### 8. Undo/reversal coverage is incomplete
Meaningful actions such as transaction reconciliation, bill protection contributions, and some goal updates do not yet have a complete universal undo model.

### 9. Storage is split across multiple keys
The core state and newer feature surfaces live in separate versioned keys. This increases migration complexity and must be preserved carefully during later data-model cleanup.

### 10. Feature depth can recreate visual clutter
The product now has many capable routes. Any new Home implementation must use progressive disclosure rather than surfacing these routes as permanent modules.

## Phase 0 protection decision

No Phase 1 production code should be merged without:

1. preserving the rollback branch;
2. passing the Phase 0 static check;
3. running the smoke-test checklist;
4. confirming no storage key is accidentally reset or renamed;
5. confirming the current planning calculations remain unchanged unless a financial-logic change is explicitly intended.

## Baseline rollback

If a Phase 1 change causes a serious regression, the project can be compared or restored against:

`baseline-phase-0-2026-09-18`

starting at:

`0e13f46e293f45daa9d126441fed9ab1ee9ce50d`

The functional app code at that baseline is the `index.html` from app commit:

`7277a1f7d5e26ee9224eead5662afdc769748f5f`
