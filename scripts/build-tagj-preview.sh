#!/bin/sh
set -eu

rm -rf .tagj-dist
mkdir -p .tagj-dist/network .tagj-dist/music .tagj-dist/beats .tagj-dist/catalogue .tagj-dist/services .tagj-dist/creative .tagj-dist/tagj-assets/v147 .tagj-dist/tagj-assets/intro .tagj-dist/tagj-assets/network .tagj-dist/tagj-assets/media .tagj-dist/tagj-data .tagj-dist/legal

cp index.html preview.html full.html tagj.html artist.html producer.html creative.html contact.html licensing.html 404.html tagj-sw.js .tagj-dist/
cp network/*.html .tagj-dist/network/
cp music/*.html .tagj-dist/music/
cp beats/*.html .tagj-dist/beats/
cp catalogue/*.html .tagj-dist/catalogue/
cp services/*.html .tagj-dist/services/
cp creative/*.html .tagj-dist/creative/
cp tagj-assets/*.css .tagj-dist/tagj-assets/
cp tagj-assets/*.js .tagj-dist/tagj-assets/
cp tagj-assets/v147/* .tagj-dist/tagj-assets/v147/
cp tagj-assets/intro/* .tagj-dist/tagj-assets/intro/
cp tagj-assets/media/* .tagj-dist/tagj-assets/media/
cp -R tagj-assets/network/* .tagj-dist/tagj-assets/network/
cp tagj-data/* .tagj-dist/tagj-data/
cp legal/* .tagj-dist/legal/

printf 'V15.23' > .tagj-dist/VERSION.txt
