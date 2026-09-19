# TAGJ × Benny Bundles — V15.5 Intro + Mobile Navigation Baseline

Branch: `tagj-v12-preview`

Rollback:
`rollback/tagj-v15.4-2026-09-19` → `5215af8365fa7213212ddf573d8dbc8af03f6951`

## Exact intro source verified
Google Drive:
- Title: `Intro clip for website`
- Drive ID: `1CEtochBuGhf3vwOnnrrEmsTlHNVcSAvd`
- MIME: `video/quicktime`
- Size: 167,418 bytes
- Duration: 6.930 seconds
- Video: H.264 Main / yuv420p
- Audio: HE-AAC stereo / 44.1 kHz

Current site source:
- Primary: `tagj-assets/intro/intro-clip-for-website-v152.mp4`
- QuickTime fallback: `tagj-assets/intro/intro-clip-for-website-v151.mov`
- Poster: `tagj-assets/intro/intro-poster-v149.jpg`

The intro remains user-gesture driven on iPhone/Safari:
- Enter with sound → explicit tap starts unmuted media.
- Enter muted → explicit tap starts muted media.

## V15.5 anti-repeat hardening
The intro completion state now uses:
1. sessionStorage for the active browser session, plus
2. a 45-minute localStorage timestamp bridge.

The bridge covers iPhone/Safari page-process swaps and page restoration that can otherwise discard session state while the user is still navigating the same ecosystem.

Explicit replay with `?intro=1#home` clears/bypasses the resume behavior.

## World navigation hardening
- Deep hashes continue to resolve their owning world instead of falling back to the center.
- The duplicate fixed bottom-left home button is hidden on phone-width sub-sites.
- The persistent dock labels the explicit center route as `World Map` instead of a generic `Home`.
- Deep-page `Four-world hub` links remain available as intentional routes.

## QA
- `index.html`: JavaScript syntax PASS
- `full.html`: JavaScript syntax PASS
- duplicate static IDs: 0
- missing static hash targets: 0
- HTML closing documents: 1 each
- exact intro asset path present
- iPhone resume bridge present in index and full world handoff
- build version: V15.5
