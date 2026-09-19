# This Week — Security, Privacy & Trust Model

**Phase:** 14  
**Current architecture:** Static browser-local application  
**Current hosting:** GitHub Pages  
**Backend:** None  
**Live financial-provider connection:** None

This document describes the current technical privacy and security boundaries of This Week. It is not a legal privacy policy.

## Core privacy model

The current application stores its financial planning data in browser storage on the device/browser profile where the app is used.

The app does not currently require:

- a name;
- an email address;
- an account password;
- a cloud account;
- a bank login;
- a financial-provider token.

The local application user ID is a randomly generated relationship identifier. It is not an authentication credential.

## Data stored locally

Current browser-local data can include:

- Plan configuration;
- weekly cycles;
- recorded transactions;
- category balances;
- bill-protection planning records;
- savings goals;
- imported transaction metadata;
- reconciliation metadata;
- Connected Data audit entries;
- presentation/accessibility preferences;
- Scenario Sandbox session data;
- recommendation presentation state.

The in-app **Privacy & Local Data** screen provides a current inventory of This Week storage keys without exposing their values.

## Local storage is not encrypted by the app

This Week does not add application-level encryption to localStorage or sessionStorage.

A person or process with access to:

- the unlocked device;
- the browser profile;
- browser developer tools;
- a browser backup;

may be able to access stored app data.

The app does not claim local browser storage is equivalent to an encrypted financial vault.

## Hosting boundary

The financial application does not upload local plan data in the current build.

However, loading the static site still requires ordinary requests to the hosting service. Normal hosting/network infrastructure may receive request metadata that accompanies delivery of a web page.

The app does not claim that using the site creates zero network metadata.

## No application backend

Current This Week code has no active application API server.

The runtime does not use:

- fetch;
- XMLHttpRequest;
- WebSocket construction;
- sendBeacon.

A Content Security Policy also sets:

`connect-src 'none'`

so the current static app cannot initiate normal application network connections without an intentional future policy change.

## Content Security Policy

The current build uses a restrictive document-level Content Security Policy.

Important boundaries include:

- inline scripts are allowed only by explicit SHA-256 hashes;
- script attributes are blocked with `script-src-attr 'none'`;
- runtime network connections are blocked;
- objects are blocked;
- child frames are blocked;
- workers are blocked;
- base URLs are blocked;
- HTML form submissions are blocked.

Inline styles remain allowed because the existing UI relies heavily on dynamic inline style values.

### Hosting limitation

The policy is currently delivered by a `<meta http-equiv="Content-Security-Policy">` tag because the site is hosted as a static GitHub Pages application.

A document-level CSP cannot replace all protections that would ideally be delivered through server response headers.

For example, anti-framing controls such as `frame-ancestors` require response-header support to be relied on as a primary control.

Future backend/hosting work should move security headers to the server/CDN layer.

## Script integrity

The two inline application script blocks are covered by SHA-256 CSP hashes.

The static regression checker recalculates each inline script hash and verifies that the current CSP contains the matching value.

This means a later code change that modifies an inline script without updating the CSP should fail the regression check rather than silently shipping a broken policy.

## Imported files

Supported transaction imports are treated as untrusted text.

Current protections include:

- 5 MB maximum file size;
- 10,000 data-row limit;
- 64-column limit;
- cell-length caps;
- description-length caps;
- normalized file/source names;
- removal of control characters;
- removal of bidirectional override/isolate characters;
- quoted-field parsing;
- escaped display output;
- no imported HTML execution;
- no imported script execution.

The app parses supported transaction files locally.

Imported records remain separate from the weekly plan until the user explicitly reconciles a posted outflow.

## Source-of-truth boundaries

The interface distinguishes several concepts.

### Plan-derived

Examples:

- Available Now;
- category allocation;
- required-by-today bill protection;
- planned savings.

These are planning-model values.

They are not bank balances.

