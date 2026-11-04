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
  assert.match(html,/id="twRouteShortcuts" aria-label="Related tools" hidden/);
  assert.match(html,/function renderContextNavigation\(routeName\)/);
  assert.match(html,/renderContextNavigation(r)/);
  assert.match(html,/bar.hidden=!items/);
  assert.match(html,/bar.replaceChildren()/);
  assert.match(html,/aria-current="page"/);
  assert.match(html,/.tw-route-shortcuts[hidden]{display:none}/);
  assert.match(html,/scroll-snap-type:x proximity/);
  assert.match(html,/Weekly planning figures, not a bank account balance/);
});
test('non-active money services are labeled as future and sandbox only',()=>{
  const html=read('./index.html');
  assert.match(html,/Money infrastructure · Sandbox/);
  assert.match(html,/No live financial execution is enabled/);
  assert.match(html,/no live switching is enabled/);
  assert.match(html,/card issuing is not active/);
});
