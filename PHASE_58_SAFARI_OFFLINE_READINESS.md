# Phase 58 — Safari offline readiness diagnosis

## User observed failure (Nov 3 2026)
Native Safari on iPhone shows a blank white page while Airplane Mode is enabled. User had earlier confirmed online UI and saved test Plan survived Safari refresh. This does NOT establish whether Service Worker registration, activation, controller, scope, or cached bytes failed.

## Verified source risk
The previous public preview inserted `navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{})` without reporting errors or verifying a controlling worker and the actual release-stamped cache. The application could thus appear healthy online while incapable of offline navigation.

## Fix in draft source
Visible compact status strip under the header, with Checking/Offline ready/Offline not ready and a Check again button. A strict READY requires active service worker registration for the correct scope, a controlling worker, and a read-only MessageChannel handshake verifying exact shell, manifest and icon through existing source/digest validators. Errors and unsupported cases surface as code only, never personal Plan details.

## Verification and boundary
Four worker-message regression tests, five source-bound bootstrap regressions and mandatory preview validation/CI steps. Not deployed: earlier user authorization was limited to one Vercel preview and was already used. The actual underlying Safari root cause is not yet known. Do not clear storage, delete the saved Plan, merge to main, or create another preview without authorization. Physical Safari offline test remains FAILED until tested on a corrected deployment.
