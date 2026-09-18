# This Week — Next Expansion Roadmap

Current live source baseline: `231da5df998f270693feb0967055e36c78d4e61d`

## Product principle

Home should remain a simple decision surface even as the product becomes visually and functionally deep. The visual system should move from **one obvious weekly answer** into **progressively deeper layers** only when the user asks for them:

Home → Category → Sub-category → Tool → Advanced analysis → Planning.

The animated financial environment should never require users to understand the animation before they can understand their money.

---

## 1. Category worlds instead of category cards

Turn Bills, Essentials, Lifestyle, and Savings into four distinct visual “worlds” with their own motion grammar, icon family, surface texture, interaction style, and functional vocabulary.

### Bills world
- Sapphire / cyan / steel palette.
- Shield, vault, lock, calendar, due-date, and protection motifs.
- Motion should feel measured and mechanical: controlled scanning, locking rings, filling protection shields.
- Subcategories become protected obligation nodes.
- Each bill can show funding status, due timing, required-by-today amount, and remaining protection.
- A bill behind target should pulse with a controlled amber warning rather than a generic red error.

### Essentials world
- Emerald / jade / aqua palette.
- Basket, fuel, transit, household, food, and needs motifs.
- Motion should feel organic and steady: breathing rings, soft upward pulses, stable flow.
- Each need can show remaining runway, daily pace, and estimated coverage.
- Optional future feature: “days of runway” rather than only dollars remaining.

### Lifestyle world
- Magenta / violet / rose palette.
- Spark, entertainment, dining, shopping, experience, and flex motifs.
- Motion can be more expressive and fluid but still controlled.
- Each flexible lane can support soft caps, pause controls, pace warnings, and “do I have room for this?” checks.
- Useful concept: a “flex temperature” indicator that describes spending pace without sounding punitive.

### Savings world
- Champagne gold / jade / warm teal palette.
- Gem, reserve, milestone, shield, target, and growth motifs.
- Motion should feel upward and reinforcing: rising light, faceted reflections, slow progress-ring accumulation.
- Savings can expand from one weekly amount into purpose-specific goals such as emergency reserve, sinking funds, payoff, and future purchases.
- The visual should emphasize progress rather than scarcity.

---

## 2. True sub-category constellations

Every major category should have a persistent mini-constellation.

Each sub-category gets:
- a unique micro-emblem;
- a miniature progress ring;
- a tiny amount or status label;
- a subtle category-specific animation;
- one lightweight semantic signal such as “on pace,” “watch,” or “protected.”

Sub-nodes should remain less interactive than the parent category. The parent is the navigation target; sub-nodes are primarily ambient information. A long press or secondary tap can expose additional detail without turning the Home screen into a control panel.

The mini constellations should smoothly rearrange as categories are added or removed. Rather than hard-coding three children, use a layout algorithm:
- 1–2 children: balanced arc;
- 3 children: triangular constellation;
- 4 children: compact diamond;
- 5+ children: show top three plus “+N more.”

---

## 3. Reactive money-flow engine

Upgrade the animated money particles from decoration into semantic communication.

Possible behavior:
- New income enters through a “source gate” at the top of the scene.
- Protected bill money flows first toward Bills.
- Savings allocation branches next.
- Remaining planned spending divides between Essentials and Lifestyle.
- Logged transactions briefly animate out of the relevant category.
- A new bill contribution visibly travels from Available to Bills.
- A savings contribution travels from Available to Savings.
- A week reset pulls the scene inward, clears the prior cycle, then re-expands into the new week.

Use particle thickness, speed, brightness, and frequency carefully:
- more money should not simply mean more particles;
- particles should communicate state changes, not distract continuously;
- idle animation should be calm;
- action animation can be more pronounced for 1–2 seconds.

---

## 4. Scene choreography and page transitions

Create a navigation choreography system where the Home scene becomes the transition source for deeper pages.

Examples:
- Tap Bills → the Bills node expands toward the camera and becomes the Bills detail header.
- Tap Essentials → emerald flow line widens into the Essentials page background.
- Tap Savings → the savings gem rotates and resolves into a savings progress view.
- Tap Details → the four category worlds pull apart into the detailed anatomy view.
- Tap Home → all layers collapse back into the central constellation.

This is more coherent than a conventional slide/fade transition because the user visually understands where the deeper page came from.

