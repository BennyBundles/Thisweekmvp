# Phase 9 — Scenario Sandbox, Weekly Memory & Learning Loops

**Status:** Implemented in production source  
**Primary app commit:** `162e0d95b35b01b0cf0f25bedc91e7e143afc810`  
**Refinement commit:** `8e6385bafd276d9836515d1959a524dc55f56af0`  
**Phase 0 rollback branch:** `baseline-phase-0-2026-09-18`

## Objective

Phase 9 adds two deeper planning loops without making Home more complex:

1. **Scenario Sandbox** — test temporary assumptions before changing the real plan.
2. **Weekly Memory** — compare completed weeks, identify descriptive patterns, and generate restrained reflection prompts.

The architecture remains:

`Home → Details → Scenario / History`

Neither system changes the live plan merely by being opened or used.

---

# Part A — Scenario Sandbox

## 1. Parallel-plan model

Scenario Sandbox now compares:

**Current Plan** → **Temporary Scenario**

The current plan remains untouched.

The scenario calculates an estimated change to planning room based on temporary inputs.

The model supports multiple variables at once:

- income change;
- bill-target change;
- additional planned savings;
- Essential allocation change;
- Lifestyle allocation change.

Each input is signed.

Examples:

- Income `-100` = $100 less weekly income.
- Bills `+50` = $50 more weekly bill requirement.
- Savings `+25` = reserve $25 more in the planning model.
- Essentials `+25` = give Essentials $25 more allocation.
- Lifestyle `-25` = reduce Lifestyle allocation by $25.

## 2. Current vs scenario comparison

The screen now displays two separate planning states.

### Current plan
Shows the existing Available Now value.

### Scenario planning room
Shows the estimated Available Now after all temporary changes.

A delta badge indicates whether the scenario produces:

- more planning room;
- less planning room;
- no change.

The scenario is intentionally described as **planning room**, not cash, balance, wealth, or forecast.

---

## 3. Multi-variable modeling

The Scenario estimator now combines all temporary variables:

`scenario room = current available + income change - bill change - savings change - essential allocation change - lifestyle allocation change`

This means users can test compound questions such as:

- What if income drops while bills rise?
- What if I increase savings and reduce Lifestyle?
- What if Essentials needs more room this week?
- What if I lower one planning allocation while raising another?

The calculation remains arithmetic and transparent.

---

## 4. Quick scenario presets

Five shortcut presets are available:

- Income -$100
- Bills +$50
- Savings +$25
- Essentials +$25
- Lifestyle -$25

Presets only populate the temporary sandbox.

They do not change live Plan values.

Multiple presets can be combined and then edited manually.

---

## 5. Category-level scenario effects

The sandbox also displays estimated effects on:

- Bills target;
- Essentials room;
- Lifestyle room;
- planned Savings.

This produces a parallel visual model rather than reducing the whole what-if exercise to one final number.

The Phase 9 refinement corrected category-lane math so:

- increasing an allocation increases that category’s scenario room;
- reducing an allocation reduces that category’s scenario room;
- the corresponding Available Now effect moves in the opposite direction.

---

## 6. Scenario session memory

Temporary scenario inputs are stored only in:

`sessionStorage`

under:

`thisweek.scenarioDraft.v1`

This allows the sandbox to survive ordinary navigation within the current browsing session.

It does not become permanent financial data.

The user can choose:

**Reset preview**

to clear the temporary model.

---

## 7. Explicit application boundary

There is no button that silently applies Scenario values to the real Plan.

The primary path is:

**Open Plan to apply intentionally**

The user must make and save the actual plan change in the Plan surface.

This preserves a strong distinction between:

- simulation;
- decision;
- mutation.

---

## 8. Preview-only language

The Scenario screen explicitly states:

**Preview only.**

It also explains that the output is:

- not a forecast of a bank balance;
- not a future cash-flow guarantee;
- not an automatic plan change.

No transaction, bill, savings goal, imported record, or allocation is mutated by Scenario Sandbox.

---

# Part B — Weekly Memory

## 9. Richer historical summaries

Weekly Memory now builds a more complete summary for each stored week.

Historical data includes:

- Available at the stored week snapshot;
- total recorded spending;
- Essential allocation and spending;
- Lifestyle allocation and spending;
- planned savings;
- Bill weekly target;
- amount marked protected;
- bill-protection gaps;
- count of bill attention events;
- count of categories below zero;
- recorded transaction count;
- category allocation/use details.

The refinement also aligns historical **Available** more closely with Home logic by summing actual remaining category values, including negative lanes rather than discarding them.

---

## 10. Visual weekly fingerprints

Each week displays four primary bars:

