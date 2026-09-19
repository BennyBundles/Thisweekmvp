# Phase 14 — Security, Privacy & Trust Hardening

**Status:** Implemented in production source  
**Primary import/security commit:** `dcd40e9f53b5d2b6684656ee611fe639fa2cd526`  
**Privacy/local-data controls commit:** `498181ae9a4e31a1bf8a9dc4cd0026808d519d92`  
**Trust self-audit commit:** `c1dd6982d39256f58584a480fd2f80f5b5858c85`

## Objective

Make the financial application's data boundaries explicit and give the user direct control over browser-local financial data.

The governing rules are:

- local planning data stays local in the current build;
- imported text is treated as text, not executable content;
- provider secrets do not belong in browser storage;
- destructive or reversal actions require explicit confirmation;
- users can export or delete local app data;
- plan-derived and imported/reconciled information remain clearly distinct.

---

## 1. Local-only storage disclosure

A new route is available at:

**Details → System & Settings → Privacy & Local Data**

The screen explains that:

- the current application has no active backend;
- there is no account login;
- there is no active live-bank token connection;
- financial data is stored in browser-local application storage;
- the app does not automatically upload financial data;
- the static site host still receives ordinary web requests required to serve the page.

Connected Data and Data Model & Export also display browser-local trust labels.

---

## 2. Data-source glossary

The Privacy screen distinguishes:

### Plan-derived

Examples:

- Available Now
- category allocations
- bill protection
- planned savings

These are planning values, not verified bank balances.

### Imported

CSV/TSV transaction records that remain outside the weekly plan until explicit reconciliation.

### Reconciled

A posted imported outflow that the user explicitly applies to a This Week category.

### External balance

No live institution balance is currently connected.

The app does not infer a bank-account balance from Available Now.

---

## 3. Data minimization

The current setup flow does not require:

- name
- email address
- phone number
- mailing address
- account login credentials

The local application uses a randomly generated local user ID to maintain record relationships.

That ID is not an authentication credential.

---

## 4. Imported-file safety limits

Transaction import now enforces explicit local parser limits:

- maximum file size: 5 MB;
- maximum data rows: 10,000;
- maximum columns: 64;
- maximum stored cell length: 1,000 characters;
- maximum transaction-description length: 240 characters;
- maximum source/file-name length: 120 characters.

Oversized files or malformed quoted fields are rejected before persistence.

---

## 5. Imported-text sanitization

Imported text now passes through a text sanitizer that:

- normalizes Unicode where supported;
- strips low ASCII control characters;
- strips Unicode bidirectional override/isolate control characters;
- trims whitespace;
- caps stored string length.

This is applied to:

- parsed file cells;
- imported descriptions;
- imported source names;
- normalized Connected Data records.

The sanitizer does not attempt to interpret imported text as HTML.

---

## 6. Imported text is not executed

Imported transaction data remains plain text.

The app's Connected Data UI renders imported values through escaped HTML presentation or text-content operations.

The import path does not use:

- `eval()`;
- the Function constructor;
- script execution from imported fields.

The regression checker explicitly fails if runtime `eval(` or `new Function(` is introduced into the application source.

---

## 7. File-name handling

Imported source/file names are:

- normalized as text;
- length-limited;
- stripped of path separators before storage.

This prevents a local file name from being treated as a filesystem path or executable resource.

---

## 8. Provider secret boundary

The existing provider adapter contract remains explicit:

> Provider credentials and access tokens must never be stored in this browser-local model.

Phase 14 adds a local secret-field audit that scans This Week JSON storage for field names resembling:

- access token
- refresh token
- client secret
- API key
- password
- authorization
- bearer
- private key

The scan reports suspicious field names without displaying stored financial values.

---

## 9. Local data inventory

The Privacy route displays a metadata-only inventory of This Week browser data.

It shows:

- storage key;
- persistent vs session scope;
- purpose;
- serialized size.

It intentionally does not display the key's stored financial contents.

Examples include:

- core weekly state;
- Connected Data;
- savings goals;
- presentation preferences;
- recommendation presentation state;
- Scenario session draft.

---

## 10. Export normalized financial data

Users can export the Phase 13 normalized portable financial model directly from the Privacy route.

This uses the same portable export contract as:

**Data Model & Export**

The file is created locally in the browser only when requested.

---

## 11. Export all local This Week keys

Phase 14 adds an additional local-data export.

This export contains current:

- This Week localStorage keys;
- This Week sessionStorage keys.

