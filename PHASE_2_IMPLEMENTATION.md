# Phase 2 — Progressive Disclosure Implementation

**Status:** Implemented in production source  
**Primary app commit:** `a3b356319737e8aeaf99704b94ab11a691a75ae7`  
**Refinement commit:** `d0f1782b1e716a8c4abdf857f9182f94e6b458b5`  
**Phase 0 rollback branch:** `baseline-phase-0-2026-09-18`

## Purpose

Phase 2 changes Home from a simple compact dashboard into a **progressive-disclosure interaction system**:

`Collapsed → Peek → Studio`

The goal is to keep the app highly capable without forcing all capability into the resting Home screen.

## Implemented behavior

### 1. Categories are collapsed by default
Home initially shows only:
- Bills
- Essentials
- Lifestyle
- Savings

Each parent displays:
- emblem
- amount
- short semantic state

Subcategories are not persistently visible.

### 2. One category can be expanded at a time
A category tap enters **Peek**.

When one category is focused:
- that parent brightens;
- its flow path becomes prominent;
- other parents become quieter;
- only that category’s relevant child lanes appear;
- the center Available Now orb remains visible but visually subdued.

Selecting another category collapses the previous category automatically.

### 3. Collapsed → Peek → Studio
First tap:
- reveals the selected category’s Peek state.

Second tap on the same parent:
- launches scene-to-page choreography;
- enters the full category studio.

The Peek panel also has a dedicated **Open Studio** control so the gesture is not the only navigation path.

### 4. Adaptive child count
Peek obeys presentation density and screen width.

Current caps:
- compact / small iPhone: up to 2 visible children;
- balanced: up to 3;
- rich: up to 3 in Peek;
- remaining children become a `+N more` node.

Full category detail remains in the studio.

### 5. Relevance ranking
Children are ranked before display.

#### Bills
Bills with required-by-today gaps appear first.

#### Essentials
Overspent or nearly depleted essential lanes appear first.

#### Lifestyle
Overspent or fast-depleting flexible lanes appear first.

#### Savings
Goals with more progress remaining are prioritized for Peek.

### 6. Semantic state language
Peek uses short phrases rather than full explanatory paragraphs.

Examples:
- Needs attention
- On track
- Running low
- On pace
- Moving fast
- In range
- 62% complete
- Complete

A dedicated Explain action can replace the short Peek summary with a fuller explanation.

### 7. Universal More control
Only the currently focused category gets a compact `•••` control.

It exposes contextual actions without adding permanent buttons to Home.

Examples:
- Open Studio
- Explain State
- Edit Plan
- Can I Spend This?
- Scenario Sandbox
- Weekly History

The available actions vary by category.

### 8. Attention override
Compact mode does not bury urgent information.

When no category is expanded, one high-priority child can temporarily surface beside its parent.

Examples:
- Utilities · $42 needed today
- Dining · $18 over limit

Only one attention child appears at a time.

Tapping it focuses the relevant category rather than immediately navigating away.

### 9. Auto-collapse
A focused category returns to the resting Zen state after approximately 10 seconds of inactivity.

The timer:
- resets on interaction;
- pauses while the browser is hidden;
- does not collapse while keyboard/accessibility focus remains inside Peek or the More menu.

The user can also explicitly collapse with:
- the Peek close button;
- tapping the center Available Now orb while a category is focused.

### 10. Conventional navigation remains intact
The progressive interaction layer does not replace:
- Home
- Add Spend
- Details
- Plan

The bottom navigation remains continuously available.

## Usability logic

The Phase 2 interaction hierarchy is now:

### Rest
Understand the week.

### Peek
Inspect one category.

### Studio
Work deeply.

This prevents Home from becoming a permanent display of every bill, category, savings goal, tool, and explanation.

## Preserved functionality

Phase 2 does not change core financial calculations.

The following remain intact:
- weekly projection logic;
- bill contribution logic;
- transaction entry;
- imported transaction reconciliation;
- savings goal storage;
- scenario isolation;
- history;
- connected-data provenance;
- presentation preferences;
- route choreography.

## Mobile behavior

For <=390px:
- Peek is narrower;
- no more than two child lanes appear by default;
- child typography and symbols shrink;
- More menus receive dedicated mobile positioning;
- parent tap targets remain substantially larger than child nodes;
- one expanded information layer remains the maximum.

## Validation

- both JavaScript blocks pass syntax compilation;
- Phase 1 Compact / Zen Home remains present;
- Phase 2 CSS and controller are present;
- required storage keys remain unchanged;
- deep studios remain present;
- connected-data and transaction-import markers remain present;
- the Phase 0 static checker now includes Phase 2 regression markers.

## Remaining Phase 2 gate

Real-device validation is still required for:
- 390px iPhone Peek positioning;
- Safari dynamic viewport changes;
- second-tap choreography ergonomics;
- 10-second auto-collapse timing;
- VoiceOver focus behavior;
- More-menu reachability;
- attention override collision checks.

