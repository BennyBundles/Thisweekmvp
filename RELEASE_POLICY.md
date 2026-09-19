# Production Release Policy

## Production branch

**main is production.**

Only commits on `main` are deployed by the GitHub Pages production workflow.

## Release gate

Every production workflow must pass:

1. `phase0-static-check.mjs`
2. `release-smoke-check.mjs`

Deployment is blocked if either fails.

## Artifact discipline

The Pages workflow builds a dedicated `_site` artifact containing only production web assets and deployment metadata. Repository planning documents, internal implementation notes, and source-side release scripts are not intentionally published as site assets.

## Release identity

Each deployed artifact contains `release.json` with:

- release name
- production commit SHA
- rollback commit SHA
- workflow run ID
- state schema version
- portable schema version
- deployment timestamp

The deployed commit is always the GitHub Actions `GITHUB_SHA`; it is not manually guessed.

## Rollback discipline

Before a milestone release, preserve the previous production head as a rollback branch and record its full SHA in `release.config.json`.

Rollback procedure:

1. confirm the intended rollback SHA;
2. move/revert `main` to a corrective commit based on that known-good state rather than editing production ad hoc;
3. let the normal smoke-gated Pages workflow deploy it;
4. verify `release.json` and the cache-busted production URL.

## State migrations

Any change to the persistent financial-state schema must:

- increment or explicitly preserve the core schema version;
- add a migration path;
- preserve money values unless a documented product change requires otherwise;
- update CHANGELOG;
- update the release migration note;
- pass migration self-tests.

Current core schema: v3.

## Release notes

`CHANGELOG.md` is the human-readable production history. Each release entry should include:

- user-visible changes;
- data/schema changes;
- trust/security changes;
- known limitations;
- rollback reference.

## Cache-busted verification

Use:

`https://bennybundles.github.io/Thisweekmvp/?v=<short-commit>`

after deployment so Safari does not reuse an older page while verifying a new release.

## Stable milestones

Stable milestones should be represented by an immutable Git tag when repository tooling permits. Until a tag is created, the preserved rollback branch and exact commit SHA remain the authoritative rollback references.