Transitions should be interruptible and kept under roughly 400–600 ms for normal navigation.

---

## 5. Contextual command ribbon

Add a small command ribbon below the Home scene that changes according to the current state.

Possible commands:
- “Protect $42 for Utilities”
- “Dining is moving fast — review”
- “You have room for flexible spending”
- “Week ends tomorrow — review rollover”
- “Savings target reached”

The command ribbon should have exactly one primary recommendation and at most one secondary option.

This is where intelligence belongs on Home; not in multiple charts.

---

## 6. Purchase pre-check / “Can I spend this?” mode

Add a high-value lightweight tool that users can open from Home or Lifestyle.

User enters:
- amount;
- optional category.

The app returns:
- whether the purchase fits inside current available money;
- which category it would affect;
- what would remain afterward;
- whether any protected bill/savings target would be indirectly pressured.

The interaction could animate a ghost transaction through the visual system before the user actually logs it.

Important wording:
- planning guidance, not financial advice;
- do not imply connection to live bank balances unless actual integrations exist.

---

## 7. Time dimension

Money should not only be represented spatially; add time-aware behavior.

### Week arc
A subtle arc around the central orb shows where the user is in the weekly cycle.

### Due-date gravity
Bills closer to due date slowly become visually heavier / more prominent.

### Pace trails
Essential and Lifestyle sub-nodes can show a tiny trail representing whether spending is slower or faster than elapsed time.

### Rollover animation
At the end of the week, old flows fade into a historical ring and a clean new system appears.

This turns the visualization into a weekly “living clock” rather than a static budget.

---

## 8. Financial history as visual memory

Create a History page that preserves the visual language of the current Home.

Ideas:
- week cards arranged on a timeline;
- each week represented by four colored category proportions;
- a small stability marker;
- savings streak;
- number of attention events;
- bills protected on time.

Selecting a week opens a replayable summary:
- income entered;
- money allocated;
- spending events;
- savings contribution;
- week close.

Avoid gamifying financial hardship. Celebrate useful habits without shaming difficult weeks.

---

## 9. Personalization engine

Let the interface learn presentation preferences without changing financial calculations.

User-selectable visual profiles:
- Calm / minimal;
- Dynamic;
- Cinematic;
- High contrast;
- Reduced motion.

Potential automatic adaptation:
- lower motion when the user repeatedly skips animations;
- larger labels if accessibility text size is large;
- less visual density on smaller screens;
- richer scene on desktop/tablet;
- simplified child nodes if more than four lanes exist.

The data model remains constant; only presentation changes.

---

## 10. Smart category logos

Build a coherent icon-generation system rather than manually choosing unrelated icons.

Rules:
- one geometric construction grid;
- same stroke weight;
- same corner radius;
- same interior negative-space logic;
- category colors come from parent palette;
- sub-category symbols inherit the parent visual language.

Examples:
- Grocery → basket/leaf;
- Gas → droplet/gauge;
- Transit → route/arrow;
- Dining → plate/spark;
- Entertainment → ticket/wave;
- Shopping → bag/tag;
- Rent → house/shield;
- Utilities → bolt/water;
- Phone → device/signal;
- Emergency savings → shield/gem;
- Sinking fund → bucket/target;
- Payoff → descending balance/chain-break.

The icon family can become a recognizable brand asset.

---

## 11. Touch, gesture, and haptics

Expand interaction beyond taps while keeping everything discoverable.

Possible gestures:
- tap category → focus;
- tap focused category again → open detail;
- long press → quick summary;
- horizontal swipe on subcategory rail → cycle children;
- swipe down from detail → collapse back to Home;
- drag amount chip during planning → preview reallocation.

Use haptics sparingly:
- light tick when changing category focus;
- stronger confirmation after logging spending;
- distinct confirmation after week rollover;
- no repetitive vibration during animations.

Every gesture must also have an ordinary visible button equivalent.

---

## 12. Planning studio

Turn Plan into a separate, richer “planning studio” rather than a long form.

Potential architecture:
- Income source at top;
- protected obligations below;
- savings;
- essential spending;
- flexible spending;
- unallocated remainder.

As users change amounts, lines physically redraw in real time.

Add:
- drag-to-reorder categories;
- duplicate category;
- disable without deleting;
- change weekly limit;
- preview before saving;
- restore previous plan.

