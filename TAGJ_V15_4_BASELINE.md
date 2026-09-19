# TAGJ × Benny Bundles — V15.4 Baseline

Branch: `tagj-v12-preview`

Rollback branch:
`rollback/tagj-v15.2-pre-intro-router-fix-2026-09-19` → `7de7256bbc958080304b25fed88d5690c401ae2e`

## What V15.3/V15.4 fixes

### Cinematic intro
- Uses the actual current intro asset path:
  - `tagj-assets/intro/intro-clip-for-website-v152.mp4`
  - QuickTime fallback: `tagj-assets/intro/intro-clip-for-website-v151.mov`
- Fresh top-level visits are allowed to show the intro again.
- Intro suppression is session-scoped instead of permanently suppressed by stale localStorage.
- Internal returns/deep links still skip the splash.
- iPhone sound remains explicitly user-triggered.
- Replay remains available with `?intro=1#home`.

### World navigation stability
The V12/V12.3 world router previously defaulted unknown/deeper hash targets back to `home`. That could make the center screen appear unexpectedly while navigating inside a sub-site.

V15.3 resolves a deep target's owning `.world-view` first and otherwise preserves the current non-home world.

### Internal map clarity
The internal `full.html#home` hub now reads:
- ECOSYSTEM MAP
- RETURN / SWITCH WORLDS

This distinguishes it from the cinematic entry screen.

## QA gate
- `index.html`: JavaScript syntax PASS
- `full.html`: JavaScript syntax PASS
- duplicate static IDs: 0
- missing static hash targets: 0
- HTML closing documents: 1 each
- current intro media paths included in build
- build version: V15.4

## Deployment note
Vercel currently reports:
`Deployment rate limited — retry in 24 hours.`

Source development is complete through V15.4 even though the latest preview cannot be freshly deployed until Vercel accepts another build.
