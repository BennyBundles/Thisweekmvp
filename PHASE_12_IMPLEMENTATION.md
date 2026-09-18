# Phase 12 — Performance & Resilience

**Status:** Implemented in production source  
**Final Phase 12 app commit:** `1b0ac71b4fc9b3d4cff399e575c031ba0cb9101e`  
**Phase 0 rollback branch:** `baseline-phase-0-2026-09-18`

## Objective

Phase 12 keeps This Week responsive as the product becomes more visually and functionally capable.

The phase focuses on:

- less repeated parsing and calculation;
- fewer unnecessary storage writes;
- less work while Home is collapsed;
- no leaking Home listeners;
- constrained animation work;
- adaptive visual rendering on constrained devices;
- local storage-footprint monitoring;
- preserving the volatile fallback when persistence fails;
- protecting legacy browser state from missing-array crashes;
- exposing local runtime diagnostics without collecting analytics.

No Phase 12 optimization changes the financial meaning of the plan.

---

## 1. Core-state cache

The browser-local financial state now keeps a serialized in-memory copy after first load.

Repeated reads during the same session can parse that in-memory serialization rather than repeatedly fetching the same payload from localStorage.

The persisted key remains:

`thisweek.state.v2`

The storage format itself was not replaced.

---

## 2. Single-serialization state writes

Core writes now serialize the state once.

That serialized value is reused to:

- update the volatile in-memory copy;
- compare against the last persisted value;
- write to localStorage only when needed.

If the serialized core state is identical to the last persisted state, the redundant localStorage write is skipped.

The Performance screen tracks:

- successful persistent writes;
- redundant core writes skipped.

---

## 3. Volatile fallback remains active

A failed localStorage write does not remove the in-memory copy.

The runtime continues to retain the current financial state in memory for the active page session.

The application still cannot promise persistence across reload when browser storage is unavailable.

Phase 12 makes that boundary visible in Runtime diagnostics rather than silently implying persistence succeeded.

---

## 4. Legacy state normalization

Every loaded core state now passes through:

`normalizeRuntimeState()`

The normalizer repairs structural arrays that older or partially migrated browser state may be missing, including:

- weeks;
- transactions;
- adjustments;
- imported external IDs;
- bill arrays;
- Essential-category arrays;
- Lifestyle-category arrays;
- per-week balances;
- per-week bill allocations.

This specifically hardens the older-state failure mode where a missing array could cause a method such as `.filter()` to throw during Home generation.

The normalizer does not invent financial amounts.

---

## 5. Preference cache

Presentation preferences are now cached in memory after first read.

Repeated calls to:

`readUiPrefs()`

no longer need to parse the same localStorage JSON on every animation, navigation, or accessibility decision.

Writing preferences invalidates/replaces the cache immediately.

Cross-tab storage changes invalidate it as well.

---

## 6. Savings-goal cache

Savings-goal data is cached against the current core-state revision.

The cache is refreshed when:

- the financial state revision changes;
- savings goals are written;
- another browser tab changes the savings-goal key.

This keeps default-goal generation consistent with the current configured weekly savings rule while avoiding repeated storage parsing.

---

## 7. Connected Data cache

The Connected Data Center now keeps its normalized local payload in memory after first read.

Repeated calls during:

- Home recommendation generation;
- Details;
- reconciliation screens;
- import review

avoid repeatedly parsing and re-normalizing the complete import dataset.

Writes update both the localStorage payload and the cache.

A cross-tab storage event invalidates the cached copy.

---

## 8. Derived planning caches

Pure or effectively per-payload calculations now use lightweight derived caches.

Current caches include:

- week-time state;
- simple Home decision state;
- Home financial signals;
- Weekly Memory summaries.

The first three use the current payload object as their cache boundary.

Weekly Memory is cached against the core-state revision.

No cached value is treated as permanent financial data.

---

## 9. Minute-scoped week-time cache

Week progress depends on the clock.

