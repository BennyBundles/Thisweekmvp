# This Week — Overall All-Encompassing Action Plan

**Project:** This Week  
**Repository:** BennyBundles/Thisweekmvp  
**Current product direction:** highly capable mobile financial-planning and decision-support system that remains compact, calm, trustworthy, controllable, and easy to use.  
**Primary device:** iPhone-class mobile viewport.  
**Operating constraint:** no operating budget; prioritize local/static functionality, GitHub Pages, browser storage, and zero-cost architecture until a backend or paid data provider is justified.

---

# North Star

The app should feel simple at first contact and powerful only when the user asks for more.

A new user should be able to understand Home within a few seconds:

1. How much is available?
2. Where is money broadly going?
3. Does anything need attention?
4. What is the next best action?

An experienced user should be able to reach any advanced capability within two deliberate interactions.

The product should grow **outward in depth**, not **upward in visible clutter**.

---

# Phase 0 — Freeze, audit, and establish the baseline

## Objective
Protect the working product before additional redesign work and define the exact baseline that all future phases build from.

## Actions
- Tag the current stable main-branch state.
- Capture screenshots at:
  - 320px
  - 375px
  - 390px
  - 430px
  - tablet
  - desktop
- Verify all current routes:
  - Home
  - Add Spend
  - Details
  - Bills Studio
  - Essentials Runway
  - Lifestyle Flex
  - Savings Goals
  - Pre-check
  - Connected Data
  - Weekly Memory
  - Scenario Sandbox
  - Insights
  - Preferences
  - Plan
- Confirm persistence and migration behavior for older localStorage state.
- Verify:
  - manual transaction entry
  - imported transaction reconciliation
  - bill-protection updates
  - savings-goal progress
  - new-week rollover
  - scenario isolation
  - preference persistence
- Create a compact smoke-test checklist.

## Deliverables
- Stable baseline commit/tag
- Visual baseline screenshots
- Route and feature inventory
- Regression checklist
- Known-issues list

## Completion criteria
No new design work begins until all currently working financial actions are verified and recoverable.

---

# Phase 1 — Compact Home foundation

## Objective
Make Home substantially calmer before adding more interaction depth.

## Primary items
- 1 — one-viewport Home
- 14 — Focused Compact default
- 15 — Zen Home
- 18 — remove duplicated numbers
- part of 20 — 390px iPhone compression baseline

## Actions
- Remove persistent explanatory paragraphs from Home.
- Remove duplicate category totals outside their parent category.
- Keep only:
  - compact header
  - Available Now
  - four parent categories
  - one status/command pill
  - bottom navigation
- Collapse the Connected Data/source display into a small icon.
- Move exact week-progress text out of the resting state.
- Convert the Next Suggested Step card into a compact command pill.
- Make Focused Compact the new default for new users while preserving stored preferences for existing users.
- Reduce vertical padding and ensure the resting Home fits within or very near one iPhone viewport.

## Expected user benefit
- Faster understanding
- Less scrolling
- Less visual fatigue
- Stronger confidence that Home is the decision surface rather than an analysis page

## Risks
- Users may think features disappeared.
- Existing users may perceive reduced information.

## Countermeasures
- Keep Details visible in bottom navigation.
- Use small “Tap category for more” onboarding.
- Preserve all deeper routes.
- Do not delete features—only relocate their visible representations.

## Completion criteria
At rest, Home communicates the full weekly state without showing subcategory text, explanatory paragraphs, or repeated totals.

---

# Phase 2 — Progressive disclosure architecture

## Objective
Make complexity appear only after explicit user intent.

## Primary items
- 2 — collapsed constellations
- 3 — one expanded category at a time
- 4 — Collapsed → Peek → Studio
- 5 — semantic signals
- 12 — universal More control
- 13 — attention override
- 16 — auto-collapse

## Actions

### 2.1 Category resting state
Each parent shows only:
- emblem
- name
- amount
- compact state signal

Examples:
- Bills · $380 · Needs $42
- Essentials · $232 · On pace
- Lifestyle · $110 · Active
- Savings · $145 · Growing

### 2.2 Peek state
First tap:
- parent brightens
- up to 2–3 relevant children appear
- no other category expands
- small Open Studio control appears

### 2.3 Studio state
Second tap or Open Studio:
- scene-to-page choreography begins
- category world expands into its destination studio

### 2.4 Priority logic
Child ranking should prioritize:
- urgent bills
- nearly depleted categories
- fast-moving flexible categories
- savings gaps