A “what changed?” summary should appear before confirming major edits.

---

## 13. Bill protection studio

A dedicated Bills page could become one of the strongest differentiators.

Features:
- timeline of due dates;
- protected amount;
- required-by-today amount;
- weekly contribution;
- progress toward upcoming due date;
- recurring frequency;
- “fund next” recommendation;
- optional autoplan rule editor.

Visual concept:
Each bill is a shield segment around a central protected-money vault. As funding increases, the shield closes.

---

## 14. Savings goal studio

Move beyond one generic savings line.

Potential goal types:
- emergency reserve;
- upcoming expense;
- annual/quarterly bills;
- debt payoff;
- purchase goal;
- custom.

Each goal can have:
- target amount;
- current saved amount;
- optional deadline;
- weekly suggested contribution;
- pause/resume;
- priority;
- visual emblem.

The savings world can display a rotating faceted core where each face represents a goal.

---

## 15. Intelligent alerts without notification overload

Create a hierarchy:

### Critical
- negative available amount;
- bill significantly behind required-by-today amount;
- week rollover issue.

### Important
- category overspent;
- spending pace substantially above elapsed-time pace;
- savings target missed.

### Informational
- savings target reached;
- category under pace;
- week summary ready.

Home shows only the single most important alert.
Details can show the rest.

Future push notifications should be opt-in and should avoid moralizing language.

---

## 16. “Explain this” mode

Every algorithmic signal should be explainable.

Tap:
- Stable;
- Watch;
- Fast pace;
- Protected;
- Available.

The app opens a small explanation:
- what inputs were used;
- what threshold caused the state;
- what the signal does not mean.

This is especially important if more advanced forecasting is added later.

---

## 17. Scenario sandbox

A deeper planning tool for temporary “what if” questions.

Examples:
- What if pay is $200 lower?
- What if rent increases?
- What if I add a $75 weekly payment?
- What if I raise savings to $100/week?
- What if I cut dining by $40?

The live dashboard should not change until the user explicitly applies a scenario.

Visual concept:
The current plan stays solid; the scenario appears as a translucent parallel flow system.

---

## 18. Connected financial data — later phase

If bank/account integrations are eventually added, keep the distinction between:
- account balance;
- cleared/posted transactions;
- pending transactions;
- This Week planned available amount.

Do not replace the existing planning model with raw account balance.

A connected-data layer could:
- suggest transaction matches;
- import purchases into categories;
- identify recurring bills;
- reconcile pay deposits;
- flag differences between planned and actual cash.

This should only be introduced after the offline/local planning model is stable.

---

## 19. Dynamic visual density algorithm

The current four-category constellation works well with a small number of lanes, but the system needs a density controller.

Suggested rules:
- Home shows a maximum of three subnodes per parent.
- Remaining children appear as “+N”.
- Focused category can temporarily expand to five.
- Details page shows all.
- Very small screens replace mini labels with emblem + amount only.
- Reduced-motion mode removes floating paths and particle travel.
- Low-power mode reduces continuous animation.

This prevents future feature growth from recreating the original Home-page clutter.

---

## 20. Brand motion language

Establish a formal motion design system.

### Motion tiers
- Ambient: 8–30 second cycles, low contrast.
- Informational: 2–5 second cycles, visible but calm.
- Interactive: 180–450 ms.
- Confirmation: 350–800 ms.
- Navigation choreography: 350–600 ms.

### Motion personality by category
- Bills: precise, mechanical, locking.
- Essentials: stable, organic, breathing.
- Lifestyle: expressive, flowing, shimmering.
- Savings: upward, faceted, accumulating.

This gives the product a recognizable visual identity rather than arbitrary animation.

---

## Recommended implementation order

1. Stabilize the v10 four-category Home on iPhone widths.
2. Add persistent dynamic subcategory constellations using real user categories.
3. Add navigation choreography from Home categories to detail pages.
4. Upgrade Details into category-specific worlds.
5. Build the Bill Protection Studio.
6. Build the Savings Goal Studio.
7. Add purchase pre-check.
8. Add time-aware weekly arc and due-date gravity.
9. Build History / weekly visual memory.
10. Add scenario sandbox.
11. Add presentation personalization / motion profiles.
12. Only then consider connected-bank ingestion.

The priority should remain: **clarity first, visual intelligence second, complexity only on demand.**
