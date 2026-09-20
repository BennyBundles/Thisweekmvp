'use strict';
const VERSION='tagj-nav-v1524';
const CORE=[
  '/','/index.html','/full.html','/tagj.html','/artist.html','/producer.html','/creative.html',
  '/contact.html','/licensing.html','/404.html','/network/index.html',
  '/network/bsf-tone-066.html','/network/t311y-demon-life.html','/creative/index.html',
  '/creative/portfolio.html','/creative/case-bsf-tone-066.html',
  '/creative/case-t311y-demon-life.html','/services/index.html','/beats/index.html',
  '/music/index.html','/catalogue/index.html','/tagj-assets/runtime-stability.js'
];
const CLEAN={
  '/':'/index.html','/home':'/index.html','/full':'/full.html','/tagj':'/tagj.html',
  '/artist':'/artist.html','/producer':'/producer.html','/creative':'/creative.html',
  '/contact':'/contact.html','/licensing':'/licensing.html','/network':'/network/index.html',
  '/services':'/services/index.html','/beats':'/beats/index.html','/music':'/music/index.html',
  '/catalogue':'/catalogue/index.html','/creative/portfolio':'/creative/portfolio.html',
  '/creative/case-bsf-tone-066':'/creative/case-bsf-tone-066.html',
  '/creative/case-t311y-demon-life':'/creative/case-t311y-demon-life.html',
  '/network/bsf-tone-066':'/network/bsf-tone-066.html',
  '/network/t311y-demon-life':'/network/t311y-demon-life.html'
};
const valid=r=>{try{return !!r&&r.ok&&new URL(r.url).origin===self.location.origin}catch(_){return false}};

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(VERSION);
    await Promise.allSettled(CORE.map(async url=>{
      const r=await fetch(url,{credentials:'same-origin',cache:'reload'});
      if(valid(r))await cache.put(url,r.clone());
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('tagj-nav-')&&k!==VERSION).map(k=>caches.delete(k)));
    if(self.registration.navigationPreload)await self.registration.navigationPreload.enable().catch(()=>{});
    await self.clients.claim();
  })());
});

async function cacheHit(request,cache){
  const direct=await cache.match(request,{ignoreSearch:true});
  if(direct)return direct;
  const mapped=CLEAN[new URL(request.url).pathname];
  return mapped?cache.match(mapped,{ignoreSearch:true}):null;
}

async function liveNavigation(request,cache,event){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),6500);
  try{
    const preload=event.preloadResponse?await event.preloadResponse:null;
    if(valid(preload)){
      clearTimeout(timer);
      event.waitUntil(cache.put(request,preload.clone()));
      return preload;
    }
    const live=await fetch(request,{signal:controller.signal,credentials:'same-origin'});
    clearTimeout(timer);
    if(!valid(live))throw new Error('invalid navigation response');
    event.waitUntil(cache.put(request,live.clone()));
    return live;
  }catch(err){clearTimeout(timer);throw err}
}

async function navigate(request,event){
  const cache=await caches.open(VERSION);
  const cached=await cacheHit(request,cache);
  const live=liveNavigation(request,cache,event);
  if(cached){
    const quick=await Promise.race([
      live.catch(()=>null),
      new Promise(resolve=>setTimeout(()=>resolve(null),700))
    ]);
    if(quick)return quick;
    event.waitUntil(live.catch(()=>null));
    return cached;
  }
  try{return await live}
  catch(_){return (await cacheHit(request,cache))||(await cache.match('/404.html'))||Response.error()}
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith(navigate(request,event));
    return;
  }

  if(url.pathname.startsWith('/tagj-assets/')){
    event.respondWith((async()=>{
      const cache=await caches.open(VERSION);
      const hit=await cache.match(request,{ignoreSearch:true});
      if(hit){
        event.waitUntil(fetch(request,{credentials:'same-origin'}).then(r=>{if(valid(r))return cache.put(request,r.clone())}).catch(()=>{}));
        return hit;
      }
      const live=await fetch(request,{credentials:'same-origin'});
      if(valid(live))event.waitUntil(cache.put(request,live.clone()));
      return live;
    })());
    return;
  }

  if(url.pathname.startsWith('/tagj-data/')){
    event.respondWith((async()=>{
      const cache=await caches.open(VERSION);
      try{
        const live=await fetch(request,{credentials:'same-origin'});
        if(valid(live))event.waitUntil(cache.put(request,live.clone()));
        return live;
      }catch(_){return (await cache.match(request,{ignoreSearch:true}))||Response.error()}
    })());
  }
});