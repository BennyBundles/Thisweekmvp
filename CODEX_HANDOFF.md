# TAGJ × Benny Bundles — Codex handoff

Updated 2026-10-01. Source audit complete; browser/device acceptance remains outstanding.
This supersedes the initial blocked draft. The repository was located through the user-supplied Vercel deployment and refreshed to the current branch. This update changes documentation only and preserves all existing site work.

## Repository and release identity

- Repository: https://github.com/BennyBundles/Thisweekmvp
- Working branch: `tagj-v12-preview`. **Do not merge into main: that branch belongs to the separate This Week application.**
- Audited application commit: `335da796b1d978d5e352acd21cd9f671bb7ea481` (“Update Beat Vault playback guidance”).
- Build marker: `V15.28`. V14.x is historical; do not redeploy V14.8 over the newer implementation.
- Local checkout in this task: `work/tagj-repo`; clean after refresh, before documentation and generated build output.
- Vercel team: `brief2delivery`, ID `team_1IUKB2YlLGdxoPy5qF216LYB`.
- Vercel project: `brief2delivery-app-v041`, ID `prj_EEdNo0XTBESrOiuZf3yQzHd3QTvD`.
- Existing branch alias: https://brief2delivery-app-v041-git-tagj-v12-preview-brief2delivery.vercel.app
- Latest deployment observed before this handoff: `dpl_91ED2TpcJvKszzfJ8Uj979rHFWtX`, READY, preview target (target null), commit `335da796b1d978d5e352acd21cd9f671bb7ea481`, URL https://brief2delivery-app-v041-fx69s0ieq-brief2delivery.vercel.app .
- User-supplied historical URL: https://brief2delivery-app-v041-fgjdivkmk-brief2delivery.vercel.app — READY deployment `dpl_5N29ocH9hhVQa2PJEZwhp8AYCR77`, commit `cf07a3aca14bb489c89f94cf29d516e7a4d18bd3` (V14.8 documentation). It is not the current branch.
- Production domain, production branch setting, and promotion status are not verified. Keep this release on the existing TAGJ preview branch/project; do not repoint unrelated production aliases.
- Vercel project-detail connector has inconsistent input schemas and could not return settings. Deployment metadata and repository configuration establish the IDs and source association above.
- The referenced ChatGPT conversation `6aadfb28-06a0-83e9-aba2-963deaf19dfe` timed out. Code, Git history, existing baseline documents, and Vercel records are the evidence for this handoff.

## Preservation requirements

Preserve V12/V12.3 cinematic intro → compact directional four-world gateway → deep worlds. The worlds are TAGJ, Artist, Producer / Engineer, and Creative. Keep the home compact, retain artwork and interaction depth, and make targeted repairs rather than a rebuild. Do not invent media, URLs, inventory, payments, bookings, uploads, backend submissions, or delivery confirmations.

Existing older Markdown documents for This Week are retained historical repository material, not instructions to transform TAGJ into the finance app.

## Architecture and ownership

This branch is a static HTML/CSS/JavaScript site, despite historical Vercel metadata naming Next.js. The authoritative `vercel.json` sets `framework: null`, an empty install command, and static output `.tagj-dist`. There is no package manifest or dependency-install step.

- `index.html`: cinematic gate, intro bootstrap, four-world gateway, compact search, replay link.
- `tagj-assets/index-v1528.js` and `index-v1528.css`: deferred homepage behavior and consolidated styling.
- `tagj.html`, `artist.html`, `producer.html`, `creative.html`: real standalone entry pages since V15.13.
- `full.html`: shared deep ecosystem with hash routes; `tagj-assets/full-v1528.js` and `full-v1528.css` own its runtime/styles.
- `tagj-assets/runtime-stability.js`: shared navigation hardening.
- `tagj-sw.js`: activation deletes old `tagj-nav-` caches; intentionally no fetch handler. Do not reintroduce stale route interception.
- `tagj-data/`: explicit content, verification, business, workflow, and licensing contracts. Some UI data remains embedded in HTML/JS: changing JSON alone is not proof that every UI consumer changed.
- `scripts/build-tagj-preview.sh`: builds the static package.
- `scripts/check-tagj-static.mjs`, `scripts/check-tagj-package.mjs`: existing validation gates.
- `.github/workflows/tagj-preview-qa.yml`: branch-scoped static/build/package QA. Its path filters omit documentation-only changes, so local validation remains recorded here.

