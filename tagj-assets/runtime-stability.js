(()=>{
  'use strict';
  const d=document,root=d.documentElement;
  const prefetched=new Set();
  const isVercelPreview=/\.vercel\.app$/i.test(location.hostname);
  const conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection||null;
  const constrained=!!(conn&&(conn.saveData||/^(?:slow-2g|2g|3g)$/i.test(conn.effectiveType||'')));
  const isIOS=/iP(?:hone|ad|od)/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  const lowMemory=!!((navigator.deviceMemory&&navigator.deviceMemory<=4)||isIOS);
  root.classList.toggle('tagj-low-memory',lowMemory);

  const canonicalRoutes={
    '/index.html':'/','/preview.html':'/','/full.html':'/full','/tagj.html':'/tagj',
    '/artist.html':'/artist','/producer.html':'/producer','/creative.html':'/creative',
    '/contact.html':'/contact','/licensing.html':'/licensing',
    '/network/index.html':'/network','/network/bsf-tone-066.html':'/network/bsf-tone-066',
    '/network/t311y-demon-life.html':'/network/t311y-demon-life',
    '/creative/index.html':'/creative','/creative/portfolio.html':'/creative/portfolio',
    '/creative/case-bsf-tone-066.html':'/creative/case-bsf-tone-066',
    '/creative/case-t311y-demon-life.html':'/creative/case-t311y-demon-life',
    '/services/index.html':'/services','/beats/index.html':'/beats',
    '/music/index.html':'/music','/catalogue/index.html':'/catalogue'
  };

  function normalizePreviewLinks(){
    if(!/\.vercel\.app$/i.test(location.hostname))return;
    d.querySelectorAll('a[href]').forEach(a=>{
      const raw=a.getAttribute('href')||'';
      if(!raw||raw[0]==='#'||/^(?:mailto:|tel:|javascript:|data:)/i.test(raw))return;
      let u;try{u=new URL(raw,location.href)}catch(_){return}
      if(u.origin!==location.origin)return;
      const clean=canonicalRoutes[u.pathname];
      if(clean!==undefined)a.setAttribute('href',clean+u.search+u.hash);
    });
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',normalizePreviewLinks,{once:true});
  else normalizePreviewLinks();

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
    },{rootMargin:'240px 0px'});
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
    if(constrained)return;
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

  let navLockUntil=0;
  d.addEventListener('click',e=>{
    const a=e.target.closest?.('a[href]');
    const u=candidate(a);
    if(!u)return;
    const now=performance.now();
    if(now<navLockUntil){
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    navLockUntil=now+900;
    root.classList.add('tagj-nav-pending');
  },true);

  addEventListener('pageshow',()=>{navLockUntil=0;root.classList.remove('tagj-nav-pending')},{passive:true});
  addEventListener('pagehide',()=>{
    navLockUntil=0;
    root.classList.remove('tagj-nav-pending');
    d.querySelectorAll('video,audio').forEach(m=>{try{m.pause()}catch(_){}});
  },{passive:true});

  const syncNetwork=()=>root.classList.toggle('tagj-offline',!navigator.onLine);
  addEventListener('online',syncNetwork,{passive:true});
  addEventListener('offline',syncNetwork,{passive:true});
  syncNetwork();

  if('serviceWorker' in navigator&&location.protocol==='https:'){
    addEventListener('load',()=>{
      if(isVercelPreview){
        navigator.serviceWorker.getRegistrations().then(regs=>Promise.all(regs.map(r=>{
          const worker=r.active||r.waiting||r.installing;
          return worker&&/\/tagj-sw\.js(?:\?|$)/.test(worker.scriptURL||'')?r.unregister():false;
        }))).catch(()=>{});
        if('caches' in window)caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tagj-nav-')).map(k=>caches.delete(k)))).catch(()=>{});
        return;
      }
      navigator.serviceWorker.register('/tagj-sw.js',{scope:'/'}).catch(()=>{});
    },{once:true,passive:true});
  }
})();