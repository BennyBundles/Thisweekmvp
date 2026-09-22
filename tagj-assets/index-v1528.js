/* TAGJ V15.28 homepage runtime — cacheable/deferred. */
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
  let scrollRaf=0;
  addEventListener('scroll',()=>{
    if(scrollRaf)return;
    scrollRaf=requestAnimationFrame(()=>{scrollRaf=0;setProgress()});
  },{passive:true});
  setProgress();

  if(!reduceMotion && matchMedia('(hover:hover) and (pointer:fine)').matches){
    let pointerRaf=0,px=.5,py=.5;
    addEventListener('pointermove',e=>{
      px=e.clientX/innerWidth;py=e.clientY/innerHeight;
      if(pointerRaf)return;
      pointerRaf=requestAnimationFrame(()=>{
        pointerRaf=0;
        root.style.setProperty('--pointer-x',px.toFixed(4));
        root.style.setProperty('--pointer-y',py.toFixed(4));
      });
    },{passive:true});
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
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const routes = [...document.querySelectorAll('.world-route')];
  const centerTitle = document.getElementById('centerTitle');
  const centerCopy = document.getElementById('centerCopy');
  const trigger = document.getElementById('searchTrigger');
  const layer = document.getElementById('searchLayer');
  const input = document.getElementById('siteSearch');
  const results = document.getElementById('searchResults');
  let collapseTimer;

  const worlds = {
    tagj:{accent:'#d5bd7f',title:"TAGJ / That's A Good Jawn",copy:'Fashion, product design, catalogue, custom requests and the TAGJ story.'},
    artist:{accent:'#b85751',title:'Benny Bundles / Artist',copy:'Music, videos, streaming, releases, features, appearances and collaborations.'},
    producer:{accent:'#e58a43',title:'Benny Bundles / Producer + Engineer',copy:'Beats, recording, production, mixing, mastering, credits and session requests.'},
    creative:{accent:'#8166ee',title:'TAGJ / Creative Services',copy:'Cover art, music videos, lyric visualizers, shorts, YouTube services and bundles.'}
  };

  const searchIndex = [
    ['TAGJ Product Catalogue','Development catalogue for footwear, apparel and accessories with explicit commerce status','catalogue/index.html','TAGJ','#d5bd7f','tagj product catalogue footwear apparel accessories concepts development inventory'],
    ['TAGJ × Benny Bundles Services','Creative, production, recording, mixing, mastering and engineering directory','services/index.html','BUSINESS','#9fb2bc','services creative production recording mixing mastering engineering rates quotes'],
    ['Benny Bundles Music Archive','Release records, verified videos and campaign dossiers','music/index.html','ARTIST','#b85751','benny bundles music archive releases songs videos catalogue'],
    ['Wanted Me Gone','Benny Bundles official video release page, September 14 2026','music/wanted-me-gone.html','ARTIST','#b85751','wanted me gone benny bundles official video september 14 2026'],
    ['Can’t Crop Karma','Benny Bundles official video release page, August 13 2026','music/cant-crop-karma.html','ARTIST','#b85751','cant crop karma benny bundles official video august 13 2026'],
    ['Hold Something','Benny Bundles official music video and lyric visualizer release page','music/hold-something.html','ARTIST','#b85751','hold something benny bundles official music video lyric visualizer august 22 2026'],
    ['FREESTYLE','Benny Bundles official video release page, July 26 2026','music/freestyle.html','ARTIST','#b85751','freestyle benny bundles official video july 26 2026'],
    ['Cried in the Dark','Benny Bundles official video release page, June 30 2026','music/cried-in-the-dark.html','ARTIST','#b85751','cried in the dark benny bundles official video june 30 2026'],
    ['The Whole Brand','Benny Bundles official video release page, June 30 2026','music/the-whole-brand.html','ARTIST','#b85751','the whole brand benny bundles official video june 30 2026'],
    ['Bundles Beat Catalogue','22 analyzed original beats with tempo, key, tags and licensing entry','beats/index.html','STUDIO','#e58a43','bundles beat catalogue 22 beats tempo key tags licensing'],
    ['Contact TAGJ × Benny Bundles','Business, music, studio, creative and product inquiry routes','contact.html','BUSINESS','#9fb2bc','contact business inquiry email features studio creative product'],
    ['Beat Licensing Overview','Public beat license pricing, delivery disclosures and draft-term links','licensing.html','STUDIO','#e58a43','beat licensing overview basic premium trackout unlimited exclusive contracts terms'],
    ['TAGJ Design House Subsite','Footwear, apparel, accessories and product-development entry','tagj.html','TAGJ','#d5bd7f','tagj design house subsite clothing footwear apparel accessories product catalogue'],
    ['Benny Bundles Artist Subsite','Music, releases, streaming and collaborator network entry','artist.html','ARTIST','#b85751','benny bundles artist subsite music releases streaming network'],
    ['Bundles Studio Subsite','Beat Vault, licensing, production and engineering entry','producer.html','STUDIO','#e58a43','bundles producer studio subsite beats licensing recording mixing mastering engineering'],
    ['TAGJ Visual Lab Subsite','Cover art, music videos, visualizers and client case studies','creative.html','CREATIVE','#7457ff','tagj visual lab creative subsite cover art video visualizer portfolio case studies'],
    ['TAGJ Artist Network Subsite','Direct collaborator and affiliate profile index','network/index.html','ARTIST','#b85751','tagj artist network subsite collaborators affiliates billyen bsf tone 066 t311y demon life'],
    ['BSF Tone 066 Direct Profile','Shareable BSF Tone 066 affiliate profile and Bloxx and Robbers visual archive','network/bsf-tone-066.html','ARTIST','#b85751','bsf tone direct profile affiliate bloxx robbers merch cover art'],
    ['T311Y Demon Life Direct Profile','Shareable T311Y Demon Life affiliate profile, studio history and artwork','network/t311y-demon-life.html','ARTIST','#b85751','t311y demon life direct profile affiliate chapter 3 demon culture artwork'],
    ['TAGJ Designs','Flagship products, current campaigns, coming soon','full.html#tagj-designs','TAGJ','#d5bd7f','design flagship campaign'],
    ['TAGJ Shop / Catalogue','New designs, categories, women’s, sale, custom requests','full.html#tagj-shop','TAGJ','#d5bd7f','shop store catalogue women sale clothing merch'],
    ['TAGJ Story / Team / FAQ','Our story, team, FAQ and contact','full.html#tagj-story','TAGJ','#d5bd7f','story team faq contact about'],
    ['TAGJ Custom Requests','Custom clothing and product inquiries','full.html#tagj-custom','TAGJ','#d5bd7f','custom request clothing product'],
    ['Benny YouTube','Channel, videos, shorts and YouTube services','full.html#artist-youtube','ARTIST','#b85751','youtube videos shorts content page creation management seo'],
    ['Streaming Services','Apple Music, Spotify, SoundCloud, United Masters, YouTube Music','full.html#artist-streaming','ARTIST','#b85751','apple spotify soundcloud united masters youtube music streaming'],
    ['Features / Live / Collaboration','Feature requests, live appearances and custom artist requests','full.html#artist-services','ARTIST','#b85751','feature live appearance collaboration request'],
    ['Release Archive','Benny Bundles music and visual release worlds','full.html#artist-releases','ARTIST','#b85751','release archive music songs'],
    ['Artist Network','BillYen spotlight, BSF Tone 066 and T311Y Demon Life','full.html#artist-network','ARTIST','#b85751','billyen bsf tone 066 t311y demon life affiliates'],
    ['BSF Tone 066','Affiliate profile, beat collaboration, Mud Thicka Than Blood, Bloxx and Robbers cover art and merch','full.html#artist-bsf-tone-066','ARTIST','#b85751','bsf tone 066 bloxx robbers mud thicka than blood benny butcher beats merch cover art visual director lyric video'],
    ['Bloxx and Robbers Case Study','BSF Tone 066 cover-art directions and merchandise system designed by Benny Bundles','creative/case-bsf-tone-066.html','CREATIVE','#7457ff','bloxx robbers case study bsf tone 066 cover art merch merchandise design benny bundles portfolio'],
    ['T311Y Project Artwork Case Study','T311Y Demon Life cover art and The Demon Culture identity work by Benny Bundles','creative/case-t311y-demon-life.html','CREATIVE','#7457ff','t311y demon life case study chapter 3 light pack jimmy blast off 3-d devils playground demon culture logo cover art benny bundles portfolio'],
    ['Visual Lab Portfolio','Repository-backed Benny Bundles client work, cover systems, merchandise extensions and project identity','creative/portfolio.html','CREATIVE','#7457ff','visual lab portfolio benny bundles case studies client work cover art merchandise project identity proof'],
    ['T311Y Demon Life','Affiliate profile, studio history, project artwork and verified platform links','full.html#artist-t311y','ARTIST','#b85751','t311y demon life telly demon life ha-ha a00 rico chapter iii chapter 3 light pack jimmy boy blast off devils playground youtube spotify apple music'],
    ['Producer Credits','Credits and collaborations','full.html#producer-credits','STUDIO','#e58a43','credits collaborations producer'],
    ['Beat Store','Beats and production requests','full.html#producer-beats','STUDIO','#e58a43','beat beats instrumentals production store'],
    ['Mixing / Mastering / Recording','Audio services, before-and-after examples and packages','full.html#producer-services','STUDIO','#e58a43','mix mixing master mastering recording engineering audio package sale'],
    ['Studio Request','Submit a production or engineering request','full.html#producer-request','STUDIO','#e58a43','studio request submission session engineer'],
    ['Cover Art','Portfolio, pricing, packages and submission','full.html#creative-cover','CREATIVE','#8166ee','cover art artwork design catalogue pricing'],
    ['Full Music Videos','Portfolio, pricing, packages and submission','full.html#creative-video','CREATIVE','#8166ee','music video full video production'],
    ['Lyric Visualizers','Specialty visualizers, portfolio, pricing and bundles','full.html#creative-lyric','CREATIVE','#8166ee','lyric visualizer visualiser lyrics specialty'],
    ['Creative Packages / Bundles','Coordinated release bundles and deals','full.html#creative-packages','CREATIVE','#8166ee','bundle bundles package deals sale shorts content'],
    ['Free Creative Inquiry','Free draft consultation and custom inquiry','full.html#creative-inquiry','CREATIVE','#8166ee','free inquiry consultation draft custom'],
    ['TAGJ Product Lab','Interactive material, color and lookbook study','full.html#tagj-product-lab','TAGJ','#d5bd7f','product lab lookbook clothing material color custom'],
    ['Reached Into The Fire','Project release room and visual world','full.html#artist-release-reached-v144','ARTIST','#b85751','reached into the fire project release music visual'],
    ['Oh Lord!','Self-produced song release room','full.html#artist-release-oh-v144','ARTIST','#b85751','oh lord self produced song reached into the fire'],
    ['N.D.R','Official moody release room · prod. by Bundles','full.html#artist-release-ndr-v144','ARTIST','#b85751','ndr n.d.r prod by bundles song music video'],
    ["Don't Judge Off…",'Official multi-part video release room','full.html#artist-release-dont-v144','ARTIST','#b85751',"don't judge off self produced official video"],
    ['Beat Lab','Interactive production pad bank and licensing route','full.html#producer-beat-lab-v14','STUDIO','#e58a43','beat lab production pads beats licenses'],
    ['Beat Vault','22 verified Benny Bundles beat source files with source-backed audition and inquiry routing','full.html#producer-beat-vault-v158','STUDIO','#e58a43','beat vault 22 beats producer bundles b3 dopbeat slams dark trap west coast edmm intense juice 2023 beat catalogue audio'],
    ['Beat Licensing','Basic MP3, Premium WAV, Trackout Pro, Unlimited and Exclusive draft agreements','full.html#producer-beat-vault-v158','STUDIO','#e58a43','beat license licensing legal agreement lease basic premium wav trackout stems unlimited exclusive contract publishing content id'],
    ['Mix Lab','Interactive mix-control visual lab','full.html#producer-mix-lab-v14','STUDIO','#e58a43','mix lab mixing audio engineering'],
    ['Campaign Lab','Record-to-release visual case study and deliverables','full.html#creative-campaign-lab-v14','CREATIVE','#8166ee','campaign lab release system deliverables visuals'],
    ['Concept Registry','Named TAGJ concept records with development and inventory status','full.html#tagj-concept-registry-v142','TAGJ','#d5bd7f','shadow step modular x spine studio mid 808 vault boot vault bloom pressure gold runner concrete bloom wrap concept registry'],
    ['Release Vault','Curated Benny Bundles release and campaign desk','full.html#artist-release-vault-v142','ARTIST','#b85751','release vault cold winter still stuck freestyle reached fire ndr oh lord'],
    ['Studio Signal Matrix','Select production, recording, mixing, mastering and engineering services','full.html#producer-service-matrix-v142','STUDIO','#e58a43','signal matrix studio production recording mixing mastering engineering'],
    ['Creative Scope Builder','Build a starting-cost release scope from individual services','full.html#creative-scope-builder-v142','CREATIVE','#8166ee','scope builder cover visualizer music video seo shorts pricing'],
    ['Product Dossier','Individual TAGJ concept materials, colorways, construction and status','full.html#tagj-product-detail-v143','TAGJ','#d5bd7f','product dossier shadow step modular x spine studio mid vault boot materials colorways construction'],
    ['Release Dossier','Selected Benny Bundles release details, source status and campaign routes','full.html#artist-release-detail-v143','ARTIST','#b85751','release dossier cold winter source status reached fire ndr dont judge'],
    ['A/B Audio Lab','Local before and after audio comparison for mix and mastering review','full.html#producer-ab-lab-v143','STUDIO','#e58a43','ab audio before after mix mastering local files'],
    ['Service Dossier','Cover art, visualizer, video, YouTube and Shorts service details','full.html#creative-service-detail-v143','CREATIVE','#8166ee','service dossier cover art visualizer music video youtube seo shorts'],
    ['Structured Request Brief','Reusable request wizard for TAGJ, artist, studio and creative work','full.html#creative-service-detail-v143','SYSTEM','#d9c48d','request brief cover video feature appearance beat mix master recording custom collaboration'],
    ['Shadow Step V1.1','TAGJ footwear concept dossier','full.html#tagj-product-shadow-v144','TAGJ','#d5bd7f','shadow step v1.1 footwear concept product'],
    ['Modular X-Spine','TAGJ modular footwear concept dossier','full.html#tagj-product-modular-v144','TAGJ','#d5bd7f','modular x spine footwear concept'],
    ['Studio Mid 808','TAGJ music-fashion footwear concept dossier','full.html#tagj-product-studio-v144','TAGJ','#d5bd7f','studio mid 808 footwear sneaker concept'],
    ['Vault Boot','TAGJ footwear concept dossier','full.html#tagj-product-vaultboot-v144','TAGJ','#d5bd7f','vault boot footwear concept'],
    ['Vault Bloom','TAGJ apparel concept dossier','full.html#tagj-product-vaultbloom-v144','TAGJ','#d5bd7f','vault bloom apparel concept'],
    ['Pressure Gold Runner','TAGJ footwear concept dossier','full.html#tagj-product-pressure-v144','TAGJ','#d5bd7f','pressure gold runner footwear concept'],
    ['Concrete Bloom Wrap','TAGJ footwear concept dossier','full.html#tagj-product-concrete-v144','TAGJ','#d5bd7f','concrete bloom wrap footwear concept'],
    ['Cold Winter','Benny Bundles catalogue title and source-status dossier','full.html#artist-release-cold-v144','ARTIST','#b85751','cold winter release song intro source'],
    ['Cover Art Service','Cover-art service dossier and request route','full.html#creative-service-cover-v144','CREATIVE','#8166ee','cover art service request pricing'],
    ['Lyric Visualizer Service','Visualizer service dossier and request route','full.html#creative-service-visualizer-v144','CREATIVE','#8166ee','lyric visualizer service request'],
    ['Music Video Service','Music-video service dossier and request route','full.html#creative-service-video-v144','CREATIVE','#8166ee','music video editing service request'],
    ['YouTube SEO Service','YouTube and SEO service dossier','full.html#creative-service-youtube-v144','CREATIVE','#8166ee','youtube seo channel service'],
    ['Shorts Service','Short-form content service dossier','full.html#creative-service-shorts-v144','CREATIVE','#8166ee','shorts reels vertical content service'],
    ['TAGJ Atelier Board','Technical and campaign inspection surface for selected TAGJ concepts','full.html#tagj-technical-board-v145','TAGJ','#d5bd7f','atelier board technical materials construction branding campaign product inspection'],
    ['Benny Release Scene','Cinematic release campaign desk and readiness planner','full.html#artist-release-scene-v145','ARTIST','#b85751','release scene campaign readiness artwork video streaming metadata'],
    ['Beat Workspace','Local beat preview and metadata workspace without fake catalogue inventory','full.html#producer-beat-workspace-v145','STUDIO','#e58a43','beat workspace bpm key mood license inquiry local audio'],
    ['Session Builder','Production recording mix master engineering session routing','full.html#producer-session-builder-v145','STUDIO','#e58a43','session builder production recording mixing mastering engineering'],
    ['Creative Campaign Workflow','Brief-to-delivery execution map for cover, video, visualizer, YouTube and Shorts','full.html#creative-campaign-workflow-v145','CREATIVE','#8166ee','campaign workflow brief concept build review delivery deliverables'],
    ['TAGJ V14.7 Catalogue','Curated apparel, brand marks and deeper product families','full.html#tagj-catalogue-v147','TAGJ','#d5bd7f','tagj catalogue apparel varsity jacket hoodie puffer tee crewneck logo brand store'],
    ['TAGJ Footwear Archive','Model-led footwear archive with colorwave dossiers','full.html#tagj-footwear-v147','TAGJ','#d5bd7f','tagj footwear archive shoes colorways heartbeat 808 rowhome jewelry box vault non stick'],
    ['TAGJ-018 Audio Engineer Low Tops','Six studio-inspired colorwave directions','full.html#tagj-audio-engineer-v147','TAGJ','#d5bd7f','audio engineer low tops studio monitor sneaker colorwave'],
    ['TAGJ-017 Concrete Bloom Mid Tops','Concrete Bloom mid-top model and colorwave dossier','full.html#tagj-concrete-bloom-mids-v147','TAGJ','#d5bd7f','concrete bloom mid tops black grey cream led blue burgundy'],
    ['TAGJ-017 Concrete Bloom Pump','Concrete Bloom Pump exoskeleton and hollow-sole colorwaves','full.html#tagj-concrete-bloom-pump-v147','TAGJ','#d5bd7f','concrete bloom pump cage hollow sole colorwaves'],
    ['Bank Vault Heel High Tops','Vault-wheel heel high-top concept family','full.html#tagj-vault-heel-v147','TAGJ','#d5bd7f','bank back vault heel high tops wheel colorwaves'],
    ['TAGJ-013 Non-Stick Slip-On','Diamond Dust Knit slip-on colorwave system','full.html#tagj-nonstick-v147','TAGJ','#d5bd7f','non stick slip on diamond dust knit blackout concrete frost studio receipt oxblood marble'],
    ['Benny Network Profiles','BillYen, T311Y Demon Life and BSF Tone 066 visual network routes','full.html#artist-network-v147','ARTIST','#b85751','billyen t311y demon life bsf tone 066 network affiliate collaborator'],
    ['Cry In The Dark','Benny Bundles release visual archive asset','full.html#artist-cry-dark-v147','ARTIST','#b85751','cry in the dark cover art release archive'],
    ['Creative Proof Library','Bloxx and Robbers, Cry In The Dark and Shhh thumbnail examples','full.html#creative-proof-v147','CREATIVE','#8166ee','bloxx robbers bsf tone cover art shhh thumbnail youtube shorts cry dark portfolio proof']
  ];

  function activate(world){
    if(!worlds[world]) return;
    body.dataset.activeWorld = world;
    document.documentElement.style.setProperty('--active-accent',worlds[world].accent);
    centerTitle.textContent = worlds[world].title;
    centerCopy.textContent = worlds[world].copy;
    routes.forEach(r => r.classList.toggle('active',r.dataset.world === world));
  }
  function reset(){
    delete body.dataset.activeWorld;
    document.documentElement.style.setProperty('--active-accent','#d9c48d');
    centerTitle.textContent = 'Choose a direction';
    centerCopy.textContent = 'Four focused destinations. Each opens into its own visual world.';
    routes.forEach(r => r.classList.remove('active'));
  }
  routes.forEach(route => {
    route.addEventListener('mouseenter',()=>activate(route.dataset.world));
    route.addEventListener('touchstart',()=>activate(route.dataset.world),{passive:true});
    route.addEventListener('focus',()=>activate(route.dataset.world));
    route.addEventListener('mouseleave',reset);
    route.addEventListener('blur',reset);
  });

  if(!reduce){
    addEventListener('pointermove', e => {
      document.documentElement.style.setProperty('--hx',(e.clientX/innerWidth).toFixed(4));
      document.documentElement.style.setProperty('--hy',(e.clientY/innerHeight).toFixed(4));
    },{passive:true});
  }

  function collapseSearchLater(){
    clearTimeout(collapseTimer);
    collapseTimer = setTimeout(()=>trigger?.classList.add('collapsed'),3500);
  }
  trigger?.addEventListener('mouseenter',()=>trigger.classList.remove('collapsed'));
  trigger?.addEventListener('mouseleave',collapseSearchLater);

  function renderSearch(q=''){
    const term=q.trim().toLowerCase();
    const rows=(term ? searchIndex.filter(x => (x[0]+' '+x[1]+' '+x[5]).toLowerCase().includes(term)) : searchIndex.slice(0,8));
    results.innerHTML = rows.length ? rows.map((x,i)=>`<a class="search-result" href="${x[2]}" style="--r-accent:${x[4]}"><span class="result-no">${String(i+1).padStart(2,'0')}</span><span><b>${x[0]}</b><small>${x[1]}</small></span><span class="result-world">${x[3]}</span></a>`).join('') : '<div class="search-empty">No direct match. Try a broader term such as “music”, “custom”, “video”, “beats” or “clothing”.</div>';
  }
  function openSearch(){
    layer.classList.add('open');layer.setAttribute('aria-hidden','false');trigger.setAttribute('aria-expanded','true');trigger.classList.remove('collapsed');renderSearch(input.value);setTimeout(()=>input.focus(),80);
  }
  function closeSearch(){
    layer.classList.remove('open');layer.setAttribute('aria-hidden','true');trigger.setAttribute('aria-expanded','false');input.blur();collapseSearchLater();
  }
  trigger?.addEventListener('click',openSearch);
  document.getElementById('searchClose')?.addEventListener('click',closeSearch);
  layer?.addEventListener('click',e=>{if(e.target===layer) closeSearch()});
  input?.addEventListener('input',()=>renderSearch(input.value));
  addEventListener('keydown',e=>{
    if(e.key==='/' && !layer.classList.contains('open')){e.preventDefault();openSearch()}
    if(e.key==='Escape' && layer.classList.contains('open')) closeSearch();
  });
  renderSearch();

  // Directional exit animation before navigating.
  const transition=document.getElementById('routeTransition');
  const transitionLabel=document.getElementById('transitionLabel');
  const exitAngles={north:'-90deg',east:'0deg',south:'90deg',west:'180deg'};
  const nativeFastNav=reduce||matchMedia('(pointer:coarse)').matches||/iP(?:hone|ad|od)/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  document.documentElement.classList.toggle('tagj-native-nav',nativeFastNav);
  routes.forEach(route=>route.addEventListener('click',e=>{
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||route.target==='_blank'||nativeFastNav) return;
    const w=worlds[route.dataset.world], href=route.getAttribute('href');
    // Desktop-only transition. Touch/iOS always follows the native anchor immediately.
    if(!w||!href||!transition||!transitionLabel) return;
    e.preventDefault();
    let navigated=false;
    const go=()=>{if(navigated)return;navigated=true;location.assign(href)};
    try{
      transition.style.setProperty('--exit-accent',w.accent);
      transition.style.setProperty('--exit-angle',exitAngles[route.dataset.direction]);
      transitionLabel.textContent='OPENING '+w.title.toUpperCase();
      transition.classList.add('go');
      setTimeout(go,120);
      setTimeout(go,420);
    }catch(_){go()}
  }));

  // Intro gate + Safari/iPhone-safe one-time entry behavior.
  const gate=document.getElementById('introGate');
  const video=document.getElementById('introVideo');
  const progress=document.getElementById('introProgress');
  const soundBtn=document.getElementById('enterSound');
  const muteBtn=document.getElementById('enterMuted');
  const introStatus=document.getElementById('introStatus');
  const INTRO_SESSION_KEY='tagjIntroSeenV153';
  const introSources=video?[...video.querySelectorAll('source')]:[];
  introSources.forEach(source=>{ if(!source.dataset.src) source.dataset.src=source.getAttribute('src')||''; });
  let introDone=false,introFinishing=false,fallbackTimer=0;
  function restoreIntroMedia(){
    if(!video)return;
    let changed=false;
    introSources.forEach(source=>{
      if(!source.getAttribute('src')&&source.dataset.src){source.setAttribute('src',source.dataset.src);changed=true}
    });
    if(changed||video.readyState===0){try{video.load()}catch(_){}}
  }
  function releaseIntroMedia(){
    if(!video)return;
    try{
      video.pause();
      introSources.forEach(source=>source.removeAttribute('src'));
      video.removeAttribute('src');
      video.load();
    }catch(_){}
  }
  function hasSeenIntro(){
    if(window.__TAGJ_INTRO_SEEN)return true;
    try{return sessionStorage.getItem(INTRO_SESSION_KEY)==='1'}catch(_){return false}
  }
  function markIntroSeen(hideGate=true){
    window.__TAGJ_INTRO_SEEN=true;
    try{sessionStorage.setItem(INTRO_SESSION_KEY,'1')}catch(_){}
    try{localStorage.setItem('tagjIntroSeenV155At',String(Date.now()))}catch(_){}
    if(hideGate)document.documentElement.classList.add('intro-resume-v151');
  }
  function clearIntroSeen(){
    window.__TAGJ_INTRO_SEEN=false;
    try{sessionStorage.removeItem(INTRO_SESSION_KEY)}catch(_){}
    try{localStorage.removeItem('tagjIntroSeenV155At')}catch(_){}
    document.documentElement.classList.remove('intro-resume-v151');
  }
  function completeIntroState(){
    markIntroSeen(true);
    introDone=true;introFinishing=false;
    gate?.classList.remove('settling','v13-running','v13-fire','playing');gate?.classList.add('done');
    if(gate){gate.hidden=true;gate.setAttribute('aria-hidden','true')}
    body.classList.remove('intro-pending','intro-settling');body.classList.add('intro-complete');
    releaseIntroMedia();
    clearTimeout(fallbackTimer);
    collapseSearchLater();
  }
  function finishIntro(){
    if(introDone||introFinishing)return;introFinishing=true;
    body.classList.remove('intro-pending');body.classList.add('intro-settling');
    gate?.classList.add('playing','settling','v13-fire');
    const core=document.getElementById('centerCore');
    const r=core?.getBoundingClientRect();
    if(reduce||!r||!gate?.animate){completeIntroState();return}
    const vw=Math.max(1,innerWidth),vh=Math.max(1,innerHeight);
    const sx=Math.max(.08,r.width/vw),sy=Math.max(.08,r.height/vh);
    const tx=r.left,ty=r.top;
    const anim=gate.animate([
      {transform:'translate3d(0,0,0) scale(1,1)',borderRadius:'0px',opacity:1,offset:0},
      {transform:'translate3d(0,0,0) scale(.985,.985)',borderRadius:'18px',opacity:1,offset:.14},
      {transform:`translate3d(${tx}px,${ty}px,0) scale(${sx},${sy})`,borderRadius:'34%',opacity:1,offset:.88},
      {transform:`translate3d(${tx}px,${ty}px,0) scale(${sx*.94},${sy*.94})`,borderRadius:'40%',opacity:0,offset:1}
    ],{duration:1650,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
    anim.onfinish=completeIntroState;anim.oncancel=completeIntroState;
    setTimeout(()=>{if(!introDone)completeIntroState()},2050);
  }
  async function playIntro(muted){
    if(introDone||introFinishing||!video)return;
    if(gate){gate.hidden=false;gate.removeAttribute('aria-hidden')}
    document.documentElement.classList.remove('intro-resume-v151');
    markIntroSeen(false);
    clearTimeout(fallbackTimer);
    gate?.classList.remove('v13-fire');
    gate?.classList.add('playing','v13-running');
    if(introStatus)introStatus.textContent='';
    try{video.pause()}catch(_){}
    restoreIntroMedia();
    try{video.currentTime=0}catch(_){}
    if(video.readyState===0){try{video.load()}catch(_){}}
    video.setAttribute('playsinline','');
    video.setAttribute('webkit-playsinline','');
    video.muted=!!muted;
    video.defaultMuted=!!muted;
    video.volume=1;
    try{
      // Keep play() directly in the explicit tap path. The exact Drive intro clip contains H.264 video + stereo AAC audio.
      const p=video.play();
      if(p&&typeof p.then==='function')await p;
    }catch(err){
      gate?.classList.remove('playing','v13-running');
      if(muted){
        if(introStatus)introStatus.textContent='Video playback was blocked. Continuing with the cinematic transition.';
        fallbackTimer=setTimeout(finishIntro,900);
      }else{
        if(introStatus)introStatus.textContent='Sound was blocked by iPhone/Safari. Tap “Enter with sound” again, or choose muted.';
        if(soundBtn){soundBtn.innerHTML='<span>▶</span> Tap again for sound';soundBtn.classList.add('needs-retry')}
      }
    }
  }
  soundBtn?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();playIntro(false)});
  muteBtn?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();playIntro(true)});
  document.getElementById('skipIntro')?.addEventListener('click',e=>{e.preventDefault();finishIntro()});
  video?.addEventListener('timeupdate',()=>{
    const span=Math.max(.25,Number(video.duration)||7.55);
    const pct=Math.min(100,(video.currentTime/span)*100);
    if(progress)progress.style.width=pct.toFixed(2)+'%';
    gate?.classList.toggle('v13-fire',pct>=72);
  });
  video?.addEventListener('loadedmetadata',()=>{
    if(introStatus&&!gate?.classList.contains('playing'))introStatus.textContent='';
  });
  video?.addEventListener('stalled',()=>{
    if(introStatus&&gate?.classList.contains('playing'))introStatus.textContent='Loading the Cold Winter intro clip…';
  });
  video?.addEventListener('ended',finishIntro);
  video?.addEventListener('error',()=>{
    if(gate?.classList.contains('playing')){
      if(introStatus)introStatus.textContent='Intro media could not load. Continuing into the site.';
      fallbackTimer=setTimeout(finishIntro,900);
    }
  });
  routes.forEach(route=>{
    route.addEventListener('pointerdown',()=>markIntroSeen(true),{capture:true,passive:true});
    route.addEventListener('click',()=>markIntroSeen(true),{capture:true});
  });
  document.addEventListener('pointerdown',e=>{
    const a=e.target.closest?.('a[href^="full.html"]');
    if(a)markIntroSeen(true);
  },{capture:true,passive:true});

  // Returning from a world is a resume, not a new visit. Deep links never replay the splash.
  document.documentElement.classList.remove('intro-already-seen');
  const params=new URLSearchParams(location.search);
  const forceReplay=params.get('intro')==='1';
  const resume=params.get('resume')==='1';
  const deepRoute=!!location.hash&&location.hash!=='#home'&&location.hash!=='#replay-intro';
  let fromWorld=false;
  try{
    const ref=document.referrer?new URL(document.referrer):null;
    fromWorld=!!ref&&ref.origin===location.origin&&/(?:full|tagj|artist|producer|creative)\.html$/i.test(ref.pathname);
  }catch(_){}
  if(forceReplay){
    clearIntroSeen();
    introDone=false;introFinishing=false;
    if(gate){gate.hidden=false;gate.removeAttribute('aria-hidden');gate.classList.remove('done')}
    body.classList.add('intro-pending');body.classList.remove('intro-complete','intro-settling');
  }
  if(!forceReplay&&(resume||deepRoute||fromWorld||hasSeenIntro()))completeIntroState();
  addEventListener('pageshow',()=>{
    const deep=!!location.hash&&location.hash!=='#home'&&location.hash!=='#replay-intro';
    if(deep||hasSeenIntro())completeIntroState();
  });
})();
