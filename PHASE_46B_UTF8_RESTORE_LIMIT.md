# Phase 46B — Raw backup UTF-8 byte-limit integrity

**Date:** November 2, 2026.  
**Branch:** fix/thisweek-utf8-restore-size-20261102.  
**Scope:** Browser-local raw Plan recovery. Synthetic inputs only; no bank/provider calls, no production publication.

## Source-bound defect
The raw-backup restore validator asserted a 4 MB safety cap using JavaScript UTF-16 code-unit `.length`, not UTF-8 bytes. A JSON field with emoji or CJK content can therefore exceed four megabytes while passing the purported limit, causing memory/storage mis-sizing on iPhone Safari and contradicting the download file-size guard.

## Bounded repair
- Compute the UTF-8 byte length of every whitelisted key and value with browser `TextEncoder`; total across all keys must remain within the existing 4 MB cap.
- If `TextEncoder` is unavailable, refuse restoration without writing data.
- Preserve allowlisting, credential scanning, validation, core-Plan-last semantics, verified rollback and quarantine.
- Four regression cases: oversized Unicode accepted under old UTF-16 math, small Unicode positive case, missing TextEncoder fail-closed, and source guard.
- Avoid any new runtime network communication.

## Outstanding gates
Confirm exact SHA GitHub validation; the base branch is a **stacked draft** and production main remains unchanged. This does not solve true concurrent localStorage races or replace physical iPhone Safari restore testing. Do not merge the cumulative stack directly or spend on Vercel preview upgrades.
