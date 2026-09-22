'use strict';
const VERSION='tagj-nav-v1528-reset';

self.addEventListener('install',event=>{
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('tagj-nav-')).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

// Intentionally no fetch handler.
// Navigation and static assets are served directly by the host/CDN so stale
// service-worker routing cannot produce false 404s or trap a page on old HTML.
