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
  'campaign.html','contact.html','licensing.html','press.html','404.html',
  'network/index.html','network/billyen.html','network/bsf-tone-066.html','network/t311y-demon-life.html',
  'creative/index.html','creative/portfolio.html','creative/case-bsf-tone-066.html','creative/case-t311y-demon-life.html',
  'music/index.html','music/wanted-me-gone.html','music/cant-crop-karma.html','music/hold-something.html',
  'music/freestyle.html','music/cried-in-the-dark.html','music/the-whole-brand.html',
  'beats/index.html','catalogue/index.html','services/index.html'
];
const jsonFiles=[
  'tagj-data/business.v1.json','tagj-data/catalog.v1.json','tagj-data/link-registry.v1.json',
  'tagj-data/network-assets.v1.json','tagj-data/current-campaign.v1.json','tagj-data/launch-gates.v1.json','tagj-data/beat-catalog.v1.json',
  'tagj-data/beat-license-matrix.v1.json','tagj-data/license-system.v1.json',
  'tagj-data/request-schema.v1.json','tagj-data/workflow.v1.json'
];
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const exists=(p)=>fs.existsSync(path.join(root,p));
const fail=(x)=>failures.push(x);

for(const p of [...htmlFiles,...jsonFiles,'scripts/build-tagj-preview.sh','scripts/prepare-tagj-release-candidate.sh','scripts/check-tagj-package.mjs','scripts/generate-tagj-seo.mjs','tagj-assets/runtime-stability.js','tagj-assets/deferred-video.js','tagj-assets/index-v1528.js','tagj-assets/full-v1528.js','tagj-assets/index-v1528.css','tagj-assets/full-v1528.css','vercel.json']){
  if(!exists(p))fail(`Missing required file: ${p}`);
}
if(failures.length)finish();