### 2.5 Attention override
Allow one critical child to surface automatically while the parent remains otherwise collapsed.

### 2.6 Auto-collapse
Return to Zen state after inactivity unless:
- user is interacting
- bottom sheet is open
- accessibility focus remains inside the expanded area
- unsaved input exists

## Expected user benefit
The system feels intelligent and deep without feeling permanently busy.

## Risks
- Extra taps
- hidden discoverability
- auto-collapse interrupting reading

## Countermeasures
- visible Open Studio control
- bottom navigation always available
- generous inactivity timer
- reset timer on any user activity
- no auto-collapse while a sheet or form is active

## Completion criteria
Only one category can expose child detail on Home at a time.

---

# Phase 3 — Bottom sheets and lightweight inspection

## Objective
Allow users to inspect details without leaving Home.

## Primary items
- 11 — bottom sheets
- 10 — command pill expansion
- 12 — contextual More menu

## Actions
- Build one reusable bottom-sheet controller.
- Subcategory tap opens a sheet with:
  - name
  - amount
  - state
  - one useful interpretation
  - one primary action
  - Open Studio
- Command pill opens a recommendation sheet showing:
  - why the recommendation exists
  - amount involved
  - data source
  - recommended action
- More menu appears only for the focused parent.

## Rules
- Never stack sheets.
- Sheet height should remain controlled.
- Deep work always transitions to a full studio.
- Swipe-down and explicit Close both work.

## Expected user benefit
Fewer page changes, better one-handed mobile use, preserved context.

## Completion criteria
Most “quick checks” can be completed without leaving Home.

---

# Phase 4 — Motion discipline and interaction hierarchy

## Objective
Keep the visual system exciting and distinctive without overwhelming the user.

## Primary items
- 7 — week arc integration
- 8 — contextual money flow
- 9 — Ambient → Active → Confirmation
- 17 — visual hierarchy instead of card hierarchy
- 18 — motion-density separation

## Actions

### Ambient motion
- slow breathing
- subtle orbit
- low-opacity flow
- low-frequency particles

### Active motion
When a user focuses a category:
- brighten only that category’s flow
- slightly increase packet frequency
- dim the other three systems
- enlarge focused parent slightly

### Confirmation motion
Examples:
- transaction → short money packet moves into category
- bill protection → shield locks/fills
- savings → particle rises into goal system
- reconciliation → external record crosses the bridge into the plan
- week reset → scene collapses and rebuilds

### Week arc
Integrate directly into center orb:
- thin arc
- tiny remaining-days marker
- exact percentage only on tap

## Expected user benefit
Animation communicates state and progress rather than acting as decoration.

## Risks
- motion sickness
- visual distraction
- battery/performance cost

## Countermeasures
- Reduced Motion
- Calm mode
- pause animation when off-screen/backgrounded
- transform/opacity only where possible
- cap simultaneous particles

## Completion criteria
The resting state is visually alive but cognitively quiet.

---

# Phase 5 — Details becomes the system map

## Objective
Give advanced capabilities one predictable home.

## Primary item
- 19 — Details as explicit expansion hub

## Actions
Organize Details into four groups:

### Current Week
- category anatomy
- bill state
- weekly allocation
- current alerts

### Planning Tools
- Bill Protection Studio
- Essentials Runway
- Lifestyle Flex
- Savings Goals
- Can I Spend This?
- Scenario Sandbox

### Data & History
- Connected Data Center
- Weekly Memory
- Insights

### Settings
- Plan
- Presentation Settings
- System Architecture

Use accordions or grouped sections to prevent Details from becoming another overloaded screen.

## Expected user benefit
Users always know where advanced capability lives.

## Completion criteria
Home points, Details organizes, Studios specialize.

---

# Phase 6 — Refine all four category worlds

## Objective
Make each category world distinct, useful, and professionally engineered.

## Bills
- shield/vault language
- due-date gravity
- required-by-today emphasis
- protection gap
- fund-next recommendation
- clear contribution controls

## Essentials
- runway in days
- daily room
- pace relative to week
- semantic category icons
- practical “will this last?” language

## Lifestyle
- Calm / Active / Hot pace
- soft-cap capability
- flex-room indicator
- no moralizing language
- direct Pre-check access

## Savings
- purpose-specific goals
- target/current/gap
- weekly suggested contribution
- progress milestones
- pause/resume
- priority

## Completion criteria
Each world answers one clear question and does not duplicate the others.

---

# Phase 7 — Connected Data Center hardening

## Objective
Make external transaction data useful without eroding user trust.

