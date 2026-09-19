# This Week — Security, Privacy & Trust Boundaries

**Phase:** 14  
**Runtime:** Static browser application  
**Current persistence:** Browser-local

This document describes what the current This Week build does and does not do with financial planning data.

## Current architecture

This Week currently runs as a static application delivered through GitHub Pages.

The app does not currently have:

- an application backend;
- account login;
- cloud synchronization;
- live bank connections;
- provider access tokens;
- background financial-data upload.

The static page host still receives normal network requests required to deliver the website. Hosting infrastructure may retain ordinary request logs outside the application itself.

## Where data lives

Current persistent application data is stored in browser storage under keys beginning with:

`thisweek.`

Examples include:

- core Plan and weekly state;
- recorded transactions;
- bill protection records;
- savings goals;
- imported transaction metadata;
- reconciliation provenance;
- UI/accessibility preferences;
- recommendation presentation state.

Temporary/session data also uses `thisweek.*` keys in sessionStorage.

The in-app path:

**Details → System & Settings → Privacy & Local Data**

shows the current browser-storage inventory without displaying the underlying financial values.

## Local storage is not an encrypted vault

This Week does not add application-level encryption to localStorage.

Therefore:

- anyone with access to the same unlocked device/browser profile may potentially access browser-local data;
- device security and browser-profile security remain important;
- clearing site/browser storage can remove local data;
- private/incognito browsing may have different retention behavior.

This Week does not claim that browser-local storage is equivalent to encrypted banking storage.

## No unnecessary identity collection

The current Plan does not require:

- legal name;
- email address;
- phone number;
- mailing address;
- bank username;
- bank password;
- Social Security number.

A randomly generated local user ID is used only to relate local records.

That local ID is not an authentication credential.

## Provider-secret boundary

The browser-local data contract explicitly excludes:

- provider access tokens;
- provider refresh tokens;
- API secrets;
- bank credentials;
- passwords.

The future provider-adapter contract requires those secrets to remain server-side if live provider integration is ever implemented.

The Privacy screen includes a local audit that checks This Week JSON records for token/password/secret-shaped fields.

This check is defensive, not a formal security certification.

## Content Security Policy

The current static document declares a CSP that:

- blocks application fetch/XHR/WebSocket connections with `connect-src 'none'`;
- blocks object embedding;
- blocks frame content;
- restricts images/media to local/data/blob sources;
- prevents external base-URL replacement;
- restricts form submission to the same origin.

Because the project remains a single HTML file containing inline JavaScript and CSS, the current policy still requires:

- `script-src 'unsafe-inline'`
- `style-src 'unsafe-inline'`

Therefore the CSP is an additional network/embedding boundary, not a complete XSS defense.

Imported/user-controlled text must still be escaped before insertion into HTML.

## Referrer policy

The document declares:

`no-referrer`

to avoid sending the page URL as a referrer on outgoing navigation initiated from the page.

## Import security

Transaction imports are handled locally as text.

Current limits:

- maximum file size: 5 MB;
- maximum data rows: 10,000;
- maximum columns: 64;
- maximum imported cell length: 1,000 characters;
- maximum transaction description length: 240 characters;
- maximum source/file display name: 120 characters.

The parser:

- removes control characters;
- removes bidirectional text override/isolate characters;
- normalizes imported Unicode where supported;
- caps string lengths;
- sanitizes file/source names;
- rejects unterminated quoted fields;
- rejects excessive rows/columns;
- does not evaluate imported JavaScript or HTML.

Imported merchant descriptions, notes, file names, and audit text are rendered through HTML escaping in user-facing views.

## Imported data never silently becomes Plan data

Imported data remains a separate Connected Data record until the user explicitly reconciles a posted outflow.

The state transition remains:

`Imported → Review → Reconcile → Weekly transaction`

Pending activity remains reference-only.

Inflows remain reference context and are not silently converted into Available Now.

## Financial number provenance

### Plan-derived

Examples:

- Available Now;
- category room;
- Bill Protection;
- planned savings.

These are planning values calculated from the local Plan and recorded/reconciled activity.

They are not bank balances.

### Imported

Transaction records parsed from a local file.

Imported records do not change the Plan merely because they were imported.

### Reconciled

An imported posted outflow explicitly applied by the user to a This Week category.

Reconciliation retains import provenance.

### External balance

No live external balance is currently connected.

The app does not infer a bank balance from Available Now.

## High-impact confirmations

High-impact actions use explicit confirmation paths where appropriate.

Examples include:

- clearing imported review metadata;
- undoing an import batch;
- undoing a reconciliation;
- closing the current weekly cycle and starting a new one;
- deleting all This Week local data.

Ordinary intentional actions such as adding a spending transaction do not add redundant confirmation dialogs after every click.

## Local export tools

The Privacy screen can create:

### Normalized financial export

A Phase 13 portable JSON snapshot using the normalized data model.

### Raw local This Week export

A browser-local backup-style file containing all current `thisweek.*` local/session keys.

These downloads can contain sensitive financial information.

After downloading, the files are outside This Week's control.

The app does not automatically upload them.

## Local deletion

The Privacy screen can remove all `thisweek.*` keys from localStorage and sessionStorage on the current site.

Deletion requires:

1. choosing **Delete local app data**;
2. typing `DELETE`;
3. accepting a final confirmation.

This does not delete:

- files already downloaded;
- browser/device backups;
- data outside the current browser profile;
- ordinary hosting logs.

## Trust self-audit

The Privacy screen includes read-only checks for:

- This Week storage-key scope;
- provider-secret-shaped fields;
- runtime external dependency boundary;
- CSP network restriction;
- import file limits;
- control-character sanitization;
- imported text escaping;
- provider-secret boundary;
- portable restore boundary;
- explicit confirmation path.

The audit is a local product diagnostic.

It is not a penetration test or independent security certification.

## Known limitations

Current security/privacy limitations include:

- localStorage is not application-encrypted;
- there is no authenticated user identity;
- there is no remote backup;
- there is no multi-device conflict resolution;
- CSP currently permits inline scripts/styles because of the single-file architecture;
- downloaded exports rely on the user's device/file security after creation;
- GitHub Pages hosting is outside the browser-local application storage boundary.

## Future requirements before live bank-provider integration

Live provider integration must not begin until the system has:

- a backend;
- authenticated user sessions;
- server-side secret/token storage;
- explicit institution consent flow;
- reconnect/revocation handling;
- server-side authorization;
- sync/conflict semantics;
- a reviewed privacy policy;
- an incident/recovery plan;
- provider-specific security review.

Until then, local import/reconciliation remains the supported connected-data approach.
