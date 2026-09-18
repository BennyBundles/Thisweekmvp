# Phase 0 — Regression & Smoke-Test Checklist

Use this checklist before and after every Phase 1/2 production change.

## A. Startup and persistence

- [ ] Fresh browser with no state opens a usable setup/onboarding path.
- [ ] Existing localStorage state opens without a blank or partially rendered Home.
- [ ] Refresh preserves the current plan and week.
- [ ] UI preferences persist after refresh.
- [ ] Imported Connected Data persists after refresh.
- [ ] Savings goals persist after refresh.
- [ ] No browser console exception occurs on startup.

## B. Home

- [ ] Available Now renders a numeric amount.
- [ ] Bills renders.
- [ ] Essentials renders.
- [ ] Lifestyle renders.
- [ ] Savings renders.
- [ ] Week timing renders without invalid dates.
- [ ] One recommendation/attention state renders.
- [ ] Category focus works.
- [ ] Category-to-studio choreography does not trap navigation.
- [ ] Bottom navigation remains usable even when scene interaction fails.
- [ ] Reduced Motion preserves category navigation.

## C. Add Spend

- [ ] Route opens.
- [ ] Categories populate.
- [ ] Valid amount can be entered.
- [ ] Transaction saves.
- [ ] Home/category remaining value updates afterward.
- [ ] Invalid/zero amount is rejected.
- [ ] Overspending behavior is intentional and clearly communicated.

## D. Bill Protection Studio

- [ ] Route opens.
- [ ] Bills render.
- [ ] Required-by-today values render.
- [ ] Weekly target values render.
- [ ] Mark Protected accepts a valid amount.
- [ ] Bill status updates after contribution.
- [ ] Home recommendation updates when bill attention resolves.

## E. Essentials Runway

- [ ] Route opens.
- [ ] Essential categories render.
- [ ] Remaining amount is correct.
- [ ] Daily runway calculation does not divide by zero.
- [ ] Can I Spend This? link works.

## F. Lifestyle Flex

- [ ] Route opens.
- [ ] Flexible categories render.
- [ ] Calm / Active / Hot state renders.
- [ ] Elapsed-week percentage is valid.
- [ ] Pre-check link works.

## G. Savings Goals

- [ ] Route opens.
- [ ] Goal cards render.
- [ ] Adding progress updates only the selected goal.
- [ ] Refresh preserves goal progress.
- [ ] Goal values are visually labeled as planning goals, not bank balances.

## H. Can I Spend This?

- [ ] Route opens.
- [ ] Category selector populates.
- [ ] Purchase amount changes projected category remainder.
- [ ] Purchase amount changes projected Available Now.
- [ ] Simulation does not save a transaction.
- [ ] Link to Add Spend works.

## I. Connected Data

- [ ] Route opens.
- [ ] Demo import works.
- [ ] CSV import parses a basic file.
- [ ] Pending transactions are not applied.
- [ ] Inflows are not silently converted into Available Now.
- [ ] Posted outflow can be assigned to a category.
- [ ] Reconcile applies transaction once.
- [ ] Duplicate external ID does not apply twice.
- [ ] Clear imported data works.
- [ ] Planner and imported actuality remain visually distinct.

## J. History

- [ ] Route opens.
- [ ] Current/previous weeks render when available.
- [ ] No invalid/NaN amounts appear.
- [ ] History does not mutate current week.

## K. Scenario Sandbox

- [ ] Route opens.
- [ ] Inputs change scenario output.
- [ ] Scenario changes do not mutate current plan.
- [ ] Leaving/reloading restores live plan unchanged.

## L. Insights

- [ ] Route opens.
- [ ] Health signal renders.
- [ ] Spending pace renders.
- [ ] Flow visualization renders.
- [ ] Bill runway renders.
- [ ] Explanation text is available.

## M. Presentation Settings

- [ ] Compact mode applies.
- [ ] Balanced mode applies.
- [ ] Rich mode applies.
- [ ] Calm motion applies.
- [ ] Dynamic motion applies.
- [ ] Cinematic motion applies.
- [ ] Reduced Motion retains all navigation/actions.
- [ ] High contrast remains readable.

## N. Plan / Setup

- [ ] Existing plan fields load.
- [ ] Saving plan changes persists.
- [ ] Category/bill identifiers remain stable where expected.
- [ ] Plan edit does not erase transaction history unexpectedly.

## O. New Week

- [ ] Route opens.
- [ ] Confirmation is required.
- [ ] New week starts.
- [ ] Prior week is preserved for History.
- [ ] New week calculations initialize correctly.

## P. Mobile layout — mandatory 390px test

- [ ] No horizontal overflow.
- [ ] Bottom navigation clears the iOS safe area.
- [ ] Main tap targets are comfortably thumb-sized.
- [ ] Header does not consume excessive vertical height.
- [ ] Home resting state is understandable without scrolling through multiple analytic sections.
- [ ] Only one expanded information layer is visible at a time.
- [ ] Constellation labels do not collide.
- [ ] Software keyboard does not cover the active input/action.
- [ ] Safari toolbar expansion/collapse does not break fixed elements.

## Q. Accessibility

- [ ] Color is not the sole indicator of state.
- [ ] Interactive controls have text or accessible labels.
- [ ] Focus is not lost during route transitions.
- [ ] Reduced Motion works.
- [ ] Large text does not create horizontal scrolling.
- [ ] Bottom sheets/menus are dismissible by a visible control.

## R. Release check

- [ ] `index.html` JavaScript passes static syntax check.
- [ ] GitHub Pages workflow file remains valid.
- [ ] `.nojekyll` remains present.
- [ ] Rollback branch still exists.
- [ ] Commit SHA is recorded in release notes.
- [ ] Public URL is checked in an actual browser after deployment.
