# This Week — Progressive Disclosure & Mobile Decision System

**Purpose:** define the next compact-display architecture for a highly capable, professional, trustworthy mobile financial-planning application.

**Primary design rule:** capability should expand faster than visible complexity. The app should expose only the information required for the current decision, then reveal deeper layers explicitly on demand.

**Core trust rules**
- Never present planning balances as bank balances.
- Never hide uncertainty, pending data, or imported-data provenance.
- Never force animation as the only navigation method.
- Never rely on color alone for state.
- Never make destructive or financially meaningful actions irreversible without confirmation.
- Keep calculations stable while allowing presentation density and motion to change.
- Preserve one obvious Home answer: what is available, what needs attention, and what to do next.

---

## 1. Compress Home into one visual viewport

### 1. How we will do this
Home becomes a fixed hierarchy: compact header, Available Now, four category parents, one attention/next-action pill, and bottom navigation. Remove persistent explanatory copy, duplicate category totals, secondary status blocks, and extended source labels. On iPhone-sized viewports, target a first meaningful paint where the complete decision surface is understandable without vertical scrolling. Deeper tools remain reachable through category focus, Details, or direct studio routes.

### 2. Expected effects and potential unwanted effects
Expected: faster comprehension, stronger confidence, reduced scanning burden, and less visual fatigue. Potential downside: users may think features were removed or may miss deeper functionality that used to be visible.

### 3. Countermeasures
Use subtle affordances such as “Tap category for more,” contextual glow on focused elements, a single More control, and one-time lightweight onboarding hints. Do not permanently display instructional text after the user has learned the interaction.

### 4. Functional integration
Home remains a read/decision surface. All calculations continue to run in the same underlying model. Home simply becomes a selective renderer over those calculations, while studios and Details retain full data.

### 5. Visual integration
The main scene becomes the dominant visual object. Everything else uses lower contrast, smaller scale, and reduced motion. The visual system should feel like one instrument rather than a vertical stack of cards.

---

## 2. Make category constellations collapsed by default

### 1. How we will do this
Bills, Essentials, Lifestyle, and Savings show only parent emblem, category name, one amount, and a tiny state signal in the default Home state. Subcategories remain represented as faint dots, arcs, or micro-symbols without labels. A first tap expands only that parent’s child constellation.

### 2. Expected effects and potential unwanted effects
Expected: major reduction in clutter while preserving the feeling of depth. Potential downside: hidden subcategory detail can make the interface feel less informative at first glance.

### 3. Countermeasures
The parent state signal should summarize what matters: “2 need attention,” “On pace,” “$110 left,” or “Goal growing.” If a child requires urgent action, allow that one child to surface automatically while keeping the rest collapsed.

### 4. Functional integration
The existing adaptive constellation engine becomes stateful: collapsed, peek, and focused. The rendering cap uses screen width, density preference, and priority ranking. No calculation changes are required.

### 5. Visual integration
Collapsed children are ambient geometry, not cards. They inherit the parent palette and icon family but remain low-opacity until expansion. The scene stays alive without becoming text-heavy.

---

## 3. Allow only one expanded category at a time

### 1. How we will do this
Home stores a single active category focus. Expanding Bills automatically collapses Essentials, Lifestyle, and Savings. Selecting another category performs a crossfade/morph rather than leaving multiple areas open.

### 2. Expected effects and potential unwanted effects
Expected: stronger focus, clearer hierarchy, less accidental overload. Potential downside: users comparing two categories may need extra taps.

### 3. Countermeasures
Provide a compact comparison strip in Details, not Home. Preserve category totals in the four parent nodes so cross-category comparison remains possible without opening multiple systems simultaneously.

### 4. Functional integration
The Home scene gets one `activeWorld` state. Category-specific child renderers use that state. Studios remain independent routes.

### 5. Visual integration
Focused category increases scale, brightness, and motion slightly. Non-focused categories remain present but quieter. No category fully disappears, maintaining spatial orientation.

---

## 4. Introduce a three-level category reveal: Collapsed → Peek → Studio

### 1. How we will do this
First state: parent only. First tap: Peek shows up to three highest-relevance child nodes. Second deliberate action—tap again or press Open Studio—navigates to the full category world. This replaces instant deep navigation.

