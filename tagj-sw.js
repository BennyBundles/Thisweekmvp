'use strict';
const VERSION='tagj-nav-v1523';
const CORE=[
  '/',
  '/index.html',
  '/full.html',
  '/tagj.html',
  '/artist.html',
  '/producer.html',
  '/creative.html',
  '/contact.html',
  '/licensing.html',
  '/network/index.html',
  '/creative/portfolio.html',
  '/services/index.html',
  '/beats/index.html',
  '/music/index.html',
  '/catalogue/index.html',
  '/tagj-assets/runtime-stability.js'
];

const sameOriginResponse=r=>{
  try{return !!r && r.ok && new URL(r.url).origin===self.location.origin}
  catch(_){return false}
};

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(VERSION);
    await Promise.allSettled(CORE.map(async url=>{
      const r=await fetch(url,{credentials:'same-origin',cache:'reload'});
      if(sameOriginResponse(r)) await cache.put(url,r.clone());
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('tagj-nav-')&&k!==VERSION).map(k=>caches.delete(k)));
    if(self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(()=>{});
    await self.clients.claim();
  })());
});

async function cachedNavigation(request,event){
  const cache=await caches.open(VERSION);
  const cached=await cache.match(request,{ignoreSearch:true});
  try{
    const preload=event.preloadResponse ? await event.preloadResponse : null;
    if(sameOriginResponse(preload)){
      event.waitUntil(cache.put(request,preload.clone()));
      return preload;
    }
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),3200);
    const live=await fetch(request,{signal:controller.signal,credentials:'same-origin'});
    clearTimeout(timer);
    if(!sameOriginResponse(live)) throw new Error('non-site navigation response');
    event.waitUntil(cache.put(request,live.clone()));
    return live;
  }catch(_){
    if(cached) return cached;
    const url=new URL(request.url);
    const cleanMap={
      '/home':'/index.html','/full':'/full.html','/tagj':'/tagj.html','/artist':'/artist.html',
      '/producer':'/producer.html','/creative':'/creative.html','/contact':'/contact.html',
      '/licensing':'/licensing.html','/network':'/network/index.html','/services':'/services/index.html',
      '/beats':'/beats/index.html','/music':'/music/index.html','/catalogue':'/catalogue/index.html',
      '/creative/portfolio':'/creative/portfolio.html',
      '/creative/case-bsf-tone-066':'/creative/case-bsf-tone-066.html',
      '/creative/case-t311y-demon-life':'/creative/case-t311y-demon-life.html',
      '/network/bsf-tone-066':'/network/bsf-tone-066.html',
      '/network/t311y-demon-life':'/network/t311y-demon-life.html'
    };
    const mapped=cleanMap[url.pathname];
    if(mapped){
      const hit=await cache.match(mapped);
      if(hit) return hit;
    }
    return (await cache.match('/404.html')) || Response.error();
  }
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;

  if(request.mode==='navigate'){
    event.respondWith(cachedNavigation(request,event));
    return;
  }

  if(url.pathname.startsWith('/tagj-assets/')){
    event.respondWith((async()=>{
      const cache=await caches.open(VERSION);
      const hit=await cache.match(request,{ignoreSearch:true});
      if(hit){
        event.waitUntil(fetch(request,{credentials:'same-origin'}).then(r=>{
          if(sameOriginResponse(r)) return cache.put(request,r.clone());
        }).catch(()=>{}));
        return hit;
      }
      const live=await fetch(request,{credentials:'same-origin'});
      if(sameOriginResponse(live)) event.waitUntil(cache.put(request,live.clone()));
      return live;
    })());
    return;
  }

  if(url.pathname.startsWith('/tagj-data/')){
    event.respondWith((async()=>{
      const cache=await caches.open(VERSION);
      try{
        const live=await fetch(request,{credentials:'same-origin'});
        if(sameOriginResponse(live)) event.waitUntil(cache.put(request,live.clone()));
        return live;
      }catch(_){
        return (await cache.match(request,{ignoreSearch:true})) || Response.error();
      }
    })());
  }
});
