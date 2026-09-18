# Phase 6 — Refined Four Category Worlds

**Status:** Implemented in production source  
**App commit:** `d4c0c90ebba886f2aabdfb434e83aabc8321caef`  
**Phase 0 rollback branch:** `baseline-phase-0-2026-09-18`

## Objective

Phase 6 makes Bills, Essentials, Lifestyle, and Savings feel like four distinct professional decision environments instead of four differently colored versions of the same screen.

Each world now answers one primary question:

- **Bills:** What needs protection next?
- **Essentials:** Will practical spending last the week?
- **Lifestyle:** How much flexible room remains, and how fast is it moving?
- **Savings:** Where should the configured weekly savings plan be directed?

The deeper screens are allowed to be more capable than Home, but they still use progressive disclosure and restrained controls.

---

## Bills — Protection Studio

### Primary question
**What needs protection next?**

### New behavior

#### Required-today vs. weekly target
Bills now separates:
- required by today;
- full weekly target;
- amount already marked protected.

This prevents a future weekly target from visually competing with an obligation that needs action today.

#### Fund Next recommendation
The highest-pressure obligation is ranked first using:
- required-by-today gap;
- remaining weekly target;
- configured due date;
- amount still unprotected.

The recommended amount can be prepared directly into that bill’s contribution field without automatically applying it.

The user still explicitly confirms **Mark protected**.

#### Due-date gravity
Bills are ordered by pressure and due timing.

Each obligation shows:
- configured due timing;
- required-today state;
- remaining amount to weekly target;
- protection progress.

#### Clear control semantics
The studio explicitly states that marking money protected is a planning record. It does not move money in a bank account.

---

## Essentials — Runway Studio

### Primary question
**Will practical spending last the remaining week?**

### New behavior

Each essential lane now calculates:
- remaining allocation;
- amount used;
- pace relative to week elapsed;
- estimated runway based on recorded spending;
- approximate daily room for the remaining week.

### Pace language
The studio uses:
- Slower than week
- Tracking week
- Faster than week

instead of moralized spending labels.

### Runway interpretation
Each category gives a practical answer such as:
- likely to last at current recorded pace;
- current pace could use more room;
- weekly lane exceeded.

The studio explicitly notes that runway is an estimate based on recorded spending and can be distorted by missing/delayed transactions.

### Targeted Pre-check
Every essential lane can launch **Can I Spend This?** with that category preselected.

---

## Lifestyle — Flex Studio

### Primary question
**How much optional room remains, and how quickly is it being used?**

### New behavior

The overall Flex temperature remains:
- Calm
- Active
- Hot

This is based on spending pace relative to week elapsed.

### Soft-cap capability
Each flexible category now has an optional warning line.

Default:
- 80%

Available thresholds:
- 70%
- 80%
- 90%
- 100%

Soft caps:
- do not block a purchase;
- do not change the weekly allocation;
- do not change Available Now;
- act only as earlier warning lines.

Each lane shows:
- remaining money;
- percent used;
- room before the soft cap;
- pace relative to the week.

### Nonjudgmental states
Examples:
- Within soft cap
- Near soft cap
- Beyond soft cap

The UI explicitly states that crossing a soft cap does not mean a purchase is wrong or prohibited.

### Targeted Pre-check
Every flexible lane can open purchase Pre-check with that category selected.

---

## Savings — Goal Studio

### Primary question
**Where should the weekly savings plan be directed?**

### New behavior

Savings goals now support:
- current progress;
- target;
- remaining gap;
- priority;
- active/paused state;
- suggested weekly allocation;
- manual progress updates.

### Priority
Each goal can be:
- High
- Medium
- Low

Priority changes how the configured weekly savings amount is suggested across active goals.

### Pause / resume
Goals can be paused without deleting them.

Paused goals:
- remain visible;
- retain progress;
- receive no suggested weekly allocation;
- cannot receive manual progress until resumed.

### Suggested weekly contribution
When a weekly savings target exists, the app distributes it proportionally using:
- remaining goal gap;
- goal priority;
- active/paused state.

This is explicitly labeled as a planning suggestion.

It is not:
- an automatic transfer;
- investment advice;
- proof that external funds exist.

If no weekly savings target is configured, the studio does not invent one.

---

## Targeted purchase pre-check

Phase 6 adds a temporary category handoff into **Can I Spend This?**

When launched from:
- an Essentials lane; or
- a Lifestyle lane,

the relevant category is preselected.

This handoff uses session-only state and does not modify the financial plan.

---

## New local presentation state

Lifestyle soft-cap thresholds are stored under:

`thisweek.flexCaps.v1`

This storage contains warning preferences only.

It does not contain:
- bank data;
- transaction amounts;
- core weekly allocations.

---

## Trust and control

Phase 6 preserves several product rules:

- Bills never imply that “protected” means funds were actually transferred.
- Essentials runway is described as an estimate based on recorded data.
- Lifestyle soft caps remain warnings, not spending prohibitions.
- Savings suggestions are planning allocations, not automatic transfers.
- Targeted Pre-check does not save a purchase.
- Core calculations remain separate from presentation preferences.

---

## Validation

- both JavaScript blocks compile successfully;
- Bills urgency ranking is present;
- due-date gravity is present;
- Essentials runway pace calculation is present;
- Lifestyle soft-cap storage and controls are present;
- Savings priority/pause/suggestion logic is present;
- targeted Pre-check handoff is present;
- existing connected-data and transaction systems remain present;
- existing storage keys remain unchanged.

## Remaining real-device gate

Phase 6 still requires iPhone Safari verification for:
- bill control input ergonomics;
- runway-card readability at 390px;
- soft-cap settings with large text;
- savings goal controls with keyboard open;
- targeted Pre-check handoff;
- route return behavior after Pre-check;
- Reduced Motion confirmation states.
