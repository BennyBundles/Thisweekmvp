# Phase 44 — Prevent accidental multi-tab financial Plan overwrites

**2026-11-02** | Scope: browser-local money-planning data on iPhone Safari and desktop. No provider, Auth, or Supabase writes.

## Source-backed issue
Two same-origin tabs share localStorage. The prior Plan persistence code held a volatile cached state and directly overwrote `thisweek.state.v2` after saving. A stale tab could overwrite a newer weekly transaction history written from another tab, with no visible warning. Worse, `safeLocalStorageGet` returned `null` when the core Plan could not be read, so a later successful write could replace data that had been unreadable. `safeLocalStorageRemove` also falsely reset the storage-health indicator to available even after an unrelated failed write.

MDN reference: https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event and https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API.

## Implemented
- Record and compare the exact most recently observed persisted Plan before every modified state write; if the on-disk raw value changed, quarantine that tab and refuse overwrite.
- React to another tab's `storage` events for this Plan immediately, showing an accessible conflict alert.
- If reading the Plan or checking its current persisted value throws, quarantine and block writes rather than interpreting the state as empty.
- Preserve earlier write failure status when an unrelated localStorage delete succeeds.
- Retain the existing explicit, verified user-directed reset and emergency backup route.
- Add twelve Node 22 source-bound tests exercising actual inline production state functions with two simulated tabs, access denials, cache mismatch, and reset.

## Limitations
This is optimistic concurrency, NOT an atomic compare-and-swap. Two truly simultaneous tab writes may race between checking and setting. Complete cross-tab serialization would require a separately designed transactional backend or lock protocol. The `storage` event isn't fired on the originating tab. Home Screen PWAs can have distinct storage handling from Safari. Never claim tests replace real-device QA.

## Review gates
New + prior CI tests pass on the exact commit, GitHub Pages `deploy` is skipped, no production main change, no financial providers enabled. Review cumulative Phase 43 PR #22 and run iPhone Safari synthetic-data multi-tab acceptance before considering release.

## Recursive quality correction
The warning previously said to export unsaved changes, but the raw backup feature exports persisted keys only. This pass removes that inaccurate claim, explains that unsaved edits must be recorded separately, and updates the existing on-screen warning if a storage failure escalates to a multi-tab conflict. A synthetic regression test covers both behaviors.
