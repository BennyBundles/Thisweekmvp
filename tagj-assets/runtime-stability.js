(()=>{
  'use strict';
  const d=document,root=d.documentElement;
  const prefetched=new Set();
  const conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection||null;
  const constrained=!!(conn&&(conn.saveData||/^(?:slow-2g|2g|3g)$/i.test(conn.effectiveType||'')));
  const isIOS=/iP(?:hone|ad|od)/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  const lowMemory=!!((navigator.deviceMemory&&navigator.deviceMemory<=4)||isIOS);
  root.classList.toggle('tagj-low-memory',lowMemory);
  root.dataset.tagjRuntime='15.33';

  const mainTarget=d.querySelector('main,#home,.home-shell,.subsite');
  if(mainTarget){
    if(!mainTarget.id)mainTarget.id='tagj-main';
    const skip=d.createElement('a');
    skip.className='tagj-skip-link';
    skip.href='#'+mainTarget.id;
    skip.textContent='Skip to content';
    d.body.prepend(skip);
  }

  // Keep navigation native. Static HTML links remain the source of truth on every host.
  // This avoids redirect/rewrite races and prevents client JS from trapping taps.
  root.classList.add('tagj-native-nav-runtime');

  // Producer-only transparent playback status. This is progressive enhancement:
  // if data loading fails, the static Producer page remains fully usable.
  if(/\/producer(?:\.html)?\/?$/.test(location.pathname)){
    const hero=d.querySelector('main .hero');
    if(hero&&!d.querySelector('.studio-status')){
      const section=d.createElement('section');
      section.className='studio-status';
      section.id='tagj-studio-status-runtime';
      section.setAttribute('aria-label','Studio status');
      section.innerHTML='<div class="wrap"><div class="studio-console"><div class="studio-readout"><small><i class="studio-led"></i>Beat Vault playback</small><b data-preview-mode>Drive fallback ready</b><span><span data-local-preview-count>0</span> of 22 local mobile previews</span></div><div class="studio-readout"><small>Catalogue</small><b><span data-beat-count>22</span> beats</b><span>Source-backed records</span></div><div class="studio-readout"><small>Workflow</small><b>Review before delivery</b><span>Scope stays explicit</span></div></div></div>';
      hero.insertAdjacentElement('afterend',section);
      Promise.allSettled([
        fetch('/tagj-data/beat-catalog.v1.json',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()),
        fetch('/tagj-data/beat-preview-status.v1.json',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject())
      ]).then(([catalog,status])=>{
        if(catalog.status==='fulfilled')section.querySelectorAll('[data-beat-count]').forEach(el=>el.textContent=catalog.value.beats?.length||22);
        if(status.status==='fulfilled'){
          const s=status.value,count=Number(s.localPreviewCount||0);
          const label=s.preferredMode==='local'?'All local previews ready':s.preferredMode==='hybrid'?'Hybrid local + Drive playback':'Drive fallback ready';
          section.querySelectorAll('[data-local-preview-count]').forEach(el=>el.textContent=count);
          section.querySelectorAll('[data-preview-mode]').forEach(el=>el.textContent=label);
        }
      }).catch(()=>{});
    }
  }

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
    '@view-transition{navigation:auto}',
    '.tagj-skip-link{position:fixed;z-index:10000;left:12px;top:12px;padding:10px 12px;background:#fff;color:#05080c;font:800 12px/1 system-ui,sans-serif;text-decoration:none;border-radius:4px;transform:translateY(-160%);transition:transform .16s ease}.tagj-skip-link:focus{transform:translateY(0)}',
    '@keyframes tagj-vt-out{to{opacity:.78;transform:scale(.997)}}',
    '@keyframes tagj-vt-in{from{opacity:.72;transform:scale(1.003)}}',
    '::view-transition-old(root){animation:tagj-vt-out .16s ease-out both}',
    '::view-transition-new(root){animation:tagj-vt-in .24s ease-out both}',
    ':where(a,button,input,select,textarea):focus-visible{outline:2px solid currentColor!important;outline-offset:3px!important}',
    '[id]{scroll-margin-top:84px}',
    '@supports(animation-timeline:scroll()){html::after{content:"";position:fixed;z-index:9998;left:0;right:0;top:0;height:2px;pointer-events:none;background:linear-gradient(90deg,#d5b56a,#e58a43 48%,#8a6dff);transform-origin:left center;animation:tagj-scroll-progress linear both;animation-timeline:scroll(root)}@keyframes tagj-scroll-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}}',
    '.top nav a[aria-current="location"],.nav a[aria-current="location"]{background:rgba(255,255,255,.10)!important;border-color:rgba(255,255,255,.42)!important;box-shadow:0 0 0 1px rgba(255,255,255,.035) inset;opacity:1!important}',
    '.btn,.nav a,.top nav a,button,.actions a,.subnav a,.v13-depth-nav a,.world-route{touch-action:manipulation}',
    '@media(pointer:coarse){button,.btn,.nav a,.top nav a{min-height:44px}}',
    '@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto!important}::view-transition-old(root),::view-transition-new(root){animation:none!important}.tagj-skip-link{transition:none}html::after{display:none!important}}',
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

  // Keep long standalone pages oriented without adding another menu. Only
  // same-page section links participate; native navigation remains untouched.
  const sectionNavLinks=[...d.querySelectorAll('.top nav a[href^="#"],.nav a[href^="#"]')]
    .filter(a=>(a.getAttribute('href')||'').length>1);
  if(sectionNavLinks.length&&'IntersectionObserver' in window){
    const byId=new Map(sectionNavLinks.map(a=>[(a.getAttribute('href')||'').slice(1),a]));
    const sections=[...byId.keys()].map(id=>d.getElementById(id)).filter(Boolean);
    let activeId='';
    const setActive=id=>{
      if(!id||id===activeId)return;
      activeId=id;
      sectionNavLinks.forEach(a=>{
        const on=(a.getAttribute('href')||'')==='#'+id;
        if(on)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');
      });
    };
    const navIo=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
      if(visible[0]?.target?.id)setActive(visible[0].target.id);
    },{rootMargin:'-18% 0px -62% 0px',threshold:[0,.05,.25,.5]});
    sections.forEach(s=>navIo.observe(s));
    addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(byId.has(id))setActive(id)},{passive:true});
    const initial=location.hash.slice(1);if(byId.has(initial))setActive(initial);
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