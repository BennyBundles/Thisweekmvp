// This Week demo PWA only. Never cache financial data or cross-origin requests.
const CACHE_PREFIX='this-week-public-preview-';
const CACHE_NAME=CACHE_PREFIX+'v2';
const ROOT_URL=new URL('./',self.registration.scope);
const SHELL_URL=ROOT_URL.href;
const SHELL_PATH=ROOT_URL.pathname;
const MANIFEST_URL=new URL('manifest.webmanifest',ROOT_URL).href;
const ICON_URL=new URL('icon.svg',ROOT_URL).href;
const OFFLINE_ASSET_PATHS=new Set([
  new URL(MANIFEST_URL).pathname,
  new URL(ICON_URL).pathname
]);

function safeStaticResponse(response){
  if(!response||!response.ok||response.status!==200||response.redirected)return false;
  // Never replace the offline app with a redirected, cross-origin or error page.
  if(response.url&&new URL(response.url).origin!==ROOT_URL.origin)return false;
  return true;
}

function saveToCache(key,response){
  // Storage failures (iOS quota/private browsing) must not hide valid network UI.
  return caches.open(CACHE_NAME).then(cache=>cache.put(key,response)).catch(()=>{});
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll([SHELL_URL,MANIFEST_URL,ICON_URL]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names
      .filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME)
      .map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==ROOT_URL.origin)return;

  if(request.mode==='navigate'){
    // Scope only includes this standalone PWA. A missing route/404 must never
    // overwrite the known-good offline shell, even with a query string.
    if(url.pathname!==SHELL_PATH&&url.pathname!==SHELL_PATH+'index.html')return;
    event.respondWith((async()=>{
      try{
        const response=await fetch(request);
        if(safeStaticResponse(response)&&
          (!response.url||[SHELL_PATH,SHELL_PATH+'index.html'].includes(new URL(response.url).pathname))){
          event.waitUntil(saveToCache(SHELL_URL,response.clone()));
        }
        return response;
      }catch(networkFailure){
        const shell=await caches.match(SHELL_URL);
        if(shell)return shell;
        throw networkFailure;
      }
    })());
    return;
  }

  // Cache only the two explicitly public, static preview resources.
  // Account, finance, third-party and arbitrary subresource requests bypass SW.
  if(!OFFLINE_ASSET_PATHS.has(url.pathname))return;
  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    const response=await fetch(request);
    if(safeStaticResponse(response)){
      event.waitUntil(saveToCache(request,response.clone()));
    }
    return response;
  })());
});
