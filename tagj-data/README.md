# TAGJ data contracts — V14.4

These files separate display/UI state from future backend and commerce state.

- `catalog.v1.json` — concept, release and service identifiers plus stable deep routes.
- `link-registry.v1.json` — external-destination verification state. Pending links must not render as clickable destinations.
- `request-schema.v1.json` — payload contract emitted by the V14.4 request wizard.

## Commerce boundary

Product/service UI fields are intentionally separated from future Stripe fields:

- display price
- sale price
- Stripe price ID
- product/service ID
- inventory/development status

A concept render is not inventory. A displayed starting price is not a charge. Stripe IDs remain null until configured.

## Preview request boundary

The current request wizard can prepare, save, copy and share a structured brief locally. It does not POST to a backend, upload files or take payment.

## Media boundary

The producer A/B lab uses temporary browser object URLs for user-selected local audio. Those files are not uploaded.

## Link verification

Only the existing Benny Bundles YouTube channel route is marked verified in the current registry. Per-release streaming/video destinations remain pending until exact URLs are supplied or verified.


## V14.5 execution workflow

- `workflow.v1.json` — Level 06 client-side execution architecture for product development, artist release campaigns, beat inquiries, studio sessions and creative campaigns.

Workflow state in this preview is planning state only. It does not book sessions, publish releases, upload audio, change inventory, or create payments.
