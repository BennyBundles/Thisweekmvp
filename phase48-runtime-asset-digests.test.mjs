import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {webcrypto} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const rootUrl='https://thisweek.example/Thisweekmvp/public-preview/';
const stamper=fileURLToPath(new URL('./stamp-preview-service-worker.mjs',import.meta.url));
const workerSource=fileURLToPath(new URL('./public-preview-sw.js',import.meta.url));
const SHELL="<title>This Week — Public Release Preview</title> thisweek.publicPreview.state.v2 connect-src 'none'";
const manifest=JSON.stringify({name:'This Week',scope:'./',start_url:'./?mode=demo'});
const icon='<svg xmlns="http://www.w3.org/2000/svg"></svg>';
function setup(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thisweek-stamped-worker-'));
 const files=['shell.html','manifest.webmanifest','icon.svg','source.js','sw.js'].map(z=>path.join(dir,z));
 for(const [idx,data] of [[0,SHELL],[1,manifest],[2,icon]])fs.writeFileSync(files[idx],data);
 fs.copyFileSync(workerSource,files[3]);
 const result=spawnSync(process.execPath,[stamper,...files],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const source=fs.readFileSync(files[4],'utf8');
 const integrity=source.match(/EXPECTED_ASSET_SHA256=Object\.freeze\((\{[^}]+\})\)/);
 assert.ok(integrity,'Digest map must be stamped');
 return {dir,files,source,digests:JSON.parse(integrity[1])};
}
function harness({mutate={},cryptoEnabled=true}={}){
 const f=setup(),listeners=new Map(),stores=new Map();
 const stats={skipped:0,claimed:0,cached:[],network:[]};
 const getStore=name=>{if(!stores.has(name))stores.set(name,new Map());return stores.get(name);};
 const key=x=>typeof x==='string'?x:x.url;
 const caches={
  async keys(){return [...stores.keys()];},
  async open(name){const store=getStore(name);return{
   async put(url,value){store.set(key(url),value.clone());stats.cached.push(key(url));},
   async match(url){return store.get(key(url))?.clone();},
   async delete(url){return store.delete(key(url));}
  };},
  async delete(name){return stores.delete(name)}
 };
 const self={
  registration:{scope:rootUrl},crypto:cryptoEnabled?{subtle:webcrypto.subtle}:undefined,
  addEventListener(name,cb){listeners.set(name,cb)},
  skipWaiting(){stats.skipped++;return Promise.resolve()},
  clients:{claim(){stats.claimed++;return Promise.resolve()}}
 };
 let offline=false;
 function responseOf(url){
  const type=url.endsWith('manifest.webmanifest')?'manifest':url.endsWith('icon.svg')?'icon':'shell';
  const body=(mutate[type]===undefined)?({shell:SHELL,manifest,icon}[type]):mutate[type];
  const mime={shell:'text/html',manifest:'application/manifest+json',icon:'image/svg+xml'}[type];
  return new Response(body,{status:200,headers:{'content-type':mime}});
 }
 async function fetch(url){
  stats.network.push(key(url));
  if(offline)throw Error('network disconnected');
  return responseOf(key(url).split('?')[0]);
 }
 vm.runInNewContext(f.source,{self,caches,fetch,URL,Set,Promise,Uint8Array,Response},
  {filename:'built-public-preview-sw.js'});
 async function emit(type,request){
  const jobs=[],event={request,waitUntil(p){jobs.push(Promise.resolve(p));},
    respondWith(p){this.response=Promise.resolve(p)}};
  listeners.get(type)(event);
  const response=event.response?await event.response:undefined;
  await Promise.all(jobs);
  return response;
 }
 return {f,caches,stores,stats,emit,offline(v){offline=v},changeShell(content){mutate.shell=content},request(relative='./'){return {
   url:new URL(relative,rootUrl).href,mode:'navigate',method:'GET'}},cleanup(){fs.rmSync(f.dir,{recursive:true,force:true})}};
}
async function using(opts,fn){const h=harness(opts);try{return await fn(h)}finally{h.cleanup()}}
test('published worker receives three full SHA-256 digests and installs intact known assets',async()=>using({},async h=>{
 for(const n of ['shell','manifest','icon'])assert.match(h.f.digests[n],/^[a-f0-9]{64}$/);
 await h.emit('install');
 assert.equal(h.stats.skipped,1);
 assert.equal(h.stats.cached.length,3);
 assert.equal([...h.stores.values()][0].size,3);
}));
test('valid-looking stale shell is rejected even if all HTML identity markers are present',async()=>using({mutate:{shell:SHELL+'<!-- old CDN shell -->'}},async h=>{
 await assert.rejects(h.emit('install'),/Unverified offline preview install asset/);
 assert.equal(h.stats.skipped,0);
 assert.equal(h.stores.size,0);
}));
test('well-formed but byte-different webmanifest cannot activate a new worker',async()=>using({mutate:{manifest:manifest+' '}},async h=>{
 await assert.rejects(h.emit('install'),/Unverified offline preview install asset/);
 assert.equal(h.stats.skipped,0);
}));
test('visually equivalent but byte-different SVG icon cannot poison the cache',async()=>using({mutate:{icon:icon+'\n'}},async h=>{
 await assert.rejects(h.emit('install'),/Unverified offline preview install asset/);
 assert.equal(h.stats.skipped,0);
}));
test('published worker fails closed if required Web Crypto is unavailable',async()=>using({cryptoEnabled:false},async h=>{
 await assert.rejects(h.emit('install'),/Unverified offline preview install asset/);
 assert.equal(h.stats.skipped,0);
}));
test('online CDN shell drift cannot overwrite the last verified offline shell',async()=>using({},async h=>{
 await h.emit('install');const name=[...h.stores.keys()][0];const original=await h.stores.get(name).get(rootUrl).clone().text();
 h.stats.cached.length=0;
 h.changeShell(SHELL+'<!-- CDN drift -->');
 const live=await h.emit('fetch',h.request('./?mode=demo'));
 assert.match(await live.text(),/CDN drift/);
 assert.equal(h.stats.cached.length,0,'drifted response must never be cached');
 assert.equal(await h.stores.get(name).get(rootUrl).clone().text(),original);
 h.offline(true);
 const offline=await h.emit('fetch',h.request('./?mode=demo'));
 assert.equal(await offline.text(),original);
}));
test('offline shell remains available when current-generation network is down',async()=>using({},async h=>{
 await h.emit('install');
 h.offline(true);
 const response=await h.emit('fetch',h.request('./?mode=demo'));
 assert.equal(await response.text(),SHELL);
}));
test('a verified worker never contains the template-only null asset digest mapping',async()=>using({},async h=>{
 assert.doesNotMatch(h.f.source,/const EXPECTED_ASSET_SHA256=null/);
 assert.match(h.f.source,/CACHE_NAME=CACHE_PREFIX\+'b[a-f0-9]{64}'/);
}));
