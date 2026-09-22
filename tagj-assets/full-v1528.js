/* TAGJ V15.28 full-ecosystem runtime — cacheable/deferred. */
/* inline-1 */
document.documentElement.classList.add('js');
(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setProgress(){
    const h = document.documentElement.scrollHeight - innerHeight;
    const p = h > 0 ? scrollY / h : 0;
    root.style.setProperty('--scroll-pct', Math.max(0, Math.min(1, p)).toFixed(4));
  }
  addEventListener('scroll', setProgress, {passive:true});
  setProgress();

  if(!reduceMotion){
    addEventListener('pointermove', e => {
      root.style.setProperty('--pointer-x', (e.clientX / innerWidth).toFixed(4));
      root.style.setProperty('--pointer-y', (e.clientY / innerHeight).toFixed(4));
    }, {passive:true});
  }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('is-in'); io.unobserve(entry.target); } });
  }, {threshold:.08, rootMargin:'0px 0px -5% 0px'}) : null;
  document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('is-in'));

  function togglePanel(id, force){
    const panel = document.getElementById(id);
    if(!panel) return;
    const open = force ?? !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    body.classList.toggle('nav-lock', open);
  }
  document.querySelectorAll('[data-panel-open]').forEach(btn => btn.addEventListener('click', () => togglePanel(btn.dataset.panelOpen, true)));
  document.querySelectorAll('[data-panel-close]').forEach(btn => btn.addEventListener('click', () => togglePanel(btn.dataset.panelClose, false)));
  document.querySelectorAll('.tagj-drawer a,.artist-scene-menu a,.creative-command a').forEach(a => a.addEventListener('click', () => {
    const panel = a.closest('.tagj-drawer,.artist-scene-menu,.creative-command');
    if(panel){ panel.classList.remove('open'); body.classList.remove('nav-lock'); panel.setAttribute('aria-hidden','true'); }
  }));
  addEventListener('keydown', e => {
    if(e.key === 'Escape') document.querySelectorAll('.open').forEach(p => { if(p.classList.contains('tagj-drawer')||p.classList.contains('artist-scene-menu')||p.classList.contains('creative-command')||p.classList.contains('patch-drawer')){p.classList.remove('open'); body.classList.remove('nav-lock');} });
    if(e.key === '/' && document.getElementById('creative-command')){ e.preventDefault(); togglePanel('creative-command', true); setTimeout(()=>document.querySelector('#creative-command input')?.focus(),160); }
  });

  // TAGJ material board: move a soft highlight toward the selected material.
  document.querySelectorAll('.tagj-swatch').forEach((el, i) => el.addEventListener('mouseenter', () => {
    const stage = document.querySelector('.tagj-product-stage');
    if(stage) stage.style.setProperty('--material-index', i);
  }));

  // Producer: interactive dials, patch matrix, A/B visual comparison.
  document.querySelectorAll('.dial').forEach((dial, i) => {
    let angle = [-38, 24, 62, -10][i % 4];
    dial.style.setProperty('--dial', angle + 'deg');
    dial.addEventListener('click', () => {
      angle += 42;
      if(angle > 132) angle = -90;
      dial.style.setProperty('--dial', angle + 'deg');
    });
  });
  document.querySelectorAll('.rack-button,.patch-cell').forEach(btn => btn.addEventListener('click', () => btn.classList.toggle('on')));
  document.querySelectorAll('.mini-channel input[type=range]').forEach(range => range.addEventListener('input', () => {
    const ch = range.closest('.mini-channel');
    if(ch) ch.style.filter = `brightness(${.72 + Number(range.value)/170})`;
  }));
  document.querySelectorAll('.ab-switch button').forEach(btn => btn.addEventListener('click', () => {
    btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const display = btn.closest('.ab-section')?.querySelector('.ab-wave');
    if(display) display.style.setProperty('--ab-scale', btn.dataset.ab === 'after' ? '7' : '2.4');
  }));

  // Creative: portfolio filters and scope builder.
  document.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
    const group = btn.closest('.portfolio-board');
    if(!group) return;
    group.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    group.querySelectorAll('.project-tile').forEach(tile => tile.classList.toggle('hidden', f !== 'all' && tile.dataset.kind !== f));
  }));
  const updateBundle = () => {
    const checks = [...document.querySelectorAll('.service-toggle input')];
    if(!checks.length) return;
    const count = checks.filter(c => c.checked).length;
    const out = document.querySelector('[data-bundle-count]');
    const copy = document.querySelector('[data-bundle-copy]');
    if(out) out.textContent = String(count).padStart(2,'0');
    if(copy) copy.textContent = count === 0 ? 'Select services to build a custom release system.' : `${count} service${count===1?'':'s'} selected. Your inquiry will be scoped as one coordinated release system.`;
  };
  document.querySelectorAll('.service-toggle input').forEach(c => c.addEventListener('change', updateBundle));
  updateBundle();
})();


(() => {
  const views=[...document.querySelectorAll('.world-view')];
  const roots=['home','tagj','artist','producer','creative'];
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let routing=false;

  function worldForHash(hash){
    const id=(hash||'#home').slice(1);
    if(id==='home') return 'home';
    for(const r of roots.slice(1)){ if(id===r || id.startsWith(r+'-')) return r; }

    const target=document.getElementById(id);
    const owner=target?.closest?.('.world-view');
    if(owner?.dataset?.world && roots.includes(owner.dataset.world)) return owner.dataset.world;

    const current=document.body.dataset.currentWorld;
    if(current && current!=='home' && roots.includes(current)) return current;
    return 'home';
  }

  function show(world,anchor,behavior='auto'){
    if(!roots.includes(world)) world='home';
    const active=views.find(v=>!v.hidden)?.dataset.world;
    if(active!==world) views.forEach(v=>v.hidden=v.dataset.world!==world);
    document.body.dataset.currentWorld=world;
    if(window.TAGJNavPulse) window.TAGJNavPulse(world);

    const target=anchor ? document.getElementById(anchor) : null;
    const mode=reduceMotion?'auto':behavior;
    requestAnimationFrame(()=>{
      if(target) target.scrollIntoView({behavior:mode,block:'start'});
      else scrollTo({top:0,behavior:mode});
    });
  }

  function routeCurrent(behavior='auto'){
    const id=(location.hash||'#home').slice(1);
    const target=document.getElementById(id);
    const world=worldForHash(location.hash);
    show(world,id==='home'||!target?null:id,behavior);
  }

  function announceHashChange(oldURL){
    routing=true;
    try{dispatchEvent(new HashChangeEvent('hashchange',{oldURL,newURL:location.href}))}
    catch(_){dispatchEvent(new Event('hashchange'))}
    routing=false;
  }

  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href^="#"]');
    if(!a) return;
    const id=a.getAttribute('href').slice(1);
    if(!id) return;
    const target=document.getElementById(id);
    if(!target && id!=='home') return;

    e.preventDefault();
    const world=worldForHash('#'+id);
    const current=views.find(v=>!v.hidden)?.dataset.world;
    const oldURL=location.href;
    const next='#'+id;
    if(location.hash!==next) history.pushState(null,'',next);
    show(world,id==='home'?null:id,current===world?'smooth':'auto');
    announceHashChange(oldURL);
  });

  addEventListener('hashchange',()=>{if(!routing)routeCurrent('auto')});
  addEventListener('popstate',()=>routeCurrent('auto'));
  addEventListener('pageshow',e=>{if(e.persisted)routeCurrent('auto')},{passive:true});
  routeCurrent('auto');
})();

/* v12-live-script */
(()=>{const map=document.getElementById('v12Map'),mb=document.getElementById('v12MapBtn'),mc=document.getElementById('v12MapClose');mb?.addEventListener('click',()=>{map.classList.add('open');map.setAttribute('aria-hidden','false')});mc?.addEventListener('click',()=>{map.classList.remove('open');map.setAttribute('aria-hidden','true')});map?.addEventListener('click',e=>{if(e.target===map)mc.click()});map?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>mc.click()));
const modal=document.getElementById('v12Request'),txt=document.getElementById('v12RequestText'),status=document.getElementById('v12RequestStatus');let prepared='';
document.querySelectorAll('.formbox button').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();const box=btn.closest('.formbox');const vals=[...box.querySelectorAll('input,select,textarea')].map(el=>({label:el.getAttribute('placeholder')||el.getAttribute('aria-label')||el.name||el.tagName,value:el.value||''})).filter(x=>x.value);prepared=['TAGJ × BENNY BUNDLES — PROJECT INQUIRY','',...vals.map(x=>x.label+': '+x.value),'','Source section: '+(box.closest('[id]')?.id||location.hash.slice(1)||'site')].join('\n');txt.textContent=prepared;status.textContent='';modal.classList.add('open')}));
document.getElementById('v12RequestClose')?.addEventListener('click',()=>modal.classList.remove('open'));
document.getElementById('v12Copy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(prepared);status.textContent='Request copied.'}catch(e){status.textContent='Select the brief text and copy it manually.'}});
document.getElementById('v12Share')?.addEventListener('click',async()=>{if(navigator.share){try{await navigator.share({title:'TAGJ project inquiry',text:prepared});status.textContent='Share sheet opened.'}catch(e){}}else{try{await navigator.clipboard.writeText(prepared);status.textContent='Sharing is unavailable here, so the brief was copied.'}catch(e){status.textContent='Sharing is unavailable in this browser.'}}});
const cs=document.querySelector('.command-search input');if(cs){const links=[...document.querySelectorAll('.command-links a')];cs.addEventListener('input',()=>{const q=cs.value.trim().toLowerCase();links.forEach(a=>a.style.display=!q||a.textContent.toLowerCase().includes(q)?'':'none')})}
})();

/* v13-expansion-script */
(()=> {
  const dollar=String.fromCharCode(36);
  document.querySelectorAll('.motion-card').forEach(card=>{
    card.addEventListener('pointermove',e=>{
      const r=card.getBoundingClientRect();
      card.style.setProperty('--mx',((e.clientX-r.left)/r.width).toFixed(3));
      card.style.setProperty('--my',((e.clientY-r.top)/r.height).toFixed(3));
    },{passive:true});
  });
  document.querySelectorAll('[data-sequencer]').forEach(seq=>{
    const buttons=[...seq.querySelectorAll('[data-seq]')],panels=[...seq.querySelectorAll('[data-panel]')];
    buttons.forEach(btn=>btn.addEventListener('click',()=>{
      const i=btn.dataset.seq;
      buttons.forEach(b=>b.classList.toggle('active',b===btn));
      panels.forEach(p=>p.classList.toggle('active',p.dataset.panel===i));
    }));
  });
  document.querySelectorAll('[data-ab-v13]').forEach(btn=>btn.addEventListener('click',()=>{
    const wrap=btn.closest('[data-ab-demo]'); if(!wrap)return;
    wrap.querySelectorAll('[data-ab-v13]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); wrap.dataset.mode=btn.dataset.abV13;
  }));
  const modal=document.getElementById('v12Request'),txt=document.getElementById('v12RequestText'),status=document.getElementById('v12RequestStatus');
  function openPrepared(label,meta){
    if(!modal||!txt)return;
    txt.textContent=['TAGJ × BENNY BUNDLES — SERVICE REQUEST','',label,meta||'','','Payment status: request first / Stripe checkout not connected yet.'].filter(Boolean).join('\n');
    if(status)status.textContent=''; modal.classList.add('open');
  }
  document.querySelectorAll('[data-request]').forEach(btn=>btn.addEventListener('click',e=>{
    if(btn.tagName==='A') return;
    e.preventDefault();
    const meta=[btn.dataset.sku?('SKU: '+btn.dataset.sku):'',btn.dataset.priceCents?('Planned Stripe amount: '+dollar+(Number(btn.dataset.priceCents)/100).toFixed(2)):''].filter(Boolean).join('\n');
    openPrepared(btn.dataset.request,meta);
  }));
  const scopeChecks=[...document.querySelectorAll('[data-scope-price]')],totalEl=document.querySelector('[data-scope-total]'),scopeBtn=document.querySelector('[data-scope-request]');
  function scopeState(){
    const picked=scopeChecks.filter(x=>x.checked);
    const total=picked.reduce((s,x)=>s+Number(x.dataset.scopePrice||0),0);
    if(totalEl) totalEl.textContent=dollar+total;
    return {picked,total};
  }
  scopeChecks.forEach(x=>x.addEventListener('change',scopeState));
  scopeBtn?.addEventListener('click',e=>{
    e.preventDefault(); const state=scopeState();
    const list=state.picked.length?state.picked.map(x=>'• '+x.dataset.scopeName+' — '+dollar+x.dataset.scopePrice).join('\n'):'No services selected yet.';
    openPrepared('Custom Release Bundle','Selected:\n'+list+'\nStarting subtotal: '+dollar+state.total+'\nBundle savings are not applied until a real package price is configured.');
  });
  scopeState();
})();

/* v13-expansion-script-2 */
(()=> {
  const dollar=String.fromCharCode(36);
  document.querySelectorAll('.v13-rack button[data-route]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const was=btn.classList.contains('armed');
      document.querySelectorAll('.v13-rack button').forEach(b=>b.classList.remove('armed'));
      btn.classList.add('armed');
      if(was){ location.hash=btn.dataset.route; }
    });
  });
  const stage=document.getElementById('v13ReleaseStage'),name=document.getElementById('v13ReleaseName');
  document.querySelectorAll('.v13-release-select').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.v13-release-select').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    if(stage) stage.style.setProperty('--active-poster','var('+btn.dataset.poster+')');
    if(name) name.textContent=btn.dataset.title||'SELECTED RELEASE';
  }));
  const ab=document.getElementById('v13AB');
  ab?.querySelectorAll('[data-ab]').forEach(btn=>btn.addEventListener('click',()=>{
    ab.querySelectorAll('[data-ab]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    ab.classList.toggle('after',btn.dataset.ab==='after');
  }));
  const builder=document.getElementById('v13Builder');
  function updateV13Bundle(){
    if(!builder)return;
    const chosen=[...builder.querySelectorAll('input[type=checkbox]:checked')];
    const total=chosen.reduce((s,x)=>s+Number(x.dataset.price||0),0);
    const totalNode=builder.querySelector('[data-v13-total]');
    if(totalNode) totalNode.textContent=dollar+total;
    builder.dataset.total=String(total);
    builder.dataset.services=chosen.map(x=>x.dataset.label).join(', ');
    const summary=builder.querySelector('[data-v13-summary]');
    if(summary) summary.textContent=chosen.length
      ? chosen.length+' service'+(chosen.length===1?'':'s')+' selected · starting subtotal '+dollar+total+'. Bundle savings are applied only when a configured package price exists.'
      : 'Select services. The builder shows the starting subtotal only; no unconfigured discount is applied.';
  }
  builder?.querySelectorAll('input[type=checkbox]').forEach(x=>x.addEventListener('change',updateV13Bundle));
  updateV13Bundle();
  function openPrepared(service){
    const modal=document.getElementById('v12Request'),txt=document.getElementById('v12RequestText'),status=document.getElementById('v12RequestStatus');
    if(!modal||!txt)return;
    txt.textContent=['TAGJ × BENNY BUNDLES — PROJECT INQUIRY','','Selected service: '+service,'','Free inquiry / consultation requested.','Final scope and price must be confirmed before payment.','Source: '+(location.hash||'#site')].join('\n');
    if(status)status.textContent='';modal.classList.add('open');
  }
  document.querySelectorAll('.v13-inquire').forEach(btn=>btn.addEventListener('click',()=>openPrepared(btn.dataset.service||'Custom service inquiry')));
  document.getElementById('v13BundleInquiry')?.addEventListener('click',()=>{
    const services=builder?.dataset.services||'No services selected';
    const total=builder?.dataset.total||'0';
    openPrepared('Custom Release Bundle — '+services+' — starting subtotal '+dollar+total);
  });
})();

