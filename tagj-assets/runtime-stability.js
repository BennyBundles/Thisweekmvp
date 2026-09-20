(()=>{
  'use strict';
  const d=document, root=d.documentElement;
  const prefetched=new Set();

  // Pause decorative animation when the tab/app is backgrounded. This matters
  // on mobile Safari where hidden animated pages can otherwise keep consuming
  // memory and GPU time before the user returns.
  const syncVisibility=()=>root.classList.toggle('tagj-runtime-paused',d.hidden);
  d.addEventListener('visibilitychange',syncVisibility,{passive:true});
  syncVisibility();

  // Decode non-critical imagery asynchronously and lazy-load images outside
  // the immediate hero/header area. Source pixels and visual quality are unchanged.
  d.querySelectorAll('img').forEach(img=>{
    if(!img.decoding) img.decoding='async';
    if(!img.hasAttribute('loading') && !img.closest('header,.hero,.portrait,.intro-stage,.home-stage,.tagj-hero,.artist-hero,.producer-hero,.creative-hero')){
      img.loading='lazy';
    }
  });

  function candidate(anchor){
    if(!anchor || anchor.hasAttribute('download') || anchor.target==='_blank') return null;
    const raw=anchor.getAttribute('href')||'';
    if(!raw || raw[0]==='#' || /^(?:mailto:|tel:|javascript:|data:)/i.test(raw)) return null;
    let u;
    try{u=new URL(raw,location.href)}catch(_){return null}
    if(u.origin!==location.origin) return null;
    if(u.pathname===location.pathname && u.search===location.search) return null;
    return u;
  }
  function warm(anchor){
    const u=candidate(anchor); if(!u) return;
    const href=u.origin+u.pathname+u.search;
    if(prefetched.has(href)) return;
    prefetched.add(href);
    const link=d.createElement('link');
    link.rel='prefetch';
    link.href=href;
    d.head.appendChild(link);
  }
  d.addEventListener('pointerover',e=>warm(e.target.closest?.('a[href]')),{passive:true});
  d.addEventListener('focusin',e=>warm(e.target.closest?.('a[href]')),{passive:true});
  d.addEventListener('touchstart',e=>warm(e.target.closest?.('a[href]')),{passive:true});

  // Never leave a stale loading state when Safari restores a page from bfcache.
  d.addEventListener('click',e=>{
    const u=candidate(e.target.closest?.('a[href]'));
    if(u) root.classList.add('tagj-nav-pending');
  },true);
  addEventListener('pageshow',()=>root.classList.remove('tagj-nav-pending'),{passive:true});

  const style=d.createElement('style');
  style.textContent='html.tagj-runtime-paused *,html.tagj-runtime-paused *::before,html.tagj-runtime-paused *::after{animation-play-state:paused!important}html.tagj-nav-pending{cursor:progress}';
  d.head.appendChild(style);
})();
