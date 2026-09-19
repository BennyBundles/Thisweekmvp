# This Week — Security, Privacy & Trust Model

**Current architecture:** Static browser-local application  
**Current hosting:** GitHub Pages  
**Current application backend:** None  
**Current live bank/provider connection:** None  
**Phase:** 14

This document describes the security and privacy boundary of the current This Week build. It is intentionally specific about what the app does and does not protect.

## 1. Where financial data lives

The active product stores its financial planning state in browser storage on the current device/browser profile.

Primary persistent keys use the `thisweek.*` namespace, including:

- core weekly plan/state;
- imported transaction metadata;
- savings goals;
- presentation/accessibility preferences;
- Lifestyle soft-cap preferences;
- recommendation presentation state.

Scenario assumptions use session storage and normally disappear when the browser session ends.

The app does not currently synchronize this state to a This Week server.

## 2. What the host receives

GitHub Pages and ordinary internet infrastructure still receive normal requests needed to deliver the static site.

The current application JavaScript does not upload financial records to an application backend.

The app should therefore not be described as having zero network exposure. Static page delivery still exists.

## 3. No app-level encryption at rest

This Week does not encrypt browser localStorage itself.

Anyone who can access:

- the unlocked device;
- the browser profile;
- browser developer tools;
- a compromised browser extension;
- compromised local browser data

may be able to read stored This Week data.

The current local-storage design is a convenience and zero-infrastructure architecture, not an encrypted financial vault.

## 4. Data minimization

The current planner does not require:

- legal name;
- email address;
- phone number;
- Social Security number;
- bank username/password;
- provider access token.

A randomly generated local app user ID is used for relationships inside the browser data model. It is not an authentication credential.

## 5. Provider credentials

Provider:

- access tokens;
- refresh tokens;
- API keys;
- client secrets;
- passwords

must not be stored in the current browser-local model.

The Phase 13 provider contract explicitly requires future provider secrets to be stored server-side.

## 6. Imported transaction files

Supported local import file types:

- CSV
- TSV
- plain text

Current safety limits:

- 5 MB maximum file size;
- 10,000 data rows;
- 64 columns;
- bounded cell/description length;
- supported text-file extension/MIME validation;
- integer-cent amount range checks;
- valid transaction-date requirement.

Imported text is normalized and treated as data.

The app does not intentionally execute imported:

- HTML;
- JavaScript;
- event-handler attributes;
- script URLs.

Displayed imported strings are HTML-escaped.

Control characters and Unicode bidirectional override/isolate characters are removed from imported text.

## 7. Import trust boundary

Imported records are not automatically treated as weekly spending.

The transition remains:

`file import -> preview -> confirm import -> review -> reconcile -> weekly transaction`

Pending records and inflows remain reference data unless product rules explicitly say otherwise.

This protects the Plan from silent mutation by imported activity.

## 8. Financial source labels

The product distinguishes:

### Plan-derived

Examples:

- Available Now;
- weekly category room;
- required-by-today bill protection;
- planned savings.

These are calculations from the This Week planning model.

They are not bank balances.

### Imported

Transaction records parsed from a local export file.

They remain separate until explicitly reconciled.

### Reconciled

An imported posted outflow explicitly applied to a This Week category.

It affects the weekly plan while retaining import provenance.

### External balance

No live account balance is currently connected.

Available Now must not be presented as an external bank balance.

## 9. Content Security Policy

The current static page uses a Content Security Policy that restricts application network and embedding behavior.

Current important directives include:

- `connect-src 'none'`
- `object-src 'none'`
- `frame-src 'none'`
- `child-src 'none'`
- `worker-src 'none'`
- `base-uri 'none'`
- `form-action 'none'`
- `script-src-attr 'none'`

Inline JavaScript is allowed only through explicit SHA-256 hashes of the two application script blocks.

The regression checker verifies those hashes against the current script contents.

