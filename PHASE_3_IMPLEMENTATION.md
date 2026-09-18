# Phase 3 — Bottom Sheets & Lightweight Inspection

**Status:** Implemented in production source  
**Primary app commit:** `1ded53ff6df6795398decfcd91c08eadab44867b`  
**Refinement commit:** `3ec5f2146fb9b1a321aead2d1221d02d49f28184`  
**Phase 0 rollback branch:** `baseline-phase-0-2026-09-18`

## Objective

Phase 3 adds a lightweight inspection layer between Home Peek and full Studios.

The interaction hierarchy is now:

`Rest → Peek → Bottom Sheet → Studio`

Bottom sheets are for understanding one thing quickly. Studios remain the place for deeper work.

## Implemented systems

### Shared bottom-sheet controller
A reusable sheet controller now supports:
- one active sheet maximum;
- category accent theming;
- visible close control;
- backdrop dismissal;
- Escape-key dismissal;
- focus containment;
- focus restoration;
- swipe-down dismissal using the drag handle;
- controlled mobile height;
- iOS safe-area bottom padding;
- scrollable sheet body without scrolling the page underneath.

Opening a new sheet removes any existing sheet first. Sheets do not stack.

### Subcategory inspection
Tapping a child in Category Peek now opens a bottom sheet instead of forcing a page transition.

The sheet keeps Home visible behind it and displays category-specific facts.

#### Bills
Possible facts:
- required today;
- marked protected;
- weekly target;
- due timing.

#### Essentials
Possible facts:
- weekly allocation;
- remaining amount;
- percentage used;
- approximate remaining amount per remaining day.

#### Lifestyle
Possible facts:
- weekly allocation;
- remaining amount;
- percentage used;
- approximate remaining amount per remaining day.

#### Savings
Possible facts:
- current goal progress;
- target;
- remaining gap;
- percentage complete.

Each sheet provides one clear route into the corresponding full Studio.

### Command-pill expansion
The compact Home recommendation no longer has to immediately navigate away.

Tapping the command pill now opens an explanatory sheet.

Examples:

#### Bill attention
Shows:
- current protection gap;
- number of bills needing attention;
- Available Now;
- explanation of why bills are being prioritized;
- link to Bill Protection Studio.

#### Overspent category
Shows:
- amount beyond the weekly lane;
- whether the lane is Essential or Lifestyle;
- Available Now;
- link to the relevant studio.

#### Week rollover
Shows:
- current Available Now;
- week-end date;
- savings this week;
- link into the New Week flow.

#### No urgent action
Shows:
- Available Now;
- bill state;
- overspent-lane count;
- primary action to Add Spending.

### Contextual More integration
The Phase 2 `•••` menu remains contextual and visible only for the focused category.

Its **Explain State** action now opens the shared bottom sheet rather than injecting longer copy into Home.

This keeps explanatory text off the resting scene.

### Auto-collapse integration
Phase 2 auto-collapse pauses while a bottom sheet is open.

The selected category does not collapse underneath the user while they are reading its sheet.

### Route integration
When a sheet action opens the focused category’s Studio:
- the sheet closes;
- route choreography remains available;
- the destination page still receives its category-world transition.

Normal non-category routes such as Add Spend or New Week close the sheet and navigate conventionally.

## Trust behavior

Bottom sheets distinguish quick planning interpretation from deep editing.

Current sheet provenance language explicitly clarifies:
- plan-derived values;
- recorded-spending basis;
- locally stored savings-goal data;
- distinction from bank-account balances.

No bottom-sheet inspection changes financial data by itself.

## Mobile behavior

The sheet is designed for one-handed phone use:
- enters from the bottom;
- max height is constrained;
- inner content scrolls independently;
- safe-area padding is included;
- at very narrow widths, fact grids and action rows collapse to one column;
- swipe down from the handle dismisses the sheet.

## Accessibility behavior

The sheet uses:
- `role="dialog"`;
- `aria-modal="true"`;
- a labeled title;
- visible close button;
- Escape support;
- keyboard focus containment;
- focus restoration when dismissed.

Reduced Motion disables sheet transition animation without removing functionality.

## Preserved architecture

Phase 3 does not change:
- financial calculations;
- transaction mutation logic;
- bill contribution logic;
- Connected Data reconciliation;
- savings-goal persistence;
- scenario isolation;
- History;
- Details;
- standard bottom navigation.

## Remaining validation gate

Real-device verification remains required for:
- swipe-down behavior in iPhone Safari;
- VoiceOver announcement and focus order;
- sheet height with large text;
- software keyboard interaction if future sheets contain inputs;
- bottom-nav/backdrop layering;
- safe-area behavior on devices with a Home indicator;
- sheet close/restore focus after route changes.

