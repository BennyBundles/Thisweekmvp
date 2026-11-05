// Read-only visual QA of the actual staged This Week public-preview application.
// Screenshots contain synthetic data only; no banking integration or deployment.
import http from 'node:http';
import {spawn} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const root=path.resolve('_site'),out=path.resolve('browser-preview');
const targets=[
  {route:'home',world:'capital',name:'01-home'},
  {route:'details',world:'capital',name:'02-explore'},
  {route:'log',world:'capital',name:'03-add-spending'},
  {route:'setup',world:'ledger',name:'04-plan'},
  {route:'bills',world:'vault',name:'05-vault-bills'},
  {route:'insights',world:'observatory',name:'06-observatory-insights'},
  {route:'savings',world:'ledger',name:'07-ledger-savings'},
  {route:'precheck',world:'capital',name:'08-precheck'},
  {route:'capital',world:'capital',name:'09-capital'},
  {route:'assist',world:'observatory',name:'10-assist'}
];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.css':'text/css','.png':'image/png'};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
if(!existsSync(path.join(root,'public-preview','index.html')))throw new Error('First run: VERCEL_ENV=preview node stage-preview.mjs');
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
let denyOriginRequests=false;
const server=http.createServer(async(req,res)=>{
  try{
    if(denyOriginRequests){res.writeHead(503,{'Content-Type':'text/plain'});res.end('Offline QA denies origin network');return;}
    const url=new URL(req.url,'http://127.0.0.1');
    let filename=path.resolve(root,'.'+decodeURIComponent(url.pathname));
    if(!filename.startsWith(root+path.sep)&&filename!==root){res.writeHead(403);res.end();return;}
    if(url.pathname.endsWith('/'))filename=path.join(filename,'index.html');
    const data=await readFile(filename);
    res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(data);
  }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const base='http://127.0.0.1:'+server.address().port;
let chrome=null,ws=null,profile=null;
try{
  const executable=process.env.CHROME_BIN||['google-chrome','google-chrome-stable','chromium','chromium-browser'].find(findExecutable);
  if(!executable)throw new Error('Chromium/Chrome not installed: real-browser QA unavailable');
  profile=await mkdtemp(path.join(tmpdir(),'tw-actual-browser-'));
  chrome=spawn(executable,[
    '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
    '--no-first-run','--no-default-browser-check','--hide-scrollbars',
    '--remote-debugging-port=0','--remote-allow-origins=*',
    '--user-data-dir='+profile,'about:blank'
  ],{stdio:'ignore'});
  let port=0;
  for(let i=0;i<120;i++){
    const active=path.join(profile,'DevToolsActivePort');
    if(existsSync(active)){port=Number(readFileSync(active,'utf8').split('\n')[0]);break;}
    if(chrome.exitCode!==null)throw new Error('Chrome exited during startup');
    await sleep(100);
  }
  if(!port)throw new Error('Chrome DevTools never opened');
  const tabs=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
  const tab=tabs.find(x=>x.type==='page');
  if(!tab?.webSocketDebuggerUrl)throw new Error('Cannot locate Chrome page target');
  ws=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    ws.addEventListener('open',resolve,{once:true});
    ws.addEventListener('error',reject,{once:true});
  });
  const pending=new Map();let seq=0;
  ws.addEventListener('message',event=>{
    const frame=JSON.parse(event.data);
    if(!frame.id)return;
    const waiter=pending.get(frame.id);if(!waiter)return;
    pending.delete(frame.id);clearTimeout(waiter.timer);
    frame.error?waiter.reject(new Error(frame.error.message)):waiter.resolve(frame.result);
  });
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++seq;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},15000);
    pending.set(id,{resolve,reject,timer});
    ws.send(JSON.stringify({id,method,params}));
  });
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  const mobile={width:390,height:844,deviceScaleFactor:2,mobile:true};
  await cdp('Emulation.setDeviceMetricsOverride',mobile);
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await cdp('Page.navigate',{url:base+'/public-preview/?mode=demo#home'});
  const evaluate=async expression=>{
    const result=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(result.exceptionDetails)throw new Error('Browser evaluation error: '+(result.exceptionDetails.text||'exception'));
    return result.result?.value;
  };
  const waitRoute=async route=>{
    for(let attempt=0;attempt<90;attempt++){
      const ready=await evaluate("({route:document.body?.dataset?.view,loading:document.querySelector('#app')?.getAttribute('aria-busy'),hasApp:!!document.querySelector('#app'),world:!!document.querySelector('.tw-cinematic-stage')})");
      if(ready&&ready.route===route&&ready.loading!=='true'&&ready.hasApp&&ready.world)return;
      await sleep(150);
    }
    throw new Error('Timed out rendering '+route);
  };
  const inspect=()=>evaluate("(()=>({title:document.title,route:document.body?.dataset?.view,width:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,appText:document.querySelector('#app')?.innerText?.slice(0,180)||'',stage:!!document.querySelector('.tw-cinematic-stage'),worlds:[...document.querySelectorAll('.tw-scene')].filter(el=>Number(getComputedStyle(el).opacity)>.8).map(el=>el.className),visibleGallery:[...document.querySelectorAll('.tw-world-gallery a')].filter(el=>getComputedStyle(el).display!=='none').length,advancedCollapsed:!document.querySelector('.tw-advanced-zone details')?.open,homeTrustGap:(()=>{const trust=document.querySelector('.tw-home-ready .tw-source-trust');const scene=document.querySelector('.tw-home-ready .zen-scene');return trust&&scene?Math.round(scene.getBoundingClientRect().top-trust.getBoundingClientRect().bottom):null})(),offlineMessage:document.querySelector('#thisweek-offline-readiness')?.innerText?.slice(0,140)||'',trustedContext:globalThis.isSecureContext,serviceWorkerSupported:'serviceWorker' in navigator}))()");
  const report={origin:'review branch, staged isolated public preview',demo:true,mobile,pages:[],errors:[]};
  for(const target of targets){
    if(target.route!=='home')await evaluate('location.hash='+JSON.stringify('#'+target.route));
    await waitRoute(target.route);
    await sleep(850);
    const state=await inspect();
    if(!state.stage||!state.worlds.some(x=>x.includes('tw-scene--'+target.world)))report.errors.push(target.route+': incorrect visual scene');
    if(state.scrollWidth>state.width+4)report.errors.push(target.route+': document horizontal overflow '+state.scrollWidth+' > '+state.width);
    const navigation=await evaluate("(()=>{const links=[...document.querySelectorAll('.bottom-nav .nav-link')];return {count:links.length,rows:[...new Set(links.map(x=>Math.round(x.getBoundingClientRect().top)))].length}})()");
    if(navigation.count!==5||navigation.rows!==1)report.errors.push(target.route+': bottom navigation wraps into '+navigation.rows+' rows, tabs='+navigation.count);

    if(target.route==='home'&&(state.homeTrustGap===null||state.homeTrustGap>24||state.homeTrustGap<0))report.errors.push('Home: excessive vertical gap between disclosure and overview: '+state.homeTrustGap+'px');
    if(target.route==='home'&&state.trustedContext&&state.serviceWorkerSupported&&state.offlineMessage.includes('browser does not support this setup'))report.errors.push('Home: localhost incorrectly rejected as insecure for offline testing');
    if(/Unable to open|Build a plan first|Unexpected local rendering error/i.test(state.appText))report.errors.push(target.route+': error/empty Plan fallback');
    if(target.route==='details'&&state.visibleGallery!==4)report.errors.push('Explore: four world portal links not visible');
    if(target.route==='setup'){
      const wizard=await evaluate("({visible:!!document.querySelector('.tw-onboard'),advancedClosed:!document.querySelector('.tw-onboard-advanced')?.open,step:Number(document.querySelector('.tw-onboard-step:not([hidden])')?.dataset?.twStep||0),savePresent:!!document.querySelector('#savePlan')})");
      if(!wizard.visible||!wizard.advancedClosed||wizard.step!==0||!wizard.savePresent)report.errors.push('Plan: three-step wizard failed progressive-disclosure check');
      const nextState=await evaluate("(()=>{document.getElementById('twWizardNext')?.click();return Number(document.querySelector('.tw-onboard-step:not([hidden])')?.dataset?.twStep||0)})()");
      if(nextState!==1)report.errors.push('Plan: wizard did not advance to bills step');
    }
    if(target.route==='capital'){
      const value=await evaluate("({categories:document.querySelectorAll('.tw-capital-row').length,add:!!document.querySelector('.tw-capital-actions a[href=\"#log\"]'),balance:!!document.querySelector('.tw-capital-balance strong')})");
      if(!value.categories||!value.add||!value.balance)report.errors.push('Capital: real budget, categories or Add Spend action missing');
    }
    if(target.route==='assist'){
      const result=await evaluate("(()=>{const button=document.querySelector('[data-guide]');button?.click();return {hasGuide:!!document.querySelector('.tw-guide'),response:document.querySelector('#twGuideAnswer')?.textContent||'',input:!!document.querySelector('#twGuideInput')}})()");
      if(!result.hasGuide||!result.input||result.response.length<30||result.response.includes('Choose a question'))report.errors.push('Assist: suggested question does not produce plan guidance');
    }
    const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
    await writeFile(path.join(out,target.name+'.png'),Buffer.from(shot.data,'base64'));
    report.pages.push({...target,...state,screenshot:target.name+'.png'});
    console.log('[visual-qa]',target.route,state.scrollWidth+'/'+state.width,state.worlds.join(','));
  }
  await cdp('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:false});
  await evaluate('location.hash="#home"');
  await waitRoute('home');await sleep(850);
  const desktop=await inspect();
  const desktopShot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
  await writeFile(path.join(out,'11-desktop-home.png'),Buffer.from(desktopShot.data,'base64'));
  report.desktop=desktop;
  if(desktop.scrollWidth>desktop.width+4)report.errors.push('Desktop: horizontal overflow');
  // Re-enter the real installable app while the origin is unreachable.
  // This proves the currently controlling worker can recover verified cached
  // shell bytes rather than trusting a stale 503/CDN response.
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  const beforeOffline=await inspect();
  if(!beforeOffline.offlineMessage.includes('Offline ready')){
    report.errors.push('Offline: ready state was not confirmed before network isolation');
  }else{
    await cdp('Network.enable');
    denyOriginRequests=true;
    await cdp('Network.emulateNetworkConditions',{
      offline:true,latency:0,downloadThroughput:0,uploadThroughput:0
    });
    try{
      const navigation=await cdp('Page.navigate',{url:base+'/public-preview/?mode=demo#home'});
      if(navigation.errorText)report.errors.push('Offline: navigation failed '+navigation.errorText);
      await waitRoute('home');
      await sleep(400);
      const recovered=await inspect();
      report.offlineReload={...recovered,originRequestsDenied:true};
      if(!recovered.appText.includes('Weekly planning figures'))
        report.errors.push('Offline: cached app did not recover weekly planning content');
      if(recovered.scrollWidth>recovered.width+4)
        report.errors.push('Offline: recovered page has horizontal overflow');
      console.log('[offline-reload]',recovered.route,recovered.appText.slice(0,70));
    }catch(error){report.errors.push('Offline: '+error.message);}
    finally{
      denyOriginRequests=false;
      await cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:0,uploadThroughput:0});
    }
  }

  // Exercise the truly empty first-run journey separately from seeded demo state.
  await cdp('Page.navigate',{url:base+'/public-preview/?reset=1&mode=empty#home'});
  await sleep(900);
  await waitRoute('home');
  const firstRun=await evaluate("({hasWelcome:!!document.querySelector('.tw-entry'),startAction:!!document.querySelector('.tw-entry a[href=\\\"#setup\\\"]'),hasBankClaim:!!document.querySelector('.tw-entry a[href=\\\"#money\\\"]')})");
  if(!firstRun.hasWelcome||!firstRun.startAction||firstRun.hasBankClaim)
    report.errors.push('First run: expected minimal three-step welcome and no live banking claim');
  const welcomeShot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
  await writeFile(path.join(out,'12-first-run-home.png'),Buffer.from(welcomeShot.data,'base64'));
  await evaluate('location.hash="#setup"');
  await waitRoute('setup');await sleep(300);
  const firstSetup=await evaluate("({input:document.querySelector('#twWizardIncome')?.value,step:Number(document.querySelector('.tw-onboard-step:not([hidden])')?.dataset?.twStep||0),advancedClosed:!document.querySelector('.tw-onboard-advanced')?.open})");
  if(firstSetup.input!==''||firstSetup.step!==0||!firstSetup.advancedClosed)
    report.errors.push('First run: guided setup must start with an empty pay field and advanced controls collapsed');
  const setupShot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
  await writeFile(path.join(out,'13-first-run-setup.png'),Buffer.from(setupShot.data,'base64'));
  report.firstRun={...firstRun,setup:firstSetup};

  // Integration acceptance: exercise the real three-step form, including
  // explicit starter budgets, then confirm that the original save path persists
  // the exact amounts instead of silently retaining example limits.
  const assign=async(id,value)=>evaluate("(()=>{const el=document.getElementById("+JSON.stringify(id)+");if(!el)throw Error('Missing field');el.value="+JSON.stringify(value)+";el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return el.value})()");
  await assign('twWizardIncome','2400');
  await assign('twWizardFrequency','weekly');
  await evaluate("document.getElementById('twWizardNext').click()");
  const firstStep=await evaluate("Number(document.querySelector('.tw-onboard-step:not([hidden])')?.dataset?.twStep)");
  if(firstStep!==1)report.errors.push('Wizard integration: pay step did not advance to bills');
  await assign('twWizardRent','750');
  await assign('twWizardPhone','65');
  await evaluate("document.getElementById('twWizardNext').click()");
  const finalStep=await evaluate("Number(document.querySelector('.tw-onboard-step:not([hidden])')?.dataset?.twStep)");
  if(finalStep!==2)report.errors.push('Wizard integration: bills step did not advance to savings');
  await assign('twWizardSavings','140');
  await assign('twWizardGroceries','95');
  await assign('twWizardGas','45');
  await assign('twWizardEating','70');
  await assign('twWizardFun','20');
  const review=await evaluate("({budget:document.querySelector('#twWizardLaneTotal')?.textContent,underlying:[...['netPay','rent','phone','savings','groceries','gas','eating','fun']].map(id=>document.getElementById(id)?.value),stateBeforeSave:!!readState(),summary:document.querySelector('#twWizardSummary')?.textContent||''})");
  if(review.budget!=='$230.00 / week'||review.stateBeforeSave||!review.summary.includes('$230.00'))report.errors.push('Wizard integration: spending totals or initial state were not transparent');
  await evaluate("document.getElementById('twWizardSave').click()");
  try{
    await waitRoute('home');
    await sleep(450);
    const saved=await evaluate("(()=>{const s=readState();if(!s?.config)return null;const c=s.config;const val=(xs,word)=>xs.find(x=>x.name.toLowerCase().includes(word))?.weeklyLimit??null;return {pay:c.payProfile.netPayAmount,frequency:c.payProfile.payFrequency,savings:c.savingsRule.weeklyAmount,rent:c.bills.find(x=>/housing/i.test(x.name))?.amount,phone:c.bills.find(x=>/phone/i.test(x.name))?.amount,groceries:val(c.livingNeeds,'groc'),gas:val(c.livingNeeds,'gas'),eating:val(c.discretionary,'eating'),fun:val(c.discretionary,'fun')}})()");
    report.newUserFlow={review,saved};
    const expected={pay:240000,frequency:'weekly',savings:14000,rent:75000,phone:6500,groceries:9500,gas:4500,eating:7000,fun:2000};
    for(const [key,value] of Object.entries(expected))
      if(saved?.[key]!==value)report.errors.push('Wizard integration: persisted '+key+' does not match entered amount');

    // The Capital must connect an individual real category to the existing
    // Purchase Pre-Check rather than opening an unrelated generic screen.
    await evaluate("location.hash='#capital'");
    await waitRoute('capital');
    const lane=await evaluate("(()=>{const b=document.querySelector('.tw-capital-precheck');if(!b)return null;const id=b.dataset.categoryId;b.click();return id})()");
    if(!lane)report.errors.push('Capital integration: per-lane purchase control missing');
    else{
      await waitRoute('precheck');
      const prefilled=await evaluate("document.getElementById('preCat')?.value||null");
      report.newUserFlow.precheck={requested:lane,selected:prefilled};
      if(prefilled!==lane)report.errors.push('Capital integration: selected category was not transferred into precheck');
    }
  }catch(error){report.errors.push('New-user wizard/Capital integration: '+error.message);}

  await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  if(report.errors.length)throw new Error('Browser QA failures:\n'+report.errors.join('\n'));
  console.log('BROWSER_PREVIEW_QA_PASS: '+report.pages.length+' mobile pages, desktop home, zero page-wide overflow');
}finally{
  try{ws?.close();}catch{}
  try{chrome?.kill('SIGTERM');}catch{}
  try{server.close();}catch{}
  if(profile)await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:200});
}

function findExecutable(bin){
  return (process.env.PATH||'').split(path.delimiter).some(dir=>existsSync(path.join(dir,bin)));
}
