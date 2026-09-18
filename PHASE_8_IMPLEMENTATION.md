# Phase 8 — Explainable Decision Support

**Status:** Implemented in production source  
**App commit:** `b5ef702d9057a29fd1462a9860c8579eb11b5179`  
**Phase 0 rollback branch:** `baseline-phase-0-2026-09-18`

## Objective

Phase 8 turns Home recommendations into a restrained, explainable decision-support system.

The governing rule is:

**Show one primary planning signal, explain why it exists, expose its limits, and let the user decide what to do.**

The system does not attempt to make financial decisions for the user.

---

## 1. One primary Home recommendation

Home now selects one recommendation from a ranked candidate set rather than stacking several pieces of advice.

Potential candidates include:

- negative Available Now;
- required-by-today bill protection gap;
- weekly rollover due;
- overspent category;
- spending pace running materially ahead of elapsed week time;
- imported posted purchases waiting for reconciliation;
- rollover approaching;
- explicit no-urgent-action state.

Only the highest-priority unsuppressed recommendation appears in the Home command pill.

---

## 2. Priority hierarchy

The recommendation engine uses four levels.

### Critical

Examples:

- Available Now below zero;
- one or more bills below required-by-today protection.

Critical signals are never snoozed.

### Important

Examples:

- rollover due;
- category below its configured weekly lane;
- recorded spending materially ahead of week pace.

Important suggestions may be hidden for four hours.

### Informational

Examples:

- imported transactions waiting for review;
- one day remaining before rollover.

Informational suggestions may be hidden for 24 hours.

### None

When no higher-priority unsuppressed signal exists, Home explicitly says:

**No urgent action from the current plan.**

This is intentionally different from implying that everything in the user’s financial life is fine.

---

## 3. Recommendation explainability

Each recommendation now carries four explanation fields.

### What happened

The concrete planning condition that triggered the signal.

### Why it matters

Why This Week chose to surface it ahead of other candidate signals.

### Data used

The specific planning inputs involved, such as:

- category allocations;
- recorded transactions;
- reconciled imported transactions;
- bill schedule;
- required-by-today values;
- protected contributions;
- elapsed week time;
- imported review queue.

### Limits

What the signal does **not** establish.

Examples:

- Available Now is not a bank balance.
- A negative planning lane is not automatically a bank overdraft.
- Crossing a weekly category limit does not mean a purchase was wrong.
- Spending pace can be distorted by front-loaded or missing transactions.
- “Protected” does not prove a bill was paid.
- Imported records are not applied until explicitly reconciled.

The Home recommendation sheet now includes a **How this signal was decided** disclosure containing these four fields.

---

## 4. Recommendation suppression

To reduce repetitive nagging, non-critical recommendations can be temporarily hidden.

### Important

Hidden for approximately four hours.

### Informational

Hidden for approximately 24 hours.

### Critical

Cannot be snoozed.

Suppression is stored separately under:

`thisweek.recommendations.v1`

It changes presentation only.

It does not:

- modify the plan;
- remove transactions;
- alter calculations;
- mark a financial issue as resolved.

Expired suppression records are ignored automatically.

---

## 5. One attention override

The Home attention child now follows the same primary recommendation.

This prevents Home from showing:

- one command pill about one issue; and
- a separate expanded child about another unrelated issue.

A bill child can surface when the current primary recommendation is a bill-protection gap.

An overspent category child can surface when the current primary recommendation is that category issue.

This keeps the compact Home hierarchy coherent.

---

## 6. Negative Available Now signal

A new critical signal exists when Available Now is below zero.

The explanation explicitly states:

- Available Now is the sum of remaining active spending lanes;
- the condition is a planning-model state;
- it is not a connected bank balance;
- it does not automatically mean an external account is overdrawn.

The primary action routes into Details for broader inspection.

---

## 7. Bill-protection signal

Required-by-today bill gaps remain critical.

The recommendation explains that it uses:

- bill amount;
- frequency;
- configured due date;
- weekly proration;
- amount marked protected.

