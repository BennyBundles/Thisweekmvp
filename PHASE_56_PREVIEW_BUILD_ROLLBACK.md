# This Week — Phase 56: Rollback-Safe Preview Artifact Staging

**Date:** 2026-11-02  
**Branch:** canonical consolidated draft PR #29; no additional draft PR  
**Production policy:** HOLD; no main merge, hosted deployment, provider/Supabase writes or spending.

## Source-bound defect

`stage-preview.mjs` passed its initial source-preflight checks and then immediately ran `fs.rmSync('_site',{recursive:true,force:true})`. A later failure (CSP verification, service-worker stamping, route validation, hash manifest, disk-full, process interruption) could destroy the previous successfully validated preview artifact, leaving a partially built `_site` directory and potentially causing downstream tooling to consume an incomplete snapshot. Existing tests protected the *early* missing-file paths only; they did not exercise failures after the destructive step.

A second independent concern: multiple CI/local build invocations sharing the same working directory could mutate the same `_site` concurrently.

## Implemented

1. Require all known source/validator preflights before modifying `_site`.
2. Open an exclusive `.thisweek-preview-build.lock` in `wx` mode. A second writer fails with `EEXIST` and leaves the existing output untouched. Locks are removed by the owning process on ordinary success/error, but stale locks after forced termination require manual inspection and cleanup; never automatically steal them.
3. If a previous `_site` exists, reject a symlink or non-directory, create a randomized backup directory **under the same project root**, and use `fs.renameSync` to move the previous complete artifact aside.
4. Build in the usual `_site` path to preserve existing tool contracts and byte-for-byte cross-provider parity tests.
5. On a failed build, remove only the partial new `_site`, rename the previous complete artifact back, and fail the build. If rollback itself fails, report the backup directory location rather than silently deleting the only recovery copy.
6. On success, remove the old backup only after all validators, digests and the `preview-build.json` receipt have passed; release the lock.
7. Six added regression cases: late failure retains byte-identical old output, late failure with no old output removes partial build, verified worker/receipt survives a failed rebuild, successful rebuild clears obsolete output/backups, concurrent builder lock rejects safely, and symlink output is rejected without following its target.

## Research and engineering limits

- Node's file rename operation and unique temp paths provide a same-filesystem move primitive:
  https://nodejs.org/api/fs.html#fsrenamesyncoldpath-newpath
  https://nodejs.org/api/fs.html#fsmkdtempsyncprefix-options
- **This is transactional rollback for an ordinary failed build, not an atomic publish.** The canonical `_site` path can be incomplete while a build runs. Downstream publishers should consume it only after the build command exits successfully and should also verify the artifact receipt. Stronger atomic publication would require staging all validators against a separate output prefix and promoting with coordinated writer/readers, which is beyond this bounded change.
- Forced SIGKILL, process crash or power loss can leave a renamed backup and lock, potentially with no `_site`. Recovery must inspect exact paths and the generated receipts before manually restoring; crash-safe journal recovery is not implemented.
- The lock protects cooperating builds using this script in one checkout. A different script that ignores the lock or mutates the source tree can still create a race. Vercel/GitHub builds normally use isolated checkouts; the protection is especially useful for local and reusable CI runners.
- A Vercel build failure is not evidence of a live deployment rollback requirement; Vercel's publishing and deployment alias handling are separate systems.
- This pass does not address Vercel Hobby deployment quotas or prove the remote CDN serves the built bytes.

## Independent release acceptance gates

- Exact-head GitHub Actions validate SUCCESS after these commits, deploy SKIPPED.
- Staged `_site` output parity and source/security contracts continue passing, including CSP preflight, PWA asset SHA-256 and release-smoke checks.
- Physical Safari acceptance still required with synthetic Plan data. No production release is permitted without separate review and explicit approval.

**Budget:** $0 incremental. **Status:** DRAFT/HOLD.
