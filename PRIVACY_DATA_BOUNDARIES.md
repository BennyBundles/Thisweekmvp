# This Week — Privacy & Data Boundaries

This document describes the current browser-local application boundary. It is not a legal privacy policy.

## Where financial data lives today

The current application stores financial planning state in browser storage on the device/browser where the app is used.

Persistent data uses localStorage.

Temporary navigation/scenario state may use sessionStorage.

The application currently has no This Week backend account or cloud synchronization service.

## What the app stores

Depending on which features are used, local data can include:

- randomly generated local user ID;
- pay-plan configuration;
- bills and due dates;
- weekly category allocations;
- recorded purchases;
- weekly history;
- planned savings;
- savings goals;
- imported transaction records;
- import provenance;
- reconciliation metadata;
- presentation preferences;
- temporary recommendation state;
- Scenario Sandbox session assumptions.

## What the app does not currently require

The setup flow does not require:

- legal name;
- email address;
- password;
- phone number;
- mailing address;
- bank username/password;
- provider access token.

## Plan data versus imported data

### Plan-derived data

Calculated from configuration and activity recorded in This Week.

Examples:

- Available Now
- category remaining
- bill protection
- planned savings

These are planning values.

They are not live bank balances.

### Imported data

Transaction rows loaded from a local text/CSV/TSV file.

Imported rows stay separate until explicitly reconciled.

### Reconciled data

A posted imported outflow that the user deliberately assigns to a This Week category.

The applied weekly transaction retains import provenance.

## Import safety

Current limits:

- 5 MB maximum file size;
- 10,000 data rows;
- 64 columns;
- bounded text-field lengths.

Imported text is normalized and control characters are removed.

Imported values are rendered as text/escaped markup, not executed as code.

## Connected accounts

There is no active live financial-provider connection.

Provider tokens or credentials must not be stored in the current browser-local model.

A future live connection requires server-side credential storage and a reviewed authentication/security design.

## Exports

The app can create local downloads containing financial data.

Available exports include:

- normalized portable financial JSON;
- schema manifest;
- portable JSON Schema;
- raw This Week browser-local key export.

Downloaded files are outside the app's browser-storage controls.

The user is responsible for how those files are stored or shared.

## Deleting local data

The Privacy & Local Data route can remove This Week application keys from the current site's localStorage and sessionStorage.

Deletion requires typed confirmation plus a final high-impact confirmation.

The app cannot delete:

- copies already downloaded;
- browser/device backups;
- external files;
- hosting-platform logs.

## Hosting

The static application is served through GitHub Pages.

Financial application data is not posted to a This Week backend because no such backend is active.

The hosting platform and network providers may still process ordinary request metadata required to deliver the webpage.

## Future backend boundary

Before cloud synchronization or live provider connections are added, the product requires:

- authentication;
- authorization;
- encrypted server-side secret/token storage;
- server-side validation;
- privacy review;
- provider consent;
- conflict handling;
- data-deletion semantics;
- documented retention behavior.

Those capabilities are not simulated in the current browser-only version.
