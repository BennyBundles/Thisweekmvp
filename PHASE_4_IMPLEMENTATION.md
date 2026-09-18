# Phase 4 — Motion Discipline & Semantic Financial Events

**Status:** Implemented in production source  
**App commit:** `549e217a7970a21a6396c8665433f3a2a48a09ee`  
**Phase 0 rollback branch:** `baseline-phase-0-2026-09-18`

## Objective

Phase 4 changes animation from a constantly prominent visual layer into a structured communication system:

`Ambient → Active → Confirmation`

The product should remain visually distinctive without asking the user to process high-energy motion continuously.

## 1. Ambient motion

The resting Home scene is now intentionally quieter.

Changes include:
- lower default flow opacity;
- slower flow-dash timing;
- slower orbital/background motion;
- slower Available Now breathing;
- reduced intensity in Calm mode;
- slightly richer atmospheric depth in Cinematic mode.

Ambient animation is intended to signal that the financial system is alive without becoming a competing information source.

## 2. Active motion

When a category enters Peek:
- non-selected flows reduce to very low opacity;
- only the selected category’s path increases in brightness and width;
- the selected path moves faster;
- the focused parent remains visually dominant.

This makes motion follow attention rather than trying to create attention everywhere at once.

## 3. Confirmation motion

Financial actions now produce category-specific confirmation events.

### Recorded spending
After a purchase is saved:
- a semantic event is queued;
- the originating transaction chamber gets a brief local confirmation;
- when Home opens, a short money-flow event travels toward Essentials or Lifestyle;
- the relevant parent receives a brief confirmation pulse;
- a compact caption identifies the recorded event.

### Bill protection
After a bill contribution:
- the bill row receives a brief local confirmation;
- a Bills confirmation event is queued;
- the next Home view can visually confirm money moving into the Bills world.

### Savings-goal progress
After adding progress:
- the selected savings card receives a local confirmation;
- a Savings event is queued;
- Home can confirm the contribution through the Savings path.

### Connected-data reconciliation
After confirming an imported purchase:
- the reconciliation row receives a brief local confirmation;
- the event is routed to Essentials or Lifestyle based on the chosen category type;
- Home later shows the corresponding financial-flow confirmation.

### New week
After rollover:
- a week-reset event is queued;
- Home performs a restrained whole-scene rebuild rather than another category transfer animation.

## 4. Event persistence

Confirmation events use temporary `sessionStorage`, not permanent financial state.

This means:
- the financial action is still stored through the normal data model;
- animation metadata does not contaminate plan data;
- an event expires if Home is not reached within a short window;
- confirmation animation cannot change the financial calculation.

## 5. Motion preferences

Existing presentation preferences now materially affect motion behavior.

### Calm
- lower ambient opacity;
- slower events;
- quieter focus state.

### Dynamic
- normal interaction intensity.

### Cinematic
- richer ambient depth;
- longer confirmation timing;
- stronger but still category-specific focus.

### Reduced
- continuous Home movement is disabled;
- event particles are removed;
- waits that exist only for animation are skipped;
- financial actions and navigation remain functional.

Motion intensity and information density remain independent controls.

## 6. Performance discipline

Nonessential Home motion now pauses when:
- the browser/tab becomes hidden;
- the Home scene is not meaningfully visible in the viewport.

An `IntersectionObserver` controls scene-level animation pause state.

The observer is disconnected during route changes so old Home scenes do not remain observed after navigation.

## 7. Visual hierarchy refinement

Phase 4 also reduces unnecessary visual chrome:
- Home surface shadowing is slightly calmer;
- non-form informational sections receive lighter borders/shadows;
- Runway, Goal, and History objects keep subtle containment because they represent distinct objects;
- forms and actionable controls retain stronger boundaries.

The goal is to increasingly organize the app through:
- scale;
- spacing;
- opacity;
- motion;
- alignment;
- category accent;
rather than adding another card for every piece of information.

## 8. Trust and control

Animations remain secondary to explicit financial state.

Rules preserved:
- confirmation animation occurs only after the underlying action succeeds;
- animation never claims an account transfer occurred;
- savings-goal animation represents planning-goal progress, not verified bank movement;
- imported purchases animate only after explicit reconciliation;
- conventional navigation remains available;
- Reduced Motion preserves all functionality.

## 9. Validation

- both JavaScript blocks compile successfully;
- transaction event hook is present;
- bill-protection event hook is present;
- savings-goal event hook is present;
- imported-transaction reconciliation event hook is present;
- new-week rebuild event hook is present;
- visibility/background animation pausing is present;
- viewport intersection pausing is present;
- core storage keys and financial endpoints remain unchanged.

## Remaining real-device gate

Phase 4 still requires iPhone Safari verification for:
- CSS `offset-path` event travel;
- event alignment with the compact Home paths;
- battery/thermal behavior under Cinematic motion;
- interruption behavior when navigating rapidly;
- VoiceOver with confirmation captions;
- Reduced Motion at the OS and in-app levels;
- background/foreground animation resume behavior.