The week-time helper therefore does not keep an unlimited stale result.

Its cache is scoped to the current minute.

This reduces repeated date arithmetic inside one render while allowing time-sensitive displays to refresh naturally on later renders.

---

## 10. Duplicate generator work reduced

The local financial API previously performed `runGenerators()` and then immediately called `homePayload()`, which performed `runGenerators()` again.

Phase 12 lets callers tell `homePayload()` that generation already occurred.

High-frequency paths such as:

- current-week creation/read;
- bill contribution;
- several state mutation paths

now avoid a second immediate generator pass.

The default remains safe: callers that did not already generate the week still receive a generated payload.

---

## 11. Home child models are lazy

Resting Home no longer builds every detailed Bills, Essentials, Lifestyle, and Savings child model up front.

The four parent worlds are created immediately.

Detailed child facts and semantic child icons are created only when that category enters Peek.

Each category’s child model is then cached for that Home render.

This directly supports the progressive-disclosure rule:

**collapsed capability should cost less than expanded capability.**

---

## 12. Resting Home DOM remains compact

The Peek container and More container continue to exist as lightweight shells, but their child controls are not inserted until needed.

Collapsed Home therefore does not permanently render every subcategory as hidden DOM.

This is especially important for older iPhones and plans with many categories.

---

## 13. Home visibility-listener cleanup

Earlier Home renders attached a new document visibility listener each time the Home disclosure controller initialized.

Phase 12 adds explicit cleanup.

When leaving or rebuilding Home:

- the previous visibility listener is removed;
- the auto-collapse timer is cleared;
- only the current Home controller remains active.

This prevents route navigation from accumulating inactive Home listeners over a long session.

---

## 14. Existing animation suspension remains

The Phase 4 animation discipline remains active.

Nonessential Home animation pauses when:

- the page is backgrounded;
- the scene is outside the meaningful viewport.

Phase 12 preserves that behavior rather than adding a second competing animation scheduler.

---

## 15. Adaptive performance tier

The runtime now chooses between:

- `standard`
- `lite`

presentation tiers.

Lite can activate from conservative browser/device signals such as:

- Save Data;
- low exposed hardware concurrency;
- low exposed device-memory hint;
- extremely narrow viewport.

These are rendering hints only.

They do not change financial calculations, decision-support priority, transaction handling, or persistence behavior.

---

## 16. Lite rendering mode

Lite mode reduces decorative rendering costs, including:

- large ambient background animation;
- some backdrop blur;
- route-transition duration;
- decorative scan/sheens;
- atmospheric scene opacity;
- semantic confirmation particle count.

The core interaction and information remain present.

Reduced Motion still takes precedence where applicable.

---

## 17. Semantic particle cap

Financial confirmation effects are now explicitly capped.

- Reduced Motion: 0 travel particles
- Lite runtime: maximum 2
- Standard runtime: maximum 3

The visual effect cannot scale particle count based on transaction count or financial amount.

This prevents a confirmation animation from becoming an uncontrolled rendering workload.

---

## 18. Forced layout reads removed

Phase 12 removes the explicit `offsetWidth` reads that were previously used to restart CSS feedback animations.

Those synchronous layout reads were replaced with requestAnimationFrame scheduling.

Affected interactions include:

- global tap feedback;
- local financial confirmation;
- setup blueprint flash feedback.

The static regression check now fails if `offsetWidth` is reintroduced.

---

## 19. Storage footprint monitoring

A new runtime helper calculates the serialized size of This Week localStorage keys.

The app reports:

- total local serialized footprint;
- largest individual This Week keys;
- percentage of an internal 2 MB soft-warning threshold.

The 2 MB threshold is deliberately labeled as an internal product threshold.

It is **not** presented as a browser quota, because storage quotas vary by browser, device, and browsing mode.

---

## 20. Performance & Resilience screen

A new route is available at:

`#performance`

Navigation path:

**Details → System & Settings → Performance & Resilience**

The screen is diagnostic only.

