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
This first pass changes HTML, CSS and the static SVG header mark, not financial runtime scripts, authentication implementation, API calls, local storage schema, weekly reset rules, money operation modes or service-worker code. CSP script hashes remain unchanged.

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
