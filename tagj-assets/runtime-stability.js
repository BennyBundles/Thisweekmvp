(()=>{
  'use strict';
  const d=document,root=d.documentElement;
  const prefetched=new Set();
  const conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection||null;
  const constrained=!!(conn&&(conn.saveData||/^(?:slow-2g|2g|3g)$/i.test(conn.effectiveType||'')));
  const isIOS=/iP(?:hone|ad|od)/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  const lowMemory=!!((navigator.deviceMemory&&navigator.deviceMemory<=4)||isIOS);
  root.classList.toggle('tagj-low-memory',lowMemory);

  // Keep navigation native. Static HTML links remain the source of truth on every host.
  // This avoids redirect/rewrite races and prevents client JS from trapping taps.
  root.classList.add('tagj-native-nav-runtime');

  const syncVisibility=()=>root.classList.toggle('tagj-runtime-paused',d.hidden);
  d.addEventListener('visibilitychange',syncVisibility,{passive:true});
  syncVisibility();

  const heroSelector='header,.hero,.portrait,.intro-stage,.home-stage,.tagj-hero,.artist-hero,.producer-hero,.creative-hero';
  d.querySelectorAll('img').forEach((img,i)=>{
    if(!img.hasAttribute('decoding'))img.decoding='async';
    if(!img.hasAttribute('loading')&&!img.closest(heroSelector))img.loading='lazy';
    if(!img.hasAttribute('fetchpriority'))img.setAttribute('fetchpriority',img.closest(heroSelector)&&i<2?'high':'low');
  });

  d.querySelectorAll('video,audio').forEach(media=>{
    if(media.id==='introVideo')return;
    if(!media.hasAttribute('data-tagj-preload-tuned')){
      media.setAttribute('data-tagj-preload-tuned','1');
      if(!media.autoplay)media.preload='none';
    }
  });

  const style=d.createElement('style');
  style.textContent=[
    'html.tagj-runtime-paused *,html.tagj-runtime-paused *::before,html.tagj-runtime-paused *::after{animation-play-state:paused!important}',
    '.tagj-offscreen *,.tagj-offscreen *::before,.tagj-offscreen *::after{animation-play-state:paused!important}',
    'html.tagj-nav-pending{cursor:progress}',
    '@supports(content-visibility:auto){main>section,.deep,.section,.v13-section,.v145-section,.v147-section{content-visibility:auto;contain-intrinsic-size:auto 820px}}',
    'html.tagj-low-memory .tagj-offscreen{contain:layout style paint}',
    'html.tagj-low-memory video:not(.intro-video),html.tagj-low-memory audio{content-visibility:auto}'
  ].join('');
  d.head.appendChild(style);

  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>e.target.classList.toggle('tagj-offscreen',!e.isIntersecting));
    },{rootMargin:'220px 0px'});
    d.querySelectorAll('main>section,.deep,.section,.v13-section,.v145-section,.v147-section').forEach(el=>io.observe(el));
  }

  function candidate(anchor){
    if(!anchor||anchor.hasAttribute('download')||anchor.target==='_blank')return null;
    const raw=anchor.getAttribute('href')||'';
    if(!raw||raw[0]==='#'||/^(?:mailto:|tel:|javascript:|data:)/i.test(raw))return null;
    let u;try{u=new URL(raw,location.href)}catch(_){return null}
    if(u.origin!==location.origin)return null;
    if(u.pathname===location.pathname&&u.search===location.search)return null;
    return u;
  }

  function warm(anchor){
    if(constrained||lowMemory)return;
    const u=candidate(anchor);if(!u)return;
    if(/\/(?:full|full\.html)$/.test(u.pathname))return;
    const href=u.origin+u.pathname+u.search;
    if(prefetched.has(href))return;
    prefetched.add(href);
    const link=d.createElement('link');
    link.rel='prefetch';link.as='document';link.href=href;
    d.head.appendChild(link);
  }
  d.addEventListener('pointerover',e=>{
    if(e.pointerType&&e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
    warm(e.target.closest?.('a[href]'));
  },{passive:true});
  d.addEventListener('focusin',e=>warm(e.target.closest?.('a[href]')),{passive:true});

  // Never cancel or debounce a valid native navigation. We only expose a brief
  // visual pending state, then let the browser perform the request immediately.
  d.addEventListener('click',e=>{
    const a=e.target.closest?.('a[href]');
    if(!candidate(a))return;
    root.classList.add('tagj-nav-pending');
  },true);

  addEventListener('pageshow',()=>root.classList.remove('tagj-nav-pending'),{passive:true});
  addEventListener('pagehide',()=>{
    root.classList.remove('tagj-nav-pending');
    d.querySelectorAll('video,audio').forEach(m=>{try{m.pause()}catch(_){}});
  },{passive:true});

  const syncNetwork=()=>root.classList.toggle('tagj-offline',!navigator.onLine);
  addEventListener('online',syncNetwork,{passive:true});
  addEventListener('offline',syncNetwork,{passive:true});
  syncNetwork();

  // V15.28: replace any older navigation-caching worker with a pass-through
  // worker. The CDN/browser owns navigation; the worker only clears legacy caches.
  if('serviceWorker' in navigator&&location.protocol==='https:'){
    addEventListener('load',()=>{
      const runtimeScript=[...d.scripts].find(x=>/\/tagj-assets\/runtime-stability\.js(?:\?|$)/.test(x.src||''));
      const workerUrl=runtimeScript?new URL('../tagj-sw.js',runtimeScript.src):new URL('tagj-sw.js',location.href);
      const scopeUrl=runtimeScript?new URL('../',runtimeScript.src):new URL('./',location.href);
      navigator.serviceWorker.register(workerUrl.pathname,{scope:scopeUrl.pathname,updateViaCache:'none'}).then(reg=>{
        try{reg.update()}catch(_){}
      }).catch(()=>{});
      if('caches' in window)caches.keys().then(keys=>Promise.all(
        keys.filter(k=>k.startsWith('tagj-nav-')).map(k=>caches.delete(k))
      )).catch(()=>{});
    },{once:true,passive:true});
  }
})();