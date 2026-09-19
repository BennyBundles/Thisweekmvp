# TAGJ × Benny Bundles — V14.4 Baseline

Branch: `tagj-v12-preview`

Rollback branch:
`rollback/tagj-v14.3-2026-09-19` → `8daba5417b108515d7172278ae00ddd89596664b`

## Protected architecture
- V12/V12.3 intro + central four-world gateway retained.
- iPhone-focused intro interaction structure retained.
- Home remains compact and directional.
- No merge into the unrelated This Week production application.

## V14.4 additions

### Stable deep routing
Products, releases, creative services and studio-service selections now have stable hash routes so a specific detail state can be linked and revisited with browser back/forward behavior.

Examples:
- `#tagj-product-shadow-v144`
- `#artist-release-cold-v144`
- `#producer-service-mixing-v144`
- `#creative-service-youtube-v144`

### TAGJ
- Product Dossier routes for the named concept records.
- Registry selection stays compact; deeper dossier opens only when requested.
- Concept/development state remains separate from inventory and checkout state.

### Artist
- Release Dossier stable routes.
- Link registry UI.
- Verified links render clickable.
- Pending per-release video/streaming links remain disabled.
- Existing Benny Bundles YouTube channel route is the only currently verified external destination in the registry.
- Cold Winter exact requested intro source remains unverified.

### Producer / Engineer
- Stable studio-service routes for Production, Recording, Mixing, Mastering and Engineering.
- Existing local-only A/B audio lab retained.
- Studio request context can be carried into the request payload.

### Creative
- Stable routes for Cover Art, Visualizer, Music Video, YouTube/SEO and Shorts.
- Service-specific request fields are now generated from the selected service.
- YouTube and Shorts no longer fall through to one generic creative form.

### Request engine
Backend-shaped request payload exposed as `tagj.request.v1`.

Payload groups:
- meta
- context
- request
- constraints
- contact
- special

Preview-only behavior remains explicit:
- no backend POST
- no file upload
- no payment
- local draft persistence where storage is available
- copy/share human-readable brief
- copy backend-ready JSON

### Data contracts
- `tagj-data/catalog.v1.json`
- `tagj-data/link-registry.v1.json`
- `tagj-data/request-schema.v1.json`
- `tagj-data/README.md`

The preview build configuration now copies `tagj-data` into the static output.

### Mobile navigation
- Cross-world transition pulse does not intercept pointer events.
- Compact world-specific mobile rail is hidden on the central home.
- Reduced-motion behavior is respected.

## QA
At the V14.4 gate:
- `index.html` JavaScript syntax: PASS
- `full.html` JavaScript syntax: PASS (8/8 blocks)
- duplicate static IDs: 0
- broken static internal hash targets: 0
- HTML closing documents: 1
- catalogue JSON: parses
- link registry JSON: parses
- request JSON schema: parses

## Deployment
Source can continue to advance while the connected Vercel project is build-rate-limited. Do not treat the older served preview as the V14.4 source baseline until Vercel accepts a new preview build.
