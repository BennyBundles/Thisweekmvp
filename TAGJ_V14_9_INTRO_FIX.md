# TAGJ V14.9 — Intro Reliability Fix

This build fixes the iPhone/Safari intro reliability issue without changing the V12/V12.3 four-world center.

- Intro MP4 is now a normal same-origin file instead of a data-URL payload.
- Intro poster is now a normal file asset.
- Intro completion is stored per browser tab with sessionStorage.
- The intro gate cannot reappear after entering and navigating between routes in the same session.
- Enter with sound still begins from a direct user gesture to satisfy iOS media policy.
- The currently embedded 7.55-second media is a technical preview source only.
- The exact Benny Bundles “Cold Winter” ~4:00 lyric clip is NOT claimed as integrated; repository and connected Drive were checked and no matching video/audio source file was found.

Rollback branch: rollback/tagj-v14.8-intro-pre-fix-2026-09-19

Deployment trigger: standard contents push after intro media/state repair.
