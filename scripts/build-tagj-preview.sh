#!/bin/sh
set -eu

rm -rf .tagj-dist
mkdir -p .tagj-dist/tagj-assets/v147 .tagj-dist/tagj-assets/intro .tagj-dist/tagj-data .tagj-dist/legal

cp index.html full.html tagj.html artist.html producer.html creative.html .tagj-dist/
cp tagj-assets/*.css .tagj-dist/tagj-assets/
cp tagj-assets/v147/* .tagj-dist/tagj-assets/v147/
cp tagj-assets/intro/* .tagj-dist/tagj-assets/intro/
cp tagj-data/* .tagj-dist/tagj-data/
cp legal/* .tagj-dist/legal/

printf 'V15.10' > .tagj-dist/VERSION.txt
