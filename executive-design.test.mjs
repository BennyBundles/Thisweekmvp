import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(file)=>readFileSync(new URL(file,import.meta.url),'utf8');
const pages=[
  './index.html','./account/index.html','./support/index.html',
  './ops/index.html','./ops/release/index.html','./ops/bootstrap/index.html',
  './money-lab/index.html','./preview.html','./legal/sandbox/index.html'
];

test('all nine application and support pages share executive styling',()=>{
  for(const path of pages){
    const html=read(path);
    assert.match(html,/GOOD JAWN FINANCIAL — /,path);
    assert.match(html,/<\/style>/,path);
    assert.doesNotMatch(html,/https:\/\/(?:fonts\.googleapis|fonts\.gstatic)\.com/,path);
  }
});
test('primary navigation is intact, advanced utilities are optional',()=>{
  const html=read('./index.html');
  for(const route of ['home','log','details','setup']){
    assert.ok(html.includes('href="#'+route+'"'),route);
  }
  assert.match(html,/data-route="details" href="#details"[^>]*>[\s\S]*?<span>Explore<\/span>/);
  assert.match(html,/class="tw-advanced-zone"/);
  assert.match(html,/<details><summary>Advanced tools and integrations<\/summary>/);
  assert.match(html,/body\[data-route="details"\] \.tw-advanced-zone\{display:block\}/);
  assert.match(html,/\.tw-advanced-zone\{display:none/);
  for(const link of ['#privacy','#qa','./money-lab/'])assert.ok(html.includes('href="'+link+'"'),link);
});
test('motion, visible focus, touch affordances, and fixed financial runtime persist',()=>{
  const html=read('./index.html');
  assert.match(html,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(html,/body\[data-motion="reduced"\]/);
  assert.match(html,/:focus-visible/);
  assert.match(html,/min-height:42px/);
  assert.match(html,/font-variant-numeric:tabular-nums/);
  for(const marker of ['function applyUiPrefs','function renderHome','async function renderDetails','function renderMoneyCenter','function renderPrecheck']){
    assert.ok(html.includes(marker),marker);
  }
});
test('regulated features keep their sandbox and staff labels',()=>{
  assert.match(read('./money-lab/index.html'),/No live money/);
  assert.match(read('./legal/sandbox/index.html'),/SANDBOX TEST ONLY\./);
  assert.match(read('./ops/release/index.html'),/Staff-only/);
});

test('task-first Explore screen has four direct actions and optional developer tools',()=>{
  const html=read('./index.html');
  for(const task of ['Add spending','Check a purchase','Review bills','Savings goals'])
    assert.ok(html.includes('<strong>'+task+'</strong>'),task);
  assert.match(html,/id:'settings',eyebrow:'Settings & support'/);
  const start=html.indexOf("id:'settings',eyebrow:");
  const end=html.indexOf("].join('')",start);
  const ordinarySettings=html.slice(start,end);
  for(const advancedRoute of ['future','qa','performance','data-model','analytics'])
    assert.ok(!ordinarySettings.includes("tool('"+advancedRoute+"'"),advancedRoute);
  assert.match(html,/class="tw-advanced-zone"/);
  assert.match(html,/href="#qa"/);
  assert.match(html,/href="#performance"/);
  assert.match(html,/href="#data-model"/);
});
test('contextual route navigation links only to established hash routes and respects compact home',()=>{
  const html=read('./index.html');
  const exact=[
    'id="twRouteShortcuts" aria-label="Related tools" hidden',
    'function renderContextNavigation(routeName)',
    'renderContextNavigation(r)',
    'bar.hidden=!items',
    'bar.replaceChildren()',
    'aria-current="page"',
    '.tw-route-shortcuts[hidden]{display:none}',
    'scroll-snap-type:x proximity',
    'Weekly planning figures, not a bank account balance'
  ];
  for(const marker of exact)assert.ok(html.includes(marker),marker);
});
test('non-active money services are labeled as future and sandbox only',()=>{
  const html=read('./index.html');
  assert.match(html,/Money infrastructure · Sandbox/);
  assert.match(html,/No live financial execution is enabled/);
  assert.match(html,/no live switching is enabled/);
  assert.match(html,/card issuing is not active/);
});

test('four original cinematic worlds are embedded for offline navigation',()=>{
  const html=read('./index.html');
  for(const id of ['vault','observatory','capital','ledger']){
    assert.ok(html.includes('class="tw-scene tw-scene--'+id+'"'),id+' scene markup');
    assert.ok(html.includes('data-art-world="'+id+'"'),id+' selectable world card');
  }
  assert.match(html,/CINEMATIC BRAND WORLD PASS 3/);
  assert.match(html,/aria-label="Good Jawn Financial experience"/);
  assert.match(html,/Good Jawn,<br>Good Money\./);
  assert.match(html,/TAGJ \/ GOOD JAWN FINANCIAL/);
  assert.ok(html.includes('class="tw-stage-visuals" aria-hidden="true"'));
  assert.match(html,/role="presentation" focusable="false"/);
  const svgOpens=(html.match(/<svg\b/g)||[]).length;
  const svgCloses=(html.match(/<\/svg>/g)||[]).length;
  assert.equal(svgOpens,svgCloses,'all inline vector art stays syntactically balanced');
});

test('four experience portals navigate to live established routes',()=>{
  const html=read('./index.html');
  for(const route of ['bills','insights','capital','savings']){
    assert.ok(html.includes('class="tw-world-card"')&&html.includes('href="#'+route+'"'),route+' destination');
    assert.ok(html.includes("if(r==='"+route+"')") || html.includes("else if(r==='"+route+"')"),route+' route handler');
  }
  assert.match(html,/The worlds are views and tools, not separate bank accounts/);
  assert.match(html,/class="tw-world-gallery"/);
});

test('the stage preserves reduced-motion settings and adds no new public network dependency',()=>{
  const html=read('./index.html');
  assert.match(html,/@media\(prefers-reduced-motion:reduce\)\{\.tw-scene\{transition:none!important/);
  assert.match(html,/body\[data-motion="reduced"\] \.tw-scene/);
  assert.match(html,/\.tw-stage-visuals/);
  assert.match(html,/\.tw-cinematic-stage/);
  assert.match(html,/body\[data-view="savings"\] \.tw-scene--ledger/);
  assert.match(html,/body\[data-view="insights"\] \.tw-scene--observatory/);
  assert.match(html,/body\[data-view="bills"\] \.tw-scene--vault/);
  assert.match(html,/body\[data-view="home"\] \.tw-scene--capital/);
});

test('ready Home grid has four explicit tracks for the trust disclosure',()=>{
  const html=read('./index.html');
  assert.match(html,/class="zen-home tw-home-ready"/);
  assert.match(html,/\.zen-home\.tw-home-ready\{\s*grid-template-rows:auto auto minmax\(420px,1fr\) auto;/);
  assert.match(html,/\.tw-home-ready \.tw-source-trust/);
  assert.match(html,/\.tw-home-ready \.zen-scene\{margin:0;min-height:420px\}/);
});
test('offline readiness supports secure loopback preview and uses compact brand styling',()=>{
  const html=read('./index.html');
  const builder=read('./prepare-public-preview.mjs');
  assert.ok(builder.includes("offlinePanel.className='tw-offline-panel'"));
  assert.ok(builder.includes("offlineRetry.className='tw-offline-retry'"));
  assert.ok(builder.includes("!globalThis.isSecureContext"));
  assert.ok(!builder.includes("location.protocol!=='https:'"));
  assert.ok(builder.includes("Offline installed but not controlling this tab"));
  assert.match(html,/\.tw-offline-panel\{/);
  assert.match(html,/\.tw-offline-retry\{/);
});


test('new simple financial flow keeps canonical money save path and progressive disclosure',()=>{
  const html=read('./index.html');
  for(const marker of [
    'function initCinematicSetupWizard(existing)',
    'initCinematicSetupWizard(current)',
    'twWizardIncome','twWizardRent','twWizardPhone','twWizardSavings',
    "by('savePlan').click()",
    "full.className='tw-onboard-advanced'",
    'class="tw-onboard-step"',
    'tw-onboard-step[hidden],.tw-onboard-error[hidden]'
  ])assert.ok(html.includes(marker),marker);
  assert.match(html,/class="tw-entry"/);
  assert.match(html,/Build My Week/);
});
test('plan-grounded Good Jawn Guide exposes only local, non-execution answers',()=>{
  const html=read('./index.html');
  assert.match(html,/async function renderAssist\(\)/);
  assert.match(html,/else if\(r==='assist'\)await renderAssist\(\)/);
  assert.match(html,/data-route="assist" href="#assist"/);
  for(const q of ['How did I do?','Where can I save?','What is next?'])assert.ok(html.includes(q),q);
  assert.ok(html.includes('No transfers are executed.'));
  assert.ok(html.includes("output.textContent=answer("));
});
test('Capital page reuses real plan categories and local transactions',()=>{
  const html=read('./index.html');
  assert.match(html,/async function renderCapital\(\)/);
  assert.match(html,/else if\(r==='capital'\)await renderCapital\(\)/);
  assert.ok(html.includes("readState()?.transactions||[]"));
  assert.ok(html.includes("p.week?.id"));
  assert.ok(html.includes("map(x=>({...x,type:'LIVING'}))"));
  assert.ok(html.includes('data-art-world="capital" href="#capital"'));
  assert.ok(html.includes('Plan amount, not a verified bank balance'));
});
test('selected original screen-art is embedded and offline safe',()=>{
  const html=read('./index.html');
  assert.match(html,/REAL CINEMATIC WORLD ATLAS V1/);
  assert.match(html,/--tw-world-atlas:url\("data:image\/webp;base64,/);
  assert.ok(html.includes('.tw-scene--vault::before'));
  assert.ok(html.includes('.tw-scene--capital::before'));
  assert.ok(html.includes('.tw-scene--ledger::before'));
  assert.ok(html.includes('.tw-scene--observatory::before'));
  assert.ok(html.includes('prefers-reduced-motion:reduce'));
});

test('five primary destinations share one mobile navigation row',()=>{
  const html=read('./index.html');
  const qa=read('./capture-cinematic-preview.mjs');
  const builder=read('./prepare-public-preview.mjs');
  assert.ok(html.includes('grid-template-columns:repeat(5,minmax(0,1fr))!important'));
  for(const route of ['home','log','details','setup','assist'])assert.ok(html.includes('data-route="'+(route==='setup'?'plan':route)+'"'),route);
  assert.ok(qa.includes("navigation.count!==5||navigation.rows!==1"));
  assert.ok(builder.includes('Offline ready · Verified cache'));
  assert.ok(html.includes('.tw-offline-panel[data-state="ready"] .tw-offline-retry{display:none}'));
});


test('cinematic stage now changes its message and action with the selected financial route',()=>{
  const html=read('./index.html');
  assert.ok(html.includes('function renderCinematicStage(routeName)'));
  assert.ok(html.includes('renderCinematicStage(r)'));
  assert.ok(html.includes('id="twStageFeature"'));
  assert.ok(html.includes('id="twStageStrap"'));
  assert.ok(html.includes('id="twStageEnter"'));
  assert.ok(html.includes('id="twStageEnterLabel"'));
  for(const title of ['Your week, in control.','Choose your next move.','Protect what matters.','Build your future.','Questions into clarity.'])
    assert.ok(html.includes(title),title);
  assert.ok(html.includes("routeName==='home'&&!getStoredUserId()"));
  assert.ok(html.includes("'Build My Week','setup'"));
  assert.ok(html.includes('button.hidden=!destination'));
  assert.ok(html.includes("button.href='#'+destination"));
});

test('financial form screens preserve a shorter stage and system reduced motion',()=>{
  const html=read('./index.html');
  assert.ok(html.includes('body[data-density="balanced"][data-view="setup"] .tw-cinematic-stage'));
  assert.ok(html.includes('body[data-density="balanced"][data-view="precheck"] .tw-cinematic-stage'));
  assert.ok(html.includes('body[data-density="rich"][data-view="log"] .tw-cinematic-stage'));
  assert.ok(html.includes('body[data-motion="reduced"] .tw-stage-arriving .tw-stage-feature'));
  assert.ok(html.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(html.includes('body[data-performance="lite"] .tw-stage-arriving .tw-stage-feature'));
});

test('the three-step setup displays and validates the actual starter spending limits',()=>{
  const html=read('./index.html');
  for(const marker of ['twWizardLanes','twWizardGroceries','twWizardGas','twWizardEating','twWizardFun','twWizardLaneTotal','laneTotal()'])
    assert.ok(html.includes(marker),marker);
  assert.ok(html.includes('if(laneFields.includes(id))by('));
  assert.ok(html.includes("full.addEventListener('toggle'"));
});
