#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('.tagj-dist');
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

function resolveRef(from,ref){
  if(!ref || ref.startsWith('#') || /^%23/i.test(ref) || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(ref)) return null;
  const clean=ref.split('#')[0].split('?')[0];
  if(!clean) return null;
  const base=path.posix.dirname(from);
  const normalized=path.posix.normalize(path.posix.join(base,clean)).replace(/^\.\//,'');
  if(fileSet.has(normalized)) return normalized;
  if(!path.posix.extname(normalized)){
    if(fileSet.has(normalized+'.html')) return normalized+'.html';
    if(fileSet.has(path.posix.join(normalized,'index.html'))) return path.posix.join(normalized,'index.html');
  }
  return normalized;
}

for(const p of files.map(rel).filter(p=>p.endsWith('.html'))){
  const src=read(p).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
  for(const m of src.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)){
    const raw=m[1], target=resolveRef(p,raw);
    if(target && !fileSet.has(target)) failures.push(`${p}: missing packaged reference ${raw} -> ${target}`);
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
for(const forbidden of ['tagj-assets/network/bsf-tone-066/profile-01.png','tagj-assets/network/t311y-demon-life/profile-01.jpg','tagj-assets/network/t311y-demon-life/tdc-logo.jpg','tagj-assets/network/t311y-demon-life/jimmy-blast-off.png']){
  if(fileSet.has(forbidden)) failures.push(forbidden+' must not ship in the deploy package; canonical equivalent already exists');
}
for(const oldCss of ['tagj-assets/index-v1527.css','tagj-assets/full-v1527.css',...Array.from({length:16},(_,i)=>'tagj-assets/a'+String(i+1).padStart(2,'0')+'.css')]){
  if(fileSet.has(oldCss)) failures.push('Obsolete render-blocking CSS fragment shipped: '+oldCss);
}

for(const required of [
  'index.html','preview.html','full.html','artist.html','producer.html','creative.html',
  'creative/index.html','creative/portfolio.html','creative/case-bsf-tone-066.html','creative/case-t311y-demon-life.html',
  'network/index.html','network/bsf-tone-066.html','network/t311y-demon-life.html',
  'tagj-assets/runtime-stability.js','tagj-assets/index-v1528.js','tagj-assets/full-v1528.js','tagj-assets/index-v1528.css','tagj-assets/full-v1528.css','tagj-sw.js',
  'tagj-assets/media/asset-fashion-hero.jpg','tagj-assets/media/asset-green-set.jpg','tagj-assets/media/asset-track-navy.jpg'
]){
  if(!fileSet.has(required)) failures.push('Missing packaged critical file: '+required);
}

const mobileNavPages=[
  'tagj.html','artist.html','producer.html','creative.html','contact.html','licensing.html',
  'network/index.html','network/bsf-tone-066.html','network/t311y-demon-life.html',
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
if(!fileSet.has('VERSION.txt')) failures.push('Missing packaged VERSION.txt');
else if(read('VERSION.txt').trim()!=='V15.30') failures.push('VERSION.txt must identify the current V15.30 baseline');
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
const packagedPreviewCount=[...fileSet].filter(p=>/^tagj-assets\/beat-previews\/beat-\d{3}\.mp3$/.test(p)).length;
if(packagedPreviewCount>0 && packagedPreviewCount!==22) failures.push('Package contains a partial site-hosted beat preview set: '+packagedPreviewCount+'/22');
if(packagedPreviewCount===22 && !fileSet.has('tagj-assets/media/benny-artist-hero.webp')) failures.push('Full public asset bundle is missing benny-artist-hero.webp');

if(failures.length){
  console.error('TAGJ package check FAILED');
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
const bytes=files.reduce((n,p)=>n+fs.statSync(p).size,0);
console.log('TAGJ package check PASSED');
console.log(`Files: ${files.length}; package: ${(bytes/1048576).toFixed(1)} MB`);