/* v14-depth-script */
(()=> {
  // Product lab visual switcher.
  document.querySelectorAll('[data-product-lab]').forEach(lab=>{
    const stage=lab.querySelector('[data-product-stage]'),name=lab.querySelector('[data-product-name]'),code=lab.querySelector('[data-product-code]');
    lab.querySelectorAll('[data-product-art]').forEach(btn=>btn.addEventListener('click',()=>{
      lab.querySelectorAll('[data-product-art]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
      stage?.style.setProperty('--lab-art',btn.dataset.productArt); if(name)name.textContent=btn.dataset.productName||''; if(code)code.textContent=btn.dataset.productCode||'';
    }));
  });
  // Artist release-room tab state.
  document.querySelectorAll('[data-release-tabs]').forEach(tabs=>{
    const section=tabs.closest('.deep'), scenes=section?.querySelector('[data-release-scenes]');
    tabs.querySelectorAll('[data-release-tab]').forEach(btn=>btn.addEventListener('click',()=>{
      tabs.querySelectorAll('[data-release-tab]').forEach(b=>b.classList.toggle('active',b===btn));
      scenes?.querySelectorAll('[data-release-scene]').forEach(s=>s.classList.toggle('active',s.dataset.releaseScene===btn.dataset.releaseTab));
    }));
  });
  // Touch/pointer lighting on deep image rooms.
  document.querySelectorAll('.v14-room').forEach(card=>card.addEventListener('pointermove',e=>{
    const r=card.getBoundingClientRect(); card.style.setProperty('--mx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%'); card.style.setProperty('--my',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
  },{passive:true}));
  // Producer pad bank visual performance state.
  document.querySelectorAll('[data-pad-bank] .v14-pad').forEach(p=>p.addEventListener('click',()=>p.classList.toggle('on')));
  // Mix-console controls alter the strip intensity as immediate visual feedback.
  document.querySelectorAll('[data-mix-console] input[type=range]').forEach(r=>r.addEventListener('input',()=>{
    const strip=r.closest('.v14-strip'); if(strip)strip.style.filter='brightness('+(.65+Number(r.value)/120)+')';
  }));
})();

/* v14-2-deeper-systems-js */
(()=>{
 const dollar=String.fromCharCode(36),q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
 const tagjData={
  shadow:['Shadow Step V1.1','Footwear','Development','Not confirmed'],modular:['Modular X-Spine','Footwear','Development','Not confirmed'],
  studio:['Studio Mid 808','Footwear','Development','Not confirmed'],vaultboot:['Vault Boot','Footwear','Concept','Not confirmed'],
  pressure:['Pressure Gold Runner','Footwear','Concept','Not confirmed'],concrete:['Concrete Bloom Wrap','Footwear','Concept','Not confirmed'],
  vaultbloom:['Vault Bloom','Apparel','Concept','Not confirmed'],houseouterwear:['House Outerwear System','Apparel','House study','Not confirmed'],
  grill:['Jewelry + Grill Concepts','Accessories','Concept lab','Not confirmed']
 };
 qa('[data-v142-filter="tagj"] button').forEach(btn=>btn.addEventListener('click',()=>{
   qa('[data-v142-filter="tagj"] button').forEach(b=>b.classList.toggle('active',b===btn));
   const k=btn.dataset.kind;qa('#v142TagjRecords .v142-record').forEach(card=>card.classList.toggle('is-hidden',k!=='all'&&card.dataset.kind!==k));
 }));
 qa('#v142TagjRecords .v142-record').forEach(card=>card.addEventListener('click',()=>{
   const d=tagjData[card.dataset.record],p=q('#v142TagjPanel'); if(!d||!p)return;
   p.innerHTML='<div><div class="v142-kicker">'+d[1].toUpperCase()+' / RECORD</div><h3>'+d[0]+'</h3><p>This record exposes deeper development information only after selection. No physical availability or checkout state is implied.</p><div class="v142-actions"><a href="#tagj-product-lab">Open Product Lab</a><a href="#tagj-custom">Start custom request</a></div></div><div class="v142-specs"><div><b>Category</b><span>'+d[1]+'</span></div><div><b>Status</b><span>'+d[2]+'</span></div><div><b>Inventory</b><span>'+d[3]+'</span></div><div><b>Commerce</b><span>Inquiry only</span></div></div>';
 }));
 const releaseData={
  reached:['Reached Into the Fire','PROJECT / CAMPAIGN','var(--asset-cover-reached-fire)','Campaign artwork and release-world record. Verified streaming/video destinations can attach here without redesigning the archive.'],
  oh:['Oh Lord!','RELEASE','var(--asset-cover-big-difference)','Known Benny Bundles release record. Platform destinations remain pending verified URLs.'],
  ndr:['N.D.R','RELEASE','var(--asset-cover-hold-gold)','Known release record. Final platform links remain separate verified fields.'],
  dont:['Don’t Judge Off…','RELEASE / VIDEO CAMPAIGN','var(--asset-cover-dont-judge-street)','Known campaign record with existing artwork integrated into the site.'],
  hold:['Hold Something','RELEASE','var(--asset-cover-hold-night)','Known release visual record.'],
  stuck:['Still Stuck / Still Stuck Pt. 2','CAMPAIGN RECORD','linear-gradient(135deg,#261619,#0d0909)','Campaign title retained without inventing dates or platform metadata.'],
  cold:['Cold Winter','CATALOGUE TITLE','linear-gradient(135deg,#17202a,#07090d)','Known catalogue title. The requested exact intro source is still not marked verified here.'],
  freestyle:['FREESTYLE','CAMPAIGN / VIDEO','var(--asset-cover-cant-crop)','Known campaign/video reference.']
 };
 qa('#v142ReleaseList .v142-release').forEach(btn=>btn.addEventListener('click',()=>{
   qa('#v142ReleaseList .v142-release').forEach(b=>b.classList.toggle('active',b===btn));
   const d=releaseData[btn.dataset.release]; if(!d)return;
   q('#v142ReleaseTitle').textContent=d[0];q('#v142ReleaseType').textContent=d[1];q('#v142ReleaseCopy').textContent=d[3];q('#v142ReleaseStage').style.setProperty('--v142-art',d[2]);
 }));
 const studioSelected=new Set();
 qa('#v142StudioMatrix .v142-channel').forEach(btn=>btn.addEventListener('click',()=>{
   const s=btn.dataset.studioService;btn.classList.toggle('armed');
   if(btn.classList.contains('armed'))studioSelected.add(s);else studioSelected.delete(s);
   q('#v142StudioCount').textContent=studioSelected.size+' service'+(studioSelected.size===1?'':'s');
   q('#v142StudioTitle').textContent=studioSelected.size?[...studioSelected].join(' + '):'No channels armed.';
   q('#v142StudioCopy').textContent=studioSelected.size?'This signal path is staged locally. Prepare a brief when the service combination is correct.':'Tap one or more service channels. The selected signal path will be carried into the request workflow as a prepared brief only.';
 }));
 function openPrepared(title,lines){
   const modal=q('#v12Request')||q('#requestPreview'),pre=q('#v12RequestText')||q('#requestPreviewText'); if(!modal||!pre)return;
   pre.textContent=[title,'',...lines,'','Prepared locally — no backend submission or payment has occurred.'].join('\n');modal.classList.add('open');modal.setAttribute('aria-hidden','false');
 }
 q('#v142PrepareStudio')?.addEventListener('click',()=>openPrepared('BENNY BUNDLES — STUDIO REQUEST',['Selected services: '+([...studioSelected].join(', ')||'None selected'),'Route: '+location.hash]));
 const scopeChecks=()=>qa('#v142ScopeList input:checked');
 function updateScope(){
   const checked=scopeChecks(),total=checked.reduce((n,x)=>n+Number(x.value||0),0),labels=checked.map(x=>x.dataset.label);
   q('#v142ScopeTotal').textContent=dollar+total+(checked.some(x=>x.value==='35'||x.value==='150')?'+':'');
   q('#v142ScopeSummary').textContent=checked.length?labels.join(' + ')+' — starting subtotal only; final scope and any bundle savings require configuration.':'Choose services to create a release scope. Bundle savings are intentionally not applied until a real package price is configured.';
 }
 qa('#v142ScopeList input').forEach(x=>x.addEventListener('change',updateScope));updateScope();
 q('#v142PrepareCreative')?.addEventListener('click',()=>{
   const checked=scopeChecks(),total=checked.reduce((n,x)=>n+Number(x.value||0),0),plus=checked.some(x=>x.value==='35'||x.value==='150')?'+':'';
   openPrepared('TAGJ CREATIVE — RELEASE SCOPE',['Selected services: '+(checked.map(x=>x.dataset.label).join(', ')||'None selected'),'Starting subtotal reference: '+dollar+total+plus,'Bundle discount: not configured']);
 });
 const dock=document.createElement('nav');dock.className='v142-depth-dock';dock.id='v142DepthDock';document.body.appendChild(dock);
 const dockMap={
  tagj:[['House','#tagj-house-map'],['Lab','#tagj-product-lab'],['Registry','#tagj-concept-registry-v142'],['Custom','#tagj-custom']],
  artist:[['Artist','#artist'],['Archive','#artist-release-console'],['Vault','#artist-release-vault-v142'],['Request','#artist-request-deep']],
  producer:[['Console','#producer'],['Beat Lab','#producer-beat-lab-v14'],['Matrix','#producer-service-matrix-v142'],['Request','#producer-request']],
  creative:[['Visual Lab','#creative'],['Campaign','#creative-campaign-lab-v14'],['Scope','#creative-scope-builder-v142'],['Inquiry','#creative-inquiry']]
 };
 function refreshDock(){const w=document.body.dataset.currentWorld||'';dock.innerHTML=(dockMap[w]||[]).map(x=>'<a href="'+x[1]+'">'+x[0]+'</a>').join('');dock.style.display=(innerWidth<=620&&dockMap[w])?'flex':'none';}
 addEventListener('hashchange',()=>setTimeout(refreshDock,30));addEventListener('resize',refreshDock,{passive:true});setTimeout(refreshDock,80);
})();

/* v14-3-detail-systems-js */
(()=>{
 const dollar=String.fromCharCode(36),q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
 const safeStore={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v);return true}catch(_){return false}},del(k){try{localStorage.removeItem(k)}catch(_){}}};

 const productData={
  shadow:{name:'Shadow Step V1.1',cat:'Footwear',status:'Development',art:'radial-gradient(circle at 35% 25%,rgba(213,189,127,.25),transparent 27%),linear-gradient(135deg,#191712,#070706)'},
  modular:{name:'Modular X-Spine',cat:'Footwear',status:'Development',art:'radial-gradient(circle at 68% 30%,rgba(123,94,149,.25),transparent 25%),linear-gradient(135deg,#151219,#070609)'},
  studio:{name:'Studio Mid 808',cat:'Footwear',status:'Development',art:'radial-gradient(circle at 50% 25%,rgba(229,138,67,.20),transparent 25%),linear-gradient(135deg,#17120e,#070605)'},
  vaultboot:{name:'Vault Boot',cat:'Footwear',status:'Concept',art:'linear-gradient(135deg,#18191a,#070809)'},
  vaultbloom:{name:'Vault Bloom',cat:'Apparel',status:'Concept',art:'var(--asset-green-set)'},
  pressure:{name:'Pressure Gold Runner',cat:'Footwear',status:'Concept',art:'radial-gradient(circle at 70% 20%,rgba(214,170,83,.28),transparent 27%),linear-gradient(135deg,#1c1710,#080705)'},
  concrete:{name:'Concrete Bloom Wrap',cat:'Footwear',status:'Concept',art:'linear-gradient(135deg,#242424,#0b0b0b)'},
  houseouterwear:{name:'House Outerwear System',cat:'Apparel',status:'House study',art:'var(--asset-black-gold-jacket)'},
  grill:{name:'Jewelry + Grill Concepts',cat:'Accessories',status:'Concept lab',art:'radial-gradient(circle at 40% 22%,rgba(235,231,216,.22),transparent 24%),linear-gradient(135deg,#181818,#060606)'}
 };
 const productTabs={
  concept:['Design intent','A controlled concept record for design direction, development notes and future technical media. No release date, stock count or manufacturing claim is inferred.'],
  materials:['Materials registry','Material selections remain design-stage data until a technical board or production specification is mapped to this exact concept.'],
  colorways:['Colorway studies','Color directions can be explored independently from availability. A color study does not create a sellable SKU.'],
  construction:['Construction / exploded view','This layer is reserved for approved component, stitching, hardware, outsole, upper and construction information.'],
  branding:['Branding system','Logo placement, TAGJ marks, typography, hardware and finishing treatments live as development attributes.'],
  campaign:['Campaign translation','When campaign imagery exists, it can connect the concept to lookbooks and editorials without changing the product record.'],
  status:['Development status','Prototype, sample, production, inventory and commerce are separate states. This prevents a concept render from being mistaken for confirmed merchandise.']
 };
 function renderProduct(){
   const key=q('#v143ProductSelect')?.value||'shadow',d=productData[key];if(!d)return;
   safeStore.set('tagjSelectedConceptV143',key);
   q('#v143ProductName').textContent=d.name;q('#v143ProductEyebrow').textContent=d.cat.toUpperCase()+' / '+d.status.toUpperCase();q('#v143ProductStage').style.setProperty('--v143-art',d.art);
   const tab=q('#v143ProductTabs .active')?.dataset.tab||'concept',copy=productTabs[tab];
   q('#v143ProductTabLabel').textContent=tab.toUpperCase();q('#v143ProductPanelTitle').textContent=copy[0];q('#v143ProductPanelCopy').textContent=copy[1];
   q('#v143ProductStats').innerHTML='<div class="v143-stat"><b>Concept</b><span>'+d.name+'</span></div><div class="v143-stat"><b>Category</b><span>'+d.cat+'</span></div><div class="v143-stat"><b>Development status</b><span>'+d.status+'</span></div><div class="v143-stat"><b>Inventory</b><span>Not confirmed</span></div><div class="v143-stat"><b>Checkout</b><span>Disabled</span></div>';
 }
 q('#v143ProductSelect')?.addEventListener('change',renderProduct);
 qa('#v143ProductTabs button').forEach(btn=>btn.addEventListener('click',()=>{qa('#v143ProductTabs button').forEach(b=>b.classList.toggle('active',b===btn));renderProduct()}));
 qa('#v142TagjRecords .v142-record').forEach(card=>card.addEventListener('click',()=>{const key=card.dataset.record;if(productData[key]){safeStore.set('tagjSelectedConceptV143',key);setTimeout(()=>{const actions=q('#v142TagjPanel .v142-actions');if(actions&&!actions.querySelector('[data-v143-dossier-link]')){const a=document.createElement('a');a.href='#tagj-product-detail-v143';a.dataset.v143DossierLink='1';a.textContent='Open product dossier';actions.appendChild(a)}},0)}}));
 const storedProduct=safeStore.get('tagjSelectedConceptV143');if(storedProduct&&productData[storedProduct]&&q('#v143ProductSelect'))q('#v143ProductSelect').value=storedProduct;renderProduct();

 const releaseData={
  reached:{name:'Reached Into the Fire',type:'Project / campaign',art:'var(--asset-cover-reached-fire)',overview:'Release-world record with artwork already integrated into the site.'},
  oh:{name:'Oh Lord!',type:'Release',art:'var(--asset-cover-big-difference)',overview:'Known Benny Bundles release record. Platform destinations remain independently verified fields.'},
  ndr:{name:'N.D.R',type:'Release',art:'var(--asset-cover-hold-gold)',overview:'Known release record with producer credit direction retained.'},
  dont:{name:'Don’t Judge Off…',type:'Release / video campaign',art:'var(--asset-cover-dont-judge-street)',overview:'Known campaign record with integrated artwork and multi-part video direction.'},
  hold:{name:'Hold Something',type:'Release',art:'var(--asset-cover-hold-night)',overview:'Known release visual record.'},
  stuck:{name:'Still Stuck / Still Stuck Pt. 2',type:'Campaign record',art:'linear-gradient(135deg,#251518,#0b0809)',overview:'Campaign title retained without inventing dates or external platform metadata.'},
  cold:{name:'Cold Winter',type:'Catalogue title',art:'linear-gradient(135deg,#162331,#06090d)',overview:'Known catalogue title. The exact requested intro source segment remains unverified.'},
  freestyle:{name:'FREESTYLE',type:'Campaign / video',art:'var(--asset-cover-cant-crop)',overview:'Known campaign/video reference.'}
 };
 const releaseTabs={
  overview:['Release identity','Artwork, release navigation and campaign continuity live here while platform metadata remains a separate verified layer.'],
  watch:['Watch status','The known Benny Bundles YouTube channel route is available. Individual video URLs are only attached when confirmed.'],
  listen:['Streaming status','Apple Music, Spotify, SoundCloud, UnitedMasters and YouTube Music remain link-pending until exact profile/release URLs are verified.'],
  credits:['Credits','Only supplied or verified artist / producer / collaborator information should be displayed here. Unverified personnel are not inferred.'],
  campaign:['Campaign system','Cover art, thumbnails, Shorts, video, lyric motion and release visuals can be linked as one campaign without flattening them into one page.'],
  source:['Source verification','Media-source status is explicit. For Cold Winter, the requested exact intro clip remains unresolved until the real source file is located and checked.']
 };
 function renderRelease(){
   const key=q('#v143ReleaseSelect')?.value||'reached',d=releaseData[key];if(!d)return;
   safeStore.set('bennySelectedReleaseV143',key);q('#v143ReleaseName').textContent=d.name;q('#v143ReleaseEyebrow').textContent=d.type.toUpperCase();q('#v143ReleaseStageCopy').textContent=d.overview;q('#v143ReleaseStage').style.setProperty('--v143-art',d.art);
   const tab=q('#v143ReleaseTabs .active')?.dataset.tab||'overview',copy=releaseTabs[tab];q('#v143ReleaseTabLabel').textContent=tab.toUpperCase();q('#v143ReleasePanelTitle').textContent=copy[0];q('#v143ReleasePanelCopy').textContent=copy[1];
   const sourceStatus=key==='cold'?'Exact intro source not verified':'Release media links partially / not yet verified';
   q('#v143ReleaseStats').innerHTML='<div class="v143-stat"><b>Selected record</b><span>'+d.name+'</span></div><div class="v143-stat"><b>YouTube channel</b><span><span class="v143-status-dot ready"></span>Known channel route</span></div><div class="v143-stat"><b>Streaming URLs</b><span><span class="v143-status-dot pending"></span>Pending exact links</span></div><div class="v143-stat"><b>Source status</b><span>'+sourceStatus+'</span></div>';
 }
 q('#v143ReleaseSelect')?.addEventListener('change',renderRelease);qa('#v143ReleaseTabs button').forEach(btn=>btn.addEventListener('click',()=>{qa('#v143ReleaseTabs button').forEach(b=>b.classList.toggle('active',b===btn));renderRelease()}));
 qa('#v142ReleaseList .v142-release').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.release;if(releaseData[key])safeStore.set('bennySelectedReleaseV143',key)}));
 const storedRelease=safeStore.get('bennySelectedReleaseV143');if(storedRelease&&releaseData[storedRelease]&&q('#v143ReleaseSelect'))q('#v143ReleaseSelect').value=storedRelease;renderRelease();

 let beforeUrl='',afterUrl='',activeAB='before';
 const before=q('#v143BeforeAudio'),after=q('#v143AfterAudio');
 function loadLocal(input,audio,statusEl,kind){
   const f=input.files&&input.files[0];if(!f)return;
   if(kind==='before'&&beforeUrl)URL.revokeObjectURL(beforeUrl);if(kind==='after'&&afterUrl)URL.revokeObjectURL(afterUrl);
   const u=URL.createObjectURL(f);if(kind==='before')beforeUrl=u;else afterUrl=u;audio.src=u;audio.load();
   statusEl.innerHTML='<span class="v143-status-dot ready"></span>'+f.name+' · local only / not uploaded';
 }
 q('#v143BeforeFile')?.addEventListener('change',e=>loadLocal(e.currentTarget,before,q('#v143BeforeStatus'),'before'));
 q('#v143AfterFile')?.addEventListener('change',e=>loadLocal(e.currentTarget,after,q('#v143AfterStatus'),'after'));
 function switchAB(next){
   const old=activeAB==='before'?before:after,nw=next==='before'?before:after;if(!old||!nw)return;
   const wasPlaying=!old.paused,time=Number.isFinite(old.currentTime)?old.currentTime:0;old.pause();activeAB=next;
   qa('.v143-ab-switch button').forEach(b=>b.classList.remove('active'));q(next==='before'?'#v143ABefore':'#v143AAfter')?.classList.add('active');q('#v143ABTitle').textContent=(next==='before'?'A / Before':'B / After')+' selected';
   if(nw.src){try{nw.currentTime=Math.min(time,Number.isFinite(nw.duration)?Math.max(0,nw.duration-.05):time)}catch(_){}if(wasPlaying)nw.play().catch(()=>{})}
 }
 q('#v143ABefore')?.addEventListener('click',()=>switchAB('before'));q('#v143AAfter')?.addEventListener('click',()=>switchAB('after'));
 addEventListener('pagehide',()=>{if(beforeUrl)URL.revokeObjectURL(beforeUrl);if(afterUrl)URL.revokeObjectURL(afterUrl)});

 const serviceData={
  cover:{name:'Cover Art',price:dollar+'35+',eyebrow:'COVER ART / STARTING AT',art:'var(--asset-cover-big-difference)',request:'Cover Art Request',copy:'Single-cover entry route with concept discussion, release-ready square output and structured source-image/reference intake.',need:'Song/project identity, mood, references, source imagery, platforms and explicit-content-label requirement.'},
  visualizer:{name:'Lyric Visualizer',price:dollar+'95',eyebrow:'LYRIC VISUALIZER / STARTING AT',art:'var(--asset-cover-reached-fire)',request:'Visualizer Request',copy:'Typography-led motion route designed around the record, lyric timing and a consistent visual environment.',need:'Final audio, lyrics, cover/key art, references, delivery platform and deadline.'},
  video:{name:'Music Video Editing',price:dollar+'150+',eyebrow:'MUSIC VIDEO / STARTING AT',art:'var(--asset-cover-dont-judge-street)',request:'Music Video Request',copy:'Editing and visual-treatment route that can expand into campaign cutdowns and supporting assets.',need:'Footage/source links, song file, references, intended story/tone, platform outputs and deadline.'},
  youtube:{name:'YouTube SEO Review',price:dollar+'25',eyebrow:'YOUTUBE / STARTING AT',art:'var(--asset-cover-cant-crop)',request:'Custom Creative Request',copy:'Channel/title/description and metadata diagnosis with recommendations rather than fabricated ranking guarantees.',need:'Channel URL, target audience, recent videos, release priorities and known keywords.'},
  shorts:{name:'3 Shorts',price:dollar+'45',eyebrow:'SHORT FORM / STARTING AT',art:'var(--asset-cover-hold-rooftop)',request:'Custom Creative Request',copy:'Short-form repurposing route for vertical hooks and campaign support.',need:'Source video/audio, preferred moments, platform targets, captions/branding needs and deadline.'}
 };
 function renderService(key){
   const d=serviceData[key]||serviceData.cover;
   qa('#v143ServiceList .v143-service-select').forEach(b=>b.classList.toggle('active',b.dataset.service===key));
   q('#v143ServiceName').textContent=d.name+' · '+d.price;q('#v143ServiceEyebrow').textContent=d.eyebrow;q('#v143ServiceStageCopy').textContent=d.copy;q('#v143ServiceStage').style.setProperty('--v143-art',d.art);q('#v143ServicePanelTitle').textContent=d.name;q('#v143ServicePanelCopy').textContent=d.need;
   q('#v143ServiceStats').innerHTML='<div class="v143-stat"><b>Starting price</b><span>'+d.price+'</span></div><div class="v143-stat"><b>Payment</b><span>Not connected</span></div><div class="v143-stat"><b>Inquiry</b><span>Structured brief available</span></div><div class="v143-stat"><b>Files</b><span>Reference links in preview</span></div>';
   const btn=q('#v143ServiceRequest');if(btn){btn.dataset.v143Wizard=d.request;btn.textContent='Start '+d.name+' request'}
 }
 qa('#v143ServiceList .v143-service-select').forEach(btn=>btn.addEventListener('click',()=>renderService(btn.dataset.service)));renderService('cover');

 const wiz=q('#v143Wizard'),form=q('#v143WizardForm'),type=q('#v143RequestType'),review=q('#v143Review'),progress=qa('#v143WizardProgress i'),steps=qa('#v143Wizard .v143-step');let step=0;
 function worldFromRequest(v){if(v.includes('TAGJ Custom'))return ['TAGJ / CUSTOM','#d5bd7f'];if(v.includes('Feature')||v.includes('Appearance')||v.includes('Collaboration'))return ['BENNY / ARTIST','#c45147'];if(v.includes('Beat')||v.includes('Mix')||v.includes('Mastering')||v.includes('Recording'))return ['BUNDLES / STUDIO','#63efa8'];if(v.includes('Cover')||v.includes('Video')||v.includes('Visualizer')||v.includes('Creative'))return ['TAGJ / VISUAL LAB','#8a6dff'];return ['TAGJ × BENNY','#d7bd7e']}
 function formObject(){return Object.fromEntries(new FormData(form).entries())}
 function briefText(){
   const d=formObject();return ['TAGJ × BENNY BUNDLES — REQUEST BRIEF','Request: '+(d.requestType||''),'Project / title: '+(d.projectTitle||''),'Artist / brand: '+(d.artistBrand||''),'','Concept / need: '+(d.concept||''),'Mood / direction: '+(d.mood||''),'Platforms / use: '+(d.platforms||''),'Reference / source links: '+(d.references||''),'','Deadline: '+(d.deadline||''),'Release / event date: '+(d.releaseDate||''),'Budget range: '+(d.budget||''),'Explicit label: '+(d.explicitLabel||''),'Technical notes: '+(d.notes||''),'','Contact: '+(d.contactName||''),'Email: '+(d.email||''),'Phone / handle: '+(d.phone||''),'Preferred contact: '+(d.preferred||''),'','PREVIEW STATUS: prepared locally; no backend submission or payment has occurred.'].join('\n')
 }
 function refreshWizard(){
   steps.forEach((s,i)=>s.classList.toggle('active',i===step));progress.forEach((x,i)=>x.classList.toggle('on',i<=step));
   q('#v143WizardBack').style.visibility=step===0?'hidden':'visible';q('#v143WizardNext').textContent=step===steps.length-1?'Copy brief':'Next';q('#v143ShareBrief').style.display=step===steps.length-1?'inline-block':'none';if(step===steps.length-1)review.textContent=briefText()
 }
 function openWizard(preset){
   if(preset&&[...type.options].some(o=>o.value===preset||o.text===preset))type.value=preset;
   const meta=worldFromRequest(type.value);q('#v143WizardRoute').textContent=meta[0]+' / PREVIEW-LOCAL';wiz.style.setProperty('--wizard-accent',meta[1]);step=0;refreshWizard();wiz.classList.add('open');wiz.setAttribute('aria-hidden','false');document.body.classList.add('nav-lock');setTimeout(()=>type.focus(),80)
 }
 function closeWizard(){wiz.classList.remove('open');wiz.setAttribute('aria-hidden','true');document.body.classList.remove('nav-lock')}
 document.addEventListener('click',e=>{const btn=e.target.closest('[data-v143-wizard]');if(btn){e.preventDefault();openWizard(btn.dataset.v143Wizard||'General Contact')}});
 q('#v143WizardClose')?.addEventListener('click',closeWizard);wiz?.addEventListener('click',e=>{if(e.target===wiz)closeWizard()});addEventListener('keydown',e=>{if(e.key==='Escape'&&wiz?.classList.contains('open'))closeWizard()});
 type?.addEventListener('change',()=>{const meta=worldFromRequest(type.value);q('#v143WizardRoute').textContent=meta[0]+' / PREVIEW-LOCAL';wiz.style.setProperty('--wizard-accent',meta[1])});
 q('#v143WizardBack')?.addEventListener('click',()=>{if(step>0){step--;refreshWizard()}});
 async function copyText(txt){try{await navigator.clipboard.writeText(txt);return true}catch(_){const ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(__){}ta.remove();return ok}}
 q('#v143WizardNext')?.addEventListener('click',async()=>{if(step<steps.length-1){step++;refreshWizard();return}const ok=await copyText(briefText());q('#v143WizardNext').textContent=ok?'Copied':'Copy failed'});
 q('#v143SaveDraft')?.addEventListener('click',()=>{safeStore.set('tagjBennyRequestDraftV143',JSON.stringify(formObject()));q('#v143SaveDraft').textContent='Draft saved';setTimeout(()=>q('#v143SaveDraft').textContent='Save draft',1300)});
 q('#v143ShareBrief')?.addEventListener('click',async()=>{const txt=briefText();if(navigator.share){try{await navigator.share({title:'TAGJ × Benny Bundles request brief',text:txt});return}catch(_){}}const ok=await copyText(txt);q('#v143ShareBrief').textContent=ok?'Copied':'Share unavailable'});
 const draft=safeStore.get('tagjBennyRequestDraftV143');if(draft){try{const d=JSON.parse(draft);Object.entries(d).forEach(([k,v])=>{const el=form.elements.namedItem(k);if(el)el.value=v})}catch(_){}}
 form?.addEventListener('input',()=>{if(step===steps.length-1)review.textContent=briefText()});
 refreshWizard();

 // Expand existing V14.2 dock with the new fifth-depth destinations.
 const dock=q('#v142DepthDock');
 function upgradeDock(){
   if(!dock)return;const id=(location.hash||'#home').slice(1);let w='home';if(id.startsWith('tagj'))w='tagj';else if(id.startsWith('artist'))w='artist';else if(id.startsWith('producer'))w='producer';else if(id.startsWith('creative'))w='creative';
   const links={
    tagj:[['House','#tagj-house-map'],['Lab','#tagj-product-lab'],['Dossier','#tagj-product-detail-v143'],['Custom','#tagj-custom']],
    artist:[['Artist','#artist'],['Vault','#artist-release-vault-v142'],['Dossier','#artist-release-detail-v143'],['Request','#artist-request-deep']],
    producer:[['Studio','#producer'],['A/B Lab','#producer-ab-lab-v143'],['Matrix','#producer-service-matrix-v142'],['Request','#producer-request']],
    creative:[['Visual','#creative'],['Scope','#creative-scope-builder-v142'],['Dossier','#creative-service-detail-v143'],['Inquiry','#creative-inquiry']]
   };
   if(links[w])dock.innerHTML=links[w].map(x=>'<a href="'+x[1]+'">'+x[0]+'</a>').join('');
 }
 addEventListener('hashchange',()=>setTimeout(upgradeDock,35));setTimeout(upgradeDock,120);
})();

