# Phase 7 — Connected Data Center Hardening

**Status:** Implemented in production source  
**App commit:** `828757c1200ee79e4c9d07dd5e290abeb7192bf3`  
**Phase 0 rollback branch:** `baseline-phase-0-2026-09-18`

## Objective

Phase 7 makes imported financial activity safer, more reversible, more traceable, and more useful without pretending the static app has a live bank connection.

The operational model is now:

`Import file → Preview → Confirm import → Review / Defer → Reconcile → Correct or Undo if needed`

Planning values and imported actuality remain separate until the user explicitly reconciles a posted outflow.

---

## 1. Resilient local transaction-file parsing

The import parser now supports:

- comma-delimited CSV;
- tab-delimited exports;
- semicolon-delimited exports;
- UTF-8 BOM removal;
- quoted fields;
- escaped quotes;
- quoted line breaks;
- duplicate/blank column-header normalization;
- debit and credit columns;
- single signed amount columns;
- common transaction-date labels;
- common merchant/payee/description labels;
- common pending/status labels;
- currency punctuation;
- parenthetical negative amounts;
- CR/DR-style amount text;
- Excel-style numeric date serials;
- common MM/DD/YYYY date formats.

The parser still runs locally in the browser.

No imported file is uploaded by This Week.

---

## 2. Import preview before persistence

Choosing a transaction file no longer immediately writes the imported rows into Connected Data.

The user first sees a **Preview before import** screen containing:

- total parsed rows;
- number of new records;
- duplicate count;
- pending count;
- inflow count;
- sample transaction rows.

The user must explicitly choose **Import N new records**.

Canceling the preview leaves Connected Data unchanged.

---

## 3. Stronger duplicate prevention

Imported rows now receive deterministic transaction fingerprints using:

- transaction date;
- normalized description;
- amount;
- direction;
- occurrence number for otherwise-identical rows.

Before import confirmation, those fingerprints are compared with:

1. existing Connected Data records; and
2. external IDs already applied to the core weekly transaction ledger.

This matters when the user:

- imports the same export twice;
- clears import-review metadata and later imports an already-applied transaction again;
- imports overlapping bank-export date windows.

Detected duplicates are excluded before confirmation and shown in the preview count.

Duplicate matching remains intentionally conservative; an institution-provided stable transaction ID would be preferable once a real provider connection exists.

---

## 4. Explicit review states

Connected Data now uses clear record states:

### Unmatched
A posted outflow that is waiting for category confirmation.

### Deferred
A posted outflow the user intentionally postponed.

Deferred records no longer contribute to the Home “needs review” badge.

They remain recoverable through the Deferred view.

### Reconciled
A posted outflow explicitly applied to a This Week spending category.

### Pending
A pending transaction held as reference only.

### Reference
An imported inflow retained as context but not silently converted into Available Now.

The interface has filter controls for:

- Review
- Deferred
- Applied
- Reference
- All

---

## 5. Defer / restore workflow

Any unmatched posted purchase can be deferred.

This allows the user to intentionally clear the actionable review queue without:

- deleting the transaction;
- applying it to the weekly plan;
- pretending the transaction is resolved.

Deferred records can later be restored to the review queue.

---

## 6. Reconciliation provenance

Every imported record now carries clearer provenance information in Connected Data:

- source file / source name;
- transaction date;
- import date;
- posted/pending state;
- reconciliation state.

Core imported transactions also retain an `importSource` field when reconciled.

This does not change the mathematical treatment of the transaction; it preserves traceability.

---

## 7. Reconciliation history and correction

Applied imported transactions are no longer a one-way operation.

### Change category

A reconciled transaction can be reassigned to another currently available spending category.

The core weekly transaction is reclassified by:

1. removing the amount from the prior category’s recorded spending;
2. applying the amount to the new category;
3. updating the imported transaction’s category metadata;
4. regenerating the week’s calculated state.

The imported transaction itself is not duplicated.

### Undo reconciliation

A reconciled import can be reversed.

