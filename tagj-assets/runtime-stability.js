(()=>{
  'use strict';
  const d=document, root=d.documentElement;
  const prefetched=new Set();

  // Pause decorative animation when the page is backgrounded. Mobile Safari can
  // otherwise keep GPU layers alive and discard the tab under memory pressure.
  const syncVisibility=()=>root.classList.toggle('tagj-runtime-paused',d.hidden);
  d.addEventListener('visibilitychange',syncVisibility,{passive:true});
  syncVisibility();

  // Preserve full-resolution source assets while deferring decode/network work
  // until imagery is actually near the viewport.
  const heroSelector='header,.hero,.portrait,.intro-stage,.home-stage,.tagj-hero,.artist-hero,.producer-hero,.creative-hero';
  d.querySelectorAll('img').forEach((img,i)=>{
    if(!img.hasAttribute('decoding')) img.decoding='async';
    if(!img.hasAttribute('loading') && !img.closest(heroSelector)) img.loading='lazy';
    if(!img.hasAttribute('fetchpriority')) img.setAttribute('fetchpriority',img.closest(heroSelector)&&i<2?'high':'low');
  });

  // Let the browser avoid layout/paint work for deep offscreen sections without
  // removing or simplifying any content.
  const style=d.createElement('style');
  style.textContent=[
    'html.tagj-runtime-paused *,html.tagj-runtime-paused *::before,html.tagj-runtime-paused *::after{animation-play-state:paused!important}',
    'html.tagj-nav-pending{cursor:progress}',
    '@supports(content-visibility:auto){main>section,.deep,.section,.v13-section,.v145-section,.v147-section{content-visibility:auto;contain-intrinsic-size:auto 820px}}'
  ].join('');
  d.head.appendChild(style);

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

  // Warm only the page HTML. Assets remain lazy and cacheable so prefetching a
  // destination never downloads its entire visual archive.
  function warm(anchor){
    const u=candidate(anchor); if(!u) return;
    const href=u.origin+u.pathname+u.search;
    if(prefetched.has(href)) return;
    prefetched.add(href);
    const link=d.createElement('link');
    link.rel='prefetch';
    link.as='document';
    link.href=href;
    d.head.appendChild(link);
  }
  d.addEventListener('pointerover',e=>warm(e.target.closest?.('a[href]')),{passive:true});
  d.addEventListener('focusin',e=>warm(e.target.closest?.('a[href]')),{passive:true});
  d.addEventListener('touchstart',e=>warm(e.target.closest?.('a[href]')),{passive:true});

  // Keep navigation state compatible with Safari's back/forward cache.
  d.addEventListener('click',e=>{
    const u=candidate(e.target.closest?.('a[href]'));
    if(u) root.classList.add('tagj-nav-pending');
  },true);
  addEventListener('pageshow',()=>root.classList.remove('tagj-nav-pending'),{passive:true});
  addEventListener('pagehide',()=>root.classList.remove('tagj-nav-pending'),{passive:true});

  // A small navigation cache makes revisits and cross-subsite transitions resilient
  // to brief network stalls. It does not change page content or image quality.
  if('serviceWorker' in navigator && location.protocol==='https:'){
    addEventListener('load',()=>{
      navigator.serviceWorker.register('/tagj-sw.js',{scope:'/'}).catch(()=>{});
    },{once:true,passive:true});
  }
})();
