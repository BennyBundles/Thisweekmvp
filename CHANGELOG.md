# Changelog

Production changes for **This Week** are recorded here.

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
