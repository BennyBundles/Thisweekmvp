# Phase 16 — Optional Local Analytics

**Status:** Implemented in production source  
**Analytics engine commit:** `eff5279dbfc0b3283922b646e826d6adf8a91b4c`  
**Analytics dashboard commit:** `41b06dd88ca4b4a91f8a29362ba35c043f4b9d18`

## Objective

Understand workflow friction without invasive tracking or paid analytics infrastructure.

The Phase 16 model is:

**Opt-in → aggregate locally → inspect locally → export manually if desired**

No analytics backend was added.

## Privacy defaults

Local usage counters are **off by default**.

Nothing is reconstructed from earlier app activity.

When enabled, counters are stored only in:

`thisweek.analytics.v1`

The counter model deliberately excludes:

- dollar amounts;
- balances;
- income;
- bill amounts;
- savings amounts;
- merchant names;
- user-created category names;
- transaction IDs;
- imported transaction IDs;
- event timestamps;
- dwell time;
- session duration;
- route sequence;
- scroll behavior;
- background activity.

## Metrics implemented

### Category focus

Counts broad Home worlds:

- Bills
- Essentials
- Lifestyle
- Savings

This measures use of progressive disclosure without storing individual category names.

### Deep-tool opens

Counts opens of selected advanced surfaces:

- Bill Studio
- Essentials Runway
- Lifestyle Flex
- Savings Goals
- Can I Spend This?
- Scenario Sandbox
- Weekly Memory
- Connected Data
- Advanced Insights

### Recommendation inspection

Counts openings of the primary Home recommendation sheet.

The recommendation content, financial state, severity, and amount are not written into analytics.

### Task completion

Counts successful completion of broad task types:

- spending logged;
- bill protection contribution;
- imported transaction reconciled;
- Plan saved;
- new week started;
- Plan adjustment.

The task counter records only the task type.

### Correction actions

Counts:

- imported reconciliation undone;
- imported transaction reclassified.

These counters help evaluate whether reconciliation flows create avoidable correction work.

### Density choices

Counts deliberate switches among:

- Compact
- Balanced
- Rich

The analytics screen also reads the current density preference directly from presentation settings.

## Product-quality focus

Phase 16 explicitly avoids optimizing for engagement time.

The dashboard is oriented toward:

- category-focus usage;
- advanced-tool usage;
- successful task completion;
- correction actions;
- recommendation inspection;
- interface-density choices.

No metric rewards keeping the user in the app longer.

## Correction ratio

The Usage Insights screen displays a descriptive correction ratio:

`correction actions / successful imported reconciliations`

This is not a score and is not treated as proof that the reconciliation system is good or bad.

Its purpose is to highlight potential workflow friction.

## Local dashboard

A new route is available at:

`#analytics`

Navigation:

**Details → System & Settings → Usage Insights**

The dashboard displays:

- whether counters are enabled;
- Home category focus totals;
- deep-tool opens;
- task completions;
- recommendation opens;
- reconciliation corrections;
- current presentation density;
- broad world/studio comparison bars;
- privacy design constraints.

## User control

The Usage Insights screen supports:

### Enable local counters

Starts counting from that point forward.

### Disable collection

Stops new counter updates.

Existing counters remain until the user clears them.

### Clear counters

Deletes all aggregate usage counts without changing financial state.

### Export counters JSON

Creates a local JSON file containing only the aggregate analytics model.

The export explicitly declares:

- local-only;
- no financial amounts;
- no merchant/category names;
- no event timestamps.

## Financial-state isolation

Phase 16 does not change:

- Available Now;
- bills;
- categories;
- transactions;
- savings;
- recommendations;
- Connected Data calculations;
- Scenario;
- Weekly Memory;
- portable financial exports.

The analytics key is not part of the normalized financial data envelope.

## Privacy integration

The Phase 14 Privacy & Local Data inventory recognizes:

`thisweek.analytics.v1`

and describes it as an optional local-only aggregate usage-counter key.

Deleting all This Week browser data also deletes the analytics key because the privacy deletion path removes every `thisweek.*` key.

## Instrumentation boundary

Instrumentation occurs only after successful actions or explicit user interactions.

Examples:

- a failed transaction submission is not counted as a completed task;
- a failed reconciliation is not counted as complete;
- merely rendering a recommendation is not counted as an open;
- Home focus is counted only when the user actually focuses a category world.

## Zero-cost architecture

Phase 16 uses only:

- browser JavaScript;
- localStorage;
- existing static GitHub Pages hosting.

There is no:

- analytics SaaS;
- server ingestion;
- remote event queue;
- tracking pixel;
- paid telemetry service.

## Regression protection

The static checker now requires:

- Phase 16 marker;
- local analytics storage key;
- opt-in control;
- aggregate recorder;
- category-focus instrumentation;
- studio-open instrumentation;
- recommendation-open instrumentation;
- task-completion definitions;
- correction definitions;
- dashboard renderer;
- explicit no-dwell-time language;
- explicit no-remote-analytics language;
- local analytics export.

## Remaining validation

Hands-on checks still useful:

- enable counters, perform one action, confirm exactly one increment;
- disable counters, perform actions, confirm no increments;
- clear counters and verify financial state remains unchanged;
- reload Safari and confirm enabled/disabled state persists;
- verify counters remain aggregate after several imported reconciliations;
- verify Privacy & Local Data lists the analytics key;
- verify JSON export contains no financial amounts or user-created names.
