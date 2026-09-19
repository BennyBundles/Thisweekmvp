# TAGJ × Benny Bundles — V14.5 Baseline

Branch: `tagj-v12-preview`

Rollback:
`rollback/tagj-v14.4-2026-09-19` → `d6a6db1de19e3d2e1cc1b74d6350e58d67d26355`

## Protected architecture
- V12/V12.3 intro and center gateway retained.
- Four-world directional homepage retained.
- Home remains intentionally compact.
- No merge into the unrelated This Week production application.

## Level 06 additions

### TAGJ — Atelier Board
Route: `#tagj-technical-board-v145`

- Follows the selected Product Dossier concept.
- Layers: concept, materials, construction, branding, campaign, status.
- Uses approved house imagery only when the mapping is defensible.
- Falls back to a neutral schematic state when a concept-specific board is not mapped.
- Pointer inspection / zoom behavior.
- Inventory and commerce remain explicitly unconfirmed/disabled.

### Artist — Release Scene
Route: `#artist-release-scene-v145`

- Follows the selected Release Dossier record.
- Layered cinematic poster-stage treatment.
- Local campaign-readiness checklist for artwork, video, streaming links, Shorts and metadata.
- No publishing occurs.
- No release date is inferred.
- Pending release URLs remain governed by the verified link registry.
- Cold Winter exact intro source remains unverified.

### Producer — Beat Workspace
Route: `#producer-beat-workspace-v145`

- Local audio-file preview using browser object URLs.
- Working title, BPM, key, mood tags and license-intent fields.
- Generates a beat-inquiry summary.
- Does not upload audio.
- Does not invent beat inventory.
- Does not sell a license or take payment.

### Producer — Session Builder
Route: `#producer-session-builder-v145`

- Production / Recording / Mixing / Mastering / Engineering chain.
- Can mirror armed Signal Matrix services.
- Project, deadline and session-note handoff.
- Produces planning state only.
- No booking or payment.

### Creative — Campaign Workflow
Route: `#creative-campaign-workflow-v145`

- Five-stage workflow: Brief → Concept → Build → Review → Delivery.
- Deliverable stack adapts to the selected Service Dossier.
- Supports Cover Art, Visualizer, Music Video, YouTube/SEO and Shorts.
- Stage/deliverable completion is local planning state only.
- Structured request wizard remains the handoff path.

## Data layer
Updated:
- `tagj-data/catalog.v1.json` with execution routes.

Added:
- `tagj-data/workflow.v1.json`

Existing contracts retained:
- `tagj-data/link-registry.v1.json`
- `tagj-data/request-schema.v1.json`

## Source-integrity incident + recovery
A final accuracy edit initially used a ranged GitHub fetch and would have truncated `full.html`.
The final QA gate detected the problem immediately.
The complete V14.5 document was restored from verified blob:
`51aaf9ef9ccd95e6dd2bc087fc2d9f0659a4b273`
and the intended accuracy / World Map changes were reapplied.

Final recovered full.html blob:
`19cc39e63ad19afa210296b4ef0b503acf088012`

## Final QA gate
- `index.html`: JavaScript PASS
- `full.html`: 9/9 JavaScript blocks PASS
- duplicate static IDs: 0
- broken static internal hash targets: 0
- HTML closing documents: 1
- catalogue JSON: PASS
- link registry JSON: PASS
- request schema JSON: PASS
- workflow JSON: PASS
- all five V14.5 Level 06 sections present

## Build
`scripts/build-tagj-preview.sh` now marks the static build as V14.5.

Do not treat an older Vercel deployment as V14.5 unless its Git commit matches this branch after the deployment rate limit clears.
