# TAGJ × Benny Bundles — V14.3 Baseline

Branch: `tagj-v12-preview`

## Protected baseline
- V12/V12.3 center/home architecture retained.
- iPhone-oriented intro interaction structure retained.
- Four-world directional gateway retained.
- No production merge into the unrelated This Week main branch.

## V14.3 additions
### TAGJ
- Level 05 Product Dossier
- Concept selector for named TAGJ concepts
- Progressive tabs: Concept, Materials, Colorways, Construction, Branding, Campaign, Status
- Concept/inventory/checkout status kept separate

### Artist
- Level 05 Release Dossier
- Selected-release visual stage
- Watch/listen/credits/campaign/source-status views
- Cold Winter exact requested intro source remains explicitly unverified

### Producer / Engineer
- Level 05 A/B Lab
- Local Before/After audio file loading using browser object URLs
- No upload or backend transfer
- Position-preserving A/B switching attempt
- Mix/master request routes

### Creative
- Level 05 Service Dossier
- Cover Art, Visualizer, Music Video, YouTube/SEO and Shorts detail modes
- Starting prices use existing project values only
- Reusable structured request wizard

## Request engine
The preview request wizard supports:
- Cover Art Request
- Music Video Request
- Visualizer Request
- Custom Creative Request
- Feature Request
- Appearance Request
- Beat Inquiry
- Mix Request
- Mastering Request
- Recording Request
- TAGJ Custom Clothing Request
- Collaboration Request
- General Contact

Preview behavior:
- Drafts can persist in localStorage when available
- Brief can be copied/shared locally
- No backend submission
- No payment
- No fake file upload

## Structural repairs
- Removed corrupted duplicate markup after the first valid closing HTML document
- Fixed active-world state for mobile depth navigation
- Repaired homepage search-index JavaScript separators
- Removed unconfigured automatic bundle discounts

## QA
- index.html JavaScript syntax: PASS
- full.html JavaScript syntax: PASS (7/7 script blocks)
- Duplicate IDs: 0
- Broken internal hash targets: 0
- full.html closing HTML documents: 1

## Deployment status
Latest source is newer than the currently served Vercel TAGJ preview.

GitHub/Vercel status reports:
`Deployment rate limited — retry in 24 hours.`

Do not treat the currently served older preview as the V14.3 source baseline.
