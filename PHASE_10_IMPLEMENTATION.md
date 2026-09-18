# Phase 10 — Personalization & Accessibility

**Status:** Implemented in production source  
**Primary app commit:** `785acb3f2abea3e917d001442a6e12eaed0d3bd1`  
**Refinement commit:** `3c8e8964746fa77526d9132d3e8a300a83f6dcb1`  
**Phase 0 rollback branch:** `baseline-phase-0-2026-09-18`

## Objective

Phase 10 makes the same financial system usable across different visual, motion, readability, touch, and assistive-technology needs without changing the underlying calculations.

The guiding rule is:

**Personalization changes presentation, never the financial model.**

---

## 1. Expanded presentation preference model

The existing UI preference store remains:

`thisweek.uiPrefs.v1`

Older saved preferences continue to merge into the expanded schema.

The preference model now supports:

- Motion
- Visual density
- Contrast
- Text size
- Touch-target sizing
- Haptics

New defaults for users without saved preferences are designed to be system-aware:

- Motion: System
- Density: Compact
- Contrast: System
- Text: Standard
- Touch: Comfortable
- Haptics: On

Existing stored choices continue to override defaults.

---

## 2. System-aware motion

A new **System** motion option follows the device’s:

`prefers-reduced-motion`

When Reduce Motion is enabled at the OS/browser level, the app resolves System motion to Reduced.

When Reduce Motion is not enabled, System resolves to Dynamic.

The app listens for changes while open and reapplies the effective presentation automatically.

The Phase 10 refinement also updates JavaScript-driven timing, choreography, confirmation delays, scrolling, and local animations so System-reduced motion is respected consistently—not just by CSS.

---

## 3. System-aware contrast

A new **System** contrast option uses:

`prefers-contrast: more`

where supported.

If the device requests increased contrast, the app resolves System contrast to High.

Otherwise it resolves to Normal.

High Contrast now increases more than text brightness. It strengthens:

- surface borders;
- button/control edges;
- navigation edges;
- progress-track contrast;
- category-node edges;
- secondary label legibility.

---

## 4. Text-size controls

Three text scales are now available:

- Standard
- Large
- Extra Large

Text scaling is applied at the root document level so rem-based typography across the application scales together.

The mobile Home layout includes additional rules for Large and Extra Large text to reduce collision risk.

For example:

- subordinate category status text can hide while primary labels and amounts remain;
- the Home scene gets additional height where needed;
- the center orb reduces secondary copy;
- bottom navigation and bottom sheets receive extra room.

The intent is to increase readability without simply allowing the interface to overflow horizontally.

---

## 5. Comfortable touch targets

Touch sizing now supports:

- Standard
- Comfortable

Comfortable mode enforces approximately 44px minimum height for many primary interactive controls, including:

- buttons;
- action links;
- preference choices;
- bottom navigation items;
- bottom-sheet actions;
- form fields;
- close controls.

This is especially important for one-handed iPhone use.

---

## 6. Haptic control

Haptic feedback can now be:

- On
- Off

Haptics are also suppressed automatically when effective motion is Reduced.

This affects optional tactile confirmation only.

Turning haptics off does not alter:

- transactions;
- calculations;
- alerts;
- navigation;
- financial events.

---

## 7. Quick presentation profiles

Presentation Settings now starts with three high-level profiles so users do not need to understand every individual preference.

### Focused

Designed for everyday use:

- Compact density
- System-aware motion
- System-aware contrast
- Standard text
- Comfortable touch targets
- Haptics on

### Comfortable

Accessibility-forward:

- Compact density
- Reduced motion
- High contrast
- Large text
- Comfortable touch targets
- Haptics off

### Rich

More expressive presentation:

- Rich density
- Cinematic motion
- Normal contrast
- Standard text
- Comfortable touch targets
- Haptics on

Profiles are starting points. Fine-tuning remains available.

---

## 8. Fine-tune controls remain progressively disclosed

Advanced presentation options are now placed inside a single:

**Fine-tune presentation**

disclosure.

This prevents the Preferences page itself from becoming visually overwhelming.

The user can ignore the advanced settings entirely and use one of the three profiles.

---

## 9. Keyboard focus visibility

The app now defines a consistent global `:focus-visible` treatment.

Keyboard focus receives:

- a bright outline;
- additional offset;
- a subtle surrounding glow.

