#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('.');
const failures=[];
const warnings=[];
const textExt=new Set(['.html','.css','.js','.mjs','.cjs','.json','.md','.txt','.yml','.yaml','.sh','.xml','.webmanifest']);
const ignoreDirs=new Set(['.git','node_modules','.tagj-dist','.next','dist','build','.vercel']);
const tagjRoots=[
  'tagj-assets','tagj-data','legal','network','music','beats','catalogue','services','creative','.github/workflows'
];
const tagjFiles=new Set([
  'index.html','preview.html','full.html','tagj.html','artist.html','producer.html','campaign.html','contact.html',
  'licensing.html','press.html','404.html','site.webmanifest','tagj-sw.js','vercel.json','PROMOTION_RUNBOOK.md'
]);

const files=[];
const walk=dir=>{
  if(!fs.existsSync(dir))return;
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(ignoreDirs.has(ent.name))continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())walk(p);
    else if(textExt.has(path.extname(ent.name))||ent.name==='site.webmanifest')files.push(p);
  }
};
for(const dir of tagjRoots)walk(path.join(root,dir));
for(const file of tagjFiles){
  const p=path.join(root,file);
  if(fs.existsSync(p))files.push(p);
}

const unique=[...new Set(files)];
const patterns=[
  {name:'legacy internal delivery Gmail',re:/prodbybundlez@gmail\.com/ig},
  {name:'GitHub personal access token',re:/\bghp_[A-Za-z0-9]{30,}\b/g},
  {name:'GitHub fine-grained token',re:/\bgithub_pat_[A-Za-z0-9_]{40,}\b/g},
  {name:'OpenAI-style secret key',re:/\bsk-[A-Za-z0-9_-]{20,}\b/g},
  {name:'Stripe live secret key',re:/\bsk_live_[A-Za-z0-9]{20,}\b/g},
  {name:'Hugging Face access token',re:/\bhf_[A-Za-z0-9]{20,}\b/g},
  {name:'AWS access key',re:/\bAKIA[0-9A-Z]{16}\b/g}
];

for(const file of unique){
  let src='';
  try{src=fs.readFileSync(file,'utf8')}catch{continue}
  const rel=path.relative(root,file).replaceAll(path.sep,'/');
  for(const {name,re} of patterns){
    re.lastIndex=0;
    if(re.test(src))failures.push(rel+': detected '+name);
  }
  if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(src))failures.push(rel+': private key material detected');
  if(/(?:api|secret|access)[_-]?key\s*[:=]\s*["'][^"'\s]{16,}["']/i.test(src))warnings.push(rel+': review possible inline credential assignment');
}

if(failures.length){
  console.error('TAGJ public-source security check FAILED');
  failures.forEach(x=>console.error(' - '+x));
  warnings.forEach(x=>console.warn(' ! '+x));
  process.exit(1);
}
console.log('TAGJ public-source security check PASSED');
console.log('Scanned files: '+unique.length);
warnings.forEach(x=>console.warn(' ! '+x));