It also explicitly states that This Week cannot verify:

- whether the bill was actually paid;
- whether money exists in a bank account.

---

## 8. Overspent-lane signal

A category below zero is treated as an Important planning signal.

The app now clarifies that this means:

**recorded spending exceeded the weekly lane configured in This Week.**

It does not mean:

- the purchase was wrong;
- the user cannot afford it outside this model;
- spending is prohibited.

The action routes to Essentials Runway or Lifestyle Flex depending on the category type.

---

## 9. Spending-pace signal

Phase 8 adds a primary recommendation candidate when recorded spending is more than roughly 1.25× the pace implied by elapsed week time.

The signal compares:

- percentage of active category allocation used;
- percentage of weekly cycle elapsed.

Its explanation states that unusual purchase timing or incomplete transaction entry can distort the result.

This keeps the pace signal useful without overstating precision.

---

## 10. Imported-data review signal

If posted imported outflows remain unmatched, the app may surface an informational review signal.

The explanation makes clear that:

- the imported purchases are not yet applied to This Week;
- they require explicit category confirmation;
- imported files can be incomplete or overlapping.

The action routes to Connected Data Center.

---

## 11. Rollover signals

Phase 8 distinguishes:

### Rollover due

Important.

The configured cycle boundary has been reached.

### One day remaining

Informational.

This is a timing cue only and does not imply that a financial action is mandatory.

---

## 12. No-urgent-action state

The app no longer defaults to an instruction such as “keep logging” as though an action is always necessary.

When no stronger signal exists, Home can explicitly show:

**No urgent action from the current plan.**

The explanation clarifies that this does not mean:

- there are no future obligations;
- there are no missing transactions;
- there are no external-account issues;
- the user needs no broader financial review.

---

## 13. Insights integration

Advanced Insights now shows the current primary planning recommendation as an explainable Decision Support card.

It includes:

- severity;
- current signal;
- primary action;
- explanation fields;
- number of temporarily hidden suggestions.

If recommendations have been snoozed, Insights provides:

**Restore hidden suggestions**

This gives the user explicit control over suppression.

---

## 14. Recommendation sheet behavior

The Home command pill still opens a bottom sheet.

The sheet now includes:

- recommendation severity;
- primary amount or signal;
- concise interpretation;
- supporting facts;
- provenance;
- expandable explanation;
- primary action;
- temporary hide option where permitted.

Critical signals do not display a snooze action.

---

## 15. Recommendation storage boundaries

The new recommendation preference key:

`thisweek.recommendations.v1`

contains only temporary presentation state such as suppression timing.

It does not store:

- bank credentials;
- external balances;
- transaction ledger data;
- bill payments;
- savings balances.

---

## 16. Trust rules preserved

Phase 8 follows these constraints:

- one recommendation at a time;
- user retains final decision authority;
- recommendations are planning signals, not commands;
- no recommendation silently changes data;
- critical conditions are not hidden automatically;
- imported records are not treated as actual spending until reconciled;
- bank balances are not inferred;
- external financial condition is not inferred from the planning model;
- pace signals state their limitations;
- the no-action state does not overclaim certainty.

---

## 17. Validation

Verified after implementation:

- both JavaScript blocks compile;
- one-primary recommendation engine exists;
- Critical / Important / Informational / None hierarchy exists;
- suppression logic exists;
- critical recommendations are unsuppressible;
- explanation metadata is rendered;
- no-urgent-action state exists;
- Insights exposes the recommendation and restoration controls;
- Phase 7 Connected Data hardening remains present;
- core state/storage structures remain intact.

## Remaining real-device gate

Phase 8 still needs hands-on verification for:

- command-sheet sizing on 390px iPhone;
- snooze and Home refresh behavior;
- VoiceOver reading of explanation disclosures;
- repeated route navigation after suppression;
- long category names in recommendation text;
- recommendation changes immediately after bill funding or transaction entry;
- Insights restoration control;
- persistence of snoozed suggestions after Safari relaunch.
