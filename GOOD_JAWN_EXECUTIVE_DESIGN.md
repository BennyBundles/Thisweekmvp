# THIS WEEK — GOOD JAWN FINANCIAL EXECUTIVE SHELL

**Status:** Review-only design branch, not production. **Budget:** $0 incremental.

## Identity
- Product: THIS WEEK. Its primary identity is a seven-day W, expressed in a compact vector header mark.
- Endorsement: Good Jawn Financial. TAGJ Financial is the broader brand relationship, not a claim of regulated bank status.
- Campaign phrase: Good Jawn, Good Money.
- Core promise: planning clarity, financial control, privacy and informed decisions. Never imply that a planning balance is a custodial bank balance.

## Visual system
- Obsidian #071115, deep navy #0d2029, ivory #f1f0e9, champagne gold #d4b781, emerald #65caa4.
- Four atmosphere families: Vault (bills/cards/payment boundaries); Observatory (insights/scenarios/performance); Capital (spending/transactions/history/money layer); Ledger (savings/essentials/weekly setup).
- CSS gradients and hairlines; no external font assets, additional JavaScript libraries, or paid graphics.
- Existing Presentation Preferences control cinematic, dynamic and reduced-motion modes. System reduced motion also takes precedence.
- iPhone Safari first with safe-area navigation, visible keyboard focus, minimum touch affordances. Desktop gets a wider shell.

## Route and functionality preservation
Primary nav keeps Home (#home), Add Spend (#log), Explore (the original #details route), and Plan (#setup).
The third link's name changes from Details to Explore, but its route and functionality do not change.

Existing focused pages remain: bills, essentials, lifestyle, savings, precheck, weekly reset, history, scenario sandbox, connections/imports, insights, money center, direct deposit, bill pay, cards, presentation preferences, architecture, QA, performance, data model, privacy, analytics, account center, support, operations, release certification, staff bootstrap, money sandbox, preview and sandbox legal disclosures.

Advanced tools and integrations are collapsed inside Explore. This is only a visual disclosure, never an authorization control; current server and identity gates remain in force.

## Implementation safety
The first design pass changed HTML, CSS, and the header SVG without touching runtime logic. Subsequent UX integration adds only navigation markup to the Explore render template and read-only contextual-navigation rendering. Current work adds four inline SVG visual environments and expanded presentation CSS. The financial calculation and state-management functions, authentication code, storage schemas, API boundaries, money execution guards, and service-worker implementation have not been changed. Release staging safely recalculates the CSP script hashes for modified inline markup.

## Required verification before release
1. Existing GitHub Actions regression, stage-building and CSP checks.
2. Physical iPhone Safari (~390 px): tap, scroll, keyboard, focus and safe-area behavior.
3. Every primary/studio route, Back/Forward, loading/error/empty states.
4. Synthetic financial Plan data after refresh, backup/restore, offline upgrade and cross-tab conflict.
5. Staff and sandbox interfaces have unchanged semantics and do not enable provider actions.
6. Separate authorization for hosted preview, production merge, or financial integration.
7. Legal review for trademark and any regulated-finance brand language.

## Deferred
Full page-specific content redesign and custom rendered environments, real-device visual regression and hosted CDN verification remain incomplete. The first pass is a shared shell and progressive disclosure layer, not a claim that all interaction redesign work is finished.

## Cinematic implementation — Passes 3 and 4 (November 4, 2026)

This is now integrated into the **actual existing `index.html`**, rather than only an independently generated visual mockup.

### Four original, functional environments
- **The Vault:** detailed inline SVG with repeated gilded deposit boxes, perspective beams, a central metallic vault door and concentric lock mechanism. The Bills and guarded money/card pages share this visual family.
- **The Observatory:** midnight-violet nebula, stellar pattern, metallic orbit lines and decorative luminous trajectories. Used for analytics, insights, scenarios, architecture and diagnostic pages.
- **The Capital:** perspective architecture, neon teal/cyan information flow and futuristic tower pattern. Used for the weekly financial overview, spending, precheck, history, imports and lifestyle.
- **The Ledger:** green glass-arched garden architecture, golden sunlight, plants and water-like flowing light. Used for savings, essentials, plan setup and planning preferences.

Each environment is embedded within the HTML as **accessible decorative vector art**, with no network image dependency and no change to the existing PWA cache asset manifest. The common full-width stage adapts by the existing `body[data-view]` route attribute; route changes crossfade the relevant scene.

### Connected navigation, not inaccessible artwork
- The Explore screen now contains four working destination cards: **Vault → Bills**, **Observatory → Insights**, **Capital → Purchase Precheck**, **Ledger → Savings**. They use existing hash routes and preserve browser history.
- Primary bottom navigation remains **Home / Add Spend / Explore / Plan**, now with purpose-built SVG tab icons.
- Existing task-first controls and optional Advanced Tools remain intact. The visual environments do not create separate financial accounts or alter balances.
- Good Jawn Financial/TAGJ endorsement, the seven-day This Week W, GJ editorial crest and the phrase **“Good Jawn, Good Money”** appear in the real application shell.

### Usability and visual direction
- Raised readability on the previously very small Settings, Studio and Explore headings, descriptions and navigation controls.
- At iPhone-like widths, Studio metrics shift into two columns and the tool directory uses one full-width item per row where useful.
- Consistent 42–44 px touch targets on key actions, improved focus contrast and tabular financial numerals.
- Motion remains ornamental only: slow line sweeps and ambient flow can be suppressed by system reduced-motion or the existing Presentation preferences. The UI remains usable without animations.
- Premium material hierarchy: warm gilded edge trims, platinum/ivory values, deep navy/obsidian materials and deep green foundations; blue/violet only in analytical environments.

### Release and testing
- **Current reviewed source head at Pass 4:** `b1d4f4d1ca75a43a7a7d55f8617b317c7d3192b1`.
- **GitHub Actions run 602:** 310/310 automated Node tests passed; CSP staging, public-preview worker, artifact byte parity, release smoke, Money Lab, Account, Ops and Support checks passed; `deploy=skipped`.
- No production merge, no Vercel hosted preview and no approval to move money. Production main remains unchanged as of this pass.
- Source/CI success **does not** establish photo-realism, exact visual match to illustrative concept boards, a browser-rendered screenshot, physical iPhone Safari acceptance, or that all workflows have been visually exercised. Those require independent device-level review and, if approved, one free hosted preview.

### Follow-on engineering
1. Visual device QA on 390px Safari with synthetic data, including scroll, keyboard, reduced motion, safe-area, long amounts and landscape.
2. Review real source-rendered captures for all major routes and refine scene fidelity (especially vaulted architecture and natural Ledger space) rather than adding more unrelated decoration.
3. Test offline launch/upgrade and existing Plan backup/restore with the new inline scene bytes.
4. Keep the consolidated draft PR review-only and reconcile with canonical PR #29 before any separate authorization to merge.