This applies to links, buttons, form controls, summaries, and other focusable elements.

Focus visibility is not dependent on color alone; the geometric outline remains visible.

---

## 10. Skip to main content

A keyboard-accessible:

**Skip to main content**

link is now present at the beginning of the document.

It remains visually hidden until focused.

The main app region is focusable with:

`tabindex="-1"`

so route transitions can move programmatic focus to the newly rendered content.

---

## 11. SPA route announcements

Because This Week is a single-page application, changing the hash route does not trigger a normal browser page load.

Phase 10 adds a live route announcer.

Examples include:

- Home loaded
- Bill Protection Studio loaded
- Weekly Memory loaded
- Scenario Sandbox loaded
- Connected Data Center loaded
- Presentation and Accessibility loaded

When navigating to a different route, focus also moves to the main content region.

Routine re-rendering of the same route does not force focus back to the top.

---

## 12. Document-title updates

Each page render now updates the browser title using:

`<Page Name> · This Week`

This improves orientation for:

- screen readers;
- browser tabs;
- history;
- multitasking.

---

## 13. Current navigation state

Bottom navigation now exposes:

`aria-current="page"`

on the active route.

The attribute is removed from inactive tabs.

This gives assistive technology a semantic current-page indicator in addition to the visual active state.

---

## 14. Modal / bottom-sheet containment

When a bottom sheet is open, the underlying app shell is now marked:

`inert`

This prevents keyboard and assistive-technology interaction with controls behind the active modal.

When the sheet closes:

- inert is removed;
- focus restoration can return to the prior control.

This complements the existing:

- dialog role;
- focus trap;
- Escape dismissal;
- visible close button;
- backdrop dismissal.

---

## 15. Error semantics

The shared error component now uses:

`role="alert"`

Important errors can therefore be announced automatically by compatible assistive technology.

The existing toast system remains a polite live status region for routine confirmations.

---

## 16. Color-independent state communication

Phase 10 reinforces the product rule that color is not the sole state indicator.

The interface pairs color with text such as:

- Critical
- Important
- Needs attention
- Protected
- Running low
- Applied
- Deferred
- Complete
- Current

The Preferences page explicitly documents this behavior.

---

## 17. Accessibility behaviors are not hidden behind settings

Several accessibility improvements are always active:

- Skip to Content
- route announcements
- visible keyboard focus
- current-page semantics
- dialog focus containment
- error alerts
- textual state labels

The user does not need to enable an “accessibility mode” to receive these basics.

---

## 18. Motion and density remain independent

A user can combine settings such as:

- Compact + Cinematic
- Rich + Reduced Motion
- Large Text + Dynamic
- High Contrast + Compact

This avoids assuming that accessibility or readability preferences imply a specific information-density preference.

---

## 19. Financial-model isolation

Phase 10 does not change:

- Available Now calculations;
- bill protection calculations;
- category balances;
- transactions;
- Connected Data reconciliation;
- savings goals;
- Scenario math;
- Weekly Memory history;
- recommendation priority logic.

All Phase 10 settings are presentation-layer controls.

---

## 20. Validation

Verified after implementation:

- both JavaScript blocks compile;
- System motion preference exists;
- System contrast preference exists;
- OS preference listeners exist;
- JavaScript choreography respects effective Reduced Motion;
- Large and Extra Large text modes exist;
- Comfortable touch targets exist;
- Haptics can be disabled;
- Skip to Content is present;
- keyboard focus styles are present;
- route announcements exist;
- active navigation exposes current-page state;
- modal background is inert while a sheet is open;
- shared errors expose alert semantics;
- quick profiles exist;
- advanced settings remain progressively disclosed.

## Remaining real-device accessibility gate

Phase 10 still requires hands-on verification for:

- iPhone Dynamic Type / Safari text scaling behavior;
- VoiceOver route announcements;
- VoiceOver modal focus containment;
- hardware-keyboard focus order;
- Skip to Content behavior;
- OS Reduce Motion changes while the app is open;
- High Contrast where `prefers-contrast` is supported;
- 390px and 320px layouts at Extra Large text;
- zoom to 200%;
- landscape orientation;
- comfortable touch targets near the iOS Home indicator;
- no horizontal scroll with long category names;
- screen-reader reading order in Details, Connected Data, History, and Scenario.