### 2. Expected effects and potential unwanted effects
Expected: users can inspect without committing to a new screen. Potential downside: a two-step interaction may feel slower to experienced users.

### 3. Countermeasures
Allow a visible Open Studio button during Peek, support double-tap/second-tap choreography for experienced users, and keep direct links from Details. Preference could later allow “single tap opens studio” for power users.

### 4. Functional integration
The interaction controller maintains category reveal state and timestamp. The existing spatial choreography triggers only from Peek or explicit Open Studio.

### 5. Visual integration
Peek uses small satellites and a stronger parent flow. Studio transition grows the same parent object into the next page, preserving continuity.

---

## 5. Replace persistent explanations with compact semantic signals

### 1. How we will do this
Convert sentences into short state language: “On pace,” “Needs $42,” “3 days left,” “Hot pace,” “Goal 62%.” Full explanations move behind an info affordance or deeper page.

### 2. Expected effects and potential unwanted effects
Expected: faster scanning and fewer competing text blocks. Potential downside: shorthand can be ambiguous or feel overly abstract.

### 3. Countermeasures
Every semantic signal must have an explainable definition accessible in one tap. Avoid jargon. Use plain labels and never rely on internal scoring language without explanation.

### 4. Functional integration
Signals derive from existing calculation functions. Add a signal-definition registry so each displayed state maps to a human-readable explanation and data provenance.

### 5. Visual integration
Signals appear as small text + symbol combinations. Color supports the meaning but never carries it alone. Example: amber dot + “Needs $42,” not amber alone.

---

## 6. Collapse the source/import indicator into a compact status icon

### 1. How we will do this
Replace full “Plan source / Imported data” copy with a small data-source icon in the header. Default state is quiet. If reconciliation is needed, show a numeric badge such as “2.”

### 2. Expected effects and potential unwanted effects
Expected: reduced Home height and less technical language. Potential downside: users may forget imported data exists or miss a sync/reconciliation issue.

### 3. Countermeasures
Use badge counts only for actionable items. On tap, open Connected Data Center with a clear summary. For important failures, temporarily surface a one-line action pill.

### 4. Functional integration
The source icon reads `connectedDataSummary()`. Badge count equals unreconciled posted outflows or provider errors when direct sync is eventually available.

### 5. Visual integration
Icon uses neutral aqua when idle, amber badge for review, red only for actual data failure. It should never compete visually with Available Now.

---

## 7. Integrate the Week Arc into the center orb

### 1. How we will do this
The existing week-progress ring becomes part of the Available Now orb instead of a separate label. Default display shows only a thin progress arc and tiny remaining-days marker. Exact percentage appears on center tap.

### 2. Expected effects and potential unwanted effects
Expected: preserves time awareness with much less text. Potential downside: users may not immediately understand the arc.

### 3. Countermeasures
Use a small “4d” marker and accessible label. One-time onboarding can explain the ring. Details and Insights continue to show exact week elapsed.

### 4. Functional integration
Continue using `weekTimeState()`. The center orb receives percentage via CSS custom property and accessible text.

### 5. Visual integration
The ring shares the center orb’s geometry and color language rather than appearing as an extra widget. It should look structural, not decorative.

---

## 8. Make money-flow animation contextual instead of uniformly prominent

### 1. How we will do this
Idle state uses low-opacity slow streams. Focused category increases line brightness and packet frequency. Recorded transactions, bill funding, savings updates, and reconciliation trigger short event animations lasting roughly one to two seconds.

### 2. Expected effects and potential unwanted effects
Expected: animation becomes informative rather than distracting. Potential downside: reduced idle motion may make the app feel less “alive.”

### 3. Countermeasures
Maintain subtle ambient breathing, orbit motion, and low-frequency particles. Reserve high-energy motion for actual interaction or financial state change.

### 4. Functional integration
Create an event-animation dispatcher: `purchase`, `billProtected`, `savingsAdded`, `reconciled`, `weekReset`. UI actions dispatch temporary scene events without changing calculation logic.

### 5. Visual integration
Each event inherits its category motion language. Bills locks inward, Essentials pulses steadily, Lifestyle ripples, Savings rises/facets.