const html=Object.fromEntries(htmlFiles.map(p=>[p,read(p)]));
const parsed={};
try{JSON.parse(read('site.webmanifest'))}catch(err){fail('site.webmanifest: invalid JSON: '+err.message)}
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
for(const p of ['tagj-assets/index-v1528.js','tagj-assets/full-v1528.js','tagj-assets/runtime-stability.js','tagj-assets/deferred-video.js']){
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

if(!html['campaign.html'].includes('id="campaignCaption"')||!html['campaign.html'].includes('data-share')||!html['campaign.html'].includes('campaign-schema'))fail('campaign.html: current campaign controls missing');
{
  const raw=(html['campaign.html'].match(/<script\b[^>]*id=["']campaign-schema["'][^>]*>([\s\S]*?)<\/script>/i)||[])[1];
  const schema=raw?JSON.parse(raw):null;
  const video=schema?.about?.subjectOf;
  if(schema?.about?.byArtist?.url!=='/artist'||schema?.publisher?.url!=='/tagj')fail('campaign.html: canonical artist/publisher metadata missing');
  if(video?.['@type']!=='VideoObject'||video?.creator?.url!=='/artist'||!video?.description||!video?.thumbnailUrl||!video?.uploadDate||!video?.embedUrl)fail('campaign.html: VideoObject creator metadata missing');
}
if(!html['artist.html'].includes('href="campaign.html"'))fail('artist.html: current campaign route missing');
if(!html['index.html'].includes('class="home-release-signal" href="campaign.html"'))fail('index.html: home current-release signal must enter campaign loop');
if(!html['producer.html'].includes('id="featuredBeatGrid"')||!html['producer.html'].includes("new Audio(beat.previewUrl)"))fail('producer.html: featured Beat audition rail missing');
if(!html['artist.html'].includes('href="network/billyen.html"')||!html['network/index.html'].includes('href="billyen.html"'))fail('BillYen direct network surface missing');
if(!html['network/billyen.html'].includes('billyen-profile-schema')||!html['network/billyen.html'].includes('https://youtube.com/@billyenthebuilder')||!html['network/billyen.html'].includes('oDa5fa3Zet8'))fail('BillYen profile verified identity/link contract missing');
if(!html['tagj.html'].includes('id="season-one"')||!html['tagj.html'].includes('id="tagjWaitlistForm"')||!html['tagj.html'].includes('Nothing is transmitted automatically'))fail('TAGJ Season 1 waitlist privacy contract missing');
if(!html['tagj.html'].includes('Preferred Season 1 direction')||!html['tagj.html'].includes('name="direction"')||!html['tagj.html'].includes('id="copySeasonOneLink"'))fail('TAGJ Season 1 product-signal controls missing');
if(!html['tagj.html'].includes('free-shirt drawing')||!html['tagj.html'].includes('official rules'))fail('TAGJ free-shirt promotion must remain pre-launch and rules-gated');
if(!html['producer.html'].includes('id="producer-tools"')||!html['producer.html'].includes('Melody VST')||!html['producer.html'].includes('No fake download'))fail('Producer’s Tools / VST development surface missing or misleading');
if(!html['producer.html'].includes('id="vstBetaForm"')||!html['producer.html'].includes('Melody VST development roadmap')||!html['producer.html'].includes('Primary DAW')||!html['producer.html'].includes('Workflow problem:'))fail('Producer VST beta research contract missing');
for(const p of ['artist.html','campaign.html']) if(!html[p].includes('id="youtube-subscribe"')||!html[p].includes('https://www.youtube.com/@bennybundles?sub_confirmation=1')) fail(p+': YouTube subscribe climax missing');

{
  const manifest=JSON.parse(read('site.webmanifest'));
  if(manifest.id!=='./'||manifest.start_url!=='./?resume=1'||manifest.scope!=='./')fail('site.webmanifest: portable webmanifest contract missing');
  for(const url of ['campaign','season1','vst','artist','beats','press'])if(!(manifest.shortcuts||[]).some(x=>x.url===url))fail('site.webmanifest: missing portable shortcut '+url);
  for(const icon of [...(manifest.icons||[]),...(manifest.shortcuts||[]).flatMap(x=>x.icons||[])])if(String(icon.src||'').startsWith('/'))fail('site.webmanifest: root-absolute icon breaks project-subpath hosting');
}

{
  const gates=parsed['tagj-data/launch-gates.v1.json'];
  if(gates?.schemaVersion!==1)fail('launch-gates.v1.json schemaVersion must be 1');
  if(gates?.baseline!=='V15.37')fail('launch gates baseline mismatch');
  const beatGate=(gates?.featureGates||[]).find(x=>x.id==='beat-vault-local-preview-coverage');
  if(!beatGate||beatGate.status!=='hybrid'||beatGate.localPreviewCount!==18||beatGate.expectedPreviewCount!==22)fail('launch gates Beat Vault coverage must declare hybrid 18/22');
  const giveaway=(gates?.featureGates||[]).find(x=>x.id==='season-one-giveaway');
  if(!giveaway||giveaway.blockingForGiveawayActivation!==true)fail('launch gates must keep Season 1 drawing rules-gated');
  const seasonSignal=(gates?.featureGates||[]).find(x=>x.id==='season-one-product-signal');
  if(!seasonSignal||seasonSignal.status!=='active_zero_backend')fail('launch gates must declare active Season 1 product signal');
  const vstResearch=(gates?.featureGates||[]).find(x=>x.id==='melody-vst-beta-research');
  if(!vstResearch||vstResearch.status!=='active_zero_backend')fail('launch gates must declare active Melody VST beta research');
  const hero=(gates?.featureGates||[]).find(x=>x.id==='benny-hero-portrait');
  if(!hero||hero.status!=='source_reference_recovered_binary_missing'||hero.blockingForSite!==false)fail('launch gates must declare non-blocking Benny hero portrait fallback');
}

// Canonical creator / organization identity must be consistent across first-party surfaces.
{
  const artistSchema=JSON.parse((html['artist.html'].match(/<script\b[^>]*id=["']benny-bundles-entity-schema["'][^>]*>([\s\S]*?)<\/script>/i)||[])[1]||'{}');
  const artistGraph=artistSchema['@graph']||[];
  const person=artistGraph.find(x=>x&&x['@type']==='Person');
  const org=artistGraph.find(x=>x&&x['@type']==='Organization');
  const profile=artistGraph.find(x=>x&&x['@type']==='ProfilePage');
  if(person?.['@id']!=='/artist#benny-bundles'||person?.url!=='/artist')fail('artist.html: canonical Benny entity URL drift');
  if(org?.['@id']!=='/artist#tagj'||org?.url!=='/tagj')fail('artist.html: canonical TAGJ entity URL drift');
  if(profile?.url!=='/artist'||profile?.mainEntity?.['@id']!=='/artist#benny-bundles')fail('artist.html: canonical ProfilePage identity drift');
  const homeSchema=JSON.parse((html['index.html'].match(/<script\b[^>]*id=["']tagj-home-entity-schema["'][^>]*>([\s\S]*?)<\/script>/i)||[])[1]||'{}');
  const homeGraph=homeSchema['@graph']||[];
  const hp=homeGraph.find(x=>x&&x['@type']==='Person');
  const ho=homeGraph.find(x=>x&&x['@type']==='Organization');
  const hs=homeGraph.find(x=>x&&x['@type']==='WebSite');
  if(hp?.['@id']!=='/artist#benny-bundles'||ho?.['@id']!=='/artist#tagj'||hs?.about?.['@id']!=='/artist#benny-bundles')fail('index.html: home entity graph diverges from canonical artist identities');
}

// Current campaign must stay internally consistent across promotional surfaces.
{
  const campaign=parsed['tagj-data/current-campaign.v1.json'];
  if(campaign?.schemaVersion!==1)fail('Current campaign config schemaVersion must be 1');
  if(campaign?.status!=='active')fail('Current campaign config must remain active');
  const release=campaign?.release||{};
  if(!release.id||!release.title||!release.releaseDate||!release.releasePath||!release.campaignPath||!release.evergreenPath)fail('Current campaign release identity is incomplete');
  if(release.campaignPath!=='/campaign'||release.evergreenPath!=='/now')fail('Current campaign route contract changed unexpectedly');
  const campaignHtml=html['campaign.html'];
  if(release.title&&!campaignHtml.includes(release.title))fail('campaign.html: current title drifted from campaign config');
  if(release.releaseDate&&!campaignHtml.includes(release.releaseDate))fail('campaign.html: release date drifted from campaign config');
  if(release.artworkPath&&!campaignHtml.includes(release.artworkPath.replace(/^\//,'')))fail('campaign.html: artwork drifted from campaign config');
  const youtubeId=String(release.officialVideoUrl||'').match(/youtu\.be\/([^?&/]+)/)?.[1];
  if(youtubeId&&!campaignHtml.includes(youtubeId))fail('campaign.html: official video drifted from campaign config');
  if(release.title&&!html['index.html'].toLowerCase().includes(release.title.toLowerCase()))fail('index.html: current release signal drifted from campaign config');
}

// Zero-backend conversion funnels must preserve privacy and attribution context.
{
  const runtime=read('tagj-assets/runtime-stability.js');
  if(!runtime.includes('window.TAGJAttribution')||!runtime.includes("utm_source")||!runtime.includes("referrer:safeReferrer"))fail('runtime: privacy-preserving attribution helper missing');
  for(const p of ['tagj.html','producer.html']){
    if(!html[p].includes('Attribution source:'))fail(p+': user-reviewed conversion handoff lacks attribution context');
  }
  if(!html['tagj.html'].includes('id="copyWaitlistRequest"')||!html['tagj.html'].includes('Nothing is transmitted automatically'))fail('tagj.html: waitlist privacy/copy fallback missing');
  if(!html['producer.html'].includes('id="copyVstBetaRequest"')||!html['producer.html'].includes('id="copyVstLink"'))fail('producer.html: VST research copy/share fallback missing');
  if(!html['contact.html'].includes('id="contactQuickBrief"')||!html['contact.html'].includes('id="copyQuickBrief"')||!html['contact.html'].includes('Nothing is transmitted automatically'))fail('contact.html: zero-backend Quick Brief contract missing');
  if(!html['contact.html'].includes('Attribution source:'))fail('contact.html: Quick Brief attribution context missing');
}

// Basic accessibility and external-link safety.
for(const [file,src] of Object.entries(html)){
  const clean=stripExecutable(src);
  for(const m of clean.matchAll(/<img\b[^>]*>/gi)){
    if(!/\balt\s*=\s*["'][^"']*["']/i.test(m[0])) fail(`${file}: image without alt attribute`);
  }
  for(const m of clean.matchAll(/<a\b[^>]*target\s*=\s*["']_blank["'][^>]*>/gi)){
    if(!/\brel\s*=\s*["'][^"']*\bnoopener\b[^"']*["']/i.test(m[0])) fail(`${file}: target=_blank link is missing rel=noopener`);
  }
  if(!/<html\b[^>]*\blang\s*=\s*["'][^"']+["']/i.test(src)) fail(`${file}: html lang attribute missing`);
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
// mailto, external protocols and pure hash links. The Benny hero is an intentional
// optional drop-in binary; packaged integrity validates it when the public asset bundle exists.
const optionalLocalRefs=new Set(['tagj-assets/media/benny-artist-hero.webp']);
for(const [file,src] of Object.entries(html)){
  const clean=stripExecutable(src);
  const dir=path.dirname(file);
  for(const m of clean.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)){
    let ref=m[1];
    if(!ref||ref.startsWith('#')||/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(ref))continue;
    ref=ref.split(/[?#]/)[0];
    if(!ref)continue;
    const target=path.normalize(path.join(dir,ref));
    if(!exists(target)&&!optionalLocalRefs.has(target))fail(`${file}: missing local reference ${m[1]} -> ${target}`);
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
for(const b of beats){
  if(!b.previewUrl)continue;
  const previewPath=String(b.previewUrl).replace(/^\//,'');
  if(!exists(previewPath))fail(`${b.id}: previewUrl points to missing file ${b.previewUrl}`);
  if(!/\.mp3$/i.test(previewPath))fail(`${b.id}: site-hosted preview must be MP3`);
}
for(const b of beats){
  if(b.previewUrl){
    if(b.previewAvailability!=='local')fail(`${b.id}: previewAvailability must be local when previewUrl exists`);
    if(b.previewDelivery!=='site_hosted_mp3')fail(`${b.id}: previewDelivery must identify site-hosted MP3`);
  }else{
    if(b.previewAvailability!=='drive_restricted')fail(`${b.id}: missing local preview must be explicitly marked drive_restricted`);
    if(b.previewDelivery!=='no_public_browser_preview')fail(`${b.id}: restricted preview delivery state missing`);
  }
}
if(!html['beats/index.html'].includes('Preview Restricted'))fail('Beat Catalogue: restricted-preview UI missing');
const fullJs=read('tagj-assets/full-v1528.js');
if(!fullJs.includes("previewAvailability==='drive_restricted'")||!fullJs.includes('restricted beats labeled'))fail('Full Beat Vault: hybrid/restricted playback logic missing');

const matrix=parsed['tagj-data/beat-license-matrix.v1.json']?.beats||[];
if(matrix.length!==22)fail(`License matrix expected 22 beat rows; found ${matrix.length}`);

const catalog=parsed['tagj-data/catalog.v1.json'];
const profiles=catalog?.networkProfiles||[];
for(const id of ['billyen','bsf-tone-066','t311y-demon-life']){
  const p=profiles.find(x=>x.id===id);
  if(!p)fail(`Missing network profile: ${id}`);
  else if(!p.directRoute||!exists(p.directRoute))fail(`Network profile ${id} has missing directRoute: ${p.directRoute||'(none)'}`);
}
for(const id of ['bsf-bloxx-robbers','t311y-project-artwork']){
  if(!(catalog?.creativeCaseStudies||[]).some(x=>x.id===id))fail(`Missing creative case study: ${id}`);
}

// Canonical first-party release posters.
const canonicalReleasePosters=[
  'tagj-assets/releases/wanted-me-gone.webp',
  'tagj-assets/releases/hold-something.webp',
  'tagj-assets/releases/hold-something-lyric.webp',
  'tagj-assets/releases/cant-crop-karma.webp',
  'tagj-assets/releases/freestyle.webp',
  'tagj-assets/releases/cried-in-the-dark.webp',
  'tagj-assets/releases/the-whole-brand.webp'
];
for(const p of canonicalReleasePosters)if(!exists(p))fail('Missing canonical release poster: '+p);
for(const [file,src] of Object.entries(html))if(src.includes('https://i.ytimg.com/'))fail(file+': remote YouTube thumbnail dependency must remain removed');

// Canonical affiliate repository assets currently expected to be public.
const canonicalAssets=[
  'tagj-assets/network/bsf-tone-066/profile.webp',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-cover-01.webp',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-cover-02.jpg',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-cover-03.jpg',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-cover-04.jpg',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-merch-01.webp',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-merch-02.webp',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-merch-03.webp',
  'tagj-assets/network/bsf-tone-066/bloxx-robbers-merch-04.webp',
  'tagj-assets/network/t311y-demon-life/profile.webp',
  'tagj-assets/network/t311y-demon-life/the-demon-culture-logo.webp',
  'tagj-assets/network/t311y-demon-life/chapter-3-light-pack.webp',
  'tagj-assets/network/t311y-demon-life/jimmy-onna-blast-off.webp',
  'tagj-assets/network/t311y-demon-life/3-d-cover.webp',
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
for(const token of ['index.html preview.html full.html tagj.html artist.html producer.html creative.html campaign.html contact.html licensing.html press.html 404.html','cp network/*.html .tagj-dist/network/','cp music/*.html .tagj-dist/music/','cp beats/*.html .tagj-dist/beats/','cp catalogue/*.html .tagj-dist/catalogue/','cp services/*.html .tagj-dist/services/','cp creative/*.html .tagj-dist/creative/','cp tagj-assets/*.js .tagj-dist/tagj-assets/','cp tagj-assets/media/* .tagj-dist/tagj-assets/media/','cp tagj-assets/icons/*.png .tagj-dist/tagj-assets/icons/','cp tagj-assets/releases/*.webp .tagj-dist/tagj-assets/releases/','tagj-assets/beat-previews/*.mp3','cp -R tagj-assets/network/* .tagj-dist/tagj-assets/network/','cp tagj-data/* .tagj-dist/tagj-data/','cp legal/* .tagj-dist/legal/']){
  if(!build.includes(token))fail(`Build script missing expected shipping rule: ${token}`);
}


// V15.37 navigation/performance hardening invariants.
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
  if(!read('tagj-assets/index-v1528.js').includes('nativeFastNav'))fail('index-v1528.js: iOS/coarse-pointer native navigation bypass missing');

  const sw=read('tagj-sw.js');
  if(/addEventListener\(\s*['"]fetch['"]/i.test(sw))fail('tagj-sw.js: fetch interception must remain disabled');
  if(!sw.includes('tagj-nav-v1537-reset'))fail('tagj-sw.js: V15.37 reset worker marker missing');

  const build=read('scripts/build-tagj-preview.sh');
  if(build.includes('cp tagj-assets/intro/*'))fail('build: wildcard intro copy reintroduces unused media');
  for(const duplicate of ['profile-01.png','profile-01.jpg','tdc-logo.jpg','jimmy-blast-off.png']){
    if(!build.includes('rm -f')||!build.includes(duplicate))fail('build: duplicate deploy cleanup missing '+duplicate);
  }
  if(!build.includes('.tagj-dist/tagj-assets/a??.css'))fail('build: obsolete micro-CSS cleanup missing');
  if(!build.includes("printf 'V15.37'"))fail('build: VERSION.txt is not V15.37');
  const homeRuntime=read('tagj-assets/index-v1528.js');
  if(!homeRuntime.includes("const saveData=!!connection?.saveData"))fail('home runtime: Data Saver detection missing');
  if(!homeRuntime.includes('accessibilityFastEntry=reduce||saveData'))fail('home runtime: Reduce Motion / Data Saver intro fast-entry contract missing');
  const runtimeNav=read('tagj-assets/runtime-stability.js');
  if(!runtimeNav.includes('tagj-global-map')||!runtimeNav.includes('tagj-map-trigger'))fail('runtime: global route switcher missing');
  if(!runtimeNav.includes("e.key==='Tab'")||!runtimeNav.includes("aria-current','page"))fail('runtime: route switcher focus/current-page safeguards missing');
  if(!runtimeNav.includes('data-tagj-share-page')||!runtimeNav.includes('navigator.share'))fail('runtime: native release/EPK share action missing');
  if(!build.includes('generate-tagj-seo.mjs'))fail('build: environment-aware SEO generator missing');
  const rc=read('scripts/prepare-tagj-release-candidate.sh');
  if(!rc.includes('release-candidate.json')||!rc.includes('checksums.sha256')||!rc.includes('check-tagj-package.mjs'))fail('release candidate packager contract missing');
  if(!build.includes('site.webmanifest'))fail('build: site.webmanifest shipping rule missing');
  if(!build.includes('beat-preview-status.v1.json'))fail('build: Beat Vault preview capability manifest generation missing');
  if(!html['beats/index.html'].includes('beat-preview-status.v1.json'))fail('beats/index.html: build-aware preview capability fetch missing');
  if(!read('tagj-assets/full-v1528.js').includes('beat-preview-status.v1.json'))fail('full-v1528.js: build-aware Beat Vault preview capability fetch missing');
  const seoScript=read('scripts/generate-tagj-seo.mjs');
  if(!seoScript.includes('TAGJ_PUBLIC_ORIGIN')||!seoScript.includes('noindex,nofollow,noarchive'))fail('SEO generator: protected/public mode contract missing');
  if(!build.includes('tagj-public-assets-ready.zip'))fail('build: one-file public asset bundle support missing');
  if(!html['artist.html'].includes('bennyHeroAsset')||!html['artist.html'].includes('benny-artist-hero.webp'))fail('artist.html: drop-in hero asset hook missing');
  if(!html['index.html'].includes('tagj-home-entity-schema'))fail('index.html: home entity graph missing');
  if(!html['artist.html'].includes('id="about"')||!html['artist.html'].includes('id="verified-releases"'))fail('artist.html: artist-first entity structure missing');
  if(!html['press.html'].includes('id="benny-epk-schema"'))fail('press.html: EPK schema missing');
  if(!html['artist.html'].includes('Benny Bundles — Artist, Producer & Engineer | TAGJ'))fail('artist.html: artist-first title metadata missing');
  for(const p of ['producer.html','creative.html','tagj.html','full.html']){
    if(!html[p].includes('data-tagj-entity-v1531'))fail(p+': V15.37 entity marker missing');
  }
  if(!html['full.html'].includes('id="artist-current-v1531"'))fail('full.html: current verified release rail missing');
  for(const url of ['https://music.apple.com/us/artist/benny-bundles/1730543318','https://open.spotify.com/artist/7B0YUXsyJgA56DagjkbeGh','https://www.youtube.com/@bennybundles']){
    if(!html['full.html'].includes(url))fail('full.html: verified artist destination missing '+url);
  }
  const releaseOrder=['Wanted Me Gone','Hold Something','Can’t Crop Karma','FREESTYLE','Cried in the Dark','The Whole Brand'];
  let last=-1;
  for(const name of releaseOrder){
    const idx=html['artist.html'].indexOf('<b>'+name+'</b>');
    if(idx<0)fail('artist.html: verified release missing '+name);
    else if(idx<=last)fail('artist.html: verified releases are not in descending date order');
    last=idx;
  }
  if(!html['beats/index.html'].includes('const localPreview=b.previewUrl||b.preview?.url||null'))fail('beats/index.html: per-beat local preview convention missing');
  if(!read('tagj-assets/full-v1528.js').includes('const localPreview=b.previewUrl||b.preview?.url||null'))fail('full-v1528.js: per-beat Beat Vault preview convention missing');

  if(!html['full.html'].includes('id="v1530EmailBrief"'))fail('full.html: Email Brief action missing from request wizard');
  if(!read('tagj-assets/full-v1528.js').includes("mailto:prodbybundles@yahoo.com?subject="))fail('full-v1528.js: reviewable inquiry email handoff missing');

  const vc=JSON.parse(read('vercel.json'));
  const globalHeaders=(vc.headers||[]).find(x=>x.source==='/(.*)')?.headers||[];
  for(const pair of [
    ['/music/wanted-me-gone','/music/wanted-me-gone.html'],
    ['/music/hold-something','/music/hold-something.html'],
    ['/music/cant-crop-karma','/music/cant-crop-karma.html'],
    ['/music/freestyle','/music/freestyle.html'],
    ['/music/cried-in-the-dark','/music/cried-in-the-dark.html'],
    ['/music/the-whole-brand','/music/the-whole-brand.html']
  ]){
    if(!(vc.rewrites||[]).some(x=>x.source===pair[0]&&x.destination===pair[1]))fail('vercel.json: clean release rewrite missing '+pair[0]);
  }
  for(const key of ['X-Content-Type-Options','Referrer-Policy','Permissions-Policy','Content-Security-Policy','X-Frame-Options','Cross-Origin-Opener-Policy','X-Permitted-Cross-Domain-Policies','Strict-Transport-Security']){
    if(!globalHeaders.some(x=>x.key===key))fail('vercel.json: baseline security header missing '+key);
  }
  const csp=globalHeaders.find(x=>x.key==='Content-Security-Policy')?.value||'';
  if(!csp.includes("object-src 'none'"))fail('vercel.json: CSP must forbid object execution');
  if(!csp.includes("frame-ancestors 'self'"))fail('vercel.json: CSP frame ancestor policy missing');
  if(!csp.includes('https://drive.google.com'))fail('vercel.json: CSP must allow Beat Vault Drive fallback frames');
  for(const bad of ['/index.html','/full.html','/tagj.html','/artist.html','/producer.html','/creative.html','/contact.html','/licensing.html']){
    if((vc.redirects||[]).some(x=>x.source===bad))fail('vercel.json: physical HTML must load directly without redirect: '+bad);
  }
  for(const pair of [['/artist','/artist.html'],['/producer','/producer.html'],['/creative','/creative.html'],['/full','/full.html'],['/press','/press.html'],['/network','/network/index.html'],['/services','/services/index.html']]){
    if(!(vc.rewrites||[]).some(x=>x.source===pair[0]&&x.destination===pair[1]))fail('vercel.json: clean-route compatibility rewrite missing '+pair[0]);
  }
  if(!(vc.redirects||[]).some(x=>x.source==='/preview'&&x.destination==='/'))fail('vercel.json: /preview must redirect to root');
  if(!(vc.redirects||[]).some(x=>x.source==='/now'&&x.destination==='/campaign'&&x.permanent===false))fail('vercel.json: evergreen /now campaign redirect missing');

  for(const [file,src] of Object.entries(html)){
    if(!src.includes('runtime-stability.js'))fail(file+': shared stability runtime missing');
  }
    if(/<iframe\b/i.test(html['preview.html']))fail('preview.html: nested full-site iframe is prohibited');
  if(!/tagj-404-self-heal/.test(html['404.html']))fail('404.html: route self-heal missing');
  if(!html['404.html'].includes("['/artist','/artist.html']"))fail('404.html: clean artist route must recover to physical HTML');
  if(!html['404.html'].includes("['/campaign','/campaign.html']")||!html['404.html'].includes("['/now','/campaign.html']"))fail('404.html: campaign /now clean-route recovery missing');
}

{
  const search=read('tagj-assets/index-v1528.js');
  for(const token of ['TAGJ Season 1 Waitlist','Producer’s Tools / VST Lab','YouTube Subscribe','BillYen Direct Profile']) if(!search.includes(token))fail('growth surfaces missing from ecosystem search: '+token);
}

// V15.37: evergreen promotion shortcuts.
{
  const vc=JSON.parse(read('vercel.json'));
  for(const [source,destination] of [['/season1','/tagj#season-one'],['/vst','/producer#producer-tools'],['/subscribe','/artist#youtube-subscribe']]){
    if(!(vc.redirects||[]).some(x=>x.source===source&&x.destination===destination&&x.permanent===false))fail('Evergreen promo shortcut missing: '+source);
  }
  for(const token of ["['/season1','/tagj.html#season-one']","['/vst','/producer.html#producer-tools']","['/subscribe','/artist.html#youtube-subscribe']"])if(!html['404.html'].includes(token))fail('404.html: static-host promo shortcut missing '+token);
}

// V15.37: shared runtime route portability.
{
  const runtime=read('tagj-assets/runtime-stability.js');
  if(!runtime.includes("const sitePath=(p='')"))fail('runtime: site-base route resolver missing');
  if(!runtime.includes('<b>Current Campaign</b>'))fail('runtime global map must include Current Campaign');
  for(const route of ['season1','vst','subscribe']) if(!runtime.includes("sitePath('"+route+"')"))fail('runtime: global MAP growth shortcut missing '+route);
  if(runtime.includes('href="/artist"')||runtime.includes('href="/producer"')||runtime.includes("fetch('/tagj-data/"))fail('runtime: root-absolute navigation/data dependency breaks subpath hosts');
}

// V15.37: third-party video must remain click-to-play.
for(const p of ['campaign.html','network/billyen.html','music/wanted-me-gone.html','music/hold-something.html','music/cant-crop-karma.html','music/freestyle.html','music/cried-in-the-dark.html','music/the-whole-brand.html']){
  const src=html[p];
  if(/<iframe\b[^>]*\s+src=["']https:\/\/www\.youtube-nocookie\.com\/embed\//i.test(src))fail(p+': eager YouTube iframe source must remain removed');
  if(!src.includes('data-video-src="https://www.youtube-nocookie.com/embed/'))fail(p+': deferred verified video source missing');
  const expected=p==='campaign.html'?'tagj-assets/deferred-video.js':'../tagj-assets/deferred-video.js';
  if(!src.includes(expected))fail(p+': deferred-video runtime missing');
}
const deferredVideo=read('tagj-assets/deferred-video.js');
if(!deferredVideo.includes('iframe[data-video-src]')||!deferredVideo.includes('YouTube loads only after you press play'))fail('deferred-video.js: click-to-play contract missing');

// V15.37: cinematic release continuity + press toolkit.
const releaseContinuity={
  'music/wanted-me-gone.html':'release-wanted-me-gone',
  'music/hold-something.html':'release-hold-something',
  'music/cant-crop-karma.html':'release-cant-crop-karma',
  'music/freestyle.html':'release-freestyle',
  'music/cried-in-the-dark.html':'release-cried-in-the-dark',
  'music/the-whole-brand.html':'release-the-whole-brand'
};
for(const [p,name] of Object.entries(releaseContinuity)){
  if(!html[p].includes('class="release-poster"'))fail(p+': cinematic release poster missing');
  if(!html[p].includes('view-transition-name:'+name))fail(p+': release transition identity missing '+name);
  if(!html[p].includes('class="release-sequence"'))fail(p+': cinematic release sequence missing');
}
if(!html['artist.html'].includes('release-wanted-me-gone')||!html['music/index.html'].includes('transitionName=slug'))fail('Release source transition identities are incomplete');
if(!html['press.html'].includes('id="press-tools"')||!html['press.html'].includes('id="printEpk"')||!html['press.html'].includes('data-copy-target="shortBioText"'))fail('press.html: press toolkit controls missing');

// V15.37: release video rich-result integrity.
for(const p of ['music/wanted-me-gone.html','music/hold-something.html','music/cant-crop-karma.html','music/freestyle.html','music/cried-in-the-dark.html','music/the-whole-brand.html']){
  const src=html[p];
  const blocks=[...src.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const music=blocks.map(m=>{try{return JSON.parse(m[1])}catch(_){return null}}).find(x=>x?.['@type']==='MusicRecording');
  if(!music){fail(p+': MusicRecording schema missing');continue}
  if(music?.byArtist?.['@id']!=='/artist#benny-bundles'||music?.byArtist?.url!=='/artist')fail(p+': MusicRecording byArtist must resolve to canonical Benny artist page');
  if(music?.publisher?.['@id']!=='/artist#tagj'||music?.publisher?.url!=='/tagj')fail(p+': MusicRecording publisher must resolve to canonical TAGJ page');
  if(!String(music?.image||'').startsWith('/tagj-assets/releases/'))fail(p+': MusicRecording image must match first-party release art');
  const videos=Array.isArray(music.subjectOf)?music.subjectOf:[music.subjectOf].filter(Boolean);
  if(!videos.length)fail(p+': VideoObject subjectOf missing');
  for(const v of videos){
    if(v?.['@type']!=='VideoObject')fail(p+': subjectOf must be VideoObject');
    if(!v?.thumbnailUrl)fail(p+': VideoObject missing thumbnailUrl');
    if(!v?.uploadDate)fail(p+': VideoObject missing uploadDate');
    if(!v?.embedUrl)fail(p+': VideoObject missing embedUrl');
    if(v?.creator?.['@id']!=='/artist#benny-bundles'||v?.creator?.url!=='/artist')fail(p+': VideoObject creator must resolve to canonical Benny artist page');
    if(/^Official official\b/i.test(v?.description||''))fail(p+': VideoObject description contains duplicated Official wording');
    if(v?.contentUrl&&/youtu(?:\.be|be\.com)/i.test(v.contentUrl))fail(p+': YouTube watch URL must not be used as VideoObject contentUrl');
  }
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
