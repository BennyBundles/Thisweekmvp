// This Week demo-only offline PWA. Never cache personal plans or provider responses.
const CACHE_PREFIX='this-week-public-preview-';
const CACHE_NAME=CACHE_PREFIX+'v4';
// Build inserts exact staged shell/manifest/icon hashes. Null is template-only for isolated source tests.
const EXPECTED_ASSET_SHA256=null;
const ROOT_URL=new URL('./',self.registration.scope);
const SHELL_URL=ROOT_URL.href;
const SHELL_PATH=ROOT_URL.pathname;
const MANIFEST_URL=new URL('manifest.webmanifest',ROOT_URL).href;
const ICON_URL=new URL('icon.svg',ROOT_URL).href;
const STATIC_PATHS=new Set([new URL(MANIFEST_URL).pathname,new URL(ICON_URL).pathname]);
const MAX_SHELL_CHARS=2_000_000;

function safeResponse(response,url){
  if(!response||!response.ok||response.status!==200||response.redirected)return false;
  // A valid-looking cached Response from another origin or route is never trusted.
  if(response.url){
    const actual=new URL(response.url),expected=new URL(url);
    if(actual.origin!==ROOT_URL.origin||actual.pathname!==expected.pathname)return false;
  }
  return true;
}
async function matchesBuiltBytes(response,key,maxBytes){
  // Null exists only in repository template unit tests. Published workers are
  // stamp-verified and always include an exact SHA-256 map for these assets.
  if(EXPECTED_ASSET_SHA256===null)return true;
  const expected=EXPECTED_ASSET_SHA256[key];
  if(!/^[a-f0-9]{64}$/.test(expected||'')||!self.crypto?.subtle?.digest)return false;
  try{
    const bytes=await response.clone().arrayBuffer();
    if(bytes.byteLength>maxBytes)return false;
    const raw=await self.crypto.subtle.digest('SHA-256',bytes);
    const actual=Array.from(new Uint8Array(raw)).map(v=>v.toString(16).padStart(2,'0')).join('');
    return actual===expected;
  }catch{return false;}
}
function typeIs(response,mime){
  const type=response.headers?.get('content-type')||'';
  return type.toLowerCase().split(';')[0].trim()===mime;
}
async function validShell(response,url){
  if(!safeResponse(response,url)||!typeIs(response,'text/html'))return false;
  const declared=Number(response.headers.get('content-length')||'0');
  if(declared>MAX_SHELL_CHARS)return false;
  try{
    const html=await response.clone().text();
    return html.length<=MAX_SHELL_CHARS
      && html.includes('This Week — Public Release Preview')
      && html.includes('thisweek.publicPreview.state.v2')
      && html.includes("connect-src 'none'")
      && await matchesBuiltBytes(response,'shell',MAX_SHELL_CHARS*4);
  }catch{return false;}
}
async function validAsset(response,url){
  if(!safeResponse(response,url))return false;
  try{
    if(url===MANIFEST_URL){
      if(!['application/manifest+json','application/json'].some(t=>typeIs(response,t)))return false;
      const body=await response.clone().text();
      if(body.length>16_384)return false;
      const m=JSON.parse(body);
      return m&&typeof m.name==='string'&&m.name.includes('This Week')
        && m.scope==='./'&&m.start_url==='./?mode=demo'
        && await matchesBuiltBytes(response,'manifest',16_384*4);
    }
    if(url===ICON_URL){
      if(!typeIs(response,'image/svg+xml'))return false;
      const svg=await response.clone().text();
      return svg.length<=131_072&&/<svg[\s>]/i.test(svg)
        && /<\/svg\s*>/i.test(svg)&&!/<script[\s>]/i.test(svg)
        && await matchesBuiltBytes(response,'icon',131_072*4);
    }
  }catch{return false;}
  return false;
}
function saveToCache(key,response){
  // Quota errors on a live request must not mask a working network response.
  return caches.open(CACHE_NAME).then(cache=>cache.put(key,response)).catch(()=>{});
}
async function currentCacheResponse(key){
  const cache=await caches.open(CACHE_NAME);
  return cache.match(key);
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    // Do not trust cache.addAll's successful HTTP result as an authentic shell:
    // 200 login/maintenance pages and redirected assets must fail before activation.
    // An installing replacement can share a cache namespace with the active
    // worker. Never mutate or delete a pre-existing current-version cache.
    // This makes failed updates safe even if a developer forgets a version bump.
    const cacheAlreadyExisted=(await caches.keys()).includes(CACHE_NAME);
    let createdCache=false;
    try{
      const verified=[];
      for(const url of [SHELL_URL,MANIFEST_URL,ICON_URL]){
        const response=await fetch(url,{redirect:'error',cache:'no-store'});
        const accepted=url===SHELL_URL
          ? await validShell(response,url)
          : await validAsset(response,url);
        if(!accepted)throw new Error('Unverified offline preview install asset: '+url);
        verified.push([url,response]);
      }
      const cache=await caches.open(CACHE_NAME);
      if(cacheAlreadyExisted){
        // The old active worker can still be serving v4 while the new one
        // installs. Leave its last known good offline snapshot untouched.
        for(const url of [SHELL_URL,MANIFEST_URL,ICON_URL]){
          const existing=await cache.match(url);
          const accepted=url===SHELL_URL
            ? await validShell(existing,url)
            : await validAsset(existing,url);
          if(!accepted)throw new Error('Existing offline cache must not be overwritten: '+url);
        }
      }else{
        createdCache=true;
        for(const [url,response] of verified)await cache.put(url,response);
      }
      // Only activate after the complete, independently validated cache is durable.
      await self.skipWaiting();
    }catch(error){
      // Never delete the active worker's cache after a failed same-version
      // update. Roll back only a cache created by this installation.
      if(createdCache){try{await caches.delete(CACHE_NAME);}catch{}}
      throw error;
    }
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    // The verified install snapshot may be removed or damaged before activate
    // (e.g., storage pressure or a failed background update on iOS Safari).
    // Preserve previously working cache generations unless ALL current assets
    // are still present and match their release-specific content identities.
    const current=await caches.open(CACHE_NAME);
    for(const url of [SHELL_URL,MANIFEST_URL,ICON_URL]){
      const response=await current.match(url);
      const accepted=url===SHELL_URL
        ? await validShell(response,url)
        : await validAsset(response,url);
      if(!accepted)throw new Error('Refusing older offline cache deletion: incomplete active snapshot '+url);
    }
    const names=await caches.keys();
    await Promise.all(names.filter(x=>x.startsWith(CACHE_PREFIX)&&x!==CACHE_NAME)
      .map(x=>caches.delete(x)));
    await self.clients.claim();
  })());
});
// Read-only current-build integrity handshake, with no personal Plan data.
async function offlineSnapshotStatus(){
  try{
    const cache=await caches.open(CACHE_NAME);
    const items=[
      ['SHELL',SHELL_URL,validShell],
      ['MANIFEST',MANIFEST_URL,validAsset],
      ['ICON',ICON_URL,validAsset]
    ];
    for(const [key,url,validator] of items){
      const response=await cache.match(url);
      if(!response)return {ready:false,code:key+'_MISSING'};
      if(!await validator(response,url))return {ready:false,code:key+'_INVALID'};
    }
    return {ready:true,code:'READY'};
  }catch{return {ready:false,code:'CACHE_UNREADABLE'};}
}
self.addEventListener('message',event=>{
  if(event.data?.type!=='THISWEEK_OFFLINE_CHECK')return;
  const port=event.ports?.[0];
  if(!port)return;
  event.waitUntil((async()=>{
    const result=await offlineSnapshotStatus();
    port.postMessage({type:'THISWEEK_OFFLINE_STATUS',scope:ROOT_URL.href,...result});
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==ROOT_URL.origin)return;
  if(request.mode==='navigate'){
    if(url.pathname!==SHELL_PATH&&url.pathname!==SHELL_PATH+'index.html')return;
    event.respondWith((async()=>{
      try{
        const response=await fetch(request);
        // Only an authentic preview shell may replace the last offline shell.
        if(await validShell(response,url.href)){
          event.waitUntil(saveToCache(SHELL_URL,response.clone()));
          return response;
        }
        // A CDN can return a successful HTTP 200 with bytes from another
        // release. Do not display that unverified page just because it is online.
      }catch(error){
        // Both network failure and invalid network content use the same
        // release-verified fallback, without returning the untrusted bytes.
      }
      const cache=await caches.open(CACHE_NAME);
      const offline=await cache.match(SHELL_URL);
      if(offline&&await validShell(offline,SHELL_URL))return offline;
      if(offline)await cache.delete(SHELL_URL).catch(()=>{});
      return Response.error();
    })());
    return;
  }
  if(!STATIC_PATHS.has(url.pathname))return;
  event.respondWith((async()=>{
    const hit=await currentCacheResponse(request);
    if(hit&&await validAsset(hit,url.href))return hit;
    const response=await fetch(request);
    if(await validAsset(response,url.href)){
      event.waitUntil(saveToCache(request,response.clone()));
      return response;
    }
    // Never hand an invalid first-load manifest or icon to the page.
    return Response.error();
  })());
});
