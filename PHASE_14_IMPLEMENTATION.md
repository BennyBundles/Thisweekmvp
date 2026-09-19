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


## Continued Phase 14 completion — CSP and storage transparency

Phase 14 was extended with two additional trust boundaries.

### Static Content Security Policy

The document now declares a static Content Security Policy that currently includes:

- `connect-src 'none'`
- `object-src 'none'`
- `frame-src 'none'`
- `base-uri 'none'`
- `form-action 'self'`
- local/data/blob-only image/media sources

This matches the current zero-backend architecture by preventing application fetch/XHR/WebSocket traffic unless the policy is deliberately changed in a future reviewed backend phase.

Because This Week is still a monolithic single HTML document, the policy currently requires inline JavaScript and inline CSS. It is therefore an additional network/embedding boundary rather than a complete XSS defense.

### App-level encryption disclosure

Privacy & Local Data now states explicitly:

**No app-level storage encryption**

The app does not present browser localStorage as an encrypted financial vault. A person with access to the unlocked device/browser profile may be able to access stored local data.

### Phase 14 regression protection

The static checker now requires:

- CSP network restriction;
- object/frame restriction;
- local-storage encryption disclosure;
- typed DELETE confirmation;
- source-boundary glossary;
- local-only Connected Data labeling.

### Latest Phase 14 application commit

`f2b4c9cb8f697a392d702d131be3d3e541a98aad`

GitHub Pages deployment for this app commit completed successfully.


## Final Phase 14 hardening — hashed CSP and inactive-view privacy

Phase 14 was completed with two additional controls.

### Hashed inline-script CSP

The application no longer relies on `script-src 'unsafe-inline'`.

The current Content Security Policy authorizes the two inline application scripts by exact SHA-256 hashes and also declares:

- `script-src-attr 'none'`
- `connect-src 'none'`
- `object-src 'none'`
- `base-uri 'none'`
- `form-action 'none'`
- `frame-src 'none'`
- `child-src 'none'`
- `worker-src 'none'`

This narrows the static browser-only attack surface while preserving the monolithic single-file architecture.

Inline styles remain allowed because the current visual system depends on runtime inline style values.

The static regression checker now recalculates the SHA-256 hash of both inline script blocks and verifies that the active CSP contains those exact hashes. If a script changes without a matching CSP update, the checker should fail.

### Inline event-attribute removal

The remaining inline Retry handler was replaced with an ordinary event listener.

This allows the CSP to enforce:

`script-src-attr 'none'`

without breaking that recovery path.

### Inactive-view privacy curtain

A best-effort privacy curtain now covers the financial interface when the browser reports the page as hidden or moves through a page-hide lifecycle.

It is intended to reduce accidental exposure in:

- tab previews;
- app switching;
- temporarily backgrounded browser views.

The curtain is removed when the page becomes visible again.

This is explicitly not presented as a guarantee that every operating system or browser will suppress all captured preview frames.

### Latest Phase 14 application commit

`a39f440edd8385fb22c7d90b2e913a84873d22c6`

### Latest Phase 14 regression-checker commit

`9d9210505cbf853a88a3dbb2b94da38a25df24f0`

Phase 14 is complete at the source level. The remaining gate is live browser verification of the CSP, import path, export path, privacy route, and inactive-view behavior.