Undo:

- removes the imported transaction from the core weekly ledger;
- removes its external ID from the applied-import set;
- restores the Connected Data record to the unmatched review queue;
- updates weekly category balances.

A confirmation is required before undoing.

---

## 8. Import batch history

Each confirmed import creates a batch record containing:

- source name;
- import time;
- row count;
- number added;
- duplicates excluded;
- record IDs;
- external transaction fingerprints.

Recent import batches are visible under **Import history**.

---

## 9. Undo last import

The latest import batch can now be undone.

If none of its records were reconciled:
- its imported review records are removed.

If some records were already reconciled:
- the app explicitly warns the user;
- reconciled core transactions from that batch are reversed;
- then the batch records are removed.

A batch reverse endpoint performs the core reversal as one local state operation before the Connected Data metadata is removed.

---

## 10. Connected-data audit trail

Phase 7 adds a local audit trail for actions such as:

- import confirmed;
- review deferred;
- deferred record restored;
- transaction reconciled;
- category corrected;
- reconciliation undone;
- import batch undone;
- metadata cleared.

The audit trail is informational and stored locally.

It is not a regulated bank audit log and should not be represented as one.

---

## 11. Clear-data behavior is safer

**Clear imported data** is now **Clear import metadata**.

The user receives an explicit confirmation explaining that:

- imported review/history metadata will be removed from the browser;
- transactions already reconciled into the weekly plan will remain in that plan.

This prevents a “clear imports” action from silently rewriting financial history.

If the user later reimports the same applied records, core imported external IDs still participate in duplicate detection.

---

## 12. Live bank connection remains deliberately deferred

The Direct Bank Sync section remains visibly inactive.

The app now shows the architectural split:

### Ready locally
- import;
- preview;
- duplicate detection;
- review;
- defer;
- reconciliation;
- correction;
- provenance;
- undo.

### Still required for real institution sync
- institution consent;
- secure provider token handling;
- backend infrastructure;
- reconnect flows;
- provider credentials;
- security/privacy review.

No provider credentials are embedded into the static client.

---

## 13. Data model migration

The same persistent key remains:

`thisweek.connectedData.v1`

The payload is internally normalized to a version-2 structure so existing users do not need to lose their prior import data.

Older records are migrated in memory into the newer review-state model.

Additional structures include:

- `version`;
- `batches`;
- `sources`;
- `audit`;
- per-record `reviewState`;
- `batchId`;
- `importedAt`;
- category provenance after reconciliation.

Keeping the existing storage key avoids breaking previous installations while allowing the model to evolve.

---

## 14. Trust rules preserved

Phase 7 preserves these product guarantees:

- importing does not modify the weekly plan;
- preview does not persist records;
- pending transactions are not applied;
- imported deposits are not turned into Available Now;
- posted outflows require explicit reconciliation;
- deferred does not mean reconciled;
- category suggestions remain suggestions;
- corrections and undo are explicit user actions;
- Connected Data does not claim to be a live account feed;
- bank balances still do not replace Available Now.

---

## 15. Validation

The Phase 7 source was statically validated after implementation.

Verified markers include:

- resilient delimited-text parser;
- preview-before-import layer;
- duplicate-prevention logic;
- deferred review state;
- local audit trail;
- import-batch history;
- undo-last-import path;
- undo-reconciliation endpoint;
- reconciliation reclassification endpoint;
- imported source provenance;
- clear-metadata confirmation.

Both application JavaScript blocks compile successfully.

## Remaining real-device / sample-data gate

Phase 7 still needs hands-on verification with representative institution exports, especially:

- quoted multi-line descriptions;
- debit/credit-column exports;
- signed-amount exports;
- Excel-style dates;
- duplicate overlapping exports;
- two legitimate identical purchases on the same date;
- old reconciled records after metadata clear/reimport;
- batch undo after several reconciliations;
- category correction after Plan changes;
- iPhone file picker behavior;
- large import performance;
- VoiceOver reading order in the review queue.
