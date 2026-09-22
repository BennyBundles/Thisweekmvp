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

for(const required of [
  'index.html','preview.html','full.html','artist.html','producer.html','creative.html',
  'creative/index.html','creative/portfolio.html','creative/case-bsf-tone-066.html','creative/case-t311y-demon-life.html',
  'network/index.html','network/bsf-tone-066.html','network/t311y-demon-life.html',
  'tagj-assets/runtime-stability.js','tagj-assets/index-v1527.css','tagj-assets/full-v1527.css','tagj-sw.js',
  'tagj-assets/media/asset-fashion-hero.jpg','tagj-assets/media/asset-green-set.jpg','tagj-assets/media/asset-track-navy.jpg'
]){
  if(!fileSet.has(required)) failures.push('Missing packaged critical file: '+required);
}

if(failures.length){
  console.error('TAGJ package check FAILED');
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
const bytes=files.reduce((n,p)=>n+fs.statSync(p).size,0);
console.log('TAGJ package check PASSED');
console.log(`Files: ${files.length}; package: ${(bytes/1048576).toFixed(1)} MB`);