It shows:

- adaptive rendering tier;
- current DOM node count;
- This Week localStorage footprint;
- session cache hit rate;
- browser-reported logical cores;
- browser-reported memory hint when available;
- semantic particle cap;
- observed Long Tasks where supported;
- route render timing;
- persistent write count;
- redundant state writes skipped;
- current storage/fallback condition.

No diagnostic is uploaded.

---

## 21. Route timing

The main router now records session-only JavaScript render duration for routes.

For each route the diagnostic layer can show:

- render count;
- average duration;
- maximum duration;
- most recent duration.

These numbers are local diagnostic timings, not a formal browser benchmark or paint metric.

They are intended to identify relative route regressions during development.

---

## 22. Long-task observation

Where the browser exposes the Long Tasks Performance API, Phase 12 counts observed long-task entries.

Where the browser does not expose it, the feature safely remains inactive.

No attempt is made to infer unsupported measurements.

---

## 23. Clear derived caches

The Performance screen includes:

**Clear derived caches**

This clears only computed/presentation caches.

It does **not** delete:

- the Plan;
- transactions;
- imported records;
- reconciliation state;
- savings goals;
- presentation preferences.

The caches repopulate as screens are used.

---

## 24. Cross-tab invalidation

A storage-event listener invalidates relevant in-memory caches when another tab modifies:

- core state;
- UI preferences;
- savings goals;
- Connected Data;
- user identity.

This avoids keeping a fast but stale in-memory view after another tab changes persistent data.

---

## 25. Storage wrappers

The highest-value persistent surfaces now use shared safe storage helpers so runtime failures can be observed consistently.

These include:

- core financial state;
- user ID;
- UI preferences;
- savings goals;
- Connected Data;
- Lifestyle soft caps;
- recommendation suppression preferences.

The helpers record local persistence failures without throwing away the volatile state.

---

## 26. Route-level lazy rendering remains the architecture

Deep tools are still rendered only when their route is opened.

Home does not instantiate:

- Insights;
- Connected Data Center;
- History;
- Scenario;
- category studios;
- Device QA;
- Performance diagnostics

in the background.

Phase 12 preserves this route-level laziness rather than preloading every advanced tool into the Home DOM.

---

## 27. Performance tier follows viewport changes

The adaptive runtime tier is reevaluated when the mobile viewport controller runs.

That includes changes driven by:

- orientation;
- viewport resizing;
- supported mobile browser viewport behavior.

A narrow device can therefore enter the lighter presentation path without requiring an app reload.

---

## 28. Financial behavior preserved

Phase 12 does not intentionally change:

- Available Now semantics;
- bill-proration rules;
- category allocations;
- transaction mutation rules;
- Connected Data reconciliation;
- savings-goal meaning;
- recommendation hierarchy;
- Scenario math;
- Weekly Memory meaning.

Optimization is kept below the financial-model layer.

---

## 29. Static validation

After the final Phase 12 refinement:

- both JavaScript blocks compile;
- no explicit `offsetWidth` layout reads remain;
- adaptive-tier marker exists;
- core state normalizer exists;
- serialized state cache exists;
- derived planning caches exist;
- lazy Home child construction exists;
- Home listener cleanup exists;
- semantic particle cap exists;
- storage-footprint monitor exists;
- Performance route exists;
- route timing exists.

---

## 30. Remaining physical performance gate

Source-level optimization cannot prove smoothness on every older iPhone.

The remaining hands-on gate includes:

- 390px iPhone Safari Home interaction;
- a smaller/older supported iPhone if available;
- repeated Home → Studio → Home navigation for listener/memory stability;
- Cinematic vs Lite rendering;
- long History datasets;
- large Connected Data imports;
- keyboard interaction during storage-heavy sessions;
- background/foreground recovery;
- several minutes of normal use for thermal/battery behavior;
- route timing before/after large data growth.

Phase 12 is complete at the source level. Older-iPhone smoothness still requires physical-device confirmation.