- Bills target;
- Essentials allocation;
- Lifestyle allocation;
- planned Savings.

The bars are normalized against the stored history so weeks can be visually compared without requiring a spreadsheet.

Each week also shows compact metadata such as:

- recorded spending;
- Available at snapshot;
- bill attention count;
- lanes below zero;
- transaction count;
- amount marked protected.

---

## 11. Category close-out details

Each weekly fingerprint can expand to show category detail.

The current implementation surfaces the highest-use categories first and shows:

- category name;
- percentage of allocation used;
- remaining amount.

Additional categories are summarized with a compact `+N more` row.

This keeps History readable on mobile while preserving deeper information.

---

## 12. Week-over-week trend summary

When at least two completed weeks exist, the app creates a descriptive comparison using the latest two completed weeks.

Current comparisons include:

- Available-at-close change;
- attention-event change.

Example:

> Available-at-close was $42 higher than the prior completed week; 1 fewer attention event was recorded.

If there is insufficient history, the app explicitly says that more completed weeks are needed for a useful comparison.

The trend summary is descriptive rather than predictive.

---

## 13. Planned-savings streak

Weekly Memory now tracks consecutive completed weeks that contain a positive planned savings amount.

This is labeled:

**Planned savings streak**

It is deliberately not presented as:

- verified deposits;
- bank savings growth;
- investment performance.

The value reflects the stored weekly planning model only.

---

# Part C — Learning Loop

## 14. Three-part reflection model

Weekly Memory now generates three restrained prompts:

### Pattern observed

A descriptive comparison such as:

- more/fewer attention events;
- higher/lower recorded spending;
- similar high-level week-close signals.

### Positive signal

The system looks for a factual constructive signal such as:

- no bill-protection gap at close;
- no category ending below zero;
- a planned savings amount being present;
- the week being preserved as a usable baseline.

### Possible adjustment

The app may suggest a **review or scenario to test**, not prescribe an action.

Examples:

- review bill-protection timing;
- check whether Essential allocation still matches recorded practical spending;
- test a different Lifestyle allocation or soft-cap threshold;
- use Scenario Sandbox before editing the real Plan.

---

## 15. Nonjudgmental learning language

The learning loop avoids:

- “good/bad spender” framing;
- punishment metaphors;
- shame;
- claims that a user failed;
- claims about what a user should be able to afford.

The language focuses on:

- observed planning state;
- recorded activity;
- optional review;
- possible what-if testing.

---

## 16. Historical limitations

Weekly Memory explicitly states that it reflects the stored This Week planning state.

It may not contain:

- purchases never entered;
- imports never reconciled;
- external-account changes;
- cash activity outside the app;
- later corrections that were not recorded.

Therefore, the app does not treat history as a complete financial record.

---

# Part D — Functional integration

## 17. Scenario ↔ History connection

Scenario Sandbox links directly to:

**Compare with Weekly Memory**

Weekly Memory links directly to:

**Test a what-if**

This creates a controlled loop:

`Observe history → test scenario → intentionally edit Plan if desired → observe future weeks`

The loop does not require adding information to Home.

---

## 18. Details integration

Both tools remain in the existing Details System Map:

### Planning Tools
- Scenario Sandbox

### Data & History
- Weekly Memory

No new permanent Home module was added.

---

## 19. Trust and safety boundaries

Phase 9 preserves the following:

- scenarios never mutate live state automatically;
- history never modifies current week;
- learning prompts are descriptive;
- scenario output is not presented as a bank forecast;
- planned savings is not treated as verified account savings;
- historical patterns are not treated as predictions;
- no future financial result is guaranteed;
- applying a scenario requires deliberate Plan editing.

---

## 20. Validation

Verified after implementation:

- both JavaScript blocks compile;
- richer Weekly Memory summary is present;
- week-over-week trend function is present;
- planned savings streak is present;
- learning loop is present;
- multi-variable Scenario estimator is present;
- session-only Scenario state is present;
- Preview-only guard text is present;
- explicit Plan application path is present;
- core weekly calculations and transaction mutation endpoints remain intact.

## Remaining real-device / data-quality gate

Phase 9 still needs hands-on verification for:

- several consecutive closed weeks;
- only one completed week;
- no completed weeks;
- weeks containing negative category balances;
- weeks with no savings plan;
- long category names;
- 390px History fingerprint layout;
- Scenario keyboard behavior on iPhone;
- decimal/negative entry behavior;
- repeated preset combinations;
- leaving and returning to Scenario within one Safari session;
- resetting a Scenario;
- large-text accessibility;
- VoiceOver reading of week fingerprints and learning-loop cards.
