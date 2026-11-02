import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const SOURCE=fs.readFileSync(new URL('./public-preview-sw.js',import.meta.url),'utf8');
const ROOT='https://example.test/Thisweekmvp/public-preview/';

function harness({fetchImpl=()=>Promise.resolve(new Response('online',{status:200})),failPut=false}={}){
  const listeners=new Map(),cacheStores=new Map();
  const tracking={fetches:[],claimed:0,skipped:0,puts:[]};
  const requestUrl=key=>new URL(typeof key==='string'?key:key.url,ROOT).href;
  const getStore=name=>{
    if(!cacheStores.has(name))cacheStores.set(name,new Map());
    return cacheStores.get(name);
  };
  const caches={
    async open(name){
      const store=getStore(name);
      return {
        async addAll(keys){
          for(const key of keys)store.set(requestUrl(key),
            new Response('preinstalled:'+requestUrl(key),{status:200}));
        },
        async put(key,response){
          if(failPut)throw new Error('quota exceeded');
          tracking.puts.push(requestUrl(key));
          store.set(requestUrl(key),response);
        }
      };
    },
    async match(key){
      for(const store of cacheStores.values()){
        const hit=store.get(requestUrl(key));
        if(hit)return hit.clone();
      }
      return undefined;
    },
    async keys(){return [...cacheStores.keys()];},
    async delete(name){return cacheStores.delete(name);}
  };
  const self={
    registration:{scope:ROOT},
    location:{origin:new URL(ROOT).origin},
    addEventListener(type,callback){listeners.set(type,callback);},
    skipWaiting(){tracking.skipped++;return Promise.resolve();},
    clients:{claim(){tracking.claimed++;return Promise.resolve();}}
  };
  const fetch=request=>{
    tracking.fetches.push(request.url);
    return fetchImpl(request);
  };
  vm.runInNewContext(SOURCE,{self,caches,fetch,URL,Set,Promise},
    {filename:'public-preview-sw.js'});
  async function emit(type,request){
    const jobs=[];
    const event={
      request,
      waitUntil(promise){jobs.push(Promise.resolve(promise));},
      respondWith(promise){this.responsePromise=Promise.resolve(promise);}
    };
    listeners.get(type)(event);
    let response;
    if(event.responsePromise)response=await event.responsePromise;
    await Promise.all(jobs);
    return {response,handled:Boolean(event.responsePromise),jobs:jobs.length};
  }
  const request=(relative,mode='navigate')=>({
    url:new URL(relative,ROOT).href,mode,method:'GET'
  });
  return {emit,request,caches,cacheStores,tracking};
}

test('install caches only the known public shell and two static assets',async()=>{
  const h=harness();await h.emit('install');
  assert.equal(h.tracking.skipped,1);
  assert.deepEqual([...h.cacheStores.keys()],['this-week-public-preview-v2']);
  assert.equal([...h.cacheStores.values()][0].size,3);
});

test('activate deletes stale preview versions but no other product caches',async()=>{
  const h=harness();await h.emit('install');
  h.cacheStores.set('this-week-public-preview-v1',new Map());
  h.cacheStores.set('other-product-cache',new Map());
  await h.emit('activate');
  assert.equal(h.cacheStores.has('this-week-public-preview-v1'),false);
  assert.equal(h.cacheStores.has('this-week-public-preview-v2'),true);
  assert.equal(h.cacheStores.has('other-product-cache'),true);
  assert.equal(h.tracking.claimed,1);
});

test('fresh shell updates offline fallback regardless of demo/reset query',async()=>{
  let online=true;
  const h=harness({fetchImpl:async()=>{
    if(!online)throw new Error('offline');
    return new Response('live version',{status:200});
  }});
  await h.emit('install');
  const live=await h.emit('fetch',h.request('./?mode=demo'));
  assert.equal(await live.response.text(),'live version');
  assert.equal(h.tracking.puts.at(-1),ROOT);
  online=false;
  const offline=await h.emit('fetch',h.request('./?mode=demo&reset=1'));
  assert.equal(await offline.response.text(),'live version');
});

test('404 navigation never overwrites offline shell',async()=>{
  let network=new Response('not found',{status:404});
  const h=harness({fetchImpl:async()=>{
    if(!network)throw new Error('offline');
    return network;
  }});
  await h.emit('install');
  const bad=await h.emit('fetch',h.request('./'));
  assert.equal(bad.response.status,404);
  assert.equal(h.tracking.puts.length,0);
  network=null;
  const recovered=await h.emit('fetch',h.request('./'));
  assert.equal(recovered.response.status,200);
  assert.match(await recovered.response.text(),/preinstalled:/);
});

test('server failures and redirects cannot poison cached shell',async()=>{
  let response=new Response('server down',{status:500});
  const h=harness({fetchImpl:async()=>response});
  await h.emit('install');
  await h.emit('fetch',h.request('./'));
  assert.equal(h.tracking.puts.length,0);
  response={ok:true,status:200,redirected:true,url:ROOT,clone(){return this;}};
  await h.emit('fetch',h.request('./'));
  assert.equal(h.tracking.puts.length,0);
});

test('unknown preview navigations never replace offline shell',async()=>{
  const h=harness();await h.emit('install');
  const result=await h.emit('fetch',h.request('./missing/'));
  assert.equal(result.handled,false);
  assert.equal(h.tracking.fetches.length,0);
  assert.equal(h.tracking.puts.length,0);
});

test('cross-origin, POST and unrelated requests bypass service worker',async()=>{
  const h=harness();await h.emit('install');
  for(const request of [
    {url:'https://third-party.test/api',mode:'cors',method:'GET'},
    {url:ROOT,mode:'navigate',method:'POST'},
    h.request('../account/','same-origin'),
    h.request('./not-allowed.js','same-origin')
  ]){
    const result=await h.emit('fetch',request);
    assert.equal(result.handled,false);
  }
  assert.equal(h.tracking.fetches.length,0);
});

test('manifest and icon cache-first requests work without network',async()=>{
  const h=harness();await h.emit('install');
  const manifest=await h.emit('fetch',h.request('./manifest.webmanifest','same-origin'));
  assert.match(await manifest.response.text(),/preinstalled:/);
  const icon=await h.emit('fetch',h.request('./icon.svg','same-origin'));
  assert.match(await icon.response.text(),/preinstalled:/);
  assert.equal(h.tracking.fetches.length,0);
});

test('CacheStorage quota errors cannot prevent successful network navigation',async()=>{
  const h=harness({failPut:true});await h.emit('install');
  const result=await h.emit('fetch',h.request('./'));
  assert.equal(result.response.status,200);
  assert.equal(await result.response.text(),'online');
});
