# TAGJ × Benny Bundles — V14.8 Baseline

Branch: `tagj-v12-preview`

Current source head at documentation time: `2945c5e02fc5bc00b6373eeb9992ee96697d0aa0`

Rollback branch:
`rollback/tagj-v14.7-assets-2026-09-19` → `e7eabef767b554e3cb4e37e50da5772190fb006a`

## Protected architecture
- V12/V12.3 center/home experience retained.
- Intro and four-world gateway architecture retained.
- iPhone-first interaction constraints retained.
- New assets remain deeper in their appropriate worlds rather than moving onto the homepage.

## V14.7 asset integration
Optimized preview assets committed under `tagj-assets/v147/`:
- apparel-brand.webp
- network-creative.webp
- footwear-series.webp
- audio-engineer.webp
- concrete-mids.webp
- concrete-pump.webp
- vault-heel.webp
- nonstick.webp

Routes:
- /full.html#tagj-catalogue-v147
- /full.html#tagj-footwear-v147
- /full.html#tagj-audio-engineer-v147
- /full.html#tagj-concrete-bloom-mids-v147
- /full.html#tagj-concrete-bloom-pump-v147
- /full.html#tagj-vault-heel-v147
- /full.html#tagj-nonstick-v147
- /full.html#artist-network-v147
- /full.html#artist-cry-dark-v147
- /full.html#creative-proof-v147

## V14.8 interaction layer
The five primary new footwear model dossiers now receive mobile-friendly colorwave inspectors:
- TAGJ-018 Audio Engineer Low Tops — 6 directions
- TAGJ-017 Concrete Bloom Mid Tops — 6 directions
- TAGJ-017 Concrete Bloom Pump — 6 directions
- Bank Vault Heel High Tops — 6 directions
- TAGJ-013 Non-Stick Slip-On / Diamond Dust Knit — 7 directions

Inspector behavior:
- tap/swipe colorwave navigation
- live colorway name, palette and direction copy
- local persistence of selected colorwave
- copy prepared colorwave brief
- carry selected colorwave into TAGJ Custom Clothing Request intake
- explicit concept/inventory/commerce boundary

## Commerce guardrail
Concept art is not treated as inventory. Inventory remains unconfirmed, checkout disabled, and Stripe price IDs null until intentionally configured.

## Data contract
`tagj-data/catalog.v1.json` contains:
- 18 product/concept records
- 9 release/visual records
- 3 curated asset collections
- previewAsset mapping for the five V14.7 primary footwear model dossiers

## Build
`scripts/build-tagj-preview.sh` copies `tagj-assets/v147/*` into the deployed static output and writes `V14.8` to VERSION.txt.

## QA
At the V14.8 source gate:
- full.html JavaScript syntax: PASS (11/11)
- index.html JavaScript syntax: PASS
- duplicate IDs: 0
- broken internal hash targets: 0
- full.html closing documents: 1
- catalogue JSON: PASS
- V14.7 asset files in Git tree: 8
- build script asset-copy rule: PASS

## Deployment
Vercel preview deployment for commit `2945c5e02fc5bc00b6373eeb9992ee96697d0aa0` reached READY.
