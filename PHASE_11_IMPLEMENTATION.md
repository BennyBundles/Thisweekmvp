# Phase 11 — Dedicated iPhone Compression & Device QA

**Status:** Implemented in production source  
**Primary app commit:** `dd167dfdabf5343ef4c7309d15ef336438cd9c57`  
**Navigation refinement:** `cec64e0c5799985209bfc2df827d114b7858af00`  
**Phase 0 rollback branch:** `baseline-phase-0-2026-09-18`

## Objective

Phase 11 treats the phone experience as the canonical product and hardens the application for real iPhone Safari behavior.

The target widths are:

- 320px
- 375px
- 390px
- 430px
- tablet
- desktop

The key acceptance rule remains:

**No new feature work should be considered fully validated until the 390px iPhone experience passes the hands-on smoke test.**

This implementation adds the code-level protections and a built-in Device QA route, but physical Safari validation is still required.

---

## 1. Browser zoom is no longer blocked

The viewport meta tag no longer includes:

`maximum-scale=1`

The app keeps:

`viewport-fit=cover`

for iPhone safe-area support.

Users can therefore use browser zoom without the app deliberately disabling it.

---

## 2. VisualViewport controller

Phase 11 adds a mobile viewport controller that listens to:

- window resize;
- orientation change;
- VisualViewport resize;
- VisualViewport scroll.

The controller maintains:

- layout viewport height;
- visual viewport height;
- estimated keyboard inset;
- keyboard-open state;
- current width profile.

CSS variables include:

- `--app-vh`
- `--visual-vh`
- `--keyboard-inset`
- safe-area inset variables

This is intended to improve behavior during:

- Safari URL-bar expansion/collapse;
- keyboard opening;
- keyboard closing;
- orientation changes;
- browser restoration from the back-forward cache.

---

## 3. Keyboard-aware layout

When the software keyboard is detected as materially reducing the visual viewport:

- the bottom navigation fades/moves out of the way;
- bottom content padding is reduced;
- toasts move closer to the visible bottom;
- the sticky top bar becomes relative;
- bottom sheets constrain themselves to the visible viewport height.

When the keyboard closes, the normal navigation layout returns.

This reduces the risk that fixed navigation covers:

- Add Spending inputs;
- Scenario controls;
- Plan fields;
- Connected Data controls.

---

## 4. iOS input-zoom guard

On mobile widths, visible:

- inputs;
- selects;
- textareas

are forced to at least 16px font size.

This targets the common iOS Safari behavior where focusing smaller text fields can automatically zoom the page.

---

## 5. Safe-area hardening

The app now centralizes iPhone safe-area values for:

- top;
- right;
- bottom;
- left.

They are applied to:

- body edges;
- sticky header;
- bottom navigation;
- toast position;
- primary page bottom padding.

The Device QA route also reports detected top/bottom safe-area values.

---

## 6. Horizontal-overflow containment

Phase 11 adds broader mobile containment rules:

- document overflow is clipped horizontally;
- major layout descendants receive `min-width: 0`;
- common media cannot exceed container width;
- form controls cannot exceed parent width;
- long labels can wrap instead of forcing the layout wider.

This targets the requirement:

**No horizontal scrolling on supported phone widths.**

---

## 7. Canonical width compression

Dedicated refinements now exist for:

### <=430px
- tighter main/header side padding;
- tighter bottom navigation;
- smaller nav icon/label treatment;
- more compact sheet edge spacing.

### <=390px
- Home scene uses the visual viewport height;
- category-node and summary spacing tightens;
- studio controls become denser without removing core information.

### <=375px
- header geometry compresses further;
- Home scene shortens;
- category nodes shrink slightly;
- command arrow is removed when space is constrained;
- bottom-sheet framing tightens.

### <=320px
- brand decoration is minimized;
- category nodes become smaller;
- subordinate Home copy hides first;
- center orb keeps the primary amount;
- bottom nav compresses;
- multi-column summaries collapse where necessary.

The strategy remains:

**Remove secondary presentation before removing primary financial information.**

---

## 8. Short-height landscape mode

A dedicated landscape/short-height rule reduces:

- header height;
- nav height;
- bottom padding.

This prevents the fixed UI from consuming most of the available vertical space on a rotated phone.

---

## 9. Built-in Device QA route

Phase 11 adds:

`#qa`

The route is available from:

**Details → System & Settings → Device QA**

It performs non-destructive runtime checks on the device currently running the app.