## Route map

See [CODEX_ROUTE_ASSET_INVENTORY.md](CODEX_ROUTE_ASSET_INVENTORY.md) for every physical HTML path, full.html ID, packaged asset size/hash, and JSON top-level contract keys at the audited application commit.

| Surface | Canonical physical route / behavior |
| --- | --- |
| Cinematic gateway | `/`, `/index.html`; explicit replay `/?intro=1#home` |
| Legacy preview | `/preview` and `/preview.html` redirect to `/` |
| World entrances | `/tagj.html`, `/artist.html`, `/producer.html`, `/creative.html` |
| Deep ecosystem/map | `/full.html` with stable hashes; `#home` is the internal ecosystem map |
| Music | `/music/index.html`; wanted-me-gone, cant-crop-karma, hold-something, freestyle, cried-in-the-dark, the-whole-brand HTML detail pages |
| Beats/catalogue/services | `/beats/index.html`, `/catalogue/index.html`, `/services/index.html` |
| Network | `/network/index.html`, `/network/bsf-tone-066.html`, `/network/t311y-demon-life.html` |
| Creative proof | `/creative/index.html`, `/creative/portfolio.html`, case-bsf-tone-066 and case-t311y-demon-life HTML pages |
| Contact/licensing/recovery | `/contact.html`, `/licensing.html`, `/404.html` |

Vercel supports clean aliases for home/full/four worlds/contact/licensing/network/profiles/creative portfolio/cases/services/beats/music/catalogue. Read the exact rewrite array in `vercel.json`; physical HTML routes are the portable source of truth.

Important deep routes retained:
- Product: `#tagj-product-shadow-v144`; model catalogue `#tagj-catalogue-v147`, `#tagj-footwear-v147`.
- Models: `#tagj-audio-engineer-v147`, `#tagj-concrete-bloom-mids-v147`, `#tagj-concrete-bloom-pump-v147`, `#tagj-vault-heel-v147`, `#tagj-nonstick-v147`.
- Artist: `#artist-release-cold-v144`, `#artist-network-v147`, `#artist-cry-dark-v147`.
- Studio/service examples: `#producer-service-mixing-v144`, `#creative-service-youtube-v144`.
- Level 06: `#tagj-technical-board-v145`, `#artist-release-scene-v145`, `#producer-beat-workspace-v145`, `#producer-session-builder-v145`, `#creative-campaign-workflow-v145`.

## V14.x implemented history

These are source/history findings, not new live-device QA claims. Read the linked baseline documents for details and historical test results.