## Current zero-cost scope
- CSV import
- posted vs pending status
- merchant/description recognition
- category suggestions
- explicit reconciliation
- duplicate protection
- imported-data provenance

## Actions
- Improve CSV parser resilience.
- Add support for common bank export column names.
- Add import preview before save.
- Add import undo.
- Add reconciliation history.
- Add unmatched/deferred state.
- Add source labeling on imported transactions.
- Add “already reconciled” detection.
- Allow category correction after reconciliation.
- Add clear-data confirmation.

## Direct bank sync — deferred backend phase
Prepare interfaces for:
- provider consent
- account list
- transaction sync
- pending/posted transitions
- error/reconnect state

Do not embed provider credentials in client-side code.

## Completion criteria
Imported data can never silently change the weekly plan.

---

# Phase 8 — Intelligence and decision-support refinement

## Objective
Make recommendations useful, explainable, and restrained.

## Actions
- Preserve only one primary Home recommendation.
- Create an explanation registry for each signal:
  - what happened
  - why it matters
  - what data was used
  - what the signal does not mean
- Distinguish:
  - urgent
  - important
  - informational
- Add recommendation suppression to avoid repeated nagging.
- Add “no action needed” state.
- Ensure no recommendation is presented as investment, legal, or banking advice.

## Completion criteria
The app helps the user decide without acting as if it knows more than it does.

---

# Phase 9 — Scenario, history, and learning loops

## Objective
Help users understand patterns without cluttering everyday use.

## Scenario Sandbox
- income changes
- bill increases
- extra savings
- category reductions
- optional future multi-variable scenarios
- clear “preview only” labeling

## Weekly Memory
- visual fingerprints
- week-over-week comparison
- trend summaries
- savings streak
- bill attention history
- category pace patterns

## Future enhancement
Allow a completed week to generate:
- one lesson
- one positive signal
- one possible adjustment

Avoid shaming or gamifying hardship.

## Completion criteria
History informs planning but never dominates Home.

---

# Phase 10 — Personalization and accessibility

## Objective
Let users control presentation without changing the underlying financial model.

## Presentation controls
- Calm
- Dynamic
- Cinematic
- Reduced Motion

## Density controls
- Compact
- Balanced
- Rich

## Contrast
- Normal
- High contrast

## Accessibility
- larger text support
- semantic labels
- accessible state announcements
- no color-only meaning
- large touch targets
- screen-reader-safe bottom sheets
- focus trapping only where appropriate

## Completion criteria
All core functions remain usable with Reduced Motion and large text.

---

# Phase 11 — Dedicated iPhone compression and device QA

## Objective
Treat mobile as the canonical product.

## Test widths
- 320
- 375
- 390
- 430
- tablet
- desktop

## Verify
- safe-area insets
- no horizontal overflow
- keyboard behavior
- bottom-nav clearance
- no constellation collisions
- touch target size
- one expanded layer maximum
- bottom-sheet behavior
- route choreography
- localStorage persistence
- imported CSV behavior
- back navigation
- refresh resilience
- offline/static behavior

## Safari-specific checks
- dynamic URL bar
- viewport height changes
- input zoom
- fixed/sticky elements
- safe-area bottom padding

## Completion criteria
390px iPhone experience passes the entire smoke-test checklist before any new feature work.

---

# Phase 12 — Performance and resilience

## Objective
Keep the app fast despite increasing visual sophistication.

## Actions
- reduce DOM nodes in collapsed mode
- lazy-render deep tools
- pause animation when hidden
- cap particle counts
- avoid repeated layout reads/writes
- use CSS transforms/opacity
- minimize repeated calculations
- cache derived view models
- monitor localStorage size
- preserve volatile fallback if storage fails
- maintain data migration logic

## Completion criteria
Home interaction remains smooth on older supported iPhones.

---

# Phase 13 — Data model cleanup and future backend readiness

## Objective
Prepare for eventual multi-device sync without forcing backend costs now.

## Actions
- normalize:
  - users
  - weeks
  - categories
  - transactions
  - bill contributions
  - savings goals
  - imports
  - reconciliation metadata
  - preferences
- add schema/version marker
- build migration functions
- define provider-agnostic connected-account interfaces
- define import source provenance
- create serialization/export capability

## Completion criteria
The browser-local model can later migrate to a server without redesigning the whole product.

---

# Phase 14 — Security, privacy, and trust hardening

## Objective
Make the financial application’s boundaries explicit.

## Actions
- clearly label local-only storage
- avoid collecting unnecessary personal data
- do not store provider secrets client-side
- sanitize imported file content
- never execute imported text
- maintain confirmation for financial mutations
- add export/delete-local-data tools
- explain which data is plan-derived vs imported

