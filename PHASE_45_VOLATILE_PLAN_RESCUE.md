# Phase 45 — iPhone volatile Plan recovery, research-only backup separation

Date: 2026-11-02. Integrated into draft PR #22 without production or backend writes.

## Findings
WebKit notes that script-writeable storage can be evicted or quota-limited. In a browser-local financial planner, an unsuccessful localStorage write leaves the most recent user changes in volatile memory. An ordinary raw storage backup does not contain those unsaved edits. Recovery messaging therefore needs a second, accurately labeled, user-triggered export path.

Sources:
- https://webkit.org/blog/14403/updates-to-storage-policy/
- https://webkit.org/tracking-prevention/
- https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event

## Implemented
- An accessible storage-failure alert now offers **Save in-memory Plan for manual recovery** only when a live in-memory Plan exists.
- A separate, deliberately non-importable `thisweek.volatile-plan-review.v1` envelope includes a snapshot and an explicit `unverified_in_memory_only` status; file name contains `UNSAVED-manual-review`.
- Credential-shaped nested fields are screened before export by the existing security helper; an explicit sensitive-file confirmation is required.
- No third-party network connections or cloud storage are triggered. A four-megabyte cap limits the file. Delayed object URL revocation supports iPhone handoff, though real device behavior remains to be tested.
- Eight dependency-free source-bound tests exercise production persistence code, failures, user clicks, rejection, no auto-download, and safety restrictions.

## Caveats
The emergency file is neither a verified transaction record nor an automatic restoration/merge file. It intentionally cannot be imported through the raw-backup restore path, which avoids overwriting the other tab's changes. If the tab is already closed, volatile changes may be irretrievable. Download success and iPhone Share Sheet need physical testing. This does not replace transactional concurrency or remote backup.

## Phase 46 recursive findings
An earlier rescue saved the pre-conflict volatile Plan but **not** a later user edit refused under multi-tab quarantine. Blocked write attempts now retain a separate tentative draft for manual review, labeled `blocked_conflict_draft`, and do not touch the authoritative stored Plan. A warning that appears before an edit can acquire a rescue button later. Failed local deletion no longer discards the last in-memory rescue; success explicitly clears it. New regression cases verify all four scenarios. The resulting recovery export is still not automatically importable or proof of a paid transaction.
