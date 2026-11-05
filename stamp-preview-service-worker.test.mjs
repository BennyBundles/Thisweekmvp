import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('./stamp-preview-service-worker.mjs',import.meta.url));
const MARKER="const CACHE_NAME=CACHE_PREFIX+'v4';";
const DIGEST_MARKER="const EXPECTED_ASSET_SHA256=null;";
function fixture(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'thisweek-pwa-fingerprint-'));
  const names=['shell.html','manifest.webmanifest','icon.svg','template.js','sw.js'];
  const paths=names.map(name=>path.join(root,name));
  fs.writeFileSync(paths[0],'<title>This Week — Public Release Preview</title>');
  fs.writeFileSync(paths[1],'{"name":"This Week","scope":"./"}');
  fs.writeFileSync(paths[2],'<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  fs.writeFileSync(paths[3],"const CACHE_PREFIX='this-week-public-preview-';\n"+MARKER+"\n"+DIGEST_MARKER+"\n");
  return {root,paths};
}
function run(paths,verify=false){
  return spawnSync(process.execPath,[script,...(verify?['--verify']:[]),...paths],{encoding:'utf8'});
}
function within(callback){
  const f=fixture();
  try{callback(f);}finally{fs.rmSync(f.root,{recursive:true,force:true});}
}
function stamped(paths){
  const r=run(paths);
  assert.equal(r.status,0,r.stderr);
  return fs.readFileSync(paths[4],'utf8');
}
function cacheId(content){
  const match=content.match(/const CACHE_NAME=CACHE_PREFIX\+'(b[a-f0-9]{64})';/);
  assert.ok(match,'content-addressed cache identifier missing');
  return match[1];
}
test('same staged artifact yields byte-identical cache identity',()=>within(({paths})=>{
  const a=stamped(paths),b=stamped(paths);
  assert.equal(a,b);
  assert.equal(cacheId(a),cacheId(b));
  assert.equal(run(paths,true).status,0);
}));
test('changing shell alone creates distinct cache generation',()=>within(({paths})=>{
  const before=cacheId(stamped(paths));
  fs.appendFileSync(paths[0],'<main>Release updated</main>');
  const after=cacheId(stamped(paths));
  assert.notEqual(before,after);
}));
test('changing manifest alone creates distinct cache generation',()=>within(({paths})=>{
  const before=cacheId(stamped(paths));
  fs.appendFileSync(paths[1],' ');
  assert.notEqual(cacheId(stamped(paths)),before);
}));
test('changing icon alone creates distinct cache generation',()=>within(({paths})=>{
  const before=cacheId(stamped(paths));
  fs.appendFileSync(paths[2],' ');
  assert.notEqual(cacheId(stamped(paths)),before);
}));
test('changing worker template alone creates distinct cache generation',()=>within(({paths})=>{
  const before=cacheId(stamped(paths));
  fs.appendFileSync(paths[3],'// new logic\n');
  assert.notEqual(cacheId(stamped(paths)),before);
}));
test('verify mode rejects stale worker without overwriting it',()=>within(({paths})=>{
  const original=stamped(paths);
  fs.appendFileSync(paths[0],'<p>revision</p>');
  const check=run(paths,true);
  assert.notEqual(check.status,0);
  assert.match(check.stderr,/does not match exact staged assets/);
  assert.equal(fs.readFileSync(paths[4],'utf8'),original);
}));
test('missing, empty or duplicated v4 source marker fails closed',()=>within(({paths})=>{
  const input=fs.readFileSync(paths[3],'utf8');
  for(const broken of [input.replace(MARKER,''),input+MARKER,'']){
    fs.writeFileSync(paths[3],broken);
    const r=run(paths);
    assert.notEqual(r.status,0);
  }
}));
test('empty or missing output inputs fail before writing the worker',()=>within(({paths})=>{
  const original=stamped(paths);
  fs.writeFileSync(paths[2],'');
  const failure=run(paths);
  assert.notEqual(failure.status,0);
  assert.equal(fs.readFileSync(paths[4],'utf8'),original);
}));
test('rendered worker is syntactically valid JavaScript',()=>within(({paths})=>{
  const worker=stamped(paths);
  assert.doesNotThrow(()=>new Function(worker));
  assert.doesNotMatch(worker,/CACHE_NAME=CACHE_PREFIX\+'v4'/);
}));

test('stamped worker pins SHA-256 for all three exact offline assets',()=>within(({paths})=>{
 const actual=stamped(paths);
 for(const key of ['shell','manifest','icon']){
  const wanted=key==='shell'?paths[0]:key==='manifest'?paths[1]:paths[2];
  const digest=createHash('sha256').update(fs.readFileSync(wanted)).digest('hex');
  assert.match(actual,new RegExp('"'+key+'":"'+digest+'"'));
 }
 assert.doesNotMatch(actual,/EXPECTED_ASSET_SHA256=null/);
}));
test('missing or repeated digest injection marker fails closed',()=>within(({paths})=>{
 const original=fs.readFileSync(paths[3],'utf8');
 for(const content of [original.replace(DIGEST_MARKER,''),original+DIGEST_MARKER]){
  fs.writeFileSync(paths[3],content);
  assert.notEqual(run(paths).status,0);
 }
}));
