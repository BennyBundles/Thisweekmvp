#!/usr/bin/env node
/**
 * TAGJ static regression gate.
 *
 * Verifies the TAGJ website build without touching the separate This Week app.
 * Usage: node scripts/check-tagj-static.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const failures=[];
const warnings=[];
const htmlFiles=[
  'index.html','preview.html','full.html','tagj.html','artist.html','producer.html','creative.html',
  'contact.html','licensing.html','404.html',
  'network/index.html','network/bsf-tone-066.html','network/t311y-demon-life.html',
  'creative/index.html','creative/portfolio.html','creative/case-bsf-tone-066.html','creative/case-t311y-demon-life.html',
  'music/index.html','music/wanted-me-gone.html','music/cant-crop-karma.html','music/hold-something.html',
  'music/freestyle.html','music/cried-in-the-dark.html','music/the-whole-brand.html',
  'beats/index.html','catalogue/index.html','services/index.html'
];
const jsonFiles=[
  'tagj-data/business.v1.json','tagj-data/catalog.v1.json','tagj-data/link-registry.v1.json',
  'tagj-data/network-assets.v1.json','tagj-data/beat-catalog.v1.json',
  'tagj-data/beat-license-matrix.v1.json','tagj-data/license-system.v1.json',
  'tagj-data/request-schema.v1.json','tagj-data/workflow.v1.json'
];
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const exists=(p)=>fs.existsSync(path.join(root,p));
const fail=(x)=>failures.push(x);

for(const p of [...htmlFiles,...jsonFiles,'scripts/build-tagj-preview.sh','scripts/check-tagj-package.mjs','tagj-assets/runtime-stability.js','tagj-assets/index-v1528.js','tagj-assets/full-v1528.js','tagj-assets/index-v1528.css','tagj-assets/full-v1528.css','vercel.json']){
  if(!exists(p))fail(`Missing required file: ${p}`);
}
if(failures.length)finish();

const html=Object.fromEntries(htmlFiles.map(p=>[p,read(p)]));
const parsed={};
for(const p of jsonFiles){
  try{parsed[p]=JSON.parse(read(p));}catch(e){fail(`Invalid JSON ${p}: ${e.message}`)}
}

// JavaScript syntax: inline scripts only, excluding JSON/LD+JSON blocks.
for(const [file,src] of Object.entries(html)){
  const re=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m,i=0;
  while((m=re.exec(src))){
    const attrs=m[1]||'';
    if(/type\s*=\s*["'](?:application\/json|application\/ld\+json)["']/i.test(attrs))continue;
    i++;
    try{new Function(m[2]||'')}catch(e){fail(`${file}: inline script ${i} syntax: ${e.message}`)}
  }
}

// Cacheable external shell runtime syntax.
for(const p of ['tagj-assets/index-v1528.js','tagj-assets/full-v1528.js','tagj-assets/runtime-stability.js']){
  try{new Function(read(p))}catch(e){fail(p+': external runtime JS syntax: '+e.message)}
}

// IDs should be unique in actual markup. Strip script/style/template source first so
// generated HTML strings such as id="v144_"+name do not create false positives.
const stripExecutable=(src)=>src
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'')
  .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi,'');
const idsByFile={};
for(const [file,src] of Object.entries(html)){
  const clean=stripExecutable(src);
  const ids=[...clean.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1]);
  idsByFile[file]=new Set(ids);
  const counts=new Map();
  for(const id of ids)counts.set(id,(counts.get(id)||0)+1);
  for(const [id,count] of counts)if(count>1)fail(`${file}: duplicate DOM id "${id}" ×${count}`);
}

// Hash routes: validate same-file anchors and explicit full.html# routes.
for(const [file,src] of Object.entries(html)){
  const clean=stripExecutable(src);
  for(const m of clean.matchAll(/href\s*=\s*["']([^"']+)["']/gi)){
    const href=m[1];
    if(href.startsWith('#')){
      const id=href.slice(1);
      if(id&&!idsByFile[file].has(id))fail(`${file}: missing same-page target #${id}`);
      continue;
    }
    const fm=href.match(/^(?:\.\.\/)?full\.html#([^?#]+)$/);
    if(fm&&!idsByFile['full.html'].has(fm[1]))fail(`${file}: missing full.html target #${fm[1]}`);
  }
}

// Local HTML/assets referenced from static markup must exist. Ignore generated JS strings,
// mailto, external protocols and pure hash links.
for(const [file,src] of Object.entries(html)){
  const clean=stripExecutable(src);
  const dir=path.dirname(file);
  for(const m of clean.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)){
    let ref=m[1];
    if(!ref||ref.startsWith('#')||/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(ref))continue;
    ref=ref.split(/[?#]/)[0];
    if(!ref)continue;
    const target=path.normalize(path.join(dir,ref));
    if(!exists(target))fail(`${file}: missing local reference ${m[1]} -> ${target}`);
  }
}

// CSS bundle regression: large binary data URIs caused multi-megabyte CSS parsing
// and mobile-memory pressure. Keep CSS small and cache binary media separately.
for(const name of fs.readdirSync(path.join(root,'tagj-assets')).filter(x=>x.endsWith('.css'))){
  const src=read(path.posix.join('tagj-assets',name));
  if(Buffer.byteLength(src,'utf8')>250_000)fail(`tagj-assets/${name}: CSS exceeds 250 KB; extract large media instead of embedding it`);
}

// Core catalogue invariants.
const beats=parsed['tagj-data/beat-catalog.v1.json']?.beats||[];
if(beats.length!==22)fail(`Beat catalogue expected 22 records; found ${beats.length}`);
if(new Set(beats.map(b=>b.id)).size!==beats.length)fail('Beat catalogue contains duplicate beat IDs');
if(beats.some(b=>!b.title))fail('One or more beat records has no catalogue title');
if(beats.some(b=>b.sampleStatus?.priorSaleStatus!=='producer_attested_none'))fail('One or more beats lacks the recorded no-prior-sale attestation');
if(beats.some(b=>b.sampleStatus?.priorExclusiveLicenseStatus!=='producer_attested_none'))fail('One or more beats lacks the recorded no-prior-exclusive attestation');

const matrix=parsed['tagj-data/beat-license-matrix.v1.json']?.beats||[];
if(matrix.length!==22)fail(`License matrix expected 22 beat rows; found ${matrix.length}`);

const catalog=parsed['tagj-data/catalog.v1.json'];
const profiles=catalog?.networkProfiles||[];
for(const id of ['bsf-tone-066','t311y-demon-life']){
  const p=profiles.find(x=>x.id===id);
  if(!p)fail(`Missing network profile: ${id}`);
  else if(!p.directRoute||!exists(p.directRoute))fail(`Network profile ${id} has missing directRoute: ${p.directRoute||'(none)'}`);
}
for(const id of ['bsf-bloxx-robbers','t311y-project-artwork']){
  if(!(catalog?.creativeCaseStudies||[]).some(x=>x.id===id))fail(`Missing creative case study: ${id}`);
}

// Canonical affiliate repository assets currently expected to be public.
const canonicalAssets=[
  'tagj-assets/network/bsf-tone-066/profile.png',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-cover-01.jpg',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-cover-02.jpg',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-cover-03.jpg',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-cover-04.jpg',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-merch-01.png',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-merch-02.png',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-merch-03.jpg',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-merch-04.jpg',
  'tagj-assets/network/t311y-demon-life/profile.jpg',
  'tagj-assets/network/t311y-demon-life/the-demon-culture-logo.jpg',
  'tagj-assets/network/t311y-demon-life/chapter-3-light-pack.jpg',
  'tagj-assets/network/t311y-demon-life/jimmy-onna-blast-off.png',
  'tagj-assets/network/t311y-demon-life/3-d-cover.jpg',
  'tagj-assets/network/t311y-demon-life/devils-playground.webp'
];
for(const p of canonicalAssets)if(!exists(p))fail(`Missing canonical network asset: ${p}`);

// The explicitly excluded unrenamed Drive image must never leak into the public project.
for(const [file,src] of Object.entries(html)){
  if(/IMG_4857\.jpg/i.test(src))fail(`${file}: excluded IMG_4857.jpg is referenced`);
}
for(const p of canonicalAssets){
  if(/IMG_4857\.jpg/i.test(p))fail('Excluded IMG_4857.jpg entered canonical asset set');
}

// Devil's Playground remains a known Drive-only source until its repo binary is deliberately ingested.
const net=parsed['tagj-data/network-assets.v1.json'];
const t311=net?.profiles?.['t311y-demon-life'];
const devil=(t311?.canonicalDriveAssets||[]).find(x=>x.id==='t311y-devils-playground-cover');
if(devil&&devil.repositoryPath&&!exists(devil.repositoryPath))fail(`Devil's Playground manifest points to missing repo asset: ${devil.repositoryPath}`);
if(devil&&!devil.repositoryPath)warnings.push("Devil's Playground: verified Drive source remains pending repository binary transfer");

// Build must ship the dedicated subsites, direct network pages, data, legal docs and network assets.
const build=read('scripts/build-tagj-preview.sh');
for(const token of ['index.html preview.html full.html tagj.html artist.html producer.html creative.html contact.html licensing.html 404.html','cp network/*.html .tagj-dist/network/','cp music/*.html .tagj-dist/music/','cp beats/*.html .tagj-dist/beats/','cp catalogue/*.html .tagj-dist/catalogue/','cp services/*.html .tagj-dist/services/','cp creative/*.html .tagj-dist/creative/','cp tagj-assets/*.js .tagj-dist/tagj-assets/','cp tagj-assets/media/* .tagj-dist/tagj-assets/media/','cp -R tagj-assets/network/* .tagj-dist/tagj-assets/network/','cp tagj-data/* .tagj-dist/tagj-data/','cp legal/* .tagj-dist/legal/']){
  if(!build.includes(token))fail(`Build script missing expected shipping rule: ${token}`);
}


// V15.28 navigation/performance hardening invariants.
{
  const indexCss='tagj-assets/index-v1528.css';
  const fullCss='tagj-assets/full-v1528.css';
  if(!html['index.html'].includes('tagj-assets/index-v1528.js'))fail('index.html: homepage deferred runtime missing');
  if(!html['full.html'].includes('tagj-assets/full-v1528.js'))fail('full.html: ecosystem deferred runtime missing');
  if(!html['index.html'].includes(indexCss))fail('index.html: V15.28 navigation-shell CSS missing');
  if(!html['full.html'].includes(fullCss))fail('full.html: V15.28 ecosystem CSS missing');
  for(const old of ['tagj-assets/index-v1527.css','tagj-assets/full-v1527.css',...Array.from({length:16},(_,i)=>'tagj-assets/a'+String(i+1).padStart(2,'0')+'.css')]){
    if(html['index.html'].includes(old)||html['full.html'].includes(old))fail('obsolete render-blocking stylesheet still referenced: '+old);
  }
  const inlineCssBytes=src=>[...src.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].reduce((n,m)=>n+Buffer.byteLength(m[1]||'','utf8'),0);
  if(inlineCssBytes(html['index.html'])>5000)fail('index.html: too much inline CSS; keep heavy styling cacheable');
  if(inlineCssBytes(html['full.html'])>5000)fail('full.html: too much inline CSS; keep heavy styling cacheable');
  const inlineJsBytes=src=>[...src.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].reduce((n,m)=>n+Buffer.byteLength(m[1]||'','utf8'),0);
  if(inlineJsBytes(html['index.html'])>2500)fail('index.html: main runtime should remain external/deferred');
  if(inlineJsBytes(html['full.html'])>1000)fail('full.html: main runtime should remain external/deferred');
  if(Buffer.byteLength(read(indexCss),'utf8')>250000)fail('index-v1528.css exceeds mobile-safe CSS budget');
  if(Buffer.byteLength(read(fullCss),'utf8')>250000)fail('full-v1528.css exceeds mobile-safe CSS budget');

  const runtime=read('tagj-assets/runtime-stability.js');
  if(!runtime.includes('tagj-low-memory'))fail('runtime-stability.js: low-memory/iOS mode missing');
  if(!runtime.includes('tagj-native-nav-runtime'))fail('runtime-stability.js: native navigation marker missing');
  if(runtime.includes('navLockUntil'))fail('runtime-stability.js: navigation must not be click-blocked/debounced');
  if(runtime.includes('canonicalRoutes')||runtime.includes('normalizePreviewLinks'))fail('runtime-stability.js: client-side URL rewriting must remain removed');
  if(!runtime.includes('data-tagj-preload-tuned'))fail('runtime-stability.js: media preload discipline missing');
  if(!runtime.includes("updateViaCache:'none'"))fail('runtime-stability.js: service-worker update must bypass stale cache');
  if(/touchstart[^\n]*warm\(/i.test(runtime))fail('runtime-stability.js: touch prefetch must remain disabled');

  const intro=html['index.html'];
  const introSources=[...intro.matchAll(/<source\b[^>]*src=["']tagj-assets\/intro\/([^"']+)["']/gi)].map(m=>m[1]);
  if(introSources.length!==1||introSources[0]!=='intro-clip-for-website-v152.mp4')fail('index.html: intro must use one canonical MP4 source');
  if(!intro.includes('nativeFastNav'))fail('index.html: iOS/coarse-pointer native navigation bypass missing');

  const sw=read('tagj-sw.js');
  if(/addEventListener\(\s*['"]fetch['"]/i.test(sw))fail('tagj-sw.js: fetch interception must remain disabled');
  if(!sw.includes('tagj-nav-v1528-reset'))fail('tagj-sw.js: V15.28 reset worker marker missing');

  const build=read('scripts/build-tagj-preview.sh');
  if(build.includes('cp tagj-assets/intro/*'))fail('build: wildcard intro copy reintroduces unused media');
  for(const duplicate of ['profile-01.png','profile-01.jpg','tdc-logo.jpg','jimmy-blast-off.png']){
    if(!build.includes('rm -f')||!build.includes(duplicate))fail('build: duplicate deploy cleanup missing '+duplicate);
  }
  if(!build.includes('.tagj-dist/tagj-assets/a??.css'))fail('build: obsolete micro-CSS cleanup missing');
  if(!build.includes("printf 'V15.28'"))fail('build: VERSION.txt is not V15.28');

  const vc=JSON.parse(read('vercel.json'));
  for(const bad of ['/index.html','/full.html','/tagj.html','/artist.html','/producer.html','/creative.html','/contact.html','/licensing.html']){
    if((vc.redirects||[]).some(x=>x.source===bad))fail('vercel.json: physical HTML must load directly without redirect: '+bad);
  }
  for(const pair of [['/artist','/artist.html'],['/producer','/producer.html'],['/creative','/creative.html'],['/full','/full.html'],['/network','/network/index.html'],['/services','/services/index.html']]){
    if(!(vc.rewrites||[]).some(x=>x.source===pair[0]&&x.destination===pair[1]))fail('vercel.json: clean-route compatibility rewrite missing '+pair[0]);
  }
  if(!(vc.redirects||[]).some(x=>x.source==='/preview'&&x.destination==='/'))fail('vercel.json: /preview must redirect to root');

  for(const [file,src] of Object.entries(html)){
    if(!src.includes('runtime-stability.js'))fail(file+': shared stability runtime missing');
  }
    if(/<iframe\b/i.test(html['preview.html']))fail('preview.html: nested full-site iframe is prohibited');
  if(!/tagj-404-self-heal/.test(html['404.html']))fail('404.html: route self-heal missing');
  if(!html['404.html'].includes("['/artist','/artist.html']"))fail('404.html: clean artist route must recover to physical HTML');
}

finish();
function finish(){
  if(failures.length){
    console.error('TAGJ static check FAILED');
    failures.forEach(x=>console.error(' - '+x));
    warnings.forEach(x=>console.warn(' ! '+x));
    process.exit(1);
  }
  console.log('TAGJ static check PASSED');
  console.log(`HTML files: ${htmlFiles.length}; JSON files: ${jsonFiles.length}; beats: ${parsed['tagj-data/beat-catalog.v1.json']?.beats?.length||0}`);
  warnings.forEach(x=>console.warn(' ! '+x));
}