## Completion criteria
Users can understand where their data lives and what the app does with it.

---

# Phase 15 — Deployment and release discipline

## Objective
Stop production from drifting through uncontrolled visual changes.

## Actions
- main branch = production
- create a repeatable smoke-test checklist before every push
- use cache-busted test URLs after deployment
- maintain CHANGELOG
- tag stable milestones
- preserve rollback commit references
- document major state migrations

## Completion criteria
Every release has:
- known commit
- smoke-test result
- rollback point
- release notes

---

# Phase 16 — Optional analytics without paid infrastructure

## Objective
Understand usability without invasive tracking.

## Zero-cost approach
Prefer local diagnostic counters first:
- how often category focus is used
- which studios open
- whether users choose Compact/Rich
- whether recommendations are opened
- whether imported-data reconciliation is used

Store locally unless a privacy-reviewed analytics backend is later added.

## Use
Do not optimize for engagement time. Optimize for:
- fewer confused interactions
- faster decisions
- fewer correction actions
- successful completion of financial tasks

---

# Phase 17 — Product polish and brand system

## Objective
Make the product visually coherent enough to feel like a finished financial product.

## Actions
- finalize icon construction grid
- finalize typography hierarchy
- finalize category color tokens
- finalize motion language
- reduce inconsistent border radii
- standardize shadows and glass surfaces
- remove redundant cards
- define empty/loading/error states
- define celebratory but restrained success states

## Completion criteria
Every screen looks like part of the same product without requiring identical layouts.

---

# Phase 18 — Power-user efficiency

## Objective
Increase speed for experienced users without making the beginner experience harder.

## Possible additions
- optional direct-open on category tap
- quick-add spend shortcuts
- pinned favorite tool
- recent action shortcut
- keyboard support on desktop
- rapid category switcher
- customizable Details ordering

All remain optional and disabled by default.

---

# Phase 19 — Live financial-provider integration, only when justified

## Prerequisites
- backend available
- security model defined
- provider selected
- consent flows designed
- token handling implemented
- reconnect/error handling designed
- privacy policy complete

## Integration principle
Connected data supplements:
- it does not replace planning
- it does not silently recategorize
- it does not merge pending and posted data
- it does not convert account balance into Available Now

---

# Phase 20 — Continuous improvement loop

## Objective
Prevent feature growth from recreating the clutter problem.

Before every new feature:
1. Does this belong on Home?
2. Is it needed for the current decision?
3. Can it live in Peek, Bottom Sheet, Details, or a Studio?
4. Does it duplicate an existing number?
5. Can one existing control absorb it?
6. Does it create another permanent animation?
7. Does it need a new route?
8. What happens on 390px iPhone?
9. Does Reduced Motion still work?
10. Is the user still in control?

If the feature fails those questions, redesign the presentation before implementation.

---

# Recommended execution order

## Immediate Sprint — Compact and stabilize
Phases 0 → 1 → 2

Outcome:
- one-screen Home
- collapsed categories
- one expanded category at a time
- clear compact command pill

## Interaction Sprint — Reveal without overload
Phases 3 → 4

Outcome:
- bottom sheets
- More menu
- contextual motion
- better choreography

## Capability Sprint — Deep tools
Phases 5 → 6 → 8 → 9

Outcome:
- organized Details
- refined studios
- decision support
- history/scenario improvements

## Data Sprint
Phases 7 → 13 → 14

Outcome:
- stronger reconciliation
- robust local data model
- backend readiness
- trust/privacy hardening

## Quality Sprint
Phases 10 → 11 → 12 → 15 → 17

Outcome:
- accessible
- fast
- visually coherent
- deployment-safe

## Future Expansion
Phases 16 → 18 → 19 → 20

Outcome:
- controlled power-user growth
- optional analytics
- eventual direct financial integrations
- continuous anti-clutter governance

---

# Final acceptance standard

The system is ready for the next major feature wave only when:

- Home is understandable in seconds.
- Home fits the mobile viewport without forced scrolling for ordinary use.
- Only one category exposes deeper information at once.
- Advanced tools remain reachable within two deliberate interactions.
- No important number is duplicated unnecessarily.
- Every financial number has a clear data source.
- Imported or connected activity never silently modifies the plan.
- Reduced Motion preserves all functionality.
- No mobile layout overflows horizontally.
- The user always retains a conventional navigation path.
- The app feels professional and capable without visually advertising every capability at once.
