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
    [ "$preview_count" = "0" ] || [ "$preview_count" = "22" ] || { echo "Beat preview bundle must contain all 22 previews; found $preview_count" >&2; exit 1; }
  fi
fi

rm -rf .tagj-dist
mkdir -p .tagj-dist/network .tagj-dist/music .tagj-dist/beats .tagj-dist/catalogue .tagj-dist/services .tagj-dist/creative .tagj-dist/tagj-assets/v147 .tagj-dist/tagj-assets/intro .tagj-dist/tagj-assets/network .tagj-dist/tagj-assets/media .tagj-dist/tagj-assets/beat-previews .tagj-dist/tagj-data .tagj-dist/legal

cp index.html preview.html full.html tagj.html artist.html producer.html creative.html contact.html licensing.html 404.html tagj-sw.js .tagj-dist/
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
if ls tagj-assets/beat-previews/*.mp3 >/dev/null 2>&1; then cp tagj-assets/beat-previews/*.mp3 .tagj-dist/tagj-assets/beat-previews/; fi
cp -R tagj-assets/network/* .tagj-dist/tagj-assets/network/
# Remove unreferenced duplicate network binaries from the deploy package only.
rm -f .tagj-dist/tagj-assets/network/bsf-tone-066/profile-01.png
rm -f .tagj-dist/tagj-assets/network/t311y-demon-life/profile-01.jpg
rm -f .tagj-dist/tagj-assets/network/t311y-demon-life/tdc-logo.jpg
rm -f .tagj-dist/tagj-assets/network/t311y-demon-life/jimmy-blast-off.png
cp tagj-data/* .tagj-dist/tagj-data/
cp legal/* .tagj-dist/legal/

node scripts/generate-tagj-seo.mjs
printf 'V15.31' > .tagj-dist/VERSION.txt