| Version | Implemented work and references |
| --- | --- |
| V14 / V14.1 | Release rooms, product lab, studio labs, campaign depth and search indexing (`472d71d`, `8bf02b2`); iPhone portal fallback/intro fixes (`1137f61`, `507b82f`). |
| V14.2 | Deeper product/release/studio/creative systems (`6a64fde`); search index; scope subtotal repairs and removal of unconfigured bundle discounts (`965c557`). |
| V14.3 | Level 05 Product Dossier and concept/material/colorway/construction/branding/campaign/status views; Release Dossier; local-only A/B audio lab; service dossier and structured request wizard. Repaired duplicate document markup, active-world behavior and search separators. [Baseline](TAGJ_V14_3_BASELINE.md), `957d2ae`, `8daba54`. |
| V14.4 | Stable product/release/studio/service hash routes; service-specific request fields; `tagj.request.v1`; catalogue/link/request contracts; mobile rail and pointer-safe transition behavior. [Baseline](TAGJ_V14_4_BASELINE.md), `15d45f2`, `3b3e37d`. |
| V14.5 | Level 06 Atelier Board, Release Scene readiness checklist, local Beat Workspace, Session Builder, Campaign Workflow; execution contract and global-search/world-map integration. Recovered full.html after ranged-fetch truncation. [Baseline](TAGJ_V14_5_BASELINE.md), `0664929`, `be10bab`, `7ff5c8f`. |
| V14.6 | No distinct release label established by the inspected history/documents; do not invent one. |
| V14.7 | Eight curated WebP assets, footwear families/model dossiers, catalogue/network/proof routes, preview asset mappings, corrected apparel target and build copying. `882ca37` through `e7eabef`. |
| V14.8 | Colorwave inspectors for five footwear dossiers: tap/swipe, palette/direction text, persistence, copy brief and intake context. Six directions each except Non-Stick with seven. [Baseline](TAGJ_V14_8_BASELINE.md), `b2cda1e`, `cf07a3a`. |
| V14.9 | Same-origin intro video/poster, session gate state and iPhone playback attempts, packaged media (`4410aac`, `c2e8ac0`, `7767b71`). [Historical fix note](TAGJ_V14_9_INTRO_FIX.md) describes an older technical preview, superseded by V15 media. |

## Later work that must remain intact

- V15.0–V15.2: Drive intro source, MP4 compatibility and replay; snapshot `7de7256`.
- V15.3–V15.5: owning-world deep-hash resolution, internal map labeling, session-scoped state and 45-minute resume bridge. [V15.4](TAGJ_V15_4_BASELINE.md), [V15.5](TAGJ_V15_5_BASELINE.md).
- V15.6/V15.7: additional entered-session guard; business/contact metadata; explicit device mail composer handoff, no backend delivery claim. [Contact handoff](TAGJ_V15_7_BUSINESS_CONTACT_IMPLEMENTATION.md).
- V15.8–V15.12: beat catalogue, licensing and sample/provenance contracts, draft license documents, affiliate assets and creative case routes. License drafts and review records are not evidence of executable checkout or completed rights clearance.
- V15.13 onward: real four-world entry pages, network profiles, contact/licensing/recovery pages, music/beats/catalogue/services directories and creative case pages. [Subsites](TAGJ_V15_13_SUBSITES.md).
- V15.20–V15.28: native/portable navigation, recovery/cache fixes, consolidated CSS, extracted assets, deferred shell JavaScript, expanded static/package checks.
- Latest `1ad688e`, `7dd398a`, `335da79`: Drive embedded beat playback/fallback and Safari guidance. Public-browser reliability still needs device testing.

## Assets and media

Build ships 93 files / approximately 18.7 MB at this audit. The inventory lists exact packaged assets and SHA-256 hashes. Preserve source binaries even where the build excludes duplicates.

- Primary intro: `tagj-assets/intro/intro-clip-for-website-v152.mp4`; poster `intro-poster-v149.jpg`. Current build deliberately ships only that MP4 and poster from the intro folder.
- Older V15.5 documentation records source “Intro clip for website”, Drive ID `1CEtochBuGhf3vwOnnrrEmsTlHNVcSAvd`, 6.930 seconds, H.264/HE-AAC. Those codec/source details are historical evidence, not a fresh media probe. The current HTML cut end is 6.93.
- Do not call this the previously requested roughly four-minute lyric clip. That longer source is not established by this audit.
- V14.7 WebPs: apparel-brand, network-creative, footwear-series, audio-engineer, concrete-mids, concrete-pump, vault-heel, nonstick.
- `tagj-assets/media/`: extracted house imagery used by consolidated CSS.
- `tagj-assets/network/`: canonical affiliate assets; current tree includes devils-playground.webp, superseding the older V15.13 “pending transfer” note.
- Beat catalogue contains 22 Drive-backed records. Source IDs/checksums/provenance are retained; direct streaming candidates are explicitly provisional. Do not replace them with invented media or assume Drive access guarantees Safari playback.
- Obsolete a01–a16 CSS and duplicate affiliate binaries remain in source but are omitted from the deployment package.

