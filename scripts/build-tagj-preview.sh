#!/bin/sh
set -eu

# Optional one-file public asset bundle. It may contain the Benny hero portrait,
# the complete 22-file mobile Beat Vault preview set, or both. This keeps binary
# delivery independent from the text-only GitHub connector while preserving QA.
if [ -f tagj-public-assets-ready.zip ]; then
  command -v unzip >/dev/null 2>&1 || { echo "unzip is required for tagj-public-assets-ready.zip" >&2; exit 1; }
  unzip -oq tagj-public-assets-ready.zip -d .
  if [ -d tagj-assets/beat-previews ]; then
    preview_count=$(find tagj-assets/beat-previews -type f -name 'beat-*.mp3' | wc -l | tr -d ' ')
    [ "$preview_count" -le 22 ] || { echo "Beat preview bundle contains more than 22 canonical previews; found $preview_count" >&2; exit 1; }
  fi
fi

rm -rf .tagj-dist
mkdir -p .tagj-dist/network .tagj-dist/music .tagj-dist/beats .tagj-dist/catalogue .tagj-dist/services .tagj-dist/creative .tagj-dist/tagj-assets/v147 .tagj-dist/tagj-assets/intro .tagj-dist/tagj-assets/network .tagj-dist/tagj-assets/media .tagj-dist/tagj-assets/icons .tagj-dist/tagj-assets/releases .tagj-dist/tagj-assets/beat-previews .tagj-dist/tagj-data .tagj-dist/legal

