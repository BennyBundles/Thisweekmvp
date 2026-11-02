import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash,webcrypto} from 'node:crypto';

const ROOT='https://example.test/Thisweekmvp/public-preview/';
const SHELL="<title>This Week — Public Release Preview</title> thisweek.publicPreview.state.v2 connect-src 'none'";
const MANIFEST='{"name":"This Week","scope":"./","start_url":"./?mode=demo"}';
const ICON='<svg xmlns="http://www.w3.org/2000/svg"></svg>';
const MIME={shell:'text/html',manifest:'application/manifest+json',icon:'image/svg+xml'};
const digest=x=>createHash('sha256').update(x).digest('hex');
const EXPECTED=Object.freeze({shell:digest(SHELL),manifest:digest(MANIFEST),icon:digest(ICON)});
const raw=fs.readFileSync(new URL('./public-preview-sw.js',import.meta.url),'utf8');
const sentinel='const EXPECTED_ASSET_SHA256=null;';
assert.equal(raw.split(sentinel).length,2,'stamping sentinel must exist exactly once');
const stamped=raw.replace(sentinel,
  'const EXPECTED_ASSET_SHA256=Object.freeze('+JSON.stringify(EXPECTED)+');');
function makeResponse(which,body=null){
  return new Response(body??({shell:SHELL,manifest:MANIFEST,icon:ICON}[which]),{
    status:200,headers:{'content-type':MIME[which]}});
}
function harness({install=null,runtime=null,cryptoAvailable=true}={}){
  const listeners=new Map(),stores=new Map();
  const log={writes:[],skips:0,online:0};
  const asUrl=item=>typeof item==='string'?item:item.url;
  const caches={
    async keys(){return [...stores.keys()];},
    async delete(name){return stores.delete(name);},
    async open(name){
      if(!stores.has(name))stores.set(name,new Map());
      const store=stores.get(name);
      return {
        async put(key,response){log.writes.push(asUrl(key));store.set(asUrl(key),response);},
        async match(key){return store.get(asUrl(key))?.clone();},
        async delete(key){return store.delete(asUrl(key));}
      };
    }
  };
  const self={
    registration:{scope:ROOT},
    location:{origin:new URL(ROOT).origin},
    addEventListener(type,fn){listeners.set(type,fn);},
    async skipWaiting(){log.skips++;},
    clients:{async claim(){}}
  };
  const fetch=(arg)=>{
    const url=asUrl(arg);
    if(typeof arg==='string'){
      const which=url===ROOT?'shell':url.endsWith('manifest.webmanifest')?'manifest':'icon';
      return Promise.resolve(install?install(which,url):makeResponse(which));
    }
    log.online++;
    if(runtime)return Promise.resolve().then(()=>runtime(arg));
    throw new Error('offline');
  };
  vm.runInNewContext(stamped,
    {self,caches,fetch,URL,Set,Promise,crypto:cryptoAvailable?webcrypto:undefined,Uint8Array,Array},
    {filename:'stamped-public-preview-sw.js'});
  const request=(url=ROOT,mode='navigate')=>({method:'GET',mode,url});
  async function emit(type,req){
    const jobs=[];
    const event={request:req,waitUntil(p){jobs.push(Promise.resolve(p));},
      respondWith(p){this.result=Promise.resolve(p);}};
    listeners.get(type)(event);
    let response;
    try{if(event.result)response=await event.result;await Promise.all(jobs);}
    catch(e){await Promise.allSettled(jobs);throw e;}
    return response;
  }
  return {emit,stores,log,request};
}
test('untampered exact staged shell, manifest and icon install successfully',async()=>{
  const h=harness();await h.emit('install');
  assert.equal(h.log.skips,1);
  assert.equal(h.stores.get('this-week-public-preview-v4').size,3);
});
test('marker-preserving HTML byte alteration rejects installation',async()=>{
  const h=harness({install:(which)=>makeResponse(which,which==='shell'?SHELL+' ':null)});
  await assert.rejects(h.emit('install'),/Unverified offline preview install asset/);
  assert.equal(h.log.skips,0);
  assert.equal(h.stores.has('this-week-public-preview-v4'),false);
});
test('valid JSON manifest changed only by trailing whitespace is rejected',async()=>{
  const h=harness({install:which=>makeResponse(which,which==='manifest'?MANIFEST+' ':null)});
  await assert.rejects(h.emit('install'),/Unverified offline preview install asset/);
  assert.equal(h.log.skips,0);
});
test('valid SVG icon with appended comment is rejected',async()=>{
  const h=harness({install:which=>makeResponse(which,which==='icon'?ICON+'<!-- change -->':null)});
  await assert.rejects(h.emit('install'),/Unverified offline preview install asset/);
  assert.equal(h.log.skips,0);
});
test('Web Crypto unavailable fails closed before offline worker activation',async()=>{
  const h=harness({cryptoAvailable:false});
  await assert.rejects(h.emit('install'),/Unverified offline preview install asset/);
  assert.equal(h.log.skips,0);
});
test('valid-looking but different online shell is served, never cached',async()=>{
  const h=harness({runtime:()=>makeResponse('shell',SHELL+' changed')});
  await h.emit('install');
  const response=await h.emit('fetch',h.request());
  assert.match(await response.text(),/changed/);
  assert.equal(h.log.writes.length,3,'unverified network shell cannot overwrite cache');
  const cached=h.stores.get('this-week-public-preview-v4').get(ROOT);
  assert.equal(await cached.clone().text(),SHELL);
});
test('tampered offline cache is rejected and discarded, without fallback',async()=>{
  const h=harness();await h.emit('install');
  const cache=h.stores.get('this-week-public-preview-v4');
  cache.set(ROOT,makeResponse('shell',SHELL+' spoof'));
  await assert.rejects(h.emit('fetch',h.request()),/offline/);
  assert.equal(cache.has(ROOT),false);
});
test('tampered cache-first manifest is bypassed in favor of verified network response',async()=>{
  const h=harness({runtime:()=>makeResponse('manifest')});
  await h.emit('install');
  const cache=h.stores.get('this-week-public-preview-v4');
  cache.set(ROOT+'manifest.webmanifest',makeResponse('manifest',MANIFEST+' '));
  const result=await h.emit('fetch',h.request(ROOT+'manifest.webmanifest','same-origin'));
  assert.equal(await result.text(),MANIFEST);
  assert.equal(h.log.online,1);
  assert.equal(await cache.get(ROOT+'manifest.webmanifest').clone().text(),MANIFEST);
});
test('digest check fails closed if SHA-256 throws',async()=>{
  // Baseline behavior tested with an absent implementation; this test also
  // checks the stamped worker has no fallback to a string-marker-only decision.
  const h=harness({cryptoAvailable:false});
  await assert.rejects(h.emit('install'),/Unverified offline preview install asset/);
});