---

## 9. Formalize an Ambient → Active → Confirmation animation hierarchy

### 1. How we will do this
Define three motion intensities. Ambient is slow and nearly ignorable. Active is interaction-driven. Confirmation is brief and explicit after a completed action. Motion preferences scale each tier independently.

### 2. Expected effects and potential unwanted effects
Expected: premium feel with better attention control. Potential downside: too many motion rules can create implementation inconsistency.

### 3. Countermeasures
Centralize timing tokens and reusable animation utilities. No page-specific arbitrary durations unless documented. Reduced Motion must disable all nonessential motion globally.

### 4. Functional integration
Use shared CSS variables and small JS helpers for category focus, route choreography, and action confirmation. The state model remains untouched.

### 5. Visual integration
The same motion grammar applies across Home, Studios, Details, Plan, History, and Connected Data, reinforcing brand consistency.

---

## 10. Convert Next Suggested Step into a compact command pill

### 1. How we will do this
Replace the large next-step card with one floating/action pill, e.g. “⚠ Protect $42 Utilities →” or “✓ No urgent action.” Tapping it opens a bottom sheet with explanation and action buttons.

### 2. Expected effects and potential unwanted effects
Expected: significant vertical-space savings and stronger prioritization. Potential downside: important reasoning becomes less visible.

### 3. Countermeasures
Keep the pill persistent and unmistakable. Use concise text with explicit amount/action when relevant. Bottom sheet must explain why the recommendation exists and what data it uses.

### 4. Functional integration
Reuse `simpleDecision()` as the single recommendation engine. The pill is only a compact renderer. The sheet displays the same recommendation object plus explanation metadata.

### 5. Visual integration
The pill sits below or slightly overlaps the main scene. It uses the attention state color only when action is needed; otherwise it remains neutral.

---

## 11. Use bottom sheets for secondary information

### 1. How we will do this
Subcategory taps open a draggable bottom sheet rather than navigating immediately. The sheet shows one lane’s amount, pace/runway, state, and one Open Studio action.

### 2. Expected effects and potential unwanted effects
Expected: preserves context, supports one-handed mobile use, reduces navigation churn. Potential downside: bottom sheets can become nested or overly tall.

### 3. Countermeasures
Never open a sheet from another sheet. Maximum sheet height should be controlled. Deep actions navigate to a full studio instead of stacking more sheet layers.

### 4. Functional integration
Add a shared sheet controller with route-independent content templates. Category nodes pass a small data object to the sheet.

### 5. Visual integration
The sheet uses a translucent surface and parent-category accent. The Home scene remains visible and slightly dimmed behind it, preserving orientation.

---

## 12. Add a universal More control instead of multiple permanent buttons

### 1. How we will do this
Focused categories expose one `•••` menu. It contains actions such as View Studio, Explain, Edit Lane, Pre-check Purchase, and History. Unfocused categories show no extra buttons.

### 2. Expected effects and potential unwanted effects
Expected: fewer visible controls and stronger visual calm. Potential downside: discoverability decreases for secondary features.

### 3. Countermeasures
Order actions by likely use, use plain labels, and expose frequently used actions elsewhere where appropriate. Do not hide the primary next action behind More.

### 4. Functional integration
Create a context-menu action registry keyed by category/world. The menu dispatches to existing routes or tools.

### 5. Visual integration
The More control appears only during focus and uses a low-contrast glass button. It should not create another permanent visual layer.

---

## 13. Let attention temporarily override density

### 1. How we will do this
If a specific child requires immediate action, Home may automatically reveal that one child even in Compact mode. Example: Bills parent plus “Utilities · $42 needed.” Other children remain hidden.

### 2. Expected effects and potential unwanted effects
Expected: important information is not buried by the compact design. Potential downside: Home may unexpectedly change shape.

### 3. Countermeasures
Use restrained expansion, animate gently, and make the reason obvious. Auto-expanded attention nodes collapse when the condition resolves. Never auto-expand more than one child per parent.

### 4. Functional integration
Priority ranking gets an `attentionOverride` flag. Density logic always reserves one slot for the highest actionable item.

### 5. Visual integration
Attention child receives a clear label and subtle amber treatment. The parent remains visually dominant.