cp index.html preview.html full.html tagj.html artist.html producer.html creative.html campaign.html season1.html vst.html contact.html licensing.html press.html 404.html tagj-sw.js site.webmanifest .tagj-dist/
cp network/*.html .tagj-dist/network/
cp music/*.html .tagj-dist/music/
cp beats/*.html .tagj-dist/beats/
cp catalogue/*.html .tagj-dist/catalogue/
cp services/*.html .tagj-dist/services/
cp creative/*.html .tagj-dist/creative/
cp tagj-assets/*.css .tagj-dist/tagj-assets/
cp tagj-assets/*.js .tagj-dist/tagj-assets/
# Remove obsolete CSS fragments from the deploy package. V15.28 ships one
# consolidated stylesheet per large shell to cut render-blocking requests.
rm -f .tagj-dist/tagj-assets/a??.css
rm -f .tagj-dist/tagj-assets/index-v1527.css .tagj-dist/tagj-assets/full-v1527.css
cp tagj-assets/v147/* .tagj-dist/tagj-assets/v147/
cp tagj-assets/intro/intro-poster-v149.jpg tagj-assets/intro/intro-clip-for-website-v152.mp4 .tagj-dist/tagj-assets/intro/
cp tagj-assets/media/* .tagj-dist/tagj-assets/media/
cp tagj-assets/icons/*.png .tagj-dist/tagj-assets/icons/
cp tagj-assets/releases/*.webp .tagj-dist/tagj-assets/releases/
if ls tagj-assets/beat-previews/*.mp3 >/dev/null 2>&1; then cp tagj-assets/beat-previews/*.mp3 .tagj-dist/tagj-assets/beat-previews/; fi
cp -R tagj-assets/network/* .tagj-dist/tagj-assets/network/
# Prune heavyweight raster originals when an optimized same-basename WebP is
# present. This keeps the source archive reversible while the deploy package
# ships only the canonical optimized visual.
find .tagj-dist/tagj-assets/media .tagj-dist/tagj-assets/network -type f \( -name '*.jpg' -o -name '*.jpeg' -o -name '*.png' \) | while IFS= read -r old; do
  stem=${old%.*}
  if [ -f "${stem}.webp" ]; then rm -f "$old"; fi
done
# Remove unreferenced duplicate network binaries from the deploy package only.
rm -f .tagj-dist/tagj-assets/network/bsf-tone-066/profile-01.png
rm -f .tagj-dist/tagj-assets/network/t311y-demon-life/profile-01.jpg
rm -f .tagj-dist/tagj-assets/network/t311y-demon-life/tdc-logo.jpg
rm -f .tagj-dist/tagj-assets/network/t311y-demon-life/jimmy-blast-off.png
cp \
  tagj-data/beat-catalog.v1.json \
  tagj-data/catalog.v1.json \
  tagj-data/current-campaign.v1.json \
  tagj-data/license-system.v1.json \
  tagj-data/link-registry.v1.json \
  .tagj-dist/tagj-data/
preview_count=$(find .tagj-dist/tagj-assets/beat-previews -maxdepth 1 -type f -name 'beat-*.mp3' | wc -l | tr -d ' ')
if [ "$preview_count" = "22" ]; then
  preview_ready=true
  preview_mode=local
elif [ "$preview_count" -gt 0 ]; then
  preview_ready=false
  preview_mode=hybrid
else
  preview_ready=false
  preview_mode=drive_fallback
fi
printf '{"schemaVersion":1,"expectedPreviewCount":22,"localPreviewCount":%s,"localPreviewsReady":%s,"preferredMode":"%s"}\n' "$preview_count" "$preview_ready" "$preview_mode" > .tagj-dist/tagj-data/beat-preview-status.v1.json
cp \
  legal/BEAT_LICENSE_BASIC_MP3_DRAFT.md \
  legal/BEAT_LICENSE_PREMIUM_WAV_DRAFT.md \
  legal/BEAT_LICENSE_TRACKOUT_PRO_DRAFT.md \
  legal/BEAT_LICENSE_UNLIMITED_DRAFT.md \
  legal/BEAT_LICENSE_EXCLUSIVE_DRAFT.md \
  .tagj-dist/legal/

node scripts/generate-tagj-seo.mjs
printf 'V15.37' > .tagj-dist/VERSION.txt
node - <<'NODE'
const fs=require('fs');
const campaign=JSON.parse(fs.readFileSync('tagj-data/current-campaign.v1.json','utf8'));
const previews=JSON.parse(fs.readFileSync('.tagj-dist/tagj-data/beat-preview-status.v1.json','utf8'));
const gates=JSON.parse(fs.readFileSync('tagj-data/launch-gates.v1.json','utf8'));
const featureStates=Object.fromEntries((gates.featureGates||[]).map(x=>[x.id,x.status||null]));
const manifest={
  schemaVersion:2,
  product:'Benny Bundles × TAGJ',
  version:'V15.37',
  mode:process.env.TAGJ_PUBLIC_ORIGIN?'public':'protected-preview',
  commit:process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||null,
  campaignId:campaign.campaignId||null,
  currentRelease:campaign.release?.id||null,
  currentCampaignRoute:campaign.release?.campaignPath||'/campaign',
  evergreenCampaignRoute:campaign.release?.evergreenPath||'/now',
  localBeatPreviewCount:previews.localPreviewCount,
  expectedBeatPreviewCount:previews.expectedPreviewCount,
  localPreviewsReady:previews.localPreviewsReady,
  beatPreviewMode:previews.preferredMode,
  launch:{
    previewStatus:gates.previewLaunch?.status||null,
    sourceVersion:gates.previewLaunch?.sourceVersion||null,
    deployedBaseline:gates.previewLaunch?.deployedBaseline||null,
    previewFreshnessBlocker:gates.previewLaunch?.blocker?.id||null,
    publicStatus:gates.publicLaunch?.status||null,
    publicBlockers:(gates.publicLaunch?.blockers||[]).filter(x=>x.blocking).map(x=>x.id)
  },
  featureStates,
  growthRoutes:['/now','/season1','/vst','/subscribe','/press','/contact'],
  portablePwa:true
};
fs.writeFileSync('.tagj-dist/build-manifest.json',JSON.stringify(manifest,null,2)+'\n');
NODE
