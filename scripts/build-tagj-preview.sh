#!/bin/sh
set -eu

rm -rf .tagj-dist
mkdir -p .tagj-dist/tagj-assets .tagj-dist/tagj-data

cp index.html full.html tagj.html artist.html producer.html creative.html .tagj-dist/
cp tagj-assets/*.css .tagj-dist/tagj-assets/
cp tagj-data/* .tagj-dist/tagj-data/

printf 'V14.5' > .tagj-dist/VERSION.txt