---

## 14. Make Focused Compact the default display mode

### 1. How we will do this
Change default density preference from Balanced to Focused Compact. Rich remains available. Cinematic controls motion only, not information amount.

### 2. Expected effects and potential unwanted effects
Expected: new users see a simpler product. Potential downside: existing users accustomed to more information may feel the redesign removed detail.

### 3. Countermeasures
Preserve existing user preference if already set. Only new installs/default state use Focused Compact. Offer a clear “More detail” preference in settings.

### 4. Functional integration
Update preference defaults while preserving stored settings. Separate `motion` and `density` state fully.

### 5. Visual integration
Compact is the visual baseline used in screenshots, onboarding, and testing. Rich becomes an enhancement, not the design target.

---

## 15. Add Zen Home mode

### 1. How we will do this
Zen Home displays only Available Now, four parent emblems/amounts, one status/command pill, and navigation. Ambient child dots remain unlabeled. Category focus temporarily reveals more.

### 2. Expected effects and potential unwanted effects
Expected: extremely fast comprehension and premium calm. Potential downside: experienced users may want more persistent detail.

### 3. Countermeasures
Make Zen the compact/default presentation, with Rich mode for users who prefer more. Preserve direct access to Details and Studios.

### 4. Functional integration
Zen is a renderer mode over the same data model. No data or calculation path changes.

### 5. Visual integration
Zen emphasizes empty space, strong central scale, and subtle orbital motion. It becomes the visual “resting state” of the app.

---

## 16. Auto-collapse after interaction

### 1. How we will do this
After category Peek, if no interaction occurs for a configurable period such as 8–12 seconds, the scene returns to Zen state. Active bottom sheets or unsaved forms suspend auto-collapse.

### 2. Expected effects and potential unwanted effects
Expected: Home naturally returns to a clean baseline. Potential downside: content could collapse while the user is still reading.

### 3. Countermeasures
Reset the timer on pointer/touch/scroll activity. Do not auto-collapse while accessibility focus is inside the expanded region. Respect Reduced Motion and potentially longer timeouts for larger text settings.

### 4. Functional integration
The Home interaction controller owns one inactivity timer. Deep routes are unaffected.

### 5. Visual integration
Collapse should be gentle and reversible, not abrupt. Children fade/orbit inward while the parent returns to resting prominence.

---

## 17. Use visual hierarchy instead of card hierarchy

### 1. How we will do this
Reduce container count. Replace stacked panels with spacing, typography, shared surfaces, dividers, depth, glow, and local focus. Cards remain only where they represent a genuine object or action group.

### 2. Expected effects and potential unwanted effects
Expected: more cohesive, premium, less “dashboard-template” feel. Potential downside: boundaries between information groups may become unclear.

### 3. Countermeasures
Use consistent spacing tokens, headings, alignment grids, and subtle separators. Test comprehension without color. Cards remain for forms, confirmation, and data requiring clear containment.

### 4. Functional integration
Mostly presentation-layer refactor. Components keep semantic wrappers and accessible landmarks even if visible card chrome is reduced.

### 5. Visual integration
The app reads as one financial instrument with zones and layers, not a pile of rectangles.

---

## 18. Eliminate duplicated numbers

### 1. How we will do this
Define one dominant location for each important number per screen. Available Now should not repeat in multiple Home blocks. Category totals should appear once in their parent node. Child sheets/studios may repeat values only when context changes.

### 2. Expected effects and potential unwanted effects
Expected: less cognitive noise and fewer opportunities for inconsistent rendering. Potential downside: some users may need to look slightly farther to recall a number.

### 3. Countermeasures
Keep dominant amounts anchored consistently. Sticky headers in studios may repeat only the primary studio total. Build a UI audit test for duplicate financial values.

### 4. Functional integration
Create view-model objects that designate `primaryAmount`, `secondaryAmounts`, and allowed placements. Rendering components consume those roles.

### 5. Visual integration
Numbers regain significance through scale and scarcity. Large typography is reserved for the actual decision value, not every subtotal.

---

## 19. Make Details the explicit expansion hub

