import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const SOURCE=fs.readFileSync(new URL('./public-preview-sw.js',import.meta.url),'utf8');
const ROOT='https://example.test/Thisweekmvp/public-preview/';
const SHELL_MARKER='<title>This Week — Public Release Preview</title> thisweek.publicPreview.state.v2 connect-src \'none\'';
const sampleResponse=(url,extra='')=>{
  const suffix=url.split('?')[0];
  if(suffix.endsWith('manifest.webmanifest'))
    return new Response(JSON.stringify({name:'This Week',scope:'./',start_url:'./?mode=demo'}),{
      status:200,headers:{'content-type':'application/manifest+json'}});
  if(suffix.endsWith('icon.svg'))
    return new Response('<svg xmlns="http://www.w3.org/2000/svg"></svg>',{
      status:200,headers:{'content-type':'image/svg+xml'}});
  return new Response(SHELL_MARKER+' '+extra,{
    status:200,headers:{'content-type':'text/html; charset=utf-8'}});
};

function harness({fetchImpl=()=>Promise.resolve(sampleResponse(ROOT,'online')),installFetchImpl=null,failPut=false,failInstallPutAt=0}={}){
  const listeners=new Map(),cacheStores=new Map();
  const tracking={fetches:[],installFetches:[],claimed:0,skipped:0,puts:[],installWrites:0};
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
          if(tracking.skipped===0&&++tracking.installWrites===failInstallPutAt)
            throw new Error('install quota failure');
          if(failPut&&tracking.skipped>0)throw new Error('quota exceeded');
          if(tracking.skipped>0)tracking.puts.push(requestUrl(key));
          store.set(requestUrl(key),response);
        },
        async match(key){return store.get(requestUrl(key))?.clone();},
        async delete(key){return store.delete(requestUrl(key));}
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
  const fetch=(request,options)=>{
    if(typeof request==='string'){
      tracking.installFetches.push({url:request,redirect:options?.redirect,cache:options?.cache});
      return installFetchImpl
        ?installFetchImpl(request,options)
        :Promise.resolve(sampleResponse(request,'install:'+request));
    }
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
  assert.deepEqual([...h.cacheStores.keys()],['this-week-public-preview-v3']);
  assert.equal([...h.cacheStores.values()][0].size,3);
});

test('activate deletes stale preview versions but no other product caches',async()=>{
  const h=harness();await h.emit('install');
  h.cacheStores.set('this-week-public-preview-v1',new Map());
  h.cacheStores.set('other-product-cache',new Map());
  await h.emit('activate');
  assert.equal(h.cacheStores.has('this-week-public-preview-v1'),false);
  assert.equal(h.cacheStores.has('this-week-public-preview-v3'),true);
  assert.equal(h.cacheStores.has('other-product-cache'),true);
  assert.equal(h.tracking.claimed,1);
});

test('fresh shell updates offline fallback regardless of demo/reset query',async()=>{
  let online=true;
  const h=harness({fetchImpl:async()=>{
    if(!online)throw new Error('offline');
    return sampleResponse(ROOT,'live version');
  }});
  await h.emit('install');
  const live=await h.emit('fetch',h.request('./?mode=demo'));
  assert.match(await live.response.text(),/live version/);
  assert.equal(h.tracking.puts.at(-1),ROOT);
  online=false;
  const offline=await h.emit('fetch',h.request('./?mode=demo&reset=1'));
  assert.match(await offline.response.text(),/live version/);
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
  assert.match(await recovered.response.text(),/This Week — Public Release Preview/);
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
  assert.match(await manifest.response.text(),/This Week/);
  const icon=await h.emit('fetch',h.request('./icon.svg','same-origin'));
  assert.match(await icon.response.text(),/<svg/);
  assert.equal(h.tracking.fetches.length,0);
});

test('CacheStorage quota errors cannot prevent successful network navigation',async()=>{
  const h=harness({failPut:true});await h.emit('install');
  const result=await h.emit('fetch',h.request('./'));
  assert.equal(result.response.status,200);
  assert.match(await result.response.text(),/online/);
});

test('install rejects redirected shell and leaves old worker active',async()=>{
  const h=harness({installFetchImpl:async(url)=>({
    ok:true,status:200,redirected:true,url,headers:{get:()=> 'text/html'}
  })});
  await assert.rejects(h.emit('install'),/Unverified offline preview install asset/);
  assert.equal(h.tracking.skipped,0);
  assert.equal(h.cacheStores.size,0);
});
test('install rejects server error without caching a partial offline shell',async()=>{
  const h=harness({installFetchImpl:async(url)=>new Response('maintenance',{status:503})});
  await assert.rejects(h.emit('install'),/Unverified offline preview install asset/);
  assert.equal(h.cacheStores.size,0);
  assert.equal(h.tracking.skipped,0);
});
test('install rejects wrong shell content type before activation',async()=>{
  const h=harness({installFetchImpl:async()=>new Response('login',{status:200,
    headers:{'content-type':'text/plain'}})});
  await assert.rejects(h.emit('install'),/Unverified offline preview install asset/);
  assert.equal(h.tracking.skipped,0);
});
test('install requests exact same-origin assets with redirects disabled',async()=>{
  const h=harness();
  await h.emit('install');
  assert.equal(h.tracking.installFetches.length,3);
  for(const item of h.tracking.installFetches){
    assert.equal(item.redirect,'error');
    assert.equal(item.cache,'no-store');
    assert.ok(item.url.startsWith(ROOT));
  }
});