It is intended for user inspection/archival before deletion.

The export is clearly labeled as sensitive financial data.

The app does not automatically upload the resulting file.

---

## 12. Delete local app data

The Privacy route now includes:

**Delete local app data**

Deletion is constrained to keys beginning with:

`thisweek.`

on the current site.

The flow requires:

1. opening the delete confirmation;
2. typing `DELETE`;
3. confirming the final high-impact browser prompt.

The deletion removes both persistent and session This Week keys and resets in-memory caches before reload.

It does not delete:

- files previously downloaded by the user;
- browser backups;
- ordinary site-host request logs;
- data stored outside this browser.

---

## 13. High-impact mutation confirmation

Phase 14 adds a shared confirmation boundary for destructive or reversal actions.

The confirmation path is used for operations including:

- clearing imported metadata;
- undoing the latest import;
- undoing a reconciliation;
- starting a new week;
- deleting all local app data.

Normal explicit entry actions such as recording a purchase remain deliberate form submissions rather than adding repetitive confirmation prompts to every interaction.

---

## 14. Week rollover confirmation

Starting a new weekly cycle now asks for explicit confirmation before:

- closing the current week;
- opening a new weekly cycle.

The confirmation text explains that the existing Plan remains the source for the new week.

---

## 15. Connected Data trust language

Connected Data now states directly that:

- current Connected Data is stored in this browser;
- no live bank connection is active;
- imported records remain separate until reconciliation;
- file parsing occurs locally.

The import panel also explains its local text-handling and file-size limits.

---

## 16. Referrer policy

The document now includes:

`<meta name="referrer" content="no-referrer">`

This reduces referrer information sent during navigations initiated from the application.

It is not presented as a complete browser/network privacy system.

---

## 17. Local trust self-audit

The Privacy route includes:

**Run trust checks**

The read-only test suite checks:

- This Week storage-key scope;
- provider-secret-shaped field names;
- import file/row limits;
- control-character sanitization;
- escaped imported-text rendering;
- provider credential boundary;
- portable restore boundary;
- high-impact confirmation path.

The test does not alter financial data.

---

## 18. Portable restore remains disabled

Phase 14 preserves the Phase 13 rule:

- portable data may be serialized;
- exported;
- parsed;
- validated;

but is not automatically written back into live state.

A future restore/import feature still requires a separate confirmed workflow with migration, backup, and conflict semantics.

---

## 19. Current hosting boundary

The application is still a static GitHub Pages deployment.

The current product code does not have a This Week application backend receiving financial records.

Normal page delivery still involves the hosting platform and normal internet/network infrastructure.

This distinction is stated explicitly rather than claiming the browser has zero network exposure.

---

## 20. Completion result

Phase 14 source now satisfies the planned trust-hardening goals:

- local-only storage is labeled;
- unnecessary identity collection is avoided;
- provider secrets remain outside client storage;
- imported text is constrained and sanitized;
- imported content is never treated as executable code;
- high-impact mutations have confirmation;
- local export and delete tools exist;
- plan-derived and imported/reconciled data are explained distinctly.

The remaining security work belongs to future backend/provider phases, where authentication, authorization, server validation, token encryption, privacy policy, and provider consent become necessary.


## Continued Phase 14 refinements

### Plan-edit confirmation

Editing an existing Plan now requires an explicit high-impact confirmation before the updated:

- income;
- bills;
- spending lanes;
- savings target;
- weekly rhythm

become the basis for future weekly calculations.

Creating the first Plan remains a deliberate setup submission and does not add a redundant confirmation step.

### Runtime network-dependency guard

The Phase 14 trust audit now verifies that the loaded static document has no external runtime:

- script dependency;
- stylesheet dependency.

The static regression checker also fails if the current browser-only application source introduces:

- `fetch(`
- `XMLHttpRequest`
- `WebSocket`
- `sendBeacon`

without deliberately revisiting the Phase 14 local-only boundary.

These guards are expected to change in a future reviewed backend/provider phase rather than being silently bypassed.

### Local retention disclosure

The Privacy & Local Data screen now states the current local-retention behavior.

- Core plan/history persists until edited or deleted from browser storage.
- Connected Data audit history is bounded to the latest 120 actions.
- Import batch history is bounded to the latest 40 batches.

### Latest Phase 14 application commit

`f7fef825dfd19ade72376a99705ed526a0385ea1`

This is the latest Phase 14 app-source refinement.
