#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('.tagj-dist');
const sourceRoot=path.resolve('.');
const failures=[];
if(!fs.existsSync(root)){
  console.error('TAGJ package check FAILED\n - .tagj-dist does not exist');
  process.exit(1);
}
const walk=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(ent=>{
  const p=path.join(dir,ent.name);
  return ent.isDirectory()?walk(p):[p];
});
const files=walk(root);
const rel=p=>path.relative(root,p).replaceAll(path.sep,'/');
const fileSet=new Set(files.map(rel));
const textExt=new Set(['.html','.css','.js','.json','.md','.txt']);
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const readSource=p=>fs.readFileSync(path.join(sourceRoot,p),'utf8');

function resolveRef(from,ref){
  if(!ref || ref.startsWith('#') || /^%23/i.test(ref) || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(ref)) return null;
  const clean=ref.split('#')[0].split('?')[0];
  if(!clean) return null;
  const base=path.posix.dirname(from);
  const normalized=clean.startsWith('/')
    ? path.posix.normalize(clean.slice(1))
    : path.posix.normalize(path.posix.join(base,clean)).replace(/^\.\//,'');
  if(fileSet.has(normalized)) return normalized;
  if(!path.posix.extname(normalized)){
    if(fileSet.has(normalized+'.html')) return normalized+'.html';
    if(fileSet.has(path.posix.join(normalized,'index.html'))) return path.posix.join(normalized,'index.html');
  }
  return normalized;
}

const optionalPackagedRefs=new Set();
for(const p of files.map(rel).filter(p=>p.endsWith('.html'))){
  const src=read(p).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
  for(const m of src.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)){
    const raw=m[1], target=resolveRef(p,raw);
    if(target && !fileSet.has(target) && !optionalPackagedRefs.has(target)) failures.push(`${p}: missing packaged reference ${raw} -> ${target}`);
  }
}
for(const p of files.map(rel).filter(p=>p.endsWith('.css'))){
  const src=read(p);
  if(Buffer.byteLength(src,'utf8')>250_000) failures.push(`${p}: CSS is larger than 250 KB; large embedded assets should be external files`);
  for(const m of src.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)){
    const raw=m[1], target=resolveRef(p,raw);
    if(target && !fileSet.has(target)) failures.push(`${p}: missing packaged CSS asset ${raw} -> ${target}`);
  }
}
for(const p of [...fileSet].filter(p=>/\.(?:jpg|jpeg|png)$/i.test(p))){
  const webp=p.replace(/\.(?:jpg|jpeg|png)$/i,'.webp');
  if(fileSet.has(webp)) failures.push(p+': paired raster original shipped beside WebP '+webp);
}

for(const forbidden of ['tagj-assets/network/bsf-tone-066/profile-01.png','tagj-assets/network/t311y-demon-life/profile-01.jpg','tagj-assets/network/t311y-demon-life/tdc-logo.jpg','tagj-assets/network/t311y-demon-life/jimmy-blast-off.png']){
  if(fileSet.has(forbidden)) failures.push(forbidden+' must not ship in the deploy package; canonical equivalent already exists');
}
const forbiddenOperational=[
  'tagj-data/business.v1.json',
  'tagj-data/launch-gates.v1.json',
  'tagj-data/network-assets.v1.json',
  'tagj-data/request-schema.v1.json',
  'tagj-data/sample-review.v1.json',
  'tagj-data/sample-rights-review.v1.json',
  'tagj-data/workflow.v1.json',
  'tagj-data/beat-license-matrix.v1.json',
  'tagj-data/README.md',
  'legal/BEAT_PRODUCER_RIGHTS_SAMPLE_DECLARATION_DRAFT.md',
  'legal/BEAT_SAMPLE_PROVENANCE_ATTESTATION_DRAFT.md'
];
for(const p of forbiddenOperational) if(fileSet.has(p)) failures.push(p+': engineering-only file must not ship in public/protected web package');