test('install rejects successful HTTP 200 login HTML without preview identity markers',async()=>{
  const h=harness({installFetchImpl:async()=>new Response('<html>Sign in to continue</html>',{
    status:200,headers:{'content-type':'text/html'}})});
  await assert.rejects(h.emit('install'),/Unverified offline preview install asset/);
  assert.equal(h.tracking.skipped,0);
  assert.equal(h.cacheStores.has('this-week-public-preview-v3'),false);
});

test('install rejects a malformed or mislabeled manifest and does not activate',async()=>{
  const h=harness({installFetchImpl:async url=>url.endsWith('manifest.webmanifest')
    ? new Response('<html>not a manifest</html>',{status:200,headers:{'content-type':'text/html'}})
    : sampleResponse(url)});
  await assert.rejects(h.emit('install'),/Unverified offline preview install asset/);
  assert.equal(h.tracking.skipped,0);
  assert.equal(h.cacheStores.has('this-week-public-preview-v3'),false);
});

test('install quota failure rolls back partial cache and leaves previous cache unchanged',async()=>{
  const h=harness({failInstallPutAt:2});
  h.cacheStores.set('this-week-public-preview-v2',new Map([[ROOT,
    new Response('legacy offline shell',{status:200})]]));
  await assert.rejects(h.emit('install'),/install quota failure/);
  assert.equal(h.tracking.skipped,0);
  assert.equal(h.cacheStores.has('this-week-public-preview-v3'),false);
  assert.equal(h.cacheStores.has('this-week-public-preview-v2'),true);
});

test('HTTP 200 login navigation is shown online but never cached as offline shell',async()=>{
  let response=new Response('sign in',{status:200,headers:{'content-type':'text/html'}});
  const h=harness({fetchImpl:async()=>{
    if(!response)throw new Error('offline');
    return response;
  }});
  await h.emit('install');
  const current=await h.emit('fetch',h.request('./'));
  assert.equal(await current.response.text(),'sign in');
  assert.equal(h.tracking.puts.length,0);
  response=null;
  const offline=await h.emit('fetch',h.request('./'));
  assert.match(await offline.response.text(),/This Week — Public Release Preview/);
});

test('offline fallback ignores a poisoned older preview cache',async()=>{
  const h=harness({fetchImpl:async()=>{throw new Error('offline');}});
  await h.emit('install');
  h.cacheStores.set('this-week-public-preview-v2',new Map([[ROOT,
    new Response('older forged HTML',{status:200,headers:{'content-type':'text/html'}})]]));
  const offline=await h.emit('fetch',h.request('./?mode=demo'));
  assert.match(await offline.response.text(),/This Week — Public Release Preview/);
  assert.doesNotMatch(await h.cacheStores.get('this-week-public-preview-v3').get(ROOT).clone().text(),/forged HTML/);
});

test('offline fallback rejects a locally corrupted current-version shell',async()=>{
  const h=harness({fetchImpl:async()=>{throw new Error('offline');}});
  await h.emit('install');
  h.cacheStores.get('this-week-public-preview-v3').set(ROOT,
    new Response('<title>Sign In</title>',{status:200,headers:{'content-type':'text/html'}}));
  await assert.rejects(h.emit('fetch',h.request('./')),/offline/);
  assert.equal(h.cacheStores.get('this-week-public-preview-v3').has(ROOT),false);
});

test('invalid static asset cannot enter cache when network returns a 200 HTML login',async()=>{
  const h=harness({fetchImpl:async()=>new Response('login',{status:200,headers:{'content-type':'text/html'}})});
  await h.emit('install');
  const url=ROOT+'icon.svg';
  h.cacheStores.get('this-week-public-preview-v3').delete(url);
  const response=await h.emit('fetch',h.request('./icon.svg','same-origin'));
  assert.equal(await response.response.text(),'login');
  assert.equal(h.cacheStores.get('this-week-public-preview-v3').has(url),false);
});

test('same-origin HTTP redirect cannot be accepted as cached preview shell',async()=>{
  let response={ok:true,status:200,redirected:true,url:ROOT,headers:{get:()=> 'text/html'},clone(){return this;}};
  const h=harness({fetchImpl:async()=>response});await h.emit('install');
  await h.emit('fetch',h.request('./'));
  assert.equal(h.tracking.puts.length,0);
});

test('precache requires all three exact resources and known MIME types',async()=>{
  const h=harness();await h.emit('install');
  const m=h.cacheStores.get('this-week-public-preview-v3');
  assert.deepEqual([...m.keys()],[ROOT,ROOT+'manifest.webmanifest',ROOT+'icon.svg']);
  assert.match(await m.get(ROOT).text(),/thisweek.publicPreview.state.v2/);
});
