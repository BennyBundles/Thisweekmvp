# Phase 18 — Power-user Efficiency

**Status:** Implemented in production source  
**Application commit:** `49a90b1b6584c83397e7850fdcdd7c0b027d8b2d`  
**Regression-gate commit:** `722ddefd17b020733538e6268b75a6b3bc075de2`  
**Pre-Phase-18 rollback branch:** `rollback/phase18-pre-power-2026-09-18`  
**Pre-Phase-18 rollback commit:** `848412e18435b4248fa2a0f38f5e2427c5704995`

## Objective

Make experienced users faster without making the beginner experience denser or less predictable.

Phase 18 follows four rules:

1. power features are optional;
2. behavioral shortcuts are off by default;
3. no shortcut silently performs a financial mutation;
4. Home does not gain a permanent power-user panel.

## Storage

Phase 18 adds one browser-local preference key:

`thisweek.powerPrefs.v1`

It stores only UI/navigation preferences:

- direct category open;
- quick-amount prefill preference;
- pinned Details tool;
- recent-tool shortcut preference and route;
- keyboard-shortcut preference;
- rapid studio switcher preference;
- Details group order.

It stores no financial amounts, balances, merchant names, transaction IDs, provider secrets, or timestamps.

The Privacy & Local Data inventory recognizes this key.

Cross-tab storage invalidation clears the in-memory power preference cache when the key changes.

## Direct-open category tap

Default: **off**.

Normal Home behavior remains:

**Collapsed → Peek → Studio**

When explicitly enabled:

- the first Bills / Essentials / Lifestyle / Savings tap opens that Studio;
- the conventional bottom navigation remains unchanged;
- the Home page still contains no additional persistent widget;
- the accessible category label changes from “Tap once to peek” to “Open studio”;
- expandable semantics are removed from the category control while direct-open is enabled.

The option changes navigation only.

It does not change category calculations or financial state.

## Quick Add Spending prefill

Default: **off**.

When enabled, Add Spending exposes small amount chips:

- $5;
- $10;
- $20;
- $50;
- repeat the most recent recorded amount when one exists.

The recent category can be brought to the front of the existing four receiver choices.

The shortcut only fills the amount/category controls.

It does **not**:

- press Add Spending;
- create a transaction;
- reconcile imported activity;
- bypass validation.

The user still has to submit the transaction explicitly.

## Pinned Details tool

Default: no pinned tool.

The user can select one frequently used tool from Presentation & Accessibility.

The shortcut appears in **Details**, not Home.

Eligible routes include:

- Add Spending;
- Can I Spend This?;
- Bills;
- Essentials;
- Lifestyle;
- Savings;
- Scenario;
- Weekly Memory;
- Connected Data;
- Advanced Insights;
- Privacy & Local Data.

The pinned route changes navigation only.

## Recent tool shortcut

Default: **off**.

When enabled, This Week remembers only the most recently opened eligible deep-tool route.

It does not store:

- when the route was opened;
- how long the user stayed;
- route sequences;
- financial values.

Details can then show one Recent shortcut.

Disabling the option clears the stored recent route.

This is not added to Phase 16 analytics.

## Desktop keyboard support

Default: **off**.

When enabled, shortcuts use a deliberate two-key chord to reduce accidental navigation.

Primary routes:

- `G` then `H` — Home;
- `G` then `A` — Add Spending;
- `G` then `D` — Details;
- `G` then `P` — Plan.

Money Studios:

- `G` then `B` — Bills;
- `G` then `E` — Essentials;
- `G` then `L` — Lifestyle;
- `G` then `S` — Savings.

Inside Details:

- `/` focuses tool search.

Keyboard shortcuts are ignored while the user is typing in:

- inputs;
- textareas;
- selects;
- editable content.

The shortcut binder also ignores Meta, Control, and Alt-modified events.

## Rapid Studio switcher

Default: **off**.

When enabled, the four money Studios receive one compact navigation strip:

- Bills;
- Essentials;
- Lifestyle;
- Savings.

The switcher is inserted only on those deep surfaces.

It is not added to Home.

The active Studio uses `aria-current="page"`.

## Custom Details ordering

Default order remains:

1. Current week
2. Planning tools
3. Data & history
4. System & settings

The user can move those existing groups up or down from Presentation & Accessibility.

No new group is created.

A reset control restores the default order.

## Accessibility

Phase 18 preserves:

- Skip to Content;
- visible keyboard focus;
- screen-reader route announcements;
- conventional navigation;
- touch-target rules;
- Reduced Motion;
- text-size settings;
- contrast settings.

The new power toggles expose `aria-pressed`.

The rapid Studio switcher uses a labeled navigation region.

Direct-open mode removes misleading expandable attributes from Home category links.

## iPhone behavior

At the canonical 390px viewport:

- power preference cards collapse to one column;
- Details power shortcuts collapse to one column;
- the Studio switcher remains compact;
- below 330px, the four-studio switcher becomes two columns;
- Home receives no extra permanent content.

## Lite / Reduced Motion

Phase 18 adds no required animation.

All efficiency features remain functional under Reduced Motion and Lite mode.

## Financial semantics

Phase 18 does not change:

- Available Now;
- Bill Protection;
- weekly category allocations;
- savings calculations;
- transaction accounting;
- imported transaction state;
- reconciliation;
- scenarios;
- Weekly Memory;
- connected-data semantics.

Quick Add is explicitly a **prefill**, never an automatic financial mutation.

## Security and privacy

No application network API was introduced.

Existing restrictions remain:

- `connect-src 'none'`;
- no runtime `fetch(`;
- no `XMLHttpRequest`;
- no `WebSocket`;
- no `sendBeacon`.

The new preference key contains navigation/preferences only.

No credentials, tokens, or provider data are added.

## Analytics boundary

Phase 18 does not expand Phase 16 analytics.

It does not add:

- shortcut usage tracking;
- keyboard event analytics;
- route sequence analytics;
- dwell time;
- session duration;
- financial values;
- remote telemetry.

Existing opt-in local aggregate analytics remains unchanged.

## Regression protection

`phase0-static-check.mjs` now verifies durable Phase 18 markers for:

- the power preference key;
- every default-off behavior;
- direct-open routing;
- quick amount prefill;
- pinned Details shortcuts;
- recent tool memory;
- keyboard chords;
- rapid Studio switching;
- Details ordering;
- power preference controls;
- privacy inventory;
- cross-tab preference invalidation;
- the default-off product doctrine.

The existing Phase 14 forbidden-network checks remain unchanged.

## Release validation

The Phase 15 deterministic Pages flow remains authoritative:

1. prepare exact production HTML;
2. regenerate CSP hashes;
3. run the static regression checker;
4. run release smoke checks;
5. stage a clean Pages artifact;
6. deploy;
7. verify the exact deployed commit using a cache-busted production URL.