for(const requiredLegal of [
  'legal/BEAT_LICENSE_BASIC_MP3_DRAFT.md',
  'legal/BEAT_LICENSE_PREMIUM_WAV_DRAFT.md',
  'legal/BEAT_LICENSE_TRACKOUT_PRO_DRAFT.md',
  'legal/BEAT_LICENSE_UNLIMITED_DRAFT.md',
  'legal/BEAT_LICENSE_EXCLUSIVE_DRAFT.md'
]) if(!fileSet.has(requiredLegal)) failures.push('Missing packaged public license draft: '+requiredLegal);

for(const oldCss of ['tagj-assets/index-v1527.css','tagj-assets/full-v1527.css',...Array.from({length:16},(_,i)=>'tagj-assets/a'+String(i+1).padStart(2,'0')+'.css')]){
  if(fileSet.has(oldCss)) failures.push('Obsolete render-blocking CSS fragment shipped: '+oldCss);
}

for(const required of [
  'index.html','preview.html','full.html','artist.html','producer.html','creative.html','campaign.html','season1.html','vst.html','press.html','site.webmanifest','build-manifest.json',
  'creative/index.html','creative/portfolio.html','creative/case-bsf-tone-066.html','creative/case-t311y-demon-life.html',
  'network/index.html','network/billyen.html','network/bsf-tone-066.html','network/t311y-demon-life.html',
  'tagj-data/beat-catalog.v1.json','tagj-data/catalog.v1.json','tagj-data/current-campaign.v1.json','tagj-data/license-system.v1.json','tagj-data/link-registry.v1.json',
  'tagj-assets/runtime-stability.js','tagj-assets/deferred-video.js','tagj-assets/index-v1528.js','tagj-assets/full-v1528.js','tagj-assets/index-v1528.css','tagj-assets/full-v1528.css','tagj-sw.js',
  'tagj-assets/media/benny-artist-hero.png','tagj-assets/media/asset-fashion-hero.webp','tagj-assets/media/asset-green-set.webp','tagj-assets/media/asset-track-navy.webp',
  'tagj-assets/icons/favicon-32.png','tagj-assets/icons/apple-touch-icon.png','tagj-assets/icons/icon-192.png','tagj-assets/icons/icon-512.png','tagj-assets/icons/icon-512-maskable.png',
  'tagj-assets/releases/wanted-me-gone.webp','tagj-assets/releases/hold-something.webp','tagj-assets/releases/hold-something-lyric.webp',
  'tagj-assets/releases/cant-crop-karma.webp','tagj-assets/releases/freestyle.webp','tagj-assets/releases/cried-in-the-dark.webp','tagj-assets/releases/the-whole-brand.webp'
]){
  if(!fileSet.has(required)) failures.push('Missing packaged critical file: '+required);
}

const mobileNavPages=[
  'tagj.html','artist.html','producer.html','creative.html','campaign.html','season1.html','vst.html','contact.html','licensing.html','press.html',
  'network/index.html','network/billyen.html','network/bsf-tone-066.html','network/t311y-demon-life.html',
  'services/index.html','music/index.html','catalogue/index.html','beats/index.html',
  'creative/index.html','creative/portfolio.html','creative/case-bsf-tone-066.html','creative/case-t311y-demon-life.html','404.html',
  'music/wanted-me-gone.html','music/cant-crop-karma.html','music/freestyle.html',
  'music/cried-in-the-dark.html','music/the-whole-brand.html','music/hold-something.html'
];
for(const p of mobileNavPages){
  if(!fileSet.has(p)) failures.push('Missing packaged mobile route: '+p);
  else if(!read(p).includes('tagj-mobile-nav-v1530')) failures.push(p+': mobile navigation regression guard is missing');
}
if(fileSet.has('artist.html') && !read('artist.html').includes('benny-bundles-entity-schema')){
  failures.push('artist.html: Benny Bundles structured entity metadata is missing');
}
if(fileSet.has('music/index.html') && !read('music/index.html').includes('music-archive-schema')){
  failures.push('music/index.html: structured music archive metadata is missing');
}
for(const p of [
  'music/wanted-me-gone.html','music/cant-crop-karma.html','music/freestyle.html',
  'music/cried-in-the-dark.html','music/the-whole-brand.html','music/hold-something.html'
]){
  if(!fileSet.has(p)) failures.push('Missing packaged release page: '+p);
  else if(!read(p).includes('tagj-release-schema')) failures.push(p+': structured release metadata is missing');
}