### Imported

A transaction record loaded from a local file.

It remains reference data until explicitly reconciled.

### Reconciled

A posted imported outflow that the user intentionally applies to a This Week category.

The app retains import provenance after reconciliation.

### External balance

No live external financial-account balance is currently connected.

The app does not infer an external balance from Available Now.

## Provider credentials

Provider credentials, access tokens, refresh tokens, private keys, and client secrets are explicitly outside the browser-local data model.

The current provider contract states that those secrets must be server-side only in any future live integration.

Phase 13 also defines this in the backend-readiness contract.

## Destructive and high-impact actions

High-impact reversal/destructive flows use an explicit confirmation path.

Examples include:

- starting a new week;
- undoing reconciliation;
- undoing import history when applied records exist;
- clearing imported metadata;
- saving Plan changes that materially rebuild the week;
- deleting all This Week browser-local data.

Full local deletion additionally requires typing:

`DELETE`

before the final confirmation.

## Local deletion boundary

The Privacy & Local Data screen can remove all keys beginning with:

`thisweek.`

from localStorage and sessionStorage for the current site.

This does not delete:

- files the user already downloaded;
- browser/device backups;
- copies made outside the app;
- normal hosting logs;
- data stored by other websites.

The app does not claim secure physical erasure of browser storage.

## Export boundary

Two user-requested export types exist.

### Normalized financial export

Creates the Phase 13 portable normalized financial snapshot.

### Raw local-data export

Creates a copy of all current `thisweek.*` browser storage keys.

Both can contain sensitive financial information.

Exports are created only when the user explicitly requests them.

The current app does not automatically upload exported files.

## Runtime trust checks

The Privacy & Local Data screen includes a local trust self-audit.

It checks:

- local storage namespace scope;
- token/password/secret-shaped field names;
- runtime network dependency boundary;
- CSP network boundary;
- import limits;
- control-character sanitization;
- imported-text HTML escaping;
- provider credential boundary;
- portable restore boundary;
- high-impact confirmation path.

The audit is diagnostic. It is not a penetration test or formal security certification.

## Data retention

The core plan/history remains until changed or deleted by the user/browser.

Connected Data intentionally limits some metadata:

- audit history: most recent 120 entries;
- import batch history: most recent 40 batches.

This reduces unlimited metadata growth while preserving recent provenance.

## Future backend requirements

Before adding cloud synchronization or live provider connections, the project still requires:

- authenticated user identity;
- authorization;
- server-side validation;
- secure secret/token storage;
- encrypted transport;
- server-side security headers;
- idempotent writes;
- record/version conflict handling;
- deletion/tombstone semantics;
- privacy review;
- recovery/revocation flows.

Phase 14 does not simulate these controls in the browser and does not claim they already exist.

## User-facing trust surface

The application exposes:

**Details → System & Settings → Privacy & Local Data**

That surface explains:

- where data lives;
- what is plan-derived;
- what is imported;
- what has been reconciled;
- what is not connected;
- current storage footprint;
- local-storage encryption limitations;
- export options;
- local deletion options;
- trust checks.


## Inactive-view privacy curtain

The application includes a best-effort inactive-view privacy curtain.

When the browser reports that the page is hidden, or when a page-hide lifecycle event occurs, the visible financial interface is covered with a neutral This Week screen.

The curtain is removed when the page becomes visible again.

This is designed to reduce accidental exposure in browser/tab/app-switcher previews.

It is not a guarantee against:

- operating-system screenshots;
- screen recording;
- browser extensions;
- malicious software;
- physical access to an unlocked device.

## CSP script-hash enforcement

The current static build authorizes its two inline application scripts by SHA-256 hash.

The active policy also blocks inline event attributes with:

`script-src-attr 'none'`

The regression checker recalculates the script hashes from `index.html` and verifies that they are present in the CSP. This creates a direct integrity check between application source and the static security policy.