/* v14-4-routing-contracts-js */
(()=>{
 const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
 const productRoutes={shadow:'tagj-product-shadow-v144',modular:'tagj-product-modular-v144',studio:'tagj-product-studio-v144',vaultboot:'tagj-product-vaultboot-v144',vaultbloom:'tagj-product-vaultbloom-v144',pressure:'tagj-product-pressure-v144',concrete:'tagj-product-concrete-v144',houseouterwear:'tagj-product-houseouterwear-v144',grill:'tagj-product-grill-v144'};
 const productLabels={shadow:'Shadow Step V1.1',modular:'Modular X-Spine',studio:'Studio Mid 808',vaultboot:'Vault Boot',vaultbloom:'Vault Bloom',pressure:'Pressure Gold Runner',concrete:'Concrete Bloom Wrap',houseouterwear:'House Outerwear',grill:'Jewelry / Grill'};
 const releaseRoutes={reached:'artist-release-reached-v144',oh:'artist-release-oh-v144',ndr:'artist-release-ndr-v144',dont:'artist-release-dont-v144',hold:'artist-release-hold-v144',stuck:'artist-release-stuck-v144',cold:'artist-release-cold-v144',freestyle:'artist-release-freestyle-v144'};
 const releaseLabels={reached:'Reached Into the Fire',oh:'Oh Lord!',ndr:'N.D.R',dont:'Don’t Judge Off…',hold:'Hold Something',stuck:'Still Stuck',cold:'Cold Winter',freestyle:'FREESTYLE'};
 const serviceRoutes={cover:'creative-service-cover-v144',visualizer:'creative-service-visualizer-v144',video:'creative-service-video-v144',youtube:'creative-service-youtube-v144',shorts:'creative-service-shorts-v144'};
 const serviceLabels={cover:'Cover Art',visualizer:'Visualizer',video:'Music Video',youtube:'YouTube / SEO',shorts:'Shorts'};
 const producerRoutes={Production:'producer-service-production-v144',Recording:'producer-service-recording-v144',Mixing:'producer-service-mixing-v144',Mastering:'producer-service-mastering-v144',Engineering:'producer-service-engineering-v144'};

 function routeStrip(id,map,labels){
   const el=q(id);if(!el)return;el.innerHTML=Object.entries(map).map(([k,v])=>'<a href="#'+v+'" data-route-key="'+k+'">'+labels[k]+'</a>').join('');
 }
 routeStrip('#v144ProductRoutes',productRoutes,productLabels);routeStrip('#v144ReleaseRoutes',releaseRoutes,releaseLabels);routeStrip('#v144ServiceRoutes',serviceRoutes,serviceLabels);

 function keyForHash(map){const id=(location.hash||'').slice(1);return Object.keys(map).find(k=>map[k]===id)||''}
 function markStrip(id,key){qa(id+' a').forEach(a=>a.classList.toggle('active',a.dataset.routeKey===key))}

 let syncing=false;
 function syncHashRoutes(){
   syncing=true;
   const pk=keyForHash(productRoutes);if(pk&&q('#v143ProductSelect')){q('#v143ProductSelect').value=pk;q('#v143ProductSelect').dispatchEvent(new Event('change',{bubbles:true}));markStrip('#v144ProductRoutes',pk)}
   const rk=keyForHash(releaseRoutes);if(rk&&q('#v143ReleaseSelect')){q('#v143ReleaseSelect').value=rk;q('#v143ReleaseSelect').dispatchEvent(new Event('change',{bubbles:true}));markStrip('#v144ReleaseRoutes',rk)}
   const sk=keyForHash(serviceRoutes);if(sk){const b=q('#v143ServiceList [data-service="'+sk+'"]');if(b)b.click();markStrip('#v144ServiceRoutes',sk)}
   const producer=Object.entries(producerRoutes).find(([,id])=>id===(location.hash||'').slice(1));if(producer){const b=q('#v142StudioMatrix [data-studio-service="'+producer[0]+'"]');if(b&&!b.classList.contains('armed'))b.click()}
   syncing=false;
 }
 addEventListener('hashchange',syncHashRoutes);addEventListener('popstate',()=>setTimeout(syncHashRoutes,0));setTimeout(syncHashRoutes,40);

 q('#v143ProductSelect')?.addEventListener('change',e=>{const key=e.currentTarget.value;markStrip('#v144ProductRoutes',key);if(!syncing&&productRoutes[key])history.pushState(null,'','#'+productRoutes[key])});
 q('#v143ReleaseSelect')?.addEventListener('change',e=>{const key=e.currentTarget.value;markStrip('#v144ReleaseRoutes',key);if(!syncing&&releaseRoutes[key])history.pushState(null,'','#'+releaseRoutes[key]);renderLinks(key)});
 qa('#v143ServiceList [data-service]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.service;markStrip('#v144ServiceRoutes',key);if(!syncing&&serviceRoutes[key])history.pushState(null,'','#'+serviceRoutes[key])}));
 qa('#v142StudioMatrix [data-studio-service]').forEach(b=>b.addEventListener('click',()=>{const id=producerRoutes[b.dataset.studioService];if(!syncing&&id)history.pushState(null,'','#'+id)}));

 // Progressive TAGJ registry keeps the first tap compact, but its detail CTA gets a stable item route.
 qa('#v142TagjRecords .v142-record').forEach(card=>card.addEventListener('click',()=>setTimeout(()=>{
   const a=q('#v142TagjPanel [data-v143-dossier-link]')||[...qa('#v142TagjPanel a')].find(x=>x.textContent.toLowerCase().includes('dossier'));
   if(a&&productRoutes[card.dataset.record])a.href='#'+productRoutes[card.dataset.record];
 },0)));

 // Artist vault selection now prepares a stable release URL.
 qa('#v142ReleaseList [data-release]').forEach(btn=>btn.addEventListener('click',()=>{
   const key=btn.dataset.release;const a=[...qa('#artist-release-vault-v142 a')].find(x=>x.textContent.toLowerCase().includes('release dossier'));if(a&&releaseRoutes[key])a.href='#'+releaseRoutes[key]
 }));

 const linkRegistry={
   global:{youtubeChannel:{platform:'YouTube channel',status:'verified',url:'https://www.youtube.com/@bennybundles',note:'Existing Benny Bundles channel route in project source.'}},
   reached:{},oh:{},ndr:{},dont:{},hold:{},stuck:{},cold:{},freestyle:{}
 };
 const platformNames=['YouTube video','Apple Music','Spotify','SoundCloud','UnitedMasters','YouTube Music'];
 function renderLinks(key){
   const box=q('#v144ReleaseLinks');if(!box)return;
   const rows=[linkRegistry.global.youtubeChannel,...platformNames.map(name=>({platform:name,status:'pending',url:null,note:'Exact '+name+' destination not verified for '+(releaseLabels[key]||'this release')+'.'}))];
   box.innerHTML=rows.map(x=>'<div class="v144-link-row"><b>'+x.platform+'</b><span><span class="v143-status-dot '+(x.status==='verified'?'ready':'pending')+'"></span>'+x.note+'</span>'+(x.status==='verified'&&x.url?'<a href="'+x.url+'" target="_blank" rel="noopener">Open</a>':'<em>Link pending</em>')+'</div>').join('');
 }
 renderLinks(q('#v143ReleaseSelect')?.value||'reached');

 // Directional world-transition pulse. It never intercepts taps.
 const transition=q('#v144Transition');let transitionTimer=0,lastWorld=document.body.dataset.currentWorld||'home';
 window.TAGJNavPulse=world=>{
   if(!transition||world===lastWorld)return;lastWorld=world;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   transition.dataset.target=world;transition.classList.remove('run');void transition.offsetWidth;transition.classList.add('run');clearTimeout(transitionTimer);transitionTimer=setTimeout(()=>transition.classList.remove('run'),650)
 };

 // V14.4 specialized request schema.
 const fieldSchemas={
  'Cover Art Request':[
   ['select','coverUse','Cover use',['Single release','Project / EP / album','Campaign system','Other']],
   ['select','sourceImageStatus','Source imagery',['Ready to provide','Need image selection help','No source imagery yet']],
   ['input','coverPlatforms','Required outputs','DSP square, YouTube, socials…']
  ],
  'Music Video Request':[
   ['select','videoType','Video type',['Editing existing footage','Custom visuals','Performance edit','Hybrid','Other']],
   ['select','footageStatus','Footage status',['Ready','Partially ready','Need production plan']],
   ['input','songLength','Song length','e.g. 3:18'],
   ['select','videoOrientation','Primary orientation',['16:9 landscape','9:16 vertical','Both']]
  ],
  'Visualizer Request':[
   ['select','visualizerType','Visualizer type',['Static Motion','Cinematic','Performance Visualizer','3D Visualizer','Full Lyric Film']],
   ['select','lyricsStatus','Lyrics status',['Final','Needs cleanup','Not ready']],
   ['select','audioStatus','Audio status',['Final master ready','Mix ready / master pending','Not final']]
  ],
  'Feature Request':[
   ['input','featureSongLink','Song / demo link','Link to song or demo'],
   ['select','featureNeed','Feature need',['Verse','Hook','Verse + Hook','Open collaboration']],
   ['input','featureLength','Requested section / length','Optional']
  ],
  'Appearance Request':[
   ['input','eventType','Event type','Show, party, festival, private event…'],
   ['input','venueCity','Venue / city','Venue and location'],
   ['input','setLength','Requested set length','e.g. 20 minutes'],
   ['input','eventTime','Event time','Local time / schedule notes']
  ],
  'Beat Inquiry':[
   ['select','beatNeed','Production need',['Existing beat inquiry','Custom beat','Beat pack','Exclusive inquiry']],
   ['select','licenseIntent','License intent',['Lease','Premium lease','Exclusive inquiry','Not sure']],
   ['input','bpmMood','BPM / mood / genre','Optional direction'],
   ['input','beatReferences','Reference records','Song names or links']
  ],
  'Mix Request':[
   ['input','trackCount','Track / stem count','Approximate count'],
   ['select','stemsReady','Stems ready?',['Yes','Need export help','Not yet']],
   ['input','roughMixLink','Rough mix link','Optional link'],
   ['select','vocalTuning','Vocal tuning',['Already tuned','Tuning needed','Unsure / discuss']]
  ],
  'Mastering Request':[
   ['select','mixStatus','Mix status',['Final mix ready','Near-final','Mix still changing']],
   ['input','mixFormat','Mix format','WAV bit depth / sample rate if known'],
   ['input','masterPlatforms','Target platforms','DSPs, YouTube, video…'],
   ['input','masterReferences','Reference tracks','Optional']
  ],
  'Recording Request':[
   ['input','sessionLocation','Preferred location / area','Studio / location'],
   ['input','sessionLength','Estimated session length','Hours'],
   ['input','sessionPeople','People attending','Artist + guests / team'],
   ['input','recordingNeeds','Recording needs','Vocals, punch-ins, comping…']
  ],
  'TAGJ Custom Clothing Request':[
   ['select','productCategory','Product category',['Garment','Footwear','Colorway','Custom piece','Brand collaboration','Other']],
   ['input','quantity','Quantity / scale','One-off, sample, run size…'],
   ['input','sizes','Sizes','If applicable'],
   ['input','colorway','Colorway / materials','Desired palette / material direction']
  ],
  'Collaboration Request':[
   ['select','collabType','Collaboration type',['Music','Fashion','Visual content','Brand partnership','Other']],
   ['input','collabDeliverable','Proposed deliverable','Song, capsule, video, campaign…'],
   ['input','collabPartners','Other partners involved','Optional']
  ],
  'Custom Creative Request':[
   ['input','creativeDeliverable','Desired deliverable','Describe the output'],
   ['input','creativeDimensions','Format / dimensions','Optional'],
   ['input','creativeQuantity','Number of deliverables','Optional']
  ],
  'Custom Creative Request:youtube':[
   ['input','youtubeChannelUrl','YouTube channel URL','Paste the exact channel URL'],
   ['select','youtubeNeed','Primary YouTube need',['SEO diagnosis','Channel / page setup','Metadata architecture','Thumbnail system','Content planning','Campaign management']],
   ['input','youtubeAudience','Target audience / search intent','Who should find the channel?'],
   ['input','youtubePriority','Priority videos / release','Links or titles']
  ],
  'Custom Creative Request:shorts':[
   ['input','shortsSource','Source content','Video / song / campaign source'],
   ['select','shortsPlatform','Primary platform',['YouTube Shorts','Instagram Reels','TikTok','Multi-platform']],
   ['input','shortsHook','Preferred hook / moment','Timestamp, lyric or concept'],
   ['input','shortsCount','Requested quantity','3, 5, custom…']
  ],
  'General Contact':[]
 };
 const commonNames=new Set(['schemaVersion','requestId','sourceWorld','sourceRoute','entityId','serviceId','releaseId','clientTimestamp','requestType','projectTitle','artistBrand','concept','mood','platforms','references','deadline','releaseDate','budget','explicitLabel','notes','contactName','email','phone','preferred']);
 const specialMount=q('#v144SpecialFields'),type=q('#v143RequestType'),form=q('#v143WizardForm');

 function fieldHtml(f){
   const [kind,name,label,opt]=f;
   if(kind==='select')return '<div class="v143-field"><label for="v144_'+name+'">'+label+'</label><select id="v144_'+name+'" name="'+name+'"><option value="">Select…</option>'+opt.map(x=>'<option>'+x+'</option>').join('')+'</select></div>';
   return '<div class="v143-field"><label for="v144_'+name+'">'+label+'</label><input id="v144_'+name+'" name="'+name+'" placeholder="'+String(opt||'').replace(/"/g,'&quot;')+'"></div>'
 }
 function renderSpecial(){
   if(!specialMount||!type)return;const ctx=currentContext(),schema=fieldSchemas[type.value+':'+ctx.service]||fieldSchemas[type.value]||[];
   specialMount.innerHTML=schema.length?'<div class="v144-special-head"><b>'+type.value+' specifics</b><span>Only fields relevant to this request are shown. These values are emitted separately in the backend-ready payload.</span></div>'+schema.map(fieldHtml).join(''):'';
   const saved=getDraft();if(saved&&saved.special)Object.entries(saved.special).forEach(([k,v])=>{const el=form?.elements.namedItem(k);if(el&&v!=null)el.value=v});
 }
 type?.addEventListener('change',()=>{renderSpecial();setTimeout(refreshJson,0)});

 function uid(){try{return crypto.randomUUID()}catch(_){return 'req_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}}
 function currentContext(){
   const route=(location.hash||'#home').slice(1),world=route.startsWith('tagj')?'tagj':route.startsWith('artist')?'artist':route.startsWith('producer')?'producer':route.startsWith('creative')?'creative':'home';
   return {route:'#'+route,world,product:keyForHash(productRoutes)||q('#v143ProductSelect')?.value||'',release:keyForHash(releaseRoutes)||q('#v143ReleaseSelect')?.value||'',service:keyForHash(serviceRoutes)||q('#v143ServiceList .active')?.dataset.service||''}
 }
 function ensureMeta(resetId){
   const ctx=currentContext(),rid=q('#v144RequestId');if(rid&&(!rid.value||resetId))rid.value=uid();
   if(q('#v144SourceWorld'))q('#v144SourceWorld').value=ctx.world;if(q('#v144SourceRoute'))q('#v144SourceRoute').value=ctx.route;if(q('#v144EntityId'))q('#v144EntityId').value=ctx.product;if(q('#v144ReleaseId'))q('#v144ReleaseId').value=ctx.release;if(q('#v144ServiceId'))q('#v144ServiceId').value=ctx.service;if(q('#v144ClientTimestamp'))q('#v144ClientTimestamp').value=new Date().toISOString()
 }
 function payload(){
   ensureMeta(false);const d=Object.fromEntries(new FormData(form).entries()),special={};Object.entries(d).forEach(([k,v])=>{if(!commonNames.has(k)&&v!=='')special[k]=v});
   return {
    schemaVersion:'tagj.request.v1',
    requestId:d.requestId||uid(),
    meta:{createdAt:d.clientTimestamp||new Date().toISOString(),sourceWorld:d.sourceWorld||'',sourceRoute:d.sourceRoute||'',previewOnly:true,backendSubmitted:false,paymentStatus:'not_connected'},
    context:{entityId:d.entityId||null,serviceId:d.serviceId||null,releaseId:d.releaseId||null},
    request:{type:d.requestType||'',projectTitle:d.projectTitle||'',artistBrand:d.artistBrand||'',concept:d.concept||'',mood:d.mood||'',platforms:d.platforms||'',references:d.references||''},
    constraints:{deadline:d.deadline||null,releaseDate:d.releaseDate||null,budget:d.budget||null,explicitLabel:d.explicitLabel||null,notes:d.notes||''},
    contact:{name:d.contactName||'',email:d.email||'',phoneOrHandle:d.phone||'',preferred:d.preferred||''},
    special
   }
 }
 window.TAGJRequestContractV1={schemaVersion:'tagj.request.v1',build:payload};
 window.TAGJBuildRequestPayload=payload;

 function getDraft(){try{const v144=JSON.parse(localStorage.getItem('tagjBennyRequestDraftV144')||'null');if(v144&&v144.request&&v144.request.type===type?.value)return {special:v144.special||{}};const old=JSON.parse(localStorage.getItem('tagjBennyRequestDraftV143')||'null');return old}catch(_){return null}}
 function refreshJson(){const pre=q('#v144JsonReview');if(pre)pre.textContent=JSON.stringify(payload(),null,2)}
 form?.addEventListener('input',refreshJson);form?.addEventListener('change',refreshJson);
 q('#v143SaveDraft')?.addEventListener('click',()=>{try{localStorage.setItem('tagjBennyRequestDraftV144',JSON.stringify(payload()))}catch(_){}});

 // Capture wizard-opening context before the V14.3 click handler opens the modal.
 document.addEventListener('click',e=>{
   const btn=e.target.closest('[data-v143-wizard]');if(!btn)return;
   setTimeout(()=>{ensureMeta(true);renderSpecial();refreshJson();q('#v144CopyJson').style.display='inline-block'},0)
 },true);
 q('#v143WizardNext')?.addEventListener('click',()=>setTimeout(refreshJson,0));
 q('#v143WizardBack')?.addEventListener('click',()=>setTimeout(refreshJson,0));
 q('#v144CopyJson')?.addEventListener('click',async()=>{
   const txt=JSON.stringify(payload(),null,2),btn=q('#v144CopyJson');let ok=false;
   try{await navigator.clipboard.writeText(txt);ok=true}catch(_){const ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{ok=document.execCommand('copy')}catch(__){}ta.remove()}
   btn.textContent=ok?'JSON copied':'Copy failed';setTimeout(()=>btn.textContent='Copy JSON',1300)
 });
 renderSpecial();ensureMeta(false);refreshJson();

 // Compact mobile rail follows the current world without adding information to the central home.
 const rail=document.createElement('nav');rail.className='v144-mobile-rail';rail.id='v144MobileRail';document.body.appendChild(rail);
 const rails={
  tagj:[['House','#tagj-house-map'],['Registry','#tagj-concept-registry-v142'],['Dossier','#tagj-product-detail-v143'],['Custom','#tagj-custom']],
  artist:[['Artist','#artist'],['Vault','#artist-release-vault-v142'],['Dossier','#artist-release-detail-v143'],['Request','#artist-request-deep']],
  producer:[['Studio','#producer'],['Matrix','#producer-service-matrix-v142'],['A/B','#producer-ab-lab-v143'],['Request','#producer-request']],
  creative:[['Visual','#creative'],['Scope','#creative-scope-builder-v142'],['Dossier','#creative-service-detail-v143'],['Inquiry','#creative-inquiry']]
 };
 function refreshRail(){const w=document.body.dataset.currentWorld||'home';rail.innerHTML=(rails[w]||[]).map(x=>'<a href="'+x[1]+'">'+x[0]+'</a>').join('');rail.style.display=(innerWidth<=620&&rails[w])?'grid':'none'}
 addEventListener('hashchange',()=>setTimeout(refreshRail,25));addEventListener('resize',refreshRail,{passive:true});setTimeout(refreshRail,100);
})();

/* v14-5-execution-layer-js */
(()=>{
 const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
 const store={get(k,fallback=null){try{const v=localStorage.getItem(k);return v==null?fallback:JSON.parse(v)}catch(_){return fallback}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}};

 // TAGJ technical board follows V14.4 dossier selection.
 const tagjMap={
  shadow:{name:'Shadow Step V1.1',cat:'Footwear',art:'linear-gradient(135deg,#17130d,#070706)',mapped:false},
  modular:{name:'Modular X-Spine',cat:'Footwear',art:'linear-gradient(135deg,#18131c,#070609)',mapped:false},
  studio:{name:'Studio Mid 808',cat:'Footwear',art:'linear-gradient(135deg,#1b140e,#070605)',mapped:false},
  vaultboot:{name:'Vault Boot',cat:'Footwear',art:'linear-gradient(135deg,#1a1b1c,#08090a)',mapped:false},
  vaultbloom:{name:'Vault Bloom',cat:'Apparel',art:'var(--asset-green-set)',mapped:true},
  pressure:{name:'Pressure Gold Runner',cat:'Footwear',art:'linear-gradient(135deg,#201811,#080705)',mapped:false},
  concrete:{name:'Concrete Bloom Wrap',cat:'Footwear',art:'linear-gradient(135deg,#242424,#090909)',mapped:false},
  houseouterwear:{name:'House Outerwear System',cat:'Apparel',art:'var(--asset-black-gold-jacket)',mapped:true},
  grill:{name:'Jewelry + Grill Concepts',cat:'Accessories',art:'linear-gradient(135deg,#1a1818,#070707)',mapped:false}
 };
 const tagjModes={
  concept:['Design intent','The selected concept is treated as a development record, not a sellable item.','Concept / development'],
  material:['Material system','Mapped material imagery appears only when the source asset belongs to the house/category. Concept-specific footwear boards remain source-pending until mapped.','Material source / mapping'],
  construction:['Construction logic','Reserved for approved component, stitching, support, hardware and exploded-view information. No unsupported construction claim is inferred.','Construction / exploded view'],
  brand:['Brand system','TAGJ marks, diamond-heart language, trims, typography and finish direction can be documented independently from manufacturing status.','Branding / identifiers'],
  campaign:['Campaign translation','Approved apparel and fashion imagery can move into editorial and lookbook treatment without becoming inventory.','Campaign / lookbook'],
  status:['Development status','Prototype, production, inventory and commerce remain separate states so a render or campaign image cannot silently become an in-stock product.','Status / commerce boundary']
 };
 let tagjMode='concept',tagjZoom=false;
 function selectedProduct(){return q('#v143ProductSelect')?.value||'shadow'}
 function renderTagj(){
   const key=selectedProduct(),d=tagjMap[key]||tagjMap.shadow,m=tagjModes[tagjMode];
   q('#v145TagjName').textContent=d.name;q('#v145TagjModeLabel').textContent=m[2].toUpperCase();q('#v145TagjCopy').textContent=m[1];
   q('#v145TagjArt').style.setProperty('--v145-art',tagjMode==='campaign'&&d.cat==='Apparel'?(key==='houseouterwear'?'var(--asset-fashion-hero)':'var(--asset-track-navy)'):d.art);
   q('#v145TagjHud').textContent=(d.mapped?'MAPPED HOUSE ASSET':'SCHEMATIC / SOURCE PENDING')+' · '+d.cat.toUpperCase();
   q('#v145TagjSpecs').innerHTML='<div><b>Concept</b><span>'+d.name+'</span></div><div><b>Category</b><span>'+d.cat+'</span></div><div><b>Board media</b><span>'+(d.mapped?'Approved house asset mapped':'Concept-specific board not yet mapped')+'</span></div><div><b>Inventory</b><span>Not confirmed</span></div><div><b>Commerce</b><span>Disabled</span></div>';
 }
 q('#v143ProductSelect')?.addEventListener('change',renderTagj);
 qa('#v145TagjModes button').forEach(btn=>btn.addEventListener('click',()=>{tagjMode=btn.dataset.mode;qa('#v145TagjModes button').forEach(b=>b.classList.toggle('active',b===btn));renderTagj()}));
 q('#v145TagjZoom')?.addEventListener('click',()=>{tagjZoom=!tagjZoom;q('#v145TagjArt').style.setProperty('--v145-zoom',tagjZoom?'1.22':'1');q('#v145TagjZoom').textContent=tagjZoom?'Reset zoom':'Zoom board'});
 q('#v145TagjVisual')?.addEventListener('pointermove',e=>{if(!tagjZoom)return;const r=e.currentTarget.getBoundingClientRect();q('#v145TagjArt').style.setProperty('--v145-x',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');q('#v145TagjArt').style.setProperty('--v145-y',((e.clientY-r.top)/r.height*100).toFixed(1)+'%')},{passive:true});
 renderTagj();

 // Artist release scene follows release dossier and persists readiness per release.
 const releaseScene={
  reached:{name:'Reached Into the Fire',type:'Project / campaign',art:'var(--asset-cover-reached-fire)',copy:'Fire-led campaign scene tied to the project artwork already integrated into the site.'},
  oh:{name:'Oh Lord!',type:'Release',art:'linear-gradient(135deg,#301711,#090707)',copy:'Release campaign scene. A concept-specific scene asset is not asserted here; exact public platform destinations remain separate verified fields.'},
  ndr:{name:'N.D.R',type:'Release',art:'linear-gradient(135deg,#201a2b,#08070b)',copy:'Moody release-scene treatment with source-art mapping still separate from the release record.'},
  dont:{name:'Don’t Judge Off…',type:'Release / video campaign',art:'var(--asset-cover-dont-judge-street)',copy:'Multi-part video campaign scene tied to the selected release record.'},
  hold:{name:'Hold Something',type:'Release',art:'var(--asset-cover-hold-night)',copy:'Release-scene treatment using an approved existing cover asset.'},
  stuck:{name:'Still Stuck / Still Stuck Pt. 2',type:'Campaign record',art:'linear-gradient(135deg,#291914,#090707)',copy:'Campaign planning scene; no release date or concept-specific mapped artwork is asserted.'},
  cold:{name:'Cold Winter',type:'Catalogue title',art:'linear-gradient(135deg,#182738,#06090d)',copy:'Catalogue scene. The exact requested intro clip remains source-unverified.'},
  freestyle:{name:'FREESTYLE',type:'Campaign / video',art:'linear-gradient(135deg,#1a201b,#070907)',copy:'Video/campaign planning scene tied to the selected record without inventing an exact mapped cover asset.'}
 };
 function releaseKey(){return q('#v143ReleaseSelect')?.value||'reached'}
 function renderReleaseScene(){
   const key=releaseKey(),d=releaseScene[key]||releaseScene.reached;
   q('#v145ReleaseSceneName').textContent=d.name;q('#v145ReleaseSceneType').textContent=d.type.toUpperCase();q('#v145ReleaseSceneCopy').textContent=d.copy;
   qa('#v145ReleaseScene .v145-poster').forEach(p=>p.style.setProperty('--v145-release-art',d.art));
   const state=store.get('tagjReleaseReadinessV145:'+key,{});
   qa('#v145ReleaseChecks input').forEach(x=>x.checked=!!state[x.dataset.releaseCheck])
 }
 q('#v143ReleaseSelect')?.addEventListener('change',renderReleaseScene);
 qa('#v145ReleaseChecks input').forEach(x=>x.addEventListener('change',()=>{const key=releaseKey(),state={};qa('#v145ReleaseChecks input').forEach(y=>state[y.dataset.releaseCheck]=y.checked);store.set('tagjReleaseReadinessV145:'+key,state)}));
 renderReleaseScene();

 // Producer Beat Workspace: local file only + editable metadata.
 let beatUrl='';
 q('#v145BeatFile')?.addEventListener('change',e=>{
   const f=e.currentTarget.files&&e.currentTarget.files[0];if(!f)return;if(beatUrl)URL.revokeObjectURL(beatUrl);beatUrl=URL.createObjectURL(f);q('#v145BeatAudio').src=beatUrl;q('#v145BeatAudio').load();q('#v145BeatStatus').textContent=f.name+' · local browser source only / not uploaded';
 });
 addEventListener('pagehide',()=>{if(beatUrl)URL.revokeObjectURL(beatUrl)});
 qa('#v145BeatPads .v145-pad').forEach(p=>p.addEventListener('click',()=>p.classList.toggle('on')));
 function beatBrief(){
   const moods=qa('#v145BeatPads .v145-pad.on').map(x=>x.textContent.trim());
   return ['BEAT INQUIRY / LOCAL WORKSPACE','Working title: '+(q('#v145BeatTitle')?.value||''),'BPM: '+(q('#v145BeatBpm')?.value||'Unknown'),'Key: '+(q('#v145BeatKey')?.value||'Unknown'),'License intent: '+(q('#v145BeatLicense')?.value||'Not sure'),'Mood tags: '+(moods.join(', ')||'None selected'),'Notes: '+(q('#v145BeatNotes')?.value||''),'','No beat purchase, license sale or upload has occurred.'].join('\n')
 }
 q('#v145PrepareBeat')?.addEventListener('click',()=>{
   const modal=q('#v12Request')||q('#requestPreview'),pre=q('#v12RequestText')||q('#requestPreviewText');if(modal&&pre){pre.textContent=beatBrief();modal.classList.add('open');modal.setAttribute('aria-hidden','false')}
 });

 // Session builder mirrors selected signal-matrix services when available.
 function syncSessionFromMatrix(){
   const armed=new Set(qa('#v142StudioMatrix .v142-channel.armed').map(x=>x.dataset.studioService));qa('#v145SessionServices input').forEach(x=>{if(armed.has(x.value))x.checked=true});renderSession()
 }
 function renderSession(){
   const services=qa('#v145SessionServices input:checked').map(x=>x.value),title=q('#v145SessionTitle')?.value||'',deadline=q('#v145SessionDeadline')?.value||'',notes=q('#v145SessionNotes')?.value||'';
   q('#v145SessionSummary').textContent=['SESSION PLAN','Services: '+(services.join(' → ')||'None selected'),'Project: '+(title||'Not entered'),'Deadline: '+(deadline||'Not entered'),'Notes: '+(notes||'None'),'','Planning state only — no booking or payment.'].join('\n');
   const requestBtn=q('#v145SessionRequest');if(requestBtn){const t=services.includes('Mixing')?'Mix Request':services.includes('Mastering')&&!services.includes('Recording')?'Mastering Request':'Recording Request';requestBtn.dataset.v143Wizard=t}
 }
 qa('#v145SessionServices input,#v145SessionTitle,#v145SessionDeadline,#v145SessionNotes').forEach(x=>x.addEventListener('input',renderSession));qa('#v145SessionServices input').forEach(x=>x.addEventListener('change',renderSession));qa('#v142StudioMatrix .v142-channel').forEach(x=>x.addEventListener('click',()=>setTimeout(syncSessionFromMatrix,0)));syncSessionFromMatrix();

 // Creative campaign workflow adapts to current Service Dossier selection.
 const campaignData={
  cover:{name:'Cover Art',request:'Cover Art Request',deliverables:[['Primary square cover','Release-ready key artwork'],['Explicit label variant','When requested / applicable'],['Thumbnail crop','Optional campaign derivative'],['Social crop set','Optional release support']]},
  visualizer:{name:'Lyric Visualizer',request:'Visualizer Request',deliverables:[['Final visualizer','Primary motion deliverable'],['Lyric timing review','Text / timing confirmation'],['Thumbnail / poster frame','Discovery asset'],['Vertical cutdown plan','Optional short-form derivative']]},
  video:{name:'Music Video',request:'Music Video Request',deliverables:[['Primary edit','Full-length video'],['Color / visual treatment','Campaign continuity'],['Thumbnail system','Discovery / launch'],['Short-form cutdowns','Optional Reels / Shorts assets']]},
  youtube:{name:'YouTube / SEO',request:'Custom Creative Request',deliverables:[['Channel diagnosis','Current-state review'],['Metadata recommendations','Titles / descriptions / keywords'],['Thumbnail system','Visual consistency'],['Content roadmap','Priority actions / release plan']]},
  shorts:{name:'Shorts',request:'Custom Creative Request',deliverables:[['Vertical cuts','Short-form deliverables'],['Hook selection','Opening moment / retention'],['Caption treatment','On-screen text direction'],['Platform variants','When multi-platform is requested']]}
 };
 function creativeKey(){return q('#v143ServiceList .v143-service-select.active')?.dataset.service||'cover'}
 function renderCampaign(){
   const key=creativeKey(),d=campaignData[key]||campaignData.cover;q('#v145CampaignService').textContent=d.name+' workflow';q('#v145CampaignCopy').textContent='Deliverables for the selected '+d.name+' route. Optional outputs remain optional until scoped.';
   q('#v145Deliverables').innerHTML=d.deliverables.map((x,i)=>'<label class="v145-deliverable"><input type="checkbox" data-deliverable="'+i+'"><span><b>'+x[0]+'</b><span>'+x[1]+'</span></span></label>').join('');
   const request=q('#v145CampaignRequest');if(request)request.dataset.v143Wizard=d.request;
   const saved=store.get('tagjCampaignDeliverablesV145:'+key,{});qa('#v145Deliverables input').forEach(x=>{x.checked=!!saved[x.dataset.deliverable];x.addEventListener('change',saveDeliverables)});
   renderPipeline()
 }
 function saveDeliverables(){const key=creativeKey(),state={};qa('#v145Deliverables input').forEach(x=>state[x.dataset.deliverable]=x.checked);store.set('tagjCampaignDeliverablesV145:'+key,state)}
 function renderPipeline(){
   const key=creativeKey(),state=store.get('tagjCampaignStagesV145:'+key,{}),steps=qa('#v145Pipeline .v145-stage-step');let done=0;steps.forEach((s,i)=>{const on=!!state[s.dataset.stage];s.classList.toggle('done',on);s.classList.toggle('active',!on&&i===steps.findIndex(x=>!state[x.dataset.stage]));if(on)done++});
   q('#v145CampaignProgress').style.width=(done/steps.length*100)+'%';q('#v145CampaignSummary').textContent=done+' of '+steps.length+' workflow stages marked complete. This is local planning state only.'
 }
 qa('#v145Pipeline .v145-stage-step button').forEach(btn=>btn.addEventListener('click',()=>{const step=btn.closest('.v145-stage-step'),key=creativeKey(),state=store.get('tagjCampaignStagesV145:'+key,{});state[step.dataset.stage]=!state[step.dataset.stage];store.set('tagjCampaignStagesV145:'+key,state);renderPipeline()}));
 qa('#v143ServiceList .v143-service-select').forEach(x=>x.addEventListener('click',()=>setTimeout(renderCampaign,0)));renderCampaign();

 // Level-06 mobile dock enrichment.
 function enrichDocks(){
   const world=document.body.dataset.currentWorld||'home',dock=q('#v142DepthDock'),rail=q('#v144MobileRail');
   const map={
    tagj:[['House','#tagj-house-map'],['Dossier','#tagj-product-detail-v143'],['Atelier','#tagj-technical-board-v145'],['Custom','#tagj-custom']],
    artist:[['Artist','#artist'],['Dossier','#artist-release-detail-v143'],['Scene','#artist-release-scene-v145'],['Request','#artist-request-deep']],
    producer:[['Studio','#producer'],['Beat','#producer-beat-workspace-v145'],['Session','#producer-session-builder-v145'],['A/B','#producer-ab-lab-v143']],
    creative:[['Visual','#creative'],['Dossier','#creative-service-detail-v143'],['Workflow','#creative-campaign-workflow-v145'],['Inquiry','#creative-inquiry']]
   };
   const html=(map[world]||[]).map(x=>'<a href="'+x[1]+'">'+x[0]+'</a>').join('');if(dock&&map[world])dock.innerHTML=html;if(rail&&map[world])rail.innerHTML=html
 }
 addEventListener('hashchange',()=>setTimeout(enrichDocks,45));setTimeout(enrichDocks,150);
})();

/* v147-depth-js */
(()=>{const routeWorld={tagj:'tagj',artist:'artist',producer:'producer',creative:'creative'};const ids=['tagj-catalogue-v147','tagj-footwear-v147','tagj-audio-engineer-v147','tagj-concrete-bloom-mids-v147','tagj-concrete-bloom-pump-v147','tagj-vault-heel-v147','tagj-nonstick-v147','artist-network-v147','artist-cry-dark-v147','creative-proof-v147'];window.TAGJV147Routes=ids.slice();const dock=document.querySelector('#v144MobileRail');function enrich(){if(!dock)return;const w=document.body.dataset.currentWorld;if(innerWidth>620)return;const maps={tagj:[['Catalogue','#tagj-catalogue-v147'],['Footwear','#tagj-footwear-v147'],['Lab','#tagj-product-lab'],['Custom','#tagj-custom']],artist:[['Artist','#artist'],['Releases','#artist-releases'],['Network','#artist-network-v147'],['Request','#artist-request-deep']],creative:[['Visual','#creative'],['Proof','#creative-proof-v147'],['Services','#creative-service-detail-v143'],['Inquiry','#creative-inquiry']]};if(maps[w])dock.innerHTML=maps[w].map(x=>'<a href="'+x[1]+'">'+x[0]+'</a>').join('')}addEventListener('hashchange',()=>setTimeout(enrich,40));addEventListener('resize',enrich,{passive:true});setTimeout(enrich,120)})();

/* v148-colorwave-js */
(()=>{
 const models={
  'tagj-audio-engineer-v147':{
   model:'TAGJ-018 Audio Engineer Low Tops',
   waves:[
    ['Studio Noir','Black / Bone Cream / Antique Gold / Ice-Blue Diamond',['#090909','#e9dfc9','#b38a42','#8fd8ff'],'Clean studio luxury with speaker-panel and waveform language.'],
    ['Wet Asphalt','Wet Asphalt / Smoke Grey / Chrome / Brass',['#111315','#50555b','#c7cbd0','#9b7444'],'Industrial studio-equipment direction with darker layered panels.'],
    ['Cream Signal','Cream / Matte Black / Ice-Blue / Antique Gold',['#e9dfc9','#101010','#9edcff','#b58a45'],'Light premium upper with cool translucent signal accents.'],
    ['Philly Green','Philly Green / Cream / Black / Silver',['#0d4a34','#e8dfca','#0a0b0b','#bfc3c5'],'City-rooted green color system with refined metallic hardware.'],
    ['Marble Luxe','Black Marble / Champagne Gold / Off-White / Blue-White',['#151515','#c4a46a','#eee9df','#d8efff'],'Luxury studio treatment with marble texture and diamond-shine highlights.'],
    ['Burgundy Rack','Deep Burgundy / Charcoal / Bone / Tarnished Gold',['#531d27','#353638','#d9cfb9','#9e7742'],'Vintage rack-equipment energy with rich burgundy leather tones.']
   ]},
  'tagj-concrete-bloom-mids-v147':{
   model:'TAGJ-017 Concrete Bloom Mid Tops',
   waves:[
    ['Ghost Relief','All-Black / Texture Contrast / Ghost Logo',['#070707','#171717','#292929','#3a3a3a'],'Stealth tonal cage system with ghosted branding relief.'],
    ['Concrete Bloom','Concrete Grey / Soft Cream / Deep Black / Bloom Green',['#8b8981','#e9dfca','#111111','#4f806b'],'Urban-soft direction balancing concrete texture and subtle green.'],
    ['Flight Case','Flight-Case Black / Aluminum / Worn Gold / Cream',['#101112','#b6babd','#9c7540','#e6dcc8'],'Tour-ready industrial color system with exposed equipment-case cues.'],
    ['Studio Blue','Studio Black / Speaker Grey / LED Blue / Antique Gold',['#0b0c0e','#555a60','#287eff','#b48b45'],'High-energy studio direction with blue signal light accents.'],
    ['Receipt White','Receipt White / Ink Black / Thermal Grey / Gold',['#f3f0e9','#121212','#a9aaab','#c19b5d'],'Authentication-inspired white system with printed-detail energy.'],
    ['Burgundy Rack','Deep Burgundy / Charcoal / Bone / Tarnished Gold',['#5b2029','#343536','#dcd2bf','#9e7744'],'Warm vintage studio hardware direction.']
   ]},
  'tagj-concrete-bloom-pump-v147':{
   model:'TAGJ-017 Concrete Bloom Pump',
   waves:[
    ['Blackout Vault','All-Black / Matte / Ghosted Branding',['#080808','#151515','#272727','#3b3b3b'],'Black organic cage and hollow-sole system with minimal contrast.'],
    ['Gunmetal Smoke','Black / Smoke Grey / Muted Metal',['#0a0b0c','#4a4d51','#777b80','#242628'],'Darker technical direction built around muted metal and smoke panels.'],
    ['Philly Emerald','Deep Philly Green / Black / Cream Mesh',['#0d4a34','#090b0a','#e5dcc7','#2c6b50'],'Emerald cage direction tied to Philly color language.'],
    ['Frost Cream','Bone Cream / Black Cage / Ice-Blue Sole / Gold',['#e6dcc8','#0a0a0b','#9edaff','#b68c48'],'Premium contrast with a translucent cold sole treatment.'],
    ['Noir Diamond','Black / Bone Mesh / Blue Diamond / Gold',['#0a0a0b','#e3d9c6','#78cbff','#b58b48'],'Dark collector direction with controlled diamond-highlight details.'],
    ['Oxblood Alloy','Oxblood / Charcoal / Black / Tarnished Gold',['#5a2029','#343537','#101010','#9e7641'],'Deep burgundy structural system with aged hardware energy.']
   ]},
  'tagj-vault-heel-v147':{
   model:'Bank Vault Heel High Tops',
   waves:[
    ['Vault Noir','All-Black / Ghost Hardware',['#070707','#171717','#292929','#3b3b3b'],'Stealth vault-wheel heel and tonal high-top structure.'],
    ['Concrete Bloom','Concrete Grey / Cream / Black / Bloom Green',['#87867f','#e7ddc8','#101111','#4f806c'],'Concrete-material direction with subtle green authentication accents.'],
    ['Flight-Case Black','Black / Aluminum / Worn Gold / Cream',['#0d0e0f','#b8bcc0','#9d7540','#e8ddc8'],'Industrial case-frame treatment around the signature vault heel.'],
    ['Bone Ice Ledger','Bone / Matte Black / Ice Blue / Antique Gold',['#e6dcc7','#111111','#9edcff','#b58b47'],'Light luxury system with cool translucent signals and gold hardware.'],
    ['Receipt Mode','Receipt White / Ink Black / Thermal Grey / Gold',['#f3f0e8','#111111','#a6a7a8','#c39a58'],'Document/authentication-inspired collector colorway.'],
    ['Burgundy Reserve','Deep Burgundy / Charcoal / Bone / Tarnished Gold',['#572029','#353638','#ddd2bc','#9c7540'],'Rich reserve colorway with vintage-safe hardware character.']
   ]},
  'tagj-nonstick-v147':{
   model:'TAGJ-013 Non-Stick Slip-On / Diamond Dust Knit',
   waves:[
    ['Blackout Ghost','All-Black Knit / Matte Black / Ghost Relief',['#050505','#151515','#242424','#343434'],'Stealth Diamond Dust Knit with tonal branding and faceted grip.'],
    ['Bloom Concrete','Concrete Grey / Soft Cream / Deep Black / Bloom Green',['#85857e','#e9dfc9','#0d0e0e','#66906b'],'Concrete-and-bloom palette on the knit slip-on platform.'],
    ['Frost Cream','Cream / Matte Black / Ice-Blue / Antique Gold',['#eadfcb','#101010','#9edcff','#b58b47'],'Light premium slip-on with translucent cold-sole details.'],
    ['Studio Spark','Studio Black / Speaker Grey / LED Blue / Antique Gold',['#08090a','#555b61','#2281ff','#b58a45'],'Audio-world color language translated into the knit shoe.'],
    ['Receipt White','Receipt White / Ink Black / Thermal Grey / Gold',['#f3f0e9','#111111','#aaaaaa','#c19b5d'],'Printed authentication direction for a clean retail presentation.'],
    ['Oxblood Dust','Deep Burgundy / Charcoal / Bone / Tarnished Gold',['#5a2029','#353638','#ddd2be','#99713d'],'Warm collector colorway with crushed-dust knit texture.'],
    ['Noir Marble','Black Marble / Champagne Gold / Off-White / Diamond Shine',['#151515','#c5a56a','#eee8dc','#d9f0ff'],'Marble-luxury bonus direction with diamond-shine accents.']
   ]}
 };
 const storeKey='tagjV148Colorwaves';
 let store={};try{store=JSON.parse(localStorage.getItem(storeKey)||'{}')}catch(_){}
 const save=()=>{try{localStorage.setItem(storeKey,JSON.stringify(store))}catch(_){}};
 const htmlEscape=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const copyText=async txt=>{try{await navigator.clipboard.writeText(txt);return true}catch(_){return false}};
 Object.entries(models).forEach(([id,data])=>{
   const section=document.getElementById(id),shell=section?.querySelector('.v147-shell');if(!shell)return;
   const box=document.createElement('section');box.className='v148-inspector';box.dataset.model=id;
   box.innerHTML='<div class="v148-head"><div><small>INTERACTIVE COLORWAVE INSPECTOR / V14.8</small><b>'+htmlEscape(data.model)+'</b></div><span class="v148-count">'+data.waves.length+' directions</span></div><div class="v148-wave-rail" role="tablist" aria-label="'+htmlEscape(data.model)+' colorwaves"></div><div class="v148-detail" aria-live="polite"><div><h3></h3><p></p></div><div class="v148-swatches"></div></div><div class="v148-meta"><div><b>Product state</b><span>Concept / design development</span></div><div><b>Inventory</b><span>Not confirmed</span></div><div><b>Commerce</b><span>No checkout or Stripe price ID</span></div></div><div class="v148-actions"><button type="button" data-copy>Copy colorwave brief</button><button type="button" data-request data-v143-wizard="TAGJ Custom Clothing Request">Use in custom request</button></div>';
   shell.appendChild(box);
   const rail=box.querySelector('.v148-wave-rail'),title=box.querySelector('h3'),copy=box.querySelector('.v148-detail p'),swatches=box.querySelector('.v148-swatches');
   let index=Math.max(0,Math.min(data.waves.length-1,Number(store[id]||0)));
   data.waves.forEach((w,i)=>{const btn=document.createElement('button');btn.type='button';btn.className='v148-wave';btn.role='tab';btn.textContent=(i+1).toString().padStart(2,'0')+' / '+w[0];btn.addEventListener('click',()=>render(i,true));rail.appendChild(btn)});
   function render(i,user=false){index=i;const w=data.waves[i];rail.querySelectorAll('.v148-wave').forEach((b,n)=>{b.classList.toggle('active',n===i);b.setAttribute('aria-selected',n===i?'true':'false')});title.textContent=w[0];copy.textContent=w[1]+' — '+w[3];swatches.innerHTML=w[2].map((v,n)=>'<i class="v148-swatch" style="--sw:'+v+'"><span>palette '+(n+1)+'</span></i>').join('');if(user){store[id]=i;save()}}
   render(index);
   box.querySelector('[data-copy]').addEventListener('click',async e=>{const w=data.waves[index],txt=[data.model,w[0],w[1],w[3],'Status: concept / design development; inventory not confirmed.'].join('\n');const ok=await copyText(txt);e.currentTarget.textContent=ok?'Brief copied':'Copy unavailable';setTimeout(()=>e.currentTarget.textContent='Copy colorwave brief',1200)});
   box.querySelector('[data-request]').addEventListener('click',()=>{const w=data.waves[index];setTimeout(()=>{const el=document.querySelector('#v143WizardForm [name="colorway"]');if(el){el.value=w[0]+' — '+w[1];el.dispatchEvent(new Event('input',{bubbles:true}))}},80)});
 });
})();

/* v15-7-business-contact-js */
(()=>{
  const PUBLIC_USER='prodbybundles',PUBLIC_HOST='yahoo.com';
  const DELIVERY_USER='prodbybundlez',DELIVERY_HOST='gmail.com';
  const PUBLIC_EMAIL=PUBLIC_USER+'@'+PUBLIC_HOST;
  const DELIVERY_EMAIL=DELIVERY_USER+'@'+DELIVERY_HOST;
  const LEGAL_NAME='Thats A Good Jawn LLC';

  function metaBlock(){
    const wrap=document.createElement('div');
    wrap.className='v157-business-meta';
    wrap.innerHTML='<strong>'+LEGAL_NAME+'</strong><span>Business inquiries: </span><a href="mailto:'+PUBLIC_EMAIL+'">'+PUBLIC_EMAIL+'</a>';
    return wrap;
  }
  function injectBusinessMeta(){
    ['.tagj-footer','.artist-footer-v10','.producer-footer','.creative-footer'].forEach(sel=>{
      const host=document.querySelector(sel);
      if(host&&!host.querySelector('.v157-business-meta')) host.appendChild(metaBlock());
    });
    const contact=document.querySelector('#tagj-contact');
    if(contact&&!contact.querySelector('.v157-business-inline')){
      const row=document.createElement('div'); row.className='v157-business-inline';
      row.innerHTML='<a href="mailto:'+PUBLIC_EMAIL+'">Email '+LEGAL_NAME+'</a>';
      contact.appendChild(row);
    }
  }

  function finalWizardStep(){
    const active=document.querySelector('#v143Wizard .v143-step.active');
    return !!active&&active.getAttribute('data-step')==='3';
  }
  function briefFromForm(){
    const form=document.querySelector('#v143WizardForm');
    const d=form?Object.fromEntries(new FormData(form).entries()):{};
    const lines=[
      'TAGJ × BENNY BUNDLES — REQUEST BRIEF',
      '',
      'Request ID: '+(d.requestId||''),
      'Request type: '+(d.requestType||''),
      'Project / title: '+(d.projectTitle||''),
      'Artist / brand / requester: '+(d.artistBrand||''),
      '',
      'CONCEPT / NEED',
      d.concept||'',
      '',
      'Mood / direction: '+(d.mood||''),
      'Platforms / intended use: '+(d.platforms||''),
      'References / source links: '+(d.references||''),
      '',
      'Deadline: '+(d.deadline||''),
      'Release / event date: '+(d.releaseDate||''),
      'Budget range: '+(d.budget||''),
      'Explicit-content label: '+(d.explicitLabel||''),
      'Delivery / technical notes: '+(d.notes||''),
      '',
      'CONTACT',
      'Name: '+(d.contactName||''),
      'Email: '+(d.email||''),
      'Phone / handle: '+(d.phone||''),
      'Preferred contact: '+(d.preferred||''),
      '',
      'Source world: '+(d.sourceWorld||''),
      'Source route: '+(d.sourceRoute||''),
      'Entity: '+(d.entityId||''),
      'Service: '+(d.serviceId||''),
      'Release: '+(d.releaseId||''),
      '',
      'Prepared through the TAGJ × Benny Bundles website.'
    ];
    return {data:d,text:lines.join('\n')};
  }
  function updateWizardHandoff(){
    const btn=document.querySelector('#v143WizardNext');
    const last=document.querySelector('#v143Wizard .v143-step[data-step="3"] p');
    if(last) last.textContent='Review the brief, then open a pre-addressed email to send it. The website does not mark a request as submitted until you send the email from your device.';
    if(btn&&finalWizardStep()) btn.textContent='Email completed brief';
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest&&e.target.closest('#v143WizardNext');
    if(!btn||!finalWizardStep()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const built=briefFromForm();
    const subject='TAGJ Request — '+(built.data.requestType||'General Contact')+(built.data.projectTitle?' — '+built.data.projectTitle:'');
    btn.textContent='Opening email…';
    const href='mailto:'+DELIVERY_EMAIL+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(built.text);
    window.location.href=href;
    setTimeout(()=>{if(finalWizardStep())btn.textContent='Email completed brief'},1600);
  },true);

  const wizard=document.querySelector('#v143Wizard');
  if(wizard){
    new MutationObserver(updateWizardHandoff).observe(wizard,{subtree:true,attributes:true,attributeFilter:['class']});
    wizard.addEventListener('input',updateWizardHandoff,{passive:true});
    wizard.addEventListener('change',updateWizardHandoff,{passive:true});
  }
  injectBusinessMeta();
  updateWizardHandoff();
  window.TAGJBusinessV157={legalName:LEGAL_NAME,publicBusinessEmail:PUBLIC_EMAIL,deliveryMode:'device_mailto_handoff',backendConnected:false};
})();

/* v15-8-beat-vault-js */
(()=>{
 const q=(s,r=document)=>r.querySelector(s);
 const list=q('#v158BeatList'),search=q('#v158BeatSearch'),audio=q('#v158BeatAudio'),title=q('#v158BeatTitle'),meta=q('#v158BeatMeta'),status=q('#v158BeatStatus'),source=q('#v158BeatSource'),request=q('#v158BeatRequest'),wave=q('#v158BeatWave');
 if(!list)return;
 let beats=[],selected=null;
 const fmtTime=s=>{s=Math.round(Number(s)||0);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
 const fmtSize=n=>(Number(n||0)/1048576).toFixed(1)+' MB';
 function render(filter=''){
   const term=filter.trim().toLowerCase();
   list.innerHTML='';
   beats.filter(b=>!term||b.title.toLowerCase().includes(term)||b.fileName.toLowerCase().includes(term)).forEach((b,i)=>{
     const btn=document.createElement('button');btn.type='button';btn.className='v158-beat-row'+(selected&&selected.id===b.id?' active':'');
     btn.innerHTML='<span class="num">'+b.id.replace('beat-','')+'</span><b></b><small>'+fmtTime(b.audio.durationSeconds)+'</small>';
     btn.querySelector('b').textContent=b.title;
     btn.addEventListener('click',()=>selectBeat(b));
     list.appendChild(btn);
   });
 }
 function selectBeat(b){
   selected=b;render(search?.value||'');title.textContent=b.title;
   meta.innerHTML='<span>'+fmtTime(b.audio.durationSeconds)+'</span><span>'+b.audio.format.toUpperCase()+'</span><span>'+Math.round(b.audio.sampleRate/1000*10)/10+' kHz</span><span>'+fmtSize(b.audio.fileSizeBytes)+'</span><span>Prod. by Bundles</span>';
   audio.pause();audio.removeAttribute('src');audio.load();
   audio.src=b.source.streamCandidateUrl;audio.load();
   status.textContent='Drive-backed source prepared. Tap play to audition; playback requires the Drive share permissions and browser to allow streaming.';
   source.href=b.source.viewerUrl;source.removeAttribute('aria-disabled');
   request.disabled=false;
   try{localStorage.setItem('tagjSelectedBeatV158',JSON.stringify({id:b.id,title:b.title,driveId:b.source.driveId}))}catch(_){}
   const t=q('#v145BeatTitle');if(t)t.value=b.title;document.dispatchEvent(new CustomEvent('tagj:beat-selected',{detail:{beat:b}}));
 }
 audio?.addEventListener('play',()=>wave?.classList.add('playing'));
 audio?.addEventListener('pause',()=>wave?.classList.remove('playing'));
 audio?.addEventListener('ended',()=>wave?.classList.remove('playing'));
 audio?.addEventListener('error',()=>{wave?.classList.remove('playing');if(selected)status.textContent='Direct Drive playback is unavailable in this browser. Use “Open Drive source” to audition the original file.'});
 request?.addEventListener('click',()=>{if(!selected)return;setTimeout(()=>{const p=q('#v143ProjectTitle');if(p&&!p.value)p.value=selected.title;const n=q('#v143Notes');if(n&&!n.value)n.value='Selected beat: '+selected.title+' / source '+selected.id;},0)},true);
 search?.addEventListener('input',()=>render(search.value));
 fetch('tagj-data/beat-catalog.v1.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('catalog');return r.json()}).then(data=>{
   beats=Array.isArray(data.beats)?data.beats:[];render();
   status.textContent=beats.length+' verified source records loaded. Select a beat to prepare playback.';
   try{const saved=JSON.parse(localStorage.getItem('tagjSelectedBeatV158')||'null');const hit=saved&&beats.find(b=>b.id===saved.id);if(hit)selectBeat(hit)}catch(_){}
 }).catch(()=>{status.textContent='Beat catalogue data could not be loaded. The source records remain available in the project data layer.'});
})();

/* v15-9-license-ui-js */
(()=>{
 const q=(s,r=document)=>r.querySelector(s);
 const grid=q('#v159LicenseGrid'), analysis=q('#v159BeatAnalysis'),backdrop=q('#v159LegalBackdrop'),legalText=q('#v159LegalText'),legalTitle=q('#v159LegalTitle'),legalRequest=q('#v159LegalRequest');
 if(!grid)return;
 let system=null,currentBeat=null,currentTier=null;
 const map={basicMp3:'basic-mp3-v1',premiumWav:'premium-wav-v1',trackoutPro:'trackout-pro-v1',unlimited:'unlimited-v1',exclusive:'exclusive-v1'};
 const reverse=Object.fromEntries(Object.entries(map).map(([k,v])=>[v,k]));
 const humanStatus=s=>String(s||'').replaceAll('_',' ');
 const price=t=>t.priceUsd?(String.fromCharCode(36)+t.priceUsd):(t.priceUsdMinimumOffer?('From '+String.fromCharCode(36)+t.priceUsdMinimumOffer):'Quote');
 function renderAnalysis(b){
   const a=b.analysis||{};
   const tags=(a.creativeTags||[]).map(x=>'<span>'+x+'</span>').join('');
   analysis.innerHTML='<span>Tempo: '+(a.tempoFeel||'Unconfirmed')+'</span><span>Key: '+(a.keyEstimate||'Unconfirmed')+'</span>'+tags+(a.previewNormalizationRequired?'<span>Delivery QC: normalize/limit</span>':'<span>Delivery QC: standard</span>')+(b.delivery?.derivedStemPack?'<span>Derived mix-control stems: prepared</span>':'')+(b.rightsReview?.declarationStatus?'<span>Rights declaration: pending</span>':'');
 }
 function renderLicenses(b){
   if(!system){grid.innerHTML='<div class="v159-license-card"><small>Loading license system…</small></div>';return}
   grid.innerHTML='';
   system.tiers.forEach(t=>{
     const k=reverse[t.id], av=b.licenseAvailability?.[k]?.status||'unconfirmed';
     const blocked=/hold_|original_trackouts_missing|requires_stems_trackouts/.test(av);
     const card=document.createElement('article');card.className='v159-license-card';
     card.innerHTML='<h4></h4><div class="price"></div><small></small><div class="actions"><button type="button" class="terms">View draft terms</button><button type="button" class="primary request">Request</button></div>';
     card.querySelector('h4').textContent=t.label;
     card.querySelector('.price').textContent=price(t);
     card.querySelector('small').textContent=humanStatus(av);
     const terms=card.querySelector('.terms'),req=card.querySelector('.request');
     terms.addEventListener('click',()=>openLegal(b,t));
     if(blocked){req.disabled=true;req.textContent=/hold_/.test(av)?'Rights review hold':'Needs original stems'} else req.addEventListener('click',()=>requestTier(b,t));
     grid.appendChild(card);
   });
 }
 async function openLegal(b,t){
   currentBeat=b;currentTier=t;
   legalTitle.textContent=b.title+' — '+t.label;
   legalText.textContent='Loading draft agreement…';
   backdrop.classList.add('open');backdrop.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
   try{
     const txt=await fetch(t.contractPath,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('agreement');return r.text()});
     const notes=[b.analysis?.previewNormalizationRequired?'Normalize/limit consumer delivery from float/source master.':null,b.analysis?.sourceReviewNote,b.licenseAvailability?.[reverse[t.id]]?.status].filter(Boolean).join(' ');
     const sample=b.sampleStatus?.note||b.sampleStatus?.status||'Not reviewed';
     const vals={
       BEAT_TITLE:b.title,BEAT_ID:b.id,LICENSEE_LEGAL_NAME:'[LICENSEE LEGAL NAME]',EFFECTIVE_DATE:'[EFFECTIVE DATE]',TRANSACTION_ID:'[TRANSACTION ID]',
       LICENSE_PRICE_USD:price(t),SOURCE_FILENAME:b.fileName,SOURCE_FORMAT:String(b.audio?.format||'').toUpperCase(),TEMPO_DISPLAY:b.analysis?.tempoFeel||'Estimate unavailable',
       KEY_ESTIMATE:b.analysis?.keyEstimate||'Estimate unavailable',SAMPLE_STATUS:sample,RIGHTS_DECLARATION_STATUS:b.rightsReview?.declarationStatus||'Pending',STEM_STATUS:b.delivery?.derivedStemPack?.status||'No stem pack recorded',DELIVERY_NOTES:notes||'Standard delivery QC required.',ADDITIONAL_TERMS:'None unless added in writing.'
     };
     legalText.textContent=txt.replace(/\{\{([A-Z0-9_]+)\}\}/g,(_,k)=>vals[k]??('['+k+']'));
   }catch(_){legalText.textContent='Draft agreement could not be loaded. Use the business contact route for the current terms.'}
 }
 function closeLegal(){backdrop.classList.remove('open');backdrop.setAttribute('aria-hidden','true');document.body.style.overflow=''}
 function requestTier(b,t){
   try{sessionStorage.setItem('tagjBeatLicenseInquiryV159',JSON.stringify({beatId:b.id,beatTitle:b.title,licenseId:t.id,licenseLabel:t.label,price:price(t)}))}catch(_){}
   closeLegal();
   const trigger=document.querySelector('[data-v143-wizard="Beat Inquiry"]');
   if(trigger){trigger.click();setTimeout(()=>{const title=q('#v143ProjectTitle');if(title)title.value=b.title;const notes=q('#v143Notes');if(notes)notes.value='Beat: '+b.title+' ('+b.id+')\\nRequested license: '+t.label+' — '+price(t)+'\\nRights declaration: '+(b.rightsReview?.declarationStatus||'pending')+'\\nStem status: '+(b.delivery?.derivedStemPack?.status||'none')+'\\nFinal sale subject to availability, rights review, and executed agreement.';},80)}
 }
 q('#v159LegalClose')?.addEventListener('click',closeLegal);
 backdrop?.addEventListener('click',e=>{if(e.target===backdrop)closeLegal()});
 addEventListener('keydown',e=>{if(e.key==='Escape'&&backdrop?.classList.contains('open'))closeLegal()});
 legalRequest?.addEventListener('click',()=>{if(currentBeat&&currentTier)requestTier(currentBeat,currentTier)});
 document.addEventListener('tagj:beat-selected',e=>{currentBeat=e.detail.beat;renderAnalysis(currentBeat);renderLicenses(currentBeat)});
 fetch('tagj-data/license-system.v1.json',{cache:'no-store'}).then(r=>r.json()).then(x=>{system=x;if(currentBeat)renderLicenses(currentBeat)}).catch(()=>{grid.innerHTML='<div class="v159-license-card"><small>License data unavailable.</small></div>'});
})();

/* v1514-lightbox-js */
(()=>{
 const box=document.getElementById('v1514Lightbox'),img=document.getElementById('v1514LightboxImage'),cap=document.getElementById('v1514LightboxCaption'),count=document.getElementById('v1514LightboxCount');
 if(!box||!img)return;
 let items=[],index=0,lastFocus=null;
 const eligible=()=>[...document.querySelectorAll('.v1511-gallery img,.v1512-case-visual img,.v1511-affiliate-portrait img,.v1511-affiliate-mark img')];
 function captionFor(el){return el.closest('figure')?.querySelector('figcaption')?.textContent?.trim()||el.alt||'TAGJ artwork'}
 function render(){const el=items[index];if(!el)return;img.src=el.currentSrc||el.src;img.alt=el.alt||captionFor(el);cap.textContent=captionFor(el);count.textContent=(index+1)+' / '+items.length}
 function open(el){items=eligible();index=Math.max(0,items.indexOf(el));lastFocus=document.activeElement;render();box.classList.add('open');box.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';document.getElementById('v1514LightboxClose')?.focus()}
 function close(){box.classList.remove('open');box.setAttribute('aria-hidden','true');document.body.style.overflow='';lastFocus?.focus?.()}
 function step(d){if(!items.length)return;index=(index+d+items.length)%items.length;render()}
 eligible().forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','Open full artwork: '+captionFor(el));el.addEventListener('click',()=>open(el));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(el)}})});
 document.getElementById('v1514LightboxClose')?.addEventListener('click',close);
 document.getElementById('v1514LightboxPrev')?.addEventListener('click',()=>step(-1));
 document.getElementById('v1514LightboxNext')?.addEventListener('click',()=>step(1));
 box.addEventListener('click',e=>{if(e.target===box)close()});
 addEventListener('keydown',e=>{if(!box.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1)});
})();
