# This Week — Phase 49: Reconcile Unicode Restore Bound Into Integrated Candidate

**Date:** November 2, 2026. **Status:** Draft review-only; production main unchanged. **Source:** integrated Phase 35–48 candidate at `50f0ce43cd5f7335dd46f5df893c45bdf9a45b48`. **Independent patch source:** UTF-8 restore issue PR #26 / `dbdac906d09eaa4d78fb6985688857893154b15d`.

## Cross-branch integration audit

The independently reviewed restore-size fix in PR #26 was implemented on a branch diverged from the latest integrated release candidate. Directly merging that stacked PR would accidentally replace newer Phase 44–48 work. This branch uses the **current consolidated candidate** as its base, and carries over only the narrowly defined 4-MiB restore size guard and four source-bound tests.

The previously inherited implementation measured `key.length + value.length`, which counts UTF-16 code units, **not UTF-8 bytes**. For example, an emoji is typically two UTF-16 code units but four UTF-8 bytes. The 4 MiB user-facing bound could be exceeded when restoring Unicode-heavy preferences, notes, or metadata. JavaScript `TextEncoder.encode` provides a UTF-8 `Uint8Array`; byteLength is the appropriate metric.

Official references:
- https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encode
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches

## Narrow implementation

1. Apply `TextEncoder().encode(key).byteLength + TextEncoder().encode(value).byteLength` inside the actual `validatedRawLocalBackup` implementation. Preserve the existing **4×1024×1024 byte cap**, allowlist and untouched data on failure.
2. Explicitly fail closed when `TextEncoder` cannot be used. The user must not receive a misleading success for a backup with unknown actual byte size.
3. Carry four regression tests: oversized Unicode rejected before storage writes, small multibyte values restored accurately, absent encoder fails closed, and source invariant prevents future regression to string-code-unit length.
4. Keep all Phase 44 multi-tab conflict protection, emergency volatile rescue and Phase 46–48 PWA asset-integrity controls from the consolidated branch. Do not cherry-pick the full independent PR #26 branch.
5. Add a cross-stack integration invariant so that future merges cannot silently remove the new restore bound while retaining green unrelated PWA tests.

## Known risks / limitations

- This calculation measures UTF-8 bytes of **selected localStorage keys and values**, not the serialized wrapper file including JSON syntax. It enforces the documented in-restore data bound; an independent raw-file-input cap would be needed for an exact total download/file cap.
- `TextEncoder.encode` allocates a Uint8Array for each item. The existing 4-MiB acceptance bound limits total accepted content, but malformed items can be larger before rejection. A separate input-length preflight and streaming/low-memory scheme merit physical iOS profiling.
- Safari storage eviction, access in private browsing, and cross-tab/localStorage atomicity remain separate risks. Passing Node source-bound tests does not constitute physical Safari acceptance.
- No attempt was made to merge or rewrite historical independent PRs. They contain overlapping, potentially stale cumulative diffs.
- No customer data, Supabase, banking, GitHub Pages production deployment, or paid Vercel resources are used by this branch.

## Release go/no-go

- Exact-head GitHub Actions complete, including the newly added UTF-8 adversarial tests; `deploy` skipped for PR.
- The latest integrated branch and this candidate must be compared before promotion. Review any later commits by other workers separately.
- Manual review of full cumulative diff against Phase 34 production, including financial security and CSP.
- Physical iPhone Safari restore and rollback using **fictional** data, including emoji/CJK boundary cases and offline restart, with zero silent storage loss.
- Before any separate production release, verify the production manifest SHA and every route independently. Live money gating remains locked.