## Data contracts and integrations

| File | Meaning / consumer boundary |
| --- | --- |
| catalog.v1.json | Stable product/release/service IDs, routes, development and inventory state, commerce fields and preview assets. Baseline V14.8 records 18 concepts, nine releases, three asset collections. Use the current inventory for actual top-level counts. |
| link-registry.v1.json | Verified/pending external destination states. Current global entries include YouTube, Apple Music, Spotify, UnitedMasters, SoundCloud and public business mail, superseding old “YouTube only” docs. Status is repository provenance; this audit did not retest every URL. |
| request-schema.v1.json | JSON Schema for `tagj.request.v1`. Required schemaVersion, requestId, meta, context, request, constraints, contact, special. Meta carries createdAt/sourceWorld/sourceRoute/previewOnly/backendSubmitted/paymentStatus. |
| workflow.v1.json | Product/release/beat/session/campaign local planning contract; no automatic execution or booking. |
| business.v1.json | Legal/display identity, public contact, delivery mode; backendConnected false, device_mailto_handoff, user_must_send_from_mail_client. Do not duplicate the internal routing address into new public marketing copy. |
| beat-catalog.v1.json | 22 records with source/audio/provenance, provisional playback, analysis and availability/commerce distinctions. |
| beat-license-matrix.v1.json / license-system.v1.json | License tiers, delivery and rights boundaries; do not equate UI prices/drafts with working payments. |
| sample-review.v1.json / sample-rights-review.v1.json | Existing sample/provenance findings, not a guarantee of legal clearance. |
| network-assets.v1.json | Affiliate source and asset mapping contract. |

The request flow prepares a brief locally, can save/copy/share it, and opens the device mail client. Opening a composer is not submission. A/B and workspace audio use browser object URLs; no server upload is implemented by those tools. Concept images are not stock. Keep null Stripe IDs, unconfirmed inventory, pending URLs and disabled checkout honest. Outstanding integrations include verified durable media hosting/playback, server-side request delivery, approved inventory/payment configuration, and finalized rights/license review where required.

## Intro bugs: status and exact next steps

Both bugs were reported by the user. Multiple fixes exist in the current source; **neither is certified resolved on iPhone in this handoff**.

### Video/audio not playing

Current `index.html` uses same-origin MP4, playsinline, preload=none and user-triggered sound/muted choices. `index-v1528.js` restores released source URLs before play, calls play directly from the tap path, handles rejected playback, pauses/releases media on completion, and retains skip/error fallback.

Next: use a fresh session and explicit replay; inspect MP4 response/MIME/range behavior, media error and play rejection, currentTime progression, audible sound, muted entry, skip and cleanup. Test Safari/iPhone and desktop Chrome. Verify the actual codec if decode errors occur. Do not remove the intro or promise audible autoplay as a fix.

### Overlay/center reappearing inside worlds

The source contains `tagjIntroSeenV153` session state, `tagjIntroSeenV155At` 45-minute localStorage bridge, `tagjIntroEnteredV156`, deep-link/resume/referrer handling, and owning-world route resolution. The cinematic gate and internal `full.html#home` map are distinct.

Next: test gateway → each of four entries → deep hash → cross-world link → back/forward → refresh → return; repeat after Safari process restoration. Verify `?intro=1#home` intentionally replays. Review interaction of both bootstrap guards if replay remains hidden or storage failure brings the gate back. Do not declare a root cause without reproduction.

Other risks: Drive beat playback and iframe fallback need live Safari checks; stale service-worker state may affect returning devices; historical rate limits occurred but the latest observed deployment is READY. Build marker V15.28 does not identify the exact commit, so always record both.