Automated checks include:

- current viewport/profile;
- horizontal overflow;
- iOS input-zoom guard;
- visible touch-target sizing;
- bottom-navigation clearance;
- one-expanded-layer maximum;
- localStorage round-trip;
- imported CSV parser sample;
- safe-area detection;
- VisualViewport availability;
- static/offline-friendly runtime dependency check;
- hash-route controller presence;
- Reduced Motion path availability.

The QA screen does not alter financial state.

The storage test writes and removes a temporary QA key only.

---

## 10. CSV smoke test inside Device QA

The QA route passes a small quoted-comma/debit sample through:

- the delimited-text parser;
- imported-row normalization.

The test expects:

- one record;
- $12.50 normalized to 1250 cents.

This is not a replacement for Phase 7 institution-file testing, but it protects against a basic parser regression during later UI work.

---

## 11. Touch-target audit

The Device QA screen inspects visible interactive controls.

It reports controls whose current rendered size is under approximately 40px in either dimension.

This is a diagnostic threshold rather than a formal accessibility certification.

The Phase 10 Comfortable mode still targets approximately 44px for many primary controls.

---

## 12. One-expanded-layer audit

The Device QA screen counts:

- expanded Home categories;
- open bottom sheets.

The automated runtime check fails if more than one category or more than one sheet is active simultaneously.

This reinforces the progressive-disclosure rule established in Phases 2 and 3.

---

## 13. Static/offline-friendly runtime check

The current app is delivered as a self-contained static HTML application.

The QA route checks for external:

- script dependencies;
- stylesheet dependencies.

If none are present, it reports that the app has no external runtime JS/CSS dependency after the document itself loads.

This does **not** claim that a first uncached visit can work without network access.

A dedicated offline installation/service-worker strategy is intentionally not invented in Phase 11.

---

## 14. Back navigation refinement

Phase 11 adds route scroll memory for the current browsing session.

When navigating forward:

- a new destination starts at the top.

When using browser Back/Forward:

- the app can restore the remembered scroll position for the destination route.

The implementation uses:

- native hash history;
- `popstate`;
- in-memory route scroll positions;
- manual browser scroll restoration.

This keeps browser navigation conventional instead of inventing a custom back stack.

---

## 15. Back-forward cache recovery

A `pageshow` listener now reapplies:

- mobile viewport state;
- UI preferences.

This supports Safari returning to the page from the browser’s back-forward cache.

It does not rewrite financial state.

---

## 16. Refresh resilience

The app’s existing persistent layers remain localStorage-backed, including the core weekly state.

Phase 11 does not replace that storage system.

The Device QA route verifies a localStorage round trip on the current browser.

If localStorage is unavailable, the check warns rather than falsely reporting persistence.

The existing volatile fallback remains relevant for the core runtime.

---

## 17. Hands-on Safari checklist

The Device QA screen explicitly separates automated checks from physical validation.

The required human checks include:

### Keyboard + URL bar
- active field remains visible;
- bottom nav hides while keyboard is open;
- viewport recovers after closing keyboard.

### Home constellation
Test at:
- 320
- 375
- 390
- 430

Verify:
- no collisions;
- one Peek maximum;
- center orb remains tappable.

### Bottom sheet
Verify:
- drag dismissal;
- Home-indicator safe-area clearance;
- focus restoration.

### Back / refresh
Navigate several routes deep and verify:
- browser Back returns predictably;
- local plan survives refresh;
- route remains valid.

---

## 18. What Phase 11 does not claim

The source-level implementation cannot by itself prove:

- hardware Safari keyboard ergonomics;
- physical Home-indicator clearance on every iPhone;
- VoiceOver interaction quality;
- thermal/battery behavior;
- exact animation smoothness;
- device-specific WebKit rendering bugs.

Those remain real-device QA tasks.

---

## 19. Regression protection

The static regression checker now requires:

- Phase 11 CSS marker;
- mobile viewport controller;
- Device QA runtime;
- QA renderer;
- keyboard-state handling;
- Back/Forward state;
- route scroll restoration;
- pageshow recovery.

It also explicitly fails if:

`maximum-scale=1`

returns to the viewport meta tag.

---

## 20. Completion state

Phase 11 implementation is complete at the source level.

The remaining release gate is physical validation, especially on a 390px iPhone Safari viewport.

Both application script blocks passed syntax compilation after the Phase 11 build and navigation refinement.
