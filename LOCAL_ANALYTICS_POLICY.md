# Local Usage Insights Policy

This Week's optional usage-insight system is intentionally local and aggregate.

## Collection is optional

The feature is disabled by default.

A user must explicitly enable local counters from:

**Details → Usage Insights**

## Data that may be counted

Only broad product-interaction totals:

- category-world focus;
- selected studio/tool opens;
- recommendation-sheet opens;
- broad task completions;
- import correction actions;
- density-setting choices.

## Data not collected

The local analytics model must not store:

- financial amounts;
- account balances;
- income;
- merchant names;
- user-created category names;
- transaction identifiers;
- notes;
- imported external IDs;
- event timestamps;
- route sequences;
- session duration;
- dwell time;
- scrolling;
- background usage.

## Storage

Analytics are stored in browser localStorage under:

`thisweek.analytics.v1`

No remote analytics endpoint is used.

## Product-goal rule

Usage data should be used to reduce:

- confusion;
- unnecessary navigation;
- correction work;
- time required to complete a financial task.

It should not be used to maximize:

- session length;
- screen views;
- repeated opens;
- notification pressure;
- engagement for its own sake.

## User control

Users can:

- enable collection;
- disable collection;
- clear all counters;
- export counters manually.

Deleting all This Week browser data also deletes the analytics key.
