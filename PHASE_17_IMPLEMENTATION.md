# Phase 17 — Product Polish & Brand System

**Status:** Implemented in production source  
**Application commit:** `24855859d8267b245ddd2c9bedd76bfbfc6d8a46`  
**Regression-gate commit:** `ea18ac3ca50b9cf8cbbd36ca5b0379128a3a37e3`  
**Pre-Phase-17 rollback branch:** `rollback/phase17-pre-polish-2026-09-18`  
**Pre-Phase-17 rollback commit:** `c848cb44c5a72abdfdd4843208f4eb587936005c`

## Objective

Make the existing application feel like one finished premium financial product without making every route look identical and without increasing Home information density.

The Phase 17 rule remains:

**Capability should expand faster than visible complexity.**

No new permanent Home information was added.

## Visual audit findings

The pre-Phase-17 source already had a strong visual direction, but the implementation had accumulated many one-off values across Phases 1–16.

The audit found repeated independent values for:

- border radii;
- translucent borders;
- panel opacity;
- shadows;
- small text roles;
- icon containers;
- interaction timing;
- category accents;
- error and empty treatments.

The visual system therefore looked related, but not fully governed by one reusable brand layer.

## Canonical token layer

Phase 17 adds a formal token family using the `--tw-*` namespace.

### Surfaces

- `--tw-surface-canvas`
- `--tw-surface-1`
- `--tw-surface-2`
- `--tw-surface-3`
- `--tw-surface-inset`
- `--tw-surface-hover`

### Borders

- `--tw-border-subtle`
- `--tw-border-default`
- `--tw-border-strong`
- `--tw-border-focus`

### Elevation

- `--tw-elevation-0`
- `--tw-elevation-1`
- `--tw-elevation-2`
- `--tw-elevation-3`

### Radius scale

- `--tw-radius-xs`
- `--tw-radius-sm`
- `--tw-radius-md`
- `--tw-radius-lg`
- `--tw-radius-xl`
- `--tw-radius-pill`

Earlier Phase variables remain aliased for backward compatibility rather than forcing a risky full rewrite.

## Typography hierarchy

Phase 17 defines explicit typography roles for:

- micro metadata;
- labels;
- small body text;
- body text;
- titles;
- display values;
- body line height;
- label tracking.

Existing route-specific typography remains intact where it communicates hierarchy, but repeated labels and supporting text now share a more consistent baseline.

## Category identity

The four primary money systems now have canonical product-level color tokens:

- Bills — `--tw-cat-bills`
- Essentials — `--tw-cat-essentials`
- Lifestyle — `--tw-cat-lifestyle`
- Savings — `--tw-cat-savings`

Available Now retains its own planning accent.

The studios keep their existing visual worlds, but their accents now resolve through the same token layer.

## Route identity

The router now sets:

`document.body.dataset.view`

This keeps conventional navigation unchanged while allowing individual routes to carry restrained accents through a shared shell.

Examples include:

- Bills;
- Essentials;
- Lifestyle;
- Savings;
- Advanced Insights;
- Scenario Sandbox;
- Connected Data;
- Privacy;
- Usage Insights;
- Plan / Presentation.

The top bar uses the route accent as a subtle brand signal rather than creating a different header layout for every screen.

## Icon construction grid

Phase 17 establishes a canonical icon sizing layer:

- `--tw-icon-grid`
- `--tw-icon-sm`
- `--tw-icon-md`
- `--tw-icon-lg`
- `--tw-icon-stroke`

Brand, navigation, category, studio, QA, and feedback icon containers now resolve through shared sizing/radius rules where practical.

## Surface and card consolidation

High-level cards now share common:

- radius;
- border strength;
- elevation;
- glass treatment.

Nested surfaces intentionally flatten to reduce card-on-card visual noise.

This preserves deep functionality while making Details, Studios, Connected Data, Privacy, Data Model, Analytics, QA, and Performance screens feel like the same product.

## Controls

Buttons, chips, text actions, fields, and focus states now use the canonical radius and border system.

Primary controls maintain a minimum mobile target size.

The accessibility focus ring remains visible and independent of hover styling.

## Unified state system

Phase 17 adds shared rendering helpers:

- `systemState()`
- `inlineState()`
- `emptyState()`
- `loadingState()`
- `pageState()`

Supported semantic states:

- empty;
- loading;
- error;
- success;
- informational.

### Loading

Route changes use a delayed loading state.

The delay avoids flashing a loader for fast local operations while still giving a consistent accessible state if rendering takes longer.

The main region uses `aria-busy` during route rendering.

### Errors

Route-level failures now use the same page-error surface.

Inline errors remain available for form-level problems.

### Empty states

Weekly Memory and bill-obligation empty states use the shared empty-state system, and legacy `.empty` / `.empty-card` surfaces are visually normalized.

### Success

Ordinary messages no longer automatically display a success checkmark.

Toasts now support explicit tones:

- neutral;
- success;
- error.

Successful high-confidence actions use the restrained success treatment.

Existing semantic financial confirmation motion remains short and contextual.

## Motion language

Phase 17 formalizes:

**Ambient → Active → Confirmation**

with reusable timing/easing tokens.

The phase does not add continuous spectacle.

Reduced Motion disables state-spinner animation without removing loading meaning.

Lite mode reduces finish/elevation while preserving the same information hierarchy and controls.

## iPhone behavior

The existing canonical mobile breakpoints remain unchanged.

At approximately 390px:

- state surfaces compress to full available width;
- body-role text remains compact;
- high-level surface radii remain consistent;
- no new permanent Home widget is introduced;
- conventional bottom navigation remains authoritative.

Physical iPhone Safari remains a human QA gate.

## Financial semantics preserved

Phase 17 changes presentation and route feedback only.

It does not redefine or recalculate:

- Available Now;
- Bill Protection;
- Essentials;
- Lifestyle;
- savings goals;
- transactions;
- imported records;
- reconciliation;
- pending vs posted status;
- weekly memory;
- scenarios;
- connected data.

No imported transaction is silently applied to the weekly plan.

No external balance is converted into Available Now.

## Privacy and security preserved

Phase 17 introduces no application network calls.

The existing browser-only boundary remains:

- no `fetch(`;
- no `XMLHttpRequest`;
- no `WebSocket`;
- no `sendBeacon`;
- `connect-src 'none'` remains authoritative.

No provider token or secret storage was added.

## Analytics preserved

Phase 16 local analytics behavior is unchanged.

Phase 17 does not add:

- dwell time;
- route sequence logging;
- timestamps;
- financial amounts;
- merchant names;
- remote analytics.

## Regression protection

`phase0-static-check.mjs` now requires durable Phase 17 markers for:

- product polish marker;
- surface tokens;
- border tokens;
- elevation tokens;
- radius scale;
- typography roles;
- category colors;
- icon grid;
- motion language;
- route identity;
- unified states;
- loading;
- page errors;
- success confirmation;
- delayed loading guard;
- Lite mode;
- Reduced Motion.

The Phase 14 forbidden-network checks remain unchanged.

## Release validation

The deterministic Phase 15 pipeline remains authoritative:

1. stage exact production HTML;
2. regenerate inline-script CSP hashes;
3. run static regression checks;
4. run release smoke checks;
5. create clean Pages artifact;
6. deploy;
7. verify the exact deployed commit with cache busting.

Production success must be reported only after that workflow completes successfully.
