(()=>{
  'use strict';
  const d=document,root=d.documentElement;
  const prefetched=new Set();
  const conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection||null;
  const constrained=!!(conn&&(conn.saveData||/^(?:slow-2g|2g|3g)$/i.test(conn.effectiveType||'')));
  const isIOS=/iP(?:hone|ad|od)/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  const lowMemory=!!((navigator.deviceMemory&&navigator.deviceMemory<=4)||isIOS);
  root.classList.toggle('tagj-low-memory',lowMemory);
  root.dataset.tagjRuntime='15.37';

  const runtimeNode=[...d.scripts].find(x=>/\/tagj-assets\/runtime-stability\.js(?:\?|$)/.test(x.src||''));
  const siteBase=runtimeNode?new URL('../',runtimeNode.src):new URL('./',location.href);
  const sitePath=(p='')=>new URL(String(p).replace(/^\//,''),siteBase).pathname;
  const siteRootPath=siteBase.pathname.replace(/\/+$/,'')||'/';
  const attributionParams=new URLSearchParams(location.search);
  const safeReferrer=(()=>{
    try{
      if(!document.referrer)return '';
      const u=new URL(document.referrer);
      return u.origin===location.origin?'internal':u.hostname;
    }catch(_){return ''}
  })();
  const attribution=Object.freeze({
    source:attributionParams.get('utm_source')||'',
    medium:attributionParams.get('utm_medium')||'',
    campaign:attributionParams.get('utm_campaign')||'',
    content:attributionParams.get('utm_content')||'',
    term:attributionParams.get('utm_term')||'',
    referrer:safeReferrer,
    entryPath:location.pathname
  });
  window.TAGJAttribution=()=>({...attribution});


  const mainTarget=d.querySelector('main,#home,.home-shell,.subsite');
  if(mainTarget){
    if(!mainTarget.id)mainTarget.id='tagj-main';
    const skip=d.createElement('a');
    skip.className='tagj-skip-link';
    skip.href='#'+mainTarget.id;
    skip.textContent='Skip to content';
    d.body.prepend(skip);
  }

  const cleanPath=location.pathname.replace(/\/+$/,'')||'/';
  const siteIndexPath=(siteRootPath==='/'?'':siteRootPath)+'/index.html';
  if(![siteRootPath,siteIndexPath].includes(cleanPath)){
    const mapButton=d.createElement('button');
    mapButton.type='button';mapButton.className='tagj-map-trigger';mapButton.textContent='MAP';
    mapButton.setAttribute('aria-label','Open TAGJ site map');mapButton.setAttribute('aria-expanded','false');
    const map=d.createElement('div');map.id='tagj-global-map';map.className='tagj-map-overlay';map.setAttribute('aria-hidden','true');
    map.innerHTML='<div class="tagj-map-panel" role="dialog" aria-modal="true" aria-label="TAGJ site map"><div class="tagj-map-head"><div><small>BENNY BUNDLES × TAGJ</small><b>Jump between worlds.</b></div><button type="button" class="tagj-map-close" aria-label="Close site map">×</button></div><nav class="tagj-map-grid"><a href="'+sitePath('')+'"><small>00 / CENTER</small><b>Four-World Hub</b><span>Start here</span></a><a href="'+sitePath('campaign')+'"><small>01 / NOW</small><b>Current Campaign</b><span>Watch + share</span></a><a href="'+sitePath('artist')+'"><small>02 / PRIMARY</small><b>Benny Bundles</b><span>Artist identity</span></a><a href="'+sitePath('music')+'"><small>03 / RELEASES</small><b>Music</b><span>2026 run + archive</span></a><a href="'+sitePath('producer')+'"><small>04 / STUDIO</small><b>Producer / Engineer</b><span>Production + sessions</span></a><a href="'+sitePath('beats')+'"><small>05 / AUDIO</small><b>Beat Vault</b><span>Preview + licensing</span></a><a href="'+sitePath('creative')+'"><small>06 / VISUAL</small><b>Creative</b><span>Campaign + client proof</span></a><a href="'+sitePath('tagj')+'"><small>07 / DESIGN</small><b>TAGJ</b><span>Fashion + product</span></a><a href="'+sitePath('press')+'"><small>08 / PRESS</small><b>EPK</b><span>Official fact source</span></a><a href="'+sitePath('contact')+'"><small>09 / WORK</small><b>Contact</b><span>Route an inquiry</span></a></nav></div>';
    let mapLastFocus=null;
    const openMap=()=>{mapLastFocus=d.activeElement;map.classList.add('open');map.setAttribute('aria-hidden','false');mapButton.setAttribute('aria-expanded','true');d.body.style.overflow='hidden';map.querySelector('.tagj-map-close')?.focus()};
    const closeMap=()=>{map.classList.remove('open');map.setAttribute('aria-hidden','true');mapButton.setAttribute('aria-expanded','false');d.body.style.overflow='';mapLastFocus?.focus?.()};
    mapButton.addEventListener('click',openMap);
    map.querySelector('.tagj-map-close')?.addEventListener('click',closeMap);
    map.addEventListener('click',e=>{if(e.target===map)closeMap()});
    map.querySelectorAll('a').forEach(a=>{const href=a.getAttribute('href')||'';if(href===cleanPath||(cleanPath.endsWith('.html')&&href===cleanPath.replace(/\.html$/,'')))a.setAttribute('aria-current','page')});
    addEventListener('keydown',e=>{
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();map.classList.contains('open')?closeMap():openMap();return}
      if(!map.classList.contains('open'))return;
      if(e.key==='Escape'){e.preventDefault();closeMap();return}
      if(e.key==='Tab'){
        const focusable=[...map.querySelectorAll('a[href],button:not([disabled])')].filter(el=>el.offsetParent!==null);
        if(!focusable.length)return;
        const first=focusable[0],last=focusable[focusable.length-1];
        if(e.shiftKey&&d.activeElement===first){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&d.activeElement===last){e.preventDefault();first.focus()}
      }
    });
    d.body.append(mapButton,map);
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
        fetch(sitePath('tagj-data/beat-catalog.v1.json'),{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()),
        fetch(sitePath('tagj-data/beat-preview-status.v1.json'),{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject())
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


  const shareEligible=/\/music\/(?!index\.html?$)[^/]+(?:\.html)?\/?$/.test(location.pathname)||/\/press(?:\.html)?\/?$/.test(location.pathname);
  if(shareEligible){
    const actions=d.querySelector('main .hero .actions,.hero .actions');
    if(actions&&!actions.querySelector('[data-tagj-share-page]')){
      const shareBtn=d.createElement('button');
      shareBtn.type='button';shareBtn.className='btn';shareBtn.setAttribute('data-tagj-share-page','');shareBtn.textContent='Share';
      shareBtn.addEventListener('click',async()=>{
        const description=d.querySelector('meta[name="description"]')?.content||'';
        const payload={title:d.title,text:description,url:location.href};
        try{
          if(navigator.share){await navigator.share(payload);return}
          await navigator.clipboard.writeText(location.href);
          const old=shareBtn.textContent;shareBtn.textContent='Link copied';setTimeout(()=>shareBtn.textContent=old,1400);
        }catch(_){}
      });
      actions.appendChild(shareBtn);
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
    '.tagj-skip-link{position:fixed;z-index:10000;left:max(12px,env(safe-area-inset-left));top:max(12px,env(safe-area-inset-top));padding:10px 12px;background:#fff;color:#05080c;font:800 12px/1 system-ui,sans-serif;text-decoration:none;border-radius:4px;transform:translateY(-160%);transition:transform .16s ease}.tagj-skip-link:focus{transform:translateY(0)}',
    '@keyframes tagj-vt-out{to{opacity:.78;transform:scale(.997)}}',
    '@keyframes tagj-vt-in{from{opacity:.72;transform:scale(1.003)}}',
    '::view-transition-old(root){animation:tagj-vt-out .16s ease-out both}',
    '::view-transition-new(root){animation:tagj-vt-in .24s ease-out both}',
    ':where(a,button,input,select,textarea):focus-visible{outline:2px solid currentColor!important;outline-offset:3px!important}',
    '[id]{scroll-margin-top:calc(84px + env(safe-area-inset-top))}',
    '@supports(padding-top:env(safe-area-inset-top)){.top{height:auto!important;min-height:calc(64px + env(safe-area-inset-top));padding-top:env(safe-area-inset-top);padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}}',
    '@media(max-width:800px){input,select,textarea{font-size:16px!important}}',
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
    'html.tagj-low-memory video:not(.intro-video),html.tagj-low-memory audio{content-visibility:auto}',
    '.tagj-map-trigger{position:fixed;z-index:2147483000;right:max(14px,env(safe-area-inset-right));bottom:max(14px,calc(env(safe-area-inset-bottom) + 8px));height:42px;min-width:54px;padding:0 13px;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(5,9,12,.82);color:#eef3f6;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);font:850 8px ui-monospace,Menlo,monospace;letter-spacing:.15em;cursor:pointer;box-shadow:0 12px 36px rgba(0,0,0,.26)}',
    '.tagj-map-trigger:hover,.tagj-map-trigger:focus-visible{border-color:rgba(255,255,255,.52);background:#111820}',
    '.tagj-map-overlay{position:fixed;z-index:2147483001;inset:0;display:grid;place-items:center;padding:max(18px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));background:rgba(1,4,6,.76);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .22s,visibility .22s}.tagj-map-overlay.open{opacity:1;visibility:visible;pointer-events:auto}',
    '.tagj-map-panel{width:min(760px,94vw);max-height:min(720px,88svh);overflow:auto;border:1px solid rgba(255,255,255,.16);border-radius:22px;background:#071014;color:#eaf0f3;box-shadow:0 36px 100px rgba(0,0,0,.5);padding:18px}',
    '.tagj-map-head{display:flex;align-items:start;justify-content:space-between;gap:20px;padding:4px 3px 15px}.tagj-map-head small{display:block;font:800 7px ui-monospace,Menlo,monospace;letter-spacing:.16em;color:#809099}.tagj-map-head b{display:block;margin-top:5px;font-size:24px;letter-spacing:-.04em}.tagj-map-close{width:40px;height:40px;border:1px solid rgba(255,255,255,.18);border-radius:50%;background:transparent;color:inherit;font-size:22px;cursor:pointer}',
    '.tagj-map-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.tagj-map-grid a{min-height:108px;border:1px solid rgba(255,255,255,.10);border-radius:14px;padding:14px;display:flex;flex-direction:column;justify-content:flex-end;background:#0a1217;color:#eaf0f3;text-decoration:none;transition:transform .22s,border-color .22s,background .22s}.tagj-map-grid a:hover,.tagj-map-grid a:focus-visible{transform:translateY(-2px);border-color:rgba(229,138,67,.6);background:#111a20}.tagj-map-grid small{font:800 7px ui-monospace,Menlo,monospace;letter-spacing:.13em;color:#7d8c94}.tagj-map-grid b{font-size:17px;margin-top:6px}.tagj-map-grid span{font-size:8px;color:#839198;margin-top:5px}',
    '@media(max-width:620px){.tagj-map-grid{grid-template-columns:1fr 1fr}.tagj-map-trigger{height:44px;min-width:58px}.tagj-map-panel{padding:14px}.tagj-map-grid a{min-height:94px}}',
    '@media(max-width:390px){.tagj-map-grid{grid-template-columns:1fr}.tagj-map-grid a{min-height:76px}}',
    '@media(prefers-reduced-motion:reduce){.tagj-map-overlay,.tagj-map-grid a{transition:none!important}}'
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