Inline CSS remains necessary for the current monolithic static build.

The CSP is an additional defense boundary. It is not a complete substitute for secure coding or future server security.

## 10. No dynamic-code execution

The production source is checked to prevent:

- `eval()`;
- `new Function()` in the application runtime;
- inline `onclick` attributes;
- inline `onsubmit` attributes.

The static regression checker itself may compile source text in Node for syntax validation; that does not become part of the production browser runtime.

## 11. Network-exfiltration guard

The current browser-only architecture intentionally contains no application:

- `fetch()`;
- `XMLHttpRequest`;
- `WebSocket`;
- `sendBeacon`.

The static regression checker rejects these patterns in the current application source.

A future backend phase must deliberately revisit this boundary rather than silently adding network transmission.

## 12. Export behavior

Financial exports are created locally on user request.

Current export types include:

- normalized portable financial data;
- raw local This Week browser-state export;
- schema-only manifest;
- portable JSON Schema.

Financial-data exports require an explicit acknowledgement that the resulting file can contain sensitive financial information.

After download, the file is outside This Week's control.

The user is responsible for storing or deleting exported copies.

## 13. Delete-local-data behavior

The Privacy & Local Data screen can remove all browser storage keys beginning with:

`thisweek.`

Deletion requires:

1. opening the delete flow;
2. typing `DELETE`;
3. an explicit final confirmation.

After the removal attempt, the app verifies whether any `thisweek.*` keys remain before reporting success/reloading.

This deletion does not remove:

- previously downloaded exports;
- browser/device backups;
- hosting/server access logs;
- copies manually saved elsewhere.

## 14. High-impact financial mutations

High-impact state changes use explicit confirmation where appropriate, including:

- editing an existing Plan;
- starting a new week;
- undoing import reconciliation;
- undoing imported batches;
- clearing import metadata;
- deleting local app data.

Routine deliberate actions such as submitting a new spending entry remain explicit user actions without adding an unnecessary second confirmation to every entry.

## 15. Local trust self-audit

The Privacy & Local Data route can run read-only trust checks covering:

- browser-local storage scope;
- provider-secret-shaped fields;
- external runtime dependencies;
- CSP network-exfiltration boundary;
- import limits;
- imported control-character sanitization;
- imported text escaping;
- provider secret boundary;
- portable restore boundary;
- high-impact confirmation path;
- verified local deletion path;
- sensitive-export acknowledgement.

The audit does not upload data.

## 16. Portable restore remains disabled

The app can:

- serialize;
- export;
- parse;
- validate

portable data.

It does not currently apply a portable export back into live state.

A future restore capability requires:

- backup/rollback;
- schema migration;
- conflict handling;
- overwrite/merge semantics;
- explicit confirmation.

## 17. Threats this architecture does not solve

The current static browser-local build does not protect against every threat.

Examples outside its security boundary include:

- a compromised operating system;
- a compromised browser;
- malicious browser extensions;
- physical access to an unlocked device;
- screenshots or screen recording;
- malware reading browser storage;
- stolen downloaded exports;
- compromised hosting infrastructure;
- future backend vulnerabilities that do not yet exist in this build.

These risks should not be hidden by describing localStorage as secure storage.

## 18. Future backend requirements

Before live multi-device sync or financial-provider integration, This Week still requires:

- authentication;
- authorization;
- secure session management;
- server-side validation;
- encrypted provider-token storage;
- provider consent;
- audit/event logging appropriate to the backend;
- rate limiting;
- abuse controls;
- conflict detection;
- secure deletion semantics;
- privacy policy review;
- incident-response planning.

These are intentionally deferred instead of being simulated in the current client.

## 19. Reporting a security issue

Until a dedicated security-reporting process exists, security issues should be handled through the repository owner rather than exposing sensitive financial examples in a public issue.

Do not include:

- bank exports;
- account numbers;
- credentials;
- access tokens;
- private financial data

in a public bug report.