### 1. How we will do this
Details becomes the structured directory for Bill Studio, Essentials Runway, Lifestyle Flex, Savings Goals, Pre-check, Connected Data, History, Scenario, Insights, and Preferences. Home points; Details organizes; Studios specialize.

### 2. Expected effects and potential unwanted effects
Expected: clearer information architecture and a predictable place to find advanced capabilities. Potential downside: Details could become crowded.

### 3. Countermeasures
Group tools into a small number of sections: Current Week, Planning Tools, Data & History, Settings. Use progressive accordions and search if the tool count grows further.

### 4. Functional integration
Routes remain independent. Details serves as a navigation index and summary, not a duplicate implementation of each tool.

### 5. Visual integration
Details can be denser than Home but should still use category color families and recognizable studio emblems. It is the “map of the system.”

---

## 20. Perform a dedicated 390px iPhone compression and safety pass

### 1. How we will do this
Design and test specifically around 390px-class iPhone width and Safari’s dynamic browser chrome. Verify safe-area insets, bottom-nav clearance, thumb target sizes, no horizontal overflow, one expanded layer maximum, text scaling, reduced motion, and keyboard/form behavior.

### 2. Expected effects and potential unwanted effects
Expected: significantly better real-device usability and fewer layout surprises. Potential downside: optimizing too aggressively for one width can degrade larger devices.

### 3. Countermeasures
Use 390px as the stress-test baseline, not a hard-coded layout. Build fluid breakpoints and container-based scaling. Test at ~320, 375, 390, 430, tablet, and desktop widths.

### 4. Functional integration
No financial logic changes. Add viewport-specific layout rules, safe-area handling, and interaction QA. Forms should preserve state when the software keyboard changes viewport height.

### 5. Visual integration
The compact mobile version is the canonical visual design. Larger screens expand spacing and constellation richness rather than inventing a separate desktop product.

---

# System-wide implementation standards

## Decision hierarchy
Every screen should answer one primary question. Home: “What can I use and what needs attention?” Bills: “What needs protection next?” Essentials: “Will my needs last the week?” Lifestyle: “How much flexible room remains?” Savings: “Where is savings going?” Data Center: “What outside activity needs reconciliation?”

## Trust hierarchy
Every financial number must have a clear source: plan-derived, manually entered, imported, pending, reconciled, or future provider-connected. The visual system should encode provenance without forcing the user to read technical documentation.

## Control hierarchy
No imported transaction changes the weekly model without confirmation. No scenario changes the live plan. No deep animation removes conventional navigation. No personalization setting changes financial math.

## Accessibility hierarchy
All states require textual equivalents. Color is supplementary. Touch targets must remain comfortably tappable. Reduced Motion must preserve full functionality. Larger text must not force horizontal scrolling.

## Mobile hierarchy
Primary actions sit within thumb-friendly lower regions. Secondary information uses bottom sheets. Long forms are broken into sections. The user should never need precision tapping on tiny animated nodes.

## Error hierarchy
Prevent errors before they happen, explain recoverable problems in place, confirm financially meaningful mutations, and preserve undo/rollback paths where practical.

## Performance hierarchy
Ambient animation should be GPU-friendly and limited in count. Pause expensive motion when the tab is backgrounded or the scene is not visible. Prefer CSS transforms/opacity over layout-thrashing animations.

## Privacy hierarchy
Local-only data should be clearly labeled. Connected-data imports remain on-device in the current static architecture. Future direct bank sync must use a provider/backend architecture rather than embedding credentials in the client.

---

# Recommended build sequence

**Phase A — Compact Home**
Implement items 1, 2, 3, 5, 7, 10, 14, 15, and 18 first. This produces the largest immediate reduction in complexity.

**Phase B — Controlled reveal**
Implement 4, 11, 12, 13, and 16. This adds progressive disclosure without losing capability.

**Phase C — Motion discipline**
Implement 8, 9, and 17. This turns animation into semantic feedback rather than constant decoration.

**Phase D — Architecture cleanup**
Implement 6 and 19, then complete item 20 as the mobile QA gate before further feature growth.

The acceptance criterion for the redesign should be simple: **a new user should understand Home in under a few seconds, while an experienced user should still be able to reach any advanced tool in no more than two deliberate interactions.**
