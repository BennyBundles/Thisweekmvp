#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

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

// Media manifest regression gate: every owned beat gets one playable packaged sample.
const beatCatalogPath='tagj-data/beat-catalog.v1.json';
if(fileSet.has(beatCatalogPath)){
  try{
    const parsed=JSON.parse(read(beatCatalogPath));
    const beats=Array.isArray(parsed.beats)?parsed.beats:[];
    if(beats.length!==22) failures.push('Expected 22 catalogued beats; found '+beats.length);
    const paths=new Set();
    for(const beat of beats){
      const clip=(beat.previewUrl||'').replace(/^\/+/, '');
      if(!/^tagj-assets\/beat-previews\/beat-\d{3}\.mp3$/.test(clip)) failures.push('Invalid audio preview path for '+beat.id+': '+clip);
      if(clip!=='tagj-assets/beat-previews/'+beat.id+'.mp3') failures.push('Audio sample ID mismatch for '+beat.id);
      if(paths.has(clip)) failures.push('Duplicate beat preview path '+clip);
      paths.add(clip);
      if(!fileSet.has(clip)){failures.push('Missing packaged music sample '+clip);continue;}
      const bytes=fs.readFileSync(path.join(root,clip));
      if(bytes.length<100_000) failures.push('Audio sample too short/empty: '+clip);
      const isId3=bytes.toString('ascii',0,3)==='ID3';
      const isMp3Frame=bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0;
      if(!isId3&&!isMp3Frame) failures.push('Music sample missing MP3 signature: '+clip);
    }
    const packaged=files.map(rel).filter(p=>/^tagj-assets\/beat-previews\/beat-\d{3}\.mp3$/.test(p));
    if(packaged.length!==22) failures.push('Expected 22 packaged MP3s; found '+packaged.length);
  }catch(e){failures.push('Could not validate 22-sample audio manifest: '+e.message)}
}else failures.push('Missing packaged beat catalogue');

// Pass 2: compile the real shipped playback scripts; no JS execution or side effects.
for(const p of ['tagj-assets/index-v1528.js','tagj-assets/full-v1528.js','tagj-assets/restoration-pass1.js']){
  if(!fileSet.has(p)){failures.push('Missing browser JavaScript '+p);continue;}
  try{new vm.Script(read(p),{filename:p})}catch(e){failures.push('Browser JS syntax error in '+p+': '+e.message)}
}
for(const p of ['music/index.html','beats/index.html']){
  if(!fileSet.has(p))continue;
  for(const m of read(p).matchAll(/<script\\b(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/script>/gi)){
    if(!m[1].trim())continue;
    try{new vm.Script(m[1],{filename:p+' inline'})}catch(e){failures.push('Inline media player syntax error in '+p+': '+e.message)}
  }
}
// Only preexisting verified YouTube source records may become embedded videos.
const linkRegistryPath='tagj-data/link-registry.v1.json';
if(fileSet.has(linkRegistryPath)){
  try{
    const registry=JSON.parse(read(linkRegistryPath));
    const vids=Object.entries(registry.releases||{}).flatMap(([k,v])=>
      ['youtubeVideo','youtubeLyricVisualizer'].map(type=>v[type])
        .filter(x=>x?.status==='verified'&&x?.url).map(x=>x.url));
    if(vids.length!==7)failures.push('Expected 7 preverified YouTube video links, found '+vids.length);
    for(const u of vids)if(!/^https:\\/\\/youtu\\.be\\/[A-Za-z0-9_-]{11}(?:[?&#]|$)/.test(u)&&
       !/^https:\\/\\/(?:www\\.)?youtube\\.com\\/watch\\?v=[A-Za-z0-9_-]{11}(?:[?&#]|$)/.test(u))
       failures.push('Unsupported YouTube video URL: '+u);
  }catch(e){failures.push('Verified video registry check failed: '+e.message)}
}else failures.push('Missing verified video link registry');

if(failures.length){
  console.error('TAGJ package check FAILED');
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
const bytes=files.reduce((n,p)=>n+fs.statSync(p).size,0);
console.log('TAGJ package check PASSED');
console.log(`Files: ${files.length}; package: ${(bytes/1048576).toFixed(1)} MB`);
