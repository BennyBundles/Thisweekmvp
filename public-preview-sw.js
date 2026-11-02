// This Week demo-only offline PWA. Never cache personal plans or provider responses.
const CACHE_PREFIX='this-week-public-preview-';
const CACHE_NAME=CACHE_PREFIX+'v3';
const ROOT_URL=new URL('./',self.registration.scope);
const SHELL_URL=ROOT_URL.href;
const SHELL_PATH=ROOT_URL.pathname;
const MANIFEST_URL=new URL('manifest.webmanifest',ROOT_URL).href;
const ICON_URL=new URL('icon.svg',ROOT_URL).href;
const STATIC_PATHS=new Set([new URL(MANIFEST_URL).pathname,new URL(ICON_URL).pathname]);
const MAX_SHELL_CHARS=2_000_000;

function safeResponse(response,url){
  if(!response||!response.ok||response.status!==200||response.redirected)return false;
  if(response.url&&new URL(response.url).href!==url)return false;
  return true;
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
      && html.includes("connect-src 'none'");
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
        && m.scope==='./'&&m.start_url==='./?mode=demo';
    }
    if(url===ICON_URL){
      if(!typeIs(response,'image/svg+xml'))return false;
      const svg=await response.clone().text();
      return svg.length<=131_072&&/<svg[\s>]/i.test(svg)
        && /<\/svg\s*>/i.test(svg)&&!/<script[\s>]/i.test(svg);
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
      for(const [url,response] of verified)await cache.put(url,response);
      // Only activate after the complete, independently validated cache is durable.
      await self.skipWaiting();
    }catch(error){
      // Partial writes must not be promoted or retained as an installable cache.
      try{await caches.delete(CACHE_NAME);}catch{}
      throw error;
    }
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(x=>x.startsWith(CACHE_PREFIX)&&x!==CACHE_NAME)
      .map(x=>caches.delete(x)));
    await self.clients.claim();
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
        if(await validShell(response,response.url||url.href)){
          event.waitUntil(saveToCache(SHELL_URL,response.clone()));
        }
        return response;
      }catch(error){
        const cache=await caches.open(CACHE_NAME);
        const offline=await cache.match(SHELL_URL);
        // A poisoned entry from any older version is never a valid fallback.
        if(offline&&await validShell(offline,offline.url||SHELL_URL))return offline;
        if(offline)await cache.delete(SHELL_URL).catch(()=>{});
        throw error;
      }
    })());
    return;
  }
  if(!STATIC_PATHS.has(url.pathname))return;
  event.respondWith((async()=>{
    const hit=await currentCacheResponse(request);
    if(hit&&await validAsset(hit,hit.url||url.href))return hit;
    const response=await fetch(request);
    if(await validAsset(response,response.url||url.href))
      event.waitUntil(saveToCache(request,response.clone()));
    return response;
  })());
});
