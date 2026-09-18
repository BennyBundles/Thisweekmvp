# Phase 1 — Compact / Zen Home Implementation

**Status:** Implemented in production source  
**App commit:** `d915cd0e7f2f2bf9d4c541121a652e231bb7b73c`  
**Rollback branch:** `baseline-phase-0-2026-09-18`

## Scope completed

### One-viewport Home
Home has been rebuilt around one dominant visual scene instead of multiple stacked analytical blocks.

The resting hierarchy is now:
1. compact product header;
2. week window + tiny data/import indicator;
3. one central Available Now orb;
4. four category parents;
5. one compact command pill;
6. fixed bottom navigation.

### Focused Compact default
The UI preference default changed from `balanced` to `compact` for users who do not already have a stored density preference. Existing saved density values continue to override the new default.

### Zen Home
The default Home scene removes persistent subcategory cards, explanatory paragraphs, adaptive constellation labels, category-summary strip, recent-flow text, separate status card, and duplicate Available Now display.

### Number deduplication
- Available Now has one dominant Home location: the center orb.
- Each major category amount appears once in its parent node.
- The duplicate four-category strip under the scene was removed.
- Exact week percentage was removed from the resting state.

### Compact source/import state
The full source/import text has been replaced by a small data-link icon.
If imported records require review, the icon gains a numeric badge.

### Week-progress compression
The weekly time state is integrated into the center orb as:
- a thin progress ring;
- a tiny remaining-days marker.

### Compact recommendation
The large Next Suggested Step section is replaced with one command pill.
Examples:
- `Protect $42 for bills`
- `Dining needs review`
- `Review and start the next week`
- `Add spending after purchases`

### Mobile compression
A dedicated <=430px and <=390px Home treatment reduces:
- shell-header height;
- scene height;
- category-node size;
- center-orb size;
- bottom-nav padding;
- typography.

Safe-area padding remains applied to the fixed bottom navigation.

### Static fallback
The pre-JavaScript/static fallback was also replaced with the compact Zen Home architecture. This prevents the old dense dashboard from flashing before the app initializes.

## Preserved capability

The Phase 1 Home reduction did **not** remove the advanced system.

The following remain present in the source:
- Bill Protection Studio
- Essentials Runway
- Lifestyle Flex Studio
- Savings Goal Studio
- Can I Spend This?
- Weekly Memory
- Scenario Sandbox
- Connected Data Center
- Advanced Insights
- Presentation Settings
- Plan / Setup
- New Week
- transaction import and reconciliation
- bill contribution endpoint
- scene-to-page choreography
- semantic icon system
- local persistence

## Interaction in Phase 1

During Phase 1, category parents remain direct navigation targets:
- Bills → Bill Protection Studio
- Essentials → Essentials Runway
- Lifestyle → Lifestyle Flex
- Savings → Savings Goal Studio
- Available Now center → Can I Spend This?

Phase 2 will replace this direct-only behavior with the full progressive-disclosure controller:
`Collapsed → Peek → Studio`.

## Validation

- Both JavaScript blocks compile successfully.
- Core feature markers remain present.
- All known storage-key names remain unchanged.
- No core calculation endpoint was removed.
- The Phase 0 rollback branch remains available.

## Remaining Phase 1 gate

Real-device verification is still required for:
- 390px iPhone viewport;
- Safari dynamic toolbar;
- safe-area clearance;
- keyboard interaction on linked forms;
- animation smoothness;
- whether the complete resting Home fits within the intended mobile viewport in the deployed site.