for(const p of files.map(rel).filter(p=>p.endsWith('.html'))){
  const src=read(p);
  for(const m of src.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try{ JSON.parse(m[1]); }
    catch(err){ failures.push(`${p}: Invalid JSON-LD: ${err.message}`); }
  }
}
if(fileSet.has('site.webmanifest')){
  try{
    const manifest=JSON.parse(read('site.webmanifest'));
    if(manifest.name!=='Benny Bundles × TAGJ'||manifest.id!=='./'||manifest.start_url!=='./?resume=1'||manifest.scope!=='./') failures.push('site.webmanifest: portable canonical manifest metadata missing');
    if(!Array.isArray(manifest.icons)||manifest.icons.length<3) failures.push('site.webmanifest: icon set incomplete');
    const shortcutUrls=Array.isArray(manifest.shortcuts)?manifest.shortcuts.map(x=>x.url):[];
    for(const url of ['campaign','season1','vst','artist','beats','press']) if(!shortcutUrls.includes(url)) failures.push('site.webmanifest: missing app shortcut '+url);
  }catch(err){failures.push('site.webmanifest: invalid packaged JSON: '+err.message)}
}
for(const p of files.map(rel).filter(p=>p.endsWith('.html'))){
  const src=read(p);
  const depth=p.split('/').length-1;
  const prefix='../'.repeat(depth);
  if(!/<meta\b[^>]*name=["']viewport["'][^>]*content=["'][^"']*viewport-fit=cover[^"']*["'][^>]*>/i.test(src)) failures.push(p+': iPhone viewport-fit=cover metadata missing');
  if(!src.includes('rel="manifest" href="'+prefix+'site.webmanifest"')) failures.push(p+': portable manifest link missing');
  if(!src.includes('rel="apple-touch-icon" sizes="180x180" href="'+prefix+'tagj-assets/icons/apple-touch-icon.png"')) failures.push(p+': portable iPhone icon metadata missing');
  if(!src.includes('sizes="32x32" href="'+prefix+'tagj-assets/icons/favicon-32.png"')) failures.push(p+': portable favicon metadata missing');
  if(/<link\b[^>]*rel=["']manifest["'][^>]*href=["']\//i.test(src)) failures.push(p+': root-absolute manifest link breaks project-subpath hosting');
  for(const token of ['apple-mobile-web-app-capable','apple-mobile-web-app-status-bar-style','mobile-web-app-capable']){
    if(!src.includes(token)) failures.push(p+': standalone install metadata missing '+token);
  }
}

if(!fileSet.has('VERSION.txt')) failures.push('Missing packaged VERSION.txt');
else if(read('VERSION.txt').trim()!=='V15.37') failures.push('VERSION.txt must identify the current V15.37 baseline');
const publicOrigin=(process.env.TAGJ_PUBLIC_ORIGIN||'').trim().replace(/\/$/,'');
try{
  const gates=JSON.parse(readSource('tagj-data/launch-gates.v1.json'));
  if(gates.schemaVersion!==1||gates.baseline!=='V15.37') failures.push('launch gates source baseline mismatch');
}catch(err){failures.push('tagj-data/launch-gates.v1.json source: invalid JSON: '+err.message)}

if(fileSet.has('build-manifest.json')){
  try{
    const bm=JSON.parse(read('build-manifest.json'));
    const campaign=JSON.parse(read('tagj-data/current-campaign.v1.json'));
    const preview=JSON.parse(read('tagj-data/beat-preview-status.v1.json'));
    const gates=JSON.parse(readSource('tagj-data/launch-gates.v1.json'));
    if(bm.schemaVersion!==2) failures.push('build manifest schemaVersion must be 2');
    if(bm.version!=='V15.37') failures.push('build manifest version mismatch');
    if(bm.mode!==(publicOrigin?'public':'protected-preview')) failures.push('build manifest mode mismatch');
    if(bm.campaignId!==campaign.campaignId) failures.push('build manifest campaignId mismatch');
    if(bm.currentRelease!==campaign.release?.id) failures.push('build manifest currentRelease mismatch');
    if(bm.currentCampaignRoute!==campaign.release?.campaignPath||bm.evergreenCampaignRoute!==campaign.release?.evergreenPath) failures.push('build manifest campaign route mismatch');
    if(bm.localBeatPreviewCount!==preview.localPreviewCount||bm.expectedBeatPreviewCount!==preview.expectedPreviewCount||bm.beatPreviewMode!==preview.preferredMode) failures.push('build manifest Beat Vault state mismatch');
    if(bm.launch?.previewStatus!==gates.previewLaunch?.status||bm.launch?.publicStatus!==gates.publicLaunch?.status) failures.push('build manifest launch status mismatch');
    if(bm.launch?.sourceVersion!==gates.previewLaunch?.sourceVersion||bm.launch?.deployedBaseline!==gates.previewLaunch?.deployedBaseline||bm.launch?.previewFreshnessBlocker!==(gates.previewLaunch?.blocker?.id||null)) failures.push('build manifest preview freshness mismatch');
    const expectedBlockers=(gates.publicLaunch?.blockers||[]).filter(x=>x.blocking).map(x=>x.id);
    if(JSON.stringify(bm.launch?.publicBlockers||[])!==JSON.stringify(expectedBlockers)) failures.push('build manifest public blocker list mismatch');
    for(const route of ['/now','/season1','/vst','/subscribe','/press','/contact']) if(!(bm.growthRoutes||[]).includes(route)) failures.push('build manifest missing growth route '+route);
    if(bm.portablePwa!==true) failures.push('build manifest portablePwa flag missing');
    for(const gate of gates.featureGates||[]) if(bm.featureStates?.[gate.id]!==gate.status) failures.push('build manifest feature state mismatch '+gate.id);
  }catch(err){failures.push('build-manifest.json: invalid JSON: '+err.message)}
}

if(!fileSet.has('robots.txt')) failures.push('Missing packaged robots.txt');
else if(publicOrigin){
  if(!read('robots.txt').includes('Allow: /')) failures.push('Public robots.txt must allow crawling');
  if(!fileSet.has('sitemap.xml')) failures.push('Public build is missing sitemap.xml');
  if(fileSet.has('sitemap.xml')){
    const sitemap=read('sitemap.xml');
    for(const canonical of ['/campaign','/season1','/vst','/artist','/producer','/tagj','/press']) if(!sitemap.includes('<loc>'+publicOrigin+canonical+'</loc>')) failures.push('Public sitemap missing canonical growth surface '+canonical);
    for(const shortcut of ['/now','/subscribe','/full']) if(sitemap.includes('<loc>'+publicOrigin+shortcut+'</loc>')) failures.push('Non-canonical shortcut/deep route must not appear in sitemap '+shortcut);
  }
  if(!fileSet.has('.well-known/security.txt')) failures.push('Public build is missing security.txt');
  if(!fileSet.has('releases.xml')) failures.push('Public build is missing releases.xml');
  else{
    const rss=read('releases.xml');
    if(!rss.includes('<title>Benny Bundles Releases</title>')) failures.push('Release RSS title missing');
    for(const slug of ['wanted-me-gone','hold-something','cant-crop-karma','freestyle','cried-in-the-dark','the-whole-brand']){
      if(!rss.includes(publicOrigin+'/music/'+slug)) failures.push('Release RSS missing '+slug);
    }
  }
  if(!fileSet.has('llms.txt')) failures.push('Public build is missing llms.txt');
  else{
    const llms=read('llms.txt');
    if(!llms.startsWith('# Benny Bundles × TAGJ')) failures.push('llms.txt must begin with the canonical site identity');
    if(!llms.includes(publicOrigin+'/artist')||!llms.includes(publicOrigin+'/press')||!llms.includes(publicOrigin+'/campaign')||!llms.includes(publicOrigin+'/season1')||!llms.includes(publicOrigin+'/vst')) failures.push('llms.txt is missing canonical Artist / EPK / Campaign / Season 1 / VST routes');
  }
  const publicRoutes=[
    'index.html','artist.html','producer.html','creative.html','tagj.html','campaign.html','season1.html','vst.html','contact.html','press.html','licensing.html',
    'services/index.html','beats/index.html','catalogue/index.html','music/index.html',
    'music/wanted-me-gone.html','music/hold-something.html','music/cant-crop-karma.html','music/freestyle.html',
    'music/cried-in-the-dark.html','music/the-whole-brand.html','network/index.html','network/bsf-tone-066.html',
    'network/t311y-demon-life.html','network/billyen.html','creative/portfolio.html','creative/case-bsf-tone-066.html','creative/case-t311y-demon-life.html'
  ];
  for(const p of publicRoutes){
    if(!fileSet.has(p)) continue;
    const src=read(p);
    if(/<meta\b[^>]*name=["']robots["']/i.test(src)) failures.push(p+': canonical public route must not remain noindex');
    if(!/<link\b[^>]*rel=["']canonical["']/i.test(src)) failures.push(p+': public canonical link missing');
    if(!/<meta\b[^>]*property=["']og:url["']/i.test(src)) failures.push(p+': public og:url missing');
    if(!src.includes('<meta property="og:site_name" content="Benny Bundles × TAGJ">')) failures.push(p+': public og:site_name missing');
    if(!src.includes('<meta property="og:locale" content="en_US">')) failures.push(p+': public og:locale missing');
    if(!src.includes('rel="alternate" type="application/rss+xml"')||!src.includes(publicOrigin+'/releases.xml')) failures.push(p+': public RSS autodiscovery missing');
    if(!src.includes('rel="author" href="'+publicOrigin+'/artist"')) failures.push(p+': public canonical artist link missing');
    for(const m of src.matchAll(/<meta\b[^>]*(?:property=["']og:image["']|name=["']twitter:image["'])[^>]*content=["']([^"']+)["'][^>]*>/gi)){
      if(m[1].startsWith('/')) failures.push(p+': public social image must be absolute');
    }
    for(const m of src.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
      try{
        const data=JSON.parse(m[1]);
        const mediaKeys=new Set(['@id','url','contentUrl','embedUrl','thumbnailUrl','image','logo']);
        const walk=(value,keyPath='root')=>{
          if(Array.isArray(value)){ value.forEach((item,i)=>walk(item,keyPath+'['+i+']')); return; }
          if(!value||typeof value!=='object')return;
          for(const [key,val] of Object.entries(value)){
            if(mediaKeys.has(key)&&typeof val==='string'&&val.startsWith('/')) failures.push(p+': public structured URL remains root-relative at '+keyPath+'.'+key+' -> '+val);
            walk(val,keyPath+'.'+key);
          }
        };
        walk(data);
      }catch(err){ failures.push(p+': invalid public JSON-LD during URL validation: '+err.message); }
    }
  }
  for(const p of files.map(rel).filter(p=>p.endsWith('.html')&&!publicRoutes.includes(p))){
    const src=read(p);
    if(!src.includes('noindex,follow')) failures.push(p+': non-canonical public HTML must remain noindex,follow');
  }
  if(fileSet.has('full.html')&&!read('full.html').includes('noindex,follow')) failures.push('full.html: deep ecosystem shell must remain noindex,follow');
  for(const p of publicRoutes.filter(p=>p!=='index.html')){
    if(!fileSet.has(p)) continue;
    if(!read(p).includes('id="tagj-breadcrumb-schema"')) failures.push(p+': public breadcrumb schema missing');
  }
  const home=read('index.html');
  const homeSchema=home.match(/<script\b[^>]*id=["']tagj-home-entity-schema["'][^>]*>([\s\S]*?)<\/script>/i);
  if(!homeSchema) failures.push('index.html: public home entity schema missing');
  else{
    try{
      const data=JSON.parse(homeSchema[1]);
      const site=(data['@graph']||[]).find(x=>x&&x['@type']==='WebSite');
      if(!site||site.url!==publicOrigin+'/') failures.push('index.html: public WebSite schema URL missing or incorrect');
      if(!site||site['@id']!==publicOrigin+'/#website') failures.push('index.html: public WebSite @id missing or incorrect');
      if(!Array.isArray(site?.alternateName)||!site.alternateName.includes('TAGJ')) failures.push('index.html: public WebSite alternateName missing TAGJ');
    }catch(err){ failures.push('index.html: unable to validate public WebSite schema: '+err.message); }
  }
}else{
  if(!read('robots.txt').includes('Disallow: /')) failures.push('Protected preview robots.txt must disallow crawling');
  if(fileSet.has('sitemap.xml')) failures.push('Protected preview must not ship a sitemap.xml');
  if(fileSet.has('llms.txt')) failures.push('Protected preview must not ship llms.txt');
  if(fileSet.has('releases.xml')) failures.push('Protected preview must not ship releases.xml');
  if(fileSet.has('.well-known/security.txt')) failures.push('Protected preview must not ship security.txt');
  for(const p of files.map(rel).filter(p=>p.endsWith('.html'))){
    if(!read(p).includes('noindex,nofollow,noarchive')) failures.push(p+': protected preview robots meta is missing');
  }
}
if(!fileSet.has('tagj-data/beat-preview-status.v1.json')) failures.push('Missing generated Beat Vault preview status');
else{
  try{
    const previewStatus=JSON.parse(read('tagj-data/beat-preview-status.v1.json'));
    if(previewStatus.expectedPreviewCount!==22) failures.push('Beat preview status expected count must be 22');
    if(previewStatus.localPreviewsReady!==(previewStatus.localPreviewCount===22)) failures.push('Beat preview readiness does not match packaged preview count');
    const expectedMode=previewStatus.localPreviewCount===22?'local':previewStatus.localPreviewCount>0?'hybrid':'drive_fallback';
    if(previewStatus.preferredMode!==expectedMode) failures.push('Beat preview preferred mode does not match local coverage');
  }catch(err){failures.push('Invalid Beat Vault preview status JSON: '+err.message)}
}
if(fileSet.has('tagj-data/beat-catalog.v1.json')){
  try{
    const beatCatalog=JSON.parse(read('tagj-data/beat-catalog.v1.json'));
    for(const beat of beatCatalog.beats||[]){
      if(!beat.previewUrl)continue;
      const packaged=String(beat.previewUrl).replace(/^\//,'');
      if(!fileSet.has(packaged)) failures.push(`Packaged beat preview missing: ${packaged}`);
    }
  }catch(err){ failures.push('Unable to validate packaged beat previews: '+err.message); }
}
const nonAudioBytes=files
  .filter(p=>!/tagj-assets[\\/]beat-previews[\\/].+\.mp3$/i.test(rel(p)))
  .reduce((n,p)=>n+fs.statSync(p).size,0);
if(nonAudioBytes>9*1048576) failures.push('Non-audio TAGJ package exceeds 9 MB performance budget: '+(nonAudioBytes/1048576).toFixed(1)+' MB');


const packagedPreviewFiles=[...fileSet].filter(p=>/^tagj-assets\/beat-previews\/beat-\d{3}\.mp3$/.test(p));
const packagedPreviewBytes=packagedPreviewFiles.reduce((sum,p)=>sum+fs.statSync(path.join(root,p)).size,0);
for(const p of packagedPreviewFiles){
  if(fs.statSync(path.join(root,p)).size>1_200_000) failures.push('Beat preview exceeds 1.2 MB mobile budget: '+p);
}
if(packagedPreviewBytes>22_000_000) failures.push('Beat preview audio budget exceeded: '+(packagedPreviewBytes/1048576).toFixed(1)+' MB');
const packagedPreviewCount=[...fileSet].filter(p=>/^tagj-assets\/beat-previews\/beat-\d{3}\.mp3$/.test(p)).length;
if(fileSet.has('tagj-data/beat-preview-status.v1.json')){
  try{
    const previewStatus=JSON.parse(read('tagj-data/beat-preview-status.v1.json'));
    if(previewStatus.localPreviewCount!==packagedPreviewCount) failures.push('Beat preview status count does not match packaged MP3 count');
  }catch(_){}
}

if(failures.length){
  console.error('TAGJ package check FAILED');
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
const bytes=files.reduce((n,p)=>n+fs.statSync(p).size,0);
console.log('TAGJ package check PASSED');
console.log(`Files: ${files.length}; package: ${(bytes/1048576).toFixed(1)} MB`);
