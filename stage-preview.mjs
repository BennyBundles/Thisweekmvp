#!/usr/bin/env node
/**
 * Preview-only deterministic static artifact for the existing GitHub Pages application.
 * Never produces a production release manifest or performs provider/financial writes.
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=process.cwd();
const out=path.resolve(root,'_site');
const assets=[
  ['preview.html','preview.html'],
  ['public-preview-manifest.webmanifest','public-preview/manifest.webmanifest'],
  ['public-preview-sw.js','public-preview/sw.js'],
  ['public-preview-icon.svg','public-preview/icon.svg'],
  ['money-lab/index.html','money-lab/index.html'],
  ['money-lab/app.js','money-lab/app.js'],
  ['account/index.html','account/index.html'],
  ['account/app.js','account/app.js'],
  ['account/release-config.js','account/release-config.js'],
  ['ops/index.html','ops/index.html'],
  ['ops/app.js','ops/app.js'],
  ['ops/release/index.html','ops/release/index.html'],
  ['ops/release/app.js','ops/release/app.js'],
  ['ops/bootstrap/index.html','ops/bootstrap/index.html'],
  ['ops/bootstrap/app.js','ops/bootstrap/app.js'],
  ['support/index.html','support/index.html'],
  ['support/app.js','support/app.js'],
  ['legal/sandbox/index.html','legal/sandbox/index.html'],
];
function requireFile(rel){
  const p=path.resolve(root,rel);
  if(!p.startsWith(root+path.sep) || !fs.existsSync(p) || !fs.statSync(p).isFile())
    throw new Error('Required source missing: '+rel);
  return p;
}
function call(script,...args){
  const result=spawnSync(process.execPath,[requireFile(script),...args],{cwd:root,stdio:'inherit',env:process.env});
  if(result.status!==0)throw new Error(script+' failed with '+(result.status??result.error?.message));
}
function hash(file){return createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
const validators=[
  ['public-preview-check.mjs','_site/public-preview/index.html'],
  ['money-lab-check.mjs','_site/money-lab/index.html','_site/money-lab/app.js'],
  ['account-check.mjs','_site/account/index.html','_site/account/app.js','_site/account/release-config.js'],
  ['ops-check.mjs','_site/ops/index.html','_site/ops/app.js'],
  ['phase34-check.mjs'],
  ['phase34c-check.mjs'],
  ['support-check.mjs','_site/support/index.html','_site/support/app.js'],
  ['legal-check.mjs','_site/legal/sandbox/index.html'],
];
try {
  if(process.env.VERCEL_ENV==='production')throw new Error('Production is owned by GitHub Pages; preview-only build blocked');
  if(out!==path.join(root,'_site'))throw new Error('Unsafe artifact directory');
  for(const [src]of assets)requireFile(src);
  for(const f of ['index.html','prepare-site.mjs','prepare-public-preview.mjs',...validators.map(x=>x[0])])requireFile(f);
  fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
  call('prepare-site.mjs','index.html','_site/index.html');
  call('prepare-public-preview.mjs','index.html','_site/public-preview.source.html');
  call('prepare-site.mjs','_site/public-preview.source.html','_site/public-preview/index.html');
  fs.rmSync(path.join(out,'public-preview.source.html'),{force:true});
  for(const [src,dst]of assets){
    const dest=path.join(out,dst);
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.copyFileSync(requireFile(src),dest);
  }
  // All route validators must be present and pass on the staged artifact.
  // Never silently skip a security check if a file was accidentally removed.
  for(const [script,...args] of validators)call(script,...args);
  const paths=['index.html','public-preview/index.html',...assets.map(x=>x[1])];
  const hashes={};
  for(const rel of paths){
    const file=path.join(out,rel);
    if(!fs.statSync(file).size)throw new Error('Empty artifact: '+rel);
    hashes[rel]=hash(file);
  }
  if(fs.existsSync(path.join(out,'release.json')))throw new Error('Production manifest forbidden in previews');
  const raw=process.env.VERCEL_GIT_COMMIT_SHA||'';
  const identity=/^[a-f0-9]{40}$/.test(raw)?raw:null;
  const manifest={schema:'thisweek.preview-artifact.v1',channel:'preview',sourceCommit:identity,
    sourceBranch:process.env.VERCEL_GIT_COMMIT_REF||null,assets:hashes};
  fs.writeFileSync(path.join(out,'preview-build.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({status:'PASS',channel:'preview',assets:paths.length,commit:identity,
    manifestHash:hash(path.join(out,'preview-build.json'))}));
}catch(e){console.error('PREVIEW_BUILD_FAILED: '+(e?.message||e));process.exitCode=1;}
