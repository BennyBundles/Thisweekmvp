# Phase 45 — Cross-tab restore rollback integrity

**Date:** November 2, 2026  
**Project:** This Week — PR #22 integrated draft release candidate  
**Scope:** Browser-local recovery for financial Plan data, synthetic tests only. No provider calls, personal finance reads, or production writes.

## Newly verified risk

The existing fail-closed restore process appended each destination key to a rollback list before writing it. If a later restore step failed, it deleted every listed key unconditionally. A second browser tab could change one of those keys between the restore's writes and rollback. The rollback would silently erase that newer value. Phase 44 ordinary Plan-save conflict protection did not protect this recovery path.

## Bounded repair

- Record each rollback candidate as a key and the exact restored value.
- When undoing a partial restore, skip absent keys; remove only keys still holding exactly the restore's value; never knowingly delete a value that differs from the restore's bytes.
- A divergent key forces failed rollback and Plan quarantine instead of a false fully-rolled-back success.
- Preserve the core-Plan-last ordering, restore confirmation, exact-key allowlist, 4 MB cap, credential scan, and publishing HOLD.

## Synthetic regression tests

Five additional Node VM tests exercise actual production recovery functions: competing-tab changes to UI preferences, competing-tab changes to the core Plan, previously removed restore keys, failed writes before mutation, and source guards against unconditional deletion.

## Limits

This is **not atomic compare-and-delete**. Browser localStorage has no transactional compare-and-swap primitive; a mutation precisely between final comparison and removal can still race. This repair prevents deterministic observed data loss and fails closed on conflicts; it cannot establish total concurrency safety.

Hold production release until exact integrated GitHub CI passes, stacked changes are reviewed, a hosted artifact is verified, and a physical iPhone Safari synthetic-data test covers multi-tab restore, refresh, storage denial, and cache recovery. The Vercel free-quota limitation remains a separate verification gate.
