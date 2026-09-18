# Phase 5 — Details as the System Map

**Status:** Implemented in production source  
**App commit:** `8e1fa7d1bbd6033f93b4ef4f3676e95e5c756b8c`  
**Phase 0 rollback branch:** `baseline-phase-0-2026-09-18`

## Objective

Phase 5 gives advanced capability one predictable location.

The information architecture is now:

`Home → Details → Studio / Tool`

- **Home** decides.
- **Details** organizes.
- **Studios** specialize.
- **Insights** analyzes.
- **Plan** changes the underlying structure.

Details is intentionally more capable than Home, but it no longer tries to display every advanced function simultaneously.

## Previous problem

The prior Details screen combined:
- a financial-anatomy visualization;
- category rows;
- current-week totals;
- a long undifferentiated list of advanced links.

This made Details useful but visually dense and increasingly difficult to scale as new capabilities were added.

## New Details architecture

Details is now a grouped **System Map**.

### 1. Current Week

This group is open by default because it contains the most likely next destinations.

It includes:
- Bill Protection Studio
- Essentials Runway
- Lifestyle Flex Studio
- Savings Goal Studio
- New Week / cycle transition

Each destination retains its category-specific visual identity and a compact live signal.

Examples:
- number of bills needing attention;
- Essentials remaining;
- Lifestyle remaining;
- savings this week;
- days remaining in the cycle.

### 2. Planning Tools

This group contains forward-looking decision tools:
- Can I Spend This?
- Scenario Sandbox
- Add Spending

These tools help the user decide or record activity without mixing them into Current Week inspection.

### 3. Data & History

This group contains:
- Connected Data Center
- Weekly Memory
- Advanced Insights

The Connected Data entry can display the number of imported items requiring reconciliation.

The Insights entry uses the current planning-health label without reproducing the full analysis on Details.

### 4. System & Settings

This group contains:
- Plan
- Presentation Settings
- System Architecture

This keeps configuration and technical/product controls away from day-to-day decision tools.

## Progressive disclosure

Only **Current Week** is open by default.

The remaining groups use native collapsible sections.

This gives the screen meaningful structure without reintroducing the Home clutter problem.

The user can open multiple groups intentionally, but no advanced group is forced open.

## Tool search

Details now includes a lightweight local search field.

Search can match:
- category names;
- tool names;
- task descriptions;
- badges / capability labels.

When a search is active:
- groups with no matching tools disappear;
- matching groups open automatically;
- nonmatching tools are hidden;
- the interface reports the number of matching destinations;
- an empty-result state is shown when needed.

No network search or external data is involved.

## Compact current-week overview

The top of Details contains only four summary values:
- Available
- Spent
- Protected
- Savings

These provide orientation before the user chooses a deeper system.

They do not replace the richer calculation surfaces in the studios.

## Visual integration

The System Map uses:
- category accent colors;
- semantic emblems;
- reduced card chrome;
- tighter mobile rows;
- grouped disclosure;
- subtle rather than constant animation.

On <=430px:
- the top overview becomes a 2×2 grid;
- tool grids collapse to one column;
- each destination remains a large thumb target.

## Functional integration

Phase 5 does not duplicate studio logic.

Every System Map tool points to an existing route:
- `#bills`
- `#essentials`
- `#lifestyle`
- `#savings`
- `#precheck`
- `#scenario`
- `#log`
- `#connections`
- `#history`
- `#insights`
- `#setup`
- `#preferences`
- `#future`
- `#reset`

This means Details remains a navigation and orientation layer instead of becoming another implementation of every tool.

## Trust behavior

The map itself does not mutate financial data.

Opening Details or searching tools:
- does not save a transaction;
- does not alter the plan;
- does not reconcile imported data;
- does not change savings goals;
- does not start a new week.

Meaningful mutations still occur only in their dedicated tools with explicit actions.

## Validation

- both JavaScript blocks compile successfully;
- the old Details financial-anatomy renderer has been removed from `renderDetails()`;
- all deep studio renderers remain present;
- the four System Map groups are present;
- local tool search is present;
- core financial storage keys and endpoints remain unchanged.

## Remaining real-device gate

Phase 5 still requires iPhone Safari verification for:
- native `<details>` accordion behavior;
- search keyboard and viewport resizing;
- one-column tool-row readability at 390px;
- large-text wrapping;
- VoiceOver summary announcement;
- bottom navigation while the search field is active.