## Build and QA

Prerequisites: Git, Node.js (this audit used 24.21.0), and POSIX sh (Git Bash on Windows). No npm install required.

From repository root:
```sh
node scripts/check-tagj-static.mjs
sh scripts/build-tagj-preview.sh
node scripts/check-tagj-package.mjs
```

Build removes/recreates only `.tagj-dist`. Vercel runs the latter two commands from vercel.json. For local browsing serve `.tagj-dist` through a static HTTP server; clean alias rewrites are Vercel-specific, so use physical HTML paths locally. No application environment variables are required by this static build; future integrations must document their own configuration without embedding secrets.

Results on audited commit:
- Static regression gate PASS: 27 HTML, nine JSON files, 22 beats.
- Actual existing shell build PASS.
- Packaged integrity PASS: 93 files, 18.7 MB.
- Browser interaction, audio audibility, iPhone/Safari, accessibility and external-provider end-to-end checks: not executed in this audit.
- Historical baseline QA is separate evidence and must not be presented as today's live QA.
- Windows sandbox initially blocked Git Bash startup; the same build succeeded with approved execution outside that restriction.

## Rollback points

These commits exist in inspected history; they are recovery references, not all certified good on every device.

| Purpose | Commit |
| --- | --- |
| Pre-handoff current application | `335da796b1d978d5e352acd21cd9f671bb7ea481` |
| V12 cinematic homepage | `421a2aa3536f184fa4f545500206f6a7f4553d1f` |
| V12 final preview trigger | `ce8ccb28303e44e69664e699d0a645c8b9829276` |
| V14.3 | `8daba5417b108515d7172278ae00ddd89596664b` |
| V14.4 documented rollback target | `d6a6db1de19e3d2e1cc1b74d6350e58d67d26355` |
| V14.7 assets | `e7eabef767b554e3cb4e37e50da5772190fb006a` |
| V14.8 supplied deployment | `cf07a3aca14bb489c89f94cf29d516e7a4d18bd3` |
| V15.2 | `7de7256bbc958080304b25fed88d5690c401ae2e` |
| V15.4 | `5215af8365fa7213212ddf573d8dbc8af03f6951` |

A separately named V12.3 commit was not established. Existing baseline files record rollback branch names, but remote existence of those names was not rechecked. Use immutable commits, retain assets/configuration from the same revision, and use a forward corrective commit or verified deployment rollback; never force-reset the shared branch.

## Prioritized Codex execution checklist

- [x] Locate/refresh the actual TAGJ branch; preserve later V15.x changes.
- [x] Audit architecture, historical V14 work, current assets/routes/contracts and build configuration.
- [x] Run existing static/build/package gates.
- [x] Handoff and inventory saved on tagj-v12-preview at `636f22d9268e809b00e84a8b0aebc4e1ad4624f0`; matching Git-triggered deployment reached READY.
- [x] Record deployment receipt with commit, ID, URL and verification scope; see CODEX_DEPLOYMENT_RECEIPT.md.
- [ ] P0: complete fresh-session and replay media tests on iPhone/Safari; reproduce any remaining failure before a minimal fix.
- [ ] P0: complete four-world/deep-route/back-forward/restore tests and verify the overlay never intercepts navigation after entry.
- [ ] P1: test all physical pages, aliases, 404 recovery, reduced motion, keyboard focus, mobile scroll/touch, and returning service-worker clients.
- [ ] P1: verify all 22 beat previews/fallbacks on target devices; adopt approved durable media delivery if Drive remains unreliable.
- [ ] P1: reconcile embedded UI records with JSON contracts and update stale historical notes only with clear superseding evidence.
- [ ] P1: implement request backend, commerce, inventory and licensed delivery only with actual approved provider/data inputs; preserve honest unavailable states.
- [ ] P2: update this handoff and immutable deployment receipt after each release; keep main/This Week isolated.